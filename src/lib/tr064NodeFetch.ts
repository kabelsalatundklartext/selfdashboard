import 'server-only'
import type { FritzBoxConnection } from '@/lib/fritzboxTr064'
import { tr064OriginsForConnection } from '@/lib/fritzTr064Shared'

export function tr064NeedsInsecureAgent(conn: FritzBoxConnection): boolean {
  const usesHttps = tr064OriginsForConnection(conn).some((o) => o.startsWith('https:'))
  return usesHttps && conn.insecureTls
}

/**
 * digest-fetch uses global fetch; for FRITZ! HTTPS :49443 with self-signed certs
 * temporarily disable TLS verification (only while fn runs, server-side only).
 */
export async function runWithTr064NodeFetch<T>(
  conn: FritzBoxConnection,
  fn: () => Promise<T>,
): Promise<T> {
  if (!tr064NeedsInsecureAgent(conn)) return fn()

  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  try {
    return await fn()
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev
  }
}
