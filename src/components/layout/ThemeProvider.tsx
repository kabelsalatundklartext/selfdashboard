'use client'

import { useEffect, useRef } from 'react'
import { useDashboardStore } from '@/lib/store'
import { getTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Direkt die Theme-Werte abonnieren (nicht die stabile activeDashboard-Funktion),
  // sonst rendert der Provider bei Theme-/Farbwechsel nicht neu → Theme greift erst nach Reload.
  const themeId = useDashboardStore((s) => s.dashboards.find((d) => d.id === s.activeDashboardId)?.theme ?? 'self')
  const customColors = useDashboardStore((s) => s.dashboards.find((d) => d.id === s.activeDashboardId)?.customColors)
  const appliedCustom = useRef<string[]>([])

  useEffect(() => {
    const t = getTheme(themeId)
    const root = document.documentElement
    // Zuvor gesetzte Eigenfarben entfernen, damit nach dem Zurücksetzen keine
    // veralteten Inline-Variablen kleben bleiben.
    for (const key of appliedCustom.current) root.style.removeProperty(`--${key}`)
    appliedCustom.current = []
    root.setAttribute('data-theme', themeId)
    Object.entries(t.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })
    if (customColors) {
      Object.entries(customColors).forEach(([key, val]) => {
        if (val) {
          root.style.setProperty(`--${key}`, val)
          appliedCustom.current.push(key)
        }
      })
    }
  }, [themeId, customColors])

  return <>{children}</>
}
