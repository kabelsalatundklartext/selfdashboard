export const MAIL_STORE_VERSION = 2

/** IMAP-Abfrage-Intervall (Sekunden) für alle Konten */
export const MAIL_POLL_INTERVAL_MIN = 1
export const MAIL_POLL_INTERVAL_MAX = 900
export const MAIL_POLL_INTERVAL_DEFAULT = 120

/** Ungelesen älter als X Tage nicht zählen (0 = Filter aus) */
export const MAIL_UNREAD_MAX_AGE_MIN = 0
/** ~10 Jahre — „Max“-Voreinstellung und Obergrenze */
export const MAIL_UNREAD_MAX_AGE_MAX_DAYS = 3650
export const MAIL_UNREAD_MAX_AGE_MAX_YEARS = 10
export const MAIL_UNREAD_MAX_AGE_DEFAULT = 30
export const DAYS_PER_YEAR = 365

/** Max. Ordner mit Ungelesen pro Konto in der Status-Anzeige */
export const MAIL_STATUS_MAX_FOLDERS = 12

export function clampPollIntervalSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MAIL_POLL_INTERVAL_DEFAULT
  return Math.max(
    MAIL_POLL_INTERVAL_MIN,
    Math.min(MAIL_POLL_INTERVAL_MAX, Math.round(seconds)),
  )
}

export function resolveUnreadMaxAgeDays(value?: number): number {
  if (value !== undefined && Number.isFinite(value)) {
    return clampUnreadMaxAgeDays(value)
  }
  const fromEnv = parseInt(process.env.MAIL_UNREAD_MAX_AGE_DAYS ?? '', 10)
  if (Number.isFinite(fromEnv)) return clampUnreadMaxAgeDays(fromEnv)
  return MAIL_UNREAD_MAX_AGE_DEFAULT
}

export function clampUnreadMaxAgeDays(days: number): number {
  if (!Number.isFinite(days)) return MAIL_UNREAD_MAX_AGE_DEFAULT
  const n = Math.round(days)
  if (n <= MAIL_UNREAD_MAX_AGE_MIN) return MAIL_UNREAD_MAX_AGE_MIN
  return Math.min(MAIL_UNREAD_MAX_AGE_MAX_DAYS, n)
}

export type UnreadMaxAgeUnit = 'days' | 'years'

export function unreadMaxAgeDaysToInput(days: number, unit: UnreadMaxAgeUnit): number {
  if (days <= 0) return 0
  if (unit === 'years') return Math.max(1, Math.round(days / DAYS_PER_YEAR))
  return days
}

export function unreadMaxAgeInputToDays(value: number, unit: UnreadMaxAgeUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  const n = Math.round(value)
  if (unit === 'years') return clampUnreadMaxAgeDays(n * DAYS_PER_YEAR)
  return clampUnreadMaxAgeDays(n)
}

export function formatUnreadMaxAgeSummary(days: number, de: boolean): string {
  if (days <= 0) return de ? 'aus' : 'off'
  if (days >= DAYS_PER_YEAR && days % DAYS_PER_YEAR === 0) {
    const y = days / DAYS_PER_YEAR
    return de ? `${y} Jahr${y === 1 ? '' : 'e'}` : `${y} year${y === 1 ? '' : 's'}`
  }
  return de ? `${days} Tage` : `${days} days`
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

/** Einzelne ungelesene Nachricht (IMAP-Vorschau / Debug in Einstellungen). */
export interface MailUnreadPreviewMessage {
  folder: string
  folderLabel: string
  uid: number
  subject: string
  from?: string
  date?: string
  /** z. B. Noselect-Ordner ohne abrufbare Envelope-Daten */
  note?: string
}

export interface MailMarkAllReadFolderResult {
  path: string
  marked: number
}

export interface MailMarkAllReadResult {
  marked: number
  folders: MailMarkAllReadFolderResult[]
  /** Ordner nur per STATUS (\\Noselect) — konnten nicht geöffnet werden */
  noselectSkipped?: string[]
  mode: 'all-except-trash' | 'synology-accounts' | 'accounts' | 'single'
}

export interface MailUnreadPreviewResult {
  total: number
  messages: MailUnreadPreviewMessage[]
  folders: MailFolderUnread[]
  mode: 'all-except-trash' | 'synology-accounts' | 'accounts' | 'single'
  truncated?: boolean
  /** Ungelesen per IMAP, aber älter als eingestelltes Limit — nicht gezählt */
  skippedStale?: number
  /** Doppelte Message-ID im selben Ordner */
  skippedDuplicate?: number
  /** Aktives Limit in Tagen (0 = kein Altersfilter) */
  maxUnreadAgeDays?: number
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
  /** 0 = alle UNSEEN zählen; Standard 30 */
  unreadMaxAgeDays: number
  accounts: MailAccount[]
  /** Optionale SelfMailer-Quelle: buendelt Ungelesen ueber ALLE dort hinterlegten
   *  Postfaecher in EINEN Navbar-Zaehler. Leer = aus (reiner IMAP-Modus). */
  selfmailerBase: string
  selfmailerToken: string
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
  /** 0 = Altersfilter aus */
  maxUnreadAgeDays?: number
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

export function accountToImapConfig(
  account: MailAccount,
  unreadMaxAgeDays?: number,
): MailImapConfig {
  return {
    host: account.host,
    port: account.port,
    secure: account.secure,
    username: account.username,
    passwordEncrypted: account.passwordEncrypted,
    mailbox: account.mailbox,
    verifyTls: account.verifyTls,
    maxUnreadAgeDays: resolveUnreadMaxAgeDays(unreadMaxAgeDays),
  }
}
