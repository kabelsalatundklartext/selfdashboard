'use client'

import { useCallback, useEffect, useState } from 'react'
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
  iconUrl: '/plugin-logos/fritz-energy.svg',
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
  const locale = usePluginLocale(config)
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
      reportPluginCatch('fritz-energy', 'fetch', e)
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

  const de = locale !== 'en'
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
  const locale = usePluginLocale(config)
  const de = locale !== 'en'
  const [devices, setDevices] = useState<{ ain: string; name: string }[]>([])
  const [listErr, setListErr] = useState<string | null>(null)
  const [listing, setListing] = useState(false)

  const loadDevices = async () => {
    setListing(true)
    setListErr(null)
    try {
      const res = await fetch('/api/fritz-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listDevices',
          baseUrl: str(config.baseUrl) || 'http://fritz.box',
          username: str(config.username),
          password: str(config.password),
          insecureTls: config.insecureTls === true,
        }),
      })
      const j = (await res.json()) as { ok?: boolean; devices?: { ain: string; name: string }[]; error?: string }
      if (!res.ok || !j.ok) {
        setListErr(j.error ?? 'list_failed')
        setDevices([])
        return
      }
      setDevices(j.devices ?? [])
    } catch {
      setListErr('network')
    } finally {
      setListing(false)
    }
  }

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</span>
      <input
        type={type}
        value={str(config[key])}
        placeholder={placeholder}
        onChange={(e) => onChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
      />
    </label>
  )

  return (
    <div>
      {field('baseUrl', de ? 'TR-064 Basis-URL' : 'TR-064 base URL', 'text', 'http://fritz.box')}
      {field('username', de ? 'Benutzername' : 'Username')}
      {field('password', de ? 'Passwort' : 'Password', 'password')}
      {field('ain', de ? 'AIN (Steckdose)' : 'AIN (outlet)', 'text', '11630 0425503')}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
        {de
          ? 'AIN steht in der FRITZ!Box unter Smart Home → Gerät → Allgemein.'
          : 'Find the AIN in FRITZ!Box Smart Home → device → General.'}
      </p>
      <button
        type="button"
        onClick={() => void loadDevices()}
        disabled={listing}
        style={{
          marginBottom: 10,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        {listing ? (de ? 'Lade Geräte…' : 'Loading…') : de ? 'Geräte von FRITZ!Box laden' : 'Load devices from FRITZ!Box'}
      </button>
      {listErr ? (
        <p style={{ fontSize: 12, color: 'var(--danger, #f87171)' }}>{listErr}</p>
      ) : null}
      {devices.length > 0 ? (
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12 }}>
          {devices.map((d) => (
            <li key={d.ain} style={{ marginBottom: 4 }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onClick={() => onChange('ain', d.ain)}
              >
                {d.name} — <code>{d.ain}</code>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {field('refreshSeconds', de ? 'Aktualisieren (Sek.)' : 'Refresh (sec.)', 'number')}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={config.insecureTls === true}
          onChange={(e) => onChange('insecureTls', e.target.checked)}
        />
        {de ? 'HTTPS: selbstsigniert erlauben' : 'HTTPS: allow self-signed'}
      </label>
    </div>
  )
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
