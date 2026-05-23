'use client'

import { useCallback, useEffect, useState } from 'react'
import { Monitor, Plus } from 'lucide-react'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export function KioskSettingsPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const dashboards = useDashboardStore((s) => s.dashboards)
  const addDashboard = useDashboardStore((s) => s.addDashboard)
  const [enabled, setEnabled] = useState(false)
  const [dashboardId, setDashboardId] = useState('kiosk')
  const [idleSeconds, setIdleSeconds] = useState(5)
  const [hasPassword, setHasPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [clearPassword, setClearPassword] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [publicUrl, setPublicUrl] = useState('/kiosk')

  const refresh = useCallback(async () => {
    const res = await fetch('/api/kiosk/admin', { cache: 'no-store' })
    if (!res.ok) return
    const j = (await res.json()) as {
      enabled?: boolean
      dashboardId?: string
      idleSeconds?: number
      hasPassword?: boolean
      publicUrl?: string
    }
    setEnabled(Boolean(j.enabled))
    setDashboardId(j.dashboardId ?? 'kiosk')
    setIdleSeconds(typeof j.idleSeconds === 'number' ? j.idleSeconds : 5)
    setHasPassword(Boolean(j.hasPassword))
    if (j.publicUrl) setPublicUrl(j.publicUrl)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(`${window.location.origin}/kiosk`)
    }
    void refresh()
  }, [refresh])

  function createKioskDashboard() {
    const exists = dashboards.some((d) => d.id === 'kiosk')
    if (exists) {
      setDashboardId('kiosk')
      setMsg(de ? 'Dashboard „kiosk“ existiert bereits.' : 'Dashboard “kiosk” already exists.')
      return
    }
    const id = addDashboard(de ? 'Kiosk' : 'Kiosk', '📺')
    setDashboardId(id)
    setMsg(de ? `Dashboard „${id}“ angelegt — Widgets dort einrichten, dann speichern.` : `Created dashboard “${id}” — add widgets there, then save.`)
  }

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/kiosk/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          dashboardId,
          idleSeconds,
          password: newPassword.trim() || undefined,
          clearPassword: clearPassword || undefined,
        }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'save_failed')
      setNewPassword('')
      setClearPassword(false)
      setMsg(de ? 'Kiosk-Einstellungen gespeichert.' : 'Kiosk settings saved.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {de ? 'Kiosk / Wand-Tablet' : 'Kiosk / wall tablet'}
      </label>
      <div
        className="flex flex-col gap-3 rounded-xl p-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
          {de
            ? 'Öffentliche URL ohne Admin-Login — nur Ansicht. Leiste ausgeblendet, kleiner Pfeil nach unten blendet sie kurz ein. Nur Admins können das hier konfigurieren.'
            : 'Public URL without admin login — view only. Bar hidden; small down arrow reveals it briefly. Only admins can configure this.'}
        </p>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={busy} />
          {de ? 'Kiosk-URL aktiv' : 'Enable kiosk URL'}
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {de ? 'Kiosk-Dashboard' : 'Kiosk dashboard'}
          </span>
          <div className="flex flex-wrap gap-2">
            <select
              value={dashboardId}
              onChange={(e) => setDashboardId(e.target.value)}
              style={{ ...inp, flex: '1 1 160px', width: 'auto' }}
              disabled={busy}
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))}
            </select>
            <button type="button" className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={busy} onClick={createKioskDashboard}>
              <Plus size={14} />
              {de ? 'Kiosk-Dashboard anlegen' : 'Create kiosk dashboard'}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            {de
              ? 'Widgets auf diesem Dashboard einrichten (normal einloggen → Dashboard wechseln → bearbeiten). Das Kiosk zeigt genau dieses Dashboard.'
              : 'Set up widgets on this dashboard (log in normally → switch dashboard → edit). Kiosk shows exactly this dashboard.'}
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-muted)' }}>{de ? 'Leiste ausblenden nach (Sek.)' : 'Hide bar after (sec.)'}</span>
          <input
            type="number"
            min={3}
            max={60}
            value={idleSeconds}
            onChange={(e) => setIdleSeconds(Number(e.target.value))}
            style={inp}
            disabled={busy}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {de ? 'Optional: Kiosk-Passwort' : 'Optional: kiosk password'}
          </span>
          <input
            type="password"
            style={inp}
            placeholder={hasPassword ? (de ? 'Neues Passwort (leer = behalten)' : 'New password (empty = keep)') : de ? 'Kein Passwort' : 'No password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setClearPassword(false) }}
            disabled={busy}
          />
          {hasPassword ? (
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={clearPassword} onChange={(e) => setClearPassword(e.target.checked)} disabled={busy} />
              {de ? 'Passwort entfernen (ohne Schutz)' : 'Remove password (no protection)'}
            </label>
          ) : null}
          <p className="text-[11px]" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {de ? 'Mit oder ohne Passwort: immer nur Ansicht, kein Bearbeiten.' : 'With or without password: always view-only, no editing.'}
          </p>
        </div>

        <div className="rounded-lg px-3 py-2 text-xs font-mono break-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <Monitor size={12} className="inline mr-1" style={{ verticalAlign: '-2px' }} />
          {publicUrl}
        </div>

        <button type="button" className="btn-accent self-start px-3 py-1.5" disabled={busy} onClick={() => void save()}>
          {de ? 'Speichern' : 'Save'}
        </button>

        {msg ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  )
}
