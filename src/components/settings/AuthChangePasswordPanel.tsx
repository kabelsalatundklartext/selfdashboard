'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

const ERROR_LABELS: Record<string, { de: string; en: string }> = {
  wrong_password: { de: 'Aktuelles Passwort ist falsch.', en: 'Current password is wrong.' },
  password_too_short: { de: 'Neues Passwort: mindestens 8 Zeichen.', en: 'New password must be at least 8 characters.' },
  password_too_long: { de: 'Neues Passwort: maximal 128 Zeichen.', en: 'New password must be at most 128 characters.' },
  missing_fields: { de: 'Bitte alle Felder ausfüllen.', en: 'Please fill in all fields.' },
}

function errorText(code: string, de: boolean): string {
  const row = ERROR_LABELS[code]
  if (row) return de ? row.de : row.en
  return code
}

export function AuthChangePasswordPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setMsg(null)
    if (newPassword !== confirmPassword) {
      setMsg(de ? 'Neue Passwörter stimmen nicht überein.' : 'New passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'change_failed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMsg(de ? 'Passwort geändert.' : 'Password changed.')
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e)
      setMsg(errorText(code, de))
    } finally {
      setBusy(false)
    }
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {de ? 'Passwort ändern' : 'Change password'}
      </label>
      <div
        className="flex flex-col gap-2 rounded-xl p-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <input
          type="password"
          style={inp}
          placeholder={de ? 'Aktuelles Passwort' : 'Current password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <input
          type="password"
          style={inp}
          placeholder={de ? 'Neues Passwort (min. 8 Zeichen)' : 'New password (min. 8 chars)'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          type="password"
          style={inp}
          placeholder={de ? 'Neues Passwort wiederholen' : 'Confirm new password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="btn-accent self-start flex items-center gap-1.5 px-3 py-1.5"
          disabled={busy || !currentPassword || !newPassword || !confirmPassword}
          onClick={() => void submit()}
        >
          <KeyRound size={14} />
          {de ? 'Speichern' : 'Save'}
        </button>
        {msg ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  )
}
