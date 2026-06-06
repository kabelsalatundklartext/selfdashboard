'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type ChannelCfg = { interface: string; address: string; name: string; type?: string; room?: string }
type RefCfg = { id: string; name: string }

type StateResponse = {
  channels?: Record<string, Record<string, unknown>>
  sysvars?: { id: string; name: string; value: unknown; unit: string; type: string }[]
  error?: string
  detail?: string
}

type ListResponse = {
  devices?: { address: string; name: string; type: string; interface: string; room: string; channels: { address: string; name: string; index: number; room: string }[] }[]
  sysvars?: { id: string; name: string; value: unknown; unit: string; type: string }[]
  programs?: { id: string; name: string }[]
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

/** Group selected channels by their CCU room (rooms first A–Z, "no room" last). */
function groupByRoom(chs: ChannelCfg[]): [string, ChannelCfg[]][] {
  const map = new Map<string, ChannelCfg[]>()
  for (const c of chs) {
    const r = c.room || ''
    if (!map.has(r)) map.set(r, [])
    map.get(r)!.push(c)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] || '￿').localeCompare(b[0] || '￿'))
}

function parseArr<T>(v: unknown): T[] {
  try {
    const a = JSON.parse(str(v) || '[]')
    return Array.isArray(a) ? (a as T[]) : []
  } catch {
    return []
  }
}

function round(v: unknown, d = 1): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return String(v)
  const f = Math.pow(10, d)
  return String(Math.round(n * f) / f)
}

/** CCU JSON-RPC returns values as strings ("20.000000", "0") — coerce safely. */
function asNum(v: unknown): number | null {
  if (v == null || v === '' || typeof v === 'boolean') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
}

function asBool(v: unknown): boolean | null {
  if (v === true || v === 'true' || v === '1' || v === 1) return true
  if (v === false || v === 'false' || v === '0' || v === 0) return false
  return null
}

/** Device types whose STATE is a read-only sensor (window/door/motion …), not a switch. */
function isSensorType(type: string): boolean {
  return /SWDM|SWD\b|SCI|-SC\b|Sec-SC|Sec-RHS|RHS|SAM|SPI|SMI|SMO|MOTION|SWO|WDS|TRV|WTH|STH|STHO|SWO/i.test(type)
}

/** Sensor datapoints worth displaying, with unit + decimals. */
const SENSOR_DP: { key: string; unit: string; d: number }[] = [
  { key: 'ACTUAL_TEMPERATURE', unit: '°C', d: 1 },
  { key: 'TEMPERATURE', unit: '°C', d: 1 },
  { key: 'HUMIDITY', unit: '%', d: 0 },
  { key: 'ACTUAL_HUMIDITY', unit: '%', d: 0 },
  { key: 'ILLUMINATION', unit: 'lx', d: 0 },
  { key: 'BRIGHTNESS', unit: 'lx', d: 0 },
  { key: 'POWER', unit: 'W', d: 1 },
  { key: 'CURRENT', unit: 'mA', d: 0 },
  { key: 'VOLTAGE', unit: 'V', d: 1 },
  { key: 'ENERGY_COUNTER', unit: 'Wh', d: 0 },
  { key: 'RSSI_DEVICE', unit: 'dBm', d: 0 },
]

type Control =
  | { kind: 'switch'; on: boolean }
  | { kind: 'dim'; level: number }
  | { kind: 'thermostat'; setKey: string; setpoint: number | null; actual: number | null; valve: number | null; window: boolean | null; mode: number | null; boost: boolean | null; hmip: boolean; hasModes: boolean }
  | { kind: 'contact'; open: boolean }
  | { kind: 'sensor' }

const SET_MIN = 4.5
const SET_MAX = 30.5
const SET_STEP = 0.5

function detectControl(values: Record<string, unknown> | undefined, type = ''): Control {
  if (!values) return { kind: 'sensor' }
  // Heizungsthermostat zuerst (Soll-Temperatur vorhanden).
  let setKey: string | null = null
  if ('SET_POINT_TEMPERATURE' in values && asNum(values.SET_POINT_TEMPERATURE) != null) setKey = 'SET_POINT_TEMPERATURE'
  else if ('SET_TEMPERATURE' in values && asNum(values.SET_TEMPERATURE) != null) setKey = 'SET_TEMPERATURE'
  if (setKey) {
    let valve: number | null = null
    if (asNum(values.LEVEL) != null) valve = Math.round((asNum(values.LEVEL) as number) * 100)
    else if (asNum(values.VALVE_STATE) != null) valve = Math.round(asNum(values.VALVE_STATE) as number)
    const win = asBool(values.WINDOW_STATE) ?? (asNum(values.WINDOW_STATE) != null ? (asNum(values.WINDOW_STATE) as number) > 0 : null)
    const hmip = setKey === 'SET_POINT_TEMPERATURE'
    // Aktueller Modus: HmIP über SET_POINT_MODE (les-/schreibbar), klassisch über CONTROL_MODE.
    const mode = asNum(values.SET_POINT_MODE) ?? asNum(values.CONTROL_MODE)
    const boost = asBool(values.BOOST_MODE)
    const hasModes = 'SET_POINT_MODE' in values || 'CONTROL_MODE' in values || 'BOOST_MODE' in values || 'AUTO_MODE' in values
    return {
      kind: 'thermostat',
      setKey,
      setpoint: asNum(values[setKey]),
      actual: asNum(values.ACTUAL_TEMPERATURE),
      valve,
      window: win,
      mode,
      boost,
      hmip,
      hasModes,
    }
  }
  // Fenster-/Türkontakt: STATE ist ein Sensor (offen/zu), kein Schalter.
  if ('STATE' in values && isSensorType(type)) {
    return { kind: 'contact', open: (asBool(values.STATE) ?? false) }
  }
  if (asNum(values.LEVEL) != null) return { kind: 'dim', level: Math.round((asNum(values.LEVEL) as number) * 100) }
  if ('STATE' in values && asBool(values.STATE) != null) return { kind: 'switch', on: asBool(values.STATE) as boolean }
  return { kind: 'sensor' }
}

function sensorText(values: Record<string, unknown> | undefined): string | null {
  if (!values) return null
  const parts: string[] = []
  for (const dp of SENSOR_DP) {
    if (dp.key in values && values[dp.key] != null) {
      parts.push(`${round(values[dp.key], dp.d)} ${dp.unit}`.trim())
      if (parts.length >= 2) break
    }
  }
  if (parts.length === 0) {
    if (typeof values.STATE === 'boolean') return null // handled by switch
    // fall back to first numeric datapoint
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === 'number' && !/^(WORKING|DIRECTION|RSSI_PEER)$/.test(k)) {
        parts.push(round(v, 1))
        break
      }
    }
  }
  return parts.join(' · ') || null
}

function sysvarText(sv: { value: unknown; unit: string }): string {
  const v = sv.value
  if (v === true || v === 'true') return 'An'
  if (v === false || v === 'false') return 'Aus'
  const n = Number(v)
  if (Number.isFinite(n)) return `${round(n, 1)}${sv.unit ? ' ' + sv.unit : ''}`.trim()
  return str(v) || '—'
}

async function callHm(body: Record<string, unknown>): Promise<StateResponse & ListResponse> {
  const res = await fetch('/api/plugins/homematic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as StateResponse & ListResponse
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['Login abgelehnt — Benutzer/Passwort prüfen.', 'Login rejected — check user/password.'],
    missing_credentials: ['Benutzer und Passwort eintragen.', 'Enter user and password.'],
    missing_url: ['CCU-Adresse fehlt.', 'CCU address missing.'],
    invalid_url: ['Ungültige Adresse.', 'Invalid address.'],
    blocked_url: ['Adresse blockiert (SSRF-Schutz).', 'Address blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['CCU nicht erreichbar.', 'CCU unreachable.'],
    set_failed: ['Schalten fehlgeschlagen.', 'Switching failed.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function Toggle({ on, fg }: { on: boolean; fg: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 38,
        height: 22,
        minWidth: 38,
        boxSizing: 'border-box',
        borderRadius: 999,
        flexShrink: 0,
        background: on ? 'color-mix(in srgb, ' + fg + ' 40%, transparent)' : 'rgba(255,255,255,.14)',
        border: '1px solid ' + (on ? 'transparent' : 'rgba(255,255,255,.18)'),
        position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
        }}
      />
    </span>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const title = config.title === undefined ? 'Homematic' : str(config.title)
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const configured = Boolean(baseUrl && username && password)

  const channels = parseArr<ChannelCfg>(config.channels)
  const sysvarSel = parseArr<RefCfg>(config.sysvars)
  const programSel = parseArr<RefCfg>(config.programs)

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({})
  const [sysvars, setSysvars] = useState<StateResponse['sysvars']>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const busyRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!configured || busyRef.current) {
      if (!configured) setLoading(false)
      return
    }
    const json = await callHm({
      url: baseUrl,
      username,
      password,
      action: 'state',
      channels: channels.map((c) => ({ interface: c.interface, address: c.address })),
    })
    if (json.error) setError(errorText(json.error, json.detail || '', de))
    else {
      setError(null)
      setValues(json.channels ?? {})
      setSysvars(json.sysvars ?? [])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, username, password, configured, de, str(config.channels)])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  const setDevice = async (ch: ChannelCfg, valueKey: string, valueType: string, value: unknown) => {
    busyRef.current = true
    // optimistic
    setValues((prev) => ({ ...prev, [ch.address]: { ...(prev[ch.address] || {}), [valueKey]: value } }))
    await callHm({ url: baseUrl, username, password, action: 'set', kind: 'device', interface: ch.interface, address: ch.address, valueKey, valueType, value })
    busyRef.current = false
    setTimeout(() => void refresh(), 400)
  }

  const runProgram = async (id: string) => {
    busyRef.current = true
    await callHm({ url: baseUrl, username, password, action: 'set', kind: 'program', id })
    busyRef.current = false
  }

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '8px 10px 10px',
    containerType: 'size',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🏠</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'CCU-Adresse, Benutzer und Passwort in den Einstellungen eintragen, dann Geräte/Variablen auswählen.'
            : 'Enter CCU address, user and password in settings, then pick devices/variables.'}
        </p>
      </div>
    )
  }

  const nothingSelected = channels.length === 0 && sysvarSel.length === 0 && programSel.length === 0
  const selSysvars = (sysvars ?? []).filter((s) => sysvarSel.some((x) => x.id === s.id))

  const sectionLabel = (t: string) => (
    <span style={{ fontSize: 'clamp(8px, 2cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{t}</span>
  )

  const card: CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 12,
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="hm-root" style={shell}>
      <style>{`
        .hm-root *{box-sizing:border-box}
        .hm-range{-webkit-appearance:none;appearance:none;height:5px;border-radius:999px;background:rgba(255,255,255,.22);outline:none}
        .hm-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
        .hm-range::-moz-range-thumb{width:14px;height:14px;border:none;border-radius:50%;background:#fff;cursor:pointer}
      `}</style>

      {title ? (
        <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', flexShrink: 0 }}>
          {title}
        </span>
      ) : null}

      {loading && nothingSelected === false && Object.keys(values).length === 0 && !error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, borderRadius: 6 }} />)}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nothingSelected ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de ? 'Noch nichts ausgewählt — in den Einstellungen Geräte, Variablen oder Programme hinzufügen.' : 'Nothing selected yet — add devices, variables or programs in settings.'}
          </p>
        ) : null}

        {channels.length > 0
          ? groupByRoom(channels).map(([roomName, roomChannels]) => (
          <div key={roomName || '_none'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sectionLabel(roomName || (de ? 'Geräte' : 'Devices'))}
            {roomChannels.map((ch) => {
              const v = values[ch.address]
              const ctrl = detectControl(v, ch.type || '')
              const nameEl = (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={ch.name}>{ch.name}</div>
              )

              // --- Heizungsthermostat: Ist-Temp, Fenster, Ventil + Soll per −/+ ---
              if (ctrl.kind === 'thermostat') {
                const sp = ctrl.setpoint
                const stepSet = (delta: number) => {
                  if (sp == null) return
                  const next = Math.min(SET_MAX, Math.max(SET_MIN, Math.round((sp + delta) * 2) / 2))
                  if (next === sp) return
                  void setDevice(ch, ctrl.setKey, 'double', next)
                }
                const info: string[] = []
                if (ctrl.actual != null) info.push(`${de ? 'Ist' : 'Now'} ${round(ctrl.actual, 1)} °C`)
                if (ctrl.window != null) info.push(ctrl.window ? (de ? '🪟 offen' : '🪟 open') : de ? 'Fenster zu' : 'Window closed')
                if (ctrl.valve != null) info.push(`${de ? 'Ventil' : 'Valve'} ${ctrl.valve}%`)
                const stepBtn: CSSProperties = { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 18, fontWeight: 700, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
                const setMode = (target: 'auto' | 'manu') => {
                  if (ctrl.hmip) void setDevice(ch, 'CONTROL_MODE', 'integer', target === 'auto' ? 0 : 1)
                  else void setDevice(ch, target === 'auto' ? 'AUTO_MODE' : 'MANU_MODE', 'boolean', true)
                }
                const toggleBoost = () => void setDevice(ch, 'BOOST_MODE', 'boolean', !(ctrl.boost === true))
                const isBoost = ctrl.boost === true
                const modeBtn = (active: boolean, accent: boolean): CSSProperties => ({
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 4px',
                  borderRadius: 7,
                  border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
                  background: active ? (accent ? '#f59e0b' : 'var(--accent)') : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                })
                return (
                  <div key={ch.address} style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        {nameEl}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{info.join(' · ') || '…'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" style={{ ...stepBtn, opacity: sp == null || sp <= SET_MIN ? 0.4 : 1 }} disabled={sp == null || sp <= SET_MIN} onClick={() => stepSet(-SET_STEP)} title={de ? 'Wärmer runter' : 'Down'}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 700, minWidth: 52, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>{sp != null ? `${round(sp, 1)}°` : '—'}</span>
                        <button type="button" style={{ ...stepBtn, opacity: sp == null || sp >= SET_MAX ? 0.4 : 1 }} disabled={sp == null || sp >= SET_MAX} onClick={() => stepSet(SET_STEP)} title={de ? 'Wärmer rauf' : 'Up'}>+</button>
                      </div>
                    </div>
                    {ctrl.hasModes ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" style={modeBtn(!isBoost && ctrl.mode === 0, false)} onClick={() => setMode('auto')}>{de ? 'Auto' : 'Auto'}</button>
                        <button type="button" style={modeBtn(!isBoost && ctrl.mode === 1, false)} onClick={() => setMode('manu')}>{de ? 'Manuell' : 'Manual'}</button>
                        <button type="button" style={modeBtn(isBoost, true)} onClick={toggleBoost}>🔥 Boost</button>
                      </div>
                    ) : null}
                  </div>
                )
              }

              const sensor = sensorText(v)
              return (
                <div key={ch.address} style={card}>
                  <div style={{ minWidth: 0 }}>
                    {nameEl}
                    {sensor ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sensor}</div> : null}
                    {ctrl.kind === 'dim' ? (
                      <input
                        className="hm-range"
                        type="range"
                        min={0}
                        max={100}
                        value={ctrl.level}
                        onChange={(e) => setValues((prev) => ({ ...prev, [ch.address]: { ...(prev[ch.address] || {}), LEVEL: Number(e.target.value) / 100 } }))}
                        onMouseUp={(e) => void setDevice(ch, 'LEVEL', 'double', Number((e.target as HTMLInputElement).value) / 100)}
                        onTouchEnd={(e) => void setDevice(ch, 'LEVEL', 'double', Number((e.target as HTMLInputElement).value) / 100)}
                        style={{ width: '100%', marginTop: 6, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        aria-label={de ? 'Helligkeit' : 'Level'}
                      />
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {ctrl.kind === 'switch' ? (
                      <button type="button" onClick={() => void setDevice(ch, 'STATE', 'boolean', !ctrl.on)} style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0, cursor: 'pointer' }} title={ctrl.on ? (de ? 'Ausschalten' : 'Turn off') : de ? 'Einschalten' : 'Turn on'}>
                        <Toggle on={ctrl.on} fg="var(--accent)" />
                      </button>
                    ) : ctrl.kind === 'contact' ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: ctrl.open ? '#f59e0b' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {ctrl.open ? (de ? '🪟 Offen' : '🪟 Open') : de ? 'Zu' : 'Closed'}
                      </span>
                    ) : ctrl.kind === 'dim' ? (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{ctrl.level}%</span>
                    ) : !sensor && v == null ? (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>…</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
            ))
          : null}

        {selSysvars.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sectionLabel(de ? 'Variablen' : 'Variables')}
            {selSysvars.map((s) => (
              <div key={s.id} style={card}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={s.name}>{s.name}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{sysvarText(s)}</span>
              </div>
            ))}
          </div>
        ) : null}

        {programSel.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sectionLabel(de ? 'Programme' : 'Programs')}
            {programSel.map((p) => (
              <div key={p.id} style={card}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={p.name}>{p.name}</div>
                <button
                  type="button"
                  onClick={() => void runProgram(p.id)}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {de ? '▶ Start' : '▶ Run'}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>{error}</p> : null}
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
  const baseUrl = str(config.baseUrl)
  const username = str(config.username)
  const password = str(config.password)
  const configured = Boolean(baseUrl && username && password)

  const channels = parseArr<ChannelCfg>(config.channels)
  const sysvarSel = parseArr<RefCfg>(config.sysvars)
  const programSel = parseArr<RefCfg>(config.programs)

  const [data, setData] = useState<ListResponse | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [allChannels, setAllChannels] = useState(false)

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setLoadErr(null)
    const json = await callHm({ url: baseUrl, username, password, action: 'list' })
    setLoading(false)
    if (json.error) setLoadErr(errorText(json.error, '', de))
    else setData(json)
  }, [baseUrl, username, password, configured, de])

  useEffect(() => {
    if (configured) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  const inChannels = (addr: string) => channels.some((c) => c.address === addr)
  const toggleChannel = (c: ChannelCfg) => {
    const next = inChannels(c.address) ? channels.filter((x) => x.address !== c.address) : [...channels, c]
    onChange('channels', JSON.stringify(next))
  }
  const toggleRef = (key: 'sysvars' | 'programs', sel: RefCfg[], ref: RefCfg) => {
    const has = sel.some((x) => x.id === ref.id)
    const next = has ? sel.filter((x) => x.id !== ref.id) : [...sel, ref]
    onChange(key, JSON.stringify(next))
  }

  const f = filter.trim().toLowerCase()
  const box: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, maxHeight: 190, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px' }
  const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}</label>
        <input style={inp} value={config.title === undefined ? 'Homematic' : str(config.title)} placeholder="Homematic" onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'CCU-Adresse (RaspberryMatic)' : 'CCU address (RaspberryMatic)'}</label>
        <input style={inp} value={baseUrl} placeholder="192.168.1.40" onChange={(e) => onChange('baseUrl', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Benutzer' : 'User'}</label>
          <input style={inp} value={username} placeholder="Admin" onChange={(e) => onChange('username', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Passwort' : 'Password'}</label>
          <input style={inp} type="password" value={password} onChange={(e) => onChange('password', e.target.value)} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {de
          ? 'Tipp: Lege in RaspberryMatic einen eigenen, eingeschränkten Benutzer nur fürs Dashboard an. Das Passwort wird verschlüsselt gespeichert.'
          : 'Tip: create a dedicated, restricted CCU user just for the dashboard. The password is stored encrypted.'}
      </p>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{de ? 'Geräte / Variablen / Programme auswählen' : 'Pick devices / variables / programs'}</label>
          <button type="button" onClick={() => void load()} disabled={!configured || loading} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: configured ? 'pointer' : 'not-allowed' }}>
            {loading ? (de ? 'Lade …' : 'Loading …') : de ? 'Neu laden' : 'Reload'}
          </button>
        </div>
        {!configured ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>{de ? 'Erst Adresse, Benutzer und Passwort eintragen.' : 'Enter address, user and password first.'}</p>
        ) : loadErr ? (
          <p style={{ fontSize: 11, color: '#ef4444', margin: '6px 0 0' }}>{loadErr}</p>
        ) : null}
      </div>

      {data ? (
        <>
          <input style={inp} value={filter} placeholder={de ? 'Filtern …' : 'Filter …'} onChange={(e) => setFilter(e.target.value)} />

          {(data.devices ?? []).length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{de ? 'Geräte' : 'Devices'}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allChannels} onChange={(e) => setAllChannels(e.target.checked)} />
                  {de ? 'Alle Kanäle' : 'All channels'}
                </label>
              </div>
              <div style={box}>
                {(data.devices ?? [])
                  .filter((d) => !f || d.name.toLowerCase().includes(f))
                  .flatMap((d) => {
                    const usable = d.channels.filter((c) => c.index > 0)
                    // Standard: nur den Hauptkanal (kleinster Index) pro Gerät zeigen.
                    const shown = allChannels ? usable : usable.slice(0, 1)
                    return shown.map((c) => {
                      const label = allChannels && usable.length > 1 ? `${d.name} · ${c.name}` : d.name
                      const cfg: ChannelCfg = { interface: d.interface, address: c.address, name: label, type: d.type, room: c.room || d.room }
                      return (
                        <label key={c.address} style={row}>
                          <input type="checkbox" checked={inChannels(c.address)} onChange={() => toggleChannel(cfg)} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{allChannels ? c.address : d.type}</span>
                        </label>
                      )
                    })
                  })}
              </div>
            </div>
          ) : null}

          {(data.sysvars ?? []).length > 0 ? (
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{de ? 'Systemvariablen' : 'System variables'}</span>
              <div style={box}>
                {(data.sysvars ?? [])
                  .filter((s) => !f || s.name.toLowerCase().includes(f))
                  .map((s) => (
                    <label key={s.id} style={row}>
                      <input type="checkbox" checked={sysvarSel.some((x) => x.id === s.id)} onChange={() => toggleRef('sysvars', sysvarSel, { id: s.id, name: s.name })} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          ) : null}

          {(data.programs ?? []).length > 0 ? (
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{de ? 'Programme' : 'Programs'}</span>
              <div style={box}>
                {(data.programs ?? [])
                  .filter((p) => !f || p.name.toLowerCase().includes(f))
                  .map((p) => (
                    <label key={p.id} style={row}>
                      <input type="checkbox" checked={programSel.some((x) => x.id === p.id)} onChange={() => toggleRef('programs', programSel, { id: p.id, name: p.name })} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
        <input style={inp} type="number" min={10} max={300} value={num(config.refreshSeconds) || 30} onChange={(e) => onChange('refreshSeconds', Math.max(10, num(e.target.value) || 30))} />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'homematic',
  name: 'Homematic',
  description:
    'Homematic / RaspberryMatic per JSON-RPC (Login): Heizung (Soll-Temp), Geräte schalten/dimmen, Sensoren & Systemvariablen anzeigen, Programme starten. (Beta)',
  version: '0.9.3',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🏠',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/raspberrymatic.png',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Homematic' },
    { key: 'baseUrl', label: 'CCU-Adresse', type: 'text', defaultValue: '' },
    { key: 'username', label: 'Benutzer', type: 'text', defaultValue: '' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'channels', label: 'Geräte (JSON)', type: 'text', defaultValue: '' },
    { key: 'sysvars', label: 'Variablen (JSON)', type: 'text', defaultValue: '' },
    { key: 'programs', label: 'Programme (JSON)', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
