/**
 * GET /api/calendar/conflicts — list all events in conflict state, with the
 * remote-side iCal blob included so the UI can render a diff.
 */

import { ok } from '@/lib/calendar/api-helpers'
import { readStore } from '@/lib/calendar/store'

export async function GET() {
  const store = await readStore()
  const conflicts = store.events
    .filter(e => e.syncState === 'conflict')
    .map(e => {
      const cal = store.calendars.find(c => c.id === e.calendarId)
      return { ...e, calendarName: cal?.name, calendarColor: cal?.color }
    })
  return ok(conflicts)
}
