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
import { resolvePluginPackRoot, resolvePluginsRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pluginsRoot = resolvePluginsRoot(root)
const pluginPackRoot = resolvePluginPackRoot(root)
const outDir = path.join(pluginPackRoot, 'staging')
const packPublishDir = path.join(root, 'plugins-pack')
const zipPath = path.join(pluginPackRoot, 'default-plugins.zip')
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
  const pluginEntry = path.join(pluginsRoot, pluginId, 'index.tsx').replace(/\\/g, '/')
  const entry = `
import * as plugin from '${pluginEntry}'
;(function (SD) {
  if (!SD || !SD.registerPlugin) throw new Error('SelfDashboard bridge missing')
  SD.registerPlugin(plugin.meta, plugin.component, { replace: true })
  if (typeof plugin.registerMailPluginSurfaces === 'function') plugin.registerMailPluginSurfaces()
})(typeof window !== 'undefined' ? window.SelfDashboard : globalThis.SelfDashboard)
`
  fs.writeFileSync(entryPath, entry.trim() + '\n')
}

const hostShimDir = path.join(root, 'scripts', 'plugin-host-shims')
const hostShimMap = {
  '@/lib/store': path.join(hostShimDir, 'dashboard-store-shim.ts'),
  '@/lib/pluginLocale': path.join(hostShimDir, 'plugin-locale-shim.ts'),
  '@/lib/i18n': path.join(hostShimDir, 'i18n-shim.ts'),
}

const hostSharedShim = {
  name: 'sd-host-shared-shim',
  setup(build) {
    build.onResolve({ filter: /^@\/lib\/(store|pluginLocale|i18n)$/ }, (args) => {
      const shim = hostShimMap[args.path]
      if (shim) return { path: shim }
    })
  },
}

const reactShim = {
  name: 'sd-react-shim',
  setup(build) {
    const ns = 'sd-react'
    build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: ns }))
    build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
      path: 'react/jsx-runtime',
      namespace: ns,
    }))
    build.onResolve({ filter: /^react\/jsx-dev-runtime$/ }, () => ({
      path: 'react/jsx-dev-runtime',
      namespace: ns,
    }))
    build.onResolve({ filter: /^react-dom/ }, () => ({ path: 'react-dom', namespace: ns }))
    build.onLoad({ filter: /.*/, namespace: ns }, (args) => {
      if (args.path === 'react/jsx-runtime' || args.path === 'react/jsx-dev-runtime') {
        return {
          contents: `
const R = globalThis.SelfDashboard.React;
function jsx(type, props, key) {
  if (key !== undefined) return R.createElement(type, { ...props, key });
  return R.createElement(type, props);
}
exports.jsx = jsx;
exports.jsxs = jsx;
exports.Fragment = R.Fragment;
`.trim(),
          loader: 'js',
        }
      }
      if (args.path === 'react-dom' || args.path.startsWith('react-dom/')) {
        return {
          contents: `
const rd = globalThis.SelfDashboard?.ReactDOM;
if (!rd?.createPortal) throw new Error('SelfDashboard.ReactDOM missing — reload page');
module.exports = { createPortal: rd.createPortal, default: rd };
`.trim(),
          loader: 'js',
        }
      }
      return {
        contents: 'module.exports = globalThis.SelfDashboard.React',
        loader: 'js',
      }
    })
  },
}

/** Copy plugin-local *.css to plugins-pack as widget.css (esbuild does not bundle CSS imports). */
function copyPluginWidgetCss(pluginId, destDir) {
  const dir = path.join(pluginsRoot, pluginId)
  if (!fs.existsSync(dir)) return
  const cssFiles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.css') && fs.statSync(path.join(dir, f)).isFile())
  if (cssFiles.length === 0) return
  const out = path.join(destDir, 'widget.css')
  if (cssFiles.length === 1) {
    fs.copyFileSync(path.join(dir, cssFiles[0]), out)
    return
  }
  const merged = cssFiles
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n')
  fs.writeFileSync(out, merged)
}

const SERVER_SHIM_NS = 'sd-server-shim'

function serverBundlePlugins() {
  const logShim = `
export async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ' ' + JSON.stringify(detail).slice(0, 500) : '';
  console.error('[SelfDashboard][' + pluginId + '] ' + operation + ': ' + message + extra);
}
`.trim()
  return [
    {
      name: 'plugin-server-bundle-shims',
      setup(build) {
        build.onResolve({ filter: /^server-only$/ }, () => ({
          path: 'server-only-stub',
          namespace: SERVER_SHIM_NS,
        }))
        build.onResolve({ filter: /^@\/lib\/pluginLogServer$/ }, () => ({
          path: 'plugin-log-stub',
          namespace: SERVER_SHIM_NS,
        }))
        build.onResolve({ filter: /^@\// }, (args) => {
          if (args.kind === 'import-type' || args.kind === 'export-type') return null
          return { external: true }
        })
        build.onResolve({ filter: /^next(\/|$)/ }, () => ({ external: true }))
        build.onLoad({ filter: /.*/, namespace: SERVER_SHIM_NS }, (args) => {
          if (args.path === 'server-only-stub') {
            return { contents: 'export {}', loader: 'js' }
          }
          if (args.path === 'plugin-log-stub') {
            return { contents: logShim, loader: 'js' }
          }
          return null
        })
      },
    },
  ]
}

async function bundleServer(pluginId, destDir) {
  const entry = path.join(pluginsRoot, pluginId, 'server.ts')
  if (!fs.existsSync(entry)) return false
  const outfile = path.join(destDir, 'server.mjs')
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    absWorkingDir: root,
    nodePaths: [path.join(root, 'node_modules')],
    external: ['next', 'next/*', 'server-only'],
    loader: { '.ts': 'ts' },
    logLevel: 'warning',
    plugins: serverBundlePlugins(),
  })
  const out = fs.readFileSync(outfile, 'utf8')
  if (/next\/dist|from\s+["']next/.test(out) || /server-only/.test(out)) {
    throw new Error(
      `${pluginId} server.mjs bundles Next.js or server-only — fix plugins/${pluginId}/ imports`,
    )
  }
  return true
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
    absWorkingDir: root,
    nodePaths: [path.join(root, 'node_modules')],
    jsx: 'automatic',
    banner: {
      js: "if(!globalThis.SelfDashboard?.React)throw new Error('SelfDashboard bridge missing — reload page');if(!globalThis.SelfDashboard?.ReactDOM?.createPortal)throw new Error('SelfDashboard.ReactDOM missing — reload page');if(!globalThis.SelfDashboard?.useDashboardStore)throw new Error('SelfDashboard store bridge missing — reload page');",
    },
    alias: { '@': path.join(root, 'src') },
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.svg': 'file' },
    plugins: [hostSharedShim, reactShim],
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
  const skipServer = new Set(['server.mjs', 'server.js', 'README-server.txt', 'server.ts.txt'])
  for (const name of fs.readdirSync(src)) {
    if (skipServer.has(name)) continue
    /* API handlers ship in the Docker image (builtin); volume pack = widget UI only */
    copyFileIfExists(path.join(src, name), path.join(dest, name))
  }
  const userReadme = path.join(root, 'docs', 'plugins', pluginId, 'README.md')
  if (fs.existsSync(userReadme)) {
    fs.copyFileSync(userReadme, path.join(dest, 'README.md'))
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
      copyPluginWidgetCss(id, dest)
      built.push(id)
    } catch (e) {
      console.warn(`widget bundle failed for ${id}:`, e.message || e)
      failed.push(id)
    }
    const serverTs = path.join(pluginsRoot, id, 'server.ts')
    if (fs.existsSync(serverTs)) {
      try {
        if (await bundleServer(id, dest)) {
          console.info(`[SelfDashboard] server.mjs bundled: ${id}`)
        }
      } catch (e) {
        console.warn(`server bundle failed for ${id}:`, e.message || e)
        fs.copyFileSync(serverTs, path.join(dest, 'server.ts.txt'))
        fs.writeFileSync(
          path.join(dest, 'README-server.txt'),
          'server.mjs build failed — use app image builtin or fix server.ts and rebuild pack.\n',
        )
      }
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
