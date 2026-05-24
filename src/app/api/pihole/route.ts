import { piholeServerHandler } from '@/lib/pluginServers/pihole'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/pihole` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'pihole', [], piholeServerHandler)
}
