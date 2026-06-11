import { NextResponse } from 'next/server'
import { requireFullAdmin } from '@/lib/auth/guard'
import { setAllowedPluginIds } from '@/lib/auth/pluginPolicy'
import { getUserById } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

type Body = {
  userId?: string
  allowedPlugins?: unknown
}

async function saveUserPlugins(req: Request): Promise<Response> {
  const auth = requireFullAdmin(req)
  if (auth instanceof NextResponse) return auth

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const userId = String(body.userId ?? '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'userId_required' }, { status: 400 })
  }

  const user = getUserById(userId)
  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (user.role === 'admin') {
    return NextResponse.json({ error: 'admin_has_all_plugins' }, { status: 400 })
  }

  const raw = body.allowedPlugins
  const plugins = Array.isArray(raw)
    ? raw.filter((p): p is string => typeof p === 'string')
    : []

  try {
    const allowedPlugins = setAllowedPluginIds(user.id, plugins)
    return NextResponse.json({ ok: true, allowedPlugins })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'save_failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

/** Flat route (no nested `[userId]/plugins`) — avoids 404/HTML on some deploys and proxies. */
export async function POST(req: Request) {
  return saveUserPlugins(req)
}

export async function PUT(req: Request) {
  return saveUserPlugins(req)
}
