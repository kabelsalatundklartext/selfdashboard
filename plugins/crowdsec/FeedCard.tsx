'use client'

import { useRef, useState } from 'react'
import type { FeedItem } from '@/lib/crowdsecMetrics'
import { FLAG, COUNTRY_NAME } from './constants'
import { IpLookupMenu } from './IpLookupMenu'

type FeedCardProps = {
  item: FeedItem
  de: boolean
  mapFocusIp: string | null
  dockerUnban: boolean
  crowdsecContainer: string
  onShowLog: (item: FeedItem) => void
  onLookupIp: (ip: string) => void
  onShowOnMap: (item: FeedItem) => void
  onUnbanDone: () => void
}

export function FeedCard({
  item,
  de,
  mapFocusIp,
  dockerUnban,
  crowdsecContainer,
  onShowLog,
  onLookupIp,
  onShowOnMap,
  onUnbanDone,
}: FeedCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string | null>(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const lookupBtnRef = useRef<HTMLButtonElement>(null)

  const cc = item.country?.toUpperCase() || '??'
  const countryLabel = COUNTRY_NAME[cc] || cc
  const flag = FLAG[cc] || '🏳️'
  const onMap = mapFocusIp === item.ip

  async function handleDeleteBan() {
    if (!item.active_ban || !dockerUnban) {
      onShowLog(item)
      return
    }
    setDeleteErr(null)
    setDeleting(true)
    try {
      const res = await fetch('/api/crowdsec/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: item.ip, container: crowdsecContainer }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      onUnbanDone()
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'delete_failed'
      if (raw === 'docker_unavailable') {
        setDeleteErr(de ? 'Docker-Socket fehlt' : 'Docker socket missing')
      } else if (raw === 'crowdsec_container_not_found') {
        setDeleteErr(de ? `Container „${crowdsecContainer}" nicht gefunden` : `Container "${crowdsecContainer}" not found`)
      } else {
        setDeleteErr(de ? 'Löschen fehlgeschlagen' : 'Delete failed')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className={`cs-feed-card ${onMap ? 'cs-feed-card--map-focus' : ''}`}>
      <div className="cs-feed-card-head">
        <span className="cs-feed-card-ip">{item.ip}</span>
        <div className="cs-feed-card-actions">
          {/* 1 — Status: nur Alert vs. aktive Sperre */}
          <button
            type="button"
            className={`cs-feed-action cs-feed-action--status ${item.active_ban ? 'cs-feed-action--ban-on' : 'cs-feed-action--alert-only'}`}
            title={
              item.active_ban
                ? de
                  ? 'Aktive Sperre in crowdsec.db'
                  : 'Active ban in crowdsec.db'
                : de
                  ? 'Nur Alert — kein aktiver Ban'
                  : 'Alert only — no active ban'
            }
            disabled
            aria-label={de ? 'Sperrstatus' : 'Ban status'}
          >
            {item.active_ban ? '🚫' : '📢'}
          </button>

          {/* 2 — Alert-Details oder Sperre löschen (cscli via Docker) */}
          <button
            type="button"
            className={`cs-feed-action cs-feed-action--log ${item.active_ban ? 'cs-feed-action--delete' : ''}`}
            title={
              item.active_ban
                ? dockerUnban
                  ? de
                    ? 'Sperre aufheben (cscli im CrowdSec-Container)'
                    : 'Remove ban (cscli in CrowdSec container)'
                  : de
                    ? 'Alert-Details (Löschen braucht Docker + Container-Name in Einstellungen)'
                    : 'Alert details (delete needs Docker + container name in settings)'
                : de
                  ? 'Alert / Event-Details'
                  : 'Alert / event details'
            }
            disabled={deleting}
            onClick={() => void handleDeleteBan()}
            aria-label={item.active_ban ? (de ? 'Sperre löschen' : 'Remove ban') : de ? 'Alert anzeigen' : 'Show alert'}
          >
            {deleting ? '…' : item.active_ban ? '🗑️' : '📋'}
          </button>

          {/* 3 — IP-Lookup-Menü (wie threat-map-docker) */}
          <button
            ref={lookupBtnRef}
            type="button"
            className={`cs-feed-action cs-feed-action--search ${lookupOpen ? 'on' : ''}`}
            title={de ? 'IP nachschlagen (CrowdSec CTI, Shodan, …)' : 'Look up IP (CrowdSec CTI, Shodan, …)'}
            onClick={() => {
              onLookupIp(item.ip)
              setLookupOpen((v) => !v)
            }}
            aria-label={de ? 'IP nachschlagen' : 'Look up IP'}
            aria-expanded={lookupOpen}
          >
            🔍
          </button>

          {/* 4 — Auf Karte zentrieren */}
          <button
            type="button"
            className={`cs-feed-action cs-feed-action--map ${onMap ? 'on' : ''}`}
            title={de ? 'Auf Karte anzeigen' : 'Show on map'}
            onClick={() => onShowOnMap(item)}
            aria-label={de ? 'Auf Karte anzeigen' : 'Show on map'}
          >
            🗺️
          </button>
        </div>
      </div>
      {deleteErr ? <div className="cs-feed-card-err">{deleteErr}</div> : null}

      {item.iprange ? (
        <div className="cs-feed-card-line cs-feed-card-range">
          <span aria-hidden>📡</span> {item.iprange}
        </div>
      ) : null}

      <div className="cs-feed-card-line cs-feed-card-geo">
        <span className="cs-feed-cc">
          {flag} {cc} {countryLabel}
        </span>
        {item.city ? <span className="cs-feed-city">{item.city}</span> : null}
        {item.asnumber ? <span className="cs-feed-asn">{item.asnumber}</span> : null}
      </div>

      {item.asname ? <div className="cs-feed-card-line cs-feed-card-org">{item.asname}</div> : null}

      <div className="cs-feed-card-line cs-feed-card-scenario">
        <span aria-hidden>⚡</span> {item.scenario}
      </div>

      <div className="cs-feed-card-line cs-feed-card-time">
        <span aria-hidden>🕐</span> {item.time_de || item.time_iso}
      </div>

      {lookupOpen ? (
        <IpLookupMenu
          item={item}
          de={de}
          anchorEl={lookupBtnRef.current}
          onClose={() => setLookupOpen(false)}
        />
      ) : null}
    </article>
  )
}

function formatEventLog(raw: string): string {
  if (!raw) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export function FeedLogModal({
  item,
  de,
  onClose,
}: {
  item: FeedItem | null
  de: boolean
  onClose: () => void
}) {
  if (!item) return null
  const body = formatEventLog(item.eventPreview)

  return (
    <div className="cs-feed-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cs-feed-modal"
        role="dialog"
        aria-labelledby="cs-feed-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cs-feed-modal-head">
          <h4 id="cs-feed-modal-title">
            {item.ip} · {item.scenario}
          </h4>
          <button type="button" className="cs-feed-modal-close" onClick={onClose} aria-label={de ? 'Schließen' : 'Close'}>
            ✕
          </button>
        </div>
        <p className="cs-feed-modal-meta">
          {FLAG[item.country] || '🏳️'} {item.country}
          {item.city ? ` · ${item.city}` : ''}
          {item.asnumber ? ` · ${item.asnumber}` : ''}
          {item.asname ? ` · ${item.asname}` : ''}
          {item.active_ban
            ? de
              ? ' · 🚫 Aktive Sperre'
              : ' · 🚫 Active ban'
            : de
              ? ' · 📢 Nur Alert'
              : ' · 📢 Alert only'}
        </p>
        <pre className="cs-feed-modal-pre">{body || (de ? 'Kein Event-JSON in der DB.' : 'No event JSON in DB.')}</pre>
      </div>
    </div>
  )
}
