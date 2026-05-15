'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Ban, Network, Percent, Shield, ShieldOff, Users, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'pihole',
  name: 'Pi-hole',
  description:
    'DNS-Statistik und Blocking-Status per Pi-hole-v6-API (Basis-URL + Web-Passwort oder App-Passwort). Blocking per Klick umschalten. Daten via /api/pihole (CORS-frei).',
  version: '1.0.0',
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

const TINT = {
  sky: { solid: '#38bdf8', wash: 'rgba(56, 189, 248, 0.2)', rim: 'rgba(56, 189, 248, 0.38)' },
  rose: { solid: '#fb7185', wash: 'rgba(251, 113, 133, 0.18)', rim: 'rgba(251, 113, 133, 0.4)' },
  violet: { solid: '#c084fc', wash: 'rgba(192, 132, 252, 0.2)', rim: 'rgba(192, 132, 252, 0.38)' },
  amber: { solid: '#fbbf24', wash: 'rgba(251, 191, 36, 0.18)', rim: 'rgba(251, 191, 36, 0.4)' },
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
      className="sd-pihole-tile"
      style={{
        borderRadius: '12px',
        background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
        border: '1px solid var(--border)',
        boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
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
          className="sd-pihole-tile-label"
          style={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            lineHeight: 1.2,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {label}
        </span>
      </div>
      <span
        className="tabular-nums sd-pihole-tile-value"
        style={{
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
        setError(de ? `Blocking konnte nicht geändert werden (${res.status}).${d}` : `Could not change blocking (${res.status}).${d}`)
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
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
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
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="sd-plugin-no-scrollbar" style={shellPadded}>
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
        className="sd-plugin-no-scrollbar"
        style={{
          ...shellPadded,
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
            ? 'URL (http://IP), Pi-hole v6 und Web-Passwort prüfen. Ohne Passwort Feld leer lassen.'
            : 'Check URL (http://IP), Pi-hole v6 and web password. Leave password empty if none is set.'}
        </p>
      </div>
    )
  }

  const queries = record(data?.summary?.queries)
  const clients = record(data?.summary?.clients)
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
  const blockingOn = data?.blocking === true
  const blockingKnown = data?.blocking != null

  const pctBar = (
    <div className="sd-pihole-pctbar" style={{ marginTop: '10px' }}>
      <div
        style={{
          height: '7px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #fbbf24, #f97316, #fb7185)',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.45)',
            transition: 'width 0.35s ease',
          }}
        />
      </div>
    </div>
  )

  return (
    <div
      className="sd-plugin-no-scrollbar sd-pihole-host"
      style={{ ...shell, background: 'radial-gradient(ellipse 120% 80% at 10% -20%, rgba(249,115,22,0.08) 0%, transparent 50%)' }}
    >
      <style>{`
        .sd-pihole-host {
          padding: 14px 14px 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .sd-pihole-host .sd-pihole-stat-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr 1fr;
          min-width: 0;
          flex: 1 1 auto;
          min-height: 0;
          align-content: start;
        }
        /* Schmal + viel Höhe: eine Spalte lesbar. Schmal + wenig Höhe: zwei Spalten, damit alles ohne Scroll passt */
        @container (max-width: 320px) and (min-height: 500px) {
          .sd-pihole-host .sd-pihole-stat-grid {
            grid-template-columns: 1fr;
          }
        }
        @container (max-height: 460px) {
          .sd-pihole-host .sd-pihole-stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
        }
        .sd-pihole-host .sd-pihole-tile {
          padding: 9px 10px 9px 11px;
          min-height: clamp(48px, min(16cqmin, 13cqh), 86px);
        }
        .sd-pihole-host .sd-pihole-tile-value {
          font-size: clamp(0.78rem, min(4.8cqmin, 3.8cqh), 1.45rem);
        }
        .sd-pihole-host .sd-pihole-tile .sd-pihole-tile-label {
          font-size: clamp(8px, min(1.9cqmin, 1.6cqh), 10px);
        }
        @container (max-height: 380px) {
          .sd-pihole-host {
            padding: 9px 9px 8px;
          }
          .sd-pihole-host .sd-pihole-top {
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .sd-pihole-host .sd-pihole-block-btn {
            padding: 5px 10px !important;
          }
          .sd-pihole-host .sd-pihole-tile {
            min-height: clamp(40px, min(12cqmin, 10cqh), 72px);
            padding: 5px 7px 5px 8px;
          }
          .sd-pihole-host .sd-pihole-tile-value {
            font-size: clamp(0.68rem, min(4cqmin, 3.2cqh), 1.15rem);
            margin-top: 2px !important;
          }
          .sd-pihole-host .sd-pihole-pctbar {
            margin-top: 5px !important;
          }
          .sd-pihole-host .sd-pihole-pctbar > div:first-child {
            height: 5px !important;
          }
        }
        @container (max-height: 260px) {
          .sd-pihole-host {
            padding: 6px 6px 5px;
          }
          .sd-pihole-host .sd-pihole-stat-grid {
            gap: 4px;
          }
          .sd-pihole-host .sd-pihole-tile {
            min-height: 0;
            padding: 4px 5px;
          }
          .sd-pihole-host .sd-pihole-tile-value {
            font-size: clamp(0.62rem, min(3.5cqmin, 2.8cqh), 0.95rem);
          }
        }
      `}</style>
      {error && data && (
        <p style={{ fontSize: '10px', color: '#fb7185', margin: '0 0 8px', textAlign: 'center', lineHeight: 1.35 }}>{error}</p>
      )}
      <div
        className="sd-pihole-top"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', width: '100%', alignItems: 'stretch', flexShrink: 0 }}
      >
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
            padding: '8px 14px',
            borderRadius: '999px',
            border: blockingOn ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(251, 113, 133, 0.45)',
            background: blockingOn
              ? 'linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)'
              : 'linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)',
            color: blockingOn ? '#ecfdf5' : '#ffe4e6',
            boxShadow: blockingOn
              ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.22), 0 0 0 1px rgba(52, 211, 153, 0.28)'
              : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.2), 0 0 0 1px rgba(251, 113, 133, 0.28)',
            cursor: blockBusy || !blockingKnown ? 'wait' : 'pointer',
            opacity: blockBusy || !blockingKnown ? 0.75 : 1,
            fontFamily: 'inherit',
          }}
        >
          {blockingOn ? <Shield size={13} aria-hidden /> : <ShieldOff size={13} aria-hidden />}
          {blockBusy ? '…' : blockingOn ? (de ? 'Blocking: AN' : 'Blocking: On') : de ? 'Blocking: AUS' : 'Blocking: Off'}
        </button>
      </div>

      <div className="sd-pihole-stat-grid">
        <StatTile label={de ? 'DNS-Anfragen' : 'DNS queries'} value={formatInt(total, locale)} tint="sky" icon={Network} />
        <StatTile label={de ? 'Gesperrt' : 'Blocked'} value={formatInt(blocked, locale)} tint="rose" icon={Ban} />
        <StatTile
          label={de ? 'Block-Anteil' : 'Blocked %'}
          value={`${pct.toLocaleString(de ? 'de-DE' : 'en-GB')}%`}
          tint="violet"
          icon={Percent}
          footer={pctBar}
        />
        <StatTile
          label={de ? 'Aktive Clients' : 'Active clients'}
          value={formatInt(activeClients, locale)}
          tint="amber"
          icon={Users}
        />
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
          placeholder="http://192.168.1.10"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          Pi-hole v6 — Weboberfläche (z. B. <code style={{ fontSize: '10px' }}>http://IP</code> oder{' '}
          <code style={{ fontSize: '10px' }}>https://pi.hole</code>). Endet die URL mit{' '}
          <code style={{ fontSize: '10px' }}>/admin</code>, wird das entfernt.
        </p>
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
          placeholder=""
          autoComplete="new-password"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          Admin- oder App-Passwort aus den Pi-hole-Einstellungen. Leer lassen, wenn kein Passwort gesetzt ist.
        </p>
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
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.45 }}>
          Nur bei aktivierter Zwei-Faktor-Authentifizierung. Aktueller TOTP-Code aus der Authenticator-App.
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
