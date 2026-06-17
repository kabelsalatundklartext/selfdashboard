import { logPluginApiFailure } from '../_shared/log'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import { createPluginServerCache } from '../_shared/plugin-server-cache'

/** Inlined — volume server.mjs must not import @/lib (Next.js). */
type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Carrier endpoints (login-free, no API key). All reverse-engineered from the
// carriers' own public tracking pages — best-effort, may change without notice.
//   DHL    — stable public JSON behind dhl.de/int-verfolgen
//   Hermes — stable public JSON on api.my-deliveries.de
//   DPD    — public REST, but behind an Akamai anti-bot WAF (experimental)
//   GLS    — retired its login-free endpoint in 2024/25 → not supported
// ---------------------------------------------------------------------------

const DHL_URL = 'https://www.dhl.de/int-verfolgen/data/search'
const HERMES_URL = 'https://api.my-deliveries.de/tnt/parcelservice/parceldetails'
const DPD_URL = 'https://tracking.dpd.de/rest/plc/de_DE'

const FETCH_TIMEOUT_MS = 12_000
const CACHE_TTL_MS = 10 * 60 * 1000
/** Unknown numbers cache briefly so repeat polls don't re-fan-out, but expire
 * fast in case a freshly created label only just appeared in the carrier system. */
const NEG_CACHE_TTL_MS = 3 * 60 * 1000
const CACHE_MAX = 256
const MIN_NUMBER_LEN = 6
const MAX_NUMBER_LEN = 40

/** A browser-like UA is the one header that reliably gets past the carriers'
 * bot filters; bare HTTP clients get blocked or hang. */
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'de-DE,de;q=0.9',
}

const cache = createPluginServerCache({ ttlMs: CACHE_TTL_MS, maxEntries: CACHE_MAX })
const negCache = createPluginServerCache({ ttlMs: NEG_CACHE_TTL_MS, maxEntries: CACHE_MAX })

// ---------------------------------------------------------------------------
// Normalized result shape — every carrier parser produces this.
// ---------------------------------------------------------------------------

type TrackState = 'delivered' | 'transit' | 'problem' | 'unknown'

type TrackEvent = {
  /** ISO-ish timestamp string as returned by the carrier. */
  date: string
  text: string
  location?: string
}

type Carrier = 'dhl' | 'hermes' | 'dpd'

type TrackResult = {
  carrier: Carrier
  number: string
  found: boolean
  state: TrackState
  /** Human-readable current status line. */
  status: string
  /** 0..1 delivery progress, when the carrier exposes it. */
  progress?: number
  /** Estimated delivery date (ISO) when available. */
  eta?: string
  lastEvent?: TrackEvent
  events: TrackEvent[]
}

const KNOWN_CARRIERS: Carrier[] = ['dhl', 'hermes', 'dpd']
/** Order used when carrier is "auto" — cheapest/most reliable first. */
const AUTO_ORDER: Carrier[] = ['dhl', 'hermes', 'dpd']

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

/** Validate the tracking number: whitespace is dropped, then it must be purely
 * alphanumeric within length bounds. Rejecting (not stripping) keeps the error
 * honest and avoids ever interpolating unexpected characters into a URL. */
function sanitizeNumber(raw: string): string | null {
  const stripped = raw.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9]+$/.test(stripped)) return null
  if (stripped.length < MIN_NUMBER_LEN || stripped.length > MAX_NUMBER_LEN) return null
  return stripped
}

const DELIVERED_HINTS = [
  'zugestellt',
  'ausgeliefert',
  'abgeholt',
  'delivered',
  'picked up',
  'pick-up was successful',
]
const PROBLEM_HINTS = [
  'nicht zugestellt',
  'nicht angetroffen',
  'konnte nicht',
  'rücksendung',
  'retoure',
  'verzöger',
  'fehlgeschlagen',
  'problem',
  'filiale abgeholt werden',
  'abholung',
  'not delivered',
  'failed',
  'returned',
]

function matchesAny(text: string, hints: string[]): boolean {
  const lower = text.toLowerCase()
  return hints.some((h) => lower.includes(h))
}

/** Decide the coarse state from status text + an optional delivered flag. */
function deriveState(statusText: string, deliveredFlag?: boolean): TrackState {
  if (deliveredFlag === true || matchesAny(statusText, DELIVERED_HINTS)) return 'delivered'
  if (matchesAny(statusText, PROBLEM_HINTS)) return 'problem'
  if (statusText) return 'transit'
  return 'unknown'
}

function lastOf<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr[arr.length - 1] : undefined
}

function emptyResult(carrier: Carrier, number: string): TrackResult {
  return { carrier, number, found: false, state: 'unknown', status: '', events: [] }
}

async function fetchCarrier(url: string): Promise<{ status: number; json: unknown; text: string }> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchWithSsrfGuard(url, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      cache: 'no-store',
      signal: ac.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { status: res.status, json, text }
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// DHL — https://www.dhl.de/int-verfolgen/data/search?piececode=...
// ---------------------------------------------------------------------------

function parseDhl(number: string, json: unknown): TrackResult {
  if (!isObj(json)) return emptyResult('dhl', number)

  const sendungen = asArray(json.sendungen).filter(isObj)
  if (sendungen.length === 0) return emptyResult('dhl', number)

  // Prefer the entry whose id matches; skip archived ones.
  const active = sendungen.filter((s) => {
    const info = isObj(s.sendungsinfo) ? s.sendungsinfo : {}
    return str(info.sendungsliste).toUpperCase() !== 'ARCHIVIERT'
  })
  const pool = active.length > 0 ? active : sendungen
  const match = pool.find((s) => str(s.id) === number) ?? pool[0]

  const details = isObj(match.sendungsdetails) ? match.sendungsdetails : {}
  const verlauf = isObj(details.sendungsverlauf) ? details.sendungsverlauf : {}

  const events: TrackEvent[] = asArray(verlauf.events)
    .filter(isObj)
    .map((e) => ({ date: str(e.datum), text: str(e.status), location: str(e.ort) || undefined }))
    .filter((e) => e.text || e.date)

  const kurz = str(verlauf.kurzStatus)
  const last = lastOf(events)
  const statusText = kurz || last?.text || ''

  const fortschritt = Number(verlauf.fortschritt)
  const maxRaw = Number(verlauf.maximalFortschritt)
  const maxFortschritt = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 5
  const progress =
    Number.isFinite(fortschritt) && maxFortschritt > 0
      ? Math.max(0, Math.min(1, fortschritt / maxFortschritt))
      : undefined
  const deliveredFlag = Number.isFinite(fortschritt) ? fortschritt >= maxFortschritt : undefined

  const zustellung = isObj(details.zustellung) ? details.zustellung : {}
  const eta = str(zustellung.zustellzeitfenster) || str(zustellung.zustelldatum) || undefined

  if (events.length === 0 && !kurz) return emptyResult('dhl', number)

  return {
    carrier: 'dhl',
    number,
    found: true,
    state: deriveState(statusText, deliveredFlag),
    status: statusText,
    progress,
    eta,
    lastEvent: last,
    events,
  }
}

async function trackDhl(number: string): Promise<TrackResult> {
  const url = `${DHL_URL}?${new URLSearchParams({
    piececode: number,
    noRedirect: 'true',
    language: 'de',
    cid: 'app',
  }).toString()}`
  const { status, json } = await fetchCarrier(url)
  if (status >= 500) throw new Error(`dhl_http_${status}`)
  return parseDhl(number, json)
}

// ---------------------------------------------------------------------------
// Hermes — https://api.my-deliveries.de/tnt/parcelservice/parceldetails/<nr>
// History field names are undocumented; parse defensively.
// ---------------------------------------------------------------------------

function pickHistoryArray(root: Record<string, unknown>, statusObj: Record<string, unknown>): unknown[] {
  const candidates = [
    statusObj.statusList,
    statusObj.history,
    statusObj.events,
    root.statusList,
    root.parcelHistory,
    root.history,
    root.events,
  ]
  for (const c of candidates) {
    const arr = asArray(c)
    if (arr.length > 0) return arr
  }
  return []
}

function parseHermesEvent(raw: unknown): TrackEvent | null {
  if (!isObj(raw)) return null
  const textObj = isObj(raw.text) ? raw.text : {}
  const text =
    str(raw.longText) || str(textObj.longText) || str(raw.statusText) || str(raw.description) || str(raw.status)
  const date = str(raw.dateTime) || str(raw.timestamp) || str(raw.date) || str(raw.eventDate)
  const location = str(raw.location) || str(raw.city) || str(raw.place) || undefined
  if (!text && !date) return null
  return { date, text, location }
}

function parseHermes(number: string, json: unknown): TrackResult {
  if (!isObj(json)) return emptyResult('hermes', number)

  const statusObj = isObj(json.status) ? json.status : null
  if (!statusObj) return emptyResult('hermes', number)

  const textObj = isObj(statusObj.text) ? statusObj.text : {}
  const statusText = str(textObj.longText) || str(textObj.shortText) || str(statusObj.parcelStatus)
  if (!statusText) return emptyResult('hermes', number)

  const forecast = isObj(json.forecast) ? json.forecast : {}
  const eta = str(forecast.deliveryDate) || undefined

  const events: TrackEvent[] = pickHistoryArray(json, statusObj)
    .map(parseHermesEvent)
    .filter((e): e is TrackEvent => e !== null)

  const last = lastOf(events)

  return {
    carrier: 'hermes',
    number,
    found: true,
    state: deriveState(statusText),
    status: statusText,
    eta,
    lastEvent: last ?? { date: '', text: statusText },
    events: events.length > 0 ? events : [{ date: '', text: statusText }],
  }
}

async function trackHermes(number: string): Promise<TrackResult> {
  const url = `${HERMES_URL}/${encodeURIComponent(number)}`
  const { status, json } = await fetchCarrier(url)
  if (status === 404) return emptyResult('hermes', number)
  if (status >= 500) throw new Error(`hermes_http_${status}`)
  return parseHermes(number, json)
}

// ---------------------------------------------------------------------------
// DPD — https://tracking.dpd.de/rest/plc/de_DE/<nr>
// Two response shapes exist (parcellifecycle | TrackingStatusJSON). Akamai WAF
// frequently blocks non-browser clients → treat failures as "unavailable".
// ---------------------------------------------------------------------------

function joinDateTime(date: unknown, time: unknown): string {
  const d = str(date)
  const t = str(time)
  return [d, t].filter(Boolean).join(' ')
}

function contentLines(v: unknown): string {
  if (!isObj(v)) return ''
  return asArray(v.content)
    .map((c) => str(c))
    .filter(Boolean)
    .join(' ')
}

function parseDpdLifecycle(number: string, parcel: Record<string, unknown>): TrackResult {
  const steps = asArray(parcel.statusInfo).filter(isObj)
  const events: TrackEvent[] = steps
    .map((s) => ({
      date: joinDateTime(s.date, s.time),
      text: str(s.label) || contentLines(s.description),
      location: str(s.location) || undefined,
    }))
    .filter((e) => e.text || e.date)

  const current = steps.find((s) => s.isCurrentStatus === true) ?? lastOf(steps)
  const statusText = current
    ? str(current.label) || contentLines(current.description) || str(parcel.shipmentResponsibleStatus)
    : str(parcel.shipmentResponsibleStatus)
  const last = lastOf(events)

  const reached = steps.filter((s) => s.statusHasBeenReached === true).length
  const progress = steps.length > 0 ? Math.max(0, Math.min(1, reached / steps.length)) : undefined

  return {
    carrier: 'dpd',
    number,
    found: events.length > 0 || Boolean(statusText),
    state: deriveState(statusText),
    status: statusText,
    progress,
    lastEvent: last,
    events,
  }
}

function parseDpdStatusJson(number: string, tsj: Record<string, unknown>): TrackResult {
  const infos = asArray(tsj.statusInfos).filter(isObj)
  const events: TrackEvent[] = infos
    .map((s) => {
      const contents = asArray(s.contents).filter(isObj)
      const text = str(s.label) || str(contents[0]?.label)
      return { date: joinDateTime(s.date, s.time), text, location: str(s.location) || undefined }
    })
    .filter((e) => e.text || e.date)

  const shipmentInfo = isObj(tsj.shipmentInfo) ? tsj.shipmentInfo : {}
  const deliveryStatus = Number(shipmentInfo.deliveryStatus)
  const progress = Number.isFinite(deliveryStatus) ? Math.max(0, Math.min(1, deliveryStatus / 5)) : undefined
  const deliveredFlag = Number.isFinite(deliveryStatus) ? deliveryStatus >= 5 : undefined

  const current = infos.find((s) => s.isCurrentStatus === true)
  const last = lastOf(events)
  const statusText = current
    ? str(current.label) || str(asArray(current.contents).filter(isObj)[0]?.label)
    : last?.text || ''

  return {
    carrier: 'dpd',
    number,
    found: events.length > 0 || Boolean(statusText),
    state: deriveState(statusText, deliveredFlag),
    status: statusText,
    progress,
    lastEvent: last,
    events,
  }
}

function parseDpd(number: string, json: unknown): TrackResult {
  if (!isObj(json)) return emptyResult('dpd', number)

  if (isObj(json.parcellifecycle)) {
    const plc = json.parcellifecycle
    const parcel = isObj(plc.parcel) ? plc.parcel : null
    if (parcel) return parseDpdLifecycle(number, parcel)
  }
  if (isObj(json.TrackingStatusJSON)) {
    return parseDpdStatusJson(number, json.TrackingStatusJSON)
  }
  return emptyResult('dpd', number)
}

async function trackDpd(number: string): Promise<TrackResult> {
  const url = `${DPD_URL}/${encodeURIComponent(number)}`
  const { status, json } = await fetchCarrier(url)
  if (status >= 500 || status === 403 || status === 429) throw new Error(`dpd_http_${status}`)
  return parseDpd(number, json)
}

// ---------------------------------------------------------------------------
// 17TRACK aggregator — paid-free fallback for carriers we cannot fetch directly
// (notably DPD, whose own endpoint is bot-blocked). Needs a free API token from
// 17track.net (Settings → Security → Access Key); the widget sends it per request
// in the x-17track-key header. v2.2 flow: register a number once (1 of the free
// quota), then poll gettrackinfo. Carrier is auto-detected (number omits it).
// ---------------------------------------------------------------------------

const SEVENTEENTRACK_BASE = 'https://api.17track.net/track/v2.2'
const ST_NOT_REGISTERED = -18019902

async function st17Post(
  pathSeg: string,
  number: string,
  token: string,
): Promise<{ httpStatus: number; json: unknown }> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchWithSsrfGuard(`${SEVENTEENTRACK_BASE}${pathSeg}`, {
      method: 'POST',
      headers: { '17token': token, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify([{ number }]),
      cache: 'no-store',
      signal: ac.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { httpStatus: res.status, json }
  } finally {
    clearTimeout(timer)
  }
}

/** First rejected-item error code, used to detect "not registered yet". */
function st17RejectedCode(json: unknown): number | null {
  if (!isObj(json)) return null
  const data = isObj(json.data) ? json.data : {}
  const first = asArray(data.rejected).filter(isObj)[0]
  if (first && isObj(first.error)) {
    const code = Number(first.error.code)
    return Number.isFinite(code) ? code : null
  }
  return null
}

/** Throw a stable tracking_* code on auth/quota failure so the UI can explain it. */
function st17AssertOk(httpStatus: number, json: unknown): void {
  if (httpStatus === 401 || httpStatus === 403) throw new Error('tracking_key_invalid')
  const code = isObj(json) ? Number(json.code) : NaN
  // A non-zero top-level code with no data block is a request-level failure
  // (bad/blank token, signature error). Item-level issues live in data.rejected.
  if (Number.isFinite(code) && code !== 0 && !(isObj(json) && isObj(json.data))) {
    throw new Error('tracking_key_invalid')
  }
  const rej = st17RejectedCode(json)
  // -18019903/-18019905 etc. = registration/quota limits.
  if (rej != null && rej !== ST_NOT_REGISTERED && (rej === -18019903 || rej === -18019905)) {
    throw new Error('tracking_quota')
  }
}

function map17State(status: string): TrackState {
  switch (status) {
    case 'Delivered':
      return 'delivered'
    case 'AvailableForPickup':
    case 'DeliveryFailure':
    case 'Exception':
    case 'Expired':
      return 'problem'
    case '':
    case 'NotFound':
      return 'unknown'
    default:
      return 'transit'
  }
}

function parse17Event(raw: unknown): TrackEvent | null {
  if (!isObj(raw)) return null
  const date = str(raw.time_iso) || str(raw.time_utc)
  const text = str(raw.description)
  const addr = isObj(raw.address) ? raw.address : {}
  const location = str(raw.location) || str(addr.city) || str(addr.state) || undefined
  if (!text && !date) return null
  return { date, text, location }
}

function parse17(number: string, json: unknown): TrackResult {
  if (!isObj(json)) return emptyResult('dpd', number)
  const data = isObj(json.data) ? json.data : {}
  const accepted = asArray(data.accepted).filter(isObj)
  const entry = accepted.find((a) => str(a.number) === number) ?? accepted[0]
  const info = entry && isObj(entry.track_info) ? entry.track_info : null
  if (!info) return emptyResult('dpd', number)

  const latestStatus = isObj(info.latest_status) ? info.latest_status : {}
  const statusEnum = str(latestStatus.status)

  const tracking = isObj(info.tracking) ? info.tracking : {}
  const events: TrackEvent[] = asArray(tracking.providers)
    .filter(isObj)
    .flatMap((p) => asArray(p.events))
    .map(parse17Event)
    .filter((e): e is TrackEvent => e !== null)

  // 17track returns latest_event directly and events newest-first; prefer the
  // explicit latest_event so the displayed "last scan" is always the newest.
  const last = (info.latest_event ? parse17Event(info.latest_event) : null) ?? events[0]
  const statusText = last?.text || statusEnum

  if ((statusEnum === '' || statusEnum === 'NotFound') && events.length === 0) {
    return emptyResult('dpd', number)
  }

  return {
    carrier: 'dpd',
    number,
    found: true,
    state: map17State(statusEnum),
    status: statusText,
    lastEvent: last,
    events,
  }
}

async function track17(number: string, token: string): Promise<TrackResult> {
  let res = await st17Post('/gettrackinfo', number, token)
  st17AssertOk(res.httpStatus, res.json)
  if (st17RejectedCode(res.json) === ST_NOT_REGISTERED) {
    const reg = await st17Post('/register', number, token)
    st17AssertOk(reg.httpStatus, reg.json)
    res = await st17Post('/gettrackinfo', number, token)
    st17AssertOk(res.httpStatus, res.json)
  }
  return parse17(number, res.json)
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

function trackOne(carrier: Carrier, number: string, token: string): Promise<TrackResult> {
  switch (carrier) {
    case 'dhl':
      return trackDhl(number)
    case 'hermes':
      return trackHermes(number)
    case 'dpd':
      // DPD's own endpoint is bot-blocked; use 17TRACK when a token is configured.
      return token ? track17(number, token) : trackDpd(number)
  }
}

/** Try carriers in order, return the first that recognizes the number. If every
 * carrier errored (none returned a clean not-found), surface the failure so the
 * caller reports "unreachable" instead of a misleading "not found". */
async function trackAuto(number: string, token: string): Promise<TrackResult> {
  let lastResult: TrackResult | null = null
  let lastError: unknown = null
  for (const carrier of AUTO_ORDER) {
    try {
      const result = await trackOne(carrier, number, token)
      if (result.found) return result
      lastResult = result
    } catch (e) {
      lastError = e
    }
  }
  if (!lastResult && lastError) {
    throw lastError instanceof Error ? lastError : new Error('all_carriers_failed')
  }
  return lastResult ?? emptyResult('dhl', number)
}

async function track(carrier: string, number: string, token: string): Promise<TrackResult> {
  // The token-presence flag is part of the key so adding a 17TRACK key doesn't
  // keep serving a stale "blocked" negative-cache entry for DPD.
  const key = `${carrier}:${number}:${token ? 't' : ''}`
  const cached = (cache.get(key) ?? negCache.get(key)) as TrackResult | null
  if (cached) return cached

  const result =
    carrier === 'auto' ? await trackAuto(number, token) : await trackOne(carrier as Carrier, number, token)
  // Positive hits cache for the normal TTL; unknown numbers cache briefly so
  // repeated polls don't re-hit every carrier, while still picking up new labels.
  if (result.found) cache.set(key, result)
  else negCache.set(key, result)
  return result
}

// ---------------------------------------------------------------------------
// HTTP handler — GET /api/plugins/parcel/track?carrier=<c>&number=<n>
// ---------------------------------------------------------------------------

function isSupportedCarrier(c: string): boolean {
  return c === 'auto' || (KNOWN_CARRIERS as string[]).includes(c)
}

export async function handleParcelRequest(req: Request, path: string[]): Promise<Response> {
  if (req.method !== 'GET') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const action = path[0]?.trim() || new URL(req.url).searchParams.get('action') || 'track'
  if (action !== 'track') {
    return Response.json({ error: 'invalid_action' }, { status: 400 })
  }

  const sp = new URL(req.url).searchParams
  const carrier = (sp.get('carrier') || 'auto').trim().toLowerCase()
  const number = sanitizeNumber(sp.get('number') || '')
  // 17TRACK token travels in a header (not the query) so it never lands in logs.
  const token = (req.headers.get('x-17track-key') || '').trim()

  if (carrier === 'gls') {
    return Response.json(
      {
        error: 'gls_unsupported',
        hint: 'GLS hat seine kostenlose Sendungsverfolgung 2024/25 abgeschaltet (Login/API-Key erforderlich).',
      },
      { status: 400 },
    )
  }
  if (!isSupportedCarrier(carrier)) {
    return Response.json({ error: 'unsupported_carrier' }, { status: 400 })
  }
  if (!number) {
    return Response.json({ error: 'invalid_number' }, { status: 400 })
  }

  try {
    const result = await track(carrier, number, token)
    return Response.json(result)
  } catch (e) {
    // Full error detail goes to the server log only; the client gets a stable
    // code + hint so internal IPs / DNS / TLS strings never leak in responses.
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('parcel', `track:${carrier}`, `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url' }, { status: 400 })
    }
    const aborted = e instanceof Error && e.name === 'AbortError'
    const msg = e instanceof Error ? e.message : String(e)
    void logPluginApiFailure('parcel', `track:${carrier}`, aborted ? 'timeout' : msg)
    // 17TRACK auth/quota failures get their own codes so the UI can tell the user
    // to check the key/quota rather than implying the carrier is unreachable.
    if (!aborted && msg.startsWith('tracking_')) {
      return Response.json(
        { error: msg, carrier, hint: '17TRACK: API-Key und freies Kontingent prüfen.' },
        { status: 502 },
      )
    }
    // DPD's free endpoint sits behind an Akamai bot-WAF that resets non-browser
    // clients (ECONNRESET) — not fixable from a plain server fetch. Without a
    // 17TRACK key, surface a DPD-specific code so the UI points the user straight
    // to DPD's own page instead of a vague "unreachable".
    if (carrier === 'dpd' && !aborted && !token) {
      return Response.json(
        {
          error: 'dpd_blocked',
          carrier,
          hint: 'DPD blockiert automatische Abrufe (Bot-Schutz). Bitte direkt bei DPD verfolgen.',
        },
        { status: 502 },
      )
    }
    return Response.json(
      {
        error: aborted ? 'timeout' : 'fetch_failed',
        carrier,
        hint: 'Server braucht ausgehenden HTTPS-Zugriff auf die Carrier (dhl.de, my-deliveries.de, dpd.de).',
      },
      { status: aborted ? 504 : 502 },
    )
  }
}

export default function parcelServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleParcelRequest(ctx.request, ctx.path)
}
