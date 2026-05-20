import 'server-only'
import { createHash, pbkdf2Sync } from 'node:crypto'
import type { FritzBoxConnection } from '@/lib/fritzboxTr064'
import { runWithTr064NodeFetch } from '@/lib/tr064NodeFetch'

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
  const { query: _q, ...rest } = init ?? {}
  return fetch(url.toString(), rest)
}

async function loginSid(conn: FritzBoxConnection, origin: string, signal: AbortSignal): Promise<string> {
  const loginUrl = `${origin}${LOGIN_PATH}`
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

function mergeDaily(target: Record<string, number>, add: Record<string, number>): void {
  for (const [k, v] of Object.entries(add)) {
    if (v > 0) target[k] = Math.max(target[k] ?? 0, v)
  }
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
  const now = Date.now()
  let todayKwh = 0
  let last7DaysKwh = 0
  let monthKwh = 0

  for (const s of energies) {
    const kwh = sumWhToKwh(s.values)
    const p = s.period.toLowerCase()
    if (p === 'day' || p === 'today') {
      todayKwh = Math.max(todayKwh, kwh)
      mergeDaily(dailyKwh, dailyFromBuckets(s.values, s.interval || 900, now))
    } else if (p === 'week' || p === '7days') {
      last7DaysKwh = Math.max(last7DaysKwh, kwh)
      mergeDaily(dailyKwh, dailyFromBuckets(s.values, s.interval || 21_600, now))
    } else if (p === 'month') {
      monthKwh = Math.max(monthKwh, kwh)
      mergeDaily(dailyKwh, dailyFromBuckets(s.values, s.interval || 86_400, now))
    }
  }

  return { todayKwh, last7DaysKwh, monthKwh, dailyKwh }
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
      const energies = unit.statistics?.energies ?? []
      if (energies.length === 0) continue

      const dailyKwh: Record<string, number> = {}
      const now = Date.now()
      let todayKwh = 0
      let last7DaysKwh = 0
      let monthKwh = 0

      for (const e of energies) {
        const vals = (e.values ?? []).map((v) => (typeof v === 'number' ? v : 0))
        const kwh = sumWhToKwh(vals)
        const p = String(e.period ?? '').toLowerCase()
        if (p === 'day') {
          todayKwh = kwh
          mergeDaily(dailyKwh, dailyFromBuckets(vals, e.interval || 900, now))
        } else if (p === 'week') {
          last7DaysKwh = kwh
          mergeDaily(dailyKwh, dailyFromBuckets(vals, e.interval || 21_600, now))
        } else if (p === 'month') {
          monthKwh = kwh
          mergeDaily(dailyKwh, dailyFromBuckets(vals, e.interval || 86_400, now))
        }
      }

      return { todayKwh, last7DaysKwh, monthKwh, dailyKwh }
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
