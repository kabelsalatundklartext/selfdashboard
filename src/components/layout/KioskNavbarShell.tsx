'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { PanelTop } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'

const IDLE_MIN_SEC = 3
const IDLE_MAX_SEC = 60

function clampIdleSec(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 5
  return Math.min(IDLE_MAX_SEC, Math.max(IDLE_MIN_SEC, n))
}

type Props = {
  children: ReactNode
  locale: 'de' | 'en'
}

/**
 * Wand-Tablet / Kiosk: Navbar nach Inaktivität ausblenden, per kleinem Button kurz wieder einblenden.
 * Deaktiviert im Bearbeitungsmodus.
 */
export function KioskNavbarShell({ children, locale }: Props) {
  const kioskModeEnabled = useDashboardStore((s) => s.kioskModeEnabled)
  const kioskModeIdleSeconds = useDashboardStore((s) => s.kioskModeIdleSeconds)
  const editMode = useDashboardStore((s) => s.editMode)

  const idleMs = clampIdleSec(kioskModeIdleSeconds) * 1000
  const active = kioskModeEnabled && !editMode

  const [barVisible, setBarVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    if (!active) return
    hideTimerRef.current = setTimeout(() => setBarVisible(false), idleMs)
  }, [active, idleMs, clearHideTimer])

  const showNavbar = !active || barVisible

  const revealNavbar = useCallback(() => {
    if (!active) return
    setBarVisible(true)
    scheduleHide()
  }, [active, scheduleHide])

  useEffect(() => {
    if (!active) {
      clearHideTimer()
      setBarVisible(true)
      return
    }
    setBarVisible(true)
    scheduleHide()

    const onActivity = () => {
      setBarVisible(true)
      scheduleHide()
    }
    const opts: AddEventListenerOptions = { passive: true }
    window.addEventListener('mousemove', onActivity, opts)
    window.addEventListener('mousedown', onActivity, opts)
    window.addEventListener('touchstart', onActivity, opts)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('wheel', onActivity, opts)

    return () => {
      clearHideTimer()
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('mousedown', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('wheel', onActivity)
    }
  }, [active, scheduleHide, clearHideTimer])

  const de = locale === 'de'

  return (
    <>
      <div
        className="sd-kiosk-navbar-wrap"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          pointerEvents: showNavbar ? 'auto' : 'none',
        }}
        aria-hidden={!showNavbar}
      >
        {children}
      </div>

      {active && !showNavbar ? (
        <button
          type="button"
          className="sd-kiosk-reveal-btn"
          onClick={revealNavbar}
          aria-label={de ? 'Leiste einblenden' : 'Show top bar'}
          title={de ? 'Leiste einblenden' : 'Show top bar'}
          style={{
            position: 'fixed',
            top: 'max(8px, env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
            background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            opacity: 0.85,
            transition: 'opacity 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = 'var(--surface)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.85'
            e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 92%, transparent)'
          }}
        >
          <PanelTop size={14} strokeWidth={2.25} aria-hidden />
          <span>{de ? 'Leiste' : 'Menu'}</span>
        </button>
      ) : null}
    </>
  )
}
