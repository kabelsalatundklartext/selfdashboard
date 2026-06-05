import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import type { CrowdsecCountryStat, CrowdsecDashboardData, CrowdsecFeedItem } from './crowdsecMetrics'
import { applyGeoipToCountry, createGeoipLookup } from './crowdsecGeoip'

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
  created_at: string | null
  started_at: string | null
  stopped_at: string | null
  event_serialized: string | null
}

export type CrowdsecDbOptions = {
  daysBack?: number
  maxAlerts?: number
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

  const tryParse = (): { country: string; city: string } | null => {
    const t = raw.trim()
    if (!t.startsWith('{') && !t.startsWith('[')) return null
    try {
      const walk = (v: unknown): { country: string; city: string } | null => {
        if (!v || typeof v !== 'object') return null
        if (Array.isArray(v)) {
          for (const x of v) {
            const hit = walk(x)
            if (hit?.country) return hit
          }
          return null
        }
        const o = v as Record<string, unknown>
        const city = typeof o.City === 'string' ? o.City : typeof o.city === 'string' ? o.city : ''
        for (const key of ['IsoCode', 'iso_code', 'country_code', 'CountryCode', 'GeoIsoCode', 'country']) {
          const val = o[key]
          if (typeof val === 'string' && /^[A-Za-z]{2}$/.test(val.trim())) {
            return { country: val.trim().toUpperCase(), city }
          }
        }
        for (const val of Object.values(o)) {
          const hit = walk(val)
          if (hit?.country) return hit
        }
        return city ? { country: '', city } : null
      }
      return walk(JSON.parse(t))
    } catch {
      return null
    }
  }

  const parsed = tryParse()
  if (parsed?.country) return parsed

  const countryPatterns = [
    /"IsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"iso_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"country_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"CountryCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"GeoIsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"country"\s*:\s*"([A-Za-z]{2})"/i,
  ]
  let country = ''
  for (const re of countryPatterns) {
    const m = raw.match(re)
    if (m?.[1]) {
      country = m[1].toUpperCase()
      break
    }
  }
  const city = raw.match(/"City"\s*:\s*"([^"]+)"/i)?.[1] ?? raw.match(/"city"\s*:\s*"([^"]+)"/)?.[1] ?? ''
  return { country, city }
}

function parseTimestampValue(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) return d
  }
  const s = String(v).trim()
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s)
    const ms = n < 1e12 ? n * 1000 : n
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) return d
  }
  const d = new Date(s.replace(' ', 'T'))
  if (!Number.isNaN(d.getTime())) return d
  return null
}

function parseCreatedAt(row: AlertRow): Date | null {
  for (const v of [row.created_at, row.started_at, row.stopped_at]) {
    const d = parseTimestampValue(v)
    if (d) return d
  }
  return null
}

function pickCol(names: Set<string>, candidates: string[], fallback = "''"): string {
  for (const c of candidates) {
    if (names.has(c)) return `a.${c}`
  }
  return fallback
}

/** Unix seconds for `decisions.until` — aligns with cscli/LAPI (`until > now`). */
function decisionUntilUnixSecExpr(alias = 'd'): string {
  const col = `${alias}.until`
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`
}

/** Active ban = until strictly in the future (NULL/empty/past = inactive, like cscli decisions list). */
function decisionUntilClause(alias = 'd'): string {
  const untilSec = decisionUntilUnixSecExpr(alias)
  return `(${untilSec} IS NOT NULL AND ${untilSec} > CAST(strftime('%s', 'now') AS INTEGER))`
}

function decisionSchemaMeta(db: Database.Database): {
  hasTable: boolean
  linkCol: 'alert_decisions' | 'alert_id' | null
  hasUntil: boolean
  hasValue: boolean
  hasScope: boolean
  hasSimulated: boolean
  hasOrigin: boolean
} {
  const decisionTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'")
    .all() as { name: string }[]
  if (decisionTables.length === 0) {
    return {
      hasTable: false,
      linkCol: null,
      hasUntil: false,
      hasValue: false,
      hasScope: false,
      hasSimulated: false,
      hasOrigin: false,
    }
  }
  const dCols = db.prepare('PRAGMA table_info(decisions)').all() as { name: string }[]
  const dNames = new Set(dCols.map((c) => c.name))
  const linkCol = dNames.has('alert_decisions')
    ? 'alert_decisions'
    : dNames.has('alert_id')
      ? 'alert_id'
      : null
  return {
    hasTable: true,
    linkCol,
    hasUntil: dNames.has('until'),
    hasValue: dNames.has('value'),
    hasScope: dNames.has('scope'),
    hasSimulated: dNames.has('simulated'),
    hasOrigin: dNames.has('origin'),
  }
}

function activeDecisionWhere(meta: ReturnType<typeof decisionSchemaMeta>): string {
  const parts: string[] = []
  if (!meta.hasUntil) return 'WHERE 1=0'
  parts.push(decisionUntilClause('d'))
  if (meta.hasSimulated) {
    parts.push(`(d.simulated IS NULL OR d.simulated = 0)`)
  }
  if (meta.hasScope) {
    parts.push(
      `(d.scope IS NULL OR TRIM(CAST(d.scope AS TEXT)) = '' OR LOWER(TRIM(CAST(d.scope AS TEXT))) IN ('ip', 'range'))`,
    )
  }
  if (meta.hasOrigin) {
    // Wie `cscli decisions list`: Community-Blocklist (CAPI/lists) nicht als
    // "aktive Banns" zählen — nur lokale Entscheidungen (crowdsec/cscli/console).
    parts.push(
      `(d.origin IS NULL OR LOWER(TRIM(CAST(d.origin AS TEXT))) NOT IN ('capi', 'lists', 'listfile'))`,
    )
  }
  return `WHERE ${parts.join(' AND ')}`
}

/** One query — avoids per-alert EXISTS on 30k+ decisions (was freezing the dashboard). */
/** Aktive Community-Blocklist-Entscheidungen (CAPI/lists) — distinkte IPs. */
function countCommunityBans(db: Database.Database): number {
  const meta = decisionSchemaMeta(db)
  if (!meta.hasTable || !meta.hasValue || !meta.hasUntil || !meta.hasOrigin) return 0
  const parts: string[] = [decisionUntilClause('d')]
  if (meta.hasSimulated) parts.push(`(d.simulated IS NULL OR d.simulated = 0)`)
  if (meta.hasScope) {
    parts.push(
      `(d.scope IS NULL OR TRIM(CAST(d.scope AS TEXT)) = '' OR LOWER(TRIM(CAST(d.scope AS TEXT))) IN ('ip', 'range'))`,
    )
  }
  parts.push(`LOWER(TRIM(CAST(d.origin AS TEXT))) IN ('capi', 'lists', 'listfile')`)
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT TRIM(CAST(d.value AS TEXT))) AS n FROM decisions d WHERE ${parts.join(' AND ')}`,
    )
    .get() as { n?: number } | undefined
  return row?.n ?? 0
}

function loadActiveBannedIpSet(db: Database.Database): Set<string> {
  const meta = decisionSchemaMeta(db)
  if (!meta.hasTable || !meta.hasValue) return new Set()
  const rows = db
    .prepare(
      `SELECT DISTINCT TRIM(CAST(d.value AS TEXT)) AS ip FROM decisions d ${activeDecisionWhere(meta)}`,
    )
    .all() as { ip: string }[]
  const out = new Set<string>()
  for (const r of rows) {
    const ip = r.ip?.trim() ?? ''
    if (isUsableIp(ip)) out.add(ip)
  }
  return out
}

function loadAlertIdsWithActiveBan(db: Database.Database): Set<number> {
  const meta = decisionSchemaMeta(db)
  if (!meta.hasTable || !meta.linkCol) return new Set()
  const rows = db
    .prepare(
      `SELECT DISTINCT d.${meta.linkCol} AS alert_id FROM decisions d ${activeDecisionWhere(meta)}`,
    )
    .all() as { alert_id: number }[]
  const out = new Set<number>()
  for (const r of rows) {
    const id = Number(r.alert_id)
    if (Number.isFinite(id) && id > 0) out.add(id)
  }
  return out
}

function loadActiveBanFeed(db: Database.Database, geoip: GeoipLookup): CrowdsecFeedItem[] {
  const meta = decisionSchemaMeta(db)
  if (!meta.hasTable || !meta.hasValue) return []

  const cols = db.prepare('PRAGMA table_info(decisions)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  const scenarioExpr = names.has('scenario') ? 'd.scenario' : "''"
  const createdExpr = names.has('created_at')
    ? 'd.created_at'
    : names.has('updated_at')
      ? 'd.updated_at'
      : 'NULL'

  const rows = db
    .prepare(
      `SELECT TRIM(CAST(d.value AS TEXT)) AS ip,
              ${scenarioExpr} AS scenario,
              ${createdExpr} AS created_at
       FROM decisions d
       ${activeDecisionWhere(meta)}
       ORDER BY ${createdExpr} DESC`,
    )
    .all() as { ip: string; scenario: string | null; created_at: string | null }[]

  const seen = new Set<string>()
  const feed: CrowdsecFeedItem[] = []
  for (const row of rows) {
    const ip = row.ip?.trim() ?? ''
    if (!isUsableIp(ip) || seen.has(ip)) continue
    seen.add(ip)
    const dt = parseTimestampValue(row.created_at) ?? new Date()
    const geo = applyGeoipToCountry(ip, '', '', geoip)
    feed.push({
      alertId: 0,
      ip,
      country: geo.country,
      city: geo.city,
      scenario: cleanScenario(row.scenario ? String(row.scenario) : 'ban'),
      time_iso: dt.toISOString(),
      asname: '',
      asnumber: '',
      iprange: formatIpRange(ip, null),
      active_ban: true,
      lat: geo.lat,
      lon: geo.lon,
    })
  }
  return feed
}

/** Normalize CrowdSec `created_at` (unix sec/ms or ISO text) to unix seconds for SQL filters. */
function createdAtUnixSecExpr(alias = 'a'): string {
  const col = `${alias}.created_at`
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`
}

function countAlertsSince(db: Database.Database, cutoffUnix: number): number {
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('created_at')) return 0
  const base =
    "a.scenario IS NOT NULL AND TRIM(a.scenario) != '' AND TRIM(a.scenario) != 'unknown'"
  const ts = createdAtUnixSecExpr('a')
  const row =
    cutoffUnix > 0
      ? (db
          .prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${ts} >= ? AND ${base}`)
          .get(cutoffUnix) as { c: number } | undefined)
      : (db.prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${base}`).get() as { c: number } | undefined)
  return Number(row?.c ?? 0)
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

type GeoipLookup = Awaited<ReturnType<typeof createGeoipLookup>>

function resolveCountryFromRow(row: AlertRow, geoip: GeoipLookup): string | null {
  const scenario = row.scenario ? String(row.scenario).trim() : ''
  if (!scenario || scenario === 'unknown') return null

  let ip = row.ip ? String(row.ip).trim() : ''
  if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized)
  if (!isUsableIp(ip)) return null

  const meta = extractMetaFromSerialized(row.event_serialized)
  let country = row.country ? String(row.country).trim().toUpperCase() : ''
  if (!country || country === '??') country = meta.country || ''
  const geo = applyGeoipToCountry(ip, country, meta.city, geoip)
  country = geo.country
  if (!country || country === '??') return null
  return country
}

function countriesFromRows(rows: AlertRow[], geoip: GeoipLookup): CrowdsecCountryStat[] {
  const countryMap = new Map<string, number>()
  for (const row of rows) {
    const country = resolveCountryFromRow(row, geoip)
    if (!country) continue
    countryMap.set(country, (countryMap.get(country) || 0) + 1)
  }
  return [...countryMap.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
}

/** Fast GROUP BY on country column; avoids scanning the full alerts table. */
function loadCountriesFromDatabase(db: Database.Database, geoip: GeoipLookup): CrowdsecCountryStat[] {
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  const countryCol = names.has('source_country')
    ? 'a.source_country'
    : names.has('country')
      ? 'a.country'
      : null
  if (countryCol) {
    const rows = db
      .prepare(
        `SELECT UPPER(TRIM(CAST(${countryCol} AS TEXT))) AS country, COUNT(*) AS count
         FROM alerts a
         WHERE TRIM(COALESCE(a.scenario, '')) != '' AND TRIM(a.scenario) != 'unknown'
           AND TRIM(COALESCE(${countryCol}, '')) != ''
           AND UPPER(TRIM(CAST(${countryCol} AS TEXT))) != '??'
         GROUP BY country
         HAVING country != ''
         ORDER BY count DESC`,
      )
      .all() as { country: string; count: number }[]
    return rows.map((r) => ({ country: r.country, count: Number(r.count) }))
  }
  const cutoff90 = Math.floor((Date.now() - 90 * 86400_000) / 1000)
  const { sql, params } = buildAlertsSql(db, cutoff90, { includeEvents: false })
  const rows = db.prepare(`${sql}\nLIMIT 15000`).all(...params) as AlertRow[]
  return countriesFromRows(rows, geoip)
}

type BuildAlertsSqlOpts = { includeEvents?: boolean }

function buildAlertsSql(
  db: Database.Database,
  cutoffUnix: number,
  opts: BuildAlertsSqlOpts = {},
): { sql: string; params: number[] } {
  const includeEvents = opts.includeEvents !== false
  const cols = db.prepare('PRAGMA table_info(alerts)').all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))

  const ipParts: string[] = []
  if (names.has('source_ip')) ipParts.push('a.source_ip')
  if (names.has('source_value')) ipParts.push('a.source_value')
  const ipExpr = ipParts.length ? `COALESCE(${ipParts.join(', ')})` : "''"

  const countryCol = pickCol(names, ['source_country', 'country'])
  const asNameCol = pickCol(names, ['source_as_name', 'as_name'])
  const asNumCol = pickCol(names, ['source_as_number', 'as_number'])
  const rangeCol = pickCol(names, ['source_range', 'ip_range'])
  const latCol = pickCol(names, ['source_latitude', 'latitude'], '0')
  const lonCol = pickCol(names, ['source_longitude', 'longitude'], '0')
  const startedCol = names.has('started_at') ? 'a.started_at' : 'NULL'
  const stoppedCol = names.has('stopped_at') ? 'a.stopped_at' : 'NULL'

  const eventTables = includeEvents
    ? (db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
        .all() as { name: string }[])
    : []
  const eventSerializedExpr =
    eventTables.length > 0
      ? `(SELECT e.serialized FROM events e WHERE e.alert_events = a.id ORDER BY e.id DESC LIMIT 1)`
      : 'NULL'

  const whereParts = ["TRIM(COALESCE(a.scenario, '')) != ''", "TRIM(a.scenario) != 'unknown'"]
  const params: number[] = []
  if (cutoffUnix > 0) {
    whereParts.unshift(`${createdAtUnixSecExpr('a')} >= ?`)
    params.push(cutoffUnix)
  }

  const sql = `
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
  a.created_at,
  ${startedCol} AS started_at,
  ${stoppedCol} AS stopped_at,
  ${eventSerializedExpr} AS event_serialized
FROM alerts a
WHERE ${whereParts.join(' AND ')}
ORDER BY a.created_at DESC
`
  return { sql, params }
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

let dashboardInflight: Promise<CrowdsecDashboardData> | null = null
let dashboardInflightKey = ''

export async function loadCrowdsecDashboard(
  dbPath: string,
  opts: CrowdsecDbOptions = {},
): Promise<CrowdsecDashboardData> {
  const key = `${dbPath}|${opts.daysBack ?? 30}|${opts.maxAlerts ?? 2000}`
  if (dashboardInflight && dashboardInflightKey === key) return dashboardInflight
  dashboardInflightKey = key
  dashboardInflight = loadCrowdsecDashboardInner(dbPath, opts).finally(() => {
    dashboardInflight = null
    dashboardInflightKey = ''
  })
  return dashboardInflight
}

async function loadCrowdsecDashboardInner(
  dbPath: string,
  opts: CrowdsecDbOptions = {},
): Promise<CrowdsecDashboardData> {
  const daysBackRaw = opts.daysBack ?? 30
  const daysBack = daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, daysBackRaw))
  const maxAlertsRaw = opts.maxAlerts ?? 2000
  const maxAlerts = maxAlertsRaw === 0 ? 0 : Math.min(50_000, Math.max(50, maxAlertsRaw))
  const cutoffUnix =
    daysBack === 0 ? 0 : Math.floor((Date.now() - daysBack * 86400_000) / 1000)

  const geoip = await createGeoipLookup()

  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const alertsInRange = countAlertsSince(db, cutoffUnix)
    const alertsLast24h = alertsInRange
    const bannedIps = loadActiveBannedIpSet(db)
    const activeBans = bannedIps.size
    const communityBans = countCommunityBans(db)
    const bannedAlertIds = loadAlertIdsWithActiveBan(db)
    const banFeed = loadActiveBanFeed(db, geoip)

    const { sql, params } = buildAlertsSql(db, cutoffUnix)
    const rows = (
      maxAlerts > 0
        ? db.prepare(`${sql}\nLIMIT ?`).all(...params, maxAlerts)
        : db.prepare(sql).all(...params)
    ) as AlertRow[]
    const feed: CrowdsecFeedItem[] = []
    const feedSeen = new Set<string>()
    const scenarios = new Set<string>()

    for (const row of rows) {
      const scenario = row.scenario ? String(row.scenario).trim() : ''
      if (!scenario || scenario === 'unknown') continue

      let ip = row.ip ? String(row.ip).trim() : ''
      if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized)
      if (!isUsableIp(ip)) continue

      const dt = parseCreatedAt(row)
      if (!dt) continue

      const meta = extractMetaFromSerialized(row.event_serialized)
      let country = row.country ? String(row.country).trim().toUpperCase() : ''
      if (!country || country === '??') country = meta.country || ''
      let city = meta.city
      const geo = applyGeoipToCountry(ip, country, city, geoip)
      country = geo.country
      city = geo.city
      const isBan = bannedAlertIds.has(row.id) || bannedIps.has(ip)

      scenarios.add(cleanScenario(scenario))
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
          lat: geo.lat,
          lon: geo.lon,
        })
      }
    }

    const countries = loadCountriesFromDatabase(db, geoip)

    return {
      feed,
      banFeed,
      alertsInRange,
      alertsLast24h,
      activeBans,
      communityBans,
      countryCount: countries.length,
      scenarioCount: scenarios.size,
      countries,
      geoip: {
        enabled: Boolean(geoip),
        path: geoip?.dbPath ?? null,
      },
    }
  } finally {
    db.close()
  }
}
