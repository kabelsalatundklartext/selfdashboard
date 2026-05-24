import { fritzboxServerHandler } from '@/lib/pluginServers/fritzbox'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/fritzbox` */
export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'fritzbox', [], fritzboxServerHandler)
}
