import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/crowdsec` */
export async function GET(req: Request) {
  return crowdsecServerHandler({ pluginId: 'crowdsec', path: [], request: req })
}
