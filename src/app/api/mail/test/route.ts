import { NextResponse } from 'next/server'

import { testImapConnection } from '@/lib/mail/imap'
import { applyMailConfigUpdate, readMailStore } from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

/** Test IMAP with optional inline credentials (before save) or stored config. */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    /* use stored config only */
  }

  try {
    const store = await readMailStore()
    const config = applyMailConfigUpdate(store.config, body)
    const result = await testImapConnection(config)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, unread: result.unread })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
