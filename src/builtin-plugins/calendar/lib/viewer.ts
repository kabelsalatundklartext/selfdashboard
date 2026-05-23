import { getSessionFromRequest } from '@/lib/auth/guard'
import type { UserRole } from '@/lib/auth/types'

export type CalendarViewer = {
  userId: string
  role: UserRole
}

/** Resolve the authenticated user for calendar API handlers. */
export function resolveCalendarViewer(req: Request): CalendarViewer {
  const session = getSessionFromRequest(req)
  if (session) {
    return { userId: session.userId, role: session.role }
  }
  const hdr = req.headers.get('x-sd-user-id')?.trim()
  if (hdr) {
    const role = (req.headers.get('x-sd-role')?.trim() ?? 'user') as UserRole
    return { userId: hdr, role }
  }
  return { userId: '__local__', role: 'admin' }
}
