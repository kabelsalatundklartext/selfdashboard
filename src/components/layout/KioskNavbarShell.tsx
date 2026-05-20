'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
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
 * Wand-Tablet / Kiosk: Navbar nach Inaktivität ausblenden (ohne Layout-Lücke).
 * Wieder einblenden nur über den „Leiste“-Button — Maus/Klicks auf Widgets öffnen sie nicht.
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
    return () => clearHideTimer()
  }, [active, scheduleHide, clearHideTimer])

  const de = locale === 'de'

  if (!active) {
    return (
      <div className="sd-kiosk-navbar-wrap sticky top-0 z-50 flex-shrink-0" style={{ minWidth: 0 }}>
        {children}
      </div>
    )
  }

  return (
    <>
      <div
        className="sd-kiosk-navbar-wrap"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          pointerEvents: showNavbar ? 'auto' : 'none',
        }}
        aria-hidden={!showNavbar}
        onPointerDown={() => {
          if (barVisible) scheduleHide()
        }}
      >
        {children}
      </div>

      {!showNavbar ? (
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
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--border))',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.28)',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.92'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <ChevronDown size={12} strokeWidth={2.5} aria-hidden />
          <span>{de ? 'Leiste' : 'Menu'}</span>
        </button>
      ) : null}
    </>
  )
}
