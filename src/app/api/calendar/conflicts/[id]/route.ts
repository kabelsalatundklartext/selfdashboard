import { NextRequest } from 'next/server'
import { calendarServerHandler } from '@/lib/pluginServers/calendar'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

interface Ctx { params: Promise<{ id: string }> }

/** @deprecated Use `/api/plugins/calendar/conflicts/:id` */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  return dispatchLegacyPlugin(req, 'calendar', ['conflicts', id], calendarServerHandler)
}
