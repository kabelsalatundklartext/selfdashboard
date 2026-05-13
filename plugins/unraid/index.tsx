'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid',
  name: 'Unraid',
  description: 'System stats: CPU, RAM, Array, Pools, Fans and Network.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🖥️',
}

const QUERY = `{
  info {
    cpu { brand cores threads utilization temp }
    memory { total used free }
    temps { id name temp }
    fans { id name rpm }
    network { name rxBytes txBytes }
  }
  array {
    state
    capacity { kilobytes { total used free } }
    disks {
      id name status temp fsSize fsFree
    }
  }
  volumes {
    id name
    capacity { kilobytes { total used free } }
  }
}`

interface Disk { id: string; name: string; status: string; temp: number; fsSize: number; fsFree: number }
interface Pool { id: string; name: string; capacity: { kilobytes: { total: number; used: number; free: number } } }

interface UnraidData {
  cpu?: { brand: string; cores: number; threads: number; utilization: number; temp: number }
  memory?: { total: number; used: number; free: number }
  temps?: { id: string; name: string; temp: number }[]
  fans?: { id: string; name: string; rpm: number }[]
  network?: { name: string; rxBytes: number; txBytes: number }[]
  array?: { state: string; capacity: { kilobytes: { total: number; used: number; free: number } }; disks: Disk[] }
  pools?: Pool[]
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
function pct(used: number, total: number) { return total ? Math.round(used / total * 100) : 0 }

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

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState<UnraidData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [netSpeed, setNetSpeed] = useState<{ rx: number; tx: number } | null>(null)
  const prevNet = useState<{ rx: number; tx: number; ts: number } | null>(null)

  const url = (config.url as string)?.replace(/\/$/, '')
  const apiKey = config.apiKey as string
  const refresh = ((config.refreshInterval as number) ?? 5) * 1000

  const show = (key: string) => config[key] !== false

  const fetch_ = useCallback(async () => {
    if (!url || !apiKey) { setLoading(false); return }
    try {
      const res = await fetch(`${url}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ query: QUERY }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.errors) throw new Error(json.errors[0]?.message ?? 'GraphQL error')
      const d = json.data
      const parsed: UnraidData = {
        cpu: d?.info?.cpu,
        memory: d?.info?.memory,
        temps: d?.info?.temps,
        fans: d?.info?.fans,
        network: d?.info?.network,
        array: d?.array,
        pools: d?.volumes,
      }
      // Net speed
      if (parsed.network?.length) {
        const rx = parsed.network.reduce((a: number, n: any) => a + (n.rxBytes ?? 0), 0)
        const tx = parsed.network.reduce((a: number, n: any) => a + (n.txBytes ?? 0), 0)
        const now = Date.now()
        const prev = prevNet[0]
        if (prev) {
          const dt = (now - prev.ts) / 1000
          setNetSpeed({ rx: Math.max(0, (rx - prev.rx) / dt), tx: Math.max(0, (tx - prev.tx) / dt) })
        }
        prevNet[1]({ rx, tx, ts: now })
      }
      setData(parsed); setError(null)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [url, apiKey])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, refresh)
    return () => clearInterval(id)
  }, [url, apiKey, refresh])

  if (!url || !apiKey) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', textAlign: 'center' }}>
      <span style={{ fontSize: '32px' }}>🖥️</span>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>URL & API Key<br />in Einstellungen eintragen</p>
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {[80, 60, 90, 70].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: '12px', width: `${w}%`, borderRadius: '3px' }} />
      ))}
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px' }}>
      <span style={{ fontSize: '24px' }}>⚠️</span>
      <p style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center', wordBreak: 'break-all' }}>{error}</p>
    </div>
  )

  const arrayKb = data?.array?.capacity?.kilobytes
  const ramPct = data?.memory ? pct(data.memory.used, data.memory.total) : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>

      {/* CPU */}
      {show('showCpu') && data?.cpu && (<>
        <Heading text={`CPU — ${data.cpu.brand}`} />
        <Row label="Auslastung" value={`${data.cpu.utilization ?? 0}%`} bar pct={data.cpu.utilization ?? 0} />
        {show('showTemp') && data.cpu.temp > 0 && <Row label="Temperatur" value={`${data.cpu.temp}°C`} bar pct={data.cpu.temp} />}
        <Row label="Kerne / Threads" value={`${data.cpu.cores} / ${data.cpu.threads}`} />
      </>)}

      {/* RAM */}
      {show('showRam') && data?.memory && (<>
        <Heading text="RAM" />
        <Row label="Verbrauch" value={`${fmtBytes(data.memory.used)} / ${fmtBytes(data.memory.total)}`} bar pct={ramPct} />
      </>)}

      {/* Temps */}
      {show('showTemp') && data?.temps && data.temps.filter((t: any) => t.temp > 0).length > 0 && (<>
        <Heading text="Temperaturen" />
        {data.temps.filter((t: any) => t.temp > 0).map((t: any) => (
          <Row key={t.id} label={t.name} value={`${t.temp}°C`} bar pct={t.temp} />
        ))}
      </>)}

      {/* Fans */}
      {show('showFans') && data?.fans && data.fans.filter((f: any) => f.rpm > 0).length > 0 && (<>
        <Heading text="Lüfter" />
        {data.fans.filter((f: any) => f.rpm > 0).map((f: any) => (
          <Row key={f.id} label={f.name} value={`${f.rpm} RPM`} />
        ))}
      </>)}

      {/* Array */}
      {show('showArray') && data?.array && (<>
        <Heading text={`Array — ${data.array.state}`} />
        {arrayKb && <Row label="Gesamt" value={`${fmtKb(arrayKb.used)} / ${fmtKb(arrayKb.total)}`} bar pct={pct(arrayKb.used, arrayKb.total)} />}
        {data.array.disks?.filter((d: Disk) => d.status !== 'DISK_NP' && d.fsSize > 0).map((disk: Disk) => {
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
      </>)}

      {/* Pools */}
      {show('showPools') && data?.pools && data.pools.length > 0 && (<>
        <Heading text="Pools / Cache" />
        {data.pools.map((pool: Pool) => {
          const kb = pool.capacity?.kilobytes
          if (!kb || !kb.total) return null
          const p = pct(kb.used, kb.total)
          return (
            <div key={pool.id} style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)' }}>{pool.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{fmtKb(kb.used)} / {fmtKb(kb.total)}</span>
              </div>
              <Bar value={p} />
            </div>
          )
        })}
      </>)}

      {/* Network */}
      {show('showNetwork') && netSpeed && (<>
        <Heading text="Netzwerk" />
        <Row label="↓ Download" value={`${fmtBytes(netSpeed.rx)}/s`} />
        <Row label="↑ Upload" value={`${fmtBytes(netSpeed.tx)}/s`} />
      </>)}

    </div>
  )
}

// ── Settings ─────────────────────────────────────────────────
function Settings({ config, onChange }: PluginSettingsProps) {
  const inp: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '6px', padding: '6px 10px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const SECTIONS = [
    { key: 'showCpu', label: '🖥️ CPU' },
    { key: 'showRam', label: '💾 RAM' },
    { key: 'showTemp', label: '🌡️ Temperaturen' },
    { key: 'showFans', label: '🌬️ Lüfter' },
    { key: 'showArray', label: '🗄️ Array & Disks' },
    { key: 'showPools', label: '💿 Pools / Cache' },
    { key: 'showNetwork', label: '🌐 Netzwerk' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unraid URL</label>
        <input style={inp} value={(config.url as string) || ''} onChange={(e) => onChange('url', e.target.value)} placeholder="http://192.168.1.10" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</label>
        <input style={inp} type="password" value={(config.apiKey as string) || ''} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="••••••••••••••••" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aktualisierung</label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 5} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={2}>Alle 2 Sekunden</option>
          <option value={5}>Alle 5 Sekunden</option>
          <option value={10}>Alle 10 Sekunden</option>
          <option value={30}>Alle 30 Sekunden</option>
          <option value={60}>Alle 60 Sekunden</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sektionen</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SECTIONS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
              <div onClick={() => onChange(key, !(config[key] ?? true))}
                style={{ width: '36px', height: '20px', borderRadius: '10px', background: (config[key] ?? true) ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', left: (config[key] ?? true) ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
