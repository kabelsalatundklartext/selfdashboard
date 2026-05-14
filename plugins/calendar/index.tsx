'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { useDashboardStore } from '@/lib/store'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'calendar',
  name: 'Calendar',
  description:
    'Monats- oder Wochenansicht, Wochenstart, lokale Termine (im Widget speicherbar), optional nur anstehende Termine in der Liste.',
  version: '1.2.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 5, h: 5, minW: 3, minH: 4 },
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
  ],
}

type WeekStartMode = 'auto' | 'monday' | 'sunday'
type CalendarViewMode = 'month' | 'week'

/** Ein Termin = ganztägig, lokales Datum YYYY-MM-DD (gespeichert in `config.events`). */
interface CalendarEventRow {
  id: string
  title: string
  date: string
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
    out.push({ id, title, date })
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
  const events = useMemo(() => parseEvents(rawEvents), [rawEvents])
  const eventsByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      map.set(e.date, (map.get(e.date) ?? 0) + 1)
    }
    return map
  }, [events])

  const persistEvents = useCallback(
    (next: CalendarEventRow[]) => {
      updatePluginConfig(instanceId, { events: next })
    },
    [instanceId, updatePluginConfig],
  )

  const [view, setView] = useState(() => monthStart(new Date().getFullYear(), new Date().getMonth()))
  const [, setMinuteTick] = useState(0)
  const [pickerYmd, setPickerYmd] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editing, setEditing] = useState<{ id: string; title: string; date: string } | null>(null)

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
    let rows = [...events]
    rows.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, loc) : a.date.localeCompare(b.date)))
    if (listUpcomingOnly) rows = rows.filter((e) => e.date >= todayYmd)
    return rows.slice(0, maxListEntries)
  }, [events, listUpcomingOnly, maxListEntries, todayYmd, loc])

  const dayEvents = useMemo(() => {
    if (!pickerYmd) return []
    return events.filter((e) => e.date === pickerYmd).sort((a, b) => a.title.localeCompare(b.title, loc))
  }, [events, pickerYmd, loc])

  const pickerLabel = useMemo(() => {
    if (!pickerYmd) return ''
    const [yy, mm, dd] = pickerYmd.split('-').map(Number)
    const d = new Date(yy!, (mm ?? 1) - 1, dd ?? 1, 12, 0, 0, 0)
    return d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }, [pickerYmd, loc])

  const addNewEvent = useCallback(() => {
    const t = newTitle.trim()
    if (!t || !pickerYmd) return
    persistEvents([...events, { id: newEventId(), title: t.slice(0, 240), date: pickerYmd }])
    setNewTitle('')
  }, [newTitle, pickerYmd, events, persistEvents])

  const saveEditing = useCallback(() => {
    if (!editing) return
    const t = editing.title.trim()
    if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(editing.date)) return
    persistEvents(events.map((e) => (e.id === editing.id ? { ...e, title: t.slice(0, 240), date: editing.date } : e)))
    setEditing(null)
  }, [editing, events, persistEvents])

  const deleteEvent = useCallback(
    (id: string) => {
      persistEvents(events.filter((e) => e.id !== id))
      if (editing?.id === id) setEditing(null)
    },
    [events, persistEvents, editing],
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

      <div
        role="grid"
        aria-label={de ? 'Kalender' : 'Calendar'}
        style={{
          flex: pickerYmd || showEventList ? '1 1 45%' : 1,
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

      {pickerYmd && (
        <div
          style={{
            flexShrink: 0,
            border: `1px solid color-mix(in srgb, ${border} 70%, transparent)`,
            borderRadius: '8px',
            padding: 'clamp(6px, 1.4cqmin, 10px)',
            background: 'color-mix(in srgb, var(--surface-2) 90%, var(--background))',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '38%',
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: 'clamp(10px, 2.3cqmin, 12px)', fontWeight: 700, color: text }}>
              {lab.dayTitle} {pickerLabel}
            </p>
            <button type="button" onClick={() => setPickerYmd(null)} style={chipBtnStyle}>
              {lab.closeDay}
            </button>
          </div>

          {dayEvents.length === 0 && <p style={{ margin: 0, fontSize: '11px', color: muted }}>{lab.emptyDay}</p>}

          {dayEvents.map((ev) =>
            editing?.id === ev.id ? (
              <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: muted }}>{lab.titleLabel}</label>
                <input
                  style={inpSmall}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <label style={{ fontSize: '10px', color: muted }}>{lab.dateLabel}</label>
                <input
                  style={inpSmall}
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={saveEditing} style={primarySmallBtnStyle}>
                    {lab.save}
                  </button>
                  <button type="button" onClick={() => setEditing(null)} style={ghostSmallBtnStyle}>
                    {lab.cancel}
                  </button>
                  <button type="button" onClick={() => deleteEvent(ev.id)} style={dangerSmallBtnStyle}>
                    {lab.del}
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: 'clamp(10px, 2.2cqmin, 12px)',
                  color: text,
                }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button type="button" onClick={() => setEditing({ id: ev.id, title: ev.title, date: ev.date })} style={chipBtnStyle}>
                    {lab.edit}
                  </button>
                  <button type="button" onClick={() => deleteEvent(ev.id)} style={chipBtnStyle}>
                    {lab.del}
                  </button>
                </div>
              </div>
            ),
          )}

          {!editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <input
                style={inpSmall}
                placeholder={lab.newPh}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addNewEvent()
                  }
                }}
              />
              <button
                type="button"
                onClick={addNewEvent}
                disabled={!newTitle.trim()}
                style={{
                  ...primarySmallBtnStyle,
                  opacity: !newTitle.trim() ? 0.45 : 1,
                  cursor: !newTitle.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {lab.add}
              </button>
            </div>
          )}
        </div>
      )}

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
              {listRows.map((ev) => (
                <li key={ev.id} style={{ fontSize: 'clamp(10px, 2.1cqmin, 12px)', color: text }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerYmd(ev.date)
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
                      {ev.date}
                    </span>{' '}
                    — {ev.title}
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
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
