/**
 * Sync orchestrator.
 *
 * Public entry points:
 *   - `runSync(accountId)` — sync one account once (called from `/accounts/:id/sync`
 *      and after every create/update/delete on events to push promptly)
 *   - `startScheduler()`   — kick off an in-process periodic sync loop;
 *      invoked from Next.js instrumentation (see `src/instrumentation.ts`)
 *
 * Concurrency: all writes go through `mutateOwnerStore`, which is mutex'd
 * PER OWNER (see store.ts), so we never corrupt a user's JSON and one user's
 * slow CalDAV server no longer blocks other users. Note: the network sync for
 * a calendar still runs inside that owner's lock (the two-way merge mutates the
 * live store as it goes), so it briefly serialises that same owner's other
 * calendar writes — acceptable, and far less harmful than the old global lock.
 */

import { logPluginApiFailure } from './log'
import {
  findAccountOwnerUserId,
  legacyStoreExists,
  listCalendarOwnerUserIds,
  mutateOwnerStore,
  newId,
  nowIso,
  readLegacyStore,
  readOwnerStore,
  LEGACY_OWNER_ID,
} from './store'
import {
  discoverCaldavCalendars,
  getCaldavClientCache,
  syncCaldavCalendar,
  syncCaldavCalendarPushOnly,
  testCaldav,
  type CaldavClientCache,
} from './caldav'
import { discoverIcsCalendars, syncIcsCalendar, testIcs } from './ics'
import type { Account, SyncLogEntry, SyncStatus } from './types'

const DEFAULT_INTERVAL_MS = parseInt(
  process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? '300',
  10,
) * 1000

let schedulerStarted = false
let schedulerTimer: ReturnType<typeof setTimeout> | null = null

// ---------------------------------------------------------------------------

export async function discoverAccountCalendars(account: Account) {
  if (account.provider === 'caldav') return discoverCaldavCalendars(account)
  if (account.provider === 'ics') return discoverIcsCalendars(account)
  throw new Error(`unknown provider: ${account.provider}`)
}

export async function testAccount(account: Account) {
  if (account.provider === 'caldav') return testCaldav(account)
  if (account.provider === 'ics') return testIcs(account)
  return { ok: false, error: `unknown provider: ${account.provider}` }
}

// ---------------------------------------------------------------------------

export interface RunSyncOptions {
  /** Only sync these calendar rows (default: all calendars on the account). */
  calendarIds?: string[]
  /** Skip remote calendar discovery (faster after local edits). */
  skipDiscover?: boolean
  /** Push pending local changes only; skip pull (much faster for save/create/delete). */
  pushOnly?: boolean
}

/** Run sync after create/update/delete; returns user-visible error text if push/pull failed. */
export async function syncAfterMutation(
  accountId: string,
  opts?: Pick<RunSyncOptions, 'calendarIds'>,
): Promise<string | undefined> {
  const log = await runSync(accountId, {
    calendarIds: opts?.calendarIds,
    skipDiscover: true,
    pushOnly: true,
  })
  return log.error ?? undefined
}

async function listEnabledAccounts(): Promise<Array<{ ownerUserId: string; account: Account }>> {
  const out: Array<{ ownerUserId: string; account: Account }> = []
  if (legacyStoreExists()) {
    const legacy = await readLegacyStore()
    for (const account of legacy.accounts) {
      if (account.enabled) out.push({ ownerUserId: LEGACY_OWNER_ID, account })
    }
  }
  for (const ownerUserId of listCalendarOwnerUserIds()) {
    const store = await readOwnerStore(ownerUserId)
    for (const account of store.accounts) {
      if (account.enabled) out.push({ ownerUserId, account })
    }
  }
  return out
}

export async function runSync(accountId: string, opts?: RunSyncOptions): Promise<SyncLogEntry> {
  const ownerUserId = await findAccountOwnerUserId(accountId)
  if (!ownerUserId) {
    return makeLogEntry(accountId, 'disabled or not found', {
      added: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
    })
  }

  const store = await readOwnerStore(ownerUserId)
  const account = store.accounts.find((a) => a.id === accountId)
  if (!account || !account.enabled) {
    return makeLogEntry(accountId, 'disabled or not found', {
      added: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
    })
  }

  let totalAdded = 0
  let totalUpdated = 0
  let totalDeleted = 0
  let totalConflicts = 0
  const errors: string[] = []

  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountCalendars(account)
      const discoveredIds = new Set(discovered.map((d) => d.remoteId))
      await mutateOwnerStore(ownerUserId, (s) => {
        for (const d of discovered) {
          let cal = s.calendars.find((c) => c.accountId === account.id && c.remoteId === d.remoteId)
          if (!cal) {
            cal = {
              id: newId('cal'),
              accountId: account.id,
              remoteId: d.remoteId,
              name: d.name,
              color: d.color ?? randomColor(d.name),
              readOnly: d.readOnly,
              visible: true,
            }
            s.calendars.push(cal)
          } else {
            cal.name = d.name
            cal.readOnly = d.readOnly
            if (d.color) cal.color = d.color
          }
        }
        const stale = s.calendars.filter(
          (c) => c.accountId === account.id && !discoveredIds.has(c.remoteId),
        )
        if (stale.length) {
          const staleIds = new Set(stale.map((c) => c.id))
          s.calendars = s.calendars.filter((c) => !staleIds.has(c.id))
          s.events = s.events.filter((e) => !staleIds.has(e.calendarId))
        }
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`discover: ${msg}`)
      const errText = errors.join('; ')
      void logPluginApiFailure('calendar', 'discover', errText, {
        accountId,
        provider: account.provider,
      })
      const log = makeLogEntry(accountId, errText, {
        added: 0,
        updated: 0,
        deleted: 0,
        conflicts: 0,
      })
      await mutateOwnerStore(ownerUserId, (s) => {
        s.syncLog.unshift(log)
        s.syncLog = s.syncLog.slice(0, 50)
        const acc = s.accounts.find((a) => a.id === accountId)
        if (acc) {
          acc.lastSyncAt = nowIso()
          acc.lastSyncStatus = 'error'
          acc.lastSyncError = errors.join('; ')
        }
      })
      return log
    }
  }

  let calendars = (await readOwnerStore(ownerUserId)).calendars.filter((c) => c.accountId === account.id)
  if (opts?.calendarIds?.length) {
    const want = new Set(opts.calendarIds)
    calendars = calendars.filter((c) => want.has(c.id))
  }

  let caldavCache: CaldavClientCache | undefined
  if (account.provider === 'caldav' && calendars.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`caldav client: ${msg}`)
    }
  }

  for (const calendar of calendars) {
    try {
      await mutateOwnerStore(ownerUserId, async (s) => {
        const live = s.calendars.find((c) => c.id === calendar.id)!
        const acc = s.accounts.find((a) => a.id === accountId)!
        const r =
          account.provider === 'caldav'
            ? opts?.pushOnly
              ? await syncCaldavCalendarPushOnly(acc, live, s, caldavCache)
              : await syncCaldavCalendar(acc, live, s, caldavCache)
            : opts?.pushOnly
              ? { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] as string[] }
              : await syncIcsCalendar(acc, live, s)
        totalAdded += r.added
        totalUpdated += r.updated
        totalDeleted += r.deleted
        totalConflicts += r.conflicts
        errors.push(...r.errors)
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`cal ${calendar.name}: ${msg}`)
    }
  }

  const status: SyncStatus = errors.length ? 'error' : totalConflicts ? 'conflict' : 'ok'
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join('; ') : undefined,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts },
  )
  await mutateOwnerStore(ownerUserId, (s) => {
    s.syncLog.unshift(log)
    s.syncLog = s.syncLog.slice(0, 50)
    const acc = s.accounts.find((a) => a.id === accountId)
    if (acc) {
      acc.lastSyncAt = nowIso()
      acc.lastSyncStatus = status
      acc.lastSyncError = errors.length ? errors.join('; ') : undefined
    }
  })
  if (errors.length) {
    void logPluginApiFailure('calendar', 'sync', errors.join('; '), {
      accountId,
      provider: account.provider,
      added: totalAdded,
      updated: totalUpdated,
    })
  }
  return log
}

function makeLogEntry(
  accountId: string,
  error: string | undefined,
  counts: { added: number; updated: number; deleted: number; conflicts: number },
): SyncLogEntry {
  return {
    id: newId('log'),
    accountId,
    startedAt: nowIso(),
    finishedAt: nowIso(),
    ...counts,
    error,
  }
}

function randomColor(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hue = h % 360
  return `hsl(${hue}, 55%, 55%)`
}

export function startScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  const tick = async () => {
    try {
      const entries = await listEnabledAccounts()
      for (const { account } of entries) {
        if (
          account.lastSyncAt &&
          Date.now() - new Date(account.lastSyncAt).getTime() < DEFAULT_INTERVAL_MS / 2
        ) {
          continue
        }
        try {
          await runSync(account.id)
        } catch {
          /* swallow; already logged */
        }
      }
    } catch {
      /* swallow */
    }
    schedulerTimer = setTimeout(tick, DEFAULT_INTERVAL_MS)
  }
  schedulerTimer = setTimeout(tick, 5000)
}

export function stopScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer)
  schedulerStarted = false
  schedulerTimer = null
}
