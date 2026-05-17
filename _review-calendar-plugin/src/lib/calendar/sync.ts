/**
 * Sync orchestrator.
 *
 * Public entry points:
 *   - `runSync(accountId)` — sync one account once (called from `/accounts/:id/sync`
 *      and after every create/update/delete on events to push promptly)
 *   - `startScheduler()`   — kick off an in-process periodic sync loop;
 *      invoked from Next.js instrumentation (see `src/instrumentation.ts`)
 *
 * Concurrency: all writes go through `mutateStore` which is mutex'd, so we
 * can never corrupt the JSON. The sync itself runs network calls outside
 * the mutex and only enters it to merge results back into the store.
 */

import { mutateStore, newId, nowIso, readStore } from './store'
import {
  discoverCaldavCalendars,
  syncCaldavCalendar,
  testCaldav,
} from './caldav'
import { discoverIcsCalendars, syncIcsCalendar, testIcs } from './ics'
import type { Account, CalendarStore, SyncLogEntry, SyncStatus } from './types'

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

export async function runSync(accountId: string): Promise<SyncLogEntry> {
  // snapshot — read once, do all network work without holding the mutex
  const store = await readStore()
  const account = store.accounts.find(a => a.id === accountId)
  if (!account || !account.enabled) {
    return makeLogEntry(accountId, 'disabled or not found', { added: 0, updated: 0, deleted: 0, conflicts: 0 })
  }

  let totalAdded = 0
  let totalUpdated = 0
  let totalDeleted = 0
  let totalConflicts = 0
  const errors: string[] = []

  // step 1: discover calendars and upsert
  try {
    const discovered = await discoverAccountCalendars(account)
    await mutateStore(s => {
      const existing = s.calendars.filter(c => c.accountId === account.id)
      for (const d of discovered) {
        let cal = existing.find(c => c.remoteId === d.remoteId)
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
        }
      }
    })
  } catch (e: any) {
    errors.push(`discover: ${e?.message ?? e}`)
    const log = makeLogEntry(accountId, errors.join('; '), { added: 0, updated: 0, deleted: 0, conflicts: 0 })
    await mutateStore(s => {
      s.syncLog.unshift(log)
      s.syncLog = s.syncLog.slice(0, 50)
      const acc = s.accounts.find(a => a.id === accountId)
      if (acc) {
        acc.lastSyncAt = nowIso()
        acc.lastSyncStatus = 'error'
        acc.lastSyncError = errors.join('; ')
      }
    })
    return log
  }

  // step 2: sync each calendar (network heavy → done with a fresh snapshot per cal)
  const calendars = (await readStore()).calendars.filter(c => c.accountId === account.id)
  for (const calendar of calendars) {
    try {
      await mutateStore(async s => {
        const live = s.calendars.find(c => c.id === calendar.id)!
        const acc = s.accounts.find(a => a.id === accountId)!
        const r = account.provider === 'caldav'
          ? await syncCaldavCalendar(acc, live, s)
          : await syncIcsCalendar(acc, live, s)
        totalAdded += r.added
        totalUpdated += r.updated
        totalDeleted += r.deleted
        totalConflicts += r.conflicts
        errors.push(...r.errors)
      })
    } catch (e: any) {
      errors.push(`cal ${calendar.name}: ${e?.message ?? e}`)
    }
  }

  // step 3: write log + account status
  const status: SyncStatus = errors.length ? 'error' : totalConflicts ? 'conflict' : 'ok'
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join('; ') : undefined,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts },
  )
  await mutateStore(s => {
    s.syncLog.unshift(log)
    s.syncLog = s.syncLog.slice(0, 50)
    const acc = s.accounts.find(a => a.id === accountId)
    if (acc) {
      acc.lastSyncAt = nowIso()
      acc.lastSyncStatus = status
      acc.lastSyncError = errors.length ? errors.join('; ') : undefined
    }
  })
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
  // deterministic pastel from a string — same calendar always gets the same colour
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hue = h % 360
  return `hsl(${hue}, 55%, 55%)`
}

// ---------------------------------------------------------------------------
// background scheduler
// ---------------------------------------------------------------------------

export function startScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  const tick = async () => {
    try {
      const store = await readStore()
      for (const acc of store.accounts) {
        if (!acc.enabled) continue
        // skip accounts that just synced within half the interval
        if (acc.lastSyncAt && Date.now() - new Date(acc.lastSyncAt).getTime() < DEFAULT_INTERVAL_MS / 2) continue
        try { await runSync(acc.id) } catch { /* swallow; already logged */ }
      }
    } catch { /* swallow */ }
    schedulerTimer = setTimeout(tick, DEFAULT_INTERVAL_MS)
  }
  schedulerTimer = setTimeout(tick, 5000)              // give the app a moment to settle
}

export function stopScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer)
  schedulerStarted = false
  schedulerTimer = null
}
