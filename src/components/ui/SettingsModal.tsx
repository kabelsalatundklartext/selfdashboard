'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Upload, RotateCcw, Plus, Trash2, Link } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { themes } from '@/lib/themes'
import { t } from '@/lib/i18n'
import { Portal } from '@/components/ui/Portal'
import type { ThemeId } from '@/types'
import type { Locale } from '@/lib/i18n'

interface Props { open: boolean; onClose: () => void }

const LOCALES: { id: Locale; flag: string; label: string }[] = [
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

const COLOR_FIELDS = [
  { key: 'background', label: { en: 'Background', de: 'Hintergrund' } },
  { key: 'surface', label: { en: 'Surface', de: 'Oberfläche' } },
  { key: 'surface-2', label: { en: 'Surface 2', de: 'Oberfläche 2' } },
  { key: 'border', label: { en: 'Border', de: 'Rahmen' } },
  { key: 'text', label: { en: 'Text', de: 'Text' } },
  { key: 'text-muted', label: { en: 'Text muted', de: 'Text gedimmt' } },
  { key: 'accent', label: { en: 'Accent', de: 'Akzentfarbe' } },
]

const EMOJIS = ['🏠', '🖥️', '🎬', '📊', '🌐', '🔒', '☁️', '🎮', '📱', '🔧', '⚡', '🌙']

type TabId = 'dashboards' | 'general' | 'design'

export function SettingsModal({ open, onClose }: Props) {
  const router = useRouter()
  const store = useDashboardStore()
  const { locale, setLocale, setTheme, setTitle, setCustomLogo, setCustomColors, resetCustomColors,
    dashboards, addDashboard, removeDashboard, updateDashboard, activeDashboardId, setActiveDashboard } = store
  const dash = store.activeDashboard()

  const [tab, setTab] = useState<TabId>('dashboards')
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏠')
  const [editingDash, setEditingDash] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const currentTheme = themes.find((th) => th.id === dash.theme)

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setCustomLogo(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAddDashboard = () => {
    if (!newName.trim()) return
    const id = addDashboard(newName.trim(), newIcon)
    setNewName(''); setNewIcon('🏠')
    router.push(`/dashboard/${id}`)
    onClose()
  }

  const handleRemoveDashboard = (id: string) => {
    const remaining = dashboards.filter((d) => d.id !== id)
    if (remaining.length === 0) return
    removeDashboard(id)
    if (activeDashboardId === id) {
      router.push(`/dashboard/${remaining[0].id}`)
    }
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '8px', padding: '8px 12px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'dashboards', label: locale === 'de' ? 'Dashboards' : 'Dashboards' },
    { id: 'general', label: locale === 'de' ? 'Allgemein' : 'General' },
    { id: 'design', label: 'Design' },
  ]

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
        <div className="animate-fade-in" style={{
          position: 'relative', width: '100%', maxWidth: '520px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: '18px', display: 'flex',
          flexDirection: 'column', maxHeight: '88vh', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', flexShrink: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t(locale, 'settingsTitle')}</h2>
            <button className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                background: tab === tb.id ? 'var(--accent)' : 'transparent',
                color: tab === tb.id ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}>{tb.label}</button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Dashboards Tab ── */}
            {tab === 'dashboards' && (<>
              {/* Existing dashboards */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {locale === 'de' ? 'Meine Dashboards' : 'My Dashboards'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dashboards.map((d) => (
                    <div key={d.id}>
                      {editingDash === d.id ? (
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={d.icon} onChange={(e) => updateDashboard(d.id, { icon: e.target.value })}
                              style={{ ...inp, width: '52px', textAlign: 'center', fontSize: '20px' }} />
                            <input value={d.name} onChange={(e) => updateDashboard(d.id, { name: e.target.value })}
                              style={{ ...inp, flex: 1 }} placeholder="Dashboard name" />
                          </div>
                          {/* Emoji picker */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {EMOJIS.map((e) => (
                              <button key={e} onClick={() => updateDashboard(d.id, { icon: e })}
                                style={{ fontSize: '18px', padding: '4px', borderRadius: '6px', cursor: 'pointer', background: d.icon === e ? 'var(--accent)22' : 'transparent', border: `1px solid ${d.icon === e ? 'var(--accent)' : 'transparent'}` }}>
                                {e}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setEditingDash(null)} className="btn-accent" style={{ alignSelf: 'flex-end' }}>
                            <Check size={14} /> {locale === 'de' ? 'Fertig' : 'Done'}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: '10px',
                          background: d.id === activeDashboardId ? 'var(--accent)18' : 'var(--surface-2)',
                          border: `1px solid ${d.id === activeDashboardId ? 'var(--accent)44' : 'var(--border)'}`,
                        }}>
                          <span style={{ fontSize: '20px', flexShrink: 0 }}>{d.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{d.name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Link size={10} style={{ color: 'var(--text-muted)' }} />
                              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>
                                /dashboard/{d.id}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => { setEditingDash(d.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', fontSize: '12px' }}>
                            ✏️
                          </button>
                          {dashboards.length > 1 && (
                            <button onClick={() => handleRemoveDashboard(d.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add new dashboard */}
              <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {locale === 'de' ? 'Neues Dashboard' : 'New Dashboard'}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                    style={{ ...inp, width: '52px', textAlign: 'center', fontSize: '20px' }} />
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDashboard()}
                    placeholder={locale === 'de' ? 'z.B. Server' : 'e.g. Server'}
                    style={{ ...inp, flex: 1 }} />
                </div>
                {/* Emoji picker */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setNewIcon(e)}
                      style={{ fontSize: '18px', padding: '4px', borderRadius: '6px', cursor: 'pointer', background: newIcon === e ? 'var(--accent)22' : 'transparent', border: `1px solid ${newIcon === e ? 'var(--accent)' : 'transparent'}` }}>
                      {e}
                    </button>
                  ))}
                </div>
                {newName && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
                    URL: /dashboard/{newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '...'}
                  </p>
                )}
                <button onClick={handleAddDashboard} className="btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={!newName.trim()}>
                  <Plus size={14} /> {locale === 'de' ? 'Dashboard erstellen' : 'Create Dashboard'}
                </button>
              </div>
            </>)}

            {/* ── General Tab ── */}
            {tab === 'general' && (<>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {t(locale, 'language')}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {LOCALES.map((l) => (
                    <button key={l.id} onClick={() => setLocale(l.id)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      background: locale === l.id ? 'var(--accent)' : 'var(--surface-2)',
                      color: locale === l.id ? '#fff' : 'var(--text)',
                      border: `1px solid ${locale === l.id ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                      <span style={{ fontSize: '18px' }}>{l.flag}</span>{l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {t(locale, 'dashboardTitle')} ({locale === 'de' ? 'aktuelles' : 'current'})
                </label>
                <input style={inp} value={dash.name} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>SelfDashboard v0.1.0</p>
            </>)}

            {/* ── Design Tab ── */}
            {tab === 'design' && (<>
              {/* Logo */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Logo ({locale === 'de' ? 'aktuelles Dashboard' : 'current dashboard'})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {dash.customLogo ? <img src={dash.customLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                      <svg width="30" height="30" viewBox="0 0 96 96" fill="none">
                        <rect width="96" height="96" rx="24" fill="var(--accent)"/>
                        <rect x="13" y="13" width="36" height="36" rx="8" fill="white"/>
                        <rect x="53" y="13" width="28" height="17" rx="5" fill="white" opacity="0.75"/>
                        <rect x="53" y="33" width="28" height="17" rx="5" fill="white" opacity="0.45"/>
                        <rect x="13" y="53" width="17" height="28" rx="5" fill="white" opacity="0.5"/>
                        <rect x="34" y="53" width="47" height="28" rx="5" fill="white" opacity="0.9"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: '13px' }} onClick={() => logoInputRef.current?.click()}>
                      <Upload size={14} /> {locale === 'de' ? 'Hochladen' : 'Upload'}
                    </button>
                    {dash.customLogo && <button className="btn-ghost" style={{ padding: '0.5rem' }} onClick={() => setCustomLogo('')}><X size={14} /></button>}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                </div>
              </div>

              {/* Theme */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {t(locale, 'colorTheme')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {themes.map((th) => (
                    <button key={th.id} onClick={() => { setTheme(th.id as ThemeId); resetCustomColors() }} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                      background: th.colors.surface, border: `1px solid ${dash.theme === th.id ? th.colors.accent : th.colors.border}`,
                      boxShadow: dash.theme === th.id ? `0 0 0 2px ${th.colors.accent}44` : 'none',
                    }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[th.colors.accent, th.colors['surface-2'], th.colors.border].map((c, i) => (
                          <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, display: 'block' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, color: th.colors.text }}>{th.name}</span>
                      {dash.theme === th.id && <Check size={13} style={{ color: th.colors.accent }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                    {locale === 'de' ? 'Farben anpassen' : 'Custom Colors'}
                  </label>
                  {dash.customColors && (
                    <button onClick={resetCustomColors} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <RotateCcw size={11} /> {locale === 'de' ? 'Zurücksetzen' : 'Reset'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COLOR_FIELDS.map(({ key, label }) => {
                    const base = currentTheme?.colors[key as keyof typeof currentTheme.colors] ?? '#000000'
                    const current = dash.customColors?.[key] ?? base
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="color" value={current} onChange={(e) => setCustomColors({ [key]: e.target.value })}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', padding: '1px', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', flex: 1, color: 'var(--text)' }}>{label[locale]}</span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{current}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </Portal>
  )
}
