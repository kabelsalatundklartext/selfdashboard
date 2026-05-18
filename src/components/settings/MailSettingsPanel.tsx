'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MailNavbarToggle, saveMailNavbarEnabled } from '@/components/settings/MailNavbarToggle'
import { dispatchMailConfigChanged } from '@/lib/mail/events'

interface MailConfigPublic {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  hasPassword: boolean
  mailbox: string
  openUrl: string
  pollIntervalSeconds: number
  verifyTls: boolean
}

interface MailStatus {
  unread: number
  lastSyncAt?: string
  lastError?: string
}

const inp: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: '8px', padding: '8px 12px',
  fontSize: '13px', outline: 'none', width: '100%',
}

export function MailSettingsPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const [form, setForm] = useState({
    enabled: false,
    host: '',
    port: 993,
    secure: true,
    username: '',
    password: '',
    mailbox: 'INBOX',
    openUrl: '',
    pollIntervalSeconds: 120,
    verifyTls: true,
  })
  const [hasPassword, setHasPassword] = useState(false)
  const [status, setStatus] = useState<MailStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/settings', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json() as { config?: MailConfigPublic; status?: MailStatus }
      const c = j.config
      if (c) {
        setForm({
          enabled: c.enabled,
          host: c.host,
          port: c.port,
          secure: c.secure,
          username: c.username,
          password: '',
          mailbox: c.mailbox || 'INBOX',
          openUrl: c.openUrl,
          pollIntervalSeconds: c.pollIntervalSeconds,
          verifyTls: c.verifyTls,
        })
        setHasPassword(Boolean(c.hasPassword))
      }
      if (j.status) setStatus(j.status)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { void load() }, [load])

  const body = () => ({
    enabled: form.enabled,
    host: form.host,
    port: form.port,
    secure: form.secure,
    username: form.username,
    mailbox: form.mailbox,
    openUrl: form.openUrl,
    pollIntervalSeconds: form.pollIntervalSeconds,
    verifyTls: form.verifyTls,
    ...(form.password ? { password: form.password } : {}),
  })

  const save = async () => {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body()),
      })
      const j = await res.json() as { error?: string; status?: MailStatus }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setStatus(j.status ?? null)
      setHasPassword(hasPassword || Boolean(form.password))
      setForm(f => ({ ...f, password: '' }))
      setMsg(de ? 'Gespeichert' : 'Saved')
      dispatchMailConfigChanged()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body()),
      })
      const j = await res.json() as { error?: string; unread?: number }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setMsg(de ? `Verbindung OK — ${j.unread ?? 0} ungelesen` : `Connection OK — ${j.unread ?? 0} unread`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const syncNow = async () => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/mail/status?refresh=1', { cache: 'no-store' })
      const j = await res.json() as { unread?: number; lastError?: string; lastSyncAt?: string }
      setStatus({ unread: j.unread ?? 0, lastError: j.lastError, lastSyncAt: j.lastSyncAt })
      setMsg(de ? 'Aktualisiert' : 'Refreshed')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {de
          ? 'Liest per IMAP nur die Anzahl ungelesener Mails (INBOX). Mails bleiben im Postfach; gelesen markierst du wie gewohnt in Webmail oder am Handy.'
          : 'Uses IMAP to read the unread count (INBOX) only. Messages stay on the server; mark read in webmail or on your phone as usual.'}
      </p>

      {de ? (
        <div style={{
          padding: '12px 14px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.55,
          background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text)' }}>Synology Mail (lokal im LAN)</p>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            <li>DSM → <strong>Mail Server</strong> (oder MailPlus) → Tab <strong>Protokoll</strong> → <strong>IMAP aktivieren</strong> (Port meist <strong>993</strong> mit SSL).</li>
            <li>SelfDashboard und NAS im gleichen Netz (z. B. <code style={{ fontSize: '11px' }}>192.168.1.15</code>).</li>
            <li>Unten eintragen: Host <code style={{ fontSize: '11px' }}>192.168.1.15</code>, Port <strong>993</strong>, SSL an, Benutzer = DSM-Mail-Konto.</li>
            <li>Webmail-Link: <code style={{ fontSize: '11px' }}>http://192.168.1.15:5000/mail/#inbox</code></li>
            <li>Verbindung schlägt fehl? <strong>TLS-Zertifikat prüfen</strong> einmal ausschalten (IP statt Hostname).</li>
          </ol>
        </div>
      ) : (
        <div style={{
          padding: '12px 14px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.55,
          background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)',
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>Synology Mail (local LAN)</p>
          <p style={{ margin: '6px 0 0' }}>Enable IMAP on port 993 in Mail Server → Protocol. Use your NAS LAN IP as host and the DSM mail account. Webmail: <code style={{ fontSize: '11px' }}>http://192.168.1.15:5000/mail/#inbox</code>. Disable TLS verify if using a raw IP.</p>
        </div>
      )}

      <MailNavbarToggle
        locale={locale}
        enabled={form.enabled}
        onEnabledChange={async (v) => {
          setForm(f => ({ ...f, enabled: v }))
          await saveMailNavbarEnabled(v)
        }}
      />

      {!form.enabled ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {de
            ? 'IMAP-Einstellungen bleiben gespeichert. Schalte oben ein, um Symbol und Abfrage zu aktivieren.'
            : 'IMAP settings are kept. Turn on above to show the icon and start polling.'}
        </p>
      ) : null}

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '16px',
        opacity: form.enabled ? 1 : 0.45,
        pointerEvents: form.enabled ? 'auto' : 'none',
      }}>
      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        IMAP {de ? 'Server' : 'server'}
      </label>
      <input style={inp} value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
        placeholder={de ? 'z. B. 192.168.1.15' : 'e.g. 192.168.1.15'} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <input style={{ ...inp, flex: 1 }} type="number" value={form.port}
          onChange={e => setForm({ ...form, port: parseInt(e.target.value, 10) || 993 })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} />
          SSL/TLS
        </label>
      </div>

      <input style={inp} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
        placeholder={de ? 'Benutzername / E-Mail' : 'Username / email'} autoComplete="username" />
      <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
        placeholder={hasPassword ? (de ? 'Passwort (leer = unverändert)' : 'Password (blank = unchanged)') : (de ? 'Passwort' : 'Password')}
        autoComplete="new-password" />

      <input style={inp} value={form.mailbox} onChange={e => setForm({ ...form, mailbox: e.target.value })}
        placeholder={de ? 'Postfach-Ordner' : 'Mailbox folder'} />

      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {de ? 'Webmail-Link (Klick auf Symbol)' : 'Webmail link (icon click)'}
      </label>
      <input style={inp} value={form.openUrl} onChange={e => setForm({ ...form, openUrl: e.target.value })}
        placeholder={de ? 'http://192.168.1.15:5000/mail/#inbox' : 'http://192.168.1.15:5000/mail/#inbox'} />

      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {de ? 'Abfrage-Intervall (Sekunden)' : 'Poll interval (seconds)'}
      </label>
      <input style={inp} type="number" min={60} max={3600} value={form.pollIntervalSeconds}
        onChange={e => setForm({ ...form, pollIntervalSeconds: parseInt(e.target.value, 10) || 120 })} />

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
        <input type="checkbox" checked={form.verifyTls} onChange={e => setForm({ ...form, verifyTls: e.target.checked })} />
        {de ? 'TLS-Zertifikat prüfen' : 'Verify TLS certificate'}
      </label>

      {status && (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          {de ? 'Ungelesen' : 'Unread'}: <strong style={{ color: 'var(--text)' }}>{status.unread}</strong>
          {status.lastSyncAt && (
            <span> · {de ? 'Sync' : 'Sync'}: {new Date(status.lastSyncAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')}</span>
          )}
          {status.lastError && (
            <div style={{ color: '#f87171', marginTop: '6px' }}>{status.lastError}</div>
          )}
        </div>
      )}

      {msg && <div style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</div>}
      {err && <div style={{ fontSize: '12px', color: '#f87171' }}>{err}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button type="button" className="btn-accent" disabled={busy} onClick={() => void save()}>
          {de ? 'Speichern' : 'Save'}
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void test()}>
          {de ? 'Verbindung testen' : 'Test connection'}
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void syncNow()} title={de ? 'Jetzt abfragen' : 'Refresh now'}>
          <RefreshCw size={14} />
        </button>
      </div>
      </div>
    </div>
  )
}
