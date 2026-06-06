import 'server-only'
import { isSealedSecret, sealSecret } from '@/lib/secretCrypto'
import type { DashboardStatePersisted } from '@/lib/dashboardStatePayload'

/**
 * Widget-config secrets that are sealed (AES-256-GCM) before they touch disk
 * or the browser. Only plugins whose secret flows through a server-side proxy
 * may be listed here — the proxy opens the sealed value via openSealedSecret().
 * Widgets that talk to their target directly from the browser (unraid, emby, …)
 * MUST NOT be listed, the browser cannot unseal.
 */
const SEALED_PLUGIN_CONFIG_KEYS: Record<string, readonly string[]> = {
  adguard: ['password'],
  pihole: ['password'],
  fritzbox: ['password'],
  'fritz-energy': ['password'],
  selfstream: ['password'],
  'selfstream-emby': ['password'], // posts to the selfstream server proxy
  'speedtest-tracker': ['apiToken'],
  hue: ['apiKey'],
  plex: ['token'],
  proxmox: ['apiToken'],
  truenas: ['apiKey'],
  'home-assistant': ['token'],
  opnsense: ['apiSecret'],
  unifi: ['password'],
  npm: ['password'],
  openmediavault: ['password'],
  homematic: ['password'],
}

type PluginLike = { pluginId?: unknown; config?: unknown }

function sealPluginConfig(plugin: PluginLike): { plugin: PluginLike; changed: boolean } {
  const pluginId = typeof plugin.pluginId === 'string' ? plugin.pluginId : ''
  const keys = SEALED_PLUGIN_CONFIG_KEYS[pluginId]
  if (!keys || typeof plugin.config !== 'object' || plugin.config === null) {
    return { plugin, changed: false }
  }
  const config = plugin.config as Record<string, unknown>
  let changed = false
  let next: Record<string, unknown> | null = null
  for (const key of keys) {
    const value = config[key]
    if (typeof value !== 'string' || value === '' || isSealedSecret(value)) continue
    if (!next) next = { ...config }
    next[key] = sealSecret(value)
    changed = true
  }
  if (!changed || !next) return { plugin, changed: false }
  return { plugin: { ...plugin, config: next }, changed: true }
}

/** Seal all known widget-config secrets in a persisted dashboard state. */
export function sealDashboardSecrets(
  state: DashboardStatePersisted,
): { state: DashboardStatePersisted; changed: boolean } {
  let anyChanged = false
  const dashboards = state.dashboards.map((d) => {
    if (!Array.isArray(d.plugins)) return d
    let dashChanged = false
    const plugins = d.plugins.map((p) => {
      const { plugin, changed } = sealPluginConfig(p as PluginLike)
      if (changed) dashChanged = true
      return plugin as typeof p
    })
    if (!dashChanged) return d
    anyChanged = true
    return { ...d, plugins }
  })
  if (!anyChanged) return { state, changed: false }
  return { state: { ...state, dashboards }, changed: true }
}
