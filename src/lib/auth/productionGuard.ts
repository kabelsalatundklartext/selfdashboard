import 'server-only'
import { isAuthDisabled } from '@/lib/auth/service'
import { resolveSessionCookieSecure } from '@/lib/auth/cookies'

let warned = false

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

function hasAuthResetEnv(): boolean {
  return Boolean(
    process.env.SELFDASHBOARD_AUTH_RESET?.trim() ||
      process.env.SELFDASHBOARD_AUTH_RESET_PASSWORD?.trim() ||
      process.env.SELFDASHBOARD_AUTH_RESET_USER?.trim(),
  )
}

/** Log once on server start when risky env vars are set in production. */
export function warnInsecureProductionEnv(): void {
  if (!isProductionRuntime() || warned) return
  warned = true

  if (isAuthDisabled()) {
    console.error(
      '[security] SELFDASHBOARD_AUTH_DISABLED is set in production — remove it before exposing the app.',
    )
  }

  if (hasAuthResetEnv()) {
    console.error(
      '[security] SELFDASHBOARD_AUTH_RESET* is set in production — remove after use; reset is ignored.',
    )
  }

  if (!resolveSessionCookieSecure()) {
    console.warn(
      '[security] Session cookies are not Secure. Set SELFDASHBOARD_SECURE_COOKIES=1 when serving over HTTPS.',
    )
  }

  const volumeServer = process.env.SELFDASHBOARD_VOLUME_PLUGIN_SERVER?.trim().toLowerCase()
  if (volumeServer === '1' || volumeServer === 'true' || volumeServer === 'yes') {
    console.warn(
      '[security] SELFDASHBOARD_VOLUME_PLUGIN_SERVER is enabled — only use with a trusted plugin-pack volume.',
    )
  }
}

/** Ignore one-time env password reset when running in production. */
export function allowEnvPasswordReset(): boolean {
  return !isProductionRuntime()
}
