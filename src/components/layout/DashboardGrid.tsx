'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { useDashboardStore } from '@/lib/store'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { WidgetWrapper } from '@/components/plugins/WidgetWrapper'
import { LayoutGrid } from 'lucide-react'
import { t } from '@/lib/i18n'
import type { PluginInstance } from '@/types'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const COLS = 12
const ROW_HEIGHT = 48
/** Schmal (unter 768px Rasterbreite): Handy, gestapelt. */
const PHONE_BREAKPOINT_PX = 768
/** Ab dieser Rasterbreite: Desktop (12 Spalten). Zwischen PHONE und diesem Wert: Tablet. */
const DESKTOP_BREAKPOINT_PX = 1024

function coerceZoom(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.min(1.5, Math.max(0.6, Math.round(n * 10) / 10))
}

function stackedRowBoost(pluginId: string): number {
  const raw = pluginRegistry.get(pluginId)?.meta.stackedExtraH
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(24, Math.round(n))
}

/** Handy: eine Spalte — h/minH aus layoutPhone falls gesetzt, sonst Desktop-layout. */
function buildStackedLayout(plugins: PluginInstance[]): Layout[] {
  const sorted = [...plugins].sort((a, b) => {
    const ay = a.layout?.y ?? 0
    const by = b.layout?.y ?? 0
    if (ay !== by) return ay - by
    return (a.layout?.x ?? 0) - (b.layout?.x ?? 0)
  })
  let y = 0
  return sorted.map((p) => {
    const boost = stackedRowBoost(p.pluginId)
    const base = p.layout
    const ph = p.layoutPhone ?? {}
    const baseH = Math.max(1, Math.round(ph.h !== undefined ? ph.h : base?.h ?? 4))
    const h = baseH + boost
    const minBase = Math.max(1, Math.round(ph.minH !== undefined ? ph.minH : base?.minH ?? 1))
    const minH = minBase + boost
    const item: Layout = {
      i: p.instanceId,
      x: 0,
      y,
      w: 1,
      h,
      minW: 1,
      minH,
    }
    y += h
    return item
  })
}

/** Tablet: 12 Spalten, Merge aus layout + layoutTablet. */
function buildTabletLayout(plugins: PluginInstance[]): Layout[] {
  return plugins.map((p) => {
    const base = p.layout
    const o = p.layoutTablet ?? {}
    const rawY = o.y !== undefined ? o.y : base.y
    const y = typeof rawY === 'number' && Number.isFinite(rawY) ? rawY : 0
    return {
      i: p.instanceId,
      x: o.x !== undefined ? o.x : base.x ?? 0,
      y,
      w: Math.max(1, Math.round(o.w !== undefined ? o.w : base.w ?? 4)),
      h: Math.max(1, Math.round(o.h !== undefined ? o.h : base.h ?? 4)),
      minW: o.minW ?? base.minW ?? 1,
      minH: o.minH ?? base.minH ?? 1,
    }
  })
}

export function DashboardGrid() {
  const {
    activeDashboard,
    editMode,
    locale,
    updatePluginLayout,
    updatePluginLayoutPhone,
    updatePluginLayoutTablet,
    dashboardZoom,
    gridGap,
    gridPadding,
  } = useDashboardStore()
  const zoom = coerceZoom(dashboardZoom)
  const dash = activeDashboard()
  const plugins = dash.plugins
  const measureRef = useRef<HTMLDivElement>(null)
  const scaleInnerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  /** Flow height after CSS transform:scale — without this, the browser keeps the unscaled layout height and leaves an empty band below the grid when zoom is below 1. */
  const [scaledWrapHeight, setScaledWrapHeight] = useState<number | null>(null)

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

  // Collapse vertical layout space to the *visual* height when zoom ≠ 1 (transform does not shrink document flow).
  useLayoutEffect(() => {
    if (zoom === 1) {
      setScaledWrapHeight(null)
      return
    }
    const el = scaleInnerRef.current
    if (!el) return
    const measure = () => {
      const h = el.getBoundingClientRect().height
      setScaledWrapHeight((prev) => {
        const next = Math.max(0, Math.ceil(h))
        return prev === next ? prev : next
      })
    }
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    const t0 = window.setTimeout(measure, 0)
    const t1 = window.setTimeout(measure, 120)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      ro.disconnect()
    }
  }, [zoom, containerWidth, plugins.length, gridGap, gridPadding, editMode])

  const isPhone = containerWidth < PHONE_BREAKPOINT_PX
  const isTablet = !isPhone && containerWidth < DESKTOP_BREAKPOINT_PX
  const layoutMode = isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop'
  const gridCols = isPhone ? 1 : COLS

  const desktopLayout: Layout[] = useMemo(
    () =>
      plugins.map((p) => {
        const rawY = p.layout?.y
        const y = typeof rawY === 'number' && Number.isFinite(rawY) ? rawY : 0
        return {
          i: p.instanceId,
          x: p.layout?.x ?? 0,
          y,
          w: p.layout?.w ?? 4,
          h: p.layout?.h ?? 4,
          minW: p.layout?.minW ?? 1,
          minH: p.layout?.minH ?? 1,
        }
      }),
    [plugins]
  )

  const stackedLayout = useMemo(() => buildStackedLayout(plugins), [plugins])
  const tabletLayout = useMemo(() => buildTabletLayout(plugins), [plugins])

  const gridLayout = isPhone ? stackedLayout : isTablet ? tabletLayout : desktopLayout

  const handleLayoutChange = useCallback(
    (next: Layout[]) => {
      if (layoutMode === 'phone') {
        next.forEach((item) => {
          const p = plugins.find((pr) => pr.instanceId === item.i)
          const boost = p ? stackedRowBoost(p.pluginId) : 0
          const prev = p?.layout
          if (!p) return
          const minStoreH = Math.max(1, p.layoutPhone?.minH ?? prev?.minH ?? 1)
          if (!prev) {
            const savedH = Math.max(1, item.h - boost)
            updatePluginLayoutPhone(item.i, { h: Math.max(minStoreH, savedH) })
            return
          }
          const savedH = Math.max(minStoreH, item.h - boost)
          updatePluginLayoutPhone(item.i, { h: savedH })
        })
        return
      }
      if (layoutMode === 'tablet') {
        next.forEach((item) => {
          const p = plugins.find((pr) => pr.instanceId === item.i)
          if (!p) return
          updatePluginLayoutTablet(item.i, {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          })
        })
        return
      }
      next.forEach((item) => {
        const p = plugins.find((pr) => pr.instanceId === item.i)
        updatePluginLayout(item.i, {
          ...(p?.layout ?? { x: 0, y: 0, w: 4, h: 4, minW: 1, minH: 1 }),
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })
      })
    },
    [layoutMode, plugins, updatePluginLayout, updatePluginLayoutPhone, updatePluginLayoutTablet]
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

  return (
    // Clip horizontal layout overflow from the widened pre-scale track (100/zoom %).
    // Do not cap that track with maxWidth: 100% — that breaks zoom < 1 (dead band on the right).
    <div
      style={{
        width: '100%',
        minWidth: 0,
        overflowX: zoom !== 1 ? 'hidden' : undefined,
        height: zoom !== 1 && scaledWrapHeight != null ? scaledWrapHeight : undefined,
        minHeight: zoom !== 1 ? 0 : undefined,
      }}
    >
      <div
        ref={scaleInnerRef}
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
            <span>
              {layoutMode === 'phone' ? t(locale, 'mobileStackHint') : layoutMode === 'tablet' ? t(locale, 'tabletLayoutHint') : t(locale, 'editModeHint')}
            </span>
          </div>
        )}

        <div ref={measureRef} style={{ width: '100%', minWidth: 0 }}>
        <GridLayout
          key={layoutMode}
          className="layout"
          layout={gridLayout}
          cols={gridCols}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          compactType={isPhone ? null : 'vertical'}
          isDraggable={editMode && !isPhone}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          margin={[gridGap, gridGap]}
          containerPadding={[0, 0]}
          draggableHandle=".drag-handle"
          resizeHandles={['se', 's', 'e']}
        >
          {plugins.map((instance) => (
            <div key={instance.instanceId} style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0 }}>
              <WidgetWrapper instance={instance} editMode={editMode} layoutMode={layoutMode} />
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
