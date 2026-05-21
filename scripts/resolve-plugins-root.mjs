import fs from 'fs'
import path from 'path'

/** Plugin sources: repo `plugins/`, sibling `../plugins`, or SELFDASHBOARD_PLUGINS_SRC. */
export function resolvePluginsRoot(repoRoot) {
  const env = process.env.SELFDASHBOARD_PLUGINS_SRC?.trim()
  if (env) return path.resolve(env)
  const inRepo = path.join(repoRoot, 'plugins')
  if (fs.existsSync(inRepo)) return inRepo
  const sibling = path.join(repoRoot, '..', 'plugins')
  if (fs.existsSync(sibling)) return sibling
  return inRepo
}

export function resolvePluginPackRoot(repoRoot) {
  const env = process.env.SELFDASHBOARD_PLUGIN_PACK_DIR?.trim()
  if (env) return path.resolve(env)
  const inRepo = path.join(repoRoot, 'plugin-pack')
  if (fs.existsSync(inRepo)) return inRepo
  const sibling = path.join(repoRoot, '..', 'plugin-pack')
  if (fs.existsSync(sibling)) return sibling
  return inRepo
}
