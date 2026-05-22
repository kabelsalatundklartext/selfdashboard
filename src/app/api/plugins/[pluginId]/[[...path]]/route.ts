import { NextResponse } from 'next/server'
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
  await ensureServers()
  const pluginId = params.pluginId
  const path = params.path ?? []
  const handler = getPluginServerHandler(pluginId)
  if (!handler) {
    return NextResponse.json({ error: 'plugin_not_found', pluginId }, { status: 404 })
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
