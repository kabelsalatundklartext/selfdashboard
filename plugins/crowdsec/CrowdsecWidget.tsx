'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { PluginWidgetProps, PluginSettingsProps } from '@/types'
import { useDashboardStore } from '@/lib/store'
import type { AttackPoint, FeedItem, ParsedCrowdsecMetrics } from '@/lib/crowdsecMetrics'
import { MapPanel, type MapHighlight } from './MapPanel'
import { FeedCard, FeedLogModal } from './FeedCard'
import { THEME_VARS, THEME_LABELS, FLAG, COUNTRY_NAME, type ThreatTheme } from './constants'
import './crowdsec.css'

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function bool(v: unknown, defaultVal: boolean): boolean {
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  return defaultVal
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

type TabId = 'feed' | 'top10' | 'all'

const SETUP_DB = 'CrowdSec-Datenbankpfad in den Einstellungen eintragen'

function formatCrowdsecError(raw: string, de: boolean): string {
  if (raw === 'missing_db_path') return de ? SETUP_DB : 'Enter CrowdSec database path in settings'
  if (raw === 'db_not_found' || raw === 'db_not_a_file') {
    return de
      ? 'crowdsec.db nicht gefunden — Pfad prüfen und Volume in SelfDashboard mounten'
      : 'crowdsec.db not found — check path and mount volume in SelfDashboard'
  }
  if (raw === 'db_schema_unsupported') {
    return de
      ? 'Unbekanntes Datenbankschema — andere CrowdSec-Version?'
      : 'Unknown database schema — different CrowdSec version?'
  }
  if (raw === 'db_path_not_allowed') {
    return de
      ? 'Pfad nicht erlaubt — nur unter /crowdsec-data/ (Volume mounten)'
      : 'Path not allowed — must be under /crowdsec-data/ (mount volume)'
  }
  if (raw === 'fetch_failed' || raw.includes('abort')) {
    return de ? 'Verbindung fehlgeschlagen' : 'Connection failed'
  }
  return raw
}

export function CrowdsecWidget({ config, layoutMode }: PluginWidgetProps) {
  const { locale, editMode } = useDashboardStore()
  const de = locale === 'de'

  const dbPath = str(config.dbPath) || '/crowdsec-data/crowdsec.db'
  const daysBack = Math.min(3650, Math.max(1, Math.round(num(config.daysBack, 365))))
  const refreshSec = Math.min(300, Math.max(15, Math.round(num(config.refreshSeconds, 30))))
  const showMap = bool(config.showMap, true)
  const showSidebar = bool(config.showSidebar, true)
  const showSparkline = bool(config.showSparkline, true)
  const configTheme = (str(config.theme) || 'cyan') as ThreatTheme
  const serverLatCfg = num(config.serverLat, 0)
  const serverLonCfg = num(config.serverLon, 0)
  const serverNameCfg = str(config.serverName)
  const crowdsecContainer = str(config.crowdsecContainer) || 'crowdsec'
  const dockerUnban = bool(config.dockerUnban, false)
  const whitelistEnabled = bool(config.whitelistEnabled, false)
  const whitelistPath =
    str(config.whitelistPath) || '/crowdsec-postoverflows/s01-whitelist/my-whitelist.yaml'
  const whitelistInterval = Math.min(86_400, Math.max(60, Math.round(num(config.whitelistInterval, 900))))
  const whitelistRestartWait = Math.min(120, Math.max(5, Math.round(num(config.whitelistRestartWait, 15))))

  const [theme, setTheme] = useState<ThreatTheme>(
    ['cyan', 'alarm', 'matrix', 'amber'].includes(configTheme) ? configTheme : 'cyan',
  )
  const [linesOn, setLinesOn] = useState(true)
  const [animOn, setAnimOn] = useState(false)
  const [tab, setTab] = useState<TabId>('feed')
  const [search, setSearch] = useState('')
  const [feedSort, setFeedSort] = useState<'newest' | 'oldest'>('newest')
  const [feedPage, setFeedPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attackData, setAttackData] = useState<AttackPoint[]>([])
  const [feedData, setFeedData] = useState<FeedItem[]>([])
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [serverLat, setServerLat] = useState(0)
  const [serverLon, setServerLon] = useState(0)
  const [serverName, setServerName] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [logItem, setLogItem] = useState<FeedItem | null>(null)
  const [mapHighlight, setMapHighlight] = useState<MapHighlight | null>(null)
  const [wlIp, setWlIp] = useState('')
  const [wlStatus, setWlStatus] = useState('unbekannt')
  const [wlLastCheck, setWlLastCheck] = useState('')
  const [wlLastChange, setWlLastChange] = useState('')
  const sparkRef = useRef<HTMLCanvasElement>(null)

  const wlDotColor = useMemo(() => {
    if (!whitelistEnabled) return 'rgba(160, 255, 216, 0.35)'
    if (wlStatus === 'ok') return 'var(--cs-ok)'
    if (wlStatus === 'aktualisiert') return 'var(--cs-accent)'
    if (wlStatus === 'fehler') return '#ff4466'
    return 'rgba(160, 255, 216, 0.5)'
  }, [whitelistEnabled, wlStatus])

  const themeStyle = useMemo(() => THEME_VARS[theme] as CSSProperties, [theme])

  const applyParsed = useCallback(
    (parsed: ParsedCrowdsecMetrics) => {
      setAttackData(parsed.attackData)
      setFeedData(parsed.feedData)
      setTotalAlerts(parsed.totalAlerts)
      if (serverLatCfg) setServerLat(serverLatCfg)
      else if (parsed.serverLat) setServerLat(parsed.serverLat)
      if (serverLonCfg) setServerLon(serverLonCfg)
      else if (parsed.serverLon) setServerLon(parsed.serverLon)
      setServerName(serverNameCfg || parsed.serverName || 'Server')
      setLastUpdate(new Date().toLocaleTimeString(de ? 'de-DE' : 'en-GB'))
      setError(null)
    },
    [de, serverLatCfg, serverLonCfg, serverNameCfg],
  )

  const fetchMetrics = useCallback(async () => {
    if (!dbPath) {
      setError(SETUP_DB)
      setLoading(false)
      return
    }
    try {
      const q = new URLSearchParams({
        dbPath,
        daysBack: String(daysBack),
        serverLat: String(serverLatCfg || 0),
        serverLon: String(serverLonCfg || 0),
        serverName: serverNameCfg || 'Server',
      })

      const res = await fetch(`/api/crowdsec?${q}`, { cache: 'no-store' })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(formatCrowdsecError(j.error || `HTTP ${res.status}`, de))
      }

      applyParsed((await res.json()) as ParsedCrowdsecMetrics)
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'fetch_failed'
      setError(formatCrowdsecError(raw, de))
    } finally {
      setLoading(false)
    }
  }, [dbPath, daysBack, de, applyParsed, serverLatCfg, serverLonCfg, serverNameCfg])

  const fetchWhitelist = useCallback(async () => {
    if (!whitelistEnabled) {
      setWlStatus('deaktiviert')
      setWlIp('')
      return
    }
    try {
      const q = new URLSearchParams({
        whitelistEnabled: '1',
        whitelistPath,
        whitelistInterval: String(whitelistInterval),
        whitelistRestartWait: String(whitelistRestartWait),
        crowdsecContainer,
      })
      const res = await fetch(`/api/crowdsec/whitelist?${q}`, { cache: 'no-store' })
      if (!res.ok) return
      const j = (await res.json()) as {
        ip?: string
        status?: string
        lastCheck?: string
        lastChange?: string
      }
      if (j.ip) setWlIp(j.ip)
      if (j.status) setWlStatus(j.status)
      if (j.lastCheck) setWlLastCheck(j.lastCheck)
      if (j.lastChange) setWlLastChange(j.lastChange)
    } catch {
      /* status optional */
    }
  }, [whitelistEnabled, whitelistPath, whitelistInterval, whitelistRestartWait, crowdsecContainer])

  useEffect(() => {
    setLoading(true)
    fetchMetrics()
    const id = setInterval(fetchMetrics, refreshSec * 1000)
    return () => clearInterval(id)
  }, [fetchMetrics, refreshSec])

  useEffect(() => {
    void fetchWhitelist()
    if (!whitelistEnabled) return
    const id = setInterval(fetchWhitelist, 60_000)
    return () => clearInterval(id)
  }, [fetchWhitelist, whitelistEnabled])

  const filteredFeed = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...feedData]
    if (q) {
      list = list.filter(
        (f) =>
          f.ip.toLowerCase().includes(q) ||
          f.country.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.scenario.toLowerCase().includes(q) ||
          f.asname.toLowerCase().includes(q) ||
          f.asnumber.toLowerCase().includes(q) ||
          f.iprange.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      const cmp = a.time_iso.localeCompare(b.time_iso)
      return feedSort === 'newest' ? -cmp : cmp
    })
    return list
  }, [feedData, search, feedSort])

  const countryStats = useMemo(() => {
    const m = new Map<string, number>()
    attackData.forEach((d) => m.set(d.country, (m.get(d.country) || 0) + d.count))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [attackData])

  const scenarioCount = useMemo(() => new Set(attackData.map((d) => d.scenario)).size, [attackData])
  const countryCount = useMemo(() => new Set(attackData.map((d) => d.country)).size, [attackData])

  const FEED_PER_PAGE = 20
  const pageCount = Math.max(1, Math.ceil(filteredFeed.length / FEED_PER_PAGE))
  const pageItems = filteredFeed.slice(feedPage * FEED_PER_PAGE, (feedPage + 1) * FEED_PER_PAGE)
  const pageFrom = filteredFeed.length ? feedPage * FEED_PER_PAGE + 1 : 0
  const pageTo = Math.min((feedPage + 1) * FEED_PER_PAGE, filteredFeed.length)

  useEffect(() => {
    if (feedPage >= pageCount) setFeedPage(0)
  }, [feedPage, pageCount])

  useEffect(() => {
    if (!showSparkline || !sparkRef.current) return
    const canvas = sparkRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.clientWidth || 200
    const h = canvas.clientHeight || 40
    canvas.width = w
    canvas.height = h
    const buckets = new Array(24).fill(0)
    const now = Date.now()
    feedData.forEach((f) => {
      const t = new Date(f.time_iso).getTime()
      if (!Number.isFinite(t)) return
      const hAgo = Math.floor((now - t) / 3_600_000)
      if (hAgo >= 0 && hAgo < 24) buckets[23 - hAgo] += 1
    })
    const max = Math.max(...buckets, 1)
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(0,255,200,0.25)'
    ctx.beginPath()
    ctx.moveTo(0, h - 2)
    ctx.lineTo(w, h - 2)
    ctx.stroke()
    ctx.strokeStyle = 'var(--cs-accent)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    buckets.forEach((v, i) => {
      const x = (i / 23) * w
      const y = h - 4 - (v / max) * (h - 8)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [feedData, showSparkline])

  const layoutClass =
    layoutMode === 'phone' ? 'cs-threat--phone' : layoutMode === 'tablet' ? 'cs-threat--tablet' : 'cs-threat--desktop'
  const rootClass = [
    !showMap && showSidebar ? 'cs-threat-root cs-threat-feed-only' : 'cs-threat-root',
    layoutClass,
    editMode ? 'cs-threat--edit' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} style={themeStyle}>
      <div className="cs-threat-layout">
        {showMap && (
          <div className={`cs-threat-map-col ${layoutMode === 'phone' && showSidebar ? '' : 'visible'}`}>
            <MapPanel
              attackData={attackData}
              serverLat={serverLat}
              serverLon={serverLon}
              serverName={serverName}
              linesOn={linesOn}
              animOn={animOn}
              visible
              highlight={mapHighlight}
            />
            <div className="cs-threat-legend">
              <span className="leg-item">
                <span className="leg-dot" style={{ background: '#00ff88' }} /> 1–4
              </span>
              <span className="leg-item">
                <span className="leg-dot" style={{ background: '#ffff00' }} /> 5–9
              </span>
              <span className="leg-item">
                <span className="leg-dot" style={{ background: '#ff8800' }} /> 10–19
              </span>
              <span className="leg-item">
                <span className="leg-dot" style={{ background: '#ff2244' }} /> 20+
              </span>
            </div>
          </div>
        )}

        {showSidebar && (
          <aside className="cs-threat-sidebar">
            <div className="cs-threat-stats">
              <div className="cs-threat-stat">
                <span className="cs-threat-stat-val">{totalAlerts}</span>
                <span className="cs-threat-stat-lbl">{de ? 'ANGRIFFE' : 'ATTACKS'}</span>
              </div>
              <div className="cs-threat-stat">
                <span className="cs-threat-stat-val">{countryCount}</span>
                <span className="cs-threat-stat-lbl">{de ? 'LÄNDER' : 'COUNTRIES'}</span>
              </div>
              <div className="cs-threat-stat">
                <span className="cs-threat-stat-val">{scenarioCount}</span>
                <span className="cs-threat-stat-lbl">{de ? 'SZENARIEN' : 'SCENARIOS'}</span>
              </div>
              <div className="cs-threat-stat">
                <span className="cs-threat-stat-val blink">●</span>
                <span className="cs-threat-stat-lbl">LIVE</span>
              </div>
            </div>

            {showMap && (
              <div className="cs-threat-toggle-row">
                <button type="button" className={`cs-threat-btn ${linesOn ? 'on' : ''}`} onClick={() => setLinesOn((v) => !v)}>
                  <span className="cs-threat-btn-dot" />
                  {de ? 'LINIEN' : 'LINES'}
                </button>
                <button type="button" className={`cs-threat-btn ${animOn ? 'on' : ''}`} onClick={() => setAnimOn((v) => !v)}>
                  <span className="cs-threat-btn-dot" />
                  {de ? 'ANIMATION' : 'ANIM'}
                </button>
              </div>
            )}

            <div className="cs-threat-theme-row">
              <span>THEME</span>
              {(['cyan', 'alarm', 'matrix', 'amber'] as ThreatTheme[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  className={`cs-threat-theme-btn ${theme === th ? 'active' : ''}`}
                  onClick={() => setTheme(th)}
                >
                  {THEME_LABELS[th]}
                </button>
              ))}
            </div>

            <div className="cs-threat-tabs">
              <button type="button" className={`cs-threat-tab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}>
                ▶ FEED
              </button>
              <button type="button" className={`cs-threat-tab ${tab === 'top10' ? 'active' : ''}`} onClick={() => setTab('top10')}>
                TOP 10
              </button>
              <button type="button" className={`cs-threat-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                {de ? '🌍 ALLE' : '🌍 ALL'}
              </button>
            </div>

            <div className="cs-threat-panel">
              {tab === 'feed' && (
                <>
                  {showSparkline && (
                    <div className="cs-threat-spark">
                      <div style={{ fontSize: 7, letterSpacing: 1, marginBottom: 2, opacity: 0.5 }}>
                        {de ? 'ANGRIFFE / STUNDE (24h)' : 'ATTACKS / HOUR (24h)'}
                      </div>
                      <canvas ref={sparkRef} />
                    </div>
                  )}
                  <div className="cs-threat-search">
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setFeedPage(0)
                      }}
                      placeholder={de ? 'IP, Land, Szenario…' : 'IP, country, scenario…'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4, padding: '0 8px 4px', fontSize: 8 }}>
                    <button type="button" className={`cs-threat-btn ${feedSort === 'newest' ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setFeedSort('newest')}>
                      {de ? '▼ NEUESTE' : '▼ NEWEST'}
                    </button>
                    <button type="button" className={`cs-threat-btn ${feedSort === 'oldest' ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setFeedSort('oldest')}>
                      {de ? '▲ ÄLTESTE' : '▲ OLDEST'}
                    </button>
                  </div>
                  <div className="cs-threat-feed">
                    {pageItems.map((f) => (
                      <FeedCard
                        key={`${f.alertId}-${f.ip}`}
                        item={f}
                        de={de}
                        mapFocusIp={mapHighlight?.ip ?? null}
                        dockerUnban={dockerUnban}
                        crowdsecContainer={crowdsecContainer}
                        onShowLog={setLogItem}
                        onLookupIp={(ip) => {
                          setSearch(ip)
                          setFeedPage(0)
                        }}
                        onShowOnMap={(item) => {
                          if (!showMap) return
                          setMapHighlight({ ip: item.ip, lat: item.lat, lon: item.lon })
                        }}
                        onUnbanDone={() => void fetchMetrics()}
                      />
                    ))}
                  </div>
                  <div className="cs-feed-pager">
                    <button type="button" className="cs-threat-btn" disabled={feedPage <= 0} onClick={() => setFeedPage((p) => p - 1)}>
                      ◀
                    </button>
                    <span className="cs-feed-pager-label">
                      {filteredFeed.length
                        ? de
                          ? `${pageFrom}–${pageTo} von ${filteredFeed.length}`
                          : `${pageFrom}–${pageTo} of ${filteredFeed.length}`
                        : de
                          ? 'Keine Einträge'
                          : 'No entries'}
                    </span>
                    <button
                      type="button"
                      className="cs-threat-btn"
                      disabled={feedPage >= pageCount - 1}
                      onClick={() => setFeedPage((p) => p + 1)}
                    >
                      ▶
                    </button>
                  </div>
                </>
              )}

              {tab === 'top10' && (
                <div className="cs-threat-feed">
                  {countryStats.slice(0, 10).map(([cc, n]) => (
                    <div key={cc} className="cs-threat-feed-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {FLAG[cc] || '🏳️'} {COUNTRY_NAME[cc] || cc}
                      </span>
                      <span style={{ color: 'var(--cs-accent)' }}>{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'all' && (
                <div className="cs-threat-feed">
                  {countryStats.map(([cc, n]) => (
                    <div key={cc} className="cs-threat-feed-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {FLAG[cc] || '🏳️'} {COUNTRY_NAME[cc] || cc}
                      </span>
                      <span style={{ color: 'var(--cs-accent)' }}>{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cs-threat-wl">
              <span className="cs-threat-wl-dot" style={{ background: wlDotColor }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {whitelistEnabled ? (
                  <>
                    Whitelist
                    {wlIp ? `: ${wlIp}` : ''}
                    {wlStatus === 'aktualisiert' && wlLastChange
                      ? ` · ${de ? 'geändert' : 'changed'} ${wlLastChange}`
                      : wlLastCheck
                        ? ` · ${wlLastCheck}`
                        : ''}
                  </>
                ) : (
                  <>
                    crowdsec.db
                    {lastUpdate ? ` · ${de ? 'Aktualisiert' : 'Updated'} ${lastUpdate}` : ''}
                  </>
                )}
              </span>
            </div>
          </aside>
        )}
      </div>

      {loading && <div className="cs-threat-loading">{de ? 'Lade CrowdSec…' : 'Loading CrowdSec…'}</div>}
      {!loading && !dbPath && (
        <div className="cs-threat-setup">
          <h4>{de ? 'EINRICHTUNG' : 'SETUP'}</h4>
          <p className="cs-threat-setup-lead">
            {de
              ? 'Nur crowdsec.db — kein API-Key, kein LAPI. Zahnrad → Pfad eintragen.'
              : 'crowdsec.db only — no API key or LAPI. Gear icon → set path.'}
          </p>
          {layoutMode !== 'phone' && (
            <ol>
              <li>
                {de ? 'Volume ' : 'Volume '}
                <code>/mnt/user/appdata/crowdsec/data</code> → <code>/crowdsec-data</code>
              </li>
              <li>
                <code>/crowdsec-data/crowdsec.db</code>
              </li>
            </ol>
          )}
        </div>
      )}
      {error && !loading && dbPath && (
        <div className="cs-threat-error">
          {de ? 'Verbindungsfehler: ' : 'Connection error: '}
          {error}
        </div>
      )}

      <FeedLogModal item={logItem} de={de} onClose={() => setLogItem(null)} />

      <style>{`.blink{animation:blink 2s step-end infinite}@keyframes blink{50%{opacity:0}}`}</style>
    </div>
  )
}

export function CrowdsecSettings({ config, onChange }: PluginSettingsProps) {
  const { locale } = useDashboardStore()
  const de = locale === 'de'
  const [testState, setTestState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')
  const inp: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          {de ? 'Pfad crowdsec.db (im Container)' : 'crowdsec.db path (in container)'}
        </label>
        <input
          style={inp}
          value={str(config.dbPath) || '/crowdsec-data/crowdsec.db'}
          onChange={(e) => onChange('dbPath', e.target.value)}
          placeholder="/crowdsec-data/crowdsec.db"
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.45 }}>
          {de
            ? 'Unraid: Host-Ordner …/crowdsec/data → Container /crowdsec-data (read-only). Kein API-Key nötig.'
            : 'Unraid: host folder …/crowdsec/data → container /crowdsec-data (read-only). No API key needed.'}
        </p>
      </div>

      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px' }}>
          {de ? 'Datenbank testen:' : 'Test database:'}
        </p>
        <button
          type="button"
          style={{
            marginTop: 8,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
          onClick={async () => {
            setTestState('idle')
            setTestMsg(de ? 'Teste…' : 'Testing…')
            try {
              const dbPath = str(config.dbPath) || '/crowdsec-data/crowdsec.db'
              if (!dbPath) throw new Error('missing_db_path')
              const q = new URLSearchParams({
                dbPath,
                daysBack: String(Math.round(num(config.daysBack, 365))),
                serverLat: String(num(config.serverLat, 0)),
                serverLon: String(num(config.serverLon, 0)),
                probe: '1',
              })
              const res = await fetch(`/api/crowdsec?${q}`, { cache: 'no-store' })
              if (!res.ok) {
                const j = (await res.json().catch(() => ({}))) as { error?: string }
                throw new Error(j.error || `HTTP ${res.status}`)
              }
              const j = (await res.json()) as {
                totalAlerts?: number
                probe?: { totalInDb: number; feedRows: number; mapPoints: number }
              }
              setTestState('ok')
              const n = j.totalAlerts ?? 0
              const inDb = j.probe?.totalInDb ?? 0
              if (n > 0) {
                setTestMsg(de ? `OK — ${n} Alerts (${j.probe?.feedRows ?? n} im Feed)` : `OK — ${n} alerts (${j.probe?.feedRows ?? n} in feed)`)
              } else if (inDb > 0) {
                setTestMsg(
                  de
                    ? `DB hat ${inDb} Alerts, aber 0 im Zeitraum — „Historie (Tage)“ erhöhen oder cscli alerts list prüfen`
                    : `DB has ${inDb} alerts but 0 in range — increase “History (days)” or check cscli alerts list`,
                )
              } else {
                setTestMsg(de ? 'OK — DB erreichbar, noch keine Alerts in crowdsec.db' : 'OK — DB reachable, no alerts in crowdsec.db yet')
              }
            } catch (e) {
              setTestState('fail')
              setTestMsg(formatCrowdsecError(e instanceof Error ? e.message : 'fetch_failed', de))
            }
          }}
        >
          {de ? 'Verbindung testen' : 'Test connection'}
        </button>
        {testMsg ? (
          <p style={{ fontSize: 11, marginTop: 6, color: testState === 'ok' ? 'var(--accent)' : 'var(--text-muted)' }}>{testMsg}</p>
        ) : null}
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          {de ? 'Dynamische Whitelist (optional)' : 'Dynamic whitelist (optional)'}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={bool(config.whitelistEnabled, false)}
            onChange={(e) => onChange('whitelistEnabled', e.target.checked)}
          />
          {de
            ? 'Öffentliche IP in my-whitelist.yaml (threat-map-docker-Stil)'
            : 'Write public IP to my-whitelist.yaml (threat-map-docker style)'}
        </label>
        {bool(config.whitelistEnabled, false) ? (
          <>
            <input
              style={inp}
              value={str(config.whitelistPath) || '/crowdsec-postoverflows/s01-whitelist/my-whitelist.yaml'}
              onChange={(e) => onChange('whitelistPath', e.target.value)}
              placeholder="/crowdsec-postoverflows/s01-whitelist/my-whitelist.yaml"
            />
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 8, marginBottom: 4 }}>
              {de ? 'Intervall (Sekunden)' : 'Interval (seconds)'}
            </label>
            <input
              style={inp}
              type="number"
              min={60}
              max={86400}
              value={Math.min(86400, Math.max(60, Math.round(num(config.whitelistInterval, 900))))}
              onChange={(e) =>
                onChange('whitelistInterval', Math.min(86400, Math.max(60, Math.round(Number(e.target.value)) || 900)))
              }
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
              {de
                ? 'Volume …/crowdsec/postoverflows → /crowdsec-postoverflows (read-write) + Docker-Socket. Container-Name unten bei „Sperre löschen“.'
                : 'Volume …/crowdsec/postoverflows → /crowdsec-postoverflows (read-write) + Docker socket. Container name under “Remove bans”.'}
            </p>
          </>
        ) : null}
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          {de ? 'Sperre löschen (optional)' : 'Remove bans (optional)'}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
          <input type="checkbox" checked={bool(config.dockerUnban, false)} onChange={(e) => onChange('dockerUnban', e.target.checked)} />
          {de ? 'via Docker (cscli im CrowdSec-Container)' : 'via Docker (cscli in CrowdSec container)'}
        </label>
        {bool(config.dockerUnban, false) ? (
          <>
            <input
              style={inp}
              value={str(config.crowdsecContainer) || 'crowdsec'}
              onChange={(e) => onChange('crowdsecContainer', e.target.value)}
              placeholder="crowdsec"
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.45 }}>
              {de
                ? 'Docker-Socket an SelfDashboard. Feed 🗑️ = cscli decisions + alerts delete.'
                : 'Mount Docker socket on SelfDashboard. Feed 🗑️ runs cscli decisions + alerts delete.'}
            </p>
          </>
        ) : null}
      </div>

      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          {de ? 'Historie (Tage)' : 'History (days)'}
        </label>
        <input
          style={inp}
          type="number"
          min={1}
          max={3650}
          value={Math.round(num(config.daysBack, 365))}
          onChange={(e) => onChange('daysBack', Math.min(3650, Math.max(1, Math.round(Number(e.target.value)) || 365)))}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
          {de ? 'Aktualisieren (Sek.)' : 'Refresh (seconds)'}
        </label>
        <input
          style={inp}
          type="number"
          min={15}
          max={300}
          value={Math.min(300, Math.max(15, Math.round(num(config.refreshSeconds, 30))))}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(15, Math.round(Number(e.target.value)) || 30)))}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{de ? 'Anzeige' : 'Display'}</label>
        {[
          { key: 'showMap', labelDe: 'Weltkarte', labelEn: 'World map', default: true },
          { key: 'showSidebar', labelDe: 'Seitenleiste (Feed, Stats)', labelEn: 'Sidebar (feed, stats)', default: true },
          { key: 'showSparkline', labelDe: 'Sparkline (Feed-Tab)', labelEn: 'Sparkline (feed tab)', default: true },
        ].map(({ key, labelDe, labelEn, default: def }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={bool(config[key], def)} onChange={(e) => onChange(key, e.target.checked)} />
            {de ? labelDe : labelEn}
          </label>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            {de ? 'Server-Breite (opt.)' : 'Server lat (opt.)'}
          </label>
          <input style={inp} type="number" step="any" value={num(config.serverLat, 0) || ''} onChange={(e) => onChange('serverLat', e.target.value)} placeholder="52.52" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            {de ? 'Server-Länge (opt.)' : 'Server lon (opt.)'}
          </label>
          <input style={inp} type="number" step="any" value={num(config.serverLon, 0) || ''} onChange={(e) => onChange('serverLon', e.target.value)} placeholder="13.40" />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{de ? 'Server-Name (opt.)' : 'Server name (opt.)'}</label>
        <input style={inp} value={str(config.serverName)} onChange={(e) => onChange('serverName', e.target.value)} />
      </div>

      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{de ? 'Standard-Thema' : 'Default theme'}</label>
        <select style={inp} value={str(config.theme) || 'cyan'} onChange={(e) => onChange('theme', e.target.value)}>
          <option value="cyan">Cyan</option>
          <option value="alarm">Alarm</option>
          <option value="matrix">Matrix</option>
          <option value="amber">Amber</option>
        </select>
      </div>
    </div>
  )
}