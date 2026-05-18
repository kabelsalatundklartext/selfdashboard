'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { MAIL_CONFIG_CHANGED } from '@/lib/mail/events'
import { useNavbarCompact } from '@/components/layout/useNavbarCompact'

interface MailStatusResponse {
  ok?: boolean
  enabled?: boolean
  unread?: number
  hasNew?: boolean
  lastError?: string
  openUrl?: string | null
  lastSyncAt?: string
}

export function NavbarMail({ locale }: { locale: Locale }) {
  const { compact, phone } = useNavbarCompact()
  const [data, setData] = useState<MailStatusResponse | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/status', { cache: 'no-store' })
      if (!res.ok) return
      const j = (await res.json()) as MailStatusResponse
      setData(j)
    } catch {
      /* offline */
    }
  }, [])

  useEffect(() => {
    void load()
    const onConfig = () => void load()
    window.addEventListener(MAIL_CONFIG_CHANGED, onConfig)
    return () => window.removeEventListener(MAIL_CONFIG_CHANGED, onConfig)
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
  const pad = phone ? 10 : compact ? 8 : 7
  const title =
    locale === 'de'
      ? hasNew
        ? `${unread} ungelesene E-Mail${unread === 1 ? '' : 's'}`
        : data.lastError
          ? `E-Mail: Fehler — ${data.lastError}`
          : 'E-Mail: keine neuen Nachrichten'
      : hasNew
        ? `${unread} unread email${unread === 1 ? '' : 's'}`
        : data.lastError
          ? `Mail: error — ${data.lastError}`
          : 'Mail: no new messages'

  const open = () => {
    if (data.openUrl) {
      window.open(data.openUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      type="button"
      className="btn-ghost navbar-mail-btn"
      onClick={open}
      disabled={!data.openUrl}
      title={title}
      aria-label={title}
      style={{
        padding: pad,
        position: 'relative',
        flexShrink: 0,
        minWidth: phone ? 44 : compact ? 40 : undefined,
        minHeight: phone ? 44 : compact ? 40 : undefined,
        color: hasNew ? 'var(--accent)' : data.lastError ? '#f87171' : 'var(--text-muted)',
        cursor: data.openUrl ? 'pointer' : 'default',
      }}
    >
      <Mail size={iconSize} />
      {hasNew ? (
        <span
          className="navbar-mail-badge"
          style={{
            position: 'absolute',
            top: phone ? 4 : 2,
            right: phone ? 4 : 2,
            minWidth: phone ? 18 : 16,
            height: phone ? 18 : 16,
            padding: '0 4px',
            borderRadius: '9px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: phone ? '11px' : '10px',
            fontWeight: 700,
            lineHeight: phone ? '18px' : '16px',
            textAlign: 'center',
          }}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      ) : data.lastError ? (
        <span
          style={{
            position: 'absolute',
            top: phone ? 6 : 4,
            right: phone ? 6 : 4,
            width: phone ? 9 : 8,
            height: phone ? 9 : 8,
            borderRadius: '50%',
            background: '#f87171',
          }}
        />
      ) : null}
    </button>
  )
}
