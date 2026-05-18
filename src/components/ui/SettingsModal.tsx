'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Upload, RotateCcw, Plus, Trash2, ExternalLink, Link, Eye, EyeOff, Pencil, Download, RefreshCw } from 'lucide-react'
import type { LogEntry, LogLevel, LogRetentionDays, LogSource } from '@/lib/errorLogTypes'
import { useDashboardStore } from '@/lib/store'
import { themes } from '@/lib/themes'
import { t } from '@/lib/i18n'
import { Portal } from '@/components/ui/Portal'
import type { ThemeId } from '@/types'
import type { Locale } from '@/lib/i18n'
import { SEARCH_PROVIDER_LIST } from '@/lib/searchProviders'
import type { SearchProviderId } from '@/lib/searchProviders'
import { MailSettingsPanel } from '@/components/settings/MailSettingsPanel'
import { MailNavbarToggle } from '@/components/settings/MailNavbarToggle'

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

type TabId = 'general' | 'dashboards' | 'design' | 'mail' | 'logs'

const RETENTION_OPTIONS: { days: LogRetentionDays; label: { de: string; en: string } }[] = [
  { days: 3, label: { de: '3 Tage', en: '3 days' } },
  { days: 7, label: { de: '7 Tage', en: '7 days' } },
  { days: 30, label: { de: '30 Tage', en: '30 days' } },
]

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
    gridGap, setGridGap, gridPadding, setGridPadding,
    navbarSearchEnabled, setNavbarSearchEnabled,
    navbarSearchPosition, setNavbarSearchPosition,
    navbarSearchProviders, setNavbarSearchProviderEnabled,
    navbarSearchCustomProviders, setNavbarSearchCustomProviderEnabled,
    addNavbarSearchCustomProvider, removeNavbarSearchCustomProvider,
  } = store
  const dash = store.activeDashboard()

  const [tab, setTab] = useState<TabId>('general')
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏠')
  const [customSearchName, setCustomSearchName] = useState('')
  const [customSearchUrl, setCustomSearchUrl] = useState('')
  const [customSearchErr, setCustomSearchErr] = useState<string | null>(null)
  const [editingDash, setEditingDash] = useState<string | null>(null)
  const [logRetention, setLogRetention] = useState<LogRetentionDays>(7)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsBusy, setLogsBusy] = useState(false)
  const [logFilterLevel, setLogFilterLevel] = useState<LogLevel | ''>('')
  const [logFilterSource, setLogFilterSource] = useState<LogSource | ''>('')
  const [logFilterPlugin, setLogFilterPlugin] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const newIconInputRef = useRef<HTMLInputElement>(null)

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '300' })
      if (logFilterLevel) params.set('level', logFilterLevel)
      if (logFilterSource) params.set('source', logFilterSource)
      if (logFilterPlugin.trim()) params.set('pluginId', logFilterPlugin.trim())
      if (logSearch.trim()) params.set('q', logSearch.trim())
      const [settingsRes, logsRes] = await Promise.all([
        fetch('/api/logs/settings', { cache: 'no-store' }),
        fetch(`/api/logs?${params}`, { cache: 'no-store' }),
      ])
      if (settingsRes.ok) {
        const s = (await settingsRes.json()) as { retentionDays?: LogRetentionDays }
        if (s.retentionDays === 3 || s.retentionDays === 7 || s.retentionDays === 30) {
          setLogRetention(s.retentionDays)
        }
      }
      if (logsRes.ok) {
        const j = (await logsRes.json()) as { entries?: LogEntry[] }
        setLogEntries(Array.isArray(j.entries) ? j.entries : [])
      }
    } catch {
      /* offline */
    } finally {
      setLogsLoading(false)
    }
  }, [logFilterLevel, logFilterSource, logFilterPlugin, logSearch])

  useEffect(() => {
    if (open && tab === 'logs') void refreshLogs()
  }, [open, tab, refreshLogs])

  useEffect(() => {
    if (!open || tab !== 'logs') return
    const id = window.setInterval(() => void refreshLogs(), 15_000)
    return () => window.clearInterval(id)
  }, [open, tab, refreshLogs])

  const setRetention = async (days: LogRetentionDays) => {
    setLogsBusy(true)
    try {
      const r = await fetch('/api/logs/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: days }),
      })
      if (r.ok) {
        setLogRetention(days)
        await refreshLogs()
      }
    } finally {
      setLogsBusy(false)
    }
  }

  const downloadLogs = (format: 'txt' | 'jsonl') => {
    window.location.href = `/api/logs/download?format=${format}`
  }

  const clearAllLogs = async () => {
    if (!window.confirm(locale === 'de' ? 'Alle Protokolleinträge löschen?' : 'Delete all log entries?')) return
    setLogsBusy(true)
    try {
      await fetch('/api/logs', { method: 'DELETE' })
      setLogEntries([])
    } finally {
      setLogsBusy(false)
    }
  }

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
    { id: 'mail', label: 'E-Mail' },
    { id: 'logs', label: locale === 'de' ? 'Protokoll' : 'Logs' },
  ]

  return (
    <Portal>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
        <div className="animate-fade-in" style={{
          position: 'relative', width: '100%', maxWidth: tab === 'logs' ? '720px' : tab === 'mail' ? '560px' : '520px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: '18px', display: 'flex',
          flexDirection: 'column', maxHeight: '88vh', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', flexShrink: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t(locale, 'settingsTitle')}</h2>
            <button className="btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={16} /></button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', rowGap: '6px', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                background: tab === tb.id ? 'var(--accent)' : 'transparent',
                color: tab === tb.id ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                flex: '1 1 auto', minWidth: 'min(100%, 100px)', textAlign: 'center',
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

              {/* Navbar web search */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {locale === 'de' ? 'Navbar-Suche' : 'Navbar search'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                      {locale === 'de' ? 'Suchleiste anzeigen' : 'Show search bar'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {locale === 'de' ? 'Websuche in der oberen Leiste' : 'Web search in the top bar'}
                    </p>
                  </div>
                  <Toggle value={navbarSearchEnabled} onChange={setNavbarSearchEnabled} />
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '16px 0 8px' }}>
                  {locale === 'de' ? 'Navbar E-Mail' : 'Navbar email'}
                </label>
                <MailNavbarToggle locale={locale} standalone />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
                  {locale === 'de'
                    ? 'Mehrere Konten im Tab „E-Mail“ möglich. Der Schalter wirkt sofort — kein Speichern nötig.'
                    : 'Multiple accounts in the “Email” tab. This switch applies immediately — no save needed.'}
                </p>

                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '16px 0 8px' }}>
                  {locale === 'de' ? 'Position' : 'Position'}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {([
                    { id: 'left' as const, label: locale === 'de' ? 'Links' : 'Left' },
                    { id: 'center' as const, label: locale === 'de' ? 'Mitte' : 'Center' },
                    { id: 'right' as const, label: locale === 'de' ? 'Rechts' : 'Right' },
                  ]).map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setNavbarSearchPosition(opt.id)}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        background: navbarSearchPosition === opt.id ? 'var(--accent)' : 'var(--surface-2)',
                        color: navbarSearchPosition === opt.id ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${navbarSearchPosition === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  {locale === 'de' ? 'Suchanbieter' : 'Search providers'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SEARCH_PROVIDER_LIST.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{p.label[locale]}</span>
                      <Toggle
                        value={navbarSearchProviders[p.id]}
                        onChange={(v) => setNavbarSearchProviderEnabled(p.id as SearchProviderId, v)}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '14px 0 8px' }}>
                  {locale === 'de' ? 'Eigene Suchanbieter' : 'Custom search providers'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.45 }}>
                  {locale === 'de'
                    ? 'Name und URL mit Platzhalter {q} oder %s für den Suchbegriff (nur http/https). Beispiel: https://startpage.com/sp/search?query={q}'
                    : 'Name and URL with placeholder {q} or %s for the query (http/https only). Example: https://startpage.com/sp/search?query={q}'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  <input
                    style={inp}
                    value={customSearchName}
                    onChange={(e) => { setCustomSearchName(e.target.value); setCustomSearchErr(null) }}
                    placeholder={locale === 'de' ? 'Anzeigename' : 'Display name'}
                  />
                  <input
                    style={inp}
                    value={customSearchUrl}
                    onChange={(e) => { setCustomSearchUrl(e.target.value); setCustomSearchErr(null) }}
                    placeholder="https://…?q={q}"
                  />
                  <button
                    type="button"
                    className="btn-accent"
                    style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                    onClick={() => {
                      setCustomSearchErr(null)
                      const ok = addNavbarSearchCustomProvider(customSearchName, customSearchUrl)
                      if (!ok) {
                        setCustomSearchErr(
                          locale === 'de'
                            ? 'Name und gültige URL (mit {q} oder %s, nur http/https) nötig.'
                            : 'Enter a name and a valid URL with {q} or %s (http/https only).',
                        )
                        return
                      }
                      setCustomSearchName('')
                      setCustomSearchUrl('')
                    }}
                  >
                    {locale === 'de' ? 'Anbieter hinzufügen' : 'Add provider'}
                  </button>
                  {customSearchErr ? (
                    <p style={{ fontSize: '11px', color: '#ef4444', margin: 0 }}>{customSearchErr}</p>
                  ) : null}
                </div>
                {navbarSearchCustomProviders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    {navbarSearchCustomProviders.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${c.name} · ${c.urlTemplate}`}>
                          {c.name}
                        </span>
                        <Toggle value={c.enabled} onChange={(v) => setNavbarSearchCustomProviderEnabled(c.id, v)} />
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '6px', flexShrink: 0 }}
                          title={locale === 'de' ? 'Entfernen' : 'Remove'}
                          onClick={() => removeNavbarSearchCustomProvider(c.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '10px 0 0' }}>
                  {locale === 'de'
                    ? 'Wenn alle eingebauten und eigenen Anbieter aus sind, wird keine Suchleiste angezeigt.'
                    : 'If all built-in and custom providers are off, the search bar is hidden.'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
                  {locale === 'de'
                    ? 'Im Bearbeitungsmodus: am rechten Rand der Suchleiste ziehen, um die Breite anzupassen (200–920 px).'
                    : 'In edit mode: drag the right edge of the search bar to change its width (200–920 px).'}
                </p>
              </div>


              <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>SelfDashboard v0.1.0</p>
            </>)}

            {/* ── Dashboards ── */}
            {tab === 'dashboards' && (<>
              <div>
                {/* Global tabs toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                      {locale === 'de' ? 'Tabs in Navbar anzeigen' : 'Show tabs in Navbar'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {locale === 'de' ? 'Dashboard-Tabs oben links einblenden' : 'Show dashboard tabs top left'}
                    </p>
                  </div>
                  <Toggle value={showDashboardTabs} onChange={setShowDashboardTabs} />
                </div>

                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {locale === 'de' ? 'Meine Dashboards' : 'My Dashboards'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              padding: '12px',
                              borderRadius: '10px',
                              background: d.id === activeDashboardId ? 'var(--accent)18' : 'var(--surface-2)',
                              border: `1px solid ${d.id === activeDashboardId ? 'var(--accent)44' : 'var(--border)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                <DashboardIcon icon={d.icon} size={22} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                    margin: 0,
                                    lineHeight: 1.3,
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {d.name}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', minWidth: 0 }}>
                                  <Link size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                  <p
                                    title={`/dashboard/${d.id}`}
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--text-muted)',
                                      margin: 0,
                                      fontFamily: 'monospace',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    /dashboard/{d.id}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: 'auto' }}>
                                <button
                                  type="button"
                                  onClick={() => updateDashboard(d.id, { hideTab: !d.hideTab })}
                                  title={
                                    d.hideTab
                                      ? locale === 'de'
                                        ? 'In Navbar einblenden'
                                        : 'Show in navbar'
                                      : locale === 'de'
                                        ? 'In Navbar ausblenden'
                                        : 'Hide from navbar'
                                  }
                                  style={{
                                    background: 'var(--surface)',
                                    border: `1px solid ${d.hideTab ? 'var(--border)' : 'var(--accent)44'}`,
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: d.hideTab ? 'var(--text-muted)' : 'var(--accent)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {d.hideTab ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDash(d.id)}
                                  title={locale === 'de' ? 'Bearbeiten' : 'Edit'}
                                  style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Pencil size={16} />
                                </button>
                                {dashboards.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDashboard(d.id)}
                                    title={locale === 'de' ? 'Löschen' : 'Delete'}
                                    style={{
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      borderRadius: '8px',
                                      width: '36px',
                                      height: '36px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      color: 'var(--text-muted)',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/dashboard/${d.id}`)
                                onClose()
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: `1px solid ${d.id === activeDashboardId ? 'var(--accent)' : 'var(--border)'}`,
                                background: d.id === activeDashboardId ? 'var(--accent)' : 'var(--surface)',
                                color: d.id === activeDashboardId ? '#fff' : 'var(--text)',
                              }}
                            >
                              <ExternalLink size={15} /> {locale === 'de' ? 'Öffnen' : 'Open'}
                            </button>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => newIconInputRef.current?.click()}
                  >
                    <DashboardIcon icon={newIcon} size={30} />
                  </div>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDashboard()}
                    placeholder={locale === 'de' ? 'z.B. Server' : 'e.g. Server'}
                    style={{ ...inp, flex: '1 1 200px', minWidth: 0 }}
                  />
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

              {/* Grid spacing */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {locale === 'de' ? 'Abstände' : 'Spacing'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Widget gap */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)', minWidth: '120px' }}>
                      {locale === 'de' ? 'Abstand Widgets' : 'Widget gap'}
                    </span>
                    <input type="range" min={0} max={32} step={4} value={gridGap ?? 8}
                      onChange={(e) => setGridGap(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {gridGap ?? 8}px
                    </span>
                  </div>
                  {/* Outer padding */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)', minWidth: '120px' }}>
                      {locale === 'de' ? 'Rand aussen' : 'Outer padding'}
                    </span>
                    <input type="range" min={0} max={48} step={4} value={gridPadding ?? 12}
                      onChange={(e) => setGridPadding(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {gridPadding ?? 12}px
                    </span>
                  </div>
                </div>
              </div>

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

            {tab === 'mail' && <MailSettingsPanel locale={locale} />}

            {tab === 'logs' && (<>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {locale === 'de' ? 'Aufbewahrung' : 'Retention'}
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.45 }}>
                  {locale === 'de'
                    ? 'Zentrales Fehlerprotokoll: Browser-Fehler, fehlgeschlagene API-Aufrufe, Plugin-Widgets und Server-Routen. Aktualisiert sich alle 15 s. Passwörter werden nicht gespeichert.'
                    : 'Central error log: browser errors, failed API calls, plugin widgets, and server routes. Refreshes every 15 s. Passwords are never stored.'}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {RETENTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      disabled={logsBusy}
                      onClick={() => void setRetention(opt.days)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: logsBusy ? 'wait' : 'pointer',
                        background: logRetention === opt.days ? 'var(--accent)' : 'var(--surface-2)',
                        color: logRetention === opt.days ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${logRetention === opt.days ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      {opt.label[locale]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <select
                  value={logFilterLevel}
                  onChange={(e) => setLogFilterLevel(e.target.value as LogLevel | '')}
                  style={{ ...inp, padding: '6px 8px', fontSize: '12px' }}
                >
                  <option value="">{locale === 'de' ? 'Alle Stufen' : 'All levels'}</option>
                  <option value="error">Error</option>
                  <option value="warn">Warn</option>
                  <option value="info">Info</option>
                </select>
                <select
                  value={logFilterSource}
                  onChange={(e) => setLogFilterSource(e.target.value as LogSource | '')}
                  style={{ ...inp, padding: '6px 8px', fontSize: '12px' }}
                >
                  <option value="">{locale === 'de' ? 'Alle Quellen' : 'All sources'}</option>
                  <option value="app">App</option>
                  <option value="plugin">Plugin</option>
                  <option value="api">API</option>
                </select>
                <input
                  style={{ ...inp, padding: '6px 8px', fontSize: '12px' }}
                  value={logFilterPlugin}
                  onChange={(e) => setLogFilterPlugin(e.target.value)}
                  placeholder={locale === 'de' ? 'Plugin (z. B. calendar)' : 'Plugin (e.g. calendar)'}
                />
                <input
                  style={{ ...inp, padding: '6px 8px', fontSize: '12px' }}
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder={locale === 'de' ? 'Textsuche…' : 'Search text…'}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={logsLoading || logsBusy}
                  onClick={() => void refreshLogs()}
                >
                  <RefreshCw size={14} /> {locale === 'de' ? 'Aktualisieren' : 'Refresh'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => downloadLogs('txt')}
                >
                  <Download size={14} /> {locale === 'de' ? 'Download (.txt)' : 'Download (.txt)'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => downloadLogs('jsonl')}
                >
                  <Download size={14} /> JSONL
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', color: '#ef4444' }}
                  disabled={logsBusy}
                  onClick={() => void clearAllLogs()}
                >
                  <Trash2 size={14} /> {locale === 'de' ? 'Alles löschen' : 'Clear all'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {locale === 'de' ? 'Letzte Einträge' : 'Recent entries'}
                  {logsLoading ? ' …' : ` (${logEntries.length})`}
                </label>
                <div style={{
                  maxHeight: '360px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {logEntries.length === 0 && !logsLoading ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '12px 8px', textAlign: 'center' }}>
                      {locale === 'de' ? 'Noch keine Einträge.' : 'No entries yet.'}
                    </p>
                  ) : null}
                  {logEntries.map((e) => {
                    const levelColor =
                      e.level === 'error' ? '#ef4444' : e.level === 'warn' ? '#f59e0b' : 'var(--text-muted)'
                    return (
                      <div
                        key={e.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                          lineHeight: 1.4,
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '10px' }}>
                            {new Date(e.ts).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB')}
                          </span>
                          <span style={{ fontWeight: 700, color: levelColor, textTransform: 'uppercase', fontSize: '10px' }}>
                            {e.level}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{e.source}</span>
                          {e.category ? (
                            <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '10px' }}>{e.category}</span>
                          ) : null}
                          {e.pluginId ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>· {e.pluginId}</span>
                          ) : null}
                        </div>
                        <p style={{ margin: 0, color: 'var(--text)', wordBreak: 'break-word' }}>{e.message}</p>
                        {e.detail ? (
                          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-word' }}>
                            {e.detail}
                          </p>
                        ) : null}
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
