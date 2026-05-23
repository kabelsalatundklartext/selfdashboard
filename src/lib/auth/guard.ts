import 'server-only'
import { NextResponse } from 'next/server'
import { readSessionIdFromCookieHeader } from '@/lib/auth/cookies'
import { getSession } from '@/lib/auth/sessions'
import type { SessionInfo, UserRole } from '@/lib/auth/types'
import { isAuthDisabled } from '@/lib/auth/service'
import { isPluginManagementApiPath } from '@/lib/auth/pluginManagement'
import { isPluginAllowedForSession, resolvePluginIdFromApiPath } from '@/lib/auth/pluginPolicy'
import { isPluginAllowedForKiosk, readKioskAccessFromRequest } from '@/lib/kiosk/session'
import type { KioskAccess } from '@/lib/kiosk/session'
import { getKioskViewAccess } from '@/lib/kiosk/kioskViewRequest'
import { needsSetup } from '@/lib/auth/users'

export type AuthContext = SessionInfo

const AUTH_PATHS_WITHOUT_SESSION = new Set([
  '/api/auth/setup-status',
  '/api/auth/setup',
  '/api/auth/login',
  '/api/auth/logout',
])

const MFA_PENDING_ALLOWED_API = new Set([
  '/api/auth/totp/verify',
  '/api/auth/totp/setup',
  '/api/auth/totp/enable',
  '/api/auth/totp/status',
  '/api/auth/me',
  '/api/auth/logout',
])

export function isPublicPath(pathname: string): boolean {
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.svg' ||
    pathname === '/icon.svg'
  ) {
    return true
  }
  if (pathname === '/kiosk' || pathname.startsWith('/kiosk/')) return true
  if (pathname === '/api/kiosk/status' || pathname === '/api/kiosk/unlock') return true
  if (AUTH_PATHS_WITHOUT_SESSION.has(pathname)) return true
  return false
}

export function isSetupPath(pathname: string): boolean {
  return pathname === '/setup' || pathname.startsWith('/api/auth/setup')
}

export function isLoginPath(pathname: string): boolean {
  return pathname === '/login'
}

export function isTotpLoginPath(pathname: string): boolean {
  return pathname === '/login/totp'
}

export function isKioskApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/kiosk/')
}

export function isMfaPendingAllowedApi(pathname: string): boolean {
  return MFA_PENDING_ALLOWED_API.has(pathname)
}

export function isAdminOnlyApiPath(pathname: string, method: string): boolean {
  if (
    pathname.startsWith('/api/logs') &&
    (method === 'GET' || method === 'DELETE' || method === 'PUT')
  ) {
    return true
  }
  if (
    pathname.startsWith('/api/auth/users') ||
    pathname === '/api/auth/plugin-catalog' ||
    pathname === '/api/auth/user-plugins'
  ) {
    return true
  }
  if (isPluginManagementApiPath(pathname)) return true
  return false
}

export function kioskSessionFromAccess(access: KioskAccess): SessionInfo {
  return {
    id: 'kiosk-viewer',
    userId: access.ownerUserId,
    username: 'kiosk',
    role: 'admin',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    mfaVerified: true,
  }
}

export function getKioskAccessFromRequest(req: Request): KioskAccess | null {
  return readKioskAccessFromRequest(req)
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

export function requireAuth(req: Request): AuthContext | NextResponse {
  const session = getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return session
}

export function requireFullAuth(req: Request): AuthContext | NextResponse {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (!auth.mfaVerified) {
    return NextResponse.json({ error: 'mfa_required' }, { status: 403 })
  }
  return auth
}

export function requireAdmin(req: Request): AuthContext | NextResponse {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return auth
}

export function requireRole(req: Request, role: UserRole): AuthContext | NextResponse {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (auth.role !== role) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return auth
}

export function requirePluginAccess(
  req: Request,
  pluginId: string,
): AuthContext | NextResponse {
  const kioskView = getKioskViewAccess(req)
  if (kioskView && isPluginAllowedForKiosk(kioskView, pluginId)) {
    return kioskSessionFromAccess(kioskView)
  }
  const session = getSessionFromRequest(req)
  if (session) {
    if (!isPluginAllowedForSession(session, pluginId)) {
      return NextResponse.json({ error: 'plugin_forbidden', pluginId }, { status: 403 })
    }
    return session
  }
  const kiosk = readKioskAccessFromRequest(req)
  if (kiosk) {
    if (!isPluginAllowedForKiosk(kiosk, pluginId)) {
      return NextResponse.json({ error: 'plugin_forbidden', pluginId }, { status: 403 })
    }
    return kioskSessionFromAccess(kiosk)
  }
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

export function checkApiPluginAccess(
  session: SessionInfo,
  pathname: string,
): NextResponse | null {
  const pluginId = resolvePluginIdFromApiPath(pathname)
  if (!pluginId) return null
  if (!isPluginAllowedForSession(session, pluginId)) {
    return NextResponse.json({ error: 'plugin_forbidden', pluginId }, { status: 403 })
  }
  return null
}
