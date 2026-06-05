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
import { stripRemovedPlugins } from '@/lib/removedPlugins'
import { sealDashboardSecrets } from '@/lib/widgetSecrets'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 4_000_000

async function writeStateAtomic(file: string, state: DashboardStatePersisted): Promise<void> {
  const tmp = `${file}.tmp`
  await mkdir(dirname(file), { recursive: true })
  try {
    await writeFile(tmp, JSON.stringify(state), 'utf8')
    await rename(tmp, file)
  } catch {
    await writeFile(file, JSON.stringify(state), 'utf8')
  }
}

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
    // Upgrade legacy plaintext widget secrets on read: seal + persist once.
    const sealed = sealDashboardSecrets(parsed)
    if (sealed.changed) {
      try {
        await writeStateAtomic(file, sealed.state)
      } catch {
        /* keep serving the sealed copy even if the rewrite fails */
      }
    }
    const filtered = filterDashboardStatePlugins(sealed.state, auth.userId, auth.role)
    return NextResponse.json({
      ...filtered,
      dashboards: stripRemovedPlugins(filtered.dashboards),
    })
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
  const cleaned: DashboardStatePersisted = sealDashboardSecrets({
    ...safe,
    dashboards: stripRemovedPlugins(safe.dashboards),
  }).state
  const file = userDashboardPath(auth.userId)
  try {
    await writeStateAtomic(file, cleaned)
  } catch {
    return NextResponse.json({ error: 'write failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
