import { NextResponse } from 'next/server'
import { expandIcsString, toLocalYmd } from '@/lib/calendarIcs'
import {
  CALENDAR_FETCH_TIMEOUT_MS,
  CALENDAR_MAX_ICS_BYTES,
  normalizeCalendarHttpUrl,
  parseCalendarWindow,
} from '@/lib/calendarApiShared'
import { logApiFailure } from '@/lib/errorLog'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 12_000

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

  let url: URL
  try {
    url = normalizeCalendarHttpUrl(String(body.url ?? ''))
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

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
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: ac.signal,
      headers: {
        Accept: 'text/calendar, application/calendar+json, text/plain, */*',
        'User-Agent': 'SelfDashboard-calendar-ics/1.0',
      },
    })

    if (!res.ok) {
      void logApiFailure('calendar-ics', 'upstream_http', {
        upstreamStatus: res.status,
        host: url.hostname,
      })
      return NextResponse.json(
        { ok: false, error: 'upstream_http', status: res.status },
        { status: 502 },
      )
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength > CALENDAR_MAX_ICS_BYTES) {
      return NextResponse.json({ ok: false, error: 'ics_too_large' }, { status: 413 })
    }

    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    if (!/BEGIN:VCALENDAR/i.test(text) && !/BEGIN:VEVENT/i.test(text)) {
      return NextResponse.json({ ok: false, error: 'not_calendar_data' }, { status: 422 })
    }

    const occ = expandIcsString(text, range.start, range.end)

    const events = occ.map((o) => ({
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
      window: { start: toLocalYmd(range.start), end: toLocalYmd(range.end) },
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'AbortError') {
      void logApiFailure('calendar-ics', 'fetch_timeout', { host: url.hostname })
      return NextResponse.json({ ok: false, error: 'fetch_timeout' }, { status: 504 })
    }
    void logApiFailure('calendar-ics', 'fetch_failed', {
      host: url.hostname,
      message: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: String(e) }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
