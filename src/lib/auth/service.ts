import 'server-only'
import { cookies } from 'next/headers'
import { AUTH_COOKIE } from '@/lib/auth/paths'
import { clearSessionCookieOptions, sessionCookieOptions } from '@/lib/auth/cookies'
import { migrateLegacyDashboard } from '@/lib/auth/migrate'
import {
  validatePasswordStrength,
  validateUsername,
  verifyPassword,
} from '@/lib/auth/password'
import { createSession, deleteSession, getSession } from '@/lib/auth/sessions'
import type { SessionInfo } from '@/lib/auth/types'
import { createUser, getUserByUsername, needsSetup } from '@/lib/auth/users'

export { needsSetup } from '@/lib/auth/users'

export function isAuthDisabled(): boolean {
  const v = process.env.SELFDASHBOARD_AUTH_DISABLED?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export async function getSessionFromCookies(): Promise<SessionInfo | null> {
  if (isAuthDisabled() || needsSetup()) return null
  const jar = await cookies()
  const id = jar.get(AUTH_COOKIE)?.value
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null
  return getSession(id)
}

export async function setupAdmin(input: {
  username: string
  password: string
}): Promise<{ user: SessionInfo; migration: string }> {
  if (!needsSetup()) throw new Error('already_setup')
  const userErr = validateUsername(input.username)
  if (userErr) throw new Error(userErr)
  const passErr = validatePasswordStrength(input.password)
  if (passErr) throw new Error(passErr)

  const user = createUser({
    username: input.username,
    password: input.password,
    role: 'admin',
  })
  const migration = await migrateLegacyDashboard(user.id)
  const session = createSession(user.id, true)
  const jar = await cookies()
  jar.set(sessionCookieOptions(session))
  return { user: session, migration }
}

export async function login(input: {
  username: string
  password: string
  remember?: boolean
}): Promise<SessionInfo> {
  if (needsSetup()) throw new Error('needs_setup')
  const found = getUserByUsername(input.username)
  if (!found || !verifyPassword(input.password, found.passwordHash)) {
    throw new Error('invalid_credentials')
  }
  const session = createSession(found.id, !!input.remember)
  const jar = await cookies()
  jar.set(sessionCookieOptions(session))
  return session
}

export async function logout(): Promise<void> {
  const jar = await cookies()
  const id = jar.get(AUTH_COOKIE)?.value
  if (id) deleteSession(id)
  jar.set(clearSessionCookieOptions())
}
