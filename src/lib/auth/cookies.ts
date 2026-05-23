import { AUTH_COOKIE } from '@/lib/auth/paths'
import type { SessionInfo } from '@/lib/auth/types'

/** Homelab: HTTP on LAN is common — do not default to Secure-only cookies. */
export function resolveSessionCookieSecure(): boolean {
  if (process.env.SELFDASHBOARD_INSECURE_COOKIES === '1') return false
  if (process.env.SELFDASHBOARD_SECURE_COOKIES === '1') return true
  return false
}

export function sessionCookieOptions(session: SessionInfo) {
  const expires = new Date(session.expiresAt)
  const secure = resolveSessionCookieSecure()
  return {
    name: AUTH_COOKIE,
    value: session.id,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    expires,
  }
}

export function clearSessionCookieOptions() {
  const secure = resolveSessionCookieSecure()
  return {
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 0,
  }
}

export function readSessionIdFromCookieHeader(cookieHeader: string | null): string | null {
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
