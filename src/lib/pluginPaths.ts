import path from 'path'

const cwd = process.cwd()

/** Built-in plugins in the repo / image (`plugins/<id>/`). */
export function getBuiltinPluginsRoot(): string {
  const env = process.env.SELFDASHBOARD_PLUGINS_BUILTIN?.trim()
  return env || path.join(cwd, 'plugins')
}

/** User Dropped plugins (`plugins/custom/<id>/` or `/app/plugins/custom` in Docker). */
export function getCustomPluginsRoot(): string {
  const env = process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim()
  if (env) return env
  return path.join(getBuiltinPluginsRoot(), 'custom')
}

export const PLUGIN_SCAN_SKIP_DIRS = new Set(['_template', 'custom', 'node_modules', '.git'])
