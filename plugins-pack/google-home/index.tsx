'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const GOOGLE_BLUE = '#4285f4'
const SETPOINT_STEP = 0.5
const SETPOINT_MIN = 9
const SETPOINT_MAX = 32

type Device = {
  name: string
  type: string
  label: string
  room?: string
  online?: boolean
  isThermostat: boolean
  ambientC?: number
  humidity?: number
  heatC?: number
  coolC?: number
  mode?: string
  availableModes?: string[]
  hvac?: string
}

type DevicesState = {
  connected: boolean
  devices?: Device[]
  error?: string
  detail?: string
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

function redirectUriFor(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/api/plugins/google-home/callback`
}

async function postGoogleHome(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/plugins/google-home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

/** Nest reports Celsius; convert only for display. */
function fmtTemp(celsius: number | undefined, unit: 'C' | 'F'): string {
  if (celsius === undefined) return '—'
  if (unit === 'F') return `${Math.round((celsius * 9) / 5 + 32)}°F`
  return `${celsius.toFixed(1).replace(/\.0$/, '')}°C`
}

function connErrorText(code: string | undefined, de: boolean, detail?: string): string {
  switch (code) {
    case 'reauth_required':
    case 'not_connected':
      return de
        ? 'Verbindung abgelaufen — bitte neu verbinden (Trennen → Verbinden).'
        : 'Connection expired — please reconnect (Disconnect → Connect).'
    case 'refresh_failed':
      return de ? 'Token-Erneuerung fehlgeschlagen — bitte neu verbinden.' : 'Token refresh failed — reconnect.'
    case 'secret_unreadable':
      return de ? 'Client Secret nicht lesbar — neu eintragen und verbinden.' : 'Client secret unreadable — re-enter it.'
    case 'api_error':
      return `${de ? 'Google-API-Fehler' : 'Google API error'}${detail ? `: ${detail}` : '.'}`
    case 'network_error':
      return de ? 'Netzwerkfehler.' : 'Network error.'
    default:
      return de ? 'Nicht verbunden — in den Einstellungen verbinden.' : 'Not connected — connect in settings.'
  }
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

type IconProps = { size?: number; color?: string }

function IconHome({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function IconThermostat({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z" />
    </svg>
  )
}

function IconCamera({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

function IconBell({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconDisplay({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function deviceIcon(type: string, size: number, color: string) {
  switch (type) {
    case 'THERMOSTAT':
      return <IconThermostat size={size} color={color} />
    case 'CAMERA':
      return <IconCamera size={size} color={color} />
    case 'DOORBELL':
      return <IconBell size={size} color={color} />
    case 'DISPLAY':
      return <IconDisplay size={size} color={color} />
    default:
      return <IconHome size={size} color={color} />
  }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const projectId = str(config.projectId)
  const clientId = str(config.clientId)
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const unit: 'C' | 'F' = str(config.tempUnit).toUpperCase() === 'F' ? 'F' : 'C'
  const title = config.title === undefined ? 'Google Home' : str(config.title)
  const showTitle = config.showTitle !== false
  const configured = Boolean(projectId && clientId)

  const [state, setState] = useState<DevicesState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const json = (await postGoogleHome({ action: 'devices', projectId, clientId })) as DevicesState
      setState(json)
    } catch {
      setState({ connected: false, error: 'network_error' })
    } finally {
      setLoading(false)
    }
  }, [configured, projectId, clientId])

  useEffect(() => {
    if (!active) return
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs, active])

  const sendCommand = useCallback(
    async (device: Device, command: string, params: Record<string, unknown>) => {
      if (busy) return
      setBusy(device.name)
      setMsg(null)
      try {
        const json = await postGoogleHome({ action: 'command', projectId, clientId, device: device.name, command, params })
        if (typeof json.error === 'string') {
          setMsg(de ? 'Aktion fehlgeschlagen.' : 'Action failed.')
        }
      } catch {
        /* surfaced on next poll */
      } finally {
        setTimeout(() => {
          setBusy(null)
          void refresh()
        }, 400)
      }
    },
    [busy, projectId, clientId, refresh, de],
  )

  const changeSetpoint = useCallback(
    (device: Device, delta: number) => {
      // HEATCOOL has two setpoints; the simple +/- here targets the heat point,
      // which is what a single-tap control should adjust on a heating system.
      const useCool = device.mode === 'COOL'
      const current = useCool ? device.coolC : device.heatC
      if (current === undefined) return
      const next = Math.min(SETPOINT_MAX, Math.max(SETPOINT_MIN, Math.round((current + delta) * 2) / 2))
      if (useCool) {
        void sendCommand(device, 'sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool', { coolCelsius: next })
      } else {
        void sendCommand(device, 'sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat', { heatCelsius: next })
      }
    },
    [sendCommand],
  )

  const cycleMode = useCallback(
    (device: Device) => {
      const modes = device.availableModes && device.availableModes.length > 0 ? device.availableModes : ['HEAT', 'OFF']
      const idx = device.mode ? modes.indexOf(device.mode) : -1
      const next = modes[(idx + 1) % modes.length]
      void sendCommand(device, 'sdm.devices.commands.ThermostatMode.SetMode', { mode: next })
    },
    [sendCommand],
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
    gap: 6,
  }
  const centered: CSSProperties = { ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }

  if (!configured) {
    return (
      <div style={centered}>
        <IconHome size={26} color={GOOGLE_BLUE} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Project ID und Client ID in den Einstellungen eintragen und mit Google verbinden.'
            : 'Enter Project ID and Client ID in settings and connect to Google.'}
        </p>
      </div>
    )
  }

  if (loading && !state) {
    return (
      <div style={shell}>
        {[70, 55, 80, 60].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 28, width: `${w}%`, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (state && !state.connected) {
    return (
      <div style={centered}>
        <IconHome size={26} color={GOOGLE_BLUE} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {connErrorText(state.error, de, state.detail)}
        </p>
      </div>
    )
  }

  const devices = state?.devices ?? []

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

      {devices.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            {de ? 'Keine Geräte gefunden.' : 'No devices found.'}
          </p>
        </div>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {devices.map((d) => (
            <DeviceRow
              key={d.name}
              device={d}
              unit={unit}
              de={de}
              busy={busy === d.name}
              onStep={changeSetpoint}
              onMode={cycleMode}
            />
          ))}
        </ul>
      )}

      {msg ? (
        <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.3, textAlign: 'center' }}>{msg}</p>
      ) : null}
    </div>
  )
}

function modeColor(mode: string | undefined): string {
  switch (mode) {
    case 'HEAT':
      return '#f97316'
    case 'COOL':
      return '#38bdf8'
    case 'HEATCOOL':
      return '#a78bfa'
    default:
      return 'var(--text-muted)'
  }
}

function modeLabel(mode: string | undefined, de: boolean): string {
  switch (mode) {
    case 'HEAT':
      return de ? 'Heizen' : 'Heat'
    case 'COOL':
      return de ? 'Kühlen' : 'Cool'
    case 'HEATCOOL':
      return de ? 'Auto' : 'Auto'
    case 'OFF':
      return de ? 'Aus' : 'Off'
    default:
      return mode || '—'
  }
}

function DeviceRow({
  device,
  unit,
  de,
  busy,
  onStep,
  onMode,
}: {
  device: Device
  unit: 'C' | 'F'
  de: boolean
  busy: boolean
  onStep: (d: Device, delta: number) => void
  onMode: (d: Device) => void
}) {
  const setpoint = device.mode === 'COOL' ? device.coolC : device.heatC
  const heating = device.hvac === 'HEATING' || device.hvac === 'COOLING'
  const accent = device.isThermostat ? modeColor(device.mode) : device.online === false ? '#ef4444' : GOOGLE_BLUE

  return (
    <li
      title={device.name}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        minWidth: 0,
      }}
    >
      <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', opacity: device.online === false ? 0.5 : 1 }}>
        {deviceIcon(device.type, 18, accent)}
      </span>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span
          style={{
            fontSize: 'clamp(11px, 3.2cqmin, 13px)',
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {device.label}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {device.isThermostat ? (
            <>
              {fmtTemp(device.ambientC, unit)}
              {device.humidity !== undefined ? ` · ${Math.round(device.humidity)}%` : ''}
              {device.mode ? ` · ${modeLabel(device.mode, de)}${heating ? ' …' : ''}` : ''}
            </>
          ) : (
            <>
              {device.room ? `${device.room} · ` : ''}
              {device.online === false ? 'offline' : device.online ? 'online' : device.type.toLowerCase()}
              {device.ambientC !== undefined ? ` · ${fmtTemp(device.ambientC, unit)}` : ''}
            </>
          )}
        </span>
      </div>

      {device.isThermostat && setpoint !== undefined && device.mode !== 'OFF' ? (
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <StepButton disabled={busy} label="−" onClick={() => onStep(device, -SETPOINT_STEP)} />
          <span style={{ fontSize: 'clamp(11px, 3.4cqmin, 14px)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'center', color: accent }}>
            {fmtTemp(setpoint, unit)}
          </span>
          <StepButton disabled={busy} label="+" onClick={() => onStep(device, SETPOINT_STEP)} />
        </div>
      ) : device.isThermostat ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onMode(device)}
          title={de ? 'Modus wechseln' : 'Change mode'}
          style={{
            flex: '0 0 auto',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
            border: `1px solid ${accent}`,
            background: 'transparent',
            color: accent,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
        >
          {modeLabel(device.mode, de)}
        </button>
      ) : (
        <span
          style={{
            flex: '0 0 auto',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: device.online === false ? '#ef4444' : '#34a853',
          }}
        />
      )}
    </li>
  )
}

function StepButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text)',
        fontSize: 16,
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Settings — credentials + OAuth connect flow
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
  const projectId = str(config.projectId)
  const clientId = str(config.clientId)
  const showTitle = config.showTitle !== false
  const unit: 'C' | 'F' = str(config.tempUnit).toUpperCase() === 'F' ? 'F' : 'C'
  const redirectUri = redirectUriFor()

  const [status, setStatus] = useState<{ connected: boolean; deviceCount?: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStatus = useCallback(async () => {
    if (!projectId || !clientId) {
      setStatus(null)
      return null
    }
    try {
      const json = (await postGoogleHome({ action: 'status', projectId, clientId })) as {
        connected: boolean
        deviceCount?: number
      }
      setStatus(json)
      return json
    } catch {
      return null
    }
  }, [projectId, clientId])

  useEffect(() => {
    void loadStatus()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadStatus])

  const connect = useCallback(async () => {
    const secret = str(config.clientSecret)
    if (!projectId || !clientId || !secret) {
      setMsg(de ? 'Project ID, Client ID und Client Secret eintragen.' : 'Enter Project ID, Client ID and Client Secret.')
      return
    }
    setWorking(true)
    setMsg(null)
    try {
      const json = (await postGoogleHome({
        action: 'begin',
        projectId,
        clientId,
        clientSecret: secret,
        redirectUri,
      })) as { authUrl?: string; error?: string }
      if (!json.authUrl) {
        setMsg(de ? 'Konnte Autorisierung nicht starten.' : 'Could not start authorization.')
        setWorking(false)
        return
      }
      window.open(json.authUrl, 'google-home-auth', 'width=520,height=720')
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
  }, [projectId, clientId, config.clientSecret, redirectUri, de, loadStatus])

  const disconnect = useCallback(async () => {
    if (!projectId || !clientId) return
    setWorking(true)
    await postGoogleHome({ action: 'disconnect', projectId, clientId })
    setWorking(false)
    setMsg(de ? 'Verbindung getrennt.' : 'Disconnected.')
    void loadStatus()
  }, [projectId, clientId, de, loadStatus])

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
      {/* Title */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <input
          style={{ ...inp, opacity: showTitle ? 1 : 0.5 }}
          disabled={!showTitle}
          value={config.title === undefined ? 'Google Home' : str(config.title)}
          placeholder="Google Home"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      {/* Credentials */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Project ID (Device Access)' : 'Project ID (Device Access)'}</label>
        <input style={inp} value={projectId} placeholder="z. B. abcd1234-…" onChange={(e) => onChange('projectId', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>OAuth Client ID</label>
        <input style={inp} value={clientId} placeholder="…apps.googleusercontent.com" onChange={(e) => onChange('clientId', e.target.value)} />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>OAuth Client Secret</label>
        <input style={inp} type="password" value={str(config.clientSecret)} onChange={(e) => onChange('clientSecret', e.target.value)} />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? 'Project ID aus der Device Access Console (einmalig 5 $). Client ID/Secret aus Google Cloud → APIs & Dienste → Anmeldedaten (OAuth-Client „Web"). Das Secret wird verschlüsselt auf dem Server gespeichert.'
            : 'Project ID from the Device Access Console (one-time $5). Client ID/secret from Google Cloud → APIs & Services → Credentials (OAuth "Web" client). The secret is stored encrypted on the server.'}
        </p>
      </div>

      {/* Redirect URI */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Redirect-URI (in Google Cloud + Device Access eintragen)' : 'Redirect URI (add it in Google Cloud + Device Access)'}
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={{ ...inp, fontSize: 11 }} value={redirectUri} readOnly onFocus={(e) => e.target.select()} />
          <button
            type="button"
            onClick={copyRedirect}
            style={{ ...inp, width: 'auto', cursor: 'pointer', whiteSpace: 'nowrap', borderColor: copied ? GOOGLE_BLUE : 'var(--border)' }}
          >
            {copied ? (de ? 'Kopiert' : 'Copied') : de ? 'Kopieren' : 'Copy'}
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {de
            ? 'Diese exakte URL als „Autorisierten Redirect-URI" beim OAuth-Client und in der Device Access Console eintragen. Google verlangt HTTPS — bei LAN-Zugriff über einen Reverse-Proxy mit HTTPS.'
            : 'Add this exact URL as an authorized redirect URI on the OAuth client and in the Device Access Console. Google requires HTTPS — front LAN access with an HTTPS reverse proxy.'}
        </p>
      </div>

      {/* Connection status */}
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
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: connected ? '#34a853' : 'var(--text-muted)', flex: '0 0 auto' }} />
        <span style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
          {connected
            ? `${de ? 'Verbunden' : 'Connected'}${typeof status?.deviceCount === 'number' ? ` — ${status.deviceCount} ${de ? 'Geräte' : 'devices'}` : ''}`
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
            style={{ ...inp, width: 'auto', cursor: 'pointer', background: GOOGLE_BLUE, color: '#fff', fontWeight: 700, borderColor: GOOGLE_BLUE }}
          >
            {working ? (de ? 'Warte…' : 'Waiting…') : de ? 'Verbinden' : 'Connect'}
          </button>
        )}
      </div>
      {msg ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{msg}</p> : null}

      {/* Display options */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Einheit' : 'Unit'}</label>
          <select style={inp} value={unit} onChange={(e) => onChange('tempUnit', e.target.value)}>
            <option value="C">°C</option>
            <option value="F">°F</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
          <input
            style={inp}
            type="number"
            min={10}
            max={3600}
            value={num(config.refreshSeconds) || 30}
            onChange={(e) => onChange('refreshSeconds', Math.max(10, num(e.target.value) || 30))}
          />
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>
        {de
          ? 'Nutzt die offizielle Smart Device Management API (nur Google-Nest-Geräte). Routinen und Cast-/Media-Steuerung bietet Google extern nicht an — dafür ggf. das Home-Assistant-Plugin nutzen. (Beta)'
          : 'Uses the official Smart Device Management API (Google Nest devices only). Google does not expose routines or Cast/media control externally — use the Home Assistant plugin for those. (Beta)'}
      </p>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'google-home',
  name: 'Google Home / Nest',
  description:
    'Google-Nest-Geräte über die offizielle Smart Device Management (SDM) API: Thermostate (Ist-/Soll-Temperatur, Modus, +/-), Sensoren (Temperatur, Luftfeuchte) und Online-Status von Kameras, Türklingeln und Displays. Verbindung per OAuth. (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🏠',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/google-home.png',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Google Home' },
    { key: 'projectId', label: 'Project ID', type: 'text', defaultValue: '' },
    { key: 'clientId', label: 'OAuth Client ID', type: 'text', defaultValue: '' },
    { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', defaultValue: '' },
    { key: 'tempUnit', label: 'Einheit (C/F)', type: 'text', defaultValue: 'C' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
