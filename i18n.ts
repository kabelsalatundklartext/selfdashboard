'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { getTheme } from '@/lib/themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useDashboardStore((s) => s.theme)

  useEffect(() => {
    const t = getTheme(theme)
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    Object.entries(t.colors).forEach(([key, val]) => {
      root.style.setProperty(`--${key}`, val)
    })
  }, [theme])

  return <>{children}</>
}
