import { NextResponse } from 'next/server'

import { runMailSync } from '@/lib/mail/sync'
import { readMailStore, toPublicConfig } from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('refresh') === '1'

  try {
    if (force) await runMailSync()
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      enabled: store.config.enabled,
      config: toPublicConfig(store.config),
      unread: store.status.unread,
      hasNew: store.config.enabled && store.status.unread > 0,
      lastSyncAt: store.status.lastSyncAt,
      lastError: store.status.lastError,
      openUrl: store.config.openUrl || null,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}
