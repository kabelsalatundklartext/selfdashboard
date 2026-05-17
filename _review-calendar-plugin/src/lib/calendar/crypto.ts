/**
 * Symmetric encryption for stored CalDAV passwords.
 *
 * We use AES-256-GCM from Node's built-in `crypto` module — no additional
 * dependency. Format: base64(iv | ciphertext | tag).
 *
 * Key sources, in order of precedence:
 *   1. env `SELFDASHBOARD_CALENDAR_KEY` (base64-encoded 32 bytes)
 *   2. a file `.calendar-key` inside the data dir (chmod 600), generated once
 *
 * If you rotate the env key while accounts exist, all stored passwords will
 * fail to decrypt and the user has to re-enter them.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { getDataDir } from './store'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12          // GCM standard
const KEY_LEN = 32
const TAG_LEN = 16

let cachedKey: Buffer | null = null

function deriveKey(material: string): Buffer {
  // scrypt with a fixed salt — the key material is already secret;
  // the salt only matters if the same material is used in many systems
  return scryptSync(material, 'selfdashboard.calendar.v1', KEY_LEN)
}

function loadOrCreateKey(): Buffer {
  if (cachedKey) return cachedKey

  const envKey = process.env.SELFDASHBOARD_CALENDAR_KEY?.trim()
  if (envKey) {
    cachedKey = deriveKey(envKey)
    return cachedKey
  }

  const keyFile = join(getDataDir(), '.calendar-key')
  if (existsSync(keyFile)) {
    cachedKey = deriveKey(readFileSync(keyFile, 'utf8').trim())
    return cachedKey
  }

  const fresh = randomBytes(32).toString('base64')
  writeFileSync(keyFile, fresh, 'utf8')
  try { chmodSync(keyFile, 0o600) } catch { /* not all FS support chmod */ }
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
  return Buffer.concat([iv, enc, tag]).toString('base64')
}

export function decrypt(payload: string): string {
  if (!payload) return ''
  const key = loadOrCreateKey()
  const buf = Buffer.from(payload, 'base64')
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('encrypted payload too short')
  }
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(buf.length - TAG_LEN)
  const enc = buf.subarray(IV_LEN, buf.length - TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
