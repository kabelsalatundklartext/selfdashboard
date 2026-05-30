/**
 * Copies plugin server.ts (+ lib/) from src/builtin-plugins into plugins-pack/.
 * Skips plugins that already ship a pack-ready server.ts (pihole, selfstream, uptime-kuma).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsPackRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const builtinRoot = path.join(repoRoot, 'src', 'builtin-plugins')
const packRoot = resolvePluginsPackRoot(repoRoot)

const API_PLUGIN_IDS = [
  'adguard',
  'calendar',
  'crowdsec',
  'docker',
  'fritz-energy',
  'fritzbox',
  'mail',
  'weather',
]

/** API lives in plugins-pack/ only — never copy from src/builtin-plugins. */
const PACK_ONLY_API_IDS = new Set(['pihole', 'selfstream', 'uptime-kuma', 'tasks'])

const SKIP_IF_PACK_SERVER = new Set([...PACK_ONLY_API_IDS])

const SKIP_DIRS = new Set(['node_modules', '.git'])

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue
    const from = path.join(src, ent.name)
    const to = path.join(dst, ent.name)
    if (ent.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function patchServerImports(filePath) {
  let s = fs.readFileSync(filePath, 'utf8')
  s = s.replace(/from ['"]\.\.\/docker\/lib\//g, "from '../../docker/lib/")
  s = s.replace(/^export const dynamic = ['"]force-dynamic['"]\s*\n?/gm, '')
  fs.writeFileSync(filePath, s)
}

function walkTs(dir, fn) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkTs(p, fn)
    else if (ent.name.endsWith('.ts')) fn(p)
  }
}

let copied = 0
let skipped = 0

for (const id of API_PLUGIN_IDS) {
  const srcDir = path.join(builtinRoot, id)
  const dstDir = path.join(packRoot, id)
  const srcServer = path.join(srcDir, 'server.ts')
  if (!fs.existsSync(srcServer)) {
    console.warn(`skip ${id}: no builtin server.ts`)
    continue
  }
  if (SKIP_IF_PACK_SERVER.has(id) && fs.existsSync(path.join(dstDir, 'server.ts'))) {
    console.log(`keep ${id}: existing plugins-pack/server.ts`)
    skipped++
    continue
  }
  fs.mkdirSync(dstDir, { recursive: true })
  fs.copyFileSync(srcServer, path.join(dstDir, 'server.ts'))
  patchServerImports(path.join(dstDir, 'server.ts'))
  const lib = path.join(srcDir, 'lib')
  if (fs.existsSync(lib)) {
    const dstLib = path.join(dstDir, 'lib')
    if (fs.existsSync(dstLib)) fs.rmSync(dstLib, { recursive: true, force: true })
    copyDir(lib, dstLib)
    walkTs(dstLib, patchServerImports)
  }
  console.log(`synced ${id}`)
  copied++
}

console.log(`[SelfDashboard] plugins-pack servers: ${copied} copied, ${skipped} kept`)
