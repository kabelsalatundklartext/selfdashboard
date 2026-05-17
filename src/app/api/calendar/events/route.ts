/**
 * GET  /api/calendar/events?start=ISO&end=ISO&calendarId=...   — list events
 * POST /api/calendar/events                                     — create event
 *
 * GET expands recurrences within the requested range. The range is required
 * because expanding the entire database on every request would be wasteful;
 * the UI knows its viewport and asks for exactly what it needs.
 *
 * POST writes the event with `syncState = 'local_new'` and kicks off a
 * background sync for the owning account so the push happens promptly.
 */

import { NextRequest } from 'next/server'

import { badRequest, ok } from '@/lib/calendar/api-helpers'
import { buildVcalendar, expandRecurrences, newUid } from '@/lib/calendar/ical'
import { mutateStore, newId, nowIso, readStore } from '@/lib/calendar/store'
import { runSync } from '@/lib/calendar/sync'
import type { EventCreateBody } from '@/lib/calendar/types'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const calendarId = url.searchParams.get('calendarId') ?? undefined

  if (!start || !end) return badRequest('start and end query params required')

  let startDate: Date, endDate: Date
  try {
    startDate = new Date(start)
    endDate = new Date(end)
    if (isNaN(+startDate) || isNaN(+endDate)) throw new Error('bad date')
  } catch {
    return badRequest('start and end must be valid ISO datetimes')
  }

  const store = await readStore()
  const visibleCalendarIds = new Set(
    store.calendars.filter(c => c.visible && (!calendarId || c.id === calendarId)).map(c => c.id),
  )
  const calendarLookup = (id: string) => {
    const c = store.calendars.find(x => x.id === id)
    return { name: c?.name, color: c?.color }
  }

  const candidates = store.events.filter(
    e => visibleCalendarIds.has(e.calendarId) && e.syncState !== 'local_deleted',
  )
  const expanded = expandRecurrences(candidates, startDate, endDate, calendarLookup)
  return ok(expanded)
}

export async function POST(req: NextRequest) {
  let body: EventCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (!body?.calendarId || !body?.dtstart) return badRequest('calendarId and dtstart required')

  const store = await readStore()
  const cal = store.calendars.find(c => c.id === body.calendarId)
  if (!cal) return badRequest('calendar not found')
  if (cal.readOnly) return badRequest('calendar is read-only')

  const uid = newUid()
  const evId = newId('evt')
  const ical = buildVcalendar({
    uid,
    summary: body.summary,
    description: body.description,
    location: body.location,
    dtstart: body.dtstart,
    dtend: body.dtend,
    allDay: body.allDay,
    rrule: body.rrule,
    lastModifiedIso: nowIso(),
  })

  await mutateStore(s => {
    s.events.push({
      id: evId,
      calendarId: body.calendarId,
      uid,
      icalData: ical,
      summary: body.summary,
      description: body.description ?? '',
      location: body.location ?? '',
      dtstart: body.dtstart,
      dtend: body.dtend,
      allDay: body.allDay,
      rrule: body.rrule,
      localModifiedAt: nowIso(),
      syncState: 'local_new',
    })
  })

  const log = await runSync(cal.accountId).catch((e: unknown) => ({
    error: e instanceof Error ? e.message : String(e),
  }))

  const after = await readStore()
  const ev = after.events.find(e => e.id === evId)
  if (!ev) {
    return ok({
      error: 'sync_removed_event',
      syncError: typeof log === 'object' && log && 'error' in log ? String((log as { error?: string }).error) : undefined,
    })
  }
  const acc = after.accounts.find(a => a.id === cal.accountId)
  const syncError =
    (typeof log === 'object' && log && 'error' in log ? (log as { error?: string }).error : undefined) ??
    (ev.syncState === 'local_new' ? acc?.lastSyncError : undefined)
  return ok(syncError ? { ...ev, syncError } : ev)
