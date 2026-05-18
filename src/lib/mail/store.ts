import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { dataDir } from '@/lib/dataDir'
import { encrypt } from '@/lib/calendar/crypto'
import { normalizeMailConnection } from './normalize'
import {
  DEFAULT_ACCOUNT_FIELDS,
  EMPTY_MAIL_STATUS,
  MAIL_STORE_VERSION,
  newAccountId,
  type MailAccount,
  type MailAggregateStatus,
  type MailConfig,
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

function defaultStore(): MailStoreFile {
  return {
    version: MAIL_STORE_VERSION,
    navbarEnabled: false,
    pollIntervalSeconds: 120,
    accounts: [],
    status: structuredClone(EMPTY_MAIL_STATUS),
  }
}

function migrateFromV1(parsed: Record<string, unknown>): MailStoreFile {
  const c = parsed.config as MailConfig | undefined
  const st = parsed.status as { unread?: number; lastSyncAt?: string; lastError?: string } | undefined
  if (!c) return defaultStore()

  const account: MailAccount = {
    id: 'default',
    label: c.username?.trim() || 'Postfach 1',
    enabled: true,
    host: c.host ?? '',
    port: c.port ?? 993,
    secure: c.secure ?? true,
    username: c.username ?? '',
    passwordEncrypted: c.passwordEncrypted ?? '',
    mailbox: c.mailbox || '*',
    openUrl: c.openUrl ?? '',
    verifyTls: c.verifyTls ?? true,
  }

  return {
    version: MAIL_STORE_VERSION,
    navbarEnabled: Boolean(c.enabled),
    pollIntervalSeconds: c.pollIntervalSeconds ?? 120,
    accounts: [account],
    status: {
      unread: st?.unread ?? 0,
      lastSyncAt: st?.lastSyncAt,
      lastError: st?.lastError,
      accounts: [{ id: account.id, label: account.label, unread: st?.unread ?? 0, lastError: st?.lastError }],
    },
  }
}

function normalizeStore(parsed: Record<string, unknown>): MailStoreFile {
  if (Array.isArray(parsed.accounts)) {
    const accounts = (parsed.accounts as Partial<MailAccount>[]).map((a, i) => ({
      id: typeof a.id === 'string' ? a.id : `acc_${i}`,
      label: typeof a.label === 'string' ? a.label : `Konto ${i + 1}`,
      ...DEFAULT_ACCOUNT_FIELDS,
      ...a,
      mailbox: (a.mailbox as string)?.trim() || '*',
    })) as MailAccount[]

    const status = parsed.status as MailAggregateStatus | undefined
    return {
      version: MAIL_STORE_VERSION,
      navbarEnabled: Boolean(parsed.navbarEnabled ?? parsed.config && (parsed.config as MailConfig).enabled),
      pollIntervalSeconds:
        typeof parsed.pollIntervalSeconds === 'number'
          ? Math.max(60, Math.min(3600, Math.round(parsed.pollIntervalSeconds)))
          : 120,
      accounts,
      status: {
        unread: status?.unread ?? 0,
        lastSyncAt: status?.lastSyncAt,
        lastError: status?.lastError,
        accounts: Array.isArray(status?.accounts) ? status.accounts : [],
      },
    }
  }

  if (parsed.config) return migrateFromV1(parsed)

  return defaultStore()
}

function readSync(): MailStoreFile {
  ensureDir()
  const path = FILE()
  if (!existsSync(path)) return defaultStore()

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const store = normalizeStore(parsed)
    if ((parsed.version as number) !== MAIL_STORE_VERSION) {
      writeSync(store)
    }
    return store
  } catch {
    try { renameSync(path, `${path}.corrupt-${Date.now()}`) } catch { /* ignore */ }
    return defaultStore()
  }
}

function writeSync(data: MailStoreFile) {
  ensureDir()
  const path = FILE()
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify({ ...data, version: MAIL_STORE_VERSION }, null, 2), 'utf8')
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

export function toPublicAccount(account: MailAccount) {
  return {
    id: account.id,
    label: account.label,
    enabled: account.enabled,
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    hasPassword: Boolean(account.passwordEncrypted),
    mailbox: account.mailbox,
    openUrl: account.openUrl,
    verifyTls: account.verifyTls,
  }
}

export function applyAccountUpdate(current: MailAccount, body: Record<string, unknown>): MailAccount {
  const next = { ...current }
  if (typeof body.label === 'string') next.label = body.label.trim() || current.label
  if (typeof body.enabled === 'boolean') next.enabled = body.enabled
  if (typeof body.port === 'number' && Number.isFinite(body.port)) {
    next.port = Math.max(1, Math.min(65535, Math.round(body.port)))
  }
  if (typeof body.host === 'string') {
    const normalized = normalizeMailConnection(body.host.trim(), next.port)
    next.host = normalized.host
    next.port = normalized.port
  }
  if (typeof body.secure === 'boolean') next.secure = body.secure
  if (typeof body.username === 'string') next.username = body.username.trim()
  if (typeof body.password === 'string' && body.password.length > 0) {
    next.passwordEncrypted = encrypt(body.password)
  }
  if (typeof body.mailbox === 'string') next.mailbox = body.mailbox.trim() || '*'
  if (typeof body.openUrl === 'string') next.openUrl = body.openUrl.trim()
  if (typeof body.verifyTls === 'boolean') next.verifyTls = body.verifyTls
  return next
}

export function upsertAccountFromBody(store: MailStoreFile, body: Record<string, unknown>): MailAccount {
  const id = typeof body.id === 'string' ? body.id : undefined
  const idx = id ? store.accounts.findIndex(a => a.id === id) : -1

  if (idx >= 0) {
    store.accounts[idx] = applyAccountUpdate(store.accounts[idx], body)
    return store.accounts[idx]
  }

  const account: MailAccount = applyAccountUpdate(
    {
      id: newAccountId(),
      label: typeof body.label === 'string' ? body.label.trim() || 'Neues Konto' : `Konto ${store.accounts.length + 1}`,
      ...DEFAULT_ACCOUNT_FIELDS,
    },
    body,
  )
  store.accounts.push(account)
  return account
}

export function findAccount(store: MailStoreFile, id: string): MailAccount | undefined {
  return store.accounts.find(a => a.id === id)
}

/** Webmail-Link: Konto mit Ungelesen, sonst erstes aktives mit URL */
export function pickOpenUrl(store: MailStoreFile): string | null {
  const active = store.accounts.filter(a => a.enabled && a.openUrl)
  for (const st of store.status.accounts) {
    if (st.unread > 0) {
      const acc = active.find(a => a.id === st.id)
      if (acc?.openUrl) return acc.openUrl
    }
  }
  return active[0]?.openUrl ?? null
}

export async function updateMailStatus(status: Partial<MailAggregateStatus>) {
  return mutateMailStore(s => {
    s.status = { ...s.status, ...status }
  })
}

/** Legacy-Kompatibilität für alte API-Clients */
export function toPublicConfigLegacy(store: MailStoreFile) {
  const first = store.accounts[0]
  if (!first) {
    return {
      enabled: store.navbarEnabled,
      host: '',
      port: 993,
      secure: true,
      username: '',
      hasPassword: false,
      mailbox: '*',
      openUrl: '',
      pollIntervalSeconds: store.pollIntervalSeconds,
      verifyTls: true,
    }
  }
  return {
    ...toPublicAccount(first),
    enabled: store.navbarEnabled,
    pollIntervalSeconds: store.pollIntervalSeconds,
  }
}
