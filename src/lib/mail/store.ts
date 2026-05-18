import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { dataDir } from '@/lib/dataDir'
import { encrypt } from '@/lib/calendar/crypto'
import {
  DEFAULT_MAIL_CONFIG,
  EMPTY_MAIL_STATUS,
  MAIL_STORE_VERSION,
  type MailConfig,
  type MailStatus,
  type MailStoreFile,
} from './types'

const ROOT = process.env.MAIL_DATA_DIR || join(dataDir(), 'mail')
const FILE = () => join(ROOT, 'mail.json')

let dirReady = false
function ensureDir() {
  if (dirReady) return
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true })
  dirReady = true
}

let chain: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = chain.then(fn)
  chain = next.catch(() => undefined)
  return next as Promise<T>
}

function readSync(): MailStoreFile {
  ensureDir()
  const path = FILE()
  if (!existsSync(path)) {
    return {
      version: MAIL_STORE_VERSION,
      config: structuredClone(DEFAULT_MAIL_CONFIG),
      status: structuredClone(EMPTY_MAIL_STATUS),
    }
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<MailStoreFile>
    return {
      version: parsed.version ?? MAIL_STORE_VERSION,
      config: { ...DEFAULT_MAIL_CONFIG, ...parsed.config },
      status: { ...EMPTY_MAIL_STATUS, ...parsed.status },
    }
  } catch {
    try { renameSync(path, `${path}.corrupt-${Date.now()}`) } catch { /* ignore */ }
    return {
      version: MAIL_STORE_VERSION,
      config: structuredClone(DEFAULT_MAIL_CONFIG),
      status: structuredClone(EMPTY_MAIL_STATUS),
    }
  }
}

function writeSync(data: MailStoreFile) {
  ensureDir()
  const path = FILE()
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, path)
}

export async function readMailStore(): Promise<MailStoreFile> {
  return withLock(() => readSync())
}

export async function mutateMailStore(fn: (s: MailStoreFile) => void): Promise<MailStoreFile> {
  return withLock(() => {
    const s = readSync()
    fn(s)
    writeSync(s)
    return s
  })
}

export function toPublicConfig(config: MailConfig) {
  return {
    enabled: config.enabled,
    host: config.host,
    port: config.port,
    secure: config.secure,
    username: config.username,
    hasPassword: Boolean(config.passwordEncrypted),
    mailbox: config.mailbox,
    openUrl: config.openUrl,
    pollIntervalSeconds: config.pollIntervalSeconds,
    verifyTls: config.verifyTls,
  }
}

export function applyMailConfigUpdate(current: MailConfig, body: Record<string, unknown>): MailConfig {
  const next = { ...current }
  if (typeof body.enabled === 'boolean') next.enabled = body.enabled
  if (typeof body.host === 'string') next.host = body.host.trim()
  if (typeof body.port === 'number' && Number.isFinite(body.port)) {
    next.port = Math.max(1, Math.min(65535, Math.round(body.port)))
  }
  if (typeof body.secure === 'boolean') next.secure = body.secure
  if (typeof body.username === 'string') next.username = body.username.trim()
  if (typeof body.password === 'string' && body.password.length > 0) {
    next.passwordEncrypted = encrypt(body.password)
  }
  if (typeof body.mailbox === 'string' && body.mailbox.trim()) next.mailbox = body.mailbox.trim()
  if (typeof body.openUrl === 'string') next.openUrl = body.openUrl.trim()
  if (typeof body.pollIntervalSeconds === 'number' && Number.isFinite(body.pollIntervalSeconds)) {
    next.pollIntervalSeconds = Math.max(60, Math.min(3600, Math.round(body.pollIntervalSeconds)))
  }
  if (typeof body.verifyTls === 'boolean') next.verifyTls = body.verifyTls
  return next
}

export async function updateMailStatus(status: Partial<MailStatus>) {
  return mutateMailStore(s => {
    s.status = { ...s.status, ...status }
  })
}
