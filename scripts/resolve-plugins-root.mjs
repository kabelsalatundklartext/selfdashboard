import fs from 'fs'
import path from 'path'

const SKIP = new Set(['_template', 'custom', 'node_modules'])

/** Published store artifacts (GitHub → Plugin-Store). */
export function resolvePluginsPackRoot(repoRoot) {
  return path.join(repoRoot, 'plugins-pack')
}

/** Local ZIP/staging output — optional, recreated by build. */
export function resolvePluginPackRoot(repoRoot) {
  const env = process.env.SELFDASHBOARD_PLUGIN_PACK_DIR?.trim()
  if (env) return path.resolve(env)
  const inRepo = path.join(repoRoot, 'plugin-pack')
  if (fs.existsSync(inRepo)) return inRepo
  const sibling = path.join(repoRoot, '..', 'plugin-pack')
  if (fs.existsSync(sibling)) return sibling
  return inRepo
}

/**
 * Legacy dev folder `plugins/` — optional. Prefer `plugins-pack/<id>/index.tsx` when present.
 * @deprecated Prefer editing under plugins-pack/; see docs/PLUGINS.md
 */
export function resolvePluginsRoot(repoRoot) {
  const env = process.env.SELFDASHBOARD_PLUGINS_SRC?.trim()
  if (env) return path.resolve(env)
  const inRepo = path.join(repoRoot, 'plugins')
  if (fs.existsSync(inRepo)) return inRepo
  const sibling = path.join(repoRoot, '..', 'plugins')
  if (fs.existsSync(sibling)) return sibling
  return inRepo
}

/** Source directory for one plugin (TSX build). plugins-pack/<id> wins over plugins/<id>. */
export function resolvePluginSourceDir(repoRoot, pluginId) {
  const env = process.env.SELFDASHBOARD_PLUGINS_SRC?.trim()
  if (env) {
    const fromEnv = path.join(path.resolve(env), pluginId)
    if (fs.existsSync(path.join(fromEnv, 'index.tsx'))) return fromEnv
  }
  const candidates = [
    path.join(resolvePluginsPackRoot(repoRoot), pluginId),
    path.join(repoRoot, 'plugins', pluginId),
    path.join(repoRoot, '..', 'plugins', pluginId),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.tsx'))) return dir
  }
  return null
}

/** All plugin IDs that have index.tsx under plugins-pack/ or plugins/. */
export function listPluginSourceIds(repoRoot) {
  const ids = new Set()
  const scan = (root) => {
    if (!fs.existsSync(root)) return
    for (const d of fs.readdirSync(root, { withFileTypes: true })) {
      if (!d.isDirectory() || SKIP.has(d.name)) continue
      if (fs.existsSync(path.join(root, d.name, 'index.tsx'))) ids.add(d.name)
    }
  }
  scan(resolvePluginsPackRoot(repoRoot))
  scan(path.join(repoRoot, 'plugins'))
  scan(path.join(repoRoot, '..', 'plugins'))
  return [...ids].sort()
}
