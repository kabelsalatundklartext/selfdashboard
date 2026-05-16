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

export interface CrowdsecDashboardData {
  feed: CrowdsecFeedItem[]
  alertsInRange: number
  alertsLast24h: number
  activeBans: number
  countryCount: number
  scenarioCount: number
  countries: CrowdsecCountryStat[]
}
