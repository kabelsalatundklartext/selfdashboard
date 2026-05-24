import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as topojson from 'topojson-client'
import { geoEquirectangular, geoPath } from 'd3-geo'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const topoPath =
  process.argv[2] ||
  path.join(root, 'scripts', 'data', 'countries-110m.json')

if (!fs.existsSync(topoPath)) {
  console.error('Missing topojson:', topoPath)
  process.exit(1)
}

const topo = JSON.parse(fs.readFileSync(topoPath, 'utf8'))
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
const outDir = path.join(root, 'public', 'plugin-assets')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'world-map-equirect.svg')
fs.writeFileSync(out, svg)
console.log('Wrote', out, `(${Math.round(svg.length / 1024)} KB)`)
