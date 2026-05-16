import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { dataDir } from '@/lib/dataDir'
import { validateDashboardStatePersisted } from '@/lib/dashboardStatePayload'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 4_000_000

const configPath = () => join(dataDir(), 'dashboard.json')

/**
 * GET: read persisted dashboard state (written by PUT from the browser).
 * PUT: save state to disk under `SELFDASHBOARD_DATA_DIR` or `<cwd>/data` (Docker: map `/app/data` → same as Unraid template).
 */
export async function GET() {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!validateDashboardStatePersisted(parsed)) {
      return NextResponse.json({ error: 'invalid file contents' }, { status: 500 })
    }
    return NextResponse.json(parsed)
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: unknown }).code) : ''
    if (code === 'ENOENT') return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ error: 'read failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  let text: string
  try {
    text = await req.text()
  } catch {
    return NextResponse.json({ error: 'body read failed' }, { status: 400 })
  }
  if (text.length > MAX_BYTES) return NextResponse.json({ error: 'payload too large' }, { status: 413 })
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!validateDashboardStatePersisted(parsed)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
  const dir = dataDir()
  const file = configPath()
  const tmp = `${file}.tmp`
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(tmp, JSON.stringify(parsed), 'utf8')
    await rename(tmp, file)
  } catch {
    try {
      await writeFile(file, JSON.stringify(parsed), 'utf8')
    } catch {
      return NextResponse.json({ error: 'write failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true })
}
