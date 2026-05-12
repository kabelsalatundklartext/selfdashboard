'use client'

import { X, Check } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { themes } from '@/lib/themes'
import { t } from '@/lib/i18n'
import type { ThemeId } from '@/types'
import type { Locale } from '@/lib/i18n'

interface Props { open: boolean; onClose: () => void }

const LOCALES: { id: Locale; flag: string; label: string }[] = [
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

export function SettingsModal({ open, onClose }: Props) {
  const { theme, setTheme, title, setTitle, locale, setLocale } = useDashboardStore()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-in overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {t(locale, 'settingsTitle')}
          </h2>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Language */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'language')}
          </label>
          <div className="flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium flex-1 justify-center transition-all"
                style={{
                  background: locale === l.id ? 'var(--accent)' : 'var(--surface-2)',
                  color: locale === l.id ? '#fff' : 'var(--text)',
                  border: `1px solid ${locale === l.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <span className="text-lg">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'dashboardTitle')}
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
            {t(locale, 'colorTheme')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id as ThemeId)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: th.colors.surface,
                  border: `1px solid ${theme === th.id ? th.colors.accent : th.colors.border}`,
                  boxShadow: theme === th.id ? `0 0 0 2px ${th.colors.accent}33` : 'none',
                }}
              >
                <div className="flex gap-1">
                  {[th.colors.accent, th.colors['surface-2'], th.colors.border].map((c, i) => (
                    <span key={i} className="h-3 w-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm font-medium" style={{ color: th.colors.text }}>
                  {th.name}
                </span>
                {theme === th.id && (
                  <Check size={14} className="ml-auto" style={{ color: th.colors.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          SelfDashboard v0.1.0
        </p>
      </div>
    </div>
  )
}
