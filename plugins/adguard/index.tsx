'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Activity, Ban, Network, Percent, Shield, ShieldOff, type LucideIcon } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'adguard',
  name: 'AdGuard Home',
  description:
    'DNS-Statistik und Schutzstatus per AdGuard-Home-API (Basis-URL + optional Basic-Auth). Schutz per Klick umschalten. Daten via /api/adguard (CORS-frei).',
  version: '1.1.5',
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

function seriesOrScalar(stats: Record<string, unknown>, numKey: string, seriesKey: string): number {
  const s = stats[seriesKey]
  if (Array.isArray(s) && s.length > 0) {
    return s.reduce((acc: number, x: unknown) => acc + (Number(x) || 0), 0)
  }
  const n = stats[numKey]
  if (typeof n === 'number' && Number.isFinite(n)) return n
  return 0
}

function dnsQueries(stats: Record<string, unknown>): number {
  return Math.round(seriesOrScalar(stats, 'num_dns_queries', 'dns_queries'))
}

function blockedTotal(stats: Record<string, unknown>): number {
  return Math.round(
    seriesOrScalar(stats, 'num_blocked_filtering', 'blocked_filtering') +
      seriesOrScalar(stats, 'num_replaced_safebrowsing', 'replaced_safebrowsing') +
      seriesOrScalar(stats, 'num_replaced_parental', 'replaced_parental') +
      seriesOrScalar(stats, 'num_replaced_safesearch', 'replaced_safesearch') +
      num(stats.blocked_threat) +
      num(stats.blocked_malware) +
      num(stats.blocked_ad),
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
      className="sd-adguard-tile"
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
          className="sd-adguard-tile-label"
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
        className="tabular-nums sd-adguard-tile-value"
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
  stats: Record<string, unknown>
  status: Record<string, unknown> | null
  statusHttp?: number
  statsConfig?: Record<string, unknown> | null
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
  const [protBusy, setProtBusy] = useState(false)

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
      setData({
        stats: (j.stats ?? {}) as Record<string, unknown>,
        status: (j.status ?? null) as Record<string, unknown> | null,
        statsConfig: (j.statsConfig ?? null) as Record<string, unknown> | null,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [base, username, password, de])

  const toggleProtection = useCallback(async () => {
    if (!base || protBusy) return
    const currentlyOn = data?.status?.protection_enabled === true
    const next = !currentlyOn
    setProtBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/adguard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ action: 'protection', url: base, username, password, enabled: next }),
      })
      const j = (await res.json()) as { error?: string; detail?: string }
      if (!res.ok) {
        const d = j.detail ? ` ${j.detail}` : ''
        setError(de ? `Schutz konnte nicht geändert werden (${res.status}).${d}` : `Could not change protection (${res.status}).${d}`)
        return
      }
      await fetch_()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setProtBusy(false)
    }
  }, [base, username, password, de, protBusy, data?.status?.protection_enabled, fetch_])

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
            ? 'URL (http://IP:Port), Benutzer und Passwort wie im AdGuard-Web-UI prüfen.'
            : 'Check URL (http://IP:port), username and password as in the AdGuard web UI.'}
        </p>
      </div>
    )
  }

  const stats = data?.stats ?? {}
  const status = data?.status
  const statsCfg = data?.statsConfig
  const total = dnsQueries(stats)
  const blocked = blockedTotal(stats)
  const pct = total > 0 ? Math.min(100, Math.round((blocked / total) * 1000) / 10) : 0
  const avgSec = num(stats.avg_processing_time)
  const avgMs = avgSec > 0 ? avgSec * 1000 : 0
  const protection = status?.protection_enabled === true
  const running = status?.running === true
  const statsDisabled = statsCfg != null && statsCfg.enabled === false

  const pctBar = (
    <div className="sd-adguard-pctbar" style={{ marginTop: '10px' }}>
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
    <div
      className="sd-plugin-no-scrollbar sd-adguard-host"
      style={{ ...shell, background: 'radial-gradient(ellipse 120% 80% at 10% -20%, rgba(56,189,248,0.08) 0%, transparent 50%)' }}
    >
      <style>{`
        .sd-adguard-host {
          padding: 14px 14px 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .sd-adguard-host .sd-adguard-stat-grid {
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
          .sd-adguard-host .sd-adguard-stat-grid {
            grid-template-columns: 1fr;
          }
        }
        @container (max-height: 460px) {
          .sd-adguard-host .sd-adguard-stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
        }
        .sd-adguard-host .sd-adguard-tile {
          padding: 9px 10px 9px 11px;
          min-height: clamp(48px, min(16cqmin, 13cqh), 86px);
        }
        .sd-adguard-host .sd-adguard-tile-value {
          font-size: clamp(0.78rem, min(4.8cqmin, 3.8cqh), 1.45rem);
        }
        .sd-adguard-host .sd-adguard-tile .sd-adguard-tile-label {
          font-size: clamp(8px, min(1.9cqmin, 1.6cqh), 10px);
        }
        @container (max-height: 380px) {
          .sd-adguard-host {
            padding: 9px 9px 8px;
          }
          .sd-adguard-host .sd-adguard-top {
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .sd-adguard-host .sd-adguard-prot-btn {
            padding: 5px 10px !important;
          }
          .sd-adguard-host .sd-adguard-tile {
            min-height: clamp(40px, min(12cqmin, 10cqh), 72px);
            padding: 5px 7px 5px 8px;
          }
          .sd-adguard-host .sd-adguard-tile-value {
            font-size: clamp(0.68rem, min(4cqmin, 3.2cqh), 1.15rem);
            margin-top: 2px !important;
          }
          .sd-adguard-host .sd-adguard-pctbar {
            margin-top: 5px !important;
          }
          .sd-adguard-host .sd-adguard-pctbar > div:first-child {
            height: 5px !important;
          }
        }
        @container (max-height: 260px) {
          .sd-adguard-host {
            padding: 6px 6px 5px;
          }
          .sd-adguard-host .sd-adguard-stat-grid {
            gap: 4px;
          }
          .sd-adguard-host .sd-adguard-tile {
            min-height: 0;
            padding: 4px 5px;
          }
          .sd-adguard-host .sd-adguard-tile-value {
            font-size: clamp(0.62rem, min(3.5cqmin, 2.8cqh), 0.95rem);
          }
        }
      `}</style>
      {error && data && (
        <p style={{ fontSize: '10px', color: '#fb7185', margin: '0 0 8px', textAlign: 'center', lineHeight: 1.35 }}>{error}</p>
      )}
      <div
        className="sd-adguard-top"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', width: '100%', alignItems: 'stretch', flexShrink: 0 }}
      >
        <button
          type="button"
          disabled={protBusy}
          aria-pressed={protection}
          className="sd-adguard-prot-btn"
          onClick={() => void toggleProtection()}
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
            border: protection ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(251, 113, 133, 0.45)',
            background: protection
              ? 'linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)'
              : 'linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)',
            color: protection ? '#ecfdf5' : '#ffe4e6',
            boxShadow: protection
              ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.22), 0 0 0 1px rgba(52, 211, 153, 0.28)'
              : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.2), 0 0 0 1px rgba(251, 113, 133, 0.28)',
            cursor: protBusy ? 'wait' : 'pointer',
            opacity: protBusy ? 0.75 : 1,
            fontFamily: 'inherit',
          }}
        >
          {protection ? <Shield size={13} aria-hidden /> : <ShieldOff size={13} aria-hidden />}
          {protBusy ? '…' : protection ? (de ? 'Schutz: AN' : 'On') : de ? 'Schutz: AUS' : 'Off'}
        </button>
        {running === false && (
          <span
            style={{
              alignSelf: 'center',
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

      <div className="sd-adguard-stat-grid">
        <StatTile label={de ? 'DNS-Anfragen' : 'DNS queries'} value={formatInt(total, locale)} tint="sky" icon={Network} />
        <StatTile label={de ? 'Gesperrt' : 'Blocked'} value={formatInt(blocked, locale)} tint="rose" icon={Ban} />
        <StatTile
          label={de ? 'Block-Anteil' : 'Blocked %'}
          value={`${pct.toLocaleString(de ? 'de-DE' : 'en-GB')}%`}
          tint="violet"
          icon={Percent}
          footer={pctBar}
        />
        {avgSec > 0 ? (
          <StatTile label={de ? 'Ø Antwortzeit' : 'Avg response'} value={`${avgMs.toFixed(1)} ms`} tint="emerald" icon={Activity} />
        ) : (
          <div
            className="sd-adguard-tile sd-adguard-tile-placeholder"
            style={{
              borderRadius: '12px',
              border: '1px dashed rgba(52, 211, 153, 0.35)',
              background: 'rgba(52, 211, 153, 0.06)',
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

      {statsDisabled && (
        <p style={{ fontSize: '10px', color: '#fbbf24', marginTop: '10px', marginBottom: 0, textAlign: 'center', lineHeight: 1.45 }}>
          {de
            ? 'Statistiken sind in AdGuard Home aus — Einstellungen → Allgemeine Einstellungen → Statistiken einschalten.'
            : 'Statistics are off in AdGuard Home — enable them under Settings → General settings → Statistics.'}
        </p>
      )}
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
          Nur die Weboberflächen-Adresse (z. B. <code style={{ fontSize: '10px' }}>http://IP:3000</code>). Nicht mit{' '}
          <code style={{ fontSize: '10px' }}>/control</code> enden — das wird automatisch ergänzt. Falls die URL schon{' '}
          <code style={{ fontSize: '10px' }}>…/control</code> ist, wird das entfernt.
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
