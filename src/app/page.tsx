import { Navbar } from '@/components/layout/Navbar'
import { DashboardGrid } from '@/components/layout/DashboardGrid'
import { PluginBootstrap } from '@/components/plugins/PluginBootstrap'

export default function DashboardPage() {
  return (
    <>
      <PluginBootstrap />
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        <DashboardGrid />
      </main>
    </>
  )
}
