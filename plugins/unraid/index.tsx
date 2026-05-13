'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid',
  name: 'Unraid',
  description:
    'System-Übersicht per Unraid GraphQL API (Unraid 7.2+ / Connect API): CPU, RAM, Temperaturen, Array, Cache-Pools, Netz-Interfaces. API-Key: Einstellungen → Management-Zugang → API-Schlüssel.',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🖥️',
}

/**
 * Schema aligned with https://docs.unraid.net/API/how-to-use-the-api/
 * and https://github.com/unraid/api/blob/main/api/generated-schema.graphql
 * (older queries used removed fields like info.memory / info.cpu.utilization → HTTP 400).
 */
const QUERY = `query SelfDashboardUnraid {
  info {
    cpu {
      manufacturer
      brand
      cores
      threads
      packages {
        temp
      }
    }
    networkInterfaces {
      name
      ipAddress
      status
    }
    os {
      hostname
      uptime
    }
  }
  metrics {
    cpu {
      percentTotal
    }
    memory {
      total
      used
      free
      percentTotal
    }
    temperature {
      sensors {
        id
        name
        type
        current {
          value
        }
      }
    }
  }
  array {
    state
    capacity {
      kilobytes {
        total
        used
        free
      }
    }
    disks {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
    }
    caches {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
    }
  }
}`

interface Disk {
  id: string
  name: string
  status: string
  temp: number
  fsSize: number
  fsFree: number
}

interface Pool {
  id: string
  name: string
  capacity: { kilobytes: { total: number; used: number; free: number } }
}

interface NetIface {
  name: string
  ipAddress?: string | null
  status?: string | null
}

interface UnraidData {
  cpu?: { brand: string; cores: number; threads: number; utilization: number; temp: number }
  memory?: { total: number; used: number; free: number }
  temps?: { id: string; name: string; temp: number }[]
  networkIfaces?: NetIface[]
  array?: {
    state: string
    capacity: { kilobytes: { total: number; used: number; free: number } }
    disks: Disk[]
  }
  pools?: Pool[]
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function packageTempMax(packages: { temp?: (number | null)[] } | null | undefined): number {
  const arr = packages?.temp
  if (!Array.isArray(arr)) return 0
  let m = 0
  for (const t of arr) {
    const v = typeof t === 'number' ? t : Number(t)
    if (Number.isFinite(v) && v > m) m = v
  }
  return Math.round(m)
}

function fmtKb(kb: number) {
  if (kb >= 1024 ** 3) return `${(kb / 1024 ** 3).toFixed(1)} TB`
  if (kb >= 1024 ** 2) return `${(kb / 1024 ** 2).toFixed(1)} GB`
  return `${(kb / 1024).toFixed(0)} MB`
}

function fmtBytes(b: number) {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${b} B`
}

function pct(used: number, total: number) {
  return total ? Math.round((used / total) * 100) : 0
}

function Bar({ value, danger = 90 }: { value: number; danger?: number }) {
  const c = value >= danger ? '#ef4444' : value >= 70 ? '#f59e0b' : 'var(--accent)'
  return (
    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border)', flex: 1, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: c, borderRadius: '2px', transition: 'width 0.5s ease' }} />
    </div>
  )
}

function Row({ label, value, bar, pct: p }: { label: string; value: string; bar?: boolean; pct?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '18px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>{label}</span>
      {bar && p !== undefined && <Bar value={p} danger={label.includes('°') || label.includes('emp') ? 80 : 90} />}
      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500, marginLeft: 'auto', flexShrink: 0 }}>{value}</span>
    </div>
  )
}

function Heading({ text }: { text: string }) {
  return <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '8px 0 4px' }}>{text}</p>
}

function mapResponse(d: Record<string, unknown> | undefined): UnraidData {
  const info = d?.info as Record<string, unknown> | undefined
  const metrics = d?.metrics as Record<string, unknown> | undefined
  const arr = d?.array as Record<string, unknown> | undefined
  const cpuInfo = info?.cpu as Record<string, unknown> | undefined
  const mCpu = metrics?.cpu as Record<string, unknown> | undefined
  const mMem = metrics?.memory as Record<string, unknown> | undefined
  const mTemp = metrics?.temperature as Record<string, unknown> | undefined

  const kb = arr?.capacity as Record<string, unknown> | undefined
  const kbInner = kb?.kilobytes as Record<string, unknown> | undefined

  const disksRaw = (arr?.disks as Record<string, unknown>[] | undefined) ?? []
  const disks: Disk[] = disksRaw.map((disk) => ({
    id: String(disk.id ?? disk.name ?? ''),
    name: String(disk.name ?? ''),
    status: String(disk.status ?? ''),
    temp: Math.round(num(disk.temp)),
    fsSize: num(disk.fsSize),
    fsFree: num(disk.fsFree),
  }))

  const cachesRaw = (arr?.caches as Record<string, unknown>[] | undefined) ?? []
  const pools: Pool[] = cachesRaw
    .filter((c) => c && num(c.fsSize) > 0)
    .map((c) => {
      const total = num(c.fsSize)
      const free = num(c.fsFree)
      const used = num(c.fsUsed) || Math.max(0, total - free)
      return {
        id: String(c.id ?? c.name ?? ''),
        name: String(c.name ?? 'Cache'),
        capacity: { kilobytes: { total, used, free } },
      }
    })

  const sensors = (mTemp?.sensors as Record<string, unknown>[] | undefined) ?? []
  const temps = sensors
    .map((s) => ({
      id: String(s.id ?? s.name ?? ''),
      name: String(s.name ?? 'Sensor'),
      temp: Math.round(num((s.current as Record<string, unknown> | undefined)?.value)),
    }))
    .filter((t) => t.temp > 0)

  const ifacesRaw = (info?.networkInterfaces as Record<string, unknown>[] | undefined) ?? []
  const networkIfaces: NetIface[] = ifacesRaw.map((n) => ({
    name: String(n.name ?? ''),
    ipAddress: n.ipAddress as string | null | undefined,
    status: n.status as string | null | undefined,
  }))

  const packages = cpuInfo?.packages as { temp?: (number | null)[] } | undefined

  return {
    cpu: cpuInfo
      ? {
          brand: String(cpuInfo.brand ?? cpuInfo.manufacturer ?? 'CPU'),
          cores: num(cpuInfo.cores),
          threads: num(cpuInfo.threads),
          utilization: Math.round(num(mCpu?.percentTotal)),
          temp: packageTempMax(packages),
        }
      : undefined,
    memory: mMem
      ? {
          total: num(mMem.total),
          used: num(mMem.used),
          free: num(mMem.free),
        }
      : undefined,
    temps,
    networkIfaces,
    array: arr
      ? {
          state: String(arr.state ?? ''),
          capacity: {
            kilobytes: {
              total: num(kbInner?.total),
              used: num(kbInner?.used),
              free: num(kbInner?.free),
            },
          },
          disks,
        }
      : undefined,
    pools: pools.length ? pools : undefined,
  }
}

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState<UnraidData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const url = (config.url as string)?.replace(/\/$/, '')
  const apiKey = config.apiKey as string
  const refresh = ((config.refreshInterval as number) ?? 5) * 1000

  const show = (key: string) => config[key] !== false

  const fetch_ = useCallback(async () => {
    if (!url || !apiKey) {
      setLoading(false)
      return
    }
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      }
      const res = await fetch(`${url}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: QUERY }),
      })
      const rawText = await res.text()
      let json: { data?: Record<string, unknown>; errors?: { message?: string }[] }
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
      setData(mapResponse(json.data))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [url, apiKey])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, refresh)
    return () => clearInterval(id)
  }, [fetch_, refresh])

  if (!url || !apiKey)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', textAlign: 'center' }}>
        <span style={{ fontSize: '32px' }}>🖥️</span>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          URL & API Key
          <br />
          in Einstellungen eintragen
        </p>
      </div>
    )

  if (loading)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[80, 60, 90, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: '12px', width: `${w}%`, borderRadius: '3px' }} />
        ))}
      </div>
    )

  if (error)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', padding: '8px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center', wordBreak: 'break-word' }}>
          {error}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          URL ohne Endpfad (z. B. https://tower), API-Key mit Rolle VIEWER oder ADMIN. Unraid: Einstellungen → Management-Zugang → API-Schlüssel.
        </p>
      </div>
    )

  const arrayKb = data?.array?.capacity?.kilobytes
  const ramPct = data?.memory ? pct(data.memory.used, data.memory.total) : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {show('showCpu') && data?.cpu && (
        <>
          <Heading text={`CPU — ${data.cpu.brand}`} />
          <Row label="Auslastung" value={`${data.cpu.utilization}%`} bar pct={data.cpu.utilization} />
          {show('showTemp') && data.cpu.temp > 0 && <Row label="Paket-Temp." value={`${data.cpu.temp}°C`} bar pct={data.cpu.temp} />}
          <Row label="Kerne / Threads" value={`${data.cpu.cores} / ${data.cpu.threads}`} />
        </>
      )}

      {show('showRam') && data?.memory && (
        <>
          <Heading text="RAM" />
          <Row label="Verbrauch" value={`${fmtBytes(data.memory.used)} / ${fmtBytes(data.memory.total)}`} bar pct={ramPct} />
        </>
      )}

      {show('showTemp') && data?.temps && data.temps.length > 0 && (
        <>
          <Heading text="Temperaturen" />
          {data.temps.map((t) => (
            <Row key={t.id} label={t.name} value={`${t.temp}°C`} bar pct={t.temp} />
          ))}
        </>
      )}

      {show('showArray') && data?.array && (
        <>
          <Heading text={`Array — ${data.array.state}`} />
          {arrayKb && num(arrayKb.total) > 0 && (
            <Row label="Gesamt" value={`${fmtKb(num(arrayKb.used))} / ${fmtKb(num(arrayKb.total))}`} bar pct={pct(num(arrayKb.used), num(arrayKb.total))} />
          )}
          {data.array.disks
            ?.filter((d) => d.status !== 'DISK_NP' && d.fsSize > 0)
            .map((disk) => {
              const dp = pct(disk.fsSize - disk.fsFree, disk.fsSize)
              return (
                <div key={disk.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{disk.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{disk.temp > 0 ? `${disk.temp}°C` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bar value={dp} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {fmtKb(disk.fsSize - disk.fsFree)} / {fmtKb(disk.fsSize)}
                    </span>
                  </div>
                </div>
              )
            })}
        </>
      )}

      {show('showPools') && data?.pools && data.pools.length > 0 && (
        <>
          <Heading text="Pools / Cache" />
          {data.pools.map((pool) => {
            const kb = pool.capacity?.kilobytes
            if (!kb || !num(kb.total)) return null
            const p = pct(num(kb.used), num(kb.total))
            return (
              <div key={pool.id} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text)' }}>{pool.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {fmtKb(num(kb.used))} / {fmtKb(num(kb.total))}
                  </span>
                </div>
                <Bar value={p} />
              </div>
            )
          })}
        </>
      )}

      {show('showNetwork') && data?.networkIfaces && data.networkIfaces.length > 0 && (
        <>
          <Heading text="Netzwerk" />
          {data.networkIfaces.map((n) => (
            <Row key={n.name} label={n.name} value={[n.ipAddress, n.status].filter(Boolean).join(' · ') || '—'} />
          ))}
        </>
      )}
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
  }

  const SECTIONS = [
    { key: 'showCpu', label: '🖥️ CPU' },
    { key: 'showRam', label: '💾 RAM' },
    { key: 'showTemp', label: '🌡️ Temperaturen' },
    { key: 'showArray', label: '🗄️ Array & Disks' },
    { key: 'showPools', label: '💿 Pools / Cache' },
    { key: 'showNetwork', label: '🌐 Netzwerk' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Unraid-Basis-URL
        </label>
        <input
          style={inp}
          value={(config.url as string) || ''}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="http://192.168.1.10 oder https://tower"
        />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
          Ohne Pfad am Ende. GraphQL: <code style={{ fontSize: '10px' }}>/graphql</code> (z. B. in der{' '}
          <a href="https://docs.unraid.net/API/how-to-use-the-api/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
            Unraid-Doku
          </a>
          ).
        </p>
      </div>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          API Key
        </label>
        <input style={inp} type="password" value={(config.apiKey as string) || ''} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="x-api-key Header" />
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
          Unraid WebGUI: Einstellungen → Management-Zugang → API-Schlüssel. Rolle mindestens VIEWER (Lesen).
        </p>
      </div>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Aktualisierung
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 5} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={2}>Alle 2 Sekunden</option>
          <option value={5}>Alle 5 Sekunden</option>
          <option value={10}>Alle 10 Sekunden</option>
          <option value={30}>Alle 30 Sekunden</option>
          <option value={60}>Alle 60 Sekunden</option>
        </select>
      </div>
      <div>
        <label
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Sektionen
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SECTIONS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
              <div
                onClick={() => onChange(key, !(config[key] ?? true))}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  background: (config[key] ?? true) ? 'var(--accent)' : 'var(--border)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: (config[key] ?? true) ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
