import type { Dashboard } from '@/types'

/** Built-in / retired plugins — strip from persisted dashboards on load and save. */
export const REMOVED_PLUGIN_IDS = new Set(['crowdsec-threat-map', 'crowdsec-v2'])

export function stripRemovedPlugins(dashboards: Dashboard[]): Dashboard[] {
  return dashboards.map((d) => ({
    ...d,
    plugins: d.plugins.filter((p) => !REMOVED_PLUGIN_IDS.has(p.pluginId)),
  }))
}
