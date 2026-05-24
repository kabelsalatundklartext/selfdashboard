import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/crowdsec` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'crowdsec', [], crowdsecServerHandler)
}
