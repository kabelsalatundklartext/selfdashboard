export interface PluginServerContext {
  pluginId: string
  path: string[]
  request: Request
}

export type PluginServerHandler = (ctx: PluginServerContext) => Promise<Response>
