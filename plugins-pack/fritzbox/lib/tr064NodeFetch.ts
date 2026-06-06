import 'server-only'
import nodeFetch from 'node-fetch'
import DigestClient from 'digest-fetch'
import type { FritzBoxConnection } from './fritzboxTr064'
import { tr064OriginsForConnection } from './fritzTr064Shared'

export function tr064NeedsInsecureAgent(conn: FritzBoxConnection): boolean {
  const usesHttps = tr064OriginsForConnection(conn).some((o) => o.startsWith('https:'))
  return usesHttps && conn.insecureTls
}

/**
 * digest-fetch prefers the global (undici) fetch, which ignores the classic
 * `agent` option. Self-signed FRITZ! certs previously needed a process-global
 * NODE_TLS_REJECT_UNAUTHORIZED=0 toggle — a race that disabled TLS verification
 * for ALL concurrent outbound requests while a FRITZ! call was running.
 * Instead we pin digest-fetch to node-fetch, which honors the per-request
 * https.Agent({ rejectUnauthorized: false }) the TR-064 helpers already pass.
 */
export function createTr064DigestClient(user: string, pass: string): DigestClient {
  const client = new DigestClient(user || '', pass || '')
  ;(client as unknown as { getClient: () => Promise<unknown> }).getClient = async () => nodeFetch
  return client
}

/**
 * @deprecated TLS handling is scoped via per-request agents now (see
 * createTr064DigestClient) — this is a plain pass-through kept for callers.
 */
export async function runWithTr064NodeFetch<T>(
  _conn: FritzBoxConnection,
  fn: () => Promise<T>,
): Promise<T> {
  return fn()
}
