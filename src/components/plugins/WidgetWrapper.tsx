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
  const { activeDashboard, removePlugin } = useDashboardStore()
  const dash = activeDashboard()
  const registered = pluginRegistry.get(instance.pluginId)

  if (!registered) {
    return (
      <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Plugin <strong>{instance.pluginId}</strong> not found
        </p>
        <button className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }} onClick={() => removePlugin(instance.instanceId)}>
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
        style={{ position: 'relative' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit mode dashed border */}
        {editMode && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '14px', pointerEvents: 'none',
            border: `2px dashed var(--accent)`,
            opacity: hovering ? 0.8 : 0.3,
            transition: 'opacity 0.2s', zIndex: 10,
          }} />
        )}

        {/* Drag handle — only in edit mode */}
        {editMode && (
          <div
            className="drag-handle"
            style={{
              position: 'absolute', top: '8px', left: '8px', zIndex: 20,
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--accent)', borderRadius: '6px', padding: '3px 6px',
              cursor: 'grab', opacity: hovering ? 1 : 0.5, transition: 'opacity 0.2s',
            }}
          >
            <GripVertical size={12} color="#fff" />
          </div>
        )}

        {/* Controls top-right — only in edit mode */}
        {editMode && hovering && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 20, display: 'flex', gap: '4px' }}>
            {hasSettings && (
              <button
                onClick={() => setConfigOpen(true)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                title="Einstellungen"
              >
                <Settings size={13} />
              </button>
            )}
            <button
              onClick={() => removePlugin(instance.instanceId)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              title="Entfernen"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Plugin content */}
        <div style={editMode ? { pointerEvents: 'none', userSelect: 'none', paddingTop: '28px', height: '100%' } : { height: '100%' }}>
          <Widget instanceId={instance.instanceId} config={instance.config} theme={dash.theme} />
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
