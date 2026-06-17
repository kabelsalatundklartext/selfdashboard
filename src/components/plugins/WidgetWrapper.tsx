'use client'

import { useState, useSyncExternalStore } from 'react'
import { X, GripVertical, Settings, ZoomIn, ZoomOut, Box, Loader2, Copy, Check } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import {
  getPluginVolumeLoadPhase,
  getPluginVolumeLoadServerSnapshot,
  getPluginVolumeLoadVersion,
  subscribePluginVolumeLoad,
} from '@/lib/pluginVolumeLoad'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { useCanUsePlugin } from '@/components/layout/AuthUserMenu'
import { PluginConfigModal } from '@/components/ui/PluginConfigModal'
import { Portal } from '@/components/ui/Portal'
import type { PluginInstance } from '@/types'

export type WidgetLayoutMode = 'phone' | 'tablet' | 'desktop'

const GRID_COLS = 12

interface Props {
  instance: PluginInstance
  editMode?: boolean
  layoutMode?: WidgetLayoutMode
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

export function WidgetWrapper({ instance, editMode, layoutMode = 'desktop' }: Props) {
  const [hovering, setHovering] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copiedTo, setCopiedTo] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const { activeDashboard, dashboards, copyPluginToDashboard, removePlugin, updatePluginConfig, updatePluginLayout, updatePluginLayoutPhone, updatePluginLayoutTablet, locale } =
    useDashboardStore()
  const volumePhase = useSyncExternalStore(
    subscribePluginVolumeLoad,
    getPluginVolumeLoadPhase,
    getPluginVolumeLoadServerSnapshot,
  )
  useSyncExternalStore(subscribePluginVolumeLoad, getPluginVolumeLoadVersion, () => 0)
  const dash = activeDashboard()
  const pluginAllowed = useCanUsePlugin(instance.pluginId)
  const registered = pluginRegistry.get(instance.pluginId)
  const volumeStillLoading = (volumePhase === 'pending' || volumePhase === 'loading') && !registered

  const pluginZoom = coercePluginZoom(instance.config.__zoom)
  const pluginPadding = coercePadding(instance.config.__padding)
  const canZoomIn = pluginZoom < 2
  const canZoomOut = pluginZoom > 0.5

  const setPluginZoom = (zoom: number) =>
    updatePluginConfig(instance.instanceId, { __zoom: coercePluginZoom(zoom) })
  const setPluginPadding = (p: number) =>
    updatePluginConfig(instance.instanceId, { __padding: coercePadding(p) })
  const base = instance.layout
  const metaLayout = registered?.meta.defaultLayout
  const toolbarH =
    layoutMode === 'phone'
      ? (instance.layoutPhone?.h ?? base.h ?? 4)
      : layoutMode === 'tablet'
        ? (instance.layoutTablet?.h ?? base.h ?? 4)
        : (base.h ?? 4)
  const minToolbarH =
    layoutMode === 'phone'
      ? Math.max(1, instance.layoutPhone?.minH ?? base.minH ?? 1)
      : layoutMode === 'tablet'
        ? Math.max(1, instance.layoutTablet?.minH ?? base.minH ?? 1)
        : Math.max(1, metaLayout?.minH ?? base.minH ?? 1)
  const toolbarW =
    layoutMode === 'phone'
      ? 1
      : layoutMode === 'tablet'
        ? (instance.layoutTablet?.w ?? base.w ?? 4)
        : (base.w ?? 4)
  const minToolbarW = Math.max(1, metaLayout?.minW ?? base.minW ?? 1)
  const maxToolbarW = Math.min(GRID_COLS, metaLayout?.maxW ?? base.maxW ?? GRID_COLS)

  const changeHeight = (delta: number) => {
    const h = Math.max(minToolbarH, toolbarH + delta)
    if (layoutMode === 'phone') updatePluginLayoutPhone(instance.instanceId, { h })
    else if (layoutMode === 'tablet') updatePluginLayoutTablet(instance.instanceId, { h })
    else updatePluginLayout(instance.instanceId, { ...instance.layout, h })
  }

  const changeWidth = (delta: number) => {
    if (layoutMode === 'phone') return
    const w = Math.max(minToolbarW, Math.min(maxToolbarW, toolbarW + delta))
    if (layoutMode === 'tablet') updatePluginLayoutTablet(instance.instanceId, { w })
    else updatePluginLayout(instance.instanceId, { ...instance.layout, w })
  }

  const otherDashboards = dashboards.filter((d) => d.id !== dash.id)
  const handleCopyTo = (targetId: string, targetName: string) => {
    const newId = copyPluginToDashboard(instance.instanceId, targetId)
    setCopyOpen(false)
    if (newId) {
      setCopiedTo(targetName)
      setTimeout(() => setCopiedTo(null), 2000)
    }
  }

  if (!pluginAllowed) {
    return (
      <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12 }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {locale === 'de'
            ? `Plugin „${instance.pluginId}“ ist für dein Konto nicht freigegeben.`
            : `Plugin “${instance.pluginId}” is not allowed for your account.`}
        </p>
        {editMode ? (
          <button className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }} onClick={() => removePlugin(instance.instanceId)}>
            {t(locale, 'removeWidget')}
          </button>
        ) : null}
      </div>
    )
  }

  if (!registered) {
    if (volumeStillLoading) {
      return (
        <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
          <Loader2 size={20} className="sd-widget-load-spin" style={{ color: 'var(--accent)' }} aria-hidden />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{t(locale, 'pluginLoading')}</p>
        </div>
      )
    }
    return (
      <div className="widget-panel h-full" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t(locale, 'pluginNotFound')} <strong>{instance.pluginId}</strong>
        </p>
        <button className="btn-ghost" style={{ marginTop: '8px', fontSize: '12px' }} onClick={() => removePlugin(instance.instanceId)}>
          {t(locale, 'removeWidget')}
        </button>
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
            position: 'absolute', top: '5px', left: '5px', zIndex: 100,
            background: 'var(--accent)', borderRadius: '5px',
            padding: '2px 4px', cursor: 'grab',
            opacity: hovering ? 0.9 : 0.4, transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center',
          }}>
            <GripVertical size={11} color="#fff" />
          </div>
        )}

        {/* Controls — top right, only in edit mode on hover */}
        {editMode && (hovering || layoutMode !== 'desktop') && (
          <div
            style={{
              position: 'absolute',
              top: '5px',
              left: '36px',
              right: '14px',
              zIndex: 100,
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

            {/* Grid width (columns) — not on phone stack */}
            {layoutMode !== 'phone' && (
              <div style={ctrlBox} title="Breite (Spalten)">
                <button style={ctrlBtn(toolbarW > minToolbarW)} onClick={() => changeWidth(-1)}>−</button>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>↔</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{toolbarW}</span>
                <button style={ctrlBtn(toolbarW < maxToolbarW)} onClick={() => changeWidth(1)}>+</button>
              </div>
            )}

            {/* Inner padding (px) */}
            <div style={ctrlBox} title="Innenabstand (px)">
              <button style={ctrlBtn(pluginPadding > 0)} onClick={() => setPluginPadding(pluginPadding - 4)}>−</button>
              <Box size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{pluginPadding}</span>
              <button style={ctrlBtn(pluginPadding < 48)} onClick={() => setPluginPadding(pluginPadding + 4)}>+</button>
            </div>

            {/* Height */}
            <div style={ctrlBox} title="Höhe (Zeilen)">
              <button style={ctrlBtn(toolbarH > minToolbarH)} onClick={() => changeHeight(-1)}>−</button>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>↕</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{toolbarH}</span>
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

            {/* Copy to other dashboard */}
            {otherDashboards.length > 0 && (
              <button
                onClick={(e) => {
                  if (copyOpen) { setCopyOpen(false); return }
                  const r = e.currentTarget.getBoundingClientRect()
                  setMenuPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) })
                  setCopyOpen(true)
                }}
                title={locale === 'de' ? 'Auf anderes Dashboard kopieren' : 'Copy to another dashboard'}
                style={{
                  background: copyOpen ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${copyOpen ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '5px', padding: '4px 5px', cursor: 'pointer',
                  color: copyOpen ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
              >
                <Copy size={11} />
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

        {/* Copy-to-dashboard dropdown (Portal: escapes the panel's overflow:hidden) */}
        {editMode && copyOpen && menuPos && otherDashboards.length > 0 && (
          <Portal>
            <div
              onClick={() => setCopyOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 4999 }}
            />
            <div
              style={{
                position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 5000,
                minWidth: '180px', maxWidth: '240px', maxHeight: '260px', overflowY: 'auto',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '4px 6px 6px' }}>
                {locale === 'de' ? 'Kopieren nach…' : 'Copy to…'}
              </p>
              {otherDashboards.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleCopyTo(d.id, d.name)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 8px', borderRadius: '6px', cursor: 'pointer',
                    background: 'none', border: 'none', textAlign: 'left',
                    color: 'var(--text)', fontSize: '13px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>{d.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                </button>
              ))}
            </div>
          </Portal>
        )}

        {/* Copy success toast (Portal) */}
        {copiedTo && menuPos && (
          <Portal>
            <div style={{
              position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 5000,
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--accent)', color: '#fff',
              borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}>
              <Check size={13} />
              {locale === 'de' ? `Kopiert → ${copiedTo}` : `Copied → ${copiedTo}`}
            </div>
          </Portal>
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
            zIndex: 1,
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
              <Widget
                instanceId={instance.instanceId}
                config={instance.config}
                theme={dash.theme}
                editMode={editMode}
                layoutMode={layoutMode}
              />
            </div>
          </div>
        </div>
      </div>

      <PluginConfigModal instance={instance} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}
