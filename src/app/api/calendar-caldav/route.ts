import { NextResponse } from 'next/server'
import { toLocalYmd } from '@/lib/calendarIcs'
import {
  CALENDAR_FETCH_TIMEOUT_MS,
  normalizeCalendarHttpUrl,
  parseCalendarWindow,
  splitUrlBasicAuth,
} from '@/lib/calendarApiShared'
import { fetchCalDavOccurrences } from '@/lib/calendarCaldav'
import { logApiFailure } from '@/lib/errorLog'
import {
  buildBegendaCalendarUrl,
  fixCommonCalDavUrlMistakes,
  normalizeCaldavUsername,
} from '@/lib/calendarApiShared'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 40_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'body_too_large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const rawCalendarUrl = String(body.calendarUrl ?? '')
  const userBodyEarly = clampStr(body.username, 800)
  const urlFix = fixCommonCalDavUrlMistakes(rawCalendarUrl)

  let calendarUrlInput = urlFix.url || rawCalendarUrl
  if (
    userBodyEarly &&
    !/\/begenda\/dav\//i.test(calendarUrlInput) &&
    /caldav\.(web\.de|gmx\.net)/i.test(calendarUrlInput)
  ) {
    const host = /gmx\.net/i.test(calendarUrlInput) ? 'caldav.gmx.net' : 'caldav.web.de'
    calendarUrlInput = buildBegendaCalendarUrl(userBodyEarly, host)
  }

  let url: URL
  try {
    url = normalizeCalendarHttpUrl(calendarUrlInput)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    const status = 400
    const begendaHost = /gmx/i.test(calendarUrlInput) ? 'caldav.gmx.net' : 'caldav.web.de'
    const suggestedUrl =
      code === 'missing_begenda_path' && userBodyEarly
        ? buildBegendaCalendarUrl(userBodyEarly, begendaHost as 'caldav.web.de' | 'caldav.gmx.net')
        : urlFix.fixes.length
          ? urlFix.url
          : undefined
    const detail =
      code === 'wrong_dav_service'
        ? 'CardDAV (carddav.web.de) ist für Kontakte — Kalender: https://caldav.web.de/begenda/dav/Ihre-Adresse@web.de/calendar'
        : code === 'missing_begenda_path'
          ? 'WEB.DE: vollständige CalDAV-URL mit /begenda/dav/…@web.de/calendar angeben'
          : undefined
    void logApiFailure('calendar-caldav', code, { detail, fixes: urlFix.fixes, suggestedUrl })
    return NextResponse.json({ ok: false, error: code, detail, suggestedUrl }, { status })
  }

  const { href, urlUser, urlPass } = splitUrlBasicAuth(url)
  const userBody = clampStr(body.username, 800)
  const passBody = typeof body.password === 'string' ? body.password.slice(0, 2000) : ''
  const username = normalizeCaldavUsername(userBody || urlUser, href)
  const password = (passBody || urlPass).trim()

  let range: { start: Date; end: Date }
  try {
    range = parseCalendarWindow(body)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_window'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), CALENDAR_FETCH_TIMEOUT_MS)

  try {
    const result = await fetchCalDavOccurrences(href, username, password, range.start, range.end, ac.signal)

    if (!result.ok) {
      const status =
        result.error === 'wrong_dav_service'
          ? 400
          : result.error === 'unauthorized'
            ? 401
            : result.error === 'ics_too_large'
              ? 413
              : result.error === 'not_calendar_data'
                ? 422
                : result.error === 'upstream_network'
                  ? 504
                  : 502
      void logApiFailure('calendar-caldav', result.error, {
        upstreamStatus: result.status,
        detail:
          result.error === 'unauthorized'
            ? '401 — App-Passwort + volle E-Mail prüfen (nicht Hauptpasswort)'
            : result.detail,
        host: url.hostname,
      })
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          upstreamStatus: result.status,
          detail: result.detail,
          ...(urlFix.fixes.length ? { suggestedUrl: urlFix.url, urlFixes: urlFix.fixes } : {}),
        },
        { status },
      )
    }

    const events = result.occurrences.map((o) => ({
      id: o.stableId,
      uid: o.uid,
      title: o.title,
      date: o.date,
      allDay: o.allDay,
      timeLabel: o.timeLabel ?? null,
    }))

    return NextResponse.json({
      ok: true,
      events,
      fetchedAt: new Date().toISOString(),
      via: result.via,
      window: { start: toLocalYmd(range.start), end: toLocalYmd(range.end) },
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'AbortError') {
      void logApiFailure('calendar-caldav', 'fetch_timeout', { host: url.hostname })
      return NextResponse.json({ ok: false, error: 'fetch_timeout' }, { status: 504 })
    }
    void logApiFailure('calendar-caldav', 'fetch_failed', {
      host: url.hostname,
      message: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: String(e) }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
