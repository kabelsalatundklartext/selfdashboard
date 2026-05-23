import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guard'
import { getKioskConfig, saveKioskConfig, setKioskPassword } from '@/lib/kiosk/config'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const cfg = getKioskConfig()
  return NextResponse.json({
    enabled: cfg.enabled,
    dashboardId: cfg.dashboardId,
    idleSeconds: cfg.idleSeconds,
    hasPassword: Boolean(cfg.passwordHash),
    publicUrl: '/kiosk',
  })
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  let body: {
    enabled?: boolean
    dashboardId?: string
    idleSeconds?: number
    password?: string | null
    clearPassword?: boolean
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  try {
    let cfg = saveKioskConfig({
      ownerUserId: auth.userId,
      enabled: body.enabled,
      dashboardId: body.dashboardId,
      idleSeconds: body.idleSeconds,
    })
    if (body.clearPassword) {
      cfg = saveKioskConfig({ ownerUserId: auth.userId, passwordHash: null })
    } else if (typeof body.password === 'string' && body.password.trim()) {
      cfg = setKioskPassword(body.password.trim(), auth.userId)
    }
    return NextResponse.json({
      ok: true,
      enabled: cfg.enabled,
      dashboardId: cfg.dashboardId,
      idleSeconds: cfg.idleSeconds,
      hasPassword: Boolean(cfg.passwordHash),
      publicUrl: '/kiosk',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'save_failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
