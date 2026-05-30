import path from 'path'

const cwd = process.cwd()

export function getCustomPluginsRoot(): string {
  const env = process.env.SELFDASHBOARD_PLUGINS_CUSTOM?.trim()
  if (env) return env
  return path.join(cwd, 'plugins', 'custom')
}
