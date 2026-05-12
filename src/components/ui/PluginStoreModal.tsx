'use client'

import { useState } from 'react'
import { X, Plus, Check, Search } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import type { PluginCategory } from '@/types'
import { nanoid } from './nanoid'

interface Props { open: boolean; onClose: () => void }

const CATEGORY_LABELS: Record<PluginCategory, string> = {
  media: '🎬 Media',
  system: '🖥️ System',
  network: '🌐 Network',
  storage: '💾 Storage',
  security: '🔒 Security',
  productivity: '📋 Productivity',
  utility: '🔧 Utility',
}

export function PluginStoreModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const addPlugin = useDashboardStore((s) => s.addPlugin)
  const existingPlugins = useDashboardStore((s) => s.plugins)

  if (!open) return null

  const allPlugins = pluginRegistry.getAll()
  const filtered = allPlugins.filter(
    (p) =>
      p.meta.name.toLowerCase().includes(search.toLowerCase()) ||
      p.meta.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (pluginId: string) => {
    const plugin = pluginRegistry.get(pluginId)
    if (!plugin) return

    const instance = {
      instanceId: nanoid(),
      pluginId,
      config: {},
      layout: { x: 0, y: Infinity, w: plugin.meta.id === 'bookmarks' ? 4 : 2, h: 3 },
    }
    addPlugin(instance)
    setAdded((prev) => new Set(prev).add(pluginId))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div
        className="relative flex flex-col w-full max-w-2xl rounded-2xl animate-fade-in overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Plugin Store
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {allPlugins.length} plugin{allPlugins.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plugins..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No plugins found</p>
            </div>
          ) : (
            filtered.map(({ meta }) => {
              const isAdded = added.has(meta.id)
              const alreadyOnDash = existingPlugins.some((p) => p.pluginId === meta.id)

              return (
                <div
                  key={meta.id}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: 'var(--surface)' }}
                  >
                    {meta.icon ?? '🧩'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                        {meta.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {CATEGORY_LABELS[meta.category]}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {meta.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      by {meta.author} · v{meta.version}
                    </p>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => !isAdded && !alreadyOnDash && handleAdd(meta.id)}
                    className={isAdded || alreadyOnDash ? 'btn-ghost p-2' : 'btn-accent'}
                    disabled={isAdded || alreadyOnDash}
                  >
                    {isAdded || alreadyOnDash ? (
                      <Check size={16} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <>
                        <Plus size={14} />
                        Add
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-xs text-center"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          💡 Developers can create their own plugins —{' '}
          <a
            href="https://github.com/yourusername/selfdashboard/blob/main/docs/PLUGIN_DEV.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            read the docs
          </a>
        </div>
      </div>
    </div>
  )
}
