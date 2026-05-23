'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
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
        setError('Setup-Status konnte nicht geladen werden.')
      } finally {
        setChecking(false)
      }
    })()
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const j = (await res.json()) as { error?: string; migration?: string }
      if (!res.ok) {
        const map: Record<string, string> = {
          username_invalid: 'Benutzername: 2–32 Zeichen, Buchstaben/Zahlen/._-',
          password_too_short: 'Passwort mindestens 8 Zeichen.',
          password_too_long: 'Passwort zu lang.',
        }
        setError(map[j.error ?? ''] ?? 'Setup fehlgeschlagen.')
        return
      }
      router.replace('/dashboard/home')
      router.refresh()
    } catch {
      setError('Netzwerkfehler.')
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
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--background)', color: 'var(--text)' }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-xl font-bold">Erst-Setup</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Admin-Konto anlegen. Bestehendes <code>dashboard.json</code> wird diesem Benutzer zugeordnet.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Admin-Benutzername</span>
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
            autoComplete="new-password"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Passwort wiederholen</span>
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
          {busy ? '…' : 'Setup abschließen'}
        </button>
      </form>
    </div>
  )
}
