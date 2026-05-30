import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { dataDir } from './data-dir'

const logFilePath = () => join(dataDir(), 'error-log.jsonl')

export async function appendErrorLog(entry: {
  source: string
  level?: string
  message: string
  detail?: Record<string, unknown>
}): Promise<void> {
  const line = JSON.stringify({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    source: entry.source,
    level: entry.level ?? 'error',
    message: entry.message.slice(0, 2000),
    detail: entry.detail,
  })
  const file = logFilePath()
  await mkdir(dataDir(), { recursive: true })
  await appendFile(file, `${line}\n`, 'utf8')
}
