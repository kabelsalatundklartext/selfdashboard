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

export function countColor(n: number): string {
  if (n >= 20) return '#ff2244'
  if (n >= 10) return '#ff8800'
  if (n >= 5) return '#ffff00'
  return '#00ff88'
}
