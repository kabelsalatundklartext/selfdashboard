'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { authT } from '@/lib/authScreenI18n'
import { useDashboardStore } from '@/lib/store'

export default function SetupPage() {
  const router = useRouter()
  const locale = useDashboardStore((s) => s.locale)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/setup-status', { cache: 'no-store' })
        const j = (await res.json()) as { needsSetup?: boolean }
        if (!j.needsSetup) {
          router.replace('/login')
          return
        }
      } catch {
        setError(authT(locale, 'setupStatusError'))
      } finally {
        setChecking(false)
      }
    })()
  }, [router, locale])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError(authT(locale, 'passwordsMismatch'))
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) {
        if (j.error === 'username_invalid') setError(authT(locale, 'usernameInvalid'))
        else if (j.error === 'password_too_short') setError(authT(locale, 'passwordTooShort'))
        else if (j.error === 'password_too_long') setError(authT(locale, 'passwordTooLong'))
        else setError(authT(locale, 'setupFailed'))
        return
      }
      router.replace('/dashboard/home')
      router.refresh()
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
      <form
        onSubmit={onSubmit}
        className="w-full rounded-2xl p-8 flex flex-col gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-xl font-bold">{authT(locale, 'setupTitle')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {authT(locale, 'setupDesc')}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{authT(locale, 'adminUsername')}</span>
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
          <p className="text-sm" style={{ color: '#f87171' }}>
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
          {busy ? authT(locale, 'setupBusy') : authT(locale, 'setupSubmit')}
        </button>
      </form>
    </AuthScreenShell>
  )
}
