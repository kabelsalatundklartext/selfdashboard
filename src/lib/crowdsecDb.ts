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

type AlertRow = {
  id: number
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
  started_at: unknown
  stopped_at: unknown
  event_serialized: string | null
}

function cleanScenario(scenario: string): string {
  const i = scenario.indexOf('/')
  return i >= 0 ? scenario.slice(i + 1) : scenario
}

/** Parse CrowdSec/ent timestamps (RFC3339, SQLite datetime, unix s/ms/ns). */
export function parseCreatedAt(raw: unknown): Date | null {
  if (raw == null) return null
  if (typeof raw === 'number') {
    const n = raw
    if (!Number.isFinite(n) || n <= 0) return null
    if (n > 1e15) return new Date(Math.floor(n / 1_000_000))
    if (n > 1e12) return new Date(n)
    if (n > 1e9) return new Date(n * 1000)
    return null
  }
  const s = String(raw).trim()
  if (!s) return null
  let d = new Date(s)
  if (!Number.isFinite(d.getTime())) {
    const normalized = s.includes('T') ? s : s.replace(' ', 'T')
    d = new Date(normalized.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`)
  }
  if (!Number.isFinite(d.getTime()) || d.getFullYear() < 2000) return null
  return d
}

function rowTimestamp(row: AlertRow): Date | null {
  return parseCreatedAt(row.created_at) ?? parseCreatedAt(row.started_at) ?? parseCreatedAt(row.stopped_at)
}

function extractIpFromSerialized(serialized: string | null | undefined): string {
  if (!serialized) return ''
  const s = serialized.trim()
  if (!s) return ''
  try {
    const o = JSON.parse(s) as Record<string, unknown>
    const meta = o.Meta as Record<string, unknown> | undefined
    const fromMeta = meta?.source_ip ?? meta?.SourceIP
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()
    if (typeof o.source_ip === 'string' && o.source_ip.trim()) return o.source_ip.trim()
    const src = o.Source as Record<string, unknown> | undefined
    if (src && typeof src.ip === 'string' && src.ip.trim()) return src.ip.trim()
    if (src && typeof src.value === 'string' && src.value.trim()) return src.value.trim()
  } catch {
    /* regex fallback */
  }
  const m = s.match(/"source_ip"\s*:\s*"([^"\\]+)"/i)
  return m?.[1]?.trim() ?? ''
}

function extractMetaFromSerialized(serialized: string | null | undefined): { country: string; city: string } {
  if (!serialized) return { country: '', city: '' }
  try {
    const o = JSON.parse(serialized) as Record<string, unknown>
    const meta = o.Meta as Record<string, unknown> | undefined
    const cc = meta?.source_country ?? meta?.SourceCountry
    const city = meta?.source_city ?? meta?.SourceCity ?? meta?.city
    return {
      country: typeof cc === 'string' && cc.trim() ? cc.trim().toUpperCase() : '',
      city: typeof city === 'string' && city.trim() ? city.trim() : '',
    }
  } catch {
    return { country: '', city: '' }
  }
}

function formatAsNumber(raw: string | null | undefined): string {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (!s) return ''
  if (/^AS\d+/i.test(s)) return s.toUpperCase()
  if (/^\d+$/.test(s)) return `AS${s}`
  return s
}

function formatIpRange(ip: string, rangeFromDb: string | null | undefined): string {
  const r = rangeFromDb ? String(rangeFromDb).trim() : ''
  if (r) return r
  const m = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/)
  if (m) return `${m[1]}.0/24`
  return ''
}

function formatFeedTime(dt: Date, de: boolean): string {
  if (de) {
    return dt.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  return dt.toISOString().replace('T', ' ').slice(0, 19)
}

function isUsableIp(ip: string): boolean {
  const v = ip.trim()
  if (!v || v === '127.0.0.1' || v === '::1') return false
  return true
}

function buildAlertsSql(db: Database.Database): string {
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('scenario')) {
    throw new Error('db_schema_unsupported')
  }

  const ipExpr = names.has('source_ip')
    ? `COALESCE(NULLIF(TRIM(a.source_ip), ''), NULLIF(TRIM(a.source_value), ''))`
    : names.has('source_value')
      ? `NULLIF(TRIM(a.source_value), '')`
      : `''`

  const countryCol = names.has('source_country') ? 'a.source_country' : "''"
  const asNameCol = names.has('source_as_name') ? 'a.source_as_name' : "''"
  const asNumCol = names.has('source_as_number') ? 'a.source_as_number' : "''"
  const rangeCol = names.has('source_range') ? 'a.source_range' : "''"
  const latCol = names.has('source_latitude') ? 'a.source_latitude' : '0'
  const lonCol = names.has('source_longitude') ? 'a.source_longitude' : '0'
  const startedCol = names.has('started_at') ? 'a.started_at' : 'NULL'
  const stoppedCol = names.has('stopped_at') ? 'a.stopped_at' : 'NULL'

  const eventTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    .all() as { name: string }[]
  const eventSerializedExpr =
    eventTables.length > 0
      ? `(SELECT e.serialized FROM events e WHERE e.alert_events = a.id ORDER BY e.id DESC LIMIT 1)`
      : 'NULL'

  let activeBanExpr = '0'
  const decisionTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'")
    .all() as { name: string }[]
  if (decisionTables.length > 0) {
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
  a.id,
  a.scenario,
  ${ipExpr} AS ip,
  ${countryCol} AS country,
  ${asNameCol} AS as_name,
  ${asNumCol} AS as_number,
  ${rangeCol} AS ip_range,
  ${latCol} AS latitude,
  ${lonCol} AS longitude,
  ${activeBanExpr} AS active_ban,
  a.created_at,
  ${startedCol} AS started_at,
  ${stoppedCol} AS stopped_at,
  ${eventSerializedExpr} AS event_serialized
FROM alerts a
ORDER BY a.id DESC
LIMIT ?
`
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
  const cutoffMs = Date.now() - daysBack * 86400 * 1000
  const serverLat = opts.serverLat ?? 0
  const serverLon = opts.serverLon ?? 0
  const serverName = opts.serverName ?? 'Server'

  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const sql = buildAlertsSql(db)
    const rows = db.prepare(sql).all(maxAlerts) as AlertRow[]
    const feedData: FeedItem[] = []
    const feedSeen = new Set<string>()
    const flowMap = new Map<string, AttackPoint>()
    let totalAlerts = 0

    for (const row of rows) {
      const scenario = row.scenario ? String(row.scenario).trim() : ''
      if (!scenario || scenario === 'unknown') continue

      let ip = row.ip ? String(row.ip).trim() : ''
      if (!isUsableIp(ip)) {
        ip = extractIpFromSerialized(row.event_serialized)
      }
      if (!isUsableIp(ip)) continue

      const dt = rowTimestamp(row)
      if (!dt) continue
      if (dt.getTime() < cutoffMs) continue

      const metaFromEvent = extractMetaFromSerialized(row.event_serialized)
      let country = row.country ? String(row.country).trim().toUpperCase() : ''
      if (!country || country === '??') {
        country = metaFromEvent.country || '??'
      }
      const city = metaFromEvent.city

      const asnumber = formatAsNumber(row.as_number != null ? String(row.as_number) : '')
      const iprange = formatIpRange(ip, row.ip_range)

      const scenarioClean = cleanScenario(scenario)
      let lat = row.latitude != null ? Number(row.latitude) : 0
      let lon = row.longitude != null ? Number(row.longitude) : 0
      if (!Number.isFinite(lat)) lat = 0
      if (!Number.isFinite(lon)) lon = 0
      if (!lat && !lon) {
        ;[lat, lon] = geoForCountry(country)
      }

      const timeIso = dt.toISOString().replace('T', ' ').slice(0, 19)
      const timeDe = formatFeedTime(dt, true)
      const eventPreview = row.event_serialized
        ? String(row.event_serialized).slice(0, 4000)
        : ''

      const feedKey = `${row.id}|${ip}|${scenarioClean}`
      if (!feedSeen.has(feedKey)) {
        feedSeen.add(feedKey)
        feedData.push({
          alertId: row.id,
          ip,
          country,
          city,
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
          eventPreview,
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

/** Lightweight DB probe for settings “test connection”. */
export function probeCrowdsecDb(dbPath: string, daysBack = 365): {
  totalInDb: number
  totalAlerts: number
  feedRows: number
  mapPoints: number
} {
  const resolved = resolveCrowdsecDbPath(dbPath)
  const db = new Database(resolved, { readonly: true, fileMustExist: true })
  try {
    const totalInDb = (db.prepare('SELECT COUNT(*) AS c FROM alerts').get() as { c: number }).c
    const parsed = loadFromCrowdsecDb(resolved, { daysBack, maxAlerts: 3000 })
    return {
      totalInDb,
      totalAlerts: parsed.totalAlerts,
      feedRows: parsed.feedData.length,
      mapPoints: parsed.attackData.length,
    }
  } finally {
    db.close()
  }
}
