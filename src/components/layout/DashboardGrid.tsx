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
const ROW_HEIGHT = 60

export function DashboardGrid() {
  const { plugins, editMode, locale, updatePluginLayout } = useDashboardStore()
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
        updatePluginLayout(item.i, {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })
      })
    },
    [updatePluginLayout]
  )

  if (plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <LayoutGrid size={36} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            {t(locale, 'noWidgets')}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'noWidgetsHint')}
          </p>
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
    minW: p.layout?.minW ?? 2,
    minH: p.layout?.minH ?? 2,
  }))

  return (
    <div className="p-6 animate-fade-in">
      {/* Edit mode indicator */}
      {editMode && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
          style={{
            background: 'var(--accent)22',
            border: '1px solid var(--accent)44',
            color: 'var(--accent)',
          }}
        >
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
        margin={[16, 16]}
        containerPadding={[0, 0]}
        draggableHandle=".drag-handle"
        resizeHandles={['se']}
      >
        {plugins.map((instance) => (
          <div key={instance.instanceId}>
            <WidgetWrapper instance={instance} editMode={editMode} />
          </div>
        ))}
      </GridLayout>

      {/* Grid overlay hint in edit mode */}
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: var(--accent) !important;
          opacity: 0.15 !important;
          border-radius: 12px !important;
        }
        .react-resizable-handle::after {
          border-color: var(--accent) !important;
        }
        .react-resizable-handle {
          opacity: ${editMode ? '1' : '0'};
        }
      `}</style>
    </div>
  )
}
