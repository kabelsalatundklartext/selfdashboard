import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  token?: string
}

export type SpeedtestResultPayload = {
  downloadMbps: number | null
  uploadMbps: number | null
  pingMs: number | null
  createdAt: string | null
  serverName: string | null
  failed: boolean
  /** Welcher API-Pfad geantwortet hat — hilft beim Debuggen verschiedener Versionen. */
  source: string
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
  const withProto = /^https?:\/\//i.test(t) ? t : `http://${t}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.username = ''
  u.password = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

/**
 * Mbps aus den unterschiedlichen Speedtest-Tracker-Formaten:
 * - neuere Versionen: `download_bits` / `upload_bits` (Bit/s)
 * - Ookla-Rohwert: `download` / `upload` als Bytes/s (große Zahlen)
 * - alte Versionen: `download` / `upload` bereits in Mbps (kleine Zahlen)
 */
function toMbps(result: Record<string, unknown>, key: 'download' | 'upload'): number | null {
  const bits = num(result[`${key}_bits`])
  if (bits != null) return bits / 1_000_000
  const raw = num(result[key])
  if (raw == null) return null
  if (raw > 50_000) return (raw * 8) / 1_000_000 // Bytes/s (Ookla bandwidth)
  return raw // bereits Mbps
}

function normalizeResult(json: unknown, source: string): SpeedtestResultPayload | null {
  // API antwortet je nach Version mit {data: {...}} oder direkt {...}
  const root = isObject(json) && isObject(json.data) ? json.data : isObject(json) ? json : null
  if (!root) return null
  const hasAny =
    'download' in root || 'upload' in root || 'ping' in root || 'download_bits' in root
  if (!hasAny) return null
  const serverName =
    str(root.server_name) ??
    str(isObject(root.data) ? (root.data as Record<string, unknown>).server_name : null) ??
    null
  return {
    downloadMbps: toMbps(root, 'download'),
    uploadMbps: toMbps(root, 'upload'),
    pingMs: num(root.ping),
    createdAt: str(root.created_at) ?? str(root.updated_at),
    serverName,
    failed: root.failed === true || root.successful === false,
    source,
  }
}

async function fetchJson(
  url: string,
  token: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchWithSsrfGuard(url, { method: 'GET', headers, cache: 'no-store', signal })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json }
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
  const token = openSealedSecret(String(body.token ?? '').trim())

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  // Endpunkte je nach Speedtest-Tracker-Version (neueste zuerst).
  const candidates = [
    '/api/v1/results/latest',
    '/api/speedtest/latest',
  ]

  try {
    let lastStatus = 0
    for (const p of candidates) {
      const r = await fetchJson(`${base}${p}`, token, ac.signal)
      lastStatus = r.status
      if (r.status === 404) continue
      if (r.status === 401 || r.status === 403) {
        void logPluginApiFailure('speedtest-tracker', 'auth', 'auth_failed', { status: r.status, path: p })
        return Response.json(
          { error: 'auth_failed', detail: 'API-Token prüfen (Speedtest Tracker → Settings → API Tokens).' },
          { status: r.status },
        )
      }
      if (!r.ok) continue
      const normalized = normalizeResult(r.json, p)
      if (normalized) return Response.json(normalized)
    }
    void logPluginApiFailure('speedtest-tracker', 'upstream', 'no_endpoint', { status: lastStatus })
    return Response.json(
      {
        error: 'api_not_found',
        detail: `Kein bekannter Endpoint erreichbar (zuletzt HTTP ${lastStatus}). URL prüfen — erwartet wird die Speedtest-Tracker-Basis-URL.`,
      },
      { status: 502 },
    )
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('speedtest-tracker', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('speedtest-tracker', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('speedtest-tracker', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleSpeedtestPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function speedtestTrackerServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleSpeedtestPluginRequest(ctx.request, ctx.path)
}
