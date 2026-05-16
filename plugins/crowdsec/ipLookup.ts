import type { FeedItem } from '@/lib/crowdsecMetrics'

export type IpLookupLink = {
  id: string
  label: string
  icon: string
  href: (item: Pick<FeedItem, 'ip' | 'iprange'>) => string
}

/** Externe IP-Recherche — wie crowdsec-threat-map-docker ctx-menu */
export const IP_LOOKUP_LINKS: IpLookupLink[] = [
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
      const lookup = d.iprange?.trim() || d.ip
      return `https://apps.db.ripe.net/db-web-ui/query?bflag=true&dflag=false&rflag=false&source=GRS&searchtext=${encodeURIComponent(lookup)}`
    },
  },
  {
    id: 'ripestat',
    label: 'RIPEstat',
    icon: '📊',
    href: (d) => {
      const lookup = d.iprange?.trim() || d.ip
      return `https://stat.ripe.net/${encodeURIComponent(lookup)}`
    },
  },
  {
    id: 'criminalip',
    label: 'Criminal IP',
    icon: '⚠️',
    href: (d) => `https://www.criminalip.io/asset/report/${encodeURIComponent(d.ip)}`,
  },
]
