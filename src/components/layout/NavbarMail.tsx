'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MAIL_CONFIG_CHANGED } from '@/lib/mail/events'
import { formatMailError, isMailConfigError } from '@/lib/mail/errors'
import { useNavbarCompact } from '@/components/layout/useNavbarCompact'

interface MailAccountStatus {
  id: string
  label: string
  unread: number
  lastError?: string
}

interface MailStatusResponse {
  ok?: boolean
  enabled?: boolean
  pollIntervalSeconds?: number
  unread?: number
  hasNew?: boolean
  lastError?: string
  openUrl?: string | null
  lastSyncAt?: string
  accounts?: MailAccountStatus[]
}

const PULSE_MS = 12_000

export function NavbarMail({ locale }: { locale: Locale }) {
  const { compact, phone } = useNavbarCompact()
  const [data, setData] = useState<MailStatusResponse | null>(null)
  const [pulsing, setPulsing] = useState(false)
  const prevUnread = useRef<number | null>(null)
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Verhindert Flackern, wenn IMAP kurz 0 liefert obwohl gerade noch ungelesen da war */
  const stickyUnread = useRef(0)
  const zeroPollStreak = useRef(0)

  const triggerPulse = useCallback(() => {
    setPulsing(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_MS)
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/status', { cache: 'no-store' })
      if (!res.ok) return
      const j = (await res.json()) as MailStatusResponse
      let unread = j.unread ?? 0
      if (unread > 0) {
        stickyUnread.current = unread
        zeroPollStreak.current = 0
      } else if (stickyUnread.current > 0) {
        zeroPollStreak.current += 1
        if (zeroPollStreak.current < 4) {
          unread = stickyUnread.current
        } else {
          stickyUnread.current = 0
          zeroPollStreak.current = 0
        }
      }

      const hadNew = unread > 0
      if (hadNew) {
        const prev = prevUnread.current
        if (prev === null || unread > prev) {
          triggerPulse()
        }
      }
      prevUnread.current = unread
      setData({ ...j, unread, hasNew: hadNew && Boolean(j.enabled ?? true) })
    } catch {
      /* offline */
    }
  }, [triggerPulse])

  useEffect(() => {
    void load()
    const onConfig = (e: Event) => {
      const detail = (e as CustomEvent<{ openUrl?: string | null; unread?: number }>).detail
      if (typeof detail?.unread === 'number' && detail.unread > 0) {
        stickyUnread.current = detail.unread
        zeroPollStreak.current = 0
        prevUnread.current = detail.unread
        setData(prev => ({
          ...(prev ?? { enabled: true }),
          ...(detail.openUrl ? { openUrl: detail.openUrl } : {}),
          unread: detail.unread,
          hasNew: true,
          enabled: prev?.enabled ?? true,
        }))
        window.setTimeout(() => void load(), 2500)
        return
      }
      prevUnread.current = null
      if (detail?.openUrl) {
        setData(prev => (prev ? { ...prev, openUrl: detail.openUrl! } : prev))
      }
      void load()
    }
    window.addEventListener(MAIL_CONFIG_CHANGED, onConfig)
    return () => {
      window.removeEventListener(MAIL_CONFIG_CHANGED, onConfig)
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
    }
  }, [load])

  useEffect(() => {
    if (!data?.enabled) return
    const sec = data.pollIntervalSeconds
    const pollMs =
      typeof sec === 'number' && sec > 0
        ? Math.max(15, Math.min(120, sec)) * 1000
        : 30_000
    const id = window.setInterval(() => void load(), pollMs)
    return () => window.clearInterval(id)
  }, [load, data?.enabled, data?.pollIntervalSeconds])

  if (!data?.enabled) return null

  const unread = data.unread ?? 0
  const hasUnread = unread > 0
  const hasNew = Boolean(data.hasNew) || hasUnread
  const lastError = data.lastError ? formatMailError(data.lastError) : undefined
  const configError = isMailConfigError(lastError)
  const iconSize = phone ? 18 : compact ? 17 : 16
  const breakdown = (data.accounts ?? []).filter(a => a.unread > 0)
  const title =
    locale === 'de'
      ? hasNew
        ? breakdown.length > 1
          ? `${unread} ungelesen (${breakdown.map(a => `${a.label}: ${a.unread}`).join(', ')})`
          : `${unread} ungelesene E-Mail${unread === 1 ? '' : 's'}`
        : data.lastError
          ? `E-Mail: Fehler — ${data.lastError}`
          : 'E-Mail: keine neuen Nachrichten'
      : hasNew
        ? breakdown.length > 1
          ? `${unread} unread (${breakdown.map(a => `${a.label}: ${a.unread}`).join(', ')})`
          : `${unread} unread email${unread === 1 ? '' : 's'}`
        : data.lastError
          ? `Mail: error — ${data.lastError}`
          : 'Mail: no new messages'

  const open = () => {
    const url = data.openUrl?.trim()
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const alert = hasUnread || pulsing

  return (
    <button
      type="button"
      className={[
        'navbar-mail-btn',
        alert ? 'navbar-mail-btn--alert' : '',
        pulsing ? 'navbar-mail-btn--pulse' : '',
        phone ? 'navbar-mail-btn--phone' : '',
        data.lastError && !hasUnread ? 'navbar-mail-btn--error' : '',
      ].filter(Boolean).join(' ')}
      onClick={open}
      title={data.openUrl ? title : (locale === 'de' ? `${title} — Webmail-URL in Einstellungen speichern` : `${title} — save webmail URL in settings`)}
      aria-label={title}
    >
      <span className="navbar-mail-icon-wrap">
        <Mail size={iconSize} strokeWidth={hasNew ? 2.25 : 2} />
      </span>
      {hasUnread ? (
        <span className="navbar-mail-badge" aria-hidden>
          {unread > 99 ? '99+' : unread}
        </span>
      ) : lastError && !configError ? (
        <span className="navbar-mail-dot navbar-mail-dot--error" />
      ) : lastError && configError ? (
        <span className="navbar-mail-dot navbar-mail-dot--warn" title={lastError} />
      ) : null}
    </button>
  )
}
