/**
 * PUT /api/calendar/calendars/:id — change color, visibility, or display name.
 *
 * The remote calendar is NOT modified — these are purely local view settings.
 */

import { NextRequest } from 'next/server'

import { badRequest, notFound, ok } from '@/lib/calendar/api-helpers'
import { mutateStore } from '@/lib/calendar/store'

interface Ctx { params: Promise<{ id: string }> }

interface UpdateBody {
  color?: string
  visible?: boolean
  name?: string
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: UpdateBody
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid JSON')
  }

  let updated = null
  await mutateStore(s => {
    const c = s.calendars.find(x => x.id === id)
    if (!c) return
    if (body.color !== undefined) c.color = body.color
    if (body.visible !== undefined) c.visible = body.visible
    if (body.name !== undefined) c.name = body.name
    updated = c
  })
  if (!updated) return notFound('calendar not found')
  return ok(updated)
}
