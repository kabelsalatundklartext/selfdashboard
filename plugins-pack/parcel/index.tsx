'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

// ---------------------------------------------------------------------------
// Types — TrackResult mirrors the normalized shape from server.ts.
// ---------------------------------------------------------------------------

type Carrier = 'auto' | 'dhl' | 'hermes' | 'dpd'
type TrackState = 'delivered' | 'transit' | 'problem' | 'unknown'

type Shipment = {
  id: string
  number: string
  carrier: Carrier
  name: string
}

type TrackEvent = { date: string; text: string; location?: string }

type TrackResult = {
  carrier: string
  number: string
  found: boolean
  state: TrackState
  status: string
  progress?: number
  eta?: string
  lastEvent?: TrackEvent
  events: TrackEvent[]
}

type Entry =
  | { kind: 'loading' }
  | { kind: 'ok'; result: TrackResult }
  | { kind: 'error'; message: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown, d: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : d
}

function clampRefresh(v: unknown): number {
  return Math.min(180, Math.max(10, Math.round(num(v, 30))))
}

const CARRIERS: Carrier[] = ['auto', 'dhl', 'hermes', 'dpd']
/** Bounds the number of upstream calls one widget can fan out per refresh. */
const MAX_SHIPMENTS = 25

function isCarrier(v: string): v is Carrier {
  return (CARRIERS as string[]).includes(v)
}

function carrierLabel(c: string): string {
  switch (c) {
    case 'dhl':
      return 'DHL'
    case 'hermes':
      return 'Hermes'
    case 'dpd':
      return 'DPD'
    case 'auto':
      return 'Auto'
    default:
      return c.toUpperCase()
  }
}

function carrierColor(c: string): string {
  switch (c) {
    case 'dhl':
      return '#fecc00'
    case 'hermes':
      return '#0098d4'
    case 'dpd':
      return '#dc0032'
    default:
      return 'var(--text-muted)'
  }
}

const STATE_COLORS: Record<TrackState, string> = {
  delivered: '#22c55e',
  transit: 'var(--accent)',
  problem: '#f59e0b',
  unknown: 'var(--text-muted)',
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `s_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

function parseShipments(raw: unknown): Shipment[] {
  let arr: unknown = raw
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw || '[]')
    } catch {
      return []
    }
  }
  if (!Array.isArray(arr)) return []
  // Keep entries with an empty number too — a freshly added shipment starts
  // blank and must survive the config round-trip so it can be filled in.
  return arr
    .slice(0, MAX_SHIPMENTS)
    .map((s): Shipment | null => {
      if (typeof s !== 'object' || s === null) return null
      const o = s as Record<string, unknown>
      const carrier = str(o.carrier).toLowerCase()
      return {
        id: str(o.id) || newId(),
        number: str(o.number).replace(/\s+/g, ''),
        carrier: isCarrier(carrier) ? carrier : 'auto',
        name: str(o.name),
      }
    })
    .filter((s): s is Shipment => s !== null)
}

function fmtDate(raw: string, de: boolean): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isFinite(d.getTime())) {
    return d.toLocaleString(de ? 'de-DE' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return raw
}

function stateLabel(state: TrackState, de: boolean): string {
  switch (state) {
    case 'delivered':
      return de ? 'Zugestellt' : 'Delivered'
    case 'transit':
      return de ? 'Unterwegs' : 'In transit'
    case 'problem':
      return de ? 'Aktion nötig' : 'Action needed'
    default:
      return de ? 'Unbekannt' : 'Unknown'
  }
}

// ---------------------------------------------------------------------------
// Inline SVG icons — never depend on the host's curated lucide set.
// ---------------------------------------------------------------------------

type IconProps = { size?: number; color?: string }

function IconPackage({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16.5 9.4 7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function IconTruck({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="6.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function IconCheck({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function IconAlert({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function IconPlus({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function IconTrash({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function StateIcon({ state, size, color }: { state: TrackState; size: number; color: string }) {
  if (state === 'delivered') return <IconCheck size={size} color={color} />
  if (state === 'problem') return <IconAlert size={size} color={color} />
  if (state === 'transit') return <IconTruck size={size} color={color} />
  return <IconPackage size={size} color={color} />
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchTrack(shipment: Shipment, signal: AbortSignal): Promise<Entry> {
  const q = new URLSearchParams({ carrier: shipment.carrier, number: shipment.number })
  try {
    const res = await fetch(`/api/plugins/parcel/track?${q}`, { signal, cache: 'no-store' })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      const code = str(json.error) || `HTTP ${res.status}`
      return { kind: 'error', message: code }
    }
    return { kind: 'ok', result: json as unknown as TrackResult }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { kind: 'loading' }
    return { kind: 'error', message: 'network_error' }
  }
}

function errorText(code: string, de: boolean): string {
  switch (code) {
    case 'invalid_number':
      return de ? 'Ungültige Sendungsnummer.' : 'Invalid tracking number.'
    case 'gls_unsupported':
      return de ? 'GLS bietet keine kostenlose Verfolgung mehr.' : 'GLS no longer offers free tracking.'
    case 'timeout':
      return de ? 'Zeitüberschreitung beim Carrier.' : 'Carrier timed out.'
    case 'network_error':
      return de ? 'Netzwerkfehler.' : 'Network error.'
    case 'fetch_failed':
    case 'blocked_url':
      return de ? 'Carrier nicht erreichbar.' : 'Carrier unreachable.'
    default:
      return de ? 'Fehler beim Abruf.' : 'Lookup failed.'
  }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

function Widget({ config, instanceId }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const cfg = config as Record<string, unknown>
  const updatePluginConfig = useDashboardStore((st) => st.updatePluginConfig)
  // allShipments keeps blank entries (for editing); shipments is the trackable subset.
  const allShipments = useMemo(() => parseShipments(cfg.shipments), [cfg.shipments])
  const shipments = useMemo(() => allShipments.filter((s) => s.number), [allShipments])
  const canEdit = Boolean(instanceId)
  const refreshMin = clampRefresh(cfg.refreshMinutes)
  const hideDelivered = cfg.hideDelivered === true
  const showTitle = cfg.showTitle !== false
  const title = cfg.title === undefined ? (de ? 'Pakete' : 'Parcels') : str(cfg.title)

  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const { ref: shellRef, active } = usePollingActive<HTMLDivElement>()

  const writeShipments = useCallback(
    (list: Shipment[]) => {
      if (instanceId) updatePluginConfig(instanceId, { shipments: JSON.stringify(list) })
    },
    [instanceId, updatePluginConfig],
  )

  const addInline = useCallback(
    (rawNumber: string, carrier: Carrier) => {
      const n = rawNumber.replace(/\s+/g, '')
      if (!n || allShipments.length >= MAX_SHIPMENTS) return
      writeShipments([...allShipments, { id: newId(), number: n, carrier, name: '' }])
    },
    [allShipments, writeShipments],
  )

  const removeShipment = useCallback(
    (id: string) => {
      writeShipments(allShipments.filter((s) => s.id !== id))
    },
    [allShipments, writeShipments],
  )

  // Stable signature so the effect only re-subscribes when shipments change.
  const sig = useMemo(() => shipments.map((s) => `${s.id}|${s.carrier}|${s.number}`).join(','), [shipments])

  const refresh = useCallback(
    async (signal: AbortSignal) => {
      if (shipments.length === 0) {
        setEntries({})
        return
      }
      const results = await Promise.all(
        shipments.map(async (s) => [s.id, await fetchTrack(s, signal)] as const),
      )
      if (signal.aborted) return
      setEntries((prev) => {
        const next: Record<string, Entry> = {}
        for (const [id, entry] of results) {
          // Keep the last good result if a refresh transiently fails.
          if (entry.kind === 'error' && prev[id]?.kind === 'ok') next[id] = prev[id]
          else next[id] = entry
        }
        return next
      })
    },
    [shipments],
  )

  useEffect(() => {
    if (!active) return
    const ac = new AbortController()
    // Seed loading state for shipments we have not seen yet.
    setEntries((prev) => {
      const next = { ...prev }
      for (const s of shipments) if (!next[s.id]) next[s.id] = { kind: 'loading' }
      return next
    })
    void refresh(ac.signal)
    const t = window.setInterval(() => void refresh(ac.signal), refreshMin * 60_000)
    return () => {
      ac.abort()
      window.clearInterval(t)
    }
    // `sig` is the proxy for `refresh`'s only dependency (shipments): both derive
    // from cfg.shipments, so when shipments change sig changes and the effect
    // re-captures the fresh refresh. If refresh ever gains another dependency,
    // fold it into `sig` too — otherwise this would go stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, refreshMin, active])

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '12px 14px',
    containerType: 'size',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  if (shipments.length === 0) {
    return (
      <div ref={shellRef} style={{ ...shell, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
        <IconPackage size={30} color="var(--text-muted)" />
        {canEdit ? (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.45 }}>
              {de ? 'Sendungsnummer hinzufügen:' : 'Add a tracking number:'}
            </p>
            <AddForm onAdd={addInline} de={de} />
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de
              ? 'Noch keine Sendungen. In den Einstellungen hinzufügen.'
              : 'No shipments yet. Add one in settings.'}
          </p>
        )}
      </div>
    )
  }

  const visible = hideDelivered
    ? shipments.filter((s) => {
        const e = entries[s.id]
        return !(e?.kind === 'ok' && e.result.state === 'delivered')
      })
    : shipments

  return (
    <div ref={shellRef} style={shell}>
      {showTitle && title ? (
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(9px, 2.4cqmin, 10px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          {title}
          <span style={{ fontWeight: 600, opacity: 0.7 }}> · {visible.length}</span>
        </p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minHeight: 0, flex: 1 }}>
        {visible.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              {de ? 'Alle Sendungen zugestellt.' : 'All shipments delivered.'}
            </p>
          </div>
        ) : (
          visible.map((s) => (
            <ShipmentRow
              key={s.id}
              shipment={s}
              entry={entries[s.id]}
              de={de}
              onRemove={canEdit ? () => removeShipment(s.id) : undefined}
            />
          ))
        )}
      </div>

      {canEdit && allShipments.length < MAX_SHIPMENTS ? (
        <div style={{ flexShrink: 0 }}>
          <AddForm onAdd={addInline} de={de} compact />
        </div>
      ) : null}
    </div>
  )
}

function ShipmentRow({
  shipment,
  entry,
  de,
  onRemove,
}: {
  shipment: Shipment
  entry: Entry | undefined
  de: boolean
  onRemove?: () => void
}) {
  const result = entry?.kind === 'ok' ? entry.result : null
  const state: TrackState = result?.state ?? 'unknown'
  const notFound = result != null && !result.found
  const isError = entry?.kind === 'error'
  const isLoading = entry == null || entry.kind === 'loading'

  const detectedCarrier = result?.carrier || shipment.carrier
  const accent = STATE_COLORS[state]
  const cColor = carrierColor(detectedCarrier)
  const neutral = notFound || isError

  const headline = shipment.name || `${carrierLabel(detectedCarrier)} ${shipment.number}`
  // Without a custom name the number is already the headline — skip the subline.
  const subline = shipment.name ? `${carrierLabel(detectedCarrier)} · ${shipment.number}` : ''

  const last = result?.lastEvent
  const eta = result?.eta

  let statusLine = ''
  if (isLoading) statusLine = de ? 'Wird geladen…' : 'Loading…'
  else if (isError) statusLine = errorText(entry.message, de)
  else if (notFound) statusLine = de ? 'Keine Daten (Nummer/Anbieter prüfen)' : 'No data (check number/carrier)'
  else statusLine = result?.status || stateLabel(state, de)

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${neutral ? 'var(--border)' : accent}`,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1, color: neutral ? 'var(--text-muted)' : accent }}>
        <StateIcon state={neutral ? 'unknown' : state} size={20} color="currentColor" />
      </div>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 'clamp(12px, 3.4cqmin, 14px)',
              fontWeight: 700,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
            title={headline}
          >
            {headline}
          </span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cColor, flexShrink: 0 }} title={carrierLabel(detectedCarrier)} />
        </div>

        {subline ? (
          <span
            style={{
              fontSize: 'clamp(9px, 2.3cqmin, 10.5px)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={subline}
          >
            {subline}
          </span>
        ) : null}

        <span
          style={{
            fontSize: 'clamp(10px, 2.7cqmin, 12px)',
            fontWeight: 600,
            color: neutral ? 'var(--text-muted)' : accent,
            lineHeight: 1.3,
            marginTop: 1,
          }}
        >
          {statusLine}
        </span>

        {last && (last.location || last.date) ? (
          <span style={{ fontSize: 'clamp(9px, 2.2cqmin, 10.5px)', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            {[last.location, fmtDate(last.date, de)].filter(Boolean).join(' · ')}
          </span>
        ) : null}

        {eta && state !== 'delivered' ? (
          <span style={{ fontSize: 'clamp(9px, 2.2cqmin, 10.5px)', color: 'var(--text)', opacity: 0.85 }}>
            {de ? 'Voraussichtlich: ' : 'Expected: '}
            {fmtDate(eta, de)}
          </span>
        ) : null}
      </div>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title={de ? 'Entfernen' : 'Remove'}
          aria-label={de ? 'Entfernen' : 'Remove'}
          style={{
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 2,
            marginTop: -2,
            marginRight: -2,
            lineHeight: 0,
            opacity: 0.6,
          }}
        >
          <IconTrash size={14} />
        </button>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const inp: CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  boxSizing: 'border-box',
}

/** Inline add row used directly inside the widget (number + carrier + add). */
function AddForm({
  onAdd,
  de,
  compact,
}: {
  onAdd: (number: string, carrier: Carrier) => void
  de: boolean
  compact?: boolean
}) {
  const [number, setNumber] = useState('')
  const [carrier, setCarrier] = useState<Carrier>('auto')
  const ready = number.trim().length > 0
  const submit = () => {
    if (!ready) return
    onAdd(number, carrier)
    setNumber('')
  }
  const field: CSSProperties = { ...inp, fontSize: compact ? 12 : 13, padding: compact ? '5px 8px' : '6px 10px' }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        style={{ ...field, flex: 1, minWidth: 0 }}
        value={number}
        placeholder={de ? 'Sendungsnummer' : 'Tracking number'}
        onChange={(e) => setNumber(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <select
        style={{ ...field, width: 'auto', cursor: 'pointer' }}
        value={carrier}
        onChange={(e) => setCarrier(isCarrier(e.target.value) ? e.target.value : 'auto')}
      >
        {CARRIERS.map((c) => (
          <option key={c} value={c}>
            {carrierLabel(c)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        disabled={!ready}
        title={de ? 'Hinzufügen' : 'Add'}
        aria-label={de ? 'Hinzufügen' : 'Add'}
        style={{
          ...field,
          width: 'auto',
          cursor: ready ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          opacity: ready ? 1 : 0.5,
          color: 'var(--accent)',
        }}
      >
        <IconPlus size={16} />
      </button>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const cfg = config as Record<string, unknown>
  const shipments = useMemo(() => parseShipments(cfg.shipments), [cfg.shipments])
  const showTitle = cfg.showTitle !== false
  // Local draft so the number input accepts intermediate values instead of
  // snapping to the clamped value on every keystroke; committed on blur.
  const [refreshDraft, setRefreshDraft] = useState(() => String(clampRefresh(cfg.refreshMinutes)))
  const atLimit = shipments.length >= MAX_SHIPMENTS

  const persist = useCallback(
    (list: Shipment[]) => {
      onChange('shipments', JSON.stringify(list))
    },
    [onChange],
  )

  const addShipment = useCallback(() => {
    if (shipments.length >= MAX_SHIPMENTS) return
    persist([...shipments, { id: newId(), number: '', carrier: 'auto', name: '' }])
  }, [shipments, persist])

  const updateShipment = useCallback(
    (id: string, patch: Partial<Shipment>) => {
      persist(shipments.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    [shipments, persist],
  )

  const removeShipment = useCallback(
    (id: string) => {
      persist(shipments.filter((s) => s.id !== id))
    },
    [shipments, persist],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTitle} onChange={(e) => onChange('showTitle', e.target.checked)} />
          {de ? 'Titel oben anzeigen' : 'Show title at top'}
        </label>
        <input
          style={{ ...inp, opacity: showTitle ? 1 : 0.5 }}
          disabled={!showTitle}
          value={cfg.title === undefined ? (de ? 'Pakete' : 'Parcels') : str(cfg.title)}
          placeholder={de ? 'Pakete' : 'Parcels'}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      {/* Shipments */}
      <div>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
          {de ? 'Sendungen' : 'Shipments'}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shipments.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 10,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={s.name}
                  placeholder={de ? 'Name (optional, z. B. Schuhe)' : 'Name (optional)'}
                  onChange={(e) => updateShipment(s.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeShipment(s.id)}
                  title={de ? 'Entfernen' : 'Remove'}
                  aria-label={de ? 'Entfernen' : 'Remove'}
                  style={{ ...inp, width: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' }}
                >
                  <IconTrash size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={s.number}
                  placeholder={de ? 'Sendungsnummer' : 'Tracking number'}
                  onChange={(e) => updateShipment(s.id, { number: e.target.value.replace(/\s+/g, '') })}
                />
                <select
                  style={{ ...inp, width: 'auto', cursor: 'pointer' }}
                  value={s.carrier}
                  onChange={(e) => updateShipment(s.id, { carrier: isCarrier(e.target.value) ? e.target.value : 'auto' })}
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {carrierLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addShipment}
          disabled={atLimit}
          style={{
            ...inp,
            marginTop: 10,
            cursor: atLimit ? 'not-allowed' : 'pointer',
            opacity: atLimit ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontWeight: 600,
            borderStyle: 'dashed',
          }}
        >
          <IconPlus size={16} />
          {atLimit
            ? de
              ? `Maximal ${MAX_SHIPMENTS} Sendungen`
              : `Maximum ${MAX_SHIPMENTS} shipments`
            : de
              ? 'Sendung hinzufügen'
              : 'Add shipment'}
        </button>
      </div>

      {/* Options */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={cfg.hideDelivered === true} onChange={(e) => onChange('hideDelivered', e.target.checked)} />
          {de ? 'Zugestellte ausblenden' : 'Hide delivered'}
        </label>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          {de ? 'Aktualisieren (Min.)' : 'Refresh (minutes)'}
        </label>
        <input
          style={inp}
          type="number"
          min={10}
          max={180}
          value={refreshDraft}
          onChange={(e) => setRefreshDraft(e.target.value)}
          onBlur={() => {
            const v = clampRefresh(refreshDraft)
            setRefreshDraft(String(v))
            onChange('refreshMinutes', v)
          }}
        />
      </div>

      <p style={{ margin: 0, fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {de
          ? 'DHL und Hermes sind stabil. DPD ist experimentell (Bot-Schutz kann den Abruf blockieren). GLS unterstützt keine kostenlose Verfolgung mehr. Der Server braucht ausgehenden Internetzugriff.'
          : 'DHL and Hermes are stable. DPD is experimental (bot protection may block lookups). GLS no longer offers free tracking. The server needs outbound internet.'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meta + exports
// ---------------------------------------------------------------------------

export const meta: PluginMeta = {
  id: 'parcel',
  name: 'Paketverfolgung',
  description:
    'Sendungsverfolgung für DHL, Hermes und DPD — kostenlos, ohne API-Key. Mehrere Pakete im Blick mit Status, letztem Scan und voraussichtlicher Zustellung. (DPD experimentell, GLS nicht verfügbar.)',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '📦',
  version: '0.2.1',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'shipments', label: 'Sendungen', type: 'text', defaultValue: '[]' },
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'Pakete' },
    { key: 'hideDelivered', label: 'Zugestellte ausblenden', type: 'boolean', defaultValue: false },
    { key: 'refreshMinutes', label: 'Aktualisieren (Min.)', type: 'number', defaultValue: 30 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
