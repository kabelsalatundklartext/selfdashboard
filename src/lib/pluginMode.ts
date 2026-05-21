/**
 * Plugin deployment mode (container env).
 *
 * - volume: only plugins under /app/plugins/custom (delete folder = removed). No built-in widgets in the app bundle.
 * - hybrid: built-in widgets from image + volume overrides (legacy / transition).
 */
export type PluginDeployMode = 'volume' | 'hybrid'

export function getPluginDeployMode(): PluginDeployMode {
  const raw = (process.env.SELFDASHBOARD_PLUGINS_MODE ?? 'volume').trim().toLowerCase()
  return raw === 'hybrid' ? 'hybrid' : 'volume'
}

export function isVolumeOnlyPlugins(): boolean {
  return getPluginDeployMode() === 'volume'
}

export function isBuiltinPluginsEnabled(): boolean {
  if (isVolumeOnlyPlugins()) return false
  const raw = (process.env.SELFDASHBOARD_PLUGINS_BUILTIN ?? '1').trim().toLowerCase()
  return raw !== '0' && raw !== 'false' && raw !== 'no'
}
