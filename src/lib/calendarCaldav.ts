import { Buffer } from 'node:buffer'
import { expandIcsString, type IcsOccurrence } from '@/lib/calendarIcs'
import { CALENDAR_MAX_ICS_BYTES, normalizeCalDavHref } from '@/lib/calendarApiShared'

function toCalDavUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${mo}${da}T${h}${mi}${s}Z`
}

function buildCalendarQueryXml(rangeStart: Date, rangeEnd: Date, nested: boolean, withTimeRange: boolean): string {
  const timeRange = withTimeRange
    ? `<c:time-range start="${toCalDavUtc(rangeStart)}" end="${toCalDavUtc(rangeEnd)}"/>`
    : ''
  const eventFilter = nested
    ? `<c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        ${timeRange}
      </c:comp-filter>
    </c:comp-filter>`
    : `<c:comp-filter name="VEVENT">
        ${timeRange}
      </c:comp-filter>`
  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    ${eventFilter}
  </c:filter>
</c:calendar-query>`
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, (_, c: string) => c)
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
}

function wrapVeventsAsCalendar(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return ''
  if (/BEGIN:VCALENDAR/i.test(trimmed)) return trimmed
  const vevents = trimmed.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi)
  if (!vevents?.length) return trimmed
  return `BEGIN:VCALENDAR\r\n${vevents.join('\r\n')}\r\nEND:VCALENDAR`
}

/** Extrahiert ICS aus caldav:calendar-data (inkl. CDATA, Namespace-Präfixe, nur VEVENT). */
export function extractCalendarDataFromMultistatus(xml: string): string[] {
  const parts: string[] = []
  const re = /<[^>\s/]*:?calendar-data[^>]*>([\s\S]*?)<\/[^>\s/]*:?calendar-data>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    let inner = decodeXmlEntities((m[1] ?? '').trim())
    if (!inner || /^<\?xml/i.test(inner)) continue
    inner = wrapVeventsAsCalendar(inner)
    if (/BEGIN:VCALENDAR/i.test(inner) || /BEGIN:VEVENT/i.test(inner)) parts.push(inner)
  }

  if (parts.length === 0) {
    const raw = decodeXmlEntities(xml)
    const wrapped = wrapVeventsAsCalendar(raw)
    if (/BEGIN:VEVENT/i.test(wrapped)) parts.push(wrapped)
  }

  return parts
}

function multistatusHasFailureStatus(xml: string): boolean {
  return /<[^>]*status[^>]*>\s*HTTP\/1\.1\s+(4\d\d|5\d\d)/i.test(xml)
}

function isSuccessfulEmptyMultistatus(xml: string): boolean {
  if (!/multistatus/i.test(xml)) return false
  if (multistatusHasFailureStatus(xml)) return false
  if (extractCalendarDataFromMultistatus(xml).some((c) => /BEGIN:(VEVENT|VCALENDAR)/i.test(c))) return false
  return true
}

function extractHrefPathsFromMultistatus(xml: string): string[] {
  const hrefs: string[] = []
  const re = /<[^>\s/]*:?href[^>]*>([^<]+)<\/[^>\s/]*:?href>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const h = (m[1] ?? '').trim()
    if (!h || h === '/') continue
    if (/\.ics$/i.test(h) || /\/event/i.test(h) || /\/e\d/i.test(h)) hrefs.push(h)
  }
  return [...new Set(hrefs)]
}

function buildCalendarMultigetXml(hrefs: string[]): string {
  const hrefTags = hrefs.map((h) => `<d:href>${h.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</d:href>`).join('')
  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-multiget xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-data/>
  </d:prop>
  ${hrefTags}
</c:calendar-multiget>`
}

function basicAuthHeader(user: string, pass: string): string | undefined {
  const u = user.trim()
  const p = pass
  if (!u && !p) return undefined
  const b64 = Buffer.from(`${u}:${p}`, 'utf8').toString('base64')
  return `Basic ${b64}`
}

function dedupeOccurrences(rows: IcsOccurrence[]): IcsOccurrence[] {
  const seen = new Set<string>()
  const out: IcsOccurrence[] = []
  for (const o of rows) {
    if (seen.has(o.stableId)) continue
    seen.add(o.stableId)
    out.push(o)
  }
  return out
}

function expandParts(icsChunks: string[], rangeStart: Date, rangeEnd: Date): IcsOccurrence[] {
  const merged: IcsOccurrence[] = []
  for (const chunk of icsChunks) {
    merged.push(...expandIcsString(chunk, rangeStart, rangeEnd))
  }
  return dedupeOccurrences(merged)
}

export type CaldavFetchErrorCode =
  | 'upstream_http'
  | 'upstream_network'
  | 'ics_too_large'
  | 'not_calendar_data'
  | 'unauthorized'

const GET_FALLBACK_STATUSES = new Set([400, 404, 405, 406, 415, 422])

async function calDavReport(
  calendarHref: string,
  headers: Record<string, string>,
  xmlBody: string,
  depth: '1' | 'infinity',
  signal: AbortSignal,
): Promise<Response> {
  return fetch(calendarHref, {
    method: 'REPORT',
    redirect: 'follow',
    cache: 'no-store',
    signal,
    headers: {
      ...headers,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: depth,
    },
    body: xmlBody,
  })
}

function parseReportXml(
  xmlText: string,
  rangeStart: Date,
  rangeEnd: Date,
): { ok: true; occurrences: IcsOccurrence[] } | { ok: false; error: 'not_calendar_data' | 'empty' } {
  const chunks = extractCalendarDataFromMultistatus(xmlText)
  if (chunks.length > 0) {
    return { ok: true, occurrences: expandParts(chunks, rangeStart, rangeEnd) }
  }
  if (/BEGIN:VCALENDAR/i.test(xmlText)) {
    return { ok: true, occurrences: expandIcsString(xmlText, rangeStart, rangeEnd) }
  }
  if (isSuccessfulEmptyMultistatus(xmlText)) {
    return { ok: true, occurrences: [] }
  }
  return { ok: false, error: 'not_calendar_data' }
}

async function tryCalendarMultiget(
  href: string,
  headers: Record<string, string>,
  xmlText: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<IcsOccurrence[] | null> {
  const paths = extractHrefPathsFromMultistatus(xmlText).slice(0, 80)
  if (paths.length === 0) return null

  const body = buildCalendarMultigetXml(paths)
  let res: Response
  try {
    res = await calDavReport(href, headers, body, '1', signal)
  } catch {
    return null
  }
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok && res.status !== 207) return null

  const multiXml = await res.text()
  const parsed = parseReportXml(multiXml, rangeStart, rangeEnd)
  if (parsed.ok) return parsed.occurrences
  return null
}

export async function fetchCalDavOccurrences(
  calendarHref: string,
  username: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<
  | { ok: true; occurrences: IcsOccurrence[]; via: 'get' | 'report' | 'multiget' }
  | { ok: false; error: CaldavFetchErrorCode; status?: number; detail?: string }
> {
  const href = normalizeCalDavHref(calendarHref)
  const auth = basicAuthHeader(username, password)
  const commonHeaders: Record<string, string> = {
    'User-Agent': 'SelfDashboard-calendar-caldav/1.2',
    Accept: 'text/calendar, application/calendar+json, text/xml, application/xml, text/plain, */*',
  }
  if (auth) commonHeaders.Authorization = auth

  try {
    const getRes = await fetch(href, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal,
      headers: commonHeaders,
    })

    if (getRes.status === 401 || getRes.status === 403) {
      return { ok: false, error: 'unauthorized', status: getRes.status }
    }

    if (getRes.ok) {
      const buf = await getRes.arrayBuffer()
      if (buf.byteLength > CALENDAR_MAX_ICS_BYTES) return { ok: false, error: 'ics_too_large' }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
      const ics = wrapVeventsAsCalendar(text)
      if (/BEGIN:VCALENDAR/i.test(ics)) {
        return { ok: true, occurrences: expandIcsString(ics, rangeStart, rangeEnd), via: 'get' }
      }
      if (/multistatus/i.test(text)) {
        const parsed = parseReportXml(text, rangeStart, rangeEnd)
        if (parsed.ok) return { ok: true, occurrences: parsed.occurrences, via: 'get' }
      }
    } else if (!GET_FALLBACK_STATUSES.has(getRes.status)) {
      return {
        ok: false,
        error: 'upstream_http',
        status: getRes.status,
        detail: `GET ${getRes.status}`,
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('abort')) {
      return { ok: false, error: 'upstream_network', status: 0, detail: 'timeout' }
    }
  }

  const reportAttempts: { xml: string; depth: '1' | 'infinity' }[] = [
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, true, true), depth: '1' },
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, false, true), depth: '1' },
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, true, false), depth: '1' },
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, true, true), depth: 'infinity' },
  ]

  let lastStatus = 0
  let lastDetail = ''
  let lastXml = ''

  for (const attempt of reportAttempts) {
    let reportRes: Response
    try {
      reportRes = await calDavReport(href, commonHeaders, attempt.xml, attempt.depth, signal)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return {
        ok: false,
        error: 'upstream_network',
        status: 0,
        detail: msg || 'REPORT failed',
      }
    }

    if (reportRes.status === 401 || reportRes.status === 403) {
      return { ok: false, error: 'unauthorized', status: reportRes.status }
    }

    lastStatus = reportRes.status
    if (!reportRes.ok && reportRes.status !== 207) {
      lastDetail = `REPORT ${reportRes.status} (Depth ${attempt.depth})`
      continue
    }

    const xmlText = await reportRes.text()
    lastXml = xmlText
    const parsed = parseReportXml(xmlText, rangeStart, rangeEnd)
    if (parsed.ok) {
      return { ok: true, occurrences: parsed.occurrences, via: 'report' }
    }

    const fromMulti = await tryCalendarMultiget(href, commonHeaders, xmlText, rangeStart, rangeEnd, signal)
    if (fromMulti) {
      return { ok: true, occurrences: fromMulti, via: 'multiget' }
    }

    lastDetail = 'REPORT 207 without calendar-data'
  }

  if (lastStatus === 207 && isSuccessfulEmptyMultistatus(lastXml)) {
    return { ok: true, occurrences: [], via: 'report' }
  }

  if (lastStatus > 0) {
    return {
      ok: false,
      error: lastStatus === 207 ? 'not_calendar_data' : 'upstream_http',
      status: lastStatus,
      detail: lastDetail || undefined,
    }
  }
  return { ok: false, error: 'upstream_network', status: 0, detail: lastDetail || 'REPORT failed' }
}
