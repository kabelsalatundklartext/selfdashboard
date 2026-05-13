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
        style={{ position: 'relative', padding: `${pluginPadding}px`, overflow: 'hidden' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit border — pointer-events none so it doesn't block content */}
        {editMode && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '14px',
            pointerEvents: 'none', zIndex: 5,
            border: '2px dashed var(--accent)',
            opacity: hovering ? 0.7 : 0.3,
            transition: 'opacity 0.2s',
          }} />
        )}

        {/* Drag handle — small, top-left corner */}
        {editMode && (
          <div className="drag-handle" style={{
            position: 'absolute', top: '5px', left: '5px', zIndex: 15,
            background: 'var(--accent)', borderRadius: '5px',
            padding: '2px 4px', cursor: 'grab',
            opacity: hovering ? 0.9 : 0.4,
            transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center',
          }}>
            <GripVertical size={11} color="#fff" />
          </div>
        )}

        {/* Controls bar — floats over content, only on hover in edit mode */}
        {editMode && hovering && (
          <div style={{
            position: 'absolute', top: '5px', right: '5px', zIndex: 15,
            display: 'flex', gap: '3px', alignItems: 'center',
          }}>
            {/* Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', borderRadius: '5px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button onClick={() => canZoomOut && setPluginZoom(pluginZoom - 0.1)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: canZoomOut ? 'pointer' : 'default', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <ZoomOut size={10} />
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>
                {Math.round(pluginZoom * 100)}%
              </span>
              <button onClick={() => canZoomIn && setPluginZoom(pluginZoom + 0.1)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: canZoomIn ? 'pointer' : 'default', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <ZoomIn size={10} />
              </button>
            </div>

            {/* Padding */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', borderRadius: '5px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button onClick={() => pluginPadding > 0 && setPluginPadding(pluginPadding - 4)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: pluginPadding > 0 ? 'pointer' : 'default', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>−</button>
              <AlignCenter size={9} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{pluginPadding}</span>
              <button onClick={() => pluginPadding < 48 && setPluginPadding(pluginPadding + 4)}
                style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: pluginPadding < 48 ? 'pointer' : 'default', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>+</button>
            </div>

            {hasSettings && (
              <button onClick={() => setConfigOpen(true)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <Settings size={11} />
              </button>
            )}
            <button onClick={() => removePlugin(instance.instanceId)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '5px', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={11} />
            </button>
          </div>
        )}

        {/* Plugin content — NO paddingTop, controls float over it */}
        <div style={{ height: '100%', fontSize: pluginZoom !== 1 ? `${pluginZoom * 100}%` : undefined }}>
          <Widget instanceId={instance.instanceId} config={instance.config} theme={dash.theme} />
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
