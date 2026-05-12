'use client'

import { useState } from 'react'
import { X, GripVertical, Settings } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { PluginConfigModal } from '@/components/ui/PluginConfigModal'
import type { PluginInstance } from '@/types'

interface Props {
  instance: PluginInstance
  editMode?: boolean
}

export function WidgetWrapper({ instance, editMode }: Props) {
  const [hovering, setHovering] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const { theme, removePlugin } = useDashboardStore()
  const registered = pluginRegistry.get(instance.pluginId)

  if (!registered) {
    return (
      <div className="widget-panel items-center justify-center text-center h-full">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Plugin <strong>{instance.pluginId}</strong> not found
        </p>
        <button className="btn-ghost mt-2 text-xs" onClick={() => removePlugin(instance.instanceId)}>
          Remove
        </button>
      </div>
    )
  }

  const { Widget } = registered.component
  const hasSettings = !!registered.component.Settings

  return (
    <>
      <div
        className="widget-panel h-full"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit mode dashed border */}
        {editMode && (
          <div
            className="absolute inset-0 z-10 pointer-events-none rounded-[14px]"
            style={{
              border: '2px dashed var(--accent)',
              opacity: hovering ? 1 : 0.4,
              transition: 'opacity 0.2s',
            }}
          />
        )}

        {/* Drag handle */}
        {editMode && (
          <div
            className="drag-handle absolute top-2 left-2 z-20 flex items-center gap-1 rounded-md px-2 py-1 cursor-grab active:cursor-grabbing"
            style={{
              background: 'var(--accent)',
              opacity: hovering ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <GripVertical size={12} color="#fff" />
          </div>
        )}

        {/* Controls — top right */}
        {(hovering || editMode) && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            {/* Settings button — always shown on hover if plugin has settings */}
            {hasSettings && (
              <button
                className="rounded-md p-1.5 transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
                title="Plugin settings"
                onClick={() => setConfigOpen(true)}
              >
                <Settings size={13} />
              </button>
            )}
            {/* Remove */}
            <button
              className="rounded-md p-1.5 transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              title="Remove widget"
              onClick={() => removePlugin(instance.instanceId)}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Plugin widget content */}
        <div className={editMode ? 'pointer-events-none select-none mt-6 h-full' : 'h-full'}>
          <Widget instanceId={instance.instanceId} config={instance.config} theme={theme} />
        </div>
      </div>

      {/* Config Modal */}
      <PluginConfigModal
        instance={instance}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />
    </>
  )
}
