'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { getTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const activeDashboard = useDashboardStore((s) => s.activeDashboard)
  const dash = activeDashboard()
  const themeId = dash?.theme ?? 'dark'
  const customColors = dash?.customColors

  useEffect(() => {
    const t = getTheme(themeId)
    const root = document.documentElement
    root.setAttribute('data-theme', themeId)
    Object.entries(t.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })
    if (customColors) {
      Object.entries(customColors).forEach(([key, val]) => {
        if (val) root.style.setProperty(`--${key}`, val)
      })
    }
  }, [themeId, customColors])

  return <>{children}</>
}
