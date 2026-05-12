import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dashboard, PluginInstance, ThemeId } from '@/types'
import type { Locale } from './i18n'

const DEFAULT_DASHBOARD: Dashboard = {
  id: 'home',
  name: 'Home',
  icon: '🏠',
  theme: 'dark',
  plugins: [],
}

// ── Migration from old store format ─────────────────────────
function migrateOldStore(): Dashboard[] | null {
  try {
    const old = localStorage.getItem('selfdashboard-config')
    if (!old) return null
    const parsed = JSON.parse(old)
    if (!parsed?.state) return null
    const s = parsed.state
    // Build one dashboard from old flat state
    const dash: Dashboard = {
      id: 'home',
      name: s.title ?? 'Home',
      icon: '🏠',
      theme: s.theme ?? 'dark',
      customColors: s.customColors,
      customLogo: s.customLogo,
      plugins: s.plugins ?? [],
    }
    console.info('[SelfDashboard] Migrated old config to new format')
    return [dash]
  } catch {
    return null
  }
}

interface DashboardStore {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: Locale
  editMode: boolean

  activeDashboard: () => Dashboard
  addDashboard: (name: string, icon: string) => string
  removeDashboard: (id: string) => void
  updateDashboard: (id: string, patch: Partial<Omit<Dashboard, 'id' | 'plugins'>>) => void
  setActiveDashboard: (id: string) => void

  setLocale: (locale: Locale) => void
  setEditMode: (editMode: boolean) => void

  setTheme: (theme: ThemeId) => void
  setTitle: (title: string) => void
  setCustomLogo: (url: string) => void
  setCustomColors: (colors: Record<string, string>) => void
  resetCustomColors: () => void
  addPlugin: (instance: PluginInstance) => void
  removePlugin: (instanceId: string) => void
  updatePluginConfig: (instanceId: string, config: Record<string, unknown>) => void
  updatePluginLayout: (instanceId: string, layout: PluginInstance['layout']) => void
}

const migrated = typeof window !== 'undefined' ? migrateOldStore() : null

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: migrated ?? [DEFAULT_DASHBOARD],
      activeDashboardId: migrated?.[0]?.id ?? 'home',
      locale: 'de',
      editMode: false,

      activeDashboard: () => {
        const s = get()
        return s.dashboards.find((d) => d.id === s.activeDashboardId) ?? s.dashboards[0]
      },

      addDashboard: (name, icon) => {
        const id = name.toLowerCase()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'dashboard'
        // Ensure unique
        const existing = get().dashboards.map((d) => d.id)
        const uniqueId = existing.includes(id) ? `${id}-${Date.now().toString(36)}` : id
        const newDash: Dashboard = { id: uniqueId, name, icon, theme: 'dark', plugins: [] }
        set((s) => ({ dashboards: [...s.dashboards, newDash], activeDashboardId: uniqueId }))
        return uniqueId
      },

      removeDashboard: (id) => set((s) => {
        const remaining = s.dashboards.filter((d) => d.id !== id)
        if (remaining.length === 0) return s
        const newActive = s.activeDashboardId === id ? remaining[0].id : s.activeDashboardId
        return { dashboards: remaining, activeDashboardId: newActive }
      }),

      updateDashboard: (id, patch) => set((s) => ({
        dashboards: s.dashboards.map((d) => d.id === id ? { ...d, ...patch } : d)
      })),

      setActiveDashboard: (id) => set({ activeDashboardId: id }),
      setLocale: (locale) => set({ locale }),
      setEditMode: (editMode) => set({ editMode }),

      setTheme: (theme) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, theme } : d) })) },
      setTitle: (name) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, name } : d) })) },
      setCustomLogo: (customLogo) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customLogo } : d) })) },
      setCustomColors: (colors) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: { ...d.customColors, ...colors } } : d) })) },
      resetCustomColors: () => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: undefined } : d) })) },
      addPlugin: (instance) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: [...d.plugins, instance] } : d) })) },
      removePlugin: (instanceId) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.filter((p) => p.instanceId !== instanceId) } : d) })) },
      updatePluginConfig: (instanceId, config) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p) } : d) })) },
      updatePluginLayout: (instanceId, layout) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p) } : d) })) },
    }),
    {
      name: 'selfdashboard-v2',
      // Also save to old key so rollback is possible
      onRehydrateStorage: () => (state) => {
        if (state && state.dashboards.length === 0) {
          const migrated = migrateOldStore()
          if (migrated) {
            state.dashboards = migrated
            state.activeDashboardId = migrated[0].id
          }
        }
      },
    }
  )
)
