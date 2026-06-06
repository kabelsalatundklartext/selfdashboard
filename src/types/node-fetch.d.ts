/**
 * Minimal typing for node-fetch v2 — it is only handed to digest-fetch as a
 * fetch implementation (so the per-request `agent` option is honored).
 */
declare module 'node-fetch' {
  const nodeFetch: (url: string, init?: Record<string, unknown>) => Promise<unknown>
  export default nodeFetch
}
