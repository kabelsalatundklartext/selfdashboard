'use client'

import { useState } from 'react'
import { X, GripVertical, Settings, ZoomIn, ZoomOut, AlignCenter } from 'lucide-react'
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

  const pluginZoom: number = (instance.config.__zoom as number) ?? 1
  const pluginPadding: number = (instance.config.__padding as number) ?? 8
  const canZoomIn = pluginZoom < 2
  const canZoomOut = pluginZoom > 0.5

  const setPluginZoom = (zoom: number) =>
    updatePluginConfig(instance.instanceId, { __zoom: Math.round(zoom * 10) / 10 })

  const setPluginPadding = (padding: number) =>
    updatePluginConfig(instance.instanceId, { __padding: padding })

  if (!registered) {
    return (
      <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Plugin <strong>{instance.pluginId}</strong> not found
        </p>
        <button className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }}
          onClick={() => removePlugin(instance.instanceId)}>Remove</button>
      </div>
    )
  }

  const { Widget } = registered.component
  const hasSettings = !!registered.component.Settings

  return (
    <>
      <div
        className="widget-panel h-full"
        style={{ position: 'relative', padding: `${pluginPadding}px` }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit mode border */}
        {editMode && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '14px',
            pointerEvents: 'none', zIndex: 10,
            border: `2px dashed var(--accent)`,
            opacity: hovering ? 0.8 : 0.35,
            transition: 'opacity 0.2s',
          }} />
        )}

        {/* Drag handle */}
        {editMode && (
          <div className="drag-handle" style={{
            position: 'absolute', top: '6px', left: '6px', zIndex: 20,
            display: 'flex', alignItems: 'center',
            background: 'var(--accent)', borderRadius: '6px',
            padding: '3px 5px', cursor: 'grab',
            opacity: hovering ? 1 : 0.5, transition: 'opacity 0.2s',
          }}>
            <GripVertical size={12} color="#fff" />
          </div>
        )}

        {/* Controls — top right, only in edit mode on hover */}
        {editMode && hovering && (
          <div style={{
            position: 'absolute', top: '6px', right: '6px', zIndex: 20,
            display: 'flex', gap: '4px', alignItems: 'center',
          }}>
            {/* Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)', gap: '1px' }}>
              <button onClick={() => canZoomOut && setPluginZoom(pluginZoom - 0.1)}
                style={{ padding: '3px 4px', background: 'none', border: 'none', cursor: canZoomOut ? 'pointer' : 'default', color: 'var(--text-muted)', display: 'flex' }}>
                <ZoomOut size={11} />
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '26px', textAlign: 'center', fontWeight: 600 }}>
                {Math.round(pluginZoom * 100)}%
              </span>
              <button onClick={() => canZoomIn && setPluginZoom(pluginZoom + 0.1)}
                style={{ padding: '3px 4px', background: 'none', border: 'none', cursor: canZoomIn ? 'pointer' : 'default', color: 'var(--text-muted)', display: 'flex' }}>
                <ZoomIn size={11} />
              </button>
            </div>

            {/* Padding */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)', gap: '1px' }}>
              <button onClick={() => pluginPadding > 0 && setPluginPadding(pluginPadding - 4)}
                style={{ padding: '3px 4px', background: 'none', border: 'none', cursor: pluginPadding > 0 ? 'pointer' : 'default', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>
                −
              </button>
              <AlignCenter size={10} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '18px', textAlign: 'center', fontWeight: 600 }}>
                {pluginPadding}
              </span>
              <button onClick={() => pluginPadding < 48 && setPluginPadding(pluginPadding + 4)}
                style={{ padding: '3px 4px', background: 'none', border: 'none', cursor: pluginPadding < 48 ? 'pointer' : 'default', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>
                +
              </button>
            </div>

            {/* Settings */}
            {hasSettings && (
              <button onClick={() => setConfigOpen(true)}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <Settings size={12} />
              </button>
            )}

            {/* Remove */}
            <button onClick={() => removePlugin(instance.instanceId)}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Plugin content — simple, no transform scaling */}
        <div style={{
          height: '100%',
          paddingTop: editMode ? '28px' : '0',
          boxSizing: 'border-box',
          fontSize: pluginZoom !== 1 ? `${pluginZoom * 100}%` : undefined,
        }}>
          <Widget instanceId={instance.instanceId} config={instance.config} theme={dash.theme} />
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
