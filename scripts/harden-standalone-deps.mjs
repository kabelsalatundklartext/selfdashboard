/**
 * Ersetzt verwundbare Pakete — inkl. Next dist/compiled und allen picomatch-Ordnern unter SCAN_ROOT.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const VULN_PICOMATCH_SHA1 = '6e92069f5eef59717a569d8d5c6ca5faa31f0c59'
const root = process.cwd()
const scanRoot = path.resolve(process.env.SCAN_ROOT || root)

const sourceNm = path.join(root, 'node_modules')

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

function isVulnPicomatchBundle(dir) {
  const idx = path.join(dir, 'index.js')
  if (!fs.existsSync(idx)) return false
  return sha1File(idx) === VULN_PICOMATCH_SHA1
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

function* findDirsNamed(dir, name, skip = new Set()) {
  if (!fs.existsSync(dir) || skip.has(dir)) return
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (!entry.isDirectory()) continue
    if (entry.name === name) yield full
    yield* findDirsNamed(full, name, skip)
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

function assertPicomatchSafe(dir) {
  if (isVulnPicomatchBundle(dir)) {
    throw new Error(`picomatch still 4.0.3 bundle at ${dir}`)
  }
}

function patchPicomatchDir(targetDir, srcDir, srcVer) {
  if (path.resolve(targetDir) === path.resolve(srcDir)) return false
  replaceDir(targetDir, srcDir)
  writePackageVersion(targetDir, 'picomatch', srcVer)
  assertPicomatchSafe(targetDir)
  return true
}

const picomatchSrc = findBestSource('picomatch', PATCH.picomatch)
if (!picomatchSrc) {
  console.error('harden-standalone-deps: picomatch 4.0.4 source missing — run npm install')
  process.exit(1)
}
const picomatchVer = readVersion(picomatchSrc)

let patched = 0
const skip = new Set([path.resolve(picomatchSrc)])

for (const dir of findDirsNamed(scanRoot, 'picomatch', skip)) {
  if (path.resolve(dir) === path.resolve(picomatchSrc)) continue
  const idx = path.join(dir, 'index.js')
  if (!fs.existsSync(idx)) continue
  const cur = readVersion(dir)
  const mustPatch =
    isVulnPicomatchBundle(dir) ||
    !cur ||
    cmpVersion(cur, PATCH.picomatch) < 0 ||
    dir.includes(`${path.sep}next${path.sep}dist${path.sep}compiled${path.sep}`)

  if (!mustPatch) {
    assertPicomatchSafe(dir)
    continue
  }

  if (patchPicomatchDir(dir, picomatchSrc, picomatchVer)) {
    console.log(`harden-standalone-deps: picomatch -> ${picomatchVer} (${dir})`)
    patched++
  }
}

function patchNamedPackage(name, minVer) {
  const src = findBestSource(name, minVer)
  if (!src) {
    console.warn(`harden-standalone-deps: no source for ${name} >= ${minVer}`)
    return
  }
  const srcVer = readVersion(src)
  const skipDirs = new Set([path.resolve(src)])

  for (const dir of findDirsNamed(scanRoot, name, skipDirs)) {
    if (path.resolve(dir) === path.resolve(src)) continue
    const cur = readVersion(dir)
    if (cur && cmpVersion(cur, minVer) >= 0) continue
    replaceDir(dir, src)
    writePackageVersion(dir, name, srcVer)
    console.log(`harden-standalone-deps: ${name} ${cur ?? '?'} -> ${srcVer} (${dir})`)
    patched++
  }
}

patchNamedPackage('ip-address', PATCH['ip-address'])
patchNamedPackage('brace-expansion', PATCH['brace-expansion'])

console.log(`harden-standalone-deps: ${patched} location(s) updated (scanRoot=${scanRoot})`)
