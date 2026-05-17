/**
 * PUT    /api/calendar/accounts/:id  — update account fields
 * DELETE /api/calendar/accounts/:id  — remove account; cascades to local calendars/events
 *
 * Note: DELETE removes the LOCAL copy only. Events stay on the server
 * untouched — that's intentional.
 */

import { NextRequest } from 'next/server'

import {
  applyAccountUpdate,
  badRequest,
  notFound,
  ok,
  toAccountView,
} from '@/lib/calendar/api-helpers'
import { mutateStore, readStore } from '@/lib/calendar/store'
import type { AccountUpdateBody } from '@/lib/calendar/types'

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: AccountUpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }
  let found = false
  await mutateStore(s => {
    const a = s.accounts.find(x => x.id === id)
    if (!a) return
    found = true
    applyAccountUpdate(a, body)
  })
  if (!found) return notFound('account not found')
  const store = await readStore()
  const updated = store.accounts.find(a => a.id === id)!
  return ok(toAccountView(updated, store.calendars))
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let found = false
  await mutateStore(s => {
    const idx = s.accounts.findIndex(a => a.id === id)
    if (idx === -1) return
    found = true
    s.accounts.splice(idx, 1)
    const calIds = new Set(s.calendars.filter(c => c.accountId === id).map(c => c.id))
    s.calendars = s.calendars.filter(c => !calIds.has(c.id))
    s.events = s.events.filter(e => !calIds.has(e.calendarId))
  })
  if (!found) return notFound('account not found')
  return ok({ ok: true })
}
