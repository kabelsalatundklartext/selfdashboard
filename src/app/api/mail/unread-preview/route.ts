import { mailServerHandler } from '@/lib/pluginServers/mail'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/unread-preview` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['unread-preview'], mailServerHandler)
}
