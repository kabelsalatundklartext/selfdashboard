'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { DashboardMain } from '@/components/layout/DashboardMain'
import { KioskAuthShell } from '@/components/kiosk/KioskAuthShell'
import { PluginBootstrap } from '@/components/plugins/PluginBootstrap'
import { useDashboardStore, useDashboardStoreHydrated } from '@/lib/store'
import { kioskPageFetch } from '@/lib/kiosk/kioskClientFetch'
import type { DashboardStatePersisted } from '@/lib/dashboardStatePayload'

type Phase = 'loading' | 'disabled' | 'password' | 'ready' | 'error'

export function KioskView() {
  const hydrated = useDashboardStoreHydrated()
  const locale = useDashboardStore((s) => s.locale)
  const [phase, setPhase] = useState<Phase>('loading')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const de = locale === 'de'

  const loadDashboard = useCallback(async (): Promise<'ready' | 'password' | 'disabled' | 'error'> => {
    setBusy(true)
    setError(null)
    try {
      const st = await kioskPageFetch('/api/kiosk/status')
      const status = (await st.json()) as { enabled?: boolean }
      if (!st.ok || !status.enabled) return 'disabled'

      const res = await kioskPageFetch('/api/kiosk/dashboard')
      const j = (await res.json()) as DashboardStatePersisted & { error?: string }
      if (res.status === 401 && j.error === 'password_required') return 'password'
      if (!res.ok) return j.error === 'kiosk_disabled' ? 'disabled' : 'error'

      const idle = j.kioskModeIdleSeconds ?? 5
      useDashboardStore.setState({
        ...j,
        editMode: false,
        showDashboardTabs: false,
        kioskModeEnabled: false,
        kioskModeIdleSeconds: idle,
      })
      return 'ready'
    } catch {
      return 'error'
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const next = await loadDashboard()
      setPhase(next)
    })()
  }, [loadDashboard])

  async function unlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await kioskPageFetch('/api/kiosk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(de ? 'Passwort falsch.' : 'Wrong password.')
        return
      }
      const next = await loadDashboard()
      setPhase(next)
    } catch {
      setError(de ? 'Netzwerkfehler.' : 'Network error.')
    } finally {
      setBusy(false)
    }
  }

  if (!hydrated || phase === 'loading') {
    return <div className="min-h-screen" style={{ background: 'var(--background)' }} aria-busy="true" />
  }

  if (phase === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
        <p>{de ? 'Kiosk-Modus ist nicht aktiviert.' : 'Kiosk mode is not enabled.'}</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
        <p>{de ? 'Kiosk konnte nicht geladen werden.' : 'Could not load kiosk.'}</p>
      </div>
    )
  }

  if (phase === 'password') {
    return (
      <KioskAuthShell>
        <form onSubmit={unlock} className="w-full flex flex-col gap-4">
          <p className="text-sm text-center sm:text-left" style={{ color: 'var(--text-muted)' }}>
            {de
              ? 'Passwort eingeben — nur Ansicht, kein Bearbeiten.'
              : 'Enter password — view only, no editing.'}
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{de ? 'Passwort' : 'Password'}</span>
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
          {error ? (
            <p className="text-sm" role="alert" style={{ color: '#f87171' }}>
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-accent py-2.5 rounded-lg font-semibold" disabled={busy}>
            {busy ? (de ? 'Wird geladen…' : 'Loading…') : de ? 'Anzeigen' : 'View'}
          </button>
        </form>
      </KioskAuthShell>
    )
  }

  return (
    <>
      <PluginBootstrap />
      <DashboardMain>
        <DashboardGrid />
      </DashboardMain>
    </>
  )
}
