import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir } from './data-dir'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const KEY_LEN = 32

// MUSS identisch zur Schlüssel-Ableitung in src/lib/secretCrypto.ts bleiben —
// Plugin-Server öffnen vom Core versiegelte Werte (sealSecret/openSealedSecret).
const LEGACY_SALT = 'selfdashboard.calendar.v1'

let cachedPrimaryKey: Buffer | null = null
let cachedLegacyKey: Buffer | null = null

function keyMaterial(): string {
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim()
  if (envKey) return envKey
  const keyFile = join(dataDir(), '.calendar-key')
  if (existsSync(keyFile)) return readFileSync(keyFile, 'utf8').trim()
  const fresh = randomBytes(32).toString('base64')
  try {
    writeFileSync(keyFile, fresh, { flag: 'wx' })
    try { chmodSync(keyFile, 0o600) } catch { /* ignore */ }
    return fresh
  } catch {
    if (existsSync(keyFile)) return readFileSync(keyFile, 'utf8').trim()
    return fresh
  }
}

/** Per-Install-Zufalls-Salt (M3); `.secret-salt`, atomar via `wx`. */
function installSalt(): string {
  const saltFile = join(dataDir(), '.secret-salt')
  try {
    if (existsSync(saltFile)) {
      const v = readFileSync(saltFile, 'utf8').trim()
      if (v) return v
    }
    const fresh = randomBytes(16).toString('hex')
    try {
      writeFileSync(saltFile, fresh, { flag: 'wx' })
      try { chmodSync(saltFile, 0o600) } catch { /* ignore */ }
      return fresh
    } catch {
      const v = existsSync(saltFile) ? readFileSync(saltFile, 'utf8').trim() : ''
      return v || LEGACY_SALT
    }
  } catch {
    return LEGACY_SALT
  }
}

function primaryKey(): Buffer {
  if (!cachedPrimaryKey) cachedPrimaryKey = scryptSync(keyMaterial(), installSalt(), KEY_LEN)
  return cachedPrimaryKey
}

function legacyKey(): Buffer {
  if (!cachedLegacyKey) cachedLegacyKey = scryptSync(keyMaterial(), LEGACY_SALT, KEY_LEN)
  return cachedLegacyKey
}

function decryptGcm(key: Buffer, iv: Buffer, enc: Buffer, tag: Buffer): string {
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const key = primaryKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + 16)
  const data = buf.subarray(IV_LEN + 16)
  try {
    return decryptGcm(primaryKey(), iv, data, tag)
  } catch {
    return decryptGcm(legacyKey(), iv, data, tag)
  }
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
  const key = primaryKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return SEALED_SECRET_PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Returns plaintext for sealed values, the value unchanged for legacy plaintext, '' on tamper/key mismatch. */
export function openSealedSecret(value: string): string {
  if (!isSealedSecret(value)) return value
  const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), 'base64')
  if (buf.length < IV_LEN + TAG_LEN + 1) return ''
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = buf.subarray(IV_LEN + TAG_LEN)
  try {
    return decryptGcm(primaryKey(), iv, enc, tag)
  } catch {
    try {
      return decryptGcm(legacyKey(), iv, enc, tag)
    } catch {
      return ''
    }
  }
}
