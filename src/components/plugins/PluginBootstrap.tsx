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
      let volumeOnly = true
      let skip = new Set<string>()
      let customWidgets: string[] = []
      try {
        const info = await fetchPluginVolumeInfo()
        volumeOnly = info.volumeOnly
        skip = new Set(info.widgetOverrideIds)
        customWidgets = info.customWidgetIds
      } catch (e) {
        console.warn('[SelfDashboard] Plugin volume info unavailable', e)
      }
      if (!volumeOnly) {
        loadBuiltinPlugins(skip)
      }
      if (customWidgets.length > 0) {
        await loadVolumeWidgetScripts(customWidgets)
      }
    })()
  }, [])

  return null
}
