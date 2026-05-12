'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { getTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, customColors } = useDashboardStore()

  useEffect(() => {
    const t = getTheme(theme)
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Apply base theme
    Object.entries(t.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })
    // Override with custom colors if set
    if (customColors) {
      Object.entries(customColors).forEach(([key, val]) => {
        if (val) root.style.setProperty(`--${key}`, val)
      })
    }
  }, [theme, customColors])

  return <>{children}</>
}
