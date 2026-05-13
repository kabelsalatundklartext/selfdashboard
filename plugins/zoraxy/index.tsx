'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'zoraxy',
  name: 'Zoraxy',
  description:
    'Reverse-Proxy-Hostregeln aus Zoraxy (GET /plugin/api/proxy/list mit Plugin-API-Key, oder /api/proxy/list bei -noauth). Daten über SelfDashboard-API, kein CORS.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🌐',
  homepage: 'https://github.com/tobychui/zoraxy',
}

type ProxyRow = Record<string, unknown>

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function rowHost(it: ProxyRow): string {
  const keys = ['RootOrMatchingDomain', 'RootDomain', 'MatchingDomain', 'Domain', 'Hostname', 'uuid', 'UUID'] as const
  for (const k of keys) {
    const v = it[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return '—'
}

function rowDisabled(it: ProxyRow): boolean {
  if (it.Disabled === true) return true
  if (it.disabled === true) return true
  if (it.Enabled === false) return true
  return false
}

function upstreamSummary(it: ProxyRow): string {
  const ao = it.ActiveOrigins
  if (Array.isArray(ao) && ao.length > 0) {
    const first = ao[0] as Record<string, unknown>
    const origin = typeof first.OriginIpOrDomain === 'string' ? first.OriginIpOrDomain : ''
    const tls = first.RequireTLS === true ? 'https' : 'http'
    if (origin) return `${tls}://${origin}${ao.length > 1 ? ` (+${ao.length - 1})` : ''}`
  }
  const up = it.Upstream
  if (typeof up === 'string' && up.trim()) return up.trim()
  return ''
}

function Heading({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 'clamp(9px, 2.4cqmin, 10px)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        margin: '0 0 8px',
      }}
    >
      {text}
    </p>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const [rows, setRows] = useState<ProxyRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = normalizeBase((config.baseUrl as string) || '')
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey : ''
  const noAuth = config.noAuth === true
  const refresh = (Number(config.refreshInterval) || 30) * 1000
  const maxRows = Math.min(200, Math.max(5, Number(config.maxRows) || 60))

  const fetch_ = useCallback(async () => {
    if (!baseUrl) {
      setError('Basis-URL in den Einstellungen setzen.')
      setRows([])
      setLoading(false)
      return
    }
    if (!noAuth && !String(apiKey).trim()) {
      setError('API-Key eintragen oder „Ohne Login (-noauth)“ aktivieren.')
      setRows([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/zoraxy/proxy-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          ...(noAuth ? { noAuth: true } : { apiKey: String(apiKey).trim() }),
        }),
        cache: 'no-store',
      })
      const raw = await res.text()
      let data: unknown
      try {
        data = raw ? (JSON.parse(raw) as unknown) : null
      } catch {
        throw new Error(res.ok ? 'Ungültige JSON-Antwort' : `HTTP ${res.status}`)
      }
      if (!res.ok) {
        const err = (data as { error?: string })?.error
        throw new Error(err || `HTTP ${res.status}`)
      }
      let list: ProxyRow[] = []
      if (Array.isArray(data)) {
        list = data as ProxyRow[]
      } else if (data && typeof data === 'object') {
        const o = data as Record<string, unknown>
        const maybe = o.proxies ?? o.ProxyList ?? o.list ?? o.data
        if (Array.isArray(maybe)) list = maybe as ProxyRow[]
      }
      setRows(list.slice(0, maxRows))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [baseUrl, apiKey, noAuth, maxRows])

  useEffect(() => {
    setLoading(true)
    fetch_()
    const id = setInterval(fetch_, refresh)
    return () => clearInterval(id)
  }, [fetch_, refresh])

  const shell: React.CSSProperties = {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    padding: '8px 12px 12px',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
  }

  const fs = 'clamp(9px, 2.6cqmin, 11px)'

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[70, 55, 80, 50].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '10px', width: `${w}%`, borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '22px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', wordBreak: 'break-word' }}>{error}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
          Zoraxy: Plugin-REST nutzt <code style={{ fontSize: '10px' }}>/plugin/api/proxy/list</code> mit{' '}
          <code style={{ fontSize: '10px' }}>Authorization: Bearer …</code>. Key in Zoraxy anlegen (Berechtigung GET auf diesen Pfad). Bei Start mit{' '}
          <code style={{ fontSize: '10px' }}>-noauth</code> reicht Basis-URL + Option „Ohne Login“.
        </p>
      </div>
    )
  }

  return (
    <div style={shell}>
      <Heading text={`Zoraxy · ${rows.length} Hosts`} />
      {rows.length === 0 ? (
        <p style={{ fontSize: fs, color: 'var(--text-muted)', margin: 0 }}>Keine Einträge oder leere Liste.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {rows.map((it, i) => {
            const host = rowHost(it)
            const dis = rowDisabled(it)
            const up = upstreamSummary(it)
            const tip = [host, dis ? 'deaktiviert' : 'aktiv', up].filter(Boolean).join('\n')
            return (
              <li
                key={`${host}-${i}`}
                title={tip}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: i < rows.length - 1 ? '0 0 6px 0' : 0,
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px 6px',
                    width: '100%',
                    minWidth: 0,
                    fontSize: fs,
                    lineHeight: 1.35,
                    flexWrap: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      color: dis ? 'var(--text-muted)' : 'var(--accent)',
                      flexShrink: 0,
                      width: '0.65em',
                      textAlign: 'center',
                      fontSize: '0.78em',
                    }}
                    aria-hidden
                  >
                    {dis ? '○' : '●'}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--text)',
                      flex: '0 1 40%',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {host}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>:</span>
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      flex: '1 1 0%',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {up || (dis ? 'deaktiviert' : '—')}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
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

  const sub = (key: string, def = false) => {
    const v = (config as Record<string, unknown>)[key]
    if (v === undefined || v === null) return def
    return v === true
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        SelfDashboard ruft <code style={{ fontSize: '10px' }}>POST /api/zoraxy/proxy-list</code> auf (serverseitig zu Zoraxy). Standard:{' '}
        <code style={{ fontSize: '10px' }}>GET …/plugin/api/proxy/list</code> mit Bearer-Plugin-Key. Mit <strong>Ohne Login</strong> wird{' '}
        <code style={{ fontSize: '10px' }}>/api/proxy/list</code> verwendet (nur wenn Zoraxy mit <code style={{ fontSize: '10px' }}>-noauth</code> läuft).
      </p>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Zoraxy Basis-URL
        </label>
        <input
          style={inp}
          value={(config.baseUrl as string) || ''}
          onChange={(e) => onChange('baseUrl', e.target.value)}
          placeholder="http://192.168.1.10:8000"
          autoComplete="url"
        />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Plugin-API-Key (Bearer)
        </label>
        <input
          style={inp}
          type="password"
          value={(config.apiKey as string) || ''}
          onChange={(e) => onChange('apiKey', e.target.value)}
          placeholder="Leer lassen, wenn „Ohne Login“ aktiv"
          autoComplete="off"
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={sub('noAuth')} onChange={(e) => onChange('noAuth', e.target.checked)} />
        Ohne Login (-noauth) — kein API-Key
      </label>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Aktualisierung (Sek.)
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 30} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
          <option value={120}>120</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Max. Zeilen
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={200}
          step={5}
          value={Number.isFinite(Number(config.maxRows)) ? Number(config.maxRows) : 60}
          onChange={(e) => onChange('maxRows', e.target.value === '' ? 60 : Number(e.target.value))}
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
