import 'server-only'

import fs from 'fs'
import path from 'path'
import maxmind, { type CityResponse, type Reader } from 'maxmind'

export type GeoipLookup = {
  lookup: (ip: string) => { country: string; city: string }
  dbPath: string
}

let readerCache: { path: string; reader: Reader<CityResponse> } | null = null

function isPublicIp(ip: string): boolean {
  if (!ip || !/^[\d.a-fA-F:]+$/.test(ip)) return false
  if (ip.includes(':')) {
    const lower = ip.toLowerCase()
    if (lower === '::1') return false
    if (lower.startsWith('fe80')) return false
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false
    return true
  }
  const p = ip.split('.').map((x) => Number(x))
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false
  if (p[0] === 10 || p[0] === 127) return false
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false
  if (p[0] === 192 && p[1] === 168) return false
  if (p[0] === 169 && p[1] === 254) return false
  return true
}

function geoipCandidatePaths(): string[] {
  const roots = new Set<string>()
  if (process.env.CROWDSEC_GEOIP_PATH?.trim()) {
    roots.add(path.resolve(process.env.CROWDSEC_GEOIP_PATH.trim()))
  }
  const dataDir = process.env.CROWDSEC_DATA_DIR || '/crowdsec-data'
  roots.add(path.resolve(dataDir))
  roots.add(path.resolve('/crowdsec-data'))
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.add(path.resolve(process.env.SELFDASHBOARD_DATA_DIR))
  }
  roots.add('/usr/share/GeoIP')
  roots.add('/usr/local/share/GeoIP')
  roots.add('/var/lib/crowdsec/geoip')

  const fileNames = [
    'GeoLite2-City.mmdb',
    'GeoLite2-Country.mmdb',
    'geoip/GeoLite2-City.mmdb',
    'geoip/GeoLite2-Country.mmdb',
    'GeoIP/GeoLite2-City.mmdb',
    'GeoIP/GeoLite2-Country.mmdb',
  ]

  const candidates: string[] = []
  for (const root of roots) {
    if (root.toLowerCase().endsWith('.mmdb')) {
      candidates.push(root)
      continue
    }
    for (const name of fileNames) {
      candidates.push(path.join(root, name))
    }
  }
  return [...new Set(candidates)]
}

export function findGeoipDatabase(): string | null {
  for (const p of geoipCandidatePaths()) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
    } catch {
      /* ignore */
    }
  }
  return null
}

/** Opens MaxMind GeoLite2 DB (CrowdSec ships / downloads the same format). */
export async function createGeoipLookup(): Promise<GeoipLookup | null> {
  const dbPath = findGeoipDatabase()
  if (!dbPath) return null

  try {
    if (!readerCache || readerCache.path !== dbPath) {
      const reader = await maxmind.open<CityResponse>(dbPath)
      readerCache = { path: dbPath, reader }
    }

    const reader = readerCache.reader
    return {
      dbPath,
      lookup(ip: string) {
        if (!isPublicIp(ip)) return { country: '', city: '' }
        try {
          const hit = reader.get(ip)
          if (!hit) return { country: '', city: '' }
          const country = hit.country?.iso_code?.trim().toUpperCase() || ''
          const city =
            hit.city?.names?.en ||
            hit.city?.names?.de ||
            (hit.city?.names ? Object.values(hit.city.names)[0] : '') ||
            ''
          return { country, city: typeof city === 'string' ? city : '' }
        } catch {
          return { country: '', city: '' }
        }
      },
    }
  } catch {
    readerCache = null
    return null
  }
}

export function normalizeCountryCode(raw: string): string {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (!s || s === '??' || s === 'XX' || s === 'UNKNOWN') return ''
  if (/^[A-Z]{2}$/.test(s)) return s
  return ''
}

export function applyGeoipToCountry(
  ip: string,
  country: string,
  city: string,
  geoip: GeoipLookup | null,
): { country: string; city: string } {
  let cc = normalizeCountryCode(country)
  let c = city?.trim() || ''
  if (cc) return { country: cc, city: c }
  if (!geoip) return { country: '??', city: c }
  const g = geoip.lookup(ip)
  if (g.country) return { country: g.country, city: g.city || c }
  return { country: '??', city: c }
}
