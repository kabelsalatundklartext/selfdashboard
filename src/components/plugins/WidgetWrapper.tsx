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

function coercePluginZoom(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.min(2, Math.max(0.5, Math.round(n * 10) / 10))
}

function coercePadding(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 8
  return Math.max(0, Math.min(48, Math.round(n)))
}

export function WidgetWrapper({ instance, editMode }: Props) {
  const [hovering, setHovering] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const { activeDashboard, removePlugin, updatePluginConfig, updatePluginLayout } = useDashboardStore()
  const dash = activeDashboard()
  const registered = pluginRegistry.get(instance.pluginId)

  const pluginZoom = coercePluginZoom(instance.config.__zoom)
  const pluginPadding = coercePadding(instance.config.__padding)
  const canZoomIn = pluginZoom < 2
  const canZoomOut = pluginZoom > 0.5

  const setPluginZoom = (zoom: number) =>
    updatePluginConfig(instance.instanceId, { __zoom: coercePluginZoom(zoom) })
  const setPluginPadding = (p: number) =>
    updatePluginConfig(instance.instanceId, { __padding: coercePadding(p) })
  const changeHeight = (delta: number) => {
    const h = Math.max(1, (instance.layout?.h ?? 4) + delta)
    updatePluginLayout(instance.instanceId, { ...instance.layout, h })
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

  // Compact control button style
  const ctrlBtn = (active = true): React.CSSProperties => ({
    padding: '2px 5px', background: 'none', border: 'none',
    cursor: active ? 'pointer' : 'default',
    color: active ? 'var(--text-muted)' : 'var(--border)',
    fontSize: '13px', fontWeight: 700, lineHeight: 1,
    display: 'flex', alignItems: 'center',
  })

  const ctrlBox: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: 'var(--surface)', borderRadius: '5px',
    border: '1px solid var(--border)', overflow: 'hidden',
  }

  return (
    <>
      <div
        className="widget-panel h-full"
        style={{ position: 'relative', padding: `${pluginPadding}px` }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Edit border */}
        {editMode && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '14px',
            pointerEvents: 'none', zIndex: 5,
            border: '2px dashed var(--accent)',
            opacity: hovering ? 0.7 : 0.3, transition: 'opacity 0.2s',
          }} />
        )}

        {/* Drag handle */}
        {editMode && (
          <div className="drag-handle" style={{
            position: 'absolute', top: '5px', left: '5px', zIndex: 15,
            background: 'var(--accent)', borderRadius: '5px',
            padding: '2px 4px', cursor: 'grab',
            opacity: hovering ? 0.9 : 0.4, transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center',
          }}>
            <GripVertical size={11} color="#fff" />
          </div>
        )}

        {/* Controls — top right, only in edit mode on hover */}
        {editMode && hovering && (
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '36px',
              right: '14px',
              zIndex: 15,
              display: 'flex',
              gap: '3px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              rowGap: '4px',
              maxWidth: 'calc(100% - 50px)',
              pointerEvents: 'auto',
            }}
          >
            {/* Zoom */}
            <div style={ctrlBox}>
              <button style={ctrlBtn(canZoomOut)} onClick={() => canZoomOut && setPluginZoom(pluginZoom - 0.1)}>
                <ZoomOut size={10} />
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '26px', textAlign: 'center', fontWeight: 600 }}>
                {Math.round(pluginZoom * 100)}%
              </span>
              <button style={ctrlBtn(canZoomIn)} onClick={() => canZoomIn && setPluginZoom(pluginZoom + 0.1)}>
                <ZoomIn size={10} />
              </button>
            </div>

            {/* Padding (horizontal spacing) */}
            <div style={ctrlBox}>
              <button style={ctrlBtn(pluginPadding > 0)} onClick={() => setPluginPadding(pluginPadding - 4)}>−</button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>↔</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{pluginPadding}</span>
              <button style={ctrlBtn(pluginPadding < 48)} onClick={() => setPluginPadding(pluginPadding + 4)}>+</button>
            </div>

            {/* Height */}
            <div style={ctrlBox}>
              <button style={ctrlBtn((instance.layout?.h ?? 4) > 1)} onClick={() => changeHeight(-1)}>−</button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>↕</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{instance.layout?.h ?? 4}</span>
              <button style={ctrlBtn()} onClick={() => changeHeight(1)}>+</button>
            </div>

            {/* Settings */}
            {hasSettings && (
              <button onClick={() => setConfigOpen(true)} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '5px', padding: '4px 5px', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}>
                <Settings size={11} />
              </button>
            )}

            {/* Remove */}
            <button onClick={() => removePlugin(instance.instanceId)} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '5px', padding: '4px 5px', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
            }}>
              <X size={11} />
            </button>
          </div>
        )}

        {/* Plugin slot: clip to panel; scale pre-layout size so visual bounds match panel (same idea as DashboardGrid). */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            containerType: 'size',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'top left',
              transform: pluginZoom !== 1 ? `scale(${pluginZoom})` : undefined,
              width: pluginZoom !== 1 ? `${100 / pluginZoom}%` : '100%',
              height: pluginZoom !== 1 ? `${100 / pluginZoom}%` : '100%',
              minWidth: 0,
              minHeight: 0,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Widget instanceId={instance.instanceId} config={instance.config} theme={dash.theme} editMode={editMode} />
            </div>
          </div>
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
