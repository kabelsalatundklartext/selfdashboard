'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type HueLamp = {
  id: string
  name: string
  on: boolean
  brightness: number | null
  reachable: boolean
  kind?: string
  hasColor?: boolean
  color?: string | null
  roomClass?: string
}

const ROOM_PATHS: Record<string, string> = {
  living: 'M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3m-18 0a2 2 0 0 0-2 2v3h22v-3a2 2 0 0 0-2-2m-18 0h18M5 17v2m14-2v2',
  bedroom: 'M3 7v11m0-4h18m0 4V9a2 2 0 0 0-2-2h-7v7M3 11h4a2 2 0 0 1 2 2',
  bathroom: 'M4 12V6a2 2 0 0 1 2-2c1.1 0 1.6.6 2 1.5M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Zm3 9-1 1m11-1 1 1M8 7h.01',
  kitchen: 'M19 3v18M15 3v6a2 2 0 0 0 2 2M9 3v18M9 3c-2 0-3 1.5-3 4s1 4 3 4',
  office: 'M3 4h18v12H3zM8 20h8m-4-4v4',
  hallway: 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 12h.01M5 21h14',
  garden: 'M12 3c2 4 4 6 4 9a4 4 0 0 1-8 0c0-3 2-5 4-9ZM12 21v-5',
  bulb: 'M9 18h6m-5 3h4M12 3a7 7 0 0 0-4 12.7c.8.6 1.3 1.3 1.5 2.3h5c.2-1 .7-1.7 1.5-2.3A7 7 0 0 0 12 3Z',
}

function roomPath(cls?: string): string {
  const c = (cls || '').toLowerCase()
  if (/living|lounge|tv/.test(c)) return ROOM_PATHS.living
  if (/bed|kid|nursery/.test(c)) return ROOM_PATHS.bedroom
  if (/bath|toilet|shower/.test(c)) return ROOM_PATHS.bathroom
  if (/kitchen|dining/.test(c)) return ROOM_PATHS.kitchen
  if (/office|computer|studio/.test(c)) return ROOM_PATHS.office
  if (/hall|stair|entr|floor|garage|closet/.test(c)) return ROOM_PATHS.hallway
  if (/garden|terrace|balcon|outdoor/.test(c)) return ROOM_PATHS.garden
  return ROOM_PATHS.bulb
}

type StateResponse = {
  groups?: HueLamp[]
  lights?: HueLamp[]
  error?: string
  detail?: string
}

type Style = 'cards' | 'compact' | 'tiles'

const HUE_VERSION = '0.9.14'

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

/** Parse a comma-separated list of hidden item IDs from config into a Set. */
function parseIdSet(v: unknown): Set<string> {
  return new Set(
    str(v)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

/** Relative luminance of a #rrggbb colour (0 dark – 1 light). */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return 0
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text colour with good contrast on a coloured tile. */
function textOn(hex: string | null | undefined): string {
  if (!hex) return 'var(--text)'
  return luminance(hex) > 0.62 ? '#15171e' : '#ffffff'
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: ['API-Key ungültig — Bridge neu koppeln.', 'Invalid API key — re-pair the bridge.'],
    link_button: ['Bridge-Knopf drücken, dann koppeln.', 'Press the bridge button, then pair.'],
    missing_url: ['Bridge-IP fehlt.', 'Bridge IP missing.'],
    missing_api_key: ['API-Key fehlt — Bridge koppeln.', 'API key missing — pair the bridge.'],
    invalid_url: ['Ungültige Bridge-Adresse.', 'Invalid bridge address.'],
    blocked_url: ['Adresse blockiert (SSRF-Schutz).', 'Address blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Bridge nicht erreichbar.', 'Bridge unreachable.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

async function callHue(body: Record<string, unknown>): Promise<StateResponse> {
  const res = await fetch('/api/plugins/hue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as StateResponse & { error?: string }
  if (!res.ok && !json.error) json.error = `HTTP ${res.status}`
  return json
}

function RoomIcon({ d, color, size = 20 }: { d: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d={d} stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
        background: on ? 'color-mix(in srgb, ' + fg + ' 38%, transparent)' : 'rgba(255,255,255,.14)',
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
          width: 17,
          height: 17,
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
  const apiKey = str(config.apiKey)
  const refreshMs = Math.max(5, num(config.refreshSeconds) || 20) * 1000
  const title = config.title === undefined ? 'Hue' : str(config.title)
  const style: Style =
    config.style === 'compact' ? 'compact' : config.style === 'tiles' ? 'tiles' : 'cards'
  const colorBg = config.colorBackground !== false
  const showBri = config.showBrightness !== false
  const configured = Boolean(baseUrl && apiKey)
  const hiddenGroups = parseIdSet(config.hiddenGroups)
  const hiddenLights = parseIdSet(config.hiddenLights)

  const [view, setView] = useState<'groups' | 'lights'>(
    config.defaultView === 'lights' ? 'lights' : 'groups',
  )
  const [groups, setGroups] = useState<HueLamp[]>([])
  const [lights, setLights] = useState<HueLamp[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const busyRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!configured || busyRef.current) {
      if (!configured) setLoading(false)
      return
    }
    const json = await callHue({ url: baseUrl, apiKey, action: 'state' })
    if (json.error) setError(errorText(json.error, json.detail || '', de))
    else {
      setError(null)
      setGroups(Array.isArray(json.groups) ? json.groups : [])
      setLights(Array.isArray(json.lights) ? json.lights : [])
    }
    setLoading(false)
  }, [apiKey, baseUrl, configured, de])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  const hidden = view === 'groups' ? hiddenGroups : hiddenLights
  const items = (view === 'groups' ? groups : lights).filter((it) => !hidden.has(it.id))
  const target = view === 'groups' ? 'group' : 'light'

  const apply = (id: string, patch: Partial<HueLamp>) => {
    const setter = view === 'groups' ? setGroups : setLights
    setter((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const toggle = async (item: HueLamp) => {
    busyRef.current = true
    apply(item.id, { on: !item.on })
    const json = await callHue({ url: baseUrl, apiKey, action: 'set', target, id: item.id, on: !item.on })
    busyRef.current = false
    if (json.error) {
      apply(item.id, { on: item.on })
      setError(errorText(json.error, json.detail || '', de))
    } else void refresh()
  }

  const setBrightness = async (item: HueLamp, pct: number) => {
    busyRef.current = true
    apply(item.id, { brightness: pct, on: pct > 0 })
    await callHue({ url: baseUrl, apiKey, action: 'set', target, id: item.id, bri: pct, on: pct > 0 })
    busyRef.current = false
  }

  const setColor = async (item: HueLamp, hex: string) => {
    busyRef.current = true
    apply(item.id, { color: hex, on: true })
    await callHue({ url: baseUrl, apiKey, action: 'set', target, id: item.id, hex, on: true })
    busyRef.current = false
    setTimeout(() => void refresh(), 400)
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
        <span style={{ fontSize: 24 }}>💡</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de ? 'Bridge-IP eintragen und in den Einstellungen koppeln.' : 'Enter the bridge IP and pair in settings.'}
        </p>
      </div>
    )
  }

  const segStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    padding: '4px 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  const cardBg = (item: HueLamp): string => {
    if (item.on && colorBg && item.color) {
      return `linear-gradient(100deg, ${item.color}, color-mix(in srgb, ${item.color} 62%, #000))`
    }
    return 'var(--surface-2)'
  }

  const renderRow = (item: HueLamp) => {
    const lit = item.on && colorBg && item.color
    const fg = lit ? textOn(item.color) : 'var(--text)'
    const sub = lit ? `color-mix(in srgb, ${textOn(item.color)} 72%, transparent)` : 'var(--text-muted)'
    const iconColor = item.on ? (lit ? fg : item.color || 'var(--accent)') : 'var(--text-muted)'
    const briShown = item.on && showBri
    return (
      <div
        key={`${target}-${item.id}`}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: briShown ? 9 : 0,
          padding: briShown ? '11px 14px 12px' : '12px 14px',
          borderRadius: 16,
          background: cardBg(item),
          border: lit ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--border)',
          opacity: item.reachable ? 1 : 0.5,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 12, width: '100%' }}>
          {item.hasColor && item.on ? (
            <label style={{ display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }} title={de ? 'Farbe wählen' : 'Pick colour'}>
              <input
                type="color"
                value={item.color ?? '#ffffff'}
                onChange={(e) => void setColor(item, e.target.value)}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
              />
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: item.color ?? '#fff',
                  border: '2px solid rgba(255,255,255,.75)',
                  boxShadow: '0 0 6px ' + (item.color ?? '#fff'),
                }}
              />
            </label>
          ) : (
            <RoomIcon d={view === 'groups' ? roomPath(item.roomClass) : ROOM_PATHS.bulb} color={iconColor} size={22} />
          )}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 14,
              fontWeight: 600,
              color: fg,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={item.name}
          >
            {item.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.on && item.brightness != null && !showBri ? (
              <span style={{ fontSize: 12, color: sub, fontVariantNumeric: 'tabular-nums' }}>{item.brightness}%</span>
            ) : null}
            <button
              type="button"
              onClick={() => void toggle(item)}
              disabled={!item.reachable}
              title={item.on ? (de ? 'Ausschalten' : 'Turn off') : de ? 'Einschalten' : 'Turn on'}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                lineHeight: 0,
                cursor: item.reachable ? 'pointer' : 'not-allowed',
              }}
            >
              <Toggle on={item.on} fg={lit ? fg : 'var(--accent)'} />
            </button>
          </div>
        </div>
        {briShown ? (
          <input
            className="hue-range hue-range-bottom"
            type="range"
            min={1}
            max={100}
            value={item.brightness ?? 100}
            onChange={(e) => apply(item.id, { brightness: Number(e.target.value) })}
            onMouseUp={(e) => void setBrightness(item, Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => void setBrightness(item, Number((e.target as HTMLInputElement).value))}
            style={{
              display: 'block',
              width: '100%',
              accentColor: lit ? fg : 'var(--accent)',
              cursor: 'pointer',
            }}
            aria-label={de ? 'Helligkeit' : 'Brightness'}
          />
        ) : null}
      </div>
    )
  }

  const renderCompact = (item: HueLamp) => {
    const dot = item.on ? item.color || 'var(--accent)' : 'transparent'
    return (
      <button
        key={`${target}-${item.id}`}
        type="button"
        onClick={() => void toggle(item)}
        disabled={!item.reachable}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          cursor: item.reachable ? 'pointer' : 'not-allowed',
          opacity: item.reachable ? 1 : 0.5,
          textAlign: 'left',
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0, background: dot, border: item.on ? 'none' : '1.5px solid var(--text-muted)' }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {item.on ? `${item.brightness ?? 100}%` : de ? 'Aus' : 'Off'}
        </span>
      </button>
    )
  }

  const renderTile = (item: HueLamp) => {
    const lit = item.on && colorBg && item.color
    const fg = lit ? textOn(item.color) : 'var(--text)'
    return (
      <button
        key={`${target}-${item.id}`}
        type="button"
        onClick={() => void toggle(item)}
        disabled={!item.reachable}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6,
          minHeight: 64,
          boxSizing: 'border-box',
          padding: '10px 12px',
          borderRadius: 12,
          background: cardBg(item),
          border: lit ? '1px solid rgba(255,255,255,.08)' : '1px solid var(--border)',
          cursor: item.reachable ? 'pointer' : 'not-allowed',
          opacity: item.reachable ? 1 : 0.5,
          textAlign: 'left',
        }}
      >
        <RoomIcon d={view === 'groups' ? roomPath(item.roomClass) : ROOM_PATHS.bulb} color={item.on ? (lit ? fg : item.color || 'var(--accent)') : 'var(--text-muted)'} size={20} />
        <span style={{ fontSize: 12, fontWeight: 600, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
          {item.name}
        </span>
      </button>
    )
  }

  return (
    <div className="hue-root" style={shell}>
      <style>{`
        .hue-root *{box-sizing:border-box}
        .hue-range{-webkit-appearance:none;appearance:none;height:5px;border-radius:999px;
          background:rgba(255,255,255,.22);outline:none}
        .hue-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;
          border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
        .hue-range::-moz-range-thumb{width:14px;height:14px;border:none;border-radius:50%;background:#fff;cursor:pointer}
        .hue-range-bottom{height:4px;background:rgba(255,255,255,.25)}
        .hue-range-bottom::-webkit-slider-thumb{width:11px;height:11px}
        .hue-range-bottom::-moz-range-thumb{width:11px;height:11px}
      `}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {title ? (
          <span style={{ fontSize: 'clamp(9px, 2.4cqmin, 10px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', flexShrink: 0 }}>
            {title}
          </span>
        ) : null}
        {config.showVersion ? (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.55, flexShrink: 0 }}>v{HUE_VERSION}</span>
        ) : null}
        <div role="tablist" style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
          <button type="button" onClick={() => setView('groups')} style={segStyle(view === 'groups')}>{de ? 'Räume' : 'Rooms'}</button>
          <button type="button" onClick={() => setView('lights')} style={segStyle(view === 'lights')}>{de ? 'Lampen' : 'Lights'}</button>
        </div>
      </header>

      {loading && items.length === 0 && !error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 16, width: `${w}%`, borderRadius: 6 }} />)}
        </div>
      ) : null}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 14,
          ...(style === 'tiles'
            ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 7, alignContent: 'start' }
            : { display: 'flex', flexDirection: 'column', gap: style === 'compact' ? 1 : 6 }),
        }}
      >
        {!loading && items.length === 0 && !error ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {view === 'groups' ? (de ? 'Keine Räume gefunden.' : 'No rooms found.') : de ? 'Keine Lampen gefunden.' : 'No lights found.'}
          </p>
        ) : null}
        {items.map((item) => (style === 'compact' ? renderCompact(item) : style === 'tiles' ? renderTile(item) : renderRow(item)))}
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
  const [pairing, setPairing] = useState(false)
  const [pairMsg, setPairMsg] = useState<string | null>(null)
  const baseUrl = str(config.baseUrl)
  const apiKey = str(config.apiKey)

  const pair = async () => {
    if (!baseUrl) {
      setPairMsg(de ? 'Erst Bridge-IP eintragen.' : 'Enter the bridge IP first.')
      return
    }
    setPairing(true)
    setPairMsg(de ? 'Bridge-Knopf jetzt drücken …' : 'Press the bridge button now …')
    const json = (await callHue({ url: baseUrl, action: 'pair' })) as { apiKey?: string; error?: string }
    setPairing(false)
    if (json.apiKey) {
      onChange('apiKey', json.apiKey)
      setPairMsg(de ? '✅ Gekoppelt! API-Key gespeichert.' : '✅ Paired! API key saved.')
    } else if (json.error === 'link_button') {
      setPairMsg(de ? 'Knopf an der Bridge drücken und erneut koppeln.' : 'Press the bridge button and pair again.')
    } else {
      setPairMsg((de ? 'Koppeln fehlgeschlagen: ' : 'Pairing failed: ') + (json.error || ''))
    }
  }

  const [hueItems, setHueItems] = useState<{ groups: HueLamp[]; lights: HueLamp[] } | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)

  useEffect(() => {
    if (!baseUrl || !apiKey) {
      setHueItems(null)
      return
    }
    let active = true
    setItemsLoading(true)
    void callHue({ url: baseUrl, apiKey, action: 'state' }).then((json) => {
      if (!active) return
      setHueItems({
        groups: Array.isArray(json.groups) ? json.groups : [],
        lights: Array.isArray(json.lights) ? json.lights : [],
      })
      setItemsLoading(false)
    })
    return () => {
      active = false
    }
  }, [baseUrl, apiKey])

  const setHidden = (key: 'hiddenGroups' | 'hiddenLights', id: string, visible: boolean) => {
    const cur = parseIdSet(config[key])
    if (visible) cur.delete(id)
    else cur.add(id)
    onChange(key, Array.from(cur).join(','))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}</label>
        <input style={inp} value={config.title === undefined ? 'Hue' : str(config.title)} placeholder="Hue" onChange={(e) => onChange('title', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Bridge-IP / URL' : 'Bridge IP / URL'}</label>
        <input style={inp} value={baseUrl} placeholder="192.168.1.50" onChange={(e) => onChange('baseUrl', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>API-Key</label>
        <input style={inp} type="password" value={apiKey} placeholder={de ? 'per „Bridge koppeln" erzeugen' : 'create via “Pair bridge”'} onChange={(e) => onChange('apiKey', e.target.value)} />
        <button
          type="button"
          onClick={() => void pair()}
          disabled={pairing}
          style={{ marginTop: 8, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: pairing ? 'wait' : 'pointer' }}
        >
          {pairing ? (de ? 'Koppeln …' : 'Pairing …') : de ? '🔗 Bridge koppeln' : '🔗 Pair bridge'}
        </button>
        {pairMsg ? <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{pairMsg}</p> : null}
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Bridge-IP eintragen, den runden Knopf an der Hue Bridge drücken, dann innerhalb 30 s auf „Bridge koppeln" klicken. Der API-Key wird verschlüsselt gespeichert.'
            : 'Enter the bridge IP, press the round button on the Hue Bridge, then click “Pair bridge” within 30 s. The API key is stored encrypted.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Darstellung' : 'Style'}</label>
        <select style={inp} value={str(config.style) || 'cards'} onChange={(e) => onChange('style', e.target.value)}>
          <option value="cards">{de ? 'Karten (Hue-Stil, Farbe)' : 'Cards (Hue style, colour)'}</option>
          <option value="compact">{de ? 'Kompakt (Liste)' : 'Compact (list)'}</option>
          <option value="tiles">{de ? 'Kacheln' : 'Tiles'}</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <input type="checkbox" checked={config.colorBackground !== false} onChange={(e) => onChange('colorBackground', e.target.checked)} />
          <span>{de ? 'Karten in echter Lichtfarbe (an)' : 'Cards in real light colour (on)'}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <input type="checkbox" checked={config.showBrightness !== false} onChange={(e) => onChange('showBrightness', e.target.checked)} />
          <span>{de ? 'Helligkeits-Slider zeigen' : 'Show brightness slider'}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <input type="checkbox" checked={config.showVersion === true} onChange={(e) => onChange('showVersion', e.target.checked)} />
          <span>{de ? 'Versionsnummer im Titel zeigen' : 'Show version number in title'}</span>
        </label>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Standard-Ansicht' : 'Default view'}</label>
        <select style={inp} value={config.defaultView === 'lights' ? 'lights' : 'groups'} onChange={(e) => onChange('defaultView', e.target.value)}>
          <option value="groups">{de ? 'Räume' : 'Rooms'}</option>
          <option value="lights">{de ? 'Lampen' : 'Lights'}</option>
        </select>
      </div>
      {hueItems ? (
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            {de ? 'Räume / Lampen ein- oder ausblenden' : 'Show or hide rooms / lights'}
          </label>
          {(['groups', 'lights'] as const).map((kind) => {
            const list = kind === 'groups' ? hueItems.groups : hueItems.lights
            const cfgKey = kind === 'groups' ? 'hiddenGroups' : 'hiddenLights'
            const hiddenSet = parseIdSet(config[cfgKey])
            if (list.length === 0) return null
            return (
              <div key={kind} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {kind === 'groups' ? (de ? 'Räume' : 'Rooms') : de ? 'Lampen' : 'Lights'}
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    marginTop: 4,
                    maxHeight: 150,
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 8px',
                  }}
                >
                  {list.map((it) => (
                    <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!hiddenSet.has(it.id)}
                        onChange={(e) => setHidden(cfgKey, it.id, e.target.checked)}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : baseUrl && apiKey && itemsLoading ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{de ? 'Lade Räume/Lampen …' : 'Loading rooms/lights …'}</p>
      ) : null}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}</label>
        <input style={inp} type="number" min={5} max={300} value={num(config.refreshSeconds) || 20} onChange={(e) => onChange('refreshSeconds', Math.max(5, num(e.target.value) || 20))} />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'hue',
  name: 'Philips Hue',
  description:
    'Philips-Hue-Lampen und Räume per lokaler Bridge-API steuern: an/aus, Helligkeit, Farbe. Karten/Kompakt/Kacheln, Hue-App-Stil.',
  version: '0.9.15',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '💡',
  iconUrl: '/api/plugins/custom-assets/hue/icon.svg',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Hue' },
    { key: 'baseUrl', label: 'Bridge-IP / URL', type: 'text', defaultValue: '' },
    { key: 'apiKey', label: 'API-Key', type: 'password', defaultValue: '' },
    { key: 'style', label: 'Darstellung', type: 'text', defaultValue: 'cards' },
    { key: 'colorBackground', label: 'Lichtfarbe als Hintergrund', type: 'boolean', defaultValue: true },
    { key: 'showBrightness', label: 'Helligkeits-Slider', type: 'boolean', defaultValue: true },
    { key: 'showVersion', label: 'Versionsnummer zeigen', type: 'boolean', defaultValue: false },
    { key: 'defaultView', label: 'Standard-Ansicht', type: 'text', defaultValue: 'groups' },
    { key: 'hiddenGroups', label: 'Ausgeblendete Räume', type: 'text', defaultValue: '' },
    { key: 'hiddenLights', label: 'Ausgeblendete Lampen', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 20 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
