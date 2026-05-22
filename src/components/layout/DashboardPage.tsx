'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardStore, useDashboardStoreHydrated } from '@/lib/store'
import { Navbar } from '@/components/layout/Navbar'
import { KioskNavbarShell } from '@/components/layout/KioskNavbarShell'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { DashboardMain } from '@/components/layout/DashboardMain'
import { PluginBootstrap } from '@/components/plugins/PluginBootstrap'
import { PluginUpdateBanner } from '@/components/plugins/PluginUpdateBanner'
import { PluginMissingBanner } from '@/components/plugins/PluginMissingBanner'

function DashboardLoadingShell() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'var(--background)' }}
      aria-busy="true"
      aria-label="Loading dashboard"
    />
  )
}

export function DashboardPage({ id }: { id: string }) {
  const storeHydrated = useDashboardStoreHydrated()
  const { dashboards, setActiveDashboard, activeDashboardId, locale } = useDashboardStore()
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

  if (!storeHydrated) {
    return <DashboardLoadingShell />
  }

  return (
    <>
      <PluginBootstrap />
      <KioskNavbarShell locale={locale}>
        <Navbar />
        <PluginMissingBanner />
        <PluginUpdateBanner />
      </KioskNavbarShell>
      <DashboardMain>
        <DashboardGrid />
      </DashboardMain>
    </>
  )
}
