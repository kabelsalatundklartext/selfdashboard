import { createDAVClient } from 'tsdav'

import { assertSafeOutboundUrl } from '@/lib/security/ssrf'
import { formatCalDavPushError, resolveCalendarReadOnly } from './caldav-privileges'
import { caldavObjectFilename, joinCollectionUrl, normalizeCaldavServerUrl } from './caldav-url'
import { decrypt } from './crypto'
import { buildVtodo, parseVcalendarTodos } from './vtodo'
import { nowIso } from './store'
import type { Account, CalDAVConfig, SyncState, Task, TaskList, TasksStore } from './types'
import { isCalDavConfig } from './types'

export interface SyncResult {
  added: number
  updated: number
  deleted: number
  conflicts: number
  errors: string[]
}

const emptyResult = (): SyncResult => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] })

function mergeResult(a: SyncResult, b: SyncResult): SyncResult {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    deleted: a.deleted + b.deleted,
    conflicts: a.conflicts + b.conflicts,
    errors: [...a.errors, ...b.errors],
  }
}

function decryptPassword(encrypted: string): string {
  try {
    return decrypt(encrypted)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(
      `Passwort kann nicht entschlüsselt werden — Konto bearbeiten und Passwort erneut speichern. (${msg})`,
    )
  }
}

async function buildClient(account: Account) {
  if (!isCalDavConfig(account.config)) throw new Error('not a caldav account')
  const cfg = account.config
  const password = decryptPassword(cfg.passwordEncrypted)
  const serverUrl = normalizeCaldavServerUrl(cfg.url)
  try {
    assertSafeOutboundUrl(serverUrl)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`CalDAV URL blocked: ${msg}`)
  }
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg.username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
}

export interface DiscoveredList {
  remoteId: string
  name: string
  readOnly: boolean
}

function caldavDisplayName(cal: { url: string; displayName?: unknown }): string {
  const dn = cal.displayName
  if (typeof dn === 'string' && dn.trim()) return dn.trim()
  if (dn && typeof dn === 'object' && 'value' in dn && typeof (dn as { value?: unknown }).value === 'string') {
    return String((dn as { value: string }).value).trim()
  }
  try {
    const seg = new URL(cal.url).pathname.split('/').filter(Boolean).pop()
    if (seg) return seg
  } catch {
    /* ignore */
  }
  return cal.url
}

function looksLikeTaskList(cal: Record<string, unknown>, name: string): boolean {
  const blob = JSON.stringify(cal).toUpperCase()
  if (blob.includes('VTODO') && !blob.includes('VEVENT')) return true
  const n = name.toLowerCase()
  if (/task|aufgabe|todo|inbox|erledigt|completed|liste/.test(n)) return true
  return false
}

export async function discoverCaldavTaskLists(account: Account): Promise<DiscoveredList[]> {
  const client = await buildClient(account)
  const calendars = await client.fetchCalendars()
  const out: DiscoveredList[] = []
  for (const c of calendars) {
    const name = caldavDisplayName(c)
    if (!looksLikeTaskList(c as Record<string, unknown>, name)) continue
    const readOnly = await resolveCalendarReadOnly(client, name, c.url)
    out.push({ remoteId: c.url, name, readOnly })
  }
  return out
}

export type CaldavClientCache = {
  client: Awaited<ReturnType<typeof createDAVClient>>
  davCalendars: Awaited<ReturnType<Awaited<ReturnType<typeof createDAVClient>>['fetchCalendars']>>
}

export async function getCaldavClientCache(account: Account): Promise<CaldavClientCache> {
  const client = await buildClient(account)
  const davCalendars = await client.fetchCalendars()
  return { client, davCalendars }
}

export async function testCaldav(account: Account): Promise<{ ok: boolean; error?: string; listCount?: number }> {
  try {
    const lists = await discoverTaskLists(account)
    return { ok: true, listCount: lists.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function syncTaskList(
  account: Account,
  list: TaskList,
  store: TasksStore,
  cache?: CaldavClientCache,
  pushOnly = false,
): Promise<SyncResult> {
  const client = cache?.client ?? (await buildClient(account))
  const davCalendars = cache?.davCalendars ?? (await client.fetchCalendars())
  const davCal = davCalendars.find((c) => c.url === list.remoteId)
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote list not found: ${list.remoteId}`] }
  }

  const pull = pushOnly ? emptyResult() : await pullList(client, davCal, list, store)
  if (list.readOnly) return pull
  const push = await pushList(client, davCal, list, store)
  return mergeResult(pull, push)
}

async function pullList(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  davCal: { url: string },
  list: TaskList,
  store: TasksStore,
): Promise<SyncResult> {
  const result = emptyResult()
  let objects: Array<{ url: string; etag: string; data: string }>
  try {
    const fetched = await client.fetchCalendarObjects({ calendar: davCal })
    objects = fetched.map((o) => ({ url: o.url, etag: (o as { etag?: string }).etag ?? '', data: o.data ?? '' }))
  } catch (e: unknown) {
    result.errors.push(`fetch: ${e instanceof Error ? e.message : String(e)}`)
    return result
  }

  for (const obj of objects) {
    const parsed = parseVcalendarTodos(obj.data)
    if (!parsed.length) continue
    const remote = parsed[0]!
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === remote.uid)

    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${remote.uid}`,
        listId: list.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary || '—',
        completed: remote.completed,
        due: remote.due,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: 'synced',
      })
      result.added++
      continue
    }

    const local = store.tasks[localIdx]!
    if (local.syncState === 'local_modified' || local.syncState === 'local_deleted') {
      if (local.remoteEtag !== obj.etag) {
        local.syncState = 'conflict'
        local.conflictRemoteIcal = obj.data
        local.remoteHref = obj.url
        local.remoteEtag = obj.etag
        local.remoteModifiedAt = remote.remoteModifiedIso
        result.conflicts++
      }
      continue
    }

    if (local.remoteEtag !== obj.etag) {
      Object.assign(local, {
        icalData: obj.data,
        summary: remote.summary || local.summary,
        completed: remote.completed,
        due: remote.due,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: 'synced' as SyncState,
      })
      result.updated++
    }
  }

  return result
}

async function pushList(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  davCal: { url: string },
  list: TaskList,
  store: TasksStore,
): Promise<SyncResult> {
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
          await client.deleteCalendarObject({
            calendarObject: { url: task.remoteHref, etag: task.remoteEtag ?? '', data: '' },
          })
        }
        const idx = store.tasks.findIndex((t) => t.id === task.id)
        if (idx >= 0) store.tasks.splice(idx, 1)
        result.deleted++
        continue
      }

      const ical = buildVtodo({
        uid: task.uid,
        summary: task.summary,
        completed: task.completed,
        due: task.due,
        lastModifiedIso: task.localModifiedAt,
      })

      if (task.syncState === 'local_new') {
        const filename = caldavObjectFilename(task.uid)
        const res = await client.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename,
        })
        task.icalData = ical
        task.remoteHref = res?.url ?? joinCollectionUrl(davCal.url, filename)
        task.remoteEtag = (res as { etag?: string })?.etag ?? ''
        task.syncState = 'synced'
        result.added++
      } else if (task.syncState === 'local_modified') {
        await client.updateCalendarObject({
          calendarObject: {
            url: task.remoteHref!,
            etag: task.remoteEtag ?? '',
            data: ical,
          },
        })
        task.icalData = ical
        task.syncState = 'synced'
        result.updated++
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('412')) {
        task.syncState = 'conflict'
        result.conflicts++
      } else {
        result.errors.push(formatCalDavPushError(list.name, task.uid, msg))
      }
    }
  }

  return result
}
