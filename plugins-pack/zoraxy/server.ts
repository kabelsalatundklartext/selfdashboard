import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  username?: string
  password?: string
}

export type ZoraxyHostsPayload = {
  total: number
  active: number
  disabled: number
  upstreams: number
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

/** Accumulate Set-Cookie name=value pairs into a jar (later values override). */
function collectCookies(jar: Map<string, string>, res: Response): void {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  let raw: string[] = []
  if (typeof headers.getSetCookie === 'function') {
    raw = headers.getSetCookie()
  } else {
    const single = res.headers.get('set-cookie')
    if (single) raw = [single]
  }
  for (const c of raw) {
    const pair = c.split(';', 1)[0]?.trim()
    if (!pair) continue
    const eq = pair.indexOf('=')
    if (eq <= 0) continue
    jar.set(pair.slice(0, eq), pair.slice(eq + 1))
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join('; ')
}

/** Pull the gorilla/csrf token from <meta name="zoraxy.csrf.Token" content="…">. */
function extractCsrfToken(html: string): string {
  const m =
    html.match(/name=["']zoraxy\.csrf\.Token["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["'][^>]*name=["']zoraxy\.csrf\.Token["']/i)
  return m ? m[1] : ''
}

async function readBody(res: Response): Promise<{ ok: boolean; status: number; text: string; json: unknown }> {
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, text, json }
}

function summarizeHosts(list: unknown[]): ZoraxyHostsPayload {
  let active = 0
  let disabled = 0
  let upstreams = 0
  for (const entry of list) {
    if (!isObject(entry)) continue
    if (entry.Disabled === true) disabled++
    else active++
    if (Array.isArray(entry.ActiveOrigins)) upstreams += entry.ActiveOrigins.length
  }
  return { total: list.length, active, disabled, upstreams }
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
  const username = String(body.username ?? '').trim()
  const password = openSealedSecret(String(body.password ?? '').trim())
  if (!username || !password) {
    return Response.json(
      {
        error: 'missing_credentials',
        detail: 'Benutzer und Passwort (Web-UI-Login) in den Widget-Einstellungen eintragen.',
      },
      { status: 400 },
    )
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  const jar = new Map<string, string>()

  try {
    // 0) CSRF: GET Login-Seite → gorilla/csrf-Cookie + Token aus <meta zoraxy.csrf.Token>
    const pageRes = await fetchWithSsrfGuard(
      `${base}/login.html`,
      { method: 'GET', headers: { Accept: 'text/html' }, cache: 'no-store', signal: ac.signal },
    )
    collectCookies(jar, pageRes)
    const csrfToken = extractCsrfToken(await pageRes.text())

    // 1) Login: POST /api/auth/login (form + X-CSRF-Token) → Session-Cookie, Body "OK"
    const loginHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    }
    if (csrfToken) loginHeaders['X-CSRF-Token'] = csrfToken
    const jarBefore = cookieHeader(jar)
    if (jarBefore) loginHeaders.Cookie = jarBefore

    const loginRes = await fetchWithSsrfGuard(
      `${base}/api/auth/login`,
      {
        method: 'POST',
        headers: loginHeaders,
        body: new URLSearchParams({ username, password, rmbme: 'true' }).toString(),
        cache: 'no-store',
        signal: ac.signal,
      },
    )
    collectCookies(jar, loginRes)
    const login = await readBody(loginRes)
    const loginErr = isObject(login.json) && typeof login.json.error === 'string' ? login.json.error : ''
    if (loginErr) {
      void logPluginApiFailure('zoraxy', 'auth', 'auth_failed', { status: login.status, reason: loginErr })
      return Response.json(
        { error: 'auth_failed', detail: `Zoraxy: "${loginErr}" (HTTP ${login.status})` },
        { status: 401 },
      )
    }
    if (!login.ok) {
      void logPluginApiFailure('zoraxy', 'auth', 'no_session', { status: login.status, hadToken: Boolean(csrfToken) })
      return Response.json(
        {
          error: 'auth_failed',
          detail: `Login fehlgeschlagen (HTTP ${login.status}${csrfToken ? '' : ', kein CSRF-Token gefunden'}).`,
        },
        { status: login.status === 403 ? 403 : 502 },
      )
    }

    // 2) Host-Liste: GET /api/proxy/list?type=host (GET ist vom CSRF-Schutz ausgenommen)
    const listRes = await fetchWithSsrfGuard(
      `${base}/api/proxy/list?type=host`,
      {
        method: 'GET',
        headers: { Accept: 'application/json', Cookie: cookieHeader(jar) },
        cache: 'no-store',
        signal: ac.signal,
      },
    )
    const list = await readBody(listRes)
    if (list.status === 401 || list.status === 403) {
      void logPluginApiFailure('zoraxy', 'auth', 'session_rejected', { status: list.status })
      return Response.json(
        { error: 'auth_failed', detail: 'Session abgelehnt — Berechtigungen des Zoraxy-Benutzers prüfen.' },
        { status: list.status },
      )
    }
    if (!list.ok || !Array.isArray(list.json)) {
      const detail = isObject(list.json) && typeof list.json.error === 'string' ? list.json.error : ''
      void logPluginApiFailure('zoraxy', 'upstream', 'bad_list', { status: list.status })
      return Response.json(
        { error: 'upstream_error', detail: detail || `Host-Liste nicht lesbar (HTTP ${list.status}).` },
        { status: 502 },
      )
    }

    return Response.json(summarizeHosts(list.json))
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('zoraxy', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('zoraxy', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('zoraxy', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json(
      { error: 'network_error', detail: 'Zoraxy nicht erreichbar — URL/Port prüfen (Standard 8000).' },
      { status: 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

async function handleZoraxyPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function zoraxyServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleZoraxyPluginRequest(ctx.request, ctx.path)
}
