import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/calendar/status` */
export async function GET(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['status'], request: req })
}
