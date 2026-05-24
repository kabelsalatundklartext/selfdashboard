import { NextRequest } from 'next/server'
import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

interface Ctx { params: Promise<{ id: string }> }

/** @deprecated Use `/api/plugins/calendar/calendars/:id` */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  return dispatchLegacyPlugin(req, 'calendar', ['calendars', id], calendarServerHandler)
}
