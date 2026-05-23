'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { TotpQrImage } from '@/components/auth/TotpQrImage'
import { authRateLimitMessage, authT } from '@/lib/authScreenI18n'
import { useDashboardStore } from '@/lib/store'

export function TotpLoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const locale = useDashboardStore((s) => s.locale)
  const nextPath = search.get('next') || '/dashboard/home'
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const st = await fetch('/api/auth/totp/status', { cache: 'no-store' })
        if (!st.ok) {
          router.replace('/login')
          return
        }
        const j = (await st.json()) as { setupRequired?: boolean; enabled?: boolean }
        if (j.enabled && !j.setupRequired) {
          setSetupRequired(false)
          setChecking(false)
          return
        }
        if (j.setupRequired && !j.enabled) {
          setSetupRequired(true)
          const setup = await fetch('/api/auth/totp/setup', { cache: 'no-store' })
          if (setup.ok) {
            const s = (await setup.json()) as { secret?: string; uri?: string; qrDataUrl?: string }
            setSecret(s.secret ?? '')
            setUri(s.uri ?? '')
            setQrDataUrl(s.qrDataUrl ?? '')
          }
        }
      } catch {
        router.replace('/login')
      } finally {
        setChecking(false)
      }
    })()
  }, [router])

  async function verify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const j = (await res.json()) as { error?: string; retryAfterSec?: number }
      if (!res.ok) {
        if (j.error === 'rate_limited' && j.retryAfterSec) {
          setError(authRateLimitMessage(locale, j.retryAfterSec))
          return
        }
        if (j.error === 'totp_setup_required') {
          setSetupRequired(true)
          setError(locale === 'de' ? 'Bitte zuerst 2FA einrichten.' : 'Please set up 2FA first.')
          return
        }
        setError(authT(locale, 'totpInvalid'))
        return
      }
      const target = nextPath.startsWith('/') ? nextPath : '/dashboard/home'
      window.location.assign(target)
    } catch {
      setError(authT(locale, 'networkError'))
    } finally {
      setBusy(false)
    }
  }

  async function enableSetup(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/totp/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code: code.trim() }),
      })
      const j = (await res.json()) as { error?: string; backupCodes?: string[]; retryAfterSec?: number }
      if (!res.ok) {
        if (j.error === 'rate_limited' && j.retryAfterSec) {
          setError(authRateLimitMessage(locale, j.retryAfterSec))
          return
        }
        setError(authT(locale, 'totpInvalid'))
        return
      }
      setBackupCodes(j.backupCodes ?? [])
    } catch {
      setError(authT(locale, 'networkError'))
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return <div className="min-h-screen" style={{ background: 'var(--background)' }} aria-busy="true" />
  }

  if (backupCodes) {
    return (
      <AuthScreenShell>
        <div className="w-full flex flex-col gap-3">
          <h1 className="text-lg font-bold">{authT(locale, 'totpBackupTitle')}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{authT(locale, 'totpBackupHint')}</p>
          <ul className="font-mono text-sm grid grid-cols-2 gap-1">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-accent py-2.5 rounded-lg font-semibold"
            onClick={() => window.location.assign(nextPath.startsWith('/') ? nextPath : '/dashboard/home')}
          >
            {locale === 'de' ? 'Weiter zum Dashboard' : 'Continue to dashboard'}
          </button>
        </div>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell>
      <form onSubmit={setupRequired ? enableSetup : verify} className="w-full flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold">
            {setupRequired ? authT(locale, 'totpSetupTitle') : authT(locale, 'totpTitle')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {setupRequired ? authT(locale, 'totpSetupDesc') : authT(locale, 'totpDesc')}
          </p>
        </div>
        {setupRequired && secret ? (
          <>
            {qrDataUrl ? <TotpQrImage dataUrl={qrDataUrl} locale={locale} /> : null}
            <label className="flex flex-col gap-1 text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'totpSecret')}</span>
              <input
                readOnly
                className="rounded-lg px-3 py-2 font-mono text-xs"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={secret}
              />
            </label>
            {uri ? (
              <p className="text-[10px] break-all font-mono" style={{ color: 'var(--text-muted)' }}>
                {uri}
              </p>
            ) : null}
          </>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'totpCode')}</span>
          <input
            className="rounded-lg px-3 py-2 font-mono tracking-widest"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            autoComplete="one-time-code"
            inputMode="numeric"
            required
          />
        </label>
        {error ? (
          <p className="text-sm" style={{ color: '#f87171' }} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
          {busy
            ? authT(locale, 'totpBusy')
            : setupRequired
              ? authT(locale, 'totpSetupSubmit')
              : authT(locale, 'totpSubmit')}
        </button>
      </form>
    </AuthScreenShell>
  )
}
