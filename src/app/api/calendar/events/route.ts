import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** @deprecated Use `/api/plugins/calendar/events` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'calendar', ['events'], calendarServerHandler)
}

export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'calendar', ['events'], calendarServerHandler)
}
