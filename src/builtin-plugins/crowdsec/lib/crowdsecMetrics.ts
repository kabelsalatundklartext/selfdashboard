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
  activeBans: number
  countryCount: number
  scenarioCount: number
  countries: CrowdsecCountryStat[]
  geoip?: CrowdsecGeoipInfo
}
