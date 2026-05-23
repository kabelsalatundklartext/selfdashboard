'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import {
  getAuthProfileSnapshot,
  invalidateAuthProfile,
  loadAuthProfile,
  subscribeAuthProfile,
} from '@/lib/authProfileClient'

export function AuthUserMenu({ locale }: { locale: 'de' | 'en' }) {
  const router = useRouter()
  useSyncExternalStore(subscribeAuthProfile, () => getAuthProfileSnapshot()?.user?.id ?? '', () => '')
  const profile = getAuthProfileSnapshot()
  const user = profile?.user ?? null

  useEffect(() => {
    void loadAuthProfile()
  }, [])

  if (!user) return null

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    invalidateAuthProfile()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div
      className="flex items-center gap-2 text-xs rounded-lg px-2 py-1"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      title={user.role === 'admin' ? 'Administrator' : 'Benutzer'}
    >
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{user.username}</span>
      <button
        type="button"
        className="btn-ghost"
        style={{ padding: 4, display: 'flex' }}
        onClick={() => void logout()}
        title={locale === 'de' ? 'Abmelden' : 'Log out'}
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}

export function useAuthRole(): 'admin' | 'user' | null {
  useSyncExternalStore(subscribeAuthProfile, () => getAuthProfileSnapshot()?.user?.role ?? '', () => '')
  useEffect(() => {
    void loadAuthProfile()
  }, [])
  return getAuthProfileSnapshot()?.user?.role ?? null
}

export function useCanUsePlugin(pluginId: string): boolean {
  useSyncExternalStore(subscribeAuthProfile, () => {
    const p = getAuthProfileSnapshot()
    if (!p) return ''
    if (p.user.role === 'admin' || p.allowedPlugins === null) return 'all'
    return p.allowedPlugins.includes(pluginId) ? 'yes' : 'no'
  }, () => 'all')
  const p = getAuthProfileSnapshot()
  if (!p) return true
  if (p.user.role === 'admin' || p.allowedPlugins === null) return true
  return p.allowedPlugins.includes(pluginId)
}
