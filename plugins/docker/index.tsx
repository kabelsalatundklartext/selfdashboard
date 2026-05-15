'use client'

import { GripVertical } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'docker',
  name: 'Docker',
  description:
    'Docker: kompakte Tabellenansicht oder klassische Zeile. Icons aus Container-Labels + optional CDN (walkxcode/dashboard-icons). Steuerung & Stats konfigurierbar.',
  version: '1.8.9',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🐳',
  iconUrl: '/plugin-logos/docker.png',
  defaultLayout: { w: 6, h: 5, minW: 4 },
  stackedExtraH: 2,
}

/** Messbare Tabellen-/Kachelbreite (px): engeres Padding, wenn darunter. */
const COMPACT_TABLE_NARROW_PX = 440
/**
 * Ab dieser messbaren Breite in der kompakten Tabelle Container-Namen automatisch zeigen,
 * wenn die Einstellung aus ist (z. B. Handy-Raster, aber breite Kachel — vermeidet „leere“ rechte Fläche).
 */
const COMPACT_TABLE_AUTO_NAMES_MIN_PX = 520

interface SdContainerStats {
  cpuPct: number | null
  memUsageBytes: number | null
  memLimitBytes: number | null
  memPct: number | null
}

interface DockerContainer {
  Id?: string
  Names?: string[]
  State?: string
  Status?: string
  Image?: string
  Labels?: Record<string, string>
  sdStats?: SdContainerStats | null
}

/** Einige Proxies/JSON liefern `id`/`state` statt `Id`/`State`. */
function dockerContainerId(c: DockerContainer): string {
  const o = c as Record<string, unknown>
  const raw = c.Id ?? o.id
  return typeof raw === 'string' ? raw.trim() : ''
}

function isDockerRunning(c: DockerContainer): boolean {
  const o = c as Record<string, unknown>
  const st = c.State ?? o.state
  return typeof st === 'string' && st.toLowerCase() === 'running'
}

type DockerAction = 'start' | 'stop' | 'restart'

type PendingConfirm = {
  id: string
  name: string
  action: DockerAction
  step: 1 | 2
}

function actionVerb(a: DockerAction): string {
  switch (a) {
    case 'start':
      return 'starten'
    case 'stop':
      return 'stoppen'
    case 'restart':
      return 'neu starten'
    default:
      return a
  }
}

function actionVerbEn(a: DockerAction): string {
  switch (a) {
    case 'start':
      return 'start'
    case 'stop':
      return 'stop'
    case 'restart':
      return 'restart'
    default:
      return a
  }
}

function actionNoun(a: DockerAction): string {
  switch (a) {
    case 'start':
      return 'Start'
    case 'stop':
      return 'Stopp'
    case 'restart':
      return 'Neustart'
    default:
      return a
  }
}

function actionNounEn(a: DockerAction): string {
  switch (a) {
    case 'start':
      return 'Start'
    case 'stop':
      return 'Stop'
    case 'restart':
      return 'Restart'
    default:
      return a
  }
}

function containerName(c: DockerContainer): string {
  const n = c.Names?.[0] ?? ''
  const id = dockerContainerId(c)
  return n.replace(/^\//, '') || (id ? id.slice(0, 12) : '—')
}

function sortContainers(a: DockerContainer, b: DockerContainer): number {
  const ar = isDockerRunning(a) ? 0 : 1
  const br = isDockerRunning(b) ? 0 : 1
  if (ar !== br) return ar - br
  return containerName(a).localeCompare(containerName(b), undefined, { sensitivity: 'base' })
}

/** Anzeige-Reihenfolge (Einstellung `listSort`); `custom` + `customContainerOrder` für manuelles Sortieren im Bearbeitungsmodus. */
type ListSortMode = 'default' | 'name' | 'cpu_desc' | 'cpu_asc' | 'mem_desc' | 'mem_asc' | 'custom'

function parseListSort(v: unknown): ListSortMode {
  if (v === 'name' || v === 'cpu_desc' || v === 'cpu_asc' || v === 'mem_desc' || v === 'mem_asc' || v === 'custom') return v
  return 'default'
}

/** Booleans aus Plugin-Config (Persist/Import kann `"true"` / `"1"` liefern). */
function cfgBool(v: unknown, ifMissing: boolean): boolean {
  if (v === undefined || v === null || v === '') return ifMissing
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  return ifMissing
}

function normalizeIdOrder(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim())
}

function applyCustomContainerOrder<T>(
  items: T[],
  customOrder: string[],
  getId: (t: T) => string,
  sortFallback: (a: T, b: T) => number,
): T[] {
  const map = new Map<string, T>()
  for (const t of items) {
    const id = getId(t)
    if (id) map.set(id, t)
  }
  const used = new Set<string>()
  const out: T[] = []
  for (const oid of customOrder) {
    let hit: T | undefined = map.get(oid)
    if (!hit) {
      for (const [kid, t] of map) {
        if (used.has(kid)) continue
        if (kid === oid || kid.startsWith(oid) || oid.startsWith(kid.slice(0, 12))) {
          hit = t
          break
        }
      }
    }
    if (hit) {
      const id = getId(hit)
      if (id && !used.has(id)) {
        out.push(hit)
        used.add(id)
      }
    }
  }
  const rest = items.filter((t) => {
    const id = getId(t)
    return id ? !used.has(id) : true
  })
  rest.sort(sortFallback)
  return [...out, ...rest]
}

function buildOrderedDockerList(items: DockerContainer[], listSort: ListSortMode, customOrder: string[]): DockerContainer[] {
  if (listSort === 'custom' && customOrder.length > 0) {
    return applyCustomContainerOrder(items, customOrder, dockerContainerId, sortContainers)
  }
  if (listSort === 'custom') {
    return applyDockerSort(items, 'default')
  }
  return applyDockerSort(items, listSort)
}

function dockerCpuPct(c: DockerContainer): number | null {
  const p = c.sdStats?.cpuPct
  return typeof p === 'number' && Number.isFinite(p) ? p : null
}

function dockerMemSortKey(c: DockerContainer): number | null {
  const b = c.sdStats?.memUsageBytes
  if (typeof b === 'number' && Number.isFinite(b) && b >= 0) return b
  const mp = c.sdStats?.memPct
  return typeof mp === 'number' && Number.isFinite(mp) && mp >= 0 ? mp : null
}

function applyDockerSort(arr: DockerContainer[], mode: ListSortMode): DockerContainer[] {
  const copy = arr.slice()
  if (mode === 'custom') {
    copy.sort(sortContainers)
    return copy
  }
  if (mode === 'default') {
    copy.sort(sortContainers)
    return copy
  }
  if (mode === 'name') {
    copy.sort((a, b) => containerName(a).localeCompare(containerName(b), undefined, { sensitivity: 'base' }))
    return copy
  }
  const desc = mode === 'cpu_desc' || mode === 'mem_desc'
  const useMem = mode === 'mem_desc' || mode === 'mem_asc'
  copy.sort((a, b) => {
    const va = useMem ? dockerMemSortKey(a) : dockerCpuPct(a)
    const vb = useMem ? dockerMemSortKey(b) : dockerCpuPct(b)
    if (va != null && vb != null && va !== vb) return desc ? vb - va : va - vb
    if (va != null && vb == null) return -1
    if (va == null && vb != null) return 1
    return sortContainers(a, b)
  })
  return copy
}

/** Volle Container-ID (API / Stats); gleiche Regel wie Server */
const CONTAINER_ID_RE = /^[a-f0-9]{8,128}$/i

function fmtBytesShort(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  const gib = bytes / 1024 ** 3
  if (gib >= 1) return `${gib < 10 ? gib.toFixed(1) : gib.toFixed(0)} GiB`
  const mib = bytes / 1024 ** 2
  return `${mib < 10 ? mib.toFixed(1) : mib.toFixed(0)} MiB`
}

function fmtCpuPct(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—'
  if (p < 10) return `${p.toFixed(1)} %`
  return `${Math.round(p)} %`
}

function statsLine(c: DockerContainer, running: boolean, showCpu: boolean, showRam: boolean): string | null {
  if (!running || (!showCpu && !showRam)) return null
  const s = c.sdStats
  const parts: string[] = []
  if (showCpu) {
    parts.push(`CPU ${fmtCpuPct(s?.cpuPct ?? null)}`)
  }
  if (showRam) {
    let ram = '—'
    if (s?.memUsageBytes != null && Number.isFinite(s.memUsageBytes)) {
      if (s.memLimitBytes != null && s.memLimitBytes > 0) {
        ram = `${fmtBytesShort(s.memUsageBytes)} / ${fmtBytesShort(s.memLimitBytes)}`
        if (s.memPct != null && Number.isFinite(s.memPct)) ram += ` (${s.memPct.toFixed(0)} %)`
      } else {
        ram = fmtBytesShort(s.memUsageBytes)
      }
    }
    parts.push(`RAM ${ram}`)
  }
  return parts.join(' · ')
}

function barFillPct(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function ramPercentForBar(s: SdContainerStats | null | undefined): number | null {
  if (!s) return null
  if (s.memPct != null && Number.isFinite(s.memPct)) return s.memPct
  if (s.memUsageBytes != null && s.memLimitBytes != null && s.memLimitBytes > 0) {
    return (s.memUsageBytes / s.memLimitBytes) * 100
  }
  return null
}

const HEAT_GREEN = '#22c55e'
const HEAT_AMBER = '#f59e0b'
const HEAT_RED = '#ef4444'

function heatColorForPct(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return 'var(--text-muted)'
  if (p < 12) return HEAT_GREEN
  if (p < 50) return HEAT_AMBER
  return HEAT_RED
}

function fmtMemoryCompact(s: SdContainerStats | null | undefined, running: boolean): string {
  if (!running) return '—'
  if (s?.memUsageBytes == null || !Number.isFinite(s.memUsageBytes)) return '—'
  return fmtBytesShort(s.memUsageBytes)
}

const IMAGE_EMOJI: Array<[string, string]> = [
  ['pihole', '🕳️'],
  ['pi-hole', '🕳️'],
  ['cloudflared', '☁️'],
  ['uptime-kuma', '📈'],
  ['uptime_kuma', '📈'],
  ['sonarr', '📺'],
  ['radarr', '🎬'],
  ['lidarr', '🎵'],
  ['prowlarr', '👁️'],
  ['bazarr', '💬'],
  ['ombi', '🍿'],
  ['plex', '▶️'],
  ['jellyfin', '🎞️'],
  ['emby', '🎞️'],
  ['immich', '🖼️'],
  ['nextcloud', '☁️'],
  ['mariadb', '🗄️'],
  ['postgres', '🐘'],
  ['mongo', '🍃'],
  ['redis', '⭕'],
  ['nginx', '🌊'],
  ['caddy', '🔒'],
  ['traefik', '🔀'],
  ['portainer', '🧰'],
  ['homepage', '🏠'],
  ['homarr', '📊'],
  ['grafana', '📈'],
  ['prometheus', '🔥'],
  ['nzbget', '📥'],
  ['sabnzbd', '📥'],
  ['ollama', '🦙'],
  ['qbittorrent', '🧲'],
  ['transmission', '📡'],
  ['deluge', '🌊'],
]

function serviceMark(image: string, displayName: string): { kind: 'emoji'; v: string } | { kind: 'letter'; letter: string; bg: string } {
  const base = (image.split(':')[0]?.split('@')[0] ?? '').toLowerCase()
  const slug = base.split('/').pop() ?? base
  for (const [k, emoji] of IMAGE_EMOJI) {
    if (slug.includes(k)) return { kind: 'emoji', v: emoji }
  }
  const raw = displayName.replace(/^\/+/, '').trim()
  const ch = (raw[0] || slug[0] || '?').toUpperCase()
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i) * (i + 1)) % 360
  const bg = `linear-gradient(135deg, hsl(${h} 52% 40%), hsl(${(h + 48) % 360} 48% 26%))`
  return { kind: 'letter', letter: ch, bg }
}

function fmtUpdatedAgo(ts: number | null, locale: Locale): string {
  if (ts == null) return ''
  const de = locale !== 'en'
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 8) return de ? 'Gerade aktualisiert' : 'Updated just now'
  if (sec < 60) return de ? `Vor ${sec}s aktualisiert` : `Updated ${sec}s ago`
  const m = Math.floor(sec / 60)
  if (m < 60) return de ? `Vor ${m} Min. aktualisiert` : `Updated ${m} min ago`
  const h = Math.floor(m / 60)
  return de ? `Vor ${h} Std. aktualisiert` : `Updated ${h}h ago`
}

function fmtCpuCompact(p: number | null | undefined, running: boolean): string {
  if (!running) return '—'
  if (p == null || !Number.isFinite(p)) return '—'
  if (p < 10) return `${p.toFixed(2)}%`
  if (p < 100) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
}

function stateBadgeLabel(state: string | undefined, locale: Locale): string {
  const s = (state ?? '').toLowerCase()
  const de = locale !== 'en'
  if (s === 'running') return de ? 'Aktiv' : 'Active'
  if (s === 'exited' || s === 'dead') return de ? 'Aus' : 'Off'
  if (s === 'paused') return de ? 'Pause' : 'Paused'
  if (s === 'restarting') return de ? 'Warte' : 'Wait'
  const raw = (state ?? '').trim()
  if (!raw) return de ? '?' : '?'
  return raw.length <= 7 ? raw : `${raw.slice(0, 6)}…`
}

function stateBadgeStyle(
  state: string | undefined,
  compact?: boolean,
  micro?: boolean,
  textOnly?: boolean,
): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: 600,
    fontSize: micro ? '6px' : compact ? '7px' : textOnly ? '9px' : '8px',
    letterSpacing: micro || compact || textOnly ? 0 : '0.02em',
    padding: textOnly ? 0 : micro ? '0 2px' : compact ? '1px 4px' : '2px 6px',
    borderRadius: textOnly ? 0 : micro ? '3px' : '4px',
    whiteSpace: 'nowrap',
    lineHeight: micro ? 1.05 : 1.2,
    textTransform: 'none',
    maxWidth: micro ? '100%' : undefined,
    boxSizing: 'border-box',
    background: textOnly ? 'transparent' : undefined,
  }
  const s = (state ?? '').toLowerCase()
  if (s === 'running') {
    return {
      ...base,
      background: textOnly ? 'transparent' : '#15803d',
      color: textOnly ? '#4ade80' : '#fff',
    }
  }
  if (s === 'exited' || s === 'dead') {
    return {
      ...base,
      background: textOnly ? 'transparent' : '#7f1d1d',
      color: textOnly ? '#f87171' : '#fecaca',
    }
  }
  if (s === 'paused') {
    return {
      ...base,
      background: textOnly ? 'transparent' : '#854d0e',
      color: textOnly ? '#fbbf24' : '#fef08a',
    }
  }
  return {
    ...base,
    background: textOnly ? 'transparent' : 'var(--border)',
    color: 'var(--text-muted)',
  }
}

const ACTION_ICON = '#b91c1c'

function IconStop({ disabled }: { disabled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: disabled ? 0.35 : 1 }}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill={ACTION_ICON} />
    </svg>
  )
}

function IconPlay({ disabled }: { disabled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden style={{ opacity: disabled ? 0.35 : 1 }}>
      <path d="M8 5v14l11-7z" fill={ACTION_ICON} />
    </svg>
  )
}

function IconRestart({ disabled: _disabled }: { disabled?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        color: ACTION_ICON,
        fontSize: '15px',
        fontWeight: 800,
        lineHeight: 1,
        opacity: _disabled ? 0.35 : 1,
        transform: 'scaleX(-1)',
      }}
    >
      ↻
    </span>
  )
}

function MiniBar({
  label,
  fillPct,
  tooltip,
  barColor,
}: {
  label: string
  fillPct: number
  tooltip: string
  barColor: string
}) {
  const track: React.CSSProperties = {
    width: 38,
    height: 5,
    background: 'var(--border)',
    borderRadius: 3,
    overflow: 'hidden',
    flexShrink: 0,
  }
  const fill: React.CSSProperties = {
    display: 'block',
    height: '100%',
    width: `${fillPct}%`,
    background: barColor,
    borderRadius: 3,
    transition: 'width 0.35s ease-out',
  }
  return (
    <span title={tooltip} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      <span style={{ fontSize: '7px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.02em', width: '1em', textAlign: 'right' }}>{label}</span>
      <span style={track}>
        <span style={fill} />
      </span>
    </span>
  )
}

function SettingsSectionTitle({ children }: { children: string }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: '0 0 6px' }}>
      {children}
    </p>
  )
}

function Heading({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 'clamp(9px, 2.4cqmin, 10px)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        margin: '0 0 8px',
      }}
    >
      {text}
    </p>
  )
}

/** PNGs from https://github.com/walkxcode/dashboard-icons (common dashboard icon set). */
const DASHBOARD_ICONS_PNG_BASE = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png'

/** Map image slug → CDN filename when repo name ≠ icon name. */
const ICON_SLUG_ALIASES: Record<string, string> = {
  adguardhome: 'adguard-home',
  immichserver: 'immich',
  'immich-server': 'immich',
  jdownloader2: 'jdownloader',
  'jdownloader-2': 'jdownloader',
  postgres: 'postgresql',
}

function buildLabelIconUrl(labels?: Record<string, string>): string | null {
  if (!labels) return null
  const keys = [
    'org.opencontainers.image.icon',
    'net.unraid.docker.icon',
    'traefik.icon',
    'org.label-schema.icon',
    'ICON',
    'com.docker.desktop.extension.api.icon',
  ]
  for (const k of keys) {
    const raw = labels[k]
    if (typeof raw !== 'string') continue
    const v = raw.trim()
    if (!v) continue
    if (/^https?:\/\//i.test(v)) return v
    if (/^data:image\//i.test(v)) return v
  }
  return null
}

function slugCandidatesFromImage(image: string): string[] {
  const raw = (image.split(':')[0]?.split('@')[0] ?? '').toLowerCase()
  const last = raw.split('/').pop()?.replace(/[^a-z0-9._-]/g, '') ?? 'docker'
  const dashed = last.replace(/_/g, '-')
  const set = new Set<string>()
  const add = (s: string) => {
    const t = s.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (t.length >= 2) set.add(t)
  }
  add(dashed)
  add(dashed.replace(/-server$/i, ''))
  add(dashed.replace(/^linuxserver-/, ''))
  const alias = ICON_SLUG_ALIASES[dashed.replace(/-/g, '')] ?? ICON_SLUG_ALIASES[dashed]
  if (alias) add(alias)
  if (set.size === 0) set.add('docker')
  return [...set].slice(0, 8)
}

function dashboardIconPngUrls(image: string): string[] {
  return slugCandidatesFromImage(image).map(
    (slug) => `${DASHBOARD_ICONS_PNG_BASE}/${encodeURIComponent(slug)}.png`,
  )
}

function letterHue(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 3)) % 360
  return h
}

function ContainerAvatar({
  image,
  name,
  labels,
  useDashboardIcons,
}: {
  image: string
  name: string
  labels?: Record<string, string>
  useDashboardIcons: boolean
}) {
  const labelUrl = useMemo(() => buildLabelIconUrl(labels), [labels])
  const cdnUrls = useMemo(() => dashboardIconPngUrls(image), [image])
  const mark = useMemo(() => serviceMark(image, name), [image, name])

  const [labelFailed, setLabelFailed] = useState(false)
  const [cdnIdx, setCdnIdx] = useState(0)

  useEffect(() => {
    setLabelFailed(false)
    setCdnIdx(0)
  }, [labelUrl, image, name, useDashboardIcons])

  const tryLabel = Boolean(labelUrl) && !labelFailed
  const tryCdn = useDashboardIcons && (!labelUrl || labelFailed) && cdnIdx < cdnUrls.length
  const remoteSrc = tryLabel ? labelUrl : tryCdn ? cdnUrls[cdnIdx] : null

  const onRemoteError = useCallback(() => {
    if (tryLabel) {
      setLabelFailed(true)
      return
    }
    setCdnIdx((i) => i + 1)
  }, [tryLabel])

  const box = (inner: React.ReactNode) => (
    <span
      aria-hidden
      style={{
        width: 24,
        height: 24,
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {inner}
    </span>
  )

  if (remoteSrc) {
    return box(
      <img
        key={remoteSrc}
        src={remoteSrc}
        alt=""
        width={24}
        height={24}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={onRemoteError}
        style={{
          width: 24,
          height: 24,
          objectFit: 'contain',
          display: 'block',
          background: 'color-mix(in srgb, var(--surface) 88%, var(--background))',
        }}
      />,
    )
  }

  if (mark.kind === 'emoji') {
    return box(
      <span style={{ fontSize: 14, lineHeight: 1, background: 'var(--surface)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {mark.v}
      </span>,
    )
  }

  const hue = letterHue(`${name}:${image}`)
  return box(
    <span
      style={{
        width: '100%',
        height: '100%',
        fontSize: 12,
        fontWeight: 800,
        color: '#fff',
        background: `hsl(${hue} 52% 44%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '-0.02em',
      }}
    >
      {mark.letter}
    </span>,
  )
}

type DockerTableCompactProps = {
  list: DockerContainer[]
  locale: Locale
  busyId: string | null
  pending: PendingConfirm | null
  useDashboardIcons: boolean
  /** false: nur Icon in der ersten Spalte (Name im Tooltip). Ab ca. 520 px messbarer Tabellenbreite werden Namen trotzdem eingeblendet. */
  showContainerNames: boolean
  showStatCpu: boolean
  showStatRam: boolean
  showBtnStart: boolean
  showBtnStop: boolean
  showBtnRestart: boolean
  btn: React.CSSProperties
  btnMuted: React.CSSProperties
  thStyle: React.CSSProperties
  tdCompact: React.CSSProperties
  iconAct: React.CSSProperties
  beginAction: (id: string, name: string, action: DockerAction) => void
  goSecondStep: () => void
  executeAction: () => Promise<void>
  cancelPending: () => void
  /** Bearbeitungsmodus: Zeilen per Drag umsortieren (speichert `listSort: custom` + `customContainerOrder`). */
  reorderEnabled?: boolean
  onReorderRows?: (dragId: string, dropId: string) => void
}

function DockerTableCompact({
  list,
  locale,
  busyId,
  pending,
  useDashboardIcons,
  showContainerNames,
  showStatCpu,
  showStatRam,
  showBtnStart,
  showBtnStop,
  showBtnRestart,
  btn,
  btnMuted,
  thStyle,
  tdCompact,
  iconAct,
  beginAction,
  goSecondStep,
  executeAction,
  cancelPending,
  reorderEnabled = false,
  onReorderRows,
}: DockerTableCompactProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)
  const [autoNamesByWidth, setAutoNamesByWidth] = useState(false)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const apply = () => {
      const w = el.getBoundingClientRect().width
      const nextNarrow = w > 0 && w < COMPACT_TABLE_NARROW_PX
      const nextAuto = w >= COMPACT_TABLE_AUTO_NAMES_MIN_PX
      setNarrow((prev) => (prev === nextNarrow ? prev : nextNarrow))
      setAutoNamesByWidth((prev) => (prev === nextAuto ? prev : nextAuto))
    }
    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [showContainerNames, showStatCpu, showStatRam, list.length])

  const de = locale !== 'en'
  const showNamesEffective = showContainerNames || autoNamesByWidth
  /** Icon-only homarr row: CPU/RAM fixed & adjacent (not only when widget is narrow). */
  const iconRow = !showNamesEffective
  const tightMetrics = iconRow && narrow

  const tdRow: React.CSSProperties = tightMetrics
    ? { ...tdCompact, padding: '1px 2px', fontSize: '10px' }
    : narrow
      ? { ...tdCompact, padding: '4px 5px', fontSize: '10px' }
      : iconRow
        ? { ...tdCompact, padding: '5px 4px' }
        : tdCompact
  const thDyn: React.CSSProperties = tightMetrics
    ? { ...thStyle, fontSize: '8px', letterSpacing: '0.03em', padding: '3px 2px' }
    : narrow
      ? { ...thStyle, fontSize: '8px', letterSpacing: '0.04em', padding: '5px 5px' }
      : thStyle
  /** Breite Icon-Zeile auf großen Kacheln: weniger X-Padding in der Kopfzeile. */
  const thRow: React.CSSProperties = iconRow && !narrow ? { ...thDyn, padding: '5px 4px' } : thDyn

  /** Icon-Zeile schmal: extraenge Spalten + `width:100%` — sonst Scrollbalken und Akt.-Spalte rechts weg. */
  const colWidths: readonly (string | null)[] = iconRow
    ? narrow
      ? ['44px', '40px', '34px', '38px', '44px']
      : ['64px', '52px', '42px', '50px', '46px']
    : narrow
      ? [null, '56px', '50px', '64px', '52px']
      : [null, '78px', '62px', '74px', '64px']

  const iconActBox: React.CSSProperties | null = iconRow
    ? {
        width: colWidths[4] as string,
        maxWidth: colWidths[4] as string,
        minWidth: colWidths[4] as string,
        boxSizing: 'border-box',
      }
    : null

  const headers = narrow
    ? showNamesEffective
      ? [de ? 'Name' : 'Name', de ? 'Status' : 'State', 'CPU', de ? 'Speicher' : 'Memory', de ? 'Aktionen' : 'Actions']
      : ['', de ? 'St.' : 'St.', 'CPU', de ? 'Sp.' : 'Mem.', de ? 'Akt.' : 'Act.']
    : showNamesEffective
      ? [de ? 'Name' : 'Name', de ? 'Status' : 'State', 'CPU', de ? 'Speicher' : 'Memory', de ? 'Aktionen' : 'Actions']
      : ['', de ? 'Status' : 'State', 'CPU', de ? 'Speicher' : 'Memory', de ? 'Aktionen' : 'Actions']

  const metricAlign: React.CSSProperties['textAlign'] = iconRow ? 'left' : 'right'
  const memAlign: React.CSSProperties['textAlign'] = iconRow ? 'left' : metricAlign

  /** Kein MinWidth bei Icon-Zeile: erzwang 300px, zerlegte Spalten + Scroll → Akt. unsichtbar. */
  const tableMinW = narrow && showNamesEffective ? 300 : 0

  const iconActEff: React.CSSProperties = tightMetrics || iconRow ? { ...iconAct, padding: '2px' } : iconAct
  const actionBtnGap = tightMetrics ? 1 : iconRow ? 3 : narrow ? 4 : 6

  /** Immer volle Kachelbreite — `max-content` ließ die Tabelle bei breiter Kachel links „kleben“. */
  const tableLayoutWidth: React.CSSProperties['width'] = '100%'

  return (
    <div ref={wrapRef} style={{ width: '100%', minWidth: 0, overflowX: tableMinW > 0 ? 'auto' : undefined }}>
      <table
        style={{
          width: tableLayoutWidth,
          maxWidth: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: tableMinW > 0 ? tableMinW : undefined,
        }}
      >
        <colgroup>
          {colWidths.map((w, idx) => (
            <col key={idx} style={w != null ? { width: w } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th style={thRow} title={!showNamesEffective ? (de ? 'Name (ausgeblendet)' : 'Name (hidden)') : undefined}>
              {headers[0] || '\u00a0'}
            </th>
            <th style={{ ...thRow, textAlign: iconRow ? 'left' : 'center' }}>{headers[1]}</th>
            <th style={{ ...thRow, textAlign: metricAlign, fontVariantNumeric: 'tabular-nums' }}>{headers[2]}</th>
            <th style={{ ...thRow, textAlign: memAlign, fontVariantNumeric: 'tabular-nums' }}>{headers[3]}</th>
            <th
              style={{
                ...thRow,
                textAlign: iconRow ? 'left' : tightMetrics ? 'left' : 'right',
                ...(iconActBox ?? {}),
              }}
            >
              {headers[4]}
            </th>
          </tr>
        </thead>
        <tbody>
          {list.flatMap((c, i) => {
            const name = containerName(c)
            const st = c.State ?? '—'
            const imgRef = (c.Image ?? '').split(':')[0]?.split('@')[0] ?? ''
            const running = isDockerRunning(c)
            const cid = dockerContainerId(c)
            const isBusy = cid !== '' && busyId === cid
            const isPendingHere = pending != null && cid !== '' && pending.id === cid
            const rowPending = isPendingHere ? pending : null
            const canStart = !running && showBtnStart
            const canStop = running && showBtnStop
            const canRestart = running && showBtnRestart
            const anyBtn = canStart || canStop || canRestart
            const showControls = Boolean(cid && (anyBtn || rowPending))
            const s = c.sdStats
            const cpuPct = s?.cpuPct ?? null
            const ramPct = ramPercentForBar(s)
            const memStr = fmtMemoryCompact(s, running)
            const tipParts = [name, st, (c.Status ?? '').trim(), imgRef]
            const tip = tipParts.filter(Boolean).join('\n')
            const zebra =
              i % 2 === 0
                ? 'color-mix(in srgb, var(--text) 5%, var(--background))'
                : 'color-mix(in srgb, var(--text) 2%, var(--background))'

            const avatar = (
              <ContainerAvatar image={c.Image ?? ''} name={name} labels={c.Labels} useDashboardIcons={useDashboardIcons} />
            )

            const dragRowProps =
              reorderEnabled && cid
                ? {
                    draggable: true,
                    onDragStart: (e: DragEvent<HTMLTableRowElement>) => {
                      e.stopPropagation()
                      e.dataTransfer.setData('text/plain', cid)
                      e.dataTransfer.effectAllowed = 'move'
                    },
                    onDragOver: (e: DragEvent<HTMLTableRowElement>) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.dataTransfer.dropEffect = 'move'
                    },
                    onDrop: (e: DragEvent<HTMLTableRowElement>) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const d = e.dataTransfer.getData('text/plain')
                      if (d && d !== cid && onReorderRows) onReorderRows(d, cid)
                    },
                  }
                : {}

            const mainRow = (
              <tr key={cid ?? `${name}-${i}`} style={{ background: zebra }} title={tip} {...dragRowProps}>
                <td style={{ ...tdRow, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: showNamesEffective ? 8 : 4,
                      minWidth: 0,
                      justifyContent: showNamesEffective ? undefined : 'center',
                    }}
                  >
                    {reorderEnabled && cid ? (
                      <span
                        style={{
                          cursor: 'grab',
                          flexShrink: 0,
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          lineHeight: 0,
                          paddingRight: 2,
                        }}
                        title={de ? 'Zeile ziehen zum Umsortieren' : 'Drag row to reorder'}
                      >
                        <GripVertical size={14} strokeWidth={2.2} />
                      </span>
                    ) : null}
                    <span title={!showNamesEffective ? name : undefined} style={{ flexShrink: 0 }}>
                      {avatar}
                    </span>
                    {showNamesEffective ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--text)',
                          flex: '1 1 auto',
                          minWidth: 0,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: 1.25,
                        }}
                      >
                        {name}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td
                  style={{
                    ...tdRow,
                    textAlign: iconRow ? 'left' : 'center',
                    minWidth: iconRow ? 0 : tightMetrics ? 42 : narrow ? 52 : 44,
                  }}
                >
                  <span style={stateBadgeStyle(st, narrow, tightMetrics, iconRow)} title={stateBadgeLabel(st, locale)}>
                    {stateBadgeLabel(st, locale)}
                  </span>
                </td>
                <td
                  style={{
                    ...tdRow,
                    textAlign: metricAlign,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    color: showStatCpu ? heatColorForPct(running ? cpuPct : null) : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    paddingLeft: iconRow ? 0 : undefined,
                    paddingRight: iconRow ? 0 : showNamesEffective ? 4 : undefined,
                  }}
                >
                  {showStatCpu ? fmtCpuCompact(cpuPct, running) : '—'}
                </td>
                <td
                  title={showStatRam ? memStr : undefined}
                  style={{
                    ...tdRow,
                    textAlign: memAlign,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                    color: showStatRam ? heatColorForPct(running ? ramPct : null) : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: iconRow && narrow ? 'hidden' : iconRow ? undefined : 'hidden',
                    textOverflow: iconRow && narrow ? 'ellipsis' : iconRow ? undefined : 'ellipsis',
                    paddingLeft: iconRow ? 0 : showNamesEffective ? 2 : undefined,
                    paddingRight: iconRow ? 0 : undefined,
                  }}
                >
                  {showStatRam ? memStr : '—'}
                </td>
                <td
                  style={{
                    ...tdRow,
                    textAlign: iconRow ? 'left' : tightMetrics ? 'left' : 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    ...(iconActBox ?? {}),
                  }}
                >
                  {!rowPending && showControls && anyBtn ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: iconRow ? 'flex-start' : tightMetrics ? 'flex-start' : 'flex-end',
                        gap: actionBtnGap,
                      }}
                    >
                      {canStop ? (
                        <button
                          type="button"
                          style={iconActEff}
                          title={de ? 'Container stoppen' : 'Stop container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'stop')
                          }}
                        >
                          <IconStop disabled={isBusy || pending != null} />
                        </button>
                      ) : null}
                      {canStart ? (
                        <button
                          type="button"
                          style={iconActEff}
                          title={de ? 'Container starten' : 'Start container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'start')
                          }}
                        >
                          <IconPlay disabled={isBusy || pending != null} />
                        </button>
                      ) : null}
                      {canRestart ? (
                        <button
                          type="button"
                          style={iconActEff}
                          title={de ? 'Container neu starten' : 'Restart container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'restart')
                          }}
                        >
                          <IconRestart disabled={isBusy || pending != null} />
                        </button>
                      ) : null}
                      {isBusy ? <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>…</span> : null}
                    </span>
                  ) : null}
                </td>
              </tr>
            )

            if (showControls && rowPending) {
              const confirmRow = (
                <tr key={`${cid ?? name}-confirm`} style={{ background: zebra }}>
                  <td
                    colSpan={5}
                    style={{ padding: '0 8px 10px', borderBottom: '1px solid color-mix(in srgb, var(--border) 85%, transparent)' }}
                  >
                    <div
                      style={{
                        fontSize: 'clamp(9px, 2.3cqmin, 11px)',
                        lineHeight: 1.4,
                        color: 'var(--text-muted)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                      }}
                    >
                      <p style={{ margin: '0 0 6px', color: 'var(--text)' }}>
                        {rowPending.step === 1 ? (
                          de ? (
                            <>
                              <strong>{name}</strong> wirklich {actionVerb(rowPending.action)}?{' '}
                              <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                            </>
                          ) : (
                            <>
                              Really <strong>{actionVerbEn(rowPending.action)}</strong> <strong>{name}</strong>?{' '}
                              <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                            </>
                          )
                        ) : de ? (
                          <>
                            Zweite Bestätigung: <strong>{actionNoun(rowPending.action)}</strong> für <strong>{name}</strong>.{' '}
                            <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                          </>
                        ) : (
                          <>
                            Second confirmation: <strong>{actionNounEn(rowPending.action)}</strong> for <strong>{name}</strong>.{' '}
                            <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                          </>
                        )}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <button type="button" style={btnMuted} onClick={cancelPending} disabled={isBusy}>
                          {de ? 'Abbrechen' : 'Cancel'}
                        </button>
                        {rowPending.step === 1 ? (
                          <button type="button" style={btn} onClick={goSecondStep} disabled={isBusy}>
                            {de ? 'Weiter' : 'Next'}
                          </button>
                        ) : (
                          <button type="button" style={btn} onClick={() => void executeAction()} disabled={isBusy}>
                            {de ? 'Ausführen' : 'Run'}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
              return [mainRow, confirmRow]
            }
            return [mainRow]
          })}
        </tbody>
      </table>
    </div>
  )
}

function Widget({ config, instanceId }: PluginWidgetProps) {
  const [list, setList] = useState<DockerContainer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  pendingRef.current = pending
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [lastFetchOk, setLastFetchOk] = useState<number | null>(null)
  const latestFetch = useRef(0)

  const showAll = cfgBool(config.showStopped, false)
  const r = config as Record<string, unknown>
  const compactTableView = cfgBool(r.homarrTable, true)
  const useDashboardIcons = cfgBool(r.useDashboardIcons, true)
  /** Default off in homarr table: icon + ST./CPU/SP./AKT. (like Pi-hole/Unraid compact row). */
  const showContainerNames = cfgBool(r.showContainerNames, false)
  const actionsOn = cfgBool(r.allowActions, true)
  const statsOn = cfgBool(r.showStats, true)
  const showBtnStart = actionsOn && cfgBool(r.showBtnStart, true)
  const showBtnStop = actionsOn && cfgBool(r.showBtnStop, true)
  const showBtnRestart = actionsOn && cfgBool(r.showBtnRestart, true)
  const showStatCpu = statsOn && cfgBool(r.showStatCpu, true)
  const showStatRam = statsOn && cfgBool(r.showStatRam, true)
  const showStatBars = statsOn && cfgBool(r.showStatBars, true)
  const fetchStats = showStatCpu || showStatRam
  const refresh = (Number(config.refreshInterval) || 15) * 1000
  const maxRows = Math.min(200, Math.max(5, Number(config.maxRows) || 80))
  const listSort = parseListSort(r.listSort)
  const customOrder = useMemo(() => normalizeIdOrder(r.customContainerOrder), [r.customContainerOrder])
  const customOrderKey = customOrder.join('|')
  const displayList = useMemo(
    () => buildOrderedDockerList(list, listSort, customOrder),
    [list, listSort, customOrderKey],
  )
  const locale = useDashboardStore((s) => s.locale) as Locale
  const editMode = useDashboardStore((s) => s.editMode)
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)
  const de = locale !== 'en'

  const onReorderRows = useCallback(
    (dragId: string, dropId: string) => {
      if (!dragId || !dropId || dragId === dropId) return
      const ids = displayList.map((c) => dockerContainerId(c)).filter(Boolean)
      const from = ids.indexOf(dragId)
      const to = ids.indexOf(dropId)
      if (from < 0 || to < 0) return
      const next = ids.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      updatePluginConfig(instanceId, { customContainerOrder: next, listSort: 'custom' })
    },
    [displayList, instanceId, updatePluginConfig],
  )

  const fetch_ = useCallback(async () => {
    const id = ++latestFetch.current
    let trimmed: DockerContainer[] = []
    const q = showAll ? 'all=1' : 'all=0'

    try {
      const res = await fetch(`/api/docker-containers?${q}`, { method: 'GET', cache: 'no-store' })
      const raw = await res.text()
      let data: unknown
      try {
        data = JSON.parse(raw) as unknown
      } catch {
        throw new Error(res.ok ? 'Ungültige JSON-Antwort' : `HTTP ${res.status}`)
      }
      if (!res.ok) {
        const err = (data as { error?: string })?.error
        throw new Error(err || `HTTP ${res.status}`)
      }
      if (!Array.isArray(data)) throw new Error('Unerwartetes Antwortformat')
      if (latestFetch.current !== id) return

      const sorted = buildOrderedDockerList(data as DockerContainer[], listSort, customOrder)
      trimmed = sorted.slice(0, maxRows)
      /** Phase-1 liefert keine sdStats — alte Werte kurz behalten, sonst flackern CPU/RAM bei jedem Poll */
      setList((prev) => {
        const keep = new Map<string, SdContainerStats | null>()
        for (const p of prev) {
          const pid = dockerContainerId(p)
          if (!pid || !isDockerRunning(p)) continue
          if (p.sdStats !== undefined) keep.set(pid, p.sdStats ?? null)
        }
        return trimmed.map((c) => {
          if (!isDockerRunning(c)) return { ...c, sdStats: null }
          const cid = dockerContainerId(c)
          if (cid && keep.has(cid)) return { ...c, sdStats: keep.get(cid)! }
          return { ...c }
        })
      })
      setError(null)
      setLastFetchOk(Date.now())
    } catch (e: unknown) {
      if (latestFetch.current === id) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      if (latestFetch.current === id) setLoading(false)
    }

    const mergeStatsFromGet = async () => {
      const res = await fetch(`/api/docker-containers?${q}&stats=1`, { method: 'GET', cache: 'no-store' })
      const raw = await res.text()
      if (latestFetch.current !== id) return
      let data: unknown
      try {
        data = JSON.parse(raw) as unknown
      } catch {
        return
      }
      if (!res.ok || !Array.isArray(data)) return
      const sorted = buildOrderedDockerList(data as DockerContainer[], listSort, customOrder)
      setList(sorted.slice(0, maxRows))
      setLastFetchOk(Date.now())
    }

    if (latestFetch.current !== id || !fetchStats || trimmed.length === 0) return

    const runningIds = [
      ...new Set(
        trimmed
          .filter((c) => isDockerRunning(c) && CONTAINER_ID_RE.test(dockerContainerId(c)))
          .map((c) => dockerContainerId(c)),
      ),
    ]
    if (runningIds.length === 0) return

    try {
      const res2 = await fetch('/api/docker-container-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: runningIds }),
        cache: 'no-store',
      })
      const raw2 = await res2.text()
      if (latestFetch.current !== id) return

      let data2: unknown
      try {
        data2 = raw2 ? (JSON.parse(raw2) as unknown) : null
      } catch {
        await mergeStatsFromGet()
        return
      }

      const statsMap = (data2 as { stats?: Record<string, SdContainerStats | null> }).stats
      const statsKeys =
        statsMap && typeof statsMap === 'object' ? Object.keys(statsMap as Record<string, unknown>) : []
      if (!res2.ok || statsKeys.length === 0) {
        await mergeStatsFromGet()
        return
      }

      setList((prev) =>
        buildOrderedDockerList(
          prev.map((c) => {
            const cid = dockerContainerId(c)
            if (!isDockerRunning(c) || !CONTAINER_ID_RE.test(cid)) {
              return { ...c, sdStats: null }
            }
            const statsRecord = statsMap as Record<string, SdContainerStats | null>
            let v: SdContainerStats | null | undefined = statsRecord[cid]
            if (v === undefined) {
              const hit = statsKeys.find((k) => k === cid || k.toLowerCase() === cid.toLowerCase())
              if (hit !== undefined) v = statsRecord[hit]
            }
            if (v !== undefined) {
              return { ...c, sdStats: v ?? null }
            }
            return c
          }),
          listSort,
          customOrder,
        ),
      )
      setLastFetchOk(Date.now())
    } catch {
      if (latestFetch.current === id) await mergeStatsFromGet()
    }
  }, [showAll, maxRows, fetchStats, listSort, customOrderKey])

  useEffect(() => {
    fetch_()
    const timer = setInterval(fetch_, refresh)
    return () => {
      clearInterval(timer)
      latestFetch.current++
    }
  }, [fetch_, refresh])

  const goSecondStep = useCallback(() => {
    setPending((cur) => (cur && cur.step === 1 ? { ...cur, step: 2 } : cur))
  }, [])

  const executeAction = useCallback(async () => {
    const p = pendingRef.current
    if (!p || p.step !== 2 || !p.id) return
    setBusyId(p.id)
    setActionError(null)
    try {
      const res = await fetch('/api/docker-containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, action: p.action }),
        cache: 'no-store',
      })
      const raw = await res.text()
      let data: unknown
      try {
        data = raw ? (JSON.parse(raw) as unknown) : null
      } catch {
        throw new Error(res.ok ? 'Ungültige JSON-Antwort' : `HTTP ${res.status}`)
      }
      if (!res.ok) {
        const err = (data as { error?: string })?.error
        throw new Error(err || `HTTP ${res.status}`)
      }
      setPending(null)
      await fetch_()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }, [fetch_])

  const cancelPending = useCallback(() => {
    setPending(null)
    setActionError(null)
  }, [])

  const beginAction = useCallback((id: string, name: string, action: DockerAction) => {
    setActionError(null)
    setPending({ id, name, action, step: 1 })
  }, [])

  const shell: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    padding: compactTableView ? 0 : '8px 12px 12px',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
  }

  const scrollBody: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: compactTableView ? 'auto' : 'hidden',
    padding: compactTableView ? '6px 10px 4px' : 0,
  }

  const btn: React.CSSProperties = {
    fontSize: 'clamp(9px, 2.2cqmin, 10px)',
    padding: '2px 7px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    lineHeight: 1.25,
    fontWeight: 600,
  }

  const btnMuted: React.CSSProperties = {
    ...btn,
    color: 'var(--text-muted)',
    fontWeight: 500,
  }

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ ...scrollBody, padding: compactTableView ? '10px 12px' : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[70, 55, 80, 50].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: '10px', width: `${w}%`, borderRadius: '3px' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            ...scrollBody,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '12px',
          }}
        >
        <span style={{ fontSize: '22px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', wordBreak: 'break-word' }}>{error}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
          {/EACCES|permission denied/i.test(error) ? (
            de ? (
              <>
                Typisch unter Unraid: Prozess im Container darf den Socket nicht öffnen — Template nutzt{' '}
                <code style={{ fontSize: '10px' }}>--group-add=281</code> (Docker-Gruppe). GID prüfen:{' '}
                <code style={{ fontSize: '10px' }}>stat -c %g /var/run/docker.sock</code>. Außerdem: Volume{' '}
                <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code> mounten. Neuere Images laufen als root.
              </>
            ) : (
              <>
                Common on Unraid: the container user cannot open the socket — add{' '}
                <code style={{ fontSize: '10px' }}>--group-add=281</code> (Docker group). Check GID:{' '}
                <code style={{ fontSize: '10px' }}>stat -c %g /var/run/docker.sock</code>. Also mount{' '}
                <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code>. Many images run as root.
              </>
            )
          ) : de ? (
            <>
              SelfDashboard braucht Zugriff auf <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code> (Volume-Mount). Nur dieselbe Seite wie das Dashboard (kein externes CORS).
            </>
          ) : (
            <>
              SelfDashboard needs access to <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code> (volume mount). Same origin as the dashboard (no external CORS).
            </>
          )}
        </p>
        </div>
      </div>
    )
  }

  const fs = 'clamp(9px, 2.6cqmin, 11px)'

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '6px 8px',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  const tdCompact: React.CSSProperties = {
    padding: '5px 8px',
    verticalAlign: 'middle',
    borderBottom: '1px solid color-mix(in srgb, var(--border) 85%, transparent)',
    fontSize: '11px',
    lineHeight: 1.3,
  }

  const iconAct: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
  }

  return (
    <div style={shell}>
      <div style={scrollBody}>
        {!compactTableView ? <Heading text={de ? `Docker · ${list.length}${showAll ? '' : ' laufend'}` : `Docker · ${list.length}${showAll ? '' : ' running'}`} /> : null}
        {actionError ? (
          <p style={{ fontSize: '10px', color: '#ef4444', margin: '0 0 8px', lineHeight: 1.4 }}>{actionError}</p>
        ) : null}
        {list.length === 0 ? (
          <p style={{ fontSize: fs, color: 'var(--text-muted)', margin: 0 }}>{de ? 'Keine Container in der Liste.' : 'No containers in the list.'}</p>
        ) : compactTableView ? (
          <DockerTableCompact
            list={displayList}
            locale={locale}
            busyId={busyId}
            pending={pending}
            useDashboardIcons={useDashboardIcons}
            showContainerNames={showContainerNames}
            showStatCpu={showStatCpu}
            showStatRam={showStatRam}
            showBtnStart={showBtnStart}
            showBtnStop={showBtnStop}
            showBtnRestart={showBtnRestart}
            btn={btn}
            btnMuted={btnMuted}
            thStyle={thStyle}
            tdCompact={tdCompact}
            iconAct={iconAct}
            beginAction={beginAction}
            goSecondStep={goSecondStep}
            executeAction={executeAction}
            cancelPending={cancelPending}
            reorderEnabled={editMode && displayList.length > 1}
            onReorderRows={onReorderRows}
          />
        ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {displayList.map((c, i) => {
            const name = containerName(c)
            const st = c.State ?? '—'
            const status = (c.Status ?? '').trim() || st
            const img = (c.Image ?? '').split(':')[0]?.split('@')[0] ?? ''
            const running = isDockerRunning(c)
            const tipParts = [name, st, status, img]
            const sl = statsLine(c, running, showStatCpu, showStatRam)
            if (sl) tipParts.push(sl)
            const tip = tipParts.filter(Boolean).join('\n')
            const cid = dockerContainerId(c)
            const isBusy = cid !== '' && busyId === cid
            const isPendingHere = pending != null && cid !== '' && pending.id === cid
            const rowPending = isPendingHere ? pending : null
            const canStart = !running && showBtnStart
            const canStop = running && showBtnStop
            const canRestart = running && showBtnRestart
            const anyBtn = canStart || canStop || canRestart
            const showControls = Boolean(cid !== '' && (anyBtn || rowPending))

            const showStatsInRow = running && fetchStats && (showStatCpu || showStatRam)
            const s = c.sdStats
            const cpuFill = running && showStatCpu ? barFillPct(s?.cpuPct ?? null) : 0
            const ramFill = running && showStatRam ? barFillPct(ramPercentForBar(s)) : 0
            const textStatsInline = showStatsInRow && !showStatBars ? statsLine(c, running, showStatCpu, showStatRam) : null
            const cpuBarTip = showStatCpu ? `CPU ${fmtCpuPct(s?.cpuPct ?? null)}` : ''
            const ramBarTip = showStatRam ? (statsLine(c, running, false, true) ?? 'RAM') : ''

            const reorderRow = editMode && displayList.length > 1 && !!cid
            const dragClassicProps = reorderRow
              ? {
                  draggable: true as const,
                  onDragStart: (e: DragEvent<HTMLLIElement>) => {
                    e.stopPropagation()
                    e.dataTransfer.setData('text/plain', cid)
                    e.dataTransfer.effectAllowed = 'move'
                  },
                  onDragOver: (e: DragEvent<HTMLLIElement>) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'move'
                  },
                  onDrop: (e: DragEvent<HTMLLIElement>) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const d = e.dataTransfer.getData('text/plain')
                    if (d && d !== cid) onReorderRows(d, cid)
                  },
                }
              : {}

            return (
              <li
                key={cid ?? `${name}-${i}`}
                {...dragClassicProps}
                title={tip}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: i < displayList.length - 1 ? '0 0 6px 0' : 0,
                  borderBottom: i < displayList.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px 6px',
                    width: '100%',
                    minWidth: 0,
                    fontSize: fs,
                    lineHeight: 1.35,
                    flexWrap: 'nowrap',
                  }}
                >
                  {reorderRow ? (
                    <span
                      style={{
                        cursor: 'grab',
                        flexShrink: 0,
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 0,
                      }}
                      title={de ? 'Ziehen zum Umsortieren' : 'Drag to reorder'}
                    >
                      <GripVertical size={14} strokeWidth={2.2} />
                    </span>
                  ) : null}
                  <span
                    style={{ color: running ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, width: '0.65em', textAlign: 'center', fontSize: '0.78em' }}
                    aria-hidden
                  >
                    {running ? '●' : '○'}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--text)',
                      flex: '0 1 32%',
                      minWidth: 0,
                      maxWidth: '40%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>:</span>
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      flex: '1 1 0%',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status}
                  </span>

                  {showStatsInRow ? (
                    <>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>:</span>
                      {showStatBars ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {showStatCpu ? <MiniBar label="C" fillPct={cpuFill} tooltip={cpuBarTip} barColor="var(--accent)" /> : null}
                          {showStatRam ? <MiniBar label="R" fillPct={ramFill} tooltip={ramBarTip} barColor="#5b9bd5" /> : null}
                        </span>
                      ) : textStatsInline ? (
                        <span
                          style={{
                            flex: '0 1 36%',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-muted)',
                            fontSize: 'clamp(8px, 2.2cqmin, 10px)',
                          }}
                          title={textStatsInline}
                        >
                          {textStatsInline}
                        </span>
                      ) : null}
                    </>
                  ) : null}

                  {!rowPending && showControls && anyBtn ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 'auto' }}>
                      {canStart ? (
                        <button
                          type="button"
                          style={btn}
                          title={de ? 'Container starten' : 'Start container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'start')
                          }}
                        >
                          Start
                        </button>
                      ) : null}
                      {canStop ? (
                        <button
                          type="button"
                          style={btn}
                          title={de ? 'Container stoppen' : 'Stop container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'stop')
                          }}
                        >
                          {de ? 'Stopp' : 'Stop'}
                        </button>
                      ) : null}
                      {canRestart ? (
                        <button
                          type="button"
                          style={btn}
                          title={de ? 'Container neu starten' : 'Restart container'}
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'restart')
                          }}
                        >
                          {de ? 'Neustart' : 'Restart'}
                        </button>
                      ) : null}
                      {isBusy ? (
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>…</span>
                      ) : null}
                    </span>
                  ) : null}
                </div>

                {showControls && rowPending ? (
                  <div
                    style={{
                      marginTop: 6,
                      paddingLeft: 'calc(0.65em + 6px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'clamp(9px, 2.3cqmin, 11px)',
                        lineHeight: 1.4,
                        color: 'var(--text-muted)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                      }}
                    >
                      <p style={{ margin: '0 0 6px', color: 'var(--text)' }}>
                        {rowPending.step === 1 ? (
                          de ? (
                            <>
                              <strong>{name}</strong> wirklich {actionVerb(rowPending.action)}? <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                            </>
                          ) : (
                            <>
                              Really <strong>{actionVerbEn(rowPending.action)}</strong> <strong>{name}</strong>?{' '}
                              <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                            </>
                          )
                        ) : de ? (
                          <>
                            Zweite Bestätigung: <strong>{actionNoun(rowPending.action)}</strong> für <strong>{name}</strong>.{' '}
                            <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                          </>
                        ) : (
                          <>
                            Second confirmation: <strong>{actionNounEn(rowPending.action)}</strong> for <strong>{name}</strong>.{' '}
                            <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                          </>
                        )}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <button type="button" style={btnMuted} onClick={cancelPending} disabled={isBusy}>
                          {de ? 'Abbrechen' : 'Cancel'}
                        </button>
                        {rowPending.step === 1 ? (
                          <button type="button" style={btn} onClick={goSecondStep} disabled={isBusy}>
                            {de ? 'Weiter' : 'Next'}
                          </button>
                        ) : (
                          <button type="button" style={btn} onClick={() => void executeAction()} disabled={isBusy}>
                            {de ? 'Ausführen' : 'Run'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
        )}
      </div>
      {compactTableView ? (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 12px',
            borderTop: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--surface) 90%, var(--background))',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span aria-hidden style={{ fontSize: '15px', lineHeight: 1 }}>
              🐳
            </span>
            <span>
              {de ? 'Gesamt' : 'Total'} {list.length} {list.length === 1 ? (de ? 'Container' : 'container') : de ? 'Container' : 'containers'}
            </span>
          </span>
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtUpdatedAgo(lastFetchOk, locale)}</span>
        </div>
      ) : null}
    </div>
  )
}

function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', cursor: 'pointer' }} onClick={onToggle}>
      <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>{label}</span>
      <div
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: on ? '18px' : '2px',
            width: '16px',
            height: '16px',
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
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
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

  const sub = (key: string, def = false) => cfgBool((config as Record<string, unknown>)[key], def)

  const r = config as Record<string, unknown>
  const actionsOn = cfgBool(r.allowActions, true)
  const statsOn = cfgBool(r.showStats, true)
  const compactTableOn = cfgBool(r.homarrTable, true)
  const dashboardIconsOn = cfgBool(r.useDashboardIcons, true)
  const btnStartOn = actionsOn && cfgBool(r.showBtnStart, true)
  const btnStopOn = actionsOn && cfgBool(r.showBtnStop, true)
  const btnRestartOn = actionsOn && cfgBool(r.showBtnRestart, true)
  const statCpuOn = statsOn && cfgBool(r.showStatCpu, true)
  const statRamOn = statsOn && cfgBool(r.showStatRam, true)
  const statBarsOn = statsOn && cfgBool(r.showStatBars, true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        {de ? (
          <>
            Daten kommen von <code style={{ fontSize: '10px' }}>/api/docker-containers</code> (Server liest{' '}
            <code style={{ fontSize: '10px' }}>{'/var/run/docker.sock'}</code>
            ). Beim Docker-/Unraid-Template den Socket als Volume einbinden.
          </>
        ) : (
          <>
            Data comes from <code style={{ fontSize: '10px' }}>/api/docker-containers</code> (server reads{' '}
            <code style={{ fontSize: '10px' }}>{'/var/run/docker.sock'}</code>
            ). Mount the socket in your Docker/Unraid template.
          </>
        )}
      </p>

      <ToggleRow
        label={
          de
            ? 'Kompakte Tabelle (Name · Status · CPU · Speicher · Aktionen)'
            : 'Compact table (name · state · CPU · memory · actions)'
        }
        on={compactTableOn}
        onToggle={() => onChange('homarrTable', !compactTableOn)}
      />

      <div style={{ opacity: compactTableOn ? 1 : 0.45, pointerEvents: compactTableOn ? 'auto' : 'none' }}>
        <ToggleRow
          label={
            de
              ? 'Namen in der Tabelle anzeigen (aus: nur Icon — ab ca. 520 px Kachelbreite trotzdem automatisch)'
              : 'Show names in table (off: icon only — auto when the tile is ~520px+ wide)'
          }
          on={sub('showContainerNames', false)}
          onToggle={() => onChange('showContainerNames', !sub('showContainerNames', false))}
        />
        <ToggleRow
          label={
            de
              ? 'Icons: Container-Labels + CDN (walkxcode/dashboard-icons)'
              : 'Icons: container labels + CDN (walkxcode/dashboard-icons)'
          }
          on={dashboardIconsOn}
          onToggle={() => onChange('useDashboardIcons', !dashboardIconsOn)}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
          {de ? (
            <>
              Unraid-Community-Templates setzen oft <code style={{ fontSize: '9px' }}>net.unraid.docker.icon</code>. Ohne CDN: nur Label-URL, Emoji oder Buchstabe-Kachel.
            </>
          ) : (
            <>
              Unraid community templates often set <code style={{ fontSize: '9px' }}>net.unraid.docker.icon</code>. Without CDN: label URL, emoji, or letter tile only.
            </>
          )}
        </p>
      </div>

      <div>
        <SettingsSectionTitle>{de ? 'Aktionen' : 'Actions'}</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label={de ? 'Buttons (Start / Stopp / Neustart)' : 'Buttons (start / stop / restart)'} on={actionsOn} onToggle={() => onChange('allowActions', !actionsOn)} />
          <div style={{ opacity: actionsOn ? 1 : 0.45, pointerEvents: actionsOn ? 'auto' : 'none' }}>
            <ToggleRow
              label={de ? 'Button: Start' : 'Button: start'}
              on={btnStartOn}
              onToggle={() => {
                if (!actionsOn) {
                  onChange('allowActions', true)
                  onChange('showBtnStart', true)
                  return
                }
                onChange('showBtnStart', !btnStartOn)
              }}
            />
            <ToggleRow
              label={de ? 'Button: Stopp' : 'Button: stop'}
              on={btnStopOn}
              onToggle={() => {
                if (!actionsOn) {
                  onChange('allowActions', true)
                  onChange('showBtnStop', true)
                  return
                }
                onChange('showBtnStop', !btnStopOn)
              }}
            />
            <ToggleRow
              label={de ? 'Button: Neustart' : 'Button: restart'}
              on={btnRestartOn}
              onToggle={() => {
                if (!actionsOn) {
                  onChange('allowActions', true)
                  onChange('showBtnRestart', true)
                  return
                }
                onChange('showBtnRestart', !btnRestartOn)
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <SettingsSectionTitle>{de ? 'Auslastung' : 'Usage'}</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label={de ? 'Docker-Stats (CPU / RAM)' : 'Docker stats (CPU / RAM)'} on={statsOn} onToggle={() => onChange('showStats', !statsOn)} />
          <div style={{ opacity: statsOn ? 1 : 0.45, pointerEvents: statsOn ? 'auto' : 'none' }}>
            <ToggleRow
              label={de ? 'CPU anzeigen' : 'Show CPU'}
              on={statCpuOn}
              onToggle={() => {
                if (!statsOn) {
                  onChange('showStats', true)
                  onChange('showStatCpu', true)
                  return
                }
                onChange('showStatCpu', !statCpuOn)
              }}
            />
            <ToggleRow
              label={de ? 'RAM anzeigen' : 'Show RAM'}
              on={statRamOn}
              onToggle={() => {
                if (!statsOn) {
                  onChange('showStats', true)
                  onChange('showStatRam', true)
                  return
                }
                onChange('showStatRam', !statRamOn)
              }}
            />
            <ToggleRow
              label={
                de
                  ? 'CPU/RAM als Balken (wie Unraid, sonst Text in der Zeile)'
                  : 'CPU/RAM as bars (Unraid-style; otherwise inline text)'
              }
              on={statBarsOn}
              onToggle={() => {
                if (!statsOn) {
                  onChange('showStats', true)
                  onChange('showStatBars', true)
                  return
                }
                onChange('showStatBars', !statBarsOn)
              }}
            />
          </div>
        </div>
      </div>

      <ToggleRow label={de ? 'Auch gestoppte Container' : 'Include stopped containers'} on={sub('showStopped')} onToggle={() => onChange('showStopped', !sub('showStopped'))} />
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 15} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Max. Zeilen' : 'Max rows'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={200}
          step={5}
          value={Number.isFinite(Number(config.maxRows)) ? Number(config.maxRows) : 80}
          onChange={(e) => onChange('maxRows', e.target.value === '' ? 80 : Number(e.target.value))}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Container-Reihenfolge' : 'Container order'}
        </label>
        <select
          style={{ ...inp, cursor: 'pointer' }}
          value={parseListSort(r.listSort)}
          onChange={(e) => onChange('listSort', e.target.value)}
        >
          <option value="default">{de ? 'Standard (laufend zuerst, dann Name)' : 'Default (running first, then name)'}</option>
          <option value="name">{de ? 'Nur Name (A–Z)' : 'Name only (A–Z)'}</option>
          <option value="cpu_desc">{de ? 'CPU (höchste zuerst)' : 'CPU (highest first)'}</option>
          <option value="cpu_asc">{de ? 'CPU (niedrigste zuerst)' : 'CPU (lowest first)'}</option>
          <option value="mem_desc">{de ? 'RAM (höchste zuerst)' : 'RAM (highest first)'}</option>
          <option value="mem_asc">{de ? 'RAM (niedrigste zuerst)' : 'RAM (lowest first)'}</option>
          <option value="custom">
            {de ? 'Manuell (im Bearbeitungsmodus Zeilen ziehen)' : 'Manual (drag rows in edit mode)'}
          </option>
        </select>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
          {de
            ? 'CPU/RAM nutzen die angezeigten Messwerte, wenn vorhanden; sonst wie „Standard“. Zum manuellen Sortieren Dashboard-Bearbeitung aktivieren, ⋮⋮-Griff ziehen — die Auswahl springt auf „Manuell“.'
            : 'CPU/RAM use live values when available; otherwise tie-break like “Default”. For manual order, enable dashboard edit mode and drag the ⋮⋮ handle — the dropdown switches to “Manual”.'}
        </p>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
