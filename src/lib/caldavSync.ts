import { createDAVClient, type DAVCalendar } from 'tsdav'
import { expandIcsString, type IcsOccurrence } from '@/lib/calendarIcs'
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

async function fetchObjectsForCalendar(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  calendar: DAVCalendar,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<IcsOccurrence[]> {
  const timeRange = { start: rangeStart.toISOString(), end: rangeEnd.toISOString() }
  const attempts: { useMultiGet: boolean; expand: boolean }[] = [
    { useMultiGet: true, expand: true },
    { useMultiGet: false, expand: true },
    { useMultiGet: false, expand: false },
  ]
  for (const opts of attempts) {
    try {
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange,
        expand: opts.expand,
        useMultiGet: opts.useMultiGet,
      })
      const occ = parseCalendarObjects(objects, rangeStart, rangeEnd)
      if (occ.length > 0) return occ
      if (objects.length === 0) return []
    } catch {
      /* try next strategy */
    }
  }
  return []
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
    if (code === 'wrong_dav_service') {
      return { ok: false, error: 'wrong_dav_service', detail: code }
    }
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
    const calendar = pickCalendar(calendars, collectionHref)
    if (!calendar) {
      return {
        ok: false,
        error: 'not_calendar_data',
        detail: 'no calendar collection found — use discover or check URL',
      }
    }

    const occurrences = await fetchObjectsForCalendar(client, calendar, rangeStart, rangeEnd)
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
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}
