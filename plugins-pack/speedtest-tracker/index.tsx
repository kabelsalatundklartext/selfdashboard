'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type SpeedtestResult = {
  downloadMbps: number | null
  uploadMbps: number | null
  pingMs: number | null
  createdAt: string | null
  serverName: string | null
  failed: boolean
  error?: string
  detail?: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function fmtMbps(v: number | null, de: boolean): string {
  if (v == null) return '—'
  const rounded = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10
  return rounded.toLocaleString(de ? 'de-DE' : 'en-GB')
}

function fmtRelative(iso: string | null, de: boolean): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const sec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(de ? 'de' : 'en', { numeric: 'auto' })
  const abs = Math.abs(sec)
  if (abs < 90) return rtf.format(Math.round(sec / 60), 'minute')
  const min = Math.round(sec / 60)
  if (Math.abs(min) < 90) return rtf.format(min, 'minute')
  const hr = Math.round(min / 60)
  if (Math.abs(hr) < 48) return rtf.format(hr, 'hour')
  return rtf.format(Math.round(hr / 24), 'day')
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['API-Token prüfen (Settings → API Tokens).', 'Check API token (Settings → API Tokens).'],
    api_not_found: ['API nicht gefunden — Basis-URL prüfen.', 'API not found — check base URL.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Speedtest Tracker nicht erreichbar.', 'Speedtest Tracker unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span
        style={{
          fontSize: 'clamp(8px, 2cqmin, 10px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontSize: 'clamp(16px, 7cqmin, 26px)',
            fontWeight: 800,
            lineHeight: 1.05,
            color: color ?? 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 'clamp(8px, 2.2cqmin, 11px)', color: 'var(--text-muted)' }}>{unit}</span>
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [data, setData] = useState<SpeedtestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const token = str(config.apiToken)
  const refreshMs = Math.max(30, num(config.refreshSeconds) || 300) * 1000
  const title = config.title === undefined ? 'Speedtest' : str(config.title)
  const configured = Boolean(baseUrl)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/speedtest-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, token }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as SpeedtestResult & { error?: string; detail?: string }
      if (!res.ok || json.error) {
        setError(errorText(json.error || `HTTP ${res.status}`, json.detail || '', de))
        return
      }
      setData(json)
      setError(null)
    } catch {
      setError(errorText('network_error', '', de))
    } finally {
      setLoading(false)
    }
  }, [baseUrl, configured, de, token])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '10px 12px',
    containerType: 'size',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🚀</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Speedtest-Tracker-URL (und optional API-Token) in den Einstellungen eintragen.'
            : 'Enter Speedtest Tracker URL (and optional API token) in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[60, 75, 45].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>
      {title ? (
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(9px, 2.4cqmin, 10px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span>{title}</span>
          {data ? (
            <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
              {fmtRelative(data.createdAt, de)}
            </span>
          ) : null}
        </p>
      ) : null}

      {data ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 22px',
            alignItems: 'flex-start',
            alignContent: 'flex-start',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Stat label="Download" value={fmtMbps(data.downloadMbps, de)} unit="Mbit/s" />
          <Stat label="Upload" value={fmtMbps(data.uploadMbps, de)} unit="Mbit/s" color="#a78bfa" />
          <Stat
            label="Ping"
            value={data.pingMs != null ? String(Math.round(data.pingMs)) : '—'}
            unit="ms"
            color="#34d399"
          />
        </div>
      ) : null}

      {data?.failed ? (
        <p style={{ margin: 0, fontSize: 10, color: '#f59e0b' }}>
          {de ? 'Letzter Speedtest war fehlgeschlagen.' : 'Last speedtest failed.'}
        </p>
      ) : null}
      {data?.serverName ? (
        <p style={{ margin: 0, fontSize: 'clamp(8px, 2.2cqmin, 10px)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.serverName}
        </p>
      ) : null}
      {error ? (
        <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>{error}</p>
      ) : null}
    </div>
  )
}

const inp: CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  boxSizing: 'border-box',
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}
        </label>
        <input
          style={inp}
          value={config.title === undefined ? 'Speedtest' : str(config.title)}
          placeholder="Speedtest"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.30:8765"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'API-Token (je nach Version nötig)' : 'API token (required on newer versions)'}
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.apiToken)}
          onChange={(e) => onChange('apiToken', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Speedtest Tracker → Einstellungen → API Tokens. Abfrage läuft serverseitig über /api/plugins/speedtest-tracker.'
            : 'Speedtest Tracker → Settings → API Tokens. Requests go server-side via /api/plugins/speedtest-tracker.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={30}
          max={3600}
          value={num(config.refreshSeconds) || 300}
          onChange={(e) => onChange('refreshSeconds', Math.max(30, num(e.target.value) || 300))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'speedtest-tracker',
  name: 'Speedtest Tracker',
  description:
    'Letzter Speedtest aus Speedtest Tracker: Download, Upload, Ping + Zeitpunkt (Bearer-API-Token).',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🚀',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/speedtest-tracker.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Speedtest' },
    { key: 'baseUrl', label: 'Speedtest Tracker URL', type: 'text', defaultValue: '' },
    { key: 'apiToken', label: 'API-Token', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 300 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
