'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { DashboardMain } from '@/components/layout/DashboardMain'
import { KioskNavbarShell } from '@/components/layout/KioskNavbarShell'
import { PluginBootstrap } from '@/components/plugins/PluginBootstrap'
import { useDashboardStore, useDashboardStoreHydrated } from '@/lib/store'
import type { DashboardStatePersisted } from '@/lib/dashboardStatePayload'

type Phase = 'loading' | 'disabled' | 'password' | 'ready' | 'error'

export function KioskView() {
  const hydrated = useDashboardStoreHydrated()
  const locale = useDashboardStore((s) => s.locale)
  const [phase, setPhase] = useState<Phase>('loading')
  const [idleSeconds, setIdleSeconds] = useState(5)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const de = locale === 'de'

  const loadDashboard = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/kiosk/dashboard', { cache: 'no-store' })
      const j = (await res.json()) as DashboardStatePersisted & { error?: string }
      if (res.status === 401 && j.error === 'password_required') {
        setPhase('password')
        return
      }
      if (!res.ok) {
        setPhase(j.error === 'kiosk_disabled' ? 'disabled' : 'error')
        return
      }
      const idle = j.kioskModeIdleSeconds ?? 5
      setIdleSeconds(idle)
      useDashboardStore.setState({
        ...j,
        editMode: false,
        showDashboardTabs: false,
        kioskModeEnabled: true,
        kioskModeIdleSeconds: idle,
      })
      setPhase('ready')
    } catch {
      setPhase('error')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const st = await fetch('/api/kiosk/status', { cache: 'no-store' })
        const status = (await st.json()) as {
          enabled?: boolean
          requiresPassword?: boolean
          idleSeconds?: number
        }
        if (!st.ok || !status.enabled) {
          setPhase('disabled')
          return
        }
        setIdleSeconds(typeof status.idleSeconds === 'number' ? status.idleSeconds : 5)
        if (status.requiresPassword) {
          setPhase('password')
          return
        }
        await loadDashboard()
      } catch {
        setPhase('error')
      }
    })()
  }, [loadDashboard])

  async function unlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/kiosk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(de ? 'Passwort falsch.' : 'Wrong password.')
        return
      }
      await loadDashboard()
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
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <form onSubmit={unlock} className="w-full max-w-sm flex flex-col gap-3 rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-lg font-bold">{de ? 'Kiosk-Zugang' : 'Kiosk access'}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {de ? 'Passwort eingeben — nur Ansicht, kein Bearbeiten.' : 'Enter password — view only, no editing.'}
          </p>
          <input
            type="password"
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? <p className="text-sm" style={{ color: '#f87171' }}>{error}</p> : null}
          <button type="submit" className="btn-accent py-2 rounded-lg font-semibold" disabled={busy}>
            {de ? 'Anzeigen' : 'View'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <PluginBootstrap />
      <KioskNavbarShell locale={locale} idleSeconds={idleSeconds} startHidden>
        <nav
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
          className="flex items-center justify-center px-4 py-2"
        >
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            Self<span style={{ color: 'var(--accent)' }}>Dashboard</span>
            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              {de ? '· Nur Ansicht' : '· View only'}
            </span>
          </span>
        </nav>
      </KioskNavbarShell>
      <DashboardMain>
        <DashboardGrid />
      </DashboardMain>
    </>
  )
}
