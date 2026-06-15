'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const BAMBU_VERSION = '0.9.2'

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const source = str(config.source) === 'url' ? 'url' : 'p1'
  const host = str(config.host)
  const accessCode = str(config.accessCode)
  const streamUrl = str(config.streamUrl)
  const urlMjpeg = config.urlMjpeg === true
  const fit: 'cover' | 'contain' = config.fit === 'cover' ? 'cover' : 'contain'
  const title = config.title === undefined ? 'Bambu' : str(config.title)
  const refreshMs = Math.max(1, num(config.refreshSeconds) || 2) * 1000

  const configured = source === 'p1' ? Boolean(host && accessCode) : Boolean(streamUrl)

  const base =
    source === 'p1'
      ? `/api/plugins/bambu-cam?action=snapshot&host=${encodeURIComponent(host)}&code=${encodeURIComponent(accessCode)}`
      : `/api/plugins/bambu-cam?action=proxy&url=${encodeURIComponent(streamUrl)}`
  // MJPEG = kontinuierlicher Stream (einmal setzen); sonst Snapshot-Refresh.
  const continuous = source === 'url' && urlMjpeg
  const { ref: shellRef, active } = usePollingActive<HTMLDivElement>()

  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedOnce, setLoadedOnce] = useState(false)

  useEffect(() => {
    if (!configured) {
      setSrc(null)
      setError(null)
      setLoadedOnce(false)
      return
    }
    if (continuous) {
      setSrc(base)
      return
    }
    if (!active) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null
    const tick = () => {
      const u = `${base}&t=${Date.now()}`
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
        setError(de ? 'Kein Bild — Drucker erreichbar? LAN-/Entwicklermodus & Zugangscode prüfen.' : 'No image — printer reachable? Check LAN/developer mode & access code.')
        timer = setTimeout(tick, Math.max(refreshMs, 3000))
      }
      img.src = u
    }
    tick()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [base, configured, continuous, refreshMs, de, active])

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
            ? 'In den Einstellungen Quelle wählen: P1/A1 (IP + Zugangscode) oder Stream-URL.'
            : 'In settings choose a source: P1/A1 (IP + access code) or a stream URL.'}
        </p>
      </div>
    )
  }

  return (
    <div ref={shellRef} style={shell}>
      {src ? (
        <img
          src={src}
          alt={title || 'Bambu'}
          onError={() => continuous && setError(de ? 'Stream nicht erreichbar.' : 'Stream unreachable.')}
          onLoad={() => {
            setLoadedOnce(true)
            setError(null)
          }}
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
        />
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

      {(title || config.showVersion) && loadedOnce ? (
        <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.8)', letterSpacing: '0.03em' }}>{title}</span>
          ) : null}
          {config.showVersion ? <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>v{BAMBU_VERSION}</span> : null}
        </div>
      ) : null}

      {error && loadedOnce ? (
        <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: '#fca5a5', textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>{error}</span>
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
  const source = str(config.source) === 'url' ? 'url' : 'p1'
  const lbl: CSSProperties = { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={lbl}>{de ? 'Widget-Titel' : 'Widget title'}</label>
        <input style={inp} value={config.title === undefined ? 'Bambu' : str(config.title)} placeholder="Bambu" onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div>
        <label style={lbl}>{de ? 'Quelle' : 'Source'}</label>
        <select style={inp} value={source} onChange={(e) => onChange('source', e.target.value)}>
          <option value="p1">{de ? 'P1 / A1 (lokal, Port 6000)' : 'P1 / A1 (local, port 6000)'}</option>
          <option value="url">{de ? 'Stream-URL (MJPEG/Snapshot, z. B. X1 via go2rtc)' : 'Stream URL (MJPEG/snapshot, e.g. X1 via go2rtc)'}</option>
        </select>
      </div>

      {source === 'p1' ? (
        <>
          <div>
            <label style={lbl}>{de ? 'Drucker-IP (LAN)' : 'Printer IP (LAN)'}</label>
            <input style={inp} value={str(config.host)} placeholder="192.168.1.50" onChange={(e) => onChange('host', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{de ? 'Zugangscode' : 'Access code'}</label>
            <input style={inp} type="password" value={str(config.accessCode)} placeholder="********" onChange={(e) => onChange('accessCode', e.target.value)} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de
              ? 'Am Drucker LAN-Modus + Entwicklermodus aktivieren (Einstellungen → Netzwerk). Den Zugangscode zeigt der Drucker im LAN-Bereich. Das Passwort wird verschlüsselt gespeichert.'
              : 'On the printer, enable LAN mode + developer mode (Settings → Network). The access code is shown in the LAN section. The code is stored encrypted.'}
          </p>
        </>
      ) : (
        <>
          <div>
            <label style={lbl}>{de ? 'Stream-URL (MJPEG oder Snapshot)' : 'Stream URL (MJPEG or snapshot)'}</label>
            <input style={inp} value={str(config.streamUrl)} placeholder="http://192.168.1.20:1984/api/frame.jpeg?src=printer" onChange={(e) => onChange('streamUrl', e.target.value)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input type="checkbox" checked={config.urlMjpeg === true} onChange={(e) => onChange('urlMjpeg', e.target.checked)} />
            <span>{de ? 'Ist ein MJPEG-Dauerstream (nicht aktualisieren)' : 'Is a continuous MJPEG stream (do not refresh)'}</span>
          </label>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de
              ? 'Nur LAN-Adressen (10.x, 172.16–31.x, 192.168.x). Für X1: Kamera per go2rtc/OctoEverywhere als MJPEG/Snapshot bereitstellen und die URL hier eintragen.'
              : 'LAN addresses only (10.x, 172.16–31.x, 192.168.x). For X1: expose the camera via go2rtc/OctoEverywhere as MJPEG/snapshot and paste the URL here.'}
          </p>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (sec)'}</label>
          <input style={inp} type="number" min={1} max={30} value={num(config.refreshSeconds) || 2} onChange={(e) => onChange('refreshSeconds', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={lbl}>{de ? 'Bild-Modus' : 'Image fit'}</label>
          <select style={inp} value={config.fit === 'cover' ? 'cover' : 'contain'} onChange={(e) => onChange('fit', e.target.value)}>
            <option value="contain">{de ? 'Ganz zeigen' : 'Contain'}</option>
            <option value="cover">{de ? 'Füllen' : 'Cover'}</option>
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={config.showVersion === true} onChange={(e) => onChange('showVersion', e.target.checked)} />
        <span>{de ? 'Versionsnummer zeigen' : 'Show version number'}</span>
      </label>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'bambu-cam',
  name: 'Bambu Lab Kamera',
  description:
    'Live-Kamerabild von Bambu-Lab-Druckern: P1/A1 direkt (lokal, Port 6000) oder beliebige MJPEG-/Snapshot-URL. (Beta)',
  version: BAMBU_VERSION,
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🖨️',
  iconUrl: '/api/plugins/custom-assets/bambu-cam/icon.svg',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Bambu' },
    { key: 'source', label: 'Quelle', type: 'text', defaultValue: 'p1' },
    { key: 'host', label: 'Drucker-IP', type: 'text', defaultValue: '' },
    { key: 'accessCode', label: 'Zugangscode', type: 'password', defaultValue: '' },
    { key: 'streamUrl', label: 'Stream-URL', type: 'text', defaultValue: '' },
    { key: 'urlMjpeg', label: 'MJPEG-Dauerstream', type: 'boolean', defaultValue: false },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 2 },
    { key: 'fit', label: 'Bild-Modus', type: 'text', defaultValue: 'contain' },
    { key: 'showVersion', label: 'Versionsnummer zeigen', type: 'boolean', defaultValue: false },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
