'use client'

import { useEffect } from 'react'
import { loadBuiltinPlugins } from '@/lib/pluginLoader'
import { fetchPluginVolumeInfo, loadVolumeWidgetScripts } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'

let loaded = false

export function PluginBootstrap() {
  useEffect(() => {
    if (loaded) return
    loaded = true
    void (async () => {
      installPluginExternalBridge()
      let volumeOnly = false
      let skip = new Set<string>()
      let customWidgets: string[] = []
      try {
        const info = await fetchPluginVolumeInfo()
        volumeOnly = info.volumeOnly
        skip = new Set(info.widgetOverrideIds)
        customWidgets = info.customWidgetIds
        if (info.missingWidgetJs?.length) {
          console.warn(
            '[SelfDashboard] plugin.json ohne widget.js — nur Metadaten auf dem Volume:',
            info.missingWidgetJs.join(', '),
          )
        }
      } catch (e) {
        console.warn('[SelfDashboard] Plugin volume info unavailable', e)
      }

      // hybrid = Plugins aus dem Image; volume = nur Ordner/GitHub (kein Image-Bundle)
      if (!volumeOnly) {
        loadBuiltinPlugins(skip)
      }

      if (customWidgets.length > 0) {
        try {
          await loadVolumeWidgetScripts(customWidgets)
        } catch (e) {
          console.error('[SelfDashboard] Volume widget.js load failed — using built-in plugins', e)
        }
      }
    })()
  }, [])

  return null
}
