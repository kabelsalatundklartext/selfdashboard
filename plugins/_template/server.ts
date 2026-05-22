import type { PluginServerContext } from '@/lib/pluginServerRegistry'

/**
 * Example plugin server — copy to plugins/<your-id>/server.ts
 * Widget calls: pluginApiJson('myplugin', '/status') → GET /api/plugins/myplugin/status
 */
export async function mypluginServerHandler(ctx: PluginServerContext): Promise<Response> {
  const method = ctx.request.method.toUpperCase()
  const [segment] = ctx.path

  if (segment === 'status' && method === 'GET') {
    return Response.json({ ok: true, pluginId: ctx.pluginId })
  }

  return Response.json(
    { error: 'not_found', pluginId: ctx.pluginId, path: ctx.path.join('/') },
    { status: 404 },
  )
}

export default mypluginServerHandler
