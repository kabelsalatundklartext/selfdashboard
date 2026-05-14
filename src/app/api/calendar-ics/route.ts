import { NextResponse } from 'next/server'
import { expandIcsString, toLocalYmd } from '@/lib/calendarIcs'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 25_000
const MAX_BODY_BYTES = 12_000
const MAX_ICS_BYTES = 4 * 1024 * 1024

/** Bekannte SSRF-Ziele blocken; private RFC1918 bleibt erlaubt (Synology, LAN). */
const BLOCKED_HOSTNAMES = new Set(
  [
    'metadata.google.internal',
    'metadata.goog',
    '169.254.169.254',
    'localhost',
  ].map((h) => h.toLowerCase()),
)

function normalizeCalendarUrl(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  const host = u.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error('blocked_host')
  if (host.endsWith('.localhost')) throw new Error('blocked_host')
  return u
}

function parseWindow(body: Record<string, unknown>): { start: Date; end: Date } {
  const now = new Date()
  const defStart = new Date(now)
  defStart.setDate(defStart.getDate() - 14)
  defStart.setHours(0, 0, 0, 0)
  const defEnd = new Date(now)
  defEnd.setDate(defEnd.getDate() + 180)
  defEnd.setHours(23, 59, 59, 999)

  const ws = typeof body.windowStart === 'string' ? Date.parse(body.windowStart) : NaN
  const we = typeof body.windowEnd === 'string' ? Date.parse(body.windowEnd) : NaN
  const start = Number.isFinite(ws) ? new Date(ws) : defStart
  const end = Number.isFinite(we) ? new Date(we) : defEnd
  if (!(start < end)) throw new Error('invalid_window')
  const maxSpan = 400 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > maxSpan) throw new Error('window_too_large')
  return { start, end }
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
    url = normalizeCalendarUrl(String(body.url ?? ''))
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  let range: { start: Date; end: Date }
  try {
    range = parseWindow(body)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_window'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

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
      return NextResponse.json(
        { ok: false, error: 'upstream_http', status: res.status },
        { status: 502 },
      )
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_ICS_BYTES) {
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
      return NextResponse.json({ ok: false, error: 'fetch_timeout' }, { status: 504 })
    }
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: String(e) }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
