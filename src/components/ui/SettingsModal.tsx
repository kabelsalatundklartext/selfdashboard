'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Upload, RotateCcw, Plus, Trash2, ExternalLink, Link } from 'lucide-react'
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

const EMOJIS = ['🏠', '🖥️', '🎬', '📊', '🌐', '🔒', '☁️', '🎮', '📱', '🔧', '⚡', '🌙', '📷', '🗂️', '🎵', '🏥']

type TabId = 'general' | 'dashboards' | 'design'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', flexShrink: 0,
      background: value ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: '3px', left: value ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  )
}

function DashboardIcon({ icon, size = 24 }: { icon: string; size?: number }) {
  if (icon?.startsWith('data:') || icon?.startsWith('http'))
    return <img src={icon} alt="" style={{ width: size, height: size, borderRadius: '4px', objectFit: 'cover' }} />
  return <span style={{ fontSize: size * 0.75 }}>{icon || '📋'}</span>
}

export function SettingsModal({ open, onClose }: Props) {
  const router = useRouter()
  const store = useDashboardStore()
  const {
    locale, setLocale, setTheme, setTitle, setCustomLogo, setCustomColors, resetCustomColors,
    dashboards, addDashboard, removeDashboard, updateDashboard, activeDashboardId,
    showDashboardTabs, setShowDashboardTabs,
    navbarStyle, setNavbarStyle,
  } = store
  const dash = store.activeDashboard()

  const [tab, setTab] = useState<TabId>('general')
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏠')
  const [editingDash, setEditingDash] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const newIconInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const currentTheme = themes.find((th) => th.id === dash.theme)

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setCustomLogo(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDashIconUpload = (file: File, dashId: string) => {
    const reader = new FileReader()
    reader.onload = (e) => updateDashboard(dashId, { icon: e.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleNewIconUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setNewIcon(e.target?.result as string)
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
    if (activeDashboardId === id) router.push(`/dashboard/${remaining[0].id}`)
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '8px', padding: '8px 12px',
    fontSize: '13px', outline: 'none', width: '100%',
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'general', label: locale === 'de' ? 'Allgemein' : 'General' },
    { id: 'dashboards', label: 'Dashboards' },
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', flexShrink: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t(locale, 'settingsTitle')}</h2>
            <button className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={16} /></button>
          </div>

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

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Allgemein ── */}
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
                  {t(locale, 'dashboardTitle')}
                </label>
                <input style={inp} value={dash.name} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* Dashboard Tabs Option */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                    {locale === 'de' ? 'Dashboard-Tabs anzeigen' : 'Show Dashboard Tabs'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {locale === 'de' ? 'Tabs oben links in der Navbar' : 'Tabs shown top left in navbar'}
                  </p>
                </div>
                <Toggle value={showDashboardTabs} onChange={setShowDashboardTabs} />
              </div>

              {/* Navbar Logo/Text Style */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {locale === 'de' ? 'Navbar anzeigen' : 'Navbar display'}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([
                    { id: 'icon-text', label: locale === 'de' ? 'Icon & Name' : 'Icon & Name', preview: '⬛ Text' },
                    { id: 'icon-only', label: locale === 'de' ? 'Nur Icon' : 'Icon only', preview: '⬛' },
                    { id: 'text-only', label: locale === 'de' ? 'Nur Name' : 'Name only', preview: 'Text' },
                  ] as const).map((opt) => (
                    <button key={opt.id} onClick={() => setNavbarStyle(opt.id)}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        background: navbarStyle === opt.id ? 'var(--accent)' : 'var(--surface-2)',
                        color: navbarStyle === opt.id ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${navbarStyle === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      <span style={{ fontSize: '16px' }}>{opt.preview}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>SelfDashboard v0.1.0</p>
            </>)}

            {/* ── Dashboards ── */}
            {tab === 'dashboards' && (<>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {locale === 'de' ? 'Meine Dashboards' : 'My Dashboards'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0] && editingDash) {
                        handleDashIconUpload(e.target.files[0], editingDash)
                      }
                    }}
                  />
                  {dashboards.map((d) => {
                    return (
                      <div key={d.id}>
                        {editingDash === d.id ? (
                          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Icon preview + upload */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                <DashboardIcon icon={d.icon} size={32} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                  {EMOJIS.map((e) => (
                                    <button key={e} onClick={() => updateDashboard(d.id, { icon: e })}
                                      style={{ fontSize: '16px', padding: '3px 5px', borderRadius: '5px', cursor: 'pointer', background: d.icon === e ? 'var(--accent)22' : 'transparent', border: `1px solid ${d.icon === e ? 'var(--accent)' : 'transparent'}` }}>
                                      {e}
                                    </button>
                                  ))}
                                </div>
                                <button onClick={() => { setEditingDash(d.id); setTimeout(() => iconInputRef.current?.click(), 0) }}
                                  style={{ fontSize: '11px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Upload size={11} /> {locale === 'de' ? 'PNG hochladen' : 'Upload PNG'}
                                </button>
                              </div>
                            </div>
                            <input value={d.name} onChange={(e) => updateDashboard(d.id, { name: e.target.value })}
                              style={inp} placeholder="Name" />
                            <button onClick={() => setEditingDash(null)} className="btn-accent" style={{ alignSelf: 'flex-end' }}>
                              <Check size={14} /> {locale === 'de' ? 'Fertig' : 'Done'}
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
                            background: d.id === activeDashboardId ? 'var(--accent)18' : 'var(--surface-2)',
                            border: `1px solid ${d.id === activeDashboardId ? 'var(--accent)44' : 'var(--border)'}`,
                          }}>
                            {/* Icon */}
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              <DashboardIcon icon={d.icon} size={22} />
                            </div>
                            {/* Name + URL */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{d.name}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Link size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>/dashboard/{d.id}</p>
                              </div>
                            </div>
                            {/* Open */}
                            <button onClick={() => { router.push(`/dashboard/${d.id}`); onClose() }}
                              style={{ background: d.id === activeDashboardId ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${d.id === activeDashboardId ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: d.id === activeDashboardId ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
                              <ExternalLink size={12} /> {locale === 'de' ? 'Öffnen' : 'Open'}
                            </button>
                            {/* Edit */}
                            <button onClick={() => setEditingDash(d.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', flexShrink: 0 }}>✏️</button>
                            {/* Delete */}
                            {dashboards.length > 1 && (
                              <button onClick={() => handleRemoveDashboard(d.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', flexShrink: 0 }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Neues Dashboard */}
              <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {locale === 'de' ? 'Neues Dashboard' : 'New Dashboard'}
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  {/* Icon preview */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => newIconInputRef.current?.click()}>
                    <DashboardIcon icon={newIcon} size={30} />
                  </div>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDashboard()}
                    placeholder={locale === 'de' ? 'z.B. Server' : 'e.g. Server'}
                    style={{ ...inp, flex: 1 }} />
                </div>
                {/* Emoji picker */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setNewIcon(e)}
                      style={{ fontSize: '16px', padding: '3px 5px', borderRadius: '5px', cursor: 'pointer', background: newIcon === e ? 'var(--accent)22' : 'transparent', border: `1px solid ${newIcon === e ? 'var(--accent)' : 'transparent'}` }}>
                      {e}
                    </button>
                  ))}
                  <button onClick={() => newIconInputRef.current?.click()}
                    style={{ fontSize: '11px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Upload size={11} /> PNG
                  </button>
                  <input ref={newIconInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleNewIconUpload(e.target.files[0])} />
                </div>
                {newName.trim() && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
                    URL: /dashboard/{newName.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '...'}
                  </p>
                )}
                <button onClick={handleAddDashboard} className="btn-accent"
                  style={{ width: '100%', justifyContent: 'center', opacity: newName.trim() ? 1 : 0.5 }}
                  disabled={!newName.trim()}>
                  <Plus size={14} /> {locale === 'de' ? 'Dashboard erstellen' : 'Create Dashboard'}
                </button>
              </div>
            </>)}

            {/* ── Design ── */}
            {tab === 'design' && (<>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>Logo</label>
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
