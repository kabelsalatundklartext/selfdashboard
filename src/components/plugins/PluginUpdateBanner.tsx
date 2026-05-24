'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, X, Package } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { loadVolumeWidgetScripts } from '@/lib/pluginCustomClient'
import { fetchRemoteCatalog, invalidateRemoteCatalogCache } from '@/lib/pluginRemoteCatalogClient'

type UpdateRow = {
  id: string
  name: string
  installedVersion: string | null
  version: string
}

const DISMISS_KEY = 'sd-plugin-updates-dismissed-at'
const DISMISS_MS = 6 * 60 * 60 * 1000

export function PluginUpdateBanner() {
  const { locale } = useDashboardStore()
  const [updates, setUpdates] = useState<UpdateRow[]>([])
  const [configured, setConfigured] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (force = false) => {
    try {
      const j = await fetchRemoteCatalog(force ? { force: true } : undefined)
      setConfigured(j.configured)
      const list = j.available
        .filter((p) => p.updateAvailable)
        .map((p) => ({
          id: p.id,
          name: p.name ?? p.id,
          installedVersion: p.installedVersion ?? null,
          version: String(p.version ?? '?'),
        }))
      setUpdates(list)
      if (list.length === 0) setDismissed(false)
    } catch {
      setConfigured(false)
      setUpdates([])
    }
  }, [])

  useEffect(() => {
    try {
      const at = Number(sessionStorage.getItem(DISMISS_KEY) || '0')
      if (at && Date.now() - at < DISMISS_MS) setDismissed(true)
    } catch { /* ignore */ }
    void refresh()
    const id = window.setInterval(() => void refresh(), 10 * 60 * 1000)
    const onCatalog = () => {
      invalidateRemoteCatalogCache()
      void refresh(true)
    }
    window.addEventListener('sd-plugin-catalog-changed', onCatalog)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('sd-plugin-catalog-changed', onCatalog)
    }
  }, [refresh])

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch { /* ignore */ }
  }

  const openStore = () => {
    window.dispatchEvent(new CustomEvent('sd-open-plugin-store'))
  }

  const updateAll = async () => {
    if (updates.length === 0) return
    setBusy(true)
    try {
      installPluginExternalBridge()
      for (const u of updates) {
        const res = await fetch('/api/plugins/install-remote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluginId: u.id }),
        })
        if (!res.ok) continue
        try {
          await loadVolumeWidgetScripts([u.id])
        } catch { /* one failed */ }
      }
      window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  if (!configured || updates.length === 0 || dismissed) return null

  const de = locale === 'de'
  const label =
    updates.length === 1
      ? de
        ? `Plugin-Update: ${updates[0].name} (v${updates[0].installedVersion ?? '?'} → v${updates[0].version})`
        : `Plugin update: ${updates[0].name} (v${updates[0].installedVersion ?? '?'} → v${updates[0].version})`
      : de
        ? `${updates.length} Plugin-Updates von GitHub verfügbar`
        : `${updates.length} plugin updates available from GitHub`

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-sm"
      style={{
        background: 'color-mix(in srgb, var(--accent) 18%, var(--surface))',
        borderBottom: '1px solid var(--accent)',
        color: 'var(--text)',
      }}
    >
      <Package size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ flex: '1 1 200px', textAlign: 'center', lineHeight: 1.4 }}>{label}</span>
      <button type="button" className="btn-accent text-xs" style={{ padding: '6px 12px' }} onClick={openStore}>
        {t(locale, 'pluginUpdatesOpenStore')}
      </button>
      <button
        type="button"
        className="btn-ghost text-xs"
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        disabled={busy}
        onClick={() => void updateAll()}
      >
        <RefreshCw size={14} className={busy ? 'animate-spin' : undefined} />
        {t(locale, 'pluginUpdateAll')}
      </button>
      <button
        type="button"
        className="btn-ghost p-1.5"
        aria-label={de ? 'Ausblenden' : 'Dismiss'}
        onClick={dismiss}
      >
        <X size={14} />
      </button>
    </div>
  )
}
