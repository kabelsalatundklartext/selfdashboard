'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid-docker',
  name: 'Unraid Docker',
  description:
    'Docker-Container über die Unraid GraphQL API (7.2+): gleiche URL und API-Key wie das Unraid-Widget. Liste mit Status; Start / Stopp / Neustart optional (Key mit Docker-Berechtigung).',
  version: '0.2.0',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🧱',
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
    }
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

function badgeLabel(state: string | undefined, de: boolean): string {
  const s = (state ?? '').toLowerCase()
  if (s === 'running') return de ? 'Aktiv' : 'Running'
  if (s === 'exited' || s === 'dead') return de ? 'Aus' : 'Off'
  if (s === 'paused') return de ? 'Pause' : 'Paused'
  if (s === 'restarting') return de ? 'Warte' : 'Wait'
  const raw = (state ?? '').trim()
  return raw.length <= 8 ? raw : `${raw.slice(0, 7)}…`
}

function badgeStyle(state: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: 600,
    fontSize: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  }
  const s = (state ?? '').toLowerCase()
  if (s === 'running') return { ...base, background: '#15803d', color: '#fff' }
  if (s === 'exited' || s === 'dead') return { ...base, background: '#7f1d1d', color: '#fecaca' }
  return { ...base, background: 'var(--border)', color: 'var(--text-muted)' }
}

async function graphql<T>(
  baseUrl: string,
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${baseUrl}/graphql`, {
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
  const refresh = (Number((config as Record<string, unknown>).refreshInterval) || 20) * 1000
  const maxRows = Math.min(200, Math.max(5, Number((config as Record<string, unknown>).maxRows) || 60))

  const [list, setList] = useState<GqlContainer[]>([])
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

  if (!url || !apiKey) {
    return (
      <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        {de ? (
          <>
            {'URL & API-Key'}
            <br />
            in den Einstellungen eintragen (wie beim Unraid-Widget).
          </>
        ) : (
          <>
            {'URL & API key'}
            <br />
            in settings (same as the Unraid widget).
          </>
        )}
      </div>
    )
  }

  if (loading && list.length === 0) {
    return (
      <div style={{ padding: '12px' }}>
        <div className="skeleton" style={{ height: 10, width: '70%', borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 4 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '12px', fontSize: '12px', color: '#ef4444', lineHeight: 1.45 }}>
        {error}
        <p style={{ marginTop: 8, fontSize: '11px', color: 'var(--text-muted)' }}>
          {de
            ? 'Hinweis: Der API-Key braucht Docker-Lesezugriff (Liste). Für Start/Stopp/Neustart zusätzlich Schreibzugriff. Bei CORS-Fehlern Dashboard und Unraid-URL prüfen oder SelfDashboard über dieselbe Site erreichbar machen.'
            : 'Note: the API key needs Docker read access (list). For start/stop/restart it also needs write access. If you see CORS errors, check the dashboard origin vs your Unraid URL.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={th}>{de ? 'Name' : 'Name'}</th>
              <th style={{ ...th, width: '12%', textAlign: 'center' }}>{de ? 'Status' : 'State'}</th>
              <th style={{ ...th, width: '38%' }}>{de ? 'Docker-Status' : 'Docker status'}</th>
              {allowActions ? <th style={{ ...th, width: '22%', textAlign: 'right' }}>{de ? 'Aktion' : 'Action'}</th> : null}
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
              const statusText = (c.status ?? '').trim() || '—'
              return (
                <tr key={cid || `${name}-${i}`} style={{ background: i % 2 ? 'color-mix(in srgb, var(--text) 3%, transparent)' : undefined }}>
                  <td style={td}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(c.image ?? '').split(':')[0]}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={badgeStyle(stLower)}>{badgeLabel(stLower, de)}</span>
                  </td>
                  <td style={{ ...td, fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={statusText}>
                    {statusText}
                  </td>
                  {allowActions ? (
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {cid ? (
                        <span style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {!running && !paused ? (
                            <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'start', name)}>
                              {de ? 'Start' : 'Start'}
                            </button>
                          ) : null}
                          {paused ? (
                            <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'unpause', name)}>
                              {de ? 'Weiter' : 'Resume'}
                            </button>
                          ) : null}
                          {running || paused ? (
                            <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'stop', name)}>
                              {de ? 'Stopp' : 'Stop'}
                            </button>
                          ) : null}
                          {running ? (
                            <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'restart', name)}>
                              {de ? 'Neu' : 'Restart'}
                            </button>
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
        {list.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 8 }}>{de ? 'Keine Container.' : 'No containers.'}</p> : null}
      </div>
      <div
        style={{
          flexShrink: 0,
          padding: '6px 10px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {de ? 'Container' : 'Containers'}: {list.length}
        </span>
        <span style={{ opacity: 0.85 }}>Unraid GraphQL</span>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '6px 6px',
  borderBottom: '1px solid var(--border)',
}

const td: React.CSSProperties = {
  padding: '6px 6px',
  verticalAlign: 'middle',
  borderBottom: '1px solid color-mix(in srgb, var(--border) 85%, transparent)',
  fontSize: '12px',
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
          ? 'Gleiche Unraid-Basis-URL und API-Key wie beim Unraid-System-Widget (Connect / lokale API, 7.2+). Aufruf erfolgt aus dem Browser — bei CORS ggf. HTTPS und erlaubte Origin prüfen.'
          : 'Same Unraid base URL and API key as the main Unraid widget (Connect / local API, 7.2+). Calls run in the browser — if you hit CORS, check HTTPS and allowed origins.'}
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
        <input type="checkbox" checked={r.showStopped === true} onChange={(e) => onChange('showStopped', e.target.checked)} />
        {de ? 'Gestoppte Container (EXITED) anzeigen' : 'Show stopped (EXITED) containers'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.skipCache === true} onChange={(e) => onChange('skipCache', e.target.checked)} />
        {de ? 'skipCache: true (frischere Liste, etwas mehr Last auf Unraid)' : 'skipCache: true (fresher list, slightly more load on Unraid)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.allowActions === true} onChange={(e) => onChange('allowActions', e.target.checked)} />
        {de ? 'Aktionen (Start / Stopp / Neustart / Weiter) — mit Browser-Bestätigung' : 'Actions (start / stop / restart / resume) — browser confirm'}
      </label>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          {de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}
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
