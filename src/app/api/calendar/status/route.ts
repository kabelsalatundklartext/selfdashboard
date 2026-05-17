/**
 * GET /api/calendar/status — aggregate status (accounts, recent sync runs,
 * pending change count, conflict count). Used by the Accounts view.
 */

import { ok, toAccountView } from '@/lib/calendar/api-helpers'
import { readStore } from '@/lib/calendar/store'

export async function GET() {
  const store = await readStore()
  const pending = store.events.filter(
    e => e.syncState === 'local_new' || e.syncState === 'local_modified' || e.syncState === 'local_deleted',
  ).length
  const conflicts = store.events.filter(e => e.syncState === 'conflict').length
  return ok({
    accounts: store.accounts.map(a => toAccountView(a, store.calendars)),
    recentRuns: store.syncLog.slice(0, 20),
    pendingChanges: pending,
    conflicts,
  })
}
