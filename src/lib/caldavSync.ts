import {
  calendarQuery,
  createDAVClient,
  DAVNamespaceShort,
  getBasicAuthHeaders,
  type DAVCalendar,
  type DAVCalendarObject,
} from 'tsdav'
import { buildVeventIcs, expandIcsString, newCalDavUid, type IcsOccurrence } from '@/lib/calendarIcs'
import {
  buildBegendaCalendarUrl,
  CALENDAR_FETCH_TIMEOUT_MS,
  fixCommonCalDavUrlMistakes,
  isCardDavContactsHost,
  normalizeCalDavHref,
  normalizeCaldavUsername,
  normalizeCalendarHttpUrl,
} from '@/lib/calendarApiShared'
export type CaldavFetchErrorCode =
  | 'upstream_http'
  | 'upstream_network'
  | 'ics_too_large'
  | 'not_calendar_data'
  | 'unauthorized'
  | 'wrong_dav_service'

export type CaldavDiscoverCalendar = {
  url: string
  displayName: string
}

export type CaldavFetchResult =
  | {
      ok: true
      occurrences: IcsOccurrence[]
      via: 'tsdav'
      calendarUrl: string
      /** Roh-Objekte mit ICS-Text vor Expand (Diagnose). */
      rawObjectCount?: number
      calendarsTried?: number
    }
  | { ok: false; error: CaldavFetchErrorCode; status?: number; detail?: string }

export type CaldavDiscoverResult =
  | { ok: true; calendars: CaldavDiscoverCalendar[]; serverUrl: string }
  | { ok: false; error: CaldavFetchErrorCode | 'bad_url'; detail?: string }

export type CaldavWriteAction = 'create' | 'update' | 'delete'

export type CaldavWriteResult =
  | { ok: true; uid: string; objectUrl: string; etag?: string }
  | { ok: false; error: CaldavFetchErrorCode | 'bad_request' | 'not_found'; detail?: string }

type CalDavConn = {
  client: Awaited<ReturnType<typeof createDAVClient>>
  calendar: DAVCalendar
  collectionHref: string
  username: string
  password: string
}

function serverUrlFromCalendarHref(href: string): string {
  const u = new URL(href)
  return `${u.protocol}//${u.host}`
}

function pickCalendar(
  calendars: DAVCalendar[] | undefined | null,
  collectionHref: string,
): DAVCalendar | null {
  const list = calendars ?? []
  if (!list.length) return null
  const norm = collectionHref.replace(/\/$/, '').toLowerCase()
  const exact = list.find((c) => c.url.replace(/\/$/, '').toLowerCase() === norm)
  if (exact) return exact
  const nested = list.find((c) => {
    const cu = c.url.replace(/\/$/, '').toLowerCase()
    return norm.startsWith(cu) || cu.startsWith(norm)
  })
  if (nested) return nested
  return list[0] ?? null
}

function displayNameOf(cal: DAVCalendar): string {
  const dn = cal.displayName
  if (typeof dn === 'string' && dn.trim()) return dn.trim()
  if (dn && typeof dn === 'object' && 'value' in dn && typeof (dn as { value?: unknown }).value === 'string') {
    return String((dn as { value: string }).value).trim()
  }
  try {
    const path = new URL(cal.url).pathname
    const seg = path.split('/').filter(Boolean).pop()
    return seg || cal.url
  } catch {
    return cal.url
  }
}

function resolveCalendarUrlInput(rawUrl: string, username: string): string {
  const urlFix = fixCommonCalDavUrlMistakes(rawUrl)
  let input = urlFix.url || rawUrl
  if (
    username &&
    !/\/begenda\/dav\//i.test(input) &&
    /caldav\.(web\.de|gmx\.net)/i.test(input)
  ) {
    const host = /gmx\.net/i.test(input) ? 'caldav.gmx.net' : 'caldav.web.de'
    input = buildBegendaCalendarUrl(username, host)
  }
  const u = normalizeCalendarHttpUrl(input)
  const { href } = (() => {
    const clean = new URL(u.toString())
    clean.username = ''
    clean.password = ''
    return { href: normalizeCalDavHref(clean.toString()) }
  })()
  return href
}

function calFilenameForUid(uid: string): string {
  const safe = uid.replace(/[^a-zA-Z0-9@._-]+/g, '_').slice(0, 180)
  return safe.endsWith('.ics') ? safe : `${safe}.ics`
}

function joinCalendarObjectUrl(calendarUrl: string, filename: string): string {
  const base = calendarUrl.endsWith('/') ? calendarUrl : `${calendarUrl}/`
  return `${base}${filename}`
}

function mapWriteHttpError(status: number, msg: string): CaldavWriteResult {
  if (status === 401 || status === 403) {
    return { ok: false, error: 'unauthorized', detail: msg }
  }
  if (status === 404) {
    return { ok: false, error: 'not_found', detail: msg }
  }
  return { ok: false, error: 'upstream_http', detail: msg }
}

async function connectCalDav(
  rawCalendarUrl: string,
  username: string,
  password: string,
  signal: AbortSignal,
): Promise<{ ok: true } & CalDavConn | { ok: false; error: CaldavFetchErrorCode; detail?: string }> {
  const user = normalizeCaldavUsername(username, rawCalendarUrl)
  const pass = password.trim()
  if (!user || !pass) {
    return { ok: false, error: 'unauthorized', detail: 'username and password required' }
  }

  let collectionHref: string
  try {
    collectionHref = resolveCalendarUrlInput(rawCalendarUrl, user)
    if (isCardDavContactsHost(new URL(collectionHref).hostname)) {
      return {
        ok: false,
        error: 'wrong_dav_service',
        detail: 'carddav.web.de is contacts — use caldav.web.de for calendars',
      }
    }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    if (code === 'wrong_dav_service') return { ok: false, error: 'wrong_dav_service', detail: code }
    if (code === 'missing_begenda_path') {
      return {
        ok: false,
        error: 'not_calendar_data',
        detail: 'WEB.DE: full URL …/begenda/dav/email@web.de/calendar required',
      }
    }
    return { ok: false, error: 'upstream_http', detail: code }
  }

  const serverUrl = serverUrlFromCalendarHref(collectionHref)
  const ac = new AbortController()
  const onAbort = () => ac.abort()
  signal.addEventListener('abort', onAbort)
  const timer = setTimeout(() => ac.abort(), CALENDAR_FETCH_TIMEOUT_MS)

  try {
    const client = await createDAVClient({
      serverUrl,
      credentials: { username: user, password: pass },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
      fetch: (input, init) =>
        fetch(input, { ...init, signal: ac.signal, cache: 'no-store', redirect: 'follow' }),
    })

    const calendars = (await client.fetchCalendars()) ?? []
    let calendar = pickCalendar(calendars, collectionHref)
    if (!calendar) {
      calendar = { url: collectionHref, displayName: 'calendar' } as DAVCalendar
    }

    return { ok: true, client, calendar, collectionHref, username: user, password: pass }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/401|403|unauthorized|invalid credentials/i.test(msg)) {
      return {
        ok: false,
        error: 'unauthorized',
        detail: 'App-Passwort und volle E-Mail prüfen (WEB.DE/GMX)',
      }
    }
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: 'upstream_network', detail: 'timeout' }
    }
    return { ok: false, error: 'upstream_network', detail: msg }
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}

export async function writeCalDavAllDayEvent(
  rawCalendarUrl: string,
  username: string,
  password: string,
  action: CaldavWriteAction,
  fields: {
    title?: string
    date?: string
    uid?: string
    objectUrl?: string
    etag?: string
    allDay?: boolean
    startTime?: string
    endTime?: string
  },
  signal: AbortSignal,
): Promise<CaldavWriteResult> {
  const conn = await connectCalDav(rawCalendarUrl, username, password, signal)
  if (!conn.ok) return conn

  try {
    if (action === 'create') {
      const title = fields.title?.trim()
      const date = fields.date?.trim()
      if (!title || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { ok: false, error: 'bad_request', detail: 'title and date (YYYY-MM-DD) required' }
      }
      const uid = fields.uid?.trim() || newCalDavUid()
      const iCalString = buildVeventIcs({
        uid,
        title,
        date,
        allDay: fields.allDay,
        startTime: fields.startTime,
        endTime: fields.endTime,
      })
      const filename = calFilenameForUid(uid)
      const res = await conn.client.createCalendarObject({
        calendar: conn.calendar,
        filename,
        iCalString,
      })
      if (!res.ok) {
        return mapWriteHttpError(res.status, `create failed (${res.status})`)
      }
      const objectUrl = joinCalendarObjectUrl(conn.calendar.url, filename)
      const etag = res.headers.get('etag') ?? undefined
      return { ok: true, uid, objectUrl, etag }
    }

    if (action === 'update') {
      const objectUrl = fields.objectUrl?.trim()
      const title = fields.title?.trim()
      const date = fields.date?.trim()
      const uid = fields.uid?.trim()
      if (!objectUrl || !title || !date || !uid || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { ok: false, error: 'bad_request', detail: 'objectUrl, uid, title and date required' }
      }
      const iCalString = buildVeventIcs({
        uid,
        title,
        date,
        allDay: fields.allDay,
        startTime: fields.startTime,
        endTime: fields.endTime,
      })
      const calendarObject: DAVCalendarObject = {
        url: objectUrl,
        data: iCalString,
        etag: fields.etag,
      }
      const res = await conn.client.updateCalendarObject({ calendarObject })
      if (!res.ok) {
        return mapWriteHttpError(res.status, `update failed (${res.status})`)
      }
      const etag = res.headers.get('etag') ?? fields.etag
      return { ok: true, uid, objectUrl, etag }
    }

    const objectUrl = fields.objectUrl?.trim()
    if (!objectUrl) {
      return { ok: false, error: 'bad_request', detail: 'objectUrl required' }
    }
    const calendarObject: DAVCalendarObject = {
      url: objectUrl,
      etag: fields.etag,
    }
    const res = await conn.client.deleteCalendarObject({ calendarObject })
    // 404 = schon weg; 412 = veraltetes ETag (z. B. bereits in WEB.DE gelöscht)
    if (!res.ok && res.status !== 404 && res.status !== 412) {
      return mapWriteHttpError(res.status, `delete failed (${res.status})`)
    }
    return {
      ok: true,
      uid: fields.uid?.trim() || '',
      objectUrl,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/401|403|unauthorized/i.test(msg)) {
      return { ok: false, error: 'unauthorized', detail: msg }
    }
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: 'upstream_network', detail: 'timeout' }
    }
    return { ok: false, error: 'upstream_network', detail: msg }
  }
}

function parseCalendarObjects(
  objects: { data?: unknown; url: string }[],
  rangeStart: Date,
  rangeEnd: Date,
): IcsOccurrence[] {
  const merged: IcsOccurrence[] = []
  const seen = new Set<string>()
  for (const obj of objects) {
    const raw = obj.data
    const text = typeof raw === 'string' ? raw : raw != null ? String(raw) : ''
    if (!text || !/BEGIN:(VEVENT|VCALENDAR)/i.test(text)) continue
    for (const occ of expandIcsString(text, rangeStart, rangeEnd)) {
      if (seen.has(occ.stableId)) continue
      seen.add(occ.stableId)
      merged.push(occ)
    }
  }
  return merged
}

function mergeOccurrences(target: IcsOccurrence[], incoming: IcsOccurrence[]): IcsOccurrence[] {
  const seen = new Set(target.map((o) => o.stableId))
  for (const o of incoming) {
    if (seen.has(o.stableId)) continue
    seen.add(o.stableId)
    target.push(o)
  }
  return target
}

/** tsdav default filter drops URLs without ".ics" — WEB.DE/Begenda often uses opaque paths. */
function caldavObjectUrlFilter(url: string): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  if (u.includes('.vcf')) return false
  if (u.includes('.ics')) return true
  if (/\/begenda\/dav\//i.test(u)) return true
  if (/\/calendar\//i.test(u) && !u.endsWith('/calendar') && !u.endsWith('/calendar/')) return true
  return true
}

function objectHasIcsData(obj: { data?: unknown }): boolean {
  const text = typeof obj.data === 'string' ? obj.data : obj.data != null ? String(obj.data) : ''
  return Boolean(text && /BEGIN:(VEVENT|VCALENDAR)/i.test(text))
}

function resolveObjectHref(href: string, calendarUrl: string): string {
  if (!href) return ''
  if (href.startsWith('http://') || href.startsWith('https://')) return href
  const base = calendarUrl.endsWith('/') ? calendarUrl : `${calendarUrl}/`
  return new URL(href, base).href
}

function extractCalendarDataFromProps(props: unknown): string {
  if (!props || typeof props !== 'object') return ''
  const p = props as Record<string, unknown>
  const raw = p.calendarData ?? p['cal:calendar-data']
  if (typeof raw === 'string' && /BEGIN:(VEVENT|VCALENDAR)/i.test(raw)) return raw
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (typeof o._cdata === 'string') return o._cdata
    if (typeof o.value === 'string') return o.value
  }
  return ''
}

async function fetchIcsBodyDirect(
  objectUrl: string,
  username: string,
  password: string,
  signal: AbortSignal,
): Promise<string> {
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  const res = await fetch(objectUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      Accept: 'text/calendar, text/plain, */*',
    },
    signal,
    cache: 'no-store',
    redirect: 'follow',
  })
  if (!res.ok) return ''
  const text = await res.text()
  if (!text || !/BEGIN:(VEVENT|VCALENDAR)/i.test(text)) return ''
  return text
}

/** tsdav hydrate via objectUrls does not load per-href ICS on many servers — GET each resource. */
async function hydrateCalendarObjects(
  calendar: DAVCalendar,
  objects: DAVCalendarObject[],
  username: string,
  password: string,
  signal: AbortSignal,
): Promise<DAVCalendarObject[]> {
  const out: DAVCalendarObject[] = []
  for (const o of objects) {
    if (objectHasIcsData(o)) {
      out.push(o)
      continue
    }
    if (!o.url) continue
    const href = resolveObjectHref(o.url, calendar.url)
    if (!href) continue
    try {
      const text = await fetchIcsBodyDirect(href, username, password, signal)
      if (text) out.push({ ...o, url: href, data: text })
    } catch {
      /* skip */
    }
  }
  return out
}

const VEVENT_ONLY_FILTERS = [
  {
    'comp-filter': {
      _attributes: { name: 'VCALENDAR' },
      'comp-filter': {
        _attributes: { name: 'VEVENT' },
      },
    },
  },
]

async function fetchObjectsViaListAndGet(
  calendar: DAVCalendar,
  username: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<IcsOccurrence[]> {
  const authHeaders = getBasicAuthHeaders({ username, password })
  const fetchFn = (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, signal, cache: 'no-store', redirect: 'follow' })

  let responses: Awaited<ReturnType<typeof calendarQuery>> = []
  try {
    responses = await calendarQuery({
      url: calendar.url,
      props: {
        [`${DAVNamespaceShort.DAV}:getetag`]: {},
        [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {},
      },
      filters: VEVENT_ONLY_FILTERS,
      depth: '1',
      headers: authHeaders,
      fetch: fetchFn,
    })
  } catch {
    return []
  }

  const objects: DAVCalendarObject[] = []
  const seenUrl = new Set<string>()

  if (!Array.isArray(responses)) return []

  for (const res of responses) {
    const href = resolveObjectHref(res.href ?? '', calendar.url)
    if (!href || !caldavObjectUrlFilter(href)) continue
    const key = href.replace(/\/$/, '').toLowerCase()
    if (seenUrl.has(key)) continue
    seenUrl.add(key)

    let data = extractCalendarDataFromProps(res.props)
    if (!data) {
      data = await fetchIcsBodyDirect(href, username, password, signal)
    }
    if (data) {
      const etagVal = (res.props as { getetag?: unknown } | undefined)?.getetag
      objects.push({
        url: href,
        data,
        etag: etagVal != null ? String(etagVal) : undefined,
      })
    }
  }

  return parseCalendarObjects(objects, rangeStart, rangeEnd)
}

async function fetchObjectsForCalendar(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  calendar: DAVCalendar,
  rangeStart: Date,
  rangeEnd: Date,
  username: string,
  password: string,
  signal: AbortSignal,
): Promise<{ occurrences: IcsOccurrence[]; rawObjectCount: number }> {
  const timeRange = { start: rangeStart.toISOString(), end: rangeEnd.toISOString() }
  const urlFilter = caldavObjectUrlFilter
  const attempts: {
    useMultiGet: boolean
    expand: boolean
    timeRange?: { start: string; end: string }
    filters?: typeof VEVENT_ONLY_FILTERS
  }[] = [
    { useMultiGet: false, expand: false, filters: VEVENT_ONLY_FILTERS },
    { useMultiGet: false, expand: false },
    { useMultiGet: false, expand: false, timeRange },
    { useMultiGet: false, expand: true, timeRange },
    { useMultiGet: true, expand: false, timeRange },
    { useMultiGet: false, expand: true },
    { useMultiGet: false, expand: false, timeRange },
  ]
  let best: IcsOccurrence[] = []
  let bestRaw = 0
  for (const opts of attempts) {
    try {
      let objects =
        (await client.fetchCalendarObjects({
          calendar,
          ...(opts.filters ? { filters: opts.filters } : {}),
          ...(opts.timeRange ? { timeRange: opts.timeRange } : {}),
          expand: opts.expand,
          useMultiGet: opts.useMultiGet,
          urlFilter,
        })) ?? []
      const rawListed = objects.length
      objects = await hydrateCalendarObjects(calendar, objects, username, password, signal)
      const withData = objects.filter((o) => objectHasIcsData(o)).length
      if (withData > bestRaw) bestRaw = withData
      const occ = parseCalendarObjects(objects, rangeStart, rangeEnd)
      if (occ.length > best.length) best = occ
      if (occ.length > 0) return { occurrences: occ, rawObjectCount: withData }
    } catch {
      /* try next strategy */
    }
  }

  if (best.length === 0) {
    const viaList = await fetchObjectsViaListAndGet(
      calendar,
      username,
      password,
      rangeStart,
      rangeEnd,
      signal,
    )
    if (viaList.length > 0) {
      return { occurrences: viaList, rawObjectCount: viaList.length }
    }
  }

  return { occurrences: best, rawObjectCount: bestRaw }
}

function calendarsForFetch(
  all: DAVCalendar[] | undefined | null,
  collectionHref: string,
  primary: DAVCalendar,
): DAVCalendar[] {
  const list = all ?? []
  if (!list.length) return [primary]
  const norm = collectionHref.replace(/\/$/, '').toLowerCase()
  const related = list.filter((c) => {
    const u = c.url.replace(/\/$/, '').toLowerCase()
    if (u === norm || norm.startsWith(u) || u.startsWith(norm)) return true
    if (/\/begenda\/dav\//i.test(norm) && /begenda/i.test(u)) {
      const normBase = norm.replace(/\/calendar\/?$/, '')
      return u.startsWith(normBase) || normBase.startsWith(u)
    }
    return false
  })
  if (related.length > 0) return related
  // WEB.DE: alle entdeckten Kalender durchsuchen, falls die konfigurierte URL nicht die Event-Collection ist
  if (/\/begenda\/dav\//i.test(norm) && list.length > 0) return list
  return [primary]
}

export async function discoverCalDavCalendars(
  rawCalendarUrl: string,
  username: string,
  password: string,
): Promise<CaldavDiscoverResult> {
  const user = normalizeCaldavUsername(username, rawCalendarUrl)
  const pass = password.trim()
  if (!user || !pass) {
    return { ok: false, error: 'unauthorized', detail: 'username and password required' }
  }

  let collectionHref: string
  try {
    collectionHref = resolveCalendarUrlInput(rawCalendarUrl, user)
    if (isCardDavContactsHost(new URL(collectionHref).hostname)) {
      return { ok: false, error: 'wrong_dav_service', detail: 'carddav is for contacts' }
    }
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return { ok: false, error: code === 'wrong_dav_service' ? 'wrong_dav_service' : 'bad_url', detail: code }
  }

  const serverUrl = serverUrlFromCalendarHref(collectionHref)
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), CALENDAR_FETCH_TIMEOUT_MS)

  try {
    const client = await createDAVClient({
      serverUrl,
      credentials: { username: user, password: pass },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
      fetch: (input, init) =>
        fetch(input, { ...init, signal: ac.signal, cache: 'no-store', redirect: 'follow' }),
    })

    const calendars = (await client.fetchCalendars()) ?? []
    const list = calendars.map((c) => ({
      url: c.url,
      displayName: displayNameOf(c),
    }))
    if (list.length === 0) {
      return {
        ok: true,
        calendars: [{ url: collectionHref, displayName: 'Default' }],
        serverUrl,
      }
    }
    return { ok: true, calendars: list, serverUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/401|403|unauthorized/i.test(msg)) {
      return { ok: false, error: 'unauthorized', detail: msg }
    }
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: 'upstream_network', detail: 'timeout' }
    }
    return { ok: false, error: 'upstream_network', detail: msg }
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchCalDavOccurrencesTsdav(
  rawCalendarUrl: string,
  username: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<CaldavFetchResult> {
  const conn = await connectCalDav(rawCalendarUrl, username, password, signal)
  if (!conn.ok) {
    return {
      ok: false,
      error: conn.error,
      status: conn.error === 'unauthorized' ? 401 : undefined,
      detail: conn.detail,
    }
  }

  try {
    let calendar = conn.calendar
    let occurrences: IcsOccurrence[] = []
    let rawObjectCount = 0
    const allCals = (await conn.client.fetchCalendars()) ?? []
    const targets = calendarsForFetch(allCals, conn.collectionHref, calendar)
    const seenCal = new Set<string>()
    for (const cal of targets) {
      const key = cal.url.replace(/\/$/, '').toLowerCase()
      if (seenCal.has(key)) continue
      seenCal.add(key)
      const pulled = await fetchObjectsForCalendar(
        conn.client,
        cal,
        rangeStart,
        rangeEnd,
        conn.username,
        conn.password,
        signal,
      )
      rawObjectCount += pulled.rawObjectCount
      mergeOccurrences(occurrences, pulled.occurrences)
    }

    if (occurrences.length === 0) {
      const direct = { url: conn.collectionHref, displayName: 'calendar' } as DAVCalendar
      const dkey = direct.url.replace(/\/$/, '').toLowerCase()
      if (!seenCal.has(dkey)) {
        seenCal.add(dkey)
        const directPulled = await fetchObjectsForCalendar(
          conn.client,
          direct,
          rangeStart,
          rangeEnd,
          conn.username,
          conn.password,
          signal,
        )
        rawObjectCount += directPulled.rawObjectCount
        mergeOccurrences(occurrences, directPulled.occurrences)
        if (directPulled.occurrences.length > 0) calendar = direct
      }
    }

    return {
      ok: true,
      occurrences,
      via: 'tsdav',
      calendarUrl: calendar.url,
      rawObjectCount,
      calendarsTried: seenCal.size,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/401|403|unauthorized|invalid credentials/i.test(msg)) {
      return {
        ok: false,
        error: 'unauthorized',
        status: 401,
        detail: 'App-Passwort und volle E-Mail prüfen (WEB.DE/GMX)',
      }
    }
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: 'upstream_network', detail: 'timeout' }
    }
    return { ok: false, error: 'upstream_network', detail: msg }
  }
}
