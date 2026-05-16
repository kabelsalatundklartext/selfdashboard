import { NextResponse } from 'next/server'
import {
  CALENDAR_FETCH_TIMEOUT_MS,
  buildBegendaCalendarUrl,
  fixCommonCalDavUrlMistakes,
  normalizeCalendarHttpUrl,
} from '@/lib/calendarApiShared'
import { writeCalDavAllDayEvent, type CaldavWriteAction } from '@/lib/caldavSync'
import { logApiFailure } from '@/lib/errorLog'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 20_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

function parseAction(v: unknown): CaldavWriteAction | null {
  if (v === 'create' || v === 'update' || v === 'delete') return v
  return null
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

  const action = parseAction(body.action)
  if (!action) {
    return NextResponse.json({ ok: false, error: 'bad_action' }, { status: 400 })
  }

  const rawCalendarUrl = String(body.calendarUrl ?? '')
  const urlFix = fixCommonCalDavUrlMistakes(rawCalendarUrl)
  let calendarUrlInput = urlFix.url || rawCalendarUrl
  const userBodyEarly = clampStr(body.username, 800)
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
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const username = clampStr(body.username, 800)
  const password = typeof body.password === 'string' ? body.password.slice(0, 2000) : ''

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), CALENDAR_FETCH_TIMEOUT_MS)

  try {
    const result = await writeCalDavAllDayEvent(
      calendarUrlInput || rawCalendarUrl,
      username,
      password,
      action,
      {
        title: clampStr(body.title, 240),
        date: clampStr(body.date, 10),
        uid: clampStr(body.uid, 240),
        objectUrl: clampStr(body.objectUrl, 2000),
        etag: clampStr(body.etag, 200),
        allDay: body.allDay === true,
        startTime: clampStr(body.startTime, 5),
        endTime: clampStr(body.endTime, 5),
      },
      ac.signal,
    )

    if (!result.ok) {
      const status =
        result.error === 'wrong_dav_service'
          ? 400
          : result.error === 'unauthorized'
            ? 401
            : result.error === 'bad_request'
              ? 400
              : result.error === 'not_found'
                ? 404
                : result.error === 'upstream_network'
                  ? 504
                  : 502
      void logApiFailure('calendar-caldav-write', result.error, {
        detail: result.detail,
        host: url.hostname,
        action,
      })
      return NextResponse.json(
        { ok: false, error: result.error, detail: result.detail },
        { status },
      )
    }

    return NextResponse.json({
      ok: true,
      action,
      uid: result.uid,
      objectUrl: result.objectUrl,
      etag: result.etag ?? null,
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'AbortError') {
      void logApiFailure('calendar-caldav-write', 'fetch_timeout', { host: url.hostname })
      return NextResponse.json({ ok: false, error: 'fetch_timeout' }, { status: 504 })
    }
    void logApiFailure('calendar-caldav-write', 'write_failed', {
      host: url.hostname,
      message: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ ok: false, error: 'write_failed', message: String(e) }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
