import { mailServerHandler } from '@/lib/pluginServers/mail'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/settings` */
export async function GET(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['settings'], request: req })
}

export async function PUT(req: Request) {
  return mailServerHandler({ pluginId: 'mail', path: ['settings'], request: req })
}
