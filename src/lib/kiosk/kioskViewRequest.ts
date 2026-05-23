import 'server-only'
import { readSessionIdFromCookieHeader } from '@/lib/auth/cookies'
import { getSession } from '@/lib/auth/sessions'
import { getKioskConfig } from '@/lib/kiosk/config'
import { readKioskAccessFromRequest, type KioskAccess } from '@/lib/kiosk/session'

function hasLoginSession(req: Request): boolean {
  const sessionId = readSessionIdFromCookieHeader(req.headers.get('cookie'))
  if (!sessionId) return false
  return getSession(sessionId) !== null
}

function isKioskPluginAssetRequest(req: Request): boolean {
  const url = new URL(req.url)
  if (!url.pathname.startsWith('/api/plugins/custom-assets/')) return false
  const dest = req.headers.get('sec-fetch-dest')
  if (dest === 'script' || dest === 'style') return true
  const referer = req.headers.get('referer') ?? ''
  return referer.includes('/kiosk')
}

/** Passwordless public kiosk access from server config (cached dashboard plugin ids). */
export function getPublicKioskAccessFromConfig(): KioskAccess | null {
  const cfg = getKioskConfig()
  if (!cfg.enabled || !cfg.ownerUserId || cfg.passwordHash) return null
  if (!cfg.pluginIds.length) return null
  return {
    ownerUserId: cfg.ownerUserId,
    dashboardId: cfg.dashboardId,
    pluginIds: cfg.pluginIds,
  }
}

/**
 * Resolve kiosk access for plugin APIs and widget assets.
 * Cookie first; passwordless kiosk falls back to config (needed for widget.js without custom headers).
 */
export function resolveKioskAccess(req: Request): KioskAccess | null {
  const fromCookie = readKioskAccessFromRequest(req)
  if (fromCookie) return fromCookie

  const pub = getPublicKioskAccessFromConfig()
  if (!pub) return null

  const hasKioskHeader = req.headers.get('x-sd-kiosk-view') === '1'
  if (hasLoginSession(req)) {
    if (hasKioskHeader || isKioskPluginAssetRequest(req)) return pub
    return null
  }

  return pub
}

export function isKioskViewRequest(req: Request): boolean {
  return resolveKioskAccess(req) !== null
}

export function getKioskViewAccess(req: Request): KioskAccess | null {
  if (req.headers.get('x-sd-kiosk-view') === '1') {
    return resolveKioskAccess(req)
  }
  return readKioskAccessFromRequest(req) ?? getPublicKioskAccessForAssets(req)
}

function getPublicKioskAccessForAssets(req: Request): KioskAccess | null {
  if (!isKioskPluginAssetRequest(req)) return null
  return getPublicKioskAccessFromConfig()
}
