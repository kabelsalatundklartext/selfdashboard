import { NextResponse } from 'next/server'
import { login } from '@/lib/auth/service'
import { rateLimitLogin, rateLimitResponse } from '@/lib/auth/rateLimit'
import { applySessionCookie } from '@/lib/auth/sessionResponse'
import { needsSetup } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (needsSetup()) {
    return NextResponse.json({ error: 'needs_setup' }, { status: 503 })
  }

  const rl = rateLimitLogin(req)
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)

  let body: { username?: string; password?: string; rememberMe?: boolean }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')
  if (!username || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  try {
    const session = await login({
      username,
      password,
      remember: !!body.rememberMe,
    })
    const res = NextResponse.json({
      ok: true,
      needsTotp: !session.mfaVerified,
      user: {
        id: session.userId,
        username: session.username,
        role: session.role,
      },
    })
    return applySessionCookie(res, session)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'login_failed'
    if (msg === 'invalid_credentials') {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
