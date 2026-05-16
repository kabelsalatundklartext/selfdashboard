import type { PluginMeta, PluginComponent } from '@/types'

// ── Plugin Registry ──────────────────────────────────────────
// Each plugin registers itself here with metadata + component.
// External plugin developers import { registerPlugin } and call it.

interface RegisteredPlugin {
  meta: PluginMeta
  component: PluginComponent
}

/** Legacy plugin IDs → current ID (dashboard.json migration). */
const PLUGIN_ID_ALIASES: Record<string, string> = {
  'crowdsec-threat-map': 'crowdsec',
}

export function resolvePluginId(id: string): string {
  return PLUGIN_ID_ALIASES[id] ?? id
}

class PluginRegistry {
  private plugins: Map<string, RegisteredPlugin> = new Map()

  register(meta: PluginMeta, component: PluginComponent) {
    if (this.plugins.has(meta.id)) {
      console.warn(`[SelfDashboard] Plugin "${meta.id}" is already registered. Skipping.`)
      return
    }
    this.plugins.set(meta.id, { meta, component })
    console.info(`[SelfDashboard] Plugin registered: ${meta.name} v${meta.version}`)
  }

  get(id: string): RegisteredPlugin | undefined {
    return this.plugins.get(resolvePluginId(id))
  }

  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values())
  }

  getByCategory(category: string): RegisteredPlugin[] {
    return this.getAll().filter((p) => p.meta.category === category)
  }

  isRegistered(id: string): boolean {
    return this.plugins.has(resolvePluginId(id))
  }
}

// Singleton – one registry for the whole app
export const pluginRegistry = new PluginRegistry()

// Convenience export for plugin developers
export const registerPlugin = (meta: PluginMeta, component: PluginComponent) => {
  pluginRegistry.register(meta, component)
}
