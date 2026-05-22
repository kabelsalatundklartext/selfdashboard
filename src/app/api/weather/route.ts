import { NextRequest } from 'next/server'
import { weatherServerHandler } from '@/lib/pluginServers/weather'

export const dynamic = 'force-dynamic'

/**
 * @deprecated Use `/api/plugins/weather/{geocode|forecast|resolve}` — logic lives in `plugins/weather/server.ts`.
 * Thin compat shim for old bookmarks and curl tests.
 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')?.trim()
  const path = action ? [action] : []
  return weatherServerHandler({ pluginId: 'weather', path, request: req })
}
