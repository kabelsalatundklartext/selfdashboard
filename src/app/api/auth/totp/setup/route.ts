import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { buildTotpQrDataUrl } from '@/lib/auth/totpQr'
import {  adminMustSetupTotp,
  buildOtpAuthUri,
  generateTotpSecret,
  isTotpEnabledForUser,
} from '@/lib/auth/totp'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  if (isTotpEnabledForUser(auth.userId)) {
    return NextResponse.json({ error: 'already_enabled' }, { status: 400 })
  }

  const mandatorySetup = adminMustSetupTotp(auth.userId, auth.role)
  if (!auth.mfaVerified && !mandatorySetup) {
    return NextResponse.json({ error: 'mfa_required' }, { status: 403 })
  }

  const secret = generateTotpSecret()
  const uri = buildOtpAuthUri(auth.username, secret)
  const qrDataUrl = await buildTotpQrDataUrl(uri)
  return NextResponse.json({
    ok: true,
    secret,
    uri,
    qrDataUrl,
  })
}
