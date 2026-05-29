import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import { logPluginApiFailure } from '@/lib/pluginLogServer'
import type {
  UptimeKumaDashboardPayload,
  UptimeKumaMonitorRow,
  UptimeKumaMonitorStatus,
} from './lib/types'

export type { UptimeKumaDashboardPayload, UptimeKumaMonitorRow, UptimeKumaMonitorStatus } from './lib/types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  slug?: string
}

type SummaryMonitor = {
  id?: number
  name?: string
  type?: string
  status?: string
}

type SummaryGroup = {
  name?: string
  monitorList?: SummaryMonitor[]
}

type SummaryPayload = {
  publicGroupList?: SummaryGroup[]
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function normalizeBase(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let out = u.toString().replace(/\/+$/, '')
  if (out.endsWith('/dashboard')) out = out.slice(0, -'/dashboard'.length)
  return out.replace(/\/+$/, '')
}

function normalizeSlug(raw: string): string {
  const slug = str(raw).replace(/^\/+|\/+$/g, '')
  if (!slug) throw new Error('missing_slug')
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) throw new Error('invalid_slug')
  return slug
}

function normalizeStatus(raw: string): UptimeKumaMonitorStatus {
  const s = raw.trim().toLowerCase()
  if (s === 'down' || s === 'pending' || s === 'maintenance') return s
  return 'up'
}

function normalizeSummary(slug: string, json: unknown): UptimeKumaDashboardPayload {
  const groups = isObject(json) && Array.isArray(json.publicGroupList) ? json.publicGroupList : []
  const monitors: UptimeKumaMonitorRow[] = []
  const counts = { up: 0, down: 0, pending: 0, maintenance: 0, total: 0 }

  for (const group of groups) {
    if (!isObject(group) || !Array.isArray(group.monitorList)) continue
    const groupName = str(group.name) || '—'
    for (const m of group.monitorList) {
      if (!isObject(m)) continue
      const name = str(m.name)
      if (!name) continue
      const status = normalizeStatus(str(m.status))
      counts[status] += 1
      counts.total += 1
      monitors.push({
        id: typeof m.id === 'number' && Number.isFinite(m.id) ? m.id : monitors.length + 1,
        name,
        group: groupName,
        type: str(m.type) || 'http',
        status,
      })
    }
  }

  monitors.sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name))

  return { slug, monitors, counts }
}

function statusRank(status: UptimeKumaMonitorStatus): number {
  switch (status) {
    case 'down':
      return 0
    case 'pending':
      return 1
    case 'maintenance':
      return 2
    default:
      return 3
  }
}

export async function handleUptimeKumaPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handleUptimeKumaPost(req)
}

async function handleUptimeKumaPost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  let slug: string
  try {
    base = normalizeBase(String(body.url ?? process.env.UPTIME_KUMA_URL ?? ''))
    slug = normalizeSlug(String(body.slug ?? process.env.UPTIME_KUMA_STATUS_SLUG ?? ''))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_request'
    return Response.json({ error: msg }, { status: 400 })
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const url = `${base}/api/status-page/${encodeURIComponent(slug)}/summary`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: ac.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    if (!res.ok) {
      const detail = isObject(json) && typeof json.msg === 'string' ? json.msg : text.slice(0, 200)
      const error = res.status === 404 ? 'status_page_not_found' : 'uptime_kuma_error'
      void logPluginApiFailure('uptime-kuma', 'upstream', error, { upstreamStatus: res.status, detail })
      return Response.json({ error, detail }, { status: res.status === 404 ? 404 : 502 })
    }
    if (!isObject(json) || !Array.isArray(json.publicGroupList)) {
      void logPluginApiFailure('uptime-kuma', 'upstream', 'invalid_response')
      return Response.json({ error: 'invalid_response' }, { status: 502 })
    }
    return Response.json(normalizeSummary(slug, json as SummaryPayload))
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('uptime-kuma', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('uptime-kuma', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

export function uptimeKumaServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleUptimeKumaPluginRequest(ctx.request, ctx.path)
}

export default uptimeKumaServerHandler
