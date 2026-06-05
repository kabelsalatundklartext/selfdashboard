import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchCheckedJson, type CheckedResponse } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

// Login + getInformation sind zwei Roundtrips — etwas mehr Luft als üblich.
const FETCH_TIMEOUT_MS = 15_000

type ReqBody = {
  url?: string
  username?: string
  password?: string
  insecureTls?: boolean
}

export type OmvPayload = {
  hostname: string | null
  version: string | null
  uptimeSec: number | null
  uptimeText: string | null
  cpuPct: number | null
  memUsedPct: number | null
  loadAvg: string | null
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

/** Set-Cookie-Header einsammeln: nur der Teil vor dem ersten ';' je Cookie. */
function collectCookies(res: CheckedResponse): string {
  const raw = res.headers.raw()['set-cookie'] ?? []
  return raw
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')
}

/** CPU-Last: Zahl 0–100 oder Objekt mit utilization/usage/value (je nach OMV-Version). */
function parseCpuPct(v: unknown): number | null {
  const direct = num(v)
  if (direct != null) return Math.max(0, Math.min(100, direct))
  if (isObject(v)) {
    const inner = num(v.utilization) ?? num(v.usage) ?? num(v.value) ?? num(v.cpuUsage)
    if (inner != null) return Math.max(0, Math.min(100, inner))
  }
  return null
}

/** RAM-Nutzung in % aus memUsed/memTotal, memory-Objekt oder memUtilization. */
function parseMemPct(root: Record<string, unknown>): number | null {
  const used = num(root.memUsed)
  const total = num(root.memTotal)
  if (used != null && total != null && total > 0) return Math.max(0, Math.min(100, (used / total) * 100))
  const mem = root.memory
  if (isObject(mem)) {
    const u = num(mem.used) ?? num(mem.memUsed)
    const t = num(mem.total) ?? num(mem.memTotal)
    if (u != null && t != null && t > 0) return Math.max(0, Math.min(100, (u / t) * 100))
    const pct = num(mem.utilization) ?? num(mem.percent) ?? num(mem.usage)
    if (pct != null) return Math.max(0, Math.min(100, pct <= 1 ? pct * 100 : pct))
  }
  const direct = num(root.memUtilization)
  if (direct != null) return Math.max(0, Math.min(100, direct <= 1 ? direct * 100 : direct))
  return null
}

/** Uptime: Sekunden (Zahl/Zahl-String) oder lesbarer String — je nach OMV-Version. */
function parseUptime(v: unknown): { uptimeSec: number | null; uptimeText: string | null } {
  if (typeof v === 'number' && Number.isFinite(v)) return { uptimeSec: v, uptimeText: null }
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return { uptimeSec: null, uptimeText: null }
    const n = Number(t)
    if (Number.isFinite(n) && /^[\d.]+$/.test(t)) return { uptimeSec: n, uptimeText: null }
    return { uptimeSec: null, uptimeText: t }
  }
  return { uptimeSec: null, uptimeText: null }
}

/** Load Average: String "0.12, 0.34, 0.56" oder Objekt {1min,5min,15min} bzw. Array. */
function parseLoadAvg(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null
  if (Array.isArray(v)) {
    const parts = v.map((x) => num(x)).filter((x): x is number => x != null)
    return parts.length ? parts.map((x) => x.toFixed(2)).join(', ') : null
  }
  if (isObject(v)) {
    const parts = [v['1min'] ?? v.one, v['5min'] ?? v.five, v['15min'] ?? v.fifteen]
      .map((x) => num(x))
      .filter((x): x is number => x != null)
    return parts.length ? parts.map((x) => x.toFixed(2)).join(', ') : null
  }
  return null
}

function normalizeInformation(json: unknown): OmvPayload | null {
  // RPC antwortet mit {response: {...}, error: null}; defensiv auch direkte Objekte akzeptieren.
  const root = isObject(json) && isObject(json.response) ? json.response : isObject(json) ? json : null
  if (!root) return null
  const up = parseUptime(root.uptime)
  return {
    hostname: str(root.hostname),
    version: str(root.version),
    uptimeSec: up.uptimeSec,
    uptimeText: up.uptimeText,
    cpuPct: parseCpuPct(root.cpuUsage ?? root.cpuUtilization),
    memUsedPct: parseMemPct(root),
    loadAvg: parseLoadAvg(root.loadAverage ?? root.loadavg),
  }
}

function rpcErrorMessage(json: unknown): string | null {
  if (!isObject(json)) return null
  const err = json.error
  if (err == null) return null
  if (typeof err === 'string') return err
  if (isObject(err)) return str(err.message) ?? 'RPC error'
  return 'RPC error'
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

  const username = String(body.username ?? '').trim() || 'admin'
  const password = openSealedSecret(String(body.password ?? '').trim())
  if (!password) {
    return Response.json(
      { error: 'missing_credentials', detail: 'Passwort eintragen (Web-UI-Login, z. B. admin).' },
      { status: 400 },
    )
  }

  const insecureTls = body.insecureTls !== false
  const rpcUrl = `${base}/rpc.php`

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    // 1) RPC-Login (session.login) — Session-Cookies einsammeln.
    const login = await fetchCheckedJson(
      rpcUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ service: 'session', method: 'login', params: { username, password } }),
        signal: ac.signal,
      },
      { insecureTls },
    )

    const loginErr = rpcErrorMessage(login.json)
    if (loginErr || login.status === 401 || login.status === 403) {
      void logPluginApiFailure('openmediavault', 'auth', 'auth_failed', {
        status: login.status,
        message: loginErr ?? undefined,
      })
      return Response.json(
        { error: 'auth_failed', detail: 'Login abgelehnt — Web-UI-Benutzer und Passwort prüfen.' },
        { status: 401 },
      )
    }
    if (!login.ok) {
      void logPluginApiFailure('openmediavault', 'auth', `login_http_${login.status}`, { status: login.status })
      return Response.json(
        { error: 'upstream_error', detail: `RPC-Login fehlgeschlagen (HTTP ${login.status}) — URL prüfen (erwartet OMV-Web-UI).` },
        { status: 502 },
      )
    }

    const cookie = collectCookies(login.res)
    if (!cookie) {
      void logPluginApiFailure('openmediavault', 'auth', 'no_cookie')
      return Response.json(
        { error: 'upstream_error', detail: 'OMV hat kein Session-Cookie geliefert.' },
        { status: 502 },
      )
    }

    // 2) system.getInformation mit Session-Cookie.
    const info = await fetchCheckedJson(
      rpcUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: cookie },
        body: JSON.stringify({ service: 'system', method: 'getInformation', params: null }),
        signal: ac.signal,
      },
      { insecureTls },
    )

    const infoErr = rpcErrorMessage(info.json)
    if (infoErr || info.status === 401 || info.status === 403) {
      void logPluginApiFailure('openmediavault', 'upstream', 'rpc_error', {
        status: info.status,
        message: infoErr ?? undefined,
      })
      return Response.json(
        { error: 'upstream_error', detail: infoErr ?? `OMV-RPC-Fehler (HTTP ${info.status}).` },
        { status: 502 },
      )
    }
    if (!info.ok) {
      void logPluginApiFailure('openmediavault', 'upstream', `http_${info.status}`, { status: info.status })
      return Response.json(
        { error: 'upstream_error', detail: `OMV antwortete mit HTTP ${info.status}.` },
        { status: 502 },
      )
    }

    const normalized = normalizeInformation(info.json)
    if (!normalized) {
      void logPluginApiFailure('openmediavault', 'upstream', 'unexpected_response')
      return Response.json(
        { error: 'upstream_error', detail: 'Unerwartetes Antwortformat von system.getInformation.' },
        { status: 502 },
      )
    }
    return Response.json(normalized)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('openmediavault', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('openmediavault', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure('openmediavault', 'request', 'tls_error', { message: msg })
      return Response.json(
        { error: 'tls_error', detail: 'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.' },
        { status: 502 },
      )
    }
    void logPluginApiFailure('openmediavault', 'request', 'network_error', { message: msg })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleOmvPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function openmediavaultServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleOmvPluginRequest(ctx.request, ctx.path)
}
