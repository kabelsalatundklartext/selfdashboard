'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { PluginMeta } from '@/types'
import { X, Plus, Check, Search, RefreshCw, ExternalLink } from 'lucide-react'
import { pluginReadmeDocUrl, PLUGIN_CATALOG_DOC_URL, PLUGIN_CATALOG_DOC_URL_DE } from '@/lib/pluginDocUrl'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Portal } from '@/components/ui/Portal'
import type { PluginCategory } from '@/types'
import { nanoid } from './nanoid'
import { PluginMetaIcon } from '@/components/plugins/PluginMetaIcon'
import { fetchPluginVolumeInfo, loadVolumeWidgetScripts } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'

interface Props { open: boolean; onClose: () => void }

type RemotePluginRow = PluginMeta & {
  installed: boolean
  installedVersion?: string | null
  updateAvailable?: boolean
  files?: string[]
}

export function PluginStoreModal({ open, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [reloadBusy, setReloadBusy] = useState(false)
  const [reloadMsg, setReloadMsg] = useState<string | null>(null)
  const [reloadMsgKind, setReloadMsgKind] = useState<'success' | 'error' | 'info'>('info')
  const [installingId, setInstallingId] = useState<string | null>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const { addPlugin, activeDashboard, locale } = useDashboardStore()
  const existingPlugins = activeDashboard()?.plugins ?? []
  const [remotePlugins, setRemotePlugins] = useState<RemotePluginRow[]>([])
  const [githubConfigured, setGithubConfigured] = useState(false)
  const [githubRepo, setGithubRepo] = useState('kabelsalatundklartext/selfdashboard')
  const [githubRef, setGithubRef] = useState('beta')
  const [volumeOnly, setVolumeOnly] = useState(false)
  const [volumeInstalledIds, setVolumeInstalledIds] = useState<string[]>([])
  const [updatesCount, setUpdatesCount] = useState(0)

  const refreshStoreData = useCallback(async () => {
    try {
      const vol = await fetchPluginVolumeInfo()
      setVolumeOnly(vol.volumeOnly)
      setVolumeInstalledIds(vol.installedIds ?? [])
    } catch {
      setVolumeOnly(false)
      setVolumeInstalledIds([])
    }
    try {
      const res = await fetch('/api/plugins/remote-catalog', { cache: 'no-store' })
      const j = (await res.json()) as {
        configured?: boolean
        available?: RemotePluginRow[]
        repository?: string | null
        ref?: string | null
        updatesCount?: number
      }
      setGithubConfigured(!!j.configured)
      setRemotePlugins(j.available ?? [])
      setUpdatesCount(typeof j.updatesCount === 'number' ? j.updatesCount : 0)
      if (j.repository) setGithubRepo(j.repository)
      if (j.ref) setGithubRef(j.ref)
    } catch {
      setGithubConfigured(false)
      setRemotePlugins([])
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void refreshStoreData()
  }, [open, refreshStoreData])

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
      const rj = (await rc.json()) as { available?: RemotePluginRow[] }
      setRemotePlugins(rj.available ?? [])
    } catch {
      setReloadMsg(locale === 'de' ? 'Neuladen fehlgeschlagen.' : 'Reload failed.')
    } finally {
      setReloadBusy(false)
    }
  }, [locale])

  const handleInstallRemote = useCallback(
    async (pluginId: string) => {
      const label =
        remotePlugins.find((p) => p.id === pluginId)?.name ?? pluginId
      setReloadBusy(true)
      setInstallingId(pluginId)
      setReloadMsg(null)
      setReloadMsgKind('info')
      try {
        const res = await fetch('/api/plugins/install-remote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluginId }),
        })
        const j = (await res.json()) as { ok?: boolean; hint?: string; error?: string }
        if (!res.ok) throw new Error(j.error ?? 'install_failed')

        installPluginExternalBridge()
        try {
          await loadVolumeWidgetScripts([pluginId])
        } catch (loadErr) {
          console.warn('[SelfDashboard] widget.js load after install', loadErr)
        }
        await refreshStoreData()

        setReloadMsgKind('success')
        const wasUpdate = remotePlugins.find((p) => p.id === pluginId)?.updateAvailable
        setReloadMsg(
          `✓ ${label} — ${wasUpdate ? t(locale, 'pluginUpdateSuccess') : t(locale, 'pluginInstallSuccess')}`,
        )
        window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
      } catch (e) {
        setReloadMsgKind('error')
        setReloadMsg(
          locale === 'de'
            ? `Installation fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`
            : `Install failed: ${e instanceof Error ? e.message : String(e)}`,
        )
      } finally {
        setInstallingId(null)
        setReloadBusy(false)
      }
    },
    [locale, remotePlugins, refreshStoreData],
  )

  const handleAdd = useCallback(
    (pluginId: string) => {
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
        setAdded((prev) => new Set(prev).add(pluginId))
        setTimeout(() => {
          setAdded((prev) => {
            const n = new Set(prev)
            n.delete(pluginId)
            return n
          })
        }, 1500)
      } catch (e) {
        console.error('[SelfDashboard] addPlugin failed', pluginId, e)
      }
    },
    [addPlugin, existingPlugins],
  )

  const categoryLabel = useCallback(
    (cat: string | undefined) => {
      const labels: Record<PluginCategory, string> = {
        media: t(locale, 'media'),
        system: t(locale, 'system'),
        network: t(locale, 'network'),
        storage: t(locale, 'storage'),
        security: t(locale, 'security'),
        productivity: t(locale, 'productivity'),
        utility: t(locale, 'utility'),
      }
      if (cat && cat in labels) return labels[cat as PluginCategory]
      return cat ?? '—'
    },
    [locale],
  )

  const allPlugins = pluginRegistry.getAll()

  const remoteFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return remotePlugins.filter((p) => {
      const name = String(p.name ?? p.id ?? '')
      const desc = String(p.description ?? '')
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    })
  }, [remotePlugins, search])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allPlugins.filter((p) => {
      const displayName = p.meta.id === 'iframe' ? t(locale, 'iframeName') : p.meta.name
      const displayDesc = p.meta.id === 'iframe' ? t(locale, 'iframeDesc') : p.meta.description
      return displayName.toLowerCase().includes(q) || displayDesc.toLowerCase().includes(q)
    })
  }, [allPlugins, locale, search])

  const sectionTitle = volumeOnly ? t(locale, 'pluginsOnVolume') : t(locale, 'pluginsInstalledLocal')
  const catalogDocUrl = locale === 'de' ? PLUGIN_CATALOG_DOC_URL_DE : PLUGIN_CATALOG_DOC_URL

  if (!open) return null

  return (
    <Portal>
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{zIndex: 99999}}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => {
          if (!reloadBusy) onClose()
        }}
      />
      <div
        className="relative flex flex-col w-full max-w-2xl rounded-2xl animate-fade-in overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {t(locale, 'pluginStore')}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {githubConfigured
                ? `${remotePlugins.length} ${t(locale, 'pluginsCatalogAvailable')}`
                : `0 ${t(locale, 'pluginsCatalogAvailable')}`}
              {' · '}
              {allPlugins.length} {t(locale, 'pluginsInstalledLocal')}
              {updatesCount > 0
                ? ` · ${updatesCount} ${locale === 'de' ? 'Update(s)' : 'update(s)'}`
                : ''}
              {volumeOnly ? ` · ${volumeInstalledIds.length} ${locale === 'de' ? 'auf Platte' : 'on disk'}` : ''}
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
            {!volumeOnly && (
              <button
                type="button"
                className="btn-ghost px-2 py-1.5 text-xs"
                title={t(locale, 'seedPluginsHint')}
                disabled={reloadBusy}
                onClick={() => void handleSeedPlugins()}
              >
                {t(locale, 'seedPlugins')}
              </button>
            )}
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
          <p
            className="px-6 -mt-2 pb-2 text-xs font-medium"
            style={{
              color:
                reloadMsgKind === 'success'
                  ? 'var(--accent)'
                  : reloadMsgKind === 'error'
                    ? '#f87171'
                    : 'var(--text-muted)',
            }}
          >
            {reloadMsg}
          </p>
        )}

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

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {githubConfigured && remoteFiltered.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {t(locale, 'pluginsCatalogAvailable')} · {t(locale, 'pluginsFromGitHub')}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{meta.name ?? meta.id}</span>
                        {meta.updateAvailable ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b55' }}
                          >
                            {t(locale, 'pluginUpdate')} v{meta.installedVersion ?? '?'} → v{meta.version ?? '?'}
                          </span>
                        ) : meta.installed ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}
                          >
                            {t(locale, 'installPluginDone')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{meta.description ?? ''}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {categoryLabel(meta.category)} · v{meta.version ?? '?'}
                        {meta.installed && meta.installedVersion && !meta.updateAvailable
                          ? ` · ${locale === 'de' ? 'installiert' : 'installed'} v${meta.installedVersion}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={pluginReadmeDocUrl(meta.id, { repository: githubRepo, ref: githubRef })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost text-xs"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                        title={t(locale, 'pluginReadme')}
                      >
                        <ExternalLink size={13} />
                        {t(locale, 'pluginReadme')}
                      </a>
                      {meta.updateAvailable || !meta.installed ? (
                        <button
                          type="button"
                          className="btn-accent"
                          title={
                            meta.updateAvailable
                              ? t(locale, 'pluginUpdate')
                              : t(locale, 'installPluginHint')
                          }
                          disabled={reloadBusy}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleInstallRemote(meta.id)
                          }}
                        >
                          {installingId === meta.id ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              {t(locale, 'pluginInstallBusy')}
                            </>
                          ) : meta.updateAvailable ? (
                            <>
                              <RefreshCw size={14} />
                              {t(locale, 'pluginUpdate')}
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              {t(locale, 'installPlugin')}
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {sectionTitle}
          </p>
          {volumeOnly && volumeInstalledIds.length > 0 && filtered.length === 0 && (
            <p className="text-xs mb-2" style={{ color: 'var(--accent)' }}>
              Ordner auf der Platte, aber ohne widget.js — unter „Von GitHub“ installieren oder ZIP mit widget.js hochladen, dann Strg+F5.
            </p>
          )}
          {filtered.length === 0 && remoteFiltered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">{volumeOnly ? t(locale, 'pluginsVolumeEmpty') : t(locale, 'noPluginsFound')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              {githubConfigured
                ? t(locale, 'installPluginHint')
                : t(locale, 'githubNotConfigured')}
            </p>
          ) : (
            filtered.map(({ meta }) => {
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
                        {categoryLabel(meta.category)}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {displayDesc}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      by {meta.author} · v{meta.version}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={pluginReadmeDocUrl(meta.id, { repository: githubRepo, ref: githubRef })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-xs"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                    >
                      <ExternalLink size={13} />
                      {t(locale, 'pluginReadme')}
                    </a>
                    <button type="button" onClick={() => handleAdd(meta.id)} className="btn-accent">
                    {added.has(meta.id)
                      ? <><Check size={14} />{t(locale, 'add')}</>
                      : <><Plus size={14} />{t(locale, 'add')}</>
                    }
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-center">
            {t(locale, 'pluginCatalogNav')}
          </p>
          <div
            className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {remotePlugins.map((p) => (
              <a
                key={`nav-${p.id}`}
                href={pluginReadmeDocUrl(p.id, { repository: githubRepo, ref: githubRef })}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                {p.name ?? p.id}
              </a>
            ))}
          </div>
          <p className="text-xs text-center mt-3">
            <a href={catalogDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              {t(locale, 'pluginCatalogNav')}
            </a>
            {' · '}
            💡 {t(locale, 'devHint')}{' '}
            <a
              href="https://github.com/kabelsalatundklartext/selfdashboard/blob/beta/docs/PLUGIN_DEV.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              {t(locale, 'readTheDocs')}
            </a>
          </p>
        </div>
      </div>
    </div>
    </Portal>
  )
}
