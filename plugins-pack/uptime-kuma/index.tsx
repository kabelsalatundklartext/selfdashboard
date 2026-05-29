'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type MonitorStatus = 'up' | 'down' | 'pending' | 'maintenance'

type MonitorRow = {
  id: number
  name: string
  group: string
  type: string
  status: MonitorStatus
}

type DashboardPayload = {
  slug?: string
  monitors?: MonitorRow[]
  counts?: {
    up: number
    down: number
    pending: number
    maintenance: number
    total: number
  }
  error?: string
  detail?: string
}

const STATUS_COLOR: Record<MonitorStatus, string> = {
  up: '#22c55e',
  down: '#ef4444',
  pending: '#f59e0b',
  maintenance: '#6366f1',
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

function normalizeBaseUrl(raw: string): string {
  let t = raw.trim().replace(/\/$/, '')
  if (!t) return ''
  if (!/^https?:\/\//i.test(t)) t = `http://${t}`
  if (t.endsWith('/dashboard')) t = t.slice(0, -'/dashboard'.length).replace(/\/$/, '')
  return t
}

function statusLabel(status: MonitorStatus, de: boolean): string {
  const map: Record<MonitorStatus, [string, string]> = {
    up: ['OK', 'Up'],
    down: ['Down', 'Down'],
    pending: ['Pending', 'Pending'],
    maintenance: ['Wartung', 'Maintenance'],
  }
  const pair = map[status]
  return pair[de ? 0 : 1]
}

function errorText(code: string, de: boolean): string {
  const map: Record<string, [string, string]> = {
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    missing_slug: ['Status-Page-Slug fehlt.', 'Status page slug missing.'],
    invalid_slug: ['Ungültiger Slug.', 'Invalid slug.'],
    status_page_not_found: ['Status-Page nicht gefunden — Slug prüfen.', 'Status page not found — check slug.'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Uptime Kuma nicht erreichbar.', 'Uptime Kuma unreachable.'],
    invalid_response: ['Ungültige API-Antwort.', 'Invalid API response.'],
  }
  const pair = map[code]
  return pair ? pair[de ? 0 : 1] : code
}

async function fetchMonitors(url: string, slug: string): Promise<DashboardPayload> {
  const res = await fetch('/api/plugins/uptime-kuma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, slug }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as DashboardPayload
  if (!res.ok) {
    return { monitors: [], error: json.error || `HTTP ${res.status}`, detail: json.detail }
  }
  return json
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const [rows, setRows] = useState<MonitorRow[]>([])
  const [counts, setCounts] = useState({ up: 0, down: 0, pending: 0, maintenance: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = normalizeBaseUrl(str(config.url))
  const slug = str(config.statusPageSlug).replace(/^\/+|\/+$/g, '')
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const showGroups = config.showGroups !== false
  const configured = Boolean(baseUrl && slug)

  const refresh = useCallback(async () => {
    if (!configured) {
      setRows([])
      setCounts({ up: 0, down: 0, pending: 0, maintenance: 0, total: 0 })
      setError(null)
      setLoading(false)
      return
    }

    try {
      const data = await fetchMonitors(baseUrl, slug)
      if (data.error) {
        setError(errorText(data.error, de))
        setRows([])
        setCounts({ up: 0, down: 0, pending: 0, maintenance: 0, total: 0 })
      } else {
        setError(null)
        setRows(Array.isArray(data.monitors) ? data.monitors : [])
        setCounts(
          data.counts ?? {
            up: 0,
            down: 0,
            pending: 0,
            maintenance: 0,
            total: Array.isArray(data.monitors) ? data.monitors.length : 0,
          },
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setRows([])
      setCounts({ up: 0, down: 0, pending: 0, maintenance: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [baseUrl, configured, de, slug])

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
    padding: '8px 10px 10px',
    containerType: 'size',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const hint = useMemo(() => {
    if (configured) return null
    return de
      ? 'Uptime-Kuma-URL und Status-Page-Slug in den Einstellungen eintragen.'
      : 'Enter Uptime Kuma URL and status page slug in settings.'
  }, [configured, de])

  const summary = useMemo(() => {
    if (counts.total === 0) return de ? 'Keine Monitore' : 'No monitors'
    const parts: string[] = []
    if (counts.up > 0) parts.push(de ? `${counts.up} OK` : `${counts.up} up`)
    if (counts.down > 0) parts.push(`${counts.down} down`)
    if (counts.pending > 0) parts.push(`${counts.pending} pending`)
    if (counts.maintenance > 0) parts.push(de ? `${counts.maintenance} Wartung` : `${counts.maintenance} maint.`)
    return parts.join(' · ')
  }, [counts, de])

  if (hint) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>💚</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>{hint}</p>
      </div>
    )
  }

  if (loading && rows.length === 0 && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[70, 55, 80].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 10, width: `${w}%`, borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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
          Uptime Kuma
        </p>
        <p style={{ margin: 0, fontSize: 'clamp(9px, 2.2cqmin, 10px)', color: 'var(--text-muted)' }}>{summary}</p>
      </div>

      {rows.length === 0 && !error ? (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Keine Monitore auf der Status-Page.' : 'No monitors on the status page.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', minWidth: 0 }}>
          {rows.map((row, idx) => {
            const color = STATUS_COLOR[row.status]
            const label = statusLabel(row.status, de)
            const title = showGroups && row.group ? `${row.group} · ${row.name}` : row.name
            return (
              <li
                key={`${row.id}-${row.name}`}
                title={title}
                style={{
                  listStyle: 'none',
                  padding: idx < rows.length - 1 ? '0 0 10px 0' : 0,
                  margin: 0,
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    minWidth: 0,
                    fontSize: 'clamp(10px, 2.8cqmin, 12px)',
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                      boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)`,
                    }}
                  />
                  <span
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                      fontWeight: 600,
                    }}
                  >
                    {row.name}
                  </span>
                  {showGroups && row.group ? (
                    <>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.75, fontSize: '0.92em' }}>
                        {row.group}
                      </span>
                    </>
                  ) : null}
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.85 }}>:</span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '0.92em',
                    }}
                  >
                    {label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

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

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{label}</span>
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const showGroups = config.showGroups !== false
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.url)}
          placeholder="http://192.168.1.10:3001"
          onChange={(e) => onChange('url', e.target.value)}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Ohne /dashboard — nur Host und Port.'
            : 'Without /dashboard — host and port only.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Status-Page-Slug' : 'Status page slug'}
        </label>
        <input
          style={inp}
          value={str(config.statusPageSlug)}
          placeholder="homelab"
          onChange={(e) => onChange('statusPageSlug', e.target.value)}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'In Uptime Kuma: Status Pages → Slug (URL-Teil nach /status/).'
            : 'In Uptime Kuma: Status Pages → slug (URL segment after /status/).'}
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
          max={300}
          value={num(config.refreshSeconds) || 30}
          onChange={(e) => onChange('refreshSeconds', Math.max(10, num(e.target.value) || 30))}
        />
      </div>
      <Toggle
        label={de ? 'Gruppenname anzeigen' : 'Show group name'}
        on={showGroups}
        onToggle={() => onChange('showGroups', !showGroups)}
      />
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'uptime-kuma',
  name: 'Uptime Kuma',
  description:
    'Öffentliche Status-Page als kompakte Monitor-Liste — passt neben Selfstream-Emby. Probleme (Down) zuerst.',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'network',
  icon: '💚',
  defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'url', label: 'Uptime Kuma URL', type: 'text', defaultValue: '' },
    { key: 'statusPageSlug', label: 'Status-Page-Slug', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
    { key: 'showGroups', label: 'Gruppen anzeigen', type: 'boolean', defaultValue: true },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
