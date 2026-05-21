'use client'

import { useEffect } from 'react'
import { fetchPluginVolumeInfo, loadVolumeWidgetScripts } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { registerCorePluginSettingsPanels } from '@/lib/registerCorePluginSettings'

let loaded = false

export function PluginBootstrap() {
  useEffect(() => {
    if (loaded) return
    loaded = true
    void (async () => {
      installPluginExternalBridge()
      registerCorePluginSettingsPanels()
      try {
        const info = await fetchPluginVolumeInfo()
        const customWidgets = info.customWidgetIds
        if (info.missingWidgetJs?.length) {
          console.warn(
            '[SelfDashboard] plugin.json ohne widget.js — nur Metadaten auf dem Volume:',
            info.missingWidgetJs.join(', '),
          )
        }
        if (customWidgets.length > 0) {
          await loadVolumeWidgetScripts(customWidgets)
        }
      } catch (e) {
        console.warn('[SelfDashboard] Plugin volume load failed', e)
      }
    })()
  }, [])

  return null
}
