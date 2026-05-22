/**
 * Copies plugin sources into selfdashboard/plugins/ for Next.js / Docker builds.
 * Sources: ./plugins (already present), ../plugins (sibling), or SELFDASHBOARD_PLUGINS_SRC.
 *
 * Run automatically via npm prebuild or Docker before `npm run build`.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const dest = path.join(repoRoot, 'plugins')

const SKIP = new Set(['node_modules', '.git', 'custom'])

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const from = path.join(src, entry.name)
    const to = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else {
      fs.copyFileSync(from, to)
    }
  }
}

function sameTree(a, b) {
  try {
    return fs.realpathSync(a) === fs.realpathSync(b)
  } catch {
    return false
  }
}

let source
try {
  const env = process.env.SELFDASHBOARD_PLUGINS_SRC?.trim()
  if (env) {
    source = path.resolve(env)
  } else {
    const inRepo = path.join(repoRoot, 'plugins')
    const sibling = path.join(repoRoot, '..', 'plugins')
    if (fs.existsSync(path.join(inRepo, 'weather', 'server.ts'))) source = inRepo
    else if (fs.existsSync(path.join(sibling, 'weather', 'server.ts'))) source = sibling
    else source = inRepo
  }
} catch {
  source = path.join(repoRoot, 'plugins')
}

if (!fs.existsSync(path.join(source, 'weather', 'server.ts'))) {
  console.error(
    `[SelfDashboard] Plugin sources not found (expected plugins/weather/server.ts under ${source}).\n` +
      '  Local: copy ../plugins into selfdashboard/plugins/ (robocopy or node scripts/sync-plugins-for-build.mjs).\n' +
      '  CI: commit plugins/ to this repo, or run scripts/ci-prepare-plugins.sh before docker build.\n' +
      '  Or set SELFDASHBOARD_PLUGINS_SRC to your plugins folder.',
  )
  process.exit(1)
}

if (sameTree(source, dest)) {
  console.log(`[SelfDashboard] plugins/ already at ${dest}`)
  process.exit(0)
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true })
}

console.log(`[SelfDashboard] Sync plugins: ${source} → ${dest}`)
copyDir(source, dest)
console.log('[SelfDashboard] plugins/ ready for build')
