'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { authT } from '@/lib/authScreenI18n'
import { useDashboardStore } from '@/lib/store'

export default function RecoverPage() {
  const router = useRouter()
  const locale = useDashboardStore((s) => s.locale)
  const [checking, setChecking] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/recovery-status', { cache: 'no-store' })
        const j = (await res.json()) as { available?: boolean }
        if (!j.available) {
          router.replace('/login')
          return
        }
      } catch {
        router.replace('/login')
        return
      } finally {
        setChecking(false)
      }
    })()
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError(authT(locale, 'passwordsMismatch'))
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, token: token.trim() }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) {
        if (j.error === 'invalid_token') setError(authT(locale, 'recoveryInvalidToken'))
        else if (j.error === 'user_not_found') setError(authT(locale, 'recoveryUserNotFound'))
        else if (j.error === 'username_invalid') setError(authT(locale, 'usernameInvalid'))
        else if (j.error === 'password_too_short') setError(authT(locale, 'passwordTooShort'))
        else if (j.error === 'password_too_long') setError(authT(locale, 'passwordTooLong'))
        else setError(authT(locale, 'recoveryFailed'))
        return
      }
      window.location.assign('/login?recovered=1')
    } catch {
      setError(authT(locale, 'networkError'))
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }} aria-busy="true" />
    )
  }

  return (
    <AuthScreenShell>
      <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
        <div className="pr-16">
          <h1 className="text-xl font-bold">{authT(locale, 'recoveryTitle')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {authT(locale, 'recoveryDesc')}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'recoveryToken')}</span>
          <input
            className="rounded-lg px-3 py-2 font-mono text-xs"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'username')}</span>
          <input
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'password')}</span>
          <input
            type="password"
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'passwordRepeat')}</span>
          <input
            type="password"
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error ? (
          <p className="text-sm" role="alert" style={{ color: '#f87171' }}>
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
          {busy ? authT(locale, 'recoveryBusy') : authT(locale, 'recoverySubmit')}
        </button>
        <Link
          href="/login"
          className="text-xs text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          {authT(locale, 'recoveryBackLogin')}
        </Link>
      </form>
    </AuthScreenShell>
  )
}
