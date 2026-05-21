'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { PluginMeta } from '@/types'
import { X, Plus, Check, Search, RefreshCw } from 'lucide-react'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Portal } from '@/components/ui/Portal'
import type { PluginCategory } from '@/types'
import { nanoid } from './nanoid'
import { PluginMetaIcon } from '@/components/plugins/PluginMetaIcon'

interface Props { open: boolean; onClose: () => void }

export function PluginStoreModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [reloadBusy, setReloadBusy] = useState(false)
  const [reloadMsg, setReloadMsg] = useState<string | null>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const { addPlugin, activeDashboard, locale } = useDashboardStore()
  const existingPlugins = activeDashboard().plugins
  const [remotePlugins, setRemotePlugins] = useState<
    (PluginMeta & { installed: boolean; files?: string[] })[]
  >([])
  const [githubConfigured, setGithubConfigured] = useState(false)

  useEffect(() => {
    if (!open) return
    void (async () => {
      try {
        const res = await fetch('/api/plugins/remote-catalog', { cache: 'no-store' })
        const j = (await res.json()) as {
          configured?: boolean
          available?: (PluginMeta & { installed: boolean; files?: string[] })[]
        }
        setGithubConfigured(!!j.configured)
        setRemotePlugins(j.available ?? [])
      } catch {
        setGithubConfigured(false)
        setRemotePlugins([])
      }
    })()
  }, [open])

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
  const remoteToInstall = remotePlugins.filter((p) => !p.installed)
  const remoteFiltered = remoteToInstall.filter((p) => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  })

  const filtered = allPlugins.filter(
    (p) => {
      const displayName = p.meta.id === 'iframe' ? t(locale, 'iframeName') : p.meta.name
      const displayDesc = p.meta.id === 'iframe' ? t(locale, 'iframeDesc') : p.meta.description
      const q = search.toLowerCase()
      return displayName.toLowerCase().includes(q) || displayDesc.toLowerCase().includes(q)
    }
  )

  const handleSeedPlugins = useCallback(async () => {
    setReloadBusy(true)
    setReloadMsg(null)
    try {
      const res = await fetch('/api/plugins/seed-custom', { method: 'POST' })
      const j = (await res.json()) as { copied?: string[]; skipped?: string[]; hint?: string }
      if (!res.ok) throw new Error('seed_failed')
      const c = (j.copied ?? []).length
      const s = (j.skipped ?? []).length
      setReloadMsg(
        locale === 'de'
          ? `${c} neu, ${s} übersprungen. ${j.hint ?? ''}`
          : `${c} new, ${s} skipped. ${j.hint ?? ''}`,
      )
    } catch {
      setReloadMsg(locale === 'de' ? 'Befüllen fehlgeschlagen.' : 'Seed failed.')
    } finally {
      setReloadBusy(false)
    }
  }, [locale])

  const handleUploadZip = useCallback(async (file: File) => {
    setReloadBusy(true)
    setReloadMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/plugins/upload-zip', { method: 'POST', body: fd })
      const j = (await res.json()) as { installed?: string[]; errors?: string[]; hint?: string }
      if (!res.ok) throw new Error('upload_failed')
      setReloadMsg(
        locale === 'de'
          ? `Installiert: ${(j.installed ?? []).join(', ') || '—'}. Seite neu laden (Strg+F5). ${j.hint ?? ''}`
          : `Installed: ${(j.installed ?? []).join(', ') || '—'}. Reload page (Ctrl+F5). ${j.hint ?? ''}`,
      )
    } catch {
      setReloadMsg(locale === 'de' ? 'ZIP-Upload fehlgeschlagen.' : 'ZIP upload failed.')
    } finally {
      setReloadBusy(false)
    }
  }, [locale])

  const handleReloadPlugins = useCallback(async () => {
    setReloadBusy(true)
    setReloadMsg(null)
    try {
      const res = await fetch('/api/plugins/reload', { method: 'POST' })
      const j = (await res.json()) as { count?: number; hint?: string }
      if (!res.ok) throw new Error('reload_failed')
      setReloadMsg(
        locale === 'de'
          ? `${j.count ?? 0} Manifest(e) geladen. Seite neu laden (Strg+F5). ${j.hint ?? ''}`
          : `${j.count ?? 0} manifest(s) loaded. Reload page (Ctrl+F5). ${j.hint ?? ''}`,
      )
      const rc = await fetch('/api/plugins/remote-catalog', { cache: 'no-store' })
      const rj = (await rc.json()) as { available?: typeof remotePlugins }
      setRemotePlugins(rj.available ?? [])
    } catch {
      setReloadMsg(locale === 'de' ? 'Neuladen fehlgeschlagen.' : 'Reload failed.')
    } finally {
      setReloadBusy(false)
    }
  }, [locale])

  const handleInstallRemote = useCallback(
    async (pluginId: string) => {
      setReloadBusy(true)
      setReloadMsg(null)
      try {
        const res = await fetch('/api/plugins/install-remote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluginId }),
        })
        const j = (await res.json()) as { ok?: boolean; hint?: string; error?: string }
        if (!res.ok) throw new Error(j.error ?? 'install_failed')
        setReloadMsg(j.hint ?? (locale === 'de' ? 'Installiert — Seite wird neu geladen…' : 'Installed — reloading…'))
        window.setTimeout(() => window.location.reload(), 800)
      } catch (e) {
        setReloadMsg(
          locale === 'de'
            ? `Installation fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`
            : `Install failed: ${e instanceof Error ? e.message : String(e)}`,
        )
      } finally {
        setReloadBusy(false)
      }
    },
    [locale],
  )

  const handleAdd = (pluginId: string) => {
    try {
      const plugin = pluginRegistry.get(pluginId)
      if (!plugin) return
      let nextY = 0
      for (const p of existingPlugins) {
        const y = p.layout?.y
        const h = p.layout?.h ?? 4
        if (typeof y === 'number' && Number.isFinite(y)) nextY = Math.max(nextY, y + h)
      }
      const fromMeta = plugin.meta.defaultLayout ?? {}
      const w = Math.max(1, Math.round(Number(fromMeta.w) || 4))
      const h = Math.max(1, Math.round(Number(fromMeta.h) || 4))
      addPlugin({
        instanceId: nanoid(),
        pluginId,
        config: {},
        layout: {
          x: 0,
          y: nextY,
          w,
          h,
          minW: fromMeta.minW,
          minH: fromMeta.minH,
          maxW: fromMeta.maxW,
          maxH: fromMeta.maxH,
        },
      })
    } catch (e) {
      console.error('[SelfDashboard] addPlugin failed', pluginId, e)
      return
    }
    setAdded((prev) => new Set(prev).add(pluginId))
    // Reset checkmark after 1.5s
    setTimeout(() => setAdded((prev) => { const n = new Set(prev); n.delete(pluginId); return n }), 1500)
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
          <div className="flex items-center gap-1">
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUploadZip(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="btn-ghost px-2 py-1.5 text-xs"
              title={t(locale, 'uploadPluginZipHint')}
              disabled={reloadBusy}
              onClick={() => zipInputRef.current?.click()}
            >
              {t(locale, 'uploadPluginZip')}
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1.5 text-xs"
              title={t(locale, 'seedPluginsHint')}
              disabled={reloadBusy}
              onClick={() => void handleSeedPlugins()}
            >
              {t(locale, 'seedPlugins')}
            </button>
            <button
              type="button"
              className="btn-ghost p-1.5"
              title={t(locale, 'reloadPluginsHint')}
              disabled={reloadBusy}
              onClick={() => void handleReloadPlugins()}
            >
              <RefreshCw size={16} className={reloadBusy ? 'animate-spin' : undefined} />
            </button>
            <button className="btn-ghost p-1.5" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        {reloadMsg && (
          <p className="px-6 -mt-2 pb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {reloadMsg}
          </p>
        )}

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
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {githubConfigured && remoteFiltered.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {t(locale, 'pluginsFromGitHub')}
              </p>
              <div className="space-y-2">
                {remoteFiltered.map((meta) => (
                  <div
                    key={`gh-${meta.id}`}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}
                  >
                    <PluginMetaIcon meta={meta} size={40} style={{ background: 'var(--surface)' }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{meta.name}</span>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>GitHub · v{meta.version}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-accent"
                      title={t(locale, 'installPluginHint')}
                      disabled={reloadBusy}
                      onClick={() => void handleInstallRemote(meta.id)}
                    >
                      <Plus size={14} />
                      {t(locale, 'installPlugin')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'pluginsInstalledLocal')}
          </p>
          {filtered.length === 0 && remoteFiltered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">{t(locale, 'noPluginsFound')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              {githubConfigured
                ? t(locale, 'installPluginHint')
                : t(locale, 'githubNotConfigured')}
            </p>
          ) : (
            filtered.map(({ meta }) => {
              const isAdded = added.has(meta.id) || existingPlugins.some((p) => p.pluginId === meta.id)
              const displayName = meta.id === 'iframe' ? t(locale, 'iframeName') : meta.name
              const displayDesc = meta.id === 'iframe' ? t(locale, 'iframeDesc') : meta.description
              return (
                <div
                  key={meta.id}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <PluginMetaIcon meta={meta} size={40} style={{ background: 'var(--surface)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                        {displayName}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        {CATEGORY_LABELS[meta.category as PluginCategory] ?? meta.category}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {displayDesc}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      by {meta.author} · v{meta.version}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(meta.id)}
                    className="btn-accent"
                  >
                    {added.has(meta.id)
                      ? <><Check size={14} />{t(locale, 'add')}</>
                      : <><Plus size={14} />{t(locale, 'add')}</>
                    }
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
