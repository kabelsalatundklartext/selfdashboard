import { logPluginApiFailure } from '../_shared/log'
import { fetchWithSsrfGuard, assertSafeOutboundUrlResolved, UnsafeOutboundUrlError } from '../_shared/ssrf'
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
//   DPD    — server-rendered milestone status scraped from my.dpd.de (the JSON
//            endpoint on tracking.dpd.de is bot-WAF-blocked); needs a session.
//   UPS    — link-only. UPS blocks all free/scraping access via Akamai Bot
//            Manager and its official API needs a paid-tier key, so the widget
//            only deep-links to ups.com (no automatic status).
//   GLS    — retired its login-free endpoint in 2024/25 → not supported
// ---------------------------------------------------------------------------

const DHL_URL = 'https://www.dhl.de/int-verfolgen/data/search'
const HERMES_URL = 'https://api.my-deliveries.de/tnt/parcelservice/parceldetails'

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

type Carrier = 'dhl' | 'hermes' | 'dpd' | 'ups'

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

const KNOWN_CARRIERS: Carrier[] = ['dhl', 'hermes', 'dpd', 'ups']
/** Order used when carrier is "auto" — cheapest/most reliable first. UPS is not
 * here: it has no free lookup, so auto can't resolve it (UPS is link-only). */
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
// DPD — free status from my.dpd.de. DPD's own JSON endpoint
// (tracking.dpd.de/rest/plc) sits behind an Akamai WAF that resets non-browser
// clients, but my.dpd.de server-renders the milestone status into its tracking
// page. That page needs an ASP.NET session, so we follow the official entry
// redirect (which sets the session cookie) and read the status spans from the HTML.
// ---------------------------------------------------------------------------

const DPD_ENTRY_URL = 'https://my.dpd.de/redirect.aspx?action=12&parcelno='
const DPD_PAGE_HOST = 'https://my.dpd.de/'

/** Ordered milestone span-id tails on the my.dpd.de tracking page. */
const DPD_MILESTONES = [
  'labStatusStart',
  'labStatusOnTheRoad',
  'labStatusDeliveryDepot',
  'labStatusCarLoad',
  'labStatusDelivered',
] as const

const DPD_HTML_HEADERS: Record<string, string> = {
  'User-Agent': BROWSER_HEADERS['User-Agent'],
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9',
}

/** Merge Set-Cookie lines from a response into the jar (name → value). */
function collectCookies(res: Response, jar: Map<string, string>): void {
  const h = res.headers as unknown as { getSetCookie?: () => string[] }
  const lines =
    typeof h.getSetCookie === 'function' ? h.getSetCookie() : [res.headers.get('set-cookie') ?? '']
  for (const line of lines) {
    const m = line.match(/^\s*([^=;]+)=([^;]*)/)
    if (m) jar.set(m[1].trim(), m[2])
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

/**
 * Follow the my.dpd.de entry-redirect chain with a cookie jar (SSRF-checked per
 * hop) and return the final HTML. fetchWithSsrfGuard can't be reused here because
 * it doesn't carry Set-Cookie across redirects, which the ASP.NET session needs.
 */
async function fetchDpdPage(number: string, signal: AbortSignal): Promise<string> {
  const jar = new Map<string, string>()
  let url = `${DPD_ENTRY_URL}${encodeURIComponent(number)}`
  let referer = DPD_PAGE_HOST
  for (let hop = 0; hop < 6; hop++) {
    await assertSafeOutboundUrlResolved(url)
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...DPD_HTML_HEADERS,
        Referer: referer,
        ...(jar.size ? { Cookie: cookieHeader(jar) } : {}),
      },
      redirect: 'manual',
      cache: 'no-store',
      signal,
    })
    collectCookies(res, jar)
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return ''
      referer = url
      url = new URL(loc, url).href
      continue
    }
    if (res.status !== 200) throw new Error(`dpd_http_${res.status}`)
    return res.text()
  }
  throw new Error('dpd_too_many_redirects')
}

/** Trimmed text of a span by the tail of its id (the closing quote anchors it so
 * 'labStatusStart' does not also match 'labStatusStartDate'). */
function dpdSpanText(html: string, idTail: string): string {
  const m = html.match(new RegExp(`id="[^"]*${idTail}"[^>]*>([\\s\\S]*?)</span>`, 'i'))
  if (!m) return ''
  return m[1]
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDpdPage(number: string, html: string): TrackResult {
  // A milestone counts as reached once DPD prints a date next to its label.
  const reached: TrackEvent[] = []
  for (const id of DPD_MILESTONES) {
    const label = dpdSpanText(html, id)
    const date = dpdSpanText(html, `${id}Date`)
    if (label && date) reached.push({ date, text: label })
  }
  if (reached.length === 0) return emptyResult('dpd', number)

  const last = lastOf(reached)
  const delivered = Boolean(dpdSpanText(html, 'labStatusDeliveredDate'))
  const statusText = last?.text || ''

  return {
    carrier: 'dpd',
    number,
    found: true,
    state: deriveState(statusText, delivered),
    status: statusText,
    progress: Math.max(0, Math.min(1, reached.length / DPD_MILESTONES.length)),
    lastEvent: last,
    events: reached,
  }
}

async function trackDpd(number: string): Promise<TrackResult> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const html = await fetchDpdPage(number, ac.signal)
    return parseDpdPage(number, html)
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

function trackOne(carrier: Carrier, number: string): Promise<TrackResult> {
  switch (carrier) {
    case 'dhl':
      return trackDhl(number)
    case 'hermes':
      return trackHermes(number)
    case 'dpd':
      return trackDpd(number)
    case 'ups':
      // UPS is link-only: no free access (Akamai blocks scraping) and the official
      // API needs a paid-tier key. The widget shows a "view on UPS" link and never
      // calls the server for UPS; if hit directly we just return no data.
      return Promise.resolve(emptyResult('ups', number))
  }
}

/** Try carriers in order, return the first that recognizes the number. If every
 * carrier errored (none returned a clean not-found), surface the failure so the
 * caller reports "unreachable" instead of a misleading "not found". */
async function trackAuto(number: string): Promise<TrackResult> {
  let lastResult: TrackResult | null = null
  let lastError: unknown = null
  for (const carrier of AUTO_ORDER) {
    try {
      const result = await trackOne(carrier, number)
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

async function track(carrier: string, number: string): Promise<TrackResult> {
  const key = `${carrier}:${number}`
  const cached = (cache.get(key) ?? negCache.get(key)) as TrackResult | null
  if (cached) return cached

  const result = carrier === 'auto' ? await trackAuto(number) : await trackOne(carrier as Carrier, number)
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
    const result = await track(carrier, number)
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
    // If the my.dpd.de status page is unreachable or changed shape, fall back to
    // a DPD-specific code so the UI points the user to DPD's own page.
    if (carrier === 'dpd' && !aborted) {
      return Response.json(
        {
          error: 'dpd_blocked',
          carrier,
          hint: 'DPD-Status gerade nicht abrufbar. Bitte direkt bei DPD verfolgen.',
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
