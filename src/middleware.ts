import { NextResponse, type NextRequest } from 'next/server'
import { readSessionIdFromCookieHeader } from '@/lib/auth/cookies'
import {
  checkApiPluginAccess,
  getSessionFromRequest,
  isAdminOnlyApiPath,
  isLoginPath,
  isMfaPendingAllowedApi,
  isPublicPath,
  isSetupPath,
  isTotpLoginPath,
} from '@/lib/auth/guard'
import { isAuthDisabled } from '@/lib/auth/service'
import { needsSetup } from '@/lib/auth/users'

export const runtime = 'nodejs'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (isAuthDisabled()) {
    return NextResponse.next()
  }

  const setupRequired = needsSetup()

  if (setupRequired) {
    if (isSetupPath(pathname)) return NextResponse.next()
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'setup_required' }, { status: 503 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/setup'
    return NextResponse.redirect(url)
  }

  if (isSetupPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isLoginPath(pathname)) {
    const sessionId = readSessionIdFromCookieHeader(request.headers.get('cookie'))
    const session = sessionId ? getSessionFromRequest(request) : null
    if (session?.mfaVerified) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/home'
      return NextResponse.redirect(url)
    }
    if (session && !session.mfaVerified) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/totp'
      url.searchParams.set('next', request.nextUrl.searchParams.get('next') || '/dashboard/home')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (isTotpLoginPath(pathname)) {
    const session = getSessionFromRequest(request)
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (session.mfaVerified) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/home'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const session = getSessionFromRequest(request)
  if (session && !session.mfaVerified) {
    if (pathname.startsWith('/api/') && isMfaPendingAllowedApi(pathname)) {
      return NextResponse.next()
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'mfa_required' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login/totp'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/') && isAdminOnlyApiPath(pathname, request.method)) {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  if (pathname.startsWith('/api/')) {
    const pluginDenied = checkApiPluginAccess(session, pathname)
    if (pluginDenied) return pluginDenied
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-sd-user-id', session.userId)
  requestHeaders.set('x-sd-role', session.role)
  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('x-sd-user-id', session.userId)
  res.headers.set('x-sd-role', session.role)
  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/login/totp',
    '/setup',
    '/api/:path*',
  ],
}
