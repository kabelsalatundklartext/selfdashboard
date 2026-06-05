'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type JellyfinSession = {
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
  return t
}

function formatTicks(ticks: number): string {
  const sec = Math.round(ticks / 10_000_000)
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function lineTitle(s: JellyfinSession, de: boolean): string {
  const item = s.NowPlayingItem
  if (!item) return '—'
  const series = str(item.SeriesName)
  const name = str(item.Name)
  if (series && name) return `${series} — ${name}`
  return name || series || str(item.Type) || (de ? 'Wiedergabe' : 'Playback')
}

async function fetchSessions(baseUrl: string, apiKey: string): Promise<JellyfinSession[]> {
  // Jellyfin akzeptiert den Emby-kompatiblen Token-Header.
  const headers = { Accept: 'application/json', 'X-Emby-Token': apiKey }
  const res = await fetch(`${baseUrl}/Sessions`, { method: 'GET', headers, cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      res.status === 401
        ? '401 — API-Key prüfen'
        : `HTTP ${res.status}${body ? `: ${body.slice(0, 100)}` : ''}`,
    )
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

function activeSessions(sessions: JellyfinSession[]): JellyfinSession[] {
  return sessions.filter((s) => s.NowPlayingItem && (s.NowPlayingItem.Name || s.NowPlayingItem.SeriesName))
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [sessions, setSessions] = useState<JellyfinSession[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = normalizeBaseUrl(str(config.baseUrl))
  const apiKey = str(config.apiKey)
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 10) * 1000
  const titleRaw = config.title === undefined ? 'Jellyfin' : str(config.title)
  const configured = Boolean(baseUrl && apiKey)

  const refresh = useCallback(async () => {
    if (!configured) {
      setSessions([])
      setError(null)
      setLoading(false)
      return
    }
    try {
      setSessions(activeSessions(await fetchSessions(baseUrl, apiKey)))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [apiKey, baseUrl, configured])

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
    padding: '8px 10px 10px',
    containerType: 'size',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🪼</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Jellyfin-URL und API-Key in den Einstellungen eintragen.'
            : 'Enter Jellyfin URL and API key in settings.'}
        </p>
      </div>
    )
  }

  if (loading && sessions.length === 0 && !error) {
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
      {titleRaw ? (
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
          {titleRaw}
        </p>
      ) : null}

      {sessions.length === 0 && !error ? (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Keine aktive Wiedergabe.' : 'Nothing playing.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', minWidth: 0 }}>
          {sessions.map((s, idx) => {
            const user = str(s.UserName) || (de ? 'Nutzer' : 'User')
            const paused = s.PlayState?.IsPaused === true
            const pos = num(s.PlayState?.PositionTicks)
            const run = num(s.NowPlayingItem?.RunTimeTicks)
            const duration = run > 0 ? `${formatTicks(pos)} / ${formatTicks(run)}` : formatTicks(pos)
            const title = lineTitle(s, de)
            return (
              <li
                key={s.Id ?? `${user}-${idx}`}
                title={`${user}: ${title} · ${duration}`}
                style={{
                  listStyle: 'none',
                  padding: idx < sessions.length - 1 ? '0 0 10px 0' : 0,
                  margin: 0,
                  borderBottom: idx < sessions.length - 1 ? '1px solid var(--border)' : 'none',
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
                  <span
                    aria-hidden
                    style={{
                      fontSize: '0.75em',
                      color: paused ? '#f59e0b' : 'var(--accent)',
                      flexShrink: 0,
                      width: '1em',
                      textAlign: 'center',
                    }}
                  >
                    {paused ? '⏸' : '▶'}
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
                    {user}
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
                    {title}
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
                    {duration}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {error ? (
        <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>
          Jellyfin: {error}
        </p>
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
          value={config.title === undefined ? 'Jellyfin' : str(config.title)}
          placeholder="Jellyfin"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.20:8096"
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
            ? 'Jellyfin → Administration → API-Schlüssel. Browser ruft Jellyfin direkt auf — bei HTTPS-Dashboard ggf. Mixed-Content/CORS beachten.'
            : 'Jellyfin → Dashboard → API Keys. The browser calls Jellyfin directly — mind mixed content/CORS on HTTPS dashboards.'}
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
  id: 'jellyfin',
  name: 'Jellyfin',
  description:
    'Aktive Wiedergaben vom Jellyfin-Server: Nutzer, Titel, Fortschritt, Pause (Sessions-API, Basis-URL + API-Key).',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🪼',
  iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/jellyfin.png',
  defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Jellyfin' },
    { key: 'baseUrl', label: 'Jellyfin URL', type: 'text', defaultValue: '' },
    { key: 'apiKey', label: 'API-Key', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 10 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
