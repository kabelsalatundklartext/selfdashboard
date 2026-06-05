export interface CrowdsecFeedItem {
  alertId: number
  ip: string
  country: string
  city: string
  scenario: string
  time_iso: string
  asname: string
  asnumber: string
  iprange: string
  active_ban: boolean
  /** Exact GeoIP coordinates (GeoLite2-City), null when unavailable. */
  lat: number | null
  lon: number | null
}

export interface CrowdsecCountryStat {
  country: string
  count: number
}

export interface CrowdsecGeoipInfo {
  enabled: boolean
  path: string | null
}

export interface CrowdsecDashboardData {
  feed: CrowdsecFeedItem[]
  banFeed?: CrowdsecFeedItem[]
  alertsInRange: number
  alertsLast24h: number
  /** Lokale aktive Banns (wie `cscli decisions list`). */
  activeBans: number
  /** Aktive Community-Blocklist-Entscheidungen (CAPI/lists) — fehlt bei alten server.mjs. */
  communityBans?: number
  countryCount: number
  scenarioCount: number
  countries: CrowdsecCountryStat[]
  geoip?: CrowdsecGeoipInfo
}

export type CrowdsecTab = 'overview' | 'bans' | 'countries'
