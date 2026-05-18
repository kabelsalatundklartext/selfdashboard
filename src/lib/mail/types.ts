export const MAIL_STORE_VERSION = 2

/** IMAP-Abfrage-Intervall (Sekunden) für alle Konten */
export const MAIL_POLL_INTERVAL_MIN = 1
export const MAIL_POLL_INTERVAL_MAX = 900
export const MAIL_POLL_INTERVAL_DEFAULT = 120

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

export interface MailAccountStatus {
  id: string
  label: string
  unread: number
  lastError?: string
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
