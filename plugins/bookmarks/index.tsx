'use client'

import { useState } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, Check, X } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links to your self-hosted services. Add, edit and remove apps with custom icons.',
  version: '1.1.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
  configSchema: [
    { key: 'title', label: 'Section Title', type: 'text', defaultValue: 'My Apps' },
    { key: 'apps', label: 'Apps (JSON)', type: 'text', defaultValue: '[]' },
  ],
}

interface AppLink {
  id: string
  name: string
  url: string
  icon: string
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
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all group"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <span className="text-xl flex-shrink-0">{app.icon || '🔗'}</span>
            <span className="text-sm font-medium truncate flex-1">{app.name}</span>
            {app.newTab && (
              <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
          </a>
        ))}
        {apps.length === 0 && (
          <p className="text-xs col-span-2 text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No apps yet — open settings to add some
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

  const save = (updated: AppLink[]) => {
    setApps(updated)
    onChange('apps', JSON.stringify(updated))
  }

  const startEdit = (app: AppLink) => {
    setEditing(app.id)
    setEditData({ ...app })
  }

  const commitEdit = () => {
    if (!editing) return
    const updated = apps.map((a) =>
      a.id === editing ? { ...a, ...editData } as AppLink : a
    )
    save(updated)
    setEditing(null)
    setEditData({})
  }

  const addApp = () => {
    const newApp: AppLink = {
      id: Date.now().toString(),
      name: 'New App',
      url: 'http://',
      icon: '🔗',
      newTab: true,
    }
    const updated = [...apps, newApp]
    save(updated)
    startEdit(newApp)
  }

  const removeApp = (id: string) => {
    save(apps.filter((a) => a.id !== id))
    if (editing === id) setEditing(null)
  }

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          Section Title
        </label>
        <input
          style={inputStyle}
          value={(config.title as string) || 'My Apps'}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </div>

      {/* Apps List */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Apps ({apps.length})
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {apps.map((app) => (
            <div key={app.id}>
              {editing === app.id ? (
                // Edit form
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--accent)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '8px' }}>
                    <input
                      style={{ ...inputStyle, textAlign: 'center', fontSize: '20px' }}
                      value={editData.icon || ''}
                      onChange={(e) => setEditData((d) => ({ ...d, icon: e.target.value }))}
                      placeholder="🔗"
                      title="Emoji Icon"
                    />
                    <input
                      style={inputStyle}
                      value={editData.name || ''}
                      onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                      placeholder="App Name"
                    />
                  </div>
                  <input
                    style={inputStyle}
                    value={editData.url || ''}
                    onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))}
                    placeholder="http://192.168.1.x:port"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editData.newTab ?? true}
                        onChange={(e) => setEditData((d) => ({ ...d, newTab: e.target.checked }))}
                      />
                      Open in new tab
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditing(null)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={13} />
                      </button>
                      <button onClick={commitEdit}
                        style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Check size={13} /> Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // App row
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                }}>
                  <span style={{ fontSize: '18px' }}>{app.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{app.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.url}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {app.newTab ? '↗ new tab' : '→ same'}
                  </span>
                  <button onClick={() => startEdit(app)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => removeApp(app.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={addApp}
          style={{
            marginTop: '8px',
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Plus size={14} /> Add App
        </button>
      </div>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
