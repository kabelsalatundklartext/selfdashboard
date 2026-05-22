import { crowdsecServerHandler } from '@/lib/pluginServers/crowdsec'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/crowdsec/decision` */
export async function POST(req: Request) {
  return crowdsecServerHandler({ pluginId: 'crowdsec', path: ['decision'], request: req })
}
