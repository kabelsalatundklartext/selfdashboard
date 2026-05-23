import { NextResponse } from 'next/server'
import {
  validatePasswordStrength,
} from '@/lib/auth/password'
import { requireAdmin } from '@/lib/auth/guard'
import { deleteSessionsForUser } from '@/lib/auth/sessions'
import { deleteUser, getUserById, updateUserPassword, updateUserRole } from '@/lib/auth/users'
import type { UserRole } from '@/lib/auth/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = await ctx.params
  const target = getUserById(userId)
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let body: { password?: string; role?: UserRole }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let user = target
  if (body.role === 'admin' || body.role === 'user') {
    if (userId === auth.userId && body.role !== target.role) {
      return NextResponse.json({ error: 'cannot_change_own_role' }, { status: 400 })
    }
    try {
      const updated = updateUserRole(userId, body.role)
      if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      user = updated
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'update_failed'
      if (msg === 'last_admin') {
        return NextResponse.json({ error: 'last_admin' }, { status: 400 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  const password = body.password != null ? String(body.password) : ''
  if (password) {
    const passErr = validatePasswordStrength(password)
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 })
    const updated = updateUserPassword(userId, password)
    if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    user = updated
    deleteSessionsForUser(userId)
  }

  return NextResponse.json({ ok: true, user })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = await ctx.params
  if (userId === auth.userId) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 })
  }
  const target = getUserById(userId)
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  try {
    deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'delete_failed'
    if (msg === 'last_admin') {
      return NextResponse.json({ error: 'last_admin' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
