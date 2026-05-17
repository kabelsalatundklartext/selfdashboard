/**
 * POST /api/calendar/accounts/:id/test — verify credentials without storing.
 * Returns the list of discoverable remote calendars on success.
 */

import { NextRequest } from 'next/server'

import { notFound, ok } from '@/lib/calendar/api-helpers'
import { readStore } from '@/lib/calendar/store'
import { testAccount } from '@/lib/calendar/sync'

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const store = await readStore()
  const account = store.accounts.find(a => a.id === id)
  if (!account) return notFound('account not found')
  const result = await testAccount(account)
  return ok(result)
}
