'use client'

import { useEffect, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginWidgetProps } from '@/types'

export const meta: PluginMeta = {
  id: 'clock',
  name: 'Clock & Date',
  description: 'Displays the current time and date with timezone support.',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🕐',
  configSchema: [
    { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Europe/Berlin', defaultValue: '' },
    { key: 'format24h', label: '24h Format', type: 'boolean', defaultValue: true },
  ],
}

function Widget({ config }: PluginWidgetProps) {
  const [now, setNow] = useState(new Date())
  const tz = (config.timezone as string) || undefined
  const is24h = config.format24h !== false

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('de-DE', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !is24h,
  })

  const dateStr = now.toLocaleDateString('de-DE', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-1 py-2">
      <p
        className="text-4xl font-bold tabular-nums tracking-tight"
        style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}
      >
        {timeStr}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {dateStr}
      </p>
    </div>
  )
}

export const component: PluginComponent = { Widget }
