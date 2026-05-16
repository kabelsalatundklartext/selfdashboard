import { NextResponse } from 'next/server'
import { discoverCalDavCalendars } from '@/lib/caldavSync'
import { fixCommonCalDavUrlMistakes, buildBegendaCalendarUrl } from '@/lib/calendarApiShared'
import { logApiFailure } from '@/lib/errorLog'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

/** POST: verify CalDAV credentials and list calendar collections (write/export setup). */
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

  const rawUrl = String(body.calendarUrl ?? body.serverUrl ?? '')
  const username = clampStr(body.username, 800)
  const password = typeof body.password === 'string' ? body.password.slice(0, 2000) : ''

  const result = await discoverCalDavCalendars(rawUrl, username, password)
  if (!result.ok) {
    const status =
      result.error === 'unauthorized'
        ? 401
        : result.error === 'wrong_dav_service'
          ? 400
          : 502
    const urlFix = fixCommonCalDavUrlMistakes(rawUrl)
    const begendaHost = /gmx/i.test(rawUrl) ? 'caldav.gmx.net' : 'caldav.web.de'
    const suggestedUrl =
      username && urlFix.fixes.includes('missing_begenda_calendar_path')
        ? buildBegendaCalendarUrl(username, begendaHost as 'caldav.web.de' | 'caldav.gmx.net')
        : urlFix.fixes.length
          ? urlFix.url
          : undefined
    void logApiFailure('calendar-caldav-discover', result.error, { detail: result.detail })
    return NextResponse.json(
      { ok: false, error: result.error, detail: result.detail, suggestedUrl },
      { status },
    )
  }

  return NextResponse.json({
    ok: true,
    calendars: result.calendars,
    serverUrl: result.serverUrl,
  })
}
