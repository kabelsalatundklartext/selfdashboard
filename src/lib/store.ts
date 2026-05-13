import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dashboard, PluginInstance, ThemeId } from '@/types'
import type { Locale } from './i18n'
import type { SearchProviderId } from './searchProviders'
import { defaultSearchProviders, normalizeSearchProviders, firstEnabledProviderId } from './searchProviders'

const DEFAULT_DASHBOARD: Dashboard = {
  id: 'home',
  name: 'Home',
  icon: '🏠',
  plugins: [],
  theme: 'dark',
}

function migrateOldStore(): Dashboard[] | null {
  try {
    const old = localStorage.getItem('selfdashboard-config')
    if (!old) return null
    const parsed = JSON.parse(old)
    if (!parsed?.state) return null
    const s = parsed.state
    return [{ id: 'home', name: s.title ?? 'Home', icon: '🏠', theme: s.theme ?? 'dark', customColors: s.customColors, customLogo: s.customLogo, plugins: s.plugins ?? [] }]
  } catch { return null }
}

function makeId(name: string, existing: string[]): string {
  const base = name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
    || 'dashboard'
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base}-${i}`)) i++
  return `${base}-${i}`
}

interface DashboardStore {
  dashboards: Dashboard[]
  activeDashboardId: string
  locale: Locale
  editMode: boolean
  showDashboardTabs: boolean
  navbarStyle: "icon-text" | "icon-only" | "text-only"
  dashboardZoom: number
  gridGap: number       // px between widgets
  gridPadding: number   // px outer padding
  /** Navbar web search bar */
  navbarSearchEnabled: boolean
  navbarSearchPosition: 'left' | 'center' | 'right'
  navbarSearchProviders: Record<SearchProviderId, boolean>
  navbarSearchLastProvider: SearchProviderId
  /** Pixel width of navbar search bar (clamped); resize in edit mode */
  navbarSearchWidthPx: number

  activeDashboard: () => Dashboard
  addDashboard: (name: string, icon: string) => string
  removeDashboard: (id: string) => void
  updateDashboard: (id: string, patch: Partial<Omit<Dashboard, 'id' | 'plugins'>>) => void
  setActiveDashboard: (id: string) => void
  setLocale: (locale: Locale) => void
  setEditMode: (editMode: boolean) => void
  setShowDashboardTabs: (show: boolean) => void
  setNavbarStyle: (style: "icon-text" | "icon-only" | "text-only") => void
  setDashboardZoom: (zoom: number) => void
  setGridGap: (gap: number) => void
  setGridPadding: (padding: number) => void
  setTheme: (theme: ThemeId) => void
  setTitle: (title: string) => void
  setCustomLogo: (url: string) => void
  setCustomColors: (colors: Record<string, string>) => void
  resetCustomColors: () => void
  addPlugin: (instance: PluginInstance) => void
  removePlugin: (instanceId: string) => void
  updatePluginConfig: (instanceId: string, config: Record<string, unknown>) => void
  updatePluginLayout: (instanceId: string, layout: PluginInstance['layout']) => void
  setNavbarSearchEnabled: (enabled: boolean) => void
  setNavbarSearchPosition: (position: 'left' | 'center' | 'right') => void
  setNavbarSearchProviderEnabled: (id: SearchProviderId, enabled: boolean) => void
  setNavbarSearchLastProvider: (id: SearchProviderId) => void
  setNavbarSearchWidthPx: (widthPx: number) => void
}

const migrated = typeof window !== 'undefined' ? migrateOldStore() : null

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: migrated ?? [DEFAULT_DASHBOARD],
      activeDashboardId: migrated?.[0]?.id ?? 'home',
      locale: 'de',
      editMode: false,
      showDashboardTabs: true,
      navbarStyle: "icon-text",
      dashboardZoom: 1,
      gridGap: 8,
      gridPadding: 12,
      navbarSearchEnabled: false,
      navbarSearchPosition: 'center',
      navbarSearchProviders: defaultSearchProviders(),
      navbarSearchLastProvider: 'duckduckgo',
      navbarSearchWidthPx: 320,

      activeDashboard: () => {
        const s = get()
        return s.dashboards.find((d) => d.id === s.activeDashboardId) ?? s.dashboards[0]
      },
      addDashboard: (name, icon) => {
        const existing = get().dashboards.map((d) => d.id)
        const id = makeId(name, existing)
        const newDash: Dashboard = { id, name, icon, theme: 'dark', plugins: [] }
        set((s) => ({ dashboards: [...s.dashboards, newDash], activeDashboardId: id }))
        return id
      },
      removeDashboard: (id) => set((s) => {
        const remaining = s.dashboards.filter((d) => d.id !== id)
        if (remaining.length === 0) return s
        return { dashboards: remaining, activeDashboardId: s.activeDashboardId === id ? remaining[0].id : s.activeDashboardId }
      }),
      updateDashboard: (id, patch) => set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, ...patch } : d) })),
      setActiveDashboard: (id) => set({ activeDashboardId: id }),
      setLocale: (locale) => set({ locale }),
      setEditMode: (editMode) => set({ editMode }),
      setShowDashboardTabs: (showDashboardTabs) => set({ showDashboardTabs }),
      setNavbarStyle: (navbarStyle) => set({ navbarStyle }),
      setDashboardZoom: (raw) => {
        const n = typeof raw === 'number' ? raw : Number(raw)
        const z = Number.isFinite(n) ? Math.round(n * 10) / 10 : 1
        set({ dashboardZoom: Math.min(1.5, Math.max(0.6, z)) })
      },
      setGridGap: (gridGap) => set({ gridGap }),
      setGridPadding: (gridPadding) => set({ gridPadding }),
      setTheme: (theme) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, theme } : d) })) },
      setTitle: (name) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, name } : d) })) },
      setCustomLogo: (customLogo) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customLogo } : d) })) },
      setCustomColors: (colors) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: { ...d.customColors, ...colors } } : d) })) },
      resetCustomColors: () => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: undefined } : d) })) },
      addPlugin: (instance) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: [...d.plugins, instance] } : d) })) },
      removePlugin: (instanceId) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.filter((p) => p.instanceId !== instanceId) } : d) })) },
      updatePluginConfig: (instanceId, config) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p) } : d) })) },
      updatePluginLayout: (instanceId, layout) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p) } : d) })) },
      setNavbarSearchEnabled: (navbarSearchEnabled) => set({ navbarSearchEnabled }),
      setNavbarSearchPosition: (navbarSearchPosition) => set({ navbarSearchPosition }),
      setNavbarSearchProviderEnabled: (id, enabled) => set((s) => {
        const next = { ...s.navbarSearchProviders, [id]: enabled }
        const last = s.navbarSearchLastProvider
        const stillOk = next[last]
        const nextLast = stillOk ? last : firstEnabledProviderId(next)
        return { navbarSearchProviders: next, navbarSearchLastProvider: nextLast }
      }),
      setNavbarSearchLastProvider: (navbarSearchLastProvider) => set({ navbarSearchLastProvider }),
      setNavbarSearchWidthPx: (raw) => {
        const n = typeof raw === 'number' ? raw : Number(raw)
        const w = Number.isFinite(n) ? Math.round(n) : 320
        set({ navbarSearchWidthPx: Math.min(920, Math.max(200, w)) })
      },
    }),
    {
      name: 'selfdashboard-v2',
      onRehydrateStorage: () => (state) => {
        if (state && state.dashboards.length === 0) {
          const m = migrateOldStore()
          if (m) { state.dashboards = m; state.activeDashboardId = m[0].id }
        }
        if (state) {
          const z = state.dashboardZoom
          if (typeof z !== 'number' || !Number.isFinite(z)) {
            const n = Number(z)
            state.dashboardZoom = Number.isFinite(n) ? Math.min(1.5, Math.max(0.6, Math.round(n * 10) / 10)) : 1
          }
          if (typeof state.navbarSearchEnabled !== 'boolean') state.navbarSearchEnabled = false
          if (state.navbarSearchPosition !== 'left' && state.navbarSearchPosition !== 'center' && state.navbarSearchPosition !== 'right') {
            state.navbarSearchPosition = 'center'
          }
          state.navbarSearchProviders = normalizeSearchProviders(state.navbarSearchProviders)
          const ids: SearchProviderId[] = ['google', 'duckduckgo', 'bing', 'brave', 'ecosia', 'wikipedia-de', 'wikipedia-en']
          if (!state.navbarSearchLastProvider || !ids.includes(state.navbarSearchLastProvider as SearchProviderId)) {
            state.navbarSearchLastProvider = firstEnabledProviderId(state.navbarSearchProviders)
          } else if (!state.navbarSearchProviders[state.navbarSearchLastProvider as SearchProviderId]) {
            state.navbarSearchLastProvider = firstEnabledProviderId(state.navbarSearchProviders)
          }
          const w = state.navbarSearchWidthPx
          if (typeof w !== 'number' || !Number.isFinite(w)) {
            state.navbarSearchWidthPx = 320
          } else {
            state.navbarSearchWidthPx = Math.min(920, Math.max(200, Math.round(w)))
          }
          const legacyIframe = 'crowdsec-threat-map'
          state.dashboards = state.dashboards.map((d) => ({
            ...d,
            plugins: d.plugins.map((p) => (p.pluginId === legacyIframe ? { ...p, pluginId: 'iframe' } : p)),
          }))
        }
      },
    }
  )
)
