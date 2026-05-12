'use client'

import { X, Check } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { themes } from '@/lib/themes'
import type { ThemeId } from '@/types'

interface Props { open: boolean; onClose: () => void }

export function SettingsModal({ open, onClose }: Props) {
  const { theme, setTheme, title, setTitle } = useDashboardStore()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Settings
          </h2>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Dashboard Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Dashboard Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Theme Picker */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
            Color Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: t.colors.surface,
                  border: `1px solid ${theme === t.id ? t.colors.accent : t.colors.border}`,
                  boxShadow: theme === t.id ? `0 0 0 2px ${t.colors.accent}33` : 'none',
                }}
              >
                {/* Color swatches */}
                <div className="flex gap-1">
                  {[t.colors.accent, t.colors['surface-2'], t.colors.border].map((c, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium" style={{ color: t.colors.text }}>
                  {t.name}
                </span>
                {theme === t.id && (
                  <Check size={14} className="ml-auto" style={{ color: t.colors.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Version */}
        <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          SelfDashboard v0.1.0
        </p>
      </div>
    </div>
  )
}
