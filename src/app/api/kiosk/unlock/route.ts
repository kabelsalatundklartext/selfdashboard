import { NextResponse } from 'next/server'
import {
  buildKioskAccess,
  loadKioskDashboardBundle,
  verifyKioskPassword,
} from '@/lib/kiosk/config'
import { issueKioskToken, kioskCookieOptions } from '@/lib/kiosk/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { config, pluginIds } = await loadKioskDashboardBundle()
  if (!config.enabled) {
    return NextResponse.json({ error: 'kiosk_disabled' }, { status: 503 })
  }
  if (!config.passwordHash) {
    return NextResponse.json({ error: 'password_not_required' }, { status: 400 })
  }

  let body: { password?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const password = String(body.password ?? '')
  if (!password || !verifyKioskPassword(password)) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 403 })
  }

  const access = buildKioskAccess(config, pluginIds)
  if (!access) return NextResponse.json({ error: 'kiosk_unavailable' }, { status: 503 })

  const token = issueKioskToken(access)
  const res = NextResponse.json({ ok: true })
  const opts = kioskCookieOptions(token)
  res.cookies.set(opts)
  return res
}
