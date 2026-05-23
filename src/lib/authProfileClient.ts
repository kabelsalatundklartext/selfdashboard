'use client'

export type AuthProfile = {
  user: { id: string; username: string; role: 'admin' | 'user' }
  /** null = alle Plugins (Admin) */
  allowedPlugins: string[] | null
  authDisabled?: boolean
}

let cached: AuthProfile | null = null
let inflight: Promise<AuthProfile | null> | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const fn of Array.from(listeners)) fn()
}

export function subscribeAuthProfile(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getAuthProfileSnapshot(): AuthProfile | null {
  return cached
}

export async function loadAuthProfile(force = false): Promise<AuthProfile | null> {
  if (!force && cached) return cached
  if (!force && inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        cached = null
        return null
      }
      const j = (await res.json()) as {
        user?: AuthProfile['user']
        allowedPlugins?: string[] | null
        authDisabled?: boolean
      }
      if (!j.user) {
        cached = null
        return null
      }
      cached = {
        user: j.user,
        allowedPlugins: j.allowedPlugins ?? (j.user.role === 'admin' ? null : []),
        authDisabled: j.authDisabled,
      }
      notify()
      return cached
    } catch {
      cached = null
      return null
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function invalidateAuthProfile() {
  cached = null
  notify()
}

export function canUsePlugin(pluginId: string, profile: AuthProfile | null = cached): boolean {
  if (!profile) return true
  if (profile.user.role === 'admin' || profile.allowedPlugins === null) return true
  return profile.allowedPlugins.includes(pluginId)
}
