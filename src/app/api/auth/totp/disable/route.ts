import { NextResponse } from 'next/server'
import { requireFullAuth } from '@/lib/auth/guard'
import { rateLimitResponse, rateLimitTotpDisable } from '@/lib/auth/rateLimit'
import { verifyUserPassword } from '@/lib/auth/users'
import {
  disableTotpForUser,
  isTotpEnabledForUser,
  isTotpRequiredForAdmin,
  verifyUserSecondFactor,
} from '@/lib/auth/totp'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requireFullAuth(req)
  if (auth instanceof NextResponse) return auth

  const rl = rateLimitTotpDisable(auth.userId)
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)

  if (!isTotpEnabledForUser(auth.userId)) {
    return NextResponse.json({ error: 'not_enabled' }, { status: 400 })
  }

  if (auth.role === 'admin' && isTotpRequiredForAdmin()) {
    return NextResponse.json({ error: 'admin_totp_required' }, { status: 400 })
  }

  let body: { password?: string; code?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const password = String(body.password ?? '')
  const code = String(body.code ?? '').trim()
  if (!password || !code) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (!verifyUserPassword(auth.userId, password)) {
    return NextResponse.json({ error: 'wrong_password' }, { status: 403 })
  }

  if (!verifyUserSecondFactor(auth.userId, code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 })
  }

  disableTotpForUser(auth.userId)
  return NextResponse.json({ ok: true })
}
