import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLogServer'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '@/lib/security/ssrf'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'

// Anlegen kann auf der SelfMailer-Seite einen Google-Push ausloesen (ein
// OAuth-Token-Refresh + REST-Call) — deshalb grosszuegiges Timeout.
const FETCH_TIMEOUT_MS = 20_000

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

/** Basis-URL saeubern: Protokoll pruefen, Credentials/Hash/Trailing-Slash weg. */
function normalizeBase(raw: string): string {
  const u = parseBase(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

type Action = 'summary' | 'targets' | 'calendars' | 'create' | 'update' | 'delete'

interface ReqBody {
  action?: Action
  base?: string
  token?: string
  // summary
  days?: number
  from?: string // ISO — expliziter Zeitbereichsanfang (Monatsansicht); ueberschreibt days
  to?: string   // ISO — expliziter Zeitbereichsende (Monatsansicht)
  // create / update
  id?: number    // SelfMailer-Event-ID (update/delete)
  title?: string
  description?: string
  location?: string
  start?: string
  end?: string
  allDay?: boolean
  target?: string // "local" | "{accId}::{calId}"
}

/** Ziel-String in die SelfMailer-Felder zerlegen (siehe /calendar/targets). */
function splitTarget(target: string): { dav_account_id: number | null; gcal_calendar_id: string } {
  const t = (target || 'local').trim()
  if (t.includes('::')) {
    const [acc, cal] = t.split('::')
    const id = Number(acc)
    if (Number.isInteger(id)) return { dav_account_id: id, gcal_calendar_id: cal ?? '' }
  }
  return { dav_account_id: null, gcal_calendar_id: '' }
}

function isoFloorToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function isoPlusDays(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + Math.max(1, Math.min(366, Math.round(days || 30))))
  return d.toISOString()
}

/** Akzeptiert nur gueltige ISO-Datumsangaben (sonst null → Fallback greift). */
function isoOrNull(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/**
 * Server-zu-Server-Proxy auf die token-faehige SelfMailer-Kalender-API.
 * Drei Aktionen: kommende Termine listen, waehlbare Ziel-Kalender holen,
 * einen Termin anlegen (SelfMailer pusht ihn bei Google-Ziel automatisch weiter).
 * Der Token bleibt im Request-Body und wandert nur an SelfMailer.
 */
export async function handleCalendarRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.base ?? ''))
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const token = String(body.token ?? '').trim()
  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 })

  const action: Action = body.action ?? 'summary'
  const tq = encodeURIComponent(token)

  // Request je Aktion vorbereiten.
  let url: string
  let init: RequestInit
  if (action === 'targets') {
    url = `${base}/api/v1/calendar/targets?token=${tq}`
    init = { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }
  } else if (action === 'calendars') {
    url = `${base}/api/v1/calendar/calendars?token=${tq}`
    init = { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }
  } else if (action === 'create') {
    const start = String(body.start ?? '').trim()
    const end = String(body.end ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 })
    if (!start || !end) return NextResponse.json({ error: 'missing_time' }, { status: 400 })
    const { dav_account_id, gcal_calendar_id } = splitTarget(String(body.target ?? 'local'))
    url = `${base}/api/v1/calendar/events?token=${tq}`
    init = {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        title,
        description: String(body.description ?? ''),
        location: String(body.location ?? ''),
        start,
        end,
        all_day: body.allDay === true,
        dav_account_id,
        gcal_calendar_id,
      }),
    }
  } else if (action === 'update') {
    const id = Number(body.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
    const start = String(body.start ?? '').trim()
    const end = String(body.end ?? '').trim()
    const title = String(body.title ?? '').trim()
    if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 })
    if (!start || !end) return NextResponse.json({ error: 'missing_time' }, { status: 400 })
    url = `${base}/api/v1/calendar/events/${id}?token=${tq}`
    init = {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        title,
        description: String(body.description ?? ''),
        location: String(body.location ?? ''),
        start,
        end,
        all_day: body.allDay === true,
      }),
    }
  } else if (action === 'delete') {
    const id = Number(body.id)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
    url = `${base}/api/v1/calendar/events/${id}?token=${tq}`
    init = { method: 'DELETE', headers: { Accept: 'application/json' }, cache: 'no-store' }
  } else {
    // summary: expliziter Zeitbereich (Monatsansicht) ODER kommende Termine ab heute.
    const fromIso = isoOrNull(body.from)
    const toIso = isoOrNull(body.to)
    const from = encodeURIComponent(fromIso ?? isoFloorToday())
    const to = encodeURIComponent(toIso ?? isoPlusDays(body.days ?? 30))
    url = `${base}/api/v1/calendar/events?token=${tq}&start_from=${from}&start_to=${to}`
    init = { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' }
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchWithSsrfGuard(url, { ...init, signal: ac.signal })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    if (!res.ok) {
      const code = res.status === 401 ? 'unauthorized' : 'fetch_failed'
      void logPluginApiFailure('selfmailer-calendar', action, `http_${res.status}`, {
        status: res.status,
        detail: text.slice(0, 200),
      })
      return NextResponse.json(
        { error: code, status: res.status, detail: text.slice(0, 200) },
        { status: res.status === 401 ? 401 : 502 },
      )
    }
    // summary liefert ein Array → in { events } verpacken; targets/create 1:1.
    if (action === 'summary') {
      return NextResponse.json({ events: Array.isArray(json) ? json : [] })
    }
    return NextResponse.json(json ?? {})
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('selfmailer-calendar', action, `blocked_url:${e.message}`)
      return NextResponse.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('selfmailer-calendar', action, aborted ? 'timeout' : msg)
    return NextResponse.json(
      { error: aborted ? 'timeout' : 'fetch_failed', detail: msg },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

export function selfmailerCalendarServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleCalendarRequest(ctx.request)
}

export default selfmailerCalendarServerHandler
