'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const nextPath = search.get('next') || '/dashboard/home'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(j.error === 'invalid_credentials' ? 'Benutzername oder Passwort falsch.' : 'Anmeldung fehlgeschlagen.')
        return
      }
      router.replace(nextPath.startsWith('/') ? nextPath : '/dashboard/home')
      router.refresh()
    } catch {
      setError('Netzwerkfehler.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div>
        <h1 className="text-xl font-bold">SelfDashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Anmelden
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-muted)' }}>Benutzername</span>
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
        <span style={{ color: 'var(--text-muted)' }}>Passwort</span>
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
        Angemeldet bleiben
      </label>
      {error ? (
        <p className="text-sm" style={{ color: '#f87171' }}>
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
        {busy ? '…' : 'Anmelden'}
      </button>
    </form>
  )
}
