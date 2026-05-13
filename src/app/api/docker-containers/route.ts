import { NextResponse } from 'next/server'
import {
  CONTAINER_ID_RE,
  dockerGet,
  dockerRequest,
  fetchContainerStats,
  poolMap,
  type SdContainerStats,
} from '@/lib/dockerEngine'

export const dynamic = 'force-dynamic'

export type { SdContainerStats }

function parseContainerAction(body: unknown): { id: string; action: 'start' | 'stop' | 'restart' } | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const action = o.action
  if (!CONTAINER_ID_RE.test(id)) return null
  if (action !== 'start' && action !== 'stop' && action !== 'restart') return null
  return { id, action }
}

/**
 * GET /api/docker-containers?all=0|1&stats=0|1
 * Liefert JSON von GET /containers/json. Mit stats=1 zusätzlich pro Eintrag sdStats (CPU/RAM) für laufende Container.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1' ? 'true' : 'false'
  const includeStats = searchParams.get('stats') === '1'
  try {
    const r = await dockerGet(`/containers/json?all=${all}`)
    if (!r.ok) {
      return NextResponse.json(
        { error: r.body?.slice(0, 400) || `Docker HTTP ${r.status}` },
        { status: r.status >= 400 && r.status < 600 ? r.status : 502 },
      )
    }
    let data: unknown
    try {
      data = JSON.parse(r.body) as unknown
    } catch {
      return NextResponse.json({ error: 'Ungültige JSON-Antwort von Docker' }, { status: 502 })
    }

    if (includeStats && Array.isArray(data)) {
      const arr = data as Record<string, unknown>[]
      const runningIds: string[] = []
      for (const c of arr) {
        const id = typeof c.Id === 'string' ? c.Id : ''
        if (c.State === 'running' && CONTAINER_ID_RE.test(id)) runningIds.push(id)
      }
      const unique = [...new Set(runningIds)]
      const statsArray = await poolMap(unique, 8, async (id) => ({ id, stats: await fetchContainerStats(id) }))
      const byId = new Map(statsArray.map((x) => [x.id, x.stats]))
      for (const c of arr) {
        const id = typeof c.Id === 'string' ? c.Id : ''
        if (c.State === 'running' && CONTAINER_ID_RE.test(id)) {
          c.sdStats = byId.get(id) ?? null
        } else {
          c.sdStats = null
        }
      }
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/EACCES|permission denied/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Kein Zugriff auf den Docker-Socket (EACCES). Unter Unraid: Extra Parameter --group-add=281 (oder GID von stat -c %g /var/run/docker.sock). Neuere Images laufen als root und umgehen das oft automatisch.',
        },
        { status: 503 },
      )
    }
    const hint =
      msg.includes('ENOENT') || msg.includes('ENOTDIR')
        ? 'Docker-Socket nicht gefunden — z. B. -v /var/run/docker.sock:/var/run/docker.sock am SelfDashboard-Container.'
        : msg
    return NextResponse.json({ error: hint }, { status: 503 })
  }
}

/**
 * POST /api/docker-containers
 * Body: { "id": "<container id>", "action": "start" | "stop" | "restart" }
 * Ruft die Docker Engine API auf (POST /containers/{id}/…).
 */
export async function POST(req: Request) {
  let parsed: { id: string; action: 'start' | 'stop' | 'restart' }
  try {
    const raw = await req.text()
    let body: unknown
    try {
      body = raw ? (JSON.parse(raw) as unknown) : null
    } catch {
      return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
    }
    const p = parseContainerAction(body)
    if (!p) {
      return NextResponse.json({ error: 'Ungültige Parameter (id, action)' }, { status: 400 })
    }
    parsed = p
  } catch {
    return NextResponse.json({ error: 'Body konnte nicht gelesen werden' }, { status: 400 })
  }

  const path =
    parsed.action === 'start'
      ? `/containers/${encodeURIComponent(parsed.id)}/start`
      : parsed.action === 'stop'
        ? `/containers/${encodeURIComponent(parsed.id)}/stop?t=10`
        : `/containers/${encodeURIComponent(parsed.id)}/restart?t=10`

  try {
    const r = await dockerRequest('POST', path, '', 60_000)
    if (!r.ok) {
      let msg = r.body?.slice(0, 500) || `Docker HTTP ${r.status}`
      try {
        const j = JSON.parse(r.body) as { message?: string }
        if (typeof j.message === 'string' && j.message.trim()) msg = j.message.trim()
      } catch {
        /* use slice */
      }
      const status = r.status >= 400 && r.status < 600 ? r.status : 502
      return NextResponse.json({ error: msg }, { status })
    }
    return NextResponse.json({ ok: true, action: parsed.action, id: parsed.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/EACCES|permission denied/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Kein Zugriff auf den Docker-Socket (EACCES). Unter Unraid: Extra Parameter --group-add=281 (oder GID von stat -c %g /var/run/docker.sock). Neuere Images laufen als root und umgehen das oft automatisch.',
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
