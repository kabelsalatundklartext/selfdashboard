import 'server-only'

import { formatMailError } from '@/lib/mail/errors'
import { logMailEvent } from '@/lib/mail/log'
import { accountToImapConfig, clampPollIntervalSeconds, MAIL_POLL_INTERVAL_DEFAULT } from './types'
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
        if (store.accounts.length === 0) {
          s.status.unread = 0
          s.status.accounts = []
          s.status.lastError = undefined
        } else {
          s.status.lastError =
            'Kein abrufbares Konto (Passwort speichern, Host/Benutzer prüfen, „Dieses Konto abfragen“ an)'
        }
      })
      return
    }

    let total = 0
    const perAccount: { id: string; label: string; unread: number; lastError?: string }[] = []
    const errors: string[] = []

    for (const account of active) {
      const prevUnread = store.status.accounts.find(a => a.id === account.id)?.unread ?? 0
      try {
        const unread = await fetchUnreadCount(accountToImapConfig(account))
        total += unread
        perAccount.push({ id: account.id, label: account.label, unread })
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : String(e)
        const msg = formatMailError(raw)
        errors.push(`${account.label}: ${msg}`)
        total += prevUnread
        perAccount.push({ id: account.id, label: account.label, unread: prevUnread, lastError: msg })
        void logMailEvent('sync', msg, { detail: { host: account.host, accountId: account.id, label: account.label, raw } })
      }
    }

    await mutateMailStore(s => {
      s.status.unread = total
      s.status.lastSyncAt = new Date().toISOString()
      s.status.accounts = perAccount
      if (errors.length === 0) {
        s.status.lastError = undefined
      } else if (total > 0) {
        s.status.lastError = undefined
      } else {
        s.status.lastError = errors.join(' · ')
      }
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
