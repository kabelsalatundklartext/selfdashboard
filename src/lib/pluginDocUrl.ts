/** GitHub URL for per-plugin user docs (EN/DE in one README). */
export function pluginReadmeDocUrl(
  pluginId: string,
  opts?: { repository?: string; ref?: string },
): string {
  const repo = opts?.repository?.trim() || 'kabelsalatundklartext/selfdashboard'
  const ref = opts?.ref?.trim() || 'main'
  // README liegt pro Plugin in plugins-pack/<id>/ (Verteilungsort) — dort hat
  // jedes Plugin eine, auch die neueren.
  return `https://github.com/${repo}/blob/${ref}/plugins-pack/${encodeURIComponent(pluginId)}/README.md`
}

export const PLUGIN_CATALOG_DOC_URL =
  'https://github.com/kabelsalatundklartext/selfdashboard#plugins'

/** Second `## Plugins` heading in README (German section). */
export const PLUGIN_CATALOG_DOC_URL_DE =
  'https://github.com/kabelsalatundklartext/selfdashboard#plugins-1'
