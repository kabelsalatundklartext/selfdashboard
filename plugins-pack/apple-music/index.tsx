'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const APPLE_PINK = '#fa233b'
const MUSICKIT_SRC = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'

// ---------------------------------------------------------------------------
// Minimal MusicKit JS v3 typings — just the surface this widget touches.
// ---------------------------------------------------------------------------

type MKArtwork = { url?: string; width?: number; height?: number }
type MKItem = { title?: string; artistName?: string; albumName?: string; artwork?: MKArtwork }

type MKInstance = {
  isAuthorized: boolean
  nowPlayingItem: MKItem | null
  playbackState: number
  currentPlaybackTime: number
  currentPlaybackDuration: number
  authorize(): Promise<string>
  unauthorize(): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  skipToNextItem(): Promise<void>
  skipToPreviousItem(): Promise<void>
  setQueue(opts: Record<string, unknown>): Promise<unknown>
  addEventListener(name: string, cb: (e?: unknown) => void): void
  removeEventListener(name: string, cb: (e?: unknown) => void): void
}

type MKGlobal = {
  configure(opts: Record<string, unknown>): Promise<MKInstance>
  getInstance(): MKInstance | undefined
  formatArtworkURL?(artwork: MKArtwork, height: number, width: number): string
  Events?: Record<string, string>
  PlaybackStates?: Record<string, number>
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

/** seconds → m:ss */
function fmtTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function postAppleMusic(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plugins/apple-music', {
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
// MusicKit loader / configurator — module-scoped so the heavy SDK loads once
// per page regardless of how many widget instances mount.
// ---------------------------------------------------------------------------

let mkLoadPromise: Promise<MKGlobal> | null = null

function loadMusicKit(): Promise<MKGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no_window'))
  const w = window as unknown as { MusicKit?: MKGlobal }
  if (w.MusicKit) return Promise.resolve(w.MusicKit)
  if (mkLoadPromise) return mkLoadPromise

  mkLoadPromise = new Promise<MKGlobal>((resolve, reject) => {
    const onReady = () => (w.MusicKit ? resolve(w.MusicKit) : reject(new Error('musickit_unavailable')))
    document.addEventListener('musickitloaded', onReady, { once: true })
    if (!document.querySelector('script[data-musickit]')) {
      const s = document.createElement('script')
      s.src = MUSICKIT_SRC
      // MusicKit v3 setQueue/play misbehave when the script loads async.
      s.async = false
      s.setAttribute('data-musickit', '1')
      s.onerror = () => reject(new Error('script_load_failed'))
      document.head.appendChild(s)
    }
  })
  return mkLoadPromise
}

let mkConfigured: { token: string; instance: MKInstance } | null = null

async function getMusic(developerToken: string, appName: string): Promise<{ MK: MKGlobal; inst: MKInstance }> {
  const MK = await loadMusicKit()
  if (mkConfigured?.token === developerToken) return { MK, inst: mkConfigured.instance }
  const configured = await MK.configure({
    developerToken,
    app: { name: appName || 'SelfDashboard', build: '1.0.0' },
  })
  const inst = configured || MK.getInstance()
  if (!inst) throw new Error('configure_failed')
  mkConfigured = { token: developerToken, instance: inst }
  return { MK, inst }
}

function artworkUrl(MK: MKGlobal | null, item: MKItem | null, size = 160): string | undefined {
  const art = item?.artwork
  if (!art?.url) return undefined
  if (MK?.formatArtworkURL) {
    try {
      return MK.formatArtworkURL(art, size, size)
    } catch {
      /* fall through to manual substitution */
    }
  }
  return art.url.replace('{w}', String(size)).replace('{h}', String(size)).replace('{f}', 'jpg')
}

const QUEUE_KEY: Record<string, string> = {
  playlist: 'playlist',
  album: 'album',
  song: 'song',
  station: 'station',
}

// ---------------------------------------------------------------------------
// Inline SVG icons (plugins can't rely on the host's curated icon set)
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

type Phase = 'loading' | 'needs-config' | 'needs-auth' | 'ready' | 'error'

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const teamId = str(config.teamId)
  const keyId = str(config.keyId)
  const contentType = str(config.contentType) || 'playlist'
  const contentId = str(config.contentId)
  const title = config.title === undefined ? 'Apple Music' : str(config.title)
  const showTitle = config.showTitle !== false

  const [phase, setPhase] = useState<Phase>('loading')
  const [errMsg, setErrMsg] = useState<string>('')
  const [now, setNow] = useState<{ title?: string; artist?: string; art?: string } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [busy, setBusy] = useState(false)

  const instRef = useRef<MKInstance | null>(null)
  const mkRef = useRef<MKGlobal | null>(null)

  const syncNowPlaying = useCallback(() => {
    const inst = instRef.current
    if (!inst) return
    const item = inst.nowPlayingItem
    setNow(item ? { title: item.title, artist: item.artistName, art: artworkUrl(mkRef.current, item) } : null)
    const playingState = mkRef.current?.PlaybackStates?.playing ?? 2
    setPlaying(inst.playbackState === playingState)
    setDuration(inst.currentPlaybackDuration || 0)
    setProgress(inst.currentPlaybackTime || 0)
  }, [])

  // Boot: fetch developer token, configure MusicKit, wire up events.
  useEffect(() => {
    let cancelled = false
    let detach: (() => void) | null = null

    async function boot() {
      if (!teamId || !keyId) {
        setPhase('needs-config')
        return
      }
      setPhase('loading')
      try {
        const tok = await postAppleMusic({ action: 'token', teamId, keyId })
        const developerToken = str(tok.developerToken)
        if (tok.error || !developerToken) {
          if (cancelled) return
          if (tok.error === 'not_configured') setPhase('needs-config')
          else {
            setErrMsg(str(tok.error) || 'token_failed')
            setPhase('error')
          }
          return
        }
        const { MK, inst } = await getMusic(developerToken, str(tok.appName))
        if (cancelled) return
        mkRef.current = MK
        instRef.current = inst

        const E = MK.Events || {}
        const events = [
          E.nowPlayingItemDidChange || 'nowPlayingItemDidChange',
          E.playbackStateDidChange || 'playbackStateDidChange',
          E.playbackTimeDidChange || 'playbackTimeDidChange',
          E.authorizationStatusDidChange || 'authorizationStatusDidChange',
        ]
        const handler = () => {
          syncNowPlaying()
          if (instRef.current) setPhase(instRef.current.isAuthorized ? 'ready' : 'needs-auth')
        }
        events.forEach((ev) => inst.addEventListener(ev, handler))
        detach = () => events.forEach((ev) => inst.removeEventListener(ev, handler))

        syncNowPlaying()
        setPhase(inst.isAuthorized ? 'ready' : 'needs-auth')
      } catch (e) {
        if (cancelled) return
        setErrMsg(e instanceof Error ? e.message : String(e))
        setPhase('error')
      }
    }

    void boot()
    return () => {
      cancelled = true
      if (detach) detach()
    }
  }, [teamId, keyId, syncNowPlaying])

  // Smooth progress ticking between events while playing.
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      const inst = instRef.current
      if (inst) setProgress(inst.currentPlaybackTime || 0)
    }, 1000)
    return () => clearInterval(t)
  }, [playing])

  const authorize = useCallback(async () => {
    const inst = instRef.current
    if (!inst || busy) return
    setBusy(true)
    try {
      await inst.authorize()
      syncNowPlaying()
      setPhase(inst.isAuthorized ? 'ready' : 'needs-auth')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [busy, syncNowPlaying])

  const playPause = useCallback(async () => {
    const inst = instRef.current
    if (!inst || busy) return
    setBusy(true)
    try {
      if (playing) {
        await inst.pause()
      } else if (!inst.nowPlayingItem && contentId) {
        const queueKey = QUEUE_KEY[contentType] || 'playlist'
        await inst.setQueue({ [queueKey]: contentId, startPlaying: true })
        try {
          await inst.play()
        } catch {
          /* startPlaying may already have begun playback */
        }
      } else {
        await inst.play()
      }
      syncNowPlaying()
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [busy, playing, contentId, contentType, syncNowPlaying])

  const skip = useCallback(
    async (dir: 'next' | 'prev') => {
      const inst = instRef.current
      if (!inst || busy) return
      setBusy(true)
      try {
        await (dir === 'next' ? inst.skipToNextItem() : inst.skipToPreviousItem())
        syncNowPlaying()
      } catch {
        /* surfaced via events */
      } finally {
        setBusy(false)
      }
    },
    [busy, syncNowPlaying],
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

  if (phase === 'needs-config') {
    return (
      <div style={centered}>
        <IconMusic size={26} color={APPLE_PINK} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Team ID, Key ID und den privaten Schlüssel (.p8) in den Einstellungen eintragen.'
            : 'Enter Team ID, Key ID and the private key (.p8) in settings.'}
        </p>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div style={shell}>
        <div className="skeleton" style={{ flex: 1, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 6 }} />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={centered}>
        <IconMusic size={26} color={APPLE_PINK} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de ? 'Fehler beim Laden von Apple Music.' : 'Failed to load Apple Music.'}
          {errMsg ? <><br />{errMsg}</> : null}
        </p>
      </div>
    )
  }

  if (phase === 'needs-auth') {
    return (
      <div style={centered}>
        <IconMusic size={26} color={APPLE_PINK} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 4px', lineHeight: 1.45 }}>
          {de ? 'Mit deinem Apple-Music-Konto anmelden.' : 'Sign in with your Apple Music account.'}
        </p>
        <button
          type="button"
          onClick={() => void authorize()}
          disabled={busy}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: busy ? 'not-allowed' : 'pointer',
            background: APPLE_PINK,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (de ? 'Warte…' : 'Waiting…') : de ? 'Anmelden' : 'Sign in'}
        </button>
      </div>
    )
  }

  // phase === 'ready'
  const hasTrack = Boolean(now?.title)
  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0

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
            {contentId
              ? de
                ? 'Bereit — auf Play drücken.'
                : 'Ready — press play.'
              : de
                ? 'Inhalt in den Einstellungen wählen (z. B. Playlist-ID).'
                : 'Pick content in settings (e.g. a playlist ID).'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, alignItems: 'center' }}>
          {now?.art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={now.art}
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
              <IconMusic size={24} color={APPLE_PINK} />
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
              {now?.title}
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
              {now?.artist}
            </span>
          </div>
        </div>
      )}

      {hasTrack && duration > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: APPLE_PINK, transition: 'width 1s linear' }} />
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
        <ControlButton onClick={() => void skip('prev')} disabled={busy} title={de ? 'Zurück' : 'Previous'}>
          <IconPrev size={20} />
        </ControlButton>
        <ControlButton primary onClick={() => void playPause()} disabled={busy} title={playing ? 'Pause' : de ? 'Abspielen' : 'Play'}>
          {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
        </ControlButton>
        <ControlButton onClick={() => void skip('next')} disabled={busy} title={de ? 'Weiter' : 'Next'}>
          <IconNext size={20} />
        </ControlButton>
      </div>
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
        background: primary ? APPLE_PINK : 'transparent',
        color: primary ? '#fff' : 'var(--text)',
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
// Settings — credentials (Team ID / Key ID / .p8) + start content
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
  const teamId = str(config.teamId)
  const keyId = str(config.keyId)
  const showTitle = config.showTitle !== false
  const contentType = str(config.contentType) || 'playlist'

  const [privateKey, setPrivateKey] = useState('')
  const [status, setStatus] = useState<{ configured: boolean; tokenExp?: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const loadStatus = useCallback(async () => {
    if (!teamId || !keyId) {
      setStatus(null)
      return
    }
    try {
      const json = (await postAppleMusic({ action: 'status', teamId, keyId })) as { configured: boolean; tokenExp?: number }
      setStatus(json)
    } catch {
      /* ignore */
    }
  }, [teamId, keyId])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const save = useCallback(async () => {
    if (!teamId || !keyId || !privateKey.trim()) {
      setMsg(de ? 'Team ID, Key ID und privaten Schlüssel eintragen.' : 'Enter Team ID, Key ID and private key.')
      return
    }
    setWorking(true)
    setMsg(null)
    try {
      const json = (await postAppleMusic({
        action: 'save',
        teamId,
        keyId,
        privateKey: privateKey.trim(),
        appName: str(config.appName),
      })) as { ok?: boolean; error?: string }
      if (json.error) {
        setMsg(
          json.error === 'invalid_key'
            ? de
              ? '❌ Privater Schlüssel ungültig (.p8 prüfen).'
              : '❌ Invalid private key (check the .p8).'
            : de
              ? '❌ Speichern fehlgeschlagen.'
              : '❌ Save failed.',
        )
      } else {
        setPrivateKey('') // don't keep the .p8 in dashboard config — server is source of truth
        setMsg(de ? '✅ Gespeichert.' : '✅ Saved.')
        void loadStatus()
      }
    } catch {
      setMsg(de ? 'Netzwerkfehler.' : 'Network error.')
    } finally {
      setWorking(false)
    }
  }, [teamId, keyId, privateKey, config.appName, de, loadStatus])

  const disconnect = useCallback(async () => {
    if (!teamId || !keyId) return
    setWorking(true)
    await postAppleMusic({ action: 'disconnect', teamId, keyId })
    setWorking(false)
    setMsg(de ? 'Zugang entfernt.' : 'Removed.')
    void loadStatus()
  }, [teamId, keyId, de, loadStatus])

  const configured = status?.configured === true

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
          value={config.title === undefined ? 'Apple Music' : str(config.title)}
          placeholder="Apple Music"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      {/* Credentials */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Team ID</label>
        <input style={inp} value={teamId} placeholder="z. B. ABCDE12345" onChange={(e) => onChange('teamId', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>Key ID</label>
        <input style={inp} value={keyId} placeholder="z. B. XYZ9876543" onChange={(e) => onChange('keyId', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Privater Schlüssel (.p8 Inhalt)' : 'Private key (.p8 contents)'}
        </label>
        <textarea
          style={{ ...inp, minHeight: 90, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }}
          value={privateKey}
          placeholder={'-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'App-Name (optional)' : 'App name (optional)'}</label>
        <input
          style={inp}
          value={str(config.appName)}
          placeholder="SelfDashboard"
          onChange={(e) => onChange('appName', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? 'Apple Developer → Certificates, IDs & Profiles → Keys → MusicKit-Key erstellen. Team ID steht oben rechts im Account. Der private Schlüssel wird verschlüsselt auf dem Server gespeichert.'
            : 'Apple Developer → Certificates, IDs & Profiles → Keys → create a MusicKit key. Team ID is top-right in your account. The private key is stored encrypted on the server.'}
        </p>
      </div>

      {/* Start content */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Start-Inhalt (Typ)' : 'Start content (type)'}</label>
        <select style={inp} value={contentType} onChange={(e) => onChange('contentType', e.target.value)}>
          <option value="playlist">Playlist</option>
          <option value="album">Album</option>
          <option value="song">{de ? 'Song' : 'Song'}</option>
          <option value="station">{de ? 'Station' : 'Station'}</option>
        </select>
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'Inhalts-ID' : 'Content ID'}</label>
        <input
          style={inp}
          value={str(config.contentId)}
          placeholder={contentType === 'playlist' ? 'pl.xxxxxxxx' : contentType === 'station' ? 'ra.xxxxxxxx' : '1234567890'}
          onChange={(e) => onChange('contentId', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? 'Die ID steht in der Apple-Music-URL nach dem letzten „/" (z. B. playlist/…/pl.u-…).'
            : 'The ID is the last path segment of the Apple Music URL (e.g. playlist/…/pl.u-…).'}
        </p>
      </div>

      {/* Status + actions */}
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
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: configured ? APPLE_PINK : 'var(--text-muted)', flex: '0 0 auto' }} />
        <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
          {configured ? (de ? 'Schlüssel gespeichert' : 'Key saved') : de ? 'Kein Schlüssel' : 'No key'}
        </span>
        {configured ? (
          <button type="button" disabled={working} onClick={() => void disconnect()} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
            {de ? 'Entfernen' : 'Remove'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={working}
          onClick={() => void save()}
          style={{ ...inp, width: 'auto', cursor: 'pointer', background: APPLE_PINK, color: '#fff', fontWeight: 700, borderColor: APPLE_PINK }}
        >
          {working ? (de ? 'Speichere…' : 'Saving…') : de ? 'Speichern' : 'Save'}
        </button>
      </div>
      {msg ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{msg}</p> : null}
      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
        {de
          ? 'Wiedergabe läuft direkt im Browser über Apples MusicKit. Erfordert ein aktives Apple-Music-Abo des Nutzers. (Beta)'
          : 'Playback runs in the browser via Apple MusicKit. Requires the user to have an active Apple Music subscription. (Beta)'}
      </p>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'apple-music',
  name: 'Apple Music',
  description:
    'Apple-Music-Player im Dashboard: anmelden, Playlist/Album/Station starten, Now-Playing mit Cover und Play/Pause/Skip. Läuft per MusicKit im Browser; erfordert MusicKit-Key (Apple Developer) und ein Apple-Music-Abo. (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🍎',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/apple-music.png',
  defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Apple Music' },
    { key: 'teamId', label: 'Team ID', type: 'text', defaultValue: '' },
    { key: 'keyId', label: 'Key ID', type: 'text', defaultValue: '' },
    { key: 'appName', label: 'App-Name', type: 'text', defaultValue: '' },
    { key: 'contentType', label: 'Start-Inhalt (Typ)', type: 'text', defaultValue: 'playlist' },
    { key: 'contentId', label: 'Inhalts-ID', type: 'text', defaultValue: '' },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
