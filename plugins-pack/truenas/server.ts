import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchCheckedJson } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  apiKey?: string
  insecureTls?: boolean
}

export type TrueNasPoolPayload = {
  name: string
  status: string
  healthy: boolean
  usedPct: number | null
}

export type TrueNasPayload = {
  hostname: string | null
  version: string | null
  uptimeSec: number | null
  pools: TrueNasPoolPayload[]
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t || null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, '')
  if (!t) throw new Error('missing_url')
  // TrueNAS spricht standardmäßig HTTPS (Web-UI-Port).
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.username = ''
  u.password = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

function normalizeSystemInfo(json: unknown): { hostname: string | null; version: string | null; uptimeSec: number | null } {
  const root = isObject(json) ? json : {}
  return {
    hostname: str(root.hostname),
    version: str(root.version),
    uptimeSec: num(root.uptime_seconds),
  }
}

function normalizePools(json: unknown): TrueNasPoolPayload[] {
  if (!Array.isArray(json)) return []
  const pools: TrueNasPoolPayload[] = []
  for (const entry of json) {
    if (!isObject(entry)) continue
    const name = str(entry.name)
    if (!name) continue
    const status = str(entry.status) ?? 'UNKNOWN'
    const healthy = entry.healthy === true || (entry.healthy == null && status === 'ONLINE')
    const size = num(entry.size)
    const allocated = num(entry.allocated)
    const usedPct = size != null && allocated != null && size > 0 ? (allocated / size) * 100 : null
    pools.push({ name, status, healthy, usedPct })
  }
  pools.sort((a, b) => a.name.localeCompare(b.name))
  return pools
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'invalid_url' }, { status: 400 })
  }

  const apiKey = openSealedSecret(String(body.apiKey ?? '').trim())
  if (!apiKey) {
    return Response.json(
      { error: 'missing_key', detail: 'API-Key fehlt (TrueNAS → Einstellungen → API Keys).' },
      { status: 400 },
    )
  }
  const insecureTls = body.insecureTls === true

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const info = await fetchCheckedJson(
      `${base}/api/v2.0/system/info`,
      { method: 'GET', headers, signal: ac.signal },
      { insecureTls },
    )

    if (info.status === 401 || info.status === 403) {
      void logPluginApiFailure('truenas', 'auth', 'auth_failed', { status: info.status })
      return Response.json(
        { error: 'auth_failed', detail: 'API-Key prüfen (TrueNAS → Einstellungen → API Keys).' },
        { status: info.status },
      )
    }
    if (!info.ok) {
      void logPluginApiFailure('truenas', 'upstream', `http_${info.status}`, { status: info.status })
      return Response.json(
        { error: 'upstream_error', detail: `TrueNAS antwortete mit HTTP ${info.status}.` },
        { status: 502 },
      )
    }

    // Pool-Liste defensiv — wenn der Endpoint scheitert, trotzdem Systeminfo liefern.
    let pools: TrueNasPoolPayload[] = []
    try {
      const poolRes = await fetchCheckedJson(
        `${base}/api/v2.0/pool`,
        { method: 'GET', headers, signal: ac.signal },
        { insecureTls },
      )
      if (poolRes.ok) pools = normalizePools(poolRes.json)
      else void logPluginApiFailure('truenas', 'upstream', `pool_http_${poolRes.status}`, { status: poolRes.status })
    } catch {
      void logPluginApiFailure('truenas', 'upstream', 'pool_fetch_failed')
    }

    const sys = normalizeSystemInfo(info.json)
    const payload: TrueNasPayload = { ...sys, pools }
    return Response.json(payload)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('truenas', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('truenas', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure('truenas', 'request', 'tls_error', { message: msg })
      return Response.json(
        { error: 'tls_error', detail: 'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.' },
        { status: 502 },
      )
    }
    void logPluginApiFailure('truenas', 'request', 'network_error', { message: msg })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleTrueNasPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function truenasServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleTrueNasPluginRequest(ctx.request, ctx.path)
}
