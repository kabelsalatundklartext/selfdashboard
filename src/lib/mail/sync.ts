import { logPluginApiFailure } from '@/lib/pluginLogServer'
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
    const { config } = store
    if (!config.enabled || !config.host || !config.username || !config.passwordEncrypted) {
      await mutateMailStore(s => {
        s.status.unread = 0
        s.status.lastError = undefined
      })
      return
    }

    try {
      const unread = await fetchUnreadCount(config)
      await mutateMailStore(s => {
        s.status.unread = unread
        s.status.lastSyncAt = new Date().toISOString()
        s.status.lastError = undefined
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      await mutateMailStore(s => {
        s.status.lastError = msg
        s.status.lastSyncAt = new Date().toISOString()
      })
      void logPluginApiFailure('mail', 'sync', msg, { host: config.host })
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
      if (store.config.enabled) {
        delayMs = Math.max(60, store.config.pollIntervalSeconds) * 1000
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
