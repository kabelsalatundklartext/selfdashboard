import { NextResponse } from 'next/server'
import { toLocalYmd } from '@/lib/calendarIcs'
import {
  CALENDAR_FETCH_TIMEOUT_MS,
  normalizeCalendarHttpUrl,
  parseCalendarWindow,
  splitUrlBasicAuth,
} from '@/lib/calendarApiShared'
import { fetchCalDavOccurrences } from '@/lib/calendarCaldav'

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

  let url: URL
  try {
    url = normalizeCalendarHttpUrl(String(body.calendarUrl ?? ''))
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const { href, urlUser, urlPass } = splitUrlBasicAuth(url)
  const userBody = clampStr(body.username, 800)
  const passBody = typeof body.password === 'string' ? body.password.slice(0, 2000) : ''
  const username = userBody || urlUser
  const password = passBody || urlPass

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
        result.error === 'unauthorized'
          ? 401
          : result.error === 'ics_too_large'
            ? 413
            : result.error === 'not_calendar_data'
              ? 422
              : result.error === 'upstream_network'
                ? 504
                : 502
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          upstreamStatus: result.status,
          detail: result.detail,
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
      return NextResponse.json({ ok: false, error: 'fetch_timeout' }, { status: 504 })
    }
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: String(e) }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
