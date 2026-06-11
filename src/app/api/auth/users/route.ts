import { NextResponse } from 'next/server'
import {
  validatePasswordStrength,
  validateUsername,
} from '@/lib/auth/password'
import { getAllowedPluginIds, setAllowedPluginIds } from '@/lib/auth/pluginPolicy'
import { requireFullAdmin } from '@/lib/auth/guard'
import { createUser, listUsers } from '@/lib/auth/users'
import type { UserRole } from '@/lib/auth/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireFullAdmin(req)
  if (auth instanceof NextResponse) return auth
  const users = listUsers().map((u) => ({
    ...u,
    allowedPlugins: u.role === 'admin' ? null : getAllowedPluginIds(u.id, u.role),
  }))
  return NextResponse.json({ users })
}

export async function POST(req: Request) {
  const auth = requireFullAdmin(req)
  if (auth instanceof NextResponse) return auth
  let body: {
    username?: string
    password?: string
    role?: UserRole
    allowedPlugins?: string[]
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  const role: UserRole = body.role === 'admin' ? 'admin' : 'user'
  const userErr = validateUsername(username)
  if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })
  const passErr = validatePasswordStrength(password)
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 })
  try {
    const user = createUser({ username, password, role })
    let allowedPlugins: string[] | null = null
    if (role === 'user') {
      allowedPlugins = setAllowedPluginIds(user.id, body.allowedPlugins ?? [])
    }
    return NextResponse.json({
      ok: true,
      user: { ...user, allowedPlugins },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'create_failed'
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
