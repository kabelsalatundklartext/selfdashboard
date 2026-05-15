'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, Globe, Hand, List, PieChart, Shield, ShieldOff, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'pihole',
  name: 'Pi-hole',
  description:
    'Pi-hole-v6-Statistik wie im Web-Dashboard (Anfragen, blockiert, Anteil, Domains auf Listen). Blocking per Klick. Daten via /api/pihole.',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🕳️',
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function normalizeBase(url: string): string {
  let s = url.trim().replace(/\/$/, '')
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  if (s.endsWith('/admin')) s = s.slice(0, -'/admin'.length).replace(/\/$/, '')
  return s
}

function record(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function formatInt(n: number, locale: Locale): string {
  return Math.round(n).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')
}

function formatPercent(pct: number, locale: Locale): string {
  const loc = locale === 'en' ? 'en-GB' : 'de-DE'
  const s = pct.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${s} %`
}

function adminHref(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function BoxFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 10px',
        color: 'rgba(255,255,255,0.92)',
        fontSize: 'clamp(8px, 2cqmin, 10px)',
        textDecoration: 'none',
        lineHeight: 1.3,
        minWidth: 0,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
      <span
        style={{
          flexShrink: 0,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.18)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
      </span>
    </a>
  )
}

function BoxFooterText({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '6px 10px',
        color: 'rgba(255,255,255,0.92)',
        fontSize: 'clamp(8px, 2cqmin, 10px)',
        lineHeight: 1.3,
        minWidth: 0,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
      <span
        style={{
          flexShrink: 0,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.18)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronRight size={11} strokeWidth={2.5} aria-hidden style={{ opacity: 0.85 }} />
      </span>
    </div>
  )
}

function PiHoleSmallBox({
  title,
  value,
  bg,
  footerBg,
  icon: Icon,
  footer,
}: {
  title: string
  value: string
  bg: string
  footerBg: string
  icon: LucideIcon
  footer: ReactNode
}) {
  return (
    <div
      className="sd-pihole-box"
      style={{
        position: 'relative',
        borderRadius: '4px',
        background: bg,
        color: '#fff',
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
      }}
    >
      <div style={{ padding: '10px 12px 8px', flex: '1 1 auto', minHeight: 0, position: 'relative', zIndex: 1 }}>
        <p style={{ margin: 0, fontSize: 'clamp(9px, 2.2cqmin, 11px)', fontWeight: 600, opacity: 0.95, lineHeight: 1.25 }}>{title}</p>
        <p
          className="tabular-nums"
          style={{
            margin: '6px 0 0',
            fontSize: 'clamp(1.15rem, min(6.5cqmin, 5cqh), 2rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </p>
      </div>
      <Icon
        size={72}
        strokeWidth={1.25}
        aria-hidden
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-52%)',
          opacity: 0.22,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ background: footerBg, marginTop: 'auto', flexShrink: 0 }}>{footer}</div>
    </div>
  )
}

interface ApiOk {
  summary: Record<string, unknown> | null
  blocking: boolean | null
}

interface ApiErr {
  error: string
  status?: number
  detail?: string
}

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'

  const base = normalizeBase(str(config.url))
  const password = str(config.password)
  const totp = str(config.totp)
  const refreshSec = Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20)))

  const [data, setData] = useState<ApiOk | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [blockBusy, setBlockBusy] = useState(false)

  const fetch_ = useCallback(async () => {
    if (!base) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/pihole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ url: base, password, totp: totp || undefined }),
      })
      const j = (await res.json()) as ApiOk & ApiErr
      if (!res.ok) {
        const code = j.status ?? res.status
        if (res.status === 401 || res.status === 403 || j.error === 'auth_failed') {
          setError(de ? 'Anmeldung fehlgeschlagen (Passwort / 2FA).' : 'Login failed (password / 2FA).')
        } else if (j.error === 'timeout') {
          setError(de ? 'Zeitüberschreitung — Pi-hole erreichbar?' : 'Timeout — is Pi-hole reachable?')
        } else {
          const d = j.detail ? ` ${j.detail}` : ''
          setError(de ? `API-Fehler (${code}).${d}` : `API error (${code}).${d}`)
        }
        setData(null)
        return
      }
      setData({
        summary: (j.summary ?? null) as Record<string, unknown> | null,
        blocking: typeof j.blocking === 'boolean' ? j.blocking : null,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [base, password, totp, de])

  const toggleBlocking = useCallback(async () => {
    if (!base || blockBusy || data?.blocking == null) return
    const next = !data.blocking
    setBlockBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/pihole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          action: 'blocking',
          url: base,
          password,
          totp: totp || undefined,
          blocking: next,
        }),
      })
      const j = (await res.json()) as { error?: string; detail?: string }
      if (!res.ok) {
        const d = j.detail ? ` ${j.detail}` : ''
        setError(
          de ? `Blocking konnte nicht geändert werden (${res.status}).${d}` : `Could not change blocking (${res.status}).${d}`,
        )
        return
      }
      await fetch_()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBlockBusy(false)
    }
  }, [base, password, totp, de, blockBusy, data?.blocking, fetch_])

  useEffect(() => {
    void fetch_()
    const id = window.setInterval(() => void fetch_(), refreshSec * 1000)
    return () => window.clearInterval(id)
  }, [fetch_, refreshSec])

  const shell: React.CSSProperties = {
    height: '100%',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }
  const shellPadded: React.CSSProperties = { ...shell, padding: '14px 14px 12px' }

  if (!base) {
    return (
      <div
        className="sd-plugin-no-scrollbar"
        style={{
          ...shellPadded,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(249,115,22,0.14) 0%, transparent 58%)',
        }}
      >
        <EmptyHint de={de} />
      </div>
    )
  }

  if (loading && !data) {
    return <LoadingSkeleton shellPadded={shellPadded} />
  }

  if (error && !data) {
    return <ErrorView de={de} error={error} shellPadded={shellPadded} />
  }

  const queries = record(data?.summary?.queries)
  const clients = record(data?.summary?.clients)
  const gravity = record(data?.summary?.gravity)
  const total = num(queries.total)
  const blocked = num(queries.blocked)
  const pctRaw = num(queries.percent_blocked)
  const pct =
    pctRaw > 0
      ? Math.min(100, Math.round(pctRaw * 10) / 10)
      : total > 0
        ? Math.min(100, Math.round((blocked / total) * 1000) / 10)
        : 0
  const activeClients = num(clients.active)
  const domainsOnLists =
    num(gravity.domains_being_blocked) || num(gravity.domains_on_lists) || num(data?.summary?.domains_being_blocked)

  const blockingOn = data?.blocking === true
  const blockingKnown = data?.blocking != null

  const labels = de
    ? {
        totalQueries: 'Anfragen insgesamt',
        queriesBlocked: 'Blockierte Anfragen',
        percentBlocked: 'Prozentsatz blockiert',
        domainsOnLists: 'Domänen auf Listen',
        activeClients: (n: number) =>
          n === 1 ? '1 aktiver Client' : `${formatInt(n, locale)} aktive Clients`,
        listBlocked: 'Blockierte Anfragen anzeigen',
        listAll: 'Alle Anfragen anzeigen',
        manageLists: 'Listen verwalten',
      }
    : {
        totalQueries: 'Total Queries',
        queriesBlocked: 'Queries Blocked',
        percentBlocked: 'Percentage Blocked',
        domainsOnLists: 'Domains on Lists',
        activeClients: (n: number) => (n === 1 ? '1 active client' : `${formatInt(n, locale)} active clients`),
        listBlocked: 'List blocked queries',
        listAll: 'List all queries',
        manageLists: 'Manage lists',
      }

  return (
    <div className="sd-plugin-no-scrollbar sd-pihole-host" style={{ ...shell, background: 'var(--background)' }}>
      <style>{`
        .sd-pihole-host {
          padding: 10px 10px 8px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          gap: 8px;
        }
        .sd-pihole-host .sd-pihole-box-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          min-width: 0;
          flex: 1 1 auto;
          min-height: 0;
          align-content: start;
        }
        @container (max-width: 520px) {
          .sd-pihole-host .sd-pihole-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @container (max-width: 280px) {
          .sd-pihole-host .sd-pihole-box-grid { grid-template-columns: 1fr; }
        }
        @container (max-height: 320px) {
          .sd-pihole-host { padding: 6px 6px 5px; gap: 5px; }
          .sd-pihole-host .sd-pihole-box-grid { gap: 5px; }
        }
      `}</style>
      {error && data && (
        <p style={{ fontSize: '10px', color: '#fb7185', margin: 0, textAlign: 'center', lineHeight: 1.35 }}>{error}</p>
      )}
      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          disabled={blockBusy || !blockingKnown}
          aria-pressed={blockingOn}
          className="sd-pihole-block-btn"
          onClick={() => void toggleBlocking()}
          style={{
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: 'clamp(9px, min(2.4cqmin, 2cqh), 12px)',
            fontWeight: 800,
            padding: '7px 12px',
            borderRadius: '6px',
            border: blockingOn ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(251, 113, 133, 0.45)',
            background: blockingOn
              ? 'linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)'
              : 'linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)',
            color: blockingOn ? '#ecfdf5' : '#ffe4e6',
            cursor: blockBusy || !blockingKnown ? 'wait' : 'pointer',
            opacity: blockBusy || !blockingKnown ? 0.75 : 1,
            fontFamily: 'inherit',
          }}
        >
          {blockingOn ? <Shield size={13} aria-hidden /> : <ShieldOff size={13} aria-hidden />}
          {blockBusy ? '…' : blockingOn ? (de ? 'Blocking: AN' : 'Blocking: On') : de ? 'Blocking: AUS' : 'Blocking: Off'}
        </button>
      </div>
      <div className="sd-pihole-box-grid">
        <PiHoleSmallBox
          title={labels.totalQueries}
          value={formatInt(total, locale)}
          bg="#00c0ef"
          footerBg="rgba(0,0,0,0.12)"
          icon={Globe}
          footer={<BoxFooterText>{labels.activeClients(activeClients)}</BoxFooterText>}
        />
        <PiHoleSmallBox
          title={labels.queriesBlocked}
          value={formatInt(blocked, locale)}
          bg="#dd4b39"
          footerBg="rgba(0,0,0,0.14)"
          icon={Hand}
          footer={
            <BoxFooterLink href={adminHref(base, '/queries?status=blocked')}>{labels.listBlocked}</BoxFooterLink>
          }
        />
        <PiHoleSmallBox
          title={labels.percentBlocked}
          value={formatPercent(pct, locale)}
          bg="#f39c12"
          footerBg="rgba(0,0,0,0.12)"
          icon={PieChart}
          footer={<BoxFooterLink href={adminHref(base, '/queries')}>{labels.listAll}</BoxFooterLink>}
        />
        <PiHoleSmallBox
          title={labels.domainsOnLists}
          value={formatInt(domainsOnLists, locale)}
          bg="#00a65a"
          footerBg="rgba(0,0,0,0.12)"
          icon={List}
          footer={<BoxFooterLink href={adminHref(base, '/groups/domains')}>{labels.manageLists}</BoxFooterLink>}
        />
      </div>
    </div>
  )
}

function EmptyHint({ de }: { de: boolean }) {
  return (
    <>
      <div
        style={{
          width: 'clamp(52px, 18cqmin, 72px)',
          height: 'clamp(52px, 18cqmin, 72px)',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, rgba(249,115,22,0.22), rgba(251,191,36,0.18))',
          border: '1px solid rgba(249, 115, 22, 0.35)',
        }}
      >
        <Shield size={30} strokeWidth={2} style={{ color: '#fdba74' }} aria-hidden />
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.45, maxWidth: '22em' }}>
        {de ? (
          <>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Pi-hole</span> — Basis-URL in den Einstellungen eintragen
          </>
        ) : (
          <>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Pi-hole</span> — set the base URL in settings
          </>
        )}
      </p>
    </>
  )
}

function LoadingSkeleton({ shellPadded }: { shellPadded: React.CSSProperties }) {
  return (
    <div className="sd-plugin-no-scrollbar" style={shellPadded}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '4px' }} />
        ))}
      </div>
    </div>
  )
}

function ErrorView({
  de,
  error,
  shellPadded,
}: {
  de: boolean
  error: string
  shellPadded: React.CSSProperties
}) {
  return (
    <div
      className="sd-plugin-no-scrollbar"
      style={{
        ...shellPadded,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <ShieldOff size={24} strokeWidth={2} style={{ color: '#fda4af' }} aria-hidden />
      <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '10px', wordBreak: 'break-word', fontWeight: 600 }}>{error}</p>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
        {de ? 'URL (http://IP), Pi-hole v6 und Web-Passwort prüfen.' : 'Check URL (http://IP), Pi-hole v6 and web password.'}
      </p>
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const inp: React.CSSProperties = {
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
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Basis-URL
        </label>
        <input style={inp} value={str(config.url)} onChange={(e) => onChange('url', e.target.value)} placeholder="http://192.168.1.10" />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Web-Passwort (optional)
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.password)}
          onChange={(e) => onChange('password', e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          2FA-Code (optional)
        </label>
        <input
          style={inp}
          value={str(config.totp)}
          onChange={(e) => onChange('totp', e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Aktualisieren (Sekunden)
        </label>
        <input
          style={inp}
          type="number"
          min={10}
          max={300}
          value={Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20)))}
          onChange={(e) => onChange('refreshSeconds', Math.min(300, Math.max(10, Math.round(Number(e.target.value)) || 20)))}
        />
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
