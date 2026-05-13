'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'docker',
  name: 'Docker',
  description:
    'Laufende (optional alle) Container über die Docker Engine API — SelfDashboard muss den Socket mounten (/api/docker-containers).',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🐳',
}

interface DockerContainer {
  Id?: string
  Names?: string[]
  State?: string
  Status?: string
  Image?: string
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

  const showAll = config.showStopped === true
  const refresh = (Number(config.refreshInterval) || 15) * 1000
  const maxRows = Math.min(200, Math.max(5, Number(config.maxRows) || 80))

  const fetch_ = useCallback(async () => {
    try {
      const q = showAll ? 'all=1' : 'all=0'
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
      const sorted = (data as DockerContainer[]).slice().sort(sortContainers)
      setList(sorted.slice(0, maxRows))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [showAll, maxRows])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, refresh)
    return () => clearInterval(id)
  }, [fetch_, refresh])

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

  const fs = 'clamp(10px, 2.8cqmin, 12px)'

  return (
    <div style={shell}>
      <Heading text={`Docker · ${list.length}${showAll ? '' : ' laufend'}`} />
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
            const tip = [name, st, status, img].filter(Boolean).join('\n')
            return (
              <li
                key={c.Id ?? `${name}-${i}`}
                title={tip}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: i < list.length - 1 ? '0 0 8px 0' : 0,
                  borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                    width: '100%',
                    minWidth: 0,
                    fontSize: fs,
                    lineHeight: 1.35,
                  }}
                >
                  <span style={{ color: running ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, width: '1em', textAlign: 'center' }} aria-hidden>
                    {running ? '●' : '○'}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', flexShrink: 0, maxWidth: '42%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>:</span>
                  <span style={{ flex: '1 1 0%', minWidth: 0, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</span>
                </div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
        Daten kommen von <code style={{ fontSize: '10px' }}>/api/docker-containers</code> (Server liest{' '}
        <code style={{ fontSize: '10px' }}>{'/var/run/docker.sock'}</code>
        ). Beim Docker-/Unraid-Template den Socket als Volume einbinden.
      </p>
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
