import { adguardServerHandler } from '@/lib/pluginServers/adguard'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/adguard` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'adguard', [], adguardServerHandler)
}
