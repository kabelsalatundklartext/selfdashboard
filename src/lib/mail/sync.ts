import 'server-only'

import { formatMailError } from '@/lib/mail/errors'
import { logMailEvent } from '@/lib/mail/log'
import {
  accountToImapConfig,
  clampPollIntervalSeconds,
  isMailAccountFetchable,
  MAIL_POLL_INTERVAL_DEFAULT,
  MAIL_STATUS_MAX_FOLDERS,
  type MailAccountStatus,
} from './types'
import { fetchUnreadBreakdown } from './imap'
import { describeMailSyncBlocker, mutateMailStore, readMailStore } from './store'

let schedulerStarted = false
let schedulerTimer: ReturnType<typeof setTimeout> | null = null
let syncInFlight = false

export async function runMailSync(opts?: { wait?: boolean }): Promise<void> {
  if (syncInFlight) {
    if (!opts?.wait) return
    for (let i = 0; i < 120 && syncInFlight; i++) {
      await new Promise(r => setTimeout(r, 250))
    }
    if (syncInFlight) return
  }
  syncInFlight = true
  try {
    const store = await readMailStore()
    if (!store.navbarEnabled) {
      await mutateMailStore(s => {
        s.status.unread = 0
        s.status.lastError = undefined
        s.status.accounts = []
      })
      return
    }

    const active = store.accounts.filter(isMailAccountFetchable)

    if (active.length === 0) {
      const blocker = describeMailSyncBlocker(store)
      await mutateMailStore(s => {
        if (store.accounts.length === 0) {
          s.status.unread = 0
          s.status.accounts = []
          s.status.lastError = undefined
        } else {
          s.status.lastError = blocker
        }
      })
      return
    }

    let total = 0
    const perAccount: MailAccountStatus[] = []
    const errors: string[] = []

    for (const account of active) {
      try {
        const result = await fetchUnreadBreakdown(accountToImapConfig(account))
        total += result.total
        perAccount.push({
          id: account.id,
          label: account.label,
          unread: result.total,
          unreadFolders: result.folders.filter(f => f.unread > 0).slice(0, MAIL_STATUS_MAX_FOLDERS),
        })
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e)
        const msg = formatMailError(raw)
        errors.push(`${account.label}: ${msg}`)
        perAccount.push({ id: account.id, label: account.label, unread: 0, lastError: msg })
        void logMailEvent('sync', msg, { detail: { host: account.host, accountId: account.id, label: account.label, raw } })
      }
    }

    await mutateMailStore(s => {
      s.status.unread = total
      s.status.lastSyncAt = new Date().toISOString()
      s.status.accounts = perAccount
      s.status.lastError = errors.length > 0 && total === 0 ? errors.join(' · ') : undefined
    })

    if (errors.length > 0) {
      void logMailEvent(
        'sync/partial',
        `${errors.length} Konto/Konten mit Fehler`,
        { level: 'warn', detail: { errors: errors.join(' · ').slice(0, 500), totalUnread: total } },
      )
    }
  } finally {
    syncInFlight = false
  }
}

export function startMailScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true

  const tick = async () => {
    let delayMs = MAIL_POLL_INTERVAL_DEFAULT * 1000
    try {
      const store = await readMailStore()
      if (store.navbarEnabled) {
        delayMs = clampPollIntervalSeconds(store.pollIntervalSeconds) * 1000
        const last = store.status.lastSyncAt ? new Date(store.status.lastSyncAt).getTime() : 0
        if (!last || Date.now() - last >= delayMs - 500) {
          await runMailSync()
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      void logMailEvent('scheduler', msg, { level: 'warn' })
    }

    const tickMs = Math.min(delayMs, Math.max(1000, Math.floor(delayMs / 2)))
    schedulerTimer = setTimeout(tick, tickMs)
  }

  schedulerTimer = setTimeout(tick, 3000)
}

export function stopMailScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer)
  schedulerTimer = null
  schedulerStarted = false
}
