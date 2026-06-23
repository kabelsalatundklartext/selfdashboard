'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type Source = 'selfstream' | 'emby' | 'jellyfin'

type StreamRow = {
  id: string
  source: Source
  user: string
  title: string
  duration: string
  paused?: boolean
  isCatchup?: boolean
}

type SelfstreamSession = {
  user?: string
  channel?: string
  title?: string
  durationSec?: number
  isCatchup?: boolean
}

type EmbySession = {
  Id?: string
  UserName?: string
  DeviceName?: string
  Client?: string
  PlayState?: { IsPaused?: boolean; PositionTicks?: number }
  NowPlayingItem?: {
    Name?: string
    SeriesName?: string
    Type?: string
    RunTimeTicks?: number
  }
}

const SOURCE_ICON: Record<Source, string> = {
  selfstream: '/plugin-logos/selfstream.png',
  emby: '/plugin-logos/emby.png',
  // Original-Logo von der Icon-CDN (wie beim Docker-Plugin).
  jellyfin: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyfin.png',
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

function normalizeBaseUrl(raw: string): string {
  let t = raw.trim().replace(/\/$/, '')
  if (!t) return ''
  if (!/^https?:\/\//i.test(t)) t = `http://${t}`
  if (t.endsWith('/admin')) t = t.slice(0, -6).replace(/\/$/, '')
  return t
}

function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const t = Math.floor(sec)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTicks(ticks: number): string {
  return formatSec(Math.round(ticks / 10_000_000))
}

function selfstreamLineTitle(s: SelfstreamSession): string {
  const title = str(s.title)
  const channel = str(s.channel)
  if (title && channel && title !== channel) return `${title} · ${channel}`
  return title || channel || '—'
}

function embyLineTitle(s: EmbySession, de: boolean): string {
  const item = s.NowPlayingItem
  if (!item) return '—'
  const series = str(item.SeriesName)
  const name = str(item.Name)
  if (series && name) return `${series} — ${name}`
  return name || series || str(item.Type) || (de ? 'Wiedergabe' : 'Playback')
}

function selfstreamErrorText(code: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Admin-Passwort falsch.', 'Invalid admin password.'],
    rate_limited: ['Zu viele Fehlversuche — kurz warten.', 'Too many attempts — wait briefly.'],
    api_not_found: ['API nicht gefunden — URL/Port prüfen.', 'API not found — check URL/port.'],
    missing_password: ['Selfstream-Passwort fehlt.', 'Selfstream password missing.'],
    timeout: ['Zeitüberschreitung (Selfstream).', 'Selfstream timeout.'],
    network_error: ['Selfstream nicht erreichbar.', 'Selfstream unreachable.'],
  }
  const pair = map[code]
  return pair ? pair[de ? 0 : 1] : code
}

async function fetchSelfstreamSessions(
  url: string,
  password: string,
): Promise<{ sessions: SelfstreamSession[]; error?: string }> {
  const res = await fetch('/api/plugins/selfstream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, password }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    sessions?: SelfstreamSession[]
  }
  if (!res.ok) {
    return { sessions: [], error: json.error || `HTTP ${res.status}` }
  }
  return { sessions: Array.isArray(json.sessions) ? json.sessions : [] }
}

// Emby/Jellyfin-Sessions über den eigenen Server-Proxy holen (server-zu-server,
// SSRF-Guard) statt direkt aus dem Browser — kein API-Key im DevTools-Netzwerk
// und kein CORS-Bruch hinter einem Reverse-Proxy/HTTPS.
async function fetchEmbySessions(baseUrl: string, apiKey: string): Promise<EmbySession[]> {
  const res = await fetch('/api/plugins/selfstream-emby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: baseUrl, apiKey }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    detail?: string
    sessions?: EmbySession[]
  }
  if (!res.ok) {
    const msg =
      json.error === 'auth_failed'
        ? '401 — API-Key prüfen'
        : json.detail || json.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return Array.isArray(json.sessions) ? json.sessions : []
}

function activeEmbySessions(sessions: EmbySession[]): EmbySession[] {
  return sessions.filter((s) => s.NowPlayingItem && (s.NowPlayingItem.Name || s.NowPlayingItem.SeriesName))
}

function SourceIcon({ source }: { source: Source }) {
  return (
    <img
      src={SOURCE_ICON[source]}
      alt=""
      width={14}
      height={14}
      style={{ flexShrink: 0, objectFit: 'contain', borderRadius: 2 }}
    />
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [rows, setRows] = useState<StreamRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const selfstreamUrl = normalizeBaseUrl(str(config.selfstreamUrl))
  const selfstreamPassword = str(config.selfstreamPassword)
  const embyUrl = normalizeBaseUrl(str(config.embyUrl))
  const embyApiKey = str(config.embyApiKey)
  const jellyfinUrl = normalizeBaseUrl(str(config.jellyfinUrl))
  const jellyfinApiKey = str(config.jellyfinApiKey)
  const selfstreamEnabled = config.selfstreamEnabled !== false
  const embyEnabled = config.embyEnabled !== false
  const jellyfinEnabled = config.jellyfinEnabled !== false
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 10) * 1000
  // Konfigurierbarer Widget-Titel — leer = Kopfzeile ausblenden.
  const widgetTitle = config.title === undefined ? 'Selfstream-Emby' : str(config.title)

  const hasSelfstream = selfstreamEnabled && Boolean(selfstreamUrl && selfstreamPassword)
  const hasEmby = embyEnabled && Boolean(embyUrl && embyApiKey)
  const hasJellyfin = jellyfinEnabled && Boolean(jellyfinUrl && jellyfinApiKey)
  const configured = hasSelfstream || hasEmby || hasJellyfin

  const refresh = useCallback(async () => {
    if (!configured) {
      setRows([])
      setErrors([])
      setLoading(false)
      return
    }

    const nextErrors: string[] = []
    const merged: StreamRow[] = []

    if (hasSelfstream) {
      try {
        const { sessions, error } = await fetchSelfstreamSessions(selfstreamUrl, selfstreamPassword)
        if (error) nextErrors.push(`Selfstream: ${selfstreamErrorText(error, de)}`)
        for (const s of sessions) {
          const user = str(s.user) || (de ? 'Nutzer' : 'User')
          merged.push({
            id: `ss-${user}-${selfstreamLineTitle(s)}`,
            source: 'selfstream',
            user,
            title: selfstreamLineTitle(s),
            duration: formatSec(num(s.durationSec)),
            isCatchup: s.isCatchup === true,
          })
        }
      } catch (e) {
        nextErrors.push(`Selfstream: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // Emby und Jellyfin teilen sich dieselbe Sessions-API.
    const mediaServers: Array<{ source: Source; url: string; key: string; label: string; enabled: boolean }> = [
      { source: 'emby', url: embyUrl, key: embyApiKey, label: 'Emby', enabled: hasEmby },
      { source: 'jellyfin', url: jellyfinUrl, key: jellyfinApiKey, label: 'Jellyfin', enabled: hasJellyfin },
    ]
    for (const srv of mediaServers) {
      if (!srv.enabled) continue
      try {
        const sessions = activeEmbySessions(await fetchEmbySessions(srv.url, srv.key))
        for (const s of sessions) {
          const user = str(s.UserName) || (de ? 'Nutzer' : 'User')
          const pos = num(s.PlayState?.PositionTicks)
          const run = num(s.NowPlayingItem?.RunTimeTicks)
          const duration =
            run > 0 ? `${formatTicks(pos)} / ${formatTicks(run)}` : formatTicks(pos)
          merged.push({
            id: `${srv.source}-${s.Id ?? user}-${embyLineTitle(s, de)}`,
            source: srv.source,
            user,
            title: embyLineTitle(s, de),
            duration,
            paused: s.PlayState?.IsPaused === true,
          })
        }
      } catch (e) {
        nextErrors.push(`${srv.label}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    setRows(merged)
    setErrors(nextErrors)
    setLoading(false)
  }, [configured, de, embyApiKey, embyUrl, hasEmby, hasJellyfin, hasSelfstream, jellyfinApiKey, jellyfinUrl, selfstreamPassword, selfstreamUrl])

  useEffect(() => {
    if (!active) return
    setLoading(true)
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
    padding: '8px 10px 10px',
    containerType: 'size',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const hint = useMemo(() => {
    if (configured) return null
    return de
      ? 'Selfstream-URL/Passwort, Emby- und/oder Jellyfin-URL/API-Key in den Einstellungen eintragen.'
      : 'Enter Selfstream URL/password, Emby and/or Jellyfin URL/API key in settings.'
  }, [configured, de])

  if (hint) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>📺</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>{hint}</p>
      </div>
    )
  }

  if (loading && rows.length === 0 && errors.length === 0) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 10, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>
      {widgetTitle ? (
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
          {widgetTitle}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Keine aktive Wiedergabe.' : 'Nothing playing.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', minWidth: 0 }}>
          {rows.map((row, idx) => {
            const playIcon = row.paused ? '⏸' : row.isCatchup ? '⏪' : '▶'
            const playColor = row.paused ? '#f59e0b' : row.isCatchup ? '#a78bfa' : 'var(--accent)'
            return (
              <li
                key={row.id}
                title={`${row.user}: ${row.title} · ${row.duration}`}
                style={{
                  listStyle: 'none',
                  padding: idx < rows.length - 1 ? '0 0 10px 0' : 0,
                  margin: 0,
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    minWidth: 0,
                    fontSize: 'clamp(10px, 2.8cqmin, 12px)',
                    lineHeight: 1.35,
                  }}
                >
                  <SourceIcon source={row.source} />
                  <span
                    aria-hidden
                    style={{
                      fontSize: '0.75em',
                      color: playColor,
                      flexShrink: 0,
                      width: '1em',
                      textAlign: 'center',
                    }}
                  >
                    {playIcon}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--text)',
                      flexShrink: 0,
                      maxWidth: '34%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.user}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.85 }}>:</span>
                  <span
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {row.title}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.85 }}>:</span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {row.duration}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {errors.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {errors.map((msg) => (
            <p key={msg} style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {msg}
            </p>
          ))}
        </div>
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
          value={config.title === undefined ? 'Selfstream-Emby' : str(config.title)}
          placeholder={de ? 'z. B. Streams' : 'e.g. Streams'}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Selfstream
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
          <input type="checkbox" checked={config.selfstreamEnabled !== false} onChange={(e) => onChange('selfstreamEnabled', e.target.checked)} />
          <span>{de ? 'Aktiv' : 'Enabled'}</span>
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.selfstreamUrl)}
          placeholder="http://192.168.1.10:8080"
          onChange={(e) => onChange('selfstreamUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Admin-Passwort' : 'Admin password'}
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.selfstreamPassword)}
          onChange={(e) => onChange('selfstreamPassword', e.target.value)}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Emby
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
          <input type="checkbox" checked={config.embyEnabled !== false} onChange={(e) => onChange('embyEnabled', e.target.checked)} />
          <span>{de ? 'Aktiv' : 'Enabled'}</span>
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.embyUrl)}
          placeholder="http://192.168.1.20:8096"
          onChange={(e) => onChange('embyUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Key</label>
        <input
          style={inp}
          type="password"
          value={str(config.embyApiKey)}
          onChange={(e) => onChange('embyApiKey', e.target.value)}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Jellyfin
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
          <input type="checkbox" checked={config.jellyfinEnabled !== false} onChange={(e) => onChange('jellyfinEnabled', e.target.checked)} />
          <span>{de ? 'Aktiv' : 'Enabled'}</span>
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.jellyfinUrl)}
          placeholder="http://192.168.1.21:8096"
          onChange={(e) => onChange('jellyfinUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Key</label>
        <input
          style={inp}
          type="password"
          value={str(config.jellyfinApiKey)}
          onChange={(e) => onChange('jellyfinApiKey', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Nur ausfüllen, was du nutzt — Selfstream, Emby und Jellyfin sind alle optional.'
            : 'Only fill in what you use — Selfstream, Emby and Jellyfin are all optional.'}
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
          max={300}
          value={num(config.refreshSeconds) || 10}
          onChange={(e) => onChange('refreshSeconds', Math.max(5, num(e.target.value) || 10))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'selfstream-emby',
  name: 'Selfstream · Emby · Jellyfin',
  description:
    'Selfstream, Emby und Jellyfin in einer Liste — Quellen-Icon pro Zeile, Widget-Titel anpassbar. Alle Quellen optional.',
  version: '1.4.0',
  author: 'SelfDashboard',
  category: 'media',
  icon: '📺',
  iconUrl: '/api/plugins/custom-assets/selfstream-emby/icon.png',
  defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Selfstream-Emby' },
    { key: 'selfstreamUrl', label: 'Selfstream URL', type: 'text', defaultValue: '' },
    { key: 'selfstreamPassword', label: 'Selfstream Passwort', type: 'password', defaultValue: '' },
    { key: 'embyUrl', label: 'Emby URL', type: 'text', defaultValue: '' },
    { key: 'embyApiKey', label: 'Emby API-Key', type: 'password', defaultValue: '' },
    { key: 'jellyfinUrl', label: 'Jellyfin URL', type: 'text', defaultValue: '' },
    { key: 'jellyfinApiKey', label: 'Jellyfin API-Key', type: 'password', defaultValue: '' },
    { key: 'selfstreamEnabled', label: 'Selfstream aktiv', type: 'boolean', defaultValue: true },
    { key: 'embyEnabled', label: 'Emby aktiv', type: 'boolean', defaultValue: true },
    { key: 'jellyfinEnabled', label: 'Jellyfin aktiv', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 10 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
