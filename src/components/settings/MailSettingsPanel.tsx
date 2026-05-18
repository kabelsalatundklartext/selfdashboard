'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MailNavbarToggle, saveMailNavbarEnabled } from '@/components/settings/MailNavbarToggle'
import { dispatchMailConfigChanged } from '@/lib/mail/events'

interface MailAccountPublic {
  id: string
  label: string
  enabled: boolean
  host: string
  port: number
  secure: boolean
  username: string
  hasPassword: boolean
  mailbox: string
  openUrl: string
  verifyTls: boolean
}

interface MailAccountStatus {
  id: string
  label: string
  unread: number
  lastError?: string
}

interface MailStatus {
  unread: number
  lastSyncAt?: string
  lastError?: string
  accounts?: MailAccountStatus[]
}

const inp: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: '8px', padding: '8px 12px',
  fontSize: '13px', outline: 'none', width: '100%',
}

const emptyForm = () => ({
  label: '',
  enabled: true,
  host: '',
  port: 993,
  secure: true,
  username: '',
  password: '',
  mailbox: '*',
  openUrl: '',
  verifyTls: true,
})

export function MailSettingsPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const [navbarEnabled, setNavbarEnabled] = useState(false)
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(120)
  const [accounts, setAccounts] = useState<MailAccountPublic[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [hasPassword, setHasPassword] = useState(false)
  const [status, setStatus] = useState<MailStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const selected = accounts.find(a => a.id === selectedId) ?? accounts[0]

  const applyAccountToForm = (a: MailAccountPublic) => {
    setForm({
      label: a.label,
      enabled: a.enabled,
      host: a.host,
      port: a.port,
      secure: a.secure,
      username: a.username,
      password: '',
      mailbox: a.mailbox || '*',
      openUrl: a.openUrl,
      verifyTls: a.verifyTls,
    })
    setHasPassword(Boolean(a.hasPassword))
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/settings', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json() as {
        navbarEnabled?: boolean
        pollIntervalSeconds?: number
        accounts?: MailAccountPublic[]
        status?: MailStatus
      }
      setNavbarEnabled(Boolean(j.navbarEnabled))
      if (typeof j.pollIntervalSeconds === 'number') setPollIntervalSeconds(j.pollIntervalSeconds)
      const list = j.accounts ?? []
      setAccounts(list)
      if (list.length > 0) {
        const pick = selectedId && list.some(a => a.id === selectedId) ? selectedId : list[0].id
        setSelectedId(pick)
        applyAccountToForm(list.find(a => a.id === pick)!)
      } else {
        setSelectedId(null)
        setForm(emptyForm())
      }
      if (j.status) setStatus(j.status)
    } catch { /* ignore */ }
  }, [selectedId])

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectAccount = (id: string) => {
    const a = accounts.find(x => x.id === id)
    if (!a) return
    setSelectedId(id)
    applyAccountToForm(a)
    setMsg(null)
    setErr(null)
  }

  const accountBody = () => ({
    id: selected?.id,
    label: form.label,
    enabled: form.enabled,
    host: form.host,
    port: form.port,
    secure: form.secure,
    username: form.username,
    mailbox: form.mailbox,
    openUrl: form.openUrl,
    verifyTls: form.verifyTls,
    ...(form.password ? { password: form.password } : {}),
  })

  const save = async () => {
    if (!selected) return
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollIntervalSeconds,
          account: accountBody(),
        }),
      })
      const j = await res.json() as { error?: string; status?: MailStatus; accounts?: MailAccountPublic[] }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      if (j.accounts) setAccounts(j.accounts)
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

  const addAccount = async () => {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            label: de ? `Konto ${accounts.length + 1}` : `Account ${accounts.length + 1}`,
            host: '',
            port: 993,
            secure: true,
            mailbox: '*',
            enabled: true,
          },
        }),
      })
      const j = await res.json() as { error?: string; accounts?: MailAccountPublic[] }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      const list = j.accounts ?? []
      setAccounts(list)
      if (list.length > 0) {
        const neu = list[list.length - 1]
        setSelectedId(neu.id)
        applyAccountToForm(neu)
      }
      setMsg(de ? 'Konto hinzugefügt' : 'Account added')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const deleteAccount = async () => {
    if (!selected || accounts.length === 0) return
    if (!window.confirm(de ? `„${selected.label}" wirklich löschen?` : `Delete "${selected.label}"?`)) return
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAccountId: selected.id }),
      })
      const j = await res.json() as { error?: string; accounts?: MailAccountPublic[]; status?: MailStatus }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      const list = j.accounts ?? []
      setAccounts(list)
      setStatus(j.status ?? null)
      if (list.length > 0) {
        setSelectedId(list[0].id)
        applyAccountToForm(list[0])
      } else {
        setSelectedId(null)
        setForm(emptyForm())
      }
      dispatchMailConfigChanged()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (!selected) return
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.id, ...accountBody() }),
      })
      const j = await res.json() as { error?: string; unread?: number }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setMsg(de ? `„${form.label}" OK — ${j.unread ?? 0} ungelesen` : `"${form.label}" OK — ${j.unread ?? 0} unread`)
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
      const j = await res.json() as MailStatus
      setStatus(j)
      setMsg(de ? 'Aktualisiert' : 'Refreshed')
      dispatchMailConfigChanged()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const accountUnread = (id: string) => status?.accounts?.find(a => a.id === id)?.unread ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {de
          ? 'Mehrere IMAP-Konten möglich — die Navbar zeigt die Summe aller ungelesenen Mails.'
          : 'Multiple IMAP accounts supported — the navbar badge shows the total unread count.'}
      </p>

      <MailNavbarToggle
        locale={locale}
        enabled={navbarEnabled}
        onEnabledChange={async (v) => {
          setNavbarEnabled(v)
          await saveMailNavbarEnabled(v)
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {de ? 'E-Mail-Konten' : 'Email accounts'}
        </label>
        <button type="button" className="btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} disabled={busy} onClick={() => void addAccount()}>
          <Plus size={14} /> {de ? 'Konto' : 'Account'}
        </button>
      </div>

      {accounts.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Noch kein Konto — „Konto“ hinzufügen und IMAP-Daten eintragen.' : 'No account yet — add one and enter IMAP details.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {accounts.map(a => {
            const u = accountUnread(a.id)
            const active = a.id === selected?.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAccount(a.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  background: active ? 'color-mix(in srgb, var(--accent) 18%, var(--surface-2))' : 'var(--surface-2)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: active ? 600 : 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.label || a.username || a.id}
                  {!a.enabled ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({de ? 'aus' : 'off'})</span> : null}
                </span>
                {u > 0 ? (
                  <span style={{
                    flexShrink: 0, minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '10px',
                    background: 'var(--accent)', color: '#fff', fontSize: '11px', fontWeight: 700, lineHeight: '20px', textAlign: 'center',
                  }}>{u > 99 ? '99+' : u}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      )}

      {selected ? (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '14px',
          opacity: navbarEnabled ? 1 : 0.45,
          pointerEvents: navbarEnabled ? 'auto' : 'none',
        }}>
          <input style={inp} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
            placeholder={de ? 'Anzeigename' : 'Display name'} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            {de ? 'Dieses Konto abfragen' : 'Poll this account'}
          </label>

          <input style={inp} value={form.host} onChange={e => setForm({ ...form, host: e.target.value })}
            placeholder={de ? '192.168.1.15' : '192.168.1.15'} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={{ ...inp, flex: 1 }} type="number" value={form.port}
              onChange={e => setForm({ ...form, port: parseInt(e.target.value, 10) || 993 })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} />
              SSL/TLS
            </label>
          </div>

          <input style={inp} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder={de ? 'Benutzername' : 'Username'} autoComplete="username" />
          <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder={hasPassword ? (de ? 'Passwort (leer = unverändert)' : 'Password (blank = unchanged)') : (de ? 'Passwort' : 'Password')}
            autoComplete="new-password" />

          <input style={inp} value={form.mailbox} onChange={e => setForm({ ...form, mailbox: e.target.value })}
            placeholder={de ? '* = alle Ordner' : '* = all folders'} />

          <input style={inp} value={form.openUrl} onChange={e => setForm({ ...form, openUrl: e.target.value })}
            placeholder="http://192.168.1.15:5000/mail/#inbox" />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
            <input type="checkbox" checked={form.verifyTls} onChange={e => setForm({ ...form, verifyTls: e.target.checked })} />
            {de ? 'TLS-Zertifikat prüfen' : 'Verify TLS certificate'}
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" className="btn-accent" disabled={busy} onClick={() => void save()}>
              {de ? 'Speichern' : 'Save'}
            </button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void test()}>
              {de ? 'Testen' : 'Test'}
            </button>
            {accounts.length > 1 ? (
              <button type="button" className="btn-ghost" disabled={busy} onClick={() => void deleteAccount()}
                style={{ color: '#f87171', marginLeft: 'auto' }} title={de ? 'Konto löschen' : 'Delete account'}>
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {de ? 'Abfrage-Intervall (alle Konten)' : 'Poll interval (all accounts)'}
      </label>
      <input style={inp} type="number" min={60} max={3600} value={pollIntervalSeconds}
        onChange={e => setPollIntervalSeconds(parseInt(e.target.value, 10) || 120)} />

      {status ? (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>
            {de ? 'Gesamt ungelesen' : 'Total unread'}: <strong style={{ color: 'var(--text)' }}>{status.unread}</strong>
            {status.lastSyncAt ? (
              <span> · Sync: {new Date(status.lastSyncAt).toLocaleString(de ? 'de-DE' : 'en-US')}</span>
            ) : null}
          </div>
          {status.accounts && status.accounts.length > 1 ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
              {status.accounts.map(a => (
                <li key={a.id} style={{ marginBottom: '4px' }}>
                  {a.label}: <strong style={{ color: 'var(--text)' }}>{a.unread}</strong>
                  {a.lastError ? <span style={{ color: '#f87171' }}> — {a.lastError}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {status.lastError && (!status.accounts || status.accounts.length <= 1) ? (
            <div style={{ color: '#f87171', marginTop: '6px' }}>{status.lastError}</div>
          ) : null}
        </div>
      ) : null}

      {msg ? <div style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</div> : null}
      {err ? <div style={{ fontSize: '12px', color: '#f87171' }}>{err}</div> : null}

      <button type="button" className="btn-ghost" disabled={busy} onClick={() => void syncNow()} style={{ alignSelf: 'flex-start' }}>
        <RefreshCw size={14} /> {de ? 'Alle Konten aktualisieren' : 'Refresh all accounts'}
      </button>
    </div>
  )
}
