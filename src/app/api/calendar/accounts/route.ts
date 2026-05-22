import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/calendar/accounts` */
export async function GET(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['accounts'], request: req })
}

export async function POST(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['accounts'], request: req })
}
