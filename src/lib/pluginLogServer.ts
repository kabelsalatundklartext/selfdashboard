import 'server-only'

import { appendErrorLog } from '@/lib/errorLog'

/** API route / server-side plugin backend failure. */
export async function logPluginApiFailure(
  pluginId: string,
  operation: string,
  message: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await appendErrorLog({
      level: 'error',
      source: 'api',
      pluginId,
      category: `${pluginId}/${operation}`,
      message,
      detail: detail ? JSON.stringify(detail).slice(0, 4000) : undefined,
    })
  } catch {
    /* must not break handlers */
  }
}
