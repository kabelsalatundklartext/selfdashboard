import { NextResponse } from 'next/server'
import { applySessionCookie } from '@/lib/auth/sessionResponse'
import { rateLimitResponse, rateLimitSetup } from '@/lib/auth/rateLimit'
import { setupAdmin } from '@/lib/auth/service'
import { needsSetup } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!needsSetup()) {
    return NextResponse.json({ error: 'already_setup' }, { status: 409 })
  }

  const rl = rateLimitSetup(req)
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)

  let body: { username?: string; password?: string }
  try {
    body = (await req.json()) as { username?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  if (!username || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  try {
    const result = await setupAdmin({ username, password })
    const res = NextResponse.json({
      ok: true,
      user: {
        id: result.user.userId,
        username: result.user.username,
        role: result.user.role,
      },
      migration: result.migration,
    })
    return applySessionCookie(res, result.user)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'setup_failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
