import { NextResponse } from 'next/server'
import { loadKioskDashboardBundle } from '@/lib/kiosk/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { config } = await loadKioskDashboardBundle()
  return NextResponse.json({
    enabled: config.enabled,
    requiresPassword: Boolean(config.passwordHash),
    dashboardId: config.dashboardId,
    idleSeconds: config.idleSeconds,
  })
}
