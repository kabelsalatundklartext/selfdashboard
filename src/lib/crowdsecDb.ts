import 'server-only'

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
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
  const s = String(raw).trim()
  if (!s) return null
  const normalized = s.includes('T') ? s : s.replace(' ', 'T')
  const d = new Date(normalized.endsWith('Z') ? normalized : `${normalized}Z`)
  if (!Number.isFinite(d.getTime()) || d.getTime() < 1e12) return null
  return d
}

function alertCreatedTsExpr(): string {
  return `CASE
    WHEN a.created_at IS NULL THEN 0
    WHEN typeof(a.created_at) IN ('integer', 'real') THEN CAST(a.created_at AS INTEGER)
    ELSE CAST(strftime('%s', a.created_at) AS INTEGER)
  END`
}

function buildAlertsSql(db: Database.Database): string {
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('scenario')) {
    throw new Error('db_schema_unsupported')
  }

  const ipExpr = names.has('source_value')
    ? `COALESCE(NULLIF(TRIM(a.source_value), ''), NULLIF(TRIM(a.source_ip), ''))`
    : names.has('source_ip')
      ? `NULLIF(TRIM(a.source_ip), '')`
      : `NULLIF(TRIM(a.source_value), '')`

  const countryCol = names.has('source_country') ? 'a.source_country' : "''"
  const asNameCol = names.has('source_as_name') ? 'a.source_as_name' : "''"
  const asNumCol = names.has('source_as_number') ? 'a.source_as_number' : "''"
  const rangeCol = names.has('source_range') ? 'a.source_range' : "''"
  const latCol = names.has('source_latitude') ? 'a.source_latitude' : '0'
  const lonCol = names.has('source_longitude') ? 'a.source_longitude' : '0'
  const tsExpr = alertCreatedTsExpr()

  const decisionTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'")
    .all() as { name: string }[]
  const hasDecisions = decisionTables.length > 0
  let activeBanExpr = '0'
  if (hasDecisions) {
    const dCols = db.prepare('PRAGMA table_info(decisions)').all() as { name: string }[]
    const dNames = new Set(dCols.map((c) => c.name))
    if (dNames.has('alert_decisions')) {
      activeBanExpr = `CASE WHEN EXISTS (SELECT 1 FROM decisions d WHERE d.alert_decisions = a.id) THEN 1 ELSE 0 END`
    } else if (dNames.has('alert_id')) {
      activeBanExpr = `CASE WHEN EXISTS (SELECT 1 FROM decisions d WHERE d.alert_id = a.id) THEN 1 ELSE 0 END`
    }
  }

  return `
SELECT
  a.scenario,
  ${ipExpr} AS ip,
  ${countryCol} AS country,
  ${asNameCol} AS as_name,
  ${asNumCol} AS as_number,
  ${rangeCol} AS ip_range,
  ${latCol} AS latitude,
  ${lonCol} AS longitude,
  ${activeBanExpr} AS active_ban,
  a.created_at
FROM alerts a
WHERE ${tsExpr} >= ?
ORDER BY ${tsExpr} DESC
LIMIT ?
`
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

const ALLOWED_DB_ROOTS = () => {
  const roots = [
    path.resolve(process.env.CROWDSEC_DATA_DIR || '/crowdsec-data'),
    path.resolve('/crowdsec-data'),
  ]
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.push(path.resolve(process.env.SELFDASHBOARD_DATA_DIR))
  }
  return [...new Set(roots)]
}

export function resolveCrowdsecDbPath(userPath: string): string {
  const trimmed = userPath.trim()
  if (!trimmed) throw new Error('missing_db_path')
  const resolved = path.resolve(trimmed)
  const allowed = ALLOWED_DB_ROOTS().some(
    (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`),
  )
  if (!allowed) throw new Error('db_path_not_allowed')
  if (!fs.existsSync(resolved)) throw new Error('db_not_found')
  if (!fs.statSync(resolved).isFile()) throw new Error('db_not_a_file')
  return resolved
}

export function loadFromCrowdsecDb(dbPath: string, opts: CrowdsecDbOptions = {}): ParsedCrowdsecMetrics {
  const daysBack = Math.min(3650, Math.max(1, opts.daysBack ?? 365))
  const maxAlerts = Math.min(5000, Math.max(50, opts.maxAlerts ?? 2000))
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const serverLat = opts.serverLat ?? 0
  const serverLon = opts.serverLon ?? 0
  const serverName = opts.serverName ?? 'Server'

  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const sql = buildAlertsSql(db)
    const rows = db.prepare(sql).all(cutoff, maxAlerts) as AlertRow[]
    const feedData: FeedItem[] = []
    const feedSeen = new Set<string>()
    const flowMap = new Map<string, AttackPoint>()
    let totalAlerts = 0

    for (const row of rows) {
      const ip = row.ip ? String(row.ip).trim() : ''
      const scenario = row.scenario ? String(row.scenario).trim() : ''
      if (!ip || !scenario || scenario === 'unknown') continue

      const country = row.country ? String(row.country).trim() || '??' : '??'
      const asnumber = row.as_number != null ? String(row.as_number) : ''
      const iprange = row.ip_range ? String(row.ip_range) : ''

      const dt = parseCreatedAt(row.created_at)
      if (!dt) continue

      const scenarioClean = cleanScenario(scenario)
      let lat = row.latitude != null ? Number(row.latitude) : 0
      let lon = row.longitude != null ? Number(row.longitude) : 0
      if (!Number.isFinite(lat)) lat = 0
      if (!Number.isFinite(lon)) lon = 0
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
