import 'server-only'

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import type { CrowdsecCountryStat, CrowdsecDashboardData, CrowdsecFeedItem } from '@/lib/crowdsecMetrics'

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
  active_ban: number
  created_at: string | null
  started_at: string | null
  stopped_at: string | null
  event_serialized: string | null
}

export type CrowdsecDbOptions = {
  daysBack?: number
  maxAlerts?: number
  statsHours?: number
}

function isUsableIp(ip: string): boolean {
  if (!ip) return false
  if (ip === '0.0.0.0' || ip === '::') return false
  return /^[\d.a-fA-F:]+$/.test(ip)
}

function extractIpFromSerialized(raw: string | null): string {
  if (!raw) return ''
  const m = raw.match(/"source_ip"\s*:\s*"([^"]+)"/) || raw.match(/"ip"\s*:\s*"([^"]+)"/)
  return m?.[1]?.trim() ?? ''
}

function extractMetaFromSerialized(raw: string | null): { country: string; city: string } {
  if (!raw) return { country: '', city: '' }
  const country = raw.match(/"IsoCode"\s*:\s*"([^"]+)"/i)?.[1]?.toUpperCase() ?? ''
  const city = raw.match(/"City"\s*:\s*"([^"]+)"/)?.[1] ?? ''
  return { country, city }
}

function parseCreatedAt(row: AlertRow): Date | null {
  for (const v of [row.created_at, row.started_at, row.stopped_at]) {
    if (!v) continue
    const d = new Date(String(v).replace(' ', 'T'))
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function formatAsNumber(v: string): string {
  const s = v.trim()
  if (!s) return ''
  return s.toUpperCase().startsWith('AS') ? s.toUpperCase() : `AS${s}`
}

function formatIpRange(ip: string, range: string | null): string {
  const r = range?.trim()
  if (r && r.includes('/')) return r
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
  return ''
}

function cleanScenario(s: string): string {
  return s.replace(/^crowdsecurity\//i, '').trim() || 'unknown'
}

function buildAlertsSql(db: Database.Database): string {
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))

  const ipParts: string[] = []
  if (names.has('source_ip')) ipParts.push('a.source_ip')
  if (names.has('source_value')) ipParts.push('a.source_value')
  const ipExpr = ipParts.length ? `COALESCE(${ipParts.join(', ')})` : "''"

  const countryCol = names.has('country') ? 'a.country' : "''"
  const asNameCol = names.has('as_name') ? 'a.as_name' : "''"
  const asNumCol = names.has('as_number') ? 'a.as_number' : "''"
  const rangeCol = names.has('ip_range') ? 'a.ip_range' : "''"
  const latCol = names.has('latitude') ? 'a.latitude' : '0'
  const lonCol = names.has('longitude') ? 'a.longitude' : '0'
  const startedCol = names.has('started_at') ? 'a.started_at' : 'NULL'
  const stoppedCol = names.has('stopped_at') ? 'a.stopped_at' : 'NULL'

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

  const eventTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    .all() as { name: string }[]
  const eventSerializedExpr =
    eventTables.length > 0
      ? `(SELECT e.serialized FROM events e WHERE e.alert_events = a.id ORDER BY e.id DESC LIMIT 1)`
      : 'NULL'

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
  const trimmed = userPath.trim() || '/crowdsec-data/crowdsec.db'
  const resolved = path.resolve(trimmed)
  const allowed = ALLOWED_DB_ROOTS().some(
    (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`),
  )
  if (!allowed) throw new Error('db_path_not_allowed')
  if (!fs.existsSync(resolved)) throw new Error('db_not_found')
  if (!fs.statSync(resolved).isFile()) throw new Error('db_not_a_file')
  return resolved
}

export function loadCrowdsecDashboard(dbPath: string, opts: CrowdsecDbOptions = {}): CrowdsecDashboardData {
  const daysBack = Math.min(3650, Math.max(1, opts.daysBack ?? 30))
  const maxAlerts = Math.min(5000, Math.max(50, opts.maxAlerts ?? 500))
  const statsHours = Math.min(168, Math.max(1, opts.statsHours ?? 24))
  const cutoffMs = Date.now() - daysBack * 86400_000
  const cutoff24h = Date.now() - statsHours * 3600_000

  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const sql = buildAlertsSql(db)
    const rows = db.prepare(sql).all(maxAlerts) as AlertRow[]
    const feed: CrowdsecFeedItem[] = []
    const feedSeen = new Set<string>()
    const countryMap = new Map<string, number>()
    const scenarios = new Set<string>()
    let alertsInRange = 0
    let alertsLast24h = 0
    let activeBans = 0

    for (const row of rows) {
      const scenario = row.scenario ? String(row.scenario).trim() : ''
      if (!scenario || scenario === 'unknown') continue

      let ip = row.ip ? String(row.ip).trim() : ''
      if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized)
      if (!isUsableIp(ip)) continue

      const dt = parseCreatedAt(row)
      if (!dt) continue
      const t = dt.getTime()
      if (t < cutoffMs) continue

      alertsInRange += 1
      if (t >= cutoff24h) alertsLast24h += 1

      const meta = extractMetaFromSerialized(row.event_serialized)
      let country = row.country ? String(row.country).trim().toUpperCase() : ''
      if (!country || country === '??') country = meta.country || '??'
      const city = meta.city
      const isBan = Number(row.active_ban) === 1
      if (isBan) activeBans += 1

      scenarios.add(cleanScenario(scenario))
      countryMap.set(country, (countryMap.get(country) || 0) + 1)

      const feedKey = `${row.id}|${ip}`
      if (!feedSeen.has(feedKey)) {
        feedSeen.add(feedKey)
        feed.push({
          alertId: row.id,
          ip,
          country,
          city,
          scenario: cleanScenario(scenario),
          time_iso: dt.toISOString(),
          asname: row.as_name ? String(row.as_name) : '',
          asnumber: formatAsNumber(row.as_number != null ? String(row.as_number) : ''),
          iprange: formatIpRange(ip, row.ip_range),
          active_ban: isBan,
        })
      }
    }

    const countries: CrowdsecCountryStat[] = [...countryMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)

    return {
      feed,
      alertsInRange,
      alertsLast24h,
      activeBans,
      countryCount: countryMap.size,
      scenarioCount: scenarios.size,
      countries,
    }
  } finally {
    db.close()
  }
}
