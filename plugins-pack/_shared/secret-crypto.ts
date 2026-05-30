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
  const envKey = process.env.SELFDASHBOARD_CALENDAR_KEY?.trim()
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
