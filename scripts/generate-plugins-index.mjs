/**
 * Generates plugins-pack/plugins-index.json from plugins-pack/<id>/plugin.json.
 * Run after any store change: npm run generate:plugins-index
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsPackRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const packRoot = resolvePluginsPackRoot(root)
const outFile = path.join(packRoot, 'plugins-index.json')
const skip = new Set(['_template', 'custom'])

const repo = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REPO || 'kabelsalatundklartext/selfdashboard'
const ref = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REF || 'main'
const basePath = 'plugins-pack'

function readPackMeta(pluginId) {
  const manifestPath = path.join(packRoot, pluginId, 'plugin.json')
  if (!fs.existsSync(manifestPath)) return null
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

const plugins = []
for (const name of fs.readdirSync(packRoot, { withFileTypes: true })) {
  if (!name.isDirectory() || skip.has(name.name)) continue
  const packDir = path.join(packRoot, name.name)
  if (!fs.existsSync(path.join(packDir, 'plugin.json'))) continue
  if (!fs.existsSync(path.join(packDir, 'widget.js'))) {
    console.warn(`skip ${name.name}: plugin.json without widget.js`)
    continue
  }
  const m = readPackMeta(name.name)
  if (!m?.id) continue
  const files = ['plugin.json', 'widget.js']
  if (fs.existsSync(path.join(packDir, 'widget.css'))) files.push('widget.css')
  for (const f of fs.readdirSync(packDir)) {
    if (files.includes(f)) continue
    if (/^[a-z0-9][a-z0-9.-]*\.(svg|png|webp|jpe?g)$/i.test(f)) files.push(f)
  }
  const serverPack = ['server.mjs', 'server.js'].find((f) => fs.existsSync(path.join(packDir, f)))
  if (serverPack) files.push(serverPack)
  const hasServer =
    Boolean(serverPack) || fs.existsSync(path.join(root, 'src/builtin-plugins', name.name, 'server.ts'))
  const { hasServer: _manifestHasServer, ...meta } = m
  plugins.push({ ...meta, id: meta.id || name.name, files, ...(hasServer ? { hasServer: true } : {}) })
}

plugins.sort((a, b) => a.id.localeCompare(b.id))

const index = {
  version: 1,
  repository: repo,
  ref,
  basePath,
  generatedAt: new Date().toISOString(),
  plugins,
}

fs.mkdirSync(packRoot, { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n')
console.log(`Wrote ${plugins.length} plugins → ${outFile}`)
