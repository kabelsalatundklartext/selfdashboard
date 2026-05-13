import { NextResponse } from 'next/server'
import * as http from 'node:http'

export const dynamic = 'force-dynamic'

function socketPath(): string {
  return process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
}

function dockerRequest(
  method: 'GET' | 'POST',
  pathAndQuery: string,
  body?: string,
  timeoutMs = 12_000,
): Promise<{ ok: boolean; status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = body ?? ''
    const headers: http.OutgoingHttpHeaders = {
      Host: 'localhost',
      Accept: 'application/json',
    }
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(payload, 'utf8')
    }
    const req = http.request(
      {
        socketPath: socketPath(),
        path: pathAndQuery,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: string | Buffer) => {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        })
        res.on('end', () => {
          const resBody = Buffer.concat(chunks).toString('utf8')
          const code = res.statusCode ?? 500
          resolve({ ok: code >= 200 && code < 300, status: code, body: resBody })
        })
      },
    )
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      reject(new Error('Timeout beim Docker-Socket'))
    })
    if (payload) req.write(payload, 'utf8')
    req.end()
  })
}

function dockerGet(pathAndQuery: string): Promise<{ ok: boolean; status: number; body: string }> {
  return dockerRequest('GET', pathAndQuery, undefined, 12_000)
}

const CONTAINER_ID_RE = /^[a-f0-9]{8,64}$/i

/** Merged into each container when GET ?stats=1 */
export type SdContainerStats = {
  cpuPct: number | null
  memUsageBytes: number | null
  memLimitBytes: number | null
  memPct: number | null
}

const STATS_ONE_SHOT_TIMEOUT_MS = 6000

function parseOneShotStats(body: string): SdContainerStats | null {
  let j: Record<string, unknown>
  try {
    j = JSON.parse(body) as Record<string, unknown>
  } catch {
    return null
  }

  const ms = j.memory_stats as Record<string, unknown> | undefined
  const usageRaw = ms?.usage
  const limitRaw = ms?.limit
  const memUsageBytes = typeof usageRaw === 'number' && Number.isFinite(usageRaw) && usageRaw >= 0 ? usageRaw : null
  const memLimitBytes = typeof limitRaw === 'number' && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null
  const memPct =
    memUsageBytes != null && memLimitBytes != null && memLimitBytes > 0
      ? Math.min(100, (memUsageBytes / memLimitBytes) * 100)
      : null

  const cpu_stats = j.cpu_stats as Record<string, unknown> | undefined
  const precpu_stats = j.precpu_stats as Record<string, unknown> | undefined

  const cpuUsage = (x: Record<string, unknown> | undefined) => (x?.cpu_usage as { total_usage?: number; percpu_usage?: unknown[] } | undefined) ?? undefined
  const total = (u: ReturnType<typeof cpuUsage>) => (typeof u?.total_usage === 'number' ? u.total_usage : 0)
  const ncpusFrom = (cs: Record<string, unknown> | undefined): number => {
    const n = Number(cs?.online_cpus)
    if (Number.isFinite(n) && n > 0) return n
    const per = cpuUsage(cs)?.percpu_usage
    return Array.isArray(per) && per.length > 0 ? per.length : 1
  }

  let cpuPct: number | null = null
  if (cpu_stats && precpu_stats && Object.keys(precpu_stats).length > 0) {
    const cpuDelta = total(cpuUsage(cpu_stats)) - total(cpuUsage(precpu_stats))
    const sysDelta = (Number(cpu_stats.system_cpu_usage) || 0) - (Number(precpu_stats.system_cpu_usage) || 0)
    const ncpus = ncpusFrom(cpu_stats)
    if (sysDelta > 0 && cpuDelta > 0 && ncpus > 0) {
      const p = (cpuDelta / sysDelta) * ncpus * 100
      if (Number.isFinite(p)) cpuPct = Math.min(9999, Math.max(0, p))
    }
  }

  return { cpuPct, memUsageBytes, memLimitBytes, memPct }
}

async function fetchContainerStats(id: string): Promise<SdContainerStats | null> {
  try {
    const r = await dockerRequest(
      'GET',
      `/containers/${encodeURIComponent(id)}/stats?stream=false`,
      undefined,
      STATS_ONE_SHOT_TIMEOUT_MS,
    )
    if (!r.ok) return null
    return parseOneShotStats(r.body)
  } catch {
    return null
  }
}

async function poolMap<T, R>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  const nWorkers = Math.max(1, Math.min(concurrency, items.length || 1))
  const workers = Array.from({ length: items.length === 0 ? 0 : nWorkers }, async () => {
    while (true) {
      const idx = nextIndex++
      if (idx >= items.length) break
      results[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return results
}

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
