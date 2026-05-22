'use client'

import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import { CrowdsecWidget, parseCrowdsecConfig } from './CrowdsecWidget'
import {
  DEFAULT_LOOKUP_ENABLED,
  LOOKUP_SERVICES,
  type LookupServiceId,
} from './ipLookup'
import { DAY_RANGE_PRESETS, MAX_ALERT_PRESETS } from './presets'

export const meta: PluginMeta = {
  id: 'crowdsec',
  name: 'CrowdSec',
  description:
    'Kompaktes CrowdSec-Dashboard aus crowdsec.db: Übersicht, Banns, Länder und durchsuchbarer IP-Feed mit Lookup-Links und optionalem Entsperren per Docker/cscli. API: /api/plugins/crowdsec.',
  version: '1.4.4',
  author: 'SelfDashboard',
  category: 'security',
  icon: '🛡️',
  iconUrl: '/plugin-logos/crowdsec.png',
  defaultLayout: { w: 5, h: 6, minW: 4, minH: 4 },
  stackedExtraH: 2,
}

function CrowdsecSettings({ config, onChange }: PluginSettingsProps) {
  const locale = useDashboardStore((s) => s.locale)
  const de = locale !== 'en'
  const cfg = parseCrowdsecConfig(config)
  const lookup = cfg.lookupEnabled

  const setLookup = (id: LookupServiceId, enabled: boolean) => {
    onChange('lookupEnabled', { ...lookup, [id]: enabled })
  }

  return (
    <section className="cs-settings">
      <label className="cs-settings-row">
        <span>{de ? 'Datenbankpfad' : 'Database path'}</span>
        <input
          type="text"
          value={cfg.dbPath}
          onChange={(e) => onChange('dbPath', e.target.value)}
          placeholder="/crowdsec-data/crowdsec.db"
        />
      </label>
      <label className="cs-settings-row">
        <span>{de ? 'Zeitraum (Alerts aus DB)' : 'Time range (alerts from DB)'}</span>
        <select
          value={cfg.daysBack}
          onChange={(e) => onChange('daysBack', Number(e.target.value))}
        >
          {DAY_RANGE_PRESETS.map((p) => (
            <option key={p.days} value={p.days}>
              {de ? p.de : p.en}
            </option>
          ))}
        </select>
      </label>
      <label className="cs-settings-row">
        <span>{de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}</span>
        <input
          type="number"
          min={5}
          max={600}
          value={cfg.refreshSeconds}
          onChange={(e) => onChange('refreshSeconds', Number(e.target.value))}
        />
      </label>
      <label className="cs-settings-row">
        <span>{de ? 'Max. Alerts aus DB' : 'Max alerts from DB'}</span>
        <select value={cfg.maxAlerts} onChange={(e) => onChange('maxAlerts', Number(e.target.value))}>
          {MAX_ALERT_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {de ? p.de : p.en}
            </option>
          ))}
        </select>
      </label>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.45 }}>
        {de
          ? '„Alle“ beim Zeitraum = gesamte Datenbank. „Alle“ bei Max. Alerts = kein LIMIT (kann bei sehr großen DBs länger laden).'
          : '“All” time range = entire database. “All” max alerts = no LIMIT (large DBs may load slower).'}
      </p>
      <label className="cs-settings-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={cfg.showCountriesList}
          onChange={(e) => onChange('showCountriesList', e.target.checked)}
        />
        <span>
          {de
            ? 'Länderliste in der Sidebar dauerhaft anzeigen'
            : 'Always show country list in sidebar'}
        </span>
      </label>
      <label className="cs-settings-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={cfg.dockerUnban}
          onChange={(e) => onChange('dockerUnban', e.target.checked)}
        />
        <span>{de ? 'Entsperren per Docker/cscli' : 'Unban via Docker/cscli'}</span>
      </label>
      {cfg.dockerUnban && (
        <>
          <label className="cs-settings-row">
            <span>{de ? 'CrowdSec-Container' : 'CrowdSec container'}</span>
            <input
              type="text"
              value={cfg.crowdsecContainer}
              onChange={(e) => onChange('crowdsecContainer', e.target.value)}
              placeholder="crowdsec"
            />
          </label>
        </>
      )}
      <p style={{ margin: '12px 0 4px', fontSize: 12, color: 'var(--text-muted)' }}>
        {de ? 'IP-Lookup-Dienste' : 'IP lookup services'}
      </p>
      <section className="cs-lookup-grid">
        {LOOKUP_SERVICES.map((s) => (
          <label key={s.id}>
            <input
              type="checkbox"
              checked={lookup[s.id] ?? DEFAULT_LOOKUP_ENABLED[s.id]}
              onChange={(e) => setLookup(s.id, e.target.checked)}
            />
            {s.label}
          </label>
        ))}
      </section>
    </section>
  )
}

function Widget({ config, layoutMode, theme }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale)
  return <CrowdsecWidget config={config} locale={locale} layoutMode={layoutMode} theme={theme} />
}

export const component: PluginComponent = {
  Widget,
  Settings: CrowdsecSettings,
}
