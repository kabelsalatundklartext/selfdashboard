'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type PlexSession = {
  user: string
  title: string
  state: 'playing' | 'paused'
  positionMs: number | null
  durationMs: number | null
  player: string
}

type PlexPayload = {
  sessions?: PlexSession[]
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

/** ms → "mm:ss" bzw. "h:mm:ss" */
function fmtMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['X-Plex-Token prüfen.', 'Check X-Plex-Token.'],
    missing_token: ['X-Plex-Token fehlt — in den Einstellungen eintragen.', 'X-Plex-Token missing — enter it in settings.'],
    upstream_error: ['Plex-Antwort fehlerhaft — URL prüfen (Port 32400).', 'Bad Plex response — check URL (port 32400).'],
    invalid_response: ['Antwort war kein JSON — Basis-URL prüfen.', 'Response was not JSON — check base URL.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Plex nicht erreichbar (Port 32400?).', 'Plex unreachable (port 32400?).'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function SessionRow({ session }: { session: PlexSession }) {
  const playing = session.state === 'playing'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        padding: '5px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 'clamp(11px, 3cqmin, 14px)', flexShrink: 0 }} title={session.state}>
        {playing ? '▶' : '⏸'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 'clamp(10px, 2.8cqmin, 13px)',
            fontWeight: 700,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {session.user}
          {session.player ? (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {session.player}</span>
          ) : null}
        </span>
        <span
          style={{
            fontSize: 'clamp(9px, 2.5cqmin, 12px)',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={session.title}
        >
          {session.title}
        </span>
      </div>
      <span
        style={{
          fontSize: 'clamp(8px, 2.3cqmin, 11px)',
          color: playing ? 'var(--accent)' : 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {fmtMs(session.positionMs)} / {fmtMs(session.durationMs)}
      </span>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [data, setData] = useState<PlexPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const token = str(config.token)
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 15) * 1000
  const title = config.title === undefined ? 'Plex' : str(config.title)
  const configured = Boolean(baseUrl) && Boolean(token)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/plex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, token }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as PlexPayload
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
    gap: 6,
  }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🎬</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Plex-URL und X-Plex-Token in den Einstellungen eintragen.'
            : 'Enter Plex URL and X-Plex-Token in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 65].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  const sessions = data?.sessions ?? []

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
              {sessions.length === 1
                ? de
                  ? '1 Stream'
                  : '1 stream'
                : de
                  ? `${sessions.length} Streams`
                  : `${sessions.length} streams`}
            </span>
          ) : null}
        </p>
      ) : null}

      {data ? (
        sessions.length > 0 ? (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {sessions.map((s, i) => (
              <SessionRow key={i} session={s} />
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              {de ? 'Keine aktive Wiedergabe.' : 'No active playback.'}
            </p>
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
          value={config.title === undefined ? 'Plex' : str(config.title)}
          placeholder="Plex"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.40:32400"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>X-Plex-Token</label>
        <input
          style={inp}
          type="password"
          value={str(config.token)}
          onChange={(e) => onChange('token', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Token finden: app.plex.tv → beliebiges Medium → Medieninfo → „XML anzeigen" → X-Plex-Token in der URL. Abfrage läuft serverseitig über /api/plugins/plex.'
            : 'Find the token: app.plex.tv → any media item → media info → "View XML" → X-Plex-Token in the URL. Requests go server-side via /api/plugins/plex.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={3600}
          value={num(config.refreshSeconds) || 15}
          onChange={(e) => onChange('refreshSeconds', Math.max(5, num(e.target.value) || 15))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'plex',
  name: 'Plex',
  description:
    'Aktive Plex-Wiedergaben: Nutzer, Titel, Fortschritt, Pause — serverseitig per X-Plex-Token. (Beta)',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🎬',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/plex.png',
  defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Plex' },
    { key: 'baseUrl', label: 'Plex URL', type: 'text', defaultValue: '' },
    { key: 'token', label: 'X-Plex-Token', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 15 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
