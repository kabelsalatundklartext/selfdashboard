import 'server-only'
import { createHash, pbkdf2Sync } from 'node:crypto'
import type { FritzBoxConnection } from './fritzboxTr064'
import { runWithTr064NodeFetch } from './tr064NodeFetch'

const PBKDF2_INDICATOR = '2$'
const LOGIN_PATH = '/login_sid.lua?version=2'
const AHA_PATH = '/webservices/homeautoswitch.lua'
const REST_DEVICES = '/api/v0/smarthome/overview/devices'

export type FritzBoxPeriodKwh = {
  todayKwh: number
  last7DaysKwh: number
  monthKwh: number
  /** YYYY-MM-DD → kWh (soweit aus Box-Daten ableitbar) */
  dailyKwh: Record<string, number>
  /** YYYY-MM → kWh (aus Jahr-/Monats-Serien der Box) */
  monthlyKwh: Record<string, number>
}

type EnergySeries = {
  period: string
  interval: number
  values: number[]
}

function xmlText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i')
  const m = xml.match(re)
  const v = m?.[1]?.trim()
  return v && v.length > 0 ? v : null
}

function md5ChallengeResponse(challenge: string, password: string): string {
  const buf = Buffer.from(`${challenge}-${password}`, 'utf16le')
  return `${challenge}-${createHash('md5').update(buf).digest('hex')}`
}

function pbkdf2ChallengeResponse(challenge: string, password: string): string {
  const parts = challenge.split('$')
  if (parts.length < 5) throw new Error('bad_challenge')
  const iterations1 = parseInt(parts[1]!, 10)
  const salt1 = parts[2]!
  const iterations2 = parseInt(parts[3]!, 10)
  const salt2 = parts[4]!
  const staticHash = pbkdf2Sync(password, Buffer.from(salt1, 'hex'), iterations1, 32, 'sha256')
  const dynamicHash = pbkdf2Sync(staticHash, Buffer.from(salt2, 'hex'), iterations2, 32, 'sha256')
  return `${salt2}$${dynamicHash.toString('hex')}`
}

function challengeResponse(challenge: string, password: string): string {
  return challenge.startsWith(PBKDF2_INDICATOR)
    ? pbkdf2ChallengeResponse(challenge, password)
    : md5ChallengeResponse(challenge, password)
}

/** Web-UI-Port (80/443), nicht TR-064 49000/49443. */
export function fritzWebOrigins(conn: FritzBoxConnection): string[] {
  const u = new URL(conn.baseUrl)
  const host = u.hostname
  const preferHttps = u.protocol === 'https:' || conn.insecureTls
  const out: string[] = []
  if (preferHttps) out.push(`https://${host}`)
  out.push(`http://${host}`)
  if (!preferHttps) out.push(`https://${host}`)
  return [...new Set(out)]
}

async function webFetch(
  conn: FritzBoxConnection,
  origin: string,
  path: string,
  init?: RequestInit & { query?: Record<string, string> },
): Promise<Response> {
  const q = init?.query
  const url = new URL(path, origin)
  if (q) {
    for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip `query` from the fetch init via rest
  const { query: _q, ...rest } = init ?? {}
  return fetch(url.toString(), rest)
}

async function loginSid(conn: FritzBoxConnection, origin: string, signal: AbortSignal): Promise<string> {
  const r1 = await webFetch(conn, origin, LOGIN_PATH, { signal })
  const t1 = await r1.text()
  if (!r1.ok) throw new Error(`login_http_${r1.status}`)
  const challenge = xmlText(t1, 'Challenge')
  const sid0 = xmlText(t1, 'SID')
  if (!challenge) throw new Error('login_no_challenge')
  if (sid0 && sid0 !== '0000000000000000') return sid0

  const response = challengeResponse(challenge, conn.password)
  const user = conn.username || ''
  const body = new URLSearchParams({ username: user, response })
  const r2 = await webFetch(conn, origin, LOGIN_PATH, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const t2 = await r2.text()
  if (!r2.ok) throw new Error(`login_http_${r2.status}`)
  const sid = xmlText(t2, 'SID')
  if (!sid || sid === '0000000000000000') throw new Error('unauthorized')
  return sid
}

function ainDigits(ain: string): string {
  return ain.replace(/\D/g, '')
}

function sumWhToKwh(values: number[]): number {
  let sum = 0
  for (const v of values) {
    if (Number.isFinite(v) && v > 0) sum += v
  }
  return sum / 1000
}

function berlinDateKey(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
}

function berlinMonthKey(ms: number): string {
  return berlinDateKey(ms).slice(0, 7)
}

/** Mitternacht des Berlin-Kalendertags von `ms` (für FRITZ!-Tages-Serie ab 0:00). */
function startOfBerlinDayMs(ms: number): number {
  let lo = ms - 40 * 3_600_000
  let hi = ms
  for (let i = 0; i < 48; i++) {
    const mid = Math.floor((lo + hi) / 2)
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(mid))
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
    const sec = Number(parts.find((p) => p.type === 'second')?.value ?? 0)
    if (h > 0 || m > 0 || sec > 0) lo = mid + 1
    else hi = mid
  }
  return hi
}

function normalizePeriodKey(period: string, gridSec: number): 'day' | 'week' | 'month' | 'year' | null {
  const p = period.toLowerCase().trim()
  if (p === 'day' || p === 'today' || p === '86400') return 'day'
  if (p === 'week' || p === '7days' || p === '604800') return 'week'
  if (p === 'month' || p === '2592000') return 'month'
  if (p === 'year' || p === '2years' || p === 'years' || p === '730') return 'year'
  if (gridSec >= 2_592_000) return 'year'
  if (gridSec >= 86_400) return 'month'
  if (gridSec >= 21_600) return 'week'
  if (gridSec >= 900) return 'day'
  return null
}

function dailyFromBuckets(values: number[], gridSec: number, endMs: number): Record<string, number> {
  const daily: Record<string, number> = {}
  if (gridSec <= 0 || values.length === 0) return daily
  const spanMs = gridSec * 1000
  for (let i = 0; i < values.length; i++) {
    const wh = values[i]
    if (!Number.isFinite(wh) || wh <= 0) continue
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs
    const key = berlinDateKey(bucketEnd)
    daily[key] = (daily[key] ?? 0) + wh / 1000
  }
  return daily
}

function monthlyFromBuckets(values: number[], gridSec: number, endMs: number): Record<string, number> {
  const monthly: Record<string, number> = {}
  if (gridSec <= 0 || values.length === 0) return monthly
  const spanMs = gridSec * 1000
  for (let i = 0; i < values.length; i++) {
    const wh = values[i]
    if (!Number.isFinite(wh) || wh <= 0) continue
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs
    const key = berlinMonthKey(bucketEnd)
    monthly[key] = (monthly[key] ?? 0) + wh / 1000
  }
  return monthly
}

function mergeDailyMax(target: Record<string, number>, add: Record<string, number>): void {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = Math.max(target[k] ?? 0, v)
  }
}

function mergeDailySum(target: Record<string, number>, add: Record<string, number>): void {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = (target[k] ?? 0) + v
  }
}

/** Tages-Serie FRITZ!Box: Bucket 0 = erste Rasterzeit ab 0:00 Uhr (Berlin), nicht rollierend 24 h. */
function dailyFromBucketsCalendarDay(values: number[], gridSec: number, endMs: number): Record<string, number> {
  const daily: Record<string, number> = {}
  if (gridSec <= 0 || values.length === 0) return daily
  const sod = startOfBerlinDayMs(endMs)
  const spanMs = gridSec * 1000
  for (let i = 0; i < values.length; i++) {
    const wh = values[i]
    if (!Number.isFinite(wh) || wh <= 0) continue
    const bucketEnd = sod + (i + 1) * spanMs
    if (bucketEnd > endMs) continue
    const key = berlinDateKey(bucketEnd)
    daily[key] = (daily[key] ?? 0) + wh / 1000
  }
  return daily
}

/** Wh von 0:00 (Berlin) bis `endMs` — nur abgeschlossene Raster der Tages-Serie (wie Fritz „von/bis“). */
function sumWhTodayCalendarDay(values: number[], gridSec: number, endMs: number): number {
  if (gridSec <= 0 || values.length === 0) return 0
  const sod = startOfBerlinDayMs(endMs)
  const spanMs = gridSec * 1000
  let whSum = 0
  let lastWh = 0
  let slots = 0
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (!Number.isFinite(v) || v <= 0) continue
    const bucketEnd = sod + (i + 1) * spanMs
    if (bucketEnd > endMs) break
    whSum += v
    lastWh = v
    slots++
  }
  if (slots === 0) return 0
  /** Manche FRITZ!OS-Builds liefern kumulative Wh pro Slot → letzter Wert ≈ „von 0:00 bis jetzt“. */
  if (lastWh > 0 && whSum > lastWh * 1.35) return lastWh
  return whSum
}

/** Rollierendes Fenster (Fallback, falls die Box so liefert). */
function sumWhBucketsRollingToday(values: number[], gridSec: number, endMs: number): number {
  if (gridSec <= 0 || values.length === 0) return 0
  const todayKey = berlinDateKey(endMs)
  const spanMs = gridSec * 1000
  let wh = 0
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (!Number.isFinite(v) || v <= 0) continue
    const bucketEnd = endMs - (values.length - 1 - i) * spanMs
    if (berlinDateKey(bucketEnd) === todayKey) wh += v
  }
  return wh
}

function sumLast7CalendarDays(daily: Record<string, number>, todayKey: string): number {
  const keys = Object.keys(daily)
    .filter((k) => k <= todayKey)
    .sort()
  if (keys.length === 0) return 0
  return keys.slice(-7).reduce((a, k) => a + (daily[k] ?? 0), 0)
}

function sumCurrentMonthToDate(daily: Record<string, number>, todayKey: string): number {
  const monthPrefix = todayKey.slice(0, 7)
  let sum = 0
  for (const [k, v] of Object.entries(daily)) {
    if (k.startsWith(monthPrefix) && k <= todayKey) sum += v
  }
  return sum
}

function parseBasicDeviceStatsXml(xml: string): { energies: EnergySeries[] } {
  const energies: EnergySeries[] = []
  const energyBlocks = xml.match(/<energy\b[^>]*>[\s\S]*?<\/energy>/gi) ?? []
  for (const block of energyBlocks) {
    const statsM = block.match(/<stats\b([^>]*)>([\s\S]*?)<\/stats>/i)
    if (!statsM) continue
    const attrs = statsM[1] ?? ''
    const period = attrs.match(/\bperiod="([^"]+)"/i)?.[1] ?? 'unknown'
    const grid = parseInt(attrs.match(/\bgrid="(\d+)"/i)?.[1] ?? '0', 10)
    const csv = (statsM[2] ?? '').trim()
    const values = csv
      .split(',')
      .map((s) => {
        const n = parseInt(s.trim(), 10)
        return Number.isFinite(n) ? n : 0
      })
      .filter((_, i, arr) => i < arr.length)
    energies.push({ period, interval: grid, values })
  }
  return { energies }
}

function periodKwhFromSeries(energies: EnergySeries[]): FritzBoxPeriodKwh {
  const dailyKwh: Record<string, number> = {}
  const monthlyKwh: Record<string, number> = {}
  const now = Date.now()
  const todayKey = berlinDateKey(now)

  let todayKwh = 0
  let weekSeriesKwh = 0
  let monthSeriesKwh = 0
  let hasWeekSeries = false
  let hasMonthSeries = false

  for (const s of energies) {
    const grid = s.interval || 900
    const kind = normalizePeriodKey(s.period, grid)
    const bucketsRolling = dailyFromBuckets(s.values, grid, now)

    if (kind === 'day') {
      const calWh = sumWhTodayCalendarDay(s.values, grid, now)
      const rollWh = sumWhBucketsRollingToday(s.values, grid, now)
      if (calWh > 0) todayKwh = calWh / 1000
      else if (rollWh > 0) todayKwh = rollWh / 1000
      mergeDailySum(dailyKwh, dailyFromBucketsCalendarDay(s.values, grid, now))
    } else if (kind === 'week') {
      hasWeekSeries = true
      if (grid >= 86_400) {
        weekSeriesKwh = sumWhToKwh(s.values)
      }
      mergeDailySum(dailyKwh, bucketsRolling)
    } else if (kind === 'month') {
      hasMonthSeries = true
      if (grid >= 86_400) {
        monthSeriesKwh = sumWhToKwh(s.values)
      }
      mergeDailySum(dailyKwh, bucketsRolling)
      mergeDailyMax(monthlyKwh, monthlyFromBuckets(s.values, grid, now))
    } else if (kind === 'year') {
      mergeDailyMax(monthlyKwh, monthlyFromBuckets(s.values, grid, now))
    } else {
      mergeDailySum(dailyKwh, bucketsRolling)
    }
  }

  const last7FromDaily = sumLast7CalendarDays(dailyKwh, todayKey)
  let last7DaysKwh = last7FromDaily
  if (last7DaysKwh <= 0 && hasWeekSeries && weekSeriesKwh > 0) last7DaysKwh = weekSeriesKwh

  const monthFromDaily = sumCurrentMonthToDate(dailyKwh, todayKey)
  let monthKwh = monthFromDaily
  if (monthKwh <= 0 && hasMonthSeries && monthSeriesKwh > 0) monthKwh = monthSeriesKwh
  if (monthKwh <= 0) monthKwh = Math.max(0, monthlyKwh[berlinMonthKey(now)] ?? 0)

  return { todayKwh, last7DaysKwh, monthKwh, dailyKwh, monthlyKwh }
}

async function fetchRestPeriodKwh(
  conn: FritzBoxConnection,
  ain: string,
  signal: AbortSignal,
): Promise<FritzBoxPeriodKwh | null> {
  for (const origin of fritzWebOrigins(conn)) {
    try {
      const sid = await loginSid(conn, origin, signal)
      const devRes = await webFetch(conn, origin, REST_DEVICES, {
        signal,
        headers: { Authorization: `AVM-SID ${sid}`, Accept: 'application/json' },
      })
      if (devRes.status === 404 || devRes.status === 405) continue
      if (!devRes.ok) continue
      const devices = (await devRes.json()) as {
        ain?: string
        unitUids?: string[]
      }[]
      if (!Array.isArray(devices)) continue
      const target = ainDigits(ain)
      const dev = devices.find((d) => ainDigits(String(d.ain ?? '')) === target)
      if (!dev?.unitUids?.length) continue
      const unitUid = encodeURIComponent(dev.unitUids[0]!)
      const unitRes = await webFetch(conn, origin, `/api/v0/smarthome/overview/units/${unitUid}`, {
        signal,
        headers: { Authorization: `AVM-SID ${sid}`, Accept: 'application/json' },
      })
      if (!unitRes.ok) continue
      const unit = (await unitRes.json()) as {
        statistics?: { energies?: EnergySeries[] }
      }
      const energies = (unit.statistics?.energies ?? []).map((e) => ({
        period: String(e.period ?? ''),
        interval: e.interval || 900,
        values: (e.values ?? []).map((v) => (typeof v === 'number' ? v : 0)),
      }))
      if (energies.length === 0) continue

      return periodKwhFromSeries(energies)
    } catch {
      continue
    }
  }
  return null
}

async function fetchAhaBasicStats(
  conn: FritzBoxConnection,
  ain: string,
  signal: AbortSignal,
): Promise<FritzBoxPeriodKwh | null> {
  const ainParam = ain.trim()
  for (const origin of fritzWebOrigins(conn)) {
    try {
      const sid = await loginSid(conn, origin, signal)
      const res = await webFetch(conn, origin, AHA_PATH, {
        signal,
        query: { sid, ain: ainParam, switchcmd: 'getbasicdevicestats' },
      })
      if (!res.ok) continue
      const xml = await res.text()
      if (!/<energy/i.test(xml)) continue
      return periodKwhFromSeries(parseBasicDeviceStatsXml(xml).energies)
    } catch {
      continue
    }
  }
  return null
}

/** Verbrauchshistorie von der FRITZ!Box (REST, sonst AHA getbasicdevicestats). */
export async function fetchFritzEnergyHistoryFromBox(
  conn: FritzBoxConnection,
  ain: string,
  signal: AbortSignal,
): Promise<FritzBoxPeriodKwh | null> {
  return runWithTr064NodeFetch(conn, async () => {
    const rest = await fetchRestPeriodKwh(conn, ain, signal)
    if (rest) return rest
    return fetchAhaBasicStats(conn, ain, signal)
  })
}
