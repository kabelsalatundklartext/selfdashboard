'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

type UserRow = {
  id: string
  username: string
  role: 'admin' | 'user'
  allowedPlugins: string[] | null
}

type CatalogPlugin = { id: string; highRisk: boolean }

export function AuthUsersSettingsPanel({ locale }: { locale: Locale }) {
  const de = locale === 'de'
  const [users, setUsers] = useState<UserRow[]>([])
  const [catalog, setCatalog] = useState<CatalogPlugin[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftPlugins, setDraftPlugins] = useState<string[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')

  const refresh = useCallback(async () => {
    const [uRes, cRes] = await Promise.all([
      fetch('/api/auth/users', { cache: 'no-store' }),
      fetch('/api/auth/plugin-catalog', { cache: 'no-store' }),
    ])
    if (uRes.ok) {
      const j = (await uRes.json()) as { users?: UserRow[] }
      setUsers(j.users ?? [])
    }
    if (cRes.ok) {
      const j = (await cRes.json()) as { plugins?: CatalogPlugin[] }
      setCatalog(j.plugins ?? [])
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const u = users.find((x) => x.id === selectedId)
    if (!u || u.role === 'admin') {
      setDraftPlugins([])
      return
    }
    setDraftPlugins(u.allowedPlugins ?? [])
  }, [selectedId, users])

  const selected = users.find((u) => u.id === selectedId) ?? null

  async function createUser() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          allowedPlugins: newRole === 'user' ? [] : undefined,
        }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'create_failed')
      setNewUsername('')
      setNewPassword('')
      setNewRole('user')
      setMsg(de ? 'Benutzer angelegt.' : 'User created.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function savePlugins() {
    if (!selected || selected.role === 'admin') return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/auth/users/${selected.id}/plugins`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedPlugins: draftPlugins }),
      })
      if (!res.ok) throw new Error('save_failed')
      setMsg(de ? 'Plugin-Freigaben gespeichert.' : 'Plugin permissions saved.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm(de ? 'Benutzer wirklich löschen?' : 'Delete this user?')) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? 'delete_failed')
      if (selectedId === id) setSelectedId(null)
      setMsg(de ? 'Benutzer gelöscht.' : 'User deleted.')
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function togglePlugin(id: string) {
    setDraftPlugins((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].sort()))
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {de
          ? 'Normale Benutzer sehen nur freigegebene Plugins. APIs (z. B. Docker-Socket) sind ohne Freigabe blockiert. Admins haben immer alle Plugins.'
          : 'Regular users only see allowed plugins. APIs (e.g. Docker socket) are blocked without permission. Admins always have all plugins.'}
      </p>

      <section
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-semibold">{de ? 'Neuer Benutzer' : 'New user'}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            placeholder={de ? 'Benutzername' : 'Username'}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            className="rounded-lg px-3 py-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            placeholder={de ? 'Passwort' : 'Password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{de ? 'Rolle' : 'Role'}</span>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
            className="rounded-lg px-2 py-1"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="user">{de ? 'Benutzer' : 'User'}</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="button" className="btn-accent self-start flex items-center gap-1.5 px-3 py-1.5" disabled={busy} onClick={() => void createUser()}>
          <Plus size={14} />
          {de ? 'Anlegen' : 'Create'}
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">{de ? 'Benutzer' : 'Users'}</h3>
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: selectedId === u.id ? 'color-mix(in srgb, var(--accent) 12%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${selectedId === u.id ? 'color-mix(in srgb, var(--accent) 40%, var(--border))' : 'var(--border)'}`,
            }}
          >
            <button type="button" className="font-medium text-left flex-1 min-w-0" onClick={() => setSelectedId(u.id)}>
              {u.username}
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {u.role === 'admin'
                  ? de ? 'Admin · alle Plugins' : 'Admin · all plugins'
                  : de
                    ? `${(u.allowedPlugins ?? []).length} Plugin(s)`
                    : `${(u.allowedPlugins ?? []).length} plugin(s)`}
              </span>
            </button>
            <button
              type="button"
              className="btn-ghost p-1.5"
              style={{ color: '#f87171' }}
              disabled={busy}
              onClick={() => void deleteUser(u.id)}
              title={de ? 'Löschen' : 'Delete'}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </section>

      {selected && selected.role === 'user' ? (
        <section
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-semibold">
            {de ? `Plugins für „${selected.username}"` : `Plugins for “${selected.username}”`}
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
            {catalog.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 text-xs cursor-pointer rounded-md px-2 py-1.5"
                style={{ background: 'var(--surface)' }}
              >
                <input
                  type="checkbox"
                  checked={draftPlugins.includes(p.id)}
                  onChange={() => togglePlugin(p.id)}
                />
                <span className="font-mono">{p.id}</span>
                {p.highRisk ? (
                  <span title={de ? 'Kritisch (Host/API)' : 'High risk'} style={{ display: 'flex', flexShrink: 0 }}>
                    <AlertTriangle size={12} style={{ color: '#f59e0b' }} aria-hidden />
                  </span>
                ) : null}
              </label>
            ))}
          </div>
          <button type="button" className="btn-accent self-start flex items-center gap-1.5 px-3 py-1.5" disabled={busy} onClick={() => void savePlugins()}>
            <Save size={14} />
            {de ? 'Freigaben speichern' : 'Save permissions'}
          </button>
        </section>
      ) : selected?.role === 'admin' ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {de ? 'Administratoren haben automatisch Zugriff auf alle Plugins.' : 'Administrators automatically have access to all plugins.'}
        </p>
      ) : null}

      {msg ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {msg}
        </p>
      ) : null}
    </div>
  )
}
