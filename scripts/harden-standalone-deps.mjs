/**
 * Next.js standalone kopiert teils alte verschachtelte Versionen (picomatch 4.0.3 …).
 * Ersetzt bekannte Pakete im Standalone-Baum durch die Version aus node_modules (npm overrides).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceNm = path.join(root, 'node_modules')

/** Alle Bäume, die im Produktions-Image landen können */
const TARGET_ROOTS = [
  path.join(root, '.next/standalone/node_modules'),
  path.join(root, 'node_modules'),
].filter((p) => fs.existsSync(p))

/** Mindestversion laut Grype / GHSA */
const PATCH = {
  picomatch: '4.0.4',
  'ip-address': '10.1.1',
  'brace-expansion': '2.0.3',
}

function readVersion(dir) {
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    return pj.version ?? null
  } catch {
    return null
  }
}

function cmpVersion(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}

function* walkPackageDirs(nmRoot) {
  if (!fs.existsSync(nmRoot)) return
  for (const entry of fs.readdirSync(nmRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = path.join(nmRoot, entry.name)
    if (entry.name === 'node_modules') {
      yield* walkPackageDirs(dir)
      continue
    }
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      yield { name: entry.name, dir }
    }
    const nested = path.join(dir, 'node_modules')
    if (fs.existsSync(nested)) yield* walkPackageDirs(nested)
  }
}

if (TARGET_ROOTS.length === 0) {
  console.log('harden-standalone-deps: nothing to scan — skip')
  process.exit(0)
}

let patched = 0
for (const targetRoot of TARGET_ROOTS) {
  for (const { name, dir } of walkPackageDirs(targetRoot)) {
    const minVer = PATCH[name]
    if (!minVer) continue
    const cur = readVersion(dir)
    if (!cur || cmpVersion(cur, minVer) >= 0) continue

    const src = path.join(sourceNm, name)
    if (path.resolve(dir) === path.resolve(src)) continue

    const srcVer = readVersion(src)
    if (!srcVer || cmpVersion(srcVer, minVer) < 0) {
      console.warn(`harden-standalone-deps: skip ${name} — source ${srcVer ?? 'missing'} < ${minVer}`)
      continue
    }

    fs.rmSync(dir, { recursive: true, force: true })
    fs.cpSync(src, dir, { recursive: true })
    console.log(`harden-standalone-deps: ${name} ${cur} -> ${readVersion(dir)} (${dir})`)
    patched++
  }
}

console.log(`harden-standalone-deps: ${patched} package(s) updated`)
