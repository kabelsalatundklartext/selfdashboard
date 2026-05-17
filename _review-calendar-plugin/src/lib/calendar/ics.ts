/**
 * ICS feed provider — read-only, one-way sync.
 *
 * One feed URL = one calendar collection. webcal:// gets rewritten to https://
 * automatically. We do a Conditional GET with If-None-Match (ETag) so the
 * remote can return 304 when nothing changed.
 *
 * Strategy on a 200 response: re-parse the whole feed, atomically replace
 * the calendar's events. We can do this because the feed is read-only by
 * definition; there are no local edits to worry about.
 */

import { parseVcalendar } from './ical'
import { nowIso } from './store'
import type {
  Account,
  Calendar,
  CalendarEvent,
  CalendarStore,
  ICSConfig,
} from './types'
import { decrypt } from './crypto'
import type { DiscoveredCalendar } from './caldav'

function normaliseUrl(url: string): string {
  if (url.startsWith('webcal://')) return 'https://' + url.slice('webcal://'.length)
  if (url.startsWith('webcals://')) return 'https://' + url.slice('webcals://'.length)
  return url
}

export async function discoverIcsCalendars(account: Account): Promise<DiscoveredCalendar[]> {
  const cfg = account.config as ICSConfig
  const url = normaliseUrl(cfg.url)
  return [{
    remoteId: url,
    name: account.name,
    readOnly: true,
  }]
}

export async function syncIcsCalendar(
  account: Account,
  calendar: Calendar,
  store: CalendarStore,
): Promise<{ added: number; updated: number; deleted: number; conflicts: number; errors: string[] }> {
  const cfg = account.config as ICSConfig
  const url = normaliseUrl(cfg.url)

  const headers: Record<string, string> = { 'User-Agent': 'SelfDashboard-Calendar/1.0' }
  if (calendar.etagGlobal) headers['If-None-Match'] = calendar.etagGlobal
  if (cfg.username && cfg.passwordEncrypted) {
    const pw = decrypt(cfg.passwordEncrypted)
    headers['Authorization'] = 'Basic ' + Buffer.from(`${cfg.username}:${pw}`).toString('base64')
  }

  let resp: Response
  try {
    resp = await fetch(url, { headers, redirect: 'follow' })
  } catch (e: any) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`fetch: ${e?.message ?? e}`] }
  }

  if (resp.status === 304) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] }
  }
  if (!resp.ok) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`HTTP ${resp.status}`] }
  }

  const body = await resp.text()
  const parsed = parseVcalendar(body)

  // ICS feeds are one big VCALENDAR — we slice per VEVENT into its own blob
  // so recurrence-expansion can work on a single event in isolation later.
  const existingByUid = new Map(
    store.events
      .filter(e => e.calendarId === calendar.id)
      .map(e => [e.uid, e] as const),
  )
  let added = 0
  let updated = 0
  const seenUids = new Set<string>()

  for (const pe of parsed) {
    seenUids.add(pe.uid)
    // build a minimal single-event blob so per-event RRULE expansion works
    const sliced = buildSingleVeventBlob(body, pe.uid)
    const existing = existingByUid.get(pe.uid)
    if (!existing) {
      store.events.push({
        id: `evt_${pe.uid}`,
        calendarId: calendar.id,
        uid: pe.uid,
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: 'synced',
      })
      added++
    } else if (existing.icalData !== sliced) {
      Object.assign(existing, {
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: 'synced' as const,
      })
      updated++
    }
  }

  // delete events that disappeared from the feed
  let deleted = 0
  for (let i = store.events.length - 1; i >= 0; i--) {
    const e = store.events[i]
    if (e.calendarId !== calendar.id) continue
    if (!seenUids.has(e.uid)) {
      store.events.splice(i, 1)
      deleted++
    }
  }

  // remember the new ETag for the next conditional GET
  const newEtag = resp.headers.get('etag') ?? resp.headers.get('ETag')
  if (newEtag) calendar.etagGlobal = newEtag

  return { added, updated, deleted, conflicts: 0, errors: [] }
}

/**
 * Cheap extraction: scan the feed for `BEGIN:VEVENT … END:VEVENT` blocks
 * containing the given UID and wrap the matched block in a fresh VCALENDAR.
 * Good enough for ICS slicing where we never write back.
 */
function buildSingleVeventBlob(feed: string, uid: string): string {
  const lines = feed.split(/\r?\n/)
  const result: string[] = []
  let inEvent = false
  let buf: string[] = []
  let matched = false
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      buf = [line]
      matched = false
      continue
    }
    if (inEvent) {
      buf.push(line)
      if (/^UID:/i.test(line) && line.slice(4).trim() === uid) matched = true
      if (line === 'END:VEVENT') {
        if (matched) result.push(buf.join('\r\n'))
        inEvent = false
        buf = []
      }
    }
  }
  return [
    'BEGIN:VCALENDAR',
    'PRODID:-//SelfDashboard//ICS Slice//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    ...result,
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function testIcs(account: Account): Promise<{ ok: boolean; calendars?: DiscoveredCalendar[]; error?: string }> {
  try {
    const cfg = account.config as ICSConfig
    const url = normaliseUrl(cfg.url)
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (!resp.ok && resp.status !== 405) {
      // some servers don't support HEAD — try a real GET
      const get = await fetch(url, { redirect: 'follow' })
      if (!get.ok) return { ok: false, error: `HTTP ${get.status}` }
    }
    return { ok: true, calendars: await discoverIcsCalendars(account) }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) }
  }
}
