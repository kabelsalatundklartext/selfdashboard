'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, Check, X, Upload } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links to your self-hosted services with custom icons.',
  version: '1.2.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
}

interface AppLink {
  id: string
  name: string
  url: string
  icon: string      // emoji or data:image/... base64
  newTab: boolean
}

const DEFAULT_APPS: AppLink[] = [
  { id: '1', name: 'Portainer', url: 'http://localhost:9000', icon: '🐳', newTab: true },
  { id: '2', name: 'Nextcloud', url: 'http://localhost:8080', icon: '☁️', newTab: true },
  { id: '3', name: 'Jellyfin', url: 'http://localhost:8096', icon: '🎬', newTab: true },
  { id: '4', name: 'Unraid', url: 'http://tower', icon: '🖥️', newTab: true },
]

function parseApps(raw: unknown): AppLink[] {
  try {
    const parsed = JSON.parse(raw as string)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {}
  return DEFAULT_APPS
}

function AppIcon({ icon }: { icon: string }) {
  if (icon.startsWith('data:') || icon.startsWith('http')) {
    return <img src={icon} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
  }
  return <span className="text-xl flex-shrink-0">{icon || '🔗'}</span>
}

// ── Widget ───────────────────────────────────────────────────
function Widget({ config }: PluginWidgetProps) {
  const title = (config.title as string) || 'My Apps'
  const apps = parseApps(config.apps)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-xs font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2 flex-1 content-start">
        {apps.map((app) => (
          <a
            key={app.id}
            href={app.url}
            target={app.newTab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <AppIcon icon={app.icon} />
            <span className="text-sm font-medium truncate flex-1">{app.name}</span>
            {app.newTab && <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          </a>
        ))}
        {apps.length === 0 && (
          <p className="text-xs col-span-2 text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No apps — open settings to add some
          </p>
        )}
      </div>
    </div>
  )
}

// ── Settings ─────────────────────────────────────────────────
function Settings({ config, onChange }: PluginSettingsProps) {
  const [apps, setApps] = useState<AppLink[]>(parseApps(config.apps))
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AppLink>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const save = (updated: AppLink[]) => {
    setApps(updated)
    onChange('apps', JSON.stringify(updated))
  }

  const startEdit = (app: AppLink) => { setEditing(app.id); setEditData({ ...app }) }

  const commitEdit = () => {
    if (!editing) return
    save(apps.map((a) => a.id === editing ? { ...a, ...editData } as AppLink : a))
    setEditing(null); setEditData({})
  }

  const addApp = () => {
    const newApp: AppLink = { id: Date.now().toString(), name: 'New App', url: 'http://', icon: '🔗', newTab: true }
    save([...apps, newApp])
    startEdit(newApp)
  }

  const removeApp = (id: string) => { save(apps.filter((a) => a.id !== id)); if (editing === id) setEditing(null) }

  const handleIconUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setEditData((d) => ({ ...d, icon: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const s = {
    input: {
      background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
      borderRadius: '6px', padding: '5px 8px', fontSize: '13px', outline: 'none', width: '100%',
    } as React.CSSProperties,
    row: {
      display: 'flex', alignItems: 'center', gap: '8px',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '8px 10px',
    } as React.CSSProperties,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Section Title
        </label>
        <input style={s.input} value={(config.title as string) || 'My Apps'} onChange={(e) => onChange('title', e.target.value)} />
      </div>

      {/* Apps */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Apps ({apps.length})
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {apps.map((app) => (
            <div key={app.id}>
              {editing === app.id ? (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Icon row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <AppIcon icon={editData.icon || '🔗'} />
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input
                        style={{ ...s.input, fontSize: '20px', textAlign: 'center' }}
                        value={editData.icon?.startsWith('data:') ? '' : (editData.icon || '')}
                        onChange={(e) => setEditData((d) => ({ ...d, icon: e.target.value }))}
                        placeholder="Emoji (z.B. 🐳)"
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', flexShrink: 0 }}
                    >
                      <Upload size={12} /> Bild
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])} />
                  </div>

                  <input style={s.input} value={editData.name || ''} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} placeholder="App Name" />
                  <input style={s.input} value={editData.url || ''} onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))} placeholder="http://192.168.1.x:port" />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={editData.newTab ?? true} onChange={(e) => setEditData((d) => ({ ...d, newTab: e.target.checked }))} />
                      Neuer Tab öffnen
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditing(null)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={13} />
                      </button>
                      <button onClick={commitEdit} style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Check size={13} /> Speichern
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={s.row}>
                  <AppIcon icon={app.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{app.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.url}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{app.newTab ? '↗ neuer Tab' : '→ gleicher Tab'}</span>
                  <button onClick={() => startEdit(app)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><Edit3 size={13} /></button>
                  <button onClick={() => removeApp(app.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addApp} style={{ marginTop: '8px', width: '100%', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--accent)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Plus size={14} /> App hinzufügen
        </button>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
