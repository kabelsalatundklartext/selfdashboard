import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/test` */
export async function POST(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['test'], request: req })
}
