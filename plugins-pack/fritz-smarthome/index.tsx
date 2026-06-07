'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type FritzDevice = {
  ain: string
  name: string
  kind: 'thermostat' | 'switch' | 'sensor' | 'contact' | 'other'
  present: boolean
  tist?: number | null
  tsoll?: number | null
  windowOpen?: boolean
  batteryLow?: boolean
  battery?: number | null
  on?: boolean
  power?: number | null
  energy?: number | null
  temperature?: number | null
  humidity?: number | null
  open?: boolean
}

type StateResponse = { devices?: FritzDevice[]; error?: string; detail?: string }

const SET_MIN = 8
const SET_MAX = 28
const SET_STEP = 0.5

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}
function round(v: unknown, d = 1): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return String(v)
  const f = Math.pow(10, d)
  return String(Math.round(n * f) / f)
}
function parseIdSet(v: unknown): Set<string> {
  return new Set(str(v).split(',').map((s) => s.trim()).filter(Boolean))
}

/** FRITZ tsoll (raw half-deg): 253=off, 254=on(max), else /2 °C. */
function tsollLabel(tsoll: number | null | undefined, de: boolean): string {
  if (tsoll == null) return '—'
  if (tsoll === 253) return de ? 'Aus' : 'Off'
  if (tsoll === 254) return de ? 'An' : 'On'
  return `${round(tsoll / 2, 1)}°`
}
function tsollToTempC(tsoll: number | null | undefined): number {
  if (tsoll == null) return 20
  if (tsoll === 254) return SET_MAX
  if (tsoll === 253) return SET_MIN
  return Math.min(SET_MAX, Math.max(SET_MIN, tsoll / 2))
}

async function callFritz(body: Record<string, unknown>): Promise<StateResponse> {
  const res = await fetch('/api/plugins/fritz-smarthome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as StateResponse
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Login abgelehnt — Benutzer/Passwort prüfen.', 'Login rejected — check user/password.'],
    missing_credentials: ['FRITZ!Box-Passwort eintragen.', 'Enter FRITZ!Box password.'],
    missing_url: ['FRITZ!Box-Adresse fehlt.', 'FRITZ!Box address missing.'],
    invalid_url: ['Ungültige Adresse.', 'Invalid address.'],
    blocked_url: ['Adresse blockiert (SSRF-Schutz).', 'Address blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['FRITZ!Box nicht erreichbar.', 'FRITZ!Box unreachable.'],
    upstream_error: ['FRITZ!Box-Fehler.', 'FRITZ!Box error.'],
    set_failed: ['Schalten fehlgeschlagen.', 'Switching failed.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function Toggle({ on, fg }: { on: boolean; fg: string }) {
  return (
    <span aria-hidden style={{ display: 'inline-block', width: 38, height: 22, minWidth: 38, boxSizing: 'border-box', borderRadius: 999, flexShrink: 0, background: on ? 'color-mix(in srgb, ' + fg + ' 40%, transparent)' : 'rgba(255,255,255,.14)', border: '1px solid ' + (on ? 'transparent' : 'rgba(255,255,255,.18)'), position: 'relative', transition: 'background 0.15s' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
    </span>
  )
}

function WindowIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {open ? (<><path d="M5 4h6v16H5z" /><path d="M13 4v16" /><path d="M13 6l6-2v12l-6 2" /></>) : (<><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M12 4v16M4 12h16" /></>)}
    </svg>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const baseUrl = str(config.baseUrl) || 'fritz.box'
  const username = str(config.username)
  const password = str(config.password)
  const title = config.title === undefined ? 'FRITZ! Smart Home' : str(config.title)
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const configured = Boolean(baseUrl && password)
  const hidden = parseIdSet(config.hidden)

  const [devices, setDevices] = useState<FritzDevice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const busyRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!configured || busyRef.current) {
      if (!configured) setLoading(false)
      return
    }
    const json = await callFritz({ url: baseUrl, username, password, action: 'state' })
    if (json.error) setError(errorText(json.error, json.detail || '', de))
    else {
      setError(null)
      setDevices(Array.isArray(json.devices) ? json.devices : [])
    }
    setLoading(false)
  }, [baseUrl, username, password, configured, de])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  const apply = (ain: string, patch: Partial<FritzDevice>) =>
    setDevices((prev) => prev.map((d) => (d.ain === ain ? { ...d, ...patch } : d)))

  const setSwitch = async (d: FritzDevice) => {
    busyRef.current = true
    apply(d.ain, { on: !d.on })
    await callFritz({ url: baseUrl, username, password, action: 'set', kind: 'switch', ain: d.ain, on: !d.on })
    busyRef.current = false
    setTimeout(() => void refresh(), 500)
  }
  const setTemp = async (d: FritzDevice, tempC: number) => {
    busyRef.current = true
    apply(d.ain, { tsoll: Math.round(tempC * 2) })
    await callFritz({ url: baseUrl, username, password, action: 'set', kind: 'thermostat', ain: d.ain, tempC })
    busyRef.current = false
    setTimeout(() => void refresh(), 600)
  }
  const setOff = async (d: FritzDevice) => {
    busyRef.current = true
    apply(d.ain, { tsoll: 253 })
    await callFritz({ url: baseUrl, username, password, action: 'set', kind: 'thermostat', ain: d.ain, off: true })
    busyRef.current = false
    setTimeout(() => void refresh(), 600)
  }

  const shell: CSSProperties = { height: '100%', width: '100%', minWidth: 0, minHeight: 0, boxSizing: 'border-box', padding: '8px 10px 10px', containerType: 'size', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🏠</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de ? 'FRITZ!Box-Adresse, Benutzer und Passwort in den Einstellungen eintragen.' : 'Enter FRITZ!Box address, user and password in settings.'}
        </p>
      </div>
    )
  }

  const visible = devices.filter((d) => !hidden.has(d.ain))
  const groups: { key: FritzDevice['kind']; label: string }[] = [
    { key: 'thermostat', label: de ? 'Heizung' : 'Heating' },
    { key: 'switch', label: de ? 'Steckdosen' : 'Plugs' },
    { key: 'contact', label: de ? 'Kontakte' : 'Contacts' },
    { key: 'sensor', label: de ? 'Sensoren' : 'Sensors' },
  ]

  const card: CSSProperties = { boxSizing: 'border-box', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }
  const stepBtn: CSSProperties = { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 18, fontWeight: 700, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
  const sectionLabel = (t: string) => (
    <span style={{ fontSize: 'clamp(8px, 2cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t}</span>
  )

  const renderThermostat = (d: FritzDevice) => {
    const off = d.tsoll === 253
    const tempC = tsollToTempC(d.tsoll)
    const stepDown = () => {
      if (off) return
      const next = Math.round((tempC - SET_STEP) * 2) / 2
      if (next < SET_MIN) void setOff(d)
      else void setTemp(d, next)
    }
    const stepUp = () => {
      if (off) {
        void setTemp(d, SET_MIN)
        return
      }
      const next = Math.min(SET_MAX, Math.round((tempC + SET_STEP) * 2) / 2)
      if (next !== tempC) void setTemp(d, next)
    }
    const info: string[] = []
    if (d.tist != null) info.push(`${de ? 'Ist' : 'Now'} ${round(d.tist, 1)} °C`)
    if (d.windowOpen) info.push(de ? '🪟 offen' : '🪟 open')
    if (d.batteryLow) info.push(de ? '🔋 schwach' : '🔋 low')
    return (
      <div key={d.ain} style={card}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.name}>{d.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{info.join(' · ') || '…'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" style={{ ...stepBtn, opacity: off ? 0.4 : 1 }} disabled={off} onClick={stepDown} title={de ? 'Kälter / Aus' : 'Down / off'}>−</button>
          <span style={{ fontSize: 15, fontWeight: 700, minWidth: 46, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: off ? 'var(--text-muted)' : 'var(--accent)' }}>{tsollLabel(d.tsoll, de)}</span>
          <button type="button" style={stepBtn} onClick={stepUp} title={de ? 'Wärmer / An' : 'Up / on'}>+</button>
        </div>
      </div>
    )
  }

  const renderSwitch = (d: FritzDevice) => (
    <div key={d.ain} style={card}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.name}>{d.name}</div>
        {d.power != null ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{round(d.power, 1)} W</div> : null}
      </div>
      <button type="button" onClick={() => void setSwitch(d)} style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0, cursor: 'pointer', justifySelf: 'end' }} title={d.on ? (de ? 'Ausschalten' : 'Turn off') : de ? 'Einschalten' : 'Turn on'}>
        <Toggle on={!!d.on} fg="var(--accent)" />
      </button>
    </div>
  )

  const renderContact = (d: FritzDevice) => (
    <div key={d.ain} style={card}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={d.name}>{d.name}</div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: d.open ? '#f59e0b' : 'var(--text-muted)', whiteSpace: 'nowrap', justifySelf: 'end' }}>
        <WindowIcon open={!!d.open} color={d.open ? '#f59e0b' : 'var(--text-muted)'} />
        {d.open ? (de ? 'Offen' : 'Open') : de ? 'Zu' : 'Closed'}
      </span>
    </div>
  )

  const renderSensor = (d: FritzDevice) => {
    const parts: string[] = []
    if (d.temperature != null) parts.push(`${round(d.temperature, 1)} °C`)
    if (d.humidity != null) parts.push(`${round(d.humidity, 0)} %`)
    return (
      <div key={d.ain} style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={d.name}>{d.name}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', justifySelf: 'end' }}>{parts.join(' · ') || '—'}</span>
      </div>
    )
  }

  const renderDevice = (d: FritzDevice) =>
    d.kind === 'thermostat' ? renderThermostat(d) : d.kind === 'switch' ? renderSwitch(d) : d.kind === 'contact' ? renderContact(d) : renderSensor(d)

  return (
    <div style={shell}>
      {title ? (
        <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', flexShrink: 0 }}>{title}</span>
      ) : null}

      {loading && devices.length === 0 && !error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, borderRadius: 6 }} />)}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!loading && visible.length === 0 && !error ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{de ? 'Keine Smart-Home-Geräte gefunden.' : 'No smart home devices found.'}</p>
        ) : null}

        {groups.map((g) => {
          const list = visible.filter((d) => d.kind === g.key)
          if (list.length === 0) return null
          return (
            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sectionLabel(g.label)}
              {list.map(renderDevice)}
            </div>
          )
        })}
      </div>

      {error ? <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>{error}</p> : null}
    </div>
  )
}

const inp: CSSProperties = { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const baseUrl = str(config.baseUrl) || 'fritz.box'
  const username = str(config.username)
  const password = str(config.password)
  const configured = Boolean(baseUrl && password)
  const hidden = parseIdSet(config.hidden)

  const [devices, setDevices] = useState<FritzDevice[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setLoadErr(null)
    const json = await callFritz({ url: baseUrl, username, password, action: 'state' })
    setLoading(false)
    if (json.error) setLoadErr(errorText(json.error, json.detail || '', de))
    else setDevices(Array.isArray(json.devices) ? json.devices : [])
  }, [baseUrl, username, password, configured, de])

  useEffect(() => {
    if (configured) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  const setHidden = (ain: string, visible: boolean) => {
    const cur = parseIdSet(config.hidden)
    if (visible) cur.delete(ain)
    else cur.add(ain)
    onChange('hidden', Array.from(cur).join(','))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}</label>
        <input style={inp} value={config.title === undefined ? 'FRITZ! Smart Home' : str(config.title)} placeholder="FRITZ! Smart Home" onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'FRITZ!Box-Adresse' : 'FRITZ!Box address'}</label>
        <input style={inp} value={baseUrl} placeholder="fritz.box" onChange={(e) => onChange('baseUrl', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Benutzer (optional)' : 'User (optional)'}</label>
          <input style={inp} value={username} placeholder="fritz1234" onChange={(e) => onChange('username', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Passwort' : 'Password'}</label>
          <input style={inp} type="password" value={password} onChange={(e) => onChange('password', e.target.value)} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {de
          ? 'Tipp: Eigenen FRITZ!Box-Benutzer mit Recht „Smart-Home" anlegen. Das Passwort wird verschlüsselt gespeichert.'
          : 'Tip: create a dedicated FRITZ!Box user with the “Smart Home” permission. The password is stored encrypted.'}
      </p>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{de ? 'Geräte ein-/ausblenden' : 'Show/hide devices'}</label>
          <button type="button" onClick={() => void load()} disabled={!configured || loading} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: configured ? 'pointer' : 'not-allowed' }}>
            {loading ? (de ? 'Lade …' : 'Loading …') : de ? 'Neu laden' : 'Reload'}
          </button>
        </div>
        {!configured ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>{de ? 'Erst Adresse und Passwort eintragen.' : 'Enter address and password first.'}</p>
        ) : loadErr ? (
          <p style={{ fontSize: 11, color: '#ef4444', margin: '6px 0 0' }}>{loadErr}</p>
        ) : devices ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px' }}>
            {devices.length === 0 ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{de ? 'Keine Geräte.' : 'No devices.'}</span> : null}
            {devices.map((d) => (
              <label key={d.ain} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={!hidden.has(d.ain)} onChange={(e) => setHidden(d.ain, e.target.checked)} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{d.kind}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
        <input style={inp} type="number" min={10} max={300} value={num(config.refreshSeconds) || 30} onChange={(e) => onChange('refreshSeconds', Math.max(10, num(e.target.value) || 30))} />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'fritz-smarthome',
  name: 'FRITZ! Smart Home',
  description:
    'FRITZ! Smart Home über das AHA-HTTP-Interface: Heizthermostate (Soll-Temp), Steckdosen (an/aus + Watt), Fensterkontakte und Sensoren. (Beta)',
  version: '0.9.1',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🏠',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/fritzbox.png',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'FRITZ! Smart Home' },
    { key: 'baseUrl', label: 'FRITZ!Box-Adresse', type: 'text', defaultValue: 'fritz.box' },
    { key: 'username', label: 'Benutzer', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'hidden', label: 'Ausgeblendete Geräte', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = { Widget, Settings }
