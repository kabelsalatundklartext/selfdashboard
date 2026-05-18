export const MAIL_STORE_VERSION = 1

export interface MailConfig {
  enabled: boolean
  host: string
  port: number
  /** true = IMAPS (typical port 993) */
  secure: boolean
  username: string
  passwordEncrypted: string
  mailbox: string
  /** Webmail / DSM mail — opened when clicking the navbar icon */
  openUrl: string
  pollIntervalSeconds: number
  verifyTls: boolean
}

export interface MailStatus {
  unread: number
  lastSyncAt?: string
  lastError?: string
}

export interface MailStoreFile {
  version: number
  config: MailConfig
  status: MailStatus
}

export const DEFAULT_MAIL_CONFIG: MailConfig = {
  enabled: false,
  host: '',
  port: 993,
  secure: true,
  username: '',
  passwordEncrypted: '',
  mailbox: 'INBOX',
  openUrl: '',
  pollIntervalSeconds: 120,
  verifyTls: true,
}

export const EMPTY_MAIL_STATUS: MailStatus = { unread: 0 }
