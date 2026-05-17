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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

import {
  api,
  type AccountView,
  type CalendarView,
  type EventView,
  type SummaryView,
} from './api-client'
import { detectLocale, t as tr } from './i18n'

// ---------------------------------------------------------------------------
// Plugin meta — shown in the Plugin Store
// ---------------------------------------------------------------------------

export const meta: PluginMeta = {
  id: 'calendar',
  name: 'Kalender',
  description: 'CalDAV + ICS Kalender mit Two-Way-Sync. iCloud, Nextcloud, Fastmail, Posteo …',
  version: '1.0.0',
  author: 'SelfDashboard Community',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 4, h: 8, minW: 3, minH: 6 },
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

const fmtTime = (iso: string, allDay: boolean) => {
  if (allDay) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })

const fmtFullDay = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const toInputDateTime = (iso: string): string => {
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16)
}

const fromInputDateTime = (val: string): string => new Date(val).toISOString()

// ===========================================================================
// Widget — compact dashboard tile
// ===========================================================================

function Widget({ config }: PluginWidgetProps) {
  const locale = detectLocale()
  const t = (k: string) => tr(k, locale)
  const refreshInterval = Math.max(15, ((config.refreshInterval as number) ?? 60)) * 1000

  const [summary, setSummary] = useState<SummaryView | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'syncing'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const triggerSyncAll = async () => {
    setStatus('syncing')
    try {
      const accounts = await api.listAccounts()
      await Promise.all(accounts.filter(a => a.enabled).map(a => api.syncAccount(a.id).catch(() => undefined)))
      await refresh()
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? String(e))
    }
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
            <IconButton title={t('sync')} onClick={triggerSyncAll} busy={status === 'syncing'}>{ICONS.sync}</IconButton>
            <IconButton title={t('accounts')} onClick={() => setModalOpen(true)}>{ICONS.cog}</IconButton>
          </div>
        </div>

        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <StatBox label={t('today')} value={summary ? String(summary.todayCount) : '–'} />
          <StatBox label={t('conflicts')} value={summary ? String(summary.conflicts) : '–'} valueColor={conflictColor} />
        </div>

        {/* upcoming list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', minHeight: 0 }}>
          {!summary && <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>…</div>}
          {summary && summary.upcoming.length === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
              color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic',
            }}>{t('noUpcoming')}</div>
          )}
          {summary?.upcoming.map(ev => (
            <button
              key={ev.id}
              onClick={() => setModalOpen(true)}
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
                {fmtDay(ev.dtstart)}{!ev.allDay && ` ${fmtTime(ev.dtstart, false)}`}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.summary || t('untitled')}
              </span>
            </button>
          ))}
        </div>

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
            onClick={() => setModalOpen(true)}
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

      {modalOpen && <CalendarModal locale={locale} onClose={() => { setModalOpen(false); refresh() }} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Small reusable UI bits
// ---------------------------------------------------------------------------

function IconButton({ children, onClick, title, busy }: {
  children: React.ReactNode; onClick: () => void; title: string; busy?: boolean
}) {
  return (
    <button onClick={onClick} title={title} style={{
      all: 'unset', cursor: 'pointer',
      width: '24px', height: '24px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '4px', color: 'var(--text-muted)',
      border: '1px solid transparent',
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
  const locale = detectLocale()
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

function CalendarModal({ locale, onClose }: { locale: 'de' | 'en'; onClose: () => void }) {
  const t = (k: string) => tr(k, locale)
  const [view, setView] = useState<ModalView>('month')
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [calendars, setCalendars] = useState<CalendarView[]>([])
  const [accounts, setAccounts] = useState<AccountView[]>([])
  const [events, setEvents] = useState<EventView[]>([])
  const [hidden, setHidden] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sd-cal-hidden') || '[]')) }
    catch { return new Set() }
  })
  const [eventDialog, setEventDialog] = useState<{ event: Partial<EventView> | null } | null>(null)
  const [accountDialog, setAccountDialog] = useState<'caldav' | 'ics' | null>(null)
  const [loading, setLoading] = useState(false)

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
      const key = ev.dtstart.slice(0, 10)
      ;(map[key] = map[key] || []).push(ev)
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.dtstart.localeCompare(b.dtstart))
    return map
  }, [events])

  const writableCalendars = calendars.filter(c => !c.readOnly)

  // ----- title -----
  const title = view === 'agenda'
    ? (locale === 'de' ? 'Agenda (nächste 30 Tage)' : 'Agenda (next 30 days)')
    : view === 'accounts' ? t('accounts')
    : cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)', zIndex: 9999,
        display: 'flex', alignItems: 'stretch', justifyContent: 'stretch',
      }}
    >
      <div style={{
        flex: 1, margin: '24px', background: 'var(--background)',
        border: '1px solid var(--border)', borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)', overflow: 'hidden',
        display: 'grid', gridTemplateRows: 'auto 1fr',
      }}>
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
              <ModalBtn onClick={() => setCursor(() => { const d = new Date(); d.setDate(1); return d })}>{t('todayBtn')}</ModalBtn>
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
        <div style={{ display: 'grid', gridTemplateColumns: view === 'accounts' ? '1fr' : '240px 1fr', overflow: 'hidden' }}>
          {view !== 'accounts' && (
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

          <main style={{ overflow: 'auto', background: 'var(--background)', minWidth: 0 }}>
            {view === 'month' && (
              <MonthView
                cursor={cursor}
                range={range}
                eventsByDay={eventsByDay}
                onClickDay={day => writableCalendars[0] && setEventDialog({ event: { calendarId: writableCalendars[0].id, allDay: true, dtstart: day.toISOString() } })}
                onClickEvent={ev => setEventDialog({ event: ev })}
              />
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
                onAddCaldav={() => setAccountDialog('caldav')}
                onAddIcs={() => setAccountDialog('ics')}
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
          provider={accountDialog}
          onClose={() => setAccountDialog(null)}
          onSaved={() => { setAccountDialog(null); refresh() }}
        />
      )}
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

function MonthView({ cursor, range, eventsByDay, onClickDay, onClickEvent }: {
  cursor: Date
  range: { start: Date; end: Date }
  eventsByDay: Record<string, EventView[]>
  onClickDay: (d: Date) => void
  onClickEvent: (ev: EventView) => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const month = cursor.getMonth()
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(range.start); d.setDate(range.start.getDate() + i)
    cells.push(d)
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
      gridAutoRows: 'minmax(96px, 1fr)', minHeight: '600px', height: '100%',
    }}>
      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => (
        <div key={w} style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--text-muted)', padding: '6px 8px', textAlign: 'right',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
        }}>{w}</div>
      ))}

      {cells.map((day, i) => {
        const key = day.toISOString().slice(0, 10)
        const dayEvents = eventsByDay[key] || []
        const visible = dayEvents.slice(0, 3)
        const more = dayEvents.length - visible.length
        const isOther = day.getMonth() !== month
        const isToday = day.getTime() === today.getTime()

        return (
          <div
            key={i}
            onClick={() => onClickDay(day)}
            style={{
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '4px 4px 4px 6px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              cursor: 'pointer',
              background: isOther ? 'rgba(0,0,0,0.10)' : undefined,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              {visible.map(ev => {
                const isConflict = ev.syncState === 'conflict'
                const isPending = ev.syncState !== 'synced' && ev.syncState !== 'local_new'
                return (
                  <button
                    key={ev.id}
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
                    {ev.allDay ? ev.summary : `${fmtTime(ev.dtstart, false)} ${ev.summary ?? ''}`}
                  </button>
                )
              })}
              {more > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'right', padding: '0 4px' }}>
                  + {more}
                </div>
              )}
            </div>
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
          }}>{fmtFullDay(new Date(k))}</div>
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
                {ev.allDay ? (locale === 'de' ? 'ganztägig' : 'all day') : fmtTime(ev.dtstart, false)}
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

function AccountsView({ accounts, calendars, locale, onAddCaldav, onAddIcs, onRefresh }: {
  accounts: AccountView[]
  calendars: CalendarView[]
  locale: 'de' | 'en'
  onAddCaldav: () => void
  onAddIcs: () => void
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
  onSaved: () => void
}) {
  const t = (k: string) => tr(k, locale)
  const isNew = !event?.id
  const isConflict = event?.syncState === 'conflict'

  const [form, setForm] = useState({
    calendarId: event?.calendarId ?? calendars[0]?.id ?? '',
    summary: event?.summary ?? '',
    description: event?.description ?? '',
    location: event?.location ?? '',
    dtstart: event?.dtstart ?? new Date().toISOString(),
    dtend: event?.dtend ?? '',
    allDay: event?.allDay ?? false,
    rrule: event?.rrule ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '4px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const save = async () => {
    setError(null)
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
      if (isNew) await api.createEvent(payload)
      else await api.updateEvent(event!.id!, payload)
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? String(e))
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
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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

          <Field label={t('title')}>
            <input style={inp} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <Field label={t('selectCalendar')}>
            <select style={inp} value={form.calendarId} onChange={e => setForm({ ...form, calendarId: e.target.value })}>
              {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
              <ModalBtn onClick={onClose}>{t('cancel')}</ModalBtn>
              <ModalBtn primary onClick={save}>{isNew ? t('add') : t('save')}</ModalBtn>
            </>
          )}
        </div>
      </div>
    </div>
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

function AccountDialog({ provider, locale, onClose, onSaved }: {
  provider: 'caldav' | 'ics'
  locale: 'de' | 'en'
  onClose: () => void
  onSaved: () => void
}) {
  const t = (k: string) => tr(k, locale)
  const [form, setForm] = useState({ name: '', url: '', username: '', password: '', verifySsl: true })
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
      const body =
        provider === 'caldav'
          ? { name: form.name || form.url, provider, caldav: { url: form.url, username: form.username, password: form.password, verifySsl: form.verifySsl } }
          : { name: form.name || form.url, provider, ics: { url: form.url, username: form.username || undefined, password: form.password || undefined } }
      await api.createAccount(body)
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            {provider === 'caldav' ? t('addCaldav') : t('addIcs')}
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
                <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
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
          <ModalBtn primary onClick={save}>{saving ? '…' : t('add')}</ModalBtn>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// Export
// ===========================================================================

export const component: PluginComponent = { Widget, Settings }
