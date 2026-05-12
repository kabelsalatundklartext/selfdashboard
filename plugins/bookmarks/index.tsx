'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, Check, X, Upload, GripVertical, FolderPlus } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links with groups, custom icons and drag & drop.',
  version: '1.4.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
}

interface AppLink { id: string; name: string; url: string; icon: string; newTab: boolean; group: string }
interface Group { id: string; name: string }
interface BookmarkData { apps: AppLink[]; groups: Group[] }

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
    const p = JSON.parse(raw as string)
    if (p?.apps) return p
    if (Array.isArray(p) && p.length > 0) return { groups: [{ id: 'default', name: 'My Apps' }], apps: p.map((a: AppLink) => ({ ...a, group: 'default' })) }
  } catch {}
  return DEFAULT_DATA
}

function AppIcon({ icon }: { icon: string }) {
  if (icon?.startsWith('data:') || icon?.startsWith('http'))
    return <img src={icon} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
  return <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>{icon || '🔗'}</span>
}

// ── Widget ───────────────────────────────────────────────────
function Widget({ config }: PluginWidgetProps) {
  const data = parseData(config.data ?? config.apps)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'auto' }}>
      {data.groups.map((group) => {
        const apps = data.apps.filter((a) => a.group === group.id)
        if (apps.length === 0) return null
        return (
          <div key={group.id}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{group.name}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {apps.map((app) => (
                <a key={app.id} href={app.url} target={app.newTab ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
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
  const [dragAppId, setDragAppId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const saveAll = (a: AppLink[], g: Group[]) => {
    setApps(a); setGroups(g)
    onChange('data', JSON.stringify({ apps: a, groups: g }))
  }

  const startEdit = (app: AppLink) => { setEditing(app.id); setEditData({ ...app }) }
  const commitEdit = () => {
    if (!editing) return
    saveAll(apps.map((a) => a.id === editing ? { ...a, ...editData } as AppLink : a), groups)
    setEditing(null); setEditData({})
  }

  const addApp = (groupId: string) => {
    const n: AppLink = { id: Date.now().toString(), name: 'Neue App', url: 'http://', icon: '🔗', newTab: true, group: groupId }
    saveAll([...apps, n], groups); startEdit(n)
  }
  const removeApp = (id: string) => { saveAll(apps.filter((a) => a.id !== id), groups); if (editing === id) setEditing(null) }
  const addGroup = () => { const g: Group = { id: Date.now().toString(), name: 'Neue Gruppe' }; saveAll(apps, [...groups, g]) }
  const removeGroup = (id: string) => saveAll(apps.filter((a) => a.group !== id), groups.filter((g) => g.id !== id))
  const renameGroup = (id: string, name: string) => saveAll(apps, groups.map((g) => g.id === id ? { ...g, name } : g))

  const handleIconUpload = (file: File) => {
    const r = new FileReader()
    r.onload = (e) => setEditData((d) => ({ ...d, icon: e.target?.result as string }))
    r.readAsDataURL(file)
  }

  // ── Drag & Drop (cross-group) ────────────────────────────
  const onDragStart = (id: string) => setDragAppId(id)
  const onDragEnd = () => { setDragAppId(null); setDragOverId(null); setDragOverGroup(null) }

  // Dragging over another app → reorder within same group or move
  const onDragOverApp = (e: React.DragEvent, targetId: string) => {
    e.preventDefault(); setDragOverId(targetId)
  }

  const onDropOnApp = (targetId: string) => {
    if (!dragAppId || dragAppId === targetId) { onDragEnd(); return }
    const from = apps.findIndex((a) => a.id === dragAppId)
    const to = apps.findIndex((a) => a.id === targetId)
    const updated = [...apps]
    const [item] = updated.splice(from, 1)
    // Move to target group
    item.group = updated[Math.min(to, updated.length - 1)]?.group ?? item.group
    updated.splice(to, 0, item)
    saveAll(updated, groups); onDragEnd()
  }

  // Dragging over a group header → move to that group
  const onDragOverGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault(); setDragOverGroup(groupId)
  }

  const onDropOnGroup = (groupId: string) => {
    if (!dragAppId) { onDragEnd(); return }
    saveAll(apps.map((a) => a.id === dragAppId ? { ...a, group: groupId } : a), groups)
    onDragEnd()
  }

  const inp: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', outline: 'none', width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map((group) => (
        <div key={group.id}>
          {/* Group header — drop zone */}
          <div
            onDragOver={(e) => onDragOverGroup(e, group.id)}
            onDrop={() => onDropOnGroup(group.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 8px', borderRadius: '8px', background: dragOverGroup === group.id ? 'var(--accent)18' : 'transparent', border: `1px dashed ${dragOverGroup === group.id ? 'var(--accent)' : 'transparent'}`, transition: 'all 0.15s' }}
          >
            <input style={{ ...inp, fontWeight: 600, flex: 1, background: 'transparent', border: '1px solid var(--border)' }}
              value={group.name} onChange={(e) => renameGroup(group.id, e.target.value)} />
            <button onClick={() => addApp(group.id)}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <Plus size={13} />
            </button>
            {groups.length > 1 && (
              <button onClick={() => removeGroup(group.id)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Apps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
            {apps.filter((a) => a.group === group.id).map((app) => (
              <div key={app.id}>
                {editing === app.id ? (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AppIcon icon={editData.icon || '🔗'} />
                      </div>
                      <input style={{ ...inp, fontSize: '18px', textAlign: 'center' }}
                        value={editData.icon?.startsWith('data:') ? '' : (editData.icon || '')}
                        onChange={(e) => setEditData((d) => ({ ...d, icon: e.target.value }))} placeholder="Emoji" />
                      <button onClick={() => fileRef.current?.click()}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                        <Upload size={13} />
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])} />
                    </div>
                    <select style={inp} value={editData.group || group.id} onChange={(e) => setEditData((d) => ({ ...d, group: e.target.value }))}>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input style={inp} value={editData.name || ''} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} placeholder="App Name" />
                    <input style={inp} value={editData.url || ''} onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))} placeholder="http://192.168.1.x:port" />
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
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => onDragOverApp(e, app.id)}
                    onDrop={() => onDropOnApp(app.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: dragOverId === app.id ? 'var(--accent)11' : 'var(--surface-2)',
                      border: `1px solid ${dragOverId === app.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '8px', padding: '8px 10px', cursor: 'grab', transition: 'all 0.12s',
                      opacity: dragAppId === app.id ? 0.4 : 1,
                    }}
                  >
                    <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <AppIcon icon={app.icon} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>{app.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.url}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{app.newTab ? '↗' : '→'}</span>
                    <button onClick={() => startEdit(app)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}><Edit3 size={13} /></button>
                    <button onClick={() => removeApp(app.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            ))}
            {apps.filter((a) => a.group === group.id).length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
                Gruppe ist leer — App hinzufügen oder hierher ziehen
              </p>
            )}
          </div>
        </div>
      ))}

      <button onClick={addGroup} style={{ width: '100%', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <FolderPlus size={14} /> Gruppe hinzufügen
      </button>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
