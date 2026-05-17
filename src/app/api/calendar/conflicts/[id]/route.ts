/**
 * POST /api/calendar/conflicts/:id/resolve  — body: { side: 'local' | 'remote' }
 *
 * side = 'remote' → accept the remote version verbatim (overwrite local fields)
 * side = 'local'  → keep local edits and queue a push that will overwrite remote
 *
 * Special case: when conflictRemoteIcal is the empty string, the remote was
 * deleted while we had local changes; accepting "remote" means deleting the
 * local row too.
 */

import { NextRequest } from 'next/server'

import { badRequest, notFound, ok } from '@/lib/calendar/api-helpers'
import { parseVcalendar } from '@/lib/calendar/ical'
import { mutateStore, nowIso } from '@/lib/calendar/store'
import { runSync } from '@/lib/calendar/sync'
import type { ConflictResolveBody } from '@/lib/calendar/types'

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: ConflictResolveBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  if (body.side !== 'local' && body.side !== 'remote') return badRequest("side must be 'local' or 'remote'")

  let found = false
  let triggerAccountId: string | null = null
  let resolution: 'remote_kept' | 'local_will_overwrite' | 'deleted_locally' | null = null

  await mutateStore(s => {
    const idx = s.events.findIndex(e => e.id === id)
    if (idx === -1) return
    const ev = s.events[idx]
    if (ev.syncState !== 'conflict') return
    found = true
    const cal = s.calendars.find(c => c.id === ev.calendarId)
    triggerAccountId = cal?.accountId ?? null

    if (body.side === 'remote') {
      if (!ev.conflictRemoteIcal) {
        // remote was deleted → drop locally
        s.events.splice(idx, 1)
        resolution = 'deleted_locally'
        return
      }
      const parsed = parseVcalendar(ev.conflictRemoteIcal)[0]
      if (!parsed) return
      Object.assign(ev, {
        icalData: ev.conflictRemoteIcal,
        summary: parsed.summary,
        description: parsed.description,
        location: parsed.location,
        dtstart: parsed.dtstart,
        dtend: parsed.dtend,
        allDay: parsed.allDay,
        rrule: parsed.rrule,
        syncState: 'synced' as const,
        conflictRemoteIcal: undefined,
        localModifiedAt: nowIso(),
      })
      resolution = 'remote_kept'
    } else {
      ev.syncState = 'local_modified'
      ev.conflictRemoteIcal = undefined
      ev.localModifiedAt = nowIso()
      resolution = 'local_will_overwrite'
    }
  })

  if (!found) return notFound('no conflict on this event')
  if (resolution === 'local_will_overwrite' && triggerAccountId) {
    runSync(triggerAccountId).catch(() => undefined)
  }
  return ok({ ok: true, resolution })
}
