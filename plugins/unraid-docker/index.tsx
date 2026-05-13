'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from 'graphql-ws'
import { Square, RotateCw, Play } from 'lucide-react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid-docker',
  name: 'Unraid Docker',
  description:
    'Docker-Container über die Unraid GraphQL API (7.2+): gleiche URL und API-Key wie das Unraid-Widget. Tabellen-Ansicht mit Icons, Live-CPU/RAM per WebSocket-Subscription (optional abschaltbar).',
  version: '0.3.0',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🧱',
}

/** GitHub/Unraid-Docker-UI inspired tokens */
const UD = {
  bg: '#0d1117',
  rowA: '#0d1117',
  rowB: '#161b22',
  border: '#21262d',
  header: '#8b949e',
  text: '#f0f6fc',
  green: '#3fb950',
  greenBadge: '#238636',
  greenBadgeText: '#ffffff',
  orange: '#d29922',
  danger: '#f85149',
  muted: '#6e7681',
} as const

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

function fmtCpu(p: number | null | undefined): string {
  if (p == null || !Number.isFinite(p)) return '—'
  if (p < 10) return `${p.toFixed(2)}%`
  return `${p.toFixed(1)}%`
}

function cpuColor(p: number | null | undefined, warn: number): string {
  if (p == null || !Number.isFinite(p)) return UD.muted
  return p >= warn ? UD.orange : UD.green
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
  const { de } = usePluginLocale()
  const url = String((config as Record<string, unknown>).url ?? '')
    .trim()
    .replace(/\/$/, '')
  const apiKey = String((config as Record<string, unknown>).apiKey ?? '').trim()
  const showStopped = (config as Record<string, unknown>).showStopped === true
  const skipCache = (config as Record<string, unknown>).skipCache === true
  const allowActions = (config as Record<string, unknown>).allowActions === true
  const liveStats = (config as Record<string, unknown>).liveStats !== false
  const cpuWarn = Math.min(100, Math.max(5, Number((config as Record<string, unknown>).cpuWarnPct) || 25))
  const refresh = (Number((config as Record<string, unknown>).refreshInterval) || 20) * 1000
  const maxRows = Math.min(200, Math.max(5, Number((config as Record<string, unknown>).maxRows) || 60))

  const [list, setList] = useState<GqlContainer[]>([])
  const [statsById, setStatsById] = useState<Record<string, LiveStat>>({})
  const [statsErr, setStatsErr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const latest = useRef(0)

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

  const shell = useMemo(
    (): React.CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      minWidth: 0,
      background: UD.bg,
      color: UD.text,
      borderRadius: '12px',
      overflow: 'hidden',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter, sans-serif',
      fontSize: '13px',
    }),
    [],
  )

  if (!url || !apiKey) {
    return (
      <div style={{ ...shell, padding: '16px', justifyContent: 'center', textAlign: 'center', color: UD.muted, fontSize: '12px', lineHeight: 1.55 }}>
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
      <div style={{ ...shell, padding: '14px' }}>
        <div className="skeleton" style={{ height: 10, width: '70%', borderRadius: 4, marginBottom: 8, background: UD.rowB }} />
        <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 4, background: UD.rowB }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...shell, padding: '14px', color: UD.danger, fontSize: '12px', lineHeight: 1.45 }}>
        {error}
        <p style={{ marginTop: 10, color: UD.muted, fontSize: '11px' }}>
          {de
            ? 'API-Key: Docker lesen/schreiben. WebSocket (wss/ws) muss zu Unraid erreichbar sein für Live-CPU/RAM.'
            : 'API key: Docker read/write. WebSocket (wss/ws) must reach Unraid for live CPU/RAM.'}
        </p>
      </div>
    )
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: UD.header,
    padding: '10px 12px',
    borderBottom: `1px solid ${UD.border}`,
    background: UD.bg,
    whiteSpace: 'nowrap',
  }

  return (
    <div style={shell}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '36%' }}>{de ? 'Name' : 'Name'}</th>
              <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>{de ? 'Status' : 'Status'}</th>
              <th style={{ ...thStyle, width: '11%', textAlign: 'right' }}>CPU</th>
              <th style={{ ...thStyle, width: '18%', textAlign: 'right' }}>{de ? 'Speicher' : 'Memory'}</th>
              {allowActions ? (
                <th style={{ ...thStyle, width: '14%', textAlign: 'right', paddingRight: '14px' }}>{de ? 'Aktionen' : 'Actions'}</th>
              ) : null}
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
              const rowBg = i % 2 === 0 ? UD.rowA : UD.rowB
              const st = statsById[cid]
              const cpuVal = running ? st?.cpuPercent : null
              const memStr = running && st?.memUsage ? st.memUsage : '—'

              const iconSrc = (c.iconUrl ?? '').trim()
              return (
                <tr key={cid || `${name}-${i}`} style={{ background: rowBg }}>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: `1px solid ${UD.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: UD.rowB,
                          border: `1px solid ${UD.border}`,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {iconSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={iconSrc} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} loading="lazy" />
                        ) : (
                          <span style={{ fontSize: 16, opacity: 0.85 }}>🐳</span>
                        )}
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          color: UD.text,
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
                  <td style={{ padding: '8px 8px', verticalAlign: 'middle', borderBottom: `1px solid ${UD.border}`, textAlign: 'center' }}>
                    {stLower === 'running' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          fontWeight: 600,
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: UD.greenBadge,
                          color: UD.greenBadgeText,
                        }}
                      >
                        {de ? 'Aktiv' : 'Active'}
                      </span>
                    ) : stLower === 'paused' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          fontWeight: 600,
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: UD.orange,
                          color: '#1a1204',
                        }}
                      >
                        {de ? 'Pause' : 'Paused'}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          fontWeight: 600,
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: '#30363d',
                          color: UD.muted,
                        }}
                      >
                        {de ? 'Aus' : 'Off'}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      verticalAlign: 'middle',
                      borderBottom: `1px solid ${UD.border}`,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                      color: cpuColor(cpuVal, cpuWarn),
                    }}
                  >
                    {running ? fmtCpu(cpuVal) : '—'}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      verticalAlign: 'middle',
                      borderBottom: `1px solid ${UD.border}`,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                      color: running && memStr !== '—' ? UD.green : UD.muted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={memStr}
                  >
                    {memStr}
                  </td>
                  {allowActions ? (
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: `1px solid ${UD.border}`, textAlign: 'right' }}>
                      {cid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          {!running && !paused ? (
                            <button
                              type="button"
                              title={de ? 'Start' : 'Start'}
                              disabled={busy}
                              onClick={() => void doAction(cid, 'start', name)}
                              style={iconBtn}
                            >
                              <Play size={18} strokeWidth={2.2} />
                            </button>
                          ) : null}
                          {paused ? (
                            <button
                              type="button"
                              title={de ? 'Fortsetzen' : 'Resume'}
                              disabled={busy}
                              onClick={() => void doAction(cid, 'unpause', name)}
                              style={iconBtn}
                            >
                              <Play size={18} strokeWidth={2.2} />
                            </button>
                          ) : null}
                          {running || paused ? (
                            <>
                              <button
                                type="button"
                                title={de ? 'Stopp' : 'Stop'}
                                disabled={busy}
                                onClick={() => void doAction(cid, 'stop', name)}
                                style={iconBtn}
                              >
                                <Square size={17} fill="currentColor" strokeWidth={0} />
                              </button>
                              {running ? (
                                <button
                                  type="button"
                                  title={de ? 'Neustart' : 'Restart'}
                                  disabled={busy}
                                  onClick={() => void doAction(cid, 'restart', name)}
                                  style={iconBtn}
                                >
                                  <RotateCw size={18} strokeWidth={2.2} />
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
          <p style={{ fontSize: '12px', color: UD.muted, padding: '14px 16px' }}>{de ? 'Keine Container.' : 'No containers.'}</p>
        ) : null}
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderTop: `1px solid ${UD.border}`,
          fontSize: '11px',
          color: UD.muted,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          background: UD.rowB,
        }}
      >
        <span>
          {de ? 'Gesamt' : 'Total'} {list.length} {de ? 'Container' : 'containers'}
        </span>
        <span style={{ textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {liveStats ? (
            statsErr ? (
              <span style={{ color: UD.orange }} title={statsErr}>
                {de ? 'Live-Stats: ' : 'Live: '}
                {statsErr.slice(0, 42)}
                {statsErr.length > 42 ? '…' : ''}
              </span>
            ) : (
              <span>{de ? 'Live-CPU/RAM (WebSocket)' : 'Live CPU/RAM (WebSocket)'}</span>
            )
          ) : (
            <span>{de ? 'Live-Stats aus' : 'Live stats off'}</span>
          )}
        </span>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: UD.danger,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.95,
  lineHeight: 0,
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
          ? 'Design orientiert sich an der Unraid-/GitHub-Docker-Tabelle. Icons kommen aus iconUrl der API. CPU/RAM laufen über die Subscription dockerContainerStats (WebSocket).'
          : 'Visual style matches the Unraid/GitHub-style Docker table. Icons use API iconUrl. CPU/RAM use the dockerContainerStats subscription (WebSocket).'}
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
        {de ? 'Live-CPU/RAM (WebSocket-Subscription)' : 'Live CPU/RAM (WebSocket subscription)'}
      </label>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          {de ? 'CPU-Warnfarbe ab %' : 'CPU warning color from %'}
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={99}
          value={Number.isFinite(Number(r.cpuWarnPct)) ? Number(r.cpuWarnPct) : 25}
          onChange={(e) => onChange('cpuWarnPct', e.target.value === '' ? 25 : Number(e.target.value))}
        />
      </div>
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
        {de ? 'Aktionen (Icons)' : 'Actions (icons)'}
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
