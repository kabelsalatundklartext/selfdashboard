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
    a.config = {
      url: body.caldav.url,
      username: body.caldav.username,
      passwordEncrypted: encrypt(body.caldav.password),
      verifySsl: body.caldav.verifySsl,
    } satisfies CalDAVConfig
  }
  if (a.provider === 'ics' && body.ics) {
    a.config = {
      url: body.ics.url,
      username: body.ics.username,
      passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : '',
    } satisfies ICSConfig
  }
}

// ---------------------------------------------------------------------------
// Summary card payload (next 7 days)
// ---------------------------------------------------------------------------

export function buildSummary(expanded: ExpandedEvent[], pending: number, conflicts: number): SummaryResponse {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const sorted = [...expanded].sort((a, b) => a.dtstart.localeCompare(b.dtstart))
  return {
    now: now.toISOString(),
    todayCount: sorted.filter(e => e.dtstart.slice(0, 10) === today).length,
    upcoming: sorted.slice(0, 10).map(e => ({
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
