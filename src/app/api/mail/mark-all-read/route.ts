import { NextResponse } from 'next/server'

import { formatMailError } from '@/lib/mail/errors'
import { markAllUnreadAsRead } from '@/lib/mail/imap'
import { logMailEvent } from '@/lib/mail/log'
import { runMailSync } from '@/lib/mail/sync'
import { readMailStore, resolveAccountFromRequest } from '@/lib/mail/store'
import { accountToImapConfig } from '@/lib/mail/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored account */
  }

  try {
    const store = await readMailStore()
    const merged = resolveAccountFromRequest(store, body, 'Mark read')
    if (!merged.passwordEncrypted?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Passwort fehlt — bitte speichern oder Testen mit Passwort.' },
        { status: 400 },
      )
    }

    const result = await markAllUnreadAsRead(accountToImapConfig(merged, store.unreadMaxAgeDays))
    await runMailSync({ wait: true })

    void logMailEvent('mark-all-read', `${result.marked} Nachricht(en) als gelesen markiert`, {
      detail: {
        accountId: merged.id,
        label: merged.label,
        marked: result.marked,
        folders: result.folders.map(f => `${f.path}:${f.marked}`).join(', ').slice(0, 400),
      },
    })

    const fresh = await readMailStore()
    return NextResponse.json({ ok: true, ...result, status: fresh.status })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('mark-all-read', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
