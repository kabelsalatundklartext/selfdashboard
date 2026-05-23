'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useDashboardStore } from '@/lib/store'
import { clampDashboardBackgroundOverlay } from '@/lib/dashboardBackground'

function overlayGradient(pct: number): string {
  const o = clampDashboardBackgroundOverlay(pct)
  const o2 = Math.min(90, o + 10)
  return `linear-gradient(color-mix(in srgb, var(--background) ${o}%, transparent), color-mix(in srgb, var(--background) ${o2}%, transparent))`
}

export function DashboardMain({ children }: { children: ReactNode }) {
  const mode = useDashboardStore((s) => s.dashboardBackgroundMode)
  const img1 = useDashboardStore((s) => s.dashboardBackgroundImage).trim()
  const img2 = useDashboardStore((s) => s.dashboardBackgroundImage2).trim()
  const overlay = useDashboardStore((s) => s.dashboardBackgroundOverlay)

  const base: CSSProperties = {
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    display: 'block',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'env(safe-area-inset-left, 0)',
    paddingRight: 'env(safe-area-inset-right, 0)',
    position: 'relative',
  }

  const hasSingle = mode === 'single' && img1
  const hasDual = mode === 'dual' && (img1 || img2)

  if (!hasSingle && !hasDual) {
    return (
      <main style={{ ...base, background: 'var(--background)' }}>
        {children}
      </main>
    )
  }

  const overlayLayer = (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: overlayGradient(overlay),
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )

  if (hasDual) {
    const leftBg = img1 || img2
    const rightBg = img2 || img1
    return (
      <main style={{ ...base, background: 'var(--background)' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 0 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              backgroundImage: leftBg ? `url(${leftBg})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              backgroundImage: rightBg ? `url(${rightBg})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderLeft: img1 && img2 ? '1px solid color-mix(in srgb, var(--border) 40%, transparent)' : undefined,
            }}
          />
        </div>
        {overlayLayer}
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      </main>
    )
  }

  return (
    <main
      style={{
        ...base,
        backgroundImage: `${overlayGradient(overlay)}, url(${img1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </main>
  )
}
