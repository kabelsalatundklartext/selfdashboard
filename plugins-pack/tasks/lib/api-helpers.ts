import { encrypt } from './crypto'
import { newId, nowIso } from './store'
import type {
  Account,
  AccountCreateBody,
  AccountUpdateBody,
  GoogleTasksConfig,
  MicrosoftTasksConfig,
  SummaryResponse,
  Task,
  TaskList,
  TasksStore,
} from './types'
import { isCalDavConfig, isGoogleConfig, isMicrosoftConfig } from './types'

export interface AccountView {
  id: string
  name: string
  provider: 'caldav' | 'google' | 'microsoft'
  enabled: boolean
  createdAt: string
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  listCount: number
  endpoint?: string
  url?: string
  username?: string
  googleConnected?: boolean
  googleClientId?: string
  microsoftConnected?: boolean
  microsoftClientId?: string
  microsoftTenantId?: string
}

export function toAccountView(a: Account, lists: TaskList[]): AccountView {
  const base = {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    listCount: lists.filter((l) => l.accountId === a.id).length,
  }
  if (a.provider === 'google' && isGoogleConfig(a.config)) {
    return {
      ...base,
      endpoint: 'Google Tasks',
      googleConnected: Boolean(a.config.refreshTokenEncrypted),
      googleClientId: a.config.clientId,
    }
  }
  if (a.provider === 'microsoft' && isMicrosoftConfig(a.config)) {
    return {
      ...base,
      endpoint: 'Microsoft To Do',
      microsoftConnected: Boolean(a.config.refreshTokenEncrypted),
      microsoftClientId: a.config.clientId,
      microsoftTenantId: a.config.tenantId,
    }
  }
  if (isCalDavConfig(a.config)) {
    let endpoint = ''
    try {
      endpoint = new URL(a.config.url).host
    } catch {
      endpoint = a.config.url
    }
    return {
      ...base,
      endpoint,
      url: a.config.url,
      username: a.config.username,
    }
  }
  return base
}

export function buildAccount(body: AccountCreateBody, ownerUserId: string): Account {
  const provider = body.provider ?? (body.microsoft ? 'microsoft' : body.google ? 'google' : 'caldav')
  if (provider === 'google') {
    const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim()
    const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim()
    const clientId = body.google?.clientId?.trim() || envId || ''
    const clientSecret = body.google?.clientSecret || envSecret || ''
    if (!clientId || !clientSecret) {
      throw new Error('Google Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)')
    }
    const config: GoogleTasksConfig = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret),
    }
    return {
      id: newId('acc'),
      name: body.name.trim() || 'Google Tasks',
      provider: 'google',
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId,
    }
  }
  if (provider === 'microsoft') {
    const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim()
    const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim()
    const clientId = body.microsoft?.clientId?.trim() || envId || ''
    const clientSecret = body.microsoft?.clientSecret || envSecret || ''
    if (!clientId || !clientSecret) {
      throw new Error('Microsoft Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)')
    }
    const config: MicrosoftTasksConfig = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret),
      tenantId: body.microsoft?.tenantId?.trim() || 'common',
    }
    return {
      id: newId('acc'),
      name: body.name.trim() || 'Microsoft To Do',
      provider: 'microsoft',
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId,
    }
  }
  if (!body.caldav?.url || !body.caldav.username || !body.caldav.password) {
    throw new Error('CalDAV URL, Benutzername und Passwort erforderlich')
  }
  return {
    id: newId('acc'),
    name: body.name.trim() || 'CalDAV',
    provider: 'caldav',
    config: {
      url: body.caldav.url.trim(),
      username: body.caldav.username.trim(),
      passwordEncrypted: encrypt(body.caldav.password),
      verifySsl: body.caldav.verifySsl !== false,
    },
    enabled: true,
    createdAt: nowIso(),
    ownerUserId,
  }
}

export function applyAccountUpdate(a: Account, body: AccountUpdateBody): void {
  if (body.name?.trim()) a.name = body.name.trim()
  if (typeof body.enabled === 'boolean') a.enabled = body.enabled
  if (a.provider === 'caldav' && body.caldav && isCalDavConfig(a.config)) {
    if (body.caldav.url?.trim()) a.config.url = body.caldav.url.trim()
    if (body.caldav.username?.trim()) a.config.username = body.caldav.username.trim()
    if (body.caldav.password) a.config.passwordEncrypted = encrypt(body.caldav.password)
    if (typeof body.caldav.verifySsl === 'boolean') a.config.verifySsl = body.caldav.verifySsl
  }
  if (a.provider === 'google' && body.google && isGoogleConfig(a.config)) {
    if (body.google.clientId?.trim()) a.config.clientId = body.google.clientId.trim()
    if (body.google.clientSecret) a.config.clientSecretEncrypted = encrypt(body.google.clientSecret)
  }
  if (a.provider === 'microsoft' && body.microsoft && isMicrosoftConfig(a.config)) {
    if (body.microsoft.clientId?.trim()) a.config.clientId = body.microsoft.clientId.trim()
    if (body.microsoft.clientSecret) a.config.clientSecretEncrypted = encrypt(body.microsoft.clientSecret)
    if (body.microsoft.tenantId?.trim()) a.config.tenantId = body.microsoft.tenantId.trim()
  }
}

export function buildSummary(store: TasksStore): SummaryResponse {
  const visibleLists = store.lists.filter((l) => l.visible)
  const visibleIds = new Set(visibleLists.map((l) => l.id))
  const active = store.tasks.filter((t) => visibleIds.has(t.listId) && t.syncState !== 'local_deleted')
  const open = active.filter((t) => !t.completed).length
  const completed = active.filter((t) => t.completed).length
  const pendingSync = active.filter(
    (t) => t.syncState === 'local_new' || t.syncState === 'local_modified' || t.syncState === 'local_deleted',
  ).length
  const lists = visibleLists.map((l) => ({
    id: l.id,
    name: l.name,
    open: active.filter((t) => t.listId === l.id && !t.completed).length,
  }))
  return { open, completed, pendingSync, lists }
}

export function taskToView(t: Task, list?: TaskList) {
  return {
    id: t.id,
    listId: t.listId,
    listName: list?.name,
    uid: t.uid,
    summary: t.summary,
    completed: t.completed,
    due: t.due,
    syncState: t.syncState,
    readOnly: list?.readOnly ?? false,
  }
}

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export function badRequest(msg: string): Response {
  return Response.json({ error: msg }, { status: 400 })
}

export function forbidden(msg: string): Response {
  return Response.json({ error: msg }, { status: 403 })
}

export function notFound(msg: string): Response {
  return Response.json({ error: msg }, { status: 404 })
}

export function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
