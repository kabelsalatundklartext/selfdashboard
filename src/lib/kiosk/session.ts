import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { getAuthDb } from '@/lib/auth/db'
import { resolveSessionCookieSecure } from '@/lib/auth/cookies'
import { KIOSK_COOKIE, type KioskConfig, getKioskConfig } from '@/lib/kiosk/config'
import { kioskSessionMaxAgeSec, kioskSessionTtlMs } from '@/lib/kiosk/sessionDuration'

export type KioskAccess = {
  ownerUserId: string
  dashboardId: string
  pluginIds: string[]
}

const SECRET_KEY = 'kiosk_signing_secret'

function getSigningSecret(): string {
  const row = getAuthDb().prepare('SELECT value FROM settings WHERE key = ?').get(SECRET_KEY) as
    | { value: string }
    | undefined
  if (row?.value) return row.value
  const secret = randomBytes(32).toString('base64')
  getAuthDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run(SECRET_KEY, secret)
  return secret
}

function signPayload(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getSigningSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

function readKioskToken(token: string | null, cfg = getKioskConfig()): KioskAccess | null {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.', 2)
  if (!body || !sig) return null
  const expected = createHmac('sha256', getSigningSecret()).update(body).digest('base64url')
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null
    }
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      v?: number
      exp?: number
      ou?: string
      did?: string
      pids?: string[]
      aut?: number
    }
    if (parsed.v !== 1 || !parsed.exp || Date.now() > parsed.exp) return null
    if (!parsed.ou || !parsed.did || !Array.isArray(parsed.pids)) return null
    if (cfg.passwordHash && parsed.aut !== 1) return null
    if (!cfg.enabled || cfg.ownerUserId !== parsed.ou || cfg.dashboardId !== parsed.did) return null
    return {
      ownerUserId: parsed.ou,
      dashboardId: parsed.did,
      pluginIds: parsed.pids.filter((p) => typeof p === 'string'),
    }
  } catch {
    return null
  }
}

export function readKioskAccessFromRequest(req: Request): KioskAccess | null {
  return readKioskTokenFromCookieHeader(req.headers.get('cookie'))
}

export function readKioskTokenFromCookieHeader(cookieHeader: string | null): KioskAccess | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (rawKey?.trim() !== KIOSK_COOKIE) continue
    const val = rest.join('=').trim()
    if (!val) return null
    const decoded = (() => {
      try {
        return decodeURIComponent(val)
      } catch {
        return val
      }
    })()
    return readKioskToken(decoded)
  }
  return null
}

export function issueKioskToken(
  access: KioskAccess,
  passwordUnlocked = false,
  cfg: KioskConfig = getKioskConfig(),
): string {
  const ttlMs = kioskSessionTtlMs(cfg.sessionHours)
  const exp = Date.now() + ttlMs
  return signPayload({
    v: 1,
    exp,
    ou: access.ownerUserId,
    did: access.dashboardId,
    pids: access.pluginIds,
    ...(passwordUnlocked ? { aut: 1 } : {}),
  })
}

export function applyKioskCookie(
  res: import('next/server').NextResponse,
  token: string,
  cfg: KioskConfig = getKioskConfig(),
): void {
  const secure = resolveSessionCookieSecure()
  res.cookies.set(KIOSK_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: kioskSessionMaxAgeSec(cfg.sessionHours),
  })
}

export function applyClearKioskCookie(res: import('next/server').NextResponse): void {
  const secure = resolveSessionCookieSecure()
  res.cookies.set(KIOSK_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })
}

export function isPluginAllowedForKiosk(access: KioskAccess, pluginId: string): boolean {
  return access.pluginIds.includes(pluginId)
}

export function kioskAccessGranted(req: Request, cfg: KioskConfig = getKioskConfig()): KioskAccess | null {
  if (!cfg.enabled || !cfg.ownerUserId) return null
  return readKioskAccessFromRequest(req)
}
