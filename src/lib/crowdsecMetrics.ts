export interface AttackPoint {
  lat: number
  lon: number
  country: string
  city: string
  scenario: string
  ip: string
  count: number
}

export interface FeedItem {
  ip: string
  country: string
  city: string
  scenario: string
  time_iso: string
  time_de: string
  asname: string
  asnumber: string
  iprange: string
  lat: number
  lon: number
  active_ban: boolean
  count: number
}

export interface ParsedCrowdsecMetrics {
  attackData: AttackPoint[]
  feedData: FeedItem[]
  totalAlerts: number
  serverLat: number
  serverLon: number
  serverName: string
}

function parseLabels(labelStr: string): Record<string, string> {
  const labels: Record<string, string> = {}
  const re = /(\w+)="((?:\\.|[^"\\])*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(labelStr))) {
    labels[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return labels
}

function parseMetricLine(line: string): { name: string; labels: Record<string, string>; value: number } | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const brace = trimmed.indexOf('{')
  if (brace === -1) {
    const parts = trimmed.split(/\s+/)
    if (parts.length < 2) return null
    const value = Number(parts[parts.length - 1])
    if (!Number.isFinite(value)) return null
    return { name: parts[0], labels: {}, value }
  }
  const close = trimmed.lastIndexOf('}')
  if (close === -1) return null
  const name = trimmed.slice(0, brace)
  const labels = parseLabels(trimmed.slice(brace + 1, close))
  const value = Number(trimmed.slice(close + 1).trim())
  if (!Number.isFinite(value)) return null
  return { name, labels, value }
}

export function parseCrowdsecMetricsText(text: string): ParsedCrowdsecMetrics {
  const attackData: AttackPoint[] = []
  const feedSeen = new Set<string>()
  const feedData: FeedItem[] = []
  let totalAlerts = 0
  let serverLat = 0
  let serverLon = 0
  let serverName = ''

  for (const line of text.split('\n')) {
    if (line.startsWith('cs_exporter_total_alerts ')) {
      const n = Number(line.split(/\s+/)[1])
      if (Number.isFinite(n)) totalAlerts = n
      continue
    }

    const parsed = parseMetricLine(line)
    if (!parsed) continue

    if (parsed.name === 'cs_attack_flow') {
      const lb = parsed.labels
      const lat = Number(lb.src_lat)
      const lon = Number(lb.src_lon)
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        attackData.push({
          lat,
          lon,
          country: lb.country || '??',
          city: lb.city || lb.src_city || '',
          scenario: lb.scenario || 'unknown',
          ip: lb.ip || '',
          count: parsed.value || 1,
        })
      }
      const dstLat = Number(lb.dst_lat)
      const dstLon = Number(lb.dst_lon)
      if (Number.isFinite(dstLat) && Number.isFinite(dstLon) && (dstLat !== 0 || dstLon !== 0)) {
        serverLat = dstLat
        serverLon = dstLon
      }
      if (lb.server) serverName = lb.server
      continue
    }

    if (parsed.name === 'cs_lapi_realtime') {
      const lb = parsed.labels
      if (!lb.ip || !lb.attack_time_iso) continue
      const key = `${lb.ip}|${lb.scenario}|${lb.attack_time_iso}`
      if (feedSeen.has(key)) continue
      feedSeen.add(key)
      feedData.push({
        ip: lb.ip,
        country: lb.country || '??',
        city: lb.city || lb.src_city || '',
        scenario: lb.scenario || 'unknown',
        time_iso: lb.attack_time_iso,
        time_de: lb.attack_time || '',
        asname: lb.asname || '',
        asnumber: lb.asnumber || '',
        iprange: lb.iprange || '',
        lat: Number(lb.latitude) || 0,
        lon: Number(lb.longitude) || 0,
        active_ban: lb.active_ban === 'True' || lb.active_ban === 'true',
        count: 1,
      })
    }
  }

  return { attackData, feedData, totalAlerts, serverLat, serverLon, serverName }
}

export function countColor(n: number): string {
  if (n >= 20) return '#ff2244'
  if (n >= 10) return '#ff8800'
  if (n >= 5) return '#ffff00'
  return '#00ff88'
}
