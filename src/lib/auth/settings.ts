import 'server-only'
import { getAuthDb } from '@/lib/auth/db'
import type { AuthSettings } from '@/lib/auth/types'

const DEFAULTS: AuthSettings = {
  rememberDays: 90,
  sessionHours: 24,
}

function readSetting(key: string): string | undefined {
  const row = getAuthDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value
}

function writeSetting(key: string, value: string) {
  getAuthDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}

export function getAuthSettings(): AuthSettings {
  const rememberRaw = readSetting('remember_days')
  const sessionRaw = readSetting('session_hours')
  const rememberDays = Number(rememberRaw)
  const sessionHours = Number(sessionRaw)
  return {
    rememberDays:
      Number.isFinite(rememberDays) && rememberDays >= 1 && rememberDays <= 365
        ? Math.round(rememberDays)
        : DEFAULTS.rememberDays,
    sessionHours:
      Number.isFinite(sessionHours) && sessionHours >= 1 && sessionHours <= 168
        ? Math.round(sessionHours)
        : DEFAULTS.sessionHours,
  }
}

export function setAuthSettings(partial: Partial<AuthSettings>): AuthSettings {
  if (partial.rememberDays != null) writeSetting('remember_days', String(partial.rememberDays))
  if (partial.sessionHours != null) writeSetting('session_hours', String(partial.sessionHours))
  return getAuthSettings()
}

export function sessionTtlMs(remember: boolean): number {
  const s = getAuthSettings()
  if (remember) return s.rememberDays * 24 * 60 * 60 * 1000
  return s.sessionHours * 60 * 60 * 1000
}
