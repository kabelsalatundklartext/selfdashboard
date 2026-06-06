import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchCheckedJson, type CheckedResponse } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

// Login + Health sind zwei Roundtrips — etwas mehr Luft als üblich.
const FETCH_TIMEOUT_MS = 15_000

type ReqBody = {
  url?: string
  username?: string
  password?: string
  site?: string
  insecureTls?: boolean
}

export type UnifiSubsystemPayload = {
  name: string
  status: string
  devices: number
  clients: number
}

export type UnifiPayload = {
  subsystems: UnifiSubsystemPayload[]
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
  // UniFi-Controller sprechen standardmäßig HTTPS (UDM: 443, Legacy: 8443).
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
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

function normalizeHealth(json: unknown): UnifiPayload | null {
  if (!isObject(json) || !Array.isArray(json.data)) return null
  const subsystems: UnifiSubsystemPayload[] = []
  for (const entry of json.data) {
    if (!isObject(entry)) continue
    const name = str(entry.subsystem)
    if (!name) continue
    const devices = num(entry.num_ap) ?? num(entry.num_sw) ?? num(entry.num_gw) ?? 0
    const user = num(entry.num_user)
    const guest = num(entry.num_guest)
    const clients = user != null || guest != null ? (user ?? 0) + (guest ?? 0) : (num(entry.num_sta) ?? 0)
    subsystems.push({
      name,
      status: str(entry.status) ?? 'unknown',
      devices,
      clients,
    })
  }
  return { subsystems }
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
      { error: 'missing_credentials', detail: 'Benutzername und Passwort eintragen (lokaler Controller-Benutzer).' },
      { status: 400 },
    )
  }

  const site = String(body.site ?? '').trim() || 'default'
  if (!/^[a-z0-9_-]+$/i.test(site)) {
    return Response.json({ error: 'invalid_site', detail: 'Site darf nur a–z, 0–9, _ und - enthalten.' }, { status: 400 })
  }

  const insecureTls = body.insecureTls !== false

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    // 1) Login — zuerst UniFi OS (UDM/UDR/Cloud Key Gen2), bei 404 Legacy-Controller.
    const loginBody = JSON.stringify({ username, password })
    const loginInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: loginBody,
      signal: ac.signal,
    }

    let unifiOs = true
    let login = await fetchCheckedJson(`${base}/api/auth/login`, loginInit, { insecureTls })
    if (login.status === 404) {
      unifiOs = false
      login = await fetchCheckedJson(`${base}/api/login`, loginInit, { insecureTls })
    }
    if (login.status === 400 || login.status === 401 || login.status === 403) {
      void logPluginApiFailure('unifi', 'auth', 'auth_failed', { status: login.status })
      return Response.json(
        {
          error: 'auth_failed',
          detail:
            'Login abgelehnt — lokalen Controller-Benutzer (ohne 2FA) prüfen. Ubiquiti-Cloud-Accounts mit 2FA funktionieren nicht.',
        },
        { status: 401 },
      )
    }
    if (!login.ok) {
      void logPluginApiFailure('unifi', 'auth', `login_http_${login.status}`, { status: login.status })
      return Response.json(
        { error: 'upstream_error', detail: `Login fehlgeschlagen (HTTP ${login.status}).` },
        { status: 502 },
      )
    }

    const cookie = collectCookies(login.res)
    if (!cookie) {
      void logPluginApiFailure('unifi', 'auth', 'no_cookie')
      return Response.json(
        { error: 'upstream_error', detail: 'Controller hat kein Session-Cookie geliefert.' },
        { status: 502 },
      )
    }

    // 2) Health — Pfad passend zur Login-Variante, bei 404 die andere probieren.
    const healthInit = {
      method: 'GET',
      headers: { Accept: 'application/json', Cookie: cookie },
      signal: ac.signal,
    }
    const osPath = `${base}/proxy/network/api/s/${site}/stat/health`
    const legacyPath = `${base}/api/s/${site}/stat/health`

    let health = await fetchCheckedJson(unifiOs ? osPath : legacyPath, healthInit, { insecureTls })
    if (health.status === 404) {
      health = await fetchCheckedJson(unifiOs ? legacyPath : osPath, healthInit, { insecureTls })
    }
    if (health.status === 401 || health.status === 403) {
      void logPluginApiFailure('unifi', 'auth', 'session_rejected', { status: health.status })
      return Response.json(
        { error: 'auth_failed', detail: 'Session abgelehnt — Benutzerrechte prüfen (Netzwerk-Anwendung, mind. Lesen).' },
        { status: health.status },
      )
    }
    if (health.status === 404) {
      void logPluginApiFailure('unifi', 'upstream', 'site_not_found', { site })
      return Response.json(
        { error: 'site_not_found', detail: `Site „${site}" nicht gefunden — Site-Namen prüfen (intern, nicht Anzeigename).` },
        { status: 404 },
      )
    }
    if (!health.ok) {
      void logPluginApiFailure('unifi', 'upstream', `http_${health.status}`, { status: health.status })
      return Response.json(
        { error: 'upstream_error', detail: `Controller antwortete mit HTTP ${health.status}.` },
        { status: 502 },
      )
    }

    const normalized = normalizeHealth(health.json)
    if (!normalized) {
      void logPluginApiFailure('unifi', 'upstream', 'unexpected_response')
      return Response.json(
        { error: 'upstream_error', detail: 'Unerwartetes Antwortformat von stat/health.' },
        { status: 502 },
      )
    }
    return Response.json(normalized)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('unifi', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('unifi', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure('unifi', 'request', 'tls_error', { message: msg })
      return Response.json(
        { error: 'tls_error', detail: 'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.' },
        { status: 502 },
      )
    }
    void logPluginApiFailure('unifi', 'request', 'network_error', { message: msg })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleUnifiPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function unifiServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleUnifiPluginRequest(ctx.request, ctx.path)
}
