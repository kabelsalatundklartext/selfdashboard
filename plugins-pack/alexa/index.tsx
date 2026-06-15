'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const ALEXA_CYAN = '#00caff'

type TabKey = 'devices' | 'smarthome' | 'routines'

type Status = {
  connected: boolean
  customerName?: string
  host?: string
  port?: number
  amazonPage?: string
  loginPending?: boolean
  error?: string
}

type Device = { serial: string; name: string; type: string; online: boolean; hasMusic: boolean }
type Player = {
  serial: string
  state: string
  title?: string
  artist?: string
  album?: string
  imageUrl?: string
  provider?: string
  volume?: number
  muted?: boolean
  error?: string
}
type Entity = { id: string; name: string }
type Routine = { id: string; name: string }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

async function postAlexa(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plugins/alexa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

function connErrorText(code: string | undefined, de: boolean): string {
  switch (code) {
    case 'reauth_required':
      return de ? 'Anmeldung abgelaufen — in den Einstellungen neu verbinden.' : 'Session expired — reconnect in settings.'
    case 'not_connected':
      return de ? 'Nicht verbunden — in den Einstellungen mit Amazon verbinden.' : 'Not connected — connect in settings.'
    default:
      return de ? 'Fehler bei der Alexa-Verbindung.' : 'Alexa connection error.'
  }
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

type IconProps = { size?: number; color?: string }
function IconPlay({ size = 22, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden><path d="M8 5v14l11-7z" /></svg>
}
function IconPause({ size = 22, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
}
function IconPrev({ size = 20, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden><rect x="5" y="5" width="2.5" height="14" rx="0.5" /><path d="M20 5v14l-10-7z" /></svg>
}
function IconNext({ size = 20, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden><rect x="16.5" y="5" width="2.5" height="14" rx="0.5" /><path d="M4 5v14l10-7z" /></svg>
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; de: string; en: string }[] = [
  { key: 'devices', de: 'Geräte', en: 'Devices' },
  { key: 'smarthome', de: 'Smart-Home', en: 'Smart Home' },
  { key: 'routines', de: 'Routinen', en: 'Routines' },
]

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const title = config.title === undefined ? 'Alexa' : str(config.title)
  const showTitle = config.showTitle !== false
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 15) * 1000
  const startTab = (str(config.defaultTab) || 'devices') as TabKey

  const [status, setStatus] = useState<Status | null>(null)
  const [tab, setTab] = useState<TabKey>(startTab)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [devices, setDevices] = useState<Device[]>([])
  const [serial, setSerial] = useState<string>('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [vol, setVol] = useState<number>(0)
  const [entities, setEntities] = useState<Entity[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])

  const loadStatus = useCallback(async () => {
    const s = (await postAlexa({ action: 'status' })) as Status
    setStatus(s)
    return s
  }, [])

  const loadTab = useCallback(async (which: TabKey) => {
    try {
      if (which === 'devices') {
        const r = (await postAlexa({ action: 'devices' })) as { devices?: Device[]; error?: string }
        if (r.error) {
          setStatus((s) => ({ ...(s ?? { connected: false }), error: r.error }))
          return
        }
        const list = r.devices ?? []
        setDevices(list)
        setSerial((cur) => cur || list.find((d) => d.online)?.serial || list[0]?.serial || '')
      } else if (which === 'smarthome') {
        const r = (await postAlexa({ action: 'smarthome' })) as { devices?: Entity[]; error?: string }
        setEntities(r.devices ?? [])
      } else {
        const r = (await postAlexa({ action: 'routines' })) as { routines?: Routine[]; error?: string }
        setRoutines(r.routines ?? [])
      }
    } catch {
      /* surfaced via status */
    }
  }, [])

  // Initial: status, then active tab.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const s = await loadStatus()
      if (!alive) return
      if (s.connected) await loadTab(tab)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload data when the tab changes (while connected).
  useEffect(() => {
    if (status?.connected) void loadTab(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Poll the player on the devices tab.
  const loadPlayer = useCallback(async () => {
    if (!serial) return
    const r = (await postAlexa({ action: 'player', serial })) as Player
    setPlayer(r)
    if (typeof r.volume === 'number') setVol(r.volume)
  }, [serial])

  useEffect(() => {
    if (!status?.connected || tab !== 'devices' || !serial) return
    void loadPlayer()
    const t = setInterval(() => void loadPlayer(), refreshMs)
    return () => clearInterval(t)
  }, [status?.connected, tab, serial, refreshMs, loadPlayer])

  const sendControl = useCallback(
    async (command: string, value?: number) => {
      if (!serial || busy) return
      setBusy(true)
      if (command === 'play' || command === 'pause') {
        setPlayer((p) => (p ? { ...p, state: command === 'play' ? 'PLAYING' : 'PAUSED' } : p))
      }
      try {
        const r = await postAlexa({ action: 'control', serial, command, value })
        if (r.error) setMsg(de ? 'Aktion fehlgeschlagen.' : 'Action failed.')
        else setMsg(null)
      } finally {
        setTimeout(() => {
          setBusy(false)
          void loadPlayer()
        }, 400)
      }
    },
    [serial, busy, de, loadPlayer],
  )

  const toggleEntity = useCallback(
    async (id: string, on: boolean) => {
      if (busy) return
      setBusy(true)
      try {
        const r = await postAlexa({ action: 'smarthome-toggle', id, on })
        setMsg(r.error ? (de ? 'Schalten fehlgeschlagen.' : 'Toggle failed.') : null)
      } finally {
        setBusy(false)
      }
    },
    [busy, de],
  )

  const runRoutine = useCallback(
    async (id: string) => {
      if (busy) return
      setBusy(true)
      try {
        const r = await postAlexa({ action: 'routine-run', id, serial })
        setMsg(r.error ? (de ? 'Routine fehlgeschlagen.' : 'Routine failed.') : de ? 'Gestartet.' : 'Started.')
      } finally {
        setBusy(false)
      }
    },
    [busy, serial, de],
  )

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
    gap: 8,
  }
  const centered: CSSProperties = { ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }

  if (loading) {
    return (
      <div style={shell}>
        <div className="skeleton" style={{ height: 16, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ flex: 1, borderRadius: 10 }} />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div style={centered}>
        <div style={{ fontSize: 28 }}>🔵</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {connErrorText(status?.error ?? 'not_connected', de)}
        </p>
      </div>
    )
  }

  return (
    <div style={shell}>
      {showTitle && title ? (
        <p style={{ margin: 0, fontSize: 'clamp(9px, 2.4cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {title}
        </p>
      ) : null}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '5px 4px',
              fontSize: 11,
              fontWeight: tab === t.key ? 700 : 500,
              border: 'none',
              borderBottom: `2px solid ${tab === t.key ? ALEXA_CYAN : 'transparent'}`,
              background: 'transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {de ? t.de : t.en}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {tab === 'devices' ? (
          <DevicesTab
            de={de}
            devices={devices}
            serial={serial}
            setSerial={setSerial}
            player={player}
            vol={vol}
            setVol={setVol}
            busy={busy}
            onControl={sendControl}
          />
        ) : tab === 'smarthome' ? (
          <ListTab
            empty={de ? 'Keine Smart-Home-Geräte.' : 'No smart home devices.'}
            items={entities.map((e) => ({
              id: e.id,
              name: e.name,
              actions: (
                <div style={{ display: 'flex', gap: 6 }}>
                  <SmallBtn onClick={() => void toggleEntity(e.id, true)} disabled={busy}>{de ? 'An' : 'On'}</SmallBtn>
                  <SmallBtn onClick={() => void toggleEntity(e.id, false)} disabled={busy}>{de ? 'Aus' : 'Off'}</SmallBtn>
                </div>
              ),
            }))}
          />
        ) : (
          <ListTab
            empty={de ? 'Keine Routinen.' : 'No routines.'}
            items={routines.map((r) => ({
              id: r.id,
              name: r.name,
              actions: <SmallBtn onClick={() => void runRoutine(r.id)} disabled={busy} primary>{de ? 'Start' : 'Run'}</SmallBtn>,
            }))}
          />
        )}
      </div>

      {msg ? <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{msg}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Devices tab (player + volume)
// ---------------------------------------------------------------------------

function DevicesTab({
  de,
  devices,
  serial,
  setSerial,
  player,
  vol,
  setVol,
  busy,
  onControl,
}: {
  de: boolean
  devices: Device[]
  serial: string
  setSerial: (s: string) => void
  player: Player | null
  vol: number
  setVol: (v: number) => void
  busy: boolean
  onControl: (command: string, value?: number) => void
}) {
  const playing = player?.state === 'PLAYING'
  const selProps: CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 12,
    boxSizing: 'border-box',
  }

  if (devices.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>{de ? 'Keine Echo-Geräte gefunden.' : 'No Echo devices found.'}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <select value={serial} onChange={(e) => setSerial(e.target.value)} style={selProps}>
        {devices.map((d) => (
          <option key={d.serial} value={d.serial}>
            {d.name}
            {d.online ? '' : ' (offline)'}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {player?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.imageUrl} alt="" width={56} height={56} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flex: '0 0 auto' }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 22 }}>🔵</div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player?.title || (de ? 'Nichts aktiv' : 'Nothing playing')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player?.artist || player?.provider || ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <CircleBtn onClick={() => onControl('previous')} disabled={busy} title={de ? 'Zurück' : 'Previous'}><IconPrev /></CircleBtn>
        <CircleBtn primary onClick={() => onControl(playing ? 'pause' : 'play')} disabled={busy} title={playing ? 'Pause' : de ? 'Abspielen' : 'Play'}>
          {playing ? <IconPause /> : <IconPlay />}
        </CircleBtn>
        <CircleBtn onClick={() => onControl('next')} disabled={busy} title={de ? 'Weiter' : 'Next'}><IconNext /></CircleBtn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔈</span>
        <input
          type="range"
          min={0}
          max={100}
          value={vol}
          onChange={(e) => setVol(num(e.target.value))}
          onPointerUp={() => onControl('volume', vol)}
          onKeyUp={() => onControl('volume', vol)}
          style={{ flex: 1, accentColor: ALEXA_CYAN }}
          aria-label={de ? 'Lautstärke' : 'Volume'}
        />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 26, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{vol}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generic list tab (smart home / routines)
// ---------------------------------------------------------------------------

function ListTab({ items, empty }: { items: { id: string; name: string; actions: React.ReactNode }[]; empty: string }) {
  if (items.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>{empty}</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it) => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
          {it.actions}
        </div>
      ))}
    </div>
  )
}

function SmallBtn({ children, onClick, disabled, primary }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        fontSize: 11,
        borderRadius: 6,
        border: `1px solid ${primary ? ALEXA_CYAN : 'var(--border)'}`,
        background: primary ? ALEXA_CYAN : 'transparent',
        color: primary ? '#00131a' : 'var(--text)',
        fontWeight: primary ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function CircleBtn({ children, onClick, disabled, primary, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; title?: string }) {
  const size = primary ? 40 : 32
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
        background: primary ? ALEXA_CYAN : 'transparent',
        color: primary ? '#00131a' : 'var(--text)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Settings
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

const REGION_OPTS = [
  { value: 'de', label: 'amazon.de (DE/EU)' },
  { value: 'co.uk', label: 'amazon.co.uk (UK)' },
  { value: 'com', label: 'amazon.com (US)' },
  { value: 'co.jp', label: 'amazon.co.jp (JP)' },
]

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const showTitle = config.showTitle !== false
  const region = str(config.region) || 'de'
  const host = str(config.host)
  const port = num(config.port) || 3456
  const defaultTab = str(config.defaultTab) || 'devices'

  const [status, setStatus] = useState<Status | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const s = (await postAlexa({ action: 'status' })) as Status
      setStatus(s)
      return s
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    void loadStatus()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadStatus])

  const connect = useCallback(async () => {
    if (!host) {
      setMsg(de ? 'Host/IP des Dashboards eintragen.' : 'Enter the dashboard host/IP.')
      return
    }
    setWorking(true)
    setMsg(de ? 'Starte Login-Proxy…' : 'Starting login proxy…')
    try {
      const r = (await postAlexa({ action: 'begin', region, host, port })) as { proxyUrl?: string; error?: string }
      if (!r.proxyUrl) {
        setMsg(de ? 'Konnte Proxy nicht starten.' : 'Could not start proxy.')
        setWorking(false)
        return
      }
      window.open(r.proxyUrl, 'alexa-login', 'width=520,height=760')
      setMsg(de ? 'Im neuen Fenster bei Amazon anmelden…' : 'Sign in to Amazon in the new window…')
      let tries = 0
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        tries++
        const s = await loadStatus()
        if (s?.connected || tries > 90) {
          if (pollRef.current) clearInterval(pollRef.current)
          setWorking(false)
          setMsg(s?.connected ? (de ? '✅ Verbunden.' : '✅ Connected.') : de ? 'Zeitüberschreitung — erneut versuchen.' : 'Timed out — try again.')
        }
      }, 2000)
    } catch {
      setMsg(de ? 'Netzwerkfehler.' : 'Network error.')
      setWorking(false)
    }
  }, [host, port, region, de, loadStatus])

  const disconnect = useCallback(async () => {
    setWorking(true)
    await postAlexa({ action: 'disconnect' })
    setWorking(false)
    setMsg(de ? 'Verbindung getrennt.' : 'Disconnected.')
    void loadStatus()
  }, [de, loadStatus])

  const connected = status?.connected === true
  const proxyPreview = host ? `http://${host}:${port}/` : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <input style={{ ...inp, opacity: showTitle ? 1 : 0.5 }} disabled={!showTitle} value={config.title === undefined ? 'Alexa' : str(config.title)} placeholder="Alexa" onChange={(e) => onChange('title', e.target.value)} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Amazon-Region' : 'Amazon region'}</label>
        <select style={inp} value={region} onChange={(e) => onChange('region', e.target.value)}>
          {REGION_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Dashboard-Host / IP (für den Login-Proxy)' : 'Dashboard host / IP (for the login proxy)'}</label>
        <input style={inp} value={host} placeholder="z. B. 192.168.1.21" onChange={(e) => onChange('host', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>{de ? 'Proxy-Port' : 'Proxy port'}</label>
        <input style={inp} type="number" min={1024} max={65535} value={port} onChange={(e) => onChange('port', num(e.target.value) || 3456)} />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? `Beim Verbinden öffnet sich ${proxyPreview || 'http://<host>:<port>/'} — dort meldest du dich bei Amazon an (inkl. 2FA). Host/IP muss exakt die Adresse sein, über die dein Browser den Proxy erreicht. Port am Container freigeben.`
            : `On connect, ${proxyPreview || 'http://<host>:<port>/'} opens — sign in to Amazon there (incl. 2FA). The host/IP must exactly match how your browser reaches the proxy. Expose the port on the container.`}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: connected ? ALEXA_CYAN : 'var(--text-muted)', flex: '0 0 auto' }} />
        <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
          {connected ? `${de ? 'Verbunden' : 'Connected'}${status?.customerName ? ` — ${status.customerName}` : ''}` : de ? 'Nicht verbunden' : 'Not connected'}
        </span>
        {connected ? (
          <button type="button" disabled={working} onClick={() => void disconnect()} style={{ ...inp, width: 'auto', cursor: 'pointer' }}>
            {de ? 'Trennen' : 'Disconnect'}
          </button>
        ) : (
          <button type="button" disabled={working} onClick={() => void connect()} style={{ ...inp, width: 'auto', cursor: 'pointer', background: ALEXA_CYAN, color: '#00131a', fontWeight: 700, borderColor: ALEXA_CYAN }}>
            {working ? (de ? 'Warte…' : 'Waiting…') : de ? 'Verbinden' : 'Connect'}
          </button>
        )}
      </div>
      {msg ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{msg}</p> : null}

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Start-Tab' : 'Default tab'}</label>
        <select style={inp} value={defaultTab} onChange={(e) => onChange('defaultTab', e.target.value)}>
          <option value="devices">{de ? 'Geräte' : 'Devices'}</option>
          <option value="smarthome">{de ? 'Smart-Home' : 'Smart Home'}</option>
          <option value="routines">{de ? 'Routinen' : 'Routines'}</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
        <input style={inp} type="number" min={5} max={300} value={num(config.refreshSeconds) || 15} onChange={(e) => onChange('refreshSeconds', Math.max(5, num(e.target.value) || 15))} />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'alexa',
  name: 'Amazon Alexa',
  description:
    'Echo-Wiedergabe & Lautstärke (inkl. Amazon Music auf dem Echo), Alexa-Smart-Home schalten und Routinen auslösen. Login per Amazon-Konto über lokalen Proxy (inoffizielle API, Beta).',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'media',
  icon: '🔵',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/alexa.png',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Alexa' },
    {
      key: 'region',
      label: 'Amazon-Region',
      type: 'select',
      defaultValue: 'de',
      options: REGION_OPTS,
    },
    { key: 'host', label: 'Dashboard-Host / IP', type: 'text', defaultValue: '' },
    { key: 'port', label: 'Proxy-Port', type: 'number', defaultValue: 3456 },
    {
      key: 'defaultTab',
      label: 'Start-Tab',
      type: 'select',
      defaultValue: 'devices',
      options: [
        { value: 'devices', label: 'Geräte' },
        { value: 'smarthome', label: 'Smart-Home' },
        { value: 'routines', label: 'Routinen' },
      ],
    },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 15 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
