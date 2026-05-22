import * as http from 'node:http'
import type { SdContainerStats } from './dockerShared'

export { CONTAINER_ID_RE } from './dockerShared'
export type { SdContainerStats } from './dockerShared'

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

const STATS_ONE_SHOT_TIMEOUT_MS = 6000

/** Nanoseconds — deltas shorter than this often produce misleading CPU % (noise / same-tick samples). */
const MIN_SYSTEM_CPU_DELTA_NS = BigInt(10_000_000)

/**
 * Docker stats JSON uses uint64 for `system_cpu_usage` and `cpu_usage.total_usage`.
 * Values often exceed `Number.MAX_SAFE_INTEGER` on long-running hosts; `JSON.parse`
 * rounds them and CPU deltas become garbage. Quote digits + revive as BigInt (same idea as json-bigint).
 */
function parseDockerStatsJson(body: string): Record<string, unknown> | null {
  try {
    const patched = body
      .replace(/"system_cpu_usage"\s*:\s*(\d+)/g, '"system_cpu_usage":"$1"')
      .replace(/"total_usage"\s*:\s*(\d+)/g, '"total_usage":"$1"')
    return JSON.parse(patched, (key, val) => {
      if (
        (key === 'system_cpu_usage' || key === 'total_usage') &&
        typeof val === 'string' &&
        /^\d+$/.test(val)
      ) {
        return BigInt(val)
      }
      return val
    }) as Record<string, unknown>
  } catch {
    return null
  }
}

function toBigU(v: unknown): bigint {
  const zero = BigInt(0)
  if (typeof v === 'bigint') return v >= zero ? v : zero
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return BigInt(Math.trunc(v))
  if (typeof v === 'string' && /^\d+$/.test(v)) return BigInt(v)
  return zero
}

/**
 * Same idea as Docker CLI `calculateMemUsageUnixNoCache` (cli/command/container/stats_helpers.go):
 * subtract page cache so RAM matches `docker stats` / most UIs (cAdvisor-style), not raw cgroup `usage`.
 */
function memoryUsageBytesNoCache(mem: Record<string, unknown> | undefined): { usage: number; limit: number | null } | null {
  if (!mem) return null
  const usageRaw = mem.usage
  const limitRaw = mem.limit
  const usageTotal = typeof usageRaw === 'number' && Number.isFinite(usageRaw) && usageRaw >= 0 ? usageRaw : null
  if (usageTotal == null) return null
  const memLimitBytes = typeof limitRaw === 'number' && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null

  const statsRaw = mem.stats
  let memUsageBytes = usageTotal
  if (statsRaw && typeof statsRaw === 'object') {
    const st = statsRaw as Record<string, unknown>
    const num = (k: string): number | null => {
      const v = st[k]
      return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
    }
    const tif = num('total_inactive_file')
    if (tif != null && tif < usageTotal) memUsageBytes = usageTotal - tif
    else {
      const inactiveFile = num('inactive_file')
      if (inactiveFile != null && inactiveFile < usageTotal) memUsageBytes = usageTotal - inactiveFile
    }
  }

  return { usage: memUsageBytes, limit: memLimitBytes }
}

export function parseOneShotStats(body: string): SdContainerStats | null {
  const j = parseDockerStatsJson(body)
  if (!j) return null

  const ms = j.memory_stats as Record<string, unknown> | undefined
  const memParsed = memoryUsageBytesNoCache(ms)
  const memUsageBytes = memParsed ? memParsed.usage : null
  const memLimitBytes = memParsed?.limit ?? null
  const memPct =
    memUsageBytes != null && memLimitBytes != null && memLimitBytes > 0
      ? Math.min(100, (memUsageBytes / memLimitBytes) * 100)
      : null

  const cpu_stats = j.cpu_stats as Record<string, unknown> | undefined
  const precpu_stats = j.precpu_stats as Record<string, unknown> | undefined

  const cpuUsage = (x: Record<string, unknown> | undefined) =>
    (x?.cpu_usage as { total_usage?: unknown; percpu_usage?: unknown[] } | undefined) ?? undefined
  const totalUsage = (u: ReturnType<typeof cpuUsage>) => toBigU(u?.total_usage)
  const ncpusFrom = (cs: Record<string, unknown> | undefined): number => {
    const n = Number(cs?.online_cpus)
    if (Number.isFinite(n) && n > 0) return n
    const per = cpuUsage(cs)?.percpu_usage
    return Array.isArray(per) && per.length > 0 ? per.length : 1
  }

  let cpuPct: number | null = null
  if (cpu_stats && precpu_stats && Object.keys(precpu_stats).length > 0) {
    const cpuDelta = totalUsage(cpuUsage(cpu_stats)) - totalUsage(cpuUsage(precpu_stats))
    const sysDelta = toBigU(cpu_stats.system_cpu_usage) - toBigU(precpu_stats.system_cpu_usage)
    const ncpus = ncpusFrom(cpu_stats)
    if (sysDelta >= MIN_SYSTEM_CPU_DELTA_NS && cpuDelta > BigInt(0) && ncpus > 0) {
      const pRaw = (cpuDelta * BigInt(ncpus) * BigInt(100)) / sysDelta
      const p = Number(pRaw)
      if (Number.isFinite(p)) cpuPct = Math.min(9999, Math.max(0, p))
    }
  }

  return { cpuPct, memUsageBytes, memLimitBytes, memPct }
}

export async function fetchContainerStats(id: string): Promise<SdContainerStats | null> {
  try {
    const pathPrimed = `/containers/${encodeURIComponent(id)}/stats?stream=false&one-shot=false`
    const pathLegacy = `/containers/${encodeURIComponent(id)}/stats?stream=false`
    let r = await dockerRequest('GET', pathPrimed, undefined, STATS_ONE_SHOT_TIMEOUT_MS)
    if (!r.ok && r.status === 400) {
      r = await dockerRequest('GET', pathLegacy, undefined, STATS_ONE_SHOT_TIMEOUT_MS)
    }
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
