import { NextResponse } from 'next/server'
import {
  buildKioskAccess,
  getKioskConfig,
  loadKioskDashboardBundle,
} from '@/lib/kiosk/config'
import { issueKioskToken, applyKioskCookie, kioskAccessGranted } from '@/lib/kiosk/session'

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
    applyKioskCookie(res, issueKioskToken(access, false, config), config)
  }
  return res
}
