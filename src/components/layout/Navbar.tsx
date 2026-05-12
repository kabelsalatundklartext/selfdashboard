'use client'

import { useState } from 'react'
import { Settings, Plus, Sun, Moon } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { PluginStoreModal } from '@/components/ui/PluginStoreModal'

export function Navbar() {
  const { theme, setTheme } = useDashboardStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)

  const isLight = theme === 'light'

  return (
    <>
      <nav
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="22" height="22" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="13" y="13" width="36" height="36" rx="8" fill="white"/>
              <rect x="53" y="13" width="28" height="17" rx="5" fill="white" opacity="0.75"/>
              <rect x="53" y="33" width="28" height="17" rx="5" fill="white" opacity="0.45"/>
              <rect x="13" y="53" width="17" height="28" rx="5" fill="white" opacity="0.5"/>
              <rect x="34" y="53" width="47" height="28" rx="5" fill="white" opacity="0.9"/>
            </svg>
          </div>

          {/* Accent line + wordmark */}
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-1 rounded-full flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            />
            <span className="text-lg font-extrabold tracking-tight leading-none" style={{ letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text)' }}>Self</span>
              <span style={{ color: 'var(--accent)' }}>Dashboard</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost p-2"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title="Toggle light/dark"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button className="btn-accent" onClick={() => setStoreOpen(true)}>
            <Plus size={15} />
            Add Plugin
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
