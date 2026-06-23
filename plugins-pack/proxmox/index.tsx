'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type ProxmoxNode = {
  name: string
  status: string
  cpuPct: number | null
  memPct: number | null
  memUsedGb: number | null
  memTotalGb: number | null
  uptimeSec: number | null
}

type ProxmoxData = {
  nodes: ProxmoxNode[]
  vms: { running: number; total: number }
  lxc: { running: number; total: number }
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
    auth_failed: [
      'API-Token prüfen — „Privilege Separation“ aus oder Rolle PVEAuditor auf /.',
      'Check API token — disable privilege separation or grant PVEAuditor on /.',
    ],
    missing_token: ['API-Token fehlt (user@realm!tokenid=uuid).', 'API token missing (user@realm!tokenid=uuid).'],
    tls_error: [
      'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.',
      'TLS certificate rejected — enable "Allow self-signed certificate".',
    ],
    upstream_error: ['Proxmox-API-Fehler.', 'Proxmox API error.'],
    blocked_url: ['URL blockiert (SSRF-Schutz).', 'URL blocked (SSRF guard).'],
    timeout: ['Zeitüberschreitung.', 'Timeout.'],
    network_error: ['Proxmox nicht erreichbar.', 'Proxmox unreachable.'],
    missing_url: ['Basis-URL fehlt.', 'Base URL missing.'],
    invalid_url: ['Ungültige URL.', 'Invalid URL.'],
  }
  const pair = map[code]
  const base = pair ? pair[de ? 0 : 1] : code
  return detail && !pair ? `${base}: ${detail}` : base
}

function fmtPct(v: number | null): string {
  if (v == null) return '—'
  return `${Math.round(v)}%`
}

function Bar({ pct, color }: { pct: number | null; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 24,
        height: 6,
        borderRadius: 3,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, pct ?? 0))}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

function NodeRow({ node, de }: { node: ProxmoxNode; de: boolean }) {
  const online = node.status === 'online'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background: online ? '#34d399' : '#ef4444',
          }}
          title={node.status}
        />
        <span
          style={{
            fontSize: 'clamp(11px, 3cqmin, 13px)',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.name}
        </span>
        {!online ? (
          <span style={{ fontSize: 10, color: '#ef4444' }}>{node.status}</span>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 26, flexShrink: 0 }}>CPU</span>
        <Bar pct={node.cpuPct} color="var(--accent)" />
        <span
          style={{
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            width: 34,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {fmtPct(node.cpuPct)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 26, flexShrink: 0 }}>RAM</span>
        <Bar pct={node.memPct} color="#a78bfa" />
        <span
          style={{
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            width: 34,
            textAlign: 'right',
            flexShrink: 0,
          }}
          title={
            node.memUsedGb != null && node.memTotalGb != null
              ? `${node.memUsedGb.toFixed(1)} / ${node.memTotalGb.toFixed(1)} GB`
              : undefined
          }
        >
          {fmtPct(node.memPct)}
        </span>
      </div>
    </div>
  )
}

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const { active } = usePollingActive()
  const [data, setData] = useState<ProxmoxData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = str(config.baseUrl)
  const apiToken = str(config.apiToken)
  const insecureTls = config.insecureTls !== false
  const refreshMs = Math.max(10, num(config.refreshSeconds) || 30) * 1000
  const title = config.title === undefined ? 'Proxmox' : str(config.title)
  const configured = Boolean(baseUrl && apiToken)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/proxmox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: baseUrl, apiToken, insecureTls }),
        cache: 'no-store',
      })
      const json = (await res.json().catch(() => ({}))) as ProxmoxData
      if (!res.ok || json.error) {
        setError(errorText(json.error || `HTTP ${res.status}`, json.detail || '', de))
        return
      }
      setData(json)
      setError(null)
    } catch {
      setError(errorText('network_error', '', de))
    } finally {
      setLoading(false)
    }
  }, [apiToken, baseUrl, configured, de, insecureTls])

  useEffect(() => {
    if (!active) return
    setLoading(true)
    void refresh()
    const t = setInterval(() => void refresh(), refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs, active])

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

  if (!configured) {
    return (
      <div style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 24 }}>🖥️</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Proxmox-URL und API-Token (user@realm!tokenid=uuid) in den Einstellungen eintragen.'
            : 'Enter Proxmox URL and API token (user@realm!tokenid=uuid) in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data && !error) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[55, 85, 85, 50].map((w, i) => (
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

      {data ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {data.nodes.length === 0 ? (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              {de ? 'Keine Knoten gefunden.' : 'No nodes found.'}
            </p>
          ) : (
            data.nodes.map((n) => <NodeRow key={n.name} node={n} de={de} />)
          )}
        </div>
      ) : null}

      {data ? (
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(9px, 2.4cqmin, 11px)',
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {de ? 'VMs' : 'VMs'} {data.vms.running}/{data.vms.total} · LXC {data.lxc.running}/{data.lxc.total}
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
          value={config.title === undefined ? 'Proxmox' : str(config.title)}
          placeholder="Proxmox"
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{de ? 'Basis-URL' : 'Base URL'}</label>
        <input
          style={inp}
          value={str(config.baseUrl)}
          placeholder="https://192.168.1.60:8006"
          onChange={(e) => onChange('baseUrl', e.target.value)}
        />
        <label style={{ display: 'block', fontSize: 12, margin: '10px 0 4px' }}>API-Token</label>
        <input
          style={inp}
          type="password"
          value={str(config.apiToken)}
          placeholder="user@realm!tokenid=uuid"
          onChange={(e) => onChange('apiToken', e.target.value)}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {de
            ? 'Proxmox: Datacenter → Permissions → API Tokens. Komplettes Token im Format user@realm!tokenid=uuid eintragen. Abfrage läuft serverseitig über /api/plugins/proxmox.'
            : 'Proxmox: Datacenter → Permissions → API Tokens. Enter the full token as user@realm!tokenid=uuid. Requests go server-side via /api/plugins/proxmox.'}
        </p>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.insecureTls !== false}
            onChange={(e) => onChange('insecureTls', e.target.checked)}
          />
          {de ? 'Selbstsigniertes Zertifikat erlauben' : 'Allow self-signed certificate'}
        </label>
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
  id: 'proxmox',
  name: 'Proxmox VE',
  description: 'Proxmox-Knoten mit CPU/RAM und laufenden VMs/LXCs per API-Token. (Beta)',
  version: '0.9.2',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🖥️',
  iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/proxmox.png',
  defaultLayout: { w: 4, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Proxmox' },
    { key: 'baseUrl', label: 'Proxmox URL', type: 'text', placeholder: 'https://192.168.1.60:8006', defaultValue: '' },
    { key: 'apiToken', label: 'API-Token', type: 'password', placeholder: 'user@realm!tokenid=uuid', defaultValue: '' },
    { key: 'insecureTls', label: 'Selbstsigniertes Zertifikat erlauben', type: 'boolean', defaultValue: true },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
