'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

const IDLE_MIN_SEC = 3
const IDLE_MAX_SEC = 60

function clampIdleSec(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 5
  return Math.min(IDLE_MAX_SEC, Math.max(IDLE_MIN_SEC, n))
}

type Props = {
  children: ReactNode
  locale: 'de' | 'en'
  idleSeconds?: number
  enabled?: boolean
  startHidden?: boolean
}

export function KioskNavbarShell({
  children,
  locale,
  idleSeconds = 5,
  enabled = true,
  startHidden = false,
}: Props) {
  const idleMs = clampIdleSec(idleSeconds) * 1000
  const active = enabled

  const [barVisible, setBarVisible] = useState(!startHidden)
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
    if (startHidden) {
      setBarVisible(false)
    } else {
      setBarVisible(true)
      scheduleHide()
    }
    return () => clearHideTimer()
  }, [active, startHidden, scheduleHide, clearHideTimer])

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
            top: 'max(6px, env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 22,
            padding: 0,
            borderRadius: 6,
            border: '1px solid color-mix(in srgb, var(--accent) 35%, var(--border))',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        >
          <ChevronDown size={14} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </>
  )
}
