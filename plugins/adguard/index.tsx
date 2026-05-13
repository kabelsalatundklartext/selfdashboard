'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Activity, Ban, ExternalLink, Network, Percent, Shield, ShieldOff, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'adguard',
  name: 'AdGuard Home',
  description:
    'DNS-Statistik und Schutzstatus per AdGuard-Home-API (Basis-URL + optional Basic-Auth). Anfragen laufen über SelfDashboard (/api/adguard), damit CORS kein Problem ist.',
  version: '1.0.1',
  author: 'SelfDashboard',
  category: 'network',
  icon: '🛡️',
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
  return s
}

function dnsQueries(stats: Record<string, unknown>): number {
  return num(stats.dns_queries ?? stats.num_dns_queries)
}

function blockedTotal(stats: Record<string, unknown>): number {
  return (
    num(stats.blocked_filtering) +
    num(stats.blocked_safebrowsing) +
    num(stats.blocked_parental) +
    num(stats.blocked_threat) +
    num(stats.blocked_malware) +
    num(stats.blocked_ad)
  )
}

function formatInt(n: number, locale: Locale): string {
  return Math.round(n).toLocaleString(locale === 'en' ? 'en-GB' : 'de-DE')
}

const TINT = {
  sky: { solid: '#38bdf8', wash: 'rgba(56, 189, 248, 0.2)', rim: 'rgba(56, 189, 248, 0.38)' },
  rose: { solid: '#fb7185', wash: 'rgba(251, 113, 133, 0.18)', rim: 'rgba(251, 113, 133, 0.4)' },
  violet: { solid: '#c084fc', wash: 'rgba(192, 132, 252, 0.2)', rim: 'rgba(192, 132, 252, 0.38)' },
  emerald: { solid: '#34d399', wash: 'rgba(52, 211, 153, 0.18)', rim: 'rgba(52, 211, 153, 0.38)' },
} as const

type TintKey = keyof typeof TINT

/** Accent + soft wash — readable on dark & light themes */
function StatTile({
  label,
  value,
  tint,
  icon: Icon,
  footer,
}: {
  label: string
  value: string
  tint: TintKey
  icon: LucideIcon
  footer?: ReactNode
}) {
  const c = TINT[tint]
  return (
    <div
      style={{
        borderRadius: '12px',
        padding: '10px 10px 10px 12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
        minHeight: 'clamp(68px, 22cqmin, 92px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '2px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Icon size={13} strokeWidth={2.25} style={{ color: c.solid, flexShrink: 0, opacity: 0.95 }} aria-hidden />
        <span
          style={{
            fontSize: 'clamp(9px, 2.1cqmin, 10px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="tabular-nums"
        style={{
          fontSize: 'clamp(1.05rem, 5.2cqmin, 1.55rem)',
          fontWeight: 800,
          color: c.solid,
          lineHeight: 1.12,
          fontVariantNumeric: 'tabular-nums',
          marginTop: '4px',
        }}
      >
        {value}
      </span>
      {footer}
    </div>
  )
}

interface ApiOk {
  stats: Record<string, unknown>
  status: Record<string, unknown> | null
  statusHttp?: number
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
  const username = str(config.username)
  const password = str(config.password)
  const refreshSec = Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20)))

  const [data, setData] = useState<ApiOk | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    if (!base) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/adguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ url: base, username, password }),
      })
      const j = (await res.json()) as ApiOk & ApiErr
      if (!res.ok) {
        const code = j.status ?? res.status
        if (res.status === 401 || res.status === 403) {
          setError(de ? 'Anmeldung fehlgeschlagen (Benutzer/Passwort).' : 'Login failed (user/password).')
        } else if (j.error === 'timeout') {
          setError(de ? 'Zeitüberschreitung — AdGuard erreichbar?' : 'Timeout — is AdGuard reachable?')
        } else {
          const d = j.detail ? ` ${j.detail}` : ''
          setError(de ? `API-Fehler (${code}).${d}` : `API error (${code}).${d}`)
        }
        setData(null)
        return
      }
      setData({ stats: (j.stats ?? {}) as Record<string, unknown>, status: (j.status ?? null) as Record<string, unknown> | null })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [base, username, password, de])

  useEffect(() => {
    void fetch_()
    const id = window.setInterval(() => void fetch_(), refreshSec * 1000)
    return () => window.clearInterval(id)
  }, [fetch_, refreshSec])

  const shell: React.CSSProperties = {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    padding: '8px 12px 12px',
    containerType: 'size',
    minWidth: 0,
    width: '100%',
  }

  if (!base) {
    return (
      <div
        style={{
          ...shell,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(56,189,248,0.14) 0%, transparent 58%)',
        }}
      >
        <div
          style={{
            width: 'clamp(52px, 18cqmin, 72px)',
            height: 'clamp(52px, 18cqmin, 72px)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, rgba(56,189,248,0.22), rgba(192,132,252,0.18))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          }}
        >
          <Shield size={30} strokeWidth={2} style={{ color: '#7dd3fc' }} aria-hidden />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.45, maxWidth: '22em' }}>
          {de ? (
            <>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>AdGuard Home</span> — Basis-URL in den Einstellungen eintragen
            </>
          ) : (
            <>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>AdGuard Home</span> — set the base URL in settings
            </>
          )}
        </p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[75, 50, 90, 40].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: '10px', width: `${w}%`, borderRadius: '3px' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div
        style={{
          ...shell,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(251,113,133,0.12) 0%, transparent 55%)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, rgba(251,113,133,0.25), rgba(244,63,94,0.12))',
            border: '1px solid rgba(251, 113, 133, 0.45)',
          }}
        >
          <ShieldOff size={24} strokeWidth={2} style={{ color: '#fda4af' }} aria-hidden />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '10px', wordBreak: 'break-word', maxWidth: '100%', fontWeight: 600 }}>{error}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
          {de
            ? 'URL (http://IP:Port), Benutzer und Passwort wie im AdGuard-Web-UI prüfen.'
            : 'Check URL (http://IP:port), username and password as in the AdGuard web UI.'}
        </p>
      </div>
    )
  }

  const stats = data?.stats ?? {}
  const status = data?.status
  const total = dnsQueries(stats)
  const blocked = blockedTotal(stats)
  const pct = total > 0 ? Math.min(100, Math.round((blocked / total) * 1000) / 10) : 0
  const avgMs = num(stats.avg_processing_time)
  const protection = status?.protection_enabled === true
  const running = status?.running === true
  const version = str(status?.version)

  const title = de ? 'AdGuard Home' : 'AdGuard Home'

  const pctBar = (
    <div style={{ marginTop: '10px' }}>
      <div
        style={{
          height: '7px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(192,132,252,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #a78bfa, #f472b6, #fb7185)',
            boxShadow: '0 0 12px rgba(244, 114, 182, 0.45)',
            transition: 'width 0.35s ease',
          }}
        />
      </div>
    </div>
  )

  return (
    <div style={{ ...shell, background: 'radial-gradient(ellipse 120% 80% at 10% -20%, rgba(56,189,248,0.08) 0%, transparent 50%)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px',
          padding: '8px 10px',
          borderRadius: '12px',
          background: 'linear-gradient(105deg, rgba(56,189,248,0.12) 0%, rgba(192,132,252,0.1) 45%, var(--surface-2) 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, rgba(56,189,248,0.35), rgba(192,132,252,0.28))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              flexShrink: 0,
            }}
          >
            <Shield size={16} strokeWidth={2.2} style={{ color: '#e0f2fe' }} aria-hidden />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 'clamp(11px, 2.6cqmin, 13px)', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>{title}</p>
            {version ? (
              <p style={{ margin: '2px 0 0', fontSize: 'clamp(9px, 2.1cqmin, 10px)', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>{version}</p>
            ) : null}
          </div>
        </div>
        <a
          href={base}
          target="_blank"
          rel="noopener noreferrer"
          title={de ? 'AdGuard öffnen' : 'Open AdGuard'}
          style={{
            color: '#7dd3fc',
            display: 'flex',
            flexShrink: 0,
            padding: '6px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
          }}
        >
          <ExternalLink size={15} strokeWidth={2.25} />
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'clamp(10px, 2.5cqmin, 12px)',
            fontWeight: 800,
            padding: '5px 11px',
            borderRadius: '999px',
            border: protection ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(251, 113, 133, 0.45)',
            background: protection
              ? 'linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)'
              : 'linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)',
            color: protection ? '#ecfdf5' : '#ffe4e6',
            boxShadow: protection ? '0 0 16px rgba(52, 211, 153, 0.22)' : '0 0 12px rgba(251, 113, 133, 0.15)',
          }}
        >
          {protection ? <Shield size={13} aria-hidden /> : <ShieldOff size={13} aria-hidden />}
          {protection ? (de ? 'Schutz aktiv' : 'Protection on') : de ? 'Schutz aus' : 'Protection off'}
        </span>
        {running === false && (
          <span
            style={{
              fontSize: 'clamp(10px, 2.4cqmin, 11px)',
              color: '#fde68a',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            {de ? 'DNS inaktiv' : 'DNS off'}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <StatTile label={de ? 'DNS-Anfragen' : 'DNS queries'} value={formatInt(total, locale)} tint="sky" icon={Network} />
        <StatTile label={de ? 'Blockiert' : 'Blocked'} value={formatInt(blocked, locale)} tint="rose" icon={Ban} />
        <StatTile
          label={de ? 'Anteil blockiert' : 'Blocked %'}
          value={`${pct.toLocaleString(de ? 'de-DE' : 'en-GB')}%`}
          tint="violet"
          icon={Percent}
          footer={pctBar}
        />
        {avgMs > 0 ? (
          <StatTile label={de ? 'Ø Antwortzeit' : 'Avg response'} value={`${avgMs.toFixed(1)} ms`} tint="emerald" icon={Activity} />
        ) : (
          <div
            style={{
              borderRadius: '12px',
              border: '1px dashed rgba(52, 211, 153, 0.35)',
              background: 'rgba(52, 211, 153, 0.06)',
              minHeight: 'clamp(68px, 22cqmin, 92px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
            }}
          >
            <span style={{ fontSize: 'clamp(10px, 2.3cqmin, 11px)', color: 'var(--text-muted)', textAlign: 'center' }}>
              {de ? 'Keine Latenz-Daten' : 'No latency data'}
            </span>
          </div>
        )}
      </div>
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
        <input
          style={inp}
          value={str(config.url)}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="http://192.168.1.5:3000"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          AdGuard-Web-Interface-URL (ohne /control). Ohne <code style={{ fontSize: '10px' }}>http://</code> wird http angenommen.
        </p>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Benutzername (optional)
        </label>
        <input style={inp} value={str(config.username)} onChange={(e) => onChange('username', e.target.value)} placeholder="" autoComplete="off" />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          Passwort (optional)
        </label>
        <input
          style={inp}
          type="password"
          value={str(config.password)}
          onChange={(e) => onChange('password', e.target.value)}
          placeholder=""
          autoComplete="new-password"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          Entspricht dem AdGuard-Admin-Login (HTTP Basic). Leer lassen, falls kein Passwort gesetzt ist.
        </p>
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
