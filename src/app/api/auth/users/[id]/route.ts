import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { deleteUser, getUserById } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

type RouteParams = { id: string }

export async function DELETE(req: Request, ctx: { params: Promise<RouteParams> }) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await ctx.params
  if (auth.userId === id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 })
  }

  const user = getUserById(id)
  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const ok = deleteUser(id)
    if (!ok) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'delete_failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
