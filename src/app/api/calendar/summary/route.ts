import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/calendar/summary` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'calendar', ['summary'], calendarServerHandler)
}
