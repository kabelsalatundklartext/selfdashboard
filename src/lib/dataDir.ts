import { join } from 'path'

/** Persistent data directory (`SELFDASHBOARD_DATA_DIR` or `<cwd>/data`). */
export function dataDir(): string {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim()
  if (raw) return raw
  return join(process.cwd(), 'data')
}
