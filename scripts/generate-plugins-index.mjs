/**
 * Generates plugins-pack/plugins-index.json from each plugins/<id>/plugin.json
 * or export const meta in index.tsx.
 * Run: node scripts/generate-plugins-index.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pluginsRoot = resolvePluginsRoot(root)
const packRoot = path.join(root, 'plugins-pack')
const outFile = path.join(packRoot, 'plugins-index.json')
const skip = new Set(['_template', 'custom'])

const VALID = new Set([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

const repo = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REPO || 'kabelsalatundklartext/selfdashboard'
const ref = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REF || 'beta'
const basePath = 'plugins-pack'

function field(src, key) {
  const re = new RegExp(`${key}:\\s*['"\`]([^'"\`]+)['"\`]`)
  const m = src.match(re)
  return m?.[1]?.trim()
}

function readMeta(pluginId) {
  const dir = path.join(pluginsRoot, pluginId)
  const manifestPath = path.join(dir, 'plugin.json')
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  }
  const tsx = path.join(dir, 'index.tsx')
  if (!fs.existsSync(tsx)) return null
  const src = fs.readFileSync(tsx, 'utf8')
  const category = field(src, 'category')
  if (!category || !VALID.has(category)) return null
  return {
    id: field(src, 'id') || pluginId,
    name: field(src, 'name') || pluginId,
    description: field(src, 'description') || '',
    version: field(src, 'version') || '0.0.0',
    author: field(src, 'author') || 'SelfDashboard',
    category,
    icon: field(src, 'icon'),
    iconUrl: field(src, 'iconUrl'),
  }
}

const plugins = []
for (const name of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!name.isDirectory() || skip.has(name.name)) continue
  if (!fs.existsSync(path.join(pluginsRoot, name.name, 'index.tsx'))) continue
  const m = readMeta(name.name)
  if (!m) continue
  const packDir = path.join(packRoot, name.name)
  const files = ['plugin.json', 'widget.js']
  if (fs.existsSync(path.join(packDir, 'server.js'))) {
    files.push('server.js')
  }
  const hasServer = files.includes('server.js')
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
