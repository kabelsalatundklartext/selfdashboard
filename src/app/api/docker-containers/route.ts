import { dockerServerHandler } from '@/lib/pluginServers/docker'
import { dispatchLegacyPlugin } from '@/lib/auth/legacyPluginRoute'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/docker/containers` */
export async function GET(req: Request) {
  return dispatchLegacyPlugin(req, 'docker', ['containers'], dockerServerHandler)
}

export async function POST(req: Request) {
  return dispatchLegacyPlugin(req, 'docker', ['containers'], dockerServerHandler)
}
