import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/guard'
import { userDashboardPath } from '@/lib/auth/paths'
import { filterDashboardStatePlugins } from '@/lib/auth/pluginPolicy'
import {
  validateDashboardStatePersisted,
  type DashboardStatePersisted,
} from '@/lib/dashboardStatePayload'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 4_000_000

/**
 * GET/PUT persisted dashboard state for the signed-in user only.
 */
export async function GET(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const file = userDashboardPath(auth.userId)
  try {
    const raw = await readFile(file, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!validateDashboardStatePersisted(parsed)) {
      return NextResponse.json({ error: 'invalid file contents' }, { status: 500 })
    }
    const filtered = filterDashboardStatePlugins(parsed, auth.userId, auth.role)
    return NextResponse.json(filtered)
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: unknown }).code) : ''
    if (code === 'ENOENT') return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ error: 'read failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
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
  const safe = filterDashboardStatePlugins(
    parsed as DashboardStatePersisted,
    auth.userId,
    auth.role,
  )
  const file = userDashboardPath(auth.userId)
  const tmp = `${file}.tmp`
  try {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(tmp, JSON.stringify(safe), 'utf8')
    await rename(tmp, file)
  } catch {
    try {
      await mkdir(dirname(file), { recursive: true })
      await writeFile(file, JSON.stringify(safe), 'utf8')
    } catch {
      return NextResponse.json({ error: 'write failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true })
}
