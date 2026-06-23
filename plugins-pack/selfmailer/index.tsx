'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { usePollingActive } from '@/hooks/usePollingActive'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

const ACCENT = 'var(--accent, #14b8a6)'

type Account = { id: number; label: string; email: string; unseen: number }
type Recent = { account: string; uid: string; from: string; subject: string; date: string; ts: string }
type Summary = { total_unseen: number; accounts: Account[]; recent: Recent[] }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}
function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : 0
}

/** Ruft den serverseitigen Proxy auf (kein Direktzugriff aus dem Browser). */
async function fetchSummary(base: string, token: string): Promise<Summary> {
  const res = await fetch('/api/plugins/selfmailer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base, token, live: false }),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    const err = typeof json.error === 'string' ? json.error : `HTTP ${res.status}`
    throw new Error(err)
  }
  return {
    total_unseen: num(json.total_unseen),
    accounts: Array.isArray(json.accounts) ? (json.accounts as Account[]) : [],
    recent: Array.isArray(json.recent) ? (json.recent as Recent[]) : [],
  }
}

function errorText(code: string, de: boolean): string {
  switch (code) {
    case 'unauthorized':
      return de ? 'Token ungültig — in den Einstellungen prüfen.' : 'Invalid token — check settings.'
    case 'missing_token':
      return de ? 'Token fehlt — in den Einstellungen eintragen.' : 'Token missing — add it in settings.'
    case 'invalid_url':
      return de ? 'Basis-URL ungültig.' : 'Invalid base URL.'
    case 'blocked_url':
      return de ? 'Adresse blockiert (SSRF-Schutz).' : 'Address blocked (SSRF guard).'
    case 'timeout':
      return de ? 'Zeitüberschreitung — SelfMailer erreichbar?' : 'Timed out — is SelfMailer reachable?'
    default:
      return de ? 'SelfMailer nicht erreichbar.' : 'SelfMailer not reachable.'
  }
}

/** Nur den Anzeige-Namen aus "Name <a@b.de>" ziehen (Fallback: Adresse). */
function senderName(from: string): string {
  const m = from.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/)
  if (m && m[1].trim()) return m[1].trim()
  return from.trim()
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

function Widget({ config }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const base = str(config.base)
  const token = str(config.token)
  const showTitle = config.showTitle !== false
  const showRecent = config.showRecent !== false
  const title = config.title === undefined ? 'SelfMailer' : str(config.title)
  const refreshMs = Math.max(60, num(config.refreshSeconds) || 300) * 1000

  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!base || !token) {
      setLoading(false)
      return
    }
    try {
      const s = await fetchSummary(base, token)
      setData(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base, token])

  const { active: pollActive } = usePollingActive()

  useEffect(() => {
    if (!pollActive) return
    void load()
    const t = setInterval(() => void load(), refreshMs)
    return () => clearInterval(t)
  }, [pollActive, load, refreshMs])

  const shell: CSSProperties = {
    height: '100%',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '10px 12px 12px',
    containerType: 'size',
    overflowY: 'auto',
    overflowX: 'hidden',
  }
  const centered: CSSProperties = {
    ...shell,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  }

  if (!base || !token) {
    return (
      <div style={centered}>
        <span style={{ fontSize: 28 }}>📬</span>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
          {de
            ? 'SelfMailer-Basis-URL und Token in den Einstellungen eintragen.'
            : 'Add SelfMailer base URL and token in settings.'}
        </p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div style={shell}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[60, 80, 50, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 4 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div style={centered}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8, wordBreak: 'break-word' }}>
          {errorText(error, de)}
        </p>
      </div>
    )
  }

  const summary = data ?? { total_unseen: 0, accounts: [], recent: [] }
  const active = summary.accounts.filter((a) => a.unseen > 0)

  return (
    <div style={shell}>
      {showTitle ? (
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(9px, 2.4cqmin, 10px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {title}
        </p>
      ) : null}

      {/* Gesamtzahl — der Blickfang */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 'clamp(28px, 14cqmin, 52px)',
            fontWeight: 800,
            lineHeight: 1,
            color: summary.total_unseen > 0 ? ACCENT : 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {summary.total_unseen}
        </span>
        <span style={{ fontSize: 'clamp(10px, 3cqmin, 13px)', color: 'var(--text-muted)' }}>
          {de ? 'ungelesen' : 'unread'}
        </span>
      </div>

      {/* Konten mit Ungelesen */}
      {active.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showRecent ? 12 : 0 }}>
          {active.map((a) => (
            <span
              key={a.id}
              title={a.email}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 'clamp(10px, 2.8cqmin, 12px)',
                color: 'var(--text)',
                maxWidth: '100%',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</span>
              <span style={{ fontWeight: 700, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{a.unseen}</span>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 'clamp(11px, 3cqmin, 13px)', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Keine ungelesenen Mails. 🎉' : 'No unread mail. 🎉'}
        </p>
      )}

      {/* Neueste ungelesene Mails — quer über alle Postfächer */}
      {showRecent && summary.recent.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {summary.recent.map((m, i) => (
            <li
              key={`${m.account}-${m.uid}-${i}`}
              title={`${m.account} · ${m.from}\n${m.subject}\n${m.date}`}
              style={{
                padding: i < summary.recent.length - 1 ? '6px 0' : '6px 0 0',
                borderBottom: i < summary.recent.length - 1 ? '1px solid var(--border)' : 'none',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  fontSize: 'clamp(10px, 2.8cqmin, 12px)',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--text)',
                    flexShrink: 0,
                    maxWidth: '42%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {senderName(m.from) || m.account}
                </span>
                <span
                  style={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-muted)',
                  }}
                >
                  {m.subject || (de ? '(kein Betreff)' : '(no subject)')}
                </span>
              </div>
              <div style={{ fontSize: 'clamp(8px, 2.2cqmin, 10px)', color: 'var(--text-muted)', opacity: 0.75 }}>
                {m.account}
              </div>
            </li>
          ))}
        </ul>
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
  outline: 'none',
}
const lbl: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 4,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const test = useCallback(async () => {
    setTesting(true)
    setResult(null)
    try {
      const s = await fetchSummary(str(config.base), str(config.token))
      setResult(
        de
          ? `✅ OK — ${s.total_unseen} ungelesen über ${s.accounts.length} Konto(en).`
          : `✅ OK — ${s.total_unseen} unread across ${s.accounts.length} account(s).`,
      )
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e)
      setResult(`⚠️ ${errorText(code, de)}`)
    } finally {
      setTesting(false)
    }
  }, [config.base, config.token, de])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>{de ? 'SelfMailer Basis-URL' : 'SelfMailer base URL'}</label>
        <input
          style={inp}
          value={str(config.base)}
          onChange={(e) => onChange('base', e.target.value)}
          placeholder="http://192.168.1.10:8090"
        />
      </div>

      <div>
        <label style={lbl}>Token</label>
        <input
          style={inp}
          type="password"
          value={str(config.token)}
          onChange={(e) => onChange('token', e.target.value)}
          placeholder={de ? 'Feed-/Dashboard-Token aus SelfMailer' : 'Feed/dashboard token from SelfMailer'}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'SelfMailer → Einstellungen → Feeds/Export: dort den persönlichen Token kopieren.'
            : 'SelfMailer → Settings → Feeds/Export: copy your personal token.'}
        </p>
      </div>

      <div>
        <label style={lbl}>{de ? 'Aktualisierung (Sek.)' : 'Refresh (sec.)'}</label>
        <input
          style={inp}
          type="number"
          min={60}
          max={3600}
          value={num(config.refreshSeconds) || 300}
          onChange={(e) => onChange('refreshSeconds', Math.max(60, num(e.target.value) || 300))}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
          {de
            ? 'Jeder Abruf löst auf der SelfMailer-Seite einen kurzen INBOX-Sync je Konto aus — nicht zu niedrig wählen.'
            : 'Each refresh triggers a short INBOX sync per account on SelfMailer — do not set too low.'}
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.showTitle !== false} onChange={(e) => onChange('showTitle', e.target.checked)} />
        {de ? 'Titel oben anzeigen' : 'Show title at top'}
      </label>
      <input
        style={{ ...inp, opacity: config.showTitle !== false ? 1 : 0.5 }}
        disabled={config.showTitle === false}
        value={config.title === undefined ? 'SelfMailer' : str(config.title)}
        placeholder="SelfMailer"
        onChange={(e) => onChange('title', e.target.value)}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.showRecent !== false} onChange={(e) => onChange('showRecent', e.target.checked)} />
        {de ? 'Neueste Mails anzeigen' : 'Show recent mail'}
      </label>

      <button
        type="button"
        onClick={() => void test()}
        disabled={testing}
        style={{ ...inp, cursor: 'pointer', background: ACCENT, color: '#04201c', fontWeight: 700, borderColor: ACCENT }}
      >
        {testing ? (de ? 'Teste…' : 'Testing…') : de ? 'Verbindung testen' : 'Test connection'}
      </button>
      {result ? <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{result}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const meta: PluginMeta = {
  id: 'selfmailer',
  name: 'SelfMailer',
  description:
    'Ungelesene Mails über ALLE SelfMailer-Postfächer gebündelt: Gesamtzahl, je Konto und die neuesten Mails. Quelle: SelfMailer-Server (Basis-URL + Token).',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '📬',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  configSchema: [
    { key: 'base', label: 'SelfMailer Basis-URL', type: 'text', defaultValue: '' },
    { key: 'token', label: 'Token', type: 'text', defaultValue: '' },
    { key: 'refreshSeconds', label: 'Aktualisierung (Sek.)', type: 'number', defaultValue: 300 },
    { key: 'showTitle', label: 'Titel anzeigen', type: 'boolean', defaultValue: true },
    { key: 'title', label: 'Widget-Titel', type: 'text', defaultValue: 'SelfMailer' },
    { key: 'showRecent', label: 'Neueste Mails anzeigen', type: 'boolean', defaultValue: true },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
