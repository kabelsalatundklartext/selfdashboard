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
}

type StateResponse = {
  groups?: HueLamp[]
  lights?: HueLamp[]
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

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 34,
        height: 19,
        borderRadius: 999,
        flexShrink: 0,
        background: on ? 'var(--accent)' : 'color-mix(in srgb, var(--text-muted) 35%, transparent)',
        position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 17 : 2,
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,.35)',
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
  const configured = Boolean(baseUrl && apiKey)

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
    if (json.error) {
      setError(errorText(json.error, json.detail || '', de))
    } else {
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

  const items = view === 'groups' ? groups : lights
  const target = view === 'groups' ? 'group' : 'light'

  const apply = (id: string, patch: Partial<HueLamp>) => {
    const setter = view === 'groups' ? setGroups : setLights
    setter((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const toggle = async (item: HueLamp) => {
    busyRef.current = true
    apply(item.id, { on: !item.on }) // optimistic
    const json = await callHue({ url: baseUrl, apiKey, action: 'set', target, id: item.id, on: !item.on })
    busyRef.current = false
    if (json.error) {
      apply(item.id, { on: item.on }) // revert
      setError(errorText(json.error, json.detail || '', de))
    } else {
      void refresh()
    }
  }

  const setBrightness = async (item: HueLamp, pct: number) => {
    busyRef.current = true
    apply(item.id, { brightness: pct, on: pct > 0 })
    await callHue({ url: baseUrl, apiKey, action: 'set', target, id: item.id, bri: pct, on: pct > 0 })
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
        <span style={{ fontSize: 24 }}>💡</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Bridge-IP eintragen und in den Einstellungen koppeln.'
            : 'Enter the bridge IP and pair in settings.'}
        </p>
      </div>
    )
  }

  const segStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    padding: '4px 0',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  return (
    <div style={shell}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {title ? (
          <span
            style={{
              fontSize: 'clamp(9px, 2.4cqmin, 10px)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            {title}
          </span>
        ) : null}
        <div
          role="tablist"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 2,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 2,
            minWidth: 120,
          }}
        >
          <button type="button" onClick={() => setView('groups')} style={segStyle(view === 'groups')}>
            {de ? 'Räume' : 'Rooms'}
          </button>
          <button type="button" onClick={() => setView('lights')} style={segStyle(view === 'lights')}>
            {de ? 'Lampen' : 'Lights'}
          </button>
        </div>
      </header>

      {loading && items.length === 0 && !error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
          ))}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {!loading && items.length === 0 && !error ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {view === 'groups'
              ? de ? 'Keine Räume gefunden.' : 'No rooms found.'
              : de ? 'Keine Lampen gefunden.' : 'No lights found.'}
          </p>
        ) : null}

        {items.map((item) => (
          <div
            key={`${target}-${item.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              padding: '6px 8px',
              borderRadius: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              opacity: item.reachable ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.name}
              >
                {item.name}
              </span>
              {item.on && item.brightness != null ? (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {item.brightness}%
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void toggle(item)}
                disabled={!item.reachable}
                title={item.on ? (de ? 'Ausschalten' : 'Turn off') : de ? 'Einschalten' : 'Turn on'}
                style={{ background: 'none', border: 'none', padding: 0, cursor: item.reachable ? 'pointer' : 'not-allowed' }}
              >
                <Toggle on={item.on} />
              </button>
            </div>
            {item.on ? (
              <input
                type="range"
                min={1}
                max={100}
                value={item.brightness ?? 100}
                onChange={(e) => apply(item.id, { brightness: Number(e.target.value) })}
                onMouseUp={(e) => void setBrightness(item, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => void setBrightness(item, Number((e.target as HTMLInputElement).value))}
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                aria-label={de ? 'Helligkeit' : 'Brightness'}
              />
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.4, wordBreak: 'break-word' }}>{error}</p>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}
        </label>
        <input
          style={inp}
          value={config.title === undefined ? 'Hue' : str(config.title)}
          placeholder="Hue"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Bridge-IP / URL' : 'Bridge IP / URL'}</label>
        <input
          style={inp}
          value={baseUrl}
          placeholder="192.168.1.50"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>API-Key</label>
        <input
          style={inp}
          type="password"
          value={apiKey}
          placeholder={de ? 'per „Bridge koppeln" erzeugen' : 'create via “Pair bridge”'}
          onChange={(e) => onChange('apiKey', e.target.value)}
        />
        <button
          type="button"
          onClick={() => void pair()}
          disabled={pairing}
          style={{
            marginTop: 8,
            padding: '7px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: pairing ? 'wait' : 'pointer',
          }}
        >
          {pairing ? (de ? 'Koppeln …' : 'Pairing …') : de ? '🔗 Bridge koppeln' : '🔗 Pair bridge'}
        </button>
        {pairMsg ? (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{pairMsg}</p>
        ) : null}
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Bridge-IP eintragen, den runden Knopf an der Hue Bridge drücken, dann innerhalb 30 s auf „Bridge koppeln" klicken. Der API-Key wird verschlüsselt gespeichert.'
            : 'Enter the bridge IP, press the round button on the Hue Bridge, then click “Pair bridge” within 30 s. The API key is stored encrypted.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Standard-Ansicht' : 'Default view'}</label>
        <select
          style={inp}
          value={config.defaultView === 'lights' ? 'lights' : 'groups'}
          onChange={(e) => onChange('defaultView', e.target.value)}
        >
          <option value="groups">{de ? 'Räume' : 'Rooms'}</option>
          <option value="lights">{de ? 'Lampen' : 'Lights'}</option>
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={300}
          value={num(config.refreshSeconds) || 20}
          onChange={(e) => onChange('refreshSeconds', Math.max(5, num(e.target.value) || 20))}
        />
      </div>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'hue',
  name: 'Philips Hue',
  description:
    'Philips-Hue-Lampen und Räume per lokaler Bridge-API steuern: an/aus, Helligkeit, Status. Bridge-Koppeln im Plugin.',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '💡',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/philips-hue.png',
  defaultLayout: { w: 3, h: 4, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Hue' },
    { key: 'baseUrl', label: 'Bridge-IP / URL', type: 'text', defaultValue: '' },
    { key: 'apiKey', label: 'API-Key', type: 'password', defaultValue: '' },
    { key: 'defaultView', label: 'Standard-Ansicht', type: 'text', defaultValue: 'groups' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 20 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
