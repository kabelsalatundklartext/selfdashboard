import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** @deprecated Use `/api/plugins/calendar/events` */
export async function GET(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['events'], request: req })
}

export async function POST(req: Request) {
  return calendarServerHandler({ pluginId: 'calendar', path: ['events'], request: req })
}
