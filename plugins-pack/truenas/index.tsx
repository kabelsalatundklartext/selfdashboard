'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type TrueNasPool = {
  name: string
  status: string
  healthy: boolean
  usedPct: number | null
}

type TrueNasData = {
  hostname: string | null
  version: string | null
  uptimeSec: number | null
  pools: TrueNasPool[]
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

function fmtUptime(sec: number | null, de: boolean): string {
  if (sec == null || sec <= 0) return ''
  const d = Math.floor(sec / 86_400)
  const h = Math.floor((sec % 86_400) / 3_600)
  if (d > 0) return de ? `${d}T ${h}h` : `${d}d ${h}h`
  const m = Math.floor((sec % 3_600) / 60)
  return `${h}h ${m}m`
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: [
      'API-Key prüfen (TrueNAS → Einstellungen → API Keys).',
      'Check API key (TrueNAS → Settings → API Keys).',
    ],
    missing_key: ['API-Key fehlt.', 'API key missing.'],
    tls_error: [
      'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.',
      'TLS certificate rejected — enable "Allow self-signed certificate".',
    ],
    upstream_error: ['TrueNAS-API-Fehler.', 'TrueNAS API error.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['TrueNAS nicht erreichbar.', 'TrueNAS unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function PoolRow({ pool }: { pool: TrueNasPool }) {
  const ok = pool.healthy || pool.status === 'ONLINE'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          background: ok ? '#34d399' : '#ef4444',
        }}
        title={pool.status}
      />
      <span
        style={{
          fontSize: 'clamp(11px, 3cqmin, 13px)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {pool.name}
      </span>
      <span style={{ fontSize: 10, color: ok ? 'var(--text-muted)' : '#ef4444', flexShrink: 0 }}>
        {pool.status}
      </span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        {pool.usedPct != null ? `${Math.round(pool.usedPct)}%` : ''}
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [data, setData] = useState<TrueNasData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const apiKey = str(config.apiKey)
  const insecureTls = config.insecureTls !== false
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'TrueNAS' : str(config.title)
  const configured = Boolean(baseUrl && apiKey)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/truenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, apiKey, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as TrueNasData
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
  }, [apiKey, baseUrl, configured, de, insecureTls])

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
        <span style={{ fontSize: 24 }}>💾</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'TrueNAS-URL und API-Key in den Einstellungen eintragen.'
            : 'Enter TrueNAS URL and API key in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[55, 80, 70, 60].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  const uptime = data ? fmtUptime(data.uptimeSec, de) : ''

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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span
              style={{
                fontSize: 'clamp(13px, 5cqmin, 17px)',
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {data.hostname || 'TrueNAS'}
            </span>
            {data.version ? (
              <span style={{ fontSize: 'clamp(8px, 2.4cqmin, 10px)', color: 'var(--text-muted)' }}>
                {data.version}
              </span>
            ) : null}
            {uptime ? (
              <span style={{ fontSize: 'clamp(8px, 2.4cqmin, 10px)', color: 'var(--text-muted)' }}>
                {de ? `Uptime ${uptime}` : `up ${uptime}`}
              </span>
            ) : null}
          </div>

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
            {data.pools.length === 0 ? (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                {de ? 'Keine Pools gefunden.' : 'No pools found.'}
              </p>
            ) : (
              data.pools.map((p) => <PoolRow key={p.name} pool={p} />)
            )}
          </div>
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
          value={config.title === undefined ? 'TrueNAS' : str(config.title)}
          placeholder="TrueNAS"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="https://192.168.1.70"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Key</label>
        <input
          style={inp}
          type="password"
          value={str(config.apiKey)}
          onChange={(e) => onChange('apiKey', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'TrueNAS: Einstellungen (Zahnrad oben rechts) → API Keys → Add. Abfrage läuft serverseitig über /api/plugins/truenas.'
            : 'TrueNAS: Settings (gear icon top right) → API Keys → Add. Requests go server-side via /api/plugins/truenas.'}
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
  id: 'truenas',
  name: 'TrueNAS',
  description: 'TrueNAS-Systeminfo und Pool-Status per REST-API-Key. (Beta)',
  version: '0.9.2',
  author: 'SelfDashboard',
  category: 'storage',
  icon: '💾',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/truenas.png',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'TrueNAS' },
    { key: 'baseUrl', label: 'TrueNAS URL', type: 'text', placeholder: 'https://192.168.1.70', defaultValue: '' },
    { key: 'apiKey', label: 'API-Key', type: 'password', defaultValue: '' },
    { key: 'insecureTls', label: 'Selbstsigniertes Zertifikat erlauben', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 60 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
