import { NextResponse } from 'next/server'

import { runMailSync } from '@/lib/mail/sync'
import {
  applyMailConfigUpdate,
  mutateMailStore,
  readMailStore,
  toPublicConfig,
} from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      config: toPublicConfig(store.config),
      status: store.status,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  try {
    const store = await mutateMailStore(s => {
      s.config = applyMailConfigUpdate(s.config, body)
    })

    if (store.config.enabled) {
      await runMailSync()
    } else {
      await mutateMailStore(s => {
        s.status.unread = 0
        s.status.lastError = undefined
      })
    }

    const updated = await readMailStore()
    return NextResponse.json({
      ok: true,
      config: toPublicConfig(updated.config),
      status: updated.status,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
