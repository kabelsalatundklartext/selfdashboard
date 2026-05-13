'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'emby',
  name: 'Emby',
  description:
    'Aktive Wiedergaben per Emby-/Jellyfin-kompatibler API: Nutzer, Titel, Gerät, Pause (Basis-URL + API-Key).',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🎬',
}

interface NowPlayingItem {
  Name?: string
  SeriesName?: string
  Type?: string
  RunTimeTicks?: number
}

interface Session {
  Id?: string
  UserName?: string
  DeviceName?: string
  Client?: string
  NowPlayingItem?: NowPlayingItem
  PlayState?: { IsPaused?: boolean; PositionTicks?: number }
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, '')
}

/** Emby: /emby/Sessions — Jellyfin: /Sessions */
async function fetchSessionsJson(base: string, apiKey: string): Promise<Session[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Emby-Token': apiKey,
  }
  const tryPaths = ['/emby/Sessions', '/Sessions']
  let lastErr: string | null = null
  for (const p of tryPaths) {
    const res = await fetch(`${base}${p}`, { method: 'GET', headers, cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as unknown
      return Array.isArray(data) ? (data as Session[]) : []
    }
    if (res.status === 404) continue
    const t = await res.text().catch(() => '')
    lastErr = res.status === 401 ? '401 — API-Key prüfen' : `HTTP ${res.status}${t ? `: ${t.slice(0, 120)}` : ''}`
    throw new Error(lastErr || `HTTP ${res.status}`)
  }
  throw new Error(lastErr || 'Sessions-Endpoint nicht gefunden (/emby/Sessions oder /Sessions)')
}

async function fetchServerName(base: string, apiKey: string): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Emby-Token': apiKey,
  }
  for (const p of ['/emby/System/Info', '/System/Info']) {
    const res = await fetch(`${base}${p}`, { method: 'GET', headers, cache: 'no-store' })
    if (!res.ok) continue
    try {
      const j = (await res.json()) as Record<string, unknown>
      const name = String(j.ServerName ?? j.Name ?? '').trim()
      return name || null
    } catch {
      return null
    }
  }
  return null
}

function ticksToMs(ticks: number): number {
  return Math.round(ticks / 10000)
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function playingSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.NowPlayingItem && (s.NowPlayingItem.Name || s.NowPlayingItem.SeriesName))
}

function sessionTitle(s: Session): string {
  const it = s.NowPlayingItem
  if (!it) return '—'
  const series = it.SeriesName?.trim()
  const name = it.Name?.trim()
  if (series && name) return `${series} — ${name}`
  return name || series || it.Type || 'Wiedergabe'
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
  const [sessions, setSessions] = useState<Session[]>([])
  const [serverName, setServerName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const base = normalizeBase((config.url as string) || '')
  const apiKey = String(config.apiKey || '').trim()
  const refresh = ((config.refreshInterval as number) ?? 10) * 1000
  const showServer = config.showServerName !== false

  const fetch_ = useCallback(async () => {
    if (!base || !apiKey) {
      setLoading(false)
      return
    }
    try {
      const [list, name] = await Promise.all([
        fetchSessionsJson(base, apiKey),
        showServer ? fetchServerName(base, apiKey) : Promise.resolve(null),
      ])
      setSessions(list)
      setServerName(name)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base, apiKey, showServer])

  useEffect(() => {
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

  if (!base || !apiKey) {
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '28px' }}>🎬</span>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Emby-Basis-URL und API-Key
          <br />
          in den Einstellungen eintragen
        </p>
      </div>
    )
  }

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
          CORS: Aufruf aus dem Browser — gleiche Domain/Reverse-Proxy oder Emby-Netzwerk-Zugriff prüfen.
        </p>
      </div>
    )
  }

  const active = playingSessions(sessions)
  const title = serverName ? `Emby — ${serverName}` : 'Emby'

  return (
    <div style={shell}>
      <Heading text={title} />
      {active.length === 0 ? (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>Keine aktive Wiedergabe.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {active.map((s, i) => {
            const it = s.NowPlayingItem!
            const pos = num(s.PlayState?.PositionTicks)
            const run = num(it.RunTimeTicks)
            const prog = run > 0 ? `${formatDuration(ticksToMs(pos))} / ${formatDuration(ticksToMs(run))}` : formatDuration(ticksToMs(pos))
            const paused = s.PlayState?.IsPaused === true
            const device = [s.DeviceName, s.Client].filter(Boolean).join(' · ') || 'Gerät'
            const user = s.UserName || 'Nutzer'
            const tit = sessionTitle(s)
            const tip = [device, tit, prog].join('\n')
            const fs = 'clamp(10px, 2.8cqmin, 12px)'
            return (
              <li
                key={s.Id ?? `${user}-${device}-${tit}-${i}`}
                title={tip}
                style={{
                  listStyle: 'none',
                  padding: i < active.length - 1 ? '0 0 10px 0' : 0,
                  margin: 0,
                  borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 0.42fr) 6px minmax(0, 1fr) 6px auto',
                    alignItems: 'center',
                    columnGap: '4px',
                    width: '100%',
                    minWidth: 0,
                    fontSize: fs,
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      overflow: 'hidden',
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{user}</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', textAlign: 'center', opacity: 0.85 }}>:</span>
                  <span
                    style={{
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {tit}
                  </span>
                  <span style={{ color: 'var(--text-muted)', textAlign: 'center', opacity: 0.85 }}>:</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {prog}
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

function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }} onClick={onToggle}>
      <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>{label}</span>
      <div
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: on ? '18px' : '2px',
            width: '16px',
            height: '16px',
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

  const sub = (key: string, def = true) => {
    const v = (config as Record<string, unknown>)[key]
    if (v === undefined || v === null) return def
    return v !== false
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Basis-URL (ohne /emby)
        </label>
        <input
          style={inp}
          value={(config.url as string) || ''}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="http://192.168.1.20:8096"
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          Jellyfin nutzt oft denselben Port — das Plugin versucht <code style={{ fontSize: '10px' }}>/emby/Sessions</code> und <code style={{ fontSize: '10px' }}>/Sessions</code>.
        </p>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          API-Key
        </label>
        <input style={inp} type="password" value={(config.apiKey as string) || ''} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="Emby → Dashboard → API-Schlüssel" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Aktualisierung (Sek.)
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 10} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>
      <ToggleRow label="Servername abfragen" on={sub('showServerName', true)} onToggle={() => onChange('showServerName', !sub('showServerName', true))} />
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
