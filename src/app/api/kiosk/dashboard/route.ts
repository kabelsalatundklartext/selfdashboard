import { NextResponse } from 'next/server'
import {
  buildKioskAccess,
  getKioskConfig,
  loadKioskDashboardBundle,
} from '@/lib/kiosk/config'
import {
  issueKioskToken,
  kioskAccessGranted,
  kioskCookieOptions,
} from '@/lib/kiosk/session'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { config, state, pluginIds } = await loadKioskDashboardBundle()
  if (!config.enabled) {
    return NextResponse.json({ error: 'kiosk_disabled' }, { status: 503 })
  }
  if (!state) {
    return NextResponse.json({ error: 'dashboard_not_found' }, { status: 404 })
  }

  const access = buildKioskAccess(config, pluginIds)
  if (!access) return NextResponse.json({ error: 'kiosk_unavailable' }, { status: 503 })

  if (config.passwordHash) {
    const granted = kioskAccessGranted(req, config)
    if (!granted) {
      return NextResponse.json({ error: 'password_required' }, { status: 401 })
    }
  }

  const res = NextResponse.json(state)
  if (!config.passwordHash) {
    const token = issueKioskToken(access)
    const opts = kioskCookieOptions(token)
    res.cookies.set(opts)
  }
  return res
}
