import { selfstreamServerHandler } from '@/lib/pluginServers/selfstream'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/selfstream` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'selfstream', [], selfstreamServerHandler)
}
