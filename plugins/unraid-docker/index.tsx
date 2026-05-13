'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'
import { CONTAINER_ID_RE, type SdContainerStats } from '@/lib/dockerEngine'

export const meta: PluginMeta = {
  id: 'unraid-docker',
  name: 'Unraid Docker',
  description:
    'Docker-Container über die Engine-API auf deinem Unraid-Host (oder anderem Rechner): http(s)://IP:Port, optional TLS „unsicher“ für selbstsigniert. Liste mit CPU/RAM; Start/Stopp/Neustart optional.',
  version: '0.1.0',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🧱',
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

async function api(body: unknown): Promise<unknown> {
  const res = await fetch('/api/unraid-docker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
  return data
}

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
  const baseUrl = String((config as Record<string, unknown>).baseUrl ?? '').trim()
  const apiVersion = String((config as Record<string, unknown>).apiVersion ?? 'v1.41').trim() || 'v1.41'
  const tlsInsecure = (config as Record<string, unknown>).tlsInsecure === true
  const showAll = (config as Record<string, unknown>).showStopped === true
  const showStats = (config as Record<string, unknown>).showStats !== false
  const allowActions = (config as Record<string, unknown>).allowActions === true
  const refresh = (Number((config as Record<string, unknown>).refreshInterval) || 20) * 1000
  const maxRows = Math.min(200, Math.max(5, Number((config as Record<string, unknown>).maxRows) || 60))

  const [list, setList] = useState<DockerContainer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const latest = useRef(0)

  const payloadBase = useMemo(
    () => ({ baseUrl, apiVersion, tlsInsecure }),
    [baseUrl, apiVersion, tlsInsecure],
  )

  const fetch_ = useCallback(async () => {
    if (!baseUrl) {
      setError(de ? 'Bitte Basis-URL in den Einstellungen setzen.' : 'Set base URL in settings.')
      setLoading(false)
      return
    }
    const id = ++latest.current
    try {
      const data = (await api({
        op: 'list',
        ...payloadBase,
        all: showAll,
        stats: showStats,
      })) as unknown
      if (latest.current !== id) return
      if (!Array.isArray(data)) throw new Error(de ? 'Unerwartetes Format' : 'Unexpected format')
      const sorted = (data as DockerContainer[]).slice().sort(sortContainers).slice(0, maxRows)
      setList(sorted)
      setError(null)
    } catch (e: unknown) {
      if (latest.current === id) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      if (latest.current === id) setLoading(false)
    }
  }, [baseUrl, payloadBase, showAll, showStats, maxRows, de])

  useEffect(() => {
    setLoading(true)
    void fetch_()
    const t = setInterval(() => void fetch_(), refresh)
    return () => {
      clearInterval(t)
      latest.current++
    }
  }, [fetch_, refresh])

  const doAction = useCallback(
    async (cid: string, action: 'start' | 'stop' | 'restart', name: string) => {
      const msg =
        action === 'start'
          ? de
            ? `Container „${name}“ starten?`
            : `Start container “${name}”?`
          : action === 'stop'
            ? de
              ? `Container „${name}“ stoppen?`
              : `Stop container “${name}”?`
            : de
              ? `Container „${name}“ neu starten?`
              : `Restart container “${name}”?`
      if (!window.confirm(msg)) return
      setBusyId(cid)
      try {
        await api({ op: 'action', ...payloadBase, id: cid, action })
        await fetch_()
      } catch (e: unknown) {
        window.alert(e instanceof Error ? e.message : String(e))
      } finally {
        setBusyId(null)
      }
    },
    [payloadBase, fetch_, de],
  )

  if (!baseUrl && !loading) {
    return (
      <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
        {de ? 'Keine Basis-URL — Plugin konfigurieren (Zahnrad).' : 'No base URL — configure the plugin (gear).'}
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
            ? 'Hinweis: Auf Unraid muss die Docker-Engine per HTTP(S) erreichbar sein (z. B. Port 2375/2376). TLS selbstsigniert → Option „TLS unsicher“.'
            : 'Note: the Docker engine must be reachable via HTTP(S) (e.g. port 2375/2376). Self-signed TLS → enable “TLS insecure”.'}
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
              <th style={{ ...th, width: '14%', textAlign: 'right' }}>CPU</th>
              <th style={{ ...th, width: '18%', textAlign: 'right' }}>{de ? 'RAM' : 'RAM'}</th>
              {allowActions ? <th style={{ ...th, width: '18%', textAlign: 'right' }}>{de ? 'Aktion' : 'Action'}</th> : null}
            </tr>
          </thead>
          <tbody>
            {list.map((c, i) => {
              const name = containerName(c)
              const cid = dockerContainerId(c)
              const running = isDockerRunning(c)
              const st = c.State ?? '—'
              const s = c.sdStats
              const busy = busyId === cid
              return (
                <tr key={cid || `${name}-${i}`} style={{ background: i % 2 ? 'color-mix(in srgb, var(--text) 3%, transparent)' : undefined }}>
                  <td style={td}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(c.Image ?? '').split(':')[0]}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={badgeStyle(st)}>{badgeLabel(st, de)}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{showStats && running ? fmtCpuPct(s?.cpuPct ?? null) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {showStats && running && s?.memUsageBytes != null ? fmtBytesShort(s.memUsageBytes) : '—'}
                  </td>
                  {allowActions ? (
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {cid && CONTAINER_ID_RE.test(cid) ? (
                        <span style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                          {!running ? (
                            <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'start', name)}>
                              {de ? 'Start' : 'Start'}
                            </button>
                          ) : null}
                          {running ? (
                            <>
                              <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'stop', name)}>
                                {de ? 'Stopp' : 'Stop'}
                              </button>
                              <button type="button" className="btn-ghost" style={{ padding: '2px 8px', fontSize: '11px' }} disabled={busy} onClick={() => void doAction(cid, 'restart', name)}>
                                {de ? 'Neu' : 'Restart'}
                              </button>
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
        <span style={{ opacity: 0.85 }}>Unraid Docker · API {apiVersion}</span>
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
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        {de
          ? 'SelfDashboard ruft deinen Unraid-/Docker-Host serverseitig auf (kein CORS im Browser). Basis-URL ohne Pfad, z. B. https://192.168.1.10:2376 oder http://tower.local:2375.'
          : 'SelfDashboard calls your Unraid/Docker host from the server (no browser CORS). Base URL without path, e.g. https://192.168.1.10:2376 or http://tower.local:2375.'}
      </p>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Base URL</label>
        <input
          style={inp}
          value={String(r.baseUrl ?? '')}
          onChange={(e) => onChange('baseUrl', e.target.value)}
          placeholder={de ? 'https://unraid:2376' : 'https://unraid:2376'}
        />
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>API-Version</label>
        <input style={inp} value={String(r.apiVersion ?? 'v1.41')} onChange={(e) => onChange('apiVersion', e.target.value)} placeholder="v1.41" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.tlsInsecure === true} onChange={(e) => onChange('tlsInsecure', e.target.checked)} />
        {de ? 'TLS unsicher (selbstsigniert / interne CA)' : 'TLS insecure (self-signed / internal CA)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.showStopped === true} onChange={(e) => onChange('showStopped', e.target.checked)} />
        {de ? 'Gestoppte Container anzeigen' : 'Show stopped containers'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.showStats !== false} onChange={(e) => onChange('showStats', e.target.checked)} />
        {de ? 'CPU / RAM (Stats)' : 'CPU / RAM (stats)'}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={r.allowActions === true} onChange={(e) => onChange('allowActions', e.target.checked)} />
        {de ? 'Aktionen (Start / Stopp / Neustart) — mit Browser-Bestätigung' : 'Actions (start / stop / restart) — browser confirm'}
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
