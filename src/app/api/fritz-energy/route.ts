import { fritzEnergyServerHandler } from '@/lib/pluginServers/fritz-energy'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/fritz-energy` */
export async function GET(req: Request) {
  return fritzEnergyServerHandler({ pluginId: 'fritz-energy', path: [], request: req })
}

export async function POST(req: Request) {
  return fritzEnergyServerHandler({ pluginId: 'fritz-energy', path: [], request: req })
}
