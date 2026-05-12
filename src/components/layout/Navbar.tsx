'use client'

import { useState } from 'react'
import { Settings, Plus, Sun, Moon, Pencil, Check, LayoutDashboard, Trash2 } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { PluginStoreModal } from '@/components/ui/PluginStoreModal'
import { Portal } from '@/components/ui/Portal'
import { t } from '@/lib/i18n'

export function Navbar() {
  const {
    dashboards, activeDashboardId, setActiveDashboard,
    addDashboard, removeDashboard,
    editMode, setEditMode, locale, activeDashboard,
  } = useDashboardStore()

  const dash = activeDashboard()
  const isLight = dash.theme === 'light'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [dashMenuOpen, setDashMenuOpen] = useState(false)
  const [newDashName, setNewDashName] = useState('')
  const [newDashIcon, setNewDashIcon] = useState('📋')

  const { setTheme } = useDashboardStore()

  const handleAddDashboard = () => {
    if (!newDashName.trim()) return
    addDashboard(newDashName.trim(), newDashIcon)
    setNewDashName('')
    setNewDashIcon('📋')
    setDashMenuOpen(false)
  }

  return (
    <>
      <nav
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {dash.customLogo ? (
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
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ height: '26px', width: '3px', borderRadius: '2px', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              Self<span style={{ color: 'var(--accent)' }}>Dashboard</span>
            </span>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflowX: 'auto', padding: '2px 0' }}>
          {dashboards.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDashboard(d.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '8px', fontSize: '13px',
                fontWeight: d.id === activeDashboardId ? 600 : 400,
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                background: d.id === activeDashboardId ? 'var(--accent)' : 'transparent',
                color: d.id === activeDashboardId ? '#fff' : 'var(--text-muted)',
                border: d.id === activeDashboardId ? 'none' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (d.id !== activeDashboardId) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { if (d.id !== activeDashboardId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span>{d.icon}</span>
              {d.name}
              {editMode && dashboards.length > 1 && d.id === activeDashboardId && (
                <span
                  onClick={(e) => { e.stopPropagation(); removeDashboard(d.id) }}
                  style={{ marginLeft: '2px', opacity: 0.7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={11} />
                </span>
              )}
            </button>
          ))}

          {/* Add Dashboard */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDashMenuOpen(!dashMenuOpen)}
              className="btn-ghost"
              style={{ padding: '5px 8px', flexShrink: 0 }}
              title={locale === 'de' ? 'Dashboard hinzufügen' : 'Add Dashboard'}
            >
              <LayoutDashboard size={15} />
            </button>

            {dashMenuOpen && (
              <Portal>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setDashMenuOpen(false)} />
                <div style={{
                  position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '16px', width: '280px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 99999,
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                    {locale === 'de' ? 'Neues Dashboard' : 'New Dashboard'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={newDashIcon}
                      onChange={(e) => setNewDashIcon(e.target.value)}
                      style={{ width: '44px', textAlign: 'center', fontSize: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', outline: 'none', color: 'var(--text)' }}
                    />
                    <input
                      value={newDashName}
                      onChange={(e) => setNewDashName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDashboard()}
                      placeholder={locale === 'de' ? 'Dashboard-Name' : 'Dashboard name'}
                      style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', outline: 'none', color: 'var(--text)', fontSize: '13px' }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleAddDashboard}
                    className="btn-accent"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {locale === 'de' ? 'Erstellen' : 'Create'}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
                    URL: /dashboard/{newDashName.toLowerCase().replace(/\s+/g, '-') || '...'}
                  </p>
                </div>
              </Portal>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button className="btn-ghost" style={{ padding: '7px' }}
            onClick={() => setTheme(isLight ? 'dark' : 'light')}>
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            className={editMode ? 'btn-accent' : 'btn-ghost'}
            style={editMode ? {} : { padding: '7px' }}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? <><Check size={14} />{locale === 'de' ? 'Fertig' : 'Done'}</> : <Pencil size={15} />}
          </button>

          <button className="btn-accent" style={{ padding: '7px 10px' }}
            onClick={() => setStoreOpen(true)} title={t(locale, 'addPlugin')}>
            <Plus size={17} />
          </button>

          <button className="btn-ghost" style={{ padding: '7px' }}
            onClick={() => setSettingsOpen(true)}>
            <Settings size={15} />
          </button>
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PluginStoreModal open={storeOpen} onClose={() => setStoreOpen(false)} />
    </>
  )
}
