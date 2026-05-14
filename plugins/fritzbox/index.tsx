'use client'

import {
  ArrowDown,
  ArrowUp,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'fritzbox',
  name: 'Fritzbox Internet Verlauf',
  description:
    'WAN-Durchsatz-Verlauf per TR-064. Sprache und Y-Achsen-Maximum in den Einstellungen, sonst wie Dashboard bzw. automatisch aus den Messwerten.',
  version: '2.2.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '📈',
  defaultLayout: { w: 4, h: 7, minW: 3, minH: 5 },
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
      label: 'Zähler-Takt (Sek.)',
      type: 'number',
      defaultValue: 0,
      placeholder: '0 = nur „Aktualisieren“, 3–15 = öfter',
    },
    { key: 'insecureTls', label: 'HTTPS: selbstsigniert erlauben', type: 'boolean', defaultValue: false },
    {
      key: 'uiLanguage',
      label: 'Sprache (Anzeige)',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Wie Dashboard', value: 'auto' },
        { label: 'Deutsch', value: 'de' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      key: 'throughputChartHeightPx',
      label: 'Grafik-Höhe (px)',
      type: 'number',
      defaultValue: 168,
      placeholder: '80–220',
    },
    {
      key: 'throughputChartYMaxMbps',
      label: 'Y-Achse Maximum (Mbit/s)',
      type: 'number',
      defaultValue: 0,
      placeholder: '0 = automatisch aus Daten',
    },
    {
      key: 'chartHistoryPoints',
      label: 'Max. Messpunkte',
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

/** Texte im Plugin: fest DE/EN oder wie Dashboard (`auto`). */
function pluginDe(r: Record<string, unknown>, dashboardDe: boolean): boolean {
  const lang = str(r.uiLanguage).toLowerCase()
  if (lang === 'de') return true
  if (lang === 'en') return false
  return dashboardDe
}

function formatMbps(bps: number | null, de: boolean): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return '—'
  const mbps = bps / 1_000_000
  const s = mbps >= 100 ? String(Math.round(mbps)) : mbps.toFixed(1)
  return de ? `${s.replace('.', ',')} Mbit/s` : `${s} Mbit/s`
}

/** Obere Y-Achse in Mbit/s auf „schöne“ Stufe runden (5er/10er). */
function niceCeilMbpsFromBps(peakBps: number): number {
  const mb = peakBps / 1_000_000
  if (!Number.isFinite(mb) || mb <= 0) return 5
  const step = mb <= 40 ? 5 : mb <= 100 ? 10 : 25
  return Math.max(step, Math.ceil(mb / step) * step)
}

function mbpsTickList(maxMbps: number): number[] {
  let step = maxMbps <= 40 ? 5 : maxMbps <= 120 ? 10 : 25
  const build = (s: number) => {
    const out: number[] = []
    for (let v = maxMbps; v > 0; v -= s) out.push(v)
    out.push(0)
    return out
  }
  let out = build(step)
  while (out.length > 12) {
    step *= 2
    out = build(step)
  }
  return out
}

const FB_CHART_DL = '#3b82f6'
const FB_CHART_UL = '#22c55e'

function ThroughputStatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'linear-gradient(165deg, rgba(255,255,255,0.03) 0%, var(--surface-2) 50%, var(--surface-2) 100%)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
        <Icon size={14} strokeWidth={2.2} style={{ color, flexShrink: 0, opacity: 0.95 }} />
        <span style={{ fontWeight: 700, color, letterSpacing: '0.02em' }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 'clamp(15px, 2.2cqw, 20px)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--text)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ThroughputHistoryChart({
  history,
  current,
  de,
  chartHeightPx = 168,
  yMaxMbps = 0,
}: {
  history: { down: number; up: number }[]
  current: { down: number; up: number } | null
  de: boolean
  chartHeightPx?: number
  /** > 0: fester Skalen-Endwert in Mbit/s (Werte darüber werden am oberen Rand abgeschnitten). */
  yMaxMbps?: number
}) {
  const gid = useId().replace(/:/g, '')
  if (history.length < 2) return null
  const hPx = Math.min(220, Math.max(80, Math.round(chartHeightPx) || 168))

  const rawPeakBps = Math.max(1, ...history.flatMap((h) => [h.down, h.up]))
  const autoMaxMbps = niceCeilMbpsFromBps(rawPeakBps)
  const userRaw = Math.round(num(yMaxMbps))
  const maxMbps =
    userRaw > 0
      ? Math.min(2000, Math.max(5, niceCeilMbpsFromBps(userRaw * 1_000_000)))
      : autoMaxMbps
  const scaleBps = maxMbps * 1_000_000
  const ticks = mbpsTickList(maxMbps)

  const nHist = history.length
  const avgDownBps = nHist > 0 ? history.reduce((s, p) => s + p.down, 0) / nHist : 0
  const avgUpBps = nHist > 0 ? history.reduce((s, p) => s + p.up, 0) / nHist : 0
  const peakSeries =
    current && Number.isFinite(current.down) && Number.isFinite(current.up) ? [...history, current] : history
  const peakDownBps = peakSeries.length ? Math.max(0, ...peakSeries.map((p) => p.down)) : 0
  const peakUpBps = peakSeries.length ? Math.max(0, ...peakSeries.map((p) => p.up)) : 0

  const UW = 1000
  const UH = 100
  const xAt = (i: number) =>
    history.length <= 1 ? UW / 2 : (i / (history.length - 1)) * UW
  const yAt = (bps: number) => {
    const clamped = Math.min(Math.max(0, bps), scaleBps)
    return UH - (clamped / scaleBps) * UH
  }

  const downPts = history.map((p, i) => `${xAt(i)},${yAt(p.down)}`).join(' ')
  const upPts = history.map((p, i) => `${xAt(i)},${yAt(p.up)}`).join(' ')
  const downArea = `0,${UH} ${downPts} ${UW},${UH}`

  const fmtMbAxis = (mb: number) => {
    if (Number.isInteger(mb)) return String(mb)
    const s = mb.toFixed(1)
    return de ? s.replace('.', ',') : s
  }

  const scaleCapStr = `${fmtMbAxis(maxMbps)} Mb`

  const labelMuted: CSSProperties = {
    fontSize: '9px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.15,
  }

  const title = de ? 'DURCHSATZ-VERLAUF' : 'THROUGHPUT HISTORY'
  const liveDown = formatMbps(current?.down ?? null, de)
  const liveUp = formatMbps(current?.up ?? null, de)

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, var(--surface-2) 40%, var(--surface-2) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        padding: '8px 8px 10px',
        flexShrink: 0,
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 140px' }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', fontSize: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: FB_CHART_DL, fontWeight: 600 }}>
              <span style={{ width: '14px', height: '2px', background: FB_CHART_DL, borderRadius: '1px', flexShrink: 0 }} />
              Download
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: FB_CHART_UL, fontWeight: 600 }}>
              <span
                style={{
                  width: '14px',
                  height: 0,
                  borderTop: `2px dashed ${FB_CHART_UL}`,
                  flexShrink: 0,
                }}
              />
              Upload
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          <span style={{ color: FB_CHART_DL, whiteSpace: 'nowrap' }}>
            ↓ {liveDown}
          </span>
          <span style={{ color: FB_CHART_UL, whiteSpace: 'nowrap' }}>
            ↑ {liveUp}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', minHeight: `${hPx}px` }}>
        <div
          style={{
            flexShrink: 0,
            width: '52px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            textAlign: 'right',
            padding: '2px 0 1px',
            userSelect: 'none',
          }}
          aria-hidden
        >
          {ticks.map((mb) => (
            <span key={mb} style={labelMuted} title={formatMbps(mb * 1_000_000, de)}>
              {fmtMbAxis(mb)} Mb
            </span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
          <svg
            viewBox={`0 0 ${UW} ${UH}`}
            preserveAspectRatio="none"
            width="100%"
            height={hPx}
            style={{ display: 'block' }}
            aria-hidden
          >
            <defs>
              <linearGradient id={`fbDownFill-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FB_CHART_DL} stopOpacity="0.38" />
                <stop offset="100%" stopColor={FB_CHART_DL} stopOpacity="0.04" />
              </linearGradient>
            </defs>
            {ticks
              .filter((mb) => mb > 0)
              .map((mb) => (
                <line
                  key={`g-${mb}`}
                  x1={0}
                  y1={yAt(mb * 1_000_000)}
                  x2={UW}
                  y2={yAt(mb * 1_000_000)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="0.7"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            <line x1={0} y1={UH} x2={UW} y2={UH} stroke="rgba(255,255,255,0.1)" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
            <polygon points={downArea} fill={`url(#fbDownFill-${gid})`} stroke="none" />
            <polyline
              fill="none"
              stroke={FB_CHART_DL}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={downPts}
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              fill="none"
              stroke={FB_CHART_UL}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="5 4"
              points={upPts}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '2px',
          paddingLeft: '60px',
        }}
      >
        <span style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--text-muted)', opacity: 0.88 }}>
          {de ? 'älter ←  → neuer' : 'older ←  → newer'}
        </span>
        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {scaleCapStr}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
          marginTop: '4px',
        }}
      >
        <ThroughputStatPill
          icon={ArrowDown}
          label={de ? 'Download' : 'Download'}
          value={formatMbps(avgDownBps, de)}
          color={FB_CHART_DL}
        />
        <ThroughputStatPill
          icon={ArrowUp}
          label={de ? 'Upload' : 'Upload'}
          value={formatMbps(avgUpBps, de)}
          color={FB_CHART_UL}
        />
        <ThroughputStatPill
          icon={TrendingUp}
          label="Peak Down"
          value={formatMbps(peakDownBps, de)}
          color={FB_CHART_DL}
        />
        <ThroughputStatPill
          icon={TrendingUp}
          label="Peak Up"
          value={formatMbps(peakUpBps, de)}
          color={FB_CHART_UL}
        />
      </div>
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

function Widget({ config }: PluginWidgetProps) {
  const { de: dashboardDe } = usePluginLocale()
  const r = config as Record<string, unknown>
  const de = pluginDe(r, dashboardDe)
  const baseUrl = str(r.baseUrl)
  const username = str(r.username)
  const password = typeof r.password === 'string' ? String(r.password) : ''
  const insecureTls = r.insecureTls === true
  const refreshSec = (() => {
    const v = r.refreshSeconds
    if (v === undefined || v === null || v === '') return 30
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return 30
    return Math.min(300, Math.max(0, n))
  })()
  const liveInput = r.liveIntervalSeconds
  const liveEvery = (() => {
    if (liveInput === undefined || liveInput === null || liveInput === '') return 5
    const n = Math.round(Number(liveInput))
    if (!Number.isFinite(n)) return 5
    if (n <= 0) return 0
    return Math.min(15, Math.max(3, n))
  })()

  const chartCap = Math.min(120, Math.max(16, Math.round(num(r.chartHistoryPoints)) || 48))
  const chartHeightPx = Math.min(220, Math.max(80, Math.round(num(r.throughputChartHeightPx)) || 168))
  const chartYMaxMbps = Math.min(2000, Math.max(0, Math.round(num(r.throughputChartYMaxMbps))))

  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveBps, setLiveBps] = useState<{ down: number; up: number } | null>(null)
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
    if (refreshSec <= 0) return undefined
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
        padding: 'clamp(4px, 1cqmin, 8px)',
        display: 'flex',
        flexDirection: 'column',
        containerType: 'size',
        overflow: 'auto',
      }}
    >
      {error ? (
        <p style={{ margin: 0, fontSize: '11px', color: '#fb7185', textAlign: 'center', lineHeight: 1.4, padding: '8px' }}>{error}</p>
      ) : null}

      {data && !error ? (
        !data.wanTotalBytesReceived || !data.wanTotalBytesSent ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: muted,
              fontSize: '12px',
              textAlign: 'center',
              padding: '16px',
            }}
          >
            {de
              ? 'Byte-Zähler (WAN) werden von dieser Box/TR-064 nicht geliefert — keine Kurve möglich.'
              : 'Byte counters are not exposed for this router/TR-064 session — chart unavailable.'}
          </div>
        ) : bpsHistory.length >= 2 ? (
          <ThroughputHistoryChart
            history={bpsHistory}
            current={liveBps}
            de={de}
            chartHeightPx={chartHeightPx}
            yMaxMbps={chartYMaxMbps}
          />
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: '1px dashed var(--border)',
              color: muted,
              fontSize: '12px',
              textAlign: 'center',
              padding: '16px',
            }}
          >
            {loading
              ? de
                ? 'Lade…'
                : 'Loading…'
              : de
                ? 'Noch zu wenige Messpunkte für die Kurve. Kurz warten oder Zähler-Takt in den Einstellungen erhöhen.'
                : 'Not enough samples yet. Wait a moment or lower the refresh interval / enable counter poll.'}
          </div>
        )
      ) : !error && loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, fontSize: '12px' }}>
          {de ? 'Lade…' : 'Loading…'}
        </div>
      ) : null}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de: dashboardDe } = usePluginLocale()
  const r = config as Record<string, unknown>
  const de = pluginDe(r, dashboardDe)
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
  const refresh = (() => {
    const v = r.refreshSeconds
    if (v === undefined || v === null || v === '') return 30
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return 30
    return Math.min(300, Math.max(0, n))
  })()
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
            Nur der Internet-Durchsatz-Verlauf (WAN) aus den Byte-Zählern der FRITZ!Box. Zugriff per{' '}
            <strong>TR-064</strong> (Port <code style={{ fontSize: '10px' }}>49000</code> bei <code style={{ fontSize: '10px' }}>http</code>
            ) — der Abruf läuft über den SelfDashboard-Server.
          </>
        ) : (
          <>
            WAN throughput chart from FRITZ!Box byte counters via <strong>TR-064</strong> (port{' '}
            <code style={{ fontSize: '10px' }}>49000</code> for <code style={{ fontSize: '10px' }}>http</code>). Fetched through the
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
          {de ? 'Sprache (Anzeige)' : 'Display language'}
        </label>
        <select
          style={inp}
          value={(() => {
            const v = str(r.uiLanguage).toLowerCase()
            return v === 'de' || v === 'en' ? v : 'auto'
          })()}
          onChange={(e) => onChange('uiLanguage', e.target.value)}
        >
          <option value="auto">{de ? 'Wie Dashboard' : 'Match dashboard'}</option>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          {de ? 'Aktualisieren (Sekunden)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={0}
          max={300}
          value={refresh}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(0, Math.round(Number(e.target.value)) || 0)))}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de ? (
            <>
              <strong>0</strong> = kein periodischer Vollabruf (nur beim Öffnen des Dashboards). Für laufende Messpunkte{' '}
              <strong>Zähler-Takt</strong> nutzen. <strong>1–300</strong> = kompletter TR-064-Abruf alle N Sekunden.
            </>
          ) : (
            <>
              <strong>0</strong> = no periodic full refresh (only when the dashboard loads). Use <strong>Live counters</strong> for ongoing
              samples. <strong>1–300</strong> = full TR-064 poll every N seconds.
            </>
          )}
        </p>
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
              <strong>0</strong> = Messpunkte nur beim Intervall <strong>„Aktualisieren“</strong> (weniger Last).{' '}
              <strong>3–15</strong> = zusätzliche Abfrage der Zähler in diesem Takt (flüssigere Kurve). Ohne Wert intern{' '}
              <strong>5</strong> s.
            </>
          ) : (
            <>
              <strong>0</strong> = samples only on the <strong>Refresh</strong> interval (less load). <strong>3–15</strong> = poll counters
              every N seconds (smoother chart). If empty on old configs, the app uses <strong>5</strong>s internally.
            </>
          )}
        </p>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {de ? 'Grafik' : 'Chart'}
        </p>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'Plot-Höhe (px)' : 'Plot height (px)'}
          </label>
          <input
            style={inp}
            type="number"
            min={80}
            max={220}
            value={Math.min(220, Math.max(80, Math.round(num(r.throughputChartHeightPx)) || 168))}
            onChange={(e) =>
              onChange('throughputChartHeightPx', Math.min(220, Math.max(80, Math.round(Number(e.target.value)) || 168)))
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'Y-Achse Maximum (Mbit/s)' : 'Y-axis maximum (Mbit/s)'}
          </label>
          <input
            style={inp}
            type="number"
            min={0}
            max={2000}
            value={Math.min(2000, Math.max(0, Math.round(num(r.throughputChartYMaxMbps))))}
            onChange={(e) =>
              onChange('throughputChartYMaxMbps', Math.min(2000, Math.max(0, Math.round(Number(e.target.value)) || 0)))
            }
          />
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
            {de
              ? '0 = Skalenende automatisch aus den Daten. Sonst fester Maximalwert; höhere Messwerte werden oben abgeschnitten.'
              : '0 = scale top from data. Otherwise fixed top; higher samples are clipped at the top edge.'}
          </p>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'Max. Messpunkte' : 'Max samples'}
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
              ? '16–120: wie viele Werte für die Kurve gespeichert werden (längerer Verlauf = mehr Punkte).'
              : '16–120: how many samples are kept for the chart.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
