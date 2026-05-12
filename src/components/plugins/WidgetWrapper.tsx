'use client'

import { useState } from 'react'
import { X, GripVertical, Settings, ZoomIn, ZoomOut } from 'lucide-react'
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
  const { activeDashboard, removePlugin, updatePluginConfig } = useDashboardStore()
  const dash = activeDashboard()
  const registered = pluginRegistry.get(instance.pluginId)

  // Per-plugin zoom stored in config
  const pluginZoom: number = (instance.config.__zoom as number) ?? 1
  const canZoomIn = pluginZoom < 2
  const canZoomOut = pluginZoom > 0.5

  const setPluginZoom = (zoom: number) => {
    updatePluginConfig(instance.instanceId, { __zoom: Math.round(zoom * 10) / 10 })
  }

  if (!registered) {
    return (
      <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Plugin <strong>{instance.pluginId}</strong> not found</p>
        <button className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }} onClick={() => removePlugin(instance.instanceId)}>Remove</button>
      </div>
    )
  }

  const { Widget } = registered.component
  const hasSettings = !!registered.component.Settings

  return (
    <>
      <div
        className="widget-panel h-full"
        style={{ position: 'relative', overflow: 'hidden' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit mode border */}
        {editMode && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: '14px', pointerEvents: 'none', border: `2px dashed var(--accent)`, opacity: hovering ? 0.8 : 0.3, transition: 'opacity 0.2s', zIndex: 10 }} />
        )}

        {/* Drag handle */}
        {editMode && (
          <div className="drag-handle" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 20, display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent)', borderRadius: '6px', padding: '3px 6px', cursor: 'grab', opacity: hovering ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <GripVertical size={12} color="#fff" />
          </div>
        )}

        {/* Controls — only in edit mode on hover */}
        {editMode && hovering && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 20, display: 'flex', gap: '4px', alignItems: 'center' }}>
            {/* Plugin zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', background: 'var(--surface-2)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
              <button onClick={() => canZoomOut && setPluginZoom(pluginZoom - 0.1)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: canZoomOut ? 'pointer' : 'not-allowed', color: 'var(--text-muted)', display: 'flex' }}>
                <ZoomOut size={12} />
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '28px', textAlign: 'center', fontWeight: 600 }}>
                {Math.round(pluginZoom * 100)}%
              </span>
              <button onClick={() => canZoomIn && setPluginZoom(pluginZoom + 0.1)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: canZoomIn ? 'pointer' : 'not-allowed', color: 'var(--text-muted)', display: 'flex' }}>
                <ZoomIn size={12} />
              </button>
            </div>

            {hasSettings && (
              <button onClick={() => setConfigOpen(true)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <Settings size={13} />
              </button>
            )}
            <button onClick={() => removePlugin(instance.instanceId)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Plugin content with per-plugin zoom */}
        <div style={{
          height: '100%',
          ...(editMode ? { pointerEvents: 'none', userSelect: 'none', paddingTop: '28px' } : {}),
        }}>
          <div style={{
            transform: `scale(${pluginZoom})`,
            transformOrigin: 'top left',
            width: pluginZoom !== 1 ? `${100 / pluginZoom}%` : '100%',
            height: pluginZoom !== 1 ? `${100 / pluginZoom}%` : '100%',
            transition: 'transform 0.15s ease',
          }}>
            <Widget instanceId={instance.instanceId} config={instance.config} theme={dash.theme} />
          </div>
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
