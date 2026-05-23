import type { NextResponse } from 'next/server'
import {
  clearSessionCookieOptions,
  resolveSessionCookieSecure,
  sessionCookieOptions,
} from '@/lib/auth/cookies'
import type { SessionInfo } from '@/lib/auth/types'

export { resolveSessionCookieSecure } from '@/lib/auth/cookies'

export function applySessionCookie<T extends NextResponse>(res: T, session: SessionInfo): T {
  const opts = sessionCookieOptions(session)
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: resolveSessionCookieSecure(),
    path: opts.path,
    expires: opts.expires,
  })
  return res
}

export function applyClearSessionCookie<T extends NextResponse>(res: T): T {
  const opts = clearSessionCookieOptions()
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: resolveSessionCookieSecure(),
    path: opts.path,
    maxAge: 0,
  })
  return res
}
