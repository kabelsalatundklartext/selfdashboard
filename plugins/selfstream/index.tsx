'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { SelfstreamDashboardPayload, SelfstreamNowPlayingItem } from '@/lib/selfstreamTypes'

export const meta: PluginMeta = {
  id: 'selfstream',
  name: 'Selfstream',
  description:
    'Aktive IPTV-Streams aus dem Selfstream-Admin: Nutzer, Sender/Sendung und Laufzeit. Admin-Passwort wird serverseitig als API-Token genutzt.',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '📺',
  iconUrl: '/plugin-logos/selfstream.png',
  defaultLayout: { w: 4, h: 5, minW: 3, minH: 4 },
}

function normalizeBase(url: string): string {
  let s = url.trim().replace(/\/$/, '')
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  if (s.endsWith('/admin')) s = s.slice(0, -'/admin'.length).replace(/\/$/, '')
  return s
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  return `${m}:${String(r).padStart(2, '0')}`
}

function displayLine(item: SelfstreamNowPlayingItem): string {
  const showChannel = item.title && item.channel && item.title !== item.channel
  if (showChannel) return `${item.title} · ${item.channel}`
  return item.title || item.channel || '—'
}

function errLabel(code: string, de: boolean): string {
  const map: Record<string, string> = de
    ? {
        auth_failed: 'Admin-Passwort falsch.',
        rate_limited: 'Zu viele Fehlversuche — Selfstream blockiert kurz.',
        api_not_found: 'API nicht gefunden — Admin-URL (Port 8080) prüfen.',
        missing_password: 'Passwort fehlt.',
        timeout: 'Zeitüberschreitung.',
        network_error: 'Selfstream nicht erreichbar (Netzwerk/Docker).',
        selfstream_error: 'Fehler bei Selfstream.',
      }
    : {
        auth_failed: 'Invalid admin password.',
        rate_limited: 'Too many failed attempts — Selfstream temporarily locked.',
        api_not_found: 'API not found — check admin URL (port 8080).',
        missing_password: 'Password missing.',
        timeout: 'Request timed out.',
        network_error: 'Cannot reach Selfstream (network/Docker).',
        selfstream_error: 'Selfstream error.',
      }
  return map[code] || code
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
  const { de } = usePluginLocale()
  const [data, setData] = useState<SelfstreamDashboardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const base = normalizeBase((config.url as string) || '')
  const password = String(config.password || '').trim()
  const refresh = ((config.refreshInterval as number) ?? 10) * 1000
  const showIp = config.showIp === true

  const fetch_ = useCallback(async () => {
    if (!base || !password) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/selfstream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ url: base, password }),
      })
      const j = (await res.json()) as SelfstreamDashboardPayload & { error?: string; detail?: string }
      if (!res.ok) {
        const code = j.error || 'selfstream_error'
        const detail = j.detail ? ` — ${j.detail}` : ''
        setError(`${code}${detail}`)
        setData(null)
        return
      }
      setData(j)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [base, password])

  useEffect(() => {
    void fetch_()
    const id = window.setInterval(() => void fetch_(), refresh)
    return () => window.clearInterval(id)
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

  if (!base || !password) {
    return (
      <EmptyState de={de} shell={shell} />
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
    const code = error.split(' — ')[0]
    const detail = error.includes(' — ') ? error.split(' — ').slice(1).join(' — ') : undefined
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '22px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', wordBreak: 'break-word' }}>{errLabel(code, de)}</p>
        {detail ? <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>{detail}</p> : null}
      </div>
    )
  }

  const sessions = data?.sessions ?? []

  return (
    <div style={shell}>
      <Heading text="Selfstream" />
      {sessions.length === 0 ? (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Kein aktiver Stream.' : 'No active stream.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {sessions.map((item, i) => {
            const user = item.user || (de ? 'Nutzer' : 'User')
            const tit = displayLine(item)
            const prog = formatDuration(item.durationSec)
            const tip = [user, tit, prog, showIp && item.ip ? item.ip : ''].filter(Boolean).join('\n')
            const fs = 'clamp(10px, 2.8cqmin, 12px)'
            return (
              <li
                key={`${item.user}-${item.channel}-${item.title}-${i}`}
                title={tip}
                style={{
                  listStyle: 'none',
                  padding: i < sessions.length - 1 ? '0 0 10px 0' : 0,
                  margin: 0,
                  borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    minWidth: 0,
                    fontSize: fs,
                    lineHeight: 1.35,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flex: '0 1 34%',
                      minWidth: 0,
                      maxWidth: '42%',
                      fontWeight: 700,
                      color: 'var(--text)',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        fontSize: '0.75em',
                        color: item.isCatchup ? '#a78bfa' : 'var(--accent)',
                        flexShrink: 0,
                        width: '1em',
                        textAlign: 'center',
                      }}
                    >
                      {item.isCatchup ? '⏪' : '▶'}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{user}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.85 }}>:</span>
                  <TitleCol tit={tit} prog={prog} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function EmptyState({ de, shell }: { de: boolean; shell: React.CSSProperties }) {
  return (
    <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <span style={{ fontSize: '28px' }}>📺</span>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
        {de ? (
          <>
            Selfstream Admin-URL (Port 8080)
            <br />
            und Admin-Passwort in den Einstellungen
          </>
        ) : (
          <>
            Selfstream admin URL (port 8080)
            <br />
            and admin password in settings
          </>
        )}
      </p>
    </div>
  )
}

function TitleCol({ tit, prog }: { tit: string; prog: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '5px',
        minWidth: 0,
        flex: '1 1 0%',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: '1 1 auto',
          color: 'var(--text)',
          fontWeight: 500,
        }}
      >
        {tit}
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
        {prog}
      </span>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Admin-Panel-URL' : 'Admin panel URL'}
        </label>
        <input style={inp} value={(config.url as string) || ''} onChange={(e) => onChange('url', e.target.value)} placeholder="http://192.168.1.69:8080" />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de ? 'Port 8080 (nicht 8000). /admin am Ende ist optional.' : 'Port 8080 (not 8000). Trailing /admin is optional.'}
        </p>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Admin-Passwort' : 'Admin password'}
        </label>
        <input
          style={inp}
          type="password"
          value={(config.password as string) || ''}
          onChange={(e) => onChange('password', e.target.value)}
          placeholder={de ? 'Gleiches Kennwort wie beim Login' : 'Same password as admin login'}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Wird serverseitig als X-Admin-Token an /api/stats gesendet (wie im Selfstream-Admin nach dem Login).'
            : 'Sent server-side only as X-Admin-Token to /api/stats (same as Selfstream admin after login).'}
        </p>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 10} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
        <input type="checkbox" checked={config.showIp === true} onChange={(e) => onChange('showIp', e.target.checked)} />
        {de ? 'IP im Tooltip anzeigen' : 'Show IP in tooltip'}
      </label>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
