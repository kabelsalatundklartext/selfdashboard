'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Bolt, Calendar, CalendarDays, ChevronLeft, ChevronRight, Zap, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import { reportPluginCatch } from '@/lib/pluginLog'

export const meta: PluginMeta = {
  id: 'fritz-energy',
  name: 'FRITZ! Steckdose Energie',
  description: 'Stromverbrauch FRITZ!Smart Energy / Steckdose per TR-064 (aktuell, heute, 7 Tage, Monat).',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '⚡',
  iconUrl: '/plugin-logos/fritzbox.svg',
  defaultLayout: { w: 2, h: 3, minW: 2, minH: 2 },
}

type EnergyPayload = {
  ok: boolean
  error?: string
  currentPowerW?: number
  todayKwh?: number
  last7DaysKwh?: number
  monthKwh?: number
  energyWhTotal?: number
  voltageV?: number | null
  fetchedAt?: string
  recent?: { t: number; powerW: number; energyWh: number }[]
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function pluginDe(r: Record<string, unknown>, dashboardDe: boolean): boolean {
  const lang = str(r.uiLanguage).toLowerCase()
  if (lang === 'de') return true
  if (lang === 'en') return false
  return dashboardDe
}

function fritzEnergyError(code: string, de: boolean): string {
  const base = code.split(':')[0]
  switch (base) {
    case 'unauthorized':
      return de
        ? 'Anmeldung fehlgeschlagen — Benutzername und Passwort prüfen (FRITZ!Box-Benutzer mit TR-064-Recht).'
        : 'Login failed — check username and password (FRITZ!Box user with TR-064 access).'
    case 'desc_not_found':
      return de
        ? 'TR-064 nicht erreichbar — Basis-URL (http://192.168.1.1), Benutzer/Passwort, Zugriff für Apps in der Box.'
        : 'TR-064 unreachable — check base URL (http://192.168.1.1), credentials, app access on the router.'
    case 'homeauto_not_found':
      return de
        ? 'Smart-Home-Dienst nicht gefunden — TR-064-URL und Smart-Home-Rechte des Benutzers prüfen.'
        : 'Smart Home service not found — check TR-064 URL and user Smart Home rights.'
    case 'timeout':
      return de ? 'Zeitüberschreitung beim Abruf.' : 'Request timed out.'
    case 'network':
      return de ? 'Netzwerkfehler — Server erreicht die Box nicht.' : 'Network error — server cannot reach the router.'
    case 'list_failed':
      return de ? 'Geräteliste konnte nicht geladen werden.' : 'Could not load device list.'
    case 'device_not_found':
      return de ? 'Steckdose mit dieser AIN nicht gefunden.' : 'No outlet found for this AIN.'
    case 'homeauto_unauthorized':
      return de
        ? 'FRITZ!-Benutzer hat keine Smart-Home-Rechte. In der Box: System → FRITZ!-Benutzer → Benutzer bearbeiten → „Smart Home“ aktivieren.'
        : 'FRITZ!Box user lacks Smart Home rights. Enable Smart Home for this user in System → FRITZ!Box users.'
    case 'no_multimeter':
      return de
        ? 'Gerät meldet keine Leistungsmessung — FRITZ!Smart Energy 200?'
        : 'Device has no power meter.'
    default:
      if (base.startsWith('homeauto_fault_')) {
        return de
          ? `FRITZ!Box Homeauto-Fehler (${base}). AIN prüfen oder HTTPS + selbstsigniert nutzen.`
          : `FRITZ!Box Homeauto error (${base}). Check AIN or use HTTPS with self-signed TLS.`
      }
      return code
  }
}

function formatKwh(n: number, locale: 'de' | 'en'): string {
  const loc = locale === 'en' ? 'en-GB' : 'de-DE'
  if (n < 0.01 && n > 0) return `${(n * 1000).toLocaleString(loc, { maximumFractionDigits: 0 })} Wh`
  return `${n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`
}

function formatW(n: number, locale: 'de' | 'en'): string {
  const loc = locale === 'en' ? 'en-GB' : 'de-DE'
  if (n >= 1000) return `${(n / 1000).toLocaleString(loc, { maximumFractionDigits: 2 })} kW`
  return `${Math.round(n).toLocaleString(loc)} W`
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent: string
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
        <Icon size={14} style={{ color: accent, flexShrink: 0 }} aria-hidden />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: 'var(--text)' }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div> : null}
    </div>
  )
}

type EnergyViewId = 'now' | 'today' | 'week' | 'month' | 'total'

type EnergyView = {
  id: EnergyViewId
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent: string
  showSparkline?: boolean
}

function viewModeFromConfig(config: Record<string, unknown>): 'carousel' | 'grid' {
  const v = str(config.viewMode).toLowerCase()
  return v === 'grid' ? 'grid' : 'carousel'
}

function PowerSparkline({ points, compact }: { points: { powerW: number }[]; compact?: boolean }) {
  if (points.length < 2) return null
  const w = 280
  const h = compact ? 28 : 40
  const vals = points.map((p) => p.powerW)
  const max = Math.max(1, ...vals)
  const step = w / (vals.length - 1)
  const d = vals
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      style={{ display: 'block', marginTop: compact ? 4 : 6 }}
    >
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth={compact ? 1.5 : 2} strokeLinejoin="round" />
    </svg>
  )
}

function useWidgetCompact(ref: RefObject<HTMLElement | null>) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCompact(height < 130 || width < 200)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return compact
}

function EnergyCarousel({
  views,
  recent,
  loading,
  de,
  forceCompact,
}: {
  views: EnergyView[]
  recent: { powerW: number }[]
  loading: boolean
  de: boolean
  forceCompact?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const autoCompact = useWidgetCompact(rootRef)
  const compact = forceCompact || autoCompact

  const [idx, setIdx] = useState(0)
  const n = views.length
  const safeIdx = n > 0 ? ((idx % n) + n) % n : 0
  const view = views[safeIdx]
  if (!view) return null

  const go = (delta: number) => setIdx((i) => (i + delta + n) % n)
  const showSpark = view.showSparkline && !compact

  const navBtn: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: compact ? 26 : 28,
    height: compact ? 26 : 28,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  }

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 7, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6 }}>
        <button type="button" onClick={() => go(-1)} style={navBtn} aria-label={de ? 'Vorherige Ansicht' : 'Previous view'}>
          <ChevronLeft size={compact ? 15 : 16} aria-hidden />
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: compact ? 9 : 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
            }}
          >
            <view.icon size={compact ? 11 : 12} style={{ color: view.accent }} aria-hidden />
            {view.label}
          </div>
        </div>
        <button type="button" onClick={() => go(1)} style={navBtn} aria-label={de ? 'Nächste Ansicht' : 'Next view'}>
          <ChevronRight size={compact ? 15 : 16} aria-hidden />
        </button>
      </div>

      <div
        style={{
          borderRadius: compact ? 10 : 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          padding: compact ? '8px 6px' : '10px 8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: compact ? 2 : 4,
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        <div
          style={{
            fontSize: compact ? 22 : 26,
            fontWeight: 800,
            lineHeight: 1.05,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          {view.value}
        </div>
        {view.sub && !compact ? <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{view.sub}</div> : null}
      </div>

      {showSpark ? <PowerSparkline points={recent.slice(-60)} compact={compact} /> : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 4 : 5,
          flexWrap: 'wrap',
          minHeight: compact ? 14 : 16,
        }}
      >
        {views.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={v.label}
            aria-current={i === safeIdx ? 'true' : undefined}
            style={{
              width: compact ? 6 : 7,
              height: compact ? 6 : 7,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === safeIdx ? view.accent : 'var(--border)',
              opacity: i === safeIdx ? 1 : 0.55,
            }}
          />
        ))}
        {compact && view.sub ? (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>{view.sub}</span>
        ) : null}
        {loading ? (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>{de ? '…' : '…'}</span>
        ) : null}
      </div>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { locale, de } = usePluginLocale()
  const [data, setData] = useState<EnergyPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const viewMode = viewModeFromConfig(config as Record<string, unknown>)

  const baseUrl = str(config.baseUrl) || 'http://192.168.1.1'
  const username = str(config.username)
  const password = str(config.password)
  const ain = str(config.ain)
  const refreshSec = Math.min(300, Math.max(15, num(config.refreshSeconds, 60)))
  const insecureTls = config.insecureTls === true

  const fetchEnergy = useCallback(async () => {
    if (!ain) {
      setErr(locale === 'en' ? 'Set AIN in settings' : 'AIN in den Einstellungen eintragen')
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/fritz-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, username, password, ain, insecureTls }),
      })
      const j = (await res.json()) as EnergyPayload
      if (!res.ok || !j.ok) {
        const code = j.error ?? `http_${res.status}`
        setErr(code)
        setData(null)
        return
      }
      setData(j)
    } catch (e) {
      reportPluginCatch('fritz-energy', e, 'fetch')
      setErr('network')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [ain, baseUrl, username, password, insecureTls, locale])

  useEffect(() => {
    void fetchEnergy()
    const id = setInterval(() => void fetchEnergy(), refreshSec * 1000)
    return () => clearInterval(id)
  }, [fetchEnergy, refreshSec])

  const labels = de
    ? { now: 'Aktuell', today: 'Heute', week: '7 Tage', month: 'Monat', total: 'Zähler gesamt' }
    : { now: 'Now', today: 'Today', week: '7 days', month: 'Month', total: 'Meter total' }

  if (!ain) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
        {de ? 'Bitte AIN der Steckdose in den Widget-Einstellungen eintragen (z. B. 11630 0425503).' : 'Enter the device AIN in widget settings.'}
      </p>
    )
  }

  if (err) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: 'var(--danger, #f87171)' }}>{fritzEnergyError(err, de)}</p>
    )
  }

  const power = num(data?.currentPowerW)
  const today = num(data?.todayKwh)
  const week = num(data?.last7DaysKwh)
  const month = num(data?.monthKwh)
  const totalKwh = num(data?.energyWhTotal) / 1000
  const recent = Array.isArray(data?.recent) ? data.recent : []

  const updatedSub = data?.fetchedAt
    ? `${de ? 'Aktualisiert' : 'Updated'} ${new Date(data.fetchedAt).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'de-DE')}`
    : undefined

  const carouselViews: EnergyView[] = [
    {
      id: 'now',
      label: labels.now,
      value: formatW(power, locale),
      sub: data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : updatedSub,
      icon: Zap,
      accent: '#f59e0b',
      showSparkline: true,
    },
    {
      id: 'today',
      label: labels.today,
      value: formatKwh(today, locale),
      sub: updatedSub,
      icon: Bolt,
      accent: '#38bdf8',
    },
    {
      id: 'week',
      label: labels.week,
      value: formatKwh(week, locale),
      sub: updatedSub,
      icon: CalendarDays,
      accent: '#a78bfa',
    },
    {
      id: 'month',
      label: labels.month,
      value: formatKwh(month, locale),
      sub: updatedSub,
      icon: Calendar,
      accent: '#34d399',
    },
    {
      id: 'total',
      label: labels.total,
      value: formatKwh(totalKwh, locale),
      sub: updatedSub,
      icon: Bolt,
      accent: '#94a3b8',
    },
  ]

  if (viewMode === 'carousel') {
    return (
      <EnergyCarousel
        views={carouselViews}
        recent={recent}
        loading={loading}
        de={de}
        forceCompact={config.compactUi === true}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        <StatTile
          label={labels.now}
          value={formatW(power, locale)}
          sub={data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : undefined}
          icon={Zap}
          accent="#f59e0b"
        />
        <StatTile label={labels.today} value={formatKwh(today, locale)} icon={Bolt} accent="#38bdf8" />
        <StatTile label={labels.week} value={formatKwh(week, locale)} icon={CalendarDays} accent="#a78bfa" />
        <StatTile label={labels.month} value={formatKwh(month, locale)} icon={Calendar} accent="#34d399" />
      </div>
      <StatTile label={labels.total} value={formatKwh(totalKwh, locale)} sub={updatedSub} icon={Bolt} accent="#94a3b8" />
      <PowerSparkline points={recent.slice(-60)} />
      {loading ? (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{de ? 'Aktualisiere…' : 'Updating…'}</span>
      ) : null}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de: dashboardDe } = usePluginLocale()
  const r = config as Record<string, unknown>
  const de = pluginDe(r, dashboardDe)
  const [devices, setDevices] = useState<{ ain: string; name: string }[]>([])
  const [listErr, setListErr] = useState<string | null>(null)
  const [listing, setListing] = useState(false)

  const inp: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const refresh = (() => {
    const v = r.refreshSeconds
    if (v === undefined || v === null || v === '') return 60
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return 60
    return Math.min(300, Math.max(15, n))
  })()

  const loadDevices = async () => {
    setListing(true)
    setListErr(null)
    try {
      const res = await fetch('/api/fritz-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listDevices',
          baseUrl: str(r.baseUrl) || 'http://192.168.1.1',
          username: str(r.username),
          password: typeof r.password === 'string' ? r.password : '',
          insecureTls: r.insecureTls === true,
        }),
      })
      const j = (await res.json()) as { ok?: boolean; devices?: { ain: string; name: string }[]; error?: string }
      if (!res.ok || !j.ok) {
        setListErr(fritzEnergyError(j.error ?? 'list_failed', de))
        setDevices([])
        return
      }
      setDevices(j.devices ?? [])
      if ((j.devices ?? []).length === 0) {
        setListErr(de ? 'Keine Smart-Home-Geräte gefunden.' : 'No Smart Home devices found.')
      }
    } catch {
      setListErr(fritzEnergyError('network', de))
    } finally {
      setListing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        {de ? (
          <>
            Stromverbrauch per <strong>TR-064</strong> (Port <code style={{ fontSize: '10px' }}>49000</code> bei{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Basis-URL z. B.{' '}
            <code style={{ fontSize: '10px' }}>http://192.168.1.1</code> — bei HTTPS Haken „selbstsigniert“ setzen. Verlauf auf dem Server.
          </>
        ) : (
          <>
            Power use via <strong>TR-064</strong> (port <code style={{ fontSize: '10px' }}>49000</code> for{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Base URL e.g.{' '}
            <code style={{ fontSize: '10px' }}>http://192.168.1.1</code> — for HTTPS enable self-signed TLS. History stored on the server.
          </>
        )}
      </p>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Basis-URL' : 'Base URL'}
        </label>
        <input
          style={inp}
          value={str(r.baseUrl)}
          onChange={(e) => onChange('baseUrl', e.target.value)}
          placeholder="http://192.168.1.1"
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Benutzername' : 'Username'}
        </label>
        <input style={inp} value={str(r.username)} onChange={(e) => onChange('username', e.target.value)} autoComplete="off" />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Passwort' : 'Password'}
        </label>
        <input
          style={inp}
          type="password"
          value={typeof r.password === 'string' ? r.password : ''}
          onChange={(e) => onChange('password', e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>
          {de ? 'HTTPS: selbstsigniertes Zertifikat erlauben' : 'HTTPS: allow self-signed certificate'}
        </span>
        <input
          type="checkbox"
          checked={r.insecureTls === true}
          onChange={(e) => onChange('insecureTls', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
        />
      </label>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Widget-Anzeige' : 'Widget layout'}
        </label>
        <select
          style={inp}
          value={viewModeFromConfig(r)}
          onChange={(e) => onChange('viewMode', e.target.value)}
        >
          <option value="carousel">{de ? 'Einzelwert mit Pfeilen (← →)' : 'Single value with arrows (← →)'}</option>
          <option value="grid">{de ? 'Alle Kacheln gleichzeitig' : 'All tiles at once'}</option>
        </select>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Einzelansicht: Aktuell, Heute, 7 Tage, Monat und Zähler gesamt per Pfeil oder Punkt wechseln. Widget im Dashboard verkleinern (min. 2×2).'
            : 'Carousel: now, today, 7 days, month, meter total. Shrink the widget on the dashboard (min. 2×2).'}
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>
          {de ? 'Immer kompakte Darstellung' : 'Always use compact layout'}
        </span>
        <input
          type="checkbox"
          checked={r.compactUi === true}
          onChange={(e) => onChange('compactUi', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
        />
      </label>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '-6px 0 0', lineHeight: 1.45 }}>
        {de
          ? 'Ohne Haken passt sich die Ansicht beim Verkleinern automatisch an (Verlauf aus, kleinere Schrift).'
          : 'When off, the UI adapts when you resize smaller (hides sparkline, smaller text).'}
      </p>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Sprache (Anzeige)' : 'Display language'}
        </label>
        <select
          style={inp}
          value={(() => {
            const v = str(r.uiLanguage).toLowerCase()
            return v === 'de' || v === 'en' ? v : 'auto'
          })()}
          onChange={(e) => onChange('uiLanguage', e.target.value)}
        >
          <option value="auto">{de ? 'Wie Dashboard' : 'Match dashboard'}</option>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {de ? 'Steckdose' : 'Outlet'}
        </p>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'AIN' : 'AIN'}
          </label>
          <input
            style={inp}
            value={str(r.ain)}
            onChange={(e) => onChange('ain', e.target.value)}
            placeholder="11630 0425503"
          />
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
            {de
              ? 'AIN in der FRITZ!Box unter Smart Home → Gerät → Allgemein. Unten „Geräte laden“ wählt die AIN per Klick.'
              : 'AIN in FRITZ!Box Smart Home → device → General. Use “Load devices” below to pick one.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDevices()}
          disabled={listing}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: listing ? 'wait' : 'pointer',
          }}
        >
          {listing ? (de ? 'Lade Geräte…' : 'Loading devices…') : de ? 'Geräte von FRITZ!Box laden' : 'Load devices from FRITZ!Box'}
        </button>

        {listErr ? (
          <p style={{ fontSize: '11px', color: 'var(--danger, #f87171)', margin: 0, lineHeight: 1.45 }}>{listErr}</p>
        ) : null}

        {devices.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
            {devices.map((d) => (
              <li key={d.ain} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                  }}
                  onClick={() => onChange('ain', d.ain)}
                >
                  {d.name} — <code style={{ fontSize: '10px' }}>{d.ain}</code>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Aktualisieren (Sekunden)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          max={300}
          value={refresh}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(15, Math.round(Number(e.target.value)) || 60)))}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de ? '15–300: wie oft Leistung und Zähler von der Box geholt werden.' : '15–300: how often power and meter values are polled.'}
        </p>
      </div>
    </div>
  )
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
