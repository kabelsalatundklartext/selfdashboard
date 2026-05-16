import { createDAVClient, type DAVCalendar, type DAVCalendarObject } from 'tsdav'
import { buildAllDayVeventIcs, expandIcsString, newCalDavUid, type IcsOccurrence } from '@/lib/calendarIcs'
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
  | { ok: true; occurrences: IcsOccurrence[]; via: 'tsdav'; calendarUrl: string }
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
}

function serverUrlFromCalendarHref(href: string): string {
  const u = new URL(href)
  return `${u.protocol}//${u.host}`
}

function pickCalendar(calendars: DAVCalendar[], collectionHref: string): DAVCalendar | null {
  if (!calendars.length) return null
  const norm = collectionHref.replace(/\/$/, '').toLowerCase()
  const exact = calendars.find((c) => c.url.replace(/\/$/, '').toLowerCase() === norm)
  if (exact) return exact
  const nested = calendars.find((c) => {
    const cu = c.url.replace(/\/$/, '').toLowerCase()
    return norm.startsWith(cu) || cu.startsWith(norm)
  })
  if (nested) return nested
  return calendars[0] ?? null
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

    const calendars = await client.fetchCalendars()
    let calendar = pickCalendar(calendars, collectionHref)
    if (!calendar) {
      calendar = { url: collectionHref, displayName: 'calendar' } as DAVCalendar
    }

    return { ok: true, client, calendar, collectionHref }
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
      const iCalString = buildAllDayVeventIcs({ uid, title, date })
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
      const iCalString = buildAllDayVeventIcs({ uid, title, date })
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
    if (!res.ok && res.status !== 404) {
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

async function fetchObjectsForCalendar(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  calendar: DAVCalendar,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<IcsOccurrence[]> {
  const timeRange = { start: rangeStart.toISOString(), end: rangeEnd.toISOString() }
  const attempts: { useMultiGet: boolean; expand: boolean; timeRange?: { start: string; end: string } }[] = [
    { useMultiGet: true, expand: true, timeRange },
    { useMultiGet: true, expand: false, timeRange },
    { useMultiGet: false, expand: true, timeRange },
    { useMultiGet: false, expand: false, timeRange },
    { useMultiGet: true, expand: true },
    { useMultiGet: false, expand: false },
  ]
  let best: IcsOccurrence[] = []
  for (const opts of attempts) {
    try {
      const objects = await client.fetchCalendarObjects({
        calendar,
        ...(opts.timeRange ? { timeRange: opts.timeRange } : {}),
        expand: opts.expand,
        useMultiGet: opts.useMultiGet,
      })
      const occ = parseCalendarObjects(objects, rangeStart, rangeEnd)
      if (occ.length > best.length) best = occ
      if (occ.length > 0) return occ
    } catch {
      /* try next strategy */
    }
  }
  return best
}

function calendarsForFetch(
  all: DAVCalendar[],
  collectionHref: string,
  primary: DAVCalendar,
): DAVCalendar[] {
  if (!all.length) return [primary]
  const norm = collectionHref.replace(/\/$/, '').toLowerCase()
  const related = all.filter((c) => {
    const u = c.url.replace(/\/$/, '').toLowerCase()
    if (u === norm || norm.startsWith(u) || u.startsWith(norm)) return true
    if (/\/begenda\/dav\//i.test(norm) && /begenda/i.test(u)) {
      const normBase = norm.replace(/\/calendar\/?$/, '')
      return u.startsWith(normBase) || normBase.startsWith(u)
    }
    return false
  })
  if (related.length > 0) return related
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

    const calendars = await client.fetchCalendars()
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
    let occurrences = await fetchObjectsForCalendar(conn.client, calendar, rangeStart, rangeEnd)

    if (
      occurrences.length === 0 &&
      calendar.url.replace(/\/$/, '') !== conn.collectionHref.replace(/\/$/, '')
    ) {
      const direct = { url: conn.collectionHref, displayName: 'calendar' } as DAVCalendar
      const directOcc = await fetchObjectsForCalendar(conn.client, direct, rangeStart, rangeEnd)
      mergeOccurrences(occurrences, directOcc)
      if (directOcc.length > 0) calendar = direct
    }

    if (occurrences.length === 0) {
      const allCals = await conn.client.fetchCalendars()
      const targets = calendarsForFetch(allCals, conn.collectionHref, calendar)
      for (const cal of targets) {
        if (cal.url.replace(/\/$/, '') === calendar.url.replace(/\/$/, '')) continue
        const occ = await fetchObjectsForCalendar(conn.client, cal, rangeStart, rangeEnd)
        mergeOccurrences(occurrences, occ)
      }
    }

    return { ok: true, occurrences, via: 'tsdav', calendarUrl: calendar.url }
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
