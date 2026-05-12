'use client'

import { useState } from 'react'
import { X, Settings } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import type { PluginInstance } from '@/types'

interface Props {
  instance: PluginInstance
}

export function WidgetWrapper({ instance }: Props) {
  const [hovering, setHovering] = useState(false)
  const { theme, removePlugin, updatePluginConfig } = useDashboardStore()
  const registered = pluginRegistry.get(instance.pluginId)

  if (!registered) {
    return (
      <div className="widget-panel items-center justify-center text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Plugin <strong>{instance.pluginId}</strong> not found
        </p>
        <button
          className="btn-ghost mt-2 text-xs"
          onClick={() => removePlugin(instance.instanceId)}
        >
          Remove
        </button>
      </div>
    )
  }

  const { Widget } = registered.component

  return (
    <div
      className="widget-panel group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Controls (visible on hover) */}
      {hovering && (
        <div
          className="absolute top-2 right-2 z-10 flex gap-1 animate-fade-in"
        >
          <button
            className="btn-ghost p-1"
            style={{ padding: '4px' }}
            title="Remove widget"
            onClick={() => removePlugin(instance.instanceId)}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Plugin widget */}
      <Widget
        instanceId={instance.instanceId}
        config={instance.config}
        theme={theme}
      />
    </div>
  )
}
