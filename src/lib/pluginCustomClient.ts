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
  /** plugin.json version per id — used as cache key for widget.js / widget.css */
  pluginVersions?: Record<string, string>
  missingWidgetJs?: string[]
  hint?: string
}

type BootstrapVolumePluginsOptions = {
  /** Only load widget assets for these plugin IDs (faster first paint). */
  pluginIds?: string[]
  /** Loaded first; volume phase flips to ready before the rest finishes. */
  priorityPluginIds?: string[]
}

/** Loaded even when not on the dashboard (navbar slots, global UI). */
const ALWAYS_BOOTSTRAP_PLUGIN_IDS = ['mail'] as const

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

async function loadPluginWidgetAssets(pluginId: string, version: string): Promise<void> {
  const v = encodeURIComponent(version || '0')
  const base = `/api/plugins/custom-assets/${encodeURIComponent(pluginId)}`
  const cssUrl = `${base}/widget.css?v=${v}`
  const jsUrl = `${base}/widget.js?v=${v}`
  await Promise.all([
    loadStylesheet(cssUrl).catch(() => {
      /* widget.css is optional for plugins without separate styles */
    }),
    loadScript(jsUrl),
  ])
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

export async function loadVolumeWidgetScripts(
  pluginIds: string[],
  versions: Record<string, string> = {},
): Promise<void> {
  installPluginExternalBridge()
  if (pluginIds.length === 0) return

  const results = await Promise.allSettled(
    pluginIds.map(async (id) => {
      await loadPluginWidgetAssets(id, versions[id] ?? '0')
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

export async function loadVolumeWidgetScriptsResolved(pluginIds: string[]): Promise<void> {
  if (pluginIds.length === 0) return
  const info = await fetchPluginVolumeInfo()
  await loadVolumeWidgetScripts(pluginIds, info.pluginVersions ?? {})
}

/** Fetch volume info and load custom widget.js (sets global load phase for UI). */
export async function bootstrapVolumePlugins(options?: BootstrapVolumePluginsOptions): Promise<void> {
  setPluginVolumeLoadPhase('loading')
  installPluginExternalBridge()
  try {
    const info = await fetchPluginVolumeInfo()
    const versions = info.pluginVersions ?? {}
    const requested = new Set(
      [...ALWAYS_BOOTSTRAP_PLUGIN_IDS, ...(options?.pluginIds ?? [])]
        .map((id) => String(id).trim())
        .filter(Boolean),
    )
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

    const prioritySet = new Set([
      ...ALWAYS_BOOTSTRAP_PLUGIN_IDS,
      ...(options?.priorityPluginIds ?? []).map((id) => String(id).trim()).filter(Boolean),
    ])
    const priority = customWidgets.filter((id) => prioritySet.has(id))
    const deferred = customWidgets.filter((id) => !prioritySet.has(id))

    if (priority.length > 0) {
      await loadVolumeWidgetScripts(priority, versions)
    }
    setPluginVolumeLoadPhase('ready')

    if (deferred.length > 0) {
      void loadVolumeWidgetScripts(deferred, versions).catch((e) => {
        console.warn('[SelfDashboard] Deferred plugin volume load failed', e)
      })
    }
  } catch (e) {
    console.warn('[SelfDashboard] Plugin volume load failed', e)
    setPluginVolumeLoadPhase('error')
    throw e
  }
}
