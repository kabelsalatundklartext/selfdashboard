import 'server-only'

import { logMailEvent } from '@/lib/mail/log'
import { accountToImapConfig } from './types'
import { fetchUnreadCount } from './imap'
import { mutateMailStore, readMailStore } from './store'

let schedulerStarted = false
let schedulerTimer: ReturnType<typeof setTimeout> | null = null
let syncInFlight = false

export async function runMailSync(): Promise<void> {
  if (syncInFlight) return
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

    const active = store.accounts.filter(
      a => a.enabled && a.host && a.username && a.passwordEncrypted,
    )

    if (active.length === 0) {
      await mutateMailStore(s => {
        s.status.unread = 0
        s.status.lastError = undefined
        s.status.accounts = []
      })
      return
    }

    let total = 0
    const perAccount: { id: string; label: string; unread: number; lastError?: string }[] = []
    const errors: string[] = []

    for (const account of active) {
      try {
        const unread = await fetchUnreadCount(accountToImapConfig(account))
        total += unread
        perAccount.push({ id: account.id, label: account.label, unread })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`${account.label}: ${msg}`)
        perAccount.push({ id: account.id, label: account.label, unread: 0, lastError: msg })
        void logMailEvent('sync', msg, { detail: { host: account.host, accountId: account.id, label: account.label } })
      }
    }

    await mutateMailStore(s => {
      s.status.unread = total
      s.status.lastSyncAt = new Date().toISOString()
      s.status.lastError = errors.length > 0 ? errors.join(' · ') : undefined
      s.status.accounts = perAccount
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
    let delayMs = 120_000
    try {
      const store = await readMailStore()
      if (store.navbarEnabled) {
        delayMs = Math.max(60, store.pollIntervalSeconds) * 1000
        const last = store.status.lastSyncAt ? new Date(store.status.lastSyncAt).getTime() : 0
        const half = delayMs / 2
        if (!last || Date.now() - last >= half) {
          await runMailSync()
        }
      }
    } catch { /* swallow */ }

    schedulerTimer = setTimeout(tick, delayMs)
  }

  schedulerTimer = setTimeout(tick, 8000)
}

export function stopMailScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer)
  schedulerTimer = null
  schedulerStarted = false
}
