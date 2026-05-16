export type LogLevel = 'error' | 'warn' | 'info'
export type LogSource = 'app' | 'plugin' | 'api'

export type LogRetentionDays = 3 | 7 | 30

export type LogEntry = {
  id: string
  ts: string
  level: LogLevel
  source: LogSource
  category?: string
  message: string
  detail?: string
  pluginId?: string
  instanceId?: string
}

export type LogSettings = {
  retentionDays: LogRetentionDays
}

export const DEFAULT_LOG_SETTINGS: LogSettings = { retentionDays: 7 }

export function isLogRetentionDays(n: unknown): n is LogRetentionDays {
  return n === 3 || n === 7 || n === 30
}

export function isLogLevel(v: unknown): v is LogLevel {
  return v === 'error' || v === 'warn' || v === 'info'
}

export function isLogSource(v: unknown): v is LogSource {
  return v === 'app' || v === 'plugin' || v === 'api'
}
