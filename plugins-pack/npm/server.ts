import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  email?: string
  password?: string
}

export type NpmHostsPayload = {
  proxy: number
  redirection: number
  stream: number
  dead: number
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function count(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0
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

async function fetchJson(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetchWithSsrfGuard(url, { ...init, cache: 'no-store', signal })
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
  const email = String(body.email ?? '').trim()
  const password = openSealedSecret(String(body.password ?? '').trim())
  if (!email || !password) {
    return Response.json(
      { error: 'missing_credentials', detail: 'E-Mail und Passwort (Web-UI-Login) in den Widget-Einstellungen eintragen.' },
      { status: 400 },
    )
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    // 1) Login: POST /api/tokens → { token }
    const login = await fetchJson(
      `${base}/api/tokens`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identity: email, secret: password }),
      },
      ac.signal,
    )
    if (login.status === 401 || login.status === 403) {
      void logPluginApiFailure('npm', 'auth', 'auth_failed', { status: login.status })
      return Response.json(
        { error: 'auth_failed', detail: 'E-Mail/Passwort prüfen — gleicher Login wie die NPM-Web-UI.' },
        { status: login.status },
      )
    }
    const token = isObject(login.json) && typeof login.json.token === 'string' ? login.json.token.trim() : ''
    if (!login.ok || !token) {
      void logPluginApiFailure('npm', 'auth', 'no_token', { status: login.status })
      return Response.json(
        {
          error: 'auth_failed',
          detail: `Kein Token erhalten (HTTP ${login.status}). URL prüfen — erwartet wird die NPM-Basis-URL (Standard-Port 81).`,
        },
        { status: 502 },
      )
    }

    // 2) Host-Statistik: GET /api/reports/hosts
    const report = await fetchJson(
      `${base}/api/reports/hosts`,
      {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      },
      ac.signal,
    )
    if (report.status === 401 || report.status === 403) {
      void logPluginApiFailure('npm', 'auth', 'token_rejected', { status: report.status })
      return Response.json(
        { error: 'auth_failed', detail: 'Token wurde abgelehnt — Berechtigungen des NPM-Nutzers prüfen.' },
        { status: report.status },
      )
    }
    if (!report.ok || !isObject(report.json)) {
      void logPluginApiFailure('npm', 'upstream', 'bad_report', { status: report.status })
      return Response.json(
        { error: 'upstream_error', detail: `Host-Report nicht lesbar (HTTP ${report.status}).` },
        { status: 502 },
      )
    }

    const payload: NpmHostsPayload = {
      proxy: count(report.json.proxy),
      redirection: count(report.json.redirection),
      stream: count(report.json.stream),
      dead: count(report.json.dead),
    }
    return Response.json(payload)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('npm', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('npm', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('npm', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json(
      { error: 'network_error', detail: 'Nginx Proxy Manager nicht erreichbar — URL/Port prüfen (Standard 81).' },
      { status: 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

async function handleNpmPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function npmServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleNpmPluginRequest(ctx.request, ctx.path)
}
