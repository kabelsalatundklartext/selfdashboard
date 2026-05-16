'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Gavel, Globe, Search, Shield, Trash2 } from 'lucide-react'
import type { ThemeId } from '@/types'
import { CrowdsecLogo } from './CrowdsecLogo'
import type { CrowdsecDashboardData, CrowdsecFeedItem } from '@/lib/crowdsecMetrics'
import type { Locale } from '@/lib/i18n'
import { COUNTRY_NAME } from './constants'
import { CountryFlag } from './CountryFlag'
import { normalizeCountryCode } from './flags'
import { IpLookupMenu } from './IpLookupMenu'
import {
  DEFAULT_LOOKUP_ENABLED,
  LOOKUP_SERVICES,
  type LookupServiceId,
} from './ipLookup'
import './crowdsec.css'

export type CrowdsecConfig = {
  dbPath: string
  daysBack: number
  refreshSeconds: number
  statsHours: number
  maxAlerts: number
  dockerUnban: boolean
  crowdsecContainer: string
  confirmUnban: boolean
  lookupEnabled: Record<LookupServiceId, boolean>
}

type SidebarTab = 'overview' | 'bans' | 'countries'
type LayoutMode = 'phone' | 'tablet' | 'desktop'

const TIME_RANGES = [
  { days: 1, de: '1 Tag', en: '1 day' },
  { days: 7, de: '7 Tage', en: '7 days' },
  { days: 30, de: '30 Tage', en: '30 days' },
  { days: 90, de: '90 Tage', en: '90 days' },
  { days: 365, de: '365 Tage', en: '365 days' },
] as const

function cfgBool(v: unknown, fallback: boolean): boolean {
  if (v === undefined || v === null || v === '') return fallback
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  return fallback
}

function cfgNum(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

function cfgStr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

export function parseCrowdsecConfig(raw: Record<string, unknown>): CrowdsecConfig {
  const lookupRaw = raw.lookupEnabled
  const lookupEnabled = { ...DEFAULT_LOOKUP_ENABLED }
  if (lookupRaw && typeof lookupRaw === 'object' && !Array.isArray(lookupRaw)) {
    for (const id of Object.keys(DEFAULT_LOOKUP_ENABLED) as LookupServiceId[]) {
      lookupEnabled[id] = cfgBool((lookupRaw as Record<string, unknown>)[id], DEFAULT_LOOKUP_ENABLED[id])
    }
  }
  return {
    dbPath: cfgStr(raw.dbPath, '/crowdsec-data/crowdsec.db'),
    daysBack: Math.min(3650, Math.max(1, cfgNum(raw.daysBack, 30))),
    refreshSeconds: Math.min(600, Math.max(5, cfgNum(raw.refreshSeconds, 30))),
    statsHours: Math.min(168, Math.max(1, cfgNum(raw.statsHours, 24))),
    maxAlerts: Math.min(5000, Math.max(50, cfgNum(raw.maxAlerts, 500))),
    dockerUnban: cfgBool(raw.dockerUnban, false),
    crowdsecContainer: cfgStr(raw.crowdsecContainer, 'crowdsec'),
    confirmUnban: cfgBool(raw.confirmUnban, true),
    lookupEnabled,
  }
}

function formatInt(n: number, locale: Locale): string {
  return Math.round(n).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')
}

function formatRelative(iso: string, locale: Locale): string {
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

function nearestRange(days: number): number {
  const presets = TIME_RANGES.map((t) => t.days)
  if (presets.some((d) => d === days)) return days
  return presets.reduce((best, d) => (Math.abs(d - days) < Math.abs(best - days) ? d : best), 30)
}

type Props = {
  config: Record<string, unknown>
  locale: Locale
  layoutMode?: LayoutMode
  theme?: ThemeId
}

export function CrowdsecWidget({ config: raw, locale, layoutMode = 'desktop', theme = 'dark' }: Props) {
  const de = locale !== 'en'
  const cfg = useMemo(() => parseCrowdsecConfig(raw), [raw])
  const layoutClass =
    layoutMode === 'phone' ? 'cs-layout-phone' : layoutMode === 'tablet' ? 'cs-layout-tablet' : ''

  const [daysBack, setDaysBack] = useState(() => nearestRange(cfg.daysBack))
  const [data, setData] = useState<CrowdsecDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<SidebarTab>('overview')
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [lookupItem, setLookupItem] = useState<CrowdsecFeedItem | null>(null)
  const [lookupAnchor, setLookupAnchor] = useState<HTMLElement | null>(null)
  const [unbanPending, setUnbanPending] = useState<CrowdsecFeedItem | null>(null)
  const [unbanBusy, setUnbanBusy] = useState(false)
  const [unbanMsg, setUnbanMsg] = useState<string | null>(null)

  useEffect(() => {
    setDaysBack(nearestRange(cfg.daysBack))
  }, [cfg.daysBack])

  const lookupServices = useMemo(
    () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
    [cfg.lookupEnabled],
  )

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      dbPath: cfg.dbPath,
      daysBack: String(daysBack),
      statsHours: String(cfg.statsHours),
      maxAlerts: String(cfg.maxAlerts),
    })
    try {
      const res = await fetch(`/api/crowdsec?${params}`)
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'crowdsec_error')
        setData(null)
        return
      }
      setData(json as CrowdsecDashboardData)
      setError(null)
    } catch {
      setError('network_error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [cfg.dbPath, cfg.statsHours, cfg.maxAlerts, daysBack])

  useEffect(() => {
    setLoading(true)
    void fetchData()
    const id = window.setInterval(() => void fetchData(), cfg.refreshSeconds * 1000)
    return () => window.clearInterval(id)
  }, [fetchData, cfg.refreshSeconds])

  const q = search.trim().toLowerCase()

  const baseFeed = useMemo(() => {
    if (!data) return []
    if (tab === 'bans') return data.feed.filter((f) => f.active_ban)
    return data.feed
  }, [data, tab])

  const filteredFeed = useMemo(() => baseFeed.filter((f) => feedMatchesSearch(f, q)), [baseFeed, q])

  const rangeSelect = (
    <select
      className="cs-range-select"
      value={daysBack}
      onChange={(e) => setDaysBack(Number(e.target.value))}
      aria-label={de ? 'Zeitraum' : 'Time range'}
    >
      {TIME_RANGES.map((r) => (
        <option key={r.days} value={r.days}>
          {de ? r.de : r.en}
        </option>
      ))}
    </select>
  )

  const errLabel = (code: string) => {
    const map: Record<string, string> = de
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
    return map[code] || code
  }

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip)
    } catch {
      /* ignore */
    }
  }

  const doUnban = async (item: CrowdsecFeedItem) => {
    setUnbanBusy(true)
    setUnbanMsg(null)
    try {
      const res = await fetch('/api/crowdsec/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: item.ip, container: cfg.crowdsecContainer }),
      })
      const json = await res.json()
      if (!res.ok) {
        setUnbanMsg(typeof json.error === 'string' ? json.error : 'delete_failed')
        return
      }
      setUnbanPending(null)
      void fetchData()
    } catch {
      setUnbanMsg('network_error')
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

          <nav className="cs-nav" aria-label={de ? 'Navigation' : 'Navigation'}>
            <button
              type="button"
              className={`cs-nav-item cs-nav-item-btn${tab === 'overview' ? ' cs-nav-item-active' : ''}`}
              onClick={() => setTab('overview')}
            >
              <span className="cs-nav-row">
                <Shield size={14} strokeWidth={2.2} aria-hidden />
                {de ? 'Übersicht' : 'Overview'}
              </span>
              {data && (
                <>
                  <span className="cs-nav-stat">{formatInt(data.alertsLast24h, locale)}</span>
                  <span className="cs-nav-sub">
                    {de ? `Alerts (${cfg.statsHours}h)` : `Alerts (${cfg.statsHours}h)`}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              className={`cs-nav-item cs-nav-item-btn${tab === 'bans' ? ' cs-nav-item-active' : ''}`}
              onClick={() => setTab('bans')}
            >
              <span className="cs-nav-row">
                <Gavel size={14} strokeWidth={2.2} aria-hidden />
                {de ? 'Banns' : 'Bans'}
              </span>
              {data && (
                <>
                  <span className="cs-nav-stat">{formatInt(data.activeBans, locale)}</span>
                  <span className="cs-nav-sub">{de ? 'Aktive Banns' : 'Active bans'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              className={`cs-nav-item cs-nav-item-btn${tab === 'countries' ? ' cs-nav-item-active' : ''}`}
              onClick={() => setTab('countries')}
            >
              <span className="cs-nav-row">
                <Globe size={14} strokeWidth={2.2} aria-hidden />
                {de ? 'Länder' : 'Countries'}
              </span>
              {data && (
                <>
                  <span className="cs-nav-stat">{formatInt(data.countryCount, locale)}</span>
                  <span className="cs-nav-sub">{de ? 'Länder' : 'Countries'}</span>
                </>
              )}
            </button>
          </nav>

          <section className="cs-range-mobile">
            <span className="cs-range-label">{de ? 'Zeitraum' : 'Time range'}</span>
            {rangeSelect}
          </section>

          {tab === 'countries' && data && (
            <section className="cs-sidebar-extra">
              <section className="cs-country-list">
                {data.countries.slice(0, 25).map((c) => {
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
          )}

          <section className="cs-range-wrap">
            <span className="cs-range-label">{de ? 'Zeitraum' : 'Time range'}</span>
            {rangeSelect}
            {data?.geoip && !data.geoip.enabled && (
              <p className="cs-geoip-hint">
                {de
                  ? 'GeoIP: GeoLite2-*.mmdb fehlt im CrowdSec-Ordner (Länder/Flaggen).'
                  : 'GeoIP: GeoLite2-*.mmdb missing in CrowdSec data folder (countries/flags).'}
              </p>
            )}
          </section>
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
            <span className="cs-feed-count">{filteredFeed.length}</span>
          </header>

          <section className="cs-feed-list">
            {loading && !data && !error && <p className="cs-loading">{de ? 'Lade…' : 'Loading…'}</p>}
            {!loading && filteredFeed.length === 0 && (
              <p className="cs-empty">{de ? 'Keine Einträge im Zeitraum.' : 'No entries in this period.'}</p>
            )}
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
                  <CountryFlag code={cc || item.country} size={28} title={COUNTRY_NAME[cc] || cc} />
                  <section className="cs-card-body">
                    <header className="cs-card-top">
                      <span className="cs-card-ip">{item.ip}</span>
                      <span className="cs-scenario-tag" title={item.scenario}>
                        {item.scenario}
                      </span>
                    </header>
                    <footer className="cs-card-bottom">
                      <span className="cs-card-time">{formatRelative(item.time_iso, locale)}</span>
                      <span
                        className={`cs-status ${item.active_ban ? 'cs-status-ban' : 'cs-status-free'}`}
                      >
                        {item.active_ban ? (de ? 'Gebannt' : 'Banned') : de ? 'Entsperrt' : 'Unblocked'}
                      </span>
                    </footer>
                  </section>
                  <nav className="cs-card-actions" onClick={(e) => e.stopPropagation()}>
                    {lookupServices.length > 0 && (
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
                    )}
                    {cfg.dockerUnban && item.active_ban && (
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
                    )}
                    <button
                      type="button"
                      className="cs-icon-btn"
                      title={de ? 'IP kopieren' : 'Copy IP'}
                      aria-label={de ? 'IP kopieren' : 'Copy IP'}
                      onClick={() => void copyIp(item.ip)}
                    >
                      <Copy size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </nav>
                </article>
              )
            })}
          </section>
        </section>
      </section>

      {lookupItem && lookupServices.length > 0 && (
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
      )}

      {unbanPending && (
        <section className="cs-confirm-overlay" role="dialog" aria-modal="true">
          <article className="cs-confirm-box">
            <p style={{ margin: 0 }}>
              {de
                ? `Sperre für ${unbanPending.ip} per cscli im Container „${cfg.crowdsecContainer}“ aufheben?`
                : `Remove ban for ${unbanPending.ip} via cscli in container “${cfg.crowdsecContainer}”?`}
            </p>
            {unbanMsg && <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 10 }}>{unbanMsg}</p>}
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
      )}
    </section>
  )
}
