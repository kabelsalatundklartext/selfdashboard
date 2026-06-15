'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type Gateway = {
  name: string
  up: boolean
  delay: string | null
}

type OpnsenseStatus = {
  version: string | null
  productName: string | null
  updatesAvailable: boolean
  gateways: Gateway[]
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
      'API-Key/-Secret prüfen (System → Zugang → Benutzer → API-Schlüssel).',
      'Check API key/secret (System → Access → Users → API keys).',
    ],
    missing_credentials: ['API-Key und API-Secret eintragen.', 'Enter API key and API secret.'],
    api_not_found: ['API nicht gefunden — Basis-URL prüfen.', 'API not found — check base URL.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    tls_error: [
      'TLS-Fehler — „Selbstsigniertes Zertifikat erlauben" aktivieren.',
      'TLS error — enable "Allow self-signed certificate".',
    ],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['OPNsense nicht erreichbar.', 'OPNsense unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [data, setData] = useState<OpnsenseStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const apiKey = str(config.apiKey)
  const apiSecret = str(config.apiSecret)
  const insecureTls = config.insecureTls !== false
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'OPNsense' : str(config.title)
  const configured = Boolean(baseUrl && apiKey && apiSecret)

  const refresh = useCallback(async () => {
    if (!configured) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/opnsense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, apiKey, apiSecret, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as OpnsenseStatus
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
  }, [apiKey, apiSecret, baseUrl, configured, de, insecureTls])

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
        <span style={{ fontSize: 24 }}>🧱</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'OPNsense-URL, API-Key und API-Secret in den Einstellungen eintragen.'
            : 'Enter OPNsense URL, API key and API secret in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[65, 45, 75].map((w, i) => (
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
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span
              style={{
                fontSize: 'clamp(13px, 5cqmin, 18px)',
                fontWeight: 800,
                lineHeight: 1.1,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {data.productName || 'OPNsense'}
              {data.version ? (
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginLeft: 6 }}>{data.version}</span>
              ) : null}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontSize: 'clamp(8px, 2.4cqmin, 10px)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: data.updatesAvailable ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                color: data.updatesAvailable ? '#f59e0b' : '#34d399',
              }}
            >
              {data.updatesAvailable
                ? de
                  ? 'Update verfügbar'
                  : 'Update available'
                : de
                  ? 'Aktuell'
                  : 'Up to date'}
            </span>
          </div>

          {data.gateways.length > 0 ? (
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
              {data.gateways.map((g) => (
                <li
                  key={g.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                    fontSize: 'clamp(10px, 3cqmin, 12px)',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: g.up ? '#34d399' : '#ef4444',
                    }}
                  />
                  <span
                    style={{
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                      fontWeight: 600,
                      flex: 1,
                    }}
                  >
                    {g.name}
                  </span>
                  {g.delay ? (
                    <span style={{ flexShrink: 0, fontSize: '0.85em', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {g.delay}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
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

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{label}</span>
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const insecureTls = config.insecureTls !== false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}
        </label>
        <input
          style={inp}
          value={config.title === undefined ? 'OPNsense' : str(config.title)}
          placeholder="OPNsense"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="https://192.168.1.1"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Key</label>
        <input style={inp} value={str(config.apiKey)} onChange={(e) => onChange('apiKey', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Secret</label>
        <input
          style={inp}
          type="password"
          value={str(config.apiSecret)}
          onChange={(e) => onChange('apiSecret', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'OPNsense → System → Zugang → Benutzer → API-Schlüssel erzeugen. Abfrage läuft serverseitig über /api/plugins/opnsense.'
            : 'OPNsense → System → Access → Users → create API key. Requests go server-side via /api/plugins/opnsense.'}
        </p>
      </div>
      <Toggle
        label={de ? 'Selbstsigniertes Zertifikat erlauben' : 'Allow self-signed certificate'}
        on={insecureTls}
        onToggle={() => onChange('insecureTls', !insecureTls)}
      />
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
  id: 'opnsense',
  name: 'OPNsense',
  description: 'OPNsense-Status: Version, Update-Status und Gateways per API-Key/-Secret. (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🧱',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/opnsense.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'OPNsense' },
    { key: 'baseUrl', label: 'OPNsense URL', type: 'text', defaultValue: '' },
    { key: 'apiKey', label: 'API-Key', type: 'text', defaultValue: '' },
    { key: 'apiSecret', label: 'API-Secret', type: 'password', defaultValue: '' },
    { key: 'insecureTls', label: 'Selbstsigniertes Zertifikat erlauben', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 60 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
