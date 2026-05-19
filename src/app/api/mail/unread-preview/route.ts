import { NextResponse } from 'next/server'

import { formatMailError } from '@/lib/mail/errors'
import { fetchUnreadMessagePreviews } from '@/lib/mail/imap'
import { logMailEvent } from '@/lib/mail/log'
import {
  applyAccountUpdate,
  findAccount,
  readMailStore,
} from '@/lib/mail/store'
import { accountToImapConfig, DEFAULT_ACCOUNT_FIELDS, newAccountId } from '@/lib/mail/types'

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
    const account =
      (typeof body.accountId === 'string' ? findAccount(store, body.accountId) : undefined) ??
      store.accounts[0] ??
      {
        id: newAccountId(),
        label: 'Preview',
        ...DEFAULT_ACCOUNT_FIELDS,
      }

    const merged = applyAccountUpdate({ ...account }, body)
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
