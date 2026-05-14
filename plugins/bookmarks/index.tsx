'use client'

import type { CSSProperties } from 'react'
import { useRef, useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, Check, X, Upload, GripVertical, FolderPlus } from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginWidgetProps, PluginSettingsProps } from '@/types'
import { usePluginLocale } from '@/lib/pluginLocale'

export const meta: PluginMeta = {
  id: 'bookmarks',
  name: 'App Bookmarks',
  description: 'Quick links with groups, custom icons, drag & drop, responsive grid or horizontal row.',
  version: '1.6.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🔖',
}

interface AppLink { id: string; name: string; url: string; icon: string; newTab: boolean; group: string }
interface Group { id: string; name: string; hidden?: boolean }
interface BookmarkData {
  apps: AppLink[]
  groups: Group[]
  layout?: 'grid' | 'row'
  /** Mindestbreite einer Kachel (px), Raster + Zeile. */
  tileMinPx?: number
  /** Max. Breite beim Mitwachsen (px), nur wenn tileFixed false. */
  tileMaxPx?: number
  /** true = feste Spaltenbreite (kein 1fr-Aufziehen). */
  tileFixed?: boolean
}

const DEFAULT_DATA: BookmarkData = {
  layout: 'grid',
  tileMinPx: 108,
  tileMaxPx: 240,
  tileFixed: false,
  groups: [{ id: 'default', name: 'Meine Apps' }],
  apps: [
    { id: '1', name: 'Portainer', url: 'http://localhost:9000', icon: '🐳', newTab: true, group: 'default' },
    { id: '2', name: 'Nextcloud', url: 'http://localhost:8080', icon: '☁️', newTab: true, group: 'default' },
    { id: '3', name: 'Jellyfin', url: 'http://localhost:8096', icon: '🎬', newTab: true, group: 'default' },
    { id: '4', name: 'Unraid', url: 'http://tower', icon: '🖥️', newTab: true, group: 'default' },
  ],
}

function clampTileMin(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return 108
  return Math.min(240, Math.max(72, Math.round(n)))
}

function clampTileMax(v: unknown, minPx: number): number {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n)) return Math.max(200, minPx + 32)
  return Math.min(400, Math.max(minPx + 40, Math.round(n)))
}

function normalizeTiles(p: Record<string, unknown> | undefined): Pick<BookmarkData, 'tileMinPx' | 'tileMaxPx' | 'tileFixed'> {
  const raw = p ?? {}
  const min = clampTileMin(raw.tileMinPx)
  return {
    tileMinPx: min,
    tileMaxPx: clampTileMax(raw.tileMaxPx, min),
    tileFixed: raw.tileFixed === true,
  }
}

function parseData(raw: unknown): BookmarkData {
  try {
    const p = JSON.parse(raw as string)
    const layout: 'grid' | 'row' = p?.layout === 'row' ? 'row' : 'grid'
    const tiles = normalizeTiles(p as Record<string, unknown>)
    if (p?.apps) {
      return {
        apps: p.apps,
        groups: p.groups?.length ? p.groups : [{ id: 'default', name: 'Meine Apps' }],
        layout,
        ...tiles,
      }
    }
    if (Array.isArray(p) && p.length > 0)
      return {
        layout: 'grid',
        groups: [{ id: 'default', name: 'Meine Apps' }],
        apps: p.map((a: AppLink) => ({ ...a, group: 'default' })),
        ...normalizeTiles(undefined),
      }
  } catch {}
  return DEFAULT_DATA
}

function serializeBookmarkData(
  a: AppLink[],
  g: Group[],
  l: 'grid' | 'row',
  tileMin: number,
  tileMax: number,
  tileFixed: boolean,
): string {
  const min = clampTileMin(tileMin)
  const max = clampTileMax(tileMax, min)
  return JSON.stringify({ apps: a, groups: g, layout: l, tileMinPx: min, tileMaxPx: max, tileFixed })
}

function AppIcon({ icon }: { icon: string }) {
  if (icon?.startsWith('data:') || icon?.startsWith('http'))
    return (
      <img
        src={icon}
        alt=""
        style={{
          width: 'clamp(18px, 5cqmin, 26px)',
          height: 'clamp(18px, 5cqmin, 26px)',
          borderRadius: '4px',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  return (
    <span style={{ fontSize: 'clamp(16px, 4.5cqmin, 20px)', flexShrink: 0, lineHeight: 1 }}>{icon || '🔗'}</span>
  )
}

const linkBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '8px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  textDecoration: 'none',
  transition: 'border-color 0.15s',
}

// ── Widget ───────────────────────────────────────────────────
function Widget({ config }: PluginWidgetProps) {
  const data = parseData(config.data ?? config.apps)
  const layout = data.layout ?? 'grid'
  const minPx = clampTileMin(data.tileMinPx)
  const maxPx = clampTileMax(data.tileMaxPx ?? 240, minPx)
  const tileFixed = data.tileFixed === true

  const gridTemplateColumns =
    layout === 'grid'
      ? tileFixed
        ? `repeat(auto-fill, minmax(${minPx}px, ${minPx}px))`
        : `repeat(auto-fit, minmax(min(100%, clamp(${minPx}px, 24cqmin, ${maxPx}px)), 1fr))`
      : undefined

  const outer: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100%',
    width: '100%',
    overflow: 'auto',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 0,
    boxSizing: 'border-box',
    containerType: 'size',
  }
  return (
    <div style={outer}>
      {data.groups.map((group) => {
        const apps = data.apps.filter((a) => a.group === group.id)
        if (apps.length === 0 || group.hidden) return null
        const listStyle: CSSProperties =
          layout === 'row'
            ? {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: '6px',
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
              }
            : {
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns!,
                gap: 'clamp(4px, 1.5cqmin, 10px)',
                alignContent: 'start',
                width: '100%',
                flex: 1,
                minHeight: 0,
              }
        return (
          <div key={group.id} style={{ minWidth: 0, flex: layout === 'grid' ? 1 : undefined, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {data.groups.length > 1 && (
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{group.name}</p>
            )}
            <div style={listStyle}>
              {apps.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  target={app.newTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={{
                    ...linkBaseStyle,
                    flex: layout === 'row' ? '0 0 auto' : undefined,
                    width: layout === 'grid' ? '100%' : undefined,
                    minWidth: layout === 'row' ? `${minPx}px` : undefined,
                    maxWidth: layout === 'row' ? (tileFixed ? `${minPx}px` : `min(${maxPx}px, 95cqw)`) : undefined,
                    minHeight: layout === 'grid' ? 'clamp(40px, 11cqmin, 52px)' : undefined,
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <AppIcon icon={app.icon} />
                  <span style={{ fontSize: 'clamp(11px, 3.2cqmin, 14px)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
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
  const { de } = usePluginLocale()
  const data = parseData(config.data ?? config.apps)
  const [apps, setApps] = useState<AppLink[]>(data.apps)
  const [groups, setGroups] = useState<Group[]>(data.groups)
  const [layout, setLayout] = useState<'grid' | 'row'>(() => parseData(config.data ?? config.apps).layout ?? 'grid')
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AppLink>>({})
  const [dragAppId, setDragAppId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [tileMin, setTileMin] = useState(() => clampTileMin(data.tileMinPx))
  const [tileMax, setTileMax] = useState(() => clampTileMax(data.tileMaxPx ?? 240, clampTileMin(data.tileMinPx)))
  const [tileFixed, setTileFixed] = useState(() => data.tileFixed === true)

  useEffect(() => {
    const d = parseData(config.data ?? config.apps)
    setApps(d.apps)
    setGroups(d.groups)
    setLayout(d.layout ?? 'grid')
    setTileMin(clampTileMin(d.tileMinPx))
    setTileMax(clampTileMax(d.tileMaxPx ?? 240, clampTileMin(d.tileMinPx)))
    setTileFixed(d.tileFixed === true)
  }, [config.data, config.apps])

  const saveAll = (a: AppLink[], g: Group[], nextLayout?: 'grid' | 'row') => {
    const l = nextLayout ?? layout
    setApps(a)
    setGroups(g)
    if (nextLayout !== undefined) setLayout(l)
    onChange('data', serializeBookmarkData(a, g, l, tileMin, tileMax, tileFixed))
  }

  const persistTiles = (next: { min?: number; max?: number; fixed?: boolean }) => {
    const tm = clampTileMin(next.min ?? tileMin)
    const tx = clampTileMax(next.max ?? tileMax, tm)
    const tf = next.fixed ?? tileFixed
    setTileMin(tm)
    setTileMax(tx)
    if (next.fixed !== undefined) setTileFixed(tf)
    onChange('data', serializeBookmarkData(apps, groups, layout, tm, tx, tf))
  }

  const startEdit = (app: AppLink) => { setEditing(app.id); setEditData({ ...app }) }
  const commitEdit = () => {
    if (!editing) return
    saveAll(apps.map((a) => a.id === editing ? { ...a, ...editData } as AppLink : a), groups)
    setEditing(null); setEditData({})
  }

  const addApp = (groupId: string) => {
    const n: AppLink = { id: Date.now().toString(), name: de ? 'Neue App' : 'New app', url: 'http://', icon: '🔗', newTab: true, group: groupId }
    saveAll([...apps, n], groups); startEdit(n)
  }
  const removeApp = (id: string) => { saveAll(apps.filter((a) => a.id !== id), groups); if (editing === id) setEditing(null) }
  const addGroup = () => { const g: Group = { id: Date.now().toString(), name: de ? 'Neue Gruppe' : 'New group' }; saveAll(apps, [...groups, g]) }
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

  const inp: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', outline: 'none', width: '100%' }

  const layoutBtn = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: '8px 10px',
    borderRadius: '8px',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent)22' : 'var(--surface-2)',
    color: 'var(--text)',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 6px' }}>
          {de ? 'Darstellung' : 'Layout'}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => saveAll(apps, groups, 'grid')} style={layoutBtn(layout === 'grid')}>
            {de ? 'Raster (Kacheln füllen die Breite, weniger Spalten wenn schmal)' : 'Grid (tiles grow to fill width; fewer columns when narrow)'}
          </button>
          <button type="button" onClick={() => saveAll(apps, groups, 'row')} style={layoutBtn(layout === 'row')}>
            {de ? 'Waagerecht (scrollbar)' : 'Horizontal (scroll)'}
          </button>
        </div>
      </div>

      <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 8px' }}>
          {de ? 'Kachelbreite' : 'Tile width'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text)' }}>
            {de ? 'Min. (px)' : 'Min (px)'}
            <input
              type="number"
              min={72}
              max={240}
              step={4}
              value={tileMin}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!Number.isFinite(n)) return
                persistTiles({ min: n })
              }}
              style={{ ...inp, width: '88px' }}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '12px',
              color: layout === 'grid' && tileFixed ? 'var(--text-muted)' : 'var(--text)',
              opacity: layout === 'grid' && tileFixed ? 0.6 : 1,
            }}
            title={
              layout === 'grid' && tileFixed
                ? (de ? 'Bei festem Raster entspricht die Spaltenbreite der Mindestbreite.' : 'With fixed grid, column width equals min width.')
                : undefined
            }
          >
            {de ? 'Max. (px)' : 'Max (px)'}
            <input
              type="number"
              min={112}
              max={400}
              step={4}
              disabled={layout === 'grid' && tileFixed}
              value={tileMax}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!Number.isFinite(n)) return
                persistTiles({ max: n })
              }}
              style={{ ...inp, width: '88px', opacity: layout === 'grid' && tileFixed ? 0.7 : 1 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer', paddingBottom: '6px', maxWidth: '320px' }}>
            <input type="checkbox" checked={tileFixed} onChange={(e) => persistTiles({ fixed: e.target.checked })} />
            {de
              ? 'Feste Breite: Raster ohne Strecken; waagerecht gleich breite Kacheln.'
              : 'Fixed width: grid columns do not stretch; horizontal row uses equal tile width.'}
          </label>
        </div>
      </div>

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
                    <input style={inp} value={editData.name || ''} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} placeholder={de ? 'App-Name' : 'App name'} />
                    <input style={inp} value={editData.url || ''} onChange={(e) => setEditData((d) => ({ ...d, url: e.target.value }))} placeholder="http://192.168.1.x:port" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editData.newTab ?? true} onChange={(e) => setEditData((d) => ({ ...d, newTab: e.target.checked }))} />
                        {de ? 'Neuer Tab' : 'New tab'}
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
                {de ? 'Gruppe ist leer — App hinzufügen oder hierher ziehen' : 'Group is empty — add an app or drag here'}
              </p>
            )}
          </div>
        </div>
      ))}

      <button onClick={addGroup} style={{ width: '100%', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <FolderPlus size={14} /> {de ? 'Gruppe hinzufügen' : 'Add group'}
      </button>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
