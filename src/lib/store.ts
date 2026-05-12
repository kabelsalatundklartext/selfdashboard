import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardConfig, PluginInstance, ThemeId } from '@/types'

interface DashboardStore extends DashboardConfig {
  // Actions
  setTheme: (theme: ThemeId) => void
  setTitle: (title: string) => void
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
      plugins: [],

      setTheme: (theme) => set({ theme }),
      setTitle: (title) => set({ title }),

      addPlugin: (instance) =>
        set((state) => ({ plugins: [...state.plugins, instance] })),

      removePlugin: (instanceId) =>
        set((state) => ({
          plugins: state.plugins.filter((p) => p.instanceId !== instanceId),
        })),

      updatePluginConfig: (instanceId, config) =>
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p
          ),
        })),

      updatePluginLayout: (instanceId, layout) =>
        set((state) => ({
          plugins: state.plugins.map((p) =>
            p.instanceId === instanceId ? { ...p, layout } : p
          ),
        })),

      reorderPlugins: (plugins) => set({ plugins }),
    }),
    {
      name: 'selfdashboard-config',
    }
  )
)
