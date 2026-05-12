import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardConfig, PluginInstance, ThemeId } from '@/types'
import type { Locale } from './i18n'

interface CustomThemeColors {
  background?: string
  surface?: string
  'surface-2'?: string
  border?: string
  text?: string
  'text-muted'?: string
  accent?: string
}

interface DashboardStore extends DashboardConfig {
  locale: Locale
  editMode: boolean
  customLogo?: string
  customFavicon?: string
  customColors?: CustomThemeColors
  setTheme: (theme: ThemeId) => void
  setTitle: (title: string) => void
  setLocale: (locale: Locale) => void
  setEditMode: (editMode: boolean) => void
  setCustomLogo: (url: string) => void
  setCustomFavicon: (url: string) => void
  setCustomColors: (colors: CustomThemeColors) => void
  resetCustomColors: () => void
  addPlugin: (instance: PluginInstance) => void
  removePlugin: (instanceId: string) => void
  updatePluginConfig: (instanceId: string, config: Record<string, unknown>) => void
  updatePluginLayout: (instanceId: string, layout: PluginInstance['layout']) => void
  reorderPlugins: (plugins: PluginInstance[]) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      title: 'SelfDashboard',
      locale: 'en',
      editMode: false,
      customLogo: undefined,
      customFavicon: undefined,
      customColors: undefined,
      plugins: [],

      setTheme: (theme) => set({ theme }),
      setTitle: (title) => set({ title }),
      setLocale: (locale) => set({ locale }),
      setEditMode: (editMode) => set({ editMode }),
      setCustomLogo: (customLogo) => set({ customLogo }),
      setCustomFavicon: (customFavicon) => set({ customFavicon }),
      setCustomColors: (colors) => set((s) => ({ customColors: { ...s.customColors, ...colors } })),
      resetCustomColors: () => set({ customColors: undefined }),

      addPlugin: (instance) => set((s) => ({ plugins: [...s.plugins, instance] })),
      removePlugin: (instanceId) => set((s) => ({ plugins: s.plugins.filter((p) => p.instanceId !== instanceId) })),
      updatePluginConfig: (instanceId, config) => set((s) => ({
        plugins: s.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p)
      })),
      updatePluginLayout: (instanceId, layout) => set((s) => ({
        plugins: s.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p)
      })),
      reorderPlugins: (plugins) => set({ plugins }),
    }),
    { name: 'selfdashboard-config' }
  )
)
