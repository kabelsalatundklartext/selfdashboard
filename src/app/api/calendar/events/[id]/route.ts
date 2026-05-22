import { NextRequest } from 'next/server'
import { calendarServerHandler } from '@/lib/pluginServers/calendar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Ctx { params: Promise<{ id: string }> }

/** @deprecated Use `/api/plugins/calendar/events/:id` */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  return calendarServerHandler({ pluginId: 'calendar', path: ['events', id], request: req })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  return calendarServerHandler({ pluginId: 'calendar', path: ['events', id], request: req })
}
