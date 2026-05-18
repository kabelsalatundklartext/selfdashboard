import { NextResponse } from 'next/server'

import { accountToImapConfig } from '@/lib/mail/types'
import { testImapConnection } from '@/lib/mail/imap'
import { formatMailError } from '@/lib/mail/errors'
import {
  applyAccountUpdate,
  findAccount,
  mutateMailStore,
  persistAccountFromImapTest,
  pickOpenUrl,
  readMailStore,
} from '@/lib/mail/store'
import { logMailEvent } from '@/lib/mail/log'
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
      void logMailEvent('test', result.error, {
        detail: { accountId: merged.id, label: merged.label, host: merged.host },
      })
      return NextResponse.json({ ok: false, error: formatMailError(result.error) }, { status: 400 })
    }
    let status: Awaited<ReturnType<typeof readMailStore>>['status'] | undefined
    let openUrl: string | null = null
    const accountKey =
      (typeof body.accountId === 'string' && body.accountId) ||
      (typeof body.id === 'string' && body.id) ||
      undefined
    if (accountKey && findAccount(store, accountKey)) {
      const id = accountKey
      await mutateMailStore(s => {
        persistAccountFromImapTest(s, { ...merged, id }, result.unread)
      })
      const fresh = await readMailStore()
      status = fresh.status
      openUrl = pickOpenUrl(fresh)
    }

    return NextResponse.json({
      ok: true,
      unread: status?.unread ?? result.unread,
      folders: result.folders,
      mode: result.mode,
      status,
      openUrl,
      navbarUpdated: Boolean(status),
    })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('test', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
