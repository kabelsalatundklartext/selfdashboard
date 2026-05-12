'use client'

import { useRef, useState } from 'react'
import { X, Check, Upload, RotateCcw } from 'lucide-react'
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

const COLOR_FIELDS = [
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'surface-2', label: 'Surface 2' },
  { key: 'border', label: 'Border' },
  { key: 'text', label: 'Text' },
  { key: 'text-muted', label: 'Text muted' },
  { key: 'accent', label: 'Accent color' },
]

type TabId = 'general' | 'theme' | 'appearance'

export function SettingsModal({ open, onClose }: Props) {
  const {
    theme, setTheme, title, setTitle, locale, setLocale,
    customLogo, setCustomLogo, customFavicon, setCustomFavicon,
    customColors, setCustomColors, resetCustomColors,
  } = useDashboardStore()

  const [tab, setTab] = useState<TabId>('general')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const currentTheme = themes.find((t) => t.id === theme)

  const handleImageUpload = (file: File, type: 'logo' | 'favicon') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      if (type === 'logo') setCustomLogo(url)
      else setCustomFavicon(url)
    }
    reader.readAsDataURL(file)
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'general', label: locale === 'de' ? 'Allgemein' : 'General' },
    { id: 'theme', label: locale === 'de' ? 'Farbthema' : 'Theme' },
    { id: 'appearance', label: locale === 'de' ? 'Aussehen' : 'Appearance' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl flex flex-col animate-fade-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {t(locale, 'settingsTitle')}
          </h2>
          <button className="btn-ghost p-1.5" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === tb.id ? 'var(--accent)' : 'transparent',
                color: tab === tb.id ? '#fff' : 'var(--text-muted)',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── General Tab ── */}
          {tab === 'general' && (
            <>
              {/* Language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
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
                      <span className="text-lg">{l.flag}</span>{l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t(locale, 'dashboardTitle')}
                </label>
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* Version */}
              <p className="text-xs text-center pt-2" style={{ color: 'var(--text-muted)' }}>
                SelfDashboard v0.1.0
              </p>
            </>
          )}

          {/* ── Theme Tab ── */}
          {tab === 'theme' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  {t(locale, 'colorTheme')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => { setTheme(th.id as ThemeId); resetCustomColors() }}
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
                      <span className="text-sm font-medium flex-1" style={{ color: th.colors.text }}>{th.name}</span>
                      {theme === th.id && <Check size={14} style={{ color: th.colors.accent }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {locale === 'de' ? 'Farben anpassen' : 'Custom Colors'}
                  </label>
                  {customColors && (
                    <button
                      onClick={resetCustomColors}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <RotateCcw size={11} />
                      {locale === 'de' ? 'Zurücksetzen' : 'Reset'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {COLOR_FIELDS.map(({ key, label }) => {
                    const baseColor = currentTheme?.colors[key as keyof typeof currentTheme.colors] ?? '#000000'
                    const currentColor = customColors?.[key as keyof typeof customColors] ?? baseColor
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={currentColor}
                          onChange={(e) => setCustomColors({ [key]: e.target.value })}
                          className="h-8 w-8 rounded-lg cursor-pointer flex-shrink-0"
                          style={{ border: '1px solid var(--border)', background: 'none', padding: '1px' }}
                        />
                        <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{label}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{currentColor}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Appearance Tab ── */}
          {tab === 'appearance' && (
            <>
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  {locale === 'de' ? 'Dashboard Logo' : 'Dashboard Logo'}
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    {customLogo ? (
                      <img src={customLogo} alt="logo" className="h-full w-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 96 96" fill="none">
                        <rect width="96" height="96" rx="24" fill="var(--accent)"/>
                        <rect x="13" y="13" width="36" height="36" rx="8" fill="white"/>
                        <rect x="53" y="13" width="28" height="17" rx="5" fill="white" opacity="0.75"/>
                        <rect x="53" y="33" width="28" height="17" rx="5" fill="white" opacity="0.45"/>
                        <rect x="13" y="53" width="17" height="28" rx="5" fill="white" opacity="0.5"/>
                        <rect x="34" y="53" width="47" height="28" rx="5" fill="white" opacity="0.9"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex gap-2 flex-1">
                    <button
                      className="btn-ghost flex-1 text-sm"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      {locale === 'de' ? 'Hochladen' : 'Upload'}
                    </button>
                    {customLogo && (
                      <button className="btn-ghost px-3" onClick={() => setCustomLogo('')}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {locale === 'de' ? 'PNG, JPG, SVG — empfohlen: 96×96px' : 'PNG, JPG, SVG — recommended: 96×96px'}
                </p>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Favicon
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    {customFavicon ? (
                      <img src={customFavicon} alt="favicon" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SD</span>
                    )}
                  </div>
                  <button className="btn-ghost text-sm" onClick={() => faviconInputRef.current?.click()}>
                    <Upload size={14} />
                    {locale === 'de' ? 'Hochladen' : 'Upload'}
                  </button>
                  {customFavicon && (
                    <button className="btn-ghost px-3" onClick={() => setCustomFavicon('')}>
                      <X size={14} />
                    </button>
                  )}
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'favicon')}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
