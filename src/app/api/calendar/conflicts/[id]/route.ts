import { NextRequest } from 'next/server'
import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'

interface Ctx { params: Promise<{ id: string }> }

/** @deprecated Use `/api/plugins/calendar/conflicts/:id` */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  return calendarServerHandler({ pluginId: 'calendar', path: ['conflicts', id], request: req })
}
