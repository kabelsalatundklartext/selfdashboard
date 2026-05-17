/**
 * GET /api/calendar/summary — compact payload used by the dashboard widget.
 * Returns today's count, the next ~10 upcoming events in the next 7 days,
 * and the count of pending changes and conflicts.
 */

import { buildSummary, ok } from '@/lib/calendar/api-helpers'
import { expandRecurrences } from '@/lib/calendar/ical'
import { readStore } from '@/lib/calendar/store'

export async function GET() {
  const store = await readStore()
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 86400_000)

  const visibleCalendarIds = new Set(store.calendars.filter(c => c.visible).map(c => c.id))
  const calendarLookup = (id: string) => {
    const c = store.calendars.find(x => x.id === id)
    return { name: c?.name, color: c?.color }
  }
  const candidates = store.events.filter(
    e => visibleCalendarIds.has(e.calendarId) && e.syncState !== 'local_deleted',
  )
  const expanded = expandRecurrences(candidates, now, end, calendarLookup)

  const pending = store.events.filter(
    e => e.syncState === 'local_new' || e.syncState === 'local_modified' || e.syncState === 'local_deleted',
  ).length
  const conflicts = store.events.filter(e => e.syncState === 'conflict').length

  return ok(buildSummary(expanded, pending, conflicts))
}
