/**
 * Copies builtin plugin server sources into src/builtin-plugins/ for Docker/CI builds.
 * Dev source of truth remains ../plugins (or ./plugins when synced).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const destRoot = path.join(repoRoot, 'src', 'builtin-plugins')

const BUILTIN_IDS = [
  'adguard',
  'calendar',
  'crowdsec',
  'docker',
  'fritz-energy',
  'fritzbox',
  'mail',
  'weather',
]

const SKIP = new Set(['node_modules', '.git'])

function walkTs(dir, fn) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkTs(p, fn)
    else if (ent.name.endsWith('.ts')) fn(p)
  }
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue
    const from = path.join(src, ent.name)
    const to = path.join(dst, ent.name)
    if (ent.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function patchImports(filePath) {
  let s = fs.readFileSync(filePath, 'utf8')
  // Fix mistaken ../docker from an older vendor pass (lib/ needs ../../docker)
  s = s.replace(/from ['"]\.\.\/docker\/lib\//g, "from '../../docker/lib/")
  fs.writeFileSync(filePath, s)
}

const vendoredMarker = path.join(destRoot, 'weather', 'server.ts')
const force = process.argv.includes('--force') || process.env.FORCE_VENDOR_PLUGINS === '1'

if (fs.existsSync(vendoredMarker) && !force) {
  console.log(`[SelfDashboard] src/builtin-plugins/ already present (use --force to refresh)`)
  process.exit(0)
}

const source = resolvePluginsRoot(repoRoot)
if (!fs.existsSync(path.join(source, 'weather', 'server.ts'))) {
  console.error(`[SelfDashboard] Cannot vendor: missing ${path.join(source, 'weather', 'server.ts')}`)
  console.error('  Commit src/builtin-plugins/ for CI, or set SELFDASHBOARD_PLUGINS_SRC / ../plugins')
  process.exit(1)
}

if (fs.existsSync(destRoot)) fs.rmSync(destRoot, { recursive: true, force: true })
fs.mkdirSync(destRoot, { recursive: true })

for (const id of BUILTIN_IDS) {
  const srcDir = path.join(source, id)
  const dstDir = path.join(destRoot, id)
  if (!fs.existsSync(path.join(srcDir, 'server.ts'))) {
    console.error(`[SelfDashboard] Missing ${srcDir}/server.ts`)
    process.exit(1)
  }
  fs.mkdirSync(dstDir, { recursive: true })
  fs.copyFileSync(path.join(srcDir, 'server.ts'), path.join(dstDir, 'server.ts'))
  const lib = path.join(srcDir, 'lib')
  if (fs.existsSync(lib)) copyDir(lib, path.join(dstDir, 'lib'))
  patchImports(path.join(dstDir, 'server.ts'))
  const libDir = path.join(dstDir, 'lib')
  if (fs.existsSync(libDir)) {
    walkTs(libDir, patchImports)
  }
  console.log(`[SelfDashboard] vendored ${id}`)
}

console.log(`[SelfDashboard] Builtin plugins → ${destRoot}`)
