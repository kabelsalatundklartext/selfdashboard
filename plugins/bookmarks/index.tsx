'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, Check, X, Upload, GripVertical, FolderPlus } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links to your self-hosted services with groups and custom icons.',
  version: '1.3.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
}

interface AppLink {
  id: string
  name: string
  url: string
  icon: string
  newTab: boolean
  group?: string
}

interface Group {
  id: string
  name: string
}

interface BookmarkData {
  apps: AppLink[]
  groups: Group[]
}

const DEFAULT_DATA: BookmarkData = {
  groups: [{ id: 'default', name: 'My Apps' }],
  apps: [
    { id: '1', name: 'Portainer', url: 'http://localhost:9000', icon: '🐳', newTab: true, group: 'default' },
    { id: '2', name: 'Nextcloud', url: 'http://localhost:8080', icon: '☁️', newTab: true, group: 'default' },
    { id: '3', name: 'Jellyfin', url: 'http://localhost:8096', icon: '🎬', newTab: true, group: 'default' },
    { id: '4', name: 'Unraid', url: 'http://tower', icon: '🖥️', newTab: true, group: 'default' },
  ],
}

function parseData(raw: unknown): BookmarkData {
  try {
    const parsed = JSON.parse(raw as string)
    if (parsed && parsed.apps) return parsed
    // Legacy: plain array
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { groups: [{ id: 'default', name: 'My Apps' }], apps: parsed.map((a: AppLink) => ({ ...a, group: 'default' })) }
    }
  } catch {}
  return DEFAULT_DATA
}

function AppIcon({ icon }: { icon: string }) {
  if (icon?.startsWith('data:') || icon?.startsWith('http')) {
    return <img src={icon} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
  }
  return <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>{icon || '🔗'}</span>
}

// ── Widget ───────────────────────────────────────────────────
function Widget({ config }: PluginWidgetProps) {
  const data = parseData(config.data ?? config.apps)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      {data.groups.map((group) => {
        const apps = data.apps.filter((a) => a.group === group.id)
        if (apps.length === 0) return null
        return (
          <div key={group.id}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {group.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {apps.map((app) => (
                <a key={app.id} href={app.url} target={app.newTab ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <AppIcon icon={app.icon} />
                  <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
                  {app.newTab && <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Settings ─────────────────────────────────────────────────
function Settings({ config, onChange }: PluginSettingsProps) {
  const data = parseData(config.data ?? config.apps)
  const [apps, setApps] = useState<AppLink[]>(data.apps)
  const [groups, setGroups] = useState<Group[]>(data.groups)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AppLink>>({})
  const [dragOver, setDragOver] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<string | null>(null)

  const saveAll = (newApps: AppLink[], newGroups: Group[]) => {
    setApps(newApps); setGroups(newGroups)
    onChange('data', JSON.stringify({ apps: newApps, groups: newGroups }))
  }

  const startEdit = (app: AppLink) => { setEditing(app.id); setEditData({ ...app }) }

  const commitEdit = () => {
    if (!editing) return
    const updated = apps.map((a) => a.id === editing ? { ...a, ...editData } as AppLink : a)
    saveAll(updated, groups); setEditing(null); setEditData({})
  }

  const addApp = (groupId: string) => {
    const newApp: AppLink = { id: Date.now().toString(), name: 'Neue App', url: 'http://', icon: '🔗', newTab: true, group: groupId }
    const updated = [...apps, newApp]
    saveAll(updated, groups); startEdit(newApp)
  }

  const addGroup = () => {
    const newGroup: Group = { id: Date.now().toString(), name: 'Neue Gruppe' }
    saveAll(apps, [...groups, newGroup])
  }

  const removeApp = (id: string) => { saveAll(apps.filter((a) => a.id !== id), groups); if (editing === id) setEditing(null) }
  const removeGroup = (id: string) => { saveAll(apps.filter((a) => a.group !== id), groups.filter((g) => g.id !== id)) }
  const renameGroup = (id: string, name: string) => saveAll(apps, groups.map((g) => g.id === id ? { ...g, name } : g))

  const handleIconUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => setEditData((d) => ({ ...d, icon: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  // Drag to reorder
  const onDragStart = (id: string) => { dragItem.current = id }
  const onDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOver(id) }
  const onDrop = (targetId: string) => {
    if (!dragItem.current || dragItem.current === targetId) { setDragOver(null); return }
    const from = apps.findIndex((a) => a.id === dragItem.current)
    const to = apps.findIndex((a) => a.id === targetId)
    const updated = [...apps]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    saveAll(updated, groups)
    dragItem.current = null; setDragOver(null)
  }

  const s = {
    input: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', outline: 'none', width: '100%' } as React.CSSProperties,
    row: (isDragOver: boolean) => ({ display: 'flex', alignItems: 'center', gap: '8px', background: isDragOver ? 'var(--accent)11' : 'var(--surface-2)', border: `1px solid ${isDragOver ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', padding: '8px 10px', transition: 'all 0.15s' } as React.CSSProperties),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map((group) => (
        <div key={group.id}>
          {/* Group header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              style={{ ...s.input, fontWeight: 600, flex: 1 }}
              value={group.name}
              onChange={(e) => renameGroup(group.id, e.target.value)}
            />
            <button onClick={() => addApp(group.id)}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', flexShrink: 0 }}>
              <Plus size={12} />
            </button>
            {groups.length > 1 && (
              <button onClick={() => removeGroup(group.id)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Apps in group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {apps.filter((a) => a.group === group.id).map((app) => (
              <div key={app.id}>
                {editing === app.id ? (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Icon row */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        <AppIcon icon={editData.icon || '🔗'} />
                      </div>
                      <input style={{ ...s.input, fontSize: '18px', textAlign: 'center' }}
                        value={editData.icon?.startsWith('data:') ? '' : (editData.icon || '')}
                        onChange={(e) => setEditData((d) => ({ ...d, icon: e.target.value }))}
                        placeholder="Emoji" />
                      <button onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                        <Upload size={13} />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])} />
                    </div>
                    {/* Group selector */}
                    <select style={{ ...s.input }} value={editData.group || group.id}
                      onChange={(e) => setEditData((d) => ({ ...d, group: e.target.value }))}>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input style={s.input} value={editData.name || ''} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} placeholder="App Name" />
                    <input style={s.input} value={editData.url || ''} onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))} placeholder="http://192.168.1.x:port" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editData.newTab ?? true} onChange={(e) => setEditData((d) => ({ ...d, newTab: e.target.checked }))} />
                        Neuer Tab
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setEditing(null)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={13} /></button>
                        <button onClick={commitEdit} style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><Check size={13} /> OK</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    draggable
                    onDragStart={() => onDragStart(app.id)}
                    onDragOver={(e) => onDragOver(e, app.id)}
                    onDrop={() => onDrop(app.id)}
                    onDragEnd={() => setDragOver(null)}
                    style={s.row(dragOver === app.id)}
                  >
                    <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                    <AppIcon icon={app.icon} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{app.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.url}</p>
                    </div>
                    <button onClick={() => startEdit(app)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><Edit3 size={13} /></button>
                    <button onClick={() => removeApp(app.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Group */}
      <button onClick={addGroup}
        style={{ width: '100%', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <FolderPlus size={14} /> {' '}Gruppe hinzufügen
      </button>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
