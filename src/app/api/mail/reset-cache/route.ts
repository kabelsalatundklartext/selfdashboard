import { NextResponse } from 'next/server'

import { formatMailError } from '@/lib/mail/errors'
import { logMailEvent } from '@/lib/mail/log'
import { runMailSync } from '@/lib/mail/sync'
import { pickOpenUrl, readMailStore, resetMailStatusCache, toPublicConfigLegacy } from '@/lib/mail/store'

export const dynamic = 'force-dynamic'

/** Leert den gespeicherten Mail-Status (Zähler) und startet sofort einen IMAP-Sync. */
export async function POST() {
  try {
    await resetMailStatusCache()
    await runMailSync({ wait: true })
    const store = await readMailStore()
    return NextResponse.json({
      ok: true,
      navbarEnabled: store.navbarEnabled,
      pollIntervalSeconds: store.pollIntervalSeconds,
      unreadMaxAgeDays: store.unreadMaxAgeDays,
      unread: store.status.unread,
      lastSyncAt: store.status.lastSyncAt,
      lastError: store.status.lastError,
      accounts: store.status.accounts,
      openUrl: pickOpenUrl(store),
      config: toPublicConfigLegacy(store),
    })
  } catch (e: unknown) {
    const msg = formatMailError(e instanceof Error ? e.message : String(e))
    void logMailEvent('reset-cache', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
