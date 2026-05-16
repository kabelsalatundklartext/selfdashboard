import fs from 'fs'
import path from 'path'
import initSqlJs, { type Database } from 'sql.js'
import type { AttackPoint, FeedItem, ParsedCrowdsecMetrics } from '@/lib/crowdsecMetrics'
import { geoForCountry } from '@/lib/crowdsecGeo'

export type CrowdsecDbOptions = {
  daysBack?: number
  serverLat?: number
  serverLon?: number
  serverName?: string
  maxAlerts?: number
}

function cleanScenario(scenario: string): string {
  const i = scenario.indexOf('/')
  return i >= 0 ? scenario.slice(i + 1) : scenario
}

function parseCreatedAt(raw: unknown): Date | null {
  if (raw == null) return null
  if (typeof raw === 'number') {
    const d = new Date(raw * (raw < 1e12 ? 1000 : 1))
    return Number.isFinite(d.getTime()) ? d : null
  }
  const s = String(raw).replace('Z', '').replace('T', ' ').split('.')[0]
  const d = new Date(s.includes('-') ? s.replace(' ', 'T') + 'Z' : s)
  if (!Number.isFinite(d.getTime()) || d.getTime() < 1e12) return null
  return d
}

type AlertRow = {
  scenario: string | null
  ip: string | null
  country: string | null
  as_name: string | null
  as_number: string | null
  ip_range: string | null
  latitude: number | null
  longitude: number | null
  active_ban: number | null
  created_at: unknown
}

const ALERTS_SQL = `
SELECT
  a.scenario,
  a.source_value AS ip,
  a.source_country AS country,
  a.source_as_name AS as_name,
  a.source_as_number AS as_number,
  a.source_range AS ip_range,
  a.source_latitude AS latitude,
  a.source_longitude AS longitude,
  CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END AS active_ban,
  a.created_at
FROM alerts a
LEFT JOIN decisions d ON d.alert_decisions = a.id
WHERE a.created_at >= ?
ORDER BY a.created_at DESC
LIMIT ?
`

export function resolveCrowdsecDbPath(userPath: string): string {
  const trimmed = userPath.trim()
  if (!trimmed) throw new Error('missing_db_path')
  const allowedRoot = path.resolve(process.env.CROWDSEC_DATA_DIR || '/crowdsec-data')
  const resolved = path.resolve(trimmed)
  if (!resolved.startsWith(allowedRoot) && !resolved.startsWith(path.resolve('/crowdsec-data'))) {
    throw new Error('db_path_not_allowed')
  }
  if (!fs.existsSync(resolved)) throw new Error('db_not_found')
  return resolved
}

export async function loadFromCrowdsecDb(
  dbPath: string,
  opts: CrowdsecDbOptions = {},
): Promise<ParsedCrowdsecMetrics> {
  const daysBack = Math.min(3650, Math.max(1, opts.daysBack ?? 365))
  const maxAlerts = Math.min(5000, Math.max(50, opts.maxAlerts ?? 2000))
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const serverLat = opts.serverLat ?? 0
  const serverLon = opts.serverLon ?? 0
  const serverName = opts.serverName ?? 'Server'

  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  const SQL = await initSqlJs(
    fs.existsSync(wasmPath) ? { wasmBinary: fs.readFileSync(wasmPath) } : undefined,
  )
  const fileBuffer = fs.readFileSync(dbPath)
  const db: Database = new SQL.Database(fileBuffer)

  try {
    const stmt = db.prepare(ALERTS_SQL)
    stmt.bind([cutoff, maxAlerts])
    const feedData: FeedItem[] = []
    const feedSeen = new Set<string>()
    const flowMap = new Map<string, AttackPoint>()
    let totalAlerts = 0

    while (stmt.step()) {
      const row = stmt.getAsObject() as AlertRow
      const ip = row.ip ? String(row.ip) : ''
      const scenario = row.scenario ? String(row.scenario) : ''
      if (!ip || !scenario || scenario === 'unknown') continue

      const country = row.country ? String(row.country) : '??'
      const asnumber = row.as_number != null ? String(row.as_number) : '0'
      const iprange = row.ip_range ? String(row.ip_range) : '-'
      if (asnumber === '0' && (iprange === '-' || iprange === 'ban' || iprange === '')) continue

      const dt = parseCreatedAt(row.created_at)
      if (!dt) continue

      const scenarioClean = cleanScenario(scenario)
      let lat = row.latitude != null ? Number(row.latitude) : 0
      let lon = row.longitude != null ? Number(row.longitude) : 0
      if (!lat && !lon) {
        ;[lat, lon] = geoForCountry(country)
      }

      const timeIso = dt.toISOString().replace('T', ' ').slice(0, 19)
      const timeDe = dt.toLocaleString('de-DE', { hour12: false })

      const feedKey = `${ip}|${scenarioClean}|${timeIso}`
      if (!feedSeen.has(feedKey)) {
        feedSeen.add(feedKey)
        feedData.push({
          ip,
          country,
          city: '',
          scenario: scenarioClean,
          time_iso: timeIso,
          time_de: timeDe,
          asname: row.as_name ? String(row.as_name) : '',
          asnumber,
          iprange,
          lat,
          lon,
          active_ban: Number(row.active_ban) === 1,
          count: 1,
        })
      }

      const flowKey = `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`
      const existing = flowMap.get(flowKey)
      if (existing) {
        existing.count += 1
      } else {
        flowMap.set(flowKey, {
          lat,
          lon,
          country,
          city: '',
          scenario: scenarioClean,
          ip,
          count: 1,
        })
      }
      totalAlerts += 1
    }
    stmt.free()

    return {
      attackData: [...flowMap.values()],
      feedData,
      totalAlerts,
      serverLat,
      serverLon,
      serverName,
    }
  } finally {
    db.close()
  }
}
