'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'docker',
  name: 'Docker',
  description:
    'Docker: Homarr-Tabelle oder klassische Zeile. Icons aus Container-Labels + optional CDN (walkxcode/dashboard-icons). Steuerung & Stats konfigurierbar.',
  version: '1.6.3',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🐳',
}

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

function fmtMemoryHomarr(s: SdContainerStats | null | undefined, running: boolean): string {
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

function fmtUpdatedAgo(ts: number | null): string {
  if (ts == null) return ''
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 8) return 'Updated a few seconds ago'
  if (sec < 60) return `Updated ${sec}s ago`
  const m = Math.floor(sec / 60)
  if (m < 60) return `Updated ${m} min ago`
  const h = Math.floor(m / 60)
  return `Updated ${h}h ago`
}

function fmtCpuHomarr(p: number | null | undefined, running: boolean): string {
  if (!running) return '—'
  if (p == null || !Number.isFinite(p)) return '—'
  if (p < 10) return `${p.toFixed(2)}%`
  if (p < 100) return `${p.toFixed(1)}%`
  return `${Math.round(p)}%`
}

function stateBadgeLabel(state: string | undefined): string {
  const s = (state ?? '').toLowerCase()
  if (s === 'running') return 'RUNNING'
  if (s === 'exited' || s === 'dead') return 'EXITED'
  if (s === 'paused') return 'PAUSED'
  if (s === 'restarting') return 'RESTARTING'
  return (state ?? 'UNKNOWN').toUpperCase()
}

function stateBadgeStyle(state: string | undefined): React.CSSProperties {
  const s = (state ?? '').toLowerCase()
  if (s === 'running') {
    return {
      background: '#15803d',
      color: '#fff',
      fontWeight: 700,
      fontSize: '9px',
      letterSpacing: '0.05em',
      padding: '3px 8px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
    }
  }
  if (s === 'exited' || s === 'dead') {
    return {
      background: '#7f1d1d',
      color: '#fecaca',
      fontWeight: 700,
      fontSize: '9px',
      letterSpacing: '0.05em',
      padding: '3px 8px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
    }
  }
  if (s === 'paused') {
    return { background: '#854d0e', color: '#fef08a', fontWeight: 700, fontSize: '9px', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }
  }
  return {
    background: 'var(--border)',
    color: 'var(--text-muted)',
    fontWeight: 700,
    fontSize: '9px',
    padding: '3px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
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

/** PNGs from https://github.com/walkxcode/dashboard-icons (used by Homarr-style dashboards). */
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

type HomarrDockerTableProps = {
  list: DockerContainer[]
  busyId: string | null
  pending: PendingConfirm | null
  useDashboardIcons: boolean
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
}

function HomarrDockerTable({
  list,
  busyId,
  pending,
  useDashboardIcons,
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
}: HomarrDockerTableProps) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        minWidth: 0,
      }}
    >
      <colgroup>
        <col style={{ width: '38%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '15%' }} />
      </colgroup>
      <thead>
        <tr>
          <th style={thStyle}>Name</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>State</th>
          <th style={{ ...thStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>CPU</th>
          <th style={{ ...thStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>Memory</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
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
          const memStr = fmtMemoryHomarr(s, running)
          const tipParts = [name, st, (c.Status ?? '').trim(), imgRef]
          const tip = tipParts.filter(Boolean).join('\n')
          const zebra =
            i % 2 === 0
              ? 'color-mix(in srgb, var(--text) 5%, var(--background))'
              : 'color-mix(in srgb, var(--text) 2%, var(--background))'

          const avatar = (
            <ContainerAvatar image={c.Image ?? ''} name={name} labels={c.Labels} useDashboardIcons={useDashboardIcons} />
          )

          const mainRow = (
            <tr key={cid ?? `${name}-${i}`} style={{ background: zebra }} title={tip}>
              <td style={{ ...tdCompact, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {avatar}
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
                </div>
              </td>
              <td style={{ ...tdCompact, textAlign: 'center' }}>
                <span style={stateBadgeStyle(st)}>{stateBadgeLabel(st)}</span>
              </td>
              <td
                style={{
                  ...tdCompact,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  color: showStatCpu ? heatColorForPct(running ? cpuPct : null) : 'var(--text-muted)',
                }}
              >
                {showStatCpu ? fmtCpuHomarr(cpuPct, running) : '—'}
              </td>
              <td
                style={{
                  ...tdCompact,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  color: showStatRam ? heatColorForPct(running ? ramPct : null) : 'var(--text-muted)',
                }}
              >
                {showStatRam ? memStr : '—'}
              </td>
              <td style={{ ...tdCompact, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {!rowPending && showControls && anyBtn ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {canStop ? (
                      <button
                        type="button"
                        style={iconAct}
                        title="Container stoppen"
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
                        style={iconAct}
                        title="Container starten"
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
                        style={iconAct}
                        title="Container neu starten"
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
                        <>
                          <strong>{name}</strong> wirklich {actionVerb(rowPending.action)}?{' '}
                          <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                        </>
                      ) : (
                        <>
                          Zweite Bestätigung: <strong>{actionNoun(rowPending.action)}</strong> für <strong>{name}</strong>.{' '}
                          <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                        </>
                      )}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <button type="button" style={btnMuted} onClick={cancelPending} disabled={isBusy}>
                        Abbrechen
                      </button>
                      {rowPending.step === 1 ? (
                        <button type="button" style={btn} onClick={goSecondStep} disabled={isBusy}>
                          Weiter
                        </button>
                      ) : (
                        <button type="button" style={btn} onClick={() => void executeAction()} disabled={isBusy}>
                          Ausführen
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
  )
}

function Widget({ config }: PluginWidgetProps) {
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

  const showAll = config.showStopped === true
  const r = config as Record<string, unknown>
  const homarrTable = r.homarrTable !== false
  const useDashboardIcons = r.useDashboardIcons !== false
  const actionsOn = r.allowActions !== false
  const statsOn = r.showStats !== false
  const showBtnStart = actionsOn && r.showBtnStart !== false
  const showBtnStop = actionsOn && r.showBtnStop !== false
  const showBtnRestart = actionsOn && r.showBtnRestart !== false
  const showStatCpu = statsOn && r.showStatCpu !== false
  const showStatRam = statsOn && r.showStatRam !== false
  const showStatBars = statsOn && r.showStatBars !== false
  const fetchStats = showStatCpu || showStatRam
  const refresh = (Number(config.refreshInterval) || 15) * 1000
  const maxRows = Math.min(200, Math.max(5, Number(config.maxRows) || 80))

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

      const sorted = (data as DockerContainer[]).slice().sort(sortContainers)
      trimmed = sorted.slice(0, maxRows)
      setList(trimmed)
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
      const sorted = (data as DockerContainer[]).slice().sort(sortContainers)
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
      )
      setLastFetchOk(Date.now())
    } catch {
      if (latestFetch.current === id) await mergeStatsFromGet()
    }
  }, [showAll, maxRows, fetchStats])

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
    overflowX: 'hidden',
    padding: homarrTable ? '6px 10px 4px' : 0,
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
            <>
              Typisch unter Unraid: Prozess im Container darf den Socket nicht öffnen — Template nutzt{' '}
              <code style={{ fontSize: '10px' }}>--group-add=281</code> (Docker-Gruppe). GID prüfen:{' '}
              <code style={{ fontSize: '10px' }}>stat -c %g /var/run/docker.sock</code>. Außerdem: Volume{' '}
              <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code> mounten. Neuere Images laufen als root.
            </>
          ) : (
            <>
              SelfDashboard braucht Zugriff auf <code style={{ fontSize: '10px' }}>/var/run/docker.sock</code> (Volume-Mount). Nur dieselbe Seite wie das Dashboard (kein externes CORS).
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
        {!homarrTable ? <Heading text={`Docker · ${list.length}${showAll ? '' : ' laufend'}`} /> : null}
        {actionError ? (
          <p style={{ fontSize: '10px', color: '#ef4444', margin: '0 0 8px', lineHeight: 1.4 }}>{actionError}</p>
        ) : null}
        {list.length === 0 ? (
          <p style={{ fontSize: fs, color: 'var(--text-muted)', margin: 0 }}>Keine Container in der Liste.</p>
        ) : homarrTable ? (
          <HomarrDockerTable
            list={list}
            busyId={busyId}
            pending={pending}
            useDashboardIcons={useDashboardIcons}
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
          />
        ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {list.map((c, i) => {
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

            return (
              <li
                key={cid ?? `${name}-${i}`}
                title={tip}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: i < list.length - 1 ? '0 0 6px 0' : 0,
                  borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
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
                          title="Container starten"
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
                          title="Container stoppen"
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'stop')
                          }}
                        >
                          Stopp
                        </button>
                      ) : null}
                      {canRestart ? (
                        <button
                          type="button"
                          style={btn}
                          title="Container neu starten"
                          disabled={isBusy || pending != null}
                          onClick={() => {
                            if (cid == null || cid === '') return
                            beginAction(cid, name, 'restart')
                          }}
                        >
                          Neustart
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
                          <>
                            <strong>{name}</strong> wirklich {actionVerb(rowPending.action)}? <span style={{ color: 'var(--text-muted)' }}>(1/2)</span>
                          </>
                        ) : (
                          <>
                            Zweite Bestätigung: <strong>{actionNoun(rowPending.action)}</strong> für <strong>{name}</strong>.{' '}
                            <span style={{ color: 'var(--text-muted)' }}>(2/2)</span>
                          </>
                        )}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <button type="button" style={btnMuted} onClick={cancelPending} disabled={isBusy}>
                          Abbrechen
                        </button>
                        {rowPending.step === 1 ? (
                          <button type="button" style={btn} onClick={goSecondStep} disabled={isBusy}>
                            Weiter
                          </button>
                        ) : (
                          <button type="button" style={btn} onClick={() => void executeAction()} disabled={isBusy}>
                            Ausführen
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
              🐳
            </span>
            <span>
              Total {list.length} {list.length === 1 ? 'container' : 'containers'}
            </span>
          </span>
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtUpdatedAgo(lastFetchOk)}</span>
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

  const sub = (key: string, def = false) => {
    const v = (config as Record<string, unknown>)[key]
    if (v === undefined || v === null) return def
    return v === true
  }

  const r = config as Record<string, unknown>
  const actionsOn = r.allowActions !== false
  const statsOn = r.showStats !== false
  const homarrOn = r.homarrTable !== false
  const dashboardIconsOn = r.useDashboardIcons !== false
  const btnStartOn = actionsOn && r.showBtnStart !== false
  const btnStopOn = actionsOn && r.showBtnStop !== false
  const btnRestartOn = actionsOn && r.showBtnRestart !== false
  const statCpuOn = statsOn && r.showStatCpu !== false
  const statRamOn = statsOn && r.showStatRam !== false
  const statBarsOn = statsOn && r.showStatBars !== false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        Daten kommen von <code style={{ fontSize: '10px' }}>/api/docker-containers</code> (Server liest{' '}
        <code style={{ fontSize: '10px' }}>{'/var/run/docker.sock'}</code>
        ). Beim Docker-/Unraid-Template den Socket als Volume einbinden.
      </p>

      <ToggleRow
        label="Homarr-Tabellenansicht (Name · State · CPU · Memory · Actions)"
        on={homarrOn}
        onToggle={() => onChange('homarrTable', !homarrOn)}
      />

      <div style={{ opacity: homarrOn ? 1 : 0.45, pointerEvents: homarrOn ? 'auto' : 'none' }}>
        <ToggleRow
          label="Icons: Container-Labels + CDN (walkxcode/dashboard-icons)"
          on={dashboardIconsOn}
          onToggle={() => onChange('useDashboardIcons', !dashboardIconsOn)}
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
          Unraid-Community-Templates setzen oft <code style={{ fontSize: '9px' }}>net.unraid.docker.icon</code>. Ohne CDN: nur Label-URL, Emoji oder Buchstabe-Kachel.
        </p>
      </div>

      <div>
        <SettingsSectionTitle>Aktionen</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label="Buttons (Start / Stopp / Neustart)" on={actionsOn} onToggle={() => onChange('allowActions', !actionsOn)} />
          <div style={{ opacity: actionsOn ? 1 : 0.45, pointerEvents: actionsOn ? 'auto' : 'none' }}>
            <ToggleRow
              label="Button: Start"
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
              label="Button: Stopp"
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
              label="Button: Neustart"
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
        <SettingsSectionTitle>Auslastung</SettingsSectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label="Docker-Stats (CPU / RAM)" on={statsOn} onToggle={() => onChange('showStats', !statsOn)} />
          <div style={{ opacity: statsOn ? 1 : 0.45, pointerEvents: statsOn ? 'auto' : 'none' }}>
            <ToggleRow
              label="CPU anzeigen"
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
              label="RAM anzeigen"
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
              label="CPU/RAM als Balken (wie Unraid, sonst Text in der Zeile)"
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

      <ToggleRow label="Auch gestoppte Container" on={sub('showStopped')} onToggle={() => onChange('showStopped', !sub('showStopped'))} />
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Aktualisierung (Sek.)
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
          Max. Zeilen
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
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
