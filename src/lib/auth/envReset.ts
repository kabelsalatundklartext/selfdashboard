import 'server-only'
import { validatePasswordStrength } from '@/lib/auth/password'
import { deleteSessionsForUser } from '@/lib/auth/sessions'
import {
  getUserByUsername,
  listUsers,
  needsSetup,
  updateUserPassword,
} from '@/lib/auth/users'

let applied = false

function parseCombinedResetEnv(): { username: string | null; password: string } | null {
  const raw = process.env.SELFDASHBOARD_AUTH_RESET?.trim()
  if (!raw) return null
  const colon = raw.indexOf(':')
  if (colon <= 0 || colon >= raw.length - 1) return null
  return {
    username: raw.slice(0, colon).trim(),
    password: raw.slice(colon + 1),
  }
}

/**
 * One-time password reset via env (Unraid-friendly).
 *
 * Option A — password only → first admin user:
 *   SELFDASHBOARD_AUTH_RESET_PASSWORD=NeuesPasswort
 *
 * Option B — user + password:
 *   SELFDASHBOARD_AUTH_RESET_USER=admin
 *   SELFDASHBOARD_AUTH_RESET_PASSWORD=NeuesPasswort
 *
 * Option C — combined:
 *   SELFDASHBOARD_AUTH_RESET=admin:NeuesPasswort
 *
 * Runs once per container start. Remove env vars after login.
 */
export function applyEnvPasswordReset(): void {
  if (applied) return
  applied = true

  if (needsSetup()) return

  const combined = parseCombinedResetEnv()
  const password =
    combined?.password ??
    process.env.SELFDASHBOARD_AUTH_RESET_PASSWORD?.trim() ??
    ''
  if (!password) return

  const username =
    combined?.username ??
    process.env.SELFDASHBOARD_AUTH_RESET_USER?.trim() ??
    null

  const passErr = validatePasswordStrength(password)
  if (passErr) {
    console.error(
      `[auth] SELFDASHBOARD_AUTH_RESET_PASSWORD invalid (${passErr}) — password not changed`,
    )
    return
  }

  let userId: string | null = null
  let resolvedUsername: string | null = null

  if (username) {
    const user = getUserByUsername(username)
    if (!user) {
      console.error(`[auth] env password reset: user "${username}" not found`)
      return
    }
    userId = user.id
    resolvedUsername = user.username
  } else {
    const admins = listUsers().filter((u) => u.role === 'admin')
    if (admins.length === 0) {
      console.error('[auth] env password reset: no admin user found')
      return
    }
    userId = admins[0].id
    resolvedUsername = admins[0].username
  }

  const updated = updateUserPassword(userId, password)
  if (!updated) {
    console.error('[auth] env password reset failed')
    return
  }

  deleteSessionsForUser(userId)
  console.warn(
    `[auth] Password reset via env for user "${resolvedUsername}". ` +
      'Remove SELFDASHBOARD_AUTH_RESET* variables and restart the container.',
  )
}
