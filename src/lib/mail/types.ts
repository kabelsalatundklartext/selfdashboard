export const MAIL_STORE_VERSION = 2

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

export function accountToImapConfig(account: MailAccount): MailConfig {
  return {
    enabled: account.enabled,
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    passwordEncrypted: account.passwordEncrypted,
    mailbox: account.mailbox,
    openUrl: account.openUrl,
    pollIntervalSeconds: 120,
    verifyTls: account.verifyTls,
  }
}
