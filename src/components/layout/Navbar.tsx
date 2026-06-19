'use client'

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Settings, Plus, Sun, Moon, Pencil, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { NavbarSearch } from '@/components/layout/NavbarSearch'
import { getNavbarSlots, getNavbarSlotsVersion, subscribeNavbarSlots } from '@/lib/pluginNavbarRegistry'
import { useNavbarCompact } from '@/components/layout/useNavbarCompact'
import { t } from '@/lib/i18n'
import { fetchRemoteCatalog, invalidateRemoteCatalogCache } from '@/lib/pluginRemoteCatalogClient'
import { AuthUserMenu, useAuthRole, useCanOpenPluginStore } from '@/components/layout/AuthUserMenu'
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

const SettingsModal = dynamic(
  () => import('@/components/ui/SettingsModal').then((m) => m.SettingsModal),
  { ssr: false },
)
const PluginStoreModal = dynamic(
  () => import('@/components/ui/PluginStoreModal').then((m) => m.PluginStoreModal),
  { ssr: false },
)

export function Navbar() {
  const router = useRouter()
  const dashboards = useDashboardStore((s) => s.dashboards)
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId)
  const editMode = useDashboardStore((s) => s.editMode)
  const setEditMode = useDashboardStore((s) => s.setEditMode)
  const locale = useDashboardStore((s) => s.locale)
  const activeDashboard = useDashboardStore((s) => s.activeDashboard)
  const toggleLightTheme = useDashboardStore((s) => s.toggleLightTheme)
  const showDashboardTabs = useDashboardStore((s) => s.showDashboardTabs)
  const navbarStyle = useDashboardStore((s) => s.navbarStyle)
  const navbarHideTextMobile = useDashboardStore((s) => s.navbarHideTextMobile)
  const dashboardZoom = useDashboardStore((s) => s.dashboardZoom)
  const setDashboardZoom = useDashboardStore((s) => s.setDashboardZoom)
  const navbarSearchEnabled = useDashboardStore((s) => s.navbarSearchEnabled)
  const navbarSearchPosition = useDashboardStore((s) => s.navbarSearchPosition)
  const navbarSearchProviders = useDashboardStore((s) => s.navbarSearchProviders)
  const navbarSearchCustomProviders = useDashboardStore((s) => s.navbarSearchCustomProviders)
  const navbarBackgroundImage = useDashboardStore((s) => s.navbarBackgroundImage)
  const navbarBackgroundOverlay = useDashboardStore((s) => s.navbarBackgroundOverlay)
  const dash = activeDashboard()
  const isLight = dash.theme === 'light'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [pluginUpdatesPending, setPluginUpdatesPending] = useState(0)
  const authRole = useAuthRole()
  const isAdmin = authRole === 'admin'
  const canOpenPluginStore = useCanOpenPluginStore()

  useEffect(() => {
    if (authRole !== 'admin') return
    const refreshUpdates = async (force = false) => {
      try {
        const j = await fetchRemoteCatalog(force ? { force: true } : undefined)
        setPluginUpdatesPending(j.updatesCount)
      } catch {
        setPluginUpdatesPending(0)
      }
    }
    const onOpenStore = () => setStoreOpen(true)
    void refreshUpdates()
    const onCatalog = () => {
      invalidateRemoteCatalogCache()
      void refreshUpdates(true)
    }
    window.addEventListener('sd-plugin-catalog-changed', onCatalog)
    window.addEventListener('sd-open-plugin-store', onOpenStore)
    return () => {
      window.removeEventListener('sd-plugin-catalog-changed', onCatalog)
      window.removeEventListener('sd-open-plugin-store', onOpenStore)
    }
  }, [authRole])

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
  // Wordmark auf dem Handy optional ausblenden → schafft Platz für die Dashboard-Tabs.
  const showWordmark = showText && !(navbarPhone && navbarHideTextMobile)
  const hasDashboardTabs = showDashboardTabs && dashboards.length > 1
  const renderDashboardTabs = (fullWidth: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '2px 0', maxWidth: fullWidth ? '100%' : 'min(52vw, 560px)' }}>
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
  )

  useSyncExternalStore(subscribeNavbarSlots, getNavbarSlotsVersion, () => 0)
  const navbarSlots = getNavbarSlots()

  const navBg = navbarBackgroundImage.trim()
  const overlay = Math.min(80, Math.max(0, Math.round(navbarBackgroundOverlay)))
  const navSurfaceStyle: CSSProperties = navBg
    ? {
        backgroundImage: `linear-gradient(color-mix(in srgb, var(--surface) ${overlay}%, transparent), color-mix(in srgb, var(--surface) ${Math.min(90, overlay + 12)}%, transparent)), url(${navBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: 'var(--surface)' }

  return (
    <>
      <nav
        style={{ ...navSurfaceStyle, borderBottom: '1px solid var(--border)', position: 'relative' }}
        className={`flex flex-col min-w-0 navbar-root${navbarPhone ? ' navbar-root--phone' : navbarCompact ? ' navbar-root--compact' : ''}`}
      >

        <div className="flex flex-wrap items-center gap-3 min-w-0 w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, minWidth: 0 }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showIcon && (
            dash.customLogo ? (
              <img src={dash.customLogo} alt="Logo" style={{ height: '34px', width: '34px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <img src="/shield.png" alt="SelfDashboard" style={{ height: '34px', width: '34px', objectFit: 'contain', flexShrink: 0 }} />
            )
          )}
          {showWordmark && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {showIcon && <div style={{ height: '26px', width: '3px', borderRadius: '2px', background: 'var(--accent)', flexShrink: 0 }} />}
              <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--brand-self)', fontFamily: 'var(--font-orbitron)' }}>
                Self<span style={{ color: 'var(--accent)' }}>Dashboard</span>
              </span>
            </div>
          )}
        </div>

        {hasDashboardTabs && !navbarPhone && renderDashboardTabs(false)}

        {searchInTopRow && navbarSearchPosition === 'left' && <NavbarSearch locale={locale} editMode={editMode} />}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {searchInTopRow && navbarSearchPosition === 'center' && <NavbarSearch locale={locale} editMode={editMode} />}
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: navbarPhone ? '4px' : '8px', flexShrink: 0 }}>
          {searchInTopRow && navbarSearchPosition === 'right' && <NavbarSearch locale={locale} editMode={editMode} />}
          {navbarSlots.map(({ id, component: Slot }) => {
            const C = Slot
            return <C key={id} locale={locale} />
          })}
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
            <button className="btn-ghost navbar-icon-btn" style={{ padding: navbarPhone ? 10 : 7 }} onClick={() => toggleLightTheme()}>
              {isLight ? <Moon size={navbarPhone ? 16 : 15} /> : <Sun size={navbarPhone ? 16 : 15} />}
            </button>
            <button className={editMode ? 'btn-accent navbar-icon-btn' : 'btn-ghost navbar-icon-btn'}
              style={editMode ? (navbarPhone ? { padding: '8px 10px' } : {}) : { padding: navbarPhone ? 10 : 7 }}
              onClick={() => setEditMode(!editMode)}>
              {editMode ? <><Check size={14} />{!navbarPhone && (locale === 'de' ? 'Fertig' : 'Done')}</> : <Pencil size={navbarPhone ? 16 : 15} />}
            </button>
            {editMode && canOpenPluginStore && (
              <button
                className="btn-accent"
                style={{ padding: '7px 10px', position: 'relative' }}
                onClick={() => setStoreOpen(true)}
                title={
                  isAdmin && pluginUpdatesPending > 0
                    ? t(locale, 'pluginUpdatesBadgeTitle')
                    : t(locale, 'addPlugin')
                }
              >
                <Plus size={17} />
                {isAdmin && pluginUpdatesPending > 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      border: '2px solid var(--surface)',
                    }}
                  />
                ) : null}
              </button>
            )}
            <button className="btn-ghost navbar-icon-btn" style={{ padding: navbarPhone ? 10 : 7 }} onClick={() => setSettingsOpen(true)}>
              <Settings size={navbarPhone ? 16 : 15} />
            </button>
            <AuthUserMenu locale={locale} />
          </div>
        </div>
        </div>

        {hasDashboardTabs && navbarPhone ? (
          <div className="w-full min-w-0" style={{ paddingTop: 2 }}>
            {renderDashboardTabs(true)}
          </div>
        ) : null}

        {searchFullWidthRow ? (
          <div className="w-full min-w-0" style={{ paddingBottom: 2 }}>
            <NavbarSearch locale={locale} editMode={editMode} fullBleed />
          </div>
        ) : null}
      </nav>

      {settingsOpen ? <SettingsModal open onClose={() => setSettingsOpen(false)} /> : null}
      {storeOpen ? <PluginStoreModal open onClose={() => setStoreOpen(false)} /> : null}
    </>
  )
}
