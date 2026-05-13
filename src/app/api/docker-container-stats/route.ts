import { NextResponse } from 'next/server'
import { CONTAINER_ID_RE, fetchContainerStats, poolMap, type SdContainerStats } from '@/lib/dockerEngine'

export const dynamic = 'force-dynamic'

const MAX_IDS = 200
/** Higher than list+stats combined path: stats-only, no extra containers/json */
const STATS_CONCURRENCY = 12

/**
 * POST /api/docker-container-stats
 * Body: { "ids": ["<container id>", ...] }
 * Returns { stats: { [id]: SdContainerStats | null } } for one-shot CPU/RAM per running container.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    const raw = await req.text()
    body = raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body erwartet' }, { status: 400 })
  }

  const idsRaw = (body as { ids?: unknown }).ids
  if (!Array.isArray(idsRaw)) {
    return NextResponse.json({ error: 'ids muss ein Array sein' }, { status: 400 })
  }

  const ids = [...new Set(idsRaw.filter((x): x is string => typeof x === 'string' && CONTAINER_ID_RE.test(x.trim())))]
    .map((x) => x.trim())
    .slice(0, MAX_IDS)

  if (ids.length === 0) {
    return NextResponse.json({ stats: {} as Record<string, SdContainerStats | null> })
  }

  try {
    const statsArray = await poolMap(ids, STATS_CONCURRENCY, async (id) => ({ id, stats: await fetchContainerStats(id) }))
    const stats: Record<string, SdContainerStats | null> = {}
    for (const { id, stats: s } of statsArray) {
      stats[id] = s
    }
    return NextResponse.json({ stats })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/EACCES|permission denied/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Kein Zugriff auf den Docker-Socket (EACCES). Unter Unraid: Extra Parameter --group-add=281 (oder GID von stat -c %g /var/run/docker.sock).',
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
