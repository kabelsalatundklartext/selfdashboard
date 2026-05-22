import { dockerServerHandler } from '@/lib/pluginServers/docker'

export const dynamic = 'force-dynamic'

/** @deprecated Use `/api/plugins/docker/containers` */
export async function GET(req: Request) {
  return dockerServerHandler({ pluginId: 'docker', path: ['containers'], request: req })
}

export async function POST(req: Request) {
  return dockerServerHandler({ pluginId: 'docker', path: ['containers'], request: req })
}
