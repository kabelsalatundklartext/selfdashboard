'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardStore } from '@/lib/store'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { PluginBootstrap } from '@/components/plugins/PluginBootstrap'

export function DashboardPage({ id }: { id: string }) {
  const { dashboards, setActiveDashboard, activeDashboardId } = useDashboardStore()
  const router = useRouter()

  useEffect(() => {
    const exists = dashboards.find((d) => d.id === id)
    if (exists) {
      setActiveDashboard(id)
    } else if (dashboards.length > 0) {
      // Dashboard not found → redirect to first
      router.replace(`/dashboard/${dashboards[0].id}`)
    }
  }, [id, dashboards, setActiveDashboard, router])

  return (
    <>
      <PluginBootstrap />
      <Navbar />
      <main
        style={{
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          background: 'var(--background)',
          display: 'block',
          paddingBottom: 0,
        }}
      >
        <DashboardGrid />
      </main>
    </>
  )
}
