'use client'

import { useEffect } from 'react'
import { loadAuthProfile } from '@/lib/authProfileClient'
import { isPublicKioskPage } from '@/lib/kiosk/kioskClientFetch'
import { bootstrapVolumePlugins } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { getPluginVolumeLoadPhase } from '@/lib/pluginVolumeLoad'
import { registerCorePluginSettingsPanels } from '@/lib/registerCorePluginSettings'
import { useDashboardStore } from '@/lib/store'

let loadGeneration = 0
let authProfileLoaded = false

function collectAllDashboardPluginIds(dashboards: { plugins: { pluginId: string }[] }[]): string[] {
  const ids = new Set<string>()
  for (const d of dashboards) {
    for (const p of d.plugins) {
      if (p.pluginId) ids.add(p.pluginId)
    }
  }
  return Array.from(ids)
}

function selectDashboardPluginIdsFingerprint(state: ReturnType<typeof useDashboardStore.getState>): string {
  return collectAllDashboardPluginIds(state.dashboards).sort().join('\0')
}

export function PluginBootstrap() {
  const pluginIdsFingerprint = useDashboardStore(selectDashboardPluginIdsFingerprint)

  useEffect(() => {
    installPluginExternalBridge()
    registerCorePluginSettingsPanels()
  }, [])

  useEffect(() => {
    const gen = ++loadGeneration
    void (async () => {
      const allIds = collectAllDashboardPluginIds(useDashboardStore.getState().dashboards)
      const missingIds = allIds.filter((id) => !pluginRegistry.get(id))
      const volumeNotReady = getPluginVolumeLoadPhase() !== 'ready'
      const needsVolumeBootstrap = missingIds.length > 0 || volumeNotReady
      const shouldLoadAuth = !authProfileLoaded && !isPublicKioskPage()

      if (!needsVolumeBootstrap && !shouldLoadAuth) {
        return
      }

      try {
        const jobs: Promise<unknown>[] = []
        if (needsVolumeBootstrap) {
          const pluginIdsToRequest = volumeNotReady ? allIds : missingIds
          jobs.push(bootstrapVolumePlugins({ pluginIds: pluginIdsToRequest }))
        }
        if (shouldLoadAuth) {
          jobs.push(
            loadAuthProfile().then(() => {
              authProfileLoaded = true
            }),
          )
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
  }, [pluginIdsFingerprint])

  return null
}
