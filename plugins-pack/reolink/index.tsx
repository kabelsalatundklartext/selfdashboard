'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const REOLINK_VERSION = '0.9.1'

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

type ChannelInfo = { channel: number; name: string; online: boolean }
type StatusData = {
  model?: string
  name?: string
  channelNum?: number
  channels?: ChannelInfo[]
  ai?: { people: boolean; vehicle: boolean; animal: boolean; supported: string[] }
  motion?: boolean
}

const ENDPOINT = '/api/plugins/reolink'

async function callApi(action: string, config: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      host: str(config.host),
      port: num(config.port) || undefined,
      secure: config.secure === true,
      insecure: config.insecure !== false,
      username: str(config.username),
      password: str(config.password),
      channel: num(config.channel),
      ...extra,
    }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = json && typeof json.detail === 'string' ? json.detail : json?.error || `HTTP ${res.status}`
    throw new Error(detail)
  }
  return json
}

// ---- Inline-SVG-Icons (keine lucide-Abhängigkeit) ----
function Arrow({ dir }: { dir: 'up' | 'down' | 'left' | 'right' }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir]
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
function ZoomIcon({ plus }: { plus: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M8 11h6" />
      {plus ? <path d="M11 8v6" /> : null}
    </svg>
  )
}

function Badge({ text, tone }: { text: string; tone: 'alert' | 'ok' | 'muted' }) {
  const bg = tone === 'alert' ? 'rgba(239,68,68,.92)' : tone === 'ok' ? 'rgba(34,197,94,.9)' : 'rgba(0,0,0,.55)'
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: bg, padding: '2px 7px', borderRadius: 999, letterSpacing: '.02em', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
      {text}
    </span>
  )
}

const padBtn: CSSProperties = {
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 8,
  background: 'rgba(20,22,30,.78)',
  color: '#fff',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
}

function HoldBtn({
  children,
  onStart,
  onStop,
  label,
}: {
  children: React.ReactNode
  onStart: () => void
  onStop: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      style={padBtn}
      onPointerDown={(e) => {
        e.preventDefault()
        onStart()
      }}
      onPointerUp={onStop}
      onPointerLeave={onStop}
      onPointerCancel={onStop}
    >
      {children}
    </button>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const host = str(config.host)
  const username = str(config.username)
  const password = str(config.password)
  const channel = num(config.channel)
  const secure = config.secure === true
  const insecure = config.insecure !== false
  const fit: 'cover' | 'contain' = config.fit === 'contain' ? 'contain' : 'cover'
  const title = config.title === undefined ? 'Reolink' : str(config.title)
  const refreshMs = Math.max(1, num(config.refreshSeconds) || 3) * 1000
  const showPtz = config.showPtz === true
  const showBadges = config.showBadges !== false
  const ptzSpeed = Math.max(1, Math.min(64, num(config.ptzSpeed) || 32))

  const configured = Boolean(host && username && password)
  const { ref: shellRef, active } = usePollingActive<HTMLDivElement>()

  const [snapTok, setSnapTok] = useState<string | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [status, setStatus] = useState<StatusData | null>(null)

  // Kurzlebigen, verschlüsselten Snapshot-Token holen (kein Credential in der Bild-URL) und vor Ablauf erneuern.
  useEffect(() => {
    if (!configured) {
      setSnapTok(null)
      return
    }
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const fetchToken = async () => {
      try {
        const data = await callApi('snap-token', config as Record<string, unknown>)
        if (!alive) return
        if (typeof data?.token === 'string') {
          setSnapTok(data.token)
          const ttl = typeof data.ttlMs === 'number' ? data.ttlMs : 600_000
          timer = setTimeout(fetchToken, Math.max(30_000, ttl * 0.8))
        }
      } catch {
        if (alive) timer = setTimeout(fetchToken, 30_000)
      }
    }
    void fetchToken()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, host, username, password, channel, secure, insecure])

  // Snapshot-Polling (wie bambu-cam) — pausiert im Hintergrund-Tab / außerhalb des Viewports.
  useEffect(() => {
    if (!configured) {
      setSrc(null)
      setError(null)
      setLoadedOnce(false)
      return
    }
    if (!snapTok || !active) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const tick = () => {
      const u = `${ENDPOINT}?action=snapshot&tok=${encodeURIComponent(snapTok)}&cb=${Date.now()}`
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        setSrc(u)
        setLoadedOnce(true)
        setError(null)
        timer = setTimeout(tick, refreshMs)
      }
      img.onerror = () => {
        if (!alive) return
        setError(de ? 'Kein Bild — IP/Zugangsdaten/HTTPS prüfen.' : 'No image — check IP/credentials/HTTPS.')
        timer = setTimeout(tick, Math.max(refreshMs, 4000))
      }
      img.src = u
    }
    tick()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [snapTok, active, configured, refreshMs, de])

  // Status-Polling (AI/Motion/Kanäle) — etwas langsamer als das Bild
  useEffect(() => {
    if (!configured || !showBadges) {
      setStatus(null)
      return
    }
    if (!active) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const statusMs = Math.max(refreshMs, 4000)
    const poll = async () => {
      try {
        const data = await callApi('status', config as Record<string, unknown>)
        if (alive && data?.ok) setStatus(data as StatusData)
      } catch {
        /* Badges sind optional — Fehler still */
      }
      if (alive) timer = setTimeout(poll, statusMs)
    }
    void poll()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, configured, showBadges, refreshMs])

  const ptz = useCallback(
    (op: string) => {
      if (!configured) return
      void callApi('ptz', config as Record<string, unknown>, { op, speed: ptzSpeed }).catch(() => {})
    },
    [config, configured, ptzSpeed],
  )

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    containerType: 'size',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
    background: '#0b0d12',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (!configured) {
    return (
      <div style={{ ...shell, background: 'var(--surface-2)', padding: 12, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
          {de
            ? 'In den Einstellungen Kamera-IP, Benutzer und Passwort eintragen.'
            : 'Enter the camera IP, username and password in settings.'}
        </p>
      </div>
    )
  }

  const ch = status?.channels?.find((c) => c.channel === channel)
  const online = ch ? ch.online : loadedOnce
  const camName = ch?.name || status?.name || ''

  const aiBadges: string[] = []
  if (showBadges && status?.ai) {
    if (status.ai.people) aiBadges.push(de ? 'Person' : 'Person')
    if (status.ai.vehicle) aiBadges.push(de ? 'Fahrzeug' : 'Vehicle')
    if (status.ai.animal) aiBadges.push(de ? 'Tier' : 'Animal')
  }
  if (showBadges && aiBadges.length === 0 && status?.motion) {
    aiBadges.push(de ? 'Bewegung' : 'Motion')
  }

  return (
    <div ref={shellRef} style={shell}>
      {src ? (
        <img src={src} alt={title || 'Reolink'} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
      ) : null}

      {!loadedOnce && !error ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{de ? 'Verbinde…' : 'Connecting…'}</span>
        </div>
      ) : null}

      {error && !loadedOnce ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.4 }}>{error}</span>
        </div>
      ) : null}

      {/* Kopfzeile: Titel + LIVE/Offline */}
      {loadedOnce ? (
        <div style={{ position: 'absolute', top: 6, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, pointerEvents: 'none' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.85)', letterSpacing: '.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
            {camName ? <span style={{ opacity: 0.75, fontWeight: 500 }}> · {camName}</span> : null}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: online ? '#22c55e' : '#ef4444', boxShadow: '0 0 6px rgba(0,0,0,.6)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)' }}>{online ? 'LIVE' : 'OFF'}</span>
          </span>
        </div>
      ) : null}

      {/* Erkennungs-Badges */}
      {aiBadges.length > 0 ? (
        <div style={{ position: 'absolute', top: 24, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {aiBadges.map((b) => (
            <Badge key={b} text={b} tone="alert" />
          ))}
        </div>
      ) : null}

      {/* PTZ-Steuerung: drücken-halten = bewegen, loslassen = Stop */}
      {showPtz && loadedOnce ? (
        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 30px)', gridTemplateRows: 'repeat(3, 30px)', gap: 3 }}>
          <span />
          <HoldBtn onStart={() => ptz('Up')} onStop={() => ptz('Stop')} label="up"><Arrow dir="up" /></HoldBtn>
          <span />
          <HoldBtn onStart={() => ptz('Left')} onStop={() => ptz('Stop')} label="left"><Arrow dir="left" /></HoldBtn>
          <HoldBtn onStart={() => ptz('Stop')} onStop={() => {}} label="stop">
            <span style={{ width: 10, height: 10, background: '#fff', borderRadius: 2 }} />
          </HoldBtn>
          <HoldBtn onStart={() => ptz('Right')} onStop={() => ptz('Stop')} label="right"><Arrow dir="right" /></HoldBtn>
          <span />
          <HoldBtn onStart={() => ptz('Down')} onStop={() => ptz('Stop')} label="down"><Arrow dir="down" /></HoldBtn>
          <span />
        </div>
      ) : null}

      {/* Zoom */}
      {showPtz && loadedOnce ? (
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <HoldBtn onStart={() => ptz('ZoomInc')} onStop={() => ptz('Stop')} label="zoom-in"><ZoomIcon plus /></HoldBtn>
          <HoldBtn onStart={() => ptz('ZoomDec')} onStop={() => ptz('Stop')} label="zoom-out"><ZoomIcon plus={false} /></HoldBtn>
        </div>
      ) : null}

      {config.showVersion && loadedOnce ? (
        <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,.6)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>
          v{REOLINK_VERSION}
        </span>
      ) : null}

      {error && loadedOnce ? (
        <div style={{ position: 'absolute', bottom: showPtz ? 44 : 6, left: 8, right: 8, textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: '#fca5a5', textShadow: '0 1px 3px rgba(0,0,0,.85)' }}>{error}</span>
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
  const lbl: CSSProperties = { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }
  const row: CSSProperties = { display: 'flex', gap: 10 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={lbl}>{de ? 'Widget-Titel' : 'Widget title'}</label>
        <input style={inp} value={config.title === undefined ? 'Reolink' : str(config.title)} placeholder="Reolink" onChange={(e) => onChange('title', e.target.value)} />
      </div>

      <div style={row}>
        <div style={{ flex: 2 }}>
          <label style={lbl}>{de ? 'Kamera-IP (LAN)' : 'Camera IP (LAN)'}</label>
          <input style={inp} value={str(config.host)} placeholder="192.168.1.50" onChange={(e) => onChange('host', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Port' : 'Port'}</label>
          <input style={inp} type="number" min={1} max={65535} value={num(config.port) || ''} placeholder={config.secure === true ? '443' : '80'} onChange={(e) => onChange('port', e.target.value)} />
        </div>
      </div>

      <div style={row}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Benutzer' : 'Username'}</label>
          <input style={inp} value={str(config.username)} placeholder="admin" autoComplete="off" onChange={(e) => onChange('username', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Passwort' : 'Password'}</label>
          <input style={inp} type="password" value={str(config.password)} placeholder="********" autoComplete="new-password" onChange={(e) => onChange('password', e.target.value)} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={config.secure === true} onChange={(e) => onChange('secure', e.target.checked)} />
        <span>{de ? 'HTTPS verwenden' : 'Use HTTPS'}</span>
      </label>
      {config.secure === true ? (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <input type="checkbox" checked={config.insecure !== false} onChange={(e) => onChange('insecure', e.target.checked)} />
          <span>{de ? 'Selbstsigniertes Zertifikat akzeptieren' : 'Accept self-signed certificate'}</span>
        </label>
      ) : null}

      <div style={row}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Kanal (NVR: 0,1,2…)' : 'Channel (NVR: 0,1,2…)'}</label>
          <input style={inp} type="number" min={0} max={63} value={num(config.channel)} onChange={(e) => onChange('channel', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (sec)'}</label>
          <input style={inp} type="number" min={1} max={30} value={num(config.refreshSeconds) || 3} onChange={(e) => onChange('refreshSeconds', e.target.value)} />
        </div>
      </div>

      <div style={row}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Bild-Modus' : 'Image fit'}</label>
          <select style={inp} value={config.fit === 'contain' ? 'contain' : 'cover'} onChange={(e) => onChange('fit', e.target.value)}>
            <option value="cover">{de ? 'Füllen' : 'Cover'}</option>
            <option value="contain">{de ? 'Ganz zeigen' : 'Contain'}</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'PTZ-Geschwindigkeit' : 'PTZ speed'}</label>
          <input style={inp} type="number" min={1} max={64} value={num(config.ptzSpeed) || 32} onChange={(e) => onChange('ptzSpeed', e.target.value)} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={config.showPtz === true} onChange={(e) => onChange('showPtz', e.target.checked)} />
        <span>{de ? 'PTZ-Steuerung anzeigen (nur PTZ-Kameras)' : 'Show PTZ controls (PTZ cameras only)'}</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={config.showBadges !== false} onChange={(e) => onChange('showBadges', e.target.checked)} />
        <span>{de ? 'Erkennungs-Badges (Person/Fahrzeug/Tier/Bewegung)' : 'Detection badges (person/vehicle/animal/motion)'}</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={config.showVersion === true} onChange={(e) => onChange('showVersion', e.target.checked)} />
        <span>{de ? 'Versionsnummer zeigen' : 'Show version number'}</span>
      </label>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        {de
          ? 'Nur LAN-IPs (10.x, 172.16–31.x, 192.168.x). Passwort wird verschlüsselt gespeichert. Empfehlung: einen eigenen Kamera-Benutzer anlegen. Für mehrere Kameras/Kanäle je ein Widget mit eigenem Kanal.'
          : 'LAN IPs only (10.x, 172.16–31.x, 192.168.x). Password is stored encrypted. Recommended: create a dedicated camera user. For multiple cameras/channels add one widget each with its own channel.'}
      </p>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'reolink',
  name: 'Reolink Kamera',
  description:
    'Live-Kamerabild von Reolink-Kameras/NVRs (lokale CGI-API): Auto-Snapshot, Online-Status, KI-/Bewegungs-Badges und PTZ-Steuerung. (Beta)',
  version: REOLINK_VERSION,
  author: 'SelfDashboard',
  category: 'utility',
  icon: '📹',
  iconUrl: '/api/plugins/custom-assets/reolink/icon.svg',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Reolink' },
    { key: 'host', label: 'Kamera-IP', type: 'text', defaultValue: '' },
    { key: 'port', label: 'Port', type: 'number', defaultValue: 0 },
    { key: 'username', label: 'Benutzer', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'secure', label: 'HTTPS verwenden', type: 'boolean', defaultValue: false },
    { key: 'insecure', label: 'Selbstsigniertes Zertifikat akzeptieren', type: 'boolean', defaultValue: true },
    { key: 'channel', label: 'Kanal', type: 'number', defaultValue: 0 },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 3 },
    { key: 'fit', label: 'Bild-Modus', type: 'text', defaultValue: 'cover' },
    { key: 'ptzSpeed', label: 'PTZ-Geschwindigkeit', type: 'number', defaultValue: 32 },
    { key: 'showPtz', label: 'PTZ-Steuerung anzeigen', type: 'boolean', defaultValue: false },
    { key: 'showBadges', label: 'Erkennungs-Badges', type: 'boolean', defaultValue: true },
    { key: 'showVersion', label: 'Versionsnummer zeigen', type: 'boolean', defaultValue: false },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
