import 'server-only'
import { randomBytes } from 'crypto'
import { getAuthDb } from '@/lib/auth/db'
import { sessionTtlMs } from '@/lib/auth/settings'
import type { SessionInfo } from '@/lib/auth/types'
import { getUserById } from '@/lib/auth/users'

type SessionRow = {
  id: string
  user_id: string
  expires_at: string
  remember: number
  created_at: string
  mfa_verified: number
}

function purgeExpiredSessions() {
  const now = new Date().toISOString()
  getAuthDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
}

function rowToSession(row: SessionRow, user: NonNullable<ReturnType<typeof getUserById>>): SessionInfo {
  return {
    id: row.id,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: row.expires_at,
    mfaVerified: row.mfa_verified !== 0,
  }
}

export function createSession(
  userId: string,
  remember: boolean,
  opts?: { mfaVerified?: boolean },
): SessionInfo {
  purgeExpiredSessions()
  const user = getUserById(userId)
  if (!user) throw new Error('user_not_found')
  const id = randomBytes(32).toString('hex')
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + sessionTtlMs(remember)).toISOString()
  const mfaVerified = opts?.mfaVerified === false ? 0 : 1
  getAuthDb()
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at, remember, created_at, mfa_verified) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(id, userId, expiresAt, remember ? 1 : 0, createdAt, mfaVerified)
  return {
    id,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
    mfaVerified: mfaVerified === 1,
  }
}

export function getSession(sessionId: string): SessionInfo | null {
  purgeExpiredSessions()
  const row = getAuthDb().prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | SessionRow
    | undefined
  if (!row) return null
  if (row.expires_at <= new Date().toISOString()) {
    deleteSession(sessionId)
    return null
  }
  const user = getUserById(row.user_id)
  if (!user) {
    deleteSession(sessionId)
    return null
  }
  return rowToSession(row, user)
}

export function markSessionMfaVerified(sessionId: string): boolean {
  const row = getAuthDb().prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId) as
    | { id: string }
    | undefined
  if (!row) return false
  getAuthDb().prepare('UPDATE sessions SET mfa_verified = 1 WHERE id = ?').run(sessionId)
  return true
}

export function deleteSession(sessionId: string) {
  getAuthDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

export function deleteSessionsForUser(userId: string) {
  getAuthDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function deleteSessionsForUserExcept(userId: string, keepSessionId: string | null) {
  if (keepSessionId) {
    getAuthDb()
      .prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .run(userId, keepSessionId)
  } else {
    deleteSessionsForUser(userId)
  }
}
