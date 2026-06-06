'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type OmvData = {
  hostname: string | null
  version: string | null
  uptimeSec: number | null
  uptimeText: string | null
  cpuPct: number | null
  memUsedPct: number | null
  loadAvg: string | null
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

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Login abgelehnt — Web-UI-Benutzer/Passwort prüfen.', 'Login rejected — check web UI user/password.'],
    missing_credentials: ['Passwort fehlt.', 'Password missing.'],
    tls_error: [
      'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.',
      'TLS certificate rejected — enable "Allow self-signed certificate".',
    ],
    upstream_error: ['OMV-RPC-Fehler.', 'OMV RPC error.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['OpenMediaVault nicht erreichbar.', 'OpenMediaVault unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function fmtUptime(sec: number | null, text: string | null, de: boolean): string {
  if (sec == null) return text ?? '—'
  const d = Math.floor(sec / 86_400)
  const h = Math.floor((sec % 86_400) / 3_600)
  const m = Math.floor((sec % 3_600) / 60)
  if (d > 0) return de ? `${d} T ${h} Std` : `${d}d ${h}h`
  if (h > 0) return de ? `${h} Std ${m} Min` : `${h}h ${m}m`
  return de ? `${m} Min` : `${m}m`
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 24,
        height: 6,
        borderRadius: 3,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 26, flexShrink: 0 }}>{label}</span>
      <Bar pct={pct} color={color} />
      <span
        style={{
          fontSize: 10,
          fontVariantNumeric: 'tabular-nums',
          width: 34,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [data, setData] = useState<OmvData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const username = str(config.username) || 'admin'
  const password = str(config.password)
  const insecureTls = config.insecureTls !== false
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'OpenMediaVault' : str(config.title)
  const configured = Boolean(baseUrl && password)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/openmediavault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, username, password, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as OmvData
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
  }, [baseUrl, configured, de, insecureTls, password, username])

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
        <span style={{ fontSize: 24 }}>🗄️</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'OMV-URL, Benutzername und Passwort (Web-UI-Login) in den Einstellungen eintragen.'
            : 'Enter OMV URL, username and password (web UI login) in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[50, 70, 70, 40].map((w, i) => (
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
          }}
        >
          {title}
        </p>
      ) : null}

      {data ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span
              style={{
                fontSize: 'clamp(13px, 4cqmin, 16px)',
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {data.hostname ?? 'OMV'}
            </span>
            {data.version ? (
              <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 11px)', color: 'var(--text-muted)', flexShrink: 0 }}>
                {data.version}
              </span>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'clamp(10px, 2.6cqmin, 12px)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 26, flexShrink: 0 }}>
              {de ? 'UP' : 'UP'}
            </span>
            <span>{fmtUptime(data.uptimeSec, data.uptimeText, de)}</span>
          </div>

          {data.cpuPct != null ? <BarRow label="CPU" pct={data.cpuPct} color="var(--accent)" /> : null}
          {data.memUsedPct != null ? <BarRow label="RAM" pct={data.memUsedPct} color="#a78bfa" /> : null}

          {data.loadAvg ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 'clamp(10px, 2.6cqmin, 12px)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 26, flexShrink: 0 }}>LOAD</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.loadAvg}</span>
            </div>
          ) : null}
        </div>
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
          value={config.title === undefined ? 'OpenMediaVault' : str(config.title)}
          placeholder="OpenMediaVault"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.90"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Benutzername' : 'Username'}
        </label>
        <input
          style={inp}
          value={config.username === undefined ? 'admin' : str(config.username)}
          placeholder="admin"
          autoComplete="off"
          onChange={(e) => onChange('username', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Passwort' : 'Password'}
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.password)}
          autoComplete="new-password"
          onChange={(e) => onChange('password', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Web-UI-Login von OpenMediaVault (admin oder eigener Benutzer). Abfrage läuft serverseitig über /api/plugins/openmediavault.'
            : 'OpenMediaVault web UI login (admin or a dedicated user). Requests go server-side via /api/plugins/openmediavault.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.insecureTls !== false}
            onChange={(e) => onChange('insecureTls', e.target.checked)}
          />
          {de ? 'Selbstsigniertes Zertifikat erlauben' : 'Allow self-signed certificate'}
        </label>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          max={3600}
          value={num(config.refreshSeconds) || 60}
          onChange={(e) => onChange('refreshSeconds', Math.max(15, num(e.target.value) || 60))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'openmediavault',
  name: 'OpenMediaVault',
  description: 'OMV-Systeminfo: Hostname, Version, Uptime, CPU/RAM-Last per RPC-Login. (Beta)',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'storage',
  icon: '🗄️',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/openmediavault.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'OpenMediaVault' },
    { key: 'baseUrl', label: 'OMV-URL', type: 'text', placeholder: 'http://192.168.1.90', defaultValue: '' },
    { key: 'username', label: 'Benutzername', type: 'text', defaultValue: 'admin' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'insecureTls', label: 'Selbstsigniertes Zertifikat erlauben', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 60 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
