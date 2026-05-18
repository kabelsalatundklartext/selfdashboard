'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import { dispatchMailConfigChanged } from '@/lib/mail/events'

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(!value)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onChange(!value)
        }
      }}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        background: value ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: value ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  )
}

export async function saveMailNavbarEnabled(enabled: boolean): Promise<void> {
  const res = await fetch('/api/mail/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ navbarEnabled: enabled }),
  })
  const j = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`)
  dispatchMailConfigChanged()
}

type MailNavbarToggleProps = {
  locale: Locale
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void | Promise<void>
  standalone?: boolean
}

export function MailNavbarToggle({ locale, enabled: enabledProp, onEnabledChange, standalone }: MailNavbarToggleProps) {
  const de = locale === 'de'
  const [internalEnabled, setInternalEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mail/settings', { cache: 'no-store' })
      if (!res.ok) return
      const j = (await res.json()) as { navbarEnabled?: boolean; config?: { enabled?: boolean } }
      setInternalEnabled(Boolean(j.navbarEnabled ?? j.config?.enabled))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (standalone) void load()
  }, [standalone, load])

  const enabled = standalone ? internalEnabled : Boolean(enabledProp)

  const apply = async (next: boolean) => {
    setErr(null)
    if (standalone) {
      setBusy(true)
      setInternalEnabled(next)
      try {
        await saveMailNavbarEnabled(next)
      } catch (e: unknown) {
        setInternalEnabled(!next)
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
      return
    }
    if (onEnabledChange) {
      setBusy(true)
      try {
        await onEnabledChange(next)
        dispatchMailConfigChanged()
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setBusy(false)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
            {de ? 'E-Mail-Symbol in der Navbar' : 'Email icon in navbar'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.45 }}>
            {enabled
              ? (de
                ? 'An — ungelesene Mails werden abgefragt und als Badge angezeigt.'
                : 'On — polls unread mail and shows a badge.')
              : (de
                ? 'Aus — kein Symbol, keine IMAP-Abfrage im Hintergrund.'
                : 'Off — no icon and no background IMAP polling.')}
          </p>
        </div>
        <Toggle value={enabled} onChange={v => void apply(v)} disabled={busy} />
      </div>
      {err ? <p style={{ fontSize: '11px', color: '#f87171', margin: 0 }}>{err}</p> : null}
    </div>
  )
}
