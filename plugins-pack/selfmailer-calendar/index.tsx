'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const ACCENT = 'var(--accent, #14b8a6)'

type Ev = {
  id: number
  title: string
  description: string
  location: string
  start: string
  end: string
  all_day: boolean
  dav_account_id: number | null
  source_key: string
  source_name: string
  source_color: string
}
type Target = { key: string; label: string; color: string; primary: boolean }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

// ---------------------------------------------------------------------------
// Server-Proxy (kein Direktzugriff aus dem Browser)
// ---------------------------------------------------------------------------

async function callProxy(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plugins/selfmailer-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    const err = typeof json.error === 'string' ? json.error : `HTTP ${res.status}`
    throw new Error(err)
  }
  return json
}

async function fetchEvents(
  base: string,
  token: string,
  params: { days?: number; from?: string; to?: string },
): Promise<Ev[]> {
  const json = await callProxy({ action: 'summary', base, token, ...params })
  return Array.isArray(json.events) ? (json.events as Ev[]) : []
}

async function fetchTargets(base: string, token: string): Promise<Target[]> {
  const json = await callProxy({ action: 'targets', base, token })
  return Array.isArray(json.targets) ? (json.targets as Target[]) : []
}

async function createEvent(
  base: string,
  token: string,
  ev: { title: string; start: string; end: string; allDay: boolean; location?: string; target: string },
): Promise<void> {
  await callProxy({ action: 'create', base, token, ...ev })
}

function errorText(code: string, de: boolean): string {
  switch (code) {
    case 'unauthorized':
      return de ? 'Token ungültig — in den Einstellungen prüfen.' : 'Invalid token — check settings.'
    case 'missing_token':
      return de ? 'Token fehlt — in den Einstellungen eintragen.' : 'Token missing — add it in settings.'
    case 'invalid_url':
      return de ? 'Basis-URL ungültig.' : 'Invalid base URL.'
    case 'blocked_url':
      return de ? 'Adresse blockiert (SSRF-Schutz).' : 'Address blocked (SSRF guard).'
    case 'timeout':
      return de ? 'Zeitüberschreitung — SelfMailer erreichbar?' : 'Timed out — is SelfMailer reachable?'
    default:
      return de ? 'SelfMailer nicht erreichbar.' : 'SelfMailer not reachable.'
  }
}

// ---------------------------------------------------------------------------
// Datum/Zeit-Helfer
// ---------------------------------------------------------------------------

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Tages-Label relativ (Heute/Morgen) sonst Wochentag + Datum. */
function dayLabel(key: string, de: boolean): string {
  const today = localDateKey(new Date())
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  if (key === today) return de ? 'Heute' : 'Today'
  if (key === localDateKey(tmr)) return de ? 'Morgen' : 'Tomorrow'
  const d = new Date(key + 'T12:00:00')
  return d.toLocaleDateString(de ? 'de-DE' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short' })
}

function timeLabel(ev: Ev, de: boolean): string {
  if (ev.all_day) return de ? 'ganztägig' : 'all day'
  const d = new Date(ev.start)
  return d.toLocaleTimeString(de ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Eingaben des Formulars in ISO-UTC + all_day fuer SelfMailer umrechnen. */
function buildTimes(date: string, time: string): { start: string; end: string; allDay: boolean } {
  if (!time) {
    // Ganztags: Mitternacht UTC, Ende = Start (SelfMailer behandelt all_day-Ende inklusiv).
    const s = new Date(date + 'T00:00:00Z').toISOString()
    return { start: s, end: s, allDay: true }
  }
  const start = new Date(`${date}T${time}`) // lokale Zeit des Browsers
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { start: start.toISOString(), end: end.toISOString(), allDay: false }
}

// ---------------------------------------------------------------------------
// Monatsansicht-Helfer
// ---------------------------------------------------------------------------

type Cursor = { year: number; month: number } // month: 0-11

function shiftMonth(c: Cursor, delta: number): Cursor {
  const m = c.month + delta
  return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
}

function monthTitle(c: Cursor, de: boolean): string {
  return new Date(c.year, c.month, 1).toLocaleDateString(de ? 'de-DE' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/** Wochentagskuerzel Mo..So, lokalisiert. */
function weekdayLabels(de: boolean): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(de ? 'de-DE' : 'en-US', { weekday: 'short' }),
  )
}

/** 42 Tage (6 Wochen) ab dem Montag der ersten Monatswoche. */
function monthCells(c: Cursor): Date[] {
  const first = new Date(c.year, c.month, 1)
  const offset = (first.getDay() + 6) % 7 // Mo=0
  const start = new Date(first)
  start.setDate(1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/** Sichtbarer 6-Wochen-Bereich als ISO-Zeitfenster (fuer den Datenabruf). */
function monthRange(c: Cursor): { from: string; to: string } {
  const cells = monthCells(c)
  const from = new Date(cells[0])
  from.setHours(0, 0, 0, 0)
  const to = new Date(cells[41])
  to.setHours(23, 59, 59, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const base = str(config.base)
  const token = str(config.token)
  const days = Math.max(1, Math.min(366, num(config.days) || 30))
  const showTitle = config.showTitle !== false
  const allowAdd = config.showAdd !== false
  const title = config.title === undefined ? (de ? 'Kalender' : 'Calendar') : str(config.title)
  const defaultTarget = str(config.defaultTarget) || 'local'
  const refreshMs = Math.max(60, num(config.refreshSeconds) || 300) * 1000
  const configView: 'month' | 'agenda' = str(config.view) === 'agenda' ? 'agenda' : 'month'

  const [events, setEvents] = useState<Ev[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Ansicht (Monat/Agenda) — Default aus Einstellungen, Umschaltung pro Browser gemerkt.
  const [view, setView] = useState<'month' | 'agenda'>(() => {
    try {
      const v = localStorage.getItem('selfmailer-calendar.view')
      if (v === 'month' || v === 'agenda') return v
    } catch { /* egal */ }
    return configView
  })
  const setViewPersist = useCallback((v: 'month' | 'agenda') => {
    setView(v)
    try { localStorage.setItem('selfmailer-calendar.view', v) } catch { /* egal */ }
  }, [])
  const today = new Date()
  const [cursor, setCursor] = useState<Cursor>({ year: today.getFullYear(), month: today.getMonth() })
  const [selDay, setSelDay] = useState<string>(localDateKey(today))

  // Anlege-Formular
  const [adding, setAdding] = useState(false)
  const [targets, setTargets] = useState<Target[] | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fDate, setFDate] = useState(localDateKey(new Date()))
  const [fTime, setFTime] = useState('')
  const [fTarget, setFTarget] = useState(defaultTarget)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!base || !token) {
      setLoading(false)
      return
    }
    try {
      // Monatsansicht: den sichtbaren 6-Wochen-Bereich holen (auch Vergangenheit).
      // Agenda: kommende Termine ab heute (days).
      const params = view === 'month' ? monthRange(cursor) : { days }
      const ev = await fetchEvents(base, token, params)
      setEvents(ev)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base, token, days, view, cursor])

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), refreshMs)
    return () => clearInterval(t)
  }, [load, refreshMs])

  // Ziele erst beim Öffnen des Formulars holen (Google-Call vermeiden beim Pollen).
  const openAdd = useCallback(async () => {
    setAdding(true)
    setSaveErr(null)
    if (targets === null && base && token) {
      try {
        const t = await fetchTargets(base, token)
        setTargets(t)
        if (!t.some((x) => x.key === fTarget)) {
          const primary = t.find((x) => x.primary) ?? t[0]
          if (primary) setFTarget(primary.key)
        }
      } catch {
        setTargets([{ key: 'local', label: de ? 'Lokal' : 'Local', color: '', primary: false }])
      }
    }
  }, [targets, base, token, fTarget, de])

  const submit = useCallback(async () => {
    const t = fTitle.trim()
    if (!t || !fDate) return
    setSaving(true)
    setSaveErr(null)
    try {
      const times = buildTimes(fDate, fTime)
      await createEvent(base, token, { title: t, target: fTarget, ...times })
      setFTitle('')
      setFTime('')
      setAdding(false)
      await load()
    } catch (e) {
      setSaveErr(errorText(e instanceof Error ? e.message : String(e), de))
    } finally {
      setSaving(false)
    }
  }, [fTitle, fDate, fTime, fTarget, base, token, de, load])

  const grouped = useMemo(() => {
    const out = new Map<string, Ev[]>()
    for (const ev of events ?? []) {
      const key = localDateKey(new Date(ev.start))
      const arr = out.get(key) ?? []
      arr.push(ev)
      out.set(key, arr)
    }
    return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [events])

  // Tag → Termine (fuer das Monatsraster); je Tag nach Startzeit sortiert.
  const eventsByDay = useMemo(() => {
    const m = new Map<string, Ev[]>()
    for (const ev of events ?? []) {
      const key = localDateKey(new Date(ev.start))
      const arr = m.get(key) ?? []
      arr.push(ev)
      m.set(key, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.start.localeCompare(b.start))
    return m
  }, [events])

  const selDayEvents = eventsByDay.get(selDay) ?? []

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '10px 12px 12px',
    containerType: 'size',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }
  const centered: CSSProperties = {
    ...shell,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  }

  if (!base || !token) {
    return (
      <div style={centered}>
        <span style={{ fontSize: 28 }}>📅</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
          {de
            ? 'SelfMailer-Basis-URL und Token in den Einstellungen eintragen.'
            : 'Add SelfMailer base URL and token in settings.'}
        </p>
      </div>
    )
  }

  if (loading && events === null) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[55, 80, 45, 70, 60].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 4 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && events === null) {
    return (
      <div style={centered}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8, wordBreak: 'break-word' }}>
          {errorText(error, de)}
        </p>
      </div>
    )
  }

  const dot = (color: string): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
    background: color || ACCENT,
  })

  return (
    <div style={shell}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {showTitle ? (
          <p
            style={{
              margin: 0,
              flex: 1,
              fontSize: 'clamp(9px, 2.4cqmin, 10px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            {title}
          </p>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {/* Ansichts-Umschalter: Monatsraster / Agenda-Liste */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setViewPersist('month')}
            title={de ? 'Monat' : 'Month'}
            style={toggleBtn(view === 'month')}
          >
            ▦
          </button>
          <button
            type="button"
            onClick={() => setViewPersist('agenda')}
            title={de ? 'Liste' : 'List'}
            style={toggleBtn(view === 'agenda')}
          >
            ☰
          </button>
        </div>
        {allowAdd ? (
          <button
            type="button"
            onClick={() => (adding ? setAdding(false) : void openAdd())}
            title={de ? 'Termin anlegen' : 'Add event'}
            style={{
              border: '1px solid var(--border)',
              background: adding ? ACCENT : 'var(--surface)',
              color: adding ? '#04201c' : 'var(--text)',
              borderRadius: 6,
              width: 24,
              height: 24,
              fontSize: 15,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {adding ? '×' : '＋'}
          </button>
        ) : null}
      </div>

      {/* Anlege-Formular */}
      {adding ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 10,
            padding: 8,
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--surface)',
          }}
        >
          <input
            value={fTitle}
            onChange={(e) => setFTitle(e.target.value)}
            placeholder={de ? 'Titel' : 'Title'}
            autoFocus
            style={miniInp}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} style={{ ...miniInp, flex: 1 }} />
            <input
              type="time"
              value={fTime}
              onChange={(e) => setFTime(e.target.value)}
              title={de ? 'leer = ganztägig' : 'empty = all day'}
              style={{ ...miniInp, width: 92 }}
            />
          </div>
          <select value={fTarget} onChange={(e) => setFTarget(e.target.value)} style={miniInp}>
            {(targets ?? [{ key: 'local', label: de ? 'Lokal' : 'Local', color: '', primary: false }]).map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
                {t.primary ? ' ★' : ''}
              </option>
            ))}
          </select>
          {saveErr ? <p style={{ margin: 0, fontSize: 10, color: '#ef4444' }}>{saveErr}</p> : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || !fTitle.trim()}
            style={{
              ...miniInp,
              cursor: 'pointer',
              background: ACCENT,
              color: '#04201c',
              fontWeight: 700,
              borderColor: ACCENT,
              opacity: saving || !fTitle.trim() ? 0.6 : 1,
            }}
          >
            {saving ? (de ? 'Speichere…' : 'Saving…') : de ? 'Anlegen' : 'Add'}
          </button>
        </div>
      ) : null}

      {/* Monatsraster */}
      {view === 'month' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <button type="button" onClick={() => setCursor((c) => shiftMonth(c, -1))} title="‹" style={navBtn}>‹</button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 'clamp(10px, 2.8cqmin, 12px)', fontWeight: 700, color: 'var(--text)' }}>
              {monthTitle(cursor, de)}
            </span>
            <button type="button" onClick={() => setCursor((c) => shiftMonth(c, 1))} title="›" style={navBtn}>›</button>
            <button
              type="button"
              onClick={() => {
                const n = new Date()
                setCursor({ year: n.getFullYear(), month: n.getMonth() })
                setSelDay(localDateKey(n))
              }}
              title={de ? 'Heute' : 'Today'}
              style={{ ...navBtn, width: 'auto', padding: '0 6px', fontSize: 10 }}
            >
              {de ? 'Heute' : 'Today'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
            {weekdayLabels(de).map((w) => (
              <span key={w} style={{ textAlign: 'center', fontSize: 'clamp(7px, 2cqmin, 9px)', color: 'var(--text-muted)', fontWeight: 600 }}>
                {w}
              </span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 1, flex: 1, minHeight: 0 }}>
            {monthCells(cursor).map((d) => {
              const key = localDateKey(d)
              const dayEvs = eventsByDay.get(key) ?? []
              const outside = d.getMonth() !== cursor.month
              const isToday = key === localDateKey(today)
              const isSel = key === selDay
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelDay(key)}
                  style={{
                    position: 'relative',
                    border: isSel ? `1px solid ${ACCENT}` : '1px solid transparent',
                    borderRadius: 4,
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1,
                    opacity: outside ? 0.4 : 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(8px, 2.4cqmin, 11px)',
                      width: '1.7em',
                      height: '1.7em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      color: isToday ? '#04201c' : 'var(--text)',
                      background: isToday ? ACCENT : 'transparent',
                      fontWeight: isToday ? 700 : 400,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {d.getDate()}
                  </span>
                  {dayEvs.length > 0 ? (
                    <span
                      style={{
                        fontSize: 'clamp(7px, 1.8cqmin, 9px)',
                        minWidth: '1.4em',
                        height: '1.4em',
                        padding: '0 0.3em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 999,
                        color: '#04201c',
                        background: dayEvs[0].source_color || ACCENT,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {dayEvs.length}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 6, borderTop: '1px solid var(--border)', paddingTop: 6, maxHeight: '36%', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 3px', fontSize: 'clamp(9px, 2.4cqmin, 11px)', fontWeight: 700, color: 'var(--text)' }}>
              {dayLabel(selDay, de)}
            </p>
            {selDayEvents.length === 0 ? (
              <p style={{ margin: 0, fontSize: 'clamp(9px, 2.4cqmin, 11px)', color: 'var(--text-muted)' }}>
                {de ? 'Keine Termine.' : 'No events.'}
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selDayEvents.map((ev) => (
                  <li
                    key={ev.id}
                    title={`${ev.title}${ev.location ? `\n📍 ${ev.location}` : ''}${ev.source_name ? `\n🗓 ${ev.source_name}` : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}
                  >
                    <span style={dot(ev.source_color)} />
                    <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 11px)', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums', minWidth: 38 }}>
                      {timeLabel(ev, de)}
                    </span>
                    <span style={{ fontSize: 'clamp(10px, 2.8cqmin, 12px)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title || (de ? '(ohne Titel)' : '(no title)')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
      /* Agenda-Liste */
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {grouped.length === 0 ? (
          <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
            {de ? 'Keine Termine in den nächsten Tagen. 🎉' : 'No events coming up. 🎉'}
          </p>
        ) : (
          grouped.map(([key, evs]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <p
                style={{
                  margin: '0 0 3px',
                  fontSize: 'clamp(9px, 2.4cqmin, 11px)',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {dayLabel(key, de)}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {evs.map((ev) => (
                  <li
                    key={ev.id}
                    title={`${ev.title}${ev.location ? `\n📍 ${ev.location}` : ''}${
                      ev.source_name ? `\n🗓 ${ev.source_name}` : ''
                    }`}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}
                  >
                    <span style={dot(ev.source_color)} />
                    <span
                      style={{
                        fontSize: 'clamp(9px, 2.4cqmin, 11px)',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 38,
                      }}
                    >
                      {timeLabel(ev, de)}
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(10px, 2.8cqmin, 12px)',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.title || (de ? '(ohne Titel)' : '(no title)')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  )
}

const navBtn: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  borderRadius: 6,
  width: 22,
  height: 22,
  fontSize: 13,
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
}

function toggleBtn(active: boolean): CSSProperties {
  return {
    border: `1px solid ${active ? ACCENT : 'var(--border)'}`,
    background: active ? ACCENT : 'var(--surface)',
    color: active ? '#04201c' : 'var(--text)',
    borderRadius: 6,
    width: 24,
    height: 24,
    fontSize: 12,
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  }
}

const miniInp: CSSProperties = {
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--bg, var(--surface))',
  color: 'var(--text)',
  fontSize: 12,
  boxSizing: 'border-box',
  outline: 'none',
  width: '100%',
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const inp: CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
}
const lbl: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 4,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [targets, setTargets] = useState<Target[] | null>(null)

  const test = useCallback(async () => {
    setTesting(true)
    setResult(null)
    try {
      const t = await fetchTargets(str(config.base), str(config.token))
      setTargets(t)
      const writable = t.filter((x) => x.key !== 'local').length
      setResult(
        de
          ? `✅ OK — ${t.length} Ziel-Kalender (${writable} beschreibbar bei Google).`
          : `✅ OK — ${t.length} target calendars (${writable} writable on Google).`,
      )
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e)
      setResult(`⚠️ ${errorText(code, de)}`)
    } finally {
      setTesting(false)
    }
  }, [config.base, config.token, de])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>{de ? 'SelfMailer Basis-URL' : 'SelfMailer base URL'}</label>
        <input
          style={inp}
          value={str(config.base)}
          onChange={(e) => onChange('base', e.target.value)}
          placeholder="http://192.168.1.10:8090"
        />
      </div>

      <div>
        <label style={lbl}>Token</label>
        <input
          style={inp}
          type="password"
          value={str(config.token)}
          onChange={(e) => onChange('token', e.target.value)}
          placeholder={de ? 'Feed-/Dashboard-Token aus SelfMailer' : 'Feed/dashboard token from SelfMailer'}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'SelfMailer → Einstellungen → Feeds/Export: persönlichen Token kopieren (derselbe wie fürs Mail-Widget).'
            : 'SelfMailer → Settings → Feeds/Export: copy your personal token (same as the mail widget).'}
        </p>
      </div>

      <div>
        <label style={lbl}>{de ? 'Zeitraum (Tage)' : 'Window (days)'}</label>
        <input
          style={inp}
          type="number"
          min={1}
          max={366}
          value={num(config.days) || 30}
          onChange={(e) => onChange('days', Math.max(1, Math.min(366, num(e.target.value) || 30)))}
        />
      </div>

      <div>
        <label style={lbl}>{de ? 'Standard-Ziel-Kalender' : 'Default target calendar'}</label>
        {targets && targets.length > 0 ? (
          <select style={inp} value={str(config.defaultTarget) || 'local'} onChange={(e) => onChange('defaultTarget', e.target.value)}>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
                {t.primary ? ' ★' : ''}
              </option>
            ))}
          </select>
        ) : (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de
              ? 'Erst „Verbindung testen", dann erscheinen hier die Kalender zur Auswahl.'
              : 'Run “Test connection” to load selectable calendars here.'}
          </p>
        )}
      </div>

      <div>
        <label style={lbl}>{de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}</label>
        <input
          style={inp}
          type="number"
          min={60}
          max={3600}
          value={num(config.refreshSeconds) || 300}
          onChange={(e) => onChange('refreshSeconds', Math.max(60, num(e.target.value) || 300))}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.showAdd !== false} onChange={(e) => onChange('showAdd', e.target.checked)} />
        {de ? 'Termine anlegen erlauben (＋)' : 'Allow adding events (＋)'}
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.showTitle !== false} onChange={(e) => onChange('showTitle', e.target.checked)} />
        {de ? 'Titel oben anzeigen' : 'Show title at top'}
      </label>
      <input
        style={{ ...inp, opacity: config.showTitle !== false ? 1 : 0.5 }}
        disabled={config.showTitle === false}
        value={config.title === undefined ? (de ? 'Kalender' : 'Calendar') : str(config.title)}
        placeholder={de ? 'Kalender' : 'Calendar'}
        onChange={(e) => onChange('title', e.target.value)}
      />

      <button
        type="button"
        onClick={() => void test()}
        disabled={testing}
        style={{ ...inp, cursor: 'pointer', background: ACCENT, color: '#04201c', fontWeight: 700, borderColor: ACCENT }}
      >
        {testing ? (de ? 'Teste…' : 'Testing…') : de ? 'Verbindung testen' : 'Test connection'}
      </button>
      {result ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{result}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const meta: PluginMeta = {
  id: 'selfmailer-calendar',
  name: 'SelfMailer Kalender',
  description:
    'Kommende Termine aus SelfMailer anzeigen UND neue anlegen — direkt in SelfMailer mit automatischem Google-Push. Quelle: SelfMailer-Server (Basis-URL + Token).',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '📅',
  defaultLayout: { w: 4, h: 4, minW: 2, minH: 3 },
  configSchema: [
    { key: 'base', label: 'SelfMailer Basis-URL', type: 'text', defaultValue: '' },
    { key: 'token', label: 'Token', type: 'text', defaultValue: '' },
    { key: 'days', label: 'Zeitraum (Tage)', type: 'number', defaultValue: 30 },
    { key: 'defaultTarget', label: 'Standard-Ziel-Kalender', type: 'text', defaultValue: 'local' },
    { key: 'refreshSeconds', label: 'Aktualisierung (Sek.)', type: 'number', defaultValue: 300 },
    { key: 'showAdd', label: 'Termine anlegen erlauben', type: 'boolean', defaultValue: true },
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Kalender' },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
