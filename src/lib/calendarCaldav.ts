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

function buildCalendarQueryXml(rangeStart: Date, rangeEnd: Date, nested = true): string {
  const startZ = toCalDavUtc(rangeStart)
  const endZ = toCalDavUtc(rangeEnd)
  const timeRange = `<c:time-range start="${startZ}" end="${endZ}"/>`
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

/** Extrahiert Inhalte aus caldav:calendar-data (inkl. CDATA, typische Namespace-Präfixe). */
export function extractCalendarDataFromMultistatus(xml: string): string[] {
  const parts: string[] = []
  const re = /<[^>\s]*calendar-data[^>]*>([\s\S]*?)<\/[^>\s]*calendar-data>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    let inner = m[1] ?? ''
    inner = inner.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, (_, c: string) => c)
    inner = inner
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, '&')
    inner = inner.trim()
    if (/BEGIN:VCALENDAR/i.test(inner)) parts.push(inner)
  }
  return parts
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

function parseReportResponse(
  xmlText: string,
  rangeStart: Date,
  rangeEnd: Date,
): { ok: true; occurrences: IcsOccurrence[] } | { ok: false; error: 'not_calendar_data' } {
  const chunks = extractCalendarDataFromMultistatus(xmlText)
  if (chunks.length === 0) {
    if (/BEGIN:VCALENDAR/i.test(xmlText)) {
      const occ = expandIcsString(xmlText, rangeStart, rangeEnd)
      return { ok: true, occurrences: occ }
    }
    return { ok: false, error: 'not_calendar_data' }
  }
  return { ok: true, occurrences: expandParts(chunks, rangeStart, rangeEnd) }
}

export async function fetchCalDavOccurrences(
  calendarHref: string,
  username: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<
  | { ok: true; occurrences: IcsOccurrence[]; via: 'get' | 'report' }
  | { ok: false; error: CaldavFetchErrorCode; status?: number; detail?: string }
> {
  const href = normalizeCalDavHref(calendarHref)
  const auth = basicAuthHeader(username, password)
  const commonHeaders: Record<string, string> = {
    'User-Agent': 'SelfDashboard-calendar-caldav/1.1',
    Accept: 'text/calendar, application/calendar+json, text/xml, application/xml, text/plain, */*',
  }
  if (auth) commonHeaders.Authorization = auth

  // 1) GET — viele Server (Nextcloud, Synology) liefern den Kalender als ICS.
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
      if (/BEGIN:VCALENDAR/i.test(text)) {
        const occ = expandIcsString(text, rangeStart, rangeEnd)
        return { ok: true, occurrences: occ, via: 'get' }
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
    /* REPORT versuchen */
  }

  // 2) REPORT calendar-query — RFC 4791: Depth 1 oder infinity (nicht 0).
  const reportAttempts: { xml: string; depth: '1' | 'infinity' }[] = [
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, true), depth: '1' },
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, false), depth: '1' },
    { xml: buildCalendarQueryXml(rangeStart, rangeEnd, true), depth: 'infinity' },
  ]

  let lastStatus = 0
  let lastDetail = ''

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
    const parsed = parseReportResponse(xmlText, rangeStart, rangeEnd)
    if (parsed.ok) {
      return { ok: true, occurrences: parsed.occurrences, via: 'report' }
    }
    lastDetail = 'REPORT 207 without calendar-data'
  }

  if (lastStatus > 0) {
    return { ok: false, error: 'upstream_http', status: lastStatus, detail: lastDetail || undefined }
  }
  return { ok: false, error: 'upstream_network', status: 0, detail: lastDetail || 'REPORT failed' }
}
