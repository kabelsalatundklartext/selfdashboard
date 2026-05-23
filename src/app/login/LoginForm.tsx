'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { authT } from '@/lib/authScreenI18n'
import { useDashboardStore } from '@/lib/store'

export function LoginForm() {
  const search = useSearchParams()
  const locale = useDashboardStore((s) => s.locale)
  const nextPath = search.get('next') || '/dashboard/home'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const recovered = search.get('recovered') === '1'

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/recovery-status', { cache: 'no-store' })
        const j = (await res.json()) as { available?: boolean }
        setRecoveryAvailable(Boolean(j.available))
      } catch {
        setRecoveryAvailable(false)
      }
    })()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, rememberMe }),
      })
      let j: { error?: string; ok?: boolean }
      try {
        j = (await res.json()) as typeof j
      } catch {
        setError(authT(locale, 'badResponse'))
        return
      }
      if (!res.ok) {
        setError(
          j.error === 'invalid_credentials'
            ? authT(locale, 'invalidCredentials')
            : authT(locale, 'loginFailed'),
        )
        return
      }

      const me = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      if (!me.ok) {
        setError(authT(locale, 'sessionNotStored'))
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

  return (
    <AuthScreenShell>
      <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
        <div className="text-center sm:text-left pr-16">
          <h1 className="text-xl font-bold sr-only">SelfDashboard</h1>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {authT(locale, 'loginTitle')}
          </p>
        </div>
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
            autoComplete="current-password"
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          {authT(locale, 'rememberMe')}
        </label>
        {error ? (
          <p className="text-sm" role="alert" style={{ color: '#f87171' }}>
            {error}
          </p>
        ) : null}
        {recovered ? (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {authT(locale, 'recoverySuccess')}
          </p>
        ) : null}
        <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
          {busy ? authT(locale, 'loginBusy') : authT(locale, 'loginSubmit')}
        </button>
        {recoveryAvailable ? (
          <Link
            href="/recover"
            className="text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {authT(locale, 'recoveryLink')}
          </Link>
        ) : null}
      </form>
    </AuthScreenShell>
  )
}
