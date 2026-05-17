'use client'

/**
 * SelfDashboard Calendar Plugin
 * =============================
 *
 * Two-way calendar sync (CalDAV) + read-only ICS feeds, with offline-capable
 * local storage in /app/data/calendar/store.json.
 *
 * Structure of this file:
 *   - `meta`                 — Plugin Store metadata
 *   - `Widget`               — Compact dashboard tile
 *   - `Settings`             — Per-instance settings (refresh interval)
 *   - `CalendarModal`        — Full-screen overlay with month/agenda/accounts
 *   - `EventDialog`          — Create/edit/delete a single event
 *   - `AccountDialog`        — Add a CalDAV or ICS account
 *   - `component`            — Bundle for the Plugin Registry
 *
 * Theming uses CSS variables from the host app: var(--background),
 * var(--surface), var(--surface-2), var(--text), var(--text-muted),
 * var(--border), var(--accent). No bundled stylesheet — everything is
 * inline so the plugin works regardless of which theme is active.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Plus, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

import {
  api,
  type AccountView,
  type CalendarView,
  type EventView,
  type SummaryView,
} from './api-client'
import { localeToBcp47, t as tr, type Locale } from './i18n'

// ---------------------------------------------------------------------------
// Plugin meta — shown in the Plugin Store
// ---------------------------------------------------------------------------

export const meta: PluginMeta = {
  id: 'calendar',
  name: 'Kalender',
  description: 'CalDAV + ICS Kalender mit Two-Way-Sync. iCloud, Nextcloud, Fastmail, Posteo …',
  version: '1.2.0',
  author: 'SelfDashboard Community',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 6, h: 8, minW: 3, minH: 6 },
  stackedExtraH: 2,
}

// ===========================================================================
// Helpers (shared across components)
// ===========================================================================

const ICONS = {
  calendar: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>,
  sync: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>,
  cog: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>,
  close: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>,
}

const fmtTime = (iso: string, allDay: boolean, locale: Locale) => {
  if (allDay) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString(localeToBcp47(locale), { hour: '2-digit', minute: '2-digit' })
}

const fmtDay = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(localeToBcp47(locale), { weekday: 'short', day: '2-digit', month: 'short' })

const fmtFullDay = (d: Date, locale: Locale) =>
  d.toLocaleDateString(localeToBcp47(locale), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateKeyFromIso(iso: string): string {
  return dateKeyLocal(new Date(iso))
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

function weekdayShortLabels(locale: Locale): string[] {
  const tag = localeToBcp47(locale)
  const fmt = new Intl.DateTimeFormat(tag, { weekday: 'short' })
  const monday = new Date(2024, 0, 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return fmt.format(d)
  })
}

const toInputDateTime = (iso: string): string => {
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16)
}

const fromInputDateTime = (val: string): string => new Date(val).toISOString()

type TileView = 'compact' | 'month'
const TILE_VIEW_STORAGE_KEY = 'sd-cal-tile-view'

function pickDefaultWritableCalendar(cals: CalendarView[]): CalendarView | undefined {
  const writable = cals.filter(c => !c.readOnly)
  if (!writable.length) return undefined
  const score = (c: CalendarView) => {
    const n = c.name.toLowerCase().trim()
    if (/geburt|birth/.test(n)) return 0
    if (n === 'web' || n === 'web.de') return 0
    if (/mein kalender|mein|standard|privat|home/.test(n)) return 5
    if (/kalender/.test(n)) return 3
    return 1
  }
  return [...writable].sort((a, b) => score(b) - score(a))[0]
}

function loadHiddenCalendarIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('sd-cal-hidden') || '[]')) }
  catch { return new Set() }
}

type TileEventRef = Pick<EventView, 'id' | 'calendarId' | 'dtstart' | 'allDay'> & {
  summary?: string
  description?: string
  location?: string
  dtend?: string
  syncState?: EventView['syncState']
  calendarColor?: string
  calendarName?: string
  instanceStart?: string
}

function eventRowKey(ev: { id: string; dtstart: string; instanceStart?: string }): string {
  return `${ev.id}:${ev.instanceStart ?? ev.dtstart}`
}

function filterUpcomingEvents<T extends { dtstart: string; dtend?: string; allDay: boolean }>(events: T[]): T[] {
  const now = Date.now()
  return events
    .filter(ev => {
      const endMs = ev.dtend
        ? (/^\d{4}-\d{2}-\d{2}$/.test(ev.dtend)
          ? new Date(ev.dtend + 'T23:59:59').getTime()
          : new Date(ev.dtend).getTime())
        : (/^\d{4}-\d{2}-\d{2}$/.test(ev.dtstart)
          ? new Date(ev.dtstart + 'T23:59:59').getTime()
          : new Date(ev.dtstart).getTime())
      return endMs >= now
    })
    .sort((a, b) => a.dtstart.localeCompare(b.dtstart))
}

const widgetNavBtnStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '4px',
  background: 'transparent',
  cursor: 'pointer',
  padding: '2px 8px',
  fontSize: '12px',
  color: 'var(--text-muted)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// ===========================================================================
// Widget — compact dashboard tile
// ===========================================================================

function Widget({ config }: PluginWidgetProps) {
  const { locale } = usePluginLocale()
  const t = (k: string) => tr(k, locale)
  const refreshInterval = Math.max(15, ((config.refreshInterval as number) ?? 60)) * 1000

  const [summary, setSummary] = useState<SummaryView | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'syncing'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialView, setModalInitialView] = useState<ModalView>('month')
  const [calendars, setCalendars] = useState<CalendarView[]>([])
  const [eventDialog, setEventDialog] = useState<Partial<EventView> | null>(null)
  const [tileView, setTileView] = useState<TileView>('month')
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()))
  const [monthEvents, setMonthEvents] = useState<EventView[]>([])
  const [listEvents, setListEvents] = useState<EventView[]>([])
  const [dayPopup, setDayPopup] = useState<Date | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const writableCalendars = useMemo(() => calendars.filter(c => !c.readOnly), [calendars])
  const hiddenCalendars = useMemo(() => loadHiddenCalendarIds(), [calendars.length])

  const loadCalendars = useCallback(async () => {
    const cals = await api.listCalendars()
    setCalendars(cals)
    return cals
  }, [])

  const openMonthModal = () => {
    setModalInitialView('month')
    setModalOpen(true)
  }

  const openNewEvent = async () => {
    try {
      const cals = await loadCalendars()
      const writable = cals.filter(c => !c.readOnly)
      if (writable.length === 0) {
        setModalInitialView('accounts')
        setModalOpen(true)
        return
      }
      const pick = pickDefaultWritableCalendar(writable)
      setEventDialog({
        calendarId: pick?.id ?? writable[0].id,
        allDay: false,
        dtstart: (tileView === 'month' ? selectedDay : new Date()).toISOString(),
      })
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? String(e))
    }
  }

  const openEventFromTile = async (ev: TileEventRef) => {
    try {
      await loadCalendars()
      setEventDialog({
        id: ev.id,
        calendarId: ev.calendarId,
        summary: ev.summary,
        description: ev.description,
        location: ev.location,
        dtstart: ev.dtstart,
        dtend: ev.dtend,
        allDay: ev.allDay,
        syncState: ev.syncState,
        calendarColor: ev.calendarColor,
        calendarName: ev.calendarName,
      })
    } catch {
      openMonthModal()
    }
  }

  const refresh = useCallback(async () => {
    try {
      const data = await api.summary()
      setSummary(data)
      setStatus('ok')
      setErrorMsg(null)
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? String(e))
    }
  }, [])

  useEffect(() => {
    refresh()
    const loop = () => {
      timerRef.current = setTimeout(async () => {
        await refresh()
        loop()
      }, refreshInterval)
    }
    loop()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [refresh, refreshInterval])

  useEffect(() => {
    loadCalendars().catch(() => undefined)
    try {
      const saved = localStorage.getItem(TILE_VIEW_STORAGE_KEY) as TileView | null
      if (saved === 'compact' || saved === 'month') setTileView(saved)
    } catch { /* ignore */ }
  }, [loadCalendars])

  const monthRange = useMemo(() => {
    const start = new Date(monthCursor)
    start.setDate(1)
    start.setDate(1 - ((start.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 42)
    return { start, end }
  }, [monthCursor])

  const refreshMonthEvents = useCallback(async () => {
    try {
      const evs = await api.listEvents(monthRange.start.toISOString(), monthRange.end.toISOString())
      setMonthEvents(evs.filter(e => !hiddenCalendars.has(e.calendarId)))
    } catch {
      setMonthEvents([])
    }
  }, [monthRange, hiddenCalendars])

  const refreshListEvents = useCallback(async () => {
    const start = new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    try {
      const evs = await api.listEvents(start.toISOString(), end.toISOString())
      setListEvents(evs.filter(e => !hiddenCalendars.has(e.calendarId)))
    } catch {
      setListEvents([])
    }
  }, [hiddenCalendars])

  useEffect(() => {
    if (tileView === 'month') refreshMonthEvents()
    if (tileView === 'compact') refreshListEvents()
  }, [tileView, refreshMonthEvents, refreshListEvents])

  const compactUpcoming = useMemo(() => filterUpcomingEvents(listEvents), [listEvents])

  const showFlash = useCallback((msg: string) => {
    setFlash(msg)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(null), 4500)
  }, [])

  const setTileViewPersist = (v: TileView) => {
    setTileView(v)
    try { localStorage.setItem(TILE_VIEW_STORAGE_KEY, v) } catch { /* ignore */ }
  }

  const triggerSyncAll = async () => {
    setStatus('syncing')
    try {
      const accounts = await api.listAccounts()
      await Promise.all(accounts.filter(a => a.enabled).map(a => api.syncAccount(a.id).catch(() => undefined)))
      await refresh()
      await refreshListEvents()
      if (tileView === 'month') await refreshMonthEvents()
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? String(e))
    }
  }

  const refreshAllEvents = useCallback(async () => {
    await refresh()
    await refreshListEvents()
    if (tileView === 'month') await refreshMonthEvents()
  }, [refresh, refreshListEvents, refreshMonthEvents, tileView])

  const monthEventsByDay = useMemo(() => {
    const map: Record<string, EventView[]> = {}
    for (const ev of monthEvents) {
      const key = dateKeyFromIso(ev.dtstart)
      ;(map[key] = map[key] || []).push(ev)
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.dtstart.localeCompare(b.dtstart))
    return map
  }, [monthEvents])

  const monthLabel = monthCursor.toLocaleDateString(localeToBcp47(locale), { month: 'long', year: 'numeric' })

  const openEventFromMonth = (ev: EventView) => {
    loadCalendars().catch(() => undefined)
    setEventDialog(ev)
  }

  const openDayPopup = (day: Date) => {
    const d = startOfLocalDay(day)
    setSelectedDay(d)
    setDayPopup(d)
  }

  const shiftMonth = (delta: number) => {
    setMonthCursor(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  const goToday = () => {
    const t = startOfLocalDay(new Date())
    setSelectedDay(t)
    setMonthCursor(new Date(t.getFullYear(), t.getMonth(), 1))
  }

  const statusDotColor =
    status === 'ok' ? '#4ade80' :
    status === 'syncing' ? 'var(--accent)' :
    status === 'error' ? '#f87171' :
    'var(--text-muted)'

  const conflictColor = (summary?.conflicts ?? 0) > 0 ? '#f87171' : 'var(--text)'

  return (
    <>
      <div style={{
        height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px',
        color: 'var(--text)', overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '8px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span style={{ color: 'var(--accent)' }}>{ICONS.calendar}</span>
            {t('calendar')}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <IconButton title={t('viewMonth')} active={tileView === 'month'} onClick={() => setTileViewPersist('month')}>
              <LayoutGrid size={14} />
            </IconButton>
            <IconButton title={t('viewCompact')} active={tileView === 'compact'} onClick={() => setTileViewPersist('compact')}>
              <List size={14} />
            </IconButton>
            {writableCalendars.length > 0 && (
              <IconButton title={t('addEvent')} onClick={openNewEvent}>
                <Plus size={14} />
              </IconButton>
            )}
            <IconButton title={t('monthView')} onClick={openMonthModal}>{ICONS.calendar}</IconButton>
            <IconButton title={t('sync')} onClick={triggerSyncAll} busy={status === 'syncing'}>{ICONS.sync}</IconButton>
            <IconButton title={t('accounts')} onClick={() => { setModalInitialView('accounts'); setModalOpen(true) }}>{ICONS.cog}</IconButton>
          </div>
        </div>

        {flash && (
          <div style={{
            padding: '8px 10px', borderRadius: '6px', fontSize: '12px',
            background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', color: 'var(--text)',
          }}>{flash}</div>
        )}

        {tileView === 'compact' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <StatBox label={t('today')} value={summary ? String(summary.todayCount) : '–'} />
              <StatBox label={t('conflicts')} value={summary ? String(summary.conflicts) : '–'} valueColor={conflictColor} />
            </div>

        {/* upcoming list */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', minHeight: 0 }}>
          {!summary && listEvents.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>…</div>
          )}
          {compactUpcoming.length === 0 && summary && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1,
              color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic',
            }}>{t('noUpcoming')}</div>
          )}
          {compactUpcoming.map(ev => (
            <button
              key={eventRowKey(ev)}
              onClick={() => openEventFromTile(ev)}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px', background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: '4px',
                borderLeft: `3px solid ${ev.calendarColor ?? '#5a9bd4'}`,
                fontSize: '12px', minWidth: 0,
              }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px',
                color: 'var(--text-muted)', minWidth: '58px' }}>
                {fmtDay(ev.dtstart, locale)}{!ev.allDay && ` ${fmtTime(ev.dtstart, false, locale)}`}
              </span>
              <span style={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.summary || t('untitled')}
              </span>
            </button>
          ))}
        </div>
          </>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <button type="button" aria-label={t('prev')} onClick={() => shiftMonth(-1)} style={widgetNavBtnStyle}>
                <ChevronLeft size={14} />
              </button>
              <div style={{
                flexGrow: 1, minWidth: 0, textAlign: 'center', fontSize: '13px', fontWeight: 600,
                color: 'var(--text)', textTransform: 'capitalize',
              }}>
                {monthLabel}
              </div>
              <button type="button" aria-label={t('next')} onClick={() => shiftMonth(1)} style={widgetNavBtnStyle}>
                <ChevronRight size={14} />
              </button>
            </div>
            <button type="button" onClick={goToday} style={{
              ...widgetNavBtnStyle, alignSelf: 'center', fontSize: '11px', padding: '2px 10px',
            }}>{t('todayBtn')}</button>
            <div style={{ overflow: 'auto', flex: '0 0 auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <MonthView
                locale={locale}
                compact
                countOnly
                cursor={monthCursor}
                range={monthRange}
                selectedDay={selectedDay}
                eventsByDay={monthEventsByDay}
                onSelectDay={d => setSelectedDay(startOfLocalDay(d))}
                onClickDay={openDayPopup}
                onClickEvent={openEventFromMonth}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              {t('openDay')}
            </div>
          </div>
        )}

        {/* footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '6px', borderTop: '1px solid var(--border)',
          fontSize: '11px', color: 'var(--text-muted)',
        }}>
          <span>
            <span style={{
              display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
              background: statusDotColor, marginRight: '6px',
              ...(status === 'syncing' ? { animation: 'sd-cal-pulse 1.2s ease-in-out infinite' } : {}),
            }} />
            {status === 'ok' && t('syncedAt')}
            {status === 'syncing' && t('syncing')}
            {status === 'error' && `${t('error')}: ${(errorMsg ?? '').slice(0, 40)}`}
            {status === 'loading' && '…'}
          </span>
          <button
            onClick={openMonthModal}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '4px',
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >{t('open')}</button>
        </div>
      </div>

      {/* keyframes for the pulsing status dot */}
      <style>{`
        @keyframes sd-cal-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes sd-cal-spin { to { transform: rotate(360deg); } }
      `}</style>

      {modalOpen && (
        <CalendarModal
          key={modalInitialView}
          locale={locale}
          initialView={modalInitialView}
          onClose={() => { setModalOpen(false); refresh() }}
        />
      )}
      {eventDialog && (
        <EventDialog
          locale={locale}
          event={eventDialog}
          calendars={writableCalendars}
          onClose={() => setEventDialog(null)}
          onSaved={msg => {
            setEventDialog(null)
            if (msg) showFlash(msg)
            void refreshAllEvents()
          }}
        />
      )}
      {dayPopup && (
        <DayEventsPopup
          locale={locale}
          day={dayPopup}
          events={monthEventsByDay[dateKeyLocal(dayPopup)] ?? []}
          canAdd={writableCalendars.length > 0}
          onClose={() => setDayPopup(null)}
          onAdd={() => {
            setDayPopup(null)
            setEventDialog({
              calendarId: pickDefaultWritableCalendar(writableCalendars)?.id ?? writableCalendars[0]?.id,
              allDay: false,
              dtstart: selectedDay.toISOString(),
            })
          }}
          onClickEvent={ev => { setDayPopup(null); openEventFromMonth(ev) }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Small reusable UI bits
// ---------------------------------------------------------------------------

function IconButton({ children, onClick, title, busy, active }: {
  children: React.ReactNode; onClick: () => void; title: string; busy?: boolean; active?: boolean
}) {
  return (
    <button onClick={onClick} title={title} style={{
      all: 'unset', cursor: 'pointer',
      width: '24px', height: '24px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '4px',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      border: active ? '1px solid var(--accent)' : '1px solid transparent',
      background: active ? 'var(--accent)14' : undefined,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent' }}
    >
      <span style={busy ? { animation: 'sd-cal-spin 1s linear infinite', display: 'inline-flex' } : { display: 'inline-flex' }}>
        {children}
      </span>
    </button>
  )
}

function StatBox({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: '4px', padding: '8px 10px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.1, marginTop: '2px', color: valueColor ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

// ===========================================================================
// Settings (per-instance plugin settings)
// ===========================================================================

function Settings({ config, onChange }: PluginSettingsProps) {
  const { locale } = usePluginLocale()
  const t = (k: string) => tr(k, locale)
  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '6px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          {t('refreshInterval')}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          value={(config.refreshInterval as number) ?? 60}
          onChange={e => onChange('refreshInterval', Math.max(15, Number(e.target.value)))}
        />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {locale === 'de'
          ? 'Konten und Kalender werden direkt im Kalender-Vollbild verwaltet (Zahnrad-Icon auf der Karte).'
          : 'Manage accounts and calendars in the full-screen calendar view (cog icon on the tile).'}
      </div>
    </div>
  )
}

// ===========================================================================
// Full-screen modal
// ===========================================================================

type ModalView = 'month' | 'agenda' | 'accounts'

function CalendarModal({ locale, onClose, initialView = 'month' }: {
  locale: Locale; onClose: () => void; initialView?: ModalView
}) {
  const t = (k: string) => tr(k, locale)
  const [view, setView] = useState<ModalView>(initialView)
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [calendars, setCalendars] = useState<CalendarView[]>([])
  const [accounts, setAccounts] = useState<AccountView[]>([])
  const [events, setEvents] = useState<EventView[]>([])
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sd-cal-hidden') || '[]')) }
    catch { return new Set() }
  })
  const [eventDialog, setEventDialog] = useState<{ event: Partial<EventView> | null } | null>(null)
  const [accountDialog, setAccountDialog] = useState<
    | { mode: 'create'; provider: 'caldav' | 'ics' }
    | { mode: 'edit'; account: AccountView }
    | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(new Date()))

  const range = useMemo(() => {
    if (view === 'agenda') {
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 30)
      return { start, end }
    }
    const start = new Date(cursor); start.setDate(1)
    start.setDate(1 - ((start.getDay() + 6) % 7))     // back to Monday
    const end = new Date(start); end.setDate(end.getDate() + 42)
    return { start, end }
  }, [view, cursor])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [cals, accs] = await Promise.all([api.listCalendars(), api.listAccounts()])
      setCalendars(cals)
      setAccounts(accs)
      if (view !== 'accounts') {
        const evs = await api.listEvents(range.start.toISOString(), range.end.toISOString())
        setEvents(evs.filter(e => !hidden.has(e.calendarId)))
      }
    } finally { setLoading(false) }
  }, [view, range, hidden])

  useEffect(() => { refresh() }, [refresh])

  const toggleCalendar = (id: string) => {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id); else next.add(id)
    setHidden(next)
    localStorage.setItem('sd-cal-hidden', JSON.stringify([...next]))
  }

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventView[]> = {}
    for (const ev of events) {
      const key = dateKeyFromIso(ev.dtstart)
      ;(map[key] = map[key] || []).push(ev)
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.dtstart.localeCompare(b.dtstart))
    return map
  }, [events])

  const selectedDayEvents = eventsByDay[dateKeyLocal(selectedDay)] ?? []

  const writableCalendars = calendars.filter(c => !c.readOnly)

  // ----- title -----
  const title = view === 'agenda'
    ? t('agendaTitle')
    : view === 'accounts' ? t('accounts')
    : cursor.toLocaleDateString(localeToBcp47(locale), { month: 'long', year: 'numeric' })

  const openNewOnDay = (day: Date) => {
    if (!writableCalendars[0]) return
    setEventDialog({
      event: {
        calendarId: writableCalendars[0].id,
        allDay: false,
        dtstart: startOfLocalDay(day).toISOString(),
      },
    })
  }

  return (
    <ModalPortal>
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', zIndex: 20000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(1100px, 100%)', height: 'min(88vh, 920px)',
          background: 'var(--background)', border: '1px solid var(--border)',
          borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto 1fr',
        }}
      >
        {/* toolbar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '17px', fontWeight: 600, minWidth: '220px', color: 'var(--text)' }}>{title}</div>
          {view !== 'accounts' && (
            <div style={{ display: 'inline-flex' }}>
              <ModalBtn onClick={() => view === 'month' ? setCursor(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n }) : null} disabled={view === 'agenda'}>‹</ModalBtn>
              <ModalBtn onClick={() => {
                const d = new Date(); d.setDate(1)
                setCursor(d)
                setSelectedDay(startOfLocalDay(new Date()))
              }}>{t('todayBtn')}</ModalBtn>
              <ModalBtn onClick={() => view === 'month' ? setCursor(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n }) : null} disabled={view === 'agenda'}>›</ModalBtn>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'inline-flex' }}>
            <ModalBtn onClick={() => setView('month')} active={view === 'month'}>{t('month')}</ModalBtn>
            <ModalBtn onClick={() => setView('agenda')} active={view === 'agenda'}>{t('agenda')}</ModalBtn>
            <ModalBtn onClick={() => setView('accounts')} active={view === 'accounts'}>{t('accounts')}</ModalBtn>
          </div>
          {view !== 'accounts' && writableCalendars.length > 0 && (
            <ModalBtn primary onClick={() => setEventDialog({ event: { calendarId: writableCalendars[0].id, allDay: true, dtstart: new Date().toISOString() } })}>
              {t('newEvent')}
            </ModalBtn>
          )}
          <ModalBtn ghost onClick={onClose}>{ICONS.close}</ModalBtn>
        </header>

        {/* body */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {view !== 'accounts' && (
            <CalendarFilterBar accounts={accounts} calendars={calendars} hidden={hidden} onToggle={toggleCalendar} t={t} />
          )}
          {false && view !== 'accounts' && (
            <aside style={{
              background: 'var(--surface)', borderRight: '1px solid var(--border)',
              overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--text-muted)' }}>
                {t('calendars')}
              </div>
              {accounts.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px' }}>{t('nothingHere')}</div>
              )}
              {accounts.map(a => {
                const myCals = calendars.filter(c => c.accountId === a.id)
                return (
                  <div key={a.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 6px', fontSize: '12px', fontWeight: 500,
                      color: 'var(--text-muted)',
                    }}>
                      <span style={{
                        display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                        background: a.lastSyncStatus === 'ok' ? '#4ade80'
                          : a.lastSyncStatus === 'error' ? '#f87171'
                          : 'var(--text-muted)',
                      }} />
                      {a.name}
                    </div>
                    {myCals.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleCalendar(c.id)}
                        style={{
                          all: 'unset', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '5px 8px 5px 18px', borderRadius: '4px',
                          fontSize: '13px', color: 'var(--text)', width: 'calc(100% - 18px)',
                          opacity: hidden.has(c.id) ? 0.4 : 1,
                        }}
                      >
                        <span style={{
                          width: '12px', height: '12px', borderRadius: '3px',
                          background: hidden.has(c.id) ? 'transparent' : c.color,
                          border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0,
                        }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        {c.readOnly && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>🔒</span>}
                      </button>
                    ))}
                  </div>
                )
              })}
            </aside>
          )}

          <main style={{ flex: 1, overflow: 'auto', background: 'var(--background)', minWidth: 0, minHeight: 0 }}>
            {view === 'month' && (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                <MonthView
                  locale={locale}
                  compact
                  cursor={cursor}
                  range={range}
                  selectedDay={selectedDay}
                  eventsByDay={eventsByDay}
                  onSelectDay={day => setSelectedDay(startOfLocalDay(day))}
                  onClickDay={day => setSelectedDay(startOfLocalDay(day))}
                  onClickEvent={ev => setEventDialog({ event: ev })}
                />
                <DayEventsPanel
                  locale={locale}
                  day={selectedDay}
                  events={selectedDayEvents}
                  canAdd={writableCalendars.length > 0}
                  onAdd={() => openNewOnDay(selectedDay)}
                  onClickEvent={ev => setEventDialog({ event: ev })}
                />
              </div>
            )}
            {view === 'agenda' && (
              <AgendaView
                eventsByDay={eventsByDay}
                locale={locale}
                onClickEvent={ev => setEventDialog({ event: ev })}
              />
            )}
            {view === 'accounts' && (
              <AccountsView
                accounts={accounts}
                calendars={calendars}
                locale={locale}
                onAddCaldav={() => setAccountDialog({ mode: 'create', provider: 'caldav' })}
                onAddIcs={() => setAccountDialog({ mode: 'create', provider: 'ics' })}
                onEditAccount={a => setAccountDialog({ mode: 'edit', account: a })}
                onRefresh={refresh}
              />
            )}
          </main>
        </div>
      </div>

      {eventDialog && (
        <EventDialog
          locale={locale}
          event={eventDialog.event}
          calendars={writableCalendars}
          onClose={() => setEventDialog(null)}
          onSaved={() => { setEventDialog(null); refresh() }}
        />
      )}
      {accountDialog && (
        <AccountDialog
          locale={locale}
          target={accountDialog}
          onClose={() => setAccountDialog(null)}
          onSaved={() => { setAccountDialog(null); refresh() }}
        />
      )}
    </div>
    </ModalPortal>
  )
}

function CalendarFilterBar({ accounts, calendars, hidden, onToggle, t }: {
  accounts: AccountView[]
  calendars: CalendarView[]
  hidden: Set<string>
  onToggle: (id: string) => void
  t: (k: string) => string
}) {
  if (!calendars.length) return null
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px',
      borderBottom: '1px solid var(--border)', background: 'var(--surface)',
    }}>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>{t('calendars')}:</span>
      {accounts.flatMap(a => calendars.filter(c => c.accountId === a.id).map(c => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          style={{
            all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '999px', fontSize: '12px',
            border: `1px solid ${hidden.has(c.id) ? 'var(--border)' : c.color}`,
            opacity: hidden.has(c.id) ? 0.45 : 1, color: 'var(--text)',
            background: hidden.has(c.id) ? 'transparent' : `${c.color}22`,
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.color }} />
          {c.name}
        </button>
      )))}
    </div>
  )
}

function DayEventsPopup({ locale, day, events, canAdd, onClose, onAdd, onClickEvent }: {
  locale: Locale
  day: Date
  events: EventView[]
  canAdd: boolean
  onClose: () => void
  onAdd: () => void
  onClickEvent: (ev: EventView) => void
}) {
  const t = (k: string) => tr(k, locale)
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.dtstart.localeCompare(b.dtstart)),
    [events],
  )
  return (
    <ModalPortal>
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}
      >
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '8px', width: 'min(420px, 92vw)', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              {fmtFullDay(day, locale)}
              {sorted.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({sorted.length} {t('eventCount')})
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-muted)' }}>{ICONS.close}</button>
          </div>
          <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
            {!sorted.length && (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>{t('noEventsThisDay')}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sorted.map(ev => (
                <button
                  key={eventRowKey(ev)}
                  onClick={() => onClickEvent(ev)}
                  style={{
                    all: 'unset', cursor: 'pointer', textAlign: 'left',
                    display: 'grid', gridTemplateColumns: '72px 4px 1fr', gap: '10px', alignItems: 'center',
                    padding: '8px 10px', background: 'var(--background)', borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {ev.allDay ? t('allDay') : fmtTime(ev.dtstart, false, locale)}
                  </span>
                  <span style={{ background: ev.calendarColor ?? '#5a9bd4', width: '4px', height: '100%', borderRadius: '2px' }} />
                  <span style={{ fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.summary || t('untitled')}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div style={{
            padding: '12px 18px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
          }}>
            <ModalBtn onClick={onClose}>{t('close')}</ModalBtn>
            {canAdd && <ModalBtn primary onClick={onAdd}>{t('newEvent')}</ModalBtn>}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

function DayEventsPanel({ locale, day, events, canAdd, onAdd, onClickEvent }: {
  locale: Locale
  day: Date
  events: EventView[]
  canAdd: boolean
  onAdd: () => void
  onClickEvent: (ev: EventView) => void
}) {
  const t = (k: string) => tr(k, locale)
  return (
    <div style={{
      borderTop: '1px solid var(--border)', background: 'var(--surface)',
      padding: '12px 16px', flex: '1 1 40%', minHeight: '140px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          {t('dayEvents')} {fmtFullDay(day, locale)}
        </div>
        {canAdd && <ModalBtn primary onClick={onAdd}>{t('newEvent')}</ModalBtn>}
      </div>
      {!events.length && (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>{t('noEventsThisDay')}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {events.map(ev => (
          <button
            key={ev.id}
            onClick={() => onClickEvent(ev)}
            style={{
              all: 'unset', cursor: 'pointer', textAlign: 'left',
              display: 'grid', gridTemplateColumns: '72px 4px 1fr', gap: '10px', alignItems: 'center',
              padding: '8px 10px', background: 'var(--background)', borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {ev.allDay ? t('allDay') : fmtTime(ev.dtstart, false, locale)}
            </span>
            <span style={{ background: ev.calendarColor ?? '#5a9bd4', width: '4px', height: '100%', borderRadius: '2px' }} />
            <span style={{ fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.summary || t('untitled')}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModalBtn({ children, onClick, active, primary, ghost, disabled }: {
  children: React.ReactNode; onClick: (() => void) | null; active?: boolean
  primary?: boolean; ghost?: boolean; disabled?: boolean
}) {
  const bg = primary ? 'var(--accent)' : ghost ? 'transparent' : 'var(--background)'
  const color = primary ? '#fff' : active ? 'var(--accent)' : 'var(--text)'
  return (
    <button
      onClick={() => !disabled && onClick && onClick()}
      disabled={disabled}
      style={{
        all: 'unset', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '6px 12px', background: bg, color,
        border: `1px solid ${primary ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '4px', fontSize: '13px',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}
    >{children}</button>
  )
}

// ===========================================================================
// Month grid
// ===========================================================================

function MonthView({ locale, cursor, range, eventsByDay, selectedDay, compact, countOnly, onSelectDay, onClickDay, onClickEvent }: {
  locale: Locale
  cursor: Date
  range: { start: Date; end: Date }
  eventsByDay: Record<string, EventView[]>
  selectedDay: Date
  compact?: boolean
  countOnly?: boolean
  onSelectDay: (d: Date) => void
  onClickDay: (d: Date) => void
  onClickEvent: (ev: EventView) => void
}) {
  const t = (k: string) => tr(k, locale)
  const weekdays = useMemo(() => weekdayShortLabels(locale), [locale])
  const today = startOfLocalDay(new Date())
  const month = cursor.getMonth()
  const selectedKey = dateKeyLocal(selectedDay)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(range.start); d.setDate(range.start.getDate() + i)
    cells.push(d)
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
      gridAutoRows: countOnly ? 'minmax(40px, auto)' : compact ? 'minmax(52px, auto)' : 'minmax(96px, 1fr)',
      flex: compact ? '0 0 auto' : undefined,
      minHeight: compact ? undefined : '360px',
    }}>
      {weekdays.map(w => (
        <div key={w} style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--text-muted)', padding: '6px 8px', textAlign: 'right',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
        }}>{w}</div>
      ))}

      {cells.map((day, i) => {
        const key = dateKeyLocal(day)
        const dayEvents = eventsByDay[key] || []
        const visible = dayEvents.slice(0, compact ? 2 : 3)
        const more = dayEvents.length - visible.length
        const isOther = day.getMonth() !== month
        const isToday = dateKeyLocal(day) === dateKeyLocal(today)
        const isSelected = key === selectedKey

        return (
          <div
            key={i}
            onClick={() => { onSelectDay(day); onClickDay(day) }}
            style={{
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '4px 4px 4px 6px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              cursor: 'pointer',
              background: isSelected ? 'var(--accent)14' : isOther ? 'rgba(0,0,0,0.10)' : undefined,
              outline: isSelected ? '2px solid var(--accent)' : undefined,
              outlineOffset: '-2px',
              overflow: 'hidden', minWidth: 0,
            }}
          >
            <div style={{
              fontSize: '11px', fontWeight: 500, marginLeft: 'auto', marginBottom: '2px',
              color: isOther ? 'var(--text-muted)' : 'var(--text)',
              ...(isToday ? {
                background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                width: '20px', height: '20px', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
              } : {}),
            }}>{day.getDate()}</div>
            {countOnly ? (
              dayEvents.length > 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, lineHeight: 1,
                    background: 'var(--accent)', color: '#fff',
                    borderRadius: '10px', minWidth: '18px', padding: '2px 6px', textAlign: 'center',
                  }}>{dayEvents.length}</span>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                {visible.map(ev => {
                  const isConflict = ev.syncState === 'conflict'
                  const isPending = ev.syncState !== 'synced' && ev.syncState !== 'local_new'
                  return (
                    <button
                      key={eventRowKey(ev)}
                      onClick={e => { e.stopPropagation(); onClickEvent(ev) }}
                      style={{
                        all: 'unset', cursor: 'pointer',
                        fontSize: '10px', padding: '2px 5px', borderRadius: '3px',
                        background: isConflict ? '#f87171' : (ev.calendarColor ?? '#5a9bd4'),
                        color: '#fff', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        borderLeft: '2px solid rgba(0,0,0,0.25)',
                        opacity: isPending ? 0.7 : 1,
                        ...(isConflict ? { animation: 'sd-cal-pulse 1.5s ease-in-out infinite' } : {}),
                      }}
                    >
                      {ev.allDay ? ev.summary : `${fmtTime(ev.dtstart, false, locale)} ${ev.summary ?? ''}`}
                    </button>
                  )
                })}
                {more > 0 && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'right', padding: '0 4px' }}>
                    +{more} {t('moreEvents')}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Agenda
// ===========================================================================

function AgendaView({ eventsByDay, locale, onClickEvent }: {
  eventsByDay: Record<string, EventView[]>
  locale: 'de' | 'en'
  onClickEvent: (ev: EventView) => void
}) {
  const t = (k: string) => tr(k, locale)
  const days = Object.keys(eventsByDay).sort()
  if (!days.length) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        {t('noUpcoming')}
      </div>
    )
  }
  return (
    <div style={{
      padding: '16px 24px', display: 'flex', flexDirection: 'column',
      gap: '16px', maxWidth: '800px', margin: '0 auto',
    }}>
      {days.map(k => (
        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '4px',
          }}>{fmtFullDay(new Date(k), locale)}</div>
          {eventsByDay[k].map(ev => (
            <button
              key={ev.id}
              onClick={() => onClickEvent(ev)}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'grid', gridTemplateColumns: '80px 4px 1fr auto',
                gap: '12px', alignItems: 'center', padding: '10px',
                background: 'var(--surface)', borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                {ev.allDay ? t('allDay') : fmtTime(ev.dtstart, false, locale)}
              </span>
              <span style={{ background: ev.calendarColor ?? '#5a9bd4', width: '4px', height: '100%', borderRadius: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>{ev.summary || t('untitled')}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.calendarName ?? ''}</div>
              </div>
              {ev.syncState === 'conflict' && (
                <span style={{ color: '#f87171', fontSize: '11px' }}>⚠ {tr('conflicts', locale)}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ===========================================================================
// Accounts view
// ===========================================================================

function AccountsView({ accounts, calendars, locale, onAddCaldav, onAddIcs, onEditAccount, onRefresh }: {
  accounts: AccountView[]
  calendars: CalendarView[]
  locale: 'de' | 'en'
  onAddCaldav: () => void
  onAddIcs: () => void
  onEditAccount: (account: AccountView) => void
  onRefresh: () => void
}) {
  const t = (k: string) => tr(k, locale)
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <ModalBtn primary onClick={onAddCaldav}>{t('addCaldav')}</ModalBtn>
        <ModalBtn primary onClick={onAddIcs}>{t('addIcs')}</ModalBtn>
      </div>

      {accounts.length === 0 && (
        <div style={{
          padding: '14px 16px', background: 'rgba(90,155,212,0.08)',
          border: '1px solid #5a9bd4', borderRadius: '4px',
          fontSize: '13px', color: 'var(--text)',
        }}>
          {t('nothingHere')}
        </div>
      )}

      {accounts.map(a => {
        const cals = calendars.filter(c => c.accountId === a.id)
        return (
          <div key={a.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '16px', marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--text)' }}>{a.name}</strong>
              <span style={{
                fontSize: '10px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{a.provider}</span>
              {a.lastSyncStatus === 'ok' && <span style={{ color: '#4ade80', fontSize: '11px' }}>✓ {tr('syncedAt', locale)}</span>}
              {a.lastSyncStatus === 'error' && (
                <span style={{
                  padding: '4px 8px', fontSize: '11px',
                  background: 'rgba(248,113,113,0.10)', border: '1px solid #f87171', borderRadius: '4px',
                }}>
                  ⚠ {a.lastSyncError ?? t('error')}
                </span>
              )}
              <span style={{ flex: 1 }} />
              <ModalBtn onClick={() => onEditAccount(a)}>{t('editAccount')}</ModalBtn>
              <ModalBtn onClick={async () => { await api.syncAccount(a.id); onRefresh() }}>{t('sync')}</ModalBtn>
              <ModalBtn onClick={async () => {
                if (!confirm(t('confirmDeleteAccount'))) return
                await api.deleteAccount(a.id); onRefresh()
              }}>{t('remove')}</ModalBtn>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {a.endpoint ?? ''} · {a.calendarCount} {tr('calendars', locale).toLowerCase()} ·
              {locale === 'de' ? ' letzter Sync: ' : ' last sync: '}{a.lastSyncAt ?? 'nie / never'}
            </div>
            {cals.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 0', borderTop: '1px solid var(--border)',
              }}>
                <input
                  type="color" value={c.color}
                  onChange={async e => { await api.updateCalendar(c.id, { color: e.target.value }); onRefresh() }}
                  style={{ width: '32px', height: '24px', padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
                />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)' }}>{c.name}</span>
                {c.readOnly && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🔒 {t('readOnly')}</span>}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Event dialog
// ===========================================================================

function EventDialog({ event, calendars, locale, onClose, onSaved }: {
  event: Partial<EventView> | null
  calendars: CalendarView[]
  locale: 'de' | 'en'
  onClose: () => void
  onSaved: (msg?: string) => void
}) {
  const t = (k: string) => tr(k, locale)
  const isNew = !event?.id
  const isConflict = event?.syncState === 'conflict'
  const defaultCal = pickDefaultWritableCalendar(calendars) ?? calendars[0]

  const [form, setForm] = useState({
    calendarId: event?.calendarId ?? defaultCal?.id ?? '',
    summary: event?.summary ?? '',
    description: event?.description ?? '',
    location: event?.location ?? '',
    dtstart: event?.dtstart ?? new Date().toISOString(),
    dtend: event?.dtend ?? '',
    allDay: event?.allDay ?? false,
    rrule: event?.rrule ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedCal = calendars.find(c => c.id === form.calendarId)
  const calendarReadOnly = Boolean(selectedCal?.readOnly)

  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '4px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const save = async () => {
    if (!form.calendarId || calendarReadOnly) {
      setError(t('pickWritableCalendar'))
      return
    }
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const payload = {
        calendarId: form.calendarId,
        summary: form.summary,
        description: form.description,
        location: form.location,
        allDay: form.allDay,
        dtstart: form.dtstart.length === 10 ? form.dtstart : fromInputDateTime(toInputDateTime(form.dtstart)),
        dtend: form.dtend
          ? (form.dtend.length === 10 ? form.dtend : fromInputDateTime(toInputDateTime(form.dtend)))
          : undefined,
        rrule: form.rrule || undefined,
      }
      const res = isNew
        ? await api.createEvent(payload)
        : await api.updateEvent(event!.id!, payload)
      const syncErr = (res as EventView & { syncError?: string })?.syncError
      const syncPending = (res as EventView & { syncPending?: boolean })?.syncPending
      const fatal = (res as { error?: string })?.error
      if (fatal) {
        setError(fatal)
        return
      }
      const msg = syncErr
        ? `${t('syncFailed')}: ${syncErr}`
        : syncPending
          ? t('eventSavedSyncing')
          : t('eventSaved')
      setSuccess(msg)
      window.setTimeout(() => onSaved(syncErr ? undefined : msg), syncErr ? 2200 : 1100)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!event?.id) return
    if (!confirm(t('confirmDeleteEvent'))) return
    try { await api.deleteEvent(event.id); onSaved() } catch (e: any) { setError(e?.message ?? String(e)) }
  }

  const resolve = async (side: 'local' | 'remote') => {
    if (!event?.id) return
    try { await api.resolveConflict(event.id, side); onSaved() } catch (e: any) { setError(e?.message ?? String(e)) }
  }

  return (
    <ModalPortal>
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20001,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '8px', width: 'min(520px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            {isNew ? (locale === 'de' ? 'Neuer Termin' : 'New event') : (locale === 'de' ? 'Termin bearbeiten' : 'Edit event')}
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-muted)' }}>{ICONS.close}</button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isConflict && (
            <div style={{ padding: '10px 12px', fontSize: '12px',
              background: 'rgba(251,191,36,0.10)', border: '1px solid #fbbf24', borderRadius: '4px', color: 'var(--text)' }}>
              {t('conflictBanner')}
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 12px', fontSize: '12px',
              background: 'rgba(248,113,113,0.10)', border: '1px solid #f87171', borderRadius: '4px', color: 'var(--text)' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 12px', fontSize: '12px',
              background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', borderRadius: '4px', color: 'var(--text)' }}>
              {success}
            </div>
          )}

          <Field label={t('title')}>
            <input style={inp} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <Field label={t('selectCalendar')}>
            <select style={inp} value={form.calendarId} onChange={e => setForm({ ...form, calendarId: e.target.value })}>
              {calendars.map(c => <option key={c.id} value={c.id}>{c.name}{c.readOnly ? ` (${t('readOnly')})` : ''}</option>)}
            </select>
            {calendarReadOnly && (
              <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>{t('readOnlyCalendarHint')}</div>
            )}
          </Field>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
            <input type="checkbox" checked={form.allDay} onChange={e => setForm({ ...form, allDay: e.target.checked })} />
            {t('allDay')}
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Field label={t('start')} flex>
              <input style={inp} type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.dtstart.slice(0, 10) : toInputDateTime(form.dtstart)}
                onChange={e => setForm({ ...form, dtstart: form.allDay ? e.target.value : fromInputDateTime(e.target.value) })} />
            </Field>
            <Field label={t('end')} flex>
              <input style={inp} type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? (form.dtend || '').slice(0, 10) : (form.dtend ? toInputDateTime(form.dtend) : '')}
                onChange={e => setForm({ ...form, dtend: form.allDay ? e.target.value : fromInputDateTime(e.target.value) })} />
            </Field>
          </div>
          <Field label={t('location')}>
            <input style={inp} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label={t('notes')}>
            <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label={t('recurrence')}>
            <select style={inp} value={form.rrule} onChange={e => setForm({ ...form, rrule: e.target.value })}>
              <option value="">{t('noRecurrence')}</option>
              <option value="FREQ=DAILY">{t('daily')}</option>
              <option value="FREQ=WEEKLY">{t('weekly')}</option>
              <option value="FREQ=MONTHLY">{t('monthly')}</option>
              <option value="FREQ=YEARLY">{t('yearly')}</option>
            </select>
          </Field>
        </div>

        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
        }}>
          {!isNew && !isConflict && <ModalBtn onClick={del}>{t('delete')}</ModalBtn>}
          <span style={{ flex: 1 }} />
          {isConflict ? (
            <>
              <ModalBtn onClick={() => resolve('remote')}>{t('keepRemote')}</ModalBtn>
              <ModalBtn primary onClick={() => resolve('local')}>{t('keepLocal')}</ModalBtn>
            </>
          ) : (
            <>
              <ModalBtn onClick={onClose} disabled={saving}>{t('cancel')}</ModalBtn>
              <ModalBtn primary onClick={save} disabled={saving || calendarReadOnly}>
                {saving ? t('saving') : (isNew ? t('add') : t('save'))}
              </ModalBtn>
            </>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...(flex ? { flex: 1 } : {}) }}>
      <label style={{
        fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em',
        color: 'var(--text-muted)',
      }}>{label}</label>
      {children}
    </div>
  )
}

// ===========================================================================
// Account dialog
// ===========================================================================

type AccountDialogTarget =
  | { mode: 'create'; provider: 'caldav' | 'ics' }
  | { mode: 'edit'; account: AccountView }

function AccountDialog({ target, locale, onClose, onSaved }: {
  target: AccountDialogTarget
  locale: 'de' | 'en'
  onClose: () => void
  onSaved: () => void
}) {
  const t = (k: string) => tr(k, locale)
  const isEdit = target.mode === 'edit'
  const provider = isEdit ? target.account.provider : target.provider
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        name: target.account.name,
        url: target.account.url ?? '',
        username: target.account.username ?? '',
        password: '',
        verifySsl: true,
      }
    }
    return { name: '', url: '', username: '', password: '', verifySsl: true }
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '4px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const save = async () => {
    setError(null); setSaving(true)
    try {
      if (isEdit) {
        const body: Record<string, unknown> = { name: form.name || target.account.name }
        if (provider === 'caldav') {
          body.caldav = {
            url: form.url,
            username: form.username,
            verifySsl: form.verifySsl,
            ...(form.password ? { password: form.password } : {}),
          }
        } else {
          body.ics = {
            url: form.url,
            username: form.username || undefined,
            ...(form.password ? { password: form.password } : {}),
          }
        }
        await api.updateAccount(target.account.id, body)
      } else {
        const body =
          provider === 'caldav'
            ? { name: form.name || form.url, provider, caldav: { url: form.url, username: form.username, password: form.password, verifySsl: form.verifySsl } }
            : { name: form.name || form.url, provider, ics: { url: form.url, username: form.username || undefined, password: form.password || undefined } }
        await api.createAccount(body)
      }
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalPortal>
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 20001,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '8px', width: 'min(480px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            {isEdit ? t('editAccountTitle') : (provider === 'caldav' ? t('addCaldav') : t('addIcs'))}
          </div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-muted)' }}>{ICONS.close}</button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label={t('displayName')}>
            <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={provider === 'caldav' ? 'iCloud privat' : 'Schulferien BW'} />
          </Field>
          <Field label={t('url')}>
            <input style={inp} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder={provider === 'caldav'
                ? 'https://caldav.icloud.com/  or  https://nextcloud.example.com/remote.php/dav/'
                : 'https://… .ics  or  webcal://…'} />
          </Field>
          {provider === 'caldav' && (
            <>
              <Field label={t('username')}>
                <input style={inp} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </Field>
              <Field label={t('appPassword')}>
                <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={isEdit ? t('passwordLeaveBlank') : undefined} />
              </Field>
              <label style={{ display: 'inline-flex', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
                <input type="checkbox" checked={form.verifySsl} onChange={e => setForm({ ...form, verifySsl: e.target.checked })} />
                {t('verifySsl')}
              </label>
              <div style={{
                padding: '10px 12px', fontSize: '12px',
                background: 'rgba(90,155,212,0.08)', border: '1px solid #5a9bd4', borderRadius: '4px', color: 'var(--text)',
              }}>{t('iCloudHint')}</div>
            </>
          )}
          {provider === 'ics' && (
            <details>
              <summary style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {locale === 'de' ? 'Mit Authentifizierung (selten)' : 'With authentication (rare)'}
              </summary>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Field label={t('username')}>
                  <input style={inp} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </Field>
                <Field label={t('password')}>
                  <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </Field>
              </div>
            </details>
          )}
          {error && (
            <div style={{
              padding: '10px 12px', fontSize: '12px',
              background: 'rgba(248,113,113,0.10)', border: '1px solid #f87171', borderRadius: '4px', color: 'var(--text)',
            }}>{error}</div>
          )}
        </div>

        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
        }}>
          <ModalBtn onClick={onClose}>{t('cancel')}</ModalBtn>
          <ModalBtn primary onClick={save}>{saving ? '…' : (isEdit ? t('save') : t('add'))}</ModalBtn>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}

// ===========================================================================
// Export
// ===========================================================================

export const component: PluginComponent = { Widget, Settings }
