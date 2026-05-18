export const MAIL_STORE_VERSION = 2

/** IMAP-Abfrage-Intervall (Sekunden) für alle Konten */
export const MAIL_POLL_INTERVAL_MIN = 1
export const MAIL_POLL_INTERVAL_MAX = 900
export const MAIL_POLL_INTERVAL_DEFAULT = 120

/** Max. Ordner mit Ungelesen pro Konto in der Status-Anzeige */
export const MAIL_STATUS_MAX_FOLDERS = 12

export function clampPollIntervalSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MAIL_POLL_INTERVAL_DEFAULT
  return Math.max(
    MAIL_POLL_INTERVAL_MIN,
    Math.min(MAIL_POLL_INTERVAL_MAX, Math.round(seconds)),
  )
}

/** Legacy single-account shape (v1) — migration only */
export interface MailConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  passwordEncrypted: string
  mailbox: string
  openUrl: string
  pollIntervalSeconds: number
  verifyTls: boolean
}

export interface MailAccount {
  id: string
  /** Anzeigename z. B. „Synology SvensenDE“ */
  label: string
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  passwordEncrypted: string
  mailbox: string
  openUrl: string
  verifyTls: boolean
}

export interface MailFolderUnread {
  path: string
  unread: number
}

/** API/UI — Konto ohne Passwort im Klartext */
export type MailAccountPublic = {
  id: string
  label: string
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  hasPassword: boolean
  mailbox: string
  openUrl: string
  verifyTls: boolean
}

export function formatMailFolderLabel(path: string): string {
  if (path.includes('.')) {
    const parts = path.split('.')
    return parts[parts.length - 1] || path
  }
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

export interface MailAccountStatus {
  id: string
  label: string
  unread: number
  lastError?: string
  /** Ordner mit ungelesen (letzte Sync-Abfrage) */
  unreadFolders?: MailFolderUnread[]
}

export interface MailAggregateStatus {
  unread: number
  lastSyncAt?: string
  lastError?: string
  accounts: MailAccountStatus[]
}

export interface MailStoreFile {
  version: number
  /** Navbar-Symbol + Abfrage global */
  navbarEnabled: boolean
  pollIntervalSeconds: number
  accounts: MailAccount[]
  status: MailAggregateStatus
}

export const DEFAULT_ACCOUNT_FIELDS: Omit<MailAccount, 'id' | 'label'> = {
  enabled: true,
  host: '',
  port: 993,
  secure: true,
  username: '',
  passwordEncrypted: '',
  mailbox: '*',
  openUrl: '',
  verifyTls: true,
}

export const EMPTY_MAIL_STATUS: MailAggregateStatus = {
  unread: 0,
  accounts: [],
}

export function newAccountId(): string {
  return `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/** Robust: fehlendes/ungültiges `enabled` gilt als aktiv (true). */
export function parseAccountEnabled(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return true
}

/** Felder für IMAP-Verbindung (ohne Store-Metadaten) */
export interface MailImapConfig {
  host: string
  port: number
  secure: boolean
  username: string
  passwordEncrypted: string
  mailbox: string
  verifyTls: boolean
}

/** Konto kann per IMAP abgefragt werden (Navbar-Sync) */
export function isMailAccountFetchable(account: MailAccount): boolean {
  return Boolean(
    parseAccountEnabled(account.enabled) &&
    String(account.host ?? '').trim() &&
    String(account.username ?? '').trim() &&
    String(account.passwordEncrypted ?? '').trim(),
  )
}

export function accountToImapConfig(account: MailAccount): MailImapConfig {
  return {
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    passwordEncrypted: account.passwordEncrypted,
    mailbox: account.mailbox,
    verifyTls: account.verifyTls,
  }
}
