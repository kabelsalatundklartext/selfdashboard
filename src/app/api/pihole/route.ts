import { piholeServerHandler } from '@/lib/pluginServers/pihole'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/pihole` */
export async function POST(req: Request) {
  return piholeServerHandler({ pluginId: 'pihole', path: [], request: req })
}
