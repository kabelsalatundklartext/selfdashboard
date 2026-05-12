'use client'

import { useState } from 'react'
import { X, Plus, Check, Search } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Portal } from '@/components/ui/Portal'
import type { PluginCategory } from '@/types'
import { nanoid } from './nanoid'

interface Props { open: boolean; onClose: () => void }

export function PluginStoreModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const { addPlugin, activeDashboard, locale } = useDashboardStore()
  const existingPlugins = activeDashboard().plugins

  if (!open) return null

  const CATEGORY_LABELS: Record<PluginCategory, string> = {
    media: t(locale, 'media'),
    system: t(locale, 'system'),
    network: t(locale, 'network'),
    storage: t(locale, 'storage'),
    security: t(locale, 'security'),
    productivity: t(locale, 'productivity'),
    utility: t(locale, 'utility'),
  }

  const allPlugins = pluginRegistry.getAll()
  const filtered = allPlugins.filter(
    (p) =>
      p.meta.name.toLowerCase().includes(search.toLowerCase()) ||
      p.meta.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (pluginId: string) => {
    const plugin = pluginRegistry.get(pluginId)
    if (!plugin) return
    addPlugin({
      instanceId: nanoid(),
      pluginId,
      config: {},
      layout: { x: 0, y: Infinity, w: 4, h: 4 },
    })
    setAdded((prev) => new Set(prev).add(pluginId))
  }

  return (
    <Portal>
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{zIndex: 99999}}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative flex flex-col w-full max-w-2xl rounded-2xl animate-fade-in overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {t(locale, 'pluginStore')}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {allPlugins.length} {t(locale, 'pluginsAvailable')}
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
              placeholder={t(locale, 'searchPlugins')}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">{t(locale, 'noPluginsFound')}</p>
            </div>
          ) : (
            filtered.map(({ meta }) => {
              const isAdded = added.has(meta.id) || existingPlugins.some((p) => p.pluginId === meta.id)
              return (
                <div
                  key={meta.id}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: 'var(--surface)' }}
                  >
                    {meta.icon ?? '🧩'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                        {meta.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
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
                  <button
                    onClick={() => !isAdded && handleAdd(meta.id)}
                    className={isAdded ? 'btn-ghost p-2' : 'btn-accent'}
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <Check size={16} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <><Plus size={14} />{t(locale, 'add')}</>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-xs text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          💡 {t(locale, 'devHint')}{' '}
          <a href="https://github.com/kabelsalatundklartext/selfdashboard/blob/main/docs/PLUGIN_DEV.md"
            target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            {t(locale, 'readTheDocs')}
          </a>
        </div>
      </div>
    </div>
    </Portal>
  )
}
