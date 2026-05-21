import { handleMailTest } from '@/lib/mail/httpHandlers'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/test` */
export async function POST(req: Request) {
  return handleMailTest(req)
}
