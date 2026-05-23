import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LEN = 64
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1], 'base64')
  const expected = Buffer.from(parts[2], 'base64')
  if (salt.length < 8 || expected.length !== KEY_LEN) return false
  const actual = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS)
  try {
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'password_too_short'
  if (password.length > 128) return 'password_too_long'
  return null
}

export function validateUsername(username: string): string | null {
  const u = username.trim()
  if (u.length < 2 || u.length > 32) return 'username_invalid'
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) return 'username_invalid'
  return null
}
