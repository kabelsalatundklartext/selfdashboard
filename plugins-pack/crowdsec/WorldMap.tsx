import { useId } from 'react'
import { MAP_W, MAP_H, WORLD_PATH, GRATICULE, COUNTRY_XY, projectNE1 } from './lib/worldMap'

export type AttackSeverity = 'crit' | 'warn' | 'info'

export interface WorldMapPoint {
  /** ISO-3166 alpha-2, e.g. "US", "DE". Used for the country-centroid fallback. */
  cc: string
  /** Exact GeoIP coordinates of the IP/city. When set, the marker sits here
   *  instead of the country centroid. */
  lon?: number
  lat?: number
  /** Alert/ban count — drives marker size. */
  count: number
  severity?: AttackSeverity
  /** Optional label shown next to the marker (e.g. "US 621"). */
  label?: string
}

interface WorldMapProps {
  points: WorldMapPoint[]
  /** "dots" = pulsing origin markers · "arcs" = animated arcs to homeCc. */
  mode?: 'dots' | 'arcs'
  /** Country the arcs point to (your server). Required for mode="arcs". */
  homeCc?: string
  /** Show the lat/long graticule. */
  graticule?: boolean
  /** Largest expected count — used to scale marker radius. */
  maxCount?: number
  className?: string
  style?: React.CSSProperties
}

const SEV_COLOR: Record<AttackSeverity, string> = {
  crit: 'var(--cs-crit, #ff5d6c)',
  warn: 'var(--cs-warn, #f6a623)',
  info: 'var(--cs-info, #7b6cf6)',
}

function radiusFor(count: number, maxCount: number): number {
  const ratio = maxCount > 0 ? count / maxCount : 0
  return Math.max(2.5, 2.5 + Math.sqrt(ratio) * 6.5)
}

/**
 * Renders an attack-origin world map from CrowdSec country counts.
 * Pure data + SVG — the projected path and per-country coordinates ship with
 * the plugin (see lib/worldMap.ts), so there are no runtime network calls.
 */
export function WorldMap({
  points,
  mode = 'dots',
  homeCc = 'DE',
  graticule = true,
  maxCount,
  className,
  style,
}: WorldMapProps) {
  const uid = useId().replace(/[:]/g, '')
  const resolvePos = (p: WorldMapPoint): [number, number] | null => {
    if (p.lon != null && p.lat != null && Number.isFinite(p.lon) && Number.isFinite(p.lat)) {
      return projectNE1(p.lon, p.lat)
    }
    return COUNTRY_XY[p.cc] ?? null
  }
  const known = points
    .map((p) => ({ p, xy: resolvePos(p) }))
    .filter((r): r is { p: WorldMapPoint; xy: [number, number] } => r.xy !== null)
  const max = maxCount ?? known.reduce((m, r) => Math.max(m, r.p.count), 0)
  const home = COUNTRY_XY[homeCc]
  const arcs = mode === 'arcs' && home

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      role="img"
      aria-label="Weltkarte der Angriffe nach Herkunftsland"
    >
      <defs>
        <linearGradient id={`csArcWarn-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={SEV_COLOR.warn} stopOpacity="0" />
          <stop offset="1" stopColor={SEV_COLOR.warn} />
        </linearGradient>
        <linearGradient id={`csArcCrit-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor={SEV_COLOR.crit} stopOpacity="0" />
          <stop offset="1" stopColor={SEV_COLOR.crit} />
        </linearGradient>
        <style>{`
          @keyframes csRing-${uid}{0%{r:4;opacity:.6}100%{r:24;opacity:0}}
          @keyframes csFlow-${uid}{to{stroke-dashoffset:-22}}
          .csRing-${uid}{animation:csRing-${uid} 2.8s ease-out infinite}
          .csArc-${uid}{stroke-dasharray:5 7;animation:csFlow-${uid} 1.5s linear infinite}
        `}</style>
      </defs>

      {graticule && (
        <path d={GRATICULE} fill="none" stroke="var(--cs-grat, rgba(123,108,246,.08))" strokeWidth={0.5} />
      )}
      <path
        d={WORLD_PATH}
        fill="var(--cs-land-fill, rgba(123,108,246,.08))"
        stroke="var(--cs-land-stroke, rgba(157,141,255,.32))"
        strokeWidth={0.5}
        strokeLinejoin="round"
      />

      {arcs &&
        known.map(({ p, xy: a }, i) => {
          if (p.cc === homeCc) return null
          const mx = (a[0] + home![0]) / 2
          const my = Math.min(a[1], home![1]) - Math.abs(a[0] - home![0]) * 0.18 - 20
          const crit = p.severity === 'crit'
          return (
            <path
              key={`arc-${p.cc}-${i}`}
              className={`csArc-${uid}`}
              d={`M${a[0]} ${a[1]} Q ${mx.toFixed(0)} ${my.toFixed(0)} ${home![0]} ${home![1]}`}
              fill="none"
              stroke={`url(#${crit ? `csArcCrit-${uid}` : `csArcWarn-${uid}`})`}
              strokeWidth={crit ? 1.6 : 1.3}
              opacity={crit ? 0.85 : 0.55}
            />
          )
        })}

      {known.map(({ p, xy }, i) => {
        const [x, y] = xy
        const r = radiusFor(p.count, max)
        const color = SEV_COLOR[p.severity ?? 'warn']
        const big = max > 0 && p.count / max > 0.4
        return (
          <g key={`pt-${p.cc}-${i}`}>
            {big && (
              <circle className={`csRing-${uid}`} cx={x} cy={y} fill="none" stroke={color} opacity={0.45} />
            )}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={color}
              fillOpacity={0.85}
              stroke="rgba(255,255,255,.35)"
              strokeWidth={0.6}
              style={{ filter: `drop-shadow(0 0 2px ${color})` }}
            />
            {p.label && (
              <text
                x={x + r + 5}
                y={y + 3}
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                fill="var(--cs-label, #9aa0c4)"
              >
                {p.label}
              </text>
            )}
          </g>
        )
      })}

      {arcs && home && (
        <g>
          <circle className={`csRing-${uid}`} cx={home[0]} cy={home[1]} fill="none" stroke="var(--cs-safe, #2ee6a6)" opacity={0.5} />
          <circle cx={home[0]} cy={home[1]} r={6} fill="var(--cs-safe, #2ee6a6)" style={{ filter: 'drop-shadow(0 0 8px var(--cs-safe, #2ee6a6))' }} />
        </g>
      )}
    </svg>
  )
}
