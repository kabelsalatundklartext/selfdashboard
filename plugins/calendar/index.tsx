'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { useDashboardStore } from '@/lib/store'
import { usePluginLocale } from '@/lib/pluginLocale'
import { reportClientLog } from '@/lib/reportLog'
import { DayEventModal, type EventEditDraft } from './DayEventModal'

export const meta: PluginMeta = {
  id: 'calendar',
  name: 'Calendar',
  description:
    'Monats-/Wochenansicht, lokale Termine und Zwei-Wege-CalDAV-Sync (WEB.DE, GMX, Nextcloud, Synology …) via tsdav-Server-Proxy.',
  version: '2.3.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 5, h: 5, minW: 3, minH: 4 },
  stackedExtraH: 2,
  configSchema: [
    {
      key: 'viewMode',
      label: 'Ansicht',
      type: 'select',
      defaultValue: 'month',
      options: [
        { label: 'Month', value: 'month' },
        { label: 'Week', value: 'week' },
      ],
    },
    {
      key: 'weekStart',
      label: 'Wochenstart',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto (Sprache)', value: 'auto' },
        { label: 'Montag', value: 'monday' },
        { label: 'Sonntag', value: 'sunday' },
      ],
    },
    {
      key: 'showOtherMonthDays',
      label: 'Tage aus Nachbarmonaten',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'highlightWeekends',
      label: 'Wochenenden hervorheben',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'showEventList',
      label: 'Terminliste unter dem Raster',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'listUpcomingOnly',
      label: 'Liste: nur anstehende Termine',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'maxListEntries',
      label: 'Liste: max. Einträge',
      type: 'number',
      defaultValue: 15,
    },
    {
      key: 'caldavRefreshMinutes',
      label: 'CalDAV aktualisieren (Min)',
      type: 'number',
      defaultValue: 30,
    },
  ],
}

type WeekStartMode = 'auto' | 'monday' | 'sunday'
type CalendarViewMode = 'month' | 'week'

/** Termin in `config.events` — ganztägig oder mit lokalem Zeitfenster (HH:mm). */
interface CalendarEventRow {
  id: string
  title: string
  date: string
  allDay?: boolean
  startTime?: string
  endTime?: string
  /** CalDAV UID nach erfolgreichem Push. */
  caldavUid?: string
  caldavHref?: string
  caldavEtag?: string
  feedIndex?: number
}

function eventTimeLabel(ev: { allDay?: boolean; startTime?: string; endTime?: string }, de: boolean): string {
  if (ev.allDay === true || (!ev.startTime && ev.allDay !== false)) {
    return de ? 'ganztägig' : 'all day'
  }
  if (ev.startTime && ev.endTime) return `${ev.startTime}–${ev.endTime}`
  return ev.startTime ?? ''
}

function caldavTimeFields(row: CalendarEventRow): { allDay: boolean; startTime: string; endTime: string } {
  if (row.allDay === true || (!row.startTime && row.allDay !== false)) {
    return { allDay: true, startTime: '', endTime: '' }
  }
  return {
    allDay: false,
    startTime: row.startTime ?? '09:00',
    endTime: row.endTime ?? '10:00',
  }
}

function rowFromEditDraft(d: EventEditDraft): CalendarEventRow {
  if (d.allDay) {
    return { id: d.id, title: d.title, date: d.date, allDay: true }
  }
  return {
    id: d.id,
    title: d.title,
    date: d.date,
    allDay: false,
    startTime: d.startTime,
    endTime: d.endTime,
  }
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseEvents(raw: unknown): CalendarEventRow[] {
  if (!Array.isArray(raw)) return []
  const out: CalendarEventRow[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const id = str(o.id)
    const title = str(o.title).slice(0, 240)
    const date = str(o.date)
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) continue
    const caldavUid = str(o.caldavUid).slice(0, 240) || undefined
    const caldavHref = str(o.caldavHref).slice(0, 2000) || undefined
    const caldavEtag = str(o.caldavEtag).slice(0, 200) || undefined
    const feedIndexRaw = o.feedIndex
    const feedIndex =
      typeof feedIndexRaw === 'number' && Number.isInteger(feedIndexRaw) && feedIndexRaw >= 0 && feedIndexRaw < 4
        ? feedIndexRaw
        : undefined
    const startTime = str(o.startTime).slice(0, 5)
    const endTime = str(o.endTime).slice(0, 5)
    const allDay = o.allDay === true || (!startTime && o.allDay !== false)
    out.push({
      id,
      title,
      date,
      ...(allDay ? { allDay: true } : { allDay: false, startTime: startTime || '09:00', endTime: endTime || '10:00' }),
      ...(caldavUid ? { caldavUid } : {}),
      ...(caldavHref ? { caldavHref } : {}),
      ...(caldavEtag ? { caldavEtag } : {}),
      ...(feedIndex !== undefined ? { feedIndex } : {}),
    })
  }
  return out
}

function clampListMax(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return 15
  return Math.min(50, Math.max(5, Math.round(n)))
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

type CalDavFeedConfig = { url: string; username?: string; password?: string; name?: string }
type IcsFeedConfig = { url: string; name?: string }

interface RemoteCalEvent {
  id: string
  uid?: string
  title: string
  date: string
  timeLabel?: string | null
  feedIndex: number
  feedName?: string
  sourceKind: 'caldav'
}

type ListEntry =
  | { mode: 'local'; id: string; date: string; title: string; synced?: boolean }
  | { mode: 'remote'; id: string; date: string; title: string; time?: string; source?: string }

function parseCalDavFeeds(raw: unknown): CalDavFeedConfig[] {
  if (!Array.isArray(raw)) return []
  const out: CalDavFeedConfig[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const url = str(o.url)
    if (!url) continue
    const name = str(o.name)
    const username = str(o.username)
    const password = typeof o.password === 'string' ? o.password.slice(0, 2000) : ''
    out.push({
      url: url.slice(0, 2000),
      ...(name ? { name: name.slice(0, 120) } : {}),
      ...(username ? { username: username.slice(0, 800) } : {}),
      password,
    })
    if (out.length >= 4) break
  }
  return out
}

/** Wie {@link parseCalDavFeeds}, behält aber leere URLs (neue Zeile in den Einstellungen). */
function parseIcsFeedsDraft(raw: unknown): IcsFeedConfig[] {
  if (!Array.isArray(raw)) return []
  const out: IcsFeedConfig[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const url = typeof o.url === 'string' ? o.url.trim().slice(0, 2000) : ''
    const name = str(o.name)
    out.push({
      url,
      ...(name ? { name: name.slice(0, 120) } : {}),
    })
    if (out.length >= 8) break
  }
  return out
}

function parseCalDavFeedsDraft(raw: unknown): CalDavFeedConfig[] {
  if (!Array.isArray(raw)) return []
  const out: CalDavFeedConfig[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const url = typeof o.url === 'string' ? o.url.trim().slice(0, 2000) : ''
    const name = str(o.name)
    const username = str(o.username)
    const password = typeof o.password === 'string' ? o.password.slice(0, 2000) : ''
    out.push({
      url,
      ...(name ? { name: name.slice(0, 120) } : {}),
      ...(username ? { username: username.slice(0, 800) } : {}),
      password,
    })
    if (out.length >= 4) break
  }
  return out
}

function clampIcsRefresh(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return 30
  return Math.min(240, Math.max(5, Math.round(n)))
}

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthStart(y: number, m: number): Date {
  return new Date(y, m, 1, 12, 0, 0, 0)
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1, 12, 0, 0, 0)
}

function weekStartsMonday(mode: WeekStartMode, de: boolean): boolean {
  if (mode === 'monday') return true
  if (mode === 'sunday') return false
  return de
}

function calendarStartDate(year: number, month: number, startsMonday: boolean): Date {
  const first = new Date(year, month, 1, 12, 0, 0, 0)
  const dow = first.getDay()
  const offset = startsMonday ? (dow + 6) % 7 : dow
  const start = new Date(year, month, 1 - offset, 12, 0, 0, 0)
  return start
}

function buildMonthCells(year: number, month: number, startsMonday: boolean): Date[] {
  const start = calendarStartDate(year, month, startsMonday)
  const out: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    d.setHours(12, 0, 0, 0)
    out.push(d)
  }
  return out
}

function startOfWeek(d: Date, startsMonday: boolean): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
  const dow = x.getDay()
  const offset = startsMonday ? (dow + 6) % 7 : dow
  x.setDate(x.getDate() - offset)
  return x
}

function buildWeekCells(anchor: Date, startsMonday: boolean): Date[] {
  const start = startOfWeek(anchor, startsMonday)
  const out: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    d.setHours(12, 0, 0, 0)
    out.push(d)
  }
  return out
}

function addDays(d: Date, delta: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
  x.setDate(x.getDate() + delta)
  return x
}

/** Anzeige z. B. „6.–12. Okt. 2025“ bzw. „29. Sept. – 5. Okt. 2025“. */
function formatWeekRangeTitle(weekStart: Date, loc: string): string {
  const end = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === end.getMonth() && weekStart.getFullYear() === end.getFullYear()
  if (sameMonth) {
    const a = weekStart.toLocaleDateString(loc, { day: 'numeric' })
    const b = end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} – ${b}`
  }
  const left = weekStart.toLocaleDateString(loc, { day: 'numeric', month: 'short' })
  const right = end.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${left} – ${right}`
}

function formatFeedError(code: string, detail: string | undefined, de: boolean): string {
  const d = detail?.trim() ?? ''
  if (
    code === 'wrong_dav_service' ||
    /carddav\.web\.de/i.test(d) ||
    /carddav host/i.test(d)
  ) {
    return de
      ? 'Falsche Adresse: carddav.web.de ist fürs Adressbuch — Kalender braucht caldav.web.de (…/begenda/dav/…@web.de/calendar)'
      : 'Wrong URL: carddav.web.de is for contacts — calendars need caldav.web.de (…/begenda/dav/…@web.de/calendar)'
  }
  if (code === 'missing_begenda_path') {
    return de
      ? 'WEB.DE: vollständige URL z. B. https://caldav.web.de/begenda/dav/name@web.de/calendar'
      : 'WEB.DE: use full URL e.g. https://caldav.web.de/begenda/dav/you@web.de/calendar'
  }
  if (code === 'unauthorized' || d.includes('App-Passwort') || d.includes('app-specific')) {
    const onCardDav = /carddav/i.test(d)
    if (onCardDav) {
      return de
        ? 'Anmeldung an carddav.web.de fehlgeschlagen — das ist Kontakte. Kalender-URL auf caldav.web.de umstellen.'
        : 'Auth to carddav.web.de failed — that is contacts. Switch calendar URL to caldav.web.de.'
    }
    return de
      ? 'Anmeldung fehlgeschlagen — bei 2FA das WEB.DE-App-Passwort nutzen (nicht das normale Passwort)'
      : 'Auth failed — with 2FA use WEB.DE app password (not your normal password)'
  }
  if (code === 'not_calendar_data') {
    return de
      ? 'Keine Termin-Daten — CalDAV-URL prüfen (…/begenda/dav/…@web.de/calendar)'
      : 'No event data — check CalDAV URL (…/begenda/dav/…@web.de/calendar)'
  }
  if (code === 'upstream_network' || code === 'fetch_timeout') {
    return de ? 'Server nicht erreichbar (Netzwerk/Timeout)' : 'Server unreachable (network/timeout)'
  }
  if (d) return `${code} · ${d}`
  return code
}

type CaldavWriteOk = { uid: string; objectUrl: string; etag: string | null }

async function postCalDavWrite(
  feed: CalDavFeedConfig,
  body: Record<string, unknown>,
  de: boolean,
): Promise<{ ok: true; data: CaldavWriteOk } | { ok: false; message: string }> {
  const res = await fetch('/api/calendar-caldav/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calendarUrl: feed.url,
      username: feed.username ?? '',
      password: feed.password ?? '',
      ...body,
    }),
  })
  const j = (await res.json()) as {
    ok?: boolean
    error?: string
    detail?: string
    uid?: string
    objectUrl?: string
    etag?: string | null
  }
  if (!j?.ok) {
    const msg = formatFeedError(j?.error || `http_${res.status}`, j?.detail, de)
    return { ok: false, message: msg }
  }
  if (body.action === 'delete') {
    return {
      ok: true,
      data: { uid: j.uid ?? '', objectUrl: j.objectUrl ?? '', etag: j.etag ?? null },
    }
  }
  if (!j.uid || !j.objectUrl) {
    const msg = formatFeedError(j?.error || `http_${res.status}`, j?.detail, de)
    return { ok: false, message: msg }
  }
  return { ok: true, data: { uid: j.uid, objectUrl: j.objectUrl, etag: j.etag ?? null } }
}

function Widget({ config, instanceId }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const loc = de ? 'de-DE' : 'en-GB'
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)

  const viewMode: CalendarViewMode = str(config.viewMode) === 'week' ? 'week' : 'month'
  const weekMode = (str(config.weekStart) as WeekStartMode) || 'auto'
  const showOther = (config as Record<string, unknown>).showOtherMonthDays !== false
  const highlightWeekends = (config as Record<string, unknown>).highlightWeekends === true
  const showEventList = (config as Record<string, unknown>).showEventList !== false
  const listUpcomingOnly = (config as Record<string, unknown>).listUpcomingOnly === true
  const maxListEntries = clampListMax((config as Record<string, unknown>).maxListEntries)
  const startsMonday = weekStartsMonday(weekMode, de)

  const rawEvents = (config as Record<string, unknown>).events
  const rawCalDavFeeds = (config as Record<string, unknown>).caldavFeeds
  const cfg = config as Record<string, unknown>
  const events = useMemo(() => parseEvents(rawEvents), [rawEvents])
  const calDavFeeds = useMemo(() => parseCalDavFeeds(rawCalDavFeeds), [rawCalDavFeeds])
  const caldavRefreshMinutes = clampIcsRefresh(cfg.caldavRefreshMinutes ?? cfg.icsRefreshMinutes)

  const [remoteEvents, setRemoteEvents] = useState<RemoteCalEvent[]>([])
  const [remoteErrors, setRemoteErrors] = useState<Record<string, string>>({})
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [caldavRefreshTick, setCaldavRefreshTick] = useState(0)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (calDavFeeds.length === 0) {
      setRemoteEvents([])
      setRemoteErrors({})
      setRemoteLoading(false)
      return
    }

    let cancelled = false
    const winStart = new Date()
    winStart.setDate(winStart.getDate() - 14)
    winStart.setHours(0, 0, 0, 0)
    const winEnd = new Date()
    winEnd.setDate(winEnd.getDate() + 180)
    winEnd.setHours(23, 59, 59, 999)

    const load = async () => {
      setRemoteLoading(true)
      const errs: Record<string, string> = {}
      const merged: RemoteCalEvent[] = []
      const linkedUids = new Set(
        events.map((e) => e.caldavUid).filter((u): u is string => Boolean(u)),
      )
      for (let i = 0; i < calDavFeeds.length; i++) {
        const feed = calDavFeeds[i]!
        try {
          const res = await fetch('/api/calendar-caldav', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calendarUrl: feed.url,
              username: feed.username ?? '',
              password: feed.password ?? '',
              windowStart: winStart.toISOString(),
              windowEnd: winEnd.toISOString(),
            }),
          })
          const j = (await res.json()) as {
            ok?: boolean
            error?: string
            upstreamStatus?: number
            detail?: string
            suggestedUrl?: string
            events?: { id: string; uid?: string; title: string; date: string; timeLabel?: string | null }[]
          }
          if (!j?.ok) {
            let msg = formatFeedError(j?.error || `http_${res.status}`, j?.detail, de)
            if (j?.suggestedUrl) {
              msg += de ? ` — Richtige URL: ${j.suggestedUrl}` : ` — Use URL: ${j.suggestedUrl}`
            }
            throw new Error(msg)
          }
          let host = 'CalDAV'
          try {
            host = new URL(feed.url).hostname
          } catch {
            /* ignore */
          }
          const label = feed.name?.trim() || host
          for (const ev of j.events ?? []) {
            if (ev.uid && linkedUids.has(ev.uid)) continue
            merged.push({
              id: `dav${i}-${ev.id}`,
              uid: ev.uid,
              title: ev.title,
              date: ev.date,
              timeLabel: ev.timeLabel,
              feedIndex: i,
              feedName: label,
              sourceKind: 'caldav',
            })
          }
        } catch (e) {
          errs[`dav:${i}`] = e instanceof Error ? e.message : String(e)
        }
      }
      if (!cancelled) {
        setRemoteEvents(merged)
        setRemoteErrors(errs)
        setRemoteLoading(false)
        for (const [feedKey, msg] of Object.entries(errs)) {
          reportClientLog({
            level: 'error',
            source: 'plugin',
            category: 'calendar-feed',
            pluginId: 'calendar',
            instanceId,
            message: `${feedKey}: ${msg}`,
          })
        }
      }
    }

    void load()
    const ms = Math.max(5, caldavRefreshMinutes) * 60_000
    const timer = window.setInterval(() => void load(), ms)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [calDavFeeds, caldavRefreshMinutes, caldavRefreshTick, de, instanceId, events])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      map.set(e.date, (map.get(e.date) ?? 0) + 1)
    }
    for (const r of remoteEvents) {
      map.set(r.date, (map.get(r.date) ?? 0) + 1)
    }
    return map
  }, [events, remoteEvents])

  const persistEvents = useCallback(
    (next: CalendarEventRow[]) => {
      updatePluginConfig(instanceId, { events: next })
    },
    [instanceId, updatePluginConfig],
  )

  const primaryFeedIndex = 0

  const pushEventToCalDav = useCallback(
    async (
      action: 'create' | 'update' | 'delete',
      row: CalendarEventRow,
    ): Promise<CalendarEventRow | null> => {
      if (calDavFeeds.length === 0) return row
      const feedIdx =
        typeof row.feedIndex === 'number' && row.feedIndex >= 0 && row.feedIndex < calDavFeeds.length
          ? row.feedIndex
          : primaryFeedIndex
      const feed = calDavFeeds[feedIdx]
      if (!feed?.url || !feed.password) {
        setSyncError(
          de ? 'CalDAV-Feed ohne URL oder Passwort — in den Einstellungen prüfen' : 'CalDAV feed missing URL or password',
        )
        return null
      }

      setSyncBusy(true)
      setSyncError(null)
      try {
        if (action === 'delete') {
          if (!row.caldavHref) return row
          const del = await postCalDavWrite(
            feed,
            {
              action: 'delete',
              objectUrl: row.caldavHref,
              etag: row.caldavEtag ?? '',
              uid: row.caldavUid ?? '',
            },
            de,
          )
          if (!del.ok) {
            setSyncError(del.message)
            return null
          }
          return row
        }

        if (action === 'update' && row.caldavHref && row.caldavUid) {
          const upd = await postCalDavWrite(
            feed,
            {
              action: 'update',
              title: row.title,
              date: row.date,
              uid: row.caldavUid,
              objectUrl: row.caldavHref,
              etag: row.caldavEtag ?? '',
              ...caldavTimeFields(row),
            },
            de,
          )
          if (!upd.ok) {
            setSyncError(upd.message)
            return null
          }
          return {
            ...row,
            feedIndex: feedIdx,
            caldavUid: upd.data.uid,
            caldavHref: upd.data.objectUrl,
            caldavEtag: upd.data.etag ?? undefined,
          }
        }

        const create = await postCalDavWrite(
          feed,
          {
            action: 'create',
            title: row.title,
            date: row.date,
            uid: row.caldavUid ?? '',
            ...caldavTimeFields(row),
          },
          de,
        )
        if (!create.ok) {
          setSyncError(create.message)
          return null
        }
        return {
          ...row,
          feedIndex: feedIdx,
          caldavUid: create.data.uid,
          caldavHref: create.data.objectUrl,
          caldavEtag: create.data.etag ?? undefined,
        }
      } finally {
        setSyncBusy(false)
      }
    },
    [calDavFeeds, de, primaryFeedIndex],
  )

  const [view, setView] = useState(() => monthStart(new Date().getFullYear(), new Date().getMonth()))
  const [, setMinuteTick] = useState(0)
  const [pickerYmd, setPickerYmd] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newAllDay, setNewAllDay] = useState(true)
  const [newStartTime, setNewStartTime] = useState('09:00')
  const [newEndTime, setNewEndTime] = useState('10:00')
  const [editing, setEditing] = useState<EventEditDraft | null>(null)
    const closeDayModal = useCallback(() => {
    setPickerYmd(null)
    setEditing(null)
    setNewTitle('')
    setNewAllDay(true)
    setNewStartTime('09:00')
    setNewEndTime('10:00')
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setMinuteTick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const viewModeRef = useRef(viewMode)
  useEffect(() => {
    const prev = viewModeRef.current
    viewModeRef.current = viewMode
    if (prev === viewMode) return
    setView((v) => {
      if (viewMode === 'week') {
        return startOfWeek(new Date(v.getFullYear(), v.getMonth(), 1, 12), startsMonday)
      }
      const mid = new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12)
      mid.setDate(v.getDate() + 3)
      return monthStart(mid.getFullYear(), mid.getMonth())
    })
  }, [viewMode, startsMonday])

  const startsMondayRef = useRef(startsMonday)
  useEffect(() => {
    if (viewMode !== 'week') {
      startsMondayRef.current = startsMonday
      return
    }
    if (startsMondayRef.current === startsMonday) return
    startsMondayRef.current = startsMonday
    setView((v) => startOfWeek(addDays(v, 3), startsMonday))
  }, [startsMonday, viewMode])

  const y = view.getFullYear()
  const m = view.getMonth()
  const cells = useMemo(() => {
    if (viewMode === 'week') return buildWeekCells(view, startsMonday)
    return buildMonthCells(y, m, startsMonday)
  }, [viewMode, view, y, m, startsMonday])

  const todayYmd = toYmd(new Date())

  const headerLabels = useMemo(() => {
    const base = startsMonday ? new Date(2024, 0, 8, 12, 0, 0, 0) : new Date(2024, 0, 7, 12, 0, 0, 0)
    const labels: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      labels.push(d.toLocaleDateString(loc, { weekday: 'short' }))
    }
    return labels
  }, [loc, startsMonday])

  const rangeTitle = viewMode === 'month' ? view.toLocaleDateString(loc, { month: 'long', year: 'numeric' }) : formatWeekRangeTitle(view, loc)

  const goPrev = useCallback(() => {
    setView((v) => (viewMode === 'month' ? addMonths(v, -1) : addDays(v, -7)))
  }, [viewMode])

  const goNext = useCallback(() => {
    setView((v) => (viewMode === 'month' ? addMonths(v, 1) : addDays(v, 7)))
  }, [viewMode])

  const goToday = useCallback(() => {
    const n = new Date()
    if (viewMode === 'month') {
      setView(monthStart(n.getFullYear(), n.getMonth()))
    } else {
      setView(startOfWeek(n, startsMonday))
    }
  }, [viewMode, startsMonday])

  const listRows = useMemo(() => {
    const rows: ListEntry[] = events.map((e) => ({
      mode: 'local' as const,
      id: e.id,
      date: e.date,
      title: e.title,
      synced: Boolean(e.caldavUid && e.caldavHref),
    }))
    for (const r of remoteEvents) {
      rows.push({
        mode: 'remote',
        id: r.id,
        date: r.date,
        title: r.title,
        time: r.timeLabel ?? undefined,
        source: `${r.feedName ?? ''} · ${r.sourceKind === 'caldav' ? 'CalDAV' : 'ICS'}`,
      })
    }
    rows.sort((a, b) => {
      const c = a.date.localeCompare(b.date)
      if (c !== 0) return c
      const ta = `${a.mode === 'remote' ? a.time ?? '' : ''}${a.title}`
      const tb = `${b.mode === 'remote' ? b.time ?? '' : ''}${b.title}`
      return ta.localeCompare(tb, loc)
    })
    let out = rows
    if (listUpcomingOnly) out = out.filter((x) => x.date >= todayYmd)
    return out.slice(0, maxListEntries)
  }, [events, remoteEvents, listUpcomingOnly, maxListEntries, todayYmd, loc])

  const dayLocalEvents = useMemo(() => {
    if (!pickerYmd) return []
    return events.filter((e) => e.date === pickerYmd).sort((a, b) => a.title.localeCompare(b.title, loc))
  }, [events, pickerYmd, loc])

  const dayRemoteEvents = useMemo(() => {
    if (!pickerYmd) return []
    return remoteEvents
      .filter((r) => r.date === pickerYmd)
      .sort((a, b) => {
        const ta = `${a.timeLabel ?? ''}${a.title}`
        const tb = `${b.timeLabel ?? ''}${b.title}`
        return ta.localeCompare(tb, loc)
      })
  }, [remoteEvents, pickerYmd, loc])

  const pickerLabel = useMemo(() => {
    if (!pickerYmd) return ''
    const [yy, mm, dd] = pickerYmd.split('-').map(Number)
    const d = new Date(yy!, (mm ?? 1) - 1, dd ?? 1, 12, 0, 0, 0)
    return d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }, [pickerYmd, loc])

  const addNewEvent = useCallback(() => {
    const t = newTitle.trim()
    if (!t || !pickerYmd || syncBusy) return
    const draft: CalendarEventRow = newAllDay
      ? { id: newEventId(), title: t.slice(0, 240), date: pickerYmd, allDay: true }
      : {
          id: newEventId(),
          title: t.slice(0, 240),
          date: pickerYmd,
          allDay: false,
          startTime: newStartTime,
          endTime: newEndTime,
        }
    void (async () => {
      let saved = draft
      if (calDavFeeds.length > 0) {
        const synced = await pushEventToCalDav('create', draft)
        if (!synced) return
        saved = synced
      }
      persistEvents([...events, saved])
      setNewTitle('')
      if (calDavFeeds.length > 0) setCaldavRefreshTick((n) => n + 1)
    })()
  }, [
    newTitle,
    newAllDay,
    newStartTime,
    newEndTime,
    pickerYmd,
    events,
    persistEvents,
    calDavFeeds.length,
    pushEventToCalDav,
    syncBusy,
  ])

  const saveEditing = useCallback(() => {
    if (!editing || syncBusy) return
    const t = editing.title.trim()
    if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(editing.date)) return
    const prev = events.find((e) => e.id === editing.id)
    if (!prev) return
    const draft: CalendarEventRow = { ...prev, ...rowFromEditDraft({ ...editing, title: t.slice(0, 240) }) }
    void (async () => {
      let saved = draft
      if (calDavFeeds.length > 0) {
        const action = draft.caldavHref && draft.caldavUid ? 'update' : 'create'
        const synced = await pushEventToCalDav(action, draft)
        if (!synced) return
        saved = synced
      }
      persistEvents(events.map((e) => (e.id === editing.id ? saved : e)))
      setEditing(null)
      if (calDavFeeds.length > 0) setCaldavRefreshTick((n) => n + 1)
    })()
  }, [editing, events, persistEvents, calDavFeeds.length, pushEventToCalDav, syncBusy])

  const deleteEvent = useCallback(
    (id: string) => {
      if (syncBusy) return
      const row = events.find((e) => e.id === id)
      if (!row) return
      void (async () => {
        if (calDavFeeds.length > 0 && row.caldavHref) {
          const ok = await pushEventToCalDav('delete', row)
          if (!ok) return
        }
        persistEvents(events.filter((e) => e.id !== id))
        if (editing?.id === id) setEditing(null)
        if (calDavFeeds.length > 0) setCaldavRefreshTick((n) => n + 1)
      })()
    },
    [events, persistEvents, editing, calDavFeeds.length, pushEventToCalDav, syncBusy],
  )

  const muted = 'var(--text-muted)'
  const text = 'var(--text)'
  const accent = 'var(--accent)'
  const border = 'var(--border)'
  const surface = 'var(--surface)'

  const lab = de
    ? {
        closeDay: 'Schließen',
        dayTitle: 'Termine am',
        newPh: 'Neuer Titel …',
        add: 'Hinzufügen',
        edit: 'Bearbeiten',
        save: 'Speichern',
        cancel: 'Abbrechen',
        del: 'Löschen',
        listTitle: 'Termine',
        listUpcoming: 'Nur anstehend',
        dateLabel: 'Datum',
        titleLabel: 'Titel',
        emptyDay: 'Keine Termine an diesem Tag.',
      }
    : {
        closeDay: 'Close',
        dayTitle: 'Events on',
        newPh: 'New title…',
        add: 'Add',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        del: 'Delete',
        listTitle: 'Events',
        listUpcoming: 'Upcoming only',
        dateLabel: 'Date',
        titleLabel: 'Title',
        emptyDay: 'No events on this day.',
      }

  const inpSmall: CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: 'clamp(10px, 2.2cqmin, 12px)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
        padding: 'clamp(4px, 1.2cqmin, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(4px, 1cqmin, 8px)',
        containerType: 'size',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          aria-label={
            viewMode === 'month'
              ? de
                ? 'Vorheriger Monat'
                : 'Previous month'
              : de
                ? 'Vorherige Woche'
                : 'Previous week'
          }
          style={navBtnStyle}
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(11px, 2.8cqmin, 15px)',
              fontWeight: 700,
              color: text,
              lineHeight: 1.2,
              textTransform: viewMode === 'month' ? 'capitalize' : 'none',
            }}
          >
            {rangeTitle}
          </p>
        </div>
        <button
          type="button"
          onClick={goNext}
          aria-label={
            viewMode === 'month'
              ? de
                ? 'Nächster Monat'
                : 'Next month'
              : de
                ? 'Nächste Woche'
                : 'Next week'
          }
          style={navBtnStyle}
        >
          ›
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <button type="button" onClick={goToday} style={todayBtnStyle}>
          {de ? 'Heute' : 'Today'}
        </button>
      </div>

      {calDavFeeds.length > 0 && (
        <div
          style={{
            margin: 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              color: Object.keys(remoteErrors).length > 0 ? '#fb7185' : muted,
              textAlign: 'center',
              lineHeight: 1.35,
            }}
          >
            {remoteLoading
              ? de
                ? 'Externe Kalender werden geladen …'
                : 'Loading external calendars…'
              : Object.keys(remoteErrors).length > 0
                ? (() => {
                    const parts = Object.entries(remoteErrors).map(([key, msg]) => {
                      const idx = Number(key.split(':')[1])
                      const label = calDavFeeds[idx]?.name?.trim() || `CalDAV ${idx + 1}`
                      return `${label}: ${msg}`
                    })
                    return de ? `Fehler: ${parts.join(' · ')}` : `Errors: ${parts.join(' · ')}`
                  })()
                : de
                  ? `${remoteEvents.length} externe · Zwei-Wege-Sync · alle ${caldavRefreshMinutes} min${
                      remoteEvents.length === 0 ? ' · WEB.DE-Termine fehlen? „Jetzt aktualisieren“' : ''
                    }`
                  : `${remoteEvents.length} external · two-way sync · every ${caldavRefreshMinutes} min${
                      remoteEvents.length === 0 ? ' · missing WEB.DE events? tap Refresh now' : ''
                    }`}
          </p>
          {syncError ? (
            <p style={{ margin: 0, fontSize: '10px', color: '#fb7185', textAlign: 'center', lineHeight: 1.35 }}>
              {de ? `Sync-Fehler: ${syncError}` : `Sync error: ${syncError}`}
            </p>
          ) : null}
          {!remoteLoading && Object.keys(remoteErrors).length === 0 && !syncError ? (
            <p style={{ margin: 0, fontSize: '9px', color: muted, textAlign: 'center', lineHeight: 1.3, maxWidth: '100%' }}>
              {de
                ? 'Neue Termine (Tipp auf Tag) werden zum ersten CalDAV-Feed geschrieben (z. B. WEB.DE).'
                : 'New events (tap a day) are pushed to the first CalDAV feed (e.g. WEB.DE).'}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setCaldavRefreshTick((n) => n + 1)}
            disabled={remoteLoading || syncBusy}
            style={{
              ...todayBtnStyle,
              fontSize: '10px',
              padding: '3px 10px',
              opacity: remoteLoading || syncBusy ? 0.6 : 1,
            }}
          >
            {syncBusy ? (de ? 'Synchronisiere …' : 'Syncing…') : de ? 'Jetzt aktualisieren' : 'Refresh now'}
          </button>
        </div>
      )}

      <div
        role="grid"
        aria-label={de ? 'Kalender' : 'Calendar'}
        style={{
          flex: showEventList ? '1 1 55%' : 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '2px',
            flexShrink: 0,
          }}
        >
          {headerLabels.map((label, i) => (
            <div
              key={`${i}-${label}`}
              role="columnheader"
              style={{
                textAlign: 'center',
                fontSize: 'clamp(8px, 1.8cqmin, 11px)',
                fontWeight: 600,
                color: muted,
                padding: '2px 0',
                textTransform: 'capitalize',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gridTemplateRows: viewMode === 'week' ? 'minmax(0, 1fr)' : 'repeat(6, minmax(0, 1fr))',
            gap: '2px',
          }}
        >
          {cells.map((d) => {
            const inMonth = viewMode === 'month' ? d.getMonth() === m && d.getFullYear() === y : true
            const ymd = toYmd(d)
            const isToday = ymd === todayYmd
            const hidden = viewMode === 'month' && !inMonth && !showOther
            const weekend = highlightWeekends && (d.getDay() === 0 || d.getDay() === 6)
            const hasEvents = (eventsByDay.get(ymd) ?? 0) > 0
            const picked = pickerYmd === ymd

            if (hidden) {
              return <div key={ymd} style={{ minWidth: 0, minHeight: 0 }} aria-hidden />
            }

            const aria = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

            return (
              <button
                key={ymd}
                type="button"
                role="gridcell"
                aria-label={aria}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={picked}
                onClick={() => {
                  setPickerYmd((p) => (p === ymd ? null : ymd))
                  setEditing(null)
                  setNewTitle('')
                }}
                style={{
                  minWidth: 0,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  borderRadius: '6px',
                  border: picked
                    ? `2px solid ${accent}`
                    : isToday
                      ? `2px solid ${accent}`
                      : `1px solid color-mix(in srgb, ${border} 65%, transparent)`,
                  background: isToday
                    ? `color-mix(in srgb, ${accent} 18%, ${surface})`
                    : picked
                      ? `color-mix(in srgb, ${accent} 10%, ${surface})`
                      : inMonth
                        ? 'color-mix(in srgb, var(--surface-2) 88%, var(--background))'
                        : 'color-mix(in srgb, var(--surface) 55%, transparent)',
                  color: inMonth ? (weekend ? accent : text) : muted,
                  fontSize: 'clamp(9px, 2.5cqmin, 14px)',
                  fontWeight: isToday ? 800 : inMonth ? 600 : 500,
                  opacity: inMonth ? 1 : 0.72,
                  cursor: 'pointer',
                  padding: '2px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              >
                <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {d.getDate()}
                </span>
                {hasEvents ? (
                  <span
                    style={{
                      width: 'clamp(4px, 1cqmin, 6px)',
                      height: 'clamp(4px, 1cqmin, 6px)',
                      borderRadius: 999,
                      background: accent,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                ) : (
                  <span style={{ display: 'flex', height: 'clamp(4px, 1cqmin, 6px)', alignItems: 'center' }} aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <DayEventModal
        open={pickerYmd != null}
        de={de}
        pickerLabel={pickerLabel}
        dayTitleLabel={lab.dayTitle}
        closeLabel={lab.closeDay}
        emptyDayLabel={lab.emptyDay}
        titleLabel={lab.titleLabel}
        dateLabel={lab.dateLabel}
        saveLabel={lab.save}
        cancelLabel={lab.cancel}
        delLabel={lab.del}
        editLabel={lab.edit}
        addLabel={lab.add}
        newPh={lab.newPh}
        border={border}
        text={text}
        muted={muted}
        accent={accent}
        inpSmall={inpSmall}
        chipBtnStyle={chipBtnStyle}
        primarySmallBtnStyle={primarySmallBtnStyle}
        ghostSmallBtnStyle={ghostSmallBtnStyle}
        dangerSmallBtnStyle={dangerSmallBtnStyle}
        dayRemoteEvents={dayRemoteEvents}
        dayLocalEvents={dayLocalEvents}
        editing={editing}
        setEditing={setEditing}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newAllDay={newAllDay}
        setNewAllDay={setNewAllDay}
        newStartTime={newStartTime}
        setNewStartTime={setNewStartTime}
        newEndTime={newEndTime}
        setNewEndTime={setNewEndTime}
        syncBusy={syncBusy}
        calDavConfigured={calDavFeeds.length > 0}
        onClose={closeDayModal}
        onSaveEditing={saveEditing}
        onDelete={deleteEvent}
        onAdd={addNewEvent}
      />

      {showEventList && (
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid color-mix(in srgb, ${border} 55%, transparent)`,
            paddingTop: '6px',
            maxHeight: '32%',
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 'clamp(9px, 2cqmin, 11px)',
              fontWeight: 700,
              color: muted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {lab.listTitle}
            {listUpcomingOnly ? ` · ${lab.listUpcoming}` : ''}
          </p>
          {listRows.length === 0 ? (
            <p style={{ margin: 0, fontSize: '11px', color: muted }}>{de ? 'Keine Einträge.' : 'No entries.'}</p>
          ) : (
            <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {listRows.map((row) => (
                <li key={row.id} style={{ fontSize: 'clamp(10px, 2.1cqmin, 12px)', color: text }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerYmd(row.date)
                      setEditing(null)
                      setNewTitle('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      textAlign: 'left',
                      font: 'inherit',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', color: muted }}>
                      {row.date}
                    </span>
                    {row.mode === 'remote' && row.time ? (
                      <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', color: muted }}>
                        {' '}
                        {row.time}
                      </span>
                    ) : null}{' '}
                    — {row.title}
                    {row.mode === 'local' && row.synced ? (
                      <span style={{ color: muted, fontSize: '10px' }}> · CalDAV</span>
                    ) : null}
                    {row.mode === 'remote' && row.source ? (
                      <span style={{ color: muted, fontSize: '10px' }}> · {row.source}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

const chipBtnStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-muted)',
  fontSize: 'clamp(9px, 2cqmin, 11px)',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const primarySmallBtnStyle: CSSProperties = {
  border: '1px solid color-mix(in srgb, var(--accent) 55%, var(--border))',
  background: 'color-mix(in srgb, var(--accent) 16%, var(--surface))',
  color: 'var(--accent)',
  fontSize: 'clamp(10px, 2.1cqmin, 12px)',
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostSmallBtnStyle: CSSProperties = {
  ...chipBtnStyle,
  cursor: 'pointer',
}

const dangerSmallBtnStyle: CSSProperties = {
  border: '1px solid color-mix(in srgb, #fb7185 45%, var(--border))',
  background: 'color-mix(in srgb, #fb7185 12%, var(--surface))',
  color: '#fb7185',
  fontSize: 'clamp(10px, 2.1cqmin, 12px)',
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const navBtnStyle: CSSProperties = {
  flexShrink: 0,
  width: 'clamp(26px, 7cqmin, 34px)',
  height: 'clamp(26px, 7cqmin, 34px)',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 'clamp(16px, 4cqmin, 22px)',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

const todayBtnStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
  color: 'var(--accent)',
  fontSize: 'clamp(10px, 2.2cqmin, 12px)',
  fontWeight: 600,
  padding: '4px 12px',
  borderRadius: '999px',
  cursor: 'pointer',
}

function CalDavFeedTools({
  feed,
  de,
  onApplyUrl,
}: {
  feed: CalDavFeedConfig
  de: boolean
  onApplyUrl: (url: string) => void
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const applyWebDe = () => {
    const mail = (feed.username ?? '').trim()
    if (!mail) {
      setStatus(de ? 'Zuerst E-Mail als Benutzername eintragen' : 'Enter email as username first')
      return
    }
    const addr = mail.includes('@') ? mail : `${mail}@web.de`
    onApplyUrl(`https://caldav.web.de/begenda/dav/${addr}/calendar`)
    setStatus(de ? 'WEB.DE-URL gesetzt' : 'WEB.DE URL applied')
  }

  const testConnection = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/calendar-caldav/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarUrl: feed.url,
          username: feed.username ?? '',
          password: feed.password ?? '',
        }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        error?: string
        detail?: string
        suggestedUrl?: string
        calendars?: { url: string; displayName: string }[]
        eventCount?: number
        fetchDetail?: string
      }
      if (!j?.ok) {
        let msg = formatFeedError(j?.error || 'error', j?.detail, de)
        if (j?.suggestedUrl) msg += ` → ${j.suggestedUrl}`
        setStatus(msg)
        return
      }
      const n = j.calendars?.length ?? 0
      if (n === 1 && j.calendars?.[0]?.url) onApplyUrl(j.calendars[0].url)
      const cnt = j.eventCount ?? 0
      const extra = j.fetchDetail ? ` · ${j.fetchDetail}` : ''
      setStatus(
        de
          ? `${n} Kalender · ${cnt} Termine im Abruf-Fenster${extra}`
          : `${n} calendar(s) · ${cnt} events in fetch window${extra}`,
      )
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: '11px', padding: '4px 10px' }}
          disabled={busy || !feed.password}
          onClick={() => void testConnection()}
        >
          {de ? 'Verbindung testen' : 'Test connection'}
        </button>
        <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={applyWebDe}>
          WEB.DE
        </button>
      </div>
      {status ? (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>{status}</p>
      ) : null}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const viewVal: CalendarViewMode = str(config.viewMode) === 'week' ? 'week' : 'month'
  const weekVal = str(config.weekStart) || 'auto'
  const otherOn = (config as Record<string, unknown>).showOtherMonthDays !== false
  const weekendOn = (config as Record<string, unknown>).highlightWeekends === true

  const inp: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? 'Ansicht' : 'View'}
        </label>
        <select
          style={{ ...inp, cursor: 'pointer' }}
          value={viewVal}
          onChange={(e) => onChange('viewMode', e.target.value)}
        >
          <option value="month">{de ? 'Monat' : 'Month'}</option>
          <option value="week">{de ? 'Woche' : 'Week'}</option>
        </select>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4, marginBottom: 0 }}>
          {de
            ? 'Woche: eine Zeile, ‹ › springt je eine Woche. Monat: sechs Wochenzeilen wie bisher.'
            : 'Week: one row; arrows move by one week. Month: six-week grid as before.'}
        </p>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? 'Wochenstart' : 'Week starts on'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={weekVal} onChange={(e) => onChange('weekStart', e.target.value)}>
          <option value="auto">{de ? 'Auto (Mo bei DE, So bei EN)' : 'Auto (Mon for DE, Sun for EN)'}</option>
          <option value="monday">{de ? 'Montag' : 'Monday'}</option>
          <option value="sunday">{de ? 'Sonntag' : 'Sunday'}</option>
        </select>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>
          {de ? 'Tage aus Vor-/Nachmonat' : 'Show previous/next month days'}
        </span>
        <input
          type="checkbox"
          checked={otherOn}
          onChange={(e) => onChange('showOtherMonthDays', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{de ? 'Wochenenden farbig' : 'Highlight weekends'}</span>
        <input
          type="checkbox"
          checked={weekendOn}
          onChange={(e) => onChange('highlightWeekends', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
        />
      </label>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
          {de
            ? 'Termine werden im Widget gespeichert (mit dem Dashboard) — auch ohne Bearbeiten-Modus per Tipp auf einen Tag.'
            : 'Events are stored with the dashboard and can be edited by tapping a day even when layout edit mode is off.'}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>{de ? 'Terminliste unter dem Raster' : 'Event list under grid'}</span>
          <input
            type="checkbox"
            checked={(config as Record<string, unknown>).showEventList !== false}
            onChange={(e) => onChange('showEventList', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>{de ? 'Liste: nur anstehende Termine' : 'List: upcoming only'}</span>
          <input
            type="checkbox"
            checked={(config as Record<string, unknown>).listUpcomingOnly === true}
            onChange={(e) => onChange('listUpcomingOnly', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
        </label>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? 'Liste: max. Einträge' : 'List: max entries'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={50}
          value={clampListMax((config as Record<string, unknown>).maxListEntries)}
          onChange={(e) => onChange('maxListEntries', clampListMax(e.target.value))}
        />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
          {de ? 'ICS / Webcal (nur lesen)' : 'ICS / Webcal (read-only)'}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 8px' }}>
          {de ? (
            <>
              Ein <strong>ICS- oder Webcal-Link</strong> reicht aus: der Anbieter stellt eine feste URL bereit (häufig
              „öffentlicher Kalender“, „Zum Abonnement“ oder „Secret address“). SelfDashboard lädt die Termine{' '}
              <strong>serverseitig</strong> – der Browser blockiert nichts (kein CORS), und <strong>lokale Adressen</strong>{' '}
              (z. B. Synology mit <code style={{ fontSize: '10px' }}>https://…:5001/…</code>) funktionieren genauso.
            </>
          ) : (
            <>
              You only need an <strong>ICS / webcal URL</strong> (often “public calendar”, “subscribe”, or “secret
              address”). SelfDashboard fetches events <strong>on the server</strong>, so the browser does not hit CORS
              limits — <strong>LAN URLs</strong> work too (e.g. Synology at <code style={{ fontSize: '10px' }}>https://…:5001/…</code>).
            </>
          )}
        </p>
        <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {de ? 'Hilfe: Link beim Anbieter finden' : 'Help: find the link in your provider UI'}
        </p>
        <ul style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', paddingLeft: '18px', lineHeight: 1.5 }}>
          <li>
            <a href="https://support.google.com/calendar/answer/37648" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              Google Calendar
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/office/share-your-calendar-in-outlook-on-the-web-3538412d-811d-4e95-acb0-4c7bf37d09a8"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              Microsoft Outlook / 365
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/guide/icloud/share-a-calendar-mm6b1a044a/icloud" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              Apple iCloud
            </a>
          </li>
          <li>
            <a href="https://kb.synology.com/en-global/DSM/help/Calendar/calendar_subscribe_ical" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              Synology Calendar
            </a>
          </li>
          <li>
            <a
              href={
                de
                  ? 'https://docs.nextcloud.com/server/latest/user_manual/de/groupware/calendar.html#kalender-abonnieren'
                  : 'https://docs.nextcloud.com/server/latest/user_manual/en/groupware/calendar.html#subscribe-to-a-calendar'
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              {de ? 'Nextcloud: Kalender abonnieren' : 'Nextcloud: subscribe to calendar'}
            </a>
          </li>
        </ul>

        {(() => {
          const feeds = parseIcsFeedsDraft((config as Record<string, unknown>).icsFeeds)
          const setFeeds = (next: IcsFeedConfig[]) => onChange('icsFeeds', next)
          return (
            <>
              {feeds.map((feed, i) => (
                <div key={i} style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {de ? 'Anzeigename (optional)' : 'Label (optional)'}
                  </label>
                  <input
                    style={{ ...inp, marginBottom: '8px' }}
                    value={feed.name ?? ''}
                    placeholder={de ? 'z. B. Arbeit, Familie, Synology' : 'e.g. Work, Family, Synology'}
                    onChange={(e) => {
                      const v = e.target.value
                      setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, name: v } : f)))
                    }}
                  />
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    iCal / ICS URL (https://…)
                  </label>
                  <input
                    style={inp}
                    value={feed.url}
                    placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                    onChange={(e) => {
                      const v = e.target.value
                      setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, url: v } : f)))
                    }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginTop: '8px', fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => setFeeds(feeds.filter((_, idx) => idx !== i))}
                  >
                    {de ? 'Feed entfernen' : 'Remove feed'}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '12px' }}
                disabled={feeds.length >= 8}
                onClick={() => setFeeds([...feeds, { url: '', name: '' }])}
              >
                {de ? '+ ICS-Feed hinzufügen' : '+ Add ICS feed'}
              </button>
            </>
          )
        })()}

        <div style={{ marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
            {de ? 'CalDAV (Server-Kalender)' : 'CalDAV (server calendar)'}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: '#f59e0b',
              lineHeight: 1.55,
              margin: '0 0 10px',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid color-mix(in srgb, #f59e0b 35%, var(--border))',
              background: 'color-mix(in srgb, #f59e0b 8%, var(--surface-2))',
            }}
          >
            {de ? (
              <>
                <strong>Zwei-Wege-Sync (CalDAV):</strong> Termine von WEB.DE/CalDAV werden gelesen; Termine, die du im
                Widget per Tipp auf einen Tag anlegst oder bearbeitest, werden zum <strong>ersten CalDAV-Feed</strong>{' '}
                geschrieben (ganztägig). ICS/Webcal-Feeds bleiben nur lesen.
              </>
            ) : (
              <>
                <strong>Two-way CalDAV sync:</strong> events are pulled from your server; events you add or edit in the
                widget are pushed to the <strong>first CalDAV feed</strong> (all-day only). ICS/webcal feeds stay
                read-only.
              </>
            )}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 8px' }}>
            {de ? (
              <>
                Verbinde die <strong>URL der Kalender-Sammlung</strong> (eine „Kalender-Collection“), nicht nur die
                Web-Oberfläche. Bei Nextcloud sieht das typischerweise so aus:{' '}
                <code style={{ fontSize: '10px' }}>…/remote.php/dav/calendars/BENUTZER/KALENDERNAME/</code>
              </>
            ) : (
              <>
                Use the <strong>calendar collection URL</strong> (the CalDAV collection), not the normal web UI. On
                Nextcloud it usually looks like{' '}
                <code style={{ fontSize: '10px' }}>…/remote.php/dav/calendars/USER/CALENDAR/</code>
              </>
            )}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 8px' }}>
            {de ? (
              <>
                <strong>Synology:</strong> CalDAV heißt <code style={{ fontSize: '10px' }}>/caldav/</code> — nicht{' '}
                <code style={{ fontSize: '10px' }}>/carddav/</code> (Kontakte). Beispiel:{' '}
                <code style={{ fontSize: '10px' }}>http://192.168.1.15:5000/caldav/svensende/personal/</code> — Kalendername
                („personal“ o. Ä.) in der Synology-Kalender-App unter CalDAV. HTTPS oft Port <strong>5001</strong>.
              </>
            ) : (
              <>
                <strong>Synology:</strong> use <code style={{ fontSize: '10px' }}>/caldav/</code>, not{' '}
                <code style={{ fontSize: '10px' }}>/carddav/</code> (contacts). Example:{' '}
                <code style={{ fontSize: '10px' }}>http://192.168.1.15:5000/caldav/svensende/personal/</code> — calendar
                name from Synology Calendar CalDAV settings. HTTPS is usually port <strong>5001</strong>.
              </>
            )}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 8px' }}>
            {de ? (
              <>
                <strong>WEB.DE:</strong>{' '}
                <code style={{ fontSize: '10px' }}>https://caldav.web.de/begenda/dav/Ihre-Adresse@web.de/calendar</code>
                {' '}
                <span style={{ color: '#f59e0b' }}>
                  (nicht <code style={{ fontSize: '10px' }}>carddav.web.de</code> — das ist nur Kontakte/Adressbuch)
                </span>
                — bei 2FA ein{' '}
                <a href="https://hilfe.web.de/sicherheit/2fa/anwendungsspezifisches-passwort.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  anwendungsspezifisches Passwort
                </a>
                , nicht das normale Login-Passwort.
              </>
            ) : (
              <>
                <strong>WEB.DE:</strong>{' '}
                <code style={{ fontSize: '10px' }}>https://caldav.web.de/begenda/dav/you@web.de/calendar</code>
                — with 2FA use an{' '}
                <a href="https://hilfe.web.de/sicherheit/2fa/anwendungsspezifisches-passwort.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  app-specific password
                </a>
                , not your normal password.
              </>
            )}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 8px' }}>
            {de ? (
              <>
                <strong>Anmeldung:</strong> Nutzername und Passwort werden in der <strong>Dashboard-Konfiguration</strong>{' '}
                gespeichert. Wenn andere Zugriff auf Exporte oder Backups haben, lieber ein <strong>App-Passwort</strong>{' '}
                statt dem Hauptpasswort verwenden. Oder Zugangsdaten in der URL (
                <code style={{ fontSize: '10px' }}>https://nutzer@beispiel.de/…</code>
                ) – dann bleiben die Felder unten leer.
              </>
            ) : (
              <>
                <strong>Sign-in:</strong> username and password are stored in the <strong>dashboard config</strong>. If
                others can read exports or backups, prefer an <strong>app password</strong> instead of your main
                password. Or put credentials in the URL (<code style={{ fontSize: '10px' }}>https://user@example.com/…</code>
                ) and leave the fields below empty.
              </>
            )}
          </p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {de ? 'Hilfe: CalDAV-URL ermitteln' : 'Help: find your CalDAV URL'}
          </p>
          <ul style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', paddingLeft: '18px', lineHeight: 1.5 }}>
            <li>
              <a
                href={
                  de
                    ? 'https://docs.nextcloud.com/server/latest/user_manual/de/groupware/sync_android.html'
                    : 'https://docs.nextcloud.com/server/latest/user_manual/en/groupware/sync_android.html'
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                {de ? 'Nextcloud: Server-URL (Handbuch)' : 'Nextcloud: server URL (manual)'}
              </a>
            </li>
            <li>
              <a
                href={
                  de
                    ? 'https://kb.synology.com/de-de/DSM/help/Calendar/calendar_calDAV'
                    : 'https://kb.synology.com/en-global/DSM/help/Calendar/calendar_calDAV'
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                {de ? 'Synology: CalDAV' : 'Synology: CalDAV'}
              </a>
            </li>
          </ul>

          {(() => {
            const feeds = parseCalDavFeedsDraft((config as Record<string, unknown>).caldavFeeds)
            const setFeeds = (next: CalDavFeedConfig[]) => onChange('caldavFeeds', next)
            return (
              <>
                {feeds.map((feed, i) => (
                  <div key={i} style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {de ? 'Anzeigename (optional)' : 'Label (optional)'}
                    </label>
                    <input
                      style={{ ...inp, marginBottom: '8px' }}
                      value={feed.name ?? ''}
                      placeholder={de ? 'z. B. Arbeit (CalDAV)' : 'e.g. Work (CalDAV)'}
                      onChange={(e) => {
                        const v = e.target.value
                        setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, name: v } : f)))
                      }}
                    />
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      CalDAV-URL (https://…)
                    </label>
                    <input
                      style={{ ...inp, marginBottom: '8px' }}
                      value={feed.url}
                      placeholder="https://caldav.web.de/begenda/dav/name@web.de/calendar"
                      onChange={(e) => {
                        const v = e.target.value
                        setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, url: v } : f)))
                      }}
                    />
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {de ? 'Benutzername' : 'Username'}
                    </label>
                    <input
                      style={{ ...inp, marginBottom: '8px' }}
                      autoComplete="off"
                      value={feed.username ?? ''}
                      placeholder={de ? 'z. B. name@web.de' : 'e.g. you@web.de'}
                      onChange={(e) => {
                        const v = e.target.value
                        setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, username: v } : f)))
                      }}
                    />
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      {de ? 'Passwort / App-Passwort' : 'Password / app password'}
                    </label>
                    <input
                      style={inp}
                      type="password"
                      autoComplete="new-password"
                      value={feed.password ?? ''}
                      placeholder="••••••••"
                      onChange={(e) => {
                        const v = e.target.value
                        setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, password: v } : f)))
                      }}
                    />
                    <CalDavFeedTools
                      feed={feed}
                      de={de}
                      onApplyUrl={(url) => setFeeds(feeds.map((f, idx) => (idx === i ? { ...f, url } : f)))}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ marginTop: '8px', fontSize: '12px', padding: '4px 10px' }}
                      onClick={() => setFeeds(feeds.filter((_, idx) => idx !== i))}
                    >
                      {de ? 'CalDAV entfernen' : 'Remove CalDAV'}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', marginBottom: '12px' }}
                  disabled={feeds.length >= 4}
                  onClick={() => setFeeds([...feeds, { url: '', name: '', username: '', password: '' }])}
                >
                  {de ? '+ CalDAV-Kalender' : '+ Add CalDAV calendar'}
                </button>
              </>
            )
          })()}
        </div>

        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? 'CalDAV alle X Minuten neu laden' : 'Refresh CalDAV every X minutes'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={240}
          value={clampIcsRefresh((config as Record<string, unknown>).caldavRefreshMinutes ?? (config as Record<string, unknown>).icsRefreshMinutes)}
          onChange={(e) => onChange('caldavRefreshMinutes', clampIcsRefresh(e.target.value))}
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
