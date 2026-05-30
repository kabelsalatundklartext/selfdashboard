import { createHmac, randomBytes } from 'node:crypto'

import { decrypt, encrypt } from './crypto'
import { nowIso } from './store'
import type { Account, GoogleTasksConfig, SyncState, Task, TaskList, TasksStore } from './types'
import { isGoogleConfig } from './types'

const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks'
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token'
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1'

export interface SyncResult {
  added: number
  updated: number
  deleted: number
  conflicts: number
  errors: string[]
}

const emptyResult = (): SyncResult => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] })

type GoogleTask = {
  id?: string
  title?: string
  status?: string
  due?: string
  updated?: string
}

type GoogleTaskList = {
  id?: string
  title?: string
}

function cfg(account: Account): GoogleTasksConfig {
  if (account.provider !== 'google' || !isGoogleConfig(account.config)) {
    throw new Error('not a google account')
  }
  return account.config
}

export function resolveGoogleClientCredentials(config: GoogleTasksConfig): { clientId: string; clientSecret: string } {
  const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim()
  const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim()
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
    throw new Error('Google Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_GOOGLE_TASKS_*)')
  }
  return { clientId, clientSecret }
}

export function googleRedirectUri(req: Request): string {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim()
  if (env) return `${env.replace(/\/+$/, '')}/api/plugins/tasks/google/callback`
  return `${new URL(req.url).origin}/api/plugins/tasks/google/callback`
}

export function buildGoogleAuthUrl(req: Request, account: Account, state: string): string {
  const { clientId } = resolveGoogleClientCredentials(cfg(account))
  const redirectUri = googleRedirectUri(req)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: TASKS_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH}?${params.toString()}`
}

async function tokenRequest(body: Record<string, string>): Promise<{
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  return res.json() as Promise<{
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }>
}

export async function exchangeGoogleCode(
  account: Account,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  const { clientId, clientSecret } = resolveGoogleClientCredentials(cfg(account))
  const json = await tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || 'token exchange failed')
  }
  if (!json.refresh_token) {
    throw new Error('Kein Refresh-Token — Google-Konto erneut verbinden (prompt=consent).')
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString()
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt }
}

async function refreshGoogleAccessToken(account: Account): Promise<{ accessToken: string; expiresAt: string }> {
  const c = cfg(account)
  const { clientId, clientSecret } = resolveGoogleClientCredentials(c)
  if (!c.refreshTokenEncrypted) throw new Error('Google nicht verbunden')
  const refreshToken = decrypt(c.refreshTokenEncrypted)
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || 'token refresh failed')
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
  }
}

export async function ensureGoogleAccessToken(account: Account): Promise<string> {
  const c = cfg(account)
  if (
    c.accessTokenEncrypted &&
    c.accessTokenExpiresAt &&
    new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 60_000
  ) {
    return decrypt(c.accessTokenEncrypted)
  }
  const fresh = await refreshGoogleAccessToken(account)
  c.accessTokenEncrypted = encrypt(fresh.accessToken)
  c.accessTokenExpiresAt = fresh.expiresAt
  return fresh.accessToken
}

export function applyGoogleTokens(
  account: Account,
  tokens: { accessToken: string; refreshToken: string; expiresAt: string },
): void {
  const c = cfg(account)
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken)
  c.accessTokenEncrypted = encrypt(tokens.accessToken)
  c.accessTokenExpiresAt = tokens.expiresAt
}

async function googleFetch(account: Account, path: string, init?: RequestInit): Promise<Response> {
  const token = await ensureGoogleAccessToken(account)
  const url = path.startsWith('http') ? path : `${TASKS_API}${path}`
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
}

export async function testGoogleAccount(account: Account): Promise<{ ok: boolean; error?: string; listCount?: number }> {
  try {
    if (!cfg(account).refreshTokenEncrypted) {
      return { ok: false, error: 'Google noch nicht verbunden — „Mit Google verbinden“ klicken.' }
    }
    const lists = await discoverGoogleTaskLists(account)
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

export async function discoverGoogleTaskLists(account: Account): Promise<DiscoveredList[]> {
  const res = await googleFetch(account, '/users/@me/lists')
  const json = (await res.json()) as { items?: GoogleTaskList[]; error?: { message?: string } }
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`)
  return (json.items ?? [])
    .filter((l) => l.id)
    .map((l) => ({ remoteId: l.id!, name: l.title?.trim() || l.id!, readOnly: false }))
}

function googleUid(taskId: string): string {
  return `google-${taskId}`
}

function parseGoogleDue(due?: string): string | undefined {
  if (!due) return undefined
  if (/^\d{4}-\d{2}-\d{2}/.test(due)) return due.slice(0, 10)
  return due
}

export async function syncGoogleTaskList(
  account: Account,
  list: TaskList,
  store: TasksStore,
  pushOnly = false,
): Promise<SyncResult> {
  const pull = pushOnly ? emptyResult() : await pullGoogleList(account, list, store)
  const push = await pushGoogleList(account, list, store)
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors],
  }
}

async function pullGoogleList(account: Account, list: TaskList, store: TasksStore): Promise<SyncResult> {
  const result = emptyResult()
  const res = await googleFetch(
    account,
    `/lists/${encodeURIComponent(list.remoteId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
  )
  const json = (await res.json()) as { items?: GoogleTask[]; error?: { message?: string } }
  if (!res.ok) {
    result.errors.push(json.error?.message || `HTTP ${res.status}`)
    return result
  }

  for (const remote of json.items ?? []) {
    if (!remote.id) continue
    const uid = googleUid(remote.id)
    const completed = remote.status === 'completed'
    const summary = remote.title?.trim() || '—'
    const etag = remote.updated || ''
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
        due: parseGoogleDue(remote.due),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.updated,
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
      local.due = parseGoogleDue(remote.due)
      local.remoteHref = remote.id
      local.remoteEtag = etag
      local.remoteModifiedAt = remote.updated
      local.syncState = 'synced'
      result.updated++
    }
  }

  return result
}

async function pushGoogleList(account: Account, list: TaskList, store: TasksStore): Promise<SyncResult> {
  const result = emptyResult()
  const pending = store.tasks.filter(
    (t) =>
      t.listId === list.id &&
      (t.syncState === 'local_new' || t.syncState === 'local_modified' || t.syncState === 'local_deleted'),
  )

  for (const task of pending) {
    try {
      if (task.syncState === 'local_deleted') {
        if (task.remoteHref) {
          const res = await googleFetch(
            account,
            `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
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

      const body: Record<string, string> = {
        title: task.summary,
        status: task.completed ? 'completed' : 'needsAction',
      }
      if (task.due) {
        body.due = /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? `${task.due}T00:00:00.000Z` : task.due
      }

      if (task.syncState === 'local_new') {
        const res = await googleFetch(account, `/lists/${encodeURIComponent(list.remoteId)}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = (await res.json()) as GoogleTask & { error?: { message?: string } }
        if (!res.ok || !json.id) throw new Error(json.error?.message || `HTTP ${res.status}`)
        task.uid = googleUid(json.id)
        task.remoteHref = json.id
        task.remoteEtag = json.updated || nowIso()
        task.syncState = 'synced'
        result.added++
      } else if (task.syncState === 'local_modified' && task.remoteHref) {
        const res = await googleFetch(
          account,
          `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        )
        const json = (await res.json()) as GoogleTask & { error?: { message?: string } }
        if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`)
        task.remoteEtag = json.updated || nowIso()
        task.syncState = 'synced'
        result.updated++
      }
    } catch (e: unknown) {
      result.errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return result
}
