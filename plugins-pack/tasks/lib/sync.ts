import { logPluginApiFailure } from './log'
import { discoverCaldavTaskLists, getCaldavClientCache, syncTaskList, testCaldav, type CaldavClientCache } from './caldav'
import { discoverGoogleTaskLists, syncGoogleTaskList, testGoogleAccount } from './google'
import { discoverMicrosoftTaskLists, syncMicrosoftTaskList, testMicrosoftAccount } from './microsoft'
import {
  findAccountOwnerUserId,
  listTasksOwnerUserIds,
  mutateUserStore,
  newId,
  nowIso,
  readUserStore,
} from './store'
import type { Account, SyncLogEntry, SyncStatus } from './types'
import { isOAuthProvider } from './types'

const DEFAULT_INTERVAL_MS =
  parseInt(process.env.TASKS_SYNC_INTERVAL_SECONDS ?? process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? '300', 10) *
  1000

let schedulerStarted = false
let schedulerTimer: ReturnType<typeof setTimeout> | null = null

async function discoverAccountLists(account: Account) {
  if (account.provider === 'google') return discoverGoogleTaskLists(account)
  if (account.provider === 'microsoft') return discoverMicrosoftTaskLists(account)
  return discoverCaldavTaskLists(account)
}

export async function testAccount(account: Account) {
  if (account.provider === 'google') return testGoogleAccount(account)
  if (account.provider === 'microsoft') return testMicrosoftAccount(account)
  return testCaldav(account)
}

export interface RunSyncOptions {
  listIds?: string[]
  skipDiscover?: boolean
  pushOnly?: boolean
}

export async function syncAfterMutation(
  accountId: string,
  opts?: Pick<RunSyncOptions, 'listIds'>,
): Promise<string | undefined> {
  const log = await runSync(accountId, { listIds: opts?.listIds, skipDiscover: true, pushOnly: true })
  return log.error ?? undefined
}

async function listEnabledAccounts(): Promise<Array<{ ownerUserId: string; account: Account }>> {
  const out: Array<{ ownerUserId: string; account: Account }> = []
  for (const ownerUserId of listTasksOwnerUserIds()) {
    const store = await readUserStore(ownerUserId)
    for (const account of store.accounts) {
      if (account.enabled) out.push({ ownerUserId, account })
    }
  }
  return out
}

export async function runSync(accountId: string, opts?: RunSyncOptions): Promise<SyncLogEntry> {
  const ownerUserId = await findAccountOwnerUserId(accountId)
  if (!ownerUserId) {
    return makeLogEntry(accountId, 'not found', { added: 0, updated: 0, deleted: 0, conflicts: 0 })
  }

  const store = await readUserStore(ownerUserId)
  const account = store.accounts.find((a) => a.id === accountId)
  if (!account || !account.enabled) {
    return makeLogEntry(accountId, 'disabled or not found', { added: 0, updated: 0, deleted: 0, conflicts: 0 })
  }

  if (isOAuthProvider(account.provider) && !('refreshTokenEncrypted' in account.config && account.config.refreshTokenEncrypted)) {
    const label = account.provider === 'microsoft' ? 'Microsoft' : 'Google'
    return makeLogEntry(accountId, `${label} nicht verbunden`, { added: 0, updated: 0, deleted: 0, conflicts: 0 })
  }

  let totalAdded = 0
  let totalUpdated = 0
  let totalDeleted = 0
  let totalConflicts = 0
  const errors: string[] = []

  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountLists(account)
      const discoveredIds = new Set(discovered.map((d) => d.remoteId))
      await mutateUserStore(ownerUserId, (s) => {
        for (const d of discovered) {
          let list = s.lists.find((l) => l.accountId === account.id && l.remoteId === d.remoteId)
          if (!list) {
            list = {
              id: newId('lst'),
              accountId: account.id,
              remoteId: d.remoteId,
              name: d.name,
              readOnly: d.readOnly,
              visible: true,
            }
            s.lists.push(list)
          } else {
            list.name = d.name
            list.readOnly = d.readOnly
          }
        }
        const staleIds = new Set(
          s.lists.filter((l) => l.accountId === account.id && !discoveredIds.has(l.remoteId)).map((l) => l.id),
        )
        if (staleIds.size) {
          s.lists = s.lists.filter((l) => !staleIds.has(l.id))
          s.tasks = s.tasks.filter((t) => !staleIds.has(t.listId))
        }
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`discover: ${msg}`)
      void logPluginApiFailure('tasks', 'discover', msg, { accountId })
      const log = makeLogEntry(accountId, msg, { added: 0, updated: 0, deleted: 0, conflicts: 0 })
      await mutateUserStore(ownerUserId, (s) => {
        s.syncLog.unshift(log)
        s.syncLog = s.syncLog.slice(0, 50)
        const acc = s.accounts.find((a) => a.id === accountId)
        if (acc) {
          acc.lastSyncAt = nowIso()
          acc.lastSyncStatus = 'error'
          acc.lastSyncError = msg
        }
      })
      return log
    }
  }

  let lists = (await readUserStore(ownerUserId)).lists.filter((l) => l.accountId === account.id)
  if (opts?.listIds?.length) {
    const want = new Set(opts.listIds)
    lists = lists.filter((l) => want.has(l.id))
  }

  let caldavCache: CaldavClientCache | undefined
  if (account.provider === 'caldav' && lists.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account)
    } catch (e: unknown) {
      errors.push(`client: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  for (const list of lists) {
    try {
      await mutateUserStore(ownerUserId, async (s) => {
        const live = s.lists.find((l) => l.id === list.id)!
        const r =
          account.provider === 'google'
            ? await syncGoogleTaskList(account, live, s, opts?.pushOnly)
            : account.provider === 'microsoft'
              ? await syncMicrosoftTaskList(account, live, s, opts?.pushOnly)
              : await syncTaskList(account, live, s, caldavCache, opts?.pushOnly)
        totalAdded += r.added
        totalUpdated += r.updated
        totalDeleted += r.deleted
        totalConflicts += r.conflicts
        errors.push(...r.errors)
      })
    } catch (e: unknown) {
      errors.push(`${list.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const status: SyncStatus = errors.length ? 'error' : totalConflicts ? 'conflict' : 'ok'
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join('; ') : undefined,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts },
  )
  await mutateUserStore(ownerUserId, (s) => {
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
    void logPluginApiFailure('tasks', 'sync', errors.join('; '), { accountId })
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

export function startScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true
  const tick = async () => {
    try {
      for (const { account } of await listEnabledAccounts()) {
        if (
          account.lastSyncAt &&
          Date.now() - new Date(account.lastSyncAt).getTime() < DEFAULT_INTERVAL_MS / 2
        ) {
          continue
        }
        try {
          await runSync(account.id)
        } catch {
          /* logged in runSync */
        }
      }
    } catch {
      /* swallow */
    }
    schedulerTimer = setTimeout(tick, DEFAULT_INTERVAL_MS)
  }
  schedulerTimer = setTimeout(tick, 8000)
}

export function stopScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer)
  schedulerStarted = false
  schedulerTimer = null
}
