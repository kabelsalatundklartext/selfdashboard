'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Bolt, Calendar, CalendarDays, Zap, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import { reportPluginCatch } from '@/lib/pluginLog'

export const meta: PluginMeta = {
  id: 'fritz-energy',
  name: 'FRITZ! Steckdose Energie',
  description:
    'Eigenes Plugin (nicht „Fritzbox Internet Verlauf“): Strom der FRITZ!Smart Energy 200 per TR-064 — aktuell, heute, 7 Tage, Monat; Speicherung auf dem Server.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '⚡',
  iconUrl: '/plugin-logos/fritzbox.svg',
  defaultLayout: { w: 3, h: 5, minW: 2, minH: 4 },
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

function listDevicesError(code: string, de: boolean): string {
  const base = code.split(':')[0]
  switch (base) {
    case 'unauthorized':
      return de
        ? 'Anmeldung fehlgeschlagen — Benutzername und Passwort prüfen (FRITZ!Box-Benutzer mit TR-064-Recht).'
        : 'Login failed — check username and password (FRITZ!Box user with TR-064 access).'
    case 'desc_not_found':
      return de
        ? 'TR-064-Beschreibung nicht erreichbar. Basis-URL wie beim Plugin „Fritzbox Internet Verlauf“ (http → Port 49000, https → 49443), nicht die Weboberfläche auf Port 80/443.'
        : 'TR-064 device description unreachable. Use the same base URL as the Fritzbox plugin (http → port 49000, https → 49443), not the web UI on 80/443.'
    case 'homeauto_not_found':
      return de
        ? 'Smart-Home-Dienst (X_AVM-DE_Homeauto) auf der Box nicht gefunden — FRITZ!OS / Smart Home aktivieren.'
        : 'Smart Home TR-064 service (X_AVM-DE_Homeauto) not found on this router.'
    case 'timeout':
      return de ? 'Zeitüberschreitung beim Abruf.' : 'Request timed out.'
    case 'network':
      return de ? 'Netzwerkfehler — Server erreicht die Box nicht.' : 'Network error — server cannot reach the router.'
    case 'list_failed':
      return de ? 'Geräteliste konnte nicht geladen werden.' : 'Could not load device list.'
    default:
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

function PowerSparkline({ points }: { points: { powerW: number }[] }) {
  if (points.length < 2) return null
  const w = 280
  const h = 48
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
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block', marginTop: 8 }}>
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { locale, de } = usePluginLocale()
  const [data, setData] = useState<EnergyPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const baseUrl = str(config.baseUrl) || 'http://fritz.box'
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
      <p style={{ margin: 0, fontSize: 13, color: 'var(--danger, #f87171)' }}>
        {err === 'unauthorized'
          ? de
            ? 'Anmeldung fehlgeschlagen — Benutzer/Passwort der FRITZ!Box prüfen.'
            : 'Login failed — check FRITZ!Box user/password.'
          : err === 'no_multimeter'
            ? de
              ? 'Gerät meldet keine Leistungsmessung — FRITZ!Smart Energy 200?'
              : 'Device has no power meter.'
            : `${de ? 'Fehler' : 'Error'}: ${err}`}
      </p>
    )
  }

  const power = num(data?.currentPowerW)
  const today = num(data?.todayKwh)
  const week = num(data?.last7DaysKwh)
  const month = num(data?.monthKwh)
  const totalKwh = num(data?.energyWhTotal) / 1000
  const recent = Array.isArray(data?.recent) ? data.recent : []

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
      <StatTile
        label={labels.total}
        value={formatKwh(totalKwh, locale)}
        sub={
          data?.fetchedAt
            ? `${de ? 'Aktualisiert' : 'Updated'} ${new Date(data.fetchedAt).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'de-DE')}`
            : undefined
        }
        icon={Bolt}
        accent="#94a3b8"
      />
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
          baseUrl: str(r.baseUrl) || 'http://fritz.box',
          username: str(r.username),
          password: typeof r.password === 'string' ? r.password : '',
          insecureTls: r.insecureTls === true,
        }),
      })
      const j = (await res.json()) as { ok?: boolean; devices?: { ain: string; name: string }[]; error?: string }
      if (!res.ok || !j.ok) {
        setListErr(listDevicesError(j.error ?? 'list_failed', de))
        setDevices([])
        return
      }
      setDevices(j.devices ?? [])
      if ((j.devices ?? []).length === 0) {
        setListErr(de ? 'Keine Smart-Home-Geräte gefunden.' : 'No Smart Home devices found.')
      }
    } catch {
      setListErr(listDevicesError('network', de))
    } finally {
      setListing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        {de ? (
          <>
            Stromverbrauch der FRITZ!Smart Energy 200 (oder anderer Steckdose) per <strong>TR-064</strong> (Port{' '}
            <code style={{ fontSize: '10px' }}>49000</code> bei <code style={{ fontSize: '10px' }}>http</code>) — Abruf und
            Verlaufsspeicherung über den SelfDashboard-Server. Gleiche Zugangsdaten wie beim Plugin „Fritzbox Internet Verlauf“.
          </>
        ) : (
          <>
            Power use of your FRITZ!Smart Energy outlet via <strong>TR-064</strong> (port{' '}
            <code style={{ fontSize: '10px' }}>49000</code> for <code style={{ fontSize: '10px' }}>http</code>). Fetched and stored on
            the SelfDashboard server. Use the same credentials as the Fritzbox throughput plugin.
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
          placeholder="http://fritz.box"
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
