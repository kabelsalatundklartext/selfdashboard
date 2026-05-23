import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { markSessionMfaVerified } from '@/lib/auth/sessions'
import {
  adminMustSetupTotp,
  enableTotpForUser,
  generateBackupCodes,
  isTotpEnabledForUser,
  verifyTotpCode,
} from '@/lib/auth/totp'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  if (isTotpEnabledForUser(auth.userId)) {
    return NextResponse.json({ error: 'already_enabled' }, { status: 400 })
  }

  const mandatorySetup = adminMustSetupTotp(auth.userId, auth.role)
  if (!auth.mfaVerified && !mandatorySetup) {
    return NextResponse.json({ error: 'mfa_required' }, { status: 403 })
  }

  let body: { secret?: string; code?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const secret = String(body.secret ?? '').trim()
  const code = String(body.code ?? '').trim()
  if (!secret || !code) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 })
  }

  enableTotpForUser(auth.userId, secret)
  const backupCodes = generateBackupCodes(auth.userId)
  markSessionMfaVerified(auth.id)

  return NextResponse.json({ ok: true, backupCodes })
}
