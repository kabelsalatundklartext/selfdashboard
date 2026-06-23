import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { Copy, Globe, Search, Shield, Trash2 } from 'lucide-react'
import { pluginApiJson, pluginApiJsonWithStale, reportPluginError } from '@/lib/pluginDev'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { ThemeId } from '@/types'
import { parseCrowdsecConfig } from './config'
import { COUNTRY_NAME } from './constants'
import { CountryFlag } from './CountryFlag'
import { CrowdsecLogo } from './CrowdsecLogo'
import { normalizeCountryCode } from './flags'
import { IpLookupMenu } from './IpLookupMenu'
import { LOOKUP_SERVICES } from './ipLookup'
import { alertRangeLabel } from './presets'
import type { CrowdsecDashboardData, CrowdsecFeedItem } from './types'
import { WorldMap, type WorldMapPoint } from './WorldMap'

function formatInt(n: number, locale: 'de' | 'en'): string {
  return Math.round(n).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')
}

function formatRelative(iso: string, locale: 'de' | 'en'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const sec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale === 'en' ? 'en' : 'de', { numeric: 'auto' })
  const abs = Math.abs(sec)
  if (abs < 60) return rtf.format(sec, 'second')
  const min = Math.round(sec / 60)
  if (Math.abs(min) < 60) return rtf.format(min, 'minute')
  const hr = Math.round(min / 60)
  if (Math.abs(hr) < 48) return rtf.format(hr, 'hour')
  const day = Math.round(hr / 24)
  return rtf.format(day, 'day')
}

function feedMatchesSearch(item: CrowdsecFeedItem, q: string): boolean {
  if (!q) return true
  const cc = normalizeCountryCode(item.country)
  const hay = [
    item.ip,
    cc,
    COUNTRY_NAME[cc] || '',
    item.city,
    item.scenario,
    item.asname,
    item.asnumber,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

/** Map a scenario/ban status to a marker severity for the world map. */
function severityOf(item: CrowdsecFeedItem): 'crit' | 'warn' | 'info' {
  if (/cve|exploit|\brce\b|traversal|sqli|log4j|backdoor/i.test(item.scenario)) return 'crit'
  if (item.active_ban) return 'warn'
  return 'info'
}

function segStyle(active: boolean): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    padding: '5px 11px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--cs-info, #7b6cf6)' : 'transparent',
    color: active ? '#fff' : 'var(--cs-muted, #9aa0c4)',
  }
}

async function copyIp(ip: string, e?: MouseEvent) {
  e?.stopPropagation()
  e?.preventDefault()
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(ip)
      return
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = ip
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } catch {
    /* ignore */
  }
}

export function CrowdsecWidget({
  config: raw,
  locale,
  layoutMode = 'desktop',
  theme = 'dark',
}: {
  config: Record<string, unknown>
  locale: 'de' | 'en'
  layoutMode?: 'phone' | 'tablet' | 'desktop'
  theme?: ThemeId
}) {
  const de = locale !== 'en'
  const cfg = useMemo(() => parseCrowdsecConfig(raw), [raw])
  const layoutClass =
    layoutMode === 'phone' ? 'cs-layout-phone' : layoutMode === 'tablet' ? 'cs-layout-tablet' : ''

  const [data, setData] = useState<CrowdsecDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [lookupItem, setLookupItem] = useState<CrowdsecFeedItem | null>(null)
  const [lookupAnchor, setLookupAnchor] = useState<HTMLElement | null>(null)
  const [unbanPending, setUnbanPending] = useState<CrowdsecFeedItem | null>(null)
  const [unbanBusy, setUnbanBusy] = useState(false)
  const [unbanMsg, setUnbanMsg] = useState<string | null>(null)
  const [view, setView] = useState<'feed' | 'map'>('feed')
  const [mapMode, setMapMode] = useState<'dots' | 'arcs'>('dots')

  // Karte deaktiviert (Einstellungen) → immer Liste zeigen.
  useEffect(() => {
    if (!cfg.showMap && view === 'map') setView('feed')
  }, [cfg.showMap, view])
  const showMapView = cfg.showMap && view === 'map'

  const lookupServices = useMemo(
    () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
    [cfg.lookupEnabled],
  )

  const { active } = usePollingActive()

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      dbPath: cfg.dbPath,
      daysBack: String(cfg.daysBack),
      maxAlerts: String(Math.min(cfg.maxAlerts, 2000)),
    })
    try {
      const json = await pluginApiJsonWithStale<CrowdsecDashboardData>('crowdsec', `/?${params}`, {
        timeoutMs: 50_000,
        staleMaxAgeMs: 60_000,
      })
      setData(json)
      setError(null)
    } catch (e) {
      const code = e instanceof Error ? e.message : 'crowdsec_error'
      reportPluginError('crowdsec', code, { category: 'fetch' })
      setError(code.startsWith('HTTP ') ? 'network_error' : code)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [cfg.dbPath, cfg.daysBack, cfg.maxAlerts])

  useEffect(() => {
    if (!active) return
    setLoading(true)
    void fetchData()
    const id = window.setInterval(() => void fetchData(), cfg.refreshSeconds * 1000)
    return () => window.clearInterval(id)
  }, [active, fetchData, cfg.refreshSeconds, cfg.daysBack, cfg.maxAlerts])

  const q = search.trim().toLowerCase()
  const baseFeed = useMemo(() => data?.feed ?? [], [data])
  const filteredFeed = useMemo(() => baseFeed.filter((f) => feedMatchesSearch(f, q)), [baseFeed, q])
  // Punkte am (fast) selben Ort zusammenfassen — sonst stapeln sich an
  // Hotspots dutzende identische Maximal-Kreise (hässliche Blobs).
  const mapPoints = useMemo<WorldMapPoint[]>(() => {
    const groups = new Map<string, WorldMapPoint>()
    for (const it of filteredFeed) {
      const cc = normalizeCountryCode(it.country) || it.country
      const lon = it.lon ?? undefined
      const lat = it.lat ?? undefined
      const key =
        lon !== undefined && lat !== undefined ? `${lon.toFixed(1)},${lat.toFixed(1)}` : `cc:${cc}`
      const sev = severityOf(it)
      const prev = groups.get(key)
      if (prev) {
        prev.count += 1
        if (sev === 'crit' || (sev === 'warn' && prev.severity === 'info')) prev.severity = sev
      } else {
        groups.set(key, { cc, lon, lat, count: 1, severity: sev })
      }
    }
    return [...groups.values()]
  }, [filteredFeed])

  const errLabel = (code: string) => {
    const map = de
      ? {
          db_not_found: 'crowdsec.db nicht gefunden — Pfad und Volume prüfen.',
          db_path_not_allowed: 'Datenbankpfad nicht erlaubt.',
          db_schema_unsupported: 'Datenbankschema wird nicht unterstützt.',
          network_error: 'Netzwerkfehler beim Laden.',
          crowdsec_error: 'Fehler beim Lesen der Datenbank.',
        }
      : {
          db_not_found: 'crowdsec.db not found — check path and volume mount.',
          db_path_not_allowed: 'Database path not allowed.',
          db_schema_unsupported: 'Database schema not supported.',
          network_error: 'Network error while loading.',
          crowdsec_error: 'Failed to read database.',
        }
    return map[code as keyof typeof map] || code
  }

  const doUnban = async (item: CrowdsecFeedItem) => {
    setUnbanBusy(true)
    setUnbanMsg(null)
    try {
      await pluginApiJson('crowdsec', '/decision', {
        method: 'POST',
        body: JSON.stringify({ ip: item.ip, container: cfg.crowdsecContainer }),
      })
      setUnbanPending(null)
      void fetchData()
    } catch (e) {
      setUnbanMsg(e instanceof Error ? e.message : 'network_error')
    } finally {
      setUnbanBusy(false)
    }
  }

  return (
    <section
      className={`cs-widget ${layoutClass} cs-theme-${theme}`.trim()}
      style={{ position: 'relative' }}
      data-theme={theme}
    >
      {error ? <p className="cs-error">{errLabel(error)}</p> : null}

      <section className="cs-split">
        <aside className="cs-sidebar">
          <header className="cs-brand">
            <CrowdsecLogo variant="brand" />
          </header>

          <section className="cs-nav" aria-label={de ? 'Statistik' : 'Statistics'}>
            <article className="cs-nav-item">
              <span className="cs-nav-row">
                <Shield size={14} strokeWidth={2.2} aria-hidden />
                {de ? 'Übersicht' : 'Overview'}
              </span>
              {data ? (
                <div className="cs-nav-metrics">
                  <div className="cs-nav-metric">
                    <span className="cs-nav-stat cs-nav-stat-compact">{formatInt(data.alertsInRange, locale)}</span>
                    <span className="cs-nav-sub">
                      {de
                        ? `Alerts (${alertRangeLabel(cfg.daysBack, true)})`
                        : `Alerts (${alertRangeLabel(cfg.daysBack, false)})`}
                    </span>
                  </div>
                  <div className="cs-nav-metric">
                    <span className="cs-nav-stat cs-nav-stat-compact">{formatInt(data.activeBans, locale)}</span>
                    <span className="cs-nav-sub">{de ? 'Aktive Banns' : 'Active bans'}</span>
                  </div>
                  {typeof data.communityBans === 'number' ? (
                    <div className="cs-nav-metric">
                      <span className="cs-nav-stat cs-nav-stat-compact">{formatInt(data.communityBans, locale)}</span>
                      <span className="cs-nav-sub">{de ? 'Community-Banns' : 'Community bans'}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>

            <article className="cs-nav-item">
              <span className="cs-nav-row">
                <Globe size={14} strokeWidth={2.2} aria-hidden />
                {de ? 'Länder' : 'Countries'}
              </span>
              {data ? (
                <>
                  <span className="cs-nav-stat">{formatInt(data.countryCount, locale)}</span>
                  <span className="cs-nav-sub">{de ? 'alle in DB' : 'all in DB'}</span>
                </>
              ) : null}
            </article>
          </section>

          {data && cfg.showCountriesList ? (
            <section className={`cs-sidebar-extra${cfg.showCountriesList ? ' cs-sidebar-extra-pinned' : ''}`}>
              <span className="cs-side-label">{de ? 'Top-Länder' : 'Top countries'}</span>
              <section className="cs-country-list">
                {data.countries.slice(0, 40).map((c) => {
                  const cc = normalizeCountryCode(c.country) || '??'
                  return (
                    <article key={`${cc}-${c.count}`} className="cs-country-row">
                      <span>
                        <CountryFlag code={cc} size={18} />
                        {COUNTRY_NAME[cc] || cc}
                      </span>
                      <span className="tabular-nums">{formatInt(c.count, locale)}</span>
                    </article>
                  )
                })}
              </section>
            </section>
          ) : null}

          {data?.geoip && !data.geoip.enabled ? (
            <section className="cs-range-wrap">
              <p className="cs-geoip-hint">
                {de
                  ? 'GeoIP: GeoLite2-*.mmdb fehlt im CrowdSec-Ordner (Länder/Flaggen).'
                  : 'GeoIP: GeoLite2-*.mmdb missing in CrowdSec data folder (countries/flags).'}
              </p>
            </section>
          ) : null}
        </aside>

        <section className="cs-feed-panel">
          <header className="cs-feed-toolbar">
            <label className="cs-search-wrap">
              <Search size={14} strokeWidth={2} aria-hidden />
              <input
                className="cs-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={de ? 'Filter IP…' : 'Filter IP…'}
              />
            </label>
            {cfg.showMap ? (
              <div
                className="cs-view-toggle"
                role="tablist"
                style={{
                  display: 'flex',
                  gap: 2,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 9,
                  padding: 3,
                }}
              >
                <button type="button" role="tab" aria-selected={view === 'feed'} onClick={() => setView('feed')} style={segStyle(view === 'feed')}>
                  {de ? 'Liste' : 'List'}
                </button>
                <button type="button" role="tab" aria-selected={view === 'map'} onClick={() => setView('map')} style={segStyle(view === 'map')}>
                  {de ? 'Karte' : 'Map'}
                </button>
              </div>
            ) : null}
            <span className="cs-feed-count">{filteredFeed.length}</span>
          </header>

          {showMapView ? (
          <section className="cs-map-split">
            <section
              className="cs-map-panel"
              style={{
                position: 'relative',
                flex: 1,
                minHeight: 320,
                overflow: 'hidden',
                background: 'radial-gradient(120% 130% at 50% 0%, rgba(20,24,48,.55), rgba(7,9,18,.35))',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  zIndex: 2,
                  display: 'flex',
                  gap: 2,
                  background: 'rgba(10,11,18,.7)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8,
                  padding: 3,
                }}
              >
                <button type="button" onClick={() => setMapMode('dots')} style={segStyle(mapMode === 'dots')}>
                  {de ? 'Punkte' : 'Dots'}
                </button>
                <button type="button" onClick={() => setMapMode('arcs')} style={segStyle(mapMode === 'arcs')}>
                  {de ? 'Bögen' : 'Arcs'}
                </button>
              </div>
              {!loading && mapPoints.length === 0 ? (
                <p className="cs-empty" style={{ position: 'absolute', top: 12, left: 14 }}>
                  {de ? 'Keine Einträge im Zeitraum.' : 'No entries in this period.'}
                </p>
              ) : null}
              <WorldMap points={mapPoints} mode={mapMode} homeCc={cfg.homeCountry} style={{ height: '100%' }} />
            </section>
            {cfg.mapAlertList ? (
              <aside className="cs-map-feed">
                <span className="cs-side-label">{de ? 'Letzte Alerts' : 'Recent alerts'}</span>
                {filteredFeed.slice(0, 40).map((item) => {
                  const cc = normalizeCountryCode(item.country)
                  return (
                    <article
                      key={`map-${item.alertId}-${item.ip}`}
                      className="cs-map-feed-row"
                      title={`${item.ip} · ${item.scenario}`}
                    >
                      <CountryFlag code={cc || item.country} size={16} />
                      <span className="cs-map-feed-main">
                        <span className="cs-map-feed-ip">{item.ip}</span>
                        <span className="cs-map-feed-scenario">{item.scenario}</span>
                      </span>
                      <span className="cs-map-feed-time">{formatRelative(item.time_iso, locale)}</span>
                    </article>
                  )
                })}
              </aside>
            ) : null}
          </section>
          ) : (
          <section className="cs-feed-list">
            {loading && !data && !error ? (
              <p className="cs-loading">{de ? 'Lade…' : 'Loading…'}</p>
            ) : null}
            {!loading && filteredFeed.length === 0 ? (
              <p className="cs-empty">{de ? 'Keine Einträge im Zeitraum.' : 'No entries in this period.'}</p>
            ) : null}

            {filteredFeed.map((item) => {
              const cc = normalizeCountryCode(item.country)
              const key = `${item.alertId}-${item.ip}`
              const selected = selectedKey === key
              return (
                <article
                  key={key}
                  className={`cs-card${selected ? ' cs-card-selected' : ''}`}
                  onClick={() => setSelectedKey(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedKey(key)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CountryFlag code={cc || item.country} size={20} title={COUNTRY_NAME[cc] || cc} />
                  <section className="cs-card-body">
                    <header className="cs-card-top">
                      <span className="cs-card-ip">{item.ip}</span>
                      <span className="cs-scenario-tag" title={item.scenario}>
                        {item.scenario}
                      </span>
                      <span className="cs-card-time">{formatRelative(item.time_iso, locale)}</span>
                    </header>
                    {item.city || item.asname || item.asnumber ? (
                      <span
                        className="cs-card-meta"
                        style={{
                          display: 'block',
                          marginTop: 2,
                          fontSize: 11,
                          color: 'var(--cs-faint, #6b7194)',
                          fontFamily: 'ui-monospace, monospace',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {[
                          item.city?.trim(),
                          [item.asnumber, item.asname].filter(Boolean).join(' ').trim(),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    ) : null}
                    <span
                      className={`cs-status ${item.active_ban ? 'cs-status-ban' : 'cs-status-free'}`}
                      title={
                        item.active_ban
                          ? de
                            ? 'Aktiver Ban wie cscli: decisions.until liegt in der Zukunft (IP oder Alert verknüpft).'
                            : 'Active ban (cscli-aligned): decisions.until is in the future (IP or linked alert).'
                          : de
                            ? 'Nur Alert — kein aktiver Ban (until abgelaufen/leer oder cscli listet die IP nicht). CrowdSec kann später erneut sperren.'
                            : 'Alert only — no active ban (until past/empty or cscli shows none). CrowdSec may ban later.'
                      }
                    >
                      {item.active_ban ? (de ? 'Ban aktiv' : 'Ban active') : de ? 'Nur Alert' : 'Alert only'}
                    </span>
                  </section>
                  <nav className="cs-card-actions" onClick={(e) => e.stopPropagation()}>
                    {lookupServices.length > 0 ? (
                      <button
                        type="button"
                        className="cs-icon-btn"
                        title={de ? 'IP-Lookup' : 'IP lookup'}
                        aria-label={de ? 'IP-Lookup' : 'IP lookup'}
                        onClick={(e) => {
                          setLookupItem(item)
                          setLookupAnchor(e.currentTarget)
                        }}
                      >
                        <Search size={15} strokeWidth={2} aria-hidden />
                      </button>
                    ) : null}
                    {cfg.dockerUnban && item.active_ban ? (
                      <button
                        type="button"
                        className="cs-unban-btn"
                        disabled={unbanBusy}
                        title={de ? 'Entsperren' : 'Unban'}
                        aria-label={de ? 'Entsperren' : 'Unban'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setUnbanPending(item)
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2} aria-hidden />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="cs-icon-btn"
                      title={de ? 'IP kopieren' : 'Copy IP'}
                      aria-label={de ? 'IP kopieren' : 'Copy IP'}
                      onClick={(e) => void copyIp(item.ip, e)}
                    >
                      <Copy size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </nav>
                </article>
              )
            })}
          </section>
          )}
        </section>
      </section>

      {lookupItem && lookupServices.length > 0 ? (
        <IpLookupMenu
          item={lookupItem}
          de={de}
          anchorEl={lookupAnchor}
          services={lookupServices}
          onClose={() => {
            setLookupItem(null)
            setLookupAnchor(null)
          }}
        />
      ) : null}

      {unbanPending ? (
        <section className="cs-confirm-overlay" role="dialog" aria-modal="true">
          <article className="cs-confirm-box">
            <p style={{ margin: 0 }}>
              {de
                ? `Sperre für ${unbanPending.ip} per cscli im Container „${cfg.crowdsecContainer}" aufheben?`
                : `Remove ban for ${unbanPending.ip} via cscli in container "${cfg.crowdsecContainer}"?`}
            </p>
            {unbanMsg ? (
              <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 10 }}>{unbanMsg}</p>
            ) : null}
            <nav className="cs-confirm-actions">
              <button
                type="button"
                className="cs-btn-ghost"
                onClick={() => setUnbanPending(null)}
                disabled={unbanBusy}
              >
                {de ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                className="cs-btn-danger"
                disabled={unbanBusy}
                onClick={() => void doUnban(unbanPending)}
              >
                {unbanBusy ? '…' : de ? 'Entsperren' : 'Unban'}
              </button>
            </nav>
          </article>
        </section>
      ) : null}
    </section>
  )
}
