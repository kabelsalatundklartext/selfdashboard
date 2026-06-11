import { NextResponse } from 'next/server'
import { readSessionIdFromCookieHeader } from '@/lib/auth/cookies'
import { requireAuth } from '@/lib/auth/guard'
import { rateLimitChangePassword, rateLimitResponse } from '@/lib/auth/rateLimit'
import { validatePasswordStrength } from '@/lib/auth/password'
import { deleteSessionsForUserExcept } from '@/lib/auth/sessions'
import { updateUserPassword, verifyUserPassword } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const rl = rateLimitChangePassword(auth.userId)
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const currentPassword = String(body.currentPassword ?? '')
  const newPassword = String(body.newPassword ?? '')
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (!verifyUserPassword(auth.userId, currentPassword)) {
    return NextResponse.json({ error: 'wrong_password' }, { status: 403 })
  }

  const passErr = validatePasswordStrength(newPassword)
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 })

  const updated = updateUserPassword(auth.userId, newPassword)
  if (!updated) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const sessionId = readSessionIdFromCookieHeader(req.headers.get('cookie'))
  deleteSessionsForUserExcept(auth.userId, sessionId)

  return NextResponse.json({ ok: true })
}
