import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin, requireFullAuth } from '@/lib/auth/guard'
import {
  adminMustSetupTotp,
  isTotpEnabledForUser,
  isTotpRequiredForAdmin,
  setTotpRequiredForAdmin,
} from '@/lib/auth/totp'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  return NextResponse.json({
    ok: true,
    enabled: isTotpEnabledForUser(auth.userId),
    mfaVerified: auth.mfaVerified,
    setupRequired: adminMustSetupTotp(auth.userId, auth.role),
    adminPolicyRequired: auth.role === 'admin' ? isTotpRequiredForAdmin() : false,
  })
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const full = requireFullAuth(req)
  if (full instanceof NextResponse) return full

  let body: { required?: boolean }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  setTotpRequiredForAdmin(!!body.required)
  return NextResponse.json({ ok: true, required: isTotpRequiredForAdmin() })
}
