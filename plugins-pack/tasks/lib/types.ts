export type ProviderId = 'caldav' | 'google' | 'microsoft'

export type SyncState =
  | 'synced'
  | 'local_new'
  | 'local_modified'
  | 'local_deleted'
  | 'conflict'

export type SyncStatus = 'idle' | 'ok' | 'error' | 'conflict'

export interface CalDAVConfig {
  url: string
  username: string
  passwordEncrypted: string
  verifySsl: boolean
}

export interface GoogleTasksConfig {
  clientId: string
  clientSecretEncrypted: string
  refreshTokenEncrypted?: string
  accessTokenEncrypted?: string
  accessTokenExpiresAt?: string
  email?: string
}

export interface MicrosoftTasksConfig {
  clientId: string
  clientSecretEncrypted: string
  tenantId?: string
  refreshTokenEncrypted?: string
  accessTokenEncrypted?: string
  accessTokenExpiresAt?: string
  email?: string
}

export interface Account {
  id: string
  name: string
  provider: ProviderId
  config: CalDAVConfig | GoogleTasksConfig | MicrosoftTasksConfig
  enabled: boolean
  createdAt: string
  lastSyncAt?: string
  lastSyncStatus?: SyncStatus
  lastSyncError?: string
  ownerUserId?: string
}

export interface TaskList {
  id: string
  accountId: string
  remoteId: string
  name: string
  readOnly: boolean
  visible: boolean
}

export interface Task {
  id: string
  listId: string
  uid: string
  remoteHref?: string
  remoteEtag?: string
  icalData: string
  summary: string
  completed: boolean
  due?: string
  localModifiedAt: string
  remoteModifiedAt?: string
  syncState: SyncState
  conflictRemoteIcal?: string
}

export interface SyncLogEntry {
  id: string
  accountId: string
  startedAt: string
  finishedAt?: string
  added: number
  updated: number
  deleted: number
  conflicts: number
  error?: string
}

export interface TasksStore {
  version: number
  accounts: Account[]
  lists: TaskList[]
  tasks: Task[]
  syncLog: SyncLogEntry[]
}

export const STORE_VERSION = 2

export const EMPTY_STORE: TasksStore = {
  version: STORE_VERSION,
  accounts: [],
  lists: [],
  tasks: [],
  syncLog: [],
}

export interface AccountCreateBody {
  name: string
  provider?: ProviderId
  caldav?: {
    url: string
    username: string
    password: string
    verifySsl?: boolean
  }
  google?: {
    clientId?: string
    clientSecret?: string
  }
  microsoft?: {
    clientId?: string
    clientSecret?: string
    tenantId?: string
  }
}

export interface AccountUpdateBody {
  name?: string
  enabled?: boolean
  caldav?: {
    url?: string
    username?: string
    password?: string
    verifySsl?: boolean
  }
  google?: {
    clientId?: string
    clientSecret?: string
  }
  microsoft?: {
    clientId?: string
    clientSecret?: string
    tenantId?: string
  }
}

export interface TaskCreateBody {
  listId: string
  summary: string
  due?: string
}

export interface TaskUpdateBody {
  summary?: string
  completed?: boolean
  due?: string | null
}

export interface ListUpdateBody {
  visible?: boolean
}

export interface SummaryResponse {
  open: number
  completed: number
  pendingSync: number
  lists: Array<{ id: string; name: string; open: number }>
}

export function isCalDavConfig(config: Account['config']): config is CalDAVConfig {
  return 'url' in config && 'passwordEncrypted' in config
}

export function isGoogleConfig(config: Account['config']): config is GoogleTasksConfig {
  return 'clientSecretEncrypted' in config && !('url' in config) && !('tenantId' in config)
}

export function isMicrosoftConfig(config: Account['config']): config is MicrosoftTasksConfig {
  return 'clientSecretEncrypted' in config && !('url' in config) && 'tenantId' in config
}

export function isOAuthProvider(provider: ProviderId): boolean {
  return provider === 'google' || provider === 'microsoft'
}

export function normalizeAccount(account: Account): Account {
  if (account.provider && account.config) return account
  const legacy = account as Account & { config: CalDAVConfig }
  return {
    ...legacy,
    provider: 'caldav',
    config: legacy.config,
  }
}
