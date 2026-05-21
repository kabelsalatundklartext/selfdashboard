import path from 'path'

const cwd = process.cwd()

/** Installed plugins on the volume (`/app/plugins/custom` in Docker). */
export function getCustomPluginsRoot(): string {
  const env = process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim()
  if (env) return env
  return path.join(cwd, 'plugins', 'custom')
}

/** @deprecated Volume-only; same as custom root parent. */
export function getBuiltinPluginsRoot(): string {
  return path.join(getCustomPluginsRoot(), '..')
}

export const PLUGIN_SCAN_SKIP_DIRS = new Set(['_template', 'custom', 'node_modules', '.git'])
