import 'server-only'
import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

const store = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000
let lastCleanup = Date.now()

const LOGIN_LIMIT = 12
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const TOTP_VERIFY_LIMIT = 20
const TOTP_VERIFY_WINDOW_MS = 15 * 60 * 1000
const TOTP_ENABLE_LIMIT = 10
const TOTP_ENABLE_WINDOW_MS = 15 * 60 * 1000
const KIOSK_UNLOCK_LIMIT = 10
const KIOSK_UNLOCK_WINDOW_MS = 15 * 60 * 1000
const SETUP_LIMIT = 5
const SETUP_WINDOW_MS = 60 * 60 * 1000

function cleanup(now: number): void {
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key)
  }
  if (store.size <= MAX_BUCKETS) return
  const oldest = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
  for (let i = 0; i < oldest.length - MAX_BUCKETS; i++) {
    store.delete(oldest[i]![0])
  }
}

// X-Forwarded-For / X-Real-IP are client-controlled and only trustworthy when
// set by a reverse proxy in front of the app. Enable trust explicitly with
// SELFDASHBOARD_TRUST_PROXY=1. Without it we return null and IP-only limiters
// are skipped (the persistent per-account login lockout is the real defense),
// so a spoofed header can neither bypass limits nor share-bucket-DoS others.
const TRUST_PROXY = process.env.SELFDASHBOARD_TRUST_PROXY === '1'

export function getClientIp(req: Request): string | null {
  if (!TRUST_PROXY) return null
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return null
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)
  const bucket = store.get(key)
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count++
  return { ok: true }
}

export function rateLimitLogin(req: Request): RateLimitResult {
  const ip = getClientIp(req)
  // No trustworthy client IP: skip the IP bucket and rely on the per-username
  // in-memory limiter plus the persistent per-account lockout (loginThrottle).
  if (!ip) return { ok: true }
  return checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
}

// Independent of IP: throttles brute-force against a single account even when
// the attacker rotates X-Forwarded-For (which is not from a trusted proxy here).
export function rateLimitLoginUser(username: string): RateLimitResult {
  const u = username.trim().toLowerCase().slice(0, 64) || 'unknown'
  return checkRateLimit(`login-user:${u}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
}

// userId is always present here, so the limiter stays effective even without a
// trustworthy IP; the IP (when trusted) only adds extra key granularity.
export function rateLimitTotpVerify(req: Request, userId: string): RateLimitResult {
  return checkRateLimit(
    `totp-verify:${userId}:${getClientIp(req) ?? 'noip'}`,
    TOTP_VERIFY_LIMIT,
    TOTP_VERIFY_WINDOW_MS,
  )
}

export function rateLimitTotpEnable(req: Request, userId: string): RateLimitResult {
  return checkRateLimit(
    `totp-enable:${userId}:${getClientIp(req) ?? 'noip'}`,
    TOTP_ENABLE_LIMIT,
    TOTP_ENABLE_WINDOW_MS,
  )
}

// Account-scoped limiters for sensitive re-auth actions performed within an
// existing session (current-password is verified there).
export function rateLimitChangePassword(userId: string): RateLimitResult {
  return checkRateLimit(`change-password:${userId}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
}

export function rateLimitTotpDisable(userId: string): RateLimitResult {
  return checkRateLimit(`totp-disable:${userId}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
}

export function rateLimitKioskUnlock(req: Request): RateLimitResult {
  return checkRateLimit(
    `kiosk-unlock:${getClientIp(req) ?? 'noip'}`,
    KIOSK_UNLOCK_LIMIT,
    KIOSK_UNLOCK_WINDOW_MS,
  )
}

export function rateLimitSetup(req: Request): RateLimitResult {
  return checkRateLimit(`auth-setup:${getClientIp(req) ?? 'noip'}`, SETUP_LIMIT, SETUP_WINDOW_MS)
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'rate_limited', retryAfterSec },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  )
}
