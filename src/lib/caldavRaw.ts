/**
 * Minimal CalDAV read client (RFC 4791) — Sabre/Thunderbird-style REPORT.
 * WEB.DE/Begenda often fails with tsdav's default VEVENT+time-range query.
 */
import { expandIcsString, type IcsOccurrence } from '@/lib/calendarIcs'

export type RawCaldavFetchResult =
  | {
      ok: true
      occurrences: IcsOccurrence[]
      icsBlocks: number
      hrefsListed: number
      method: 'report' | 'propfind-get'
    }
  | { ok: false; error: string; status?: number }

function basicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/** Extract ICS bodies from CalDAV multistatus XML (CDATA or escaped). */
export function extractIcsBodiesFromMultistatus(xml: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const add = (chunk: string) => {
    const text = decodeXmlEntities(chunk).trim()
    if (!text || !/BEGIN:(VEVENT|VCALENDAR)/i.test(text)) return
    if (seen.has(text)) return
    seen.add(text)
    out.push(text)
  }

  const cdataRe =
    /<(?:[\w-]+:)?calendar-data\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/(?:[\w-]+:)?calendar-data>/gi
  let m: RegExpExecArray | null
  while ((m = cdataRe.exec(xml))) add(m[1] ?? '')

  const plainRe = /<(?:[\w-]+:)?calendar-data\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?calendar-data>/gi
  while ((m = plainRe.exec(xml))) add(m[1] ?? '')

  return out
}

function extractMemberHrefs(xml: string, collectionUrl: string): string[] {
  const base = collectionUrl.endsWith('/') ? collectionUrl : `${collectionUrl}/`
  const selfKey = base.replace(/\/$/, '').toLowerCase()
  const out: string[] = []
  const seen = new Set<string>()

  const re = /<[^>]*\bhref[^>]*>([^<]+)<\/[^>]*href>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    let href = (m[1] ?? '').trim()
    if (!href) continue
    if (!href.startsWith('http')) {
      try {
        href = new URL(href, base).href
      } catch {
        continue
      }
    }
    const key = href.replace(/\/$/, '').toLowerCase()
    if (key === selfKey || seen.has(key)) continue
    if (href.toLowerCase().includes('.vcf')) continue
    seen.add(key)
    out.push(href)
  }
  return out
}

function isCollectionHref(xml: string, href: string): boolean {
  const esc = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRe = new RegExp(
    `<[^>]*response[^>]*>[\\s\\S]*?${esc}[\\s\\S]*?<\\/[^>]*response>`,
    'i',
  )
  const block = blockRe.exec(xml)?.[0] ?? ''
  return /<[^>]*collection\s*\/?>/i.test(block) || /<[^>]*:collection\s*\/?>/i.test(block)
}

/** Sabre DAV guide: calendar-query with VCALENDAR filter only (like Thunderbird). */
function sabreCalendarQueryBody(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR" />
  </c:filter>
</c:calendar-query>`
}

function propfindMembersBody(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <d:resourcetype />
    <c:calendar-data />
  </d:prop>
</d:propfind>`
}

async function davXmlRequest(
  url: string,
  method: string,
  username: string,
  password: string,
  body: string | undefined,
  depth: string | undefined,
  signal: AbortSignal,
): Promise<{ status: number; text: string }> {
  const headers: Record<string, string> = {
    Authorization: basicAuthHeader(username, password),
    Accept: 'application/xml, text/xml, */*',
  }
  if (body) headers['Content-Type'] = 'application/xml; charset=utf-8'
  if (depth) headers.Depth = depth

  const res = await fetch(url, {
    method,
    headers,
    body,
    signal,
    cache: 'no-store',
    redirect: 'follow',
  })
  const text = await res.text()
  return { status: res.status, text }
}

async function getIcsResource(
  href: string,
  username: string,
  password: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(href, {
    method: 'GET',
    headers: {
      Authorization: basicAuthHeader(username, password),
      Accept: 'text/calendar, text/plain, */*',
    },
    signal,
    cache: 'no-store',
    redirect: 'follow',
  })
  if (!res.ok) return ''
  const text = await res.text()
  if (!/BEGIN:(VEVENT|VCALENDAR)/i.test(text)) return ''
  return text
}

function mergeOccurrences(target: IcsOccurrence[], incoming: IcsOccurrence[]): void {
  const seen = new Set(target.map((o) => o.stableId))
  for (const o of incoming) {
    if (seen.has(o.stableId)) continue
    seen.add(o.stableId)
    target.push(o)
  }
}

export async function fetchOccurrencesRawCaldav(
  calendarUrl: string,
  username: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
  signal: AbortSignal,
): Promise<RawCaldavFetchResult> {
  const collectionUrl = calendarUrl.endsWith('/') ? calendarUrl : `${calendarUrl}/`
  const user = username.trim()
  const pass = password.trim()
  if (!user || !pass) return { ok: false, error: 'unauthorized', status: 401 }

  const occurrences: IcsOccurrence[] = []

  // 1) REPORT calendar-query (Thunderbird / sabre.io recipe)
  try {
    const report = await davXmlRequest(
      collectionUrl,
      'REPORT',
      user,
      pass,
      sabreCalendarQueryBody(),
      '1',
      signal,
    )
    if (report.status === 401 || report.status === 403) {
      return { ok: false, error: 'unauthorized', status: report.status }
    }
    if (report.status === 207 || (report.text && /multistatus/i.test(report.text))) {
      const bodies = extractIcsBodiesFromMultistatus(report.text)
      for (const ics of bodies) {
        mergeOccurrences(occurrences, expandIcsString(ics, rangeStart, rangeEnd))
      }
      if (bodies.length > 0) {
        return {
          ok: true,
          occurrences,
          icsBlocks: bodies.length,
          hrefsListed: bodies.length,
          method: 'report',
        }
      }
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw e
  }

  // 2) PROPFIND Depth 1 + GET each member (Begenda opaque URLs)
  try {
    const pf = await davXmlRequest(
      collectionUrl,
      'PROPFIND',
      user,
      pass,
      propfindMembersBody(),
      '1',
      signal,
    )
    if (pf.status === 401 || pf.status === 403) {
      return { ok: false, error: 'unauthorized', status: pf.status }
    }
    if (pf.status === 207 || /multistatus/i.test(pf.text)) {
      let bodies = extractIcsBodiesFromMultistatus(pf.text)
      const hrefs = extractMemberHrefs(pf.text, collectionUrl)
      for (const href of hrefs) {
        if (isCollectionHref(pf.text, href)) continue
        const ics = await getIcsResource(href, user, pass, signal)
        if (ics) bodies.push(ics)
      }
      bodies = [...new Set(bodies)]
      for (const ics of bodies) {
        mergeOccurrences(occurrences, expandIcsString(ics, rangeStart, rangeEnd))
      }
      if (bodies.length > 0 || hrefs.length > 0) {
        return {
          ok: true,
          occurrences,
          icsBlocks: bodies.length,
          hrefsListed: hrefs.length,
          method: 'propfind-get',
        }
      }
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw e
  }

  return {
    ok: true,
    occurrences,
    icsBlocks: 0,
    hrefsListed: 0,
    method: 'report',
  }
}
