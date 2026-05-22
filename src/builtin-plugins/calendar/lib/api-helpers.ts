/**
 * Helpers shared by the calendar API routes.
 *
 * Keeps the route handlers tiny: they parse JSON, call a helper, return
 * NextResponse.json. No business logic in the route files.
 */

import { NextResponse } from 'next/server'

import { encrypt } from './crypto'
import { newId, nowIso } from './store'
import type {
  Account,
  AccountCreateBody,
  AccountUpdateBody,
  CalDAVConfig,
  Calendar,
  CalendarEvent,
  ExpandedEvent,
  ICSConfig,
  ProviderId,
  SummaryResponse,
} from './types'

// ---------------------------------------------------------------------------
// Account view (never returns the encrypted password)
// ---------------------------------------------------------------------------

export interface AccountView {
  id: string
  name: string
  provider: ProviderId
  enabled: boolean
  createdAt: string
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  calendarCount: number
  /** Only the host part of the URL, for display */
  endpoint?: string
  /** Full URL for edit forms */
  url?: string
  username?: string
}

export function toAccountView(a: Account, calendars: Calendar[]): AccountView {
  const cfg = a.config as CalDAVConfig | ICSConfig
  let endpoint = ''
  try { endpoint = new URL(cfg.url).host } catch { endpoint = cfg.url }
  return {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    calendarCount: calendars.filter(c => c.accountId === a.id).length,
    endpoint,
    url: cfg.url,
    username: (cfg as CalDAVConfig).username,
  }
}

// ---------------------------------------------------------------------------
// Build an Account from a request body
// ---------------------------------------------------------------------------

export function buildAccount(body: AccountCreateBody): Account {
  if (body.provider === 'caldav') {
    if (!body.caldav) throw new Error('caldav config required')
    return {
      id: newId('acc'),
      name: body.name,
      provider: 'caldav',
      enabled: true,
      createdAt: nowIso(),
      config: {
        url: body.caldav.url,
        username: body.caldav.username,
        passwordEncrypted: encrypt(body.caldav.password),
        verifySsl: body.caldav.verifySsl,
      } satisfies CalDAVConfig,
    }
  }
  if (body.provider === 'ics') {
    if (!body.ics) throw new Error('ics config required')
    return {
      id: newId('acc'),
      name: body.name,
      provider: 'ics',
      enabled: true,
      createdAt: nowIso(),
      config: {
        url: body.ics.url,
        username: body.ics.username,
        passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : '',
      } satisfies ICSConfig,
    }
  }
  throw new Error(`unknown provider: ${(body as any).provider}`)
}

export function applyAccountUpdate(a: Account, body: AccountUpdateBody): void {
  if (body.name !== undefined) a.name = body.name
  if (body.enabled !== undefined) a.enabled = body.enabled
  if (a.provider === 'caldav' && body.caldav) {
    const cfg = a.config as CalDAVConfig
    a.config = {
      url: body.caldav.url ?? cfg.url,
      username: body.caldav.username ?? cfg.username,
      passwordEncrypted: body.caldav.password
        ? encrypt(body.caldav.password)
        : cfg.passwordEncrypted,
      verifySsl: body.caldav.verifySsl ?? cfg.verifySsl,
    } satisfies CalDAVConfig
  }
  if (a.provider === 'ics' && body.ics) {
    const cfg = a.config as ICSConfig
    a.config = {
      url: body.ics.url ?? cfg.url,
      username: body.ics.username ?? cfg.username,
      passwordEncrypted: body.ics.password
        ? encrypt(body.ics.password)
        : (cfg.passwordEncrypted ?? ''),
    } satisfies ICSConfig
  }
}

// ---------------------------------------------------------------------------
// Summary card payload (next 7 days)
// ---------------------------------------------------------------------------

function eventEndMs(e: ExpandedEvent): number {
  if (e.dtend) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtend)) return new Date(e.dtend + 'T23:59:59').getTime()
    return new Date(e.dtend).getTime()
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtstart)) return new Date(e.dtstart + 'T23:59:59').getTime()
  return new Date(e.dtstart).getTime()
}

function localDateKey(iso: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function syncPriority(e: ExpandedEvent): number {
  if (e.syncState === 'local_new' || e.syncState === 'local_modified') return 0
  if (e.syncState === 'conflict') return 1
  return 2
}

export function buildSummary(expanded: ExpandedEvent[], pending: number, conflicts: number): SummaryResponse {
  const now = new Date()
  const nowMs = now.getTime()
  const todayKey = localDateKey(now.toISOString())

  const stillRelevant = expanded.filter(e => eventEndMs(e) >= nowMs)
  const sorted = [...stillRelevant].sort((a, b) => {
    const pd = syncPriority(a) - syncPriority(b)
    if (pd !== 0) return pd
    return a.dtstart.localeCompare(b.dtstart)
  })

  const seenMasters = new Set<string>()
  const upcomingDeduped: ExpandedEvent[] = []
  for (const e of sorted) {
    if (seenMasters.has(e.id)) continue
    seenMasters.add(e.id)
    upcomingDeduped.push(e)
    if (upcomingDeduped.length >= 20) break
  }

  const todayIds = new Set<string>()
  for (const e of expanded) {
    if (localDateKey(e.dtstart) === todayKey) todayIds.add(e.id)
  }

  return {
    now: now.toISOString(),
    todayCount: todayIds.size,
    upcoming: upcomingDeduped.slice(0, 15).map(e => ({
      id: e.id,
      calendarId: e.calendarId,
      summary: e.summary || '(ohne Titel)',
      dtstart: e.dtstart,
      dtend: e.dtend,
      allDay: e.allDay,
      syncState: e.syncState,
      calendarColor: e.calendarColor,
      calendarName: e.calendarName,
      location: e.location,
      description: e.description,
      instanceStart: e.isRecurrenceInstance ? e.dtstart : undefined,
    })),
    pendingChanges: pending,
    conflicts,
  }
}

// ---------------------------------------------------------------------------
// canned responses
// ---------------------------------------------------------------------------

export function notFound(message = 'not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function ok<T>(data: T) {
  return NextResponse.json(data)
}
