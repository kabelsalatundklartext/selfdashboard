import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'
import { CrowdsecSettings } from './CrowdsecSettings'
import { CrowdsecWidget } from './CrowdsecWidget'

export const meta: PluginMeta = {
  id: 'crowdsec',
  name: 'CrowdSec',
  description:
    'Kompaktes CrowdSec-Dashboard aus crowdsec.db: Übersicht, Banns, Länder und durchsuchbarer IP-Feed mit Lookup-Links und optionalem Entsperren per Docker/cscli. API: /api/plugins/crowdsec.',
  version: '1.4.5',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🛡️',
  iconUrl: '/plugin-logos/crowdsec.png',
  defaultLayout: { w: 5, h: 6, minW: 4, minH: 4 },
  stackedExtraH: 2,
}

function Widget({ config, layoutMode, theme }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale)
  return <CrowdsecWidget config={config} locale={locale} layoutMode={layoutMode} theme={theme} />
}

export const component: PluginComponent = {
  Widget,
  Settings: CrowdsecSettings,
}
