/**
 * PUT    /api/calendar/events/:id  — update an event (marks 'local_modified')
 * DELETE /api/calendar/events/:id  — delete an event
 *
 * For events that were never pushed yet (syncState = 'local_new'), DELETE
 * just drops the row. Otherwise we mark 'local_deleted' so the next sync
 * issues a DELETE against the remote.
 */

import { NextRequest } from 'next/server'

import { badRequest, notFound, ok } from '@/lib/calendar/api-helpers'
import { buildVcalendar } from '@/lib/calendar/ical'
import { mutateStore, nowIso, readStore } from '@/lib/calendar/store'
import { runSync } from '@/lib/calendar/sync'
import type { CalendarEvent, EventUpdateBody, SyncLogEntry } from '@/lib/calendar/types'

export const runtime = 'nodejs'

interface Ctx { params: Promise<{ id: string }> }

type UpdateEventResponse = CalendarEvent & { syncError?: string }

function isSyncLogEntry(v: unknown): v is SyncLogEntry {
  return typeof v === 'object' && v !== null && 'accountId' in v && 'id' in v
}

function messageFromSyncResult(log: SyncLogEntry | { error: string }): string | undefined {
  if (isSyncLogEntry(log)) return log.error
  return log.error
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: EventUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }

  let calendarAccountId: string | null = null
  let found = false

  await mutateStore(s => {
    const ev = s.events.find(e => e.id === id)
    if (!ev) return
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) return
    found = true
    calendarAccountId = cal.accountId

    if (body.summary !== undefined) ev.summary = body.summary
    if (body.description !== undefined) ev.description = body.description
    if (body.location !== undefined) ev.location = body.location
    if (body.dtstart !== undefined) ev.dtstart = body.dtstart
    if (body.dtend !== undefined) ev.dtend = body.dtend
    if (body.allDay !== undefined) ev.allDay = body.allDay
    if (body.rrule !== undefined) ev.rrule = body.rrule
    ev.localModifiedAt = nowIso()
    ev.icalData = buildVcalendar({
      uid: ev.uid,
      summary: ev.summary,
      description: ev.description,
      location: ev.location,
      dtstart: ev.dtstart,
      dtend: ev.dtend,
      allDay: ev.allDay,
      rrule: ev.rrule,
      lastModifiedIso: ev.localModifiedAt,
    })
    if (ev.syncState === 'synced') ev.syncState = 'local_modified'
    // if local_new — keep that, the next push creates it remote-side
  })

  if (!found) return notFound('event not found or its calendar is read-only')

  let syncResult: SyncLogEntry | { error: string } | undefined
  if (calendarAccountId) {
    try {
      syncResult = await runSync(calendarAccountId)
    } catch (e: unknown) {
      syncResult = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  const after = await readStore()
  const ev = after.events.find(e => e.id === id)
  if (!ev) return notFound('event not found after sync')

  const acc = calendarAccountId ? after.accounts.find(a => a.id === calendarAccountId) : undefined
  const syncError =
    (syncResult ? messageFromSyncResult(syncResult) : undefined) ??
    (ev.syncState === 'local_new' || ev.syncState === 'local_modified' ? acc?.lastSyncError : undefined)

  const payload: UpdateEventResponse = syncError ? { ...ev, syncError } : ev
  return ok(payload)
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let triggerAccountId: string | null = null
  let found = false

  await mutateStore(s => {
    const idx = s.events.findIndex(e => e.id === id)
    if (idx === -1) return
    const ev = s.events[idx]
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) return
    found = true
    triggerAccountId = cal.accountId
    if (ev.syncState === 'local_new') {
      s.events.splice(idx, 1)
    } else {
      ev.syncState = 'local_deleted'
      ev.localModifiedAt = nowIso()
    }
  })

  if (!found) return notFound('event not found or its calendar is read-only')
  if (triggerAccountId) runSync(triggerAccountId).catch(() => undefined)
  return ok({ ok: true })
}
