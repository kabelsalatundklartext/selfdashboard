'use client'

import type { PluginComponent, PluginMeta } from '@/types'
import { ThreatMapWidget, ThreatMapSettings } from './ThreatMapWidget'

export const meta: PluginMeta = {
  id: 'crowdsec-threat-map',
  name: 'CrowdSec Threat Map',
  description:
    'Echtzeit-Angriffskarte wie crowdsec-threat-map-docker: Weltkarte, Live-Feed, Top-Länder. Karte und Seitenleiste einzeln ausblendbar — ohne iframe.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🛡️',
  homepage: 'https://github.com/kabelsalatundklartext/crowdsec-threat-map-docker',
  defaultLayout: { w: 12, h: 10, minW: 6, minH: 6 },
  stackedExtraH: 4,
}

export const component: PluginComponent = {
  Widget: ThreatMapWidget,
  Settings: ThreatMapSettings,
}
