'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MailNavbarToggle, saveMailNavbarEnabled } from '@/components/settings/MailNavbarToggle'
import { dispatchMailConfigChanged } from '@/lib/mail/events'
import {
  clampPollIntervalSeconds,
  clampUnreadMaxAgeDays,
  MAIL_POLL_INTERVAL_DEFAULT,
  MAIL_POLL_INTERVAL_MAX,
  MAIL_POLL_INTERVAL_MIN,
  MAIL_UNREAD_MAX_AGE_DEFAULT,
  MAIL_UNREAD_MAX_AGE_MAX_DAYS,
  MAIL_UNREAD_MAX_AGE_MAX_YEARS,
  formatUnreadMaxAgeSummary,
  unreadMaxAgeDaysToInput,
  unreadMaxAgeInputToDays,
  type UnreadMaxAgeUnit,
  type MailAccountPublic,
  type MailAggregateStatus,
  type MailUnreadPreviewMessage,
  formatMailFolderLabel,
} from '@/lib/mail/types'
import { reportPluginError } from '@/lib/pluginLog'

type MailStatus = MailAggregateStatus

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

export function MailSettingsPanel({
  locale,
  onOpenProtocol,
}: {
  locale: Locale
  onOpenProtocol?: () => void
}) {
  const de = locale === 'de'
  const [navbarEnabled, setNavbarEnabled] = useState(false)
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(MAIL_POLL_INTERVAL_DEFAULT)
  const [pollDraft, setPollDraft] = useState(String(MAIL_POLL_INTERVAL_DEFAULT))
  const [unreadMaxAgeDays, setUnreadMaxAgeDays] = useState(MAIL_UNREAD_MAX_AGE_DEFAULT)
  const [unreadMaxAgeUnit, setUnreadMaxAgeUnit] = useState<UnreadMaxAgeUnit>('days')
  const [unreadMaxAgeDraft, setUnreadMaxAgeDraft] = useState(String(MAIL_UNREAD_MAX_AGE_DEFAULT))
  const [accounts, setAccounts] = useState<MailAccountPublic[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [hasPassword, setHasPassword] = useState(false)
  const [status, setStatus] = useState<MailStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewMessages, setPreviewMessages] = useState<MailUnreadPreviewMessage[]>([])
  const [previewTruncated, setPreviewTruncated] = useState(false)
  const [previewSkippedStale, setPreviewSkippedStale] = useState(0)
  const [previewSkippedDuplicate, setPreviewSkippedDuplicate] = useState(0)
  const [previewMaxAgeDays, setPreviewMaxAgeDays] = useState(30)

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
      const res = await fetch('/api/plugins/mail/settings', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json() as {
        navbarEnabled?: boolean
        pollIntervalSeconds?: number
        unreadMaxAgeDays?: number
        accounts?: MailAccountPublic[]
        status?: MailStatus
      }
      setNavbarEnabled(Boolean(j.navbarEnabled))
      if (typeof j.pollIntervalSeconds === 'number') {
        const sec = clampPollIntervalSeconds(j.pollIntervalSeconds)
        setPollIntervalSeconds(sec)
        setPollDraft(String(sec))
      }
      if (typeof j.unreadMaxAgeDays === 'number') {
        const days = clampUnreadMaxAgeDays(j.unreadMaxAgeDays)
        setUnreadMaxAgeDays(days)
        const unit: UnreadMaxAgeUnit =
          days >= 365 && days % 365 === 0 ? 'years' : 'days'
        setUnreadMaxAgeUnit(unit)
        setUnreadMaxAgeDraft(String(unreadMaxAgeDaysToInput(days, unit)))
      }
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

  /** Liest den vom Server-Scheduler aktualisierten Cache (kein zusätzliches IMAP pro Tick) */
  const refreshStatusFromCache = useCallback(async () => {
    try {
      const res = await fetch('/api/plugins/mail/status', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json() as MailStatus & { pollIntervalSeconds?: number }
      setStatus({
        unread: j.unread ?? 0,
        lastSyncAt: j.lastSyncAt,
        lastError: j.lastError,
        accounts: j.accounts ?? [],
      })
      // Intervall nur über load() / „Intervall speichern“ — nicht aus Status-Polling,
      // sonst springt das Feld zurück auf den alten Serverwert (z. B. 120) während der Eingabe.
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!navbarEnabled) return
    const ms = clampPollIntervalSeconds(pollIntervalSeconds) * 1000
    void refreshStatusFromCache()
    const id = window.setInterval(() => void refreshStatusFromCache(), ms)
    return () => window.clearInterval(id)
  }, [navbarEnabled, pollIntervalSeconds, refreshStatusFromCache])

  const selectAccount = (id: string) => {
    const a = accounts.find(x => x.id === id)
    if (!a) return
    setSelectedId(id)
    applyAccountToForm(a)
    setMsg(null)
    setErr(null)
  }

  const resolvePollInterval = () => {
    const parsed = parseInt(pollDraft.trim(), 10)
    return clampPollIntervalSeconds(Number.isFinite(parsed) ? parsed : pollIntervalSeconds)
  }

  const syncUnreadMaxAgeDraft = (days: number, unit: UnreadMaxAgeUnit = unreadMaxAgeUnit) => {
    setUnreadMaxAgeDays(days)
    setUnreadMaxAgeDraft(String(unreadMaxAgeDaysToInput(days, unit)))
  }

  const resolveUnreadMaxAge = () => {
    const parsed = parseInt(unreadMaxAgeDraft.trim(), 10)
    if (!Number.isFinite(parsed)) return unreadMaxAgeDays
    return unreadMaxAgeInputToDays(parsed, unreadMaxAgeUnit)
  }

  const applyUnreadMaxAgePreset = (days: number) => {
    const unit: UnreadMaxAgeUnit =
      days >= 365 && days % 365 === 0 ? 'years' : 'days'
    setUnreadMaxAgeUnit(unit)
    syncUnreadMaxAgeDraft(days, unit)
  }

  const savePollInterval = async () => {
    const sec = resolvePollInterval()
    setPollIntervalSeconds(sec)
    setPollDraft(String(sec))
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollIntervalSeconds: sec }),
      })
      const j = await res.json() as {
        error?: string
        pollIntervalSeconds?: number
        status?: MailStatus
        accounts?: MailAccountPublic[]
      }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      if (typeof j.pollIntervalSeconds === 'number') {
        const saved = clampPollIntervalSeconds(j.pollIntervalSeconds)
        setPollIntervalSeconds(saved)
        setPollDraft(String(saved))
      }
      if (j.status) setStatus(j.status)
      if (j.accounts) setAccounts(j.accounts)
      setMsg(de ? `Intervall gespeichert (${sec} s)` : `Interval saved (${sec} s)`)
      dispatchMailConfigChanged({
        unread: j.status?.unread,
        pollIntervalSeconds: sec,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const saveUnreadMaxAge = async () => {
    const days = resolveUnreadMaxAge()
    syncUnreadMaxAgeDraft(days)
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unreadMaxAgeDays: days }),
      })
      const j = await res.json() as {
        error?: string
        unreadMaxAgeDays?: number
        status?: MailStatus
        accounts?: MailAccountPublic[]
      }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      if (typeof j.unreadMaxAgeDays === 'number') {
        const saved = clampUnreadMaxAgeDays(j.unreadMaxAgeDays)
        const unit: UnreadMaxAgeUnit =
          saved >= 365 && saved % 365 === 0 ? 'years' : 'days'
        setUnreadMaxAgeUnit(unit)
        syncUnreadMaxAgeDraft(saved, unit)
      }
      if (j.status) setStatus(j.status)
      if (j.accounts) setAccounts(j.accounts)
      setMsg(
        days === 0
          ? (de ? 'Altersfilter aus — alle IMAP-Ungelesen zählen' : 'Age filter off — all IMAP unread counted')
          : (de
            ? `Altersfilter gespeichert (${formatUnreadMaxAgeSummary(days, true)})`
            : `Age filter saved (${formatUnreadMaxAgeSummary(days, false)})`),
      )
      dispatchMailConfigChanged({
        unread: j.status?.unread,
        forceRefresh: true,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
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
      const res = await fetch('/api/plugins/mail/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollIntervalSeconds: resolvePollInterval(),
          account: accountBody(),
        }),
      })
      const j = await res.json() as {
        error?: string
        status?: MailStatus
        accounts?: MailAccountPublic[]
        pollIntervalSeconds?: number
      }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      if (j.accounts) setAccounts(j.accounts)
      setStatus(j.status ?? null)
      if (typeof j.pollIntervalSeconds === 'number') {
        const saved = clampPollIntervalSeconds(j.pollIntervalSeconds)
        setPollIntervalSeconds(saved)
        setPollDraft(String(saved))
      }
      setHasPassword(hasPassword || Boolean(form.password))
      setForm(f => ({ ...f, password: '' }))
      setMsg(de ? 'Gespeichert' : 'Saved')
      dispatchMailConfigChanged({
        openUrl: form.openUrl.trim() || null,
        unread: j.status?.unread,
        forceRefresh: true,
      })
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setErr(m)
      reportPluginError('mail', m, { category: 'settings/save' })
    } finally {
      setBusy(false)
    }
  }

  const addAccount = async () => {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/settings', {
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
      const res = await fetch('/api/plugins/mail/settings', {
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
      dispatchMailConfigChanged({ openUrl: form.openUrl.trim() || null })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const showUnreadPreview = async () => {
    if (!selected) return
    setPreviewBusy(true)
    setPreviewErr(null)
    try {
      const res = await fetch('/api/plugins/mail/unread-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.id, ...accountBody() }),
      })
      const j = await res.json() as {
        ok?: boolean
        error?: string
        total?: number
        messages?: MailUnreadPreviewMessage[]
        truncated?: boolean
        skippedStale?: number
        skippedDuplicate?: number
        maxUnreadAgeDays?: number
      }
      if (!res.ok || !j.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      setPreviewTotal(j.total ?? 0)
      setPreviewMessages(j.messages ?? [])
      setPreviewTruncated(Boolean(j.truncated))
      setPreviewSkippedStale(j.skippedStale ?? 0)
      setPreviewSkippedDuplicate(j.skippedDuplicate ?? 0)
      setPreviewMaxAgeDays(j.maxUnreadAgeDays ?? 30)
      setPreviewOpen(true)
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setPreviewErr(m)
      reportPluginError('mail', m, { category: 'settings/unread-preview' })
    } finally {
      setPreviewBusy(false)
    }
  }

  const markAllReadOnServer = async () => {
    if (!selected) return
    const label = form.label || selected.label || selected.username
    const scope =
      form.mailbox.trim() === '*' || !form.mailbox.trim()
        ? (de ? 'alle IMAP-Ordner dieses Kontos (ohne Papierkorb)' : 'all IMAP folders for this account (except trash)')
        : (de ? `Ordner „${form.mailbox.trim()}“ inkl. Unterordner` : `mailbox “${form.mailbox.trim()}” including subfolders`)

    const step1 = window.confirm(
      de
        ? `Alle per IMAP als ungelesen gemeldeten Mails für „${label}“ als GELESEN markieren?\n\nBereich: ${scope}\n\nMailPlus/Thunderbird zeigen sie oft nicht — SelfDashboard setzt dann serverseitig das Gelesen-Flag.`
        : `Mark all IMAP-reported unread mail for “${label}” as READ?\n\nScope: ${scope}\n\nMailPlus/Thunderbird may not list them — SelfDashboard will set the Seen flag on the server.`,
    )
    if (!step1) return

    const step2 = window.confirm(
      de
        ? `Letzte Bestätigung: wirklich ALLE ungelesenen Mails in diesem Bereich als gelesen markieren?\n\nDas kann nicht rückgängig gemacht werden (außer du markierst sie in einem Mail-Programm wieder als ungelesen).`
        : `Final confirmation: mark ALL unread messages in this scope as read?\n\nThis cannot be undone from SelfDashboard (you would need to mark them unread again in a mail client).`,
    )
    if (!step2) return

    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.id, ...accountBody() }),
      })
      const j = await res.json() as {
        ok?: boolean
        error?: string
        marked?: number
        folders?: { path: string; marked: number }[]
        status?: MailStatus
      }
      if (!res.ok || !j.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      if (j.status) setStatus(j.status)
      const n = j.marked ?? 0
      const detail =
        j.folders && j.folders.length > 0
          ? j.folders.map(f => `${formatMailFolderLabel(f.path)}: ${f.marked}`).join(', ')
          : ''
      setMsg(
        de
          ? `${n} Nachricht(en) auf dem Server als gelesen markiert${detail ? ` (${detail})` : ''}.`
          : `${n} message(s) marked read on the server${detail ? ` (${detail})` : ''}.`,
      )
      dispatchMailConfigChanged({
        unread: j.status?.unread ?? 0,
        forceRefresh: true,
      })
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setErr(m)
      reportPluginError('mail', m, { category: 'settings/mark-all-read' })
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (!selected) return
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.id, ...accountBody() }),
      })
      const j = await res.json() as {
        error?: string
        unread?: number
        folders?: { path: string; unread: number }[]
        mode?: string
        status?: MailStatus
        navbarUpdated?: boolean
        openUrl?: string | null
      }
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
      const unread = j.unread ?? 0
      if (j.status) setStatus(j.status)
      const withMail = (j.folders ?? []).filter(f => f.unread > 0)
      const hint =
        j.mode === 'all-except-trash'
          ? (de ? ' (alle Ordner, ohne Papierkorb)' : ' (all folders, except trash)')
          : j.mode === 'synology-accounts' || j.mode === 'accounts'
            ? (de ? ' (nur MailPlus-Konten)' : ' (MailPlus accounts only)')
            : ''
      if (!j.status) {
        setStatus({
          unread,
          accounts: [{ id: selected.id, label: form.label || selected.label, unread }],
          lastSyncAt: new Date().toISOString(),
        })
      }
      const navbarHint = !navbarEnabled
        ? (de ? ' Navbar-Symbol ist aus — oben einschalten.' : ' Navbar icon is off — enable it above.')
        : j.navbarUpdated
          ? (de ? ' Navbar wurde aktualisiert.' : ' Navbar updated.')
          : (de ? ' „Speichern“ für dauerhafte Navbar-Daten.' : ' Use “Save” for persistent navbar data.')
      if (navbarEnabled && j.navbarUpdated) {
        dispatchMailConfigChanged({
          openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
          unread: j.status?.unread ?? unread,
          forceRefresh: true,
        })
      }
      setMsg(
        de
          ? `„${form.label}" OK — ${unread} ungelesen${hint}${withMail.length ? ` · ${withMail.map(f => `${f.path.split('/').pop()}: ${f.unread}`).join(', ')}` : ''}.${navbarHint}`
          : `"${form.label}" OK — ${unread} unread${hint}${withMail.length ? ` · ${withMail.map(f => `${f.path.split('/').pop()}: ${f.unread}`).join(', ')}` : ''}.${navbarHint}`,
      )
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setErr(m)
      reportPluginError('mail', m, { category: 'settings/test' })
    } finally {
      setBusy(false)
    }
  }

  const syncNow = async () => {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/plugins/mail/status?refresh=1', { cache: 'no-store' })
      const j = await res.json() as MailStatus & { openUrl?: string | null }
      setStatus(j)
      await load()
      setMsg(de ? 'Aktualisiert' : 'Refreshed')
      dispatchMailConfigChanged({
        openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
        unread: j.unread,
        forceRefresh: true,
      })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const resetMailCache = async () => {
    const ok = window.confirm(
      de
        ? 'Gespeicherte Ungelesen-Zähler in SelfDashboard löschen und sofort neu per IMAP abfragen?\n\nHinweis: E-Mails auf Synology werden nicht gelöscht. Wenn danach noch „Geister“-Mails erscheinen, liegen sie noch als UNSEEN auf dem Mail-Server (MailPlus zeigt sie oft nicht).'
        : 'Clear stored unread counts in SelfDashboard and query IMAP again now?\n\nNote: Mail on Synology is not deleted. If ghost messages still appear, they remain UNSEEN on the mail server (MailPlus often hides them).',
    )
    if (!ok) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/plugins/mail/reset-cache', { method: 'POST', cache: 'no-store' })
      const j = await res.json() as MailStatus & { ok?: boolean; error?: string; openUrl?: string | null }
      if (!res.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${res.status}`)
      setStatus({
        unread: j.unread ?? 0,
        lastSyncAt: j.lastSyncAt,
        lastError: j.lastError,
        accounts: j.accounts ?? [],
      })
      await load()
      setMsg(
        de
          ? `Cache geleert — neu gezählt: ${j.unread ?? 0} ungelesen`
          : `Cache cleared — recount: ${j.unread ?? 0} unread`,
      )
      dispatchMailConfigChanged({
        openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
        unread: j.unread,
        forceRefresh: true,
      })
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

          <label
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
              color: !form.enabled ? '#fbbf24' : 'var(--text)',
              padding: !form.enabled ? '8px 10px' : undefined,
              borderRadius: !form.enabled ? '8px' : undefined,
              background: !form.enabled ? 'color-mix(in srgb, #fbbf24 12%, transparent)' : undefined,
              border: !form.enabled ? '1px solid color-mix(in srgb, #fbbf24 35%, var(--border))' : undefined,
            }}
          >
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
            {de ? 'Dieses Konto abfragen' : 'Poll this account'}
            {!form.enabled ? (
              <span style={{ fontSize: '11px', color: '#fbbf24' }}>
                {de ? '(aus — Navbar zählt dieses Konto nicht)' : '(off — excluded from navbar poll)'}
              </span>
            ) : null}
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
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-8px 0 4px', lineHeight: 1.45 }}>
            {de
              ? '„*“ = alle IMAP-Ordner mit ungelesenen Mails, nur Papierkorb wird ausgelassen (inkl. Gesendet, Unterordner, …). Optional nur MailPlus-Konten: @accounts'
              : '“*” = all IMAP folders with unread mail, trash excluded only. MailPlus sidebar only: @accounts'}
          </p>

          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            {de ? 'Webmail-URL (Klick in Navbar)' : 'Webmail URL (navbar click)'}
          </label>
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
            <button
              type="button"
              className="btn-ghost"
              disabled={busy || previewBusy}
              onClick={() => void showUnreadPreview()}
              title={de ? 'Betreffzeilen der gezählten ungelesenen Mails' : 'Subjects of counted unread mail'}
            >
              {previewBusy ? (de ? 'Lade…' : 'Loading…') : (de ? 'Ungelesen anzeigen' : 'Show unread')}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => void markAllReadOnServer()}
              style={{ color: '#fbbf24' }}
              title={de ? 'IMAP: alle UNSEEN als gelesen markieren (2× bestätigen)' : 'IMAP: mark all UNSEEN as read (double confirm)'}
            >
              {de ? 'Alles als gelesen (IMAP)' : 'Mark all read (IMAP)'}
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <input
          style={{ ...inp, flex: '1 1 120px', minWidth: '80px' }}
          type="number"
          min={MAIL_POLL_INTERVAL_MIN}
          max={MAIL_POLL_INTERVAL_MAX}
          step={1}
          value={pollDraft}
          onChange={e => setPollDraft(e.target.value)}
          onBlur={() => {
            const n = resolvePollInterval()
            setPollIntervalSeconds(n)
            setPollDraft(String(n))
          }}
        />
        <button type="button" className="btn-ghost" style={{ fontSize: '12px' }} disabled={busy} onClick={() => void savePollInterval()}>
          {de ? 'Intervall speichern' : 'Save interval'}
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-8px 0 0', lineHeight: 1.45 }}>
        {de
          ? `${MAIL_POLL_INTERVAL_MIN}–${MAIL_POLL_INTERVAL_MAX} s (Standard ${MAIL_POLL_INTERVAL_DEFAULT}). Server synct per IMAP im Hintergrund; Anzeige liest den Cache. „Alle Konten aktualisieren“ = sofort neuer IMAP-Lauf.`
          : `${MAIL_POLL_INTERVAL_MIN}–${MAIL_POLL_INTERVAL_MAX} s (default ${MAIL_POLL_INTERVAL_DEFAULT}). Server syncs via IMAP in the background; UI reads cache. “Refresh all accounts” forces IMAP now.`}
      </p>

      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '4px' }}>
        {de ? 'Altersfilter ungelesen (alle Konten)' : 'Unread age filter (all accounts)'}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {([
          { id: 'off', label: de ? 'Aus' : 'Off', days: 0 },
          { id: '30d', label: '30', days: 30 },
          { id: '1y', label: de ? '1 Jahr' : '1 year', days: 365 },
          { id: 'max', label: 'Max', days: MAIL_UNREAD_MAX_AGE_MAX_DAYS },
        ] as const).map(p => (
          <button
            key={p.id}
            type="button"
            className="btn-ghost"
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderColor: unreadMaxAgeDays === p.days ? 'var(--accent)' : undefined,
              color: unreadMaxAgeDays === p.days ? 'var(--accent)' : undefined,
            }}
            disabled={busy}
            onClick={() => applyUnreadMaxAgePreset(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <input
          style={{ ...inp, flex: '1 1 100px', minWidth: '72px', maxWidth: '120px' }}
          type="number"
          min={1}
          max={unreadMaxAgeUnit === 'years' ? MAIL_UNREAD_MAX_AGE_MAX_YEARS : MAIL_UNREAD_MAX_AGE_MAX_DAYS}
          step={1}
          value={unreadMaxAgeDraft}
          disabled={unreadMaxAgeDays === 0}
          onChange={e => setUnreadMaxAgeDraft(e.target.value)}
          onBlur={() => syncUnreadMaxAgeDraft(resolveUnreadMaxAge())}
        />
        <select
          style={{ ...inp, flex: '0 0 auto', width: 'auto', minWidth: '88px' }}
          value={unreadMaxAgeUnit}
          disabled={unreadMaxAgeDays === 0}
          onChange={e => {
            const unit = e.target.value as UnreadMaxAgeUnit
            const parsed = parseInt(unreadMaxAgeDraft.trim(), 10)
            const days =
              unreadMaxAgeDays > 0
                ? unreadMaxAgeDays
                : Number.isFinite(parsed)
                  ? unreadMaxAgeInputToDays(parsed, unit)
                  : MAIL_UNREAD_MAX_AGE_DEFAULT
            setUnreadMaxAgeUnit(unit)
            syncUnreadMaxAgeDraft(days > 0 ? days : MAIL_UNREAD_MAX_AGE_DEFAULT, unit)
          }}
        >
          <option value="days">{de ? 'Tage' : 'Days'}</option>
          <option value="years">{de ? 'Jahre' : 'Years'}</option>
        </select>
        <button type="button" className="btn-ghost" style={{ fontSize: '12px' }} disabled={busy} onClick={() => void saveUnreadMaxAge()}>
          {de ? 'Altersfilter speichern' : 'Save age filter'}
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-8px 0 0', lineHeight: 1.45 }}>
        {de
          ? `Ungelesen älter als der Wert wird ignoriert (Standard ${MAIL_UNREAD_MAX_AGE_DEFAULT} Tage). Aus = alle IMAP-UNSEEN. Max = ${MAIL_UNREAD_MAX_AGE_MAX_YEARS} Jahre. Eingabe in Tagen oder Jahren (bis ${MAIL_UNREAD_MAX_AGE_MAX_DAYS} Tage).`
          : `Unread older than the value is ignored (default ${MAIL_UNREAD_MAX_AGE_DEFAULT} days). Off = all IMAP UNSEEN. Max = ${MAIL_UNREAD_MAX_AGE_MAX_YEARS} years. Enter days or years (up to ${MAIL_UNREAD_MAX_AGE_MAX_DAYS} days).`}
      </p>

      {status ? (
        <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>
            {de ? 'Gesamt ungelesen' : 'Total unread'}: <strong style={{ color: 'var(--text)' }}>{status.unread}</strong>
            {status.lastSyncAt ? (
              <span> · Sync: {new Date(status.lastSyncAt).toLocaleString(de ? 'de-DE' : 'en-US')}</span>
            ) : null}
          </div>
          {status.accounts && status.accounts.length > 0 ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: '18px' }}>
              {status.accounts.map(a => (
                <li key={a.id} style={{ marginBottom: '6px' }}>
                  {a.label}: <strong style={{ color: 'var(--text)' }}>{a.unread}</strong>
                  {a.lastError ? <span style={{ color: '#f87171' }}> — {a.lastError}</span> : null}
                  {a.unread > 0 && a.unreadFolders?.length ? (
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '11px' }}>
                      {a.unreadFolders.map(f => (
                        <li key={f.path}>
                          {formatMailFolderLabel(f.path)}: <strong style={{ color: 'var(--text)' }}>{f.unread}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
            {de
              ? 'Protokoll: Einstellungen → Protokoll, Filter „mail“. Nach Container-Neustart Passwort erneut speichern (Verschlüsselungsschlüssel).'
              : 'Logs: Settings → Logs, filter “mail”. Re-save password after container restart (encryption key).'}
          </p>
          {status.lastError && status.unread > 0 ? (
            <p style={{ fontSize: '11px', color: '#fbbf24', margin: '6px 0 0', lineHeight: 1.45 }}>
              {de
                ? 'Die Zahl oben kann ein älterer Stand sein, solange die Abfrage blockiert ist.'
                : 'The count above may be stale while polling is blocked.'}
            </p>
          ) : null}
          {status.lastError ? (
            <div style={{ color: '#f87171', marginTop: '6px' }}>{status.lastError}</div>
          ) : null}
          {(status.lastError || err) && onOpenProtocol ? (
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: '10px', fontSize: '12px', width: '100%' }}
              onClick={onOpenProtocol}
            >
              {de ? 'Fehler im Protokoll (mail)' : 'Open log (mail)'}
            </button>
          ) : null}
        </div>
      ) : null}

      {msg ? <div style={{ fontSize: '12px', color: '#4ade80' }}>{msg}</div> : null}
      {err ? (
        <div style={{ fontSize: '12px', color: '#f87171' }}>
          {err}
          {onOpenProtocol ? (
            <button type="button" className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }} onClick={onOpenProtocol}>
              {de ? 'Im Protokoll anzeigen' : 'Show in log'}
            </button>
          ) : null}
        </div>
      ) : null}

      {previewErr ? <div style={{ fontSize: '12px', color: '#f87171' }}>{previewErr}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void syncNow()}>
          <RefreshCw size={14} /> {de ? 'Alle Konten aktualisieren' : 'Refresh all accounts'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => void resetMailCache()}
          title={de ? 'Nur SelfDashboard-Zähler in mail.json leeren, dann IMAP' : 'Clear SelfDashboard counters in mail.json, then IMAP'}
        >
          {de ? 'Mail-Cache leeren' : 'Clear mail cache'}
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        {de
          ? 'SelfDashboard speichert keine E-Mails — nur Zähler in mail.json. „Cache leeren“ = Zähler zurücksetzen + frischer IMAP-Lauf. Hilft bei veraltetem Badge, nicht wenn Synology/IMAP die Mail noch als UNSEEN führt (dann MailPlus-Suche im richtigen Konto, z. B. Web Mail SSchmidt).'
          : 'SelfDashboard does not store emails — only counters in mail.json. “Clear cache” resets counts + fresh IMAP. Helps stale badges, not when Synology/IMAP still reports UNSEEN (search the correct account in MailPlus, e.g. Web Mail SSchmidt).'}
      </p>

      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setPreviewOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10050,
            background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div style={{
            width: 'min(560px, 100%)', maxHeight: 'min(80vh, 640px)',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                {de ? 'Ungelesene Mails (IMAP)' : 'Unread mail (IMAP)'}
              </div>
              <button type="button" className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => setPreviewOpen(false)}>
                {de ? 'Schließen' : 'Close'}
              </button>
            </div>
            <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              {de ? 'Gezählt' : 'Counted'}: <strong style={{ color: 'var(--text)' }}>{previewTotal}</strong>
              {' · '}
              {de ? 'Aufgelistet' : 'Listed'}: <strong style={{ color: 'var(--text)' }}>{previewMessages.length}</strong>
              {previewTruncated ? (
                <span style={{ color: '#fbbf24' }}> · {de ? 'Liste gekürzt' : 'List truncated'}</span>
              ) : null}
              {(previewSkippedStale > 0 || previewSkippedDuplicate > 0) ? (
                <span style={{ color: '#fbbf24' }}>
                  {previewSkippedStale > 0
                    ? (de
                      ? ` · ${previewSkippedStale} älter als ${formatUnreadMaxAgeSummary(previewMaxAgeDays, true)} ignoriert`
                      : ` · ${previewSkippedStale} older than ${formatUnreadMaxAgeSummary(previewMaxAgeDays, false)} ignored`)
                    : ''}
                  {previewSkippedDuplicate > 0
                    ? (de
                      ? ` · ${previewSkippedDuplicate} Duplikat(e) ignoriert`
                      : ` · ${previewSkippedDuplicate} duplicate(s) ignored`)
                    : ''}
                </span>
              ) : null}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {previewMessages.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {de ? 'Keine ungelesenen Nachrichten per IMAP-SEARCH.' : 'No unread messages via IMAP SEARCH.'}
                </p>
              ) : (
                (() => {
                  const byFolder = new Map<string, MailUnreadPreviewMessage[]>()
                  for (const m of previewMessages) {
                    const list = byFolder.get(m.folder) ?? []
                    list.push(m)
                    byFolder.set(m.folder, list)
                  }
                  return [...byFolder.entries()].map(([folder, items]) => (
                    <div key={folder} style={{ marginBottom: '14px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px',
                      }}>
                        {items[0]?.folderLabel ?? formatMailFolderLabel(folder)}
                        <span style={{ fontWeight: 400, textTransform: 'none' }}> ({items.length})</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map((m, i) => (
                          <li key={`${folder}-${m.uid}-${i}`} style={{ fontSize: '13px', color: 'var(--text)' }}>
                            <div style={{ fontWeight: 500 }}>
                              {m.note === 'noselect'
                                ? (de
                                  ? `Noselect-Ordner — ${previewTotal} gezählt, Betreffzeilen nicht per IMAP abrufbar`
                                  : m.subject)
                                : m.subject === '(no subject)'
                                  ? (de ? '(ohne Betreff)' : m.subject)
                                  : m.subject}
                            </div>
                            {m.from ? <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.from}</div> : null}
                            {m.date ? (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {new Date(m.date).toLocaleString(de ? 'de-DE' : 'en-US')}
                              </div>
                            ) : null}
                            {m.uid > 0 ? (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>
                                UID {m.uid}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
