'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'unraid',
  name: 'Unraid',
  description:
    'System-Übersicht per Unraid GraphQL API (7.2+): CPU, RAM, Array, Cache/Pool-Disks, Netz. Array- und Pool-Zeilen mit Status, Temperatur und Belegung; feine Anzeige-Optionen.',
  version: '1.3.3',
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
    networkInterfaces {
      name
      ipAddress
      status
      description
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

interface NetIface {
  name: string
  ipAddress?: string | null
  status?: string | null
  /** Unraid liefert hier oft keinen Speed — falls doch Text wie „2500 Mb/s“, wird er für Balken genutzt */
  description?: string | null
}

interface UnraidData {
  cpu?: { brand: string; cores: number; threads: number; utilization: number; temp: number }
  memory?: { total: number; used: number; free: number }
  networkIfaces?: NetIface[]
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

function fmtBps(bps: number) {
  if (bps >= 1024 ** 3) return `${(bps / 1024 ** 3).toFixed(2)} GB/s`
  if (bps >= 1024 ** 2) return `${(bps / 1024 ** 2).toFixed(2)} MB/s`
  if (bps >= 1024) return `${(bps / 1024).toFixed(1)} KB/s`
  return `${bps.toFixed(0)} B/s`
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

function isVirtualIface(name: string): boolean {
  const n = name.toLowerCase()
  if (n === 'lo') return true
  if (n.startsWith('veth')) return true
  if (n.startsWith('shim-')) return true
  if (n === 'docker0') return true
  if (n.startsWith('virbr')) return true
  if (n.startsWith('br-')) return true
  if (n.startsWith('wg')) return true
  if (n.startsWith('tun')) return true
  if (n.startsWith('tap')) return true
  return false
}

function Bar({ value, danger = 90 }: { value: number; danger?: number }) {
  const c = value >= danger ? '#ef4444' : value >= 70 ? '#f59e0b' : 'var(--accent)'
  return (
    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border)', width: '100%', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: c, borderRadius: '2px', transition: 'width 0.5s ease' }} />
    </div>
  )
}

function Row({ label, value, bar, pct: p }: { label: string; value: string; bar?: boolean; pct?: number }) {
  return (
    <div
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
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {bar && p !== undefined ? (
        <div style={{ flex: '1 1 38%', minWidth: '40px', maxWidth: '100%' }}>
          <Bar value={p} danger={label.includes('°') || /temp/i.test(label) ? 80 : 90} />
        </div>
      ) : (
        <span style={{ flex: '1 1 38%' }} />
      )}
      <span
        style={{
          flex: '0 0 auto',
          maxWidth: '42%',
          fontSize: '11px',
          color: 'var(--text)',
          fontWeight: 500,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          paddingLeft: '6px',
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
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        margin: '10px 0 6px',
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
        paddingTop: '8px',
        marginTop: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', minWidth: 0, flexWrap: 'wrap' }}>
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
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            lineHeight: 1.35,
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
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '6px' }}>
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

  const ifacesRaw = (info?.networkInterfaces as Record<string, unknown>[] | undefined) ?? []
  const networkIfaces: NetIface[] = ifacesRaw.map((n) => ({
    name: String(n.name ?? ''),
    ipAddress: n.ipAddress as string | null | undefined,
    status: n.status as string | null | undefined,
    description: (n.description as string | null | undefined) ?? undefined,
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

const NET_JSON_RX_KEYS = ['rxBps', 'rx_bps', 'downloadBps', 'download', 'rx'] as const
const NET_JSON_TX_KEYS = ['txBps', 'tx_bps', 'uploadBps', 'upload', 'tx'] as const

type NetSpeedRates = { rx: number; tx: number; linkMbps: number }

/** Mbit/s aus Freitext (description / Skript), z. B. „2500 Mb/s“, „10 Gbps“, „2.5 Gbit“ */
function parseLinkMbpsFromText(text: string | null | undefined): number {
  if (!text || typeof text !== 'string') return 0
  const s = text.replace(/,/g, '.').toLowerCase()

  const g = s.match(/(\d+(?:\.\d+)?)\s*(?:g(?:bit)?(?:\/s)?(?:ps)?|gbps|gbe)\b/)
  if (g) {
    const v = parseFloat(g[1])
    if (Number.isFinite(v) && v > 0) return Math.min(200_000, Math.round(v * 1000))
  }

  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:m(?:bit)?(?:\/s)?(?:ps)?|mbps|mbe)\b/)
  if (m) {
    const v = parseFloat(m[1])
    if (Number.isFinite(v) && v > 0) return Math.min(200_000, Math.round(v))
  }

  const compact = s.match(/\b(\d{3,5})\s*mb(?:\/s)?\b/i)
  if (compact) {
    const v = parseInt(compact[1], 10)
    if (v >= 100 && v <= 200_000) return v
  }

  return 0
}

function parseNetSpeedJson(raw: unknown): NetSpeedRates | null {
  if (!raw || typeof raw !== 'object') return null
  const j = raw as Record<string, unknown>
  const hasKey = [...NET_JSON_RX_KEYS, ...NET_JSON_TX_KEYS].some((k) => k in j)
  const rx = num(j.rxBps ?? j.rx_bps ?? j.downloadBps ?? j.download ?? j.rx)
  const tx = num(j.txBps ?? j.tx_bps ?? j.uploadBps ?? j.upload ?? j.tx)
  if (!hasKey && rx === 0 && tx === 0) return null
  const linkMbps = num(
    j.linkMbps ??
      j.link_mbps ??
      j.speedMbps ??
      j.speed_mbps ??
      j.maxMbps ??
      j.max_mbps ??
      j.linkSpeedMbps ??
      j.link_speed_mbps ??
      0,
  )
  return { rx, tx, linkMbps: linkMbps > 0 ? Math.min(200_000, Math.round(linkMbps)) : 0 }
}

/** SelfDashboard lädt die URL serverseitig (kein CORS im Browser). */
function netSpeedProxyFetchUrl(speedUrl: string) {
  const t = speedUrl.trim()
  if (!t) return ''
  return `/api/net-stats-proxy?target=${encodeURIComponent(t)}`
}

function flag(config: Record<string, unknown>, key: string, defaultTrue = true) {
  const v = config[key]
  if (v === undefined || v === null) return defaultTrue
  return v !== false
}

function mbpsToBpsCap(mbps: number) {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0
  return (mbps * 1_000_000) / 8
}

/** Mini sparkline: relative heights, last samples right-aligned feel by keeping order */
function ThroughputSparkline({ samples, colorVar }: { samples: number[]; colorVar: string }) {
  const peak = samples.length ? Math.max(...samples, 1) : 1
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px', marginTop: '6px', width: '100%', minWidth: 0 }}>
      {samples.map((v, i) => (
        <div
          key={i}
          title={fmtBps(v)}
          style={{
            flex: '1 1 0',
            minWidth: '2px',
            height: `${Math.max(6, Math.round((v / peak) * 100))}%`,
            borderRadius: '2px',
            background: colorVar,
            opacity: 0.35 + 0.65 * (v / peak),
          }}
        />
      ))}
    </div>
  )
}

function ThroughputBlock({
  rx,
  tx,
  history,
  barMaxMbps,
  jsonLinkMbps,
  graphqlLinkMbps,
  scaleHint,
  showSpark,
}: {
  rx: number
  tx: number
  history: { rx: number; tx: number }[]
  barMaxMbps: number
  /** Aus Durchsatz-JSON (z. B. ethtool im Skript) */
  jsonLinkMbps: number
  /** Aus info.networkInterfaces[].description heuristisch */
  graphqlLinkMbps: number
  scaleHint: string
  showSpark: boolean
}) {
  const fixed = mbpsToBpsCap(barMaxMbps)
  const fromJson = mbpsToBpsCap(jsonLinkMbps)
  const fromGql = mbpsToBpsCap(graphqlLinkMbps)
  const histPeak = history.reduce((m, h) => Math.max(m, h.rx, h.tx), 0)
  const cap =
    fixed > 0
      ? fixed
      : fromJson > 0
        ? fromJson
        : fromGql > 0
          ? fromGql
          : Math.max(8_192, histPeak * 1.08, rx, tx)

  const pr = Math.min(100, (rx / cap) * 100)
  const pt = Math.min(100, (tx / cap) * 100)

  const rxHist = history.map((h) => h.rx)
  const txHist = history.map((h) => h.tx)

  return (
    <div style={{ marginBottom: '6px' }}>
      <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.35 }}>{scaleHint}</p>
      <Row label="↓ Download" value={fmtBps(rx)} bar pct={pr} />
      <Row label="↑ Upload" value={fmtBps(tx)} bar pct={pt} />
      {showSpark && rxHist.length >= 2 && (
        <>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '8px 0 2px', letterSpacing: '0.04em' }}>VERLAUF (DOWNLOAD)</p>
          <ThroughputSparkline samples={rxHist} colorVar="var(--accent)" />
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '8px 0 2px', letterSpacing: '0.04em' }}>VERLAUF (UPLOAD)</p>
          <ThroughputSparkline samples={txHist} colorVar="var(--text-muted)" />
        </>
      )}
    </div>
  )
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

function Widget({ config }: PluginWidgetProps) {
  const [data, setData] = useState<UnraidData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [netBps, setNetBps] = useState<NetSpeedRates | null>(null)
  const [netBpsErr, setNetBpsErr] = useState<string | null>(null)
  const [netHist, setNetHist] = useState<{ rx: number; tx: number }[]>([])

  const url = (config.url as string)?.replace(/\/$/, '')
  const apiKey = config.apiKey as string
  const refresh = ((config.refreshInterval as number) ?? 5) * 1000
  const speedUrl = ((config.netSpeedJsonUrl as string) || '').trim()

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
  const showNetwork = flag(config, 'showNetwork')
  const hideVirtualIfaces = flag(config, 'hideVirtualIfaces', true)
  const showNetSpeed = flag(config, 'showNetSpeed', false)
  const barMaxMbps = num((config as Record<string, unknown>).netSpeedBarMaxMbps)
  const showNetSpark = flag(config, 'showNetSpeedSparkline', true)

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

      if (showNetSpeed && speedUrl) {
        try {
          const proxied = netSpeedProxyFetchUrl(speedUrl)
          const r = await fetch(proxied, { method: 'GET', cache: 'no-store' })
          const t = await r.text()
          let parsed: unknown
          try {
            parsed = JSON.parse(t) as unknown
          } catch {
            parsed = null
          }
          const rates = parseNetSpeedJson(parsed)
          if (!rates && /<\s*html/i.test(t)) {
            setNetBps(null)
            setNetBpsErr('Antwort ist HTML (z. B. Unraid-Login) — siehe scripts/unraid/EINFACH.txt für den einfachen Weg (Port 8765).')
          } else {
            setNetBps(rates)
            setNetBpsErr(rates ? null : 'JSON unbekannt (erwarte rxBps/txBps)')
            if (rates) setNetHist((h) => [...h.slice(-35), { rx: rates.rx, tx: rates.tx }])
          }
        } catch (e) {
          setNetBpsErr(e instanceof Error ? e.message : 'Netz-Speed-URL')
          setNetBps(null)
        }
      } else {
        setNetBps(null)
        setNetBpsErr(null)
        setNetHist([])
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [url, apiKey, showNetSpeed, speedUrl])

  useEffect(() => {
    if (!showNetSpeed || !speedUrl) setNetHist([])
  }, [showNetSpeed, speedUrl])

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
    padding: '10px 18px 16px',
  }

  if (!url || !apiKey)
    return (
      <div style={{ ...shellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '32px' }}>🖥️</span>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          URL & API Key
          <br />
          in Einstellungen eintragen
        </p>
      </div>
    )

  if (loading)
    return (
      <div style={shellStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '12px', width: `${w}%`, borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    )

  if (error)
    return (
      <div style={{ ...shellStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', wordBreak: 'break-word' }}>{error}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
          URL ohne Endpfad, API-Key mit Rolle VIEWER oder ADMIN.
        </p>
      </div>
    )

  const arrayKb = data?.array?.capacity?.kilobytes
  const ramPct = data?.memory ? pct(data.memory.used, data.memory.total) : 0
  const poolDisks = data?.pools ?? []
  const poolAgg = aggregateDisks(poolDisks)
  const poolPct = poolAgg.total ? pct(poolAgg.used, poolAgg.total) : 0

  const ifaces = (data?.networkIfaces ?? []).filter((n) => (hideVirtualIfaces ? !isVirtualIface(n.name) : true))
  const graphqlLinkMbps = ifaces.reduce((m, n) => Math.max(m, parseLinkMbpsFromText(n.description)), 0)

  const netScaleHint = (() => {
    if (barMaxMbps > 0) return `Balkenskala: ${barMaxMbps} Mbit/s (Einstellung).`
    if (netBps && netBps.linkMbps > 0) return `Balkenskala: ${netBps.linkMbps} Mbit/s (linkMbps im JSON, z. B. ethtool).`
    if (graphqlLinkMbps > 0) return `Balkenskala: ${graphqlLinkMbps} Mbit/s (aus Interface-Beschreibung geschätzt).`
    return 'Balkenskala: automatisch nach letzter Last (kein fixer Link in API/JSON).'
  })()

  return (
    <div style={shellStyle}>
      {showCpu && data?.cpu && (
        <>
          <Heading text={`CPU — ${data.cpu.brand}`} />
          {showCpuLoad && <Row label="Auslastung" value={`${data.cpu.utilization}%`} bar pct={data.cpu.utilization} />}
          {showCpuPkgTemp && data.cpu.temp > 0 && <Row label="Paket-Temp." value={`${data.cpu.temp}°C`} bar pct={data.cpu.temp} />}
          {showCpuCores && <Row label="Kerne / Threads" value={`${data.cpu.cores} / ${data.cpu.threads}`} />}
        </>
      )}

      {showRam && data?.memory && (
        <>
          <Heading text="RAM" />
          <Row label="Verbrauch" value={`${fmtBytes(data.memory.used)} / ${fmtBytes(data.memory.total)}`} bar pct={ramPct} />
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

      {showNetwork && ifaces.length > 0 && (
        <>
          <Heading text="Netzwerk" />
          {showNetSpeed && (
            <>
              {netBps ? (
                <ThroughputBlock
                  rx={netBps.rx}
                  tx={netBps.tx}
                  history={netHist}
                  barMaxMbps={barMaxMbps}
                  jsonLinkMbps={netBps.linkMbps}
                  graphqlLinkMbps={graphqlLinkMbps}
                  scaleHint={netScaleHint}
                  showSpark={showNetSpark}
                />
              ) : (
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 8px' }}>
                  {speedUrl
                    ? netBpsErr
                      ? `Durchsatz-URL: ${netBpsErr}`
                      : 'Durchsatz-URL liefert noch keine Werte (JSON: rxBps, txBps).'
                    : 'Live-Durchsatz liefert die Unraid-GraphQL-API für den Host nicht — optional „JSON-URL“ in den Einstellungen (eigenes Skript + CORS) oder z. B. Grafana.'}
                </p>
              )}
            </>
          )}
          {ifaces.map((n) => (
            <Row key={n.name} label={n.name} value={[n.ipAddress, n.status].filter(Boolean).join(' · ') || '—'} />
          ))}
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
          <ToggleRow label="🌐 Netzwerk" on={sub('showNetwork')} onToggle={() => onChange('showNetwork', !sub('showNetwork'))} />
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

      {sub('showNetwork') && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Netzwerk — Filter & Durchsatz</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px', borderLeft: '2px solid var(--border)' }}>
            <ToggleRow
              label="veth / shim / docker0 … ausblenden"
              on={sub('hideVirtualIfaces', true)}
              onToggle={() => onChange('hideVirtualIfaces', !sub('hideVirtualIfaces', true))}
            />
            <ToggleRow label="Durchsatz (JSON-URL, Balken + Verlauf)" on={sub('showNetSpeed', false)} onToggle={() => onChange('showNetSpeed', !sub('showNetSpeed', false))} />
            <ToggleRow
              label="Mini-Verlauf (letzte Messungen)"
              on={sub('showNetSpeedSparkline', true)}
              onToggle={() => onChange('showNetSpeedSparkline', !sub('showNetSpeedSparkline', true))}
            />
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>JSON-URL (serverseitig, ohne CORS)</label>
            <input
              style={inp}
              value={(config.netSpeedJsonUrl as string) || ''}
              onChange={(e) => onChange('netSpeedJsonUrl', e.target.value)}
              placeholder="http://192.168.1.10:8765/net-stats.json"
            />
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '10px', marginBottom: '4px' }}>
              Balkenskala max. Mbit/s (0 = JSON linkMbps → API-Text → Verlauf)
            </label>
            <input
              style={inp}
              type="number"
              min={0}
              step={10}
              value={Number.isFinite(Number((config as Record<string, unknown>).netSpeedBarMaxMbps)) ? Number((config as Record<string, unknown>).netSpeedBarMaxMbps) : 0}
              onChange={(e) => onChange('netSpeedBarMaxMbps', e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="0"
            />
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              Trage die volle <strong>http(s)://…</strong>-Adresse ein (nur <strong>private IPv4</strong>, z. B. 192.168.x.x). SelfDashboard holt sie{' '}
              <strong>serverseitig</strong> über <code style={{ fontSize: '10px' }}>/api/net-stats-proxy</code> — kein CORS im Browser. Die Unraid-Web-Oberfläche
              liefert <code style={{ fontSize: '10px' }}>/net-stats.json</code> oft mit Login um — deshalb der einfache Weg: kleiner Datei-Server auf extra Port, siehe{' '}
              <code style={{ fontSize: '10px' }}>scripts/unraid/EINFACH.txt</code>. JSON:{' '}
              <code style={{ fontSize: '10px' }}>{`{ "rxBps": …, "txBps": …, "linkMbps": 2500 }`}</code> (Bytes/s, linkMbps optional).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
