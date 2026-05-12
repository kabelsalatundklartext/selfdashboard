'use client'

import { useState } from 'react'
import { Settings, LayoutGrid, Plus, Sun, Moon } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { themes } from '@/lib/themes'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { PluginStoreModal } from '@/components/ui/PluginStoreModal'

export function Navbar() {
  const { title, theme, setTheme } = useDashboardStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)

  const currentTheme = themes.find((t) => t.id === theme)
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
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            <LayoutGrid size={16} color="#fff" />
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick theme toggle light/dark */}
          <button
            className="btn-ghost p-2"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title="Toggle light/dark"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Add Plugin */}
          <button className="btn-accent" onClick={() => setStoreOpen(true)}>
            <Plus size={15} />
            Add Plugin
          </button>

          {/* Settings */}
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
