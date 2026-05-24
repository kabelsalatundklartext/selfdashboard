'use client'

import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { kioskAwareFetch } from '@/lib/kiosk/kioskClientFetch'
import { setPluginVolumeLoadPhase } from '@/lib/pluginVolumeLoad'

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

type BootstrapVolumePluginsOptions = {
  /** Only load widget assets for these plugin IDs (faster first paint). */
  pluginIds?: string[]
}

export async function fetchPluginVolumeInfo(): Promise<PluginVolumeClientInfo> {
  const res = await kioskAwareFetch('/api/plugins/volume', { cache: 'no-store' })
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

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-sd-plugin-css="${href}"]`)
    if (existing) {
      resolve()
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.sdPluginCss = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`stylesheet_load_failed:${href}`))
    document.head.appendChild(link)
  })
}

async function loadPluginWidgetAssets(pluginId: string, cacheBust: number): Promise<void> {
  const base = `/api/plugins/custom-assets/${encodeURIComponent(pluginId)}`
  const cssUrl = `${base}/widget.css?t=${cacheBust}`
  await loadStylesheet(cssUrl).catch(() => {
    /* widget.css is optional for plugins without separate styles */
  })
  await loadScript(`${base}/widget.js?t=${cacheBust}`)
}

/** Remove loaded widget.js / widget.css for one plugin (after uninstall). */
export function unloadPluginWidgetAssets(pluginId: string): void {
  const needle = `/custom-assets/${encodeURIComponent(pluginId)}/`
  for (const el of document.querySelectorAll('script[data-sd-plugin]')) {
    const src = el.getAttribute('data-sd-plugin') ?? ''
    if (src.includes(needle)) el.remove()
  }
  for (const el of document.querySelectorAll('link[data-sd-plugin-css]')) {
    const href = el.getAttribute('data-sd-plugin-css') ?? ''
    if (href.includes(needle)) el.remove()
  }
}

export async function loadVolumeWidgetScripts(pluginIds: string[]): Promise<void> {
  installPluginExternalBridge()
  if (pluginIds.length === 0) return

  const t = Date.now()
  const results = await Promise.allSettled(
    pluginIds.map(async (id) => {
      await loadPluginWidgetAssets(id, t)
      console.info(`[SelfDashboard] Volume widget loaded: ${id}`)
    }),
  )
  const failed = pluginIds.filter((_, i) => results[i].status === 'rejected')
  if (failed.length > 0) {
    for (const id of failed) {
      console.error(`[SelfDashboard] Volume widget failed: ${id}`, (results[pluginIds.indexOf(id)] as PromiseRejectedResult).reason)
    }
    throw new Error(`volume_widgets_failed:${failed.join(',')}`)
  }
}

/** Fetch volume info and load all custom widget.js (sets global load phase for UI). */
export async function bootstrapVolumePlugins(options?: BootstrapVolumePluginsOptions): Promise<void> {
  setPluginVolumeLoadPhase('loading')
  installPluginExternalBridge()
  try {
    const info = await fetchPluginVolumeInfo()
    const requested = new Set((options?.pluginIds ?? []).map((id) => String(id).trim()).filter(Boolean))
    const customWidgets =
      requested.size > 0
        ? info.customWidgetIds.filter((id) => requested.has(id))
        : info.customWidgetIds
    if (info.missingWidgetJs?.length) {
      console.warn(
        '[SelfDashboard] plugin.json ohne widget.js — nur Metadaten auf dem Volume:',
        info.missingWidgetJs.join(', '),
      )
    }
    if (customWidgets.length > 0) {
      await loadVolumeWidgetScripts(customWidgets)
    }
    setPluginVolumeLoadPhase('ready')
  } catch (e) {
    console.warn('[SelfDashboard] Plugin volume load failed', e)
    setPluginVolumeLoadPhase('error')
    throw e
  }
}
