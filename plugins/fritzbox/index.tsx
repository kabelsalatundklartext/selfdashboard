'use client'

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Gauge,
  Globe,
  Router,
  SlidersHorizontal,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'fritzbox',
  name: 'FRITZ!Box',
  description:
    'FRITZ!Box WAN (UPnP IGD): Kacheln, Live-Rate, Verlaufsgrafik. „Anzeige“ im Widget blendet Bereiche ein/aus (wird gespeichert). /api/fritzbox.',
  version: '1.1.1',
  author: 'SelfDashboard',
  category: 'network',
  icon: '📡',
  defaultLayout: { w: 4, h: 7, minW: 3, minH: 6 },
  configSchema: [
    {
      key: 'baseUrl',
      label: 'TR-064 Basis-URL',
      type: 'text',
      defaultValue: 'http://fritz.box',
      placeholder: 'Nur Host (z. B. http://fritz.box) — ohne /tr064; Port 49000/49443 wird ergänzt',
    },
    { key: 'username', label: 'Benutzername', type: 'text', defaultValue: '', placeholder: 'FRITZ!Box-Benutzer' },
    { key: 'password', label: 'Passwort', type: 'password', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisieren (Sek.)', type: 'number', defaultValue: 30 },
    {
      key: 'liveIntervalSeconds',
      label: 'Live-Zähler (Sek., leer=5)',
      type: 'number',
      defaultValue: 5,
      placeholder: '0=aus, 3–15=schneller Takt',
    },
    { key: 'insecureTls', label: 'HTTPS: selbstsigniert erlauben', type: 'boolean', defaultValue: false },
    {
      key: 'chartHistoryPoints',
      label: 'Verlauf: max. Messpunkte',
      type: 'number',
      defaultValue: 48,
      placeholder: '16–120',
    },
  ],
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function formatMbps(bps: number | null, de: boolean): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return '—'
  const mbps = bps / 1_000_000
  const s = mbps >= 100 ? String(Math.round(mbps)) : mbps.toFixed(1)
  return de ? `${s.replace('.', ',')} Mbit/s` : `${s} Mbit/s`
}

function formatUptime(sec: number | null, de: boolean): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '—'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  if (de) return `${d} T., ${h} Std.`
  return `${d}d ${h}h`
}

/** TR-064 `NewConnectionType` / `NewWANAccessType` — kurz lesbar machen */
function humanizeWanTech(raw: string | null, de: boolean): string {
  if (!raw || !raw.trim()) return ''
  const r = raw.trim()
  const mapDe: Record<string, string> = {
    IP_Routed: 'IP (geroutet)',
    PPPoE: 'PPPoE',
    PPTP_Relay: 'PPTP',
    L2TP_Relay: 'L2TP',
    Unconfigured: '—',
    Ethernet: 'Ethernet',
    DSL: 'DSL',
    Fiber: 'Glasfaser',
    Other: '',
  }
  const mapEn: Record<string, string> = {
    IP_Routed: 'IP routed',
    PPPoE: 'PPPoE',
    PPTP_Relay: 'PPTP',
    L2TP_Relay: 'L2TP',
    Unconfigured: '—',
    Ethernet: 'Ethernet',
    DSL: 'DSL',
    Fiber: 'Fiber',
    Other: '',
  }
  const m = de ? mapDe : mapEn
  return m[r] !== undefined ? m[r] || '' : r
}

function truncateMid(s: string, max: number): string {
  if (s.length <= max) return s
  const half = Math.floor((max - 1) / 2)
  return `${s.slice(0, half)}…${s.slice(s.length - half)}`
}

function cfgBool(r: Record<string, unknown>, key: string, defaultValue = true): boolean {
  const v = r[key]
  if (v === undefined || v === null) return defaultValue
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  return defaultValue
}

function ThroughputHistoryChart({
  history,
  de,
}: {
  history: { down: number; up: number }[]
  de: boolean
}) {
  if (history.length < 2) return null
  const W = 100
  const H = 34
  const pad = 2
  const maxY = Math.max(1, ...history.map((h) => Math.max(h.down, h.up)))
  const xAt = (i: number) => pad + (history.length === 1 ? W / 2 : (i / (history.length - 1)) * (W - pad * 2))
  const yAt = (v: number) => H - pad - (v / maxY) * (H - pad * 2)
  const downPts = history.map((p, i) => `${xAt(i)},${yAt(p.down)}`).join(' ')
  const upPts = history.map((p, i) => `${xAt(i)},${yAt(p.up)}`).join(' ')
  return (
    <div
      style={{
        borderRadius: '10px',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        padding: '6px 8px 4px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {de ? 'Durchsatz-Verlauf' : 'Throughput history'}
        </span>
        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
          {de ? '↓ grün · ↑ blau' : '↓ green · ↑ blue'}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 'clamp(40px, 11cqmin, 64px)', display: 'block' }}
        aria-hidden
      >
        <polyline fill="none" stroke="#34d399" strokeWidth="1.1" vectorEffect="non-scaling-stroke" points={downPts} />
        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.1" vectorEffect="non-scaling-stroke" points={upPts} />
      </svg>
    </div>
  )
}

const TINT = {
  sky: { solid: '#38bdf8', wash: 'rgba(56, 189, 248, 0.2)', rim: 'rgba(56, 189, 248, 0.38)' },
  emerald: { solid: '#34d399', wash: 'rgba(52, 211, 153, 0.18)', rim: 'rgba(52, 211, 153, 0.38)' },
  amber: { solid: '#fbbf24', wash: 'rgba(251, 191, 36, 0.15)', rim: 'rgba(251, 191, 36, 0.4)' },
  violet: { solid: '#c084fc', wash: 'rgba(192, 132, 252, 0.2)', rim: 'rgba(192, 132, 252, 0.38)' },
} as const

type TintKey = keyof typeof TINT

function Tile({
  label,
  value,
  tint,
  icon: Icon,
  footer,
}: {
  label: string
  value: string
  tint: TintKey
  icon: LucideIcon
  footer?: ReactNode
}) {
  const c = TINT[tint]
  return (
    <div
      style={{
        borderRadius: '12px',
        padding: '10px 10px 10px 12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
        minHeight: 'clamp(64px, 18cqmin, 88px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Icon size={13} strokeWidth={2.25} style={{ color: c.solid, flexShrink: 0, opacity: 0.95 }} aria-hidden />
        <span
          style={{
            fontSize: 'clamp(9px, 2cqmin, 10px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="tabular-nums"
        style={{
          fontSize: 'clamp(0.95rem, 4.5cqmin, 1.35rem)',
          fontWeight: 800,
          color: c.solid,
          lineHeight: 1.12,
          fontVariantNumeric: 'tabular-nums',
          marginTop: '4px',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
      {footer}
    </div>
  )
}

type Summary = {
  modelName: string | null
  softwareVersion: string | null
  manufacturer: string | null
  wanAccessType: string | null
  downstreamMaxBps: number | null
  upstreamMaxBps: number | null
  connectionStatus: string | null
  uptimeSec: number | null
  externalIpv4: string | null
  lastError: string | null
  wanConnectionType: string | null
  wanConnectionName: string | null
  natEnabled: boolean | null
  wanDnsServers: string | null
  hostCount: number | null
  wanTotalBytesReceived: string | null
  wanTotalBytesSent: string | null
  fetchedAt?: string
}

function Widget({ config, instanceId }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const r = config as Record<string, unknown>
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)
  const baseUrl = str(r.baseUrl)
  const username = str(r.username)
  const password = typeof r.password === 'string' ? String(r.password) : ''
  const insecureTls = r.insecureTls === true
  const refreshSec = Math.min(300, Math.max(15, Math.round(num(r.refreshSeconds) || 30)))
  const liveInput = r.liveIntervalSeconds
  const liveEvery = (() => {
    if (liveInput === undefined || liveInput === null || liveInput === '') return 5
    const n = Math.round(Number(liveInput))
    if (!Number.isFinite(n)) return 5
    if (n <= 0) return 0
    return Math.min(15, Math.max(3, n))
  })()

  const chartCap = Math.min(120, Math.max(16, Math.round(num(r.chartHistoryPoints)) || 48))

  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveBps, setLiveBps] = useState<{ down: number; up: number } | null>(null)
  const [displayPanel, setDisplayPanel] = useState(false)
  const [bpsHistory, setBpsHistory] = useState<{ down: number; up: number }[]>([])
  const prevBytesRef = useRef<{ rx: string; tx: string; t: number } | null>(null)
  const dataRef = useRef<Summary | null>(null)

  useEffect(() => {
    prevBytesRef.current = null
    setLiveBps(null)
    setBpsHistory([])
  }, [baseUrl, username])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const load = useCallback(async () => {
    if (!baseUrl) {
      setLoading(false)
      setError(de ? 'Keine Basis-URL in den Einstellungen.' : 'No base URL in settings.')
      setData(null)
      return
    }
    try {
      const res = await fetch('/api/fritzbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ baseUrl, username, password, insecureTls }),
      })
      const j = (await res.json()) as Summary & { ok?: boolean; error?: string; message?: string }
      if (!res.ok) {
        if (res.status === 401) setError(de ? 'Anmeldung fehlgeschlagen.' : 'Login failed.')
        else if (j.error === 'timeout') setError(de ? 'Zeitüberschreitung.' : 'Timeout.')
        else setError(j.message || j.error || `HTTP ${res.status}`)
        setData(null)
        return
      }
      if (j.ok === false) {
        setError(j.message || j.error || 'Error')
        setData(null)
        return
      }
      setError(null)
      setData(j as Summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, username, password, insecureTls, de])

  const loadLite = useCallback(async () => {
    if (!baseUrl || liveEvery <= 0) return
    const cur = dataRef.current
    if (!cur || (!cur.wanTotalBytesReceived && !cur.wanTotalBytesSent)) return
    try {
      const res = await fetch('/api/fritzbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ baseUrl, username, password, insecureTls, lite: true }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        wanTotalBytesReceived?: string | null
        wanTotalBytesSent?: string | null
      }
      if (!res.ok || j.ok === false) return
      setData((d) => {
        if (!d) return d
        const next = { ...d }
        if (typeof j.wanTotalBytesReceived === 'string' && /^\d+$/.test(j.wanTotalBytesReceived)) {
          next.wanTotalBytesReceived = j.wanTotalBytesReceived
        }
        if (typeof j.wanTotalBytesSent === 'string' && /^\d+$/.test(j.wanTotalBytesSent)) {
          next.wanTotalBytesSent = j.wanTotalBytesSent
        }
        return next
      })
    } catch {
      /* ignorieren */
    }
  }, [baseUrl, username, password, insecureTls, liveEvery])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), refreshSec * 1000)
    return () => window.clearInterval(id)
  }, [load, refreshSec])

  useEffect(() => {
    if (liveEvery <= 0) return undefined
    const t = window.setTimeout(() => void loadLite(), 600)
    const id = window.setInterval(() => void loadLite(), liveEvery * 1000)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(id)
    }
  }, [liveEvery, loadLite])

  useEffect(() => {
    if (!data) return
    if (!data.wanTotalBytesReceived || !data.wanTotalBytesSent) {
      setLiveBps(null)
      prevBytesRef.current = null
      return
    }
    const rx = data.wanTotalBytesReceived
    const tx = data.wanTotalBytesSent
    const now = Date.now()
    const pr = prevBytesRef.current
    if (pr) {
      const dt = (now - pr.t) / 1000
      if (dt >= 0.4 && dt < 600) {
        try {
          const drx = BigInt(rx) - BigInt(pr.rx)
          const dtx = BigInt(tx) - BigInt(pr.tx)
          const zero = BigInt(0)
          if (drx >= zero && dtx >= zero) {
            const down = Number(drx * BigInt(8)) / dt
            const up = Number(dtx * BigInt(8)) / dt
            if (Number.isFinite(down) && Number.isFinite(up)) setLiveBps({ down, up })
          } else {
            setLiveBps(null)
          }
        } catch {
          setLiveBps(null)
        }
      }
    }
    prevBytesRef.current = { rx, tx, t: now }
  }, [data])

  useEffect(() => {
    if (!liveBps || !Number.isFinite(liveBps.down) || !Number.isFinite(liveBps.up)) return
    setBpsHistory((prev) => [...prev, { down: liveBps.down, up: liveBps.up }].slice(-chartCap))
  }, [liveBps, chartCap])

  const muted = 'var(--text-muted)'
  const text = 'var(--text)'

  const wanOk = (() => {
    const st = (data?.connectionStatus ?? '').toLowerCase()
    return st.includes('verbunden') || st.includes('connect') || st === 'up' || !!data?.externalIpv4
  })()

  const internetSubline = (() => {
    if (!data) return null
    const parts: string[] = []
    const layer = humanizeWanTech(data.wanAccessType, de)
    const conn = humanizeWanTech(data.wanConnectionType, de)
    if (layer) parts.push(layer)
    if (conn && conn !== layer) parts.push(conn)
    const line = parts.filter(Boolean).join(' · ')
    return line || (data.wanAccessType && data.wanAccessType !== 'Other' ? data.wanAccessType : null)
  })()

  const hasByteCounters = !!(data?.wanTotalBytesReceived && data?.wanTotalBytesSent)
  const liveDownStr = !hasByteCounters
    ? '—'
    : liveBps
      ? formatMbps(liveBps.down, de)
      : '…'
  const liveUpStr = !hasByteCounters ? '—' : liveBps ? formatMbps(liveBps.up, de) : '…'
  const liveFooter = !hasByteCounters
    ? de
      ? 'Zähler nicht unterstützt'
      : 'Counters not supported'
    : liveEvery > 0
      ? de
        ? `≈ Live · Zähler alle ${liveEvery} s`
        : `~Live · counters every ${liveEvery}s`
      : de
        ? `Mittel über ${refreshSec} s (nur voller Abruf)`
        : `Avg over ${refreshSec}s (full poll only)`

  const showHeader = cfgBool(r, 'uiShowHeader', true)
  const showTileInternet = cfgBool(r, 'uiShowTileInternet', true)
  const showTilePublicIp = cfgBool(r, 'uiShowTilePublicIp', true)
  const showTileMaxDown = cfgBool(r, 'uiShowTileMaxDown', true)
  const showTileMaxUp = cfgBool(r, 'uiShowTileMaxUp', true)
  const showTileLiveDown = cfgBool(r, 'uiShowTileLiveDown', true)
  const showTileLiveUp = cfgBool(r, 'uiShowTileLiveUp', true)
  const showTileHosts = cfgBool(r, 'uiShowTileHosts', true)
  const showTileWanDetails = cfgBool(r, 'uiShowTileWanDetails', true)
  const showFooter = cfgBool(r, 'uiShowFooter', true)
  const showThroughputChart = cfgBool(r, 'uiShowThroughputChart', true)

  const flipUi = (key: string) => {
    updatePluginConfig(instanceId, { [key]: !cfgBool(r, key, true) })
  }

  const setAllTiles = (on: boolean) => {
    updatePluginConfig(instanceId, {
      uiShowHeader: on,
      uiShowTileInternet: on,
      uiShowTilePublicIp: on,
      uiShowTileMaxDown: on,
      uiShowTileMaxUp: on,
      uiShowTileLiveDown: on,
      uiShowTileLiveUp: on,
      uiShowTileHosts: on,
      uiShowTileWanDetails: on,
      uiShowFooter: on,
      uiShowThroughputChart: on,
    })
  }

  if (!baseUrl && !loading) {
    return (
      <div style={{ padding: '12px', color: muted, fontSize: '12px', textAlign: 'center' }}>
        {de ? 'Bitte TR-064-URL in den Plugin-Einstellungen setzen.' : 'Set the TR-064 URL in plugin settings.'}
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
        padding: 'clamp(6px, 1.5cqmin, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        containerType: 'size',
        overflow: 'auto',
      }}
    >
      {baseUrl ? (
        <>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            {showHeader ? (
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 'clamp(10px, 2.4cqmin, 12px)', fontWeight: 700, color: text, lineHeight: 1.25 }}>
                  {data?.manufacturer && data?.modelName
                    ? `${data.manufacturer} ${data.modelName}`
                    : data?.modelName || 'FRITZ!Box'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 'clamp(9px, 2cqmin, 11px)', color: muted }}>
                  {data?.softwareVersion
                    ? de
                      ? `FRITZ!OS ${data.softwareVersion}`
                      : `FRITZ!OS ${data.softwareVersion}`
                    : loading
                      ? de
                        ? 'Lade…'
                        : 'Loading…'
                      : '—'}
                </p>
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <button
              type="button"
              onClick={() => setDisplayPanel((o) => !o)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={2.25} aria-hidden />
              {de ? 'Anzeige' : 'Display'}
            </button>
          </div>
          {displayPanel && (
            <div
              style={{
                flexShrink: 0,
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '10px 10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {de ? 'Sichtbarkeit' : 'Visibility'}
              </p>
              {(
                [
                  [de ? 'Kopfzeile (Modell)' : 'Header (model)', 'uiShowHeader'] as const,
                  [de ? 'Internet' : 'Internet', 'uiShowTileInternet'] as const,
                  [de ? 'Öffentliche IPv4' : 'Public IPv4', 'uiShowTilePublicIp'] as const,
                  [de ? 'Download (max.)' : 'Download (max)', 'uiShowTileMaxDown'] as const,
                  [de ? 'Upload (max.)' : 'Upload (max)', 'uiShowTileMaxUp'] as const,
                  [de ? 'Download (live)' : 'Download (live)', 'uiShowTileLiveDown'] as const,
                  [de ? 'Upload (live)' : 'Upload (live)', 'uiShowTileLiveUp'] as const,
                  [de ? 'Heimnetz-Geräte' : 'LAN devices', 'uiShowTileHosts'] as const,
                  [de ? 'WAN-Details' : 'WAN details', 'uiShowTileWanDetails'] as const,
                  [de ? 'Fußzeile' : 'Footer', 'uiShowFooter'] as const,
                  [de ? 'Verlaufsgrafik' : 'History chart', 'uiShowThroughputChart'] as const,
                ] as const
              ).map(([label, key]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '11px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ lineHeight: 1.3 }}>{label}</span>
                  <input
                    type="checkbox"
                    checked={cfgBool(r, key, true)}
                    onChange={() => flipUi(key)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', flexShrink: 0 }}
                  />
                </label>
              ))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setAllTiles(true)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {de ? 'Alle an' : 'Show all'}
                </button>
                <button
                  type="button"
                  onClick={() => setAllTiles(false)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {de ? 'Alle aus' : 'Hide all'}
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayPanel(false)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  {de ? 'Schließen' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {error && (
        <p style={{ margin: 0, fontSize: '11px', color: '#fb7185', textAlign: 'center', lineHeight: 1.4 }}>{error}</p>
      )}

      {data && !error && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px',
              flex: 1,
              minHeight: 0,
            }}
          >
            {[
              showTileInternet ? (
                <Tile
                  key="int"
                  label={de ? 'Internet' : 'Internet'}
                  value={wanOk ? (de ? 'Verbunden' : 'Up') : de ? 'Prüfen' : 'Check'}
                  tint={wanOk ? 'emerald' : 'amber'}
                  icon={Wifi}
                  footer={
                    internetSubline ? (
                      <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{internetSubline}</span>
                    ) : data?.connectionStatus && !wanOk ? (
                      <span style={{ fontSize: '9px', color: muted, marginTop: '4px' }}>{data.connectionStatus}</span>
                    ) : null
                  }
                />
              ) : null,
              showTilePublicIp ? (
                <Tile key="ip" label={de ? 'Öffentliche IPv4' : 'Public IPv4'} value={data.externalIpv4 || '—'} tint="sky" icon={Globe} />
              ) : null,
              showTileMaxDown ? (
                <Tile
                  key="maxd"
                  label={de ? 'Download (max.)' : 'Download (max)'}
                  value={formatMbps(data.downstreamMaxBps, de)}
                  tint="violet"
                  icon={ArrowDownCircle}
                />
              ) : null,
              showTileMaxUp ? (
                <Tile
                  key="maxu"
                  label={de ? 'Upload (max.)' : 'Upload (max)'}
                  value={formatMbps(data.upstreamMaxBps, de)}
                  tint="violet"
                  icon={ArrowUpCircle}
                />
              ) : null,
              showTileLiveDown ? (
                <Tile
                  key="liveD"
                  label={de ? 'Download (live)' : 'Download (live)'}
                  value={liveDownStr}
                  tint="emerald"
                  icon={Gauge}
                  footer={
                    <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{liveFooter}</span>
                  }
                />
              ) : null,
              showTileLiveUp ? (
                <Tile
                  key="liveU"
                  label={de ? 'Upload (live)' : 'Upload (live)'}
                  value={liveUpStr}
                  tint="emerald"
                  icon={Gauge}
                  footer={
                    <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{liveFooter}</span>
                  }
                />
              ) : null,
              showTileHosts ? (
                <Tile
                  key="hosts"
                  label={de ? 'Heimnetz-Geräte' : 'LAN devices'}
                  value={data.hostCount != null && data.hostCount >= 0 ? String(data.hostCount) : '—'}
                  tint="amber"
                  icon={Users}
                  footer={
                    <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>
                      {de ? 'laut Hosts-Tabelle' : 'per host table'}
                    </span>
                  }
                />
              ) : null,
              showTileWanDetails ? (
                <Tile
                  key="wan"
                  label={de ? 'WAN-Details' : 'WAN details'}
                  value={(() => {
                    const name = data.wanConnectionName?.trim()
                    if (name) return name.length > 32 ? `${name.slice(0, 30)}…` : name
                    if (data.natEnabled != null)
                      return de ? `NAT ${data.natEnabled ? 'an' : 'aus'}` : `NAT ${data.natEnabled ? 'on' : 'off'}`
                    const t = humanizeWanTech(data.wanConnectionType, de)
                    return t || '—'
                  })()}
                  tint="sky"
                  icon={Router}
                  footer={
                    <>
                      {data.natEnabled != null && data.wanConnectionName?.trim() ? (
                        <span style={{ fontSize: '9px', color: muted, marginTop: '4px' }}>
                          {de ? `NAT ${data.natEnabled ? 'an' : 'aus'}` : `NAT ${data.natEnabled ? 'on' : 'off'}`}
                        </span>
                      ) : null}
                      {data.wanDnsServers ? (
                        <span
                          style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25, wordBreak: 'break-all' }}
                          title={data.wanDnsServers}
                        >
                          DNS: {truncateMid(data.wanDnsServers.replace(/\s+/g, ' ').trim(), 44)}
                        </span>
                      ) : null}
                    </>
                  }
                />
              ) : null,
            ].filter((n) => n != null)}
          </div>
          {!showTileInternet &&
          !showTilePublicIp &&
          !showTileMaxDown &&
          !showTileMaxUp &&
          !showTileLiveDown &&
          !showTileLiveUp &&
          !showTileHosts &&
          !showTileWanDetails ? (
            <p style={{ margin: 0, fontSize: '11px', color: muted, textAlign: 'center' }}>
              {de ? 'Alle Kacheln ausgeblendet.' : 'All tiles hidden.'}
            </p>
          ) : null}
          {showThroughputChart ? <ThroughputHistoryChart history={bpsHistory} de={de} /> : null}
          {showFooter ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '9px', color: muted }}>
                {de ? 'Verbunden seit' : 'Up for'}: <span style={{ color: text }}>{formatUptime(data.uptimeSec, de)}</span>
              </p>
              <p style={{ margin: 0, fontSize: '9px', color: muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Router size={10} aria-hidden />
                UPnP IGD
              </p>
            </div>
          ) : null}
          {data.lastError && data.lastError !== 'ERROR_NONE' && (
            <p style={{ margin: 0, fontSize: '10px', color: '#fb7185', lineHeight: 1.35 }}>
              {de ? 'Letzter WAN-Fehler: ' : 'Last WAN error: '}
              {data.lastError}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const r = config as Record<string, unknown>
  const inp: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const refresh = Math.min(300, Math.max(15, Math.round(num(r.refreshSeconds) || 30)))
  const liveSettingsVal = (() => {
    const v = r.liveIntervalSeconds
    if (v === undefined || v === null || v === '') return 5
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return 5
    return Math.min(15, Math.max(0, n))
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        {de ? (
          <>
            Zugriff per <strong>TR-064</strong> (Port <code style={{ fontSize: '10px' }}>49000</code> bei{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Benutzer und Passwort wie in der FRITZ!Box angelegt (z. B.
            eigener Benutzer mit Recht auf Heimnetz). Der Abruf läuft über den SelfDashboard-Server.
          </>
        ) : (
          <>
            Uses <strong>TR-064</strong> (default port <code style={{ fontSize: '10px' }}>49000</code> for{' '}
            <code style={{ fontSize: '10px' }}>http</code>). Same username/password as in the FRITZ!Box. Fetched via the
            SelfDashboard server.
          </>
        )}
      </p>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Basis-URL' : 'Base URL'}
        </label>
        <input
          style={inp}
          value={str(r.baseUrl)}
          onChange={(e) => onChange('baseUrl', e.target.value)}
          placeholder="http://fritz.box"
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Benutzername' : 'Username'}
        </label>
        <input style={inp} value={str(r.username)} onChange={(e) => onChange('username', e.target.value)} autoComplete="off" />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Passwort' : 'Password'}
        </label>
        <input
          style={inp}
          type="password"
          value={typeof r.password === 'string' ? r.password : ''}
          onChange={(e) => onChange('password', e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>
          {de ? 'HTTPS: selbstsigniertes Zertifikat erlauben' : 'HTTPS: allow self-signed certificate'}
        </span>
        <input
          type="checkbox"
          checked={r.insecureTls === true}
          onChange={(e) => onChange('insecureTls', e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
        />
      </label>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Aktualisieren (Sekunden)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          max={300}
          value={refresh}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(15, Math.round(Number(e.target.value)) || 30)))}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Live-Zähler (Sekunden)' : 'Live counters (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={0}
          max={15}
          value={liveSettingsVal}
          onChange={(e) =>
            onChange('liveIntervalSeconds', Math.min(15, Math.max(0, Math.round(Number(e.target.value)) || 0)))
          }
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de ? (
            <>
              <strong>0</strong> = nur „voller“ Abruf oben (weniger Last). <strong>3–15</strong> = zusätzlich nur
              Byte-Zähler in diesem Takt → flüssigere Live-Rate. Leer / neu = <strong>5</strong>.
            </>
          ) : (
            <>
              <strong>0</strong> = full refresh only. <strong>3–15</strong> = extra light counter poll for smoother
              live rate. Empty / new = <strong>5</strong>.
            </>
          )}
        </p>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Verlauf: Messpunkte' : 'History: sample cap'}
        </label>
        <input
          style={inp}
          type="number"
          min={16}
          max={120}
          value={Math.min(120, Math.max(16, Math.round(num(r.chartHistoryPoints)) || 48))}
          onChange={(e) =>
            onChange('chartHistoryPoints', Math.min(120, Math.max(16, Math.round(Number(e.target.value)) || 48)))
          }
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Maximale Anzahl gespeicherter Live-Messungen für die Grafik (16–120).'
            : 'Max stored live samples for the chart (16–120).'}
        </p>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
