'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type NpmHosts = {
  proxy?: number
  redirection?: number
  stream?: number
  dead?: number
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
    auth_failed: ['E-Mail/Passwort prüfen (Web-UI-Login).', 'Check email/password (web UI login).'],
    missing_credentials: ['E-Mail und Passwort in den Einstellungen eintragen.', 'Enter email and password in settings.'],
    upstream_error: ['Host-Report nicht lesbar — NPM-Version prüfen.', 'Host report unreadable — check NPM version.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Nginx Proxy Manager nicht erreichbar (Port 81?).', 'Nginx Proxy Manager unreachable (port 81?).'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function Tile({ label, value, color }: { label: string; value: number | undefined; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        padding: '6px 8px',
        borderRadius: 8,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(7px, 2cqmin, 9px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'clamp(15px, 7cqmin, 26px)',
          fontWeight: 800,
          lineHeight: 1.05,
          color: color ?? 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value != null ? value : '—'}
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [data, setData] = useState<NpmHosts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const email = str(config.email)
  const password = str(config.password)
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'Proxy Manager' : str(config.title)
  const configured = Boolean(baseUrl) && Boolean(email) && Boolean(password)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/npm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, email, password }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as NpmHosts
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
  }, [baseUrl, configured, de, email, password])

  useEffect(() => {
    setLoading(true)
    void refresh()
    if (!active) return
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs, active])

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
        <span style={{ fontSize: 24 }}>🔀</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'NPM-URL, E-Mail und Passwort in den Einstellungen eintragen.'
            : 'Enter NPM URL, email and password in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
            gap: 6,
            flex: 1,
            minHeight: 0,
            alignContent: 'flex-start',
          }}
        >
          <Tile label={de ? 'Proxy Hosts' : 'Proxy hosts'} value={data.proxy} color="var(--accent)" />
          <Tile label={de ? 'Redirects' : 'Redirects'} value={data.redirection} />
          <Tile label="Streams" value={data.stream} />
          <Tile label={de ? '404 Hosts' : '404 hosts'} value={data.dead} />
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
          value={config.title === undefined ? 'Proxy Manager' : str(config.title)}
          placeholder="Proxy Manager"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.50:81"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'E-Mail (Web-UI-Login)' : 'Email (web UI login)'}
        </label>
        <input
          style={inp}
          type="email"
          value={str(config.email)}
          placeholder="admin@example.com"
          onChange={(e) => onChange('email', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'Passwort' : 'Password'}</label>
        <input
          style={inp}
          type="password"
          value={str(config.password)}
          onChange={(e) => onChange('password', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Gleiche Zugangsdaten wie die NPM-Web-UI. Login + Abfrage laufen serverseitig über /api/plugins/npm.'
            : 'Same credentials as the NPM web UI. Login + requests go server-side via /api/plugins/npm.'}
        </p>
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
  id: 'npm',
  name: 'Nginx Proxy Manager',
  description:
    'Host-Statistik aus Nginx Proxy Manager: Proxy Hosts, Redirections, Streams, 404-Hosts (Login per E-Mail + Passwort, serverseitig). (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🔀',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/nginx-proxy-manager.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Proxy Manager' },
    { key: 'baseUrl', label: 'NPM URL', type: 'text', defaultValue: '' },
    { key: 'email', label: 'E-Mail', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 60 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
