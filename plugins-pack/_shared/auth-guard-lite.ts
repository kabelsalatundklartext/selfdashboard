import { getAuthDb, getUserById, isAuthDisabled, needsSetup } from './auth-lite'
import type { SessionInfo } from './auth-types'

const AUTH_COOKIE = 'sd_session'

type SessionRow = {
  id: string
  user_id: string
  expires_at: string
  mfa_verified: number
}

function readSessionIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (rawKey?.trim() === AUTH_COOKIE) {
      const val = rest.join('=').trim()
      if (/^[a-f0-9]{64}$/.test(val)) return val
      return null
    }
  }
  return null
}

function purgeExpiredSessions() {
  const now = new Date().toISOString()
  getAuthDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
}

function getSession(sessionId: string): SessionInfo | null {
  purgeExpiredSessions()
  const row = getAuthDb().prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | SessionRow
    | undefined
  if (!row) return null
  if (row.expires_at <= new Date().toISOString()) {
    getAuthDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return null
  }
  const user = getUserById(row.user_id)
  if (!user) {
    getAuthDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return null
  }
  return {
    id: row.id,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: row.expires_at,
    mfaVerified: row.mfa_verified !== 0,
  }
}

export function getSessionFromRequest(req: Request): SessionInfo | null {
  if (isAuthDisabled()) {
    return {
      id: 'dev',
      userId: 'dev',
      username: 'dev',
      role: 'admin',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      mfaVerified: true,
    }
  }
  if (needsSetup()) return null
  const sessionId = readSessionIdFromCookieHeader(req.headers.get('cookie'))
  if (!sessionId) return null
  return getSession(sessionId)
}
