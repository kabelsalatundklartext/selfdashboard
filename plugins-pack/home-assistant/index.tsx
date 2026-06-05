'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type HaEntity = {
  id: string
  name?: string
  state?: string
  unit?: string | null
  error?: string
}

type HaResponse = {
  entities?: HaEntity[]
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

function parseEntityIds(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 25)
}

function errorText(code: string, detail: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    auth_failed: [
      'Token prüfen (Profil → Sicherheit → Long-Lived Access Tokens).',
      'Check token (Profile → Security → Long-Lived Access Tokens).',
    ],
    missing_entities: ['Keine gültigen Entity-IDs konfiguriert.', 'No valid entity IDs configured.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Home Assistant nicht erreichbar.', 'Home Assistant unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function stateStyle(state: string): CSSProperties {
  if (state === 'on') return { color: '#34d399' }
  if (state === 'off') return { color: 'var(--text-muted)' }
  if (state === 'unavailable' || state === 'unknown') return { color: '#ef4444', fontStyle: 'italic' }
  return { color: 'var(--text)' }
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [entities, setEntities] = useState<HaEntity[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const token = str(config.token)
  const entitiesRaw = str(config.entitiesRaw)
  const entityIds = useMemo(() => parseEntityIds(entitiesRaw), [entitiesRaw])
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const title = config.title === undefined ? 'Home Assistant' : str(config.title)
  const configured = Boolean(baseUrl && entityIds.length > 0)

  const refresh = useCallback(async () => {
    if (!configured) {
      setEntities(null)
      setError(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/home-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, token, entities: entityIds }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as HaResponse
      if (!res.ok || json.error) {
        setError(errorText(json.error || `HTTP ${res.status}`, json.detail || '', de))
        return
      }
      setEntities(Array.isArray(json.entities) ? json.entities : [])
      setError(null)
    } catch {
      setError(errorText('network_error', '', de))
    } finally {
      setLoading(false)
    }
  }, [baseUrl, configured, de, entityIds, token])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

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

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🏠</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Home-Assistant-URL, Token und Entity-IDs in den Einstellungen eintragen.'
            : 'Enter Home Assistant URL, token and entity IDs in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !entities && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80, 60].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>
      {title ? (
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

      {entities && entities.length > 0 ? (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {entities.map((e) => (
            <li
              key={e.id}
              title={e.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
                minWidth: 0,
                fontSize: 'clamp(10px, 3cqmin, 13px)',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text)',
                }}
              >
                {e.name || e.id}
              </span>
              {e.error ? (
                <span style={{ flexShrink: 0, fontSize: '0.85em', color: '#ef4444', fontStyle: 'italic' }}>
                  {e.error === 'not_found' ? (de ? 'nicht gefunden' : 'not found') : e.error}
                </span>
              ) : (
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', ...stateStyle(e.state ?? '') }}>
                    {e.state || '—'}
                  </span>
                  {e.unit ? (
                    <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{e.unit}</span>
                  ) : null}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {entities && entities.length === 0 && !error ? (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          {de ? 'Keine Entitäten gefunden.' : 'No entities found.'}
        </p>
      ) : null}

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Widget-Titel (leer = ausblenden)' : 'Widget title (empty = hidden)'}
        </label>
        <input
          style={inp}
          value={config.title === undefined ? 'Home Assistant' : str(config.title)}
          placeholder="Home Assistant"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="http://192.168.1.80:8123"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>
          {de ? 'Long-Lived Access Token' : 'Long-lived access token'}
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.token)}
          onChange={(e) => onChange('token', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Home Assistant → Profil → Sicherheit → Long-Lived Access Tokens. Abfrage läuft serverseitig über /api/plugins/home-assistant.'
            : 'Home Assistant → Profile → Security → Long-Lived Access Tokens. Requests go server-side via /api/plugins/home-assistant.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Entity-IDs (Komma- oder Zeilen-getrennt, max. 25)' : 'Entity IDs (comma- or line-separated, max. 25)'}
        </label>
        <input
          style={inp}
          value={str(config.entitiesRaw)}
          placeholder="sensor.temperatur_wohnzimmer, switch.steckdose"
          onChange={(e) => onChange('entitiesRaw', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Entity-IDs findest du in Home Assistant unter Entwicklerwerkzeuge → Zustände.'
            : 'Find entity IDs in Home Assistant under Developer Tools → States.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
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
  )
}

export const meta: PluginMeta = {
  id: 'home-assistant',
  name: 'Home Assistant',
  description: 'Ausgewählte Home-Assistant-Entitäten (Sensoren, Schalter …) per Long-Lived Token. (Beta)',
  version: '0.9.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🏠',
  iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/home-assistant.png',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Home Assistant' },
    { key: 'baseUrl', label: 'Home Assistant URL', type: 'text', defaultValue: '' },
    { key: 'token', label: 'Long-Lived Access Token', type: 'password', defaultValue: '' },
    { key: 'entitiesRaw', label: 'Entity-IDs', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
