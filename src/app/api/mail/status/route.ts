import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/status` */
export async function GET(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['status'], request: req })
}
