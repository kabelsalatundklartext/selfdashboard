import { fritzEnergyServerHandler } from '@/lib/pluginServers/fritz-energy'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/fritz-energy` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'fritz-energy', [], fritzEnergyServerHandler)
}

export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'fritz-energy', [], fritzEnergyServerHandler)
}
