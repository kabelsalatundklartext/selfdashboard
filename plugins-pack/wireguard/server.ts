import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
// fetchChecked (nicht fetchWithSsrfGuard): wg-easy läuft typischerweise im LAN und
// nutzt oft ein selbstsigniertes Zertifikat. fetchChecked behält den SSRF-Schutz bei,
// erlaubt aber das optionale insecureTls-Flag (rejectUnauthorized:false) für genau diesen Fall.
import { fetchChecked, type CheckedResponse } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  username?: string
  password?: string
  insecureTls?: boolean
}

/** Stable shape returned to the widget — identical for wg-easy v14 and v15. */
export type WgPeer = {
  /** wg-easy client id (v14 uuid / v15 numeric) — stable React key across re-sorts. */
  id: string
  name: string
  enabled: boolean
  /** Last handshake as epoch ms, or null if the peer has never connected. */
  handshakeAt: number | null
  /** Bytes the server received from the peer (the peer's upload). */
  rx: number
  /** Bytes the server sent to the peer (the peer's download). */
  tx: number
  endpoint: string | null
  address: string | null
}

export type WgPayload = {
  peers: WgPeer[]
  /** Server clock (epoch ms) so the widget computes "online" without client drift. */
  now: number
  /** Which wg-easy API answered. */
  api: 'v15' | 'v14'
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** ISO string / unix seconds / unix ms → epoch ms, or null for "never". */
function parseTs(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return null
    return v < 1e12 ? v * 1000 : v
  }
  const s = String(v).trim()
  if (!s) return null
  const ms = Date.parse(s)
  if (!Number.isFinite(ms) || ms <= 0) return null
  return ms
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

/** Pull the client array out of the response, tolerating a {data:[…]}/{clients:[…]} wrapper. */
function extractClients(json: unknown): unknown[] | null {
  if (Array.isArray(json)) return json
  if (isObject(json)) {
    if (Array.isArray(json.data)) return json.data
    if (Array.isArray(json.clients)) return json.clients
  }
  return null
}

function normalizePeer(raw: unknown): WgPeer {
  const c = isObject(raw) ? raw : {}
  const address =
    str(c.address) || str(c.ipv4Address) || str(c.ipv6Address) || null
  return {
    id: str(c.id) || str(c.publicKey) || '',
    name: str(c.name) || '—',
    enabled: c.enabled !== false,
    handshakeAt: parseTs(c.latestHandshakeAt ?? c.lastHandshakeAt ?? c.latestHandshake),
    rx: num(c.transferRx ?? c.transferRX),
    tx: num(c.transferTx ?? c.transferTX),
    endpoint: str(c.endpoint) || null,
    address,
  }
}

/** Build a Cookie header from a node-fetch raw() set-cookie array. */
function cookieFromSetCookie(res: CheckedResponse): string {
  const raw = (res.headers.raw()['set-cookie'] ?? []).slice(0, 20)
  const pairs: string[] = []
  for (const c of raw) {
    const pair = c.split(';', 1)[0]?.trim()
    if (pair && pair.includes('=')) pairs.push(pair)
  }
  return pairs.join('; ')
}

type FetchOpts = { insecureTls: boolean; signal: AbortSignal }

/** wg-easy v15: Basic auth against GET /api/client. Requires a username. */
async function tryV15(
  base: string,
  username: string,
  password: string,
  opts: FetchOpts,
): Promise<{ peers: WgPeer[] } | { error: number }> {
  const auth = Buffer.from(`${username}:${password}`).toString('base64')
  const res = await fetchChecked(
    `${base}/api/client`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
      signal: opts.signal,
    },
    { insecureTls: opts.insecureTls },
  )
  if (!res.ok) return { error: res.status }
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    return { error: 502 }
  }
  const list = extractClients(json)
  if (!list) return { error: 502 }
  return { peers: list.map(normalizePeer) }
}

/** wg-easy v14: POST /api/session (password only) → cookie → GET /api/wireguard/client. */
async function tryV14(
  base: string,
  password: string,
  opts: FetchOpts,
): Promise<{ peers: WgPeer[] } | { error: number }> {
  const sessRes = await fetchChecked(
    `${base}/api/session`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ password }),
      signal: opts.signal,
    },
    { insecureTls: opts.insecureTls },
  )
  if (!sessRes.ok) return { error: sessRes.status }
  const cookie = cookieFromSetCookie(sessRes)
  if (!cookie) return { error: 401 }

  const listRes = await fetchChecked(
    `${base}/api/wireguard/client`,
    { method: 'GET', headers: { Accept: 'application/json', Cookie: cookie }, signal: opts.signal },
    { insecureTls: opts.insecureTls },
  )
  if (!listRes.ok) return { error: listRes.status }
  const text = await listRes.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    return { error: 502 }
  }
  const list = extractClients(json)
  if (!list) return { error: 502 }
  return { peers: list.map(normalizePeer) }
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

  const username = str(body.username)
  if (username.includes(':')) {
    // RFC 7617: a colon in the user-id corrupts the Basic credential string.
    return Response.json(
      { error: 'invalid_username', detail: 'Benutzername darf keinen Doppelpunkt enthalten.' },
      { status: 400 },
    )
  }
  const password = openSealedSecret(String(body.password ?? '').trim())
  if (!password) {
    return Response.json(
      {
        error: 'missing_credentials',
        detail: 'Passwort (wg-easy-Login) in den Widget-Einstellungen eintragen.',
      },
      { status: 400 },
    )
  }
  const insecureTls = body.insecureTls === true

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  const opts: FetchOpts = { insecureTls, signal: ac.signal }

  try {
    // v15 needs a username (Basic auth). Try it first when one is given;
    // fall back to the v14 session flow (password only) on any auth/route failure.
    let v15Err: number | null = null
    if (username) {
      const v15 = await tryV15(base, username, password, opts)
      if ('peers' in v15) {
        return Response.json({ peers: v15.peers, now: Date.now(), api: 'v15' } satisfies WgPayload)
      }
      v15Err = v15.error
    }

    const v14 = await tryV14(base, password, opts)
    if ('peers' in v14) {
      return Response.json({ peers: v14.peers, now: Date.now(), api: 'v14' } satisfies WgPayload)
    }

    // Both paths failed — report the most telling status.
    const status = v15Err ?? v14.error
    if (status === 401 || status === 403) {
      void logPluginApiFailure('wireguard', 'auth', 'auth_failed', { v15: v15Err, v14: v14.error })
      return Response.json(
        {
          error: 'auth_failed',
          detail: username
            ? 'Login abgelehnt — Benutzer/Passwort prüfen. Bei v15 muss 2FA für den API-Zugriff aus sein.'
            : 'Login abgelehnt — Passwort prüfen. Für wg-easy v15 zusätzlich den Benutzernamen eintragen.',
        },
        { status: 401 },
      )
    }
    void logPluginApiFailure('wireguard', 'upstream', 'bad_response', { v15: v15Err, v14: v14.error })
    const hint = username ? '' : ' Falls wg-easy v15: zusätzlich den Benutzernamen eintragen.'
    return Response.json(
      {
        error: 'upstream_error',
        detail: `wg-easy antwortet nicht wie erwartet (v15 HTTP ${v15Err ?? '—'}, v14 HTTP ${v14.error}). URL/Port (Standard 51821) prüfen.${hint}`,
      },
      { status: 502 },
    )
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('wireguard', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('wireguard', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('wireguard', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json(
      { error: 'network_error', detail: 'wg-easy nicht erreichbar — URL/Port prüfen (Standard 51821).' },
      { status: 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

async function handleWireguardPluginRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function wireguardServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleWireguardPluginRequest(ctx.request)
}
