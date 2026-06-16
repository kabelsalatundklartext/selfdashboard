'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
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
  detail?: string
}

type SearchItem = {
  kind: 'track' | 'playlist'
  uri: string
  title: string
  subtitle: string
  imageUrl?: string
}

type DeviceItem = {
  id: string
  name: string
  type: string
  isActive: boolean
  isRestricted: boolean
  volumePercent?: number
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

/** Human-readable text for a failed state/connection response. */
function connErrorText(code: string | undefined, de: boolean, detail?: string): string {
  switch (code) {
    case 'reauth_required':
    case 'not_connected':
      return de
        ? 'Verbindung abgelaufen — bitte neu verbinden (Trennen → Verbinden).'
        : 'Connection expired — please reconnect (Disconnect → Connect).'
    case 'refresh_failed':
      return de
        ? 'Token-Erneuerung fehlgeschlagen — bitte neu verbinden.'
        : 'Token refresh failed — please reconnect.'
    case 'secret_unreadable':
      return de
        ? 'Client Secret nicht lesbar — Secret neu eintragen und verbinden.'
        : 'Client secret unreadable — re-enter it and reconnect.'
    case 'api_error':
      return `${de ? 'Spotify-API-Fehler' : 'Spotify API error'}${detail ? `: ${detail}` : '.'}`
    case 'network_error':
      return de ? 'Netzwerkfehler.' : 'Network error.'
    default:
      return de
        ? 'Nicht verbunden — in den Einstellungen mit Spotify verbinden.'
        : 'Not connected — connect in settings.'
  }
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

function IconSearch({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconClose({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function IconList({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function IconDevices({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="14" height="11" rx="1.5" />
      <path d="M7 19h6" />
      <path d="M9.5 15v4" />
      <rect x="18" y="9" width="4" height="11" rx="1" />
    </svg>
  )
}

function IconRefresh({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
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
  const [controlMsg, setControlMsg] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  // Preferred playback target chosen via the device picker; search results play here.
  const [deviceId, setDeviceId] = useState<string | null>(null)
  // Locally interpolated progress so the bar moves smoothly between polls.
  const [localProgress, setLocalProgress] = useState(0)
  const progressBase = useRef<{ at: number; ms: number; playing: boolean }>({ at: 0, ms: 0, playing: false })
  const { ref: shellRef, active } = usePollingActive<HTMLDivElement>()

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
    if (!active) return
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs, active])

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
        const json = await postSpotify({ action: 'control', clientId, command })
        const err = typeof json.error === 'string' ? json.error : ''
        if (err === 'forbidden') setControlMsg(de ? 'Steuerung erfordert Spotify Premium.' : 'Control requires Spotify Premium.')
        else if (err === 'no_active_device') setControlMsg(de ? 'Kein aktives Gerät — starte die Wiedergabe zuerst in Spotify.' : 'No active device — start playback in Spotify first.')
        else if (err) setControlMsg(de ? 'Aktion fehlgeschlagen.' : 'Action failed.')
        else setControlMsg(null)
      } catch {
        /* surfaced on next poll */
      } finally {
        setTimeout(() => {
          setBusy(false)
          void refresh()
        }, 350)
      }
    },
    [clientId, busy, refresh, de],
  )

  const seek = useCallback(
    async (positionMs: number) => {
      if (!clientId) return
      // Optimistic: jump the bar immediately so seeking feels instant.
      progressBase.current = { at: performance.now(), ms: positionMs, playing: state?.playing === true }
      setLocalProgress(positionMs)
      try {
        const payload: Record<string, unknown> = { action: 'seek', clientId, positionMs }
        if (deviceId) payload.deviceId = deviceId
        const json = await postSpotify(payload)
        const err = typeof json.error === 'string' ? json.error : ''
        if (err === 'forbidden') setControlMsg(de ? 'Steuerung erfordert Spotify Premium.' : 'Control requires Spotify Premium.')
        else if (err === 'no_active_device') setControlMsg(de ? 'Kein aktives Gerät — starte die Wiedergabe zuerst in Spotify.' : 'No active device — start playback in Spotify first.')
        else if (err) setControlMsg(de ? 'Aktion fehlgeschlagen.' : 'Action failed.')
        else setControlMsg(null)
      } catch {
        /* surfaced on next poll */
      } finally {
        setTimeout(() => void refresh(), 400)
      }
    },
    [clientId, deviceId, state, refresh, de],
  )

  const shell: CSSProperties = {
    position: 'relative',
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
          {connErrorText(state.error, de, state.detail)}
        </p>
      </div>
    )
  }

  const hasTrack = Boolean(state?.hasTrack)
  const duration = num(state?.durationMs)
  const progress = Math.min(localProgress, duration || localProgress)
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0
  const playing = state?.playing === true

  const cornerBtn = (offsetRight: number): CSSProperties => ({
    position: 'absolute',
    top: 8,
    right: offsetRight,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div ref={shellRef} style={shell}>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        title={de ? 'Suchen' : 'Search'}
        aria-label={de ? 'Suchen' : 'Search'}
        style={cornerBtn(10)}
      >
        <IconSearch size={16} />
      </button>
      <button
        type="button"
        onClick={() => setDeviceOpen(true)}
        title={de ? 'Gerät wählen' : 'Choose device'}
        aria-label={de ? 'Gerät wählen' : 'Choose device'}
        style={{ ...cornerBtn(40), color: deviceId ? SPOTIFY_GREEN : 'var(--text-muted)' }}
      >
        <IconDevices size={16} />
      </button>

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
        <SeekBar progress={progress} duration={duration} pct={pct} onSeek={(ms) => void seek(ms)} />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <ControlButton onClick={() => void sendCommand('previous')} disabled={busy} title={de ? 'Zurück' : 'Previous'}>
          <IconPrev size={20} />
        </ControlButton>
        <ControlButton
          primary
          onClick={() => void sendCommand(playing ? 'pause' : 'play')}
          disabled={busy}
          title={playing ? 'Pause' : de ? 'Abspielen' : 'Play'}
        >
          {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
        </ControlButton>
        <ControlButton onClick={() => void sendCommand('next')} disabled={busy} title={de ? 'Weiter' : 'Next'}>
          <IconNext size={20} />
        </ControlButton>
      </div>

      {controlMsg ? (
        <p style={{ margin: 0, fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
          {controlMsg}
        </p>
      ) : null}

      {searchOpen ? (
        <SearchPanel
          clientId={clientId}
          de={de}
          deviceId={deviceId}
          onClose={() => setSearchOpen(false)}
          onPlayed={() => {
            setSearchOpen(false)
            void refresh()
          }}
        />
      ) : null}

      {deviceOpen ? (
        <DevicePanel
          clientId={clientId}
          de={de}
          selectedId={deviceId}
          onClose={() => setDeviceOpen(false)}
          onSelect={(id) => {
            setDeviceId(id)
            setDeviceOpen(false)
            void refresh()
          }}
        />
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
// Seek bar — click or drag the progress track to scrub playback position
// ---------------------------------------------------------------------------

function SeekBar({
  progress,
  duration,
  pct,
  onSeek,
}: {
  progress: number
  duration: number
  pct: number
  onSeek: (positionMs: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)
  // While dragging, hold the drag percentage so the bar follows the pointer.
  const [dragPct, setDragPct] = useState<number | null>(null)

  const ratioFromClientX = useCallback((clientX: number): number | null => {
    const el = trackRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      const r = ratioFromClientX(e.clientX)
      if (r != null) setDragPct(r * 100)
    },
    [ratioFromClientX],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragPct == null) return
      const r = ratioFromClientX(e.clientX)
      if (r != null) setDragPct(r * 100)
    },
    [dragPct, ratioFromClientX],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragPct == null) return
      const r = ratioFromClientX(e.clientX) ?? dragPct / 100
      setDragPct(null)
      onSeek(Math.round(r * duration))
    },
    [dragPct, duration, onSeek, ratioFromClientX],
  )

  const dragging = dragPct != null
  const shownPct = dragging ? (dragPct as number) : pct
  const shownProgress = dragging ? (shownPct / 100) * duration : progress

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        role="slider"
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(shownProgress)}
        style={{
          position: 'relative',
          height: 16,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: hover || dragging ? 6 : 4, borderRadius: 3, background: 'var(--border)', transition: 'height .12s ease' }}>
          <div
            style={{
              height: '100%',
              width: `${shownPct}%`,
              background: SPOTIFY_GREEN,
              borderRadius: 3,
              transition: dragging ? 'none' : 'width 1s linear',
            }}
          />
          {hover || dragging ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${shownPct}%`,
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: '#fff',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 3px rgba(0,0,0,.4)',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </div>
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
        <span>{fmtTime(shownProgress)}</span>
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Search overlay — find tracks/playlists and play them on the active device
// ---------------------------------------------------------------------------

/** Debounce (ms) before firing a search request as the user types. */
const SEARCH_DEBOUNCE_MS = 350

function searchErrorText(code: string, de: boolean): string {
  switch (code) {
    case 'forbidden':
      return de ? 'Abspielen erfordert Spotify Premium.' : 'Playback requires Spotify Premium.'
    case 'no_active_device':
      return de
        ? 'Kein aktives Gerät — starte Spotify zuerst auf einem Gerät.'
        : 'No active device — open Spotify on a device first.'
    case 'not_connected':
    case 'reauth_required':
      return de ? 'Verbindung abgelaufen — neu verbinden.' : 'Connection expired — reconnect.'
    case 'network_error':
      return de ? 'Netzwerkfehler.' : 'Network error.'
    default:
      return de ? 'Aktion fehlgeschlagen.' : 'Action failed.'
  }
}

function SearchPanel({
  clientId,
  de,
  deviceId,
  onClose,
  onPlayed,
}: {
  clientId: string
  de: boolean
  deviceId: string | null
  onClose: () => void
  onPlayed: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [pendingUri, setPendingUri] = useState<string | null>(null)
  // The user's own playlists, shown while the search field is empty.
  const [library, setLibrary] = useState<SearchItem[]>([])
  const [libLoading, setLibLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load the user's own playlists once when the panel opens.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const json = await postSpotify({ action: 'my-playlists', clientId })
        if (cancelled) return
        const err = typeof json.error === 'string' ? json.error : ''
        if (!err && Array.isArray(json.results)) setLibrary(json.results as SearchItem[])
      } catch {
        /* non-fatal: empty-state hint covers it */
      } finally {
        if (!cancelled) setLibLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientId])

  // Debounced search as the query changes.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setMsg(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const json = await postSpotify({ action: 'search', clientId, query: q })
        const err = typeof json.error === 'string' ? json.error : ''
        if (err) {
          setResults([])
          setMsg(searchErrorText(err, de))
        } else {
          setResults(Array.isArray(json.results) ? (json.results as SearchItem[]) : [])
          setMsg(null)
        }
      } catch {
        setResults([])
        setMsg(searchErrorText('network_error', de))
      } finally {
        setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, clientId, de])

  const play = useCallback(
    async (item: SearchItem) => {
      if (pendingUri) return
      setPendingUri(item.uri)
      setMsg(null)
      try {
        const payload: Record<string, unknown> = { action: 'play-uri', clientId, uri: item.uri, kind: item.kind }
        if (deviceId) payload.deviceId = deviceId
        const json = await postSpotify(payload)
        const err = typeof json.error === 'string' ? json.error : ''
        if (err) setMsg(searchErrorText(err, de))
        else onPlayed()
      } catch {
        setMsg(searchErrorText('network_error', de))
      } finally {
        setPendingUri(null)
      }
    },
    [clientId, de, deviceId, onPlayed, pendingUri],
  )

  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    gap: 8,
  }

  const hasQuery = query.trim().length > 0
  const shown = hasQuery ? results : library

  return (
    <div style={overlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <IconSearch size={14} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
            placeholder={de ? 'Lieder & Playlists suchen…' : 'Search songs & playlists…'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 8px 6px 26px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg, transparent)',
              color: 'var(--text)',
              fontSize: 12,
            }}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          title={de ? 'Schließen' : 'Close'}
          aria-label={de ? 'Schließen' : 'Close'}
          style={{
            width: 28,
            height: 28,
            flex: '0 0 auto',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconClose size={16} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!hasQuery && library.length > 0 ? (
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '2px 0 2px 2px' }}>
            {de ? 'Deine Playlists' : 'Your playlists'}
          </p>
        ) : null}
        {hasQuery && searching && results.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>
            {de ? 'Suche…' : 'Searching…'}
          </p>
        ) : null}
        {hasQuery && !searching && results.length === 0 && !msg ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>
            {de ? 'Keine Treffer.' : 'No results.'}
          </p>
        ) : null}
        {!hasQuery && libLoading && library.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>
            {de ? 'Lade Playlists…' : 'Loading playlists…'}
          </p>
        ) : null}
        {!hasQuery && !libLoading && library.length === 0 && !msg ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0', lineHeight: 1.4 }}>
            {de
              ? 'Keine eigenen Playlists gefunden. Tippe oben zum Suchen. (Ggf. Plugin neu verbinden für Playlist-Zugriff.)'
              : 'No playlists found. Type above to search.'}
          </p>
        ) : null}
        {shown.map((item) => (
          <button
            key={`${item.kind}:${item.uri}`}
            type="button"
            onClick={() => void play(item)}
            disabled={pendingUri !== null}
            title={`${item.title} — ${item.subtitle}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: 4,
              borderRadius: 6,
              border: 'none',
              background: pendingUri === item.uri ? 'var(--border)' : 'transparent',
              color: 'var(--text)',
              cursor: pendingUri ? 'wait' : 'pointer',
              textAlign: 'left',
            }}
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                width={36}
                height={36}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: item.kind === 'playlist' ? 6 : 4,
                  objectFit: 'cover',
                  flex: '0 0 auto',
                }}
              />
            ) : (
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '0 0 auto',
                }}
              >
                {item.kind === 'playlist' ? <IconList size={16} color={SPOTIFY_GREEN} /> : <IconMusic size={16} color={SPOTIFY_GREEN} />}
              </span>
            )}
            <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.kind === 'playlist' ? `${de ? 'Playlist' : 'Playlist'} · ${item.subtitle}` : item.subtitle}
              </span>
            </span>
          </button>
        ))}
      </div>

      {msg ? (
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{msg}</p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Device overlay — list available targets and transfer playback to one
// ---------------------------------------------------------------------------

/** Friendly label for a Spotify device type. */
function deviceTypeLabel(type: string, de: boolean): string {
  const t = type.toLowerCase()
  if (t === 'computer') return de ? 'Computer' : 'Computer'
  if (t === 'smartphone') return de ? 'Smartphone' : 'Smartphone'
  if (t === 'speaker') return de ? 'Lautsprecher' : 'Speaker'
  if (t === 'tv') return 'TV'
  if (t === 'castvideo' || t === 'castaudio') return 'Cast'
  if (t === 'gameconsole') return de ? 'Konsole' : 'Console'
  if (t === 'automobile') return de ? 'Auto' : 'Car'
  return type || (de ? 'Gerät' : 'Device')
}

function DevicePanel({
  clientId,
  de,
  selectedId,
  onClose,
  onSelect,
}: {
  clientId: string
  de: boolean
  selectedId: string | null
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const json = await postSpotify({ action: 'devices', clientId })
      const err = typeof json.error === 'string' ? json.error : ''
      if (err) {
        setDevices([])
        setMsg(searchErrorText(err, de))
      } else {
        setDevices(Array.isArray(json.devices) ? (json.devices as DeviceItem[]) : [])
        setMsg(null)
      }
    } catch {
      setDevices([])
      setMsg(searchErrorText('network_error', de))
    } finally {
      setLoading(false)
    }
  }, [clientId, de])

  useEffect(() => {
    void load()
  }, [load])

  const choose = useCallback(
    async (d: DeviceItem) => {
      if (pendingId) return
      setPendingId(d.id)
      setMsg(null)
      try {
        const json = await postSpotify({ action: 'transfer', clientId, deviceId: d.id })
        const err = typeof json.error === 'string' ? json.error : ''
        if (err) setMsg(searchErrorText(err, de))
        else onSelect(d.id)
      } catch {
        setMsg(searchErrorText('network_error', de))
      } finally {
        setPendingId(null)
      }
    },
    [clientId, de, onSelect, pendingId],
  )

  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    gap: 8,
  }

  return (
    <div style={overlay}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
          {de ? 'Gerät wählen' : 'Choose device'}
        </span>
        <button
          type="button"
          onClick={() => void load()}
          title={de ? 'Aktualisieren' : 'Refresh'}
          aria-label={de ? 'Aktualisieren' : 'Refresh'}
          style={{
            width: 28,
            height: 28,
            flex: '0 0 auto',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconRefresh size={15} />
        </button>
        <button
          type="button"
          onClick={onClose}
          title={de ? 'Schließen' : 'Close'}
          aria-label={de ? 'Schließen' : 'Close'}
          style={{
            width: 28,
            height: 28,
            flex: '0 0 auto',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconClose size={16} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading && devices.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>
            {de ? 'Lade Geräte…' : 'Loading devices…'}
          </p>
        ) : null}
        {!loading && devices.length === 0 && !msg ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0', lineHeight: 1.4 }}>
            {de
              ? 'Kein Gerät gefunden. Öffne Spotify auf einem Gerät und tippe auf Aktualisieren.'
              : 'No device found. Open Spotify on a device, then refresh.'}
          </p>
        ) : null}
        {devices.map((d) => {
          const chosen = d.id === selectedId || d.isActive
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => void choose(d)}
              disabled={pendingId !== null || d.isRestricted}
              title={d.isRestricted ? (de ? 'Dieses Gerät erlaubt keine Fernsteuerung.' : 'This device cannot be remote-controlled.') : d.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 4px',
                borderRadius: 6,
                border: 'none',
                background: pendingId === d.id ? 'var(--border)' : 'transparent',
                color: 'var(--text)',
                cursor: d.isRestricted ? 'not-allowed' : pendingId ? 'wait' : 'pointer',
                opacity: d.isRestricted ? 0.5 : 1,
                textAlign: 'left',
              }}
            >
              <span style={{ flex: '0 0 auto', display: 'flex', color: chosen ? SPOTIFY_GREEN : 'var(--text-muted)' }}>
                <IconDevices size={18} />
              </span>
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deviceTypeLabel(d.type, de)}
                  {typeof d.volumePercent === 'number' ? ` · ${d.volumePercent}%` : ''}
                </span>
              </span>
              {chosen ? (
                <span style={{ flex: '0 0 auto', fontSize: 10, color: SPOTIFY_GREEN, fontWeight: 700 }}>
                  {de ? 'Aktiv' : 'Active'}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {msg ? (
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{msg}</p>
      ) : null}
    </div>
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
    'Aktueller Spotify-Titel mit Cover, Künstler und Fortschritt — plus Play/Pause/Skip, Vor-/Zurückspulen über die Fortschrittsleiste, Suche nach Liedern & Playlists (eigene Playlists direkt sichtbar) und Gerätewahl. Verbindung per OAuth; Steuerung/Abspielen erfordert Premium. (Beta)',
  version: '0.13.0',
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
