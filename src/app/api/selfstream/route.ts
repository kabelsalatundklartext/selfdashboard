import { selfstreamServerHandler } from '@/lib/pluginServers/selfstream'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/selfstream` */
export async function POST(req: Request) {
  return selfstreamServerHandler({ pluginId: 'selfstream', path: [], request: req })
}
