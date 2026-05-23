import 'server-only'
import { NextResponse } from 'next/server'
import { readSessionIdFromCookieHeader } from '@/lib/auth/cookies'
import { getSession } from '@/lib/auth/sessions'
import type { SessionInfo, UserRole } from '@/lib/auth/types'
import { isAuthDisabled } from '@/lib/auth/service'
import { isPluginManagementApiPath } from '@/lib/auth/pluginManagement'
import { isPluginAllowedForSession, resolvePluginIdFromApiPath } from '@/lib/auth/pluginPolicy'
import { needsSetup } from '@/lib/auth/users'

export type AuthContext = SessionInfo

const AUTH_PATHS_WITHOUT_SESSION = new Set([
  '/api/auth/setup-status',
  '/api/auth/setup',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/recovery-status',
  '/api/auth/recovery',
])

export function isPublicPath(pathname: string): boolean {
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.svg' ||
    pathname === '/icon.svg'
  ) {
    return true
  }
  if (AUTH_PATHS_WITHOUT_SESSION.has(pathname)) return true
  return false
}

export function isSetupPath(pathname: string): boolean {
  return pathname === '/setup' || pathname.startsWith('/api/auth/setup')
}

export function isLoginPath(pathname: string): boolean {
  return pathname === '/login'
}

export function isRecoverPath(pathname: string): boolean {
  return pathname === '/recover'
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

export function getSessionFromRequest(req: Request): SessionInfo | null {
  if (isAuthDisabled()) {
    return {
      id: 'dev',
      userId: 'dev',
      username: 'dev',
      role: 'admin',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
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
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (!isPluginAllowedForSession(auth, pluginId)) {
    return NextResponse.json({ error: 'plugin_forbidden', pluginId }, { status: 403 })
  }
  return auth
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
