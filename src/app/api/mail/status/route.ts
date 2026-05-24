import { mailServerHandler } from '@/lib/pluginServers/mail'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/status` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['status'], mailServerHandler)
}
