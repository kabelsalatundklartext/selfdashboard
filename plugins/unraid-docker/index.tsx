'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { GripVertical } from 'lucide-react'
import { createClient } from 'graphql-ws'
import type { Locale } from '@/lib/i18n'
import { usePluginLocale } from '@/lib/pluginLocale'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid-docker',
  name: 'Unraid Docker',
  description:
    'Docker-Container über die Unraid GraphQL API (7.2+): Homarr-Tabelle oder klassische Zeile wie beim Docker-Plugin, zweistufige Aktions-Bestätigung, CDN-Icons, granulare CPU/RAM- und Button-Optionen, Live-Stats per WebSocket (optional).',
  version: '0.4.3',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🧱',
  /** Halbe Rasterbreite (6/12) wie typisches Docker-Widget; minW verhindert zu schmale Spalte. */
  defaultLayout: { w: 6, h: 5, minW: 4 },
}

const LIST_QUERY = `query SelfDashboardUnraidDocker($skipCache: Boolean!) {
  docker {
    id
    containers(skipCache: $skipCache) {
      id
      names
      state
      status
      image
      iconUrl
    }
  }
}`

const STATS_SUB = `subscription SelfDashboardDockerContainerStats {
  dockerContainerStats {
    id
    cpuPercent
    memUsage
    memPercent
    netIO
    blockIO
  }
}`

const M_START = `mutation SelfDashboardDockerStart($id: PrefixedID!) {
  docker { start(id: $id) { id names state } }
}`

const M_STOP = `mutation SelfDashboardDockerStop($id: PrefixedID!) {
  docker { stop(id: $id) { id names state } }
}`

const M_UNPAUSE = `mutation SelfDashboardDockerUnpause($id: PrefixedID!) {
  docker { unpause(id: $id) { id names state } }
}`

type ContainerStateGql = 'RUNNING' | 'EXITED' | 'PAUSED' | string

interface GqlContainer {
  id: string
  names: string[]
  state: ContainerStateGql
  status: string
  image: string
  iconUrl?: string | null
}

interface LiveStat {
  cpuPercent: number
  memUsage: string
  memPercent: number
}

/** Gleiche Heat-Skala wie `plugins/docker` (Homarr-Tabelle). */
const HEAT_GREEN = '#22c55e'
const HEAT_AMBER = '#f59e0b'
const HEAT_RED = '#ef4444'

function heatColorForPct(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return 'var(--text-muted)'
  if (p < 12) return HEAT_GREEN
  if (p < 50) return HEAT_AMBER
  return HEAT_RED
}

function graphqlWsUrl(base: string): string {
  const trimmed = base.replace(/\/$/, '')
  const root = trimmed.replace(/\/graphql\/?$/i, '')
  if (root.startsWith('https://')) return `wss://${root.slice(8)}/graphql`
  if (root.startsWith('http://')) return `ws://${root.slice(7)}/graphql`
  return `${root}/graphql`
}

function containerName(c: GqlContainer): string {
  const n = c.names?.[0] ?? ''
  const id = (c.id ?? '').trim()
  return n.replace(/^\//, '') || (id ? id.slice(0, 12) : '—')
}

function graphqlStateLower(state: ContainerStateGql | undefined): string {
  const s = (state ?? '').toString().trim().toLowerCase()
  if (s === 'running') return 'running'
  if (s === 'exited') return 'exited'
  if (s === 'paused') return 'paused'
  return s || 'unknown'
}

function isRunningState(state: ContainerStateGql | undefined): boolean {
  return String(state ?? '').toUpperCase() === 'RUNNING'
}

function isPausedState(state: ContainerStateGql | undefined): boolean {
  return String(state ?? '').toUpperCase() === 'PAUSED'
}

function sortContainers(a: GqlContainer, b: GqlContainer): number {
  const ar = isRunningState(a.state) ? 0 : isPausedState(a.state) ? 1 : 2
  const br = isRunningState(b.state) ? 0 : isPausedState(b.state) ? 1 : 2
  if (ar !== br) return ar - br
  return containerName(a).localeCompare(containerName(b), undefined, { sensitivity: 'base' })
}

type ListSortMode = 'default' | 'name' | 'cpu_desc' | 'cpu_asc' | 'mem_desc' | 'mem_asc' | 'custom'

function parseListSort(v: unknown): ListSortMode {
  if (v === 'name' || v === 'cpu_desc' || v === 'cpu_asc' || v === 'mem_desc' || v === 'mem_asc' || v === 'custom') return v
  return 'default'
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

function unraidCpuFromStats(c: GqlContainer, stats: Record<string, LiveStat>): number | null {
  const s = stats[c.id]
  const p = s?.cpuPercent
  return typeof p === 'number' && Number.isFinite(p) ? p : null
}

function unraidMemFromStats(c: GqlContainer, stats: Record<string, LiveStat>): number | null {
  const s = stats[c.id]
  const p = s?.memPercent
  return typeof p === 'number' && Number.isFinite(p) ? p : null
}

function applyUnraidSort(arr: GqlContainer[], mode: ListSortMode, stats: Record<string, LiveStat>): GqlContainer[] {
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
    const va = useMem ? unraidMemFromStats(a, stats) : unraidCpuFromStats(a, stats)
    const vb = useMem ? unraidMemFromStats(b, stats) : unraidCpuFromStats(b, stats)
    if (va != null && vb != null && va !== vb) return desc ? vb - va : va - vb
    if (va != null && vb == null) return -1
    if (va == null && vb != null) return 1
    return sortContainers(a, b)
  })
  return copy
}

function buildOrderedUnraidList(
  items: GqlContainer[],
  listSort: ListSortMode,
  customOrder: string[],
  stats: Record<string, LiveStat>,
): GqlContainer[] {
  if (listSort === 'custom' && customOrder.length > 0) {
    return applyCustomContainerOrder(items, customOrder, (c) => c.id.trim(), sortContainers)
  }
  if (listSort === 'custom') {
    return applyUnraidSort(items, 'default', stats)
  }
  return applyUnraidSort(items, listSort, stats)
}

function fmtCpuHomarr(p: number | null | undefined, running: boolean): string {
  if (!running) return '—'
  if (p == null || !Number.isFinite(p)) return '—'
  if (p < 10) return `${p.toFixed(2)}%`
  if (p < 100) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
}

/** Nur genutzter Speicher (vor „ / …“), eine Zeile wie beim Docker-Homarr. */
function fmtMemUsageCompact(raw: string | undefined): string {
  if (!raw?.trim()) return ''
  const t = raw.trim()
  const idx = t.indexOf(' / ')
  if (idx === -1) return t
  return t.slice(0, idx).trim()
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

function stateBadgeStyle(state: string | undefined, compact?: boolean, micro?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: 600,
    fontSize: micro ? '6px' : compact ? '7px' : '8px',
    letterSpacing: micro || compact ? 0 : '0.02em',
    padding: micro ? '0 2px' : compact ? '1px 4px' : '2px 6px',
    borderRadius: micro ? '3px' : '4px',
    whiteSpace: 'nowrap',
    lineHeight: micro ? 1.05 : 1.2,
    textTransform: 'none',
    maxWidth: micro ? '100%' : undefined,
    boxSizing: 'border-box',
  }
  const s = (state ?? '').toLowerCase()
  if (s === 'running') {
    return { ...base, background: '#15803d', color: '#fff' }
  }
  if (s === 'exited' || s === 'dead') {
    return { ...base, background: '#7f1d1d', color: '#fecaca' }
  }
  if (s === 'paused') {
    return { ...base, background: '#854d0e', color: '#fef08a' }
  }
  return { ...base, background: 'var(--border)', color: 'var(--text-muted)' }
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

type UnraidAction = 'start' | 'stop' | 'restart' | 'unpause'

type PendingConfirm = {
  id: string
  name: string
  action: UnraidAction
  step: 1 | 2
}

function actionVerb(a: UnraidAction): string {
  switch (a) {
    case 'start':
      return 'starten'
    case 'stop':
      return 'stoppen'
    case 'restart':
      return 'neu starten'
    case 'unpause':
      return 'fortsetzen'
    default:
      return a
  }
}

function actionVerbEn(a: UnraidAction): string {
  switch (a) {
    case 'start':
      return 'start'
    case 'stop':
      return 'stop'
    case 'restart':
      return 'restart'
    case 'unpause':
      return 'resume'
    default:
      return a
  }
}

function actionNoun(a: UnraidAction): string {
  switch (a) {
    case 'start':
      return 'Start'
    case 'stop':
      return 'Stopp'
    case 'restart':
      return 'Neustart'
    case 'unpause':
      return 'Fortsetzen'
    default:
      return a
  }
}

function actionNounEn(a: UnraidAction): string {
  switch (a) {
    case 'start':
      return 'Start'
    case 'stop':
      return 'Stop'
    case 'restart':
      return 'Restart'
    case 'unpause':
      return 'Resume'
    default:
      return a
  }
}

function barFillPct(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function statsLineUnraid(
  running: boolean,
  st: LiveStat | undefined,
  showCpu: boolean,
  showRam: boolean,
  memCompact: boolean,
): string | null {
  if (!running || (!showCpu && !showRam)) return null
  const parts: string[] = []
  if (showCpu) {
    parts.push(`CPU ${fmtCpuHomarr(st?.cpuPercent ?? null, true)}`)
  }
  if (showRam && st?.memUsage) {
    const raw = st.memUsage
    const ram = memCompact && raw.includes(' / ') ? fmtMemUsageCompact(raw) : raw
    parts.push(`RAM ${ram}`)
  }
  return parts.join(' · ')
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

const DASHBOARD_ICONS_PNG_BASE = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png'

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
  return Array.from(set).slice(0, 8)
}

function dashboardIconPngUrls(image: string): string[] {
  return slugCandidatesFromImage(image).map((slug) => `${DASHBOARD_ICONS_PNG_BASE}/${encodeURIComponent(slug)}.png`)
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

async function graphql<T>(
  baseUrl: string,
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(variables != null ? { query, variables } : { query }),
    cache: 'no-store',
  })
  const rawText = await res.text()
  let json: { data?: T; errors?: { message?: string }[] }
  try {
    json = JSON.parse(rawText) as typeof json
  } catch {
    throw new Error(res.ok ? 'Ungültige JSON-Antwort' : `HTTP ${res.status}`)
  }
  if (!res.ok) {
    const hint = json.errors?.map((e) => e.message).filter(Boolean).join('; ')
    throw new Error(hint || `HTTP ${res.status}`)
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message ?? 'GraphQL').join('; '))
  }
  if (!json.data) throw new Error('Leere GraphQL-Antwort')
  return json.data
}

function Widget({ config, instanceId }: PluginWidgetProps) {
  const { locale, de } = usePluginLocale()
  const url = String((config as Record<string, unknown>).url ?? '')
    .trim()
    .replace(/\/$/, '')
  const apiKey = String((config as Record<string, unknown>).apiKey ?? '').trim()
  const r = config as Record<string, unknown>
  const showStopped = r.showStopped === true
  const skipCache = r.skipCache === true
  const homarrTable = r.homarrTable !== false
  const useDashboardIcons = r.useDashboardIcons !== false
  const showContainerNames = r.showContainerNames !== false
  const memoryShowLimit = r.memoryShowLimit === true
  const actionsOn = r.allowActions !== false
  const liveStats = r.liveStats !== false
  const statsOn = r.showStats !== false
  const showBtnStart = actionsOn && r.showBtnStart !== false
  const showBtnStop = actionsOn && r.showBtnStop !== false
  const showBtnRestart = actionsOn && r.showBtnRestart !== false
  const showStatCpu = statsOn && r.showStatCpu !== false
  const showStatRam = statsOn && r.showStatRam !== false
  const showStatBars = statsOn && r.showStatBars !== false
  const wsEnabled = liveStats && (showStatCpu || showStatRam)
  const refresh = (Number(r.refreshInterval) || 15) * 1000
  const maxRows = Math.min(200, Math.max(5, Number(r.maxRows) || 80))
  const listSort = parseListSort(r.listSort)
  const customOrder = useMemo(() => normalizeIdOrder(r.customContainerOrder), [r.customContainerOrder])
  const customOrderKey = customOrder.join('|')

  const [list, setList] = useState<GqlContainer[]>([])
  const [statsById, setStatsById] = useState<Record<string, LiveStat>>({})
  const [statsErr, setStatsErr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  pendingRef.current = pending
  const [actionError, setActionError] = useState<string | null>(null)
  const [lastFetchOk, setLastFetchOk] = useState<number | null>(null)
  const latest = useRef(0)
  const layoutRef = useRef<HTMLDivElement>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)

  const editMode = useDashboardStore((s) => s.editMode)
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)

  const displayList = useMemo(
    () => buildOrderedUnraidList(list, listSort, customOrder, statsById),
    [list, listSort, customOrderKey, statsById],
  )

  const onReorderRows = useCallback(
    (dragId: string, dropId: string) => {
      if (!dragId || !dropId || dragId === dropId) return
      const ids = displayList.map((c) => c.id.trim()).filter(Boolean)
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
    if (!url || !apiKey) {
      setError(de ? 'URL und API-Key in den Einstellungen setzen.' : 'Set URL and API key in settings.')
      setLoading(false)
      return
    }
    const id = ++latest.current
    try {
      const data = await graphql<{ docker?: { containers?: GqlContainer[] } }>(url, apiKey, LIST_QUERY, {
        skipCache,
      })
      if (latest.current !== id) return
      const raw = data.docker?.containers
      if (!Array.isArray(raw)) throw new Error(de ? 'Unerwartetes Format' : 'Unexpected format')
      let rows = raw.filter((c) => c && typeof c.id === 'string')
      if (!showStopped) {
        rows = rows.filter((c) => String(c.state ?? '').toUpperCase() !== 'EXITED')
      }
      const sorted = buildOrderedUnraidList(rows, listSort, customOrder, {}).slice(0, maxRows)
      setList(sorted)
      setError(null)
      setLastFetchOk(Date.now())
    } catch (e: unknown) {
      if (latest.current === id) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      if (latest.current === id) setLoading(false)
    }
  }, [url, apiKey, showStopped, skipCache, maxRows, listSort, customOrderKey, de])

  useEffect(() => {
    setLoading(true)
    void fetch_()
    const t = setInterval(() => void fetch_(), refresh)
    return () => {
      clearInterval(t)
      latest.current++
    }
  }, [fetch_, refresh])

  useEffect(() => {
    if (!url || !apiKey || !wsEnabled) {
      setStatsErr(null)
      return
    }
    let disposed = false
    setStatsErr(null)
    const client = createClient({
      url: graphqlWsUrl(url),
      connectionParams: () => ({
        'x-api-key': apiKey,
        headers: { 'x-api-key': apiKey },
      }),
      lazy: false,
      retryAttempts: 5,
      shouldRetry: () => !disposed,
      on: {
        error: (err) => {
          if (!disposed) setStatsErr(err instanceof Error ? err.message : String(err))
        },
      },
    })

    const unsub = client.subscribe(
      { query: STATS_SUB },
      {
        next: (res) => {
          if (disposed) return
          const payload = res as { data?: { dockerContainerStats?: Partial<LiveStat> & { id: string } } }
          const row = payload.data?.dockerContainerStats
          if (!row || typeof row.id !== 'string') return
          const id = row.id
          const cpu = typeof row.cpuPercent === 'number' ? row.cpuPercent : Number(row.cpuPercent)
          const memP = typeof row.memPercent === 'number' ? row.memPercent : Number(row.memPercent)
          const memUsage = typeof row.memUsage === 'string' ? row.memUsage : '—'
          setStatsById((prev) => ({
            ...prev,
            [id]: {
              cpuPercent: Number.isFinite(cpu) ? cpu : 0,
              memUsage,
              memPercent: Number.isFinite(memP) ? memP : 0,
            },
          }))
        },
        error: (e) => {
          if (!disposed) setStatsErr(e instanceof Error ? e.message : String(e))
        },
        complete: () => {},
      },
    )

    return () => {
      disposed = true
      unsub()
      client.dispose()
    }
  }, [url, apiKey, wsEnabled])

  const runMutation = useCallback(
    async (mutation: string, cid: string) => {
      await graphql(url, apiKey, mutation, { id: cid })
    },
    [url, apiKey],
  )

  const goSecondStep = useCallback(() => {
    setPending((cur) => (cur && cur.step === 1 ? { ...cur, step: 2 } : cur))
  }, [])

  const cancelPending = useCallback(() => {
    setPending(null)
    setActionError(null)
  }, [])

  const executeAction = useCallback(async () => {
    const p = pendingRef.current
    if (!p || p.step !== 2 || !p.id.trim()) return
    setBusyId(p.id)
    setActionError(null)
    try {
      if (p.action === 'start') await runMutation(M_START, p.id)
      else if (p.action === 'unpause') await runMutation(M_UNPAUSE, p.id)
      else if (p.action === 'stop') await runMutation(M_STOP, p.id)
      else {
        await runMutation(M_STOP, p.id)
        await runMutation(M_START, p.id)
      }
      setPending(null)
      await fetch_()
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }, [runMutation, fetch_])

  const beginAction = useCallback((id: string, name: string, action: UnraidAction) => {
    setActionError(null)
    setPending({ id, name, action, step: 1 })
  }, [])

  useLayoutEffect(() => {
    const el = layoutRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const apply = () => {
      const w = el.getBoundingClientRect().width
      const next = w > 0 && w < 440
      setNarrow((prev) => (prev === next ? prev : next))
    }
    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [homarrTable, actionsOn, list.length])

  const shell: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    padding: homarrTable ? 0 : '8px 12px 12px',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
  }

  const scrollBody: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: homarrTable ? 'auto' : 'hidden',
    padding: homarrTable ? '6px 10px 4px' : 0,
  }

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

  if (!url || !apiKey) {
    return (
      <div style={{ ...shell, padding: '12px', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.55 }}>
        {de ? (
          <>
            {'URL & API-Key'}
            <br />
            wie beim Unraid-Widget eintragen.
          </>
        ) : (
          <>
            {'URL & API key'}
            <br />
            same as the Unraid widget.
          </>
        )}
      </div>
    )
  }

  if (loading && list.length === 0) {
    return (
      <div style={shell}>
        <div style={{ ...scrollBody, padding: homarrTable ? '10px 12px' : undefined }}>
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
        <div style={{ ...scrollBody, padding: '12px', color: '#ef4444', fontSize: '12px', lineHeight: 1.45 }}>
          {error}
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: '11px' }}>
            {de
              ? 'API-Key: Docker lesen/schreiben. WebSocket (wss/ws) muss zu Unraid erreichbar sein für Live-CPU/RAM.'
              : 'API key: Docker read/write. WebSocket (wss/ws) must reach Unraid for live CPU/RAM.'}
          </p>
        </div>
      </div>
    )
  }

  const col5 = actionsOn
  const tightMetrics = narrow && !showContainerNames

  const tdRow: React.CSSProperties = tightMetrics
    ? { ...tdCompact, padding: '2px 3px', fontSize: '10px' }
    : narrow
      ? { ...tdCompact, padding: '4px 5px', fontSize: '10px' }
      : tdCompact
  const thDyn: React.CSSProperties = tightMetrics
    ? { ...thStyle, fontSize: '8px', letterSpacing: '0.03em', padding: '4px 3px' }
    : narrow
      ? { ...thStyle, fontSize: '8px', letterSpacing: '0.04em', padding: '5px 5px' }
      : thStyle

  /** RAM column `null`: absorbs horizontal slack so the actions column stays narrow (see table-layout: fixed). */
  const colWidths: (string | null)[] = !showContainerNames
    ? col5
      ? narrow
        ? ['28px', '20%', '44px', null, '60px']
        : ['48px', '20%', '17%', '34%', '11%']
      : narrow
        ? ['28px', '24%', '48px', '48%']
        : ['52px', '22%', '20%', '46%']
    : narrow
      ? col5
        ? ['20%', '16%', '13%', '34%', '17%']
        : ['24%', '20%', '13%', '43%']
      : col5
        ? ['38%', '11%', '16%', '19%', '16%']
        : ['44%', '12%', '18%', '26%']

  const headRow: string[] = (() => {
    if (!col5) {
      if (narrow) {
        return showContainerNames
          ? [de ? 'Name' : 'Name', de ? 'St.' : 'St.', 'CPU', de ? 'Sp.' : 'Mem.']
          : ['', de ? 'St.' : 'St.', 'CPU', de ? 'Sp.' : 'Mem.']
      }
      return [de ? 'Name' : 'Name', de ? 'Status' : 'State', 'CPU', de ? 'Speicher' : 'Memory']
    }
    if (narrow) {
      return showContainerNames
        ? [de ? 'Name' : 'Name', de ? 'St.' : 'St.', 'CPU', de ? 'Sp.' : 'Mem.', de ? 'Akt.' : 'Act.']
        : ['', de ? 'St.' : 'St.', 'CPU', de ? 'Sp.' : 'Mem.', de ? 'Akt.' : 'Act.']
    }
    return [de ? 'Name' : 'Name', de ? 'Status' : 'State', 'CPU', de ? 'Speicher' : 'Memory', de ? 'Aktionen' : 'Actions']
  })()

  const metricAlign: React.CSSProperties['textAlign'] = tightMetrics ? 'left' : 'right'
  const memAlign: React.CSSProperties['textAlign'] = tightMetrics ? 'right' : metricAlign

  const tableMinW = !showContainerNames ? 228 : narrow ? 300 : 0

  const iconActEff: React.CSSProperties = tightMetrics ? { ...iconAct, padding: '2px' } : iconAct
  const actionBtnGap = tightMetrics ? 2 : narrow ? 4 : 6

  const fs = 'clamp(9px, 2.6cqmin, 11px)'
  const valuesLive = liveStats && (showStatCpu || showStatRam)
  const fetchStatsClassic = showStatCpu || showStatRam

  return (
    <div style={shell}>
      <div ref={layoutRef} style={scrollBody}>
        {!homarrTable ? (
          <Heading
            text={
              de
                ? `Unraid Docker · ${list.length}${showStopped ? '' : ' aktiv'}`
                : `Unraid Docker · ${list.length}${showStopped ? '' : ' active'}`
            }
          />
        ) : null}
        {actionError ? (
          <p style={{ fontSize: '10px', color: '#ef4444', margin: '0 0 8px', lineHeight: 1.4 }}>{actionError}</p>
        ) : null}
        {list.length === 0 ? (
          <p style={{ fontSize: fs, color: 'var(--text-muted)', margin: 0 }}>{de ? 'Keine Container in der Liste.' : 'No containers in the list.'}</p>
        ) : homarrTable ? (
          <div ref={tableWrapRef} style={{ width: '100%', minWidth: 0, overflowX: tableMinW ? 'auto' : undefined }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              minWidth: tableMinW || undefined,
            }}
          >
            <colgroup>
              {colWidths.map((w, idx) => (
                <col key={idx} style={w != null ? { width: w } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th style={thDyn} title={!showContainerNames ? (de ? 'Name (ausgeblendet)' : 'Name (hidden)') : undefined}>
                  {headRow[0] || '\u00a0'}
                </th>
                <th style={{ ...thDyn, textAlign: 'center' }}>{headRow[1]}</th>
                <th style={{ ...thDyn, textAlign: metricAlign, fontVariantNumeric: 'tabular-nums' }}>{headRow[2]}</th>
                <th style={{ ...thDyn, textAlign: memAlign, fontVariantNumeric: 'tabular-nums' }}>{headRow[3]}</th>
                {col5 ? (
                  <th
                    style={{
                      ...thDyn,
                      textAlign: tightMetrics ? 'left' : 'right',
                      ...(tightMetrics ? { width: '60px', maxWidth: '60px', minWidth: '60px', boxSizing: 'border-box' as const } : {}),
                    }}
                  >
                    {headRow[4]}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {displayList.flatMap((c, i) => {
                const name = containerName(c)
                const cid = c.id.trim()
                const running = isRunningState(c.state)
                const paused = isPausedState(c.state)
                const stLower = graphqlStateLower(c.state)
                const busy = busyId === cid
                const isPendingHere = pending != null && cid !== '' && pending.id === cid
                const rowPending = isPendingHere ? pending : null
                const canStart = !running && !paused && showBtnStart
                const canUnpause = paused && showBtnStart
                const canStop = (running || paused) && showBtnStop
                const canRestart = running && showBtnRestart
                const anyBtn = canStart || canUnpause || canStop || canRestart
                const showControls = Boolean(cid && (anyBtn || rowPending))
                const zebra =
                  i % 2 === 0
                    ? 'color-mix(in srgb, var(--text) 5%, var(--background))'
                    : 'color-mix(in srgb, var(--text) 2%, var(--background))'
                const st = statsById[cid]
                const cpuPct = st?.cpuPercent ?? null
                const memPct = st?.memPercent ?? null
                const memFull = running && st?.memUsage ? st.memUsage : '—'
                const memCell = memFull === '—' ? '—' : memoryShowLimit ? memFull : fmtMemUsageCompact(memFull)
                const memDisplay =
                  !showStatRam ? '—' : !running || !valuesLive ? '—' : memCell === '—' ? '—' : memCell
                const iconSrc = (c.iconUrl ?? '').trim()
                const tip = [name, c.state, (c.status ?? '').trim(), (c.image ?? '').split(':')[0]].filter(Boolean).join('\n')

                const dragTrProps =
                  editMode && displayList.length > 1 && cid
                    ? {
                        draggable: true as const,
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
                          if (d && d !== cid) onReorderRows(d, cid)
                        },
                      }
                    : {}

                const mainRow = (
                  <tr key={cid || `${name}-${i}`} style={{ background: zebra }} title={tip} {...dragTrProps}>
                    <td style={{ ...tdRow, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: showContainerNames ? 8 : 4,
                          minWidth: 0,
                          justifyContent: showContainerNames ? undefined : 'center',
                        }}
                      >
                        {editMode && displayList.length > 1 && cid ? (
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
                        <span title={!showContainerNames ? name : undefined} style={{ flexShrink: 0 }}>
                          {iconSrc ? (
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
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={iconSrc}
                                alt=""
                                width={24}
                                height={24}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                style={{
                                  width: 24,
                                  height: 24,
                                  objectFit: 'contain',
                                  display: 'block',
                                  background: 'color-mix(in srgb, var(--surface) 88%, var(--background))',
                                }}
                              />
                            </span>
                          ) : (
                            <ContainerAvatar image={c.image ?? ''} name={name} useDashboardIcons={useDashboardIcons} />
                          )}
                        </span>
                        {showContainerNames ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
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
                        textAlign: 'center',
                        minWidth: tightMetrics ? 42 : narrow ? 52 : 44,
                      }}
                    >
                      <span style={stateBadgeStyle(stLower, narrow, tightMetrics)} title={stateBadgeLabel(stLower, locale)}>
                        {stateBadgeLabel(stLower, locale)}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdRow,
                        textAlign: metricAlign,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: showStatCpu && valuesLive && running ? heatColorForPct(cpuPct) : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        paddingLeft: tightMetrics ? 2 : undefined,
                        paddingRight: tightMetrics ? 4 : undefined,
                      }}
                    >
                      {showStatCpu ? (valuesLive ? fmtCpuHomarr(cpuPct, running) : '—') : '—'}
                    </td>
                    <td
                      style={{
                        ...tdRow,
                        textAlign: memAlign,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color:
                          showStatRam && valuesLive && running && memDisplay !== '—' ? heatColorForPct(memPct) : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: tightMetrics ? undefined : 'hidden',
                        textOverflow: tightMetrics ? undefined : 'ellipsis',
                        paddingLeft: tightMetrics ? 2 : undefined,
                        paddingRight: tightMetrics ? (memAlign === 'right' ? 2 : 4) : undefined,
                      }}
                      title={memFull}
                    >
                      {memDisplay}
                    </td>
                    {col5 ? (
                      <td
                        style={{
                          ...tdRow,
                          textAlign: tightMetrics ? 'left' : 'right',
                          whiteSpace: 'nowrap',
                          overflow: 'visible',
                          ...(tightMetrics ? { width: '60px', maxWidth: '60px', minWidth: '60px', boxSizing: 'border-box' as const } : {}),
                        }}
                      >
                        {!rowPending && showControls && anyBtn ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: tightMetrics ? 'flex-start' : 'flex-end',
                              gap: actionBtnGap,
                            }}
                          >
                            {canStart ? (
                              <button
                                type="button"
                                style={iconActEff}
                                title={de ? 'Start' : 'Start'}
                                disabled={busy || pending != null}
                                onClick={() => beginAction(cid, name, 'start')}
                              >
                                <IconPlay disabled={busy || pending != null} />
                              </button>
                            ) : null}
                            {canUnpause ? (
                              <button
                                type="button"
                                style={iconActEff}
                                title={de ? 'Fortsetzen' : 'Resume'}
                                disabled={busy || pending != null}
                                onClick={() => beginAction(cid, name, 'unpause')}
                              >
                                <IconPlay disabled={busy || pending != null} />
                              </button>
                            ) : null}
                            {running || paused ? (
                              <>
                                {canStop ? (
                                  <button
                                    type="button"
                                    style={iconActEff}
                                    title={de ? 'Stopp' : 'Stop'}
                                    disabled={busy || pending != null}
                                    onClick={() => beginAction(cid, name, 'stop')}
                                  >
                                    <IconStop disabled={busy || pending != null} />
                                  </button>
                                ) : null}
                                {canRestart ? (
                                  <button
                                    type="button"
                                    style={iconActEff}
                                    title={de ? 'Neustart' : 'Restart'}
                                    disabled={busy || pending != null}
                                    onClick={() => beginAction(cid, name, 'restart')}
                                  >
                                    <IconRestart disabled={busy || pending != null} />
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                            {busy ? <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>…</span> : null}
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                )

                if (showControls && rowPending) {
                  const spanCols = col5 ? 5 : 4
                  const confirmRow = (
                    <tr key={`${cid || name}-confirm`} style={{ background: zebra }}>
                      <td
                        colSpan={spanCols}
                        style={{
                          padding: '0 8px 10px',
                          borderBottom: '1px solid color-mix(in srgb, var(--border) 85%, transparent)',
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
                            <button type="button" style={btnMuted} onClick={cancelPending} disabled={busy}>
                              {de ? 'Abbrechen' : 'Cancel'}
                            </button>
                            {rowPending.step === 1 ? (
                              <button type="button" style={btn} onClick={goSecondStep} disabled={busy}>
                                {de ? 'Weiter' : 'Next'}
                              </button>
                            ) : (
                              <button type="button" style={btn} onClick={() => void executeAction()} disabled={busy}>
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
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
            {displayList.map((c, i) => {
              const name = containerName(c)
              const cid = c.id.trim()
              const running = isRunningState(c.state)
              const paused = isPausedState(c.state)
              const status = (c.status ?? '').trim() || String(c.state ?? '')
              const img = (c.image ?? '').split(':')[0]?.split('@')[0] ?? ''
              const st = statsById[cid]
              const tipParts = [name, String(c.state ?? ''), status, img]
              const sl = statsLineUnraid(running, st, showStatCpu, showStatRam, !memoryShowLimit)
              if (sl) tipParts.push(sl)
              const tip = tipParts.filter(Boolean).join('\n')
              const isBusy = cid !== '' && busyId === cid
              const isPendingHere = pending != null && cid !== '' && pending.id === cid
              const rowPending = isPendingHere ? pending : null
              const canStart = !running && !paused && showBtnStart
              const canUnpause = paused && showBtnStart
              const canStop = (running || paused) && showBtnStop
              const canRestart = running && showBtnRestart
              const anyBtn = canStart || canUnpause || canStop || canRestart
              const showControls = Boolean(cid !== '' && (anyBtn || rowPending))
              const showStatsInRow = running && fetchStatsClassic && (showStatCpu || showStatRam)
              const cpuFill = running && showStatCpu && valuesLive ? barFillPct(st?.cpuPercent ?? null) : 0
              const ramFill = running && showStatRam && valuesLive ? barFillPct(st?.memPercent ?? null) : 0
              const textStatsInline = showStatsInRow && !showStatBars ? statsLineUnraid(running, st, showStatCpu, showStatRam, !memoryShowLimit) : null
              const cpuBarTip = showStatCpu ? `CPU ${fmtCpuHomarr(st?.cpuPercent ?? null, true)}` : ''
              const ramBarTip = showStatRam ? (statsLineUnraid(running, st, false, true, !memoryShowLimit) ?? 'RAM') : ''

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
                  key={cid || `${name}-${i}`}
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
                      style={{
                        color: running ? 'var(--accent)' : 'var(--text-muted)',
                        flexShrink: 0,
                        width: '0.65em',
                        textAlign: 'center',
                        fontSize: '0.78em',
                      }}
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
                            onClick={() => beginAction(cid, name, 'start')}
                          >
                            Start
                          </button>
                        ) : null}
                        {canUnpause ? (
                          <button
                            type="button"
                            style={btn}
                            title={de ? 'Fortsetzen' : 'Resume'}
                            disabled={isBusy || pending != null}
                            onClick={() => beginAction(cid, name, 'unpause')}
                          >
                            {de ? 'Fortsetzen' : 'Resume'}
                          </button>
                        ) : null}
                        {canStop ? (
                          <button
                            type="button"
                            style={btn}
                            title={de ? 'Container stoppen' : 'Stop container'}
                            disabled={isBusy || pending != null}
                            onClick={() => beginAction(cid, name, 'stop')}
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
                            onClick={() => beginAction(cid, name, 'restart')}
                          >
                            {de ? 'Neustart' : 'Restart'}
                          </button>
                        ) : null}
                        {isBusy ? <span style={{ fontSize: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>…</span> : null}
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
      {homarrTable ? (
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
            🧱
          </span>
          <span>
            {de ? 'Gesamt' : 'Total'} {list.length}{' '}
            {list.length === 1 ? (de ? 'Container' : 'container') : de ? 'Container' : 'containers'}
          </span>
        </span>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'right' }}>
          {wsEnabled ? statsErr || fmtUpdatedAgo(lastFetchOk, locale) : de ? 'Live-Stats aus' : 'Live stats off'}
        </span>
      </div>
      ) : null}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const r = config as Record<string, unknown>
  const inp: React.CSSProperties = useMemo(
    () => ({
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      color: 'var(--text)',
      borderRadius: '6px',
      padding: '6px 10px',
      fontSize: '13px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    }),
    [],
  )

  const sub = (key: string, def = false) => {
    const v = (config as Record<string, unknown>)[key]
    if (v === undefined || v === null) return def
    return v === true
  }

  const actionsOn = r.allowActions !== false
  const statsOn = r.showStats !== false
  const homarrOn = r.homarrTable !== false
  const dashboardIconsOn = r.useDashboardIcons !== false
  const liveOn = r.liveStats !== false
  const btnStartOn = actionsOn && r.showBtnStart !== false
  const btnStopOn = actionsOn && r.showBtnStop !== false
  const btnRestartOn = actionsOn && r.showBtnRestart !== false
  const statCpuOn = statsOn && r.showStatCpu !== false
  const statRamOn = statsOn && r.showStatRam !== false
  const statBarsOn = statsOn && r.showStatBars !== false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        {de
          ? 'Gleiche Funktionsoptionen wie beim Docker-Plugin: Homarr-Tabelle oder klassische Zeile, Icons (CDN), zweistufige Aktions-Bestätigung, CPU/RAM-Steuerung. Daten kommen von Unraid GraphQL + optional WebSocket-Stats.'
          : 'Same feature set as the Docker plugin: Homarr table or classic row, icons (CDN), two-step action confirmation, CPU/RAM toggles. Data from Unraid GraphQL plus optional WebSocket stats.'}
      </p>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          {de ? 'Unraid-Basis-URL' : 'Unraid base URL'}
        </label>
        <input style={inp} value={String(r.url ?? '')} onChange={(e) => onChange('url', e.target.value)} placeholder="https://tower oder http://192.168.1.10" />
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>API Key</label>
        <input style={inp} type="password" value={String(r.apiKey ?? '')} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="x-api-key" />
      </div>

      <ToggleRow
        label={
          de
            ? 'Homarr-Tabellenansicht (Name · Status · CPU · Speicher · Aktionen)'
            : 'Homarr table view (name · state · CPU · memory · actions)'
        }
        on={homarrOn}
        onToggle={() => onChange('homarrTable', !homarrOn)}
      />

      <div style={{ opacity: homarrOn ? 1 : 0.45, pointerEvents: homarrOn ? 'auto' : 'none' }}>
        <ToggleRow
          label={
            de
              ? 'Namen in der Tabelle anzeigen (aus: nur Icon, Name im Tooltip)'
              : 'Show names in table (off: icon only, name in tooltip)'
          }
          on={sub('showContainerNames', true)}
          onToggle={() => onChange('showContainerNames', !sub('showContainerNames', true))}
        />
        <ToggleRow
          label={
            de
              ? 'Icons: Unraid-URL + CDN (walkxcode/dashboard-icons) wenn kein Icon'
              : 'Icons: Unraid icon URL + CDN (walkxcode/dashboard-icons) when missing'
          }
          on={dashboardIconsOn}
          onToggle={() => onChange('useDashboardIcons', !dashboardIconsOn)}
        />
        <ToggleRow
          label={de ? 'Speicher: genutzt + Limit (längere Zeile)' : 'Memory: show used + limit (longer line)'}
          on={sub('memoryShowLimit')}
          onToggle={() => onChange('memoryShowLimit', !sub('memoryShowLimit'))}
        />
      </div>

      <ToggleRow
        label={de ? 'Live-CPU/RAM (WebSocket-Subscription)' : 'Live CPU/RAM (WebSocket subscription)'}
        on={liveOn}
        onToggle={() => onChange('liveStats', !liveOn)}
      />

      <div>
        <SettingsSectionTitle>{de ? 'Auslastung' : 'Usage'}</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label={de ? 'CPU/RAM-Spalten & Live-Daten' : 'CPU/RAM columns & live values'} on={statsOn} onToggle={() => onChange('showStats', !statsOn)} />
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
                  ? 'CPU/RAM als Balken (klassische Ansicht; sonst Text in der Zeile)'
                  : 'CPU/RAM as bars (classic view; otherwise inline text)'
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

      <div>
        <SettingsSectionTitle>{de ? 'Aktionen' : 'Actions'}</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label={de ? 'Buttons (Start / Stopp / Neustart …)' : 'Buttons (start / stop / restart …)'} on={actionsOn} onToggle={() => onChange('allowActions', !actionsOn)} />
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

      <ToggleRow label={de ? 'Auch gestoppte Container (EXITED)' : 'Include stopped (EXITED) containers'} on={sub('showStopped')} onToggle={() => onChange('showStopped', !sub('showStopped'))} />
      <ToggleRow label={de ? 'skipCache: true (Liste)' : 'skipCache: true (list query)'} on={sub('skipCache')} onToggle={() => onChange('skipCache', !sub('skipCache'))} />

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Aktualisierung Liste (Sek.)' : 'List refresh (sec.)'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(Number(r.refreshInterval) || 15) as number} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
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
          value={Number.isFinite(Number(r.maxRows)) ? Number(r.maxRows) : 80}
          onChange={(e) => onChange('maxRows', e.target.value === '' ? 80 : Number(e.target.value))}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {de ? 'Container-Reihenfolge' : 'Container order'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={parseListSort(r.listSort)} onChange={(e) => onChange('listSort', e.target.value)}>
          <option value="default">{de ? 'Standard (läuft / pausiert / gestoppt, dann Name)' : 'Default (running / paused / stopped, then name)'}</option>
          <option value="name">{de ? 'Nur Name (A–Z)' : 'Name only (A–Z)'}</option>
          <option value="cpu_desc">{de ? 'CPU (höchste zuerst)' : 'CPU (highest first)'}</option>
          <option value="cpu_asc">{de ? 'CPU (niedrigste zuerst)' : 'CPU (lowest first)'}</option>
          <option value="mem_desc">{de ? 'RAM % (höchste zuerst)' : 'RAM % (highest first)'}</option>
          <option value="mem_asc">{de ? 'RAM % (niedrigste zuerst)' : 'RAM % (lowest first)'}</option>
          <option value="custom">
            {de ? 'Manuell (im Bearbeitungsmodus Zeilen ziehen)' : 'Manual (drag rows in edit mode)'}
          </option>
        </select>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
          {de
            ? 'CPU/RAM-Sortierung nutzt Live-WebSocket-Werte, sobald vorhanden; sonst wie „Standard“. Manuell: Bearbeitung an, Zeilen mit ⋮⋮ ziehen.'
            : 'CPU/RAM sorting uses live WebSocket values when available; otherwise tie-break like “Default”. Manual: edit mode on, drag ⋮⋮ rows.'}
        </p>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
