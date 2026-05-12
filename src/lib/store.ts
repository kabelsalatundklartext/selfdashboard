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

interface DashboardStore {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: Locale
  editMode: boolean

  // Dashboard management
  activeDashboard: () => Dashboard
  addDashboard: (name: string, icon: string) => string
  removeDashboard: (id: string) => void
  updateDashboard: (id: string, patch: Partial<Omit<Dashboard, 'id' | 'plugins'>>) => void
  setActiveDashboard: (id: string) => void

  // Global
  setLocale: (locale: Locale) => void
  setEditMode: (editMode: boolean) => void

  // Per-dashboard helpers (act on active dashboard)
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

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: [DEFAULT_DASHBOARD],
      activeDashboardId: 'home',
      locale: 'de',
      editMode: false,

      activeDashboard: () => {
        const s = get()
        return s.dashboards.find((d) => d.id === s.activeDashboardId) ?? s.dashboards[0]
      },

      addDashboard: (name, icon) => {
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)
        const newDash: Dashboard = { id, name, icon, theme: 'dark', plugins: [] }
        set((s) => ({ dashboards: [...s.dashboards, newDash], activeDashboardId: id }))
        return id
      },

      removeDashboard: (id) => set((s) => {
        const remaining = s.dashboards.filter((d) => d.id !== id)
        if (remaining.length === 0) return s
        return { dashboards: remaining, activeDashboardId: remaining[0].id }
      }),

      updateDashboard: (id, patch) => set((s) => ({
        dashboards: s.dashboards.map((d) => d.id === id ? { ...d, ...patch } : d)
      })),

      setActiveDashboard: (id) => set({ activeDashboardId: id }),

      setLocale: (locale) => set({ locale }),
      setEditMode: (editMode) => set({ editMode }),

      // Active dashboard helpers
      setTheme: (theme) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, theme } : d) }))
      },
      setTitle: (name) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, name } : d) }))
      },
      setCustomLogo: (customLogo) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customLogo } : d) }))
      },
      setCustomColors: (colors) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: { ...d.customColors, ...colors } } : d) }))
      },
      resetCustomColors: () => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: undefined } : d) }))
      },
      addPlugin: (instance) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: [...d.plugins, instance] } : d) }))
      },
      removePlugin: (instanceId) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.filter((p) => p.instanceId !== instanceId) } : d) }))
      },
      updatePluginConfig: (instanceId, config) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p) } : d) }))
      },
      updatePluginLayout: (instanceId, layout) => {
        const id = get().activeDashboardId
        set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p) } : d) }))
      },
    }),
    { name: 'selfdashboard-v2' }
  )
)
