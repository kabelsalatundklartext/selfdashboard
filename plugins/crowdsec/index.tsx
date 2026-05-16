'use client'

import type { PluginComponent, PluginMeta } from '@/types'
import { CrowdsecWidget, CrowdsecSettings } from './CrowdsecWidget'

export const meta: PluginMeta = {
  id: 'crowdsec',
  name: 'CrowdSec',
  description:
    'Echtzeit-Angriffe nur aus crowdsec.db (Weltkarte, Feed, Top-Länder) — kein LAPI/API-Key nötig.',
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
