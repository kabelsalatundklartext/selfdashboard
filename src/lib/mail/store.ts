import 'server-only'

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { dataDir } from '@/lib/dataDir'
import { encrypt } from '@/lib/secretCrypto'
import { normalizeMailConnection, resolveWebmailUrl } from './normalize'
import {
  clampPollIntervalSeconds,
  DEFAULT_ACCOUNT_FIELDS,
  EMPTY_MAIL_STATUS,
  isMailAccountFetchable,
  MAIL_POLL_INTERVAL_DEFAULT,
  MAIL_STORE_VERSION,
  newAccountId,
  parseAccountEnabled,
  type MailAccount,
  type MailAccountPublic,
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
    pollIntervalSeconds: clampPollIntervalSeconds(c.pollIntervalSeconds ?? MAIL_POLL_INTERVAL_DEFAULT),
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
      enabled: parseAccountEnabled(a.enabled),
    })) as MailAccount[]

    const status = parsed.status as MailAggregateStatus | undefined
    return {
      version: MAIL_STORE_VERSION,
      navbarEnabled: Boolean(
        parsed.navbarEnabled ?? (parsed.config ? (parsed.config as MailConfig).enabled : false),
      ),
      pollIntervalSeconds:
        typeof parsed.pollIntervalSeconds === 'number'
          ? clampPollIntervalSeconds(parsed.pollIntervalSeconds)
          : MAIL_POLL_INTERVAL_DEFAULT,
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

export function toPublicAccount(account: MailAccount): MailAccountPublic {
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
  else if (body.enabled !== undefined) next.enabled = parseAccountEnabled(body.enabled)
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

/** Webmail-Link: Konto mit Ungelesen, sonst erstes Konto mit URL/Host-Fallback */
export function pickOpenUrl(store: MailStoreFile): string | null {
  const withLink = store.accounts.filter(a => resolveWebmailUrl(a))
  for (const st of store.status.accounts) {
    if (st.unread > 0) {
      const acc = withLink.find(a => a.id === st.id)
      const url = acc ? resolveWebmailUrl(acc) : null
      if (url) return url
    }
  }
  const preferred = withLink.find(a => parseAccountEnabled(a.enabled)) ?? withLink[0]
  return preferred ? resolveWebmailUrl(preferred) : null
}

/** Nach erfolgreichem IMAP-Test: Konto + Status dauerhaft speichern (inkl. Passwort aus Test). */
export function persistAccountFromImapTest(
  store: MailStoreFile,
  merged: MailAccount,
  unread: number,
): void {
  const idx = store.accounts.findIndex(a => a.id === merged.id)
  const saved: MailAccount = {
    ...merged,
    id: idx >= 0 ? store.accounts[idx].id : merged.id,
    enabled: true,
  }
  if (idx >= 0) {
    store.accounts[idx] = saved
  } else {
    store.accounts.push(saved)
  }

  const label = saved.label || saved.username || saved.id
  const others = store.status.accounts.filter(a => a.id !== saved.id)
  const nextAccounts = [...others, { id: saved.id, label, unread }]
  store.status.accounts = nextAccounts
  store.status.unread = nextAccounts.reduce((sum, a) => sum + a.unread, 0)
  store.status.lastSyncAt = new Date().toISOString()
  store.status.lastError = undefined
}

export function describeMailSyncBlocker(store: MailStoreFile): string {
  if (store.accounts.length === 0) {
    return 'Kein Konto konfiguriert — IMAP-Daten anlegen und speichern.'
  }
  const enabled = store.accounts.filter(a => parseAccountEnabled(a.enabled))
  if (enabled.length === 0) {
    const names = store.accounts.map(a => a.label || a.username || a.id).join(', ')
    return names
      ? `Konto deaktiviert (${names}) — „Dieses Konto abfragen“ aktivieren und „Speichern“.`
      : 'Kein aktives Konto — „Dieses Konto abfragen“ aktivieren und speichern.'
  }
  const missingPassword = enabled.filter(a => !String(a.passwordEncrypted ?? '').trim())
  if (missingPassword.length === enabled.length) {
    return 'Passwort fehlt im Speicher — Passwort eintragen und „Speichern“ oder „Testen“ klicken.'
  }
  const incomplete = enabled.filter(
    a => !String(a.host ?? '').trim() || !String(a.username ?? '').trim(),
  )
  if (incomplete.length > 0) {
    return 'Host oder Benutzername fehlt beim aktiven Konto.'
  }
  const fetchable = store.accounts.filter(isMailAccountFetchable)
  if (fetchable.length === 0) {
    return 'Kein abrufbares Konto — Einstellungen prüfen und erneut speichern.'
  }
  return 'Synchronisation nicht möglich.'
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
