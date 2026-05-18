import { NextResponse } from 'next/server'

import { accountToImapConfig } from '@/lib/mail/types'
import { testImapConnection } from '@/lib/mail/imap'
import { applyAccountUpdate, findAccount, readMailStore } from '@/lib/mail/store'
import { DEFAULT_ACCOUNT_FIELDS, newAccountId } from '@/lib/mail/types'

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
    let account =
      (typeof body.accountId === 'string' ? findAccount(store, body.accountId) : undefined) ??
      store.accounts[0] ??
      {
        id: newAccountId(),
        label: 'Test',
        ...DEFAULT_ACCOUNT_FIELDS,
      }

    const merged = applyAccountUpdate({ ...account }, body)
    const result = await testImapConnection(accountToImapConfig(merged))
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      unread: result.unread,
      folders: result.folders,
      mode: result.mode,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
