import 'server-only'

import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export function inferPluginIdFromPath(pathname: string): string {
  const seg = pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
  if (!seg.length) return 'api'
  if (seg[0] === 'calendar') return 'calendar'
  if (seg[0] === 'docker-container-stats' || seg[0] === 'docker-containers') return 'docker'
  return seg[0]
}

/**
 * Wraps an API route handler: uncaught errors and HTTP 5xx responses are logged to error-log.jsonl.
 */
export async function withApiRouteLog(
  req: Request,
  operation: string,
  fn: () => Promise<NextResponse>,
  pluginId?: string,
): Promise<NextResponse> {
  const pid = pluginId ?? inferPluginIdFromPath(new URL(req.url).pathname)
  try {
    const res = await fn()
    if (res.status >= 500) {
      let detail: string | undefined
      try {
        const j = await res.clone().json()
        detail = JSON.stringify(j).slice(0, 800)
      } catch {
        detail = undefined
      }
      await logPluginApiFailure(pid, operation, `HTTP ${res.status}`, { detail })
    }
    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await logPluginApiFailure(pid, operation, message, {
      stack: e instanceof Error ? e.stack?.slice(0, 1200) : undefined,
    })
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 })
  }
}
