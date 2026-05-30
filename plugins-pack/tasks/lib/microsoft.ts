import { decrypt, encrypt } from './crypto'
import { nowIso } from './store'
import type { Account, MicrosoftTasksConfig, TasksStore, Task, TaskList } from './types'
import { isMicrosoftConfig } from './types'

const SCOPES = 'Tasks.ReadWrite offline_access'
const GRAPH = 'https://graph.microsoft.com/v1.0'

export interface SyncResult {
  added: number
  updated: number
  deleted: number
  conflicts: number
  errors: string[]
}

const emptyResult = (): SyncResult => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] })

type MsTaskList = {
  id?: string
  displayName?: string
  isOwner?: boolean
}

type MsDateTime = {
  dateTime?: string
  timeZone?: string
}

type MsTask = {
  id?: string
  title?: string
  status?: string
  lastModifiedDateTime?: string
  dueDateTime?: MsDateTime
}

type MsListResponse<T> = {
  value?: T[]
  '@odata.nextLink'?: string
  error?: { message?: string; code?: string }
}

function cfg(account: Account): MicrosoftTasksConfig {
  if (account.provider !== 'microsoft' || !isMicrosoftConfig(account.config)) {
    throw new Error('not a microsoft account')
  }
  return account.config
}

function tenantId(config: MicrosoftTasksConfig): string {
  return config.tenantId?.trim() || 'common'
}

function authBase(config: MicrosoftTasksConfig): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId(config))}/oauth2/v2.0`
}

export function resolveMicrosoftClientCredentials(
  config: MicrosoftTasksConfig,
): { clientId: string; clientSecret: string } {
  const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim()
  const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim()
  const clientId = config.clientId?.trim() || envId || ''
  let clientSecret = ''
  if (config.clientSecretEncrypted) {
    try {
      clientSecret = decrypt(config.clientSecretEncrypted)
    } catch {
      clientSecret = ''
    }
  }
  if (!clientSecret && envSecret) clientSecret = envSecret
  if (!clientId || !clientSecret) {
    throw new Error('Microsoft Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_MICROSOFT_TASKS_*)')
  }
  return { clientId, clientSecret }
}

export function microsoftRedirectUri(req: Request): string {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim()
  if (env) return `${env.replace(/\/+$/, '')}/api/plugins/tasks/microsoft/callback`
  return `${new URL(req.url).origin}/api/plugins/tasks/microsoft/callback`
}

export function buildMicrosoftAuthUrl(req: Request, account: Account, state: string): string {
  const c = cfg(account)
  const { clientId } = resolveMicrosoftClientCredentials(c)
  const redirectUri = microsoftRedirectUri(req)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state,
    prompt: 'consent',
  })
  return `${authBase(c)}/authorize?${params.toString()}`
}

async function tokenRequest(
  config: MicrosoftTasksConfig,
  body: Record<string, string>,
): Promise<{
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}> {
  const { clientId, clientSecret } = resolveMicrosoftClientCredentials(config)
  const res = await fetch(`${authBase(config)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...body, client_id: clientId, client_secret: clientSecret }).toString(),
  })
  return res.json() as Promise<{
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }>
}

export async function exchangeMicrosoftCode(
  account: Account,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  const c = cfg(account)
  const json = await tokenRequest(c, {
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || 'token exchange failed')
  }
  if (!json.refresh_token) {
    throw new Error('Kein Refresh-Token — Microsoft-Konto erneut verbinden (offline_access).')
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString()
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt }
}

async function refreshMicrosoftAccessToken(account: Account): Promise<{ accessToken: string; expiresAt: string }> {
  const c = cfg(account)
  if (!c.refreshTokenEncrypted) throw new Error('Microsoft nicht verbunden')
  const refreshToken = decrypt(c.refreshTokenEncrypted)
  const json = await tokenRequest(c, {
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES,
  })
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || 'token refresh failed')
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
  }
}

export async function ensureMicrosoftAccessToken(account: Account): Promise<string> {
  const c = cfg(account)
  if (
    c.accessTokenEncrypted &&
    c.accessTokenExpiresAt &&
    new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 60_000
  ) {
    return decrypt(c.accessTokenEncrypted)
  }
  const fresh = await refreshMicrosoftAccessToken(account)
  c.accessTokenEncrypted = encrypt(fresh.accessToken)
  c.accessTokenExpiresAt = fresh.expiresAt
  return fresh.accessToken
}

export function applyMicrosoftTokens(
  account: Account,
  tokens: { accessToken: string; refreshToken: string; expiresAt: string },
): void {
  const c = cfg(account)
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken)
  c.accessTokenEncrypted = encrypt(tokens.accessToken)
  c.accessTokenExpiresAt = tokens.expiresAt
}

async function graphFetch(account: Account, path: string, init?: RequestInit): Promise<Response> {
  const token = await ensureMicrosoftAccessToken(account)
  const url = path.startsWith('http') ? path : `${GRAPH}${path}`
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}

async function graphJson<T>(account: Account, path: string, init?: RequestInit): Promise<T> {
  const res = await graphFetch(account, path, init)
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`)
  return json
}

async function fetchAllPages<T>(account: Account, path: string): Promise<T[]> {
  const out: T[] = []
  let next: string | undefined = path.startsWith('http') ? path : `${GRAPH}${path}`
  while (next) {
    const json = await graphJson<MsListResponse<T>>(account, next)
    out.push(...(json.value ?? []))
    next = json['@odata.nextLink']
  }
  return out
}

export async function testMicrosoftAccount(
  account: Account,
): Promise<{ ok: boolean; error?: string; listCount?: number }> {
  try {
    if (!cfg(account).refreshTokenEncrypted) {
      return { ok: false, error: 'Microsoft noch nicht verbunden — „Mit Microsoft verbinden“ klicken.' }
    }
    const lists = await discoverMicrosoftTaskLists(account)
    return { ok: true, listCount: lists.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export interface DiscoveredList {
  remoteId: string
  name: string
  readOnly: boolean
}

export async function discoverMicrosoftTaskLists(account: Account): Promise<DiscoveredList[]> {
  const lists = await fetchAllPages<MsTaskList>(account, '/me/todo/lists')
  return lists
    .filter((l) => l.id)
    .map((l) => ({
      remoteId: l.id!,
      name: l.displayName?.trim() || l.id!,
      readOnly: l.isOwner === false,
    }))
}

function msUid(taskId: string): string {
  return `microsoft-${taskId}`
}

function parseMsDue(due?: MsDateTime): string | undefined {
  if (!due?.dateTime) return undefined
  if (/^\d{4}-\d{2}-\d{2}/.test(due.dateTime)) return due.dateTime.slice(0, 10)
  return due.dateTime
}

function msDueBody(due?: string): { dueDateTime: MsDateTime } | Record<string, never> {
  if (!due) return {}
  const date = /^\d{4}-\d{2}-\d{2}$/.test(due) ? `${due}T00:00:00.0000000` : due
  return { dueDateTime: { dateTime: date, timeZone: 'UTC' } }
}

export async function syncMicrosoftTaskList(
  account: Account,
  list: TaskList,
  store: TasksStore,
  pushOnly = false,
): Promise<SyncResult> {
  const pull = pushOnly ? emptyResult() : await pullMicrosoftList(account, list, store)
  const push = await pushMicrosoftList(account, list, store)
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors],
  }
}

async function pullMicrosoftList(account: Account, list: TaskList, store: TasksStore): Promise<SyncResult> {
  const result = emptyResult()
  let remotes: MsTask[]
  try {
    remotes = await fetchAllPages<MsTask>(
      account,
      `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks?$top=100`,
    )
  } catch (e: unknown) {
    result.errors.push(e instanceof Error ? e.message : String(e))
    return result
  }

  for (const remote of remotes) {
    if (!remote.id) continue
    const uid = msUid(remote.id)
    const completed = remote.status === 'completed'
    const summary = remote.title?.trim() || '—'
    const etag = remote.lastModifiedDateTime || ''
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === uid)

    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${uid}`,
        listId: list.id,
        uid,
        remoteHref: remote.id,
        remoteEtag: etag,
        icalData: '',
        summary,
        completed,
        due: parseMsDue(remote.dueDateTime),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.lastModifiedDateTime,
        syncState: 'synced',
      })
      result.added++
      continue
    }

    const local = store.tasks[localIdx]!
    if (local.syncState === 'local_modified' || local.syncState === 'local_deleted') {
      if (local.remoteEtag !== etag) {
        local.syncState = 'conflict'
        result.conflicts++
      }
      continue
    }

    if (local.remoteEtag !== etag) {
      local.summary = summary
      local.completed = completed
      local.due = parseMsDue(remote.dueDateTime)
      local.remoteHref = remote.id
      local.remoteEtag = etag
      local.remoteModifiedAt = remote.lastModifiedDateTime
      local.syncState = 'synced'
      result.updated++
    }
  }

  return result
}

async function pushMicrosoftList(account: Account, list: TaskList, store: TasksStore): Promise<SyncResult> {
  const result = emptyResult()
  const pending = store.tasks.filter(
    (t) =>
      t.listId === list.id &&
      (t.syncState === 'local_new' || t.syncState === 'local_modified' || t.syncState === 'local_deleted'),
  )

  const listPath = `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks`

  for (const task of pending) {
    try {
      if (task.syncState === 'local_deleted') {
        if (task.remoteHref) {
          const res = await graphFetch(
            account,
            `${listPath}/${encodeURIComponent(task.remoteHref)}`,
            { method: 'DELETE' },
          )
          if (!res.ok && res.status !== 404) {
            const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
            throw new Error(j.error?.message || `HTTP ${res.status}`)
          }
        }
        store.tasks = store.tasks.filter((t) => t.id !== task.id)
        result.deleted++
        continue
      }

      const body: Record<string, unknown> = {
        title: task.summary,
        status: task.completed ? 'completed' : 'notStarted',
        ...msDueBody(task.due),
      }

      if (task.syncState === 'local_new') {
        const json = await graphJson<MsTask>(account, listPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!json.id) throw new Error('create failed')
        task.uid = msUid(json.id)
        task.remoteHref = json.id
        task.remoteEtag = json.lastModifiedDateTime || nowIso()
        task.syncState = 'synced'
        result.added++
      } else if (task.syncState === 'local_modified' && task.remoteHref) {
        const json = await graphJson<MsTask>(
          account,
          `${listPath}/${encodeURIComponent(task.remoteHref)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        )
        task.remoteEtag = json.lastModifiedDateTime || nowIso()
        task.syncState = 'synced'
        result.updated++
      }
    } catch (e: unknown) {
      result.errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return result
}
