import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/crowdsec/decision` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'crowdsec', ['decision'], crowdsecServerHandler)
}
