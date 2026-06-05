'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type UnifiSubsystem = {
  name: string
  status: string
  devices: number
  clients: number
}

type UnifiData = {
  subsystems: UnifiSubsystem[]
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
    auth_failed: [
      'Login abgelehnt — lokalen Benutzer ohne 2FA verwenden.',
      'Login rejected — use a local user without 2FA.',
    ],
    missing_credentials: ['Benutzername/Passwort fehlt.', 'Username/password missing.'],
    invalid_site: ['Ungültiger Site-Name.', 'Invalid site name.'],
    site_not_found: ['Site nicht gefunden — internen Site-Namen prüfen.', 'Site not found — check internal site name.'],
    tls_error: [
      'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.',
      'TLS certificate rejected — enable "Allow self-signed certificate".',
    ],
    upstream_error: ['UniFi-Controller-Fehler.', 'UniFi controller error.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Controller nicht erreichbar.', 'Controller unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function statusColor(status: string): string {
  if (status === 'ok') return '#34d399'
  if (status === 'warning') return '#f59e0b'
  if (status === 'error') return '#ef4444'
  return '#9ca3af'
}

function subsystemLabel(name: string): string {
  if (name === 'wlan') return 'WLAN'
  if (name === 'lan') return 'LAN'
  if (name === 'wan') return 'WAN'
  return name.toUpperCase()
}

function SubsystemCell({ sub, de }: { sub: UnifiSubsystem; de: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background: statusColor(sub.status),
          }}
          title={sub.status}
        />
        <span
          style={{
            fontSize: 'clamp(11px, 3cqmin, 13px)',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subsystemLabel(sub.name)}
        </span>
      </div>
      <span
        style={{
          fontSize: 'clamp(9px, 2.4cqmin, 11px)',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {sub.devices} {de ? 'Geräte' : 'devices'} · {sub.clients} Clients
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [data, setData] = useState<UnifiData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const site = str(config.site) || 'default'
  const insecureTls = config.insecureTls !== false
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const title = config.title === undefined ? 'UniFi' : str(config.title)
  const configured = Boolean(baseUrl && username && password)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/unifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, username, password, site, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as UnifiData
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
  }, [baseUrl, configured, de, insecureTls, password, site, username])

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
        <span style={{ fontSize: 24 }}>📶</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Controller-URL, Benutzername und Passwort in den Einstellungen eintragen (lokaler Benutzer, kein Cloud-Account mit 2FA).'
            : 'Enter controller URL, username and password in settings (local user, no cloud account with 2FA).'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[55, 75, 45].map((w, i) => (
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
        data.subsystems.length === 0 ? (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
            {de ? 'Keine Subsysteme gemeldet.' : 'No subsystems reported.'}
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 20px',
              alignItems: 'flex-start',
              alignContent: 'flex-start',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            {data.subsystems.map((s) => (
              <SubsystemCell key={s.name} sub={s} de={de} />
            ))}
          </div>
        )
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
          value={config.title === undefined ? 'UniFi' : str(config.title)}
          placeholder="UniFi"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Controller-URL' : 'Controller URL'}
        </label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="https://192.168.1.1"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Benutzername' : 'Username'}
        </label>
        <input
          style={inp}
          value={str(config.username)}
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
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>Site</label>
        <input
          style={inp}
          value={str(config.site) || 'default'}
          placeholder="default"
          onChange={(e) => onChange('site', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Empfohlen: eigener lokaler Benutzer (nur Lesen) im Controller — kein Ubiquiti-Cloud-Account mit 2FA. UDM/UniFi OS und Legacy-Controller werden automatisch erkannt. Abfrage läuft serverseitig über /api/plugins/unifi.'
            : 'Recommended: dedicated local user (read-only) in the controller — no Ubiquiti cloud account with 2FA. UDM/UniFi OS and legacy controllers are detected automatically. Requests go server-side via /api/plugins/unifi.'}
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
          min={10}
          max={3600}
          value={num(config.refreshSeconds) || 30}
          onChange={(e) => onChange('refreshSeconds', Math.max(10, num(e.target.value) || 30))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'unifi',
  name: 'UniFi Controller',
  description:
    'UniFi-Netzwerkstatus: WLAN/LAN/WAN, APs, Switches, Clients (Controller-Login, serverseitig). (Beta)',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '📶',
  iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/unifi.png',
  defaultLayout: { w: 4, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'UniFi' },
    { key: 'baseUrl', label: 'Controller-URL', type: 'text', placeholder: 'https://192.168.1.1', defaultValue: '' },
    { key: 'username', label: 'Benutzername', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'site', label: 'Site', type: 'text', defaultValue: 'default' },
    { key: 'insecureTls', label: 'Selbstsigniertes Zertifikat erlauben', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
