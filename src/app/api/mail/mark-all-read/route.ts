import { handleMailMarkAllRead } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/mark-all-read` */
export async function POST(req: Request) {
  return handleMailMarkAllRead(req)
}
