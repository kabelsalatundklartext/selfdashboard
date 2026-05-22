import { adguardServerHandler } from '@/lib/pluginServers/adguard'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/adguard` */
export async function POST(req: Request) {
  return adguardServerHandler({ pluginId: 'adguard', path: [], request: req })
}
