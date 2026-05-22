'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Bolt, Calendar, CalendarDays, ChevronLeft, ChevronRight, Zap, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import { pluginApiJson } from '@/lib/pluginDev'
import { reportPluginCatch } from '@/lib/pluginLog'

export const meta: PluginMeta = {
  id: 'fritz-energy',
  name: 'FRITZ! Steckdose Energie',
  description:
    'Stromverbrauch FRITZ!Smart Energy / Steckdose per TR-064 (aktuell, heute, 7 Tage, Monat). API: /api/plugins/fritz-energy.',
  version: '1.2.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '⚡',
  iconUrl: '/plugin-logos/fritzbox.svg',
  defaultLayout: { w: 2, h: 2, minW: 1, minH: 2 },
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
  monthlyKwh?: Record<string, number>
  boxPeriods?: { today: number; week: number; month: number } | null
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
    case 'import_failed':
      return de ? 'Verlauf konnte nicht von der FRITZ!Box gelesen werden.' : 'Could not import history from FRITZ!Box.'
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

const TINT = {
  amber: { solid: '#f59e0b', wash: 'rgba(245, 158, 11, 0.18)', rim: 'rgba(245, 158, 11, 0.38)' },
  sky: { solid: '#38bdf8', wash: 'rgba(56, 189, 248, 0.18)', rim: 'rgba(56, 189, 248, 0.38)' },
  violet: { solid: '#a78bfa', wash: 'rgba(167, 139, 250, 0.18)', rim: 'rgba(167, 139, 250, 0.38)' },
  emerald: { solid: '#34d399', wash: 'rgba(52, 211, 153, 0.18)', rim: 'rgba(52, 211, 153, 0.38)' },
} as const

type TintKey = keyof typeof TINT

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tint,
  fill,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  tint: TintKey
  /** Kachel füllt die Rasterzelle (2×2-Widget ohne Lücke unten). */
  fill?: boolean
}) {
  const c = TINT[tint]
  return (
    <div
      className={fill ? 'sd-fritz-energy-tile' : undefined}
      style={{
        borderRadius: '12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
        padding: fill ? '9px 10px 9px 11px' : '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 0,
        minHeight: 0,
        height: fill ? '100%' : undefined,
        boxSizing: 'border-box',
        containerType: fill ? 'size' : 'inline-size',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Icon size={13} strokeWidth={2.25} style={{ color: c.solid, flexShrink: 0, opacity: 0.95 }} aria-hidden />
        <span
          className={fill ? 'sd-fritz-energy-tile-label' : undefined}
          style={{
            fontSize: fill ? undefined : '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <span
        className={`tabular-nums${fill ? ' sd-fritz-energy-tile-value' : ''}`}
        style={{
          fontSize: fill ? undefined : 'clamp(0.78rem, min(3.5cqmin, 2.8cqh), 1.35rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          color: c.solid,
          fontVariantNumeric: 'tabular-nums',
          marginTop: fill ? '4px' : '2px',
        }}
      >
        {value}
      </span>
      {sub ? (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '2px' }}>{sub}</div>
      ) : null}
    </div>
  )
}

type EnergyViewId = 'now' | 'today' | 'week' | 'month'

type EnergyView = {
  id: EnergyViewId
  label: string
  value: string
  sub?: string
  /** Kurz für schmale Widgets (nur Uhrzeit) */
  subShort?: string
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

function useWidgetSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ compact: false, narrow: false })
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({
        narrow: width < 150,
        compact: height < 130 || width < 220,
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function EnergyCarousel({
  views,
  recent,
  de,
  forceCompact,
}: {
  views: EnergyView[]
  recent: { powerW: number }[]
  de: boolean
  forceCompact?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { compact: autoCompact, narrow } = useWidgetSize(rootRef)
  const compact = forceCompact || autoCompact || narrow

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
    width: narrow ? 22 : compact ? 26 : 28,
    height: narrow ? 22 : compact ? 26 : 28,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  }

  return (
    <div
      ref={rootRef}
      className="sd-fritz-energy-carousel-host"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 5 : 7,
        minHeight: 0,
        height: '100%',
        containerType: 'size',
      }}
    >
      <style>{`
        .sd-fritz-energy-carousel-host .sd-fritz-energy-carousel-value {
          font-size: clamp(0.85rem, min(4.2cqmin, 3.4cqh), 1.35rem);
        }
      `}</style>
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
            <view.icon size={narrow ? 12 : compact ? 11 : 12} style={{ color: view.accent }} aria-hidden />
            {narrow ? null : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{view.label}</span>}
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
          className="tabular-nums sd-fritz-energy-carousel-value"
          style={{
            fontWeight: 800,
            lineHeight: 1.08,
            color: view.accent,
            fontVariantNumeric: 'tabular-nums',
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
          <span
            style={{
              fontSize: 9,
              color: 'var(--text-muted)',
              marginLeft: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: narrow ? '42%' : '55%',
            }}
            title={view.sub}
          >
            {narrow && view.subShort ? view.subShort : view.sub}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { locale, de } = usePluginLocale()
  const rootRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<EnergyPayload | null>(null)
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
    setErr(null)
    try {
      const j = await pluginApiJson<EnergyPayload>('fritz-energy', '/', {
        method: 'POST',
        body: JSON.stringify({ baseUrl, username, password, ain, insecureTls }),
      })
      if (!j.ok) {
        setErr(j.error ?? 'fetch_failed')
        setData(null)
        return
      }
      setData(j)
    } catch (e) {
      reportPluginCatch('fritz-energy', e, 'fetch')
      setErr('network')
      setData(null)
    }
  }, [ain, baseUrl, username, password, insecureTls, locale])

  useEffect(() => {
    void fetchEnergy()
    const id = setInterval(() => void fetchEnergy(), refreshSec * 1000)
    return () => clearInterval(id)
  }, [fetchEnergy, refreshSec])

  const labels = de
    ? { now: 'Aktuell', today: 'Heute', week: '7 Tage', month: 'Monat' }
    : { now: 'Now', today: 'Today', week: '7 days', month: 'Month' }

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
  const recent = Array.isArray(data?.recent) ? data.recent : []

  const carouselViews: EnergyView[] = [
    {
      id: 'now',
      label: labels.now,
      value: formatW(power, locale),
      sub: data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : undefined,
      subShort: data?.voltageV != null ? `${num(data.voltageV).toFixed(0)}V` : undefined,
      icon: Zap,
      accent: '#f59e0b',
      showSparkline: true,
    },
    {
      id: 'today',
      label: labels.today,
      value: formatKwh(today, locale),
      icon: Bolt,
      accent: '#38bdf8',
    },
    {
      id: 'week',
      label: labels.week,
      value: formatKwh(week, locale),
      icon: CalendarDays,
      accent: '#a78bfa',
    },
    {
      id: 'month',
      label: labels.month,
      value: formatKwh(month, locale),
      icon: Calendar,
      accent: '#34d399',
    },
  ]

  if (viewMode === 'carousel') {
    return (
      <EnergyCarousel
        views={carouselViews}
        recent={recent}
        de={de}
        forceCompact={config.compactUi === true}
      />
    )
  }

  return (
    <div
      ref={rootRef}
      className="sd-fritz-energy-host"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        containerType: 'size',
      }}
    >
      <style>{`
        .sd-fritz-energy-host .sd-fritz-energy-tile-value {
          font-size: clamp(0.78rem, min(4.8cqmin, 3.8cqh), 1.45rem);
        }
        .sd-fritz-energy-host .sd-fritz-energy-tile-label {
          font-size: clamp(8px, min(1.9cqmin, 1.6cqh), 10px);
        }
      `}</style>
      <div
        className="sd-fritz-energy-stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          flex: 1,
          minHeight: 0,
          alignContent: 'stretch',
        }}
      >
        <StatTile
          label={labels.now}
          value={formatW(power, locale)}
          sub={data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : undefined}
          icon={Zap}
          tint="amber"
          fill
        />
        <StatTile label={labels.today} value={formatKwh(today, locale)} icon={Bolt} tint="sky" fill />
        <StatTile label={labels.week} value={formatKwh(week, locale)} icon={CalendarDays} tint="violet" fill />
        <StatTile label={labels.month} value={formatKwh(month, locale)} icon={Calendar} tint="emerald" fill />
      </div>
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
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

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

  const importHistory = async () => {
    if (!str(r.ain)) {
      setImportMsg(de ? 'Zuerst AIN eintragen.' : 'Enter AIN first.')
      return
    }
    setImporting(true)
    setImportMsg(null)
    try {
      const j = await pluginApiJson<{ ok?: boolean; error?: string; historyImported?: boolean }>('fritz-energy', '/', {
        method: 'POST',
        body: JSON.stringify({
          action: 'importHistory',
          importHistory: true,
          baseUrl: str(r.baseUrl) || 'http://192.168.1.1',
          username: str(r.username),
          password: typeof r.password === 'string' ? r.password : '',
          ain: str(r.ain),
          insecureTls: r.insecureTls === true,
        }),
      })
      if (!j.ok) {
        setImportMsg(fritzEnergyError(j.error ?? 'import_failed', de))
        return
      }
      setImportMsg(
        j.historyImported
          ? de
            ? 'Verlauf von der FRITZ!Box übernommen (heute / 7 Tage / Monat).'
            : 'History imported from FRITZ!Box (today / 7 days / month).'
          : de
            ? 'Kein Verlauf von der Box — nur Live-Werte. Smart-Home-Rechte und FRITZ!OS 7+ prüfen.'
            : 'No history from box — live values only. Check Smart Home rights and FRITZ!OS 7+.',
      )
    } catch {
      setImportMsg(fritzEnergyError('network', de))
    } finally {
      setImporting(false)
    }
  }

  const loadDevices = async () => {
    setListing(true)
    setListErr(null)
    try {
      const j = await pluginApiJson<{
        ok?: boolean
        devices?: { ain: string; name: string }[]
        error?: string
      }>('fritz-energy', '/', {
        method: 'POST',
        body: JSON.stringify({
          action: 'listDevices',
          baseUrl: str(r.baseUrl) || 'http://192.168.1.1',
          username: str(r.username),
          password: typeof r.password === 'string' ? r.password : '',
          insecureTls: r.insecureTls === true,
        }),
      })
      if (!j.ok) {
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
            <code style={{ fontSize: '10px' }}>http://192.168.1.1</code> — bei HTTPS Haken „selbstsigniert“. Heute / 7 Tage / Monat kommen bei jedem Abruf von der FRITZ!Box (nicht lokal mitgezählt).
          </>
        ) : (
          <>
            Power use via <strong>TR-064</strong> (port <code style={{ fontSize: '10px' }}>49000</code> for{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Base URL e.g.{' '}
            <code style={{ fontSize: '10px' }}>http://192.168.1.1</code> — for HTTPS enable self-signed TLS. Today / 7 days / month are read from the FRITZ!Box on every poll (not counted locally).
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
            ? 'Einzelansicht: Aktuell, Heute, 7 Tage und Monat per Pfeil oder Punkt wechseln. Widget verkleinern (min. 1 Spalte breit).'
            : 'Carousel: now, today, 7 days, month. Shrink the widget on the dashboard (min. 1 column wide).'}
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => void loadDevices()}
            disabled={listing}
            style={{
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
            {listing ? (de ? 'Lade Geräte…' : 'Loading devices…') : de ? 'Geräte laden' : 'Load devices'}
          </button>
          <button
            type="button"
            onClick={() => void importHistory()}
            disabled={importing}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: importing ? 'wait' : 'pointer',
            }}
          >
            {importing
              ? de
                ? 'Importiere Verlauf…'
                : 'Importing history…'
              : de
                ? 'Verlauf von FRITZ!Box holen'
                : 'Import history from FRITZ!Box'}
          </button>
        </div>

        {importMsg ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>{importMsg}</p>
        ) : null}

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
