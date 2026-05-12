'use client'

import { useState } from 'react'
import { Settings, Plus, Sun, Moon, Pencil, Check } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { PluginStoreModal } from '@/components/ui/PluginStoreModal'
import { t } from '@/lib/i18n'

export function Navbar() {
  const { theme, setTheme, editMode, setEditMode, locale, customLogo } = useDashboardStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const isLight = theme === 'light'

  return (
    <>
      <nav
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          {customLogo ? (
            <img src={customLogo} alt="Logo" className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="22" height="22" viewBox="0 0 96 96" fill="none">
                <rect x="13" y="13" width="36" height="36" rx="8" fill="white"/>
                <rect x="53" y="13" width="28" height="17" rx="5" fill="white" opacity="0.75"/>
                <rect x="53" y="33" width="28" height="17" rx="5" fill="white" opacity="0.45"/>
                <rect x="13" y="53" width="17" height="28" rx="5" fill="white" opacity="0.5"/>
                <rect x="34" y="53" width="47" height="28" rx="5" fill="white" opacity="0.9"/>
              </svg>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="h-7 w-1 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
            <span className="text-lg font-extrabold tracking-tight leading-none" style={{ letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text)' }}>Self</span>
              <span style={{ color: 'var(--accent)' }}>Dashboard</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2" onClick={() => setTheme(isLight ? 'dark' : 'light')} title="Toggle theme">
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            className={editMode ? 'btn-accent' : 'btn-ghost'}
            onClick={() => setEditMode(!editMode)}
            style={editMode ? {} : { padding: '0.5rem' }}
            title={t(locale, 'editMode')}
          >
            {editMode ? <><Check size={14} />{locale === 'de' ? 'Fertig' : 'Done'}</> : <Pencil size={16} />}
          </button>

          {/* Add Plugin — just + icon */}
          <button
            className="btn-accent"
            onClick={() => setStoreOpen(true)}
            title={t(locale, 'addPlugin')}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <Plus size={18} />
          </button>

          <button className="btn-ghost p-2" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PluginStoreModal open={storeOpen} onClose={() => setStoreOpen(false)} />
    </>
  )
}
