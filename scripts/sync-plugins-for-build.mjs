/**
 * Copies plugin sources into selfdashboard/plugins/ for Next.js / Docker builds.
 * Sources: ./plugins (already present), ../plugins (sibling), or SELFDASHBOARD_PLUGINS_SRC.
 *
 * Run automatically via npm prebuild or Docker before `npm run build`.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const dest = path.join(repoRoot, 'plugins')

const SKIP = new Set(['node_modules', '.git', 'custom'])

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const name of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(name)) continue
    const from = path.join(src, name)
    const to = path.join(dst, name)
    if (name.isDirectory()) {
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

const source = resolvePluginsRoot(repoRoot)
if (!fs.existsSync(source)) {
  console.error(
    `[SelfDashboard] Plugin sources not found (${source}).\n` +
      '  Monorepo: ensure ../plugins exists next to selfdashboard/\n' +
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
