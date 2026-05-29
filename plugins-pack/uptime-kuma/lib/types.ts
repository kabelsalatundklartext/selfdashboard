export type UptimeKumaMonitorStatus = 'up' | 'down' | 'pending' | 'maintenance'

export type UptimeKumaMonitorRow = {
  id: number
  name: string
  group: string
  type: string
  status: UptimeKumaMonitorStatus
}

export type UptimeKumaDashboardPayload = {
  slug: string
  monitors: UptimeKumaMonitorRow[]
  counts: {
    up: number
    down: number
    pending: number
    maintenance: number
    total: number
  }
}
