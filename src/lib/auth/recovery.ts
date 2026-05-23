import 'server-only'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { timingSafeEqual } from 'crypto'
import { authDir } from '@/lib/auth/paths'

const RECOVERY_FILE = 'recovery.token'
const MIN_TOKEN_LEN = 16

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  try {
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function readEnvRecoveryToken(): string | null {
  const t = process.env.SELFDASHBOARD_AUTH_RECOVERY?.trim()
  if (!t || t.length < MIN_TOKEN_LEN) return null
  return t
}

function readFileRecoveryToken(): string | null {
  const path = join(authDir(), RECOVERY_FILE)
  if (!existsSync(path)) return null
  try {
    const t = readFileSync(path, 'utf8').trim()
    if (!t || t.length < MIN_TOKEN_LEN) return null
    return t
  } catch {
    return null
  }
}

/** True when a one-time recovery token is configured (env or file in appdata). */
export function isRecoveryConfigured(): boolean {
  return readEnvRecoveryToken() != null || readFileRecoveryToken() != null
}

export function verifyRecoveryToken(provided: string): boolean {
  const token = provided.trim()
  if (token.length < MIN_TOKEN_LEN) return false
  const env = readEnvRecoveryToken()
  if (env && timingSafeEqualStr(token, env)) return true
  const file = readFileRecoveryToken()
  if (file && timingSafeEqualStr(token, file)) return true
  return false
}

/** Remove file token after successful recovery (env token must be cleared manually). */
export function consumeRecoveryFileToken(): void {
  const path = join(authDir(), RECOVERY_FILE)
  if (!existsSync(path)) return
  try {
    unlinkSync(path)
  } catch {
    /* best effort */
  }
}

export function recoveryUsesFileToken(): boolean {
  return readFileRecoveryToken() != null
}
