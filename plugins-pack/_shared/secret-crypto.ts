import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir } from './data-dir'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const KEY_LEN = 32

let cachedKey: Buffer | null = null

function deriveKey(material: string): Buffer {
  return scryptSync(material, 'selfdashboard.calendar.v1', KEY_LEN)
}

function loadOrCreateKey(): Buffer {
  if (cachedKey) return cachedKey
  // Allgemeiner Name bevorzugt; SELFDASHBOARD_CALENDAR_KEY als Legacy-Fallback.
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim()
  if (envKey) {
    cachedKey = deriveKey(envKey)
    return cachedKey
  }
  const keyFile = join(dataDir(), '.calendar-key')
  if (existsSync(keyFile)) {
    cachedKey = deriveKey(readFileSync(keyFile, 'utf8').trim())
    return cachedKey
  }
  const fresh = randomBytes(32).toString('base64')
  writeFileSync(keyFile, fresh, 'utf8')
  try {
    chmodSync(keyFile, 0o600)
  } catch {
    /* ignore */
  }
  cachedKey = deriveKey(fresh)
  return cachedKey
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const key = loadOrCreateKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  const key = loadOrCreateKey()
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + 16)
  const data = buf.subarray(IV_LEN + 16)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/**
 * Sealed widget secrets ("sdsec1:" + base64(iv|tag|enc)).
 * Fixed byte layout — MUST stay identical to src/lib/secretCrypto.ts,
 * because values sealed by the core app are opened inside bundled plugin servers.
 */
const TAG_LEN = 16

export const SEALED_SECRET_PREFIX = 'sdsec1:'

export function isSealedSecret(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(SEALED_SECRET_PREFIX)
}

export function sealSecret(plaintext: string): string {
  if (!plaintext) return ''
  const key = loadOrCreateKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Returns plaintext for sealed values, the value unchanged for legacy plaintext, '' on tamper/key mismatch. */
export function openSealedSecret(value: string): string {
  if (!isSealedSecret(value)) return value
  try {
    const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), 'base64')
    if (buf.length < IV_LEN + TAG_LEN + 1) return ''
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const enc = buf.subarray(IV_LEN + TAG_LEN)
    const decipher = createDecipheriv(ALGO, loadOrCreateKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}
