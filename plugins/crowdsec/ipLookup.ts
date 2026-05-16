import type { CrowdsecFeedItem } from '@/lib/crowdsecMetrics'

export type LookupServiceId =
  | 'cti'
  | 'shodan'
  | 'censys'
  | 'ripe'
  | 'ripestat'
  | 'criminalip'

export type LookupService = {
  id: LookupServiceId
  label: string
  icon: string
  href: (item: Pick<CrowdsecFeedItem, 'ip' | 'iprange'>) => string
}

export const LOOKUP_SERVICES: LookupService[] = [
  {
    id: 'cti',
    label: 'CrowdSec CTI',
    icon: '🛡',
    href: (d) => `https://app.crowdsec.net/cti/${encodeURIComponent(d.ip)}`,
  },
  {
    id: 'shodan',
    label: 'Shodan',
    icon: '🔍',
    href: (d) => `https://www.shodan.io/host/${encodeURIComponent(d.ip)}`,
  },
  {
    id: 'censys',
    label: 'Censys',
    icon: '🌐',
    href: (d) => `https://search.censys.io/hosts/${encodeURIComponent(d.ip)}`,
  },
  {
    id: 'ripe',
    label: 'RIPE',
    icon: '📋',
    href: (d) => {
      const q = d.iprange?.trim() || d.ip
      return `https://apps.db.ripe.net/db-web-ui/query?bflag=true&dflag=false&rflag=false&source=GRS&searchtext=${encodeURIComponent(q)}`
    },
  },
  {
    id: 'ripestat',
    label: 'RIPEstat',
    icon: '📊',
    href: (d) => {
      const q = d.iprange?.trim() || d.ip
      return `https://stat.ripe.net/${encodeURIComponent(q)}`
    },
  },
  {
    id: 'criminalip',
    label: 'Criminal IP',
    icon: '⚠️',
    href: (d) => `https://www.criminalip.io/asset/report/${encodeURIComponent(d.ip)}`,
  },
]

export const DEFAULT_LOOKUP_ENABLED: Record<LookupServiceId, boolean> = {
  cti: true,
  shodan: true,
  censys: true,
  ripe: true,
  ripestat: true,
  criminalip: true,
}
