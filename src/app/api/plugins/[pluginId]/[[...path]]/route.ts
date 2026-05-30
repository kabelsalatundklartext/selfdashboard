import { NextResponse } from 'next/server'
import { requirePluginAccess } from '@/lib/auth/guard'
import { isReservedPluginApiSegment } from '@/lib/auth/pluginPolicy'
import { loadAllPluginServers } from '@/lib/pluginServerLoader'
import { getPluginServerHandler } from '@/lib/pluginServerRegistry'

export const dynamic = 'force-dynamic'

let serversReady: Promise<void> | null = null
function ensureServers(): Promise<void> {
  if (!serversReady) serversReady = loadAllPluginServers()
  return serversReady
}
void ensureServers()

type RouteParams = { pluginId: string; path?: string[] }

async function dispatch(req: Request, params: RouteParams): Promise<Response> {
  const pluginId = params.pluginId
  if (isReservedPluginApiSegment(pluginId)) {
    return NextResponse.json({ error: 'invalid_plugin_route', pluginId }, { status: 404 })
  }
  const denied = requirePluginAccess(req, pluginId)
  if (denied instanceof NextResponse) return denied
  await ensureServers()
  const path = params.path ?? []
  const handler = getPluginServerHandler(pluginId)
  if (!handler) {
    const { getCustomServerLoadErrors } = await import('@/lib/pluginCustomServer')
    const loadErr = getCustomServerLoadErrors()[pluginId]
    return NextResponse.json(
      { error: 'plugin_not_found', pluginId, ...(loadErr ? { loadError: loadErr } : {}) },
      { status: 404 },
    )
  }
  return handler({ pluginId, path, request: req })
}

export async function GET(req: Request, ctx: { params: Promise<RouteParams> }) {
  return dispatch(req, await ctx.params)
}

export async function POST(req: Request, ctx: { params: Promise<RouteParams> }) {
  return dispatch(req, await ctx.params)
}

export async function PUT(req: Request, ctx: { params: Promise<RouteParams> }) {
  return dispatch(req, await ctx.params)
}

export async function PATCH(req: Request, ctx: { params: Promise<RouteParams> }) {
  return dispatch(req, await ctx.params)
}

export async function DELETE(req: Request, ctx: { params: Promise<RouteParams> }) {
  return dispatch(req, await ctx.params)
}
