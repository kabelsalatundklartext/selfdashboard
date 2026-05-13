import * as http from 'node:http'

/** Docker-Container-IDs sind typisch 12–64 Hex-Zeichen; etwas Spielraum für künftige Längen */
export const CONTAINER_ID_RE = /^[a-f0-9]{8,128}$/i

export function socketPath(): string {
  return process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
}

export function dockerRequest(
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

export function dockerGet(pathAndQuery: string): Promise<{ ok: boolean; status: number; body: string }> {
  return dockerRequest('GET', pathAndQuery, undefined, 12_000)
}

/** Merged into each container when stats are loaded */
export type SdContainerStats = {
  cpuPct: number | null
  memUsageBytes: number | null
  memLimitBytes: number | null
  memPct: number | null
}

const STATS_ONE_SHOT_TIMEOUT_MS = 6000

export function parseOneShotStats(body: string): SdContainerStats | null {
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

  const cpuUsage = (x: Record<string, unknown> | undefined) =>
    (x?.cpu_usage as { total_usage?: number; percpu_usage?: unknown[] } | undefined) ?? undefined
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

export async function fetchContainerStats(id: string): Promise<SdContainerStats | null> {
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

export async function poolMap<T, R>(items: readonly T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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
