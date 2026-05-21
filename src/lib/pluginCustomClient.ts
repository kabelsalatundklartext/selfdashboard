'use client'

import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'

export type PluginVolumeClientInfo = {
  customRoot: string
  volumeOnly: boolean
  installedIds: string[]
  widgetOverrideIds: string[]
  customWidgetIds: string[]
  customServerIds: string[]
  missingWidgetJs?: string[]
  hint?: string
}

export async function fetchPluginVolumeInfo(): Promise<PluginVolumeClientInfo> {
  const res = await fetch('/api/plugins/volume', { cache: 'no-store' })
  if (!res.ok) throw new Error('volume_info_failed')
  return res.json() as Promise<PluginVolumeClientInfo>
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-sd-plugin="${src}"]`)
    if (existing) existing.remove()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.sdPlugin = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`script_load_failed:${src}`))
    document.head.appendChild(s)
  })
}

export async function loadVolumeWidgetScripts(pluginIds: string[]): Promise<void> {
  installPluginExternalBridge()
  const t = Date.now()
  const failed: string[] = []
  for (const id of pluginIds) {
    try {
      await loadScript(`/api/plugins/custom-assets/${encodeURIComponent(id)}/widget.js?t=${t}`)
      console.info(`[SelfDashboard] Volume widget loaded: ${id}`)
    } catch (e) {
      failed.push(id)
      console.error(`[SelfDashboard] Volume widget failed: ${id}`, e)
    }
  }
  if (failed.length > 0) {
    throw new Error(`volume_widgets_failed:${failed.join(',')}`)
  }
}
