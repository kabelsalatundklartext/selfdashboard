'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Plus, Sun, Moon, Pencil, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { PluginStoreModal } from '@/components/ui/PluginStoreModal'
import { NavbarSearch } from '@/components/layout/NavbarSearch'
import { NavbarMail } from '@/components/layout/NavbarMail'
import { useNavbarCompact } from '@/components/layout/useNavbarCompact'
import { t } from '@/lib/i18n'
import { anySearchProviderEnabled } from '@/lib/searchProviders'

/** Wie NavbarSearch: unter Desktop volle Suchzeile, damit nichts in der Ecke gequetscht wird. */
const NAVBAR_STACK_SEARCH_MQ = '(max-width: 1023px)'

function subscribeNavbarStackSearch(cb: () => void) {
  const mq = window.matchMedia(NAVBAR_STACK_SEARCH_MQ)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function snapshotNavbarStackSearch() {
  return window.matchMedia(NAVBAR_STACK_SEARCH_MQ).matches
}

function serverSnapshotNavbarStackSearch() {
  return false
}

function DashboardIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  if (icon?.startsWith('data:') || icon?.startsWith('http'))
    return <img src={icon} alt="" style={{ width: size, height: size, borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
  return <span style={{ fontSize: size * 0.8, flexShrink: 0 }}>{icon || '📋'}</span>
}

export function Navbar() {
  const router = useRouter()
  const {
    dashboards, activeDashboardId, editMode, setEditMode, locale,
    activeDashboard, setTheme, showDashboardTabs, navbarStyle,
    dashboardZoom, setDashboardZoom,
    navbarSearchEnabled, navbarSearchPosition, navbarSearchProviders, navbarSearchCustomProviders,
  } = useDashboardStore()
  const dash = activeDashboard()
  const isLight = dash.theme === 'light'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)

  const showIcon = navbarStyle !== 'text-only'
  const showText = navbarStyle !== 'icon-only'

  const zoomStep = 0.1
  const z = typeof dashboardZoom === 'number' && Number.isFinite(dashboardZoom) ? dashboardZoom : Number(dashboardZoom) || 1
  const canZoomIn = z < 1.5
  const canZoomOut = z > 0.6

  const hasSearchProviders = anySearchProviderEnabled(navbarSearchProviders, navbarSearchCustomProviders)
  const showNavbarSearch = navbarSearchEnabled && hasSearchProviders

  const stackSearchBar = useSyncExternalStore(
    subscribeNavbarStackSearch,
    snapshotNavbarStackSearch,
    serverSnapshotNavbarStackSearch,
  )
  const searchInTopRow = showNavbarSearch && !stackSearchBar
  const searchFullWidthRow = showNavbarSearch && stackSearchBar
  const { compact: navbarCompact, phone: navbarPhone } = useNavbarCompact()

  return (
    <>
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        className={`sticky top-0 z-50 flex flex-col min-w-0 navbar-root${navbarPhone ? ' navbar-root--phone' : navbarCompact ? ' navbar-root--compact' : ''}`}>

        <div className="flex flex-wrap items-center gap-3 min-w-0 w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showIcon && (
            dash.customLogo ? (
              <img src={dash.customLogo} alt="Logo" style={{ height: '34px', width: '34px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '34px', width: '34px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 96 96" fill="none">
                  <rect x="13" y="13" width="36" height="36" rx="8" fill="white"/>
                  <rect x="53" y="13" width="28" height="17" rx="5" fill="white" opacity="0.75"/>
                  <rect x="53" y="33" width="28" height="17" rx="5" fill="white" opacity="0.45"/>
                  <rect x="13" y="53" width="17" height="28" rx="5" fill="white" opacity="0.5"/>
                  <rect x="34" y="53" width="47" height="28" rx="5" fill="white" opacity="0.9"/>
                </svg>
              </div>
            )
          )}
          {showText && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showIcon && <div style={{ height: '26px', width: '3px', borderRadius: '2px', background: 'var(--accent)', flexShrink: 0 }} />}
              <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
                Self<span style={{ color: 'var(--accent)' }}>Dashboard</span>
              </span>
            </div>
          )}
        </div>

        {showDashboardTabs && dashboards.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '2px 0', maxWidth: 'min(52vw, 560px)' }}>
            {dashboards.filter((d) => !d.hideTab).map((d) => (
              <button key={d.id} onClick={() => router.push(`/dashboard/${d.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: d.id === activeDashboardId ? 600 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  background: d.id === activeDashboardId ? 'var(--accent)' : 'transparent',
                  color: d.id === activeDashboardId ? '#fff' : 'var(--text-muted)',
                  border: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (d.id !== activeDashboardId) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                onMouseLeave={(e) => { if (d.id !== activeDashboardId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <DashboardIcon icon={d.icon} size={16} />
                {d.name}
              </button>
            ))}
          </div>
        )}

        {searchInTopRow && navbarSearchPosition === 'left' && <NavbarSearch locale={locale} editMode={editMode} />}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {searchInTopRow && navbarSearchPosition === 'center' && <NavbarSearch locale={locale} editMode={editMode} />}
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: navbarPhone ? '4px' : '8px', flexShrink: 0 }}>
          {searchInTopRow && navbarSearchPosition === 'right' && <NavbarSearch locale={locale} editMode={editMode} />}
          <NavbarMail locale={locale} />
          <div className="navbar-zoom" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--surface-2)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => canZoomOut && setDashboardZoom(z - zoomStep)}
              style={{ padding: '4px 6px', borderRadius: '5px', background: 'none', border: 'none', cursor: canZoomOut ? 'pointer' : 'not-allowed', color: canZoomOut ? 'var(--text-muted)' : 'var(--border)', display: 'flex' }}>
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(z * 100)}%
            </span>
            <button
              onClick={() => canZoomIn && setDashboardZoom(z + zoomStep)}
              style={{ padding: '4px 6px', borderRadius: '5px', background: 'none', border: 'none', cursor: canZoomIn ? 'pointer' : 'not-allowed', color: canZoomIn ? 'var(--text-muted)' : 'var(--border)', display: 'flex' }}>
              <ZoomIn size={14} />
            </button>
          </div>
          <div className="navbar-icon-group" style={{ display: 'flex', alignItems: 'center', gap: navbarPhone ? '4px' : '6px', flexShrink: 0 }}>
            <button className="btn-ghost navbar-icon-btn" style={{ padding: navbarPhone ? 10 : 7 }} onClick={() => setTheme(isLight ? 'dark' : 'light')}>
              {isLight ? <Moon size={navbarPhone ? 16 : 15} /> : <Sun size={navbarPhone ? 16 : 15} />}
            </button>
            <button className={editMode ? 'btn-accent navbar-icon-btn' : 'btn-ghost navbar-icon-btn'}
              style={editMode ? (navbarPhone ? { padding: '8px 10px' } : {}) : { padding: navbarPhone ? 10 : 7 }}
              onClick={() => setEditMode(!editMode)}>
              {editMode ? <><Check size={14} />{!navbarPhone && (locale === 'de' ? 'Fertig' : 'Done')}</> : <Pencil size={navbarPhone ? 16 : 15} />}
            </button>
            {editMode && (
              <button className="btn-accent" style={{ padding: '7px 10px' }}
                onClick={() => setStoreOpen(true)} title={t(locale, 'addPlugin')}>
                <Plus size={17} />
              </button>
            )}
            <button className="btn-ghost navbar-icon-btn" style={{ padding: navbarPhone ? 10 : 7 }} onClick={() => setSettingsOpen(true)}>
              <Settings size={navbarPhone ? 16 : 15} />
            </button>
          </div>
        </div>
        </div>

        {searchFullWidthRow ? (
          <div className="w-full min-w-0" style={{ paddingBottom: 2 }}>
            <NavbarSearch locale={locale} editMode={editMode} fullBleed />
          </div>
        ) : null}
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PluginStoreModal open={storeOpen} onClose={() => setStoreOpen(false)} />
    </>
  )
}
