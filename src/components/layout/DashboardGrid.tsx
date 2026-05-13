'use client'

import { useCallback, useEffect, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { useDashboardStore } from '@/lib/store'
import { WidgetWrapper } from '@/components/plugins/WidgetWrapper'
import { LayoutGrid } from 'lucide-react'
import { t } from '@/lib/i18n'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const COLS = 12
const ROW_HEIGHT = 48

export function DashboardGrid() {
  const { activeDashboard, editMode, locale, updatePluginLayout, dashboardZoom, gridGap, gridPadding } = useDashboardStore()
  const dash = activeDashboard()
  const plugins = dash.plugins
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const update = () => setContainerWidth(window.innerWidth - 48)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

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
    minW: 2, minH: 2,
  }))

  return (
    // Zoom wrapper — scales the whole grid
    <div style={{
      transformOrigin: 'top left',
      transform: `scale(${dashboardZoom})`,
      width: dashboardZoom !== 1 ? `${100 / dashboardZoom}%` : '100%',
      transition: 'transform 0.2s ease',
    }}>
      <div style={{ padding: `${gridPadding}px` }} className="animate-fade-in">
        {editMode && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'var(--accent)18', border: '1px solid var(--accent)40', color: 'var(--accent)', fontSize: '13px' }}>
            <span>✏️</span>
            <span>{t(locale, 'editModeHint')}</span>
          </div>
        )}

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

        <style>{`
          .react-grid-item.react-grid-placeholder {
            background: var(--accent) !important;
            opacity: 0.12 !important;
            border-radius: 14px !important;
          }
          .react-resizable-handle {
            opacity: ${editMode ? '0.7' : '0'} !important;
            transition: opacity 0.2s;
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
  )
}
