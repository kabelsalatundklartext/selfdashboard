import { NextResponse } from 'next/server'
import {
  consumeRecoveryFileToken,
  isRecoveryConfigured,
  verifyRecoveryToken,
} from '@/lib/auth/recovery'
import { validatePasswordStrength, validateUsername } from '@/lib/auth/password'
import { deleteSessionsForUser } from '@/lib/auth/sessions'
import { getUserByUsername, updateUserPassword } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!isRecoveryConfigured()) {
    return NextResponse.json({ error: 'recovery_unavailable' }, { status: 503 })
  }

  let body: { username?: string; password?: string; token?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const token = String(body.token ?? '').trim()
  const username = String(body.username ?? '').trim()
  const password = String(body.password ?? '')

  if (!token || !username || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (!verifyRecoveryToken(token)) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 403 })
  }

  const userErr = validateUsername(username)
  if (userErr) return NextResponse.json({ error: userErr }, { status: 400 })

  const passErr = validatePasswordStrength(password)
  if (passErr) return NextResponse.json({ error: passErr }, { status: 400 })

  const user = getUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

  const updated = updateUserPassword(user.id, password)
  if (!updated) return NextResponse.json({ error: 'reset_failed' }, { status: 500 })

  deleteSessionsForUser(user.id)
  consumeRecoveryFileToken()

  return NextResponse.json({ ok: true, username: updated.username })
}
