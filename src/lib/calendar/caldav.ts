/**
 * CalDAV provider — two-way sync.
 *
 * Uses `tsdav` (modern, maintained CalDAV/CardDAV client for Node/TS).
 *
 * Sync strategy:
 *   PULL  — Fetch the collection's full object list. tsdav handles the
 *           sync-collection report transparently when a syncToken is passed;
 *           otherwise it falls back to a full listing. For each remote item:
 *             - new uid              → insert as 'synced'
 *             - existing uid, etag = → no-op
 *             - existing uid, etag ≠ → if local state in (local_modified,
 *               local_deleted) flag 'conflict'; else update to 'synced'
 *             - remote missing       → if local 'synced' → delete locally;
 *                                       if local 'local_modified' → conflict
 *
 *   PUSH  — Iterate events with sync_state in (local_new, local_modified,
 *           local_deleted):
 *             - local_new        createCalendarObject → set href + etag → synced
 *             - local_modified   updateCalendarObject with If-Match etag
 *                                412 → conflict; otherwise refresh etag
 *             - local_deleted    deleteCalendarObject with If-Match etag
 *                                412 → conflict; 404 → already gone → drop row
 *
 * Notes:
 *   - We never edit raw blobs we got from the server. When the user edits,
 *     we rebuild VCALENDAR from our internal fields. Untouched events stay
 *     byte-identical so vendor-specific X-* properties survive.
 *   - tsdav talks via fetch + WebDAV verbs; no native deps needed.
 */

import { createDAVClient } from 'tsdav'

import {
  formatCalDavPushError,
  resolveCalendarReadOnly,
} from './caldav-privileges'
import { caldavObjectFilename, joinCollectionUrl, normalizeCaldavServerUrl } from './caldav-url'
import { decrypt } from './crypto'
import { buildVcalendar, parseVcalendar } from './ical'
import { nowIso } from './store'
import type {
  Account,
  Calendar,
  CalDAVConfig,
  CalendarEvent,
  CalendarStore,
  SyncState,
} from './types'

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

async function buildClient(account: Account) {
  const cfg = account.config as CalDAVConfig
  const password = decrypt(cfg.passwordEncrypted)
  const serverUrl = normalizeCaldavServerUrl(cfg.url)
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg.username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
}

// ---------------------------------------------------------------------------
// discovery
// ---------------------------------------------------------------------------

export interface DiscoveredCalendar {
  remoteId: string
  name: string
  color?: string
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

export async function discoverCaldavCalendars(account: Account): Promise<DiscoveredCalendar[]> {
  const client = await buildClient(account)
  const calendars = await client.fetchCalendars()
  const out: DiscoveredCalendar[] = []
  for (const c of calendars) {
    const name = caldavDisplayName(c)
    const readOnly = await resolveCalendarReadOnly(client, name, c.url)
    out.push({
      remoteId: c.url,
      name,
      color: (c as { calendarColor?: string }).calendarColor ?? undefined,
      readOnly,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// sync
// ---------------------------------------------------------------------------

export type CaldavClientCache = {
  client: Awaited<ReturnType<typeof createDAVClient>>
  davCalendars: Awaited<ReturnType<Awaited<ReturnType<typeof createDAVClient>>['fetchCalendars']>>
}

export async function getCaldavClientCache(account: Account): Promise<CaldavClientCache> {
  const client = await buildClient(account)
  const davCalendars = await client.fetchCalendars()
  return { client, davCalendars }
}

export async function syncCaldavCalendar(
  account: Account,
  calendar: Calendar,
  store: CalendarStore,
  cache?: CaldavClientCache,
): Promise<SyncResult> {
  const client = cache?.client ?? await buildClient(account)
  const davCalendars = cache?.davCalendars ?? await client.fetchCalendars()
  const davCal = davCalendars.find(c => c.url === calendar.remoteId)
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar.remoteId}`] }
  }

  const pull = await pullCaldav(client, davCal, calendar, store)
  if (calendar.readOnly) return pull

  const pendingDeletes = await pushPendingRemoteDeletes(client, calendar, store)
  const push = await pushCaldav(client, davCal, calendar, store)
  return mergeResult(mergeResult(pull, pendingDeletes), push)
}

/** Push local changes only — skips pull (used after create/update/delete for fast response). */
export async function syncCaldavCalendarPushOnly(
  account: Account,
  calendar: Calendar,
  store: CalendarStore,
  cache?: CaldavClientCache,
): Promise<SyncResult> {
  if (calendar.readOnly) return emptyResult()

  const client = cache?.client ?? await buildClient(account)
  const davCalendars = cache?.davCalendars ?? await client.fetchCalendars()
  const davCal = davCalendars.find(c => c.url === calendar.remoteId)
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar.remoteId}`] }
  }

  const pendingDeletes = await pushPendingRemoteDeletes(client, calendar, store)
  const push = await pushCaldav(client, davCal, calendar, store)
  return mergeResult(pendingDeletes, push)
}

async function pullCaldav(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  davCal: any,
  calendar: Calendar,
  store: CalendarStore,
): Promise<SyncResult> {
  const result = emptyResult()

  let objects: Array<{ url: string; etag: string; data: string }>
  try {
    const fetched = await client.fetchCalendarObjects({ calendar: davCal })
    objects = fetched.map(o => ({ url: o.url, etag: (o as any).etag ?? '', data: o.data ?? '' }))
  } catch (e: any) {
    result.errors.push(`fetch objects: ${e?.message ?? e}`)
    return result
  }

  const seenUids = new Set<string>()

  for (const obj of objects) {
    const parsed = parseVcalendar(obj.data)
    if (!parsed.length) continue
    const remote = parsed[0]
    seenUids.add(remote.uid)

    const localIdx = store.events.findIndex(
      e => e.calendarId === calendar.id && e.uid === remote.uid,
    )

    if (localIdx === -1) {
      store.events.push({
        id: `evt_${remote.uid}`,
        calendarId: calendar.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: 'synced',
      })
      result.added++
      continue
    }

    const local = store.events[localIdx]
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
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: 'synced' as SyncState,
      })
      result.updated++
    }
  }

  // Do not auto-delete local rows when missing from a full listing — WEB.DE and
  // other servers may omit freshly created objects until the next fetch cycle.
  // Explicit deletes are handled via push (local_deleted) or conflict resolution.

  return result
}

async function pushPendingRemoteDeletes(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  calendar: Calendar,
  store: CalendarStore,
): Promise<SyncResult> {
  const result = emptyResult()
  for (const ev of store.events) {
    const pd = ev.pendingRemoteDelete
    if (!pd || pd.calendarId !== calendar.id) continue
    try {
      await client.deleteCalendarObject({
        calendarObject: { url: pd.remoteHref, etag: pd.remoteEtag, data: '' },
      })
      delete ev.pendingRemoteDelete
      result.deleted++
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (msg.includes('404')) {
        delete ev.pendingRemoteDelete
        result.deleted++
      } else {
        result.errors.push(formatCalDavPushError(calendar.name, ev.uid, `move delete: ${msg}`))
      }
    }
  }
  return result
}

async function pushCaldav(
  client: Awaited<ReturnType<typeof createDAVClient>>,
  davCal: any,
  calendar: Calendar,
  store: CalendarStore,
): Promise<SyncResult> {
  const result = emptyResult()
  const pending = store.events.filter(
    e => e.calendarId === calendar.id &&
         (e.syncState === 'local_new' || e.syncState === 'local_modified' || e.syncState === 'local_deleted'),
  )

  for (const ev of pending) {
    try {
      if (ev.syncState === 'local_new') {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt,
        })
        const filename = caldavObjectFilename(ev.uid)
        const objectUrl = joinCollectionUrl(davCal.url, filename)
        const res = await client.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename,
        })
        const httpRes = res as Response
        if (httpRes && typeof httpRes.ok === 'boolean' && !httpRes.ok) {
          const body = await httpRes.text().catch(() => '')
          throw new Error(`HTTP ${httpRes.status} ${httpRes.statusText}${body ? `: ${body.slice(0, 120)}` : ''}`)
        }
        const loc = httpRes?.headers?.get?.('location')
        ev.icalData = ical
        ev.remoteHref = loc ? new URL(loc, davCal.url).href : objectUrl
        ev.remoteEtag = httpRes?.headers?.get?.('etag')?.replace(/^"|"$/g, '') ?? ''
        ev.syncState = 'synced'
        result.added++
      } else if (ev.syncState === 'local_modified') {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt,
        })
        const res = await client.updateCalendarObject({
          calendarObject: { url: ev.remoteHref!, etag: ev.remoteEtag, data: ical },
        })
        ev.icalData = ical
        ev.remoteEtag = (res as any).etag ?? ev.remoteEtag
        ev.syncState = 'synced'
        result.updated++
      } else if (ev.syncState === 'local_deleted') {
        if (!ev.remoteHref) {
          // never pushed — just drop the row
          store.events.splice(store.events.indexOf(ev), 1)
          result.deleted++
          continue
        }
        try {
          await client.deleteCalendarObject({
            calendarObject: { url: ev.remoteHref, etag: ev.remoteEtag, data: '' },
          })
        } catch (e: any) {
          if (!String(e?.message ?? '').includes('404')) throw e
        }
        store.events.splice(store.events.indexOf(ev), 1)
        result.deleted++
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e)
      if (msg.includes('412') || msg.includes('Precondition')) {
        ev.syncState = 'conflict'
        result.conflicts++
      } else {
        if (msg.includes('403')) {
          const calRow = store.calendars.find(c => c.id === calendar.id)
          if (calRow) calRow.readOnly = true
        }
        result.errors.push(formatCalDavPushError(calendar.name, ev.uid, msg))
      }
    }
  }
  return result
}

/** Verbindung testen, ohne irgendwas zu persistieren. */
export async function testCaldav(account: Account): Promise<{ ok: boolean; calendars?: DiscoveredCalendar[]; error?: string }> {
  try {
    const cals = await discoverCaldavCalendars(account)
    return { ok: true, calendars: cals }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) }
  }
}
