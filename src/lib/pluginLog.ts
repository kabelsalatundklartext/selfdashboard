import { appendErrorLog } from '@/lib/errorLog'
import type { LogLevel } from '@/lib/errorLogTypes'
import { reportClientLog } from '@/lib/reportLog'

/** Human-readable detail for log storage (no passwords). */
export function formatErrorDetail(e: unknown): string | undefined {
  if (e instanceof Error) {
    const stack = e.stack?.trim()
    if (stack) return stack.slice(0, 2000)
    return e.message || undefined
  }
  if (typeof e === 'string' && e.trim()) return e.trim().slice(0, 2000)
  if (e != null) {
    try {
      return JSON.stringify(e).slice(0, 2000)
    } catch {
      return String(e).slice(0, 2000)
    }
  }
  return undefined
}

export type PluginLogOptions = {
  category?: string
  level?: LogLevel
  detail?: string
  instanceId?: string
}

/** Browser / plugin widget → server log (Settings → Protokoll). */
export function reportPluginError(
  pluginId: string,
  message: string,
  opts?: PluginLogOptions,
): void {
  reportClientLog({
    pluginId,
    source: 'plugin',
    level: opts?.level ?? 'error',
    category: opts?.category ?? 'widget',
    message,
    detail: opts?.detail,
    instanceId: opts?.instanceId,
  })
}

/** Log widget failure from catch — message + optional Error detail. */
export function reportPluginCatch(pluginId: string, e: unknown, category = 'widget'): void {
  const message = e instanceof Error ? e.message : String(e)
  reportPluginError(pluginId, message || 'Unknown error', {
    category,
    detail: formatErrorDetail(e),
  })
}

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
