import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/unread-preview` */
export async function POST(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['unread-preview'], request: req })
}
