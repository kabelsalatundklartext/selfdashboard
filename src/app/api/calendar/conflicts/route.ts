import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/calendar/conflicts` */
export async function GET(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['conflicts'], request: req })
}
