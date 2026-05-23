'use client'

import { useEffect } from 'react'
import { loadAuthProfile } from '@/lib/authProfileClient'
import { bootstrapVolumePlugins } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { registerCorePluginSettingsPanels } from '@/lib/registerCorePluginSettings'

let loadGeneration = 0

export function PluginBootstrap() {
  useEffect(() => {
    const gen = ++loadGeneration
    void (async () => {
      installPluginExternalBridge()
      registerCorePluginSettingsPanels()
      try {
        await loadAuthProfile()
        await bootstrapVolumePlugins()
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
