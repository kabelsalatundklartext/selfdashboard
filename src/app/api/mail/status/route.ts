import { NextResponse } from 'next/server'

import { runMailSync } from '@/lib/mail/sync'
import { pickOpenUrl, readMailStore, toPublicConfigLegacy } from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('refresh') === '1'

  try {
    if (force) await runMailSync({ wait: true })
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      enabled: store.navbarEnabled,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unread: store.status.unread,
      hasNew: store.navbarEnabled && store.status.unread > 0,
      lastSyncAt: store.status.lastSyncAt,
      lastError: store.status.lastError,
      openUrl: pickOpenUrl(store),
      accounts: store.status.accounts,
      config: toPublicConfigLegacy(store),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}
