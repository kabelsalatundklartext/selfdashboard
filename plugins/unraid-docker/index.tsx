'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createClient } from 'graphql-ws'
import type { Locale } from '@/lib/i18n'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid-docker',
  name: 'Unraid Docker',
  description:
    'Docker-Container über die Unraid GraphQL API (7.2+): gleiche URL und API-Key wie das Unraid-Widget. Tabellen-Ansicht wie das Docker-Plugin (Homarr), Live-CPU/RAM per WebSocket-Subscription (optional).',
  version: '0.3.7',
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
  if (s === 'running') return de ? 'Aktiv' : 'Running'
  if (s === 'exited' || s === 'dead') return de ? 'Aus' : 'Off'
  if (s === 'paused') return de ? 'Pause' : 'Paused'
  if (s === 'restarting') return de ? 'Warte' : 'Wait'
  const raw = (state ?? '').trim()
  if (!raw) return de ? '?' : '?'
  return raw.length <= 7 ? raw : `${raw.slice(0, 6)}…`
}

function stateBadgeStyle(state: string | undefined, compact?: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: 600,
    fontSize: compact ? '7px' : '8px',
    letterSpacing: compact ? 0 : '0.02em',
    padding: compact ? '1px 4px' : '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
    textTransform: 'none',
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

function Widget({ config }: PluginWidgetProps) {
  const { locale, de } = usePluginLocale()
  const url = String((config as Record<string, unknown>).url ?? '')
    .trim()
    .replace(/\/$/, '')
  const apiKey = String((config as Record<string, unknown>).apiKey ?? '').trim()
  const showStopped = (config as Record<string, unknown>).showStopped === true
  const skipCache = (config as Record<string, unknown>).skipCache === true
  const allowActions = (config as Record<string, unknown>).allowActions === true
  const liveStats = (config as Record<string, unknown>).liveStats !== false
  const refresh = (Number((config as Record<string, unknown>).refreshInterval) || 20) * 1000
  const maxRows = Math.min(200, Math.max(5, Number((config as Record<string, unknown>).maxRows) || 60))
  const showContainerNames = (config as Record<string, unknown>).showContainerNames !== false
  const memoryShowLimit = (config as Record<string, unknown>).memoryShowLimit === true

  const [list, setList] = useState<GqlContainer[]>([])
  const [statsById, setStatsById] = useState<Record<string, LiveStat>>({})
  const [statsErr, setStatsErr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [lastFetchOk, setLastFetchOk] = useState<number | null>(null)
  const latest = useRef(0)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)

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
      const sorted = rows.slice().sort(sortContainers).slice(0, maxRows)
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
  }, [url, apiKey, showStopped, skipCache, maxRows, de])

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
    if (!url || !apiKey || !liveStats) {
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
  }, [url, apiKey, liveStats])

  const runMutation = useCallback(
    async (mutation: string, cid: string) => {
      await graphql(url, apiKey, mutation, { id: cid })
    },
    [url, apiKey],
  )

  const doAction = useCallback(
    async (cid: string, action: 'start' | 'stop' | 'restart' | 'unpause', name: string) => {
      const msg =
        action === 'start'
          ? de
            ? `Container „${name}“ starten?`
            : `Start container “${name}”?`
          : action === 'unpause'
            ? de
              ? `Container „${name}“ fortsetzen?`
              : `Resume container “${name}”?`
            : action === 'stop'
              ? de
                ? `Container „${name}“ stoppen?`
                : `Stop container “${name}”?`
              : de
                ? `Container „${name}“ neu starten?`
                : `Restart container “${name}”?`
      if (!window.confirm(msg)) return
      if (!cid.trim()) return
      setBusyId(cid)
      try {
        if (action === 'start') await runMutation(M_START, cid)
        else if (action === 'unpause') await runMutation(M_UNPAUSE, cid)
        else if (action === 'stop') await runMutation(M_STOP, cid)
        else {
          await runMutation(M_STOP, cid)
          await runMutation(M_START, cid)
        }
        await fetch_()
      } catch (e: unknown) {
        window.alert(e instanceof Error ? e.message : String(e))
      } finally {
        setBusyId(null)
      }
    },
    [runMutation, fetch_, de],
  )

  useLayoutEffect(() => {
    const el = tableWrapRef.current
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
  }, [allowActions, list.length])

  const shell: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    padding: 0,
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
    padding: '6px 10px 4px',
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
        <div style={{ ...scrollBody, padding: '10px 12px' }}>
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

  const col5 = allowActions
  const tdRow: React.CSSProperties = narrow ? { ...tdCompact, padding: '4px 5px', fontSize: '10px' } : tdCompact
  const thDyn: React.CSSProperties = narrow ? { ...thStyle, fontSize: '8px', letterSpacing: '0.04em', padding: '5px 5px' } : thStyle

  const tightMetrics = narrow && !showContainerNames

  const colWidths: string[] = !showContainerNames
    ? col5
      ? narrow
        ? ['32px', '11%', '52px', '33%', '44px']
        : ['48px', '20%', '17%', '34%', '11%']
      : narrow
        ? ['32px', '11%', '52px', '45%']
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

  const tableMinW = !showContainerNames ? 200 : narrow ? 300 : 0

  return (
    <div style={shell}>
      <div style={scrollBody}>
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
                <col key={idx} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th style={thDyn} title={!showContainerNames ? (de ? 'Name (ausgeblendet)' : 'Name (hidden)') : undefined}>
                  {headRow[0] || '\u00a0'}
                </th>
                <th style={{ ...thDyn, textAlign: 'center' }}>{headRow[1]}</th>
                <th style={{ ...thDyn, textAlign: metricAlign, fontVariantNumeric: 'tabular-nums' }}>{headRow[2]}</th>
                <th style={{ ...thDyn, textAlign: metricAlign, fontVariantNumeric: 'tabular-nums' }}>{headRow[3]}</th>
                {col5 ? <th style={{ ...thDyn, textAlign: 'right' }}>{headRow[4]}</th> : null}
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => {
                const name = containerName(c)
                const cid = c.id.trim()
                const running = isRunningState(c.state)
                const paused = isPausedState(c.state)
                const stLower = graphqlStateLower(c.state)
                const busy = busyId === cid
                const zebra =
                  i % 2 === 0
                    ? 'color-mix(in srgb, var(--text) 5%, var(--background))'
                    : 'color-mix(in srgb, var(--text) 2%, var(--background))'
                const st = statsById[cid]
                const cpuPct = st?.cpuPercent ?? null
                const memPct = st?.memPercent ?? null
                const memFull = running && st?.memUsage ? st.memUsage : '—'
                const memCell = memFull === '—' ? '—' : memoryShowLimit ? memFull : fmtMemUsageCompact(memFull)
                const iconSrc = (c.iconUrl ?? '').trim()
                const tip = [name, c.state, (c.status ?? '').trim(), (c.image ?? '').split(':')[0]].filter(Boolean).join('\n')

                const avatarBox = (inner: React.ReactNode) => (
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

                return (
                  <tr key={cid || `${name}-${i}`} style={{ background: zebra }} title={tip}>
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
                        <span title={!showContainerNames ? name : undefined} style={{ flexShrink: 0 }}>
                          {iconSrc
                            ? avatarBox(
                                // eslint-disable-next-line @next/next/no-img-element
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
                                />,
                              )
                            : avatarBox(
                                <span
                                  style={{
                                    fontSize: 14,
                                    lineHeight: 1,
                                    background: 'var(--surface)',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  🐳
                                </span>,
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
                    <td style={{ ...tdRow, textAlign: 'center', minWidth: narrow ? 52 : 44 }}>
                      <span style={stateBadgeStyle(stLower, narrow)}>{stateBadgeLabel(stLower, locale)}</span>
                    </td>
                    <td
                      style={{
                        ...tdRow,
                        textAlign: metricAlign,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: liveStats && running ? heatColorForPct(cpuPct) : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        paddingLeft: tightMetrics ? 2 : undefined,
                        paddingRight: tightMetrics ? 4 : undefined,
                      }}
                    >
                      {liveStats ? fmtCpuHomarr(cpuPct, running) : '—'}
                    </td>
                    <td
                      style={{
                        ...tdRow,
                        textAlign: metricAlign,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: liveStats && running && memCell !== '—' ? heatColorForPct(memPct) : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: tightMetrics ? undefined : 'hidden',
                        textOverflow: tightMetrics ? undefined : 'ellipsis',
                        paddingLeft: tightMetrics ? 2 : undefined,
                        paddingRight: tightMetrics ? 4 : undefined,
                      }}
                      title={memFull}
                    >
                      {memCell}
                    </td>
                    {col5 ? (
                      <td style={{ ...tdRow, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {cid ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: narrow ? 4 : 6 }}>
                            {!running && !paused ? (
                              <button type="button" style={iconAct} title={de ? 'Start' : 'Start'} disabled={busy} onClick={() => void doAction(cid, 'start', name)}>
                                <IconPlay disabled={busy} />
                              </button>
                            ) : null}
                            {paused ? (
                              <button type="button" style={iconAct} title={de ? 'Fortsetzen' : 'Resume'} disabled={busy} onClick={() => void doAction(cid, 'unpause', name)}>
                                <IconPlay disabled={busy} />
                              </button>
                            ) : null}
                            {running || paused ? (
                              <>
                                <button type="button" style={iconAct} title={de ? 'Stopp' : 'Stop'} disabled={busy} onClick={() => void doAction(cid, 'stop', name)}>
                                  <IconStop disabled={busy} />
                                </button>
                                {running ? (
                                  <button type="button" style={iconAct} title={de ? 'Neustart' : 'Restart'} disabled={busy} onClick={() => void doAction(cid, 'restart', name)}>
                                    <IconRestart disabled={busy} />
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length === 0 ? (
            <p style={{ fontSize: 'clamp(9px, 2.6cqmin, 11px)', color: 'var(--text-muted)', margin: '8px 0 0' }}>{de ? 'Keine Container.' : 'No containers.'}</p>
          ) : null}
        </div>
      </div>
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
          {liveStats ? statsErr || fmtUpdatedAgo(lastFetchOk, locale) : de ? 'Live-Stats aus' : 'Live stats off'}
        </span>
      </div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        {de
          ? 'Homarr-Tabelle: unter ~440px Breite kürzere Spaltenüberschriften; optional Namen ausblenden (nur Icon). Speicher standardmäßig nur „genutzt“ (eine Zeile), vollständig mit Limit per Option.'
          : 'Homarr-style table: under ~440px width, shorter headers; optional hide names (icon only). Memory shows usage only by default; enable option for full used/total string.'}
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
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.liveStats !== false} onChange={(e) => onChange('liveStats', e.target.checked)} />
        {de ? 'Live-CPU/RAM (WebSocket)' : 'Live CPU/RAM (WebSocket)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.showContainerNames !== false} onChange={(e) => onChange('showContainerNames', e.target.checked)} />
        {de ? 'Namen in der Tabelle (aus: nur Icon, Tooltip = Name)' : 'Show names in table (off: icon only, tooltip = name)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.memoryShowLimit === true} onChange={(e) => onChange('memoryShowLimit', e.target.checked)} />
        {de ? 'Speicher: genutzt + Limit (längere Zeile)' : 'Memory: show used + limit (longer line)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.showStopped === true} onChange={(e) => onChange('showStopped', e.target.checked)} />
        {de ? 'Gestoppte Container (EXITED) anzeigen' : 'Show stopped (EXITED) containers'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.skipCache === true} onChange={(e) => onChange('skipCache', e.target.checked)} />
        {de ? 'skipCache: true' : 'skipCache: true'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.allowActions === true} onChange={(e) => onChange('allowActions', e.target.checked)} />
        {de ? 'Aktionen' : 'Actions'}
      </label>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          {de ? 'Aktualisierung Liste (Sek.)' : 'List refresh (sec.)'}
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={Number(r.refreshInterval) || 20} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>max rows</label>
        <input
          style={inp}
          type="number"
          min={5}
          max={200}
          value={Number.isFinite(Number(r.maxRows)) ? Number(r.maxRows) : 60}
          onChange={(e) => onChange('maxRows', e.target.value === '' ? 60 : Number(e.target.value))}
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
