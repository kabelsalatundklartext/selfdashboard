'use client'

import { ArrowDownCircle, ArrowUpCircle, Globe, Router, Wifi, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'fritzbox',
  name: 'FRITZ!Box',
  description:
    'TR-064: Modell, FRITZ!OS, WAN-Status, öffentliche IPv4, Sync-Raten (Digest-Auth, Abruf über /api/fritzbox). Für Fiber 5590 & andere FRITZ!OS-Geräte im Heimnetz.',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'network',
  icon: '📡',
  defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
  configSchema: [
    {
      key: 'baseUrl',
      label: 'TR-064 Basis-URL',
      type: 'text',
      defaultValue: 'http://fritz.box',
      placeholder: 'Nur Host (z. B. http://fritz.box) — ohne /tr064; Port 49000/49443 wird ergänzt',
    },
    { key: 'username', label: 'Benutzername', type: 'text', defaultValue: '', placeholder: 'FRITZ!Box-Benutzer' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
    { key: 'insecureTls', label: 'HTTPS: selbstsigniert erlauben', type: 'boolean', defaultValue: false },
  ],
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function formatMbps(bps: number | null, de: boolean): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return '—'
  const mbps = bps / 1_000_000
  const s = mbps >= 100 ? String(Math.round(mbps)) : mbps.toFixed(1)
  return de ? `${s.replace('.', ',')} Mb/s` : `${s} Mb/s`
}

function formatUptime(sec: number | null, de: boolean): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '—'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  if (de) return `${d} T., ${h} Std.`
  return `${d}d ${h}h`
}

const TINT = {
  sky: { solid: '#38bdf8', wash: 'rgba(56, 189, 248, 0.2)', rim: 'rgba(56, 189, 248, 0.38)' },
  emerald: { solid: '#34d399', wash: 'rgba(52, 211, 153, 0.18)', rim: 'rgba(52, 211, 153, 0.38)' },
  amber: { solid: '#fbbf24', wash: 'rgba(251, 191, 36, 0.15)', rim: 'rgba(251, 191, 36, 0.4)' },
  violet: { solid: '#c084fc', wash: 'rgba(192, 132, 252, 0.2)', rim: 'rgba(192, 132, 252, 0.38)' },
} as const

type TintKey = keyof typeof TINT

function Tile({
  label,
  value,
  tint,
  icon: Icon,
  footer,
}: {
  label: string
  value: string
  tint: TintKey
  icon: LucideIcon
  footer?: ReactNode
}) {
  const c = TINT[tint]
  return (
    <div
      style={{
        borderRadius: '12px',
        padding: '10px 10px 10px 12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
        minHeight: 'clamp(64px, 18cqmin, 88px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Icon size={13} strokeWidth={2.25} style={{ color: c.solid, flexShrink: 0, opacity: 0.95 }} aria-hidden />
        <span
          style={{
            fontSize: 'clamp(9px, 2cqmin, 10px)',
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
        className="tabular-nums"
        style={{
          fontSize: 'clamp(0.95rem, 4.5cqmin, 1.35rem)',
          fontWeight: 800,
          color: c.solid,
          lineHeight: 1.12,
          fontVariantNumeric: 'tabular-nums',
          marginTop: '4px',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
      {footer}
    </div>
  )
}

type Summary = {
  modelName: string | null
  softwareVersion: string | null
  manufacturer: string | null
  wanAccessType: string | null
  downstreamMaxBps: number | null
  upstreamMaxBps: number | null
  connectionStatus: string | null
  uptimeSec: number | null
  externalIpv4: string | null
  lastError: string | null
  fetchedAt?: string
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const baseUrl = str((config as Record<string, unknown>).baseUrl)
  const username = str((config as Record<string, unknown>).username)
  const password = typeof (config as Record<string, unknown>).password === 'string' ? String((config as Record<string, unknown>).password) : ''
  const insecureTls = (config as Record<string, unknown>).insecureTls === true
  const refreshSec = Math.min(300, Math.max(15, Math.round(num((config as Record<string, unknown>).refreshSeconds) || 30)))

  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!baseUrl) {
      setLoading(false)
      setError(de ? 'Keine Basis-URL in den Einstellungen.' : 'No base URL in settings.')
      setData(null)
      return
    }
    try {
      const res = await fetch('/api/fritzbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ baseUrl, username, password, insecureTls }),
      })
      const j = (await res.json()) as Summary & { ok?: boolean; error?: string; message?: string }
      if (!res.ok) {
        if (res.status === 401) setError(de ? 'Anmeldung fehlgeschlagen.' : 'Login failed.')
        else if (j.error === 'timeout') setError(de ? 'Zeitüberschreitung.' : 'Timeout.')
        else setError(j.message || j.error || `HTTP ${res.status}`)
        setData(null)
        return
      }
      if (j.ok === false) {
        setError(j.message || j.error || 'Error')
        setData(null)
        return
      }
      setError(null)
      setData(j as Summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, username, password, insecureTls, de])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), refreshSec * 1000)
    return () => window.clearInterval(id)
  }, [load, refreshSec])

  const muted = 'var(--text-muted)'
  const text = 'var(--text)'

  const wanOk = (() => {
    const st = (data?.connectionStatus ?? '').toLowerCase()
    return st.includes('verbunden') || st.includes('connect') || st === 'up' || !!data?.externalIpv4
  })()

  if (!baseUrl && !loading) {
    return (
      <div style={{ padding: '12px', color: muted, fontSize: '12px', textAlign: 'center' }}>
        {de ? 'Bitte TR-064-URL in den Plugin-Einstellungen setzen.' : 'Set the TR-064 URL in plugin settings.'}
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
        padding: 'clamp(6px, 1.5cqmin, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        containerType: 'size',
        overflow: 'auto',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 'clamp(10px, 2.4cqmin, 12px)', fontWeight: 700, color: text, lineHeight: 1.25 }}>
          {data?.manufacturer && data?.modelName ? `${data.manufacturer} ${data.modelName}` : data?.modelName || 'FRITZ!Box'}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 'clamp(9px, 2cqmin, 11px)', color: muted }}>
          {data?.softwareVersion
            ? de
              ? `FRITZ!OS ${data.softwareVersion}`
              : `FRITZ!OS ${data.softwareVersion}`
            : loading
              ? de
                ? 'Lade…'
                : 'Loading…'
              : '—'}
        </p>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: '11px', color: '#fb7185', textAlign: 'center', lineHeight: 1.4 }}>{error}</p>
      )}

      {data && !error && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px',
              flex: 1,
              minHeight: 0,
            }}
          >
            <Tile
              label={de ? 'Internet' : 'Internet'}
              value={wanOk ? (de ? 'Verbunden' : 'Up') : de ? 'Prüfen' : 'Check'}
              tint={wanOk ? 'emerald' : 'amber'}
              icon={Wifi}
              footer={
                data.wanAccessType ? (
                  <span style={{ fontSize: '9px', color: muted, marginTop: '4px' }}>{data.wanAccessType}</span>
                ) : null
              }
            />
            <Tile label={de ? 'Öffentliche IPv4' : 'Public IPv4'} value={data.externalIpv4 || '—'} tint="sky" icon={Globe} />
            <Tile
              label={de ? 'Download (max.)' : 'Download (max)'}
              value={formatMbps(data.downstreamMaxBps, de)}
              tint="violet"
              icon={ArrowDownCircle}
            />
            <Tile label={de ? 'Upload (max.)' : 'Upload (max)'} value={formatMbps(data.upstreamMaxBps, de)} tint="violet" icon={ArrowUpCircle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '9px', color: muted }}>
              {de ? 'Verbunden seit' : 'Up for'}: <span style={{ color: text }}>{formatUptime(data.uptimeSec, de)}</span>
            </p>
            <p style={{ margin: 0, fontSize: '9px', color: muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Router size={10} aria-hidden />
              TR-064
            </p>
          </div>
          {data.lastError && data.lastError !== 'ERROR_NONE' && (
            <p style={{ margin: 0, fontSize: '10px', color: '#fb7185', lineHeight: 1.35 }}>
              {de ? 'Letzter WAN-Fehler: ' : 'Last WAN error: '}
              {data.lastError}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const r = config as Record<string, unknown>
  const inp: React.CSSProperties = {
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
  const refresh = Math.min(300, Math.max(15, Math.round(num(r.refreshSeconds) || 30)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        {de ? (
          <>
            Zugriff per <strong>TR-064</strong> (Port <code style={{ fontSize: '10px' }}>49000</code> bei{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Benutzer und Passwort wie in der FRITZ!Box angelegt (z. B.
            eigener Benutzer mit Recht auf Heimnetz). Der Abruf läuft über den SelfDashboard-Server.
          </>
        ) : (
          <>
            Uses <strong>TR-064</strong> (default port <code style={{ fontSize: '10px' }}>49000</code> for{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Same username/password as in the FRITZ!Box. Fetched via the
            SelfDashboard server.
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
          {de ? 'Aktualisieren (Sekunden)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          max={300}
          value={refresh}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(15, Math.round(Number(e.target.value)) || 30)))}
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
