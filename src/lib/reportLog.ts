import type { LogLevel, LogSource } from '@/lib/errorLogTypes'

export type ClientLogInput = {
  level?: LogLevel
  source?: LogSource
  category?: string
  message: string
  detail?: string
  pluginId?: string
  instanceId?: string
}

/** Send a log line to the server (browser / plugin widgets). Fire-and-forget. */
export function reportClientLog(input: ClientLogInput): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({
    level: input.level ?? 'error',
    source: input.source ?? 'plugin',
    category: input.category,
    message: input.message,
    detail: input.detail,
    pluginId: input.pluginId,
    instanceId: input.instanceId,
  })
  void fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {})
}
