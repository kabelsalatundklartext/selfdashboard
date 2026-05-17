/**
 * POST /api/calendar/accounts/:id/sync — trigger a sync run for one account.
 *
 * Synchronous from the client's perspective: the response only comes back
 * after the run finishes. The UI shows a spinner while waiting; for very
 * large calendars (1000+ events) this can take several seconds.
 */

import { NextRequest } from 'next/server'

import { badRequest, notFound, ok } from '@/lib/calendar/api-helpers'
import { readStore } from '@/lib/calendar/store'
import { runSync } from '@/lib/calendar/sync'

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const store = await readStore()
  const account = store.accounts.find(a => a.id === id)
  if (!account) return notFound('account not found')
  if (!account.enabled) return badRequest('account is disabled')
  const log = await runSync(id)
  return ok(log)
}
