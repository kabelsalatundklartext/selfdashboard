import { NextResponse } from 'next/server'

import { formatMailError } from '@/lib/mail/errors'
import { fetchUnreadMessagePreviews } from '@/lib/mail/imap'
import { logMailEvent } from '@/lib/mail/log'
import { readMailStore, resolveAccountFromRequest } from '@/lib/mail/store'
import { accountToImapConfig } from '@/lib/mail/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored */
  }

  try {
    const store = await readMailStore()
    const merged = resolveAccountFromRequest(store, body, 'Preview')
    const result = await fetchUnreadMessagePreviews(
      accountToImapConfig(merged, store.unreadMaxAgeDays),
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('unread-preview', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
