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
import { buildVcalendar, normalizeEventTimes } from '@/lib/calendar/ical'
import { mutateStore, nowIso, readStore } from '@/lib/calendar/store'
import { syncAfterMutation } from '@/lib/calendar/sync'
import type { CalendarEvent, EventUpdateBody } from '@/lib/calendar/types'

export const runtime = 'nodejs'

interface Ctx { params: Promise<{ id: string }> }

type UpdateEventResponse = CalendarEvent & { syncError?: string; syncPending?: boolean }

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: EventUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }

  let calendarAccountId: string | null = null
  let calendarIdsToSync: string[] = []
  let failReason: 'not_found' | 'read_only' | 'bad_calendar' | null = null

  await mutateStore(s => {
    const ev = s.events.find(e => e.id === id)
    if (!ev) {
      failReason = 'not_found'
      return
    }
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) {
      failReason = 'read_only'
      return
    }
    calendarAccountId = cal.accountId

    const oldCalendarId = ev.calendarId
    if (body.calendarId !== undefined && body.calendarId !== ev.calendarId) {
      const newCal = s.calendars.find(c => c.id === body.calendarId)
      if (!newCal) {
        failReason = 'bad_calendar'
        return
      }
      if (newCal.readOnly) {
        failReason = 'bad_calendar'
        return
      }
      if (ev.remoteHref && ev.syncState !== 'local_new') {
        ev.pendingRemoteDelete = {
          calendarId: oldCalendarId,
          remoteHref: ev.remoteHref,
          remoteEtag: ev.remoteEtag ?? '',
        }
      }
      ev.calendarId = body.calendarId
      ev.remoteHref = undefined
      ev.remoteEtag = undefined
      ev.syncState = 'local_new'
      calendarIdsToSync = [oldCalendarId, body.calendarId]
    } else {
      calendarIdsToSync = [ev.calendarId]
    }

    if (body.summary !== undefined) ev.summary = body.summary
    if (body.description !== undefined) ev.description = body.description
    if (body.location !== undefined) ev.location = body.location
    const times = normalizeEventTimes({
      dtstart: body.dtstart ?? ev.dtstart,
      dtend: body.dtend ?? ev.dtend,
      allDay: body.allDay ?? ev.allDay,
    })
    if (body.dtstart !== undefined) ev.dtstart = times.dtstart
    if (body.dtend !== undefined) ev.dtend = times.dtend
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
    // local_new (incl. after calendar move) — next push creates in the target collection
  })

  if (failReason === 'not_found') return notFound('event not found')
  if (failReason === 'read_only') return notFound('event not found or its calendar is read-only')
  if (failReason === 'bad_calendar') return badRequest('target calendar not found or read-only')

  const syncError = calendarAccountId
    ? await syncAfterMutation(calendarAccountId, { calendarIds: calendarIdsToSync })
    : undefined

  const after = await readStore()
  const ev = after.events.find(e => e.id === id)
  if (!ev) return notFound('event not found')

  const payload: UpdateEventResponse = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== 'synced' && !syncError,
  }
  return ok(payload)
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let triggerAccountId: string | null = null
  let calendarIdToSync: string | null = null
  let found = false

  await mutateStore(s => {
    const idx = s.events.findIndex(e => e.id === id)
    if (idx === -1) return
    const ev = s.events[idx]
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    if (!cal || cal.readOnly) return
    found = true
    triggerAccountId = cal.accountId
    calendarIdToSync = ev.calendarId
    if (ev.syncState === 'local_new') {
      s.events.splice(idx, 1)
    } else {
      ev.syncState = 'local_deleted'
      ev.localModifiedAt = nowIso()
    }
  })

  if (!found) return notFound('event not found or its calendar is read-only')
  const syncError = triggerAccountId
    ? await syncAfterMutation(triggerAccountId, {
        calendarIds: calendarIdToSync ? [calendarIdToSync] : undefined,
      })
    : undefined
  return ok({ ok: true, syncError })
}
