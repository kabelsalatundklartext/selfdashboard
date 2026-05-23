'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { TotpQrImage } from '@/components/auth/TotpQrImage'
import type { Locale } from '@/lib/i18n'
import { useAuthRole } from '@/components/layout/AuthUserMenu'

export function AuthTotpSettingsPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const role = useAuthRole()
  const [enabled, setEnabled] = useState(false)
  const [adminRequired, setAdminRequired] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState('')
  const [setupUri, setSetupUri] = useState('')
  const [setupQrDataUrl, setSetupQrDataUrl] = useState('')
  const [setupCode, setSetupCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/totp/status', { cache: 'no-store' })
    if (!res.ok) return
    const j = (await res.json()) as { enabled?: boolean; adminPolicyRequired?: boolean }
    setEnabled(Boolean(j.enabled))
    setAdminRequired(Boolean(j.adminPolicyRequired))
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function startSetup() {
    setBusy(true)
    setMsg(null)
    setBackupCodes(null)
    try {
      const res = await fetch('/api/auth/totp/setup', { cache: 'no-store' })
      const j = (await res.json()) as { secret?: string; uri?: string; qrDataUrl?: string; error?: string; retryAfterSec?: number }
      if (!res.ok) {
        if (j.error === 'rate_limited' && j.retryAfterSec) {
          throw new Error(de ? `Zu viele Versuche. In ${j.retryAfterSec} s erneut.` : `Too many attempts. Retry in ${j.retryAfterSec}s.`)
        }
        throw new Error(j.error ?? 'setup_failed')
      }
      setSetupSecret(j.secret ?? '')
      setSetupUri(j.uri ?? '')
      setSetupQrDataUrl(j.qrDataUrl ?? '')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnable(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/totp/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: setupSecret, code: setupCode.trim() }),
      })
      const j = (await res.json()) as { backupCodes?: string[]; error?: string; retryAfterSec?: number }
      if (!res.ok) {
        if (j.error === 'rate_limited' && j.retryAfterSec) {
          throw new Error(de ? `Zu viele Versuche. In ${j.retryAfterSec} s erneut.` : `Too many attempts. Retry in ${j.retryAfterSec}s.`)
        }
        throw new Error(j.error ?? 'invalid_code')
      }
      setBackupCodes(j.backupCodes ?? [])
      setSetupSecret('')
      setSetupCode('')
      setEnabled(true)
      setMsg(de ? '2FA ist aktiv.' : '2FA is enabled.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function disableTotp(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableCode.trim() }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'disable_failed')
      setDisablePassword('')
      setDisableCode('')
      setEnabled(false)
      setMsg(de ? '2FA deaktiviert.' : '2FA disabled.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function toggleAdminPolicy(checked: boolean) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/totp/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required: checked }),
      })
      if (!res.ok) throw new Error('policy_failed')
      setAdminRequired(checked)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
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
        {de ? 'Zwei-Faktor (Authenticator)' : 'Two-factor (authenticator)'}
      </label>
      <div
        className="flex flex-col gap-3 rounded-xl p-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
          {enabled
            ? de
              ? '2FA ist aktiv. Beim Login: Passwort, dann 6-stelliger Code (oder Backup-Code).'
              : '2FA is on. Login: password, then 6-digit code (or backup code).'
            : de
              ? 'Optional: Google Authenticator, Aegis, Bitwarden … (TOTP, kein SMS).'
              : 'Optional: Google Authenticator, Aegis, Bitwarden … (TOTP, no SMS).'}
        </p>

        {backupCodes ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold">{de ? 'Backup-Codes (einmal)' : 'Backup codes (once)'}</p>
            <ul className="font-mono text-xs grid grid-cols-2 gap-1">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!enabled && !setupSecret ? (
          <button type="button" className="btn-accent self-start flex items-center gap-1.5 px-3 py-1.5" disabled={busy} onClick={() => void startSetup()}>
            <Shield size={14} />
            {de ? '2FA einrichten' : 'Set up 2FA'}
          </button>
        ) : null}

        {!enabled && setupSecret ? (
          <form onSubmit={confirmEnable} className="flex flex-col gap-2">
            {setupQrDataUrl ? <TotpQrImage dataUrl={setupQrDataUrl} locale={locale} /> : null}
            <input readOnly style={{ ...inp, fontFamily: 'monospace', fontSize: '11px' }} value={setupSecret} />
            {setupUri ? <p className="text-[10px] break-all font-mono" style={{ color: 'var(--text-muted)' }}>{setupUri}</p> : null}
            <input
              style={inp}
              placeholder={de ? 'Code aus App' : 'Code from app'}
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
            />
            <button type="submit" className="btn-accent self-start px-3 py-1.5" disabled={busy}>
              {de ? 'Aktivieren' : 'Enable'}
            </button>
          </form>
        ) : null}

        {enabled ? (
          <form onSubmit={disableTotp} className="flex flex-col gap-2">
            <input
              type="password"
              style={inp}
              placeholder={de ? 'Aktuelles Passwort' : 'Current password'}
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
            />
            <input
              style={inp}
              placeholder={de ? 'Authenticator- oder Backup-Code' : 'Authenticator or backup code'}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
            />
            <button type="submit" className="btn-ghost self-start px-3 py-1.5 text-xs" disabled={busy}>
              {de ? '2FA deaktivieren' : 'Disable 2FA'}
            </button>
          </form>
        ) : null}

        {role === 'admin' ? (
          <label className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={adminRequired}
              disabled={busy}
              onChange={(e) => void toggleAdminPolicy(e.target.checked)}
            />
            {de ? 'Admins müssen 2FA nutzen (Pflicht)' : 'Require 2FA for admins'}
          </label>
        ) : null}

        {msg ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  )
}
