/**
 * GET  /api/calendar/accounts        — list configured accounts (no secrets)
 * POST /api/calendar/accounts        — create a new account
 *
 * On create we kick off a sync in the background so the user sees their
 * calendars and events without having to wait or hit the sync button.
 */

import { NextRequest, NextResponse } from 'next/server'

import {
  applyAccountUpdate,
  badRequest,
  buildAccount,
  ok,
  toAccountView,
} from '@/lib/calendar/api-helpers'
import { mutateStore, readStore } from '@/lib/calendar/store'
import { runSync } from '@/lib/calendar/sync'
import type { AccountCreateBody } from '@/lib/calendar/types'

export async function GET() {
  const store = await readStore()
  return ok(store.accounts.map(a => toAccountView(a, store.calendars)))
}

export async function POST(req: NextRequest) {
  let body: AccountCreateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }

  if (!body?.name || !body?.provider) return badRequest('name and provider required')

  let newId: string
  try {
    const account = buildAccount(body)
    newId = account.id
    await mutateStore(s => {
      s.accounts.push(account)
    })
  } catch (e: any) {
    return badRequest(e?.message ?? 'invalid body')
  }

  // fire-and-forget initial sync — UI polls /accounts and /summary
  runSync(newId).catch(() => undefined)

  const store = await readStore()
  const created = store.accounts.find(a => a.id === newId)!
  return ok(toAccountView(created, store.calendars))
}
