import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import {
  handleMailMarkAllRead,
  handleMailResetCache,
  handleMailSettingsGet,
  handleMailSettingsPut,
  handleMailStatus,
  handleMailTest,
  handleMailUnreadPreview,
} from './lib/httpHandlers'

export async function mailServerHandler(ctx: PluginServerContext): Promise<Response> {
  const [segment] = ctx.path
  const method = ctx.request.method.toUpperCase()

  if (segment === 'status' || ctx.path.length === 0) {
    if (method === 'GET') return handleMailStatus(ctx.request)
  }

  if (segment === 'settings') {
    if (method === 'GET') return handleMailSettingsGet()
    if (method === 'PUT') return handleMailSettingsPut(ctx.request)
  }

  if (segment === 'test' && method === 'POST') {
    return handleMailTest(ctx.request)
  }

  if (segment === 'unread-preview' && method === 'POST') {
    return handleMailUnreadPreview(ctx.request)
  }

  if (segment === 'mark-all-read' && method === 'POST') {
    return handleMailMarkAllRead(ctx.request)
  }

  if (segment === 'reset-cache' && method === 'POST') {
    return handleMailResetCache()
  }

  return Response.json(
    { error: 'not_found', pluginId: ctx.pluginId, path: ctx.path.join('/') },
    { status: 404 },
  )
}

export default mailServerHandler
