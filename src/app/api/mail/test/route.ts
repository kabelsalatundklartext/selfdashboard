import { mailServerHandler } from '@/lib/pluginServers/mail'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/test` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['test'], mailServerHandler)
}
