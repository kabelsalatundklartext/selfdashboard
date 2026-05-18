import 'server-only'

import { appendErrorLog } from '@/lib/errorLog'

/** E-Mail nutzt dasselbe Protokoll wie Plugins (Einstellungen → Protokoll, Filter „mail“). */
export async function logMailEvent(
  operation: string,
  message: string,
  opts?: { level?: 'error' | 'warn' | 'info'; detail?: Record<string, unknown> },
): Promise<void> {
  try {
    await appendErrorLog({
      level: opts?.level ?? 'error',
      source: 'api',
      pluginId: 'mail',
      category: `mail/${operation}`,
      message,
      detail: opts?.detail ? JSON.stringify(opts.detail).slice(0, 4000) : undefined,
    })
  } catch {
    /* must not break handlers */
  }
}
