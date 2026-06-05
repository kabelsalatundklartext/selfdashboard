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
  /** GeoIP-Standort (City-DB) für die Weltkarte — null ohne City-Datenbank. */
  lat?: number | null
  lon?: number | null
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
  /** Active banned IPs (decisions.until in the future), deduplicated by IP. */
  banFeed: CrowdsecFeedItem[]
  alertsInRange: number
  alertsLast24h: number
  /** Lokale aktive Banns (crowdsec/cscli/console) — wie `cscli decisions list`. */
  activeBans: number
  /** Aktive Community-Blocklist-Entscheidungen (CAPI/lists) — separat ausgewiesen. */
  communityBans: number
  countryCount: number
  scenarioCount: number
  countries: CrowdsecCountryStat[]
  geoip?: CrowdsecGeoipInfo
}
