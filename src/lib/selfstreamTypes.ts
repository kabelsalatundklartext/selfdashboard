export type SelfstreamNowPlayingItem = {
  user: string
  channel: string
  title: string
  durationSec: number
  isCatchup: boolean
  ip: string
}

export type SelfstreamDashboardPayload = {
  activeStreams: number
  sessions: SelfstreamNowPlayingItem[]
}
