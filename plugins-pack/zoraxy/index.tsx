'use client'

import { useCallback, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import {
  Activity,
  Ban,
  Cable,
  CheckCircle2,
  Download,
  ListChecks,
  PowerOff,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
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
  rxBits?: number
  txBits?: number
  error?: string
  detail?: string
}

type IconType = ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>

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
  | 'down'
  | 'up'
  | 'redirects'
  | 'streams'
  | 'blacklist'
  | 'whitelist'

type TileDef = {
  key: TileKey
  de: string
  en: string
  group: string
  color: string
  Icon: IconType
  danger?: boolean
  good?: boolean
}

/** Every tile the widget can show. `group` decides which Zoraxy endpoint must be fetched. */
const TILES: TileDef[] = [
  { key: 'hosts', de: 'Hosts', en: 'Hosts', group: 'hosts', color: '#6366f1', Icon: Server },
  { key: 'active', de: 'Aktiv', en: 'Active', group: 'hosts', color: '#22c55e', Icon: CheckCircle2, good: true },
  { key: 'disabled', de: 'Inaktiv', en: 'Disabled', group: 'hosts', color: '#94a3b8', Icon: PowerOff },
  { key: 'upstreams', de: 'Upstreams', en: 'Upstreams', group: 'hosts', color: '#6366f1', Icon: Share2 },
  { key: 'online', de: 'Online', en: 'Online', group: 'uptime', color: '#22c55e', Icon: Wifi, good: true },
  { key: 'offline', de: 'Offline', en: 'Offline', group: 'uptime', color: '#ef4444', Icon: WifiOff, danger: true },
  { key: 'requests', de: 'Requests', en: 'Requests', group: 'stats', color: '#3b82f6', Icon: Activity },
  { key: 'valid', de: 'Gültig', en: 'Valid', group: 'stats', color: '#22c55e', Icon: ShieldCheck, good: true },
  { key: 'blocked', de: 'Geblockt', en: 'Blocked', group: 'stats', color: '#ef4444', Icon: ShieldAlert, danger: true },
  { key: 'down', de: 'Download', en: 'Download', group: 'traffic', color: '#06b6d4', Icon: Download },
  { key: 'up', de: 'Upload', en: 'Upload', group: 'traffic', color: '#a855f7', Icon: Upload },
  { key: 'redirects', de: 'Redirects', en: 'Redirects', group: 'redirects', color: '#14b8a6', Icon: Share2 },
  { key: 'streams', de: 'Streams', en: 'Streams', group: 'streams', color: '#8b5cf6', Icon: Cable },
  { key: 'blacklist', de: 'Blacklist', en: 'Blacklist', group: 'blacklist', color: '#ef4444', Icon: Ban },
  { key: 'whitelist', de: 'Whitelist', en: 'Whitelist', group: 'whitelist', color: '#22c55e', Icon: ListChecks, good: true },
]

const TILE_KEYS = TILES.map((t) => t.key) as string[]
const TILE_BY_KEY = new Map(TILES.map((t) => [t.key, t]))
/** Hidden by default — the user enables these via the settings checkboxes. */
const DEFAULT_HIDDEN = ['redirects', 'streams', 'blacklist', 'whitelist']

const TILE_CSS = `
.zx-tile{transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}
.zx-tile:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--zx-accent) 55%,var(--border));box-shadow:0 6px 16px -8px var(--zx-accent)}
`

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

/** bytes/s → human readable (B/s, KB/s, MB/s, GB/s). */
function fmtRate(bytesPerSec: number): string {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let v = bytesPerSec
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

/** Full tile order with newly-added tiles appended, so saved configs stay forward-compatible. */
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

function numericValue(key: string, data: ZoraxyData): number | undefined {
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

/** Tiny trend line for the requests hero. Builds up as the widget polls over time. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 100
  const H = 30
  if (values.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 30, display: 'block' }} aria-hidden>
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} style={{ stroke: 'var(--border)', strokeWidth: 1.5 }} strokeDasharray="3 4" />
      </svg>
    )
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = W / (values.length - 1)
  const coords = values.map((v, i) => {
    const x = i * step
    const y = H - 3 - ((v - min) / span) * (H - 6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = coords.join(' ')
  const area = `0,${H} ${line} ${W},${H}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 30, display: 'block' }} aria-hidden>
      <polygon points={area} style={{ fill: color, fillOpacity: 0.14 }} />
      <polyline
        points={line}
        style={{ fill: 'none', stroke: color, strokeWidth: 2 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Hero block: large requests count + trend sparkline + valid/blocked summary. */
function RequestsHero({
  requests,
  valid,
  blocked,
  spark,
  de,
  showValid,
  showBlocked,
}: {
  requests?: number
  valid?: number
  blocked?: number
  spark: number[]
  de: boolean
  showValid: boolean
  showBlocked: boolean
}) {
  const loc = de ? 'de-DE' : 'en-US'
  const fmt = (n?: number) => (n != null ? n.toLocaleString(loc) : '—')
  const legend: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 'clamp(10px, 2.6cqmin, 12px)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '9px 12px',
        borderRadius: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(8px, 2.2cqmin, 10px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
        }}
      >
        {de ? 'Requests' : 'Requests'}
      </span>
      <span
        style={{
          fontSize: 'clamp(22px, 9.5cqmin, 34px)',
          fontWeight: 800,
          lineHeight: 1.04,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmt(requests)}
      </span>
      <Sparkline values={spark} color="var(--accent)" />
      {showValid || showBlocked ? (
        <div style={{ display: 'flex', gap: 14, marginTop: 3, flexWrap: 'wrap' }}>
          {showValid ? (
            <span style={legend}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <b style={{ color: '#22c55e', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(valid)}</b>
              {de ? 'gültig' : 'valid'}
            </span>
          ) : null}
          {showBlocked ? (
            <span style={legend}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
              <b
                style={{
                  color: (blocked ?? 0) > 0 ? '#ef4444' : 'var(--text)',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmt(blocked)}
              </b>
              {de ? 'geblockt' : 'blocked'}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Tile({
  def,
  text,
  valueColor,
}: {
  def: TileDef
  text: string
  valueColor: string
}) {
  const Icon = def.Icon
  return (
    <div
      className="zx-tile"
      style={
        {
          '--zx-accent': def.color,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          minWidth: 0,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        } as CSSProperties
      }
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
          width: 26,
          height: 26,
          borderRadius: 7,
          color: def.color,
          background: `color-mix(in srgb, ${def.color} 16%, transparent)`,
        }}
      >
        {Icon ? <Icon size={15} strokeWidth={2.2} /> : null}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: 'clamp(15px, 6.5cqmin, 24px)',
            fontWeight: 800,
            color: valueColor,
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
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
          {def.de}
        </span>
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [data, setData] = useState<ZoraxyData | null>(null)
  const [traffic, setTraffic] = useState<{ down: number; up: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [spark, setSpark] = useState<number[]>([])
  const lastSample = useRef<{ rx: number; tx: number; t: number } | null>(null)
  const reqHist = useRef<number[]>([])
  const prevReq = useRef<number | null>(null)

  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 60) * 1000
  const title = config.title === undefined ? 'Zoraxy' : str(config.title)
  const showTitle = config.showTitle !== false
  const configured = Boolean(baseUrl) && Boolean(username) && Boolean(password)

  const visible = visibleKeys(config)
  const wantKey = wantGroups(config).join(',')

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
      if (json.rxBits != null && json.txBits != null) {
        const t = performance.now()
        const prev = lastSample.current
        if (prev) {
          const dt = (t - prev.t) / 1000
          if (dt > 0) {
            setTraffic({
              down: Math.max(0, (json.rxBits - prev.rx) / 8 / dt),
              up: Math.max(0, (json.txBits - prev.tx) / 8 / dt),
            })
          }
        }
        lastSample.current = { rx: json.rxBits, tx: json.txBits, t }
      }
      if (typeof json.requests === 'number') {
        const prev = prevReq.current
        if (prev != null) {
          reqHist.current = [...reqHist.current, Math.max(0, json.requests - prev)].slice(-40)
          setSpark(reqHist.current)
        }
        prevReq.current = json.requests
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

  const showHero = visible.includes('requests')
  const gridKeys = showHero
    ? visible.filter((k) => k !== 'requests' && k !== 'valid' && k !== 'blocked')
    : visible

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 7 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>
      <style>{TILE_CSS}</style>
      {showTitle && title ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
          {showHero ? (
            <RequestsHero
              requests={data.requests}
              valid={data.valid}
              blocked={data.blocked}
              spark={spark}
              de={de}
              showValid={visible.includes('valid')}
              showBlocked={visible.includes('blocked')}
            />
          ) : null}
          {gridKeys.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
                gap: 7,
                alignContent: 'flex-start',
              }}
            >
              {gridKeys.map((key) => {
                const def = TILE_BY_KEY.get(key as TileKey)
                if (!def) return null
                let text = '—'
                let value: number | undefined
                if (key === 'down') text = traffic ? fmtRate(traffic.down) : '—'
                else if (key === 'up') text = traffic ? fmtRate(traffic.up) : '—'
                else {
                  value = numericValue(key, data)
                  text = value != null ? value.toLocaleString(de ? 'de-DE' : 'en-US') : '—'
                }
                let valueColor = 'var(--text)'
                if (value != null && def.danger && value > 0) valueColor = '#ef4444'
                else if (value != null && def.good && value > 0) valueColor = '#22c55e'
                return <Tile key={key} def={{ ...def, de: de ? def.de : def.en }} text={text} valueColor={valueColor} />
              })}
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
        const Icon = def.Icon
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
            <span style={{ display: 'flex', alignItems: 'center', color: def.color }}>
              {Icon ? <Icon size={14} strokeWidth={2.2} /> : null}
            </span>
            <span style={{ fontSize: 13 }}>{de ? def.de : def.en}</span>
          </div>
        )
      })}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const showTitle = config.showTitle !== false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: showTitle ? 1 : 0.5 }}>
          {de ? 'Titel-Text (umbenennen)' : 'Title text (rename)'}
        </label>
        <input
          style={{ ...inp, opacity: showTitle ? 1 : 0.5 }}
          disabled={!showTitle}
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
    'Zoraxy-Übersicht: Proxy-Hosts, Uptime, Requests/Geblockt, Traffic, Redirects, Streams, Blacklist u. m. — Kacheln frei ein-/ausblendbar und sortierbar. (Beta)',
  version: '0.9.6',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🛡️',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/zoraxy.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
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
