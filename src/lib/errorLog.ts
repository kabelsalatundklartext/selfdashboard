import { appendFile, mkdir, readFile, rename, writeFile } from 'fs/promises'
import { join } from 'path'
import { dataDir } from '@/lib/dataDir'
import {
  DEFAULT_LOG_SETTINGS,
  type LogEntry,
  type LogLevel,
  type LogRetentionDays,
  type LogSettings,
  type LogSource,
  isLogRetentionDays,
} from '@/lib/errorLogTypes'

const MAX_FILE_BYTES = 3_000_000
const MAX_FIELD = 4_000
const MAX_MESSAGE = 2_000

const logFilePath = () => join(dataDir(), 'error-log.jsonl')
const settingsPath = () => join(dataDir(), 'log-settings.json')

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function clampField(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

/** Redact obvious secrets from free-text detail. */
export function sanitizeLogText(raw: string): string {
  let s = raw
  s = s.replace(/("password"\s*:\s*)"[^"]*"/gi, '$1"[redacted]"')
  s = s.replace(/(password=)[^&\s]+/gi, '$1[redacted]')
  s = s.replace(/(Authorization:\s*Basic\s+)[A-Za-z0-9+/=]+/gi, '$1[redacted]')
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
  return s
}

export type AppendLogInput = {
  level: LogLevel
  source: LogSource
  category?: string
  message: string
  detail?: string
  pluginId?: string
  instanceId?: string
}

export async function readLogSettings(): Promise<LogSettings> {
  try {
    const raw = await readFile(settingsPath(), 'utf8')
    const parsed = JSON.parse(raw) as { retentionDays?: unknown }
    if (isLogRetentionDays(parsed.retentionDays)) {
      return { retentionDays: parsed.retentionDays }
    }
  } catch {
    /* missing or invalid */
  }
  return { ...DEFAULT_LOG_SETTINGS }
}

export async function writeLogSettings(settings: LogSettings): Promise<void> {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })
  const file = settingsPath()
  const tmp = `${file}.tmp`
  const body = JSON.stringify(settings)
  try {
    await writeFile(tmp, body, 'utf8')
    await rename(tmp, file)
  } catch {
    await writeFile(file, body, 'utf8')
  }
}

function retentionCutoff(days: LogRetentionDays): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function parseLine(line: string): LogEntry | null {
  const t = line.trim()
  if (!t) return null
  try {
    const o = JSON.parse(t) as LogEntry
    if (typeof o.id !== 'string' || typeof o.ts !== 'string' || typeof o.message !== 'string') return null
    return o
  } catch {
    return null
  }
}

async function readAllEntries(): Promise<LogEntry[]> {
  try {
    const raw = await readFile(logFilePath(), 'utf8')
    const lines = raw.split('\n')
    const out: LogEntry[] = []
    for (const line of lines) {
      const e = parseLine(line)
      if (e) out.push(e)
    }
    return out
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: unknown }).code) : ''
    if (code === 'ENOENT') return []
    throw e
  }
}

async function writeAllEntries(entries: LogEntry[]): Promise<void> {
  const dir = dataDir()
  await mkdir(dir, { recursive: true })
  const file = logFilePath()
  const body = entries.length ? `${entries.map((e) => JSON.stringify(e)).join('\n')}\n` : ''
  const tmp = `${file}.tmp`
  try {
    await writeFile(tmp, body, 'utf8')
    await rename(tmp, file)
  } catch {
    await writeFile(file, body, 'utf8')
  }
}

export async function purgeExpiredLogs(retentionDays?: LogRetentionDays): Promise<number> {
  const days = retentionDays ?? (await readLogSettings()).retentionDays
  const cutoff = retentionCutoff(days)
  const all = await readAllEntries()
  const kept = all.filter((e) => {
    const t = Date.parse(e.ts)
    return Number.isFinite(t) && t >= cutoff
  })
  if (kept.length === all.length) return 0
  await writeAllEntries(kept)
  return all.length - kept.length
}

async function trimOversizedFile(): Promise<void> {
  try {
    const raw = await readFile(logFilePath(), 'utf8')
    if (Buffer.byteLength(raw, 'utf8') <= MAX_FILE_BYTES) return
    const entries = await readAllEntries()
    const drop = Math.max(1, Math.floor(entries.length * 0.25))
    await writeAllEntries(entries.slice(drop))
  } catch {
    /* ignore */
  }
}

export async function appendErrorLog(input: AppendLogInput): Promise<LogEntry> {
  const settings = await readLogSettings()
  await purgeExpiredLogs(settings.retentionDays)

  const entry: LogEntry = {
    id: newId(),
    ts: new Date().toISOString(),
    level: input.level,
    source: input.source,
    category: input.category ? clampField(input.category, 120) : undefined,
    message: clampField(sanitizeLogText(input.message), MAX_MESSAGE),
    detail: input.detail ? clampField(sanitizeLogText(input.detail), MAX_FIELD) : undefined,
    pluginId: input.pluginId ? clampField(input.pluginId, 80) : undefined,
    instanceId: input.instanceId ? clampField(input.instanceId, 120) : undefined,
  }

  const dir = dataDir()
  await mkdir(dir, { recursive: true })
  await appendFile(logFilePath(), `${JSON.stringify(entry)}\n`, 'utf8')
  await trimOversizedFile()
  return entry
}

export async function listErrorLogs(opts?: {
  limit?: number
  level?: LogLevel
  source?: LogSource
  pluginId?: string
  q?: string
}): Promise<LogEntry[]> {
  const settings = await readLogSettings()
  await purgeExpiredLogs(settings.retentionDays)
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 200))
  let entries = await readAllEntries()
  if (opts?.level) entries = entries.filter((e) => e.level === opts.level)
  if (opts?.source) entries = entries.filter((e) => e.source === opts.source)
  if (opts?.pluginId?.trim()) {
    const pid = opts.pluginId.trim().toLowerCase()
    entries = entries.filter((e) => e.pluginId?.toLowerCase().includes(pid))
  }
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase()
    entries = entries.filter(
      (e) =>
        e.message.toLowerCase().includes(q) ||
        (e.detail?.toLowerCase().includes(q) ?? false) ||
        (e.category?.toLowerCase().includes(q) ?? false),
    )
  }
  entries.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
  return entries.slice(0, limit)
}

export async function clearErrorLogs(): Promise<void> {
  await writeAllEntries([])
}

export function formatLogsAsText(entries: LogEntry[]): string {
  const lines = entries.map((e) => {
    const parts = [
      e.ts,
      e.level.toUpperCase(),
      e.source,
      e.category ?? '',
      e.pluginId ? `plugin=${e.pluginId}` : '',
      e.instanceId ? `instance=${e.instanceId}` : '',
      e.message,
    ].filter(Boolean)
    const head = parts.join(' · ')
    return e.detail ? `${head}\n  ${e.detail}` : head
  })
  return `${lines.join('\n')}\n`
}

export async function exportLogsJsonl(): Promise<string> {
  const settings = await readLogSettings()
  await purgeExpiredLogs(settings.retentionDays)
  try {
    return await readFile(logFilePath(), 'utf8')
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: unknown }).code) : ''
    if (code === 'ENOENT') return ''
    throw e
  }
}

/** Log API route failures (no passwords in detail). */
export async function logApiFailure(
  category: string,
  message: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await appendErrorLog({
      level: 'error',
      source: 'api',
      category,
      message,
      detail: detail ? sanitizeLogText(JSON.stringify(detail)) : undefined,
    })
  } catch {
    /* logging must not break handlers */
  }
}
