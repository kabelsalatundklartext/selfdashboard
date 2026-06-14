'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const SPOTIFY_GREEN = '#1db954'

type PlayerState = {
  connected: boolean
  playing?: boolean
  hasTrack?: boolean
  title?: string
  artist?: string
  album?: string
  imageUrl?: string
  durationMs?: number
  progressMs?: number
  deviceName?: string
  premium?: boolean
  product?: string
  error?: string
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

/** ms → m:ss */
function fmtTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function redirectUriFor(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/api/plugins/spotify/callback`
}

async function postSpotify(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plugins/spotify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

// ---------------------------------------------------------------------------
// Inline SVG icons — self-contained so the widget never depends on the host's
// curated lucide icon set (those names are not all exposed to plugins).
// ---------------------------------------------------------------------------

type IconProps = { size?: number; color?: string }

function IconMusic({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M9 18V5l12-2v13" />
    </svg>
  )
}

function IconPlay({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconPause({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function IconPrev({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="5" y="5" width="2.5" height="14" rx="0.5" />
      <path d="M20 5v14l-10-7z" />
    </svg>
  )
}

function IconNext({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <rect x="16.5" y="5" width="2.5" height="14" rx="0.5" />
      <path d="M4 5v14l10-7z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const clientId = str(config.clientId)
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 10) * 1000
  const title = config.title === undefined ? 'Spotify' : str(config.title)
  const showTitle = config.showTitle !== false

  const [state, setState] = useState<PlayerState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  // Locally interpolated progress so the bar moves smoothly between polls.
  const [localProgress, setLocalProgress] = useState(0)
  const progressBase = useRef<{ at: number; ms: number; playing: boolean }>({ at: 0, ms: 0, playing: false })

  const refresh = useCallback(async () => {
    if (!clientId) {
      setLoading(false)
      return
    }
    try {
      const json = (await postSpotify({ action: 'state', clientId })) as PlayerState
      setState(json)
      if (json.connected && typeof json.progressMs === 'number') {
        progressBase.current = { at: performance.now(), ms: json.progressMs, playing: json.playing === true }
        setLocalProgress(json.progressMs)
      }
    } catch {
      setState({ connected: false, error: 'network_error' })
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  // Smooth progress ticking (1s) without hammering the API.
  useEffect(() => {
    const base = progressBase.current
    if (!base.playing) return
    const t = setInterval(() => {
      const elapsed = performance.now() - base.at
      setLocalProgress(base.ms + elapsed)
    }, 1000)
    return () => clearInterval(t)
  }, [state])

  const sendCommand = useCallback(
    async (command: string) => {
      if (!clientId || busy) return
      setBusy(true)
      // Optimistic toggle for play/pause so the button feels instant.
      if (command === 'play' || command === 'pause') {
        setState((s) => (s ? { ...s, playing: command === 'play' } : s))
      }
      try {
        await postSpotify({ action: 'control', clientId, command })
      } catch {
        /* surfaced on next poll */
      } finally {
        setTimeout(() => {
          setBusy(false)
          void refresh()
        }, 350)
      }
    },
    [clientId, busy, refresh],
  )

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '12px 14px',
    containerType: 'size',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const centered: CSSProperties = { ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }

  if (!clientId) {
    return (
      <div style={centered}>
        <IconMusic size={26} color={SPOTIFY_GREEN} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Client ID in den Einstellungen eintragen und mit Spotify verbinden.'
            : 'Enter the Client ID in settings and connect to Spotify.'}
        </p>
      </div>
    )
  }

  if (loading && !state) {
    return (
      <div style={shell}>
        <div className="skeleton" style={{ flex: 1, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 6 }} />
      </div>
    )
  }

  if (state && !state.connected) {
    return (
      <div style={centered}>
        <IconMusic size={26} color={SPOTIFY_GREEN} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de ? 'Nicht verbunden — in den Einstellungen mit Spotify verbinden.' : 'Not connected — connect in settings.'}
        </p>
      </div>
    )
  }

  const hasTrack = Boolean(state?.hasTrack)
  const duration = num(state?.durationMs)
  const progress = Math.min(localProgress, duration || localProgress)
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0
  const playing = state?.playing === true
  const premium = state?.premium === true

  return (
    <div style={shell}>
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

      {!hasTrack ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            {de ? 'Gerade läuft nichts.' : 'Nothing is playing right now.'}
            {state?.deviceName ? (
              <>
                <br />
                {state.deviceName}
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, alignItems: 'center' }}>
          {state?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.imageUrl}
              alt=""
              width={84}
              height={84}
              style={{
                width: 'clamp(56px, 28cqmin, 96px)',
                height: 'clamp(56px, 28cqmin, 96px)',
                borderRadius: 10,
                objectFit: 'cover',
                flex: '0 0 auto',
                boxShadow: '0 6px 18px -8px rgba(0,0,0,0.6)',
              }}
            />
          ) : (
            <div
              style={{
                width: 'clamp(56px, 28cqmin, 96px)',
                height: 'clamp(56px, 28cqmin, 96px)',
                borderRadius: 10,
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              <IconMusic size={24} color={SPOTIFY_GREEN} />
            </div>
          )}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            <span
              style={{
                fontSize: 'clamp(13px, 4.6cqmin, 17px)',
                fontWeight: 700,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {state?.title}
            </span>
            <span
              style={{
                fontSize: 'clamp(11px, 3.4cqmin, 13px)',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {state?.artist}
            </span>
          </div>
        </div>
      )}

      {hasTrack && duration > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: SPOTIFY_GREEN, transition: 'width 1s linear' }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{fmtTime(progress)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <ControlButton onClick={() => void sendCommand('previous')} disabled={!premium || busy} title={de ? 'Zurück' : 'Previous'}>
          <IconPrev size={20} />
        </ControlButton>
        <ControlButton
          primary
          onClick={() => void sendCommand(playing ? 'pause' : 'play')}
          disabled={!premium || busy}
          title={playing ? 'Pause' : de ? 'Abspielen' : 'Play'}
        >
          {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
        </ControlButton>
        <ControlButton onClick={() => void sendCommand('next')} disabled={!premium || busy} title={de ? 'Weiter' : 'Next'}>
          <IconNext size={20} />
        </ControlButton>
      </div>

      {!premium ? (
        <p style={{ margin: 0, fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
          {de ? 'Steuerung erfordert Spotify Premium.' : 'Playback control requires Spotify Premium.'}
        </p>
      ) : null}
    </div>
  )
}

function ControlButton({
  children,
  onClick,
  disabled,
  primary,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  title?: string
}) {
  const size = primary ? 42 : 34
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: primary ? SPOTIFY_GREEN : 'transparent',
        color: primary ? '#000' : 'var(--text)',
        opacity: disabled ? 0.4 : 1,
        transition: 'transform .12s ease, opacity .12s ease',
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.92)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Settings (Client ID/Secret + OAuth connect flow)
// ---------------------------------------------------------------------------

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
  const clientId = str(config.clientId)
  const showTitle = config.showTitle !== false
  const redirectUri = redirectUriFor()

  const [status, setStatus] = useState<{ connected: boolean; displayName?: string; product?: string } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStatus = useCallback(async () => {
    if (!clientId) {
      setStatus(null)
      return null
    }
    try {
      const json = (await postSpotify({ action: 'status', clientId })) as {
        connected: boolean
        displayName?: string
        product?: string
      }
      setStatus(json)
      return json
    } catch {
      return null
    }
  }, [clientId])

  useEffect(() => {
    void loadStatus()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadStatus])

  const connect = useCallback(async () => {
    const secret = str(config.clientSecret)
    if (!clientId || !secret) {
      setMsg(de ? 'Client ID und Client Secret eintragen.' : 'Enter Client ID and Client Secret.')
      return
    }
    setWorking(true)
    setMsg(null)
    try {
      const json = (await postSpotify({
        action: 'begin',
        clientId,
        clientSecret: secret,
        redirectUri,
      })) as { authUrl?: string; error?: string }
      if (!json.authUrl) {
        setMsg(de ? 'Konnte Autorisierung nicht starten.' : 'Could not start authorization.')
        setWorking(false)
        return
      }
      window.open(json.authUrl, 'spotify-auth', 'width=520,height=720')
      // Poll for completion for ~2 minutes.
      let tries = 0
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        tries++
        const s = await loadStatus()
        if (s?.connected || tries > 60) {
          if (pollRef.current) clearInterval(pollRef.current)
          setWorking(false)
          if (s?.connected) setMsg(de ? '✅ Verbunden.' : '✅ Connected.')
        }
      }, 2000)
    } catch {
      setMsg(de ? 'Netzwerkfehler.' : 'Network error.')
      setWorking(false)
    }
  }, [clientId, config.clientSecret, redirectUri, de, loadStatus])

  const disconnect = useCallback(async () => {
    if (!clientId) return
    setWorking(true)
    await postSpotify({ action: 'disconnect', clientId })
    setWorking(false)
    setMsg(de ? 'Verbindung getrennt.' : 'Disconnected.')
    void loadStatus()
  }, [clientId, de, loadStatus])

  const copyRedirect = useCallback(() => {
    if (!redirectUri) return
    void navigator.clipboard?.writeText(redirectUri).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [redirectUri])

  const connected = status?.connected === true

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title controls */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <input
          style={{ ...inp, opacity: showTitle ? 1 : 0.5 }}
          disabled={!showTitle}
          value={config.title === undefined ? 'Spotify' : str(config.title)}
          placeholder="Spotify"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      {/* Credentials */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Client ID</label>
        <input style={inp} value={clientId} placeholder="z. B. a1b2c3…" onChange={(e) => onChange('clientId', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>Client Secret</label>
        <input
          style={inp}
          type="password"
          value={str(config.clientSecret)}
          onChange={(e) => onChange('clientSecret', e.target.value)}
        />
      </div>

      {/* Redirect URI */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Redirect-URI (in der Spotify-App eintragen)' : 'Redirect URI (add it in the Spotify app)'}
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...inp, fontSize: 11 }} value={redirectUri} readOnly onFocus={(e) => e.target.select()} />
          <button
            type="button"
            onClick={copyRedirect}
            style={{
              ...inp,
              width: 'auto',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderColor: copied ? SPOTIFY_GREEN : 'var(--border)',
            }}
          >
            {copied ? (de ? 'Kopiert' : 'Copied') : de ? 'Kopieren' : 'Copy'}
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? 'Spotify Developer Dashboard → App → Settings → Redirect URIs: exakt diese URL eintragen. Spotify verlangt HTTPS (oder http://127.0.0.1) — bei LAN-Zugriff am besten über deinen Reverse-Proxy mit HTTPS.'
            : 'Spotify Developer Dashboard → App → Settings → Redirect URIs: add this exact URL. Spotify requires HTTPS (or http://127.0.0.1).'}
        </p>
      </div>

      {/* Connection status + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: connected ? SPOTIFY_GREEN : 'var(--text-muted)',
            flex: '0 0 auto',
          }}
        />
        <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
          {connected
            ? `${de ? 'Verbunden' : 'Connected'}${status?.displayName ? ` — ${status.displayName}` : ''}${status?.product ? ` (${status.product})` : ''}`
            : de
              ? 'Nicht verbunden'
              : 'Not connected'}
        </span>
        {connected ? (
          <button type="button" disabled={working} onClick={() => void disconnect()} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
            {de ? 'Trennen' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            disabled={working}
            onClick={() => void connect()}
            style={{
              ...inp,
              width: 'auto',
              cursor: 'pointer',
              background: SPOTIFY_GREEN,
              color: '#000',
              fontWeight: 700,
              borderColor: SPOTIFY_GREEN,
            }}
          >
            {working ? (de ? 'Warte…' : 'Waiting…') : de ? 'Verbinden' : 'Connect'}
          </button>
        )}
      </div>
      {msg ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{msg}</p> : null}

      {/* Refresh interval */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
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
  id: 'spotify',
  name: 'Spotify',
  description:
    'Aktueller Spotify-Titel mit Cover, Künstler und Fortschritt — plus Play/Pause/Skip-Steuerung. Verbindung per OAuth; Steuerung erfordert Premium. (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🎵',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/spotify.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Spotify' },
    { key: 'clientId', label: 'Client ID', type: 'text', defaultValue: '' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 10 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
