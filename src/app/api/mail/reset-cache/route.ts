import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/reset-cache` */
export async function POST(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['reset-cache'], request: req })
}
