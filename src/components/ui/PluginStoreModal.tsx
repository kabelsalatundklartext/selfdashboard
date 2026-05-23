'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { PluginMeta } from '@/types'
import { X, Plus, Check, Search, RefreshCw, ExternalLink, Upload, Package, Trash2 } from 'lucide-react'
import { pluginReadmeDocUrl, PLUGIN_CATALOG_DOC_URL, PLUGIN_CATALOG_DOC_URL_DE } from '@/lib/pluginDocUrl'
import { pluginRegistry } from '@/lib/pluginRegistry'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { displayPluginMeta } from '@/lib/pluginMetaI18n'
import { Portal } from '@/components/ui/Portal'
import type { PluginCategory } from '@/types'
import { nanoid } from './nanoid'
import { PluginMetaIcon } from '@/components/plugins/PluginMetaIcon'
import { fetchPluginVolumeInfo, loadVolumeWidgetScripts, unloadPluginWidgetAssets } from '@/lib/pluginCustomClient'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { useAuthRole } from '@/components/layout/AuthUserMenu'
import { canUsePlugin, loadAuthProfile } from '@/lib/authProfileClient'

interface Props { open: boolean; onClose: () => void }

type RemotePluginRow = PluginMeta & {
  installed: boolean
  installedVersion?: string | null
  updateAvailable?: boolean
  files?: string[]
}

type CatalogRow = {
  meta: RemotePluginRow
  inRegistry: boolean
  onDashboard: boolean
  fromRemote: boolean
}

type FilterTab = 'all' | 'updates' | 'ready'

function PluginStoreCard({
  row,
  locale,
  githubRepo,
  githubRef,
  categoryLabel,
  reloadBusy,
  installingId,
  uninstallingId,
  added,
  onInstall,
  onUninstall,
  onAdd,
  allowManage,
}: {
  row: CatalogRow
  locale: 'de' | 'en'
  githubRepo: string
  githubRef: string
  categoryLabel: (cat: string | undefined) => string
  reloadBusy: boolean
  installingId: string | null
  uninstallingId: string | null
  added: Set<string>
  onInstall: (id: string) => void
  onUninstall: (id: string, name: string, onDashboard: boolean) => void
  onAdd: (id: string) => void
  /** Install/uninstall from GitHub — admin only. */
  allowManage: boolean
}) {
  const { meta, inRegistry, onDashboard } = row
  const { name, description } = displayPluginMeta(meta, locale)
  const readmeHref = pluginReadmeDocUrl(meta.id, { repository: githubRepo, ref: githubRef })

  return (
    <article
      className="flex flex-col gap-2.5 rounded-xl p-3 min-h-0"
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${meta.updateAvailable ? 'color-mix(in srgb, #f59e0b 35%, var(--border))' : 'var(--border)'}`,
      }}
    >
      <div className="flex gap-3 min-w-0">
        <PluginMetaIcon meta={meta} size={36} style={{ background: 'var(--surface)', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text)', maxWidth: '100%' }}>
              {name}
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {categoryLabel(meta.category)}
            </span>
          </div>
          <p
            className="text-[11px] mt-1 leading-snug"
            style={{
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            v{meta.version ?? '?'}
            {meta.installed && meta.installedVersion && !meta.updateAvailable
              ? ` · ${t(locale, 'installPluginDone')} v${meta.installedVersion}`
              : ''}
            {meta.author ? ` · ${meta.author}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {meta.updateAvailable && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b44' }}
          >
            {t(locale, 'pluginUpdate')} v{meta.installedVersion ?? '?'} → v{meta.version ?? '?'}
          </span>
        )}
        {meta.installed && !meta.updateAvailable && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)14', color: 'var(--accent)', border: '1px solid var(--accent)33' }}
          >
            {t(locale, 'installPluginDone')}
          </span>
        )}
        {inRegistry && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {t(locale, 'pluginWidgetLoaded')}
          </span>
        )}
        {onDashboard && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: '#4ade8018', color: '#4ade80', border: '1px solid #4ade8044' }}
          >
            {t(locale, 'pluginOnDashboard')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <a
          href={readmeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs px-2 py-1"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          title={t(locale, 'pluginReadme')}
        >
          <ExternalLink size={12} />
          {t(locale, 'pluginReadme')}
        </a>
        {allowManage && (meta.updateAvailable || !meta.installed) && row.fromRemote && (
          <button
            type="button"
            className="btn-accent text-xs px-2.5 py-1"
            disabled={reloadBusy}
            onClick={() => onInstall(meta.id)}
          >
            {installingId === meta.id ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                {t(locale, 'pluginInstallBusy')}
              </>
            ) : meta.updateAvailable ? (
              <>
                <RefreshCw size={12} />
                {t(locale, 'pluginUpdate')}
              </>
            ) : (
              <>
                <Plus size={12} />
                {t(locale, 'installPlugin')}
              </>
            )}
          </button>
        )}
        {(inRegistry || !allowManage) && (
          <button
            type="button"
            className="btn-accent text-xs px-2.5 py-1"
            onClick={() => onAdd(meta.id)}
            disabled={added.has(meta.id)}
          >
            {added.has(meta.id) ? (
              <>
                <Check size={12} />
                {t(locale, 'add')}
              </>
            ) : (
              <>
                <Plus size={12} />
                {t(locale, 'add')}
              </>
            )}
          </button>
        )}
        {meta.installed && !inRegistry && (
          <span className="text-[10px] self-center" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'pluginHardReloadAfterDownload')}
          </span>
        )}
        {allowManage && meta.installed && (
          <button
            type="button"
            className="btn-ghost text-xs px-2.5 py-1"
            style={{ color: '#f87171', borderColor: 'color-mix(in srgb, #f87171 35%, var(--border))' }}
            disabled={reloadBusy}
            title={t(locale, 'uninstallPlugin')}
            onClick={() => onUninstall(meta.id, name, onDashboard)}
          >
            {uninstallingId === meta.id ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                {t(locale, 'pluginUninstallBusy')}
              </>
            ) : (
              <>
                <Trash2 size={12} />
                {t(locale, 'uninstallPlugin')}
              </>
            )}
          </button>
        )}
      </div>
    </article>
  )
}

export function PluginStoreModal({ open, onClose }: Props) {
  const authRole = useAuthRole()
  const isAdmin = authRole === 'admin'

  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [reloadBusy, setReloadBusy] = useState(false)
  const [reloadMsg, setReloadMsg] = useState<string | null>(null)
  const [reloadMsgKind, setReloadMsgKind] = useState<'success' | 'error' | 'info'>('info')
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [uninstallingId, setUninstallingId] = useState<string | null>(null)
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
  const [userAllowedPlugins, setUserAllowedPlugins] = useState<PluginMeta[]>([])

  const refreshStoreData = useCallback(async () => {
    try {
      const vol = await fetchPluginVolumeInfo()
      setVolumeOnly(vol.volumeOnly)
      setVolumeInstalledIds(vol.installedIds ?? [])
    } catch {
      setVolumeOnly(false)
      setVolumeInstalledIds([])
    }
    if (!isAdmin) {
      setGithubConfigured(false)
      setRemotePlugins([])
      setUpdatesCount(0)
      try {
        const res = await fetch('/api/auth/my-plugins', { cache: 'no-store' })
        if (res.ok) {
          const j = (await res.json()) as { plugins?: PluginMeta[] }
          const list = j.plugins ?? []
          setUserAllowedPlugins(list)
          if (list.length > 0) {
            try {
              await loadVolumeWidgetScripts(list.map((p) => p.id))
            } catch (e) {
              console.warn('[SelfDashboard] allowed plugin widgets preload', e)
            }
          }
        } else {
          setUserAllowedPlugins([])
        }
      } catch {
        setUserAllowedPlugins([])
      }
      return
    }
    setUserAllowedPlugins([])
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
  }, [isAdmin])

  useEffect(() => {
    if (!open) return
    void loadAuthProfile()
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
        `${t(locale, 'pluginZipUploadSuccess')}: ${(j.installed ?? []).join(', ') || '—'}. ${locale === 'de' ? 'Strg+F5' : 'Ctrl+F5'}. ${j.hint ?? ''}`,
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
          ? `${j.count ?? 0} Manifest(e). Strg+F5. ${j.hint ?? ''}`
          : `${j.count ?? 0} manifest(s). Ctrl+F5. ${j.hint ?? ''}`,
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

  const handleUninstall = useCallback(
    async (pluginId: string, label: string, onDashboard: boolean) => {
      const confirmText =
        t(locale, 'pluginUninstallConfirm').replace('{name}', label) +
        (onDashboard ? t(locale, 'pluginUninstallConfirmDashboard') : '')
      if (!window.confirm(confirmText)) return

      setReloadBusy(true)
      setUninstallingId(pluginId)
      setReloadMsg(null)
      setReloadMsgKind('info')
      try {
        const res = await fetch('/api/plugins/uninstall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluginId }),
        })
        const j = (await res.json()) as { ok?: boolean; error?: string; hint?: string }
        if (!res.ok) throw new Error(j.error ?? 'uninstall_failed')

        pluginRegistry.unregister(pluginId)
        unloadPluginWidgetAssets(pluginId)
        await refreshStoreData()

        setReloadMsgKind('success')
        setReloadMsg(`✓ ${label} — ${t(locale, 'pluginUninstallSuccess')}`)
        window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
      } catch (e) {
        setReloadMsgKind('error')
        setReloadMsg(
          `${t(locale, 'pluginUninstallFailed')}: ${e instanceof Error ? e.message : String(e)}`,
        )
      } finally {
        setUninstallingId(null)
        setReloadBusy(false)
      }
    },
    [locale, refreshStoreData],
  )

  const handleInstallRemote = useCallback(
    async (pluginId: string) => {
      const label = remotePlugins.find((p) => p.id === pluginId)?.name ?? pluginId
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
          `${t(locale, 'pluginInstallFailed')}: ${e instanceof Error ? e.message : String(e)}`,
        )
      } finally {
        setInstallingId(null)
        setReloadBusy(false)
      }
    },
    [locale, remotePlugins, refreshStoreData],
  )

  const handleAdd = useCallback(
    async (pluginId: string) => {
      try {
        let plugin = pluginRegistry.get(pluginId)
        if (!plugin) {
          try {
            await loadVolumeWidgetScripts([pluginId])
            plugin = pluginRegistry.get(pluginId)
          } catch (loadErr) {
            console.warn('[SelfDashboard] widget load before add', pluginId, loadErr)
          }
        }
        if (!plugin) {
          const row = remotePlugins.find((p) => p.id === pluginId)
          if (githubConfigured && row && !row.installed) {
            setReloadMsgKind('info')
            setReloadMsg(`„${row.name ?? pluginId}“ ${t(locale, 'pluginInstallFromGitHubFirst')}`)
            await handleInstallRemote(pluginId)
            plugin = pluginRegistry.get(pluginId)
          }
        }
        if (!plugin) {
          setReloadMsgKind('error')
          setReloadMsg(`Plugin „${pluginId}“ ${t(locale, 'pluginNotLoadedHint')}`)
          return
        }
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
    [addPlugin, existingPlugins, githubConfigured, remotePlugins, handleInstallRemote, locale],
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
  const catalogDocUrl = locale === 'de' ? PLUGIN_CATALOG_DOC_URL_DE : PLUGIN_CATALOG_DOC_URL

  const catalogRows = useMemo(() => {
    const pluginAllowed = (id: string) => isAdmin || canUsePlugin(id)
    const q = search.toLowerCase().trim()
    const matches = (meta: PluginMeta) => {
      const d = displayPluginMeta(meta, locale)
      return (
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        meta.id.toLowerCase().includes(q)
      )
    }

    const seen = new Set<string>()
    const rows: CatalogRow[] = []

    if (!isAdmin) {
      for (const meta of userAllowedPlugins) {
        if (!matches(meta)) continue
        seen.add(meta.id)
        const inRegistry = !!pluginRegistry.get(meta.id)
        rows.push({
          meta: {
            ...meta,
            installed: true,
            installedVersion: meta.version,
            updateAvailable: false,
          },
          inRegistry,
          onDashboard: existingPlugins.some((p) => p.pluginId === meta.id),
          fromRemote: false,
        })
      }
      return rows
    }

    for (const meta of remotePlugins) {
      if (!pluginAllowed(meta.id) || !matches(meta)) continue
      seen.add(meta.id)
      rows.push({
        meta,
        inRegistry: !!pluginRegistry.get(meta.id),
        onDashboard: existingPlugins.some((p) => p.pluginId === meta.id),
        fromRemote: true,
      })
    }

    for (const { meta } of allPlugins) {
      if (!pluginAllowed(meta.id) || seen.has(meta.id) || !matches(meta)) continue
      rows.push({
        meta: {
          ...meta,
          installed: volumeInstalledIds.includes(meta.id),
          installedVersion: meta.version,
          updateAvailable: false,
        },
        inRegistry: true,
        onDashboard: existingPlugins.some((p) => p.pluginId === meta.id),
        fromRemote: false,
      })
    }

    return rows
  }, [remotePlugins, allPlugins, search, locale, existingPlugins, volumeInstalledIds, isAdmin, userAllowedPlugins])

  const filteredRows = useMemo(() => {
    if (filterTab === 'updates') {
      return catalogRows.filter((r) => r.meta.updateAvailable)
    }
    if (filterTab === 'ready') {
      return catalogRows.filter((r) => (isAdmin ? r.inRegistry : true) && !r.onDashboard)
    }
    return catalogRows
  }, [catalogRows, filterTab])

  const readyCount = useMemo(
    () => catalogRows.filter((r) => (isAdmin ? r.inRegistry : true) && !r.onDashboard).length,
    [catalogRows, isAdmin],
  )

  if (!open) return null

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '8px',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'color-mix(in srgb, var(--accent) 18%, var(--surface))' : 'var(--surface-2)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  })

  return (
    <Portal>
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-5" style={{ zIndex: 99999 }}>
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => {
            if (!reloadBusy) onClose()
          }}
        />
        <div
          className="relative flex flex-col w-full rounded-2xl animate-fade-in overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            maxWidth: 'min(960px, 100%)',
            maxHeight: 'min(88vh, 900px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          }}
        >
          {/* Header */}
          <header
            className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="min-w-0">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {t(locale, 'pluginStore')}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isAdmin ? (
                  <>
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                      {remotePlugins.length} {t(locale, 'pluginsCatalogAvailable')}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                      {allPlugins.length} {t(locale, 'pluginsStoreBadgeLoaded')}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {userAllowedPlugins.length} {locale === 'de' ? 'freigegeben' : 'allowed'}
                  </span>
                )}
                {volumeOnly && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {volumeInstalledIds.length} {t(locale, 'pluginsStoreBadgeDownloaded')}
                  </span>
                )}
                {updatesCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
                    {updatesCount} {locale === 'de' ? 'Update(s)' : 'update(s)'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin ? (
                <>
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
                    className="btn-ghost p-2"
                    title={t(locale, 'uploadPluginZipHint')}
                    disabled={reloadBusy}
                    onClick={() => zipInputRef.current?.click()}
                  >
                    <Upload size={16} />
                  </button>
                  {!volumeOnly && (
                    <button
                      type="button"
                      className="btn-ghost p-2"
                      title={t(locale, 'seedPluginsHint')}
                      disabled={reloadBusy}
                      onClick={() => void handleSeedPlugins()}
                    >
                      <Package size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost p-2"
                    title={t(locale, 'reloadPluginsHint')}
                    disabled={reloadBusy}
                    onClick={() => void handleReloadPlugins()}
                  >
                    <RefreshCw size={16} className={reloadBusy ? 'animate-spin' : undefined} />
                  </button>
                </>
              ) : null}
              <button type="button" className="btn-ghost p-2" onClick={onClose} aria-label={locale === 'de' ? 'Schließen' : 'Close'}>
                <X size={16} />
              </button>
            </div>
          </header>

          {reloadMsg && (
            <p
              className="px-5 py-2 text-xs font-medium shrink-0"
              style={{
                borderBottom: '1px solid var(--border)',
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

          {/* Toolbar: search + filters */}
          <div className="px-5 py-3 shrink-0 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-[200px]"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(locale, 'searchPlugins')}
                className="flex-1 bg-transparent text-sm outline-none min-w-0"
                style={{ color: 'var(--text)' }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button type="button" style={tabBtn(filterTab === 'all')} onClick={() => setFilterTab('all')}>
                {locale === 'de' ? 'Alle' : 'All'} ({catalogRows.length})
              </button>
              {updatesCount > 0 && (
                <button type="button" style={tabBtn(filterTab === 'updates')} onClick={() => setFilterTab('updates')}>
                  {t(locale, 'pluginUpdate')} ({updatesCount})
                </button>
              )}
              <button type="button" style={tabBtn(filterTab === 'ready')} onClick={() => setFilterTab('ready')}>
                {locale === 'de' ? 'Hinzufügen' : 'Add'} ({readyCount})
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {isAdmin && !githubConfigured && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#f8717114', color: '#f87171', border: '1px solid #f8717133' }}>
                {t(locale, 'githubNotConfigured')}
                {locale === 'de'
                  ? ' Setze SELFDASHBOARD_PLUGINS_GITHUB_REPO=kabelsalatundklartext/selfdashboard (Unraid: „GitHub Plugins Repo“) und starte den Container neu.'
                  : ' Set SELFDASHBOARD_PLUGINS_GITHUB_REPO=kabelsalatundklartext/selfdashboard (Unraid: “GitHub Plugins Repo”) and restart the container.'}
              </p>
            )}
            {!isAdmin && userAllowedPlugins.length === 0 && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#f8717114', color: '#f87171', border: '1px solid #f8717133' }}>
                {locale === 'de'
                  ? 'Keine Plugins freigegeben. Bitte den Administrator unter Einstellungen → Benutzer Häkchen setzen.'
                  : 'No plugins granted. Ask an admin to enable plugins under Settings → Users.'}
              </p>
            )}
            {volumeOnly && volumeInstalledIds.length > 0 && allPlugins.length === 0 && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent)' }}>
                {t(locale, 'pluginVolumeWidgetMissing')}
              </p>
            )}
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">{t(locale, 'noPluginsFound')}</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '10px',
                }}
              >
                {filteredRows.map((row) => (
                  <PluginStoreCard
                    key={row.meta.id}
                    row={row}
                    locale={locale}
                    githubRepo={githubRepo}
                    githubRef={githubRef}
                    categoryLabel={categoryLabel}
                    reloadBusy={reloadBusy}
                    installingId={installingId}
                    uninstallingId={uninstallingId}
                    added={added}
                    allowManage={isAdmin}
                    onInstall={(id) => void handleInstallRemote(id)}
                    onUninstall={(id, name, onDash) => void handleUninstall(id, name, onDash)}
                    onAdd={(id) => void handleAdd(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer — compact */}
          <footer
            className="px-5 py-3 shrink-0 text-center text-[11px] leading-relaxed"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <a href={catalogDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              {t(locale, 'pluginCatalogNav')}
            </a>
            {' · '}
            {githubRepo}@{githubRef}
            {' · '}
            {t(locale, 'devHint')}{' '}
            <a
              href="https://github.com/kabelsalatundklartext/selfdashboard/blob/beta/docs/PLUGIN_DEV.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              {t(locale, 'readTheDocs')}
            </a>
          </footer>
        </div>
      </div>
    </Portal>
  )
}
