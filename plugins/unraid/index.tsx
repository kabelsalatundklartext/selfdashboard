'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid',
  name: 'Unraid',
  description:
    'System-Übersicht per Unraid GraphQL API (7.2+): CPU, RAM, Array, Cache/Pool-Disks. RAM-Anzeige umschaltbar (used / 1−verfügbar / API-%); Darstellung an Theme-Textfarben angeglichen.',
  version: '1.5.1',
  author: 'SelfDashboard',
  category: 'system',
  icon: '🖥️',
}

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
      available
      percentTotal
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

export interface Disk {
  id: string
  name: string
  status: string
  temp: number
  fsSize: number
  fsFree: number
  diskType?: string
}

type RamDisplayMode = 'used' | 'available' | 'percentTotal'

interface UnraidData {
  cpu?: { brand: string; cores: number; threads: number; utilization: number; temp: number }
  memory?: {
    total: number
    used: number
    free: number
    /** gesetzt, wenn die API `available` liefert (sonst Anzeige „verfügbar“ nicht nutzbar) */
    available?: number
    percentTotal: number
  }
  array?: {
    state: string
    capacity: { kilobytes: { total: number; used: number; free: number } }
    disks: Disk[]
  }
  /** Cache / Pool devices (same shape as array disks) */
  pools?: Disk[]
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

/** Short German-ish label for Unraid array disk status */
function formatDiskStatus(status: string): string {
  if (!status) return '—'
  const map: Record<string, string> = {
    DISK_OK: 'OK',
    DISK_NP: 'Leer',
    DISK_NP_MISSING: 'Fehlt',
    DISK_INVALID: 'Ungültig',
    DISK_WRONG: 'Falsch',
    DISK_DSBL: 'Aus',
    DISK_NP_DSBL: 'Aus (leer)',
    DISK_DSBL_NEW: 'Neu (aus)',
    DISK_NEW: 'Neu',
  }
  return map[status] ?? status.replace(/^DISK_/, '')
}

function diskTypeLabel(t?: string): string {
  if (!t) return ''
  const map: Record<string, string> = {
    DATA: 'Daten',
    PARITY: 'Parity',
    BOOT: 'Boot',
    FLASH: 'Flash',
    CACHE: 'Cache',
  }
  return map[t] ?? t
}

/** Ampel für Auslastung: &lt;50 % grün, 50–79 % orange, ab 80 % rot */
const HEAT = {
  ok: '#22c55e',
  okHi: '#4ade80',
  mid: '#f59e0b',
  midHi: '#fbbf24',
  hot: '#ef4444',
  hotHi: '#f87171',
} as const

function heatSolid(pct: number): string {
  const p = Math.min(100, Math.max(0, pct))
  if (p < 50) return HEAT.ok
  if (p < 80) return HEAT.mid
  return HEAT.hot
}

function heatFillGradient(pct: number): string {
  const p = Math.min(100, Math.max(0, pct))
  if (p < 50) return `linear-gradient(90deg, ${HEAT.okHi}, ${HEAT.ok})`
  if (p < 80) return `linear-gradient(90deg, ${HEAT.midHi}, ${HEAT.mid})`
  return `linear-gradient(90deg, ${HEAT.hotHi}, ${HEAT.hot})`
}

function Bar({ value }: { value: number }) {
  const w = Math.min(100, Math.max(0, value))
  const core = heatSolid(w)
  return (
    <div
      title={`${Math.round(w)}%`}
      style={{
        height: '5px',
        borderRadius: '999px',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--border)',
        border: '1px solid color-mix(in srgb, var(--border) 90%, transparent)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.28)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${w}%`,
          background: heatFillGradient(w),
          borderRadius: '999px',
          transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px color-mix(in srgb, ${core} 55%, transparent)`,
        }}
      />
    </div>
  )
}

function Row({ label, value, bar, pct: p, title }: { label: string; value: string; bar?: boolean; pct?: number; title?: string }) {
  return (
    <div
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '20px',
        width: '100%',
        minWidth: 0,
      }}
    >
      <span
        title={label}
        style={{
          flex: '1 1 34%',
          minWidth: 0,
          fontSize: '11px',
          color: 'var(--text)',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {bar && p !== undefined ? (
        <div style={{ flex: '1 1 38%', minWidth: '40px', maxWidth: '100%' }}>
          <Bar value={p} />
        </div>
      ) : (
        <span style={{ flex: '1 1 38%' }} />
      )}
      <span
        className="tabular-nums"
        style={{
          flex: '0 0 auto',
          maxWidth: '42%',
          fontSize: '11px',
          color: 'var(--text)',
          fontWeight: 500,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          paddingLeft: '6px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Heading({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        margin: '12px 0 8px',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {text}
    </p>
  )
}

function DiskVolumeRow({ disk }: { disk: Disk }) {
  const used = Math.max(0, disk.fsSize - disk.fsFree)
  const p = pct(used, disk.fsSize)
  const kind = diskTypeLabel(disk.diskType)
  const title = [disk.name, kind, formatDiskStatus(disk.status)].filter(Boolean).join(' — ')
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '10px',
        marginTop: '10px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', minWidth: 0, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: '1 1 40%',
          }}
          title={title}
        >
          {disk.name}
          {kind ? <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px', fontSize: '10px' }}>({kind})</span> : null}
        </span>
        <span
          className="tabular-nums"
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            lineHeight: 1.35,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
          }}
        >
          {formatDiskStatus(disk.status)}
          {' · '}
          {disk.temp > 0 ? `${disk.temp}°C` : '—'}
          {' · '}
          {p}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{ flex: '1 1 auto', minWidth: '48px' }}>
          <Bar value={p} />
        </div>
        <span
          className="tabular-nums"
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            paddingLeft: '6px',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
          }}
        >
          {fmtKb(used)} / {fmtKb(disk.fsSize)}
        </span>
      </div>
    </div>
  )
}

function mapDisk(raw: Record<string, unknown>): Disk {
  return {
    id: String(raw.id ?? raw.name ?? ''),
    name: String(raw.name ?? ''),
    status: String(raw.status ?? ''),
    temp: Math.round(num(raw.temp)),
    fsSize: num(raw.fsSize),
    fsFree: num(raw.fsFree),
    diskType: raw.type ? String(raw.type) : undefined,
  }
}

function mapResponse(d: Record<string, unknown> | undefined): UnraidData {
  const info = d?.info as Record<string, unknown> | undefined
  const metrics = d?.metrics as Record<string, unknown> | undefined
  const arr = d?.array as Record<string, unknown> | undefined
  const cpuInfo = info?.cpu as Record<string, unknown> | undefined
  const mCpu = metrics?.cpu as Record<string, unknown> | undefined
  const mMem = metrics?.memory as Record<string, unknown> | undefined

  const kb = arr?.capacity as Record<string, unknown> | undefined
  const kbInner = kb?.kilobytes as Record<string, unknown> | undefined

  const disksRaw = (arr?.disks as Record<string, unknown>[] | undefined) ?? []
  const disks: Disk[] = disksRaw.map((x) => mapDisk(x))

  const cachesRaw = (arr?.caches as Record<string, unknown>[] | undefined) ?? []
  const pools: Disk[] = cachesRaw.filter((c) => c && num(c.fsSize) > 0).map((c) => mapDisk(c))

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
          available: mMem.available !== undefined && mMem.available !== null ? num(mMem.available) : undefined,
          percentTotal: num(mMem.percentTotal),
        }
      : undefined,
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

function flag(config: Record<string, unknown>, key: string, defaultTrue = true) {
  const v = config[key]
  if (v === undefined || v === null) return defaultTrue
  return v !== false
}

function aggregateDisks(disks: Disk[]) {
  let total = 0
  let used = 0
  for (const d of disks) {
    total += d.fsSize
    used += Math.max(0, d.fsSize - d.fsFree)
  }
  return { total, used }
}

function parseRamDisplayMode(v: unknown): RamDisplayMode {
  const s = String(v ?? 'used').trim()
  if (s === 'available' || s === 'percentTotal') return s
  return 'used'
}

/** Eine RAM-Zeile: Label, Wertetext, Balken-% — je nach Modus */
function ramRow(mode: RamDisplayMode, mem: NonNullable<UnraidData['memory']>): {
  rowLabel: string
  value: string
  barPct: number
  rowTitle?: string
} {
  const { total, used, available, percentTotal } = mem
  if (mode === 'percentTotal') {
    const p = Number.isFinite(percentTotal) ? Math.round(Math.min(100, Math.max(0, percentTotal))) : pct(used, total)
    return {
      rowLabel: 'Anteil (API %)',
      value: `${p}% · ${fmtBytes(used)} / ${fmtBytes(total)}`,
      barPct: p,
    }
  }
  if (mode === 'available' && total > 0 && available !== undefined) {
    const committed = Math.max(0, Math.min(total, total - available))
    const p = pct(committed, total)
    return {
      rowLabel: 'Belegung',
      value: `${fmtBytes(committed)} / ${fmtBytes(total)}`,
      barPct: p,
      rowTitle: `Balken: (gesamt − verfügbar) / gesamt. Verfügbar: ${fmtBytes(available)}.`,
    }
  }
  return {
    rowLabel: 'Verbrauch',
    value: `${fmtBytes(used)} / ${fmtBytes(total)}`,
    barPct: pct(used, total),
  }
}

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState<UnraidData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const url = (config.url as string)?.replace(/\/$/, '')
  const apiKey = config.apiKey as string
  const refresh = ((config.refreshInterval as number) ?? 5) * 1000

  const showCpu = flag(config, 'showCpu')
  const showCpuLoad = flag(config, 'showCpuLoad')
  const showCpuPkgTemp = flag(config, 'showCpuPkgTemp')
  const showCpuCores = flag(config, 'showCpuCores')
  const showRam = flag(config, 'showRam')
  const showArray = flag(config, 'showArray')
  const showArrayTotal = flag(config, 'showArrayTotal')
  const showArrayDisks = flag(config, 'showArrayDisks')
  const showPools = flag(config, 'showPools')
  const showPoolsTotal = flag(config, 'showPoolsTotal')
  const showPoolsDisks = flag(config, 'showPoolsDisks')
  const ramMode = parseRamDisplayMode((config as Record<string, unknown>).ramDisplayMode)

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

  const shellStyle: React.CSSProperties = {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    padding: '10px 14px 14px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }

  if (!url || !apiKey)
    return (
      <div
        className="sd-plugin-no-scrollbar"
        style={{ ...shellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <span style={{ fontSize: '32px' }}>🖥️</span>
        <p style={{ fontSize: '12px', color: 'var(--text)', marginTop: '10px', lineHeight: 1.45, fontWeight: 500 }}>
          URL & API Key
          <br />
          in Einstellungen eintragen
        </p>
      </div>
    )

  if (loading)
    return (
      <div className="sd-plugin-no-scrollbar" style={shellStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '12px', width: `${w}%`, borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    )

  if (error)
    return (
      <div
        className="sd-plugin-no-scrollbar"
        style={{ ...shellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', wordBreak: 'break-word', fontWeight: 600 }}>{error}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
          URL ohne Endpfad, API-Key mit Rolle VIEWER oder ADMIN.
        </p>
      </div>
    )

  const arrayKb = data?.array?.capacity?.kilobytes
  const poolDisks = data?.pools ?? []
  const poolAgg = aggregateDisks(poolDisks)
  const poolPct = poolAgg.total ? pct(poolAgg.used, poolAgg.total) : 0

  const ramResolved =
    showRam && data?.memory
      ? ramRow(ramMode === 'available' && data.memory.available === undefined ? 'used' : ramMode, data.memory)
      : null

  return (
    <div className="sd-plugin-no-scrollbar" style={shellStyle}>
      {showCpu && data?.cpu && (
        <>
          <Heading text={`CPU — ${data.cpu.brand}`} />
          {showCpuLoad && <Row label="Auslastung" value={`${data.cpu.utilization}%`} bar pct={data.cpu.utilization} />}
          {showCpuPkgTemp && data.cpu.temp > 0 && <Row label="Paket-Temp." value={`${data.cpu.temp}°C`} bar pct={data.cpu.temp} />}
          {showCpuCores && <Row label="Kerne / Threads" value={`${data.cpu.cores} / ${data.cpu.threads}`} />}
        </>
      )}

      {ramResolved && (
        <>
          <Heading text="RAM" />
          <Row label={ramResolved.rowLabel} value={ramResolved.value} bar pct={ramResolved.barPct} title={ramResolved.rowTitle} />
        </>
      )}

      {showArray && data?.array && (
        <>
          <Heading text={`Array — ${data.array.state}`} />
          {showArrayTotal && arrayKb && num(arrayKb.total) > 0 && (
            <Row label="Gesamt" value={`${fmtKb(num(arrayKb.used))} / ${fmtKb(num(arrayKb.total))}`} bar pct={pct(num(arrayKb.used), num(arrayKb.total))} />
          )}
          {showArrayDisks &&
            data.array.disks
              ?.filter((d) => d.status !== 'DISK_NP' && d.fsSize > 0)
              .map((disk) => <DiskVolumeRow key={disk.id} disk={disk} />)}
        </>
      )}

      {showPools && poolDisks.length > 0 && (
        <>
          <Heading text="Pools / Cache" />
          {showPoolsTotal && poolAgg.total > 0 && (
            <Row label="Gesamt (Cache)" value={`${fmtKb(poolAgg.used)} / ${fmtKb(poolAgg.total)}`} bar pct={poolPct} />
          )}
          {showPoolsDisks && poolDisks.map((disk) => <DiskVolumeRow key={disk.id} disk={disk} />)}
        </>
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

  const sub = (key: string, def = true) => flag(config as Record<string, unknown>, key, def)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Unraid-Basis-URL
        </label>
        <input style={inp} value={(config.url as string) || ''} onChange={(e) => onChange('url', e.target.value)} placeholder="http://192.168.1.10 oder https://tower" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          API Key
        </label>
        <input style={inp} type="password" value={(config.apiKey as string) || ''} onChange={(e) => onChange('apiKey', e.target.value)} placeholder="x-api-key" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Aktualisierung (Sek.)
        </label>
        <select style={{ ...inp, cursor: 'pointer' }} value={(config.refreshInterval as number) ?? 5} onChange={(e) => onChange('refreshInterval', Number(e.target.value))}>
          <option value={2}>2</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>

      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anzeige — grob</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ToggleRow label="🖥️ CPU (Sektion)" on={sub('showCpu')} onToggle={() => onChange('showCpu', !sub('showCpu'))} />
          <ToggleRow label="💾 RAM" on={sub('showRam')} onToggle={() => onChange('showRam', !sub('showRam'))} />
          <ToggleRow label="🗄️ Array" on={sub('showArray')} onToggle={() => onChange('showArray', !sub('showArray'))} />
          <ToggleRow label="💿 Pools / Cache" on={sub('showPools')} onToggle={() => onChange('showPools', !sub('showPools'))} />
        </div>
      </div>

      {sub('showCpu') && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CPU — Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px', borderLeft: '2px solid var(--border)' }}>
            <ToggleRow label="Auslastung %" on={sub('showCpuLoad')} onToggle={() => onChange('showCpuLoad', !sub('showCpuLoad'))} />
            <ToggleRow label="Paket-Temperatur" on={sub('showCpuPkgTemp')} onToggle={() => onChange('showCpuPkgTemp', !sub('showCpuPkgTemp'))} />
            <ToggleRow label="Kerne / Threads" on={sub('showCpuCores')} onToggle={() => onChange('showCpuCores', !sub('showCpuCores'))} />
          </div>
        </div>
      )}

      {sub('showArray') && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Array — Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px', borderLeft: '2px solid var(--border)' }}>
            <ToggleRow label="Gesamt-Balken" on={sub('showArrayTotal')} onToggle={() => onChange('showArrayTotal', !sub('showArrayTotal'))} />
            <ToggleRow label="Einzelne Disks (Status · Temp · %)" on={sub('showArrayDisks')} onToggle={() => onChange('showArrayDisks', !sub('showArrayDisks'))} />
          </div>
        </div>
      )}

      {sub('showPools') && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pools / Cache — Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px', borderLeft: '2px solid var(--border)' }}>
            <ToggleRow label="Gesamt-Balken (alle Cache-Disks)" on={sub('showPoolsTotal')} onToggle={() => onChange('showPoolsTotal', !sub('showPoolsTotal'))} />
            <ToggleRow label="Einzelne Cache-Disks" on={sub('showPoolsDisks')} onToggle={() => onChange('showPoolsDisks', !sub('showPoolsDisks'))} />
          </div>
        </div>
      )}

      {sub('showRam') && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>RAM — Anzeige</p>
          <div style={{ paddingLeft: '4px', borderLeft: '2px solid var(--border)' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Balken und Text</label>
            <select
              style={{ ...inp, cursor: 'pointer' }}
              value={String((config as Record<string, unknown>).ramDisplayMode ?? 'used')}
              onChange={(e) => onChange('ramDisplayMode', e.target.value)}
            >
              <option value="used">Verbrauch (used / total)</option>
              <option value="available">Belegung (1 − verfügbar / total)</option>
              <option value="percentTotal">API-Prozent (metrics.percentTotal)</option>
            </select>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.45, margin: '8px 0 0' }}>
              „1 − verfügbar“ wirkt oft näher am Unraid-Dashboard als reines <code style={{ fontSize: '10px' }}>used</code>. Erfordert <code style={{ fontSize: '10px' }}>metrics.memory.available</code> in der API (Unraid 7.2+).
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
