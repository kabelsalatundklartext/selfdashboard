'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const ACCENT = 'var(--accent, #14b8a6)'
// Default-Kalenderfarbe (teal) wie im alten Kalender-Plugin — wenn ein Termin
// keine eigene Quell-Farbe hat. Bewusst NICHT der --accent (im Dashboard gruen).
const CAL_FALLBACK = '#2dd4bf'

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

type CalInfo = { key: string; name: string; color: string }

async function fetchAllCalendars(base: string, token: string): Promise<CalInfo[]> {
  const json = await callProxy({ action: 'calendars', base, token })
  return Array.isArray(json.calendars) ? (json.calendars as CalInfo[]) : []
}

async function createEvent(
  base: string,
  token: string,
  ev: { title: string; start: string; end: string; allDay: boolean; location?: string; description?: string; target: string },
): Promise<void> {
  await callProxy({ action: 'create', base, token, ...ev })
}

async function updateEvent(
  base: string,
  token: string,
  id: number,
  ev: { title: string; start: string; end: string; allDay: boolean; location?: string; description?: string },
): Promise<void> {
  await callProxy({ action: 'update', base, token, id, ...ev })
}

async function deleteEvent(base: string, token: string, id: number): Promise<void> {
  await callProxy({ action: 'delete', base, token, id })
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

/** Lokale Uhrzeit HH:MM (fuer die Vorbelegung des Bearbeiten-Formulars). */
function localHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Tages-Label: Wochentag (kurz) + Tag + Monat — wie das alte Kalender-Plugin
    (z. B. „Di., 23. Juni"), bewusst OHNE „Heute/Morgen". */
function dayLabel(key: string, de: boolean): string {
  const d = new Date(key + 'T12:00:00')
  return d.toLocaleDateString(de ? 'de-DE' : 'en-US', { weekday: 'short', day: '2-digit', month: 'long' })
}

function timeLabel(ev: Ev, de: boolean): string {
  if (ev.all_day) return de ? 'ganztägig' : 'all day'
  const d = new Date(ev.start)
  return d.toLocaleTimeString(de ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Formular-Eingaben (Beginn/Ende, Ganztags) in ISO-UTC + all_day umrechnen. */
function buildTimes(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  allDay: boolean,
): { start: string; end: string; allDay: boolean } {
  if (allDay) {
    // Ganztags: Mitternacht UTC; Ende = Enddatum (oder Startdatum), inklusiv.
    const s = new Date(startDate + 'T00:00:00Z').toISOString()
    const e = new Date((endDate || startDate) + 'T00:00:00Z').toISOString()
    return { start: s, end: e, allDay: true }
  }
  // lokale Zeit des Browsers → UTC. Ohne Startzeit: 00:00. Ohne Endwert: Start + 1 h.
  const start = new Date(`${startDate}T${startTime || '00:00'}`)
  const end =
    endDate && endTime
      ? new Date(`${endDate}T${endTime}`)
      : new Date(start.getTime() + 60 * 60 * 1000)
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

  // Anlege-/Bearbeiten-Formular
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null) // null = Anlegen, sonst Event-ID
  const [editEv, setEditEv] = useState<Ev | null>(null)      // Original (fuer Quelle/Loeschen)
  const [dayModal, setDayModal] = useState<string | null>(null) // Tag-Fenster (Datums-Key)
  const [targets, setTargets] = useState<Target[] | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fDate, setFDate] = useState(localDateKey(new Date()))
  const [fTime, setFTime] = useState('')
  const [fEndDate, setFEndDate] = useState(localDateKey(new Date()))
  const [fEndTime, setFEndTime] = useState('')
  const [fAllDay, setFAllDay] = useState(false)
  const [fLocation, setFLocation] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fTarget, setFTarget] = useState(defaultTarget)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  // Kalender-Filter (Zahnrad): ausgeblendete Quell-Kalender, pro Browser gemerkt.
  const [allCals, setAllCals] = useState<CalInfo[]>([]) // vollstaendige Liste vom Server
  const [gearOpen, setGearOpen] = useState(false)
  const [hiddenSrc, setHiddenSrc] = useState<Set<string>>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('selfmailer-calendar.hidden') || '[]')
      return new Set(Array.isArray(v) ? v.map(String) : [])
    } catch {
      return new Set()
    }
  })
  const toggleSrc = useCallback((key: string) => {
    setHiddenSrc((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem('selfmailer-calendar.hidden', JSON.stringify([...next])) } catch { /* egal */ }
      return next
    })
  }, [])

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

  const { active } = usePollingActive()

  useEffect(() => {
    if (!active) return
    void load()
    const t = setInterval(() => void load(), refreshMs)
    return () => clearInterval(t)
  }, [active, load, refreshMs])

  // Vollstaendige Kalenderliste (alle Kalender, auch leere) — einmalig je base/token,
  // NICHT beim Polling (Google-Call). Fuer den Zahnrad-Filter.
  useEffect(() => {
    if (!base || !token) return
    let alive = true
    fetchAllCalendars(base, token)
      .then((cs) => { if (alive) setAllCals(cs) })
      .catch(() => { /* Filter faellt sonst auf Event-Quellen zurueck */ })
    return () => { alive = false }
  }, [base, token])

  // Ziele erst beim Öffnen des Formulars holen (Google-Call vermeiden beim Pollen).
  // Optionales Datum (Klick auf einen Tag) belegt das Formular vor.
  const ensureTargets = useCallback(async () => {
    if (targets !== null || !base || !token) return
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
  }, [targets, base, token, fTarget, de])

  const openAdd = useCallback(async (date?: string) => {
    const d = date || selDay || localDateKey(new Date())
    setEditId(null)
    setEditEv(null)
    setFDate(d)
    setFEndDate(d)
    setFTitle('')
    setFTime('')
    setFEndTime('')
    setFAllDay(false)
    setFLocation('')
    setFNotes('')
    setDayModal(null)
    setAdding(true)
    setSaveErr(null)
    await ensureTargets()
  }, [selDay, ensureTargets])

  // Termin bearbeiten: Formular aus dem Event vorbelegen (UTC → lokale Eingabe).
  const openEdit = useCallback(async (ev: Ev) => {
    const s = new Date(ev.start)
    const e = new Date(ev.end)
    setEditId(ev.id)
    setEditEv(ev)
    setFTitle(ev.title)
    setFAllDay(ev.all_day)
    setFDate(localDateKey(s))
    setFEndDate(localDateKey(e))
    setFTime(ev.all_day ? '' : localHM(s))
    setFEndTime(ev.all_day ? '' : localHM(e))
    setFLocation(ev.location || '')
    setFNotes(ev.description || '')
    setDayModal(null)
    setAdding(true)
    setSaveErr(null)
    await ensureTargets()
  }, [ensureTargets])

  const submit = useCallback(async () => {
    const t = fTitle.trim()
    if (!t || !fDate) return
    setSaving(true)
    setSaveErr(null)
    try {
      const times = buildTimes(fDate, fTime, fEndDate, fEndTime, fAllDay)
      if (editId != null) {
        await updateEvent(base, token, editId, {
          title: t,
          location: fLocation.trim(),
          description: fNotes.trim(),
          ...times,
        })
      } else {
        await createEvent(base, token, {
          title: t,
          target: fTarget,
          location: fLocation.trim(),
          description: fNotes.trim(),
          ...times,
        })
      }
      setAdding(false)
      setEditId(null)
      setEditEv(null)
      await load()
    } catch (e) {
      setSaveErr(errorText(e instanceof Error ? e.message : String(e), de))
    } finally {
      setSaving(false)
    }
  }, [editId, fTitle, fDate, fTime, fEndDate, fEndTime, fAllDay, fLocation, fNotes, fTarget, base, token, de, load])

  const removeEv = useCallback(async () => {
    if (editId == null) return
    setSaving(true)
    setSaveErr(null)
    try {
      await deleteEvent(base, token, editId)
      setAdding(false)
      setEditId(null)
      setEditEv(null)
      await load()
    } catch (e) {
      setSaveErr(errorText(e instanceof Error ? e.message : String(e), de))
    } finally {
      setSaving(false)
    }
  }, [editId, base, token, de, load])

  // Sichtbare Events nach Kalender-Filter (Zahnrad).
  const shownEvents = useMemo(
    () => (events ?? []).filter((e) => !hiddenSrc.has(e.source_key || `dav:${e.dav_account_id ?? 'local'}`)),
    [events, hiddenSrc],
  )
  // Quell-Kalender fuer die Zahnrad-Liste: vollstaendige Server-Liste (ALLE
  // Kalender, auch ohne Termine) als Basis, ergaenzt um Event-Quellen, die dort
  // nicht stehen (z. B. CalDAV) — so fehlt kein Kalender mehr.
  const sources = useMemo(() => {
    const m = new Map<string, { key: string; name: string; color: string }>()
    for (const c of allCals) m.set(c.key, { key: c.key, name: c.name, color: c.color || '' })
    for (const e of events ?? []) {
      const key = e.source_key || `dav:${e.dav_account_id ?? 'local'}`
      if (!m.has(key)) m.set(key, { key, name: e.source_name || (key === 'local' ? 'Lokal' : key), color: e.source_color || '' })
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allCals, events])

  const grouped = useMemo(() => {
    const out = new Map<string, Ev[]>()
    for (const ev of shownEvents) {
      const key = localDateKey(new Date(ev.start))
      const arr = out.get(key) ?? []
      arr.push(ev)
      out.set(key, arr)
    }
    return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [shownEvents])

  // Tag → Termine (fuer das Monatsraster); je Tag nach Startzeit sortiert.
  const eventsByDay = useMemo(() => {
    const m = new Map<string, Ev[]>()
    for (const ev of shownEvents) {
      const key = localDateKey(new Date(ev.start))
      const arr = m.get(key) ?? []
      arr.push(ev)
      m.set(key, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.start.localeCompare(b.start))
    return m
  }, [shownEvents])

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
            onClick={() => void openAdd()}
            title={de ? 'Termin anlegen' : 'Add event'}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 6,
              width: 24,
              height: 24,
              fontSize: 15,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ＋
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void load()}
          title={de ? 'Aktualisieren' : 'Refresh'}
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 6,
            width: 24,
            height: 24,
            fontSize: 13,
            lineHeight: 1,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ⟳
        </button>
        {sources.length > 0 ? (
          <button
            type="button"
            onClick={() => setGearOpen(true)}
            title={de ? 'Kalender anzeigen/ausblenden' : 'Show/hide calendars'}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: 6,
              width: 24,
              height: 24,
              fontSize: 13,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ⚙
          </button>
        ) : null}
      </div>

      {/* Monatsraster (1:1 wie das Kalender-Plugin) */}
      {view === 'month' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" onClick={() => setCursor((c) => shiftMonth(c, -1))} title="‹" style={navBtn}>‹</button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 'clamp(11px, 3cqmin, 13px)', fontWeight: 700, color: 'var(--text)' }}>
              {monthTitle(cursor, de)}
            </span>
            <button type="button" onClick={() => setCursor((c) => shiftMonth(c, 1))} title="›" style={navBtn}>›</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0 6px' }}>
            <button
              type="button"
              onClick={() => {
                const n = new Date()
                setCursor({ year: n.getFullYear(), month: n.getMonth() })
                setSelDay(localDateKey(n))
              }}
              style={{ ...navBtn, width: 'auto', height: 20, padding: '0 10px', fontSize: 10, fontWeight: 600 }}
            >
              {de ? 'Heute' : 'Today'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg, var(--surface))', borderRadius: 6, padding: '6px 0', marginBottom: 3 }}>
            {weekdayLabels(de).map((w, i) => (
              <span
                key={w}
                style={{
                  textAlign: 'center',
                  fontSize: 'clamp(8px, 2.4cqmin, 11px)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  opacity: i >= 5 ? 0.6 : 1,
                }}
              >
                {w}
              </span>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: '1fr',
              gap: 1,
              background: 'var(--border)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
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
                  onClick={() => {
                    setSelDay(key)
                    setDayModal(key)
                  }}
                  style={{
                    position: 'relative',
                    border: 'none',
                    boxShadow: isSel ? `inset 0 0 0 2px ${ACCENT}` : 'none',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    padding: '2px 3px',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1,
                    opacity: outside ? 0.4 : 1,
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span
                      style={{
                        fontSize: 'clamp(8px, 2.4cqmin, 11px)',
                        minWidth: '1.6em',
                        height: '1.6em',
                        display: 'inline-flex',
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
                  </span>
                  {dayEvs.length > 0 ? (
                    <span style={{ display: 'flex', justifyContent: 'center' }}>
                      <span
                        style={{
                          fontSize: 'clamp(7px, 1.8cqmin, 9px)',
                          minWidth: '1.4em',
                          height: '1.4em',
                          padding: '0 0.3em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          color: '#04201c',
                          background: dayEvs[0].source_color || CAL_FALLBACK,
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {dayEvs.length}
                      </span>
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          {/* Termine des gewaehlten Tages — wie die Detailliste im Kalender-Plugin */}
          <div style={{ marginTop: 8, maxHeight: '34%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <p style={{ margin: 0, flex: 1, fontSize: 'clamp(9px, 2.4cqmin, 12px)', fontWeight: 700, color: 'var(--text)' }}>
                {dayLabel(selDay, de)}
                {selDayEvents.length > 0 ? ` (${selDayEvents.length})` : ''}
              </p>
              {allowAdd ? (
                <button type="button" onClick={() => void openAdd(selDay)} title={de ? 'Termin anlegen' : 'Add event'} style={{ ...navBtn, width: 22, height: 22, fontSize: 14 }}>
                  ＋
                </button>
              ) : null}
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selDayEvents.length === 0 ? (
                <p style={{ margin: 0, fontSize: 'clamp(9px, 2.4cqmin, 11px)', color: 'var(--text-muted)' }}>
                  {de ? 'Keine Termine an diesem Tag' : 'No events on this day'}
                </p>
              ) : (
                selDayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => void openEdit(ev)}
                    title={`${ev.title}${ev.location ? `\n📍 ${ev.location}` : ''}${ev.source_name ? `\n🗓 ${ev.source_name}` : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      minWidth: 0,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: 'none',
                      borderLeft: `3px solid ${ev.source_color || CAL_FALLBACK}`,
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 11px)', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)' }}>
                      {timeLabel(ev, de)}
                    </span>
                    <span style={{ fontSize: 'clamp(10px, 2.8cqmin, 12px)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title || (de ? '(ohne Titel)' : '(no title)')}
                    </span>
                  </button>
                ))
              )}
            </div>
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
                    onClick={() => void openEdit(ev)}
                    title={`${ev.title}${ev.location ? `\n📍 ${ev.location}` : ''}${
                      ev.source_name ? `\n🗓 ${ev.source_name}` : ''
                    }`}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, cursor: 'pointer' }}
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
      {adding && allowAdd && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setAdding(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 'min(360px, 92vw)',
                  background: 'var(--surface, #1b1b1f)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ margin: 0, flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {editId != null ? (de ? 'Termin bearbeiten' : 'Edit event') : de ? 'Neuer Termin' : 'New event'}
                  </p>
                  <button type="button" onClick={() => setAdding(false)} title={de ? 'Schließen' : 'Close'} style={{ ...navBtn, width: 26, height: 26, fontSize: 15 }}>
                    ×
                  </button>
                </div>
                <div>
                  <label style={modalLbl}>{de ? 'Titel' : 'Title'}</label>
                  <input
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                    placeholder={de ? 'Titel' : 'Title'}
                    autoFocus
                    style={modalInp}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void submit()
                    }}
                  />
                </div>
                <div>
                  <label style={modalLbl}>{de ? 'Kalender' : 'Calendar'}</label>
                  {editId != null ? (
                    <input value={editEv?.source_name || (de ? 'Lokal' : 'Local')} disabled style={{ ...modalInp, opacity: 0.7 }} />
                  ) : (
                    <select value={fTarget} onChange={(e) => setFTarget(e.target.value)} style={modalInp}>
                      {(targets ?? [{ key: 'local', label: de ? 'Lokal' : 'Local', color: '', primary: false }]).map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                          {t.primary ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fAllDay} onChange={(e) => setFAllDay(e.target.checked)} />
                  {de ? 'Ganztägig' : 'All day'}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={modalLbl}>{de ? 'Beginn' : 'Start'}</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} style={{ ...modalInp, flex: 1, minWidth: 0 }} />
                      {!fAllDay ? (
                        <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)} style={{ ...modalInp, width: 86 }} />
                      ) : null}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={modalLbl}>{de ? 'Ende' : 'End'}</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} style={{ ...modalInp, flex: 1, minWidth: 0 }} />
                      {!fAllDay ? (
                        <input type="time" value={fEndTime} onChange={(e) => setFEndTime(e.target.value)} style={{ ...modalInp, width: 86 }} />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={modalLbl}>{de ? 'Ort' : 'Location'}</label>
                  <input value={fLocation} onChange={(e) => setFLocation(e.target.value)} placeholder={de ? 'Ort' : 'Location'} style={modalInp} />
                </div>
                <div>
                  <label style={modalLbl}>{de ? 'Notizen' : 'Notes'}</label>
                  <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} style={{ ...modalInp, resize: 'vertical', minHeight: 48 }} />
                </div>
                {saveErr ? <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{saveErr}</p> : null}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  {editId != null ? (
                    <button
                      type="button"
                      onClick={() => void removeEv()}
                      disabled={saving}
                      style={{ ...modalInp, width: 'auto', padding: '8px 14px', cursor: 'pointer', color: '#ef4444', borderColor: 'var(--border)' }}
                    >
                      {de ? 'Löschen' : 'Delete'}
                    </button>
                  ) : null}
                  <span style={{ flex: 1 }} />
                  <button type="button" onClick={() => setAdding(false)} style={{ ...modalInp, width: 'auto', padding: '8px 14px', cursor: 'pointer' }}>
                    {de ? 'Abbrechen' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={saving || !fTitle.trim()}
                    style={{
                      ...modalInp,
                      width: 'auto',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      background: ACCENT,
                      color: '#04201c',
                      fontWeight: 700,
                      borderColor: ACCENT,
                      opacity: saving || !fTitle.trim() ? 0.6 : 1,
                    }}
                  >
                    {saving ? (de ? 'Speichere…' : 'Saving…') : editId != null ? (de ? 'Speichern' : 'Save') : de ? 'Anlegen' : 'Add'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {dayModal && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setDayModal(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 'min(420px, 92vw)',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--surface, #1b1b1f)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <p style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {dayLabel(dayModal, de)}
                    {(eventsByDay.get(dayModal)?.length ?? 0) > 0 ? (
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                        {'  '}({eventsByDay.get(dayModal)?.length} {de ? 'Termine' : 'events'})
                      </span>
                    ) : null}
                  </p>
                  <button type="button" onClick={() => setDayModal(null)} title={de ? 'Schließen' : 'Close'} style={{ ...navBtn, width: 26, height: 26, fontSize: 15 }}>
                    ×
                  </button>
                </div>
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
                  {(eventsByDay.get(dayModal)?.length ?? 0) === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{de ? 'Keine Termine an diesem Tag' : 'No events on this day'}</p>
                  ) : (
                    (eventsByDay.get(dayModal) ?? []).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => void openEdit(ev)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          borderLeft: `3px solid ${ev.source_color || CAL_FALLBACK}`,
                          background: 'var(--bg, var(--surface))',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)', flexShrink: 0, minWidth: 44 }}>
                          {timeLabel(ev, de)}
                        </span>
                        <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title || (de ? '(ohne Titel)' : '(no title)')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="button" onClick={() => setDayModal(null)} style={{ ...modalInp, width: 'auto', padding: '8px 14px', cursor: 'pointer' }}>
                    {de ? 'Schließen' : 'Close'}
                  </button>
                  {allowAdd ? (
                    <button
                      type="button"
                      onClick={() => void openAdd(dayModal)}
                      style={{ ...modalInp, width: 'auto', padding: '8px 16px', cursor: 'pointer', background: ACCENT, color: '#04201c', fontWeight: 700, borderColor: ACCENT }}
                    >
                      ＋ {de ? 'Termin' : 'Event'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {gearOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setGearOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 'min(340px, 92vw)',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  background: 'var(--surface, #1b1b1f)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ margin: 0, flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    {de ? 'Kalender anzeigen' : 'Show calendars'}
                  </p>
                  <button type="button" onClick={() => setGearOpen(false)} title={de ? 'Schließen' : 'Close'} style={{ ...navBtn, width: 26, height: 26, fontSize: 15 }}>
                    ×
                  </button>
                </div>
                {sources.map((s) => {
                  const visible = !hiddenSrc.has(s.key)
                  return (
                    <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer', padding: '4px 2px' }}>
                      <input type="checkbox" checked={visible} onChange={() => toggleSrc(s.key)} />
                      <span style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: s.color || ACCENT }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

const modalInp: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg, var(--surface))',
  color: 'var(--text)',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
  width: '100%',
}

const modalLbl: CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: 4,
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
  version: '1.7.0',
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
