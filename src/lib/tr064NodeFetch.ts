/**
 * digest-fetch uses global fetch on Node 18+, which ignores `agent`.
 * FRITZ! TR-064 on :49443 needs node-fetch + rejectUnauthorized for self-signed certs.
 */
import nodeFetch from 'node-fetch'
import https from 'node:https'
import type { FritzBoxConnection } from '@/lib/fritzboxTr064'
import { tr064OriginsForConnection } from '@/lib/fritzboxTr064'

export function tr064NeedsInsecureAgent(conn: FritzBoxConnection): boolean {
  const httpsOrigin = tr064OriginsForConnection(conn).some((o) => o.startsWith('https:'))
  return httpsOrigin && conn.insecureTls
}

/** Run TR-064 calls with node-fetch so HTTPS agent (self-signed) is honored. */
export async function runWithTr064NodeFetch<T>(
  conn: FritzBoxConnection,
  fn: () => Promise<T>,
): Promise<T> {
  if (!tr064NeedsInsecureAgent(conn)) return fn()

  const agent = new https.Agent({ rejectUnauthorized: false })
  const prevFetch = globalThis.fetch
  globalThis.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
    const href =
      typeof url === 'string' ? url : url instanceof URL ? url.href : (url as Request).url
    const opts = { ...init, agent: href.startsWith('https:') ? agent : undefined }
    return nodeFetch(href, opts as Parameters<typeof nodeFetch>[1]) as unknown as Promise<Response>
  }) as typeof fetch

  try {
    return await fn()
  } finally {
    globalThis.fetch = prevFetch
  }
}
