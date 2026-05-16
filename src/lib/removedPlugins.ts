import type { Dashboard } from '@/types'

/** Built-in plugins that were removed — strip from persisted dashboards. */
export const REMOVED_PLUGIN_IDS = new Set(['crowdsec-threat-map'])

export function stripRemovedPlugins(dashboards: Dashboard[]): Dashboard[] {
  return dashboards.map((d) => ({
    ...d,
    plugins: d.plugins.filter((p) => !REMOVED_PLUGIN_IDS.has(p.pluginId)),
  }))
}
