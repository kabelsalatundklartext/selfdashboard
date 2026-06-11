import 'server-only'
import { getAuthDb } from '@/lib/auth/db'

// Persistent, IP-independent brute-force protection for the login endpoint.
// Failures are counted per (normalized) username and stored in SQLite so the
// lockout survives process restarts — unlike the in-memory rate limiter. This
// also defeats X-Forwarded-For spoofing, since the lock is keyed on the account.
const MAX_FAILURES = 10
const WINDOW_MS = 15 * 60 * 1000

function scopeKey(username: string): string {
  return `user:${username.trim().toLowerCase().slice(0, 64) || 'unknown'}`
}

export type LoginLock = { locked: false } | { locked: true; retryAfterSec: number }

/**
 * Returns whether the account is currently locked due to too many recent
 * failed login attempts. Also prunes failures older than the window.
 */
export function isLoginLocked(username: string): LoginLock {
  const db = getAuthDb()
  const key = scopeKey(username)
  const now = Date.now()
  const since = now - WINDOW_MS

  db.prepare('DELETE FROM login_failures WHERE scope_key = ? AND failed_at < ?').run(key, since)

  const rows = db
    .prepare(
      'SELECT failed_at FROM login_failures WHERE scope_key = ? AND failed_at >= ? ORDER BY failed_at ASC',
    )
    .all(key, since) as Array<{ failed_at: number }>

  if (rows.length < MAX_FAILURES) return { locked: false }
  const oldest = rows[0]!.failed_at
  const retryAfterSec = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000))
  return { locked: true, retryAfterSec }
}

/** Record one failed login attempt for the given username. */
export function recordLoginFailure(username: string): void {
  const db = getAuthDb()
  db.prepare('INSERT INTO login_failures (scope_key, failed_at) VALUES (?, ?)').run(
    scopeKey(username),
    Date.now(),
  )
}

/** Clear all recorded failures for a username (call on successful login). */
export function clearLoginFailures(username: string): void {
  const db = getAuthDb()
  db.prepare('DELETE FROM login_failures WHERE scope_key = ?').run(scopeKey(username))
}
