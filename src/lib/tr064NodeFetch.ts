/**
 * digest-fetch uses global fetch (undici on Node 18+).
 * FRITZ! TR-064 on :49443 needs rejectUnauthorized for self-signed certs.
 */
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import type { FritzBoxConnection } from '@/lib/fritzboxTr064'
import { tr064OriginsForConnection } from '@/lib/fritzboxTr064'

export function tr064NeedsInsecureAgent(conn: FritzBoxConnection): boolean {
  const usesHttps = tr064OriginsForConnection(conn).some((o) => o.startsWith('https:'))
  return usesHttps && conn.insecureTls
}

/** Run TR-064 with TLS verification disabled for FRITZ! self-signed HTTPS. */
export async function runWithTr064NodeFetch<T>(
  conn: FritzBoxConnection,
  fn: () => Promise<T>,
): Promise<T> {
  if (!tr064NeedsInsecureAgent(conn)) return fn()

  const prev = getGlobalDispatcher()
  const insecure = new Agent({ connect: { rejectUnauthorized: false } })
  setGlobalDispatcher(insecure)
  try {
    return await fn()
  } finally {
    setGlobalDispatcher(prev)
  }
}
