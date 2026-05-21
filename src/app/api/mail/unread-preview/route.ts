import { handleMailUnreadPreview } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/unread-preview` */
export async function POST(req: Request) {
  return handleMailUnreadPreview(req)
}
