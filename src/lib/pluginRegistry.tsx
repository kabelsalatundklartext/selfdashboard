'use client'

import type { ComponentType } from 'react'
import type { PluginMeta, PluginComponent, PluginWidgetProps } from '@/types'
import { WidgetErrorBoundary } from '@/components/plugins/WidgetErrorBoundary'

// ── Plugin Registry ──────────────────────────────────────────
// Each plugin registers itself here with metadata + component.
// External plugin developers import { registerPlugin } and call it.

interface RegisteredPlugin {
  meta: PluginMeta
  component: PluginComponent
}

function wrapWidgetWithLogging(meta: PluginMeta, Widget: ComponentType<PluginWidgetProps>) {
  function SafeWidget(props: PluginWidgetProps) {
    return (
      <WidgetErrorBoundary pluginId={meta.id} instanceId={props.instanceId}>
        <Widget {...props} />
      </WidgetErrorBoundary>
    )
  }
  SafeWidget.displayName = `Widget(${meta.id})`
  return SafeWidget
}

class PluginRegistry {
  private plugins: Map<string, RegisteredPlugin> = new Map()

  register(meta: PluginMeta, component: PluginComponent) {
    if (this.plugins.has(meta.id)) {
      console.warn(`[SelfDashboard] Plugin "${meta.id}" is already registered. Skipping.`)
      return
    }
    const wrapped: PluginComponent = {
      ...component,
      Widget: wrapWidgetWithLogging(meta, component.Widget),
    }
    this.plugins.set(meta.id, { meta, component: wrapped })
    console.info(
      `[SelfDashboard] Plugin registered: ${meta.name} v${meta.version} (id=${meta.id}, errors → Protokoll)`,
    )
  }

  get(id: string): RegisteredPlugin | undefined {
    return this.plugins.get(id)
  }

  getAll(): RegisteredPlugin[] {
    return Array.from(this.plugins.values())
  }

  getByCategory(category: string): RegisteredPlugin[] {
    return this.getAll().filter((p) => p.meta.category === category)
  }

  isRegistered(id: string): boolean {
    return this.plugins.has(id)
  }
}

// Singleton – one registry for the whole app
export const pluginRegistry = new PluginRegistry()

/** Register a plugin — Widget is wrapped for automatic error logging (see docs/LOGGING.md). */
export const registerPlugin = (meta: PluginMeta, component: PluginComponent) => {
  pluginRegistry.register(meta, component)
}
