import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { rateLimitResponse, rateLimitTotpVerify } from '@/lib/auth/rateLimit'
import { markSessionMfaVerified } from '@/lib/auth/sessions'
import {
  adminMustSetupTotp,
  isTotpEnabledForUser,
  verifyUserSecondFactor,
} from '@/lib/auth/totp'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  if (auth.mfaVerified) {
    return NextResponse.json({ error: 'already_verified' }, { status: 400 })
  }

  const rl = rateLimitTotpVerify(req, auth.userId)
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)

  let body: { code?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const code = String(body.code ?? '').trim()
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 })

  if (adminMustSetupTotp(auth.userId, auth.role) && !isTotpEnabledForUser(auth.userId)) {
    return NextResponse.json({ error: 'totp_setup_required' }, { status: 403 })
  }

  if (!verifyUserSecondFactor(auth.userId, code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 })
  }

  markSessionMfaVerified(auth.id)
  return NextResponse.json({ ok: true })
}
