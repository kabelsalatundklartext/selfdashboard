import { handleAdguardPluginRequest } from '@/lib/pluginServers/adguard'

export const dynamic = 'force-dynamic'

/** Legacy route — prefer `/api/plugins/adguard`. */
export async function POST(req: Request) {
  return handleAdguardPluginRequest(req, [])
}
