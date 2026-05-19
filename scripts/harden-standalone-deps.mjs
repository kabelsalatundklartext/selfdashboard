/**
 * Ersetzt verwundbare Versionen in Standalone, node_modules und Next-compiled-Bundles.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

/** Next-Bundle-SHA1 von picomatch 4.0.3 (siehe vercel/next.js#92950) */
const NEXT_PICOMATCH_403_SHA1 = '6e92069f5eef59717a569d8d5c6ca5faa31f0c59'

const sourceNm = path.join(root, 'node_modules')

const standaloneNm = path.join(root, '.next/standalone/node_modules')
const appNm = path.join(root, 'node_modules')

const TARGET_ROOTS = [...new Set([standaloneNm, appNm].filter((p) => fs.existsSync(p)))]

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

function sha1File(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
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

function findBestSource(name, minVer) {
  const pinned = path.join(sourceNm, name)
  const pinnedVer = readVersion(pinned)
  if (pinnedVer && cmpVersion(pinnedVer, minVer) >= 0) {
    return pinned
  }

  let bestDir = null
  let bestVer = null
  for (const { name: n, dir } of walkPackageDirs(sourceNm)) {
    if (n !== name) continue
    const v = readVersion(dir)
    if (!v || cmpVersion(v, minVer) < 0) continue
    if (!bestVer || cmpVersion(v, bestVer) > 0) {
      bestDir = dir
      bestVer = v
    }
  }
  return bestDir
}

function replaceDir(targetDir, srcDir) {
  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  fs.cpSync(srcDir, targetDir, { recursive: true })
}

function writePackageVersion(targetDir, name, version) {
  const pjPath = path.join(targetDir, 'package.json')
  let pj = { name, main: 'index.js' }
  if (fs.existsSync(pjPath)) {
    try {
      pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'))
    } catch {
      /* ignore */
    }
  }
  pj.name = name
  pj.version = version
  fs.writeFileSync(pjPath, `${JSON.stringify(pj, null, 2)}\n`)
}

function assertPicomatchNotVulnerableBundle(dir) {
  const idx = path.join(dir, 'index.js')
  if (!fs.existsSync(idx)) return
  const sha = sha1File(idx)
  if (sha === NEXT_PICOMATCH_403_SHA1) {
    throw new Error(
      `picomatch still Next-4.0.3 bundle at ${dir} (sha1=${sha}) — Grype will keep flagging GHSA-c2c7-rcm5-vvqj`,
    )
  }
}

/** Next shippt ein webpack-Bundle ohne Version — Grype erkennt 4.0.3 per Datei-Hash */
function patchNextCompiled(nmRoot) {
  const compiled = path.join(nmRoot, 'next/dist/compiled')
  if (!fs.existsSync(compiled)) return 0

  let n = 0
  for (const name of Object.keys(PATCH)) {
    const target = path.join(compiled, name)
    if (!fs.existsSync(target)) continue

    const src = findBestSource(name, PATCH[name])
    if (!src) {
      console.warn(`harden-standalone-deps: no source for next/dist/compiled/${name}`)
      continue
    }

    const srcVer = readVersion(src)
    replaceDir(target, src)
    writePackageVersion(target, name, srcVer)
    if (name === 'picomatch') assertPicomatchNotVulnerableBundle(target)
    console.log(`harden-standalone-deps: next/dist/compiled/${name} -> ${srcVer}`)
    n++
  }
  return n
}

if (TARGET_ROOTS.length === 0) {
  console.log('harden-standalone-deps: nothing to scan — skip')
  process.exit(0)
}

let patched = 0

for (const targetRoot of TARGET_ROOTS) {
  patched += patchNextCompiled(targetRoot)

  for (const { name, dir } of walkPackageDirs(targetRoot)) {
    const minVer = PATCH[name]
    if (!minVer) continue

    const isNextCompiled = dir.includes(`${path.sep}next${path.sep}dist${path.sep}compiled${path.sep}`)
    const cur = readVersion(dir)
    const needsPatch =
      isNextCompiled && name === 'picomatch'
        ? true
        : !cur || cmpVersion(cur, minVer) < 0

    if (!needsPatch) {
      if (name === 'picomatch') assertPicomatchNotVulnerableBundle(dir)
      continue
    }

    const src = findBestSource(name, minVer)
    if (!src) {
      console.warn(
        `harden-standalone-deps: skip ${name} @ ${dir} — no source >= ${minVer}`,
      )
      continue
    }
    if (path.resolve(dir) === path.resolve(src)) continue

    const srcVer = readVersion(src)
    replaceDir(dir, src)
    if (name === 'picomatch') assertPicomatchNotVulnerableBundle(dir)
    console.log(
      `harden-standalone-deps: ${name} ${cur ?? 'next-bundle'} -> ${srcVer} (${dir})`,
    )
    patched++
  }
}

console.log(`harden-standalone-deps: ${patched} location(s) updated`)
