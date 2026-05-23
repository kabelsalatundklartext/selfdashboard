import { NextResponse } from 'next/server'
import { exportLogsJsonl, formatLogsAsText, listErrorLogs } from '@/lib/errorLog'
import { requireAdmin } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const url = new URL(req.url)
  const format = url.searchParams.get('format') === 'txt' ? 'txt' : 'jsonl'
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

  try {
    if (format === 'jsonl') {
      const body = await exportLogsJsonl()
      return new NextResponse(body || '', {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Content-Disposition': `attachment; filename="selfdashboard-logs-${stamp}.jsonl"`,
        },
      })
    }
    const entries = await listErrorLogs({ limit: 500 })
    const text = formatLogsAsText(entries)
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="selfdashboard-logs-${stamp}.txt"`,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'export_failed' }, { status: 500 })
  }
}
