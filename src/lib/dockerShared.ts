/**
 * Docker-related constants/types safe for **client** bundles (no `node:*` imports).
 * Server-only socket logic lives in `dockerEngine.ts`.
 */

/** Docker container IDs are typically 12–64 hex chars */
export const CONTAINER_ID_RE = /^[a-f0-9]{8,128}$/i

/** Merged into each container when stats are loaded */
export type SdContainerStats = {
  cpuPct: number | null
  memUsageBytes: number | null
  memLimitBytes: number | null
  memPct: number | null
}
