import 'server-only'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { getAuthDb } from '@/lib/auth/db'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { getUserById } from '@/lib/auth/users'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_STEP_SEC = 30
const BACKUP_CODE_COUNT = 8

function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of buf) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(input: string): Buffer {
  const s = input.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of s) {
    const idx = BASE32.indexOf(ch)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', secret).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(code).padStart(6, '0')
}

function totpAt(secret: Buffer, timeMs: number): string {
  const counter = Math.floor(timeMs / 1000 / TOTP_STEP_SEC)
  return hotp(secret, counter)
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

export function buildOtpAuthUri(username: string, secret: string): string {
  const label = encodeURIComponent(`SelfDashboard:${username}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=SelfDashboard&algorithm=SHA1&digits=6&period=30`
}

/**
 * Verify a TOTP code and return the matched time-step counter (for replay
 * protection), or null when no step in the window matches.
 */
export function verifyTotpCodeStep(
  secretBase32: string,
  token: string,
  windowSteps = 1,
): number | null {
  const code = token.replace(/\s/g, '')
  if (!/^\d{6}$/.test(code)) return null
  const secret = base32Decode(secretBase32)
  if (secret.length < 10) return null
  const now = Date.now()
  for (let w = -windowSteps; w <= windowSteps; w++) {
    const t = now + w * TOTP_STEP_SEC * 1000
    const expected = totpAt(secret, t)
    try {
      if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) {
        return Math.floor(t / 1000 / TOTP_STEP_SEC)
      }
    } catch {
      /* length mismatch */
    }
  }
  return null
}

export function verifyTotpCode(secretBase32: string, token: string, windowSteps = 1): boolean {
  return verifyTotpCodeStep(secretBase32, token, windowSteps) !== null
}

type UserTotpRow = {
  totp_secret: string | null
  totp_enabled: number
  totp_last_step: number
}

function getUserTotpRow(userId: string): UserTotpRow | null {
  const row = getAuthDb()
    .prepare('SELECT totp_secret, totp_enabled, totp_last_step FROM users WHERE id = ?')
    .get(userId) as UserTotpRow | undefined
  return row ?? null
}

/**
 * Replay protection: a TOTP step may only be consumed once. Returns true when
 * `step` is newer than the last consumed step and records it atomically.
 */
function consumeTotpStep(userId: string, step: number): boolean {
  const res = getAuthDb()
    .prepare('UPDATE users SET totp_last_step = ? WHERE id = ? AND totp_last_step < ?')
    .run(step, userId, step)
  return res.changes === 1
}

export function isTotpEnabledForUser(userId: string): boolean {
  const row = getUserTotpRow(userId)
  return row?.totp_enabled === 1 && !!row.totp_secret
}

export function getTotpSecretForUser(userId: string): string | null {
  const row = getUserTotpRow(userId)
  if (!row?.totp_secret || row.totp_enabled !== 1) return null
  return row.totp_secret
}

export function enableTotpForUser(userId: string, secret: string, consumedStep = 0): void {
  getAuthDb()
    .prepare('UPDATE users SET totp_secret = ?, totp_enabled = 1, totp_last_step = ? WHERE id = ?')
    .run(secret, Math.max(0, consumedStep), userId)
}

export function disableTotpForUser(userId: string): void {
  getAuthDb()
    .prepare('UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_last_step = 0 WHERE id = ?')
    .run(userId)
  clearBackupCodes(userId)
}

function hashBackupCode(code: string): string {
  return hashPassword(code)
}

function verifyBackupCodeHash(code: string, stored: string): boolean {
  return verifyPassword(code, stored)
}

export function generateBackupCodes(userId: string): string[] {
  clearBackupCodes(userId)
  const now = new Date().toISOString()
  const codes: string[] = []
  const insert = getAuthDb().prepare(
    'INSERT INTO user_backup_codes (id, user_id, code_hash, used_at, created_at) VALUES (?, ?, ?, NULL, ?)',
  )
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const raw = randomBytes(4).toString('hex').toUpperCase()
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`
    codes.push(formatted)
    insert.run(randomBytes(16).toString('hex'), userId, hashBackupCode(formatted.replace(/-/g, '')), now)
  }
  return codes
}

function clearBackupCodes(userId: string) {
  getAuthDb().prepare('DELETE FROM user_backup_codes WHERE user_id = ?').run(userId)
}

export function verifyBackupCode(userId: string, rawCode: string): boolean {
  const normalized = rawCode.replace(/[\s-]/g, '').toUpperCase()
  if (normalized.length < 8) return false
  const rows = getAuthDb()
    .prepare(
      'SELECT id, code_hash FROM user_backup_codes WHERE user_id = ? AND used_at IS NULL',
    )
    .all(userId) as Array<{ id: string; code_hash: string }>
  for (const row of rows) {
    if (!verifyBackupCodeHash(normalized, row.code_hash)) continue
    getAuthDb()
      .prepare('UPDATE user_backup_codes SET used_at = ? WHERE id = ?')
      .run(new Date().toISOString(), row.id)
    return true
  }
  return false
}

export function verifyUserSecondFactor(userId: string, code: string): boolean {
  const secret = getTotpSecretForUser(userId)
  if (secret) {
    const step = verifyTotpCodeStep(secret, code)
    // consumeTotpStep rejects codes whose step was already used (replay).
    if (step !== null && consumeTotpStep(userId, step)) return true
    if (step !== null) return false
  }
  return verifyBackupCode(userId, code)
}

export function isTotpRequiredForAdmin(): boolean {
  const row = getAuthDb().prepare('SELECT value FROM settings WHERE key = ?').get('totp_required_admin') as
    | { value: string }
    | undefined
  return row?.value === '1'
}

export function setTotpRequiredForAdmin(required: boolean): void {
  getAuthDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .run('totp_required_admin', required ? '1' : '0')
}

export function adminMustSetupTotp(userId: string, role: 'admin' | 'user'): boolean {
  if (role !== 'admin' || !isTotpRequiredForAdmin()) return false
  return !isTotpEnabledForUser(userId)
}
