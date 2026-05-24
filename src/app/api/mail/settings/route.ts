import { mailServerHandler } from '@/lib/pluginServers/mail'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/mail/settings` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['settings'], mailServerHandler)
}

export async function PUT(req: Request) {
  return dispatchLegacyPlugin(req, 'mail', ['settings'], mailServerHandler)
}
