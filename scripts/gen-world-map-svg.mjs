import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as topojson from 'topojson-client'
import { geoEquirectangular, geoPath } from 'd3-geo'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const topoPath = process.argv[2] || path.join(root, 'scripts', 'data', 'countries-110m.json')
const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

async function ensureTopoJson() {
  if (fs.existsSync(topoPath)) return topoPath
  fs.mkdirSync(path.dirname(topoPath), { recursive: true })
  const res = await fetch(TOPO_URL)
  if (!res.ok) throw new Error(`fetch_failed:${res.status}`)
  const text = await res.text()
  fs.writeFileSync(topoPath, text)
  console.log('Downloaded', topoPath)
  return topoPath
}

const resolved = await ensureTopoJson()
const topo = JSON.parse(fs.readFileSync(resolved, 'utf8'))
const countries = topojson.feature(topo, topo.objects.countries)
const projection = geoEquirectangular().fitSize([360, 180], countries)
const pathGen = geoPath(projection)
let d = ''
for (const f of countries.features) {
  d += pathGen(f) || ''
}
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" width="360" height="180">
  <path fill="#3d4f6a" fill-opacity="0.55" stroke="#6b8299" stroke-opacity="0.5" stroke-width="0.25" d="${d}"/>
</svg>
`
const outDir = path.join(root, 'plugins-pack', 'crowdsec-v2')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'world-map-equirect.svg')
fs.writeFileSync(out, svg)
console.log('Wrote', out, `(${Math.round(svg.length / 1024)} KB)`)
