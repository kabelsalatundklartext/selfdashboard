'use client'

import { useEffect } from 'react'
import { loadAuthProfile } from '@/lib/authProfileClient'
import { isPublicKioskPage } from '@/lib/kiosk/kioskClientFetch'
import { bootstrapVolumePlugins } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { registerCorePluginSettingsPanels } from '@/lib/registerCorePluginSettings'
import { useDashboardStore } from '@/lib/store'

let loadGeneration = 0

export function PluginBootstrap() {
  useEffect(() => {
    const gen = ++loadGeneration
    void (async () => {
      installPluginExternalBridge()
      registerCorePluginSettingsPanels()
      const pluginIds = Array.from(
        new Set(
          useDashboardStore
            .getState()
            .activeDashboard()
            .plugins.map((p) => p.pluginId),
        ),
      )
      try {
        const jobs: Promise<unknown>[] = [
          bootstrapVolumePlugins({ pluginIds }),
        ]
        if (!isPublicKioskPage()) {
          jobs.push(loadAuthProfile())
        }
        await Promise.all(jobs)
        if (gen === loadGeneration) {
          window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
        }
      } catch {
        if (gen === loadGeneration) {
          window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
        }
      }
    })()
  }, [])

  return null
}
