'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { getTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeDashboard } = useDashboardStore()
  const dash = activeDashboard()

  useEffect(() => {
    const t = getTheme(dash.theme)
    const root = document.documentElement
    root.setAttribute('data-theme', dash.theme)
    Object.entries(t.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })
    if (dash.customColors) {
      Object.entries(dash.customColors).forEach(([key, val]) => {
        if (val) root.style.setProperty(`--${key}`, val)
      })
    }
  }, [dash.theme, dash.customColors])

  return <>{children}</>
}
