import { logPluginApiFailure } from '../_shared/log'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type {
  UptimeKumaDashboardPayload,
  UptimeKumaMonitorRow,
  UptimeKumaMonitorStatus,
} from './lib/types'

type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  slug?: string
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

function normalizeStatusText(raw: string): UptimeKumaMonitorStatus {
  const s = raw.trim().toLowerCase()
  if (s === 'down' || s === 'pending' || s === 'maintenance') return s
  return 'up'
}

function heartbeatStatus(code: number): UptimeKumaMonitorStatus {
  switch (code) {
    case 0:
      return 'down'
    case 2:
      return 'pending'
    case 3:
      return 'maintenance'
    default:
      return 'up'
  }
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

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart().toLowerCase()
  return t.startsWith('<!doctype') || t.startsWith('<html')
}

function parseJson(text: string): unknown | null {
  if (!text || looksLikeHtml(text)) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function latestHeartbeatStatus(list: unknown): UptimeKumaMonitorStatus | null {
  if (!Array.isArray(list) || list.length === 0) return null
  const last = list[list.length - 1]
  if (!isObject(last)) return null
  const code = typeof last.status === 'number' && Number.isFinite(last.status) ? last.status : 1
  return heartbeatStatus(code)
}

function buildPayload(
  slug: string,
  pageJson: unknown,
  heartbeatJson: unknown | null,
): UptimeKumaDashboardPayload | null {
  if (!isObject(pageJson) || !Array.isArray(pageJson.publicGroupList)) return null

  const heartbeatList =
    heartbeatJson && isObject(heartbeatJson) && isObject(heartbeatJson.heartbeatList)
      ? (heartbeatJson.heartbeatList as Record<string, unknown>)
      : null

  const monitors: UptimeKumaMonitorRow[] = []
  const counts = { up: 0, down: 0, pending: 0, maintenance: 0, total: 0 }

  for (const group of pageJson.publicGroupList) {
    if (!isObject(group) || !Array.isArray(group.monitorList)) continue
    const groupName = str(group.name) || '—'
    for (const m of group.monitorList) {
      if (!isObject(m)) continue
      const name = str(m.name)
      if (!name) continue
      const id = typeof m.id === 'number' && Number.isFinite(m.id) ? m.id : monitors.length + 1
      const fromSummary = str(m.status)
      const fromHeartbeat =
        heartbeatList && m.id != null ? latestHeartbeatStatus(heartbeatList[String(m.id)]) : null
      const status = fromSummary ? normalizeStatusText(fromSummary) : fromHeartbeat ?? 'pending'
      counts[status] += 1
      counts.total += 1
      monitors.push({
        id,
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

async function fetchUpstream(
  url: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown | null; text: string }> {
  const res = await fetchWithSsrfGuard(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, json: parseJson(text), text }
}

function invalidResponseDetail(page: { status: number; json: unknown | null; text: string }, slug: string): string {
  if (page.json && isObject(page.json) && !Array.isArray(page.json.publicGroupList)) {
    return 'Antwort ohne publicGroupList — Slug oder Status-Page prüfen.'
  }
  if (looksLikeHtml(page.text)) {
    return `Kein JSON von /api/status-page/${slug} — URL/Port prüfen.`
  }
  if (!page.json) {
    return `Ungültiges JSON (HTTP ${page.status}) von /api/status-page/${slug}.`
  }
  return 'Status-Page ohne Monitore oder unbekanntes Format.'
}

async function handleUptimeKumaPluginRequest(req: Request, _path: string[]): Promise<Response> {
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
    const pageUrl = `${base}/api/status-page/${encodeURIComponent(slug)}`
    const heartbeatUrl = `${base}/api/status-page/heartbeat/${encodeURIComponent(slug)}`

    const page = await fetchUpstream(pageUrl, ac.signal)
    if (!page.ok) {
      const detail =
        page.json && isObject(page.json) && typeof page.json.msg === 'string'
          ? page.json.msg
          : page.text.slice(0, 200)
      const error = page.status === 404 ? 'status_page_not_found' : 'uptime_kuma_error'
      void logPluginApiFailure('uptime-kuma', 'upstream', error, { upstreamStatus: page.status, detail })
      return Response.json({ error, detail }, { status: page.status === 404 ? 404 : 502 })
    }

    const heartbeat = await fetchUpstream(heartbeatUrl, ac.signal)
    const payload = buildPayload(slug, page.json, heartbeat.ok ? heartbeat.json : null)
    if (!payload) {
      const detail = invalidResponseDetail(page, slug)
      void logPluginApiFailure('uptime-kuma', 'upstream', 'invalid_response', { detail })
      return Response.json({ error: 'invalid_response', detail }, { status: 502 })
    }
    return Response.json(payload)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('uptime-kuma', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
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

export default function uptimeKumaServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleUptimeKumaPluginRequest(ctx.request, ctx.path)
}
