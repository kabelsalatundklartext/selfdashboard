'use client'

import { useDashboardStore } from '@/lib/store'
import { WidgetWrapper } from '@/components/plugins/WidgetWrapper'
import { LayoutGrid } from 'lucide-react'

export function DashboardGrid() {
  const plugins = useDashboardStore((s) => s.plugins)

  if (plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <LayoutGrid size={36} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            No widgets yet
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Click <strong>Add Plugin</strong> in the top bar to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid gap-4 p-6 animate-fade-in"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        alignItems: 'start',
      }}
    >
      {plugins.map((instance) => (
        <div key={instance.instanceId} style={{ minHeight: '160px' }}>
          <WidgetWrapper instance={instance} />
        </div>
      ))}
    </div>
  )
}
