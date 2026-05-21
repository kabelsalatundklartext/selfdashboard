'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { installPluginExternalBridge } from '@/lib/pluginExternalBridge'
import { loadVolumeWidgetScripts } from '@/lib/pluginCustomClient'
export function PluginMissingBanner() {
  const { locale } = useDashboardStore()
  const [missing, setMissing] = useState<string[]>([])
  const [configured, setConfigured] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/plugins/missing-dashboard', { cache: 'no-store' })
      const j = (await res.json()) as { missing?: string[]; configured?: boolean }
      setConfigured(j.configured !== false)
      const list = Array.isArray(j.missing) ? j.missing : []
      setMissing(list)
      if (list.length === 0) setDismissed(false)
    } catch {
      setMissing([])
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener('sd-plugin-catalog-changed', onChange)
    return () => window.removeEventListener('sd-plugin-catalog-changed', onChange)
  }, [refresh])

  const installAll = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/plugins/install-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const j = (await res.json()) as {
        installed?: string[]
        failed?: { id: string; error?: string }[]
        hint?: string
      }
      installPluginExternalBridge()
      const ids = j.installed ?? []
      if (ids.length > 0) {
        try {
          await loadVolumeWidgetScripts(ids)
        } catch {
          /* partial */
        }
      }
      window.dispatchEvent(new CustomEvent('sd-plugin-catalog-changed'))
      const de = locale === 'de'
      if (ids.length > 0 && (j.failed?.length ?? 0) === 0) {
        setMsg(de ? `${ids.length} Plugin(s) installiert — Seite wird neu geladen…` : `${ids.length} plugin(s) installed — reloading…`)
        setTimeout(() => window.location.reload(), 1200)
        return
      }
      if (ids.length > 0) {
        setMsg(
          `${de ? 'Teilweise OK' : 'Partial'}: ${ids.join(', ')}${j.failed?.length ? ` · ${de ? 'Fehler' : 'failed'}: ${j.failed!.map((f) => f.id).join(', ')}` : ''}. ${j.hint ?? ''}`,
        )
      } else {
        setMsg(
          de
            ? 'Installation fehlgeschlagen — GitHub-Branch/Store prüfen oder Plugins einzeln im Store installieren.'
            : 'Install failed — check GitHub branch/store or install plugins one by one.',
        )
      }
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (dismissed || missing.length === 0) return null

  const de = locale === 'de'
  const label =
    missing.length === 1
      ? de
        ? `Plugin „${missing[0]}“ fehlt auf der Platte (früher im Image, jetzt Store/ZIP).`
        : `Plugin “${missing[0]}” is missing on disk (was in the image; use Store/ZIP now).`
      : de
        ? `${missing.length} Plugins fehlen (${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}) — Layout ist da, Dateien müssen von GitHub geladen werden.`
        : `${missing.length} plugins missing (${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}) — layout saved; install files from GitHub.`

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-sm"
      style={{
        background: 'color-mix(in srgb, #f59e0b 22%, var(--surface))',
        borderBottom: '1px solid #f59e0b',
        color: 'var(--text)',
      }}
    >
      <Download size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
      <span style={{ flex: '1 1 220px', textAlign: 'center', lineHeight: 1.45 }}>{label}</span>
      {!configured ? (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {de ? 'GitHub-Store nicht konfiguriert' : 'GitHub store not configured'}
        </span>
      ) : (
        <button
          type="button"
          className="btn-accent text-xs"
          style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          disabled={busy}
          onClick={() => void installAll()}
        >
          <RefreshCw size={14} className={busy ? 'animate-spin' : undefined} />
          {t(locale, 'pluginInstallMissingAll')}
        </button>
      )}
      <button type="button" className="btn-ghost text-xs" onClick={() => window.dispatchEvent(new CustomEvent('sd-open-plugin-store'))}>
        {t(locale, 'pluginUpdatesOpenStore')}
      </button>
      <button type="button" className="btn-ghost p-1.5" onClick={() => setDismissed(true)} aria-label={de ? 'Ausblenden' : 'Dismiss'}>
        <X size={14} />
      </button>
      {msg ? (
        <p className="w-full text-center text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
          {msg}
        </p>
      ) : null}
    </div>
  )
}
