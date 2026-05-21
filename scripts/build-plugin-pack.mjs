/**
 * Builds plugin-pack/default-plugins.zip for volume-only installs.
 * Each plugin: plugin.json + widget.js (esbuild IIFE) + server.js if plugins/<id>/server.ts exists (copied as stub note).
 *
 * Run: node scripts/build-plugin-pack.mjs
 * Requires: npm install esbuild --save-dev
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pluginsRoot = path.join(root, 'plugins')
const outDir = path.join(root, 'plugin-pack', 'staging')
const packPublishDir = path.join(root, 'plugins-pack')
const zipPath = path.join(root, 'plugin-pack', 'default-plugins.zip')
const skip = new Set(['_template', 'custom', 'node_modules'])

let esbuild
try {
  esbuild = (await import('esbuild')).default
} catch {
  console.error('Install esbuild: npm install esbuild --save-dev')
  process.exit(1)
}

const VALID_CATEGORIES = new Set([
  'media',
  'system',
  'network',
  'storage',
  'security',
  'productivity',
  'utility',
])

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
  if (!category || !VALID_CATEGORIES.has(category)) return null
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

function listPluginIds() {
  return fs
    .readdirSync(pluginsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !skip.has(d.name))
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(pluginsRoot, id, 'index.tsx')) && readMeta(id))
}

function writeEntry(pluginId, entryPath) {
  const entry = `
import * as plugin from '../../../plugins/${pluginId}/index.tsx'
;(function (SD) {
  if (!SD || !SD.registerPlugin) throw new Error('SelfDashboard bridge missing')
  SD.registerPlugin(plugin.meta, plugin.component, { replace: true })
})(typeof window !== 'undefined' ? window.SelfDashboard : globalThis.SelfDashboard)
`
  fs.writeFileSync(entryPath, entry.trim() + '\n')
}

const reactShim = {
  name: 'sd-react-shim',
  setup(build) {
    const ns = 'sd-react'
    const spec = /^(react|react-dom|react-dom\/client|react\/jsx-runtime)$/
    build.onResolve({ filter: spec }, (args) => ({
      path: args.path,
      namespace: ns,
    }))
    build.onLoad({ filter: /.*/, namespace: ns }, (args) => ({
      contents:
        args.path === 'react'
          ? 'module.exports = globalThis.SelfDashboard.React'
          : 'module.exports = globalThis.SelfDashboard.React',
      loader: 'js',
    }))
  },
}

async function bundleWidget(pluginId, destDir) {
  const entriesDir = path.join(outDir, '.entries')
  fs.mkdirSync(entriesDir, { recursive: true })
  const entryPath = path.join(entriesDir, `${pluginId}.tsx`)
  writeEntry(pluginId, entryPath)
  const outfile = path.join(destDir, 'widget.js')
  await esbuild.build({
    entryPoints: [entryPath],
    outfile,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    jsx: 'automatic',
    alias: { '@': path.join(root, 'src') },
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.svg': 'file' },
    plugins: [reactShim],
    logLevel: 'warning',
  })
}

function copyFileIfExists(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

function copyDirToPublish(pluginId) {
  const src = path.join(outDir, pluginId)
  const dest = path.join(packPublishDir, pluginId)
  if (!fs.existsSync(path.join(src, 'widget.js'))) return false
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    if (name === 'README-server.txt' || name === 'server.ts.txt') continue
    copyFileIfExists(path.join(src, name), path.join(dest, name))
  }
  return true
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(path.join(root, 'plugin-pack'), { recursive: true })

  const ids = listPluginIds()
  const built = []
  const failed = []

  for (const id of ids) {
    const dest = path.join(outDir, id)
    fs.mkdirSync(dest, { recursive: true })
    const meta = readMeta(id)
    if (!meta) {
      console.warn(`skip ${id}: no meta`)
      continue
    }
    fs.writeFileSync(path.join(dest, 'plugin.json'), JSON.stringify(meta, null, 2) + '\n')
    try {
      await bundleWidget(id, dest)
      built.push(id)
    } catch (e) {
      console.warn(`widget bundle failed for ${id}:`, e.message || e)
      failed.push(id)
    }
    const serverTs = path.join(pluginsRoot, id, 'server.ts')
    if (fs.existsSync(serverTs)) {
      fs.copyFileSync(serverTs, path.join(dest, 'server.ts.txt'))
      fs.writeFileSync(
        path.join(dest, 'README-server.txt'),
        'Compile server.ts to server.js for volume API, or use built-in gateway until migrated.\n',
      )
    }
  }

  if (built.length === 0) {
    console.error('No plugins bundled — aborting')
    process.exit(1)
  }
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      ['-NoProfile', '-Command', `Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force`],
      { stdio: 'inherit' },
    )
  } else {
    execFileSync('zip', ['-r', zipPath, '.'], { cwd: outDir, stdio: 'inherit' })
  }
  console.log(`Pack: ${built.length} ok, ${failed.length} failed → ${zipPath}`)
  if (failed.length) console.log('Failed:', failed.join(', '))

  fs.mkdirSync(packPublishDir, { recursive: true })
  let published = 0
  for (const id of built) {
    if (copyDirToPublish(id)) published++
  }
  console.log(`plugins-pack/: ${published} plugin(s) ready for GitHub push`)

  execFileSync(process.execPath, [path.join(__dirname, 'generate-plugins-index.mjs')], {
    stdio: 'inherit',
    cwd: root,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
