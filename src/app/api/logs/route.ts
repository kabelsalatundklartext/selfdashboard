import { NextResponse } from 'next/server'
import {
  appendErrorLog,
  clearErrorLogs,
  listErrorLogs,
  purgeExpiredLogs,
} from '@/lib/errorLog'
import { isLogLevel, isLogSource, type LogLevel, type LogSource } from '@/lib/errorLogTypes'

export const dynamic = 'force-dynamic'

const MAX_BODY = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

/** GET: recent log entries. POST: append client/plugin log. DELETE: clear all logs. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') || 300)
  const levelParam = url.searchParams.get('level')
  const sourceParam = url.searchParams.get('source')
  const level: LogLevel | undefined =
    levelParam && isLogLevel(levelParam) ? levelParam : undefined
  const source: LogSource | undefined =
    sourceParam && isLogSource(sourceParam) ? sourceParam : undefined
  const pluginId = url.searchParams.get('pluginId') ?? undefined
  const q = url.searchParams.get('q') ?? undefined
  try {
    const entries = await listErrorLogs({ limit, level, source, pluginId, q })
    return NextResponse.json({ ok: true, entries })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'body_too_large' }, { status: 413 })
  }
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const levelRaw = body.level
  const sourceRaw = body.source
  const level = isLogLevel(levelRaw) ? levelRaw : 'error'
  const source = isLogSource(sourceRaw) ? sourceRaw : 'plugin'

  const message = clampStr(body.message, 2000)
  if (!message) {
    return NextResponse.json({ ok: false, error: 'missing_message' }, { status: 400 })
  }

  try {
    const entry = await appendErrorLog({
      level,
      source,
      category: clampStr(body.category, 120) || undefined,
      message,
      detail: clampStr(body.detail, 4000) || undefined,
      pluginId: clampStr(body.pluginId, 80) || undefined,
      instanceId: clampStr(body.instanceId, 120) || undefined,
    })
    return NextResponse.json({ ok: true, entry })
  } catch {
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await clearErrorLogs()
    await purgeExpiredLogs()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'clear_failed' }, { status: 500 })
  }
}
