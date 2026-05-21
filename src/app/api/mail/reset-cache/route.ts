import { handleMailResetCache } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/reset-cache` */
export async function POST() {
  return handleMailResetCache()
}
