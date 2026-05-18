'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MAIL_CONFIG_CHANGED } from '@/lib/mail/events'
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
  unread?: number
  hasNew?: boolean
  lastError?: string
  openUrl?: string | null
  lastSyncAt?: string
  accounts?: MailAccountStatus[]
}

const PULSE_MS = 6500

export function NavbarMail({ locale }: { locale: Locale }) {
  const { compact, phone } = useNavbarCompact()
  const [data, setData] = useState<MailStatusResponse | null>(null)
  const [pulsing, setPulsing] = useState(false)
  const prevUnread = useRef<number | null>(null)
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const unread = j.unread ?? 0
      const hadNew = Boolean(j.hasNew)

      if (hadNew) {
        const prev = prevUnread.current
        if (prev === null || unread > prev) {
          triggerPulse()
        }
      }
      prevUnread.current = unread
      setData(j)
    } catch {
      /* offline */
    }
  }, [triggerPulse])

  useEffect(() => {
    void load()
    const onConfig = () => {
      prevUnread.current = null
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
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [load, data?.enabled])

  if (!data?.enabled) return null

  const unread = data.unread ?? 0
  const hasNew = Boolean(data.hasNew)
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
    if (data.openUrl) {
      window.open(data.openUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const alert = hasNew || pulsing

  return (
    <button
      type="button"
      className={[
        'navbar-mail-btn',
        alert ? 'navbar-mail-btn--alert' : '',
        pulsing ? 'navbar-mail-btn--pulse' : '',
        data.lastError && !hasNew ? 'navbar-mail-btn--error' : '',
      ].filter(Boolean).join(' ')}
      onClick={open}
      disabled={!data.openUrl}
      title={title}
      aria-label={title}
    >
      <span className="navbar-mail-icon-wrap">
        <Mail size={iconSize} strokeWidth={hasNew ? 2.25 : 2} />
      </span>
      {hasNew ? (
        <span className="navbar-mail-badge">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : data.lastError ? (
        <span className="navbar-mail-dot navbar-mail-dot--error" />
      ) : null}
    </button>
  )
}
