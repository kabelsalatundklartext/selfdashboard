import { mailServerHandler } from '@/lib/pluginServers/mail'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/mark-all-read` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['mark-all-read'], mailServerHandler)
}
