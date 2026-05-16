'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CrowdsecDashboardData, CrowdsecFeedItem } from '@/lib/crowdsecMetrics'
import type { Locale } from '@/lib/i18n'
import { COUNTRY_NAME, FLAG } from './constants'
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

function formatTime(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatInt(n: number, locale: Locale): string {
  return Math.round(n).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')
}

function feedMatchesSearch(item: CrowdsecFeedItem, q: string): boolean {
  if (!q) return true
  const hay = [
    item.ip,
    item.country,
    item.city,
    item.scenario,
    item.asname,
    item.asnumber,
    item.iprange,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

type Props = {
  config: Record<string, unknown>
  locale: Locale
}

export function CrowdsecWidget({ config: raw, locale }: Props) {
  const de = locale !== 'en'
  const cfg = useMemo(() => parseCrowdsecConfig(raw), [raw])

  const [data, setData] = useState<CrowdsecDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<SidebarTab>('overview')
  const [search, setSearch] = useState('')
  const [lookupItem, setLookupItem] = useState<CrowdsecFeedItem | null>(null)
  const [lookupAnchor, setLookupAnchor] = useState<HTMLElement | null>(null)
  const [unbanPending, setUnbanPending] = useState<CrowdsecFeedItem | null>(null)
  const [unbanBusy, setUnbanBusy] = useState(false)
  const [unbanMsg, setUnbanMsg] = useState<string | null>(null)

  const lookupServices = useMemo(
    () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
    [cfg.lookupEnabled],
  )

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      dbPath: cfg.dbPath,
      daysBack: String(cfg.daysBack),
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
  }, [cfg.dbPath, cfg.daysBack, cfg.statsHours, cfg.maxAlerts])

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

  const openLookup = (item: CrowdsecFeedItem, el: HTMLElement) => {
    setLookupItem(item)
    setLookupAnchor(el)
  }

  const closeLookup = () => {
    setLookupItem(null)
    setLookupAnchor(null)
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

  return (
    <section className="cs-widget" style={{ position: 'relative' }}>
      {error ? <p className="cs-error">{errLabel(error)}</p> : null}

      <section className="cs-split">
        <aside className="cs-sidebar">
          <nav className="cs-tabs" aria-label={de ? 'Ansicht' : 'View'}>
            {(
              [
                ['overview', de ? 'Übersicht' : 'Overview'],
                ['bans', de ? 'Banns' : 'Bans'],
                ['countries', de ? 'Länder' : 'Countries'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`cs-tab${tab === id ? ' cs-tab-active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <section className="cs-sidebar-body">
            {tab === 'overview' && data && (
              <section className="cs-stat-grid">
                <article className="cs-stat">
                  <p className="cs-stat-label">{de ? `Alerts (${cfg.statsHours}h)` : `Alerts (${cfg.statsHours}h)`}</p>
                  <p className="cs-stat-value">{formatInt(data.alertsLast24h, locale)}</p>
                </article>
                <article className="cs-stat">
                  <p className="cs-stat-label">{de ? `Zeitraum (${cfg.daysBack}d)` : `Range (${cfg.daysBack}d)`}</p>
                  <p className="cs-stat-value">{formatInt(data.alertsInRange, locale)}</p>
                </article>
                <article className="cs-stat">
                  <p className="cs-stat-label">{de ? 'Aktive Banns' : 'Active bans'}</p>
                  <p className="cs-stat-value">{formatInt(data.activeBans, locale)}</p>
                </article>
                <article className="cs-stat">
                  <p className="cs-stat-label">{de ? 'Szenarien' : 'Scenarios'}</p>
                  <p className="cs-stat-value">{formatInt(data.scenarioCount, locale)}</p>
                </article>
              </section>
            )}
            {tab === 'bans' && data && (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                {de
                  ? `${formatInt(data.activeBans, locale)} aktive Sperren im Feed.`
                  : `${formatInt(data.activeBans, locale)} active bans in feed.`}
              </p>
            )}
            {tab === 'countries' && data && (
              <section>
                {data.countries.slice(0, 40).map((c) => {
                  const cc = c.country?.toUpperCase() || '??'
                  return (
                    <article key={cc} className="cs-country-row">
                      <span>
                        {FLAG[cc] || '🌐'} {COUNTRY_NAME[cc] || cc}
                      </span>
                      <span className="tabular-nums">{formatInt(c.count, locale)}</span>
                    </article>
                  )
                })}
              </section>
            )}
            {loading && !data && !error && (
              <p className="cs-empty">{de ? 'Lade…' : 'Loading…'}</p>
            )}
          </section>
        </aside>

        <section className="cs-feed-panel">
          <header className="cs-feed-toolbar">
            <input
              className="cs-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={de ? 'IP, Land, Szenario…' : 'IP, country, scenario…'}
              aria-label={de ? 'Feed durchsuchen' : 'Search feed'}
            />
            <span className="cs-feed-count">{filteredFeed.length}</span>
          </header>
          <section className="cs-feed-list">
            {!loading && filteredFeed.length === 0 && (
              <p className="cs-empty">{de ? 'Keine Einträge.' : 'No entries.'}</p>
            )}
            {filteredFeed.map((item) => {
              const cc = item.country?.toUpperCase() || '??'
              return (
                <article key={`${item.alertId}-${item.ip}`} className="cs-feed-row">
                  <section className="cs-feed-main">
                    <span className="cs-feed-ip">
                      {FLAG[cc] || '🌐'} {item.ip}
                    </span>
                    <p className="cs-feed-meta">
                      {COUNTRY_NAME[cc] || cc}
                      {item.city ? ` · ${item.city}` : ''} · {item.scenario} · {formatTime(item.time_iso, locale)}
                    </p>
                  </section>
                  <nav className="cs-feed-actions">
                    {lookupServices.length > 0 && (
                      <button
                        type="button"
                        className="cs-icon-btn"
                        title={de ? 'IP-Lookup' : 'IP lookup'}
                        aria-label={de ? 'IP-Lookup' : 'IP lookup'}
                        onClick={(e) => openLookup(item, e.currentTarget)}
                      >
                        🔍
                      </button>
                    )}
                    <button
                      type="button"
                      className="cs-icon-btn"
                      title={de ? 'IP kopieren' : 'Copy IP'}
                      aria-label={de ? 'IP kopieren' : 'Copy IP'}
                      onClick={() => void copyIp(item.ip)}
                    >
                      📋
                    </button>
                    {cfg.dockerUnban && item.active_ban && (
                      <button
                        type="button"
                        className="cs-unban-btn"
                        disabled={unbanBusy}
                        onClick={() => {
                          if (cfg.confirmUnban) setUnbanPending(item)
                          else void doUnban(item)
                        }}
                      >
                        {de ? 'Entsperren' : 'Unban'}
                      </button>
                    )}
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
          onClose={closeLookup}
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
              <button type="button" className="cs-tab" onClick={() => setUnbanPending(null)} disabled={unbanBusy}>
                {de ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                className="cs-unban-btn"
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
