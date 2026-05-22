import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/mark-all-read` */
export async function POST(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['mark-all-read'], request: req })
}
