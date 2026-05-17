import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

/** 7 days — must be a multiple of 1h per AdGuard API */
const STATS_RECENT_MS = 7 * 24 * 60 * 60 * 1000

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

function finalizeBaseUrl(u: URL): string {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let path = u.pathname.replace(/\/+$/, '') || ''
  if (path.endsWith('/control')) {
    path = path.slice(0, -'/control'.length) || '/'
    u.pathname = path
  }
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

function normalizeBase(raw: string): string {
  return finalizeBaseUrl(parseBase(raw))
}

function controlEndpoint(base: string, controlPath: string): string {
  const path = controlPath.replace(/^\//, '')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return new URL(path, prefix).toString()
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = await fetch(url, { method: 'GET', headers, cache: 'no-store', signal })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json, text }
}

async function fetchJsonPost(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const h = { ...headers, 'Content-Type': 'application/json' }
  const res = await fetch(url, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body),
    cache: 'no-store',
    signal,
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json, text }
}

function isStatsObject(j: unknown): j is Record<string, unknown> {
  return j != null && typeof j === 'object' && !Array.isArray(j)
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function seriesOrScalar(stats: Record<string, unknown>, numKey: string, seriesKey: string): number {
  const s = stats[seriesKey]
  if (Array.isArray(s) && s.length > 0) {
    return s.reduce((acc: number, x: unknown) => acc + (Number(x) || 0), 0)
  }
  const n = stats[numKey]
  if (typeof n === 'number' && Number.isFinite(n)) return n
  return 0
}

function dnsMetric(stats: Record<string, unknown>): number {
  return Math.round(seriesOrScalar(stats, 'num_dns_queries', 'dns_queries'))
}

function blockedMetric(stats: Record<string, unknown>): number {
  return Math.round(
    seriesOrScalar(stats, 'num_blocked_filtering', 'blocked_filtering') +
      seriesOrScalar(stats, 'num_replaced_safebrowsing', 'replaced_safebrowsing') +
      seriesOrScalar(stats, 'num_replaced_parental', 'replaced_parental') +
      seriesOrScalar(stats, 'num_replaced_safesearch', 'replaced_safesearch') +
      num(stats.blocked_threat) +
      num(stats.blocked_malware) +
      num(stats.blocked_ad),
  )
}

function statsTotals(j: Record<string, unknown>): { q: number; b: number } {
  return { q: dnsMetric(j), b: blockedMetric(j) }
}

async function fetchStatsBundle(
  base: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<{ stats: Record<string, unknown>; tried: string } | { error: string; status: number; detail: string }> {
  const candidates = [
    `${controlEndpoint(base, 'control/stats')}?recent=${STATS_RECENT_MS}`,
    controlEndpoint(base, 'control/stats'),
  ]

  let last: { ok: boolean; status: number; json: unknown; text: string } | null = null
  for (const url of candidates) {
    const r = await fetchJson(url, headers, signal)
    last = r
    if (!r.ok) continue
    if (!isStatsObject(r.json)) {
      return { error: 'invalid_stats', status: 502, detail: r.text.slice(0, 200) }
    }
    const { q, b } = statsTotals(r.json)
    const isLast = url === candidates[candidates.length - 1]
    if (q > 0 || b > 0 || isLast) {
      return { stats: r.json, tried: url }
    }
  }

  if (last && !last.ok) {
    const detail =
      isStatsObject(last.json) && 'message' in last.json
        ? String((last.json as { message?: string }).message ?? '')
        : last.text.slice(0, 240)
    return {
      error: 'stats_failed',
      status: last.status,
      detail: detail || last.text.slice(0, 240),
    }
  }

  if (last && isStatsObject(last.json)) {
    return { stats: last.json, tried: candidates[candidates.length - 1]! }
  }

  return { error: 'stats_failed', status: 502, detail: 'empty response' }
}

type ReqBody = {
  url?: string
  username?: string
  password?: string
  action?: string
  enabled?: boolean
}

export async function POST(req: Request) {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const user = String(body.username ?? '')
  const pass = String(body.password ?? '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (user !== '' || pass !== '') {
    const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')
    headers.Authorization = `Basic ${token}`
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    if (body.action === 'protection') {
      if (typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'missing_enabled' }, { status: 400 })
      }
      const url = controlEndpoint(base, 'control/protection')
      const pr = await fetchJsonPost(url, headers, { enabled: body.enabled }, ac.signal)
      if (!pr.ok) {
        const detail =
          isStatsObject(pr.json) && 'message' in pr.json
            ? String((pr.json as { message?: string }).message ?? '')
            : pr.text.slice(0, 240)
        return NextResponse.json(
          { error: 'protection_failed', status: pr.status, detail: detail || pr.text.slice(0, 240) },
          { status: pr.status === 401 || pr.status === 403 ? pr.status : 502 },
        )
      }
      const statusUrl = controlEndpoint(base, 'control/status')
      const statusRes = await fetchJson(statusUrl, headers, ac.signal)
      return NextResponse.json({
        ok: true,
        status: statusRes.ok && isStatsObject(statusRes.json) ? statusRes.json : null,
      })
    }

    const statsBundle = await fetchStatsBundle(base, headers, ac.signal)
    if ('error' in statsBundle) {
      const st = statsBundle.status === 401 || statsBundle.status === 403 ? statsBundle.status : 502
      void logPluginApiFailure('adguard', 'stats', statsBundle.error, {
        status: statsBundle.status,
        detail: statsBundle.detail,
      })
      return NextResponse.json(
        { error: statsBundle.error, status: statsBundle.status, detail: statsBundle.detail },
        { status: st },
      )
    }

    const statusUrl = controlEndpoint(base, 'control/status')
    const statusRes = await fetchJson(statusUrl, headers, ac.signal)

    let statsConfig: Record<string, unknown> | null = null
    const cfgUrl = controlEndpoint(base, 'control/stats/config')
    const cfgRes = await fetchJson(cfgUrl, headers, ac.signal)
    if (cfgRes.ok && isStatsObject(cfgRes.json)) statsConfig = cfgRes.json

    return NextResponse.json({
      stats: statsBundle.stats,
      status: statusRes.ok && isStatsObject(statusRes.json) ? statusRes.json : null,
      statusHttp: statusRes.status,
      statsConfig,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('adguard', 'request', aborted ? 'timeout' : msg)
    return NextResponse.json(
      { error: aborted ? 'timeout' : 'fetch_failed', detail: msg },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(t)
  }
}
