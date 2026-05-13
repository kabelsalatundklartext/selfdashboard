'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'docker',
  name: 'Docker',
  description:
    'Docker-Liste in einer Zeile (Name : Laufzeit : optional CPU/RAM-Balken : Buttons). Balken optional, Steuerung & Stats einzeln konfigurierbar.',
  version: '1.5.0',
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
  sdStats?: SdContainerStats | null
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
  return n.replace(/^\//, '') || (c.Id ? c.Id.slice(0, 12) : '—')
}

function sortContainers(a: DockerContainer, b: DockerContainer): number {
  const ar = a.State === 'running' ? 0 : 1
  const br = b.State === 'running' ? 0 : 1
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

function Widget({ config }: PluginWidgetProps) {
  const [list, setList] = useState<DockerContainer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)
  pendingRef.current = pending
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const showAll = config.showStopped === true
  const r = config as Record<string, unknown>
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
    try {
      const q = showAll ? 'all=1' : 'all=0'
      const statsQ = fetchStats ? '&stats=1' : ''
      const res = await fetch(`/api/docker-containers?${q}${statsQ}`, { method: 'GET', cache: 'no-store' })
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
      const sorted = (data as DockerContainer[]).slice().sort(sortContainers)
      setList(sorted.slice(0, maxRows))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [showAll, maxRows, fetchStats])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, refresh)
    return () => clearInterval(id)
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
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    padding: '8px 12px 12px',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[70, 55, 80, 50].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '10px', width: `${w}%`, borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...shell, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
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
    )
  }

  const fs = 'clamp(9px, 2.6cqmin, 11px)'

  return (
    <div style={shell}>
      <Heading text={`Docker · ${list.length}${showAll ? '' : ' laufend'}`} />
      {actionError ? (
        <p style={{ fontSize: '10px', color: '#ef4444', margin: '0 0 8px', lineHeight: 1.4 }}>{actionError}</p>
      ) : null}
      {list.length === 0 ? (
        <p style={{ fontSize: fs, color: 'var(--text-muted)', margin: 0 }}>Keine Container in der Liste.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>
          {list.map((c, i) => {
            const name = containerName(c)
            const st = c.State ?? '—'
            const status = (c.Status ?? '').trim() || st
            const img = (c.Image ?? '').split(':')[0]?.split('@')[0] ?? ''
            const running = st === 'running'
            const tipParts = [name, st, status, img]
            const sl = statsLine(c, running, showStatCpu, showStatRam)
            if (sl) tipParts.push(sl)
            const tip = tipParts.filter(Boolean).join('\n')
            const cid = c.Id
            const isBusy = cid != null && busyId === cid
            const isPendingHere = pending != null && cid != null && pending.id === cid
            const rowPending = isPendingHere ? pending : null
            const canStart = !running && showBtnStart
            const canStop = running && showBtnStop
            const canRestart = running && showBtnRestart
            const anyBtn = canStart || canStop || canRestart
            const showControls = Boolean(cid && (anyBtn || rowPending))

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
