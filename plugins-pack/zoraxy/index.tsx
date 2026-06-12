'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type ZoraxyData = {
  total?: number
  active?: number
  disabled?: number
  upstreams?: number
  uptimeOnline?: number
  uptimeOffline?: number
  uptimeMonitored?: number
  requests?: number
  valid?: number
  blocked?: number
  redirects?: number
  streams?: number
  blacklist?: number
  whitelist?: number
  error?: string
  detail?: string
}

type TileKey =
  | 'hosts'
  | 'active'
  | 'disabled'
  | 'upstreams'
  | 'online'
  | 'offline'
  | 'requests'
  | 'valid'
  | 'blocked'
  | 'redirects'
  | 'streams'
  | 'blacklist'
  | 'whitelist'

type TileDef = { key: TileKey; de: string; en: string; group: string; color?: string; danger?: boolean }

/** Every tile the widget can show. `group` decides which Zoraxy endpoint must be fetched. */
const TILES: TileDef[] = [
  { key: 'hosts', de: 'Hosts', en: 'Hosts', group: 'hosts', color: 'var(--accent)' },
  { key: 'active', de: 'Aktiv', en: 'Active', group: 'hosts', color: '#22c55e' },
  { key: 'disabled', de: 'Inaktiv', en: 'Disabled', group: 'hosts' },
  { key: 'upstreams', de: 'Upstreams', en: 'Upstreams', group: 'hosts' },
  { key: 'online', de: 'Online', en: 'Online', group: 'uptime', color: '#22c55e' },
  { key: 'offline', de: 'Offline', en: 'Offline', group: 'uptime', danger: true },
  { key: 'requests', de: 'Requests', en: 'Requests', group: 'stats', color: 'var(--accent)' },
  { key: 'valid', de: 'Gültig', en: 'Valid', group: 'stats', color: '#22c55e' },
  { key: 'blocked', de: 'Geblockt', en: 'Blocked', group: 'stats', danger: true },
  { key: 'redirects', de: 'Redirects', en: 'Redirects', group: 'redirects' },
  { key: 'streams', de: 'Streams', en: 'Streams', group: 'streams' },
  { key: 'blacklist', de: 'Blacklist', en: 'Blacklist', group: 'blacklist' },
  { key: 'whitelist', de: 'Whitelist', en: 'Whitelist', group: 'whitelist' },
]

const TILE_KEYS = TILES.map((t) => t.key) as string[]
const TILE_BY_KEY = new Map(TILES.map((t) => [t.key, t]))
/** Hidden by default — the user enables these via the settings checkboxes. */
const DEFAULT_HIDDEN = ['valid', 'redirects', 'streams', 'blacklist', 'whitelist']

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** Full tile order with any newly-added tiles appended, so saved configs stay forward-compatible. */
function effectiveOrder(config: Record<string, unknown>): string[] {
  const saved = strList(config.tileOrder).filter((k) => TILE_KEYS.includes(k))
  const rest = TILE_KEYS.filter((k) => !saved.includes(k))
  return [...saved, ...rest]
}

function hiddenSet(config: Record<string, unknown>): Set<string> {
  const h = Array.isArray(config.tilesHidden) ? strList(config.tilesHidden) : DEFAULT_HIDDEN
  return new Set(h.filter((k) => TILE_KEYS.includes(k)))
}

function visibleKeys(config: Record<string, unknown>): string[] {
  const hidden = hiddenSet(config)
  return effectiveOrder(config).filter((k) => !hidden.has(k))
}

function wantGroups(config: Record<string, unknown>): string[] {
  const groups = visibleKeys(config)
    .map((k) => TILE_BY_KEY.get(k as TileKey)?.group)
    .filter((g): g is string => Boolean(g) && g !== 'hosts')
  return Array.from(new Set(groups))
}

function tileValue(key: string, data: ZoraxyData): number | undefined {
  switch (key) {
    case 'hosts':
      return data.total
    case 'active':
      return data.active
    case 'disabled':
      return data.disabled
    case 'upstreams':
      return data.upstreams
    case 'online':
      return data.uptimeOnline
    case 'offline':
      return data.uptimeOffline
    case 'requests':
      return data.requests
    case 'valid':
      return data.valid
    case 'blocked':
      return data.blocked
    case 'redirects':
      return data.redirects
    case 'streams':
      return data.streams
    case 'blacklist':
      return data.blacklist
    case 'whitelist':
      return data.whitelist
    default:
      return undefined
  }
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Benutzer/Passwort prüfen (Web-UI-Login).', 'Check username/password (web UI login).'],
    missing_credentials: ['Benutzer und Passwort in den Einstellungen eintragen.', 'Enter username and password in settings.'],
    upstream_error: ['Host-Liste nicht lesbar — Zoraxy-Version prüfen.', 'Host list unreadable — check Zoraxy version.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Zoraxy nicht erreichbar (Port 8000?).', 'Zoraxy unreachable (port 8000?).'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail ? `${base} — ${detail}` : base
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
  const [data, setData] = useState<ZoraxyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'Zoraxy' : str(config.title)
  const configured = Boolean(baseUrl) && Boolean(username) && Boolean(password)

  const visible = visibleKeys(config)
  const want = wantGroups(config)
  const wantKey = want.join(',')

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/zoraxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, username, password, want: wantKey ? wantKey.split(',') : [] }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as ZoraxyData
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
  }, [baseUrl, configured, de, username, password, wantKey])

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
        <span style={{ fontSize: 24 }}>🛡️</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Zoraxy-URL, Benutzer und Passwort in den Einstellungen eintragen.'
            : 'Enter Zoraxy URL, username and password in settings.'}
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
          {visible.map((key) => {
            const def = TILE_BY_KEY.get(key as TileKey)
            if (!def) return null
            const value = tileValue(key, data)
            const color = def.danger && (value ?? 0) > 0 ? '#ef4444' : def.color
            return <Tile key={key} label={de ? def.de : def.en} value={value} color={color} />
          })}
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

function TileOrderEditor({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const [drag, setDrag] = useState<string | null>(null)
  const order = effectiveOrder(config)
  const hidden = hiddenSet(config)

  const move = (from: string, to: string) => {
    if (from === to) return
    const next = order.slice()
    const fi = next.indexOf(from)
    const ti = next.indexOf(to)
    if (fi < 0 || ti < 0) return
    next.splice(fi, 1)
    next.splice(ti, 0, from)
    onChange('tileOrder', next)
  }

  const toggle = (key: string) => {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange('tilesHidden', Array.from(next))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12 }}>
        {de ? 'Kacheln (ziehen = sortieren, Haken = anzeigen)' : 'Tiles (drag to reorder, check to show)'}
      </label>
      {order.map((key) => {
        const def = TILE_BY_KEY.get(key as TileKey)
        if (!def) return null
        return (
          <div
            key={key}
            draggable
            onDragStart={() => setDrag(key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag) move(drag, key)
              setDrag(null)
            }}
            onDragEnd={() => setDrag(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'grab',
              opacity: drag === key ? 0.45 : 1,
            }}
          >
            <span aria-hidden style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1 }}>
              ⠿
            </span>
            <input type="checkbox" checked={!hidden.has(key)} onChange={() => toggle(key)} />
            <span style={{ fontSize: 13 }}>{de ? def.de : def.en}</span>
          </div>
        )
      })}
    </div>
  )
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
          value={config.title === undefined ? 'Zoraxy' : str(config.title)}
          placeholder="Zoraxy"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.50:8000"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Benutzer (Web-UI-Login)' : 'Username (web UI login)'}
        </label>
        <input
          style={inp}
          value={str(config.username)}
          placeholder="admin"
          onChange={(e) => onChange('username', e.target.value)}
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
            ? 'Gleiche Zugangsdaten wie die Zoraxy-Web-UI. Login + Abfrage laufen serverseitig über /api/plugins/zoraxy.'
            : 'Same credentials as the Zoraxy web UI. Login + requests go server-side via /api/plugins/zoraxy.'}
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
      <TileOrderEditor config={config} onChange={onChange} />
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'zoraxy',
  name: 'Zoraxy',
  description:
    'Zoraxy-Übersicht: Proxy-Hosts, Uptime, Requests/Geblockt, Redirects, Streams, Blacklist u. m. — Kacheln frei ein-/ausblendbar und sortierbar. (Beta)',
  version: '0.9.4',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🛡️',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/zoraxy.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Zoraxy' },
    { key: 'baseUrl', label: 'Zoraxy URL', type: 'text', defaultValue: '' },
    { key: 'username', label: 'Benutzer', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 60 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
