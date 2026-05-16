'use client'

import type { PluginComponent, PluginMeta } from '@/types'
import { CrowdsecWidget, CrowdsecSettings } from '../crowdsec-threat-map/ThreatMapWidget'

export const meta: PluginMeta = {
  id: 'crowdsec',
  name: 'CrowdSec',
  description:
    'Echtzeit-Angriffe aus der CrowdSec-Datenbank (crowdsec.db): Weltkarte, Live-Feed, Top-Länder. Karte und Seitenleiste einzeln ausblendbar.',
  version: '2.0.0',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🛡️',
  homepage: 'https://docs.crowdsec.net',
  defaultLayout: { w: 12, h: 10, minW: 6, minH: 6 },
  stackedExtraH: 4,
}

export const component: PluginComponent = {
  Widget: CrowdsecWidget,
  Settings: CrowdsecSettings,
}
