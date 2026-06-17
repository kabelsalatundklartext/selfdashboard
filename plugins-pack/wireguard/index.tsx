'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type WgPeer = {
  id: string
  name: string
  enabled: boolean
  handshakeAt: number | null
  rx: number
  tx: number
  endpoint: string | null
  address: string | null
}

type WgData = {
  peers?: WgPeer[]
  now?: number
  api?: 'v15' | 'v14'
  error?: string
  detail?: string
}

const DEFAULT_ONLINE_MIN = 2

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

/** bytes → human readable (B, KB, MB, GB, TB). */
function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${i === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

/** ms-difference → "vor 3 Min" / "3 min ago"; null handshake → "nie"/"never". */
function fmtRelative(handshakeAt: number | null, now: number, de: boolean): string {
  if (handshakeAt == null) return de ? 'nie' : 'never'
  const diff = Math.max(0, now - handshakeAt)
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return de ? 'gerade eben' : 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return de ? `vor ${min} Min` : `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return de ? `vor ${hr} Std` : `${hr} h ago`
  const day = Math.floor(hr / 24)
  return de ? `vor ${day} T` : `${day} d ago`
}

/** epoch ms → "14.06.2026, 09:32" (de) / "Jun 14, 2026, 9:32 AM" (en). */
function fmtDateTime(handshakeAt: number | null, de: boolean): string {
  if (handshakeAt == null) return de ? 'kein Handshake' : 'no handshake'
  try {
    return new Date(handshakeAt).toLocaleString(de ? 'de-DE' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Login fehlgeschlagen — Zugangsdaten prüfen.', 'Login failed — check credentials.'],
    invalid_username: ['Benutzername darf keinen Doppelpunkt enthalten.', 'Username must not contain a colon.'],
    missing_credentials: ['Passwort in den Einstellungen eintragen.', 'Enter the password in settings.'],
    upstream_error: ['Unerwartete Antwort — wg-easy-Version/URL prüfen.', 'Unexpected response — check wg-easy version/URL.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['wg-easy nicht erreichbar (Port 51821?).', 'wg-easy unreachable (port 51821?).'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail ? `${base} — ${detail}` : base
}

const ICON: Record<string, string> = {
  // simple inline SVG paths (stroke), keeps us off the lucide allowlist entirely
  shield: 'M12 3l7 3v5c0 4.4-3 8.3-7 9-4-0.7-7-4.6-7-9V6l7-3z',
  down: 'M12 5v14M19 12l-7 7-7-7',
  up: 'M12 19V5M5 12l7-7 7 7',
  clock: 'M12 7v5l3 2',
}

function Glyph({ d, size = 14, color = 'currentColor', circle = false }: { d: string; size?: number; color?: string; circle?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block', flex: '0 0 auto' }}>
      {circle ? <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" /> : null}
      <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const WG_CSS = `
.wg-tab{cursor:pointer;border:none;background:transparent;font:inherit;padding:5px 10px;border-radius:7px;font-size:11px;font-weight:700;color:var(--text-muted);transition:background .14s ease,color .14s ease}
.wg-tab[data-active="true"]{background:var(--surface);color:var(--text);box-shadow:0 1px 3px -1px rgba(0,0,0,.25)}
.wg-row{transition:background .14s ease}
.wg-row:hover{background:color-mix(in srgb,var(--accent) 8%,transparent)}
`

function StatHeader({ online, total, totalTx, totalRx }: { online: number; total: number; totalTx: number; totalRx: number }) {
  const chip: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 'clamp(10px, 2.8cqmin, 12px)',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 'clamp(15px, 5cqmin, 20px)', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: online > 0 ? '#22c55e' : 'var(--text)' }}>{online}</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}> / {total}</span>
        <span style={{ fontSize: '0.6em', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 6 }}>online</span>
      </span>
      <span style={chip} title="empfangen / received">
        <Glyph d={ICON.down} size={12} color="#06b6d4" /> {fmtBytes(totalRx)}
      </span>
      <span style={chip} title="gesendet / sent">
        <Glyph d={ICON.up} size={12} color="#a855f7" /> {fmtBytes(totalTx)}
      </span>
    </div>
  )
}

function PeerRow({ peer, now, de, mode }: { peer: WgPeer; now: number; de: boolean; mode: 'online' | 'history' }) {
  const dot = !peer.enabled ? '#94a3b8' : mode === 'online' ? '#22c55e' : peer.handshakeAt ? '#64748b' : '#475569'
  return (
    <div
      className="wg-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 9px',
        borderRadius: 9,
        minWidth: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          flex: '0 0 auto',
          boxShadow: mode === 'online' && peer.enabled ? `0 0 0 3px color-mix(in srgb, ${dot} 25%, transparent)` : 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: 1 }}>
        <span
          style={{
            fontSize: 'clamp(12px, 3.4cqmin, 13px)',
            fontWeight: 700,
            color: peer.enabled ? 'var(--text)' : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {peer.name}
          {!peer.enabled ? <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginLeft: 6 }}>{de ? 'INAKTIV' : 'OFF'}</span> : null}
        </span>
        <span style={{ fontSize: 'clamp(9px, 2.6cqmin, 10px)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mode === 'online'
            ? peer.endpoint || peer.address || '—'
            : fmtDateTime(peer.handshakeAt, de)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>
        {mode === 'online' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#22c55e', fontWeight: 700 }}>
            <Glyph d={ICON.clock} size={11} color="#22c55e" circle /> {fmtRelative(peer.handshakeAt, now, de)}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{fmtRelative(peer.handshakeAt, now, de)}</span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }} title="empfangen / received">
            <Glyph d={ICON.down} size={10} color="#06b6d4" />
            {fmtBytes(peer.rx)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }} title="gesendet / sent">
            <Glyph d={ICON.up} size={10} color="#a855f7" />
            {fmtBytes(peer.tx)}
          </span>
        </span>
      </div>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [data, setData] = useState<WgData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'online' | 'history'>('online')

  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const insecureTls = config.insecureTls === true
  const onlineMin = Math.max(1, num(config.onlineMinutes) || DEFAULT_ONLINE_MIN)
  const refreshMs = Math.max(15, num(config.refreshSeconds) || 30) * 1000
  const title = config.title === undefined ? 'WireGuard' : str(config.title)
  const showTitle = config.showTitle !== false
  const configured = Boolean(baseUrl) && Boolean(password)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/wireguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, username, password, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as WgData
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
  }, [baseUrl, configured, de, username, password, insecureTls])

  useEffect(() => {
    if (!active) return
    void refresh()
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
    containerType: 'inline-size',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Glyph d={ICON.shield} size={26} color="var(--accent)" />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'wg-easy-URL und Passwort in den Einstellungen eintragen (Benutzer nur bei v15).'
            : 'Enter the wg-easy URL and password in settings (username only for v15).'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div className="skeleton" style={{ height: 26, width: '60%', borderRadius: 8 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 40, borderRadius: 9 }} />
        ))}
      </div>
    )
  }

  const peers = Array.isArray(data?.peers) ? data!.peers : []
  const now = num(data?.now) || Date.now()
  const onlineMs = onlineMin * 60_000
  const isOnline = (p: WgPeer) => p.enabled && p.handshakeAt != null && now - p.handshakeAt <= onlineMs

  const onlinePeers = peers.filter(isOnline).sort((a, b) => (b.handshakeAt ?? 0) - (a.handshakeAt ?? 0))
  const historyPeers = [...peers].sort((a, b) => (b.handshakeAt ?? 0) - (a.handshakeAt ?? 0))
  const totalRx = peers.reduce((s, p) => s + p.rx, 0)
  const totalTx = peers.reduce((s, p) => s + p.tx, 0)

  const list = tab === 'online' ? onlinePeers : historyPeers
  const emptyText =
    tab === 'online'
      ? de
        ? 'Aktuell ist kein Peer online.'
        : 'No peer is online right now.'
      : de
        ? 'Noch keine Peers vorhanden.'
        : 'No peers yet.'

  return (
    <div style={shell}>
      <style>{WG_CSS}</style>
      {showTitle && title ? (
        <p style={{ margin: 0, fontSize: 'clamp(9px, 2.4cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {title}
        </p>
      ) : null}

      <StatHeader online={onlinePeers.length} total={peers.length} totalTx={totalTx} totalRx={totalRx} />

      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 9, background: 'color-mix(in srgb, var(--border) 35%, transparent)', alignSelf: 'flex-start' }}>
        <button className="wg-tab" data-active={tab === 'online'} onClick={() => setTab('online')}>
          {de ? `Online jetzt (${onlinePeers.length})` : `Online now (${onlinePeers.length})`}
        </button>
        <button className="wg-tab" data-active={tab === 'history'} onClick={() => setTab('history')}>
          {de ? 'Verlauf' : 'History'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.length === 0 ? (
          <p style={{ margin: 'auto', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>{emptyText}</p>
        ) : (
          list.map((peer, i) => <PeerRow key={peer.id || `${peer.name}-${i}`} peer={peer} now={now} de={de} mode={tab} />)
        )}
      </div>

      {error ? <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>{error}</p> : null}
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
  const showTitle = config.showTitle !== false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4, opacity: showTitle ? 1 : 0.5 }}>{de ? 'Titel-Text' : 'Title text'}</label>
        <input
          style={{ ...inp, opacity: showTitle ? 1 : 0.5 }}
          disabled={!showTitle}
          value={config.title === undefined ? 'WireGuard' : str(config.title)}
          placeholder="WireGuard"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>wg-easy URL</label>
        <input style={inp} value={str(config.baseUrl)} placeholder="http://192.168.1.50:51821" onChange={(e) => onChange('baseUrl', e.target.value)} />

        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'Benutzer (nur wg-easy v15)' : 'Username (wg-easy v15 only)'}</label>
        <input style={inp} value={str(config.username)} placeholder="admin" onChange={(e) => onChange('username', e.target.value)} />

        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'Passwort' : 'Password'}</label>
        <input style={inp} type="password" value={str(config.password)} onChange={(e) => onChange('password', e.target.value)} />

        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Gleiches Login wie die wg-easy-Web-UI. v15: Benutzer + Passwort (2FA muss für die API aus sein). v14: nur Passwort. Abfrage läuft serverseitig über /api/plugins/wireguard.'
            : 'Same login as the wg-easy web UI. v15: username + password (2FA must be off for the API). v14: password only. Requests go server-side via /api/plugins/wireguard.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Online-Schwelle (Min.)' : 'Online threshold (min)'}</label>
          <input
            style={inp}
            type="number"
            min={1}
            max={60}
            value={num(config.onlineMinutes) || DEFAULT_ONLINE_MIN}
            onChange={(e) => onChange('onlineMinutes', Math.max(1, num(e.target.value) || DEFAULT_ONLINE_MIN))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
          <input
            style={inp}
            type="number"
            min={15}
            max={3600}
            value={num(config.refreshSeconds) || 30}
            onChange={(e) => onChange('refreshSeconds', Math.max(15, num(e.target.value) || 30))}
          />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.insecureTls === true} onChange={(e) => onChange('insecureTls', e.target.checked)} />
        {de ? 'Selbstsigniertes TLS-Zertifikat akzeptieren (nur HTTPS hinter Reverse-Proxy)' : 'Accept self-signed TLS certificate (HTTPS behind a reverse proxy only)'}
      </label>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'wireguard',
  name: 'WireGuard',
  description:
    'WireGuard-Peers per wg-easy: wer jetzt online ist (frischer Handshake), Verlauf mit letztem Handshake (Datum/Zeit) und Transfervolumen (↓ empfangen / ↑ gesendet). Erkennt wg-easy v15 (Basic-Auth) und v14 (Session) automatisch. (Beta)',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🔒',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/wireguard.png',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'WireGuard' },
    { key: 'baseUrl', label: 'wg-easy URL', type: 'text', defaultValue: '' },
    { key: 'username', label: 'Benutzer (v15)', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'onlineMinutes', label: 'Online-Schwelle (Min.)', type: 'number', defaultValue: DEFAULT_ONLINE_MIN },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
    { key: 'insecureTls', label: 'Selbstsigniertes TLS akzeptieren', type: 'boolean', defaultValue: false },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
