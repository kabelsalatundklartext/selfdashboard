import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/calendar/accounts` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'calendar', ['accounts'], calendarServerHandler)
}

export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'calendar', ['accounts'], calendarServerHandler)
}
