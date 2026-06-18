import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dashboard, PluginInstance, ThemeId } from '@/types'
import {
  pickPersistedDashboardState,
  type DashboardStatePersisted,
} from '@/lib/dashboardStatePayload'
import {
  clampDashboardBackgroundOverlay,
  parseDashboardBackgroundMode,
  type DashboardBackgroundMode,
} from '@/lib/dashboardBackground'
import { stripRemovedPlugins } from '@/lib/removedPlugins'
import type { Locale } from './i18n'
import type { SearchProviderId } from './searchProviders'
import {
  defaultSearchProviders,
  normalizeSearchProviders,
  firstEnabledSearchTargetId,
  isSearchTargetEnabled,
  normalizeCustomSearchProviders,
  newCustomSearchProviderId,
  buildCustomSearchUrl,
  type NavbarCustomSearchProvider,
} from './searchProviders'

const DEFAULT_DASHBOARD: Dashboard = {
  id: 'home',
  name: 'Home',
  icon: '🏠',
  plugins: [],
  theme: 'self',
}

function migrateOldStore(): Dashboard[] | null {
  try {
    const old = localStorage.getItem('selfdashboard-config')
    if (!old) return null
    const parsed = JSON.parse(old)
    if (!parsed?.state) return null
    const s = parsed.state
    return [{ id: 'home', name: s.title ?? 'Home', icon: '🏠', theme: s.theme ?? 'self', customColors: s.customColors, customLogo: s.customLogo, plugins: s.plugins ?? [] }]
  } catch { return null }
}

/** Eindeutige Instanz-ID (gleiches Format wie das UI-nanoid: Zufall + Zeit). */
function makeInstanceId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
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
  navbarSearchLastProvider: string
  /** Pixel width of navbar search bar (clamped); resize in edit mode */
  navbarSearchWidthPx: number
  /** User-defined search engines (name + URL template). */
  navbarSearchCustomProviders: NavbarCustomSearchProvider[]
  /** Wand-Tablet: Navbar nach Inaktivität ausblenden */
  kioskModeEnabled: boolean
  /** Sekunden ohne Eingabe bis die Navbar ausblendet (3–60) */
  kioskModeIdleSeconds: number
  /** Navbar-Hintergrund (data URL / Bild-URL), leer = Standardfarbe */
  navbarBackgroundImage: string
  /** 0–80: Overlay-Stärke über dem Hintergrundbild */
  navbarBackgroundOverlay: number
  dashboardBackgroundMode: DashboardBackgroundMode
  dashboardBackgroundImage: string
  dashboardBackgroundImage2: string
  dashboardBackgroundOverlay: number

  activeDashboard: () => Dashboard
  addDashboard: (name: string, icon: string) => string
  removeDashboard: (id: string) => void
  updateDashboard: (id: string, patch: Partial<Omit<Dashboard, 'id' | 'plugins'>>) => void
  /** Dashboard in der Reihenfolge verschieben (-1 = nach oben, 1 = nach unten). */
  moveDashboard: (id: string, dir: -1 | 1) => void
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
  /** Fertig eingerichtetes Plugin (inkl. Config/Secrets/Layout) auf ein anderes Dashboard kopieren. Gibt die neue instanceId zurück oder null. */
  copyPluginToDashboard: (instanceId: string, targetDashboardId: string) => string | null
  removePlugin: (instanceId: string) => void
  updatePluginConfig: (instanceId: string, config: Record<string, unknown>) => void
  updatePluginLayout: (instanceId: string, layout: PluginInstance['layout']) => void
  /** Handy-Override zusammenführen (gestapeltes Layout). */
  updatePluginLayoutPhone: (instanceId: string, patch: Partial<PluginInstance['layout']>) => void
  /** Tablet-Override zusammenführen (12 Spalten). */
  updatePluginLayoutTablet: (instanceId: string, patch: Partial<PluginInstance['layout']>) => void
  /** Responsive Overrides ersetzen oder löschen (`null` = Override entfernen). */
  setPluginResponsiveLayouts: (
    instanceId: string,
    layouts: Partial<{
      layoutPhone: Partial<PluginInstance['layout']> | null
      layoutTablet: Partial<PluginInstance['layout']> | null
    }>,
  ) => void
  setNavbarSearchEnabled: (enabled: boolean) => void
  setNavbarSearchPosition: (position: 'left' | 'center' | 'right') => void
  setNavbarSearchProviderEnabled: (id: SearchProviderId, enabled: boolean) => void
  setNavbarSearchCustomProviderEnabled: (id: string, enabled: boolean) => void
  setNavbarSearchLastProvider: (id: string) => void
  setNavbarSearchWidthPx: (widthPx: number) => void
  addNavbarSearchCustomProvider: (name: string, urlTemplate: string) => boolean
  removeNavbarSearchCustomProvider: (id: string) => void
  setKioskModeEnabled: (enabled: boolean) => void
  setKioskModeIdleSeconds: (seconds: number) => void
  setNavbarBackgroundImage: (url: string) => void
  setNavbarBackgroundOverlay: (pct: number) => void
  setDashboardBackgroundMode: (mode: DashboardBackgroundMode) => void
  setDashboardBackgroundImage: (url: string) => void
  setDashboardBackgroundImage2: (url: string) => void
  setDashboardBackgroundOverlay: (pct: number) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: [DEFAULT_DASHBOARD],
      activeDashboardId: 'home',
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
      navbarSearchCustomProviders: [],
      kioskModeEnabled: false,
      kioskModeIdleSeconds: 5,
      navbarBackgroundImage: '',
      navbarBackgroundOverlay: 45,
      dashboardBackgroundMode: 'off',
      dashboardBackgroundImage: '',
      dashboardBackgroundImage2: '',
      dashboardBackgroundOverlay: 50,

      activeDashboard: () => {
        const s = get()
        const found = s.dashboards.find((d) => d.id === s.activeDashboardId)
        if (found) return found
        if (s.dashboards[0]) return s.dashboards[0]
        return DEFAULT_DASHBOARD
      },
      addDashboard: (name, icon) => {
        const existing = get().dashboards.map((d) => d.id)
        const id = makeId(name, existing)
        const newDash: Dashboard = { id, name, icon, theme: 'self', plugins: [] }
        set((s) => ({ dashboards: [...s.dashboards, newDash], activeDashboardId: id }))
        return id
      },
      removeDashboard: (id) => set((s) => {
        const remaining = s.dashboards.filter((d) => d.id !== id)
        if (remaining.length === 0) return s
        return { dashboards: remaining, activeDashboardId: s.activeDashboardId === id ? remaining[0].id : s.activeDashboardId }
      }),
      updateDashboard: (id, patch) => set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, ...patch } : d) })),
      moveDashboard: (id, dir) => set((s) => {
        const idx = s.dashboards.findIndex((d) => d.id === id)
        if (idx < 0) return s
        const target = idx + dir
        if (target < 0 || target >= s.dashboards.length) return s
        const next = [...s.dashboards]
        const [moved] = next.splice(idx, 1)
        next.splice(target, 0, moved)
        return { dashboards: next }
      }),
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
      setTheme: (theme) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, theme, customColors: undefined } : d) })) },
      setTitle: (name) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, name } : d) })) },
      setCustomLogo: (customLogo) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customLogo } : d) })) },
      setCustomColors: (colors) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: { ...d.customColors, ...colors } } : d) })) },
      resetCustomColors: () => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: undefined } : d) })) },
      addPlugin: (instance) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: [...d.plugins, instance] } : d) })) },
      copyPluginToDashboard: (instanceId, targetDashboardId) => {
        const s = get()
        const target = s.dashboards.find((d) => d.id === targetDashboardId)
        if (!target) return null
        let source: PluginInstance | undefined
        for (const d of s.dashboards) {
          const found = d.plugins.find((p) => p.instanceId === instanceId)
          if (found) { source = found; break }
        }
        if (!source) return null
        // Layout im Ziel unten anhängen, damit nichts überlappt.
        const nextY = target.plugins.reduce((max, p) => Math.max(max, (p.layout?.y ?? 0) + (p.layout?.h ?? 4)), 0)
        const copy: PluginInstance = {
          instanceId: makeInstanceId(),
          pluginId: source.pluginId,
          config: structuredClone(source.config),
          layout: { ...source.layout, x: 0, y: nextY },
          ...(source.layoutPhone ? { layoutPhone: { ...source.layoutPhone } } : {}),
          ...(source.layoutTablet ? { layoutTablet: { ...source.layoutTablet } } : {}),
        }
        set((st) => ({ dashboards: st.dashboards.map((d) => d.id === targetDashboardId ? { ...d, plugins: [...d.plugins, copy] } : d) }))
        return copy.instanceId
      },
      removePlugin: (instanceId) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.filter((p) => p.instanceId !== instanceId) } : d) })) },
      updatePluginConfig: (instanceId, config) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p) } : d) })) },
      updatePluginLayout: (instanceId, layout) => { const id = get().activeDashboardId; set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p) } : d) })) },
      updatePluginLayoutPhone: (instanceId, patch) => {
        const id = get().activeDashboardId
        set((s) => ({
          dashboards: s.dashboards.map((d) => {
            if (d.id !== id) return d
            return {
              ...d,
              plugins: d.plugins.map((p) => {
                if (p.instanceId !== instanceId) return p
                const merged = { ...(p.layoutPhone ?? {}), ...patch }
                const cleaned = Object.fromEntries(
                  Object.entries(merged).filter(([, v]) => v !== undefined),
                ) as Partial<PluginInstance['layout']>
                return Object.keys(cleaned).length > 0 ? { ...p, layoutPhone: cleaned } : { ...p, layoutPhone: undefined }
              }),
            }
          }),
        }))
      },
      updatePluginLayoutTablet: (instanceId, patch) => {
        const id = get().activeDashboardId
        set((s) => ({
          dashboards: s.dashboards.map((d) => {
            if (d.id !== id) return d
            return {
              ...d,
              plugins: d.plugins.map((p) => {
                if (p.instanceId !== instanceId) return p
                const merged = { ...(p.layoutTablet ?? {}), ...patch }
                const cleaned = Object.fromEntries(
                  Object.entries(merged).filter(([, v]) => v !== undefined),
                ) as Partial<PluginInstance['layout']>
                return Object.keys(cleaned).length > 0 ? { ...p, layoutTablet: cleaned } : { ...p, layoutTablet: undefined }
              }),
            }
          }),
        }))
      },
      setPluginResponsiveLayouts: (instanceId, layouts) => {
        const id = get().activeDashboardId
        set((s) => ({
          dashboards: s.dashboards.map((d) => {
            if (d.id !== id) return d
            return {
              ...d,
              plugins: d.plugins.map((p) => {
                if (p.instanceId !== instanceId) return p
                let next: PluginInstance = { ...p }
                if ('layoutPhone' in layouts) {
                  if (layouts.layoutPhone === null) next = { ...next, layoutPhone: undefined }
                  else if (layouts.layoutPhone !== undefined) {
                    const lp = layouts.layoutPhone
                    next = Object.keys(lp).length > 0 ? { ...next, layoutPhone: lp } : { ...next, layoutPhone: undefined }
                  }
                }
                if ('layoutTablet' in layouts) {
                  if (layouts.layoutTablet === null) next = { ...next, layoutTablet: undefined }
                  else if (layouts.layoutTablet !== undefined) {
                    const lt = layouts.layoutTablet
                    next = Object.keys(lt).length > 0 ? { ...next, layoutTablet: lt } : { ...next, layoutTablet: undefined }
                  }
                }
                return next
              }),
            }
          }),
        }))
      },
      setNavbarSearchEnabled: (navbarSearchEnabled) => set({ navbarSearchEnabled }),
      setNavbarSearchPosition: (navbarSearchPosition) => set({ navbarSearchPosition }),
      setNavbarSearchProviderEnabled: (id, enabled) => set((s) => {
        const next = { ...s.navbarSearchProviders, [id]: enabled }
        const last = s.navbarSearchLastProvider
        const customs = s.navbarSearchCustomProviders
        const stillOk = isSearchTargetEnabled(last, next, customs)
        const nextLast = stillOk ? last : firstEnabledSearchTargetId(next, customs)
        return { navbarSearchProviders: next, navbarSearchLastProvider: nextLast }
      }),
      setNavbarSearchCustomProviderEnabled: (id, enabled) => set((s) => {
        const customs = s.navbarSearchCustomProviders.map((c) => (c.id === id ? { ...c, enabled } : c))
        const last = s.navbarSearchLastProvider
        const stillOk = isSearchTargetEnabled(last, s.navbarSearchProviders, customs)
        const nextLast = stillOk ? last : firstEnabledSearchTargetId(s.navbarSearchProviders, customs)
        return { navbarSearchCustomProviders: customs, navbarSearchLastProvider: nextLast }
      }),
      setNavbarSearchLastProvider: (navbarSearchLastProvider) => set({ navbarSearchLastProvider }),
      setNavbarSearchWidthPx: (raw) => {
        const n = typeof raw === 'number' ? raw : Number(raw)
        const w = Number.isFinite(n) ? Math.round(n) : 320
        set({ navbarSearchWidthPx: Math.min(920, Math.max(200, w)) })
      },
      addNavbarSearchCustomProvider: (name, urlTemplate) => {
        const n = name.trim().slice(0, 80)
        const u = urlTemplate.trim()
        if (!n || !u) return false
        if (!/\{q\}|%s/i.test(u)) return false
        if (buildCustomSearchUrl(u, 'test') == null) return false
        if (get().navbarSearchCustomProviders.length >= 20) return false
        const id = newCustomSearchProviderId()
        set((s) => ({
          navbarSearchCustomProviders: [...s.navbarSearchCustomProviders, { id, name: n, urlTemplate: u, enabled: true }],
          navbarSearchLastProvider: id,
        }))
        return true
      },
      removeNavbarSearchCustomProvider: (id) => set((s) => {
        const customs = s.navbarSearchCustomProviders.filter((c) => c.id !== id)
        const last = s.navbarSearchLastProvider
        const stillOk = isSearchTargetEnabled(last, s.navbarSearchProviders, customs)
        const nextLast = stillOk ? last : firstEnabledSearchTargetId(s.navbarSearchProviders, customs)
        return { navbarSearchCustomProviders: customs, navbarSearchLastProvider: nextLast }
      }),
      setKioskModeEnabled: (kioskModeEnabled) => set({ kioskModeEnabled }),
      setKioskModeIdleSeconds: (raw) => {
        const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.round(raw) : 5
        set({ kioskModeIdleSeconds: Math.min(60, Math.max(3, n)) })
      },
      setNavbarBackgroundImage: (navbarBackgroundImage) => set({ navbarBackgroundImage: navbarBackgroundImage ?? '' }),
      setNavbarBackgroundOverlay: (raw) => {
        const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.round(raw) : 45
        set({ navbarBackgroundOverlay: Math.min(80, Math.max(0, n)) })
      },
      setDashboardBackgroundMode: (dashboardBackgroundMode) =>
        set({ dashboardBackgroundMode: parseDashboardBackgroundMode(dashboardBackgroundMode) }),
      setDashboardBackgroundImage: (dashboardBackgroundImage) =>
        set({ dashboardBackgroundImage: dashboardBackgroundImage ?? '' }),
      setDashboardBackgroundImage2: (dashboardBackgroundImage2) =>
        set({ dashboardBackgroundImage2: dashboardBackgroundImage2 ?? '' }),
      setDashboardBackgroundOverlay: (raw) => set({ dashboardBackgroundOverlay: clampDashboardBackgroundOverlay(raw) }),
    }),
    {
      name: 'selfdashboard-v2',
      partialize: (state) => pickPersistedDashboardState(state as unknown as DashboardStatePersisted),
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
          state.navbarSearchCustomProviders = normalizeCustomSearchProviders(
            (state as { navbarSearchCustomProviders?: unknown }).navbarSearchCustomProviders,
          )
          const customs = state.navbarSearchCustomProviders
          const last = String(state.navbarSearchLastProvider ?? '')
          if (!last || !isSearchTargetEnabled(last, state.navbarSearchProviders, customs)) {
            state.navbarSearchLastProvider = firstEnabledSearchTargetId(state.navbarSearchProviders, customs)
          }
          const w = state.navbarSearchWidthPx
          if (typeof w !== 'number' || !Number.isFinite(w)) {
            state.navbarSearchWidthPx = 320
          } else {
            state.navbarSearchWidthPx = Math.min(920, Math.max(200, Math.round(w)))
          }
          if (typeof state.kioskModeEnabled !== 'boolean') state.kioskModeEnabled = false
          const idle = state.kioskModeIdleSeconds
          if (typeof idle !== 'number' || !Number.isFinite(idle)) {
            state.kioskModeIdleSeconds = 5
          } else {
            state.kioskModeIdleSeconds = Math.min(60, Math.max(3, Math.round(idle)))
          }
          if (typeof state.navbarBackgroundImage !== 'string') state.navbarBackgroundImage = ''
          const ov = state.navbarBackgroundOverlay
          if (typeof ov !== 'number' || !Number.isFinite(ov)) {
            state.navbarBackgroundOverlay = 45
          } else {
            state.navbarBackgroundOverlay = Math.min(80, Math.max(0, Math.round(ov)))
          }
          state.dashboardBackgroundMode = parseDashboardBackgroundMode(state.dashboardBackgroundMode)
          if (typeof state.dashboardBackgroundImage !== 'string') state.dashboardBackgroundImage = ''
          if (typeof state.dashboardBackgroundImage2 !== 'string') state.dashboardBackgroundImage2 = ''
          state.dashboardBackgroundOverlay = clampDashboardBackgroundOverlay(state.dashboardBackgroundOverlay)
          state.dashboards = stripRemovedPlugins(state.dashboards)
        }
      },
    }
  )
)

/** True after zustand/persist rehydrated localStorage (avoids SSR/client DOM mismatch / React #418). */
export function useDashboardStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (useDashboardStore.persist.hasHydrated()) return () => {}
      return useDashboardStore.persist.onFinishHydration(onStoreChange)
    },
    () => useDashboardStore.persist.hasHydrated(),
    () => false,
  )
}
