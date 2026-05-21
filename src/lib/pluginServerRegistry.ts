export interface PluginServerContext {
  pluginId: string
  /** Path segments after `/api/plugins/<pluginId>/` (empty = root). */
  path: string[]
  request: Request
}

export type PluginServerHandler = (ctx: PluginServerContext) => Promise<Response>

const handlers = new Map<string, PluginServerHandler>()

export function registerPluginServerHandler(pluginId: string, handler: PluginServerHandler): void {
  if (handlers.has(pluginId)) {
    console.warn(`[SelfDashboard] Plugin server handler "${pluginId}" already registered — skipping.`)
    return
  }
  handlers.set(pluginId, handler)
}

export function getPluginServerHandler(pluginId: string): PluginServerHandler | undefined {
  return handlers.get(pluginId)
}

export function getRegisteredPluginServerIds(): string[] {
  return Array.from(handlers.keys())
}
