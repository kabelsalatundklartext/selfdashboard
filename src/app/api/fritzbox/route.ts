import { fritzboxServerHandler } from '@/lib/pluginServers/fritzbox'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/fritzbox` */
export async function POST(req: Request) {
  return fritzboxServerHandler({ pluginId: 'fritzbox', path: [], request: req })
}
