import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { deleteUser, getUserById } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

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
