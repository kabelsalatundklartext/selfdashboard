'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { useDashboardStore } from '@/lib/store'
import { WidgetWrapper } from '@/components/plugins/WidgetWrapper'
import { LayoutGrid } from 'lucide-react'
import { t } from '@/lib/i18n'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const COLS = 12
const ROW_HEIGHT = 48

function coerceZoom(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.min(1.5, Math.max(0.6, Math.round(n * 10) / 10))
}

export function DashboardGrid() {
  const { activeDashboard, editMode, locale, updatePluginLayout, dashboardZoom, gridGap, gridPadding } = useDashboardStore()
  const zoom = coerceZoom(dashboardZoom)
  const dash = activeDashboard()
  const plugins = dash.plugins
  const measureRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Measure the grid track width so columns use the full main area (avoids a dead band on the right).
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const apply = () => {
      // Inside a transformed ancestor, getBoundingClientRect() is in viewport (scaled) pixels.
      // GridLayout needs the CSS layout width — prefer offsetWidth, else undo zoom on rect width.
      const rectW = el.getBoundingClientRect().width
      const layoutW = el.offsetWidth > 0 ? el.offsetWidth : Math.ceil(rectW / zoom)
      const next = Math.max(200, Math.floor(layoutW))
      setContainerWidth((prev) => (prev === next ? prev : next))
    }

    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [gridPadding, zoom])

  const handleLayoutChange = useCallback(
    (layout: Layout[]) => {
      layout.forEach((item) => {
        updatePluginLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h })
      })
    },
    [updatePluginLayout]
  )

  if (plugins.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}
        className="animate-fade-in">
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutGrid size={36} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{t(locale, 'noWidgets')}</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>{t(locale, 'noWidgetsHint')}</p>
        </div>
      </div>
    )
  }

  const layout: Layout[] = plugins.map((p) => ({
    i: p.instanceId,
    x: p.layout?.x ?? 0,
    y: p.layout?.y ?? Infinity,
    w: p.layout?.w ?? 4,
    h: p.layout?.h ?? 4,
    minW: p.layout?.minW ?? 1,
    minH: p.layout?.minH ?? 1,
  }))

  return (
    // Clip horizontal layout overflow from the widened pre-scale track (100/zoom %).
    // Do not cap that track with maxWidth: 100% — that breaks zoom < 1 (dead band on the right).
    <div style={{ width: '100%', minWidth: 0, overflowX: zoom !== 1 ? 'hidden' : undefined }}>
      <div
        style={{
          transformOrigin: 'top left',
          transform: `scale(${zoom})`,
          width: zoom !== 1 ? `${100 / zoom}%` : '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          transition: 'transform 0.2s ease',
        }}
      >
      <div style={{ padding: `${gridPadding}px`, width: '100%', minWidth: 0, boxSizing: 'border-box' }} className="animate-fade-in">
        {editMode && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'var(--accent)18', border: '1px solid var(--accent)40', color: 'var(--accent)', fontSize: '13px' }}>
            <span>✏️</span>
            <span>{t(locale, 'editModeHint')}</span>
          </div>
        )}

        <div ref={measureRef} style={{ width: '100%', minWidth: 0 }}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          margin={[gridGap, gridGap]}
          containerPadding={[0, 0]}
          draggableHandle=".drag-handle"
          resizeHandles={['se', 's', 'e']}
        >
          {plugins.map((instance) => (
            <div key={instance.instanceId}>
              <WidgetWrapper instance={instance} editMode={editMode} />
            </div>
          ))}
        </GridLayout>
        </div>

        <style>{`
          .react-grid-item.react-grid-placeholder {
            background: var(--accent) !important;
            opacity: 0.12 !important;
            border-radius: 14px !important;
          }
          .react-resizable-handle {
            opacity: ${editMode ? '0.7' : '0'} !important;
            transition: opacity 0.2s;
            z-index: 20 !important;
          }
          .react-resizable-handle::after {
            border-color: var(--accent) !important;
          }
          /* South handle - bottom center */
          .react-resizable-handle-s {
            bottom: 0px !important;
            left: 50% !important;
            margin-left: -10px !important;
            cursor: s-resize !important;
            width: 20px !important;
            height: 10px !important;
          }
          /* East handle - right center */
          .react-resizable-handle-e {
            right: 0px !important;
            top: 50% !important;
            margin-top: -10px !important;
            cursor: e-resize !important;
            width: 10px !important;
            height: 20px !important;
          }
        `}</style>
      </div>
      </div>
    </div>
  )
}
