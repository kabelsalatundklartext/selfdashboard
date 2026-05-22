export interface PluginServerContext {
  pluginId: string
  /** Path segments after `/api/plugins/<pluginId>/` (empty = root). */
  path: string[]
  request: Request
}

export type PluginServerHandler = (ctx: PluginServerContext) => Promise<Response>

const handlers = new Map<string, PluginServerHandler>()
const handlerSource = new Map<string, 'builtin' | 'custom'>()

export function registerPluginServerHandler(
  pluginId: string,
  handler: PluginServerHandler,
  opts?: { source?: 'builtin' | 'custom'; replace?: boolean },
): void {
  const source = opts?.source ?? 'builtin'
  if (handlers.has(pluginId) && !opts?.replace) {
    console.warn(`[SelfDashboard] Plugin server handler "${pluginId}" already registered — skipping.`)
    return
  }
  handlers.set(pluginId, handler)
  handlerSource.set(pluginId, source)
}

export function unregisterPluginServerHandler(pluginId: string): void {
  handlers.delete(pluginId)
  handlerSource.delete(pluginId)
}

export function getPluginServerHandler(pluginId: string): PluginServerHandler | undefined {
  return handlers.get(pluginId)
}

export function getRegisteredPluginServerIds(): string[] {
  return Array.from(handlers.keys())
}

export function getPluginServerHandlerSource(
  pluginId: string,
): 'builtin' | 'custom' | undefined {
  return handlerSource.get(pluginId)
}
