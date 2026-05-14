'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'calendar',
  name: 'Calendar',
  description:
    'Monatskalender mit Navigation, heutiger Markierung und einstellbarem Wochenstart (Auto / Montag / Sonntag).',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 5, h: 5, minW: 3, minH: 4 },
  configSchema: [
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
  ],
}

type WeekStartMode = 'auto' | 'monday' | 'sunday'

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

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const loc = de ? 'de-DE' : 'en-GB'
  const weekMode = (str(config.weekStart) as WeekStartMode) || 'auto'
  const showOther = (config as Record<string, unknown>).showOtherMonthDays !== false
  const highlightWeekends = (config as Record<string, unknown>).highlightWeekends === true
  const startsMonday = weekStartsMonday(weekMode, de)

  const [view, setView] = useState(() => monthStart(new Date().getFullYear(), new Date().getMonth()))
  const [, setMinuteTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setMinuteTick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const y = view.getFullYear()
  const m = view.getMonth()
  const cells = useMemo(() => buildMonthCells(y, m, startsMonday), [y, m, startsMonday])
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

  const monthTitle = view.toLocaleDateString(loc, { month: 'long', year: 'numeric' })

  const goPrev = useCallback(() => setView((v) => addMonths(v, -1)), [])
  const goNext = useCallback(() => setView((v) => addMonths(v, 1)), [])
  const goToday = useCallback(() => setView(monthStart(new Date().getFullYear(), new Date().getMonth())), [])

  const muted = 'var(--text-muted)'
  const text = 'var(--text)'
  const accent = 'var(--accent)'
  const border = 'var(--border)'
  const surface = 'var(--surface)'

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
        overflow: 'hidden',
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
          aria-label={de ? 'Vorheriger Monat' : 'Previous month'}
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
              textTransform: 'capitalize',
            }}
          >
            {monthTitle}
          </p>
        </div>
        <button
          type="button"
          onClick={goNext}
          aria-label={de ? 'Nächster Monat' : 'Next month'}
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
          flex: 1,
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
            gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
            gap: '2px',
          }}
        >
          {cells.map((d) => {
            const inMonth = d.getMonth() === m && d.getFullYear() === y
            const ymd = toYmd(d)
            const isToday = ymd === todayYmd
            const hidden = !inMonth && !showOther
            const weekend = highlightWeekends && (d.getDay() === 0 || d.getDay() === 6)

            if (hidden) {
              return <div key={ymd} style={{ minWidth: 0, minHeight: 0 }} aria-hidden />
            }

            const aria = d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

            return (
              <div
                key={ymd}
                role="gridcell"
                aria-label={aria}
                aria-current={isToday ? 'date' : undefined}
                style={{
                  minWidth: 0,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  border: isToday ? `2px solid ${accent}` : `1px solid color-mix(in srgb, ${border} 65%, transparent)`,
                  background: isToday
                    ? `color-mix(in srgb, ${accent} 18%, ${surface})`
                    : inMonth
                      ? 'color-mix(in srgb, var(--surface-2) 88%, var(--background))'
                      : 'color-mix(in srgb, var(--surface) 55%, transparent)',
                  color: inMonth ? (weekend ? accent : text) : muted,
                  fontSize: 'clamp(9px, 2.5cqmin, 14px)',
                  fontWeight: isToday ? 800 : inMonth ? 600 : 500,
                  opacity: inMonth ? 1 : 0.72,
                }}
              >
                <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
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
  const weekVal = str(config.weekStart) || 'auto'
  const otherOn = (config as Record<string, unknown>).showOtherMonthDays !== false
  const weekendOn = (config as Record<string, unknown>).highlightWeekends === true

  const inp: React.CSSProperties = {
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
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
