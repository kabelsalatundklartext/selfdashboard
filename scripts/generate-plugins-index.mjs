/**
 * Generates plugins-pack/plugins-index.json from plugins/*/plugin.json
 * Run: node scripts/generate-plugins-index.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pluginsRoot = path.join(root, 'plugins')
const packRoot = path.join(root, 'plugins-pack')
const outFile = path.join(packRoot, 'plugins-index.json')
const skip = new Set(['_template', 'custom'])

const repo = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REPO || 'kabelsalatundklartext/selfdashboard'
const ref = process.env.SELFDASHBOARD_PLUGINS_GITHUB_REF || 'beta'
const basePath = 'plugins-pack'

const plugins = []
for (const name of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!name.isDirectory() || skip.has(name.name)) continue
  const manifestPath = path.join(pluginsRoot, name.name, 'plugin.json')
  if (!fs.existsSync(manifestPath)) continue
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const packDir = path.join(packRoot, name.name)
  if (!fs.existsSync(path.join(packDir, 'widget.js'))) continue
  const files = ['plugin.json', 'widget.js']
  if (
    fs.existsSync(path.join(packDir, 'server.js')) ||
    fs.existsSync(path.join(pluginsRoot, name.name, 'server.ts'))
  ) {
    files.push('server.js')
  }
  plugins.push({ ...m, id: m.id || name.name, files })
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
