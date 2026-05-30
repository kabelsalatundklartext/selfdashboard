'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { pluginApiJson } from '@/lib/pluginDev'
import { usePluginLocale } from '@/lib/pluginLocale'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

type TaskRow = {
  id: string
  listId: string
  listName?: string
  summary: string
  completed: boolean
  due?: string
  syncState?: string
  readOnly?: boolean
}

type AccountView = {
  id: string
  name: string
  provider?: 'caldav' | 'google' | 'microsoft'
  enabled: boolean
  lastSyncStatus?: string
  lastSyncError?: string
  listCount: number
  url?: string
  username?: string
  googleConnected?: boolean
  googleClientId?: string
  microsoftConnected?: boolean
  microsoftClientId?: string
  microsoftTenantId?: string
}

type TaskListRow = {
  id: string
  accountId: string
  name: string
  visible: boolean
  readOnly: boolean
}

const box: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  gap: 6,
  fontSize: 13,
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '4px 0',
  borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
}

function formatApiError(msg: string, de: boolean): string {
  if (msg === 'api_missing') {
    return de
      ? 'Plugin-API fehlt — zuerst „API vom Store laden“ (Widget) oder Store → Aufgaben aktualisieren.'
      : 'Plugin API missing — load from store first (widget button) or update Tasks in store.'
  }
  if (msg.startsWith('plugin_not_found:')) {
    const detail = msg.slice('plugin_not_found:'.length).trim()
    return de
      ? `Plugin-API konnte nicht starten: ${detail}`
      : `Plugin API failed to start: ${detail}`
  }
  return msg
}

function isApiMissingError(msg: string): boolean {
  return msg.includes('plugin_not_found') || msg.includes('plugin_server') || msg.includes('server.mjs')
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await pluginApiJson<T>('tasks', path, init)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (isApiMissingError(msg)) {
      throw new Error(msg.includes(':') ? msg : 'api_missing')
    }
    throw e
  }
}

async function reloadTasksServer(): Promise<void> {
  await fetch('/api/plugins/reload', { method: 'POST' })
}

async function installTasksApiFromStore(locale: 'de' | 'en'): Promise<string | undefined> {
  const res = await fetch('/api/plugins/install-remote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pluginId: 'tasks' }),
  })
  const j = (await res.json().catch(() => ({}))) as {
    error?: string
    hint?: string
    written?: string[]
    serverLoaded?: boolean
    serverLoadError?: string | null
  }
  if (!res.ok) {
    if (j.error === 'forbidden' || res.status === 403) {
      return locale === 'de'
        ? 'Nur Admin — im Plugin-Store „Aufgaben“ aktualisieren.'
        : 'Admin only — update “Tasks” in the plugin store.'
    }
    return j.hint || j.error || `HTTP ${res.status}`
  }
  if (!j.written?.includes('server.mjs') && !j.written?.includes('server.js')) {
    return locale === 'de'
      ? 'server.mjs fehlt im Store — plugins-pack pushen.'
      : 'server.mjs missing on store — push plugins-pack.'
  }
  if (j.serverLoaded === false) {
    return locale === 'de'
      ? `server.mjs installiert, startet aber nicht${j.serverLoadError ? `: ${j.serverLoadError}` : ''}. Container-Log prüfen / Image aktualisieren.`
      : `server.mjs installed but failed to load${j.serverLoadError ? `: ${j.serverLoadError}` : ''}. Check container log / update image.`
  }
  window.location.reload()
  return undefined
}

function TasksWidget({ instanceId, config }: PluginWidgetProps) {
  const { locale } = usePluginLocale()
  const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig)
  const patchWidgetConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updatePluginConfig(instanceId, { ...config, ...patch })
    },
    [instanceId, config, updatePluginConfig],
  )
  const de = locale === 'de'
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [accounts, setAccounts] = useState<AccountView[]>([])
  const [lists, setLists] = useState<TaskListRow[]>([])
  const [syncing, setSyncing] = useState(false)
  const [apiMissing, setApiMissing] = useState(false)
  const [installingApi, setInstallingApi] = useState(false)

  const listId = String(config.listId ?? '').trim()
  const refreshSec = Math.max(15, Number(config.refreshSec) || 60)

  const loadTasks = useCallback(async () => {
    try {
      const q = listId ? `?listId=${encodeURIComponent(listId)}&showCompleted=0` : '?showCompleted=0'
      const rows = await api<TaskRow[]>(`/tasks${q}`)
      setTasks(Array.isArray(rows) ? rows : [])
      setError('')
      setApiMissing(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'api_missing') {
        setApiMissing(true)
        setError('')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [listId])

  const loadStatus = useCallback(async () => {
    try {
      const st = await api<{ accounts: AccountView[]; lists: TaskListRow[] }>('/status')
      setAccounts(st.accounts ?? [])
      setLists(st.lists ?? [])
      setApiMissing(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'api_missing' || msg.startsWith('plugin_not_found')) {
        try {
          await reloadTasksServer()
          const st = await pluginApiJson<{ accounts: AccountView[]; lists: TaskListRow[] }>('tasks', '/status')
          setAccounts(st.accounts ?? [])
          setLists(st.lists ?? [])
          setApiMissing(false)
          return
        } catch {
          /* still missing */
        }
        setApiMissing(true)
      }
    }
  }, [])

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'tasks-google-oauth' || ev.data?.type === 'tasks-microsoft-oauth') {
        void loadStatus()
        void loadTasks()
        if (ev.data.ok) setSetupOpen(false)
        else if (ev.data.error) setError(String(ev.data.error))
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [loadStatus, loadTasks])

  useEffect(() => {
    void loadTasks()
    void loadStatus()
  }, [loadTasks, loadStatus])

  useEffect(() => {
    const t = setInterval(() => void loadTasks(), refreshSec * 1000)
    return () => clearInterval(t)
  }, [loadTasks, refreshSec])

  const defaultListId = useMemo(() => {
    if (listId) return listId
    const visible = lists.filter((l) => l.visible && !l.readOnly)
    return visible[0]?.id ?? lists[0]?.id ?? ''
  }, [listId, lists])

  const toggleTask = async (task: TaskRow) => {
    try {
      await api(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      await loadTasks()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const addTask = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = newText.trim()
    if (!text || !defaultListId) return
    setAdding(true)
    try {
      await api('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: defaultListId, summary: text }),
      })
      setNewText('')
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  const syncNow = async () => {
    if (!accounts.length) return
    setSyncing(true)
    try {
      for (const acc of accounts) {
        await api(`/accounts/${acc.id}/sync`, { method: 'POST' })
      }
      await loadTasks()
      await loadStatus()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSyncing(false)
    }
  }

  const noAccount = accounts.length === 0

  const installApi = async () => {
    setInstallingApi(true)
    setError('')
    try {
      const err = await installTasksApiFromStore(de ? 'de' : 'en')
      if (err) setError(err)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setInstallingApi(false)
    }
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {noAccount
            ? de
              ? 'CalDAV, Google oder Microsoft einrichten'
              : 'Set up CalDAV, Google or Microsoft'
            : `${tasks.length} ${de ? 'offen' : 'open'}`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {!noAccount && (
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={syncing}
              style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
            >
              {syncing ? '…' : de ? 'Sync' : 'Sync'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 11 }}>{error}</div>}
      {apiMissing && (
        <div style={{ fontSize: 11, color: '#f59e0b', lineHeight: 1.45 }}>
          {de
            ? 'Die Plugin-API (server.mjs) fehlt auf dem Server. Als Admin: unten klicken — sonst Plugin-Store → Aufgaben aktualisieren.'
            : 'Plugin API (server.mjs) missing on server. As admin: click below — otherwise update Tasks in the plugin store.'}
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              disabled={installingApi}
              onClick={() => void installApi()}
              style={{ fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}
            >
              {installingApi ? '…' : de ? 'API vom Store laden' : 'Load API from store'}
            </button>
          </div>
        </div>
      )}
      {accounts[0]?.lastSyncError && (
        <div style={{ color: '#f59e0b', fontSize: 10 }}>{accounts[0].lastSyncError.slice(0, 120)}</div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>{de ? 'Laden…' : 'Loading…'}</div>
      ) : noAccount ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.4 }}>
          {de
            ? 'Synology/CalDAV, Google Tasks oder Microsoft To Do: ⚙️ → Konto anlegen.'
            : 'Synology/CalDAV, Google Tasks or Microsoft To Do: ⚙️ → add account.'}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {tasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{de ? 'Keine offenen Aufgaben' : 'No open tasks'}</div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} style={row}>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    disabled={t.readOnly}
                    onChange={() => void toggleTask(t)}
                    style={{ marginTop: 3, cursor: t.readOnly ? 'not-allowed' : 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        textDecoration: t.completed ? 'line-through' : 'none',
                        opacity: t.completed ? 0.6 : 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      {t.summary}
                    </div>
                    {t.listName && !listId && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.listName}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={(e) => void addTask(e)} style={{ display: 'flex', gap: 6 }}>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={de ? 'Neue Aufgabe…' : 'New task…'}
              disabled={!defaultListId || adding}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '6px 8px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
            <button type="submit" disabled={!newText.trim() || !defaultListId || adding} style={{ padding: '6px 10px', fontSize: 12 }}>
              +
            </button>
          </form>
        </>
      )}

      {setupOpen &&
        createPortal(
          <SetupModal
            de={de}
            accounts={accounts}
            lists={lists}
            config={config}
            patchWidgetConfig={patchWidgetConfig}
            onClose={() => {
              setSetupOpen(false)
              void loadStatus()
              void loadTasks()
            }}
          />,
          document.body,
        )}
    </div>
  )
}

function SetupModal({
  de,
  accounts,
  lists,
  config,
  patchWidgetConfig,
  onClose,
}: {
  de: boolean
  accounts: AccountView[]
  lists: TaskListRow[]
  config: Record<string, unknown>
  patchWidgetConfig: (patch: Record<string, unknown>) => void
  onClose: () => void
}) {
  const caldavAcc = accounts.find((a) => a.provider === 'caldav' || (!a.provider && a.url))
  const googleAcc = accounts.find((a) => a.provider === 'google')
  const microsoftAcc = accounts.find((a) => a.provider === 'microsoft')
  const [tab, setTab] = useState<'caldav' | 'google' | 'microsoft'>(
    microsoftAcc && !caldavAcc && !googleAcc ? 'microsoft' : googleAcc && !caldavAcc ? 'google' : 'caldav',
  )

  const [name, setName] = useState(caldavAcc?.name ?? 'Synology')
  const [url, setUrl] = useState(caldavAcc?.url ?? String(config.caldavUrl ?? ''))
  const [username, setUsername] = useState(caldavAcc?.username ?? String(config.caldavUser ?? ''))
  const [password, setPassword] = useState('')

  const [gName, setGName] = useState(googleAcc?.name ?? 'Google Tasks')
  const [clientId, setClientId] = useState(googleAcc?.googleClientId ?? String(config.googleClientId ?? ''))
  const [clientSecret, setClientSecret] = useState('')

  const [mName, setMName] = useState(microsoftAcc?.name ?? 'Microsoft To Do')
  const [msClientId, setMsClientId] = useState(microsoftAcc?.microsoftClientId ?? String(config.microsoftClientId ?? ''))
  const [msClientSecret, setMsClientSecret] = useState('')
  const [msTenantId, setMsTenantId] = useState(microsoftAcc?.microsoftTenantId ?? String(config.microsoftTenantId ?? 'common'))

  const [listId, setListId] = useState(String(config.listId ?? ''))
  const [refreshSec, setRefreshSec] = useState(String(config.refreshSec ?? 60))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const saveCaldav = async () => {
    setBusy(true)
    setMsg('')
    try {
      patchWidgetConfig({
        caldavUrl: url.trim(),
        caldavUser: username.trim(),
        listId: listId.trim(),
        refreshSec: Math.max(15, Number(refreshSec) || 60),
      })

      if (caldavAcc) {
        await api(`/accounts/${caldavAcc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || caldavAcc.name,
            caldav: {
              url: url.trim(),
              username: username.trim(),
              ...(password ? { password } : {}),
            },
          }),
        })
        await api(`/accounts/${caldavAcc.id}/sync`, { method: 'POST' })
      } else {
        const created = await api<AccountView>('/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || 'CalDAV',
            provider: 'caldav',
            caldav: { url: url.trim(), username: username.trim(), password, verifySsl: true },
          }),
        })
        await api(`/accounts/${created.id}/sync`, { method: 'POST' })
      }
      setMsg(de ? 'Gespeichert & synchronisiert' : 'Saved & synced')
      setTimeout(onClose, 600)
    } catch (e) {
      setMsg(formatApiError(e instanceof Error ? e.message : String(e), de))
    } finally {
      setBusy(false)
    }
  }

  const saveGoogleCreds = async (): Promise<string> => {
    patchWidgetConfig({
      googleClientId: clientId.trim(),
      refreshSec: Math.max(15, Number(refreshSec) || 60),
    })
    if (googleAcc) {
      await api(`/accounts/${googleAcc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gName.trim() || googleAcc.name,
          google: {
            clientId: clientId.trim(),
            ...(clientSecret ? { clientSecret } : {}),
          },
        }),
      })
      return googleAcc.id
    }
    const created = await api<AccountView>('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: gName.trim() || 'Google Tasks',
        provider: 'google',
        google: { clientId: clientId.trim(), clientSecret },
      }),
    })
    return created.id
  }

  const connectGoogle = async () => {
    setBusy(true)
    setMsg('')
    try {
      const accountId = await saveGoogleCreds()
      const { url: authUrl } = await api<{ url: string }>(`/accounts/${accountId}/google/auth-url`, {
        method: 'POST',
      })
      window.open(authUrl, 'tasks-google-oauth', 'width=520,height=680')
      setMsg(de ? 'Google-Fenster öffnen und Zugriff erlauben…' : 'Complete sign-in in the Google window…')
    } catch (e) {
      setMsg(formatApiError(e instanceof Error ? e.message : String(e), de))
    } finally {
      setBusy(false)
    }
  }

  const saveMicrosoftCreds = async (): Promise<string> => {
    patchWidgetConfig({
      microsoftClientId: msClientId.trim(),
      microsoftTenantId: msTenantId.trim() || 'common',
      refreshSec: Math.max(15, Number(refreshSec) || 60),
    })
    if (microsoftAcc) {
      await api(`/accounts/${microsoftAcc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mName.trim() || microsoftAcc.name,
          microsoft: {
            clientId: msClientId.trim(),
            tenantId: msTenantId.trim() || 'common',
            ...(msClientSecret ? { clientSecret: msClientSecret } : {}),
          },
        }),
      })
      return microsoftAcc.id
    }
    const created = await api<AccountView>('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: mName.trim() || 'Microsoft To Do',
        provider: 'microsoft',
        microsoft: {
          clientId: msClientId.trim(),
          clientSecret: msClientSecret,
          tenantId: msTenantId.trim() || 'common',
        },
      }),
    })
    return created.id
  }

  const connectMicrosoft = async () => {
    setBusy(true)
    setMsg('')
    try {
      const accountId = await saveMicrosoftCreds()
      const { url: authUrl } = await api<{ url: string }>(`/accounts/${accountId}/microsoft/auth-url`, {
        method: 'POST',
      })
      window.open(authUrl, 'tasks-microsoft-oauth', 'width=520,height=680')
      setMsg(de ? 'Microsoft-Fenster öffnen und Zugriff erlauben…' : 'Complete sign-in in the Microsoft window…')
    } catch (e) {
      setMsg(formatApiError(e instanceof Error ? e.message : String(e), de))
    } finally {
      setBusy(false)
    }
  }

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  }

  const panel: CSSProperties = {
    background: 'var(--surface, #1e1e2e)',
    color: 'var(--text, #fff)',
    borderRadius: 10,
    padding: 16,
    width: 'min(440px, 100%)',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid var(--border)',
  }

  const label: CSSProperties = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }
  const input: CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    marginBottom: 10,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 13,
  }

  const tabBtn = (id: 'caldav' | 'google' | 'microsoft', title: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: '6px 8px',
        fontSize: 12,
        cursor: 'pointer',
        borderBottom: tab === id ? '2px solid var(--accent, #6366f1)' : '2px solid transparent',
        background: 'transparent',
        color: 'var(--text)',
      }}
    >
      {title}
    </button>
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{de ? 'Aufgaben — Sync' : 'Tasks — Sync'}</h3>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
          {tabBtn('caldav', 'CalDAV')}
          {tabBtn('google', 'Google')}
          {tabBtn('microsoft', 'Microsoft')}
        </div>

        {tab === 'caldav' ? (
          <>
            <div style={label}>{de ? 'Name' : 'Name'}</div>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
            <div style={label}>CalDAV URL</div>
            <input style={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://NAS:5001/caldav/user" />
            <div style={label}>{de ? 'Benutzer' : 'Username'}</div>
            <input style={input} value={username} onChange={(e) => setUsername(e.target.value)} />
            <div style={label}>{de ? 'Passwort' : 'Password'}</div>
            <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={caldavAcc ? '••••' : ''} />
          </>
        ) : tab === 'google' ? (
          <>
            <div style={label}>{de ? 'Name' : 'Name'}</div>
            <input style={input} value={gName} onChange={(e) => setGName(e.target.value)} />
            <div style={label}>OAuth Client ID</div>
            <input style={input} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="…apps.googleusercontent.com" />
            <div style={label}>OAuth Client Secret</div>
            <input style={input} type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder={googleAcc ? '••••' : ''} />
            {googleAcc?.googleConnected && (
              <p style={{ fontSize: 12, color: '#22c55e', margin: '0 0 8px' }}>
                {de ? '✓ Mit Google verbunden' : '✓ Connected to Google'}
              </p>
            )}
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
              {de
                ? 'Redirect-URI in Google Cloud: https://DEIN-DASHBOARD/api/plugins/tasks/google/callback'
                : 'Redirect URI in Google Cloud: https://YOUR-DASHBOARD/api/plugins/tasks/google/callback'}
            </p>
          </>
        ) : (
          <>
            <div style={label}>{de ? 'Name' : 'Name'}</div>
            <input style={input} value={mName} onChange={(e) => setMName(e.target.value)} />
            <div style={label}>Azure App Client ID</div>
            <input style={input} value={msClientId} onChange={(e) => setMsClientId(e.target.value)} />
            <div style={label}>Client Secret</div>
            <input style={input} type="password" value={msClientSecret} onChange={(e) => setMsClientSecret(e.target.value)} placeholder={microsoftAcc ? '••••' : ''} />
            <div style={label}>Tenant ID</div>
            <input style={input} value={msTenantId} onChange={(e) => setMsTenantId(e.target.value)} placeholder="common" />
            {microsoftAcc?.microsoftConnected && (
              <p style={{ fontSize: 12, color: '#22c55e', margin: '0 0 8px' }}>
                {de ? '✓ Mit Microsoft verbunden' : '✓ Connected to Microsoft'}
              </p>
            )}
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
              {de
                ? 'Azure Portal → App-Registrierung → Redirect: https://DEIN-DASHBOARD/api/plugins/tasks/microsoft/callback — Berechtigung: Tasks.ReadWrite.'
                : 'Azure Portal → App registration → Redirect: https://YOUR-DASHBOARD/api/plugins/tasks/microsoft/callback — permission: Tasks.ReadWrite.'}
            </p>
          </>
        )}

        {lists.length > 0 && (
          <>
            <div style={label}>{de ? 'Task-Liste (optional)' : 'Task list (optional)'}</div>
            <select style={{ ...input, marginBottom: 10 }} value={listId} onChange={(e) => setListId(e.target.value)}>
              <option value="">{de ? 'Alle sichtbaren Listen' : 'All visible lists'}</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.readOnly ? ' (RO)' : ''}
                </option>
              ))}
            </select>
          </>
        )}
        <div style={label}>{de ? 'Aktualisieren (Sek.)' : 'Refresh (sec)'}</div>
        <input style={input} type="number" min={15} value={refreshSec} onChange={(e) => setRefreshSec(e.target.value)} />
        {msg && (
          <div
            style={{
              fontSize: 12,
              marginBottom: 8,
              color: msg.includes('Gespeichert') || msg.includes('Saved') || msg.includes('verbunden') || msg.includes('sign-in') ? '#22c55e' : '#ef4444',
            }}
          >
            {msg}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 12px' }}>
            {de ? 'Abbrechen' : 'Cancel'}
          </button>
          {tab === 'google' ? (
            <button
              type="button"
              disabled={busy || !clientId.trim() || (!googleAcc && !clientSecret)}
              onClick={() => void connectGoogle()}
              style={{ padding: '8px 12px' }}
            >
              {busy ? '…' : de ? 'Mit Google verbinden' : 'Connect Google'}
            </button>
          ) : tab === 'microsoft' ? (
            <button
              type="button"
              disabled={busy || !msClientId.trim() || (!microsoftAcc && !msClientSecret)}
              onClick={() => void connectMicrosoft()}
              style={{ padding: '8px 12px' }}
            >
              {busy ? '…' : de ? 'Mit Microsoft verbinden' : 'Connect Microsoft'}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !url.trim() || !username.trim() || (!caldavAcc && !password)}
              onClick={() => void saveCaldav()}
              style={{ padding: '8px 12px' }}
            >
              {busy ? '…' : de ? 'Speichern' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TasksSettings({ config, onChange }: PluginSettingsProps) {
  const { locale } = usePluginLocale()
  const de = locale === 'de'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        {de ? 'CalDAV, Google Tasks oder Microsoft To Do im Widget über ⚙️ einrichten.' : 'Configure CalDAV, Google Tasks or Microsoft To Do in the widget via ⚙️.'}
      </p>
      <label style={{ fontSize: 12 }}>
        {de ? 'Aktualisieren (Sek.)' : 'Refresh (sec)'}
        <input
          type="number"
          min={15}
          value={String(config.refreshSec ?? 60)}
          onChange={(e) => onChange('refreshSec', Math.max(15, Number(e.target.value) || 60))}
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        />
      </label>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'tasks',
  name: 'Aufgaben',
  description:
    'CalDAV (Synology, Nextcloud), Google Tasks und Microsoft To Do: Checkbox-Liste mit Zwei-Wege-Sync. API: /api/plugins/tasks.',
  version: '1.2.7',
  author: 'SelfDashboard',
  category: 'productivity',
  icon: '✅',
  defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
}

export const component: PluginComponent = {
  Widget: TasksWidget,
  Settings: TasksSettings,
}

export default component
