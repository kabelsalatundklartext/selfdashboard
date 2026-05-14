'use client'

import {
  ArrowDown,
  ArrowDownCircle,
  ArrowUp,
  ArrowUpCircle,
  Gauge,
  Globe,
  GripVertical,
  Router,
  TrendingUp,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'fritzbox',
  name: 'FRITZ!Box',
  description:
    'FRITZ!Box WAN: Kacheln sortieren (Bearbeiten), Verlauf mit Ø/Peak wie Referenz (blau/grün), Grafik-Höhe & Kachelgröße in den Einstellungen.',
  version: '1.4.0',
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
      label: 'Live-Zähler (Sek.)',
      type: 'number',
      defaultValue: 0,
      placeholder: '0 = aus, 3–15 = schneller',
    },
    { key: 'insecureTls', label: 'HTTPS: selbstsigniert erlauben', type: 'boolean', defaultValue: false },
    {
      key: 'headerCustomName',
      label: 'Anzeigename oben (optional)',
      type: 'text',
      defaultValue: '',
      placeholder: 'Leer = von der Box (Hersteller + Modell)',
    },
    {
      key: 'throughputChartHeightPx',
      label: 'Verlauf: Grafik-Höhe (px)',
      type: 'number',
      defaultValue: 168,
      placeholder: '80–220',
    },
    {
      key: 'tileSize',
      label: 'Kachelgröße',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Standard', value: 'default' },
        { label: 'Größer', value: 'large' },
      ],
    },
    {
      key: 'uiReorderTilesInEdit',
      label: 'Kacheln sortieren (nur Dashboard-Bearbeiten)',
      type: 'boolean',
      defaultValue: true,
    },
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

/** Obere Y-Achse in Mbit/s auf „schöne“ Stufe runden (5er/10er). */
function niceCeilMbpsFromBps(peakBps: number): number {
  const mb = peakBps / 1_000_000
  if (!Number.isFinite(mb) || mb <= 0) return 5
  const step = mb <= 40 ? 5 : mb <= 100 ? 10 : 25
  return Math.max(step, Math.ceil(mb / step) * step)
}

function mbpsTickList(maxMbps: number): number[] {
  let step = maxMbps <= 40 ? 5 : maxMbps <= 100 ? 10 : 25
  const build = (s: number) => {
    const out: number[] = []
    for (let v = maxMbps; v > 0; v -= s) out.push(v)
    out.push(0)
    return out
  }
  let out = build(step)
  if (out.length > 11) {
    step *= 2
    out = build(step)
  }
  return out
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

/** Sichtbarkeit Gerätename: neu `uiShowDeviceTitle`, sonst Alt `uiShowHeader`. */
function showDeviceTitleLine(r: Record<string, unknown>): boolean {
  if ('uiShowDeviceTitle' in r && r.uiShowDeviceTitle !== undefined) return cfgBool(r, 'uiShowDeviceTitle', true)
  return cfgBool(r, 'uiShowHeader', true)
}

/** Sichtbarkeit FRITZ!OS-Zeile: neu `uiShowFirmwareLine`, sonst Alt `uiShowHeader`. */
function showFirmwareLine(r: Record<string, unknown>): boolean {
  if ('uiShowFirmwareLine' in r && r.uiShowFirmwareLine !== undefined) return cfgBool(r, 'uiShowFirmwareLine', true)
  return cfgBool(r, 'uiShowHeader', true)
}

/** Standard-Reihenfolge: Internet volle Breite, Live-Down/Up eine Zeile darunter (2 Spalten). */
const FRITZ_TILE_IDS = [
  'internet',
  'liveDown',
  'liveUp',
  'publicIp',
  'maxDown',
  'maxUp',
  'hosts',
  'wan',
] as const

type FritzTileId = (typeof FRITZ_TILE_IDS)[number]

function normalizeFritzTileOrder(r: Record<string, unknown>): FritzTileId[] {
  const raw = r.fritzTileOrder
  const base = [...FRITZ_TILE_IDS]
  if (!Array.isArray(raw)) return base
  const seen = new Set<string>()
  const out: FritzTileId[] = []
  for (const x of raw) {
    if (typeof x === 'string' && FRITZ_TILE_IDS.includes(x as FritzTileId) && !seen.has(x)) {
      out.push(x as FritzTileId)
      seen.add(x)
    }
  }
  for (const id of FRITZ_TILE_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out
}

function swapFritzTiles(order: FritzTileId[], a: FritzTileId, b: FritzTileId): FritzTileId[] {
  if (a === b) return order
  const o = [...order]
  const i = o.indexOf(a)
  const j = o.indexOf(b)
  if (i < 0 || j < 0) return order
  ;[o[i], o[j]] = [o[j]!, o[i]!]
  return o
}

function fritzTileGridStyle(id: FritzTileId): CSSProperties {
  if (id === 'internet') return { gridColumn: '1 / -1' }
  return {}
}

function FritzTileSlot({
  id,
  reorder,
  de,
  onSwap,
  children,
}: {
  id: FritzTileId
  reorder: boolean
  de: boolean
  onSwap: (from: FritzTileId, onto: FritzTileId) => void
  children: ReactNode
}) {
  return (
    <div
      style={{ position: 'relative', minWidth: 0, ...fritzTileGridStyle(id) }}
      onDragOver={
        reorder
          ? (e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }
          : undefined
      }
      onDrop={
        reorder
          ? (e) => {
              e.preventDefault()
              const from = e.dataTransfer.getData('application/x-fritz-tile') as FritzTileId
              if (FRITZ_TILE_IDS.includes(from)) onSwap(from, id)
            }
          : undefined
      }
    >
      {reorder ? (
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation()
            e.dataTransfer.setData('application/x-fritz-tile', id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          title={de ? 'Ziehen und auf andere Kachel legen zum Tauschen' : 'Drag onto another tile to swap'}
          style={{
            position: 'absolute',
            left: '6px',
            top: '10px',
            zIndex: 2,
            cursor: 'grab',
            color: 'var(--text-muted)',
            lineHeight: 0,
            touchAction: 'none',
          }}
          role="presentation"
        >
          <GripVertical size={15} strokeWidth={2} />
        </div>
      ) : null}
      <div style={{ paddingLeft: reorder ? '20px' : '0', minWidth: 0 }}>{children}</div>
    </div>
  )
}

const FB_CHART_DL = '#3b82f6'
const FB_CHART_UL = '#22c55e'

function ThroughputStatPill({
  icon: Icon,
  label,
  valueStr,
  accent,
}: {
  icon: LucideIcon
  label: string
  valueStr: string
  accent: string
}) {
  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.22)',
        padding: '8px 8px 10px',
        minWidth: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', minWidth: 0 }}>
        <Icon size={13} strokeWidth={2.25} style={{ color: accent, flexShrink: 0 }} aria-hidden />
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="tabular-nums"
        style={{
          fontSize: 'clamp(12px, 3.1cqmin, 1rem)',
          fontWeight: 800,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.15,
        }}
      >
        {valueStr}
      </div>
    </div>
  )
}

function ThroughputHistoryChart({
  history,
  current,
  de,
  chartHeightPx = 168,
}: {
  history: { down: number; up: number }[]
  current: { down: number; up: number } | null
  de: boolean
  /** Sichtbare Plot-Höhe in px (Breite folgt Container). */
  chartHeightPx?: number
}) {
  const gid = useId().replace(/:/g, '')
  if (history.length < 2) return null
  const hPx = Math.min(220, Math.max(80, Math.round(chartHeightPx) || 168))
  const last = history[history.length - 1]!
  const downCur = current?.down ?? last.down
  const upCur = current?.up ?? last.up

  const n = history.length
  const sumDown = history.reduce((a, h) => a + h.down, 0)
  const sumUp = history.reduce((a, h) => a + h.up, 0)
  const avgDownBps = sumDown / n
  const avgUpBps = sumUp / n
  const peakDownBps = Math.max(...history.map((h) => h.down), downCur)
  const peakUpBps = Math.max(...history.map((h) => h.up), upCur)

  const rawPeakBps = Math.max(1, ...history.flatMap((h) => [h.down, h.up]), downCur, upCur)
  const maxMbps = niceCeilMbpsFromBps(rawPeakBps)
  const scaleBps = maxMbps * 1_000_000
  const ticks = mbpsTickList(maxMbps)

  const UW = 1000
  const UH = 100
  const xAt = (i: number) =>
    history.length <= 1 ? UW / 2 : (i / (history.length - 1)) * UW
  const yAt = (bps: number) => UH - (bps / scaleBps) * UH

  const downPts = history.map((p, i) => `${xAt(i)},${yAt(p.down)}`).join(' ')
  const upPts = history.map((p, i) => `${xAt(i)},${yAt(p.up)}`).join(' ')
  const downArea = `0,${UH} ${downPts} ${UW},${UH}`

  const fmtMbAxis = (mb: number) => {
    if (Number.isInteger(mb)) return String(mb)
    const s = mb.toFixed(1)
    return de ? s.replace('.', ',') : s
  }

  const curDownStr = formatMbps(downCur, de)
  const curUpStr = formatMbps(upCur, de)
  const avgDownStr = formatMbps(avgDownBps, de)
  const avgUpStr = formatMbps(avgUpBps, de)
  const peakDownStr = formatMbps(peakDownBps, de)
  const peakUpStr = formatMbps(peakUpBps, de)

  const labelMuted: CSSProperties = {
    fontSize: '9px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.15,
  }

  const scaleCapStr = de ? `${fmtMbAxis(maxMbps)} Mb` : `${fmtMbAxis(maxMbps)} Mb`

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: 'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, var(--surface-2) 40%, var(--surface-2) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        padding: '8px 10px 10px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: '8px 14px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            paddingTop: '2px',
          }}
        >
          {de ? 'Durchsatz-Verlauf' : 'Throughput history'}
        </span>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '14px 20px',
            flex: '1 1 160px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width={22} height={5} viewBox="0 0 22 5" aria-hidden style={{ flexShrink: 0 }}>
              <line x1={0} y1={2.5} x2={22} y2={2.5} stroke={FB_CHART_DL} strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>
              {de ? 'Download' : 'Download'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width={22} height={5} viewBox="0 0 22 5" aria-hidden style={{ flexShrink: 0 }}>
              <line
                x1={0}
                y1={2.5}
                x2={22}
                y2={2.5}
                stroke={FB_CHART_UL}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="4 3"
              />
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>
              {de ? 'Upload' : 'Upload'}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 14px',
            marginLeft: 'auto',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: FB_CHART_DL, fontVariantNumeric: 'tabular-nums' }}>
            ↓ {curDownStr}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: FB_CHART_UL, fontVariantNumeric: 'tabular-nums' }}>
            ↑ {curUpStr}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', minHeight: `${hPx}px` }}>
        <div
          style={{
            flexShrink: 0,
            width: '44px',
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
          marginTop: '6px',
          paddingLeft: '52px',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))',
          gap: '6px',
          marginTop: '10px',
        }}
      >
        <ThroughputStatPill
          icon={ArrowDown}
          label={de ? 'Ø Download' : 'Avg download'}
          valueStr={avgDownStr}
          accent={FB_CHART_DL}
        />
        <ThroughputStatPill
          icon={ArrowUp}
          label={de ? 'Ø Upload' : 'Avg upload'}
          valueStr={avgUpStr}
          accent={FB_CHART_UL}
        />
        <ThroughputStatPill
          icon={TrendingUp}
          label={de ? 'Peak Down' : 'Peak down'}
          valueStr={peakDownStr}
          accent={FB_CHART_DL}
        />
        <ThroughputStatPill
          icon={TrendingUp}
          label={de ? 'Peak Up' : 'Peak up'}
          valueStr={peakUpStr}
          accent={FB_CHART_UL}
        />
      </div>
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
  density = 'default',
  compact = false,
}: {
  label: string
  value: string
  tint: TintKey
  icon: LucideIcon
  footer?: ReactNode
  density?: 'default' | 'large'
  /** Schlankere Kachel (z. B. Internet-Zeile oben). */
  compact?: boolean
}) {
  const c = TINT[tint]
  const large = density === 'large'
  const tight = compact && !large
  return (
    <div
      style={{
        borderRadius: '12px',
        padding: tight ? '8px 10px 8px 12px' : large ? '12px 12px 12px 14px' : '10px 10px 10px 12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
        minHeight: tight ? 'clamp(48px, 12cqmin, 72px)' : large ? 'clamp(72px, 22cqmin, 104px)' : 'clamp(64px, 18cqmin, 88px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Icon size={large ? 15 : 13} strokeWidth={2.25} style={{ color: c.solid, flexShrink: 0, opacity: 0.95 }} aria-hidden />
        <span
          style={{
            fontSize: large ? 'clamp(10px, 2.3cqmin, 11px)' : 'clamp(9px, 2cqmin, 10px)',
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
          fontSize: large ? 'clamp(1.05rem, 5cqmin, 1.5rem)' : 'clamp(0.95rem, 4.5cqmin, 1.35rem)',
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

function Widget({ config, instanceId, editMode }: PluginWidgetProps) {
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
  const chartHeightPx = Math.min(220, Math.max(80, Math.round(num(r.throughputChartHeightPx)) || 168))
  const tileDensity = r.tileSize === 'large' ? 'large' : 'default'
  const allowReorder = editMode === true && cfgBool(r, 'uiReorderTilesInEdit', true)
  const tileOrder = useMemo(() => normalizeFritzTileOrder(r), [r.fritzTileOrder])

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

  const showDeviceTitle = showDeviceTitleLine(r)
  const showFw = showFirmwareLine(r)
  const customTitle = str(r.headerCustomName)
  const titleText =
    customTitle ||
    (data?.manufacturer && data?.modelName
      ? `${data.manufacturer} ${data.modelName}`
      : data?.modelName || 'FRITZ!Box')

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

  const onSwapTiles = useCallback(
    (from: FritzTileId, onto: FritzTileId) => {
      if (from === onto) return
      updatePluginConfig(instanceId, { fritzTileOrder: swapFritzTiles(tileOrder, from, onto) })
    },
    [instanceId, tileOrder, updatePluginConfig],
  )

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
        gap: '6px',
        containerType: 'size',
        overflow: 'auto',
      }}
    >
      {baseUrl ? (
        <>
          {showDeviceTitle || showFw ? (
            <div style={{ flexShrink: 0, minWidth: 0 }}>
              {showDeviceTitle ? (
                <p style={{ margin: 0, fontSize: 'clamp(10px, 2.4cqmin, 12px)', fontWeight: 700, color: text, lineHeight: 1.25 }}>
                  {titleText}
                </p>
              ) : null}
              {showFw ? (
                <p style={{ margin: showDeviceTitle ? '2px 0 0' : 0, fontSize: 'clamp(9px, 2cqmin, 11px)', color: muted }}>
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
              ) : null}
            </div>
          ) : null}
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
              gap: '6px',
              flex: '0 1 auto',
              alignContent: 'start',
              minHeight: 0,
            }}
          >
            {tileOrder.flatMap((id) => {
              const wrap = (node: ReactNode) => (
                <FritzTileSlot key={id} id={id} reorder={allowReorder} de={de} onSwap={onSwapTiles}>
                  {node}
                </FritzTileSlot>
              )
              const d = tileDensity
              switch (id) {
                case 'internet':
                  return showTileInternet
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Internet' : 'Internet'}
                            value={wanOk ? (de ? 'Verbunden' : 'Up') : de ? 'Prüfen' : 'Check'}
                            tint={wanOk ? 'emerald' : 'amber'}
                            icon={Wifi}
                            compact
                            density={d}
                            footer={
                              internetSubline ? (
                                <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{internetSubline}</span>
                              ) : data?.connectionStatus && !wanOk ? (
                                <span style={{ fontSize: '9px', color: muted, marginTop: '4px' }}>{data.connectionStatus}</span>
                              ) : null
                            }
                          />,
                        ),
                      ]
                    : []
                case 'publicIp':
                  return showTilePublicIp
                    ? [wrap(<Tile label={de ? 'Öffentliche IPv4' : 'Public IPv4'} value={data.externalIpv4 || '—'} tint="sky" icon={Globe} density={d} />)]
                    : []
                case 'maxDown':
                  return showTileMaxDown
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Download (max.)' : 'Download (max)'}
                            value={formatMbps(data.downstreamMaxBps, de)}
                            tint="violet"
                            icon={ArrowDownCircle}
                            density={d}
                          />,
                        ),
                      ]
                    : []
                case 'maxUp':
                  return showTileMaxUp
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Upload (max.)' : 'Upload (max)'}
                            value={formatMbps(data.upstreamMaxBps, de)}
                            tint="violet"
                            icon={ArrowUpCircle}
                            density={d}
                          />,
                        ),
                      ]
                    : []
                case 'liveDown':
                  return showTileLiveDown
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Download (live)' : 'Download (live)'}
                            value={liveDownStr}
                            tint="emerald"
                            icon={Gauge}
                            density={d}
                            footer={
                              <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{liveFooter}</span>
                            }
                          />,
                        ),
                      ]
                    : []
                case 'liveUp':
                  return showTileLiveUp
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Upload (live)' : 'Upload (live)'}
                            value={liveUpStr}
                            tint="emerald"
                            icon={Gauge}
                            density={d}
                            footer={
                              <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>{liveFooter}</span>
                            }
                          />,
                        ),
                      ]
                    : []
                case 'hosts':
                  return showTileHosts
                    ? [
                        wrap(
                          <Tile
                            label={de ? 'Heimnetz-Geräte' : 'LAN devices'}
                            value={data.hostCount != null && data.hostCount >= 0 ? String(data.hostCount) : '—'}
                            tint="amber"
                            icon={Users}
                            density={d}
                            footer={
                              <span style={{ fontSize: '9px', color: muted, marginTop: '4px', lineHeight: 1.25 }}>
                                {de ? 'laut Hosts-Tabelle' : 'per host table'}
                              </span>
                            }
                          />,
                        ),
                      ]
                    : []
                case 'wan':
                  return showTileWanDetails
                    ? [
                        wrap(
                          <Tile
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
                            density={d}
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
                          />,
                        ),
                      ]
                    : []
                default:
                  return []
              }
            })}
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
          {showThroughputChart ? (
            <ThroughputHistoryChart history={bpsHistory} current={liveBps} de={de} chartHeightPx={chartHeightPx} />
          ) : null}
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
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Minimum 15 s — 0 wäre Endlos-Abruf und würde Box und Server unnötig belasten.'
            : 'Minimum 15s — 0 would hammer the router and server in a tight loop.'}
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
              <strong>0</strong> = kein eigener Zähler-Takt: Live-Werte und Grafik folgen nur dem Intervall{' '}
              <strong>„Aktualisieren“</strong> (weniger Last auf FRITZ!Box und Server, dafür größere Sprünge).{' '}
              <strong>3–15</strong> = zusätzliche leichte Abfrage nur der Byte-Zähler in diesem Takt. Wenn das Feld bei{' '}
              <em>alten</em> Einträgen leer fehlt, nutzt die App intern <strong>5</strong> s.
            </>
          ) : (
            <>
              <strong>0</strong> = no extra counter poll: live tiles + chart only update on the <strong>Refresh</strong> interval
              (less load; choppier values). <strong>3–15</strong> = add a light counter poll every N seconds. If the value is
              missing on <em>legacy</em> configs, the app falls back to <strong>5</strong>s internally.
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
          gap: '14px',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {de ? 'Anzeige im Widget' : 'Widget display'}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
          {de
            ? 'Sichtbarkeit der Kacheln und des Verlaufs. Kachel-Reihenfolge: Dashboard bearbeiten, dann Kacheln per Griff tauschen (wenn aktiviert).'
            : 'Tile/chart visibility. Tile order: enable dashboard edit mode, then drag the grip to swap tiles (if enabled).'}
        </p>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px' }}>
            1. {de ? 'Name oben (Hersteller / Modell)' : 'Top title (vendor / model)'}
          </p>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'Eigener Anzeigename (optional)' : 'Custom title (optional)'}
          </label>
          <input
            style={inp}
            value={str(r.headerCustomName)}
            onChange={(e) => onChange('headerCustomName', e.target.value)}
            placeholder={de ? 'Leer = von der Box' : 'Empty = from device'}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>{de ? 'Gerätename-Zeile anzeigen' : 'Show device title line'}</span>
            <input
              type="checkbox"
              checked={showDeviceTitleLine(r)}
              onChange={() => onChange('uiShowDeviceTitle', !showDeviceTitleLine(r))}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer',
              marginTop: '6px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>{de ? 'FRITZ!OS-Zeile anzeigen' : 'Show FRITZ!OS line'}</span>
            <input
              type="checkbox"
              checked={showFirmwareLine(r)}
              onChange={() => onChange('uiShowFirmwareLine', !showFirmwareLine(r))}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
            />
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>{de ? 'Internet-Status-Kachel' : 'Internet status tile'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileInternet', true)}
            onChange={() => onChange('uiShowTileInternet', !cfgBool(r, 'uiShowTileInternet', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>2. {de ? 'Öffentliche IPv4' : 'Public IPv4'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTilePublicIp', true)}
            onChange={() => onChange('uiShowTilePublicIp', !cfgBool(r, 'uiShowTilePublicIp', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>3. {de ? 'Download (max.)' : 'Download (max)'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileMaxDown', true)}
            onChange={() => onChange('uiShowTileMaxDown', !cfgBool(r, 'uiShowTileMaxDown', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>3b. {de ? 'Upload (max.)' : 'Upload (max)'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileMaxUp', true)}
            onChange={() => onChange('uiShowTileMaxUp', !cfgBool(r, 'uiShowTileMaxUp', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>4. {de ? 'Download (live)' : 'Download (live)'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileLiveDown', true)}
            onChange={() => onChange('uiShowTileLiveDown', !cfgBool(r, 'uiShowTileLiveDown', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>4b. {de ? 'Upload (live)' : 'Upload (live)'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileLiveUp', true)}
            onChange={() => onChange('uiShowTileLiveUp', !cfgBool(r, 'uiShowTileLiveUp', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>5. {de ? 'Heimnetz-Geräte' : 'LAN devices'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileHosts', true)}
            onChange={() => onChange('uiShowTileHosts', !cfgBool(r, 'uiShowTileHosts', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>6. {de ? 'WAN-Details' : 'WAN details'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowTileWanDetails', true)}
            onChange={() => onChange('uiShowTileWanDetails', !cfgBool(r, 'uiShowTileWanDetails', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>{de ? 'Fußzeile (Uptime / UPnP)' : 'Footer (uptime / UPnP)'}</span>
          <input
            type="checkbox"
            checked={cfgBool(r, 'uiShowFooter', true)}
            onChange={() => onChange('uiShowFooter', !cfgBool(r, 'uiShowFooter', true))}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
          />
        </label>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px' }}>
            7. {de ? 'Durchsatz-Verlauf' : 'Throughput history'}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>{de ? 'Grafik anzeigen' : 'Show chart'}</span>
            <input
              type="checkbox"
              checked={cfgBool(r, 'uiShowThroughputChart', true)}
              onChange={() => onChange('uiShowThroughputChart', !cfgBool(r, 'uiShowThroughputChart', true))}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', flexShrink: 0 }}
            />
          </label>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            {de ? 'Max. Messpunkte im Verlauf' : 'Max history samples'}
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
              ? '16–120: wie viele Messungen für die Kurve gespeichert werden (mehr = längerer Verlauf, etwas mehr Speicher).'
              : '16–120: how many samples are kept for the chart.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
