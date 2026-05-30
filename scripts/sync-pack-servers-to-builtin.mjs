/**
 * Copy server.ts (+ lib/) from plugins-pack/ → src/builtin-plugins/ (Docker/CI fallback).
 * Source of truth for these plugins is plugins-pack/, not src/builtin-plugins/.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolvePluginsPackRoot } from './resolve-plugins-root.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const packRoot = resolvePluginsPackRoot(repoRoot)
const builtinRoot = path.join(repoRoot, 'src', 'builtin-plugins')

/** Plugins whose API is authored under plugins-pack/ only. */
const PACK_SOURCE_IDS = ['pihole', 'selfstream', 'uptime-kuma']

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

let copied = 0

for (const id of PACK_SOURCE_IDS) {
  const srcServer = path.join(packRoot, id, 'server.ts')
  if (!fs.existsSync(srcServer)) {
    console.warn(`skip ${id}: no plugins-pack/server.ts`)
    continue
  }
  const dstDir = path.join(builtinRoot, id)
  fs.mkdirSync(dstDir, { recursive: true })
  fs.copyFileSync(srcServer, path.join(dstDir, 'server.ts'))
  const lib = path.join(packRoot, id, 'lib')
  if (fs.existsSync(lib)) {
    const dstLib = path.join(dstDir, 'lib')
    if (fs.existsSync(dstLib)) fs.rmSync(dstLib, { recursive: true, force: true })
    copyDir(lib, dstLib)
  }
  console.log(`pack → builtin: ${id}`)
  copied++
}

console.log(`[SelfDashboard] plugins-pack → builtin: ${copied} plugin server(s)`)
