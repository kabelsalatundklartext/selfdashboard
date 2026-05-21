import { handleMailStatus } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/status` */
export async function GET(req: Request) {
  return handleMailStatus(req)
}
