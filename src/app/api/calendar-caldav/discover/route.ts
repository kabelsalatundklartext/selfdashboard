import { NextResponse } from 'next/server'
import { probeCalDavRead } from '@/lib/caldavRaw'
import {
  discoverCalDavCalendars,
  fetchCalDavOccurrencesTsdav,
  resolveCalendarCollectionHref,
} from '@/lib/caldavSync'
import { normalizeCaldavUsername } from '@/lib/calendarApiShared'
import { fixCommonCalDavUrlMistakes, buildBegendaCalendarUrl } from '@/lib/calendarApiShared'
import { logApiFailure } from '@/lib/errorLog'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

/** POST: list CalDAV calendars on server (tsdav discovery). */
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

  let eventCount = 0
  let rawObjectCount = 0
  let fetchDetail: string | undefined
  let probe: Awaited<ReturnType<typeof probeCalDavRead>>['steps'] | undefined
  try {
    const start = new Date()
    start.setDate(start.getDate() - 14)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setDate(end.getDate() + 180)
    end.setHours(23, 59, 59, 999)
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), 25_000)
    const user = normalizeCaldavUsername(username, rawUrl)
    const href = resolveCalendarCollectionHref(rawUrl, user)
    const probed = await probeCalDavRead(href, user, password, start, end, ac.signal)
    probe = probed.steps

    const pulled = await fetchCalDavOccurrencesTsdav(rawUrl, username, password, start, end, ac.signal)
    clearTimeout(to)
    if (pulled.ok) {
      eventCount = pulled.occurrences.length
      rawObjectCount = pulled.rawObjectCount ?? 0
      if (!probe.length) probe = pulled.probe
    } else {
      fetchDetail = pulled.detail ?? pulled.error
      probe = pulled.probe ?? probe
    }
  } catch (e) {
    fetchDetail = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    ok: true,
    calendars: result.calendars,
    serverUrl: result.serverUrl,
    eventCount,
    rawObjectCount,
    fetchDetail,
    probe,
    collectionUrl: (() => {
      try {
        return resolveCalendarCollectionHref(rawUrl, normalizeCaldavUsername(username, rawUrl))
      } catch {
        return undefined
      }
    })(),
  })
}
