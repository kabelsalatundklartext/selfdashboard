import { NextResponse } from 'next/server'
import { purgeExpiredLogs, readLogSettings, writeLogSettings } from '@/lib/errorLog'
import { isLogRetentionDays, type LogRetentionDays } from '@/lib/errorLogTypes'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await readLogSettings()
    return NextResponse.json({ ok: true, ...settings })
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  if (!isLogRetentionDays(body.retentionDays)) {
    return NextResponse.json({ ok: false, error: 'invalid_retention' }, { status: 400 })
  }
  const retentionDays = body.retentionDays as LogRetentionDays
  try {
    await writeLogSettings({ retentionDays })
    const removed = await purgeExpiredLogs(retentionDays)
    return NextResponse.json({ ok: true, retentionDays, purged: removed })
  } catch {
    return NextResponse.json({ ok: false, error: 'write_failed' }, { status: 500 })
  }
}
