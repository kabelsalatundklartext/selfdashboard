/**
 * Bricht ab, wenn irgendwo unter scanRoot noch das Next-picomatch-4.0.3-Bundle steckt.
 * Usage: node scripts/audit-picomatch.mjs [scanRoot]
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const VULN_SHA1 = '6e92069f5eef59717a569d8d5c6ca5faa31f0c59'
const scanRoot = path.resolve(process.argv[2] || process.env.SCAN_ROOT || process.cwd())

function sha1File(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
}

function* walkFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkFiles(full)
    else if (entry.isFile() && entry.name.endsWith('.js')) yield full
  }
}

const hits = []
for (const file of walkFiles(scanRoot)) {
  try {
    if (sha1File(file) === VULN_SHA1) hits.push(file)
  } catch {
    /* ignore */
  }
}

if (hits.length) {
  console.error(`audit-picomatch: vulnerable picomatch 4.0.3 bundle in ${hits.length} file(s):`)
  for (const h of hits.slice(0, 25)) console.error(`  ${h}`)
  process.exit(1)
}

console.log(`audit-picomatch: OK (no ${VULN_SHA1} under ${scanRoot})`)
