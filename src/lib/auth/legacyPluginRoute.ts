import 'server-only'
import { NextResponse } from 'next/server'
import { requirePluginAccess } from '@/lib/auth/guard'

type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

type PluginServerHandler = (ctx: PluginServerContext) => Promise<Response>

/** Defense-in-depth auth for deprecated `/api/{plugin}/…` shims (middleware also enforces access). */
export async function dispatchLegacyPlugin(
  req: Request,
  pluginId: string,
  path: string[],
  handler: PluginServerHandler,
): Promise<Response> {
  const denied = requirePluginAccess(req, pluginId)
  if (denied instanceof NextResponse) return denied
  return handler({ pluginId, path, request: req })
}
