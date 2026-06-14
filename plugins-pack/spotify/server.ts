import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret, sealSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import { dataDir } from '../_shared/data-dir'
import type { PluginServerContext } from '../_shared/plugin-server-types'

import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes, createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'
const SCOPES = 'user-read-playback-state user-read-currently-playing user-modify-playback-state'
const FETCH_TIMEOUT_MS = 12_000
/** Refresh the access token a little before it actually expires. */
const TOKEN_SKEW_MS = 30_000

// ---------------------------------------------------------------------------
// Persistent token store — data/spotify/<key>.json. The refresh token never
// leaves the server: the widget only ever sends the client id as a lookup key.
// ---------------------------------------------------------------------------

type StoreFile = {
  clientId: string
  /** sealed (sdsec1:) */
  clientSecret: string
  /** sealed (sdsec1:) */
  refreshToken?: string
  /** sealed (sdsec1:) */
  accessToken?: string
  /** unix ms when accessToken expires */
  expiresAt?: number
  scope?: string
  displayName?: string
  /** 'premium' | 'free' | 'open' */
  product?: string
  /** anti-CSRF state for an in-flight authorization, `${key}.${rand}` */
  pendingState?: string
  /** exact redirect_uri used to start the flow (must match on token exchange) */
  redirectUri?: string
  updatedAt: string
}

function storeDir(): string {
  return join(dataDir(), 'spotify')
}

function storeKey(clientId: string): string {
  return createHash('sha256').update(clientId.trim()).digest('hex').slice(0, 24)
}

function storePath(key: string): string {
  return join(storeDir(), `${key}.json`)
}

async function readStore(key: string): Promise<StoreFile | null> {
  try {
    const raw = await readFile(storePath(key), 'utf8')
    const j = JSON.parse(raw) as StoreFile
    return j && typeof j === 'object' && typeof j.clientId === 'string' ? j : null
  } catch {
    return null
  }
}

async function writeStore(key: string, data: StoreFile): Promise<void> {
  await mkdir(storeDir(), { recursive: true })
  const path = storePath(key)
  const tmp = `${path}.tmp`
  data.updatedAt = new Date().toISOString()
  await writeFile(tmp, `${JSON.stringify(data)}\n`, 'utf8')
  await rename(tmp, path)
}

async function deleteStore(key: string): Promise<void> {
  try {
    await unlink(storePath(key))
  } catch {
    /* already gone */
  }
}

// ---------------------------------------------------------------------------
// Spotify HTTP helpers
// ---------------------------------------------------------------------------

type TokenResp = {
  access_token?: string
  token_type?: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  error?: string
  error_description?: string
}

function basicAuth(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`
}

async function tokenRequest(
  clientId: string,
  clientSecret: string,
  form: Record<string, string>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; body: TokenResp }> {
  const res = await fetchWithSsrfGuard(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(form).toString(),
    cache: 'no-store',
    signal,
  })
  const text = await res.text()
  let body: TokenResp = {}
  try {
    body = text ? (JSON.parse(text) as TokenResp) : {}
  } catch {
    body = {}
  }
  return { ok: res.ok, status: res.status, body }
}

/**
 * Returns a valid bearer token for the stored connection, refreshing in place
 * when the cached one has (nearly) expired. Throws a short error code on failure.
 */
async function ensureAccessToken(key: string, record: StoreFile, signal: AbortSignal): Promise<string> {
  const cached = record.accessToken ? openSealedSecret(record.accessToken) : ''
  if (cached && record.expiresAt && record.expiresAt - TOKEN_SKEW_MS > Date.now()) {
    return cached
  }
  const refresh = record.refreshToken ? openSealedSecret(record.refreshToken) : ''
  if (!refresh) throw new Error('not_connected')
  const secret = openSealedSecret(record.clientSecret)
  if (!secret) throw new Error('secret_unreadable')

  const { ok, body } = await tokenRequest(
    record.clientId,
    secret,
    { grant_type: 'refresh_token', refresh_token: refresh },
    signal,
  )
  if (!ok || !body.access_token) {
    // invalid_grant => the user revoked access; force a fresh connect.
    if (body.error === 'invalid_grant') throw new Error('reauth_required')
    throw new Error('refresh_failed')
  }
  record.accessToken = sealSecret(body.access_token)
  record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000
  if (body.refresh_token) record.refreshToken = sealSecret(body.refresh_token)
  if (body.scope) record.scope = body.scope
  await writeStore(key, record)
  return body.access_token
}

async function spotifyApi(
  token: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  signal: AbortSignal,
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetchWithSsrfGuard(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
  return { status: res.status, json, text }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ---------------------------------------------------------------------------
// Now-playing normalization
// ---------------------------------------------------------------------------

type NowPlaying = {
  connected: true
  playing: boolean
  hasTrack: boolean
  title?: string
  artist?: string
  album?: string
  imageUrl?: string
  durationMs?: number
  progressMs?: number
  shuffle?: boolean
  repeat?: string
  deviceName?: string
  trackUrl?: string
  product?: string
  premium: boolean
}

function pickImage(images: unknown): string | undefined {
  if (!Array.isArray(images)) return undefined
  // Spotify returns images largest-first; the mid one is plenty for a widget.
  const urls = images.filter(isObj).map((i) => (typeof i.url === 'string' ? i.url : '')).filter(Boolean)
  return urls[Math.min(1, urls.length - 1)] || urls[0]
}

function normalizePlayer(json: unknown, product: string | undefined): NowPlaying {
  const premium = product === 'premium'
  const base: NowPlaying = { connected: true, playing: false, hasTrack: false, product, premium }
  if (!isObj(json)) return base

  const item = isObj(json.item) ? json.item : null
  const device = isObj(json.device) ? json.device : null
  base.playing = json.is_playing === true
  base.progressMs = typeof json.progress_ms === 'number' ? json.progress_ms : undefined
  base.shuffle = json.shuffle_state === true
  base.repeat = typeof json.repeat_state === 'string' ? json.repeat_state : undefined
  if (device && typeof device.name === 'string') base.deviceName = device.name

  if (item) {
    base.hasTrack = true
    if (typeof item.name === 'string') base.title = item.name
    if (typeof item.duration_ms === 'number') base.durationMs = item.duration_ms
    const artists = Array.isArray(item.artists) ? item.artists : []
    base.artist = artists
      .filter(isObj)
      .map((a) => (typeof a.name === 'string' ? a.name : ''))
      .filter(Boolean)
      .join(', ')
    const album = isObj(item.album) ? item.album : null
    if (album) {
      if (typeof album.name === 'string') base.album = album.name
      base.imageUrl = pickImage(album.images)
    }
    const urls = isObj(item.external_urls) ? item.external_urls : null
    if (urls && typeof urls.spotify === 'string') base.trackUrl = urls.spotify
  }
  return base
}

// ---------------------------------------------------------------------------
// Request actions (POST /api/plugins/spotify)
// ---------------------------------------------------------------------------

type ReqBody = {
  action?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  command?: string
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data as Record<string, unknown>, { status })
}

async function handleBegin(body: ReqBody): Promise<Response> {
  const clientId = String(body.clientId ?? '').trim()
  const secret = openSealedSecret(String(body.clientSecret ?? '').trim())
  const redirectUri = String(body.redirectUri ?? '').trim()
  if (!clientId || !secret) return jsonResponse({ error: 'missing_credentials' }, 400)
  if (!/^https?:\/\//i.test(redirectUri)) return jsonResponse({ error: 'invalid_redirect' }, 400)

  const key = storeKey(clientId)
  const state = `${key}.${randomBytes(16).toString('hex')}`
  await writeStore(key, {
    clientId,
    clientSecret: sealSecret(secret),
    pendingState: state,
    redirectUri,
    updatedAt: '',
  })

  const authUrl = `${AUTH_URL}?${new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    show_dialog: 'true',
  }).toString()}`
  return jsonResponse({ authUrl })
}

async function handleStatus(body: ReqBody): Promise<Response> {
  const clientId = String(body.clientId ?? '').trim()
  if (!clientId) return jsonResponse({ connected: false })
  const record = await readStore(storeKey(clientId))
  return jsonResponse({
    connected: Boolean(record?.refreshToken),
    displayName: record?.displayName,
    product: record?.product,
    scope: record?.scope,
  })
}

async function handleDisconnect(body: ReqBody): Promise<Response> {
  const clientId = String(body.clientId ?? '').trim()
  if (clientId) await deleteStore(storeKey(clientId))
  return jsonResponse({ ok: true })
}

async function handleState(body: ReqBody, signal: AbortSignal): Promise<Response> {
  const clientId = String(body.clientId ?? '').trim()
  if (!clientId) return jsonResponse({ connected: false })
  const key = storeKey(clientId)
  const record = await readStore(key)
  if (!record?.refreshToken) return jsonResponse({ connected: false })

  const token = await ensureAccessToken(key, record, signal)

  // Full player state (incl. device, shuffle, repeat).
  const player = await spotifyApi(token, '/me/player?additional_types=track,episode', 'GET', signal)
  if (player.status === 401) throw new Error('reauth_required')
  if (player.status !== 204 && player.status >= 400) {
    return jsonResponse({ error: 'api_error', status: player.status }, 502)
  }
  if (player.status !== 204 && isObj(player.json) && player.json.item != null) {
    return jsonResponse(normalizePlayer(player.json, record.product))
  }

  // /me/player returns 204 for some sessions (notably the web player) even
  // while playing — fall back to the more lenient currently-playing endpoint.
  const cur = await spotifyApi(token, '/me/player/currently-playing?additional_types=track,episode', 'GET', signal)
  if (cur.status === 401) throw new Error('reauth_required')
  if (cur.status !== 204 && isObj(cur.json) && cur.json.item != null) {
    return jsonResponse(normalizePlayer(cur.json, record.product))
  }

  // Genuinely nothing playing on any device.
  return jsonResponse({
    connected: true,
    playing: false,
    hasTrack: false,
    premium: record.product === 'premium',
    product: record.product,
  } satisfies NowPlaying)
}

const CONTROL_ROUTES: Record<string, { method: 'PUT' | 'POST'; path: string }> = {
  play: { method: 'PUT', path: '/me/player/play' },
  pause: { method: 'PUT', path: '/me/player/pause' },
  next: { method: 'POST', path: '/me/player/next' },
  previous: { method: 'POST', path: '/me/player/previous' },
}

async function handleControl(body: ReqBody, signal: AbortSignal): Promise<Response> {
  const clientId = String(body.clientId ?? '').trim()
  const command = String(body.command ?? '').trim()
  const route = CONTROL_ROUTES[command]
  if (!clientId) return jsonResponse({ error: 'missing_credentials' }, 400)
  if (!route) return jsonResponse({ error: 'invalid_command' }, 400)

  const key = storeKey(clientId)
  const record = await readStore(key)
  if (!record?.refreshToken) return jsonResponse({ error: 'not_connected' }, 400)

  const token = await ensureAccessToken(key, record, signal)
  const res = await spotifyApi(token, route.path, route.method, signal)
  if (res.status === 401) throw new Error('reauth_required')
  if (res.status === 403) return jsonResponse({ error: 'forbidden', detail: 'premium_required' }, 403)
  if (res.status === 404) return jsonResponse({ error: 'no_active_device' }, 404)
  if (res.status >= 400) return jsonResponse({ error: 'api_error', status: res.status }, 502)
  return jsonResponse({ ok: true })
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  const action = String(body.action ?? 'state')
  try {
    switch (action) {
      case 'begin':
        return await handleBegin(body)
      case 'status':
        return await handleStatus(body)
      case 'disconnect':
        return await handleDisconnect(body)
      case 'control':
        return await handleControl(body, ac.signal)
      case 'state':
      case 'now-playing':
        return await handleState(body, ac.signal)
      default:
        return jsonResponse({ error: 'invalid_action' }, 400)
    }
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('spotify', action, `blocked_url:${e.message}`)
      return jsonResponse({ error: 'blocked_url', detail: e.message }, 400)
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'reauth_required' || msg === 'refresh_failed' || msg === 'not_connected' || msg === 'secret_unreadable') {
      void logPluginApiFailure('spotify', action, msg)
      return jsonResponse({ error: msg }, 401)
    }
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('spotify', action, aborted ? 'timeout' : msg)
    return jsonResponse({ error: aborted ? 'timeout' : 'fetch_failed', detail: msg }, aborted ? 504 : 502)
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// OAuth callback (GET /api/plugins/spotify/callback)
// ---------------------------------------------------------------------------

function htmlPage(title: string, message: string, ok: boolean): Response {
  const color = ok ? '#1db954' : '#ef4444'
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;max-width:420px;padding:32px">
<div style="font-size:48px;margin-bottom:16px">${ok ? '✅' : '⚠️'}</div>
<h1 style="font-size:20px;margin:0 0 8px;color:${color}">${title}</h1>
<p style="font-size:14px;line-height:1.5;color:#b3b3b3;margin:0">${message}</p>
</div>
<script>setTimeout(function(){try{window.close()}catch(e){}},${ok ? 1500 : 4000})</script>
</body></html>`
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function handleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const code = url.searchParams.get('code') ?? ''
  const state = url.searchParams.get('state') ?? ''
  const oauthError = url.searchParams.get('error')

  if (oauthError) {
    return htmlPage('Verbindung abgebrochen', `Spotify meldete: ${oauthError}. Du kannst das Fenster schließen.`, false)
  }
  if (!code || !state || !state.includes('.')) {
    return htmlPage('Ungültige Antwort', 'Es fehlen Parameter (code/state). Bitte erneut verbinden.', false)
  }

  const key = state.split('.', 1)[0] ?? ''
  const record = await readStore(key)
  if (!record || record.pendingState !== state || !record.redirectUri) {
    void logPluginApiFailure('spotify', 'callback', 'state_mismatch')
    return htmlPage('Sicherheitsprüfung fehlgeschlagen', 'Der State stimmt nicht überein. Bitte starte die Verbindung neu.', false)
  }

  const secret = openSealedSecret(record.clientSecret)
  if (!secret) return htmlPage('Fehler', 'Client Secret konnte nicht gelesen werden.', false)

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const { ok, body } = await tokenRequest(
      record.clientId,
      secret,
      { grant_type: 'authorization_code', code, redirect_uri: record.redirectUri },
      ac.signal,
    )
    if (!ok || !body.access_token || !body.refresh_token) {
      void logPluginApiFailure('spotify', 'callback', body.error || 'token_exchange_failed', {
        detail: body.error_description,
      })
      return htmlPage(
        'Token-Austausch fehlgeschlagen',
        `${body.error_description || body.error || 'Unbekannter Fehler'}. Redirect-URI in der Spotify-App prüfen.`,
        false,
      )
    }

    record.refreshToken = sealSecret(body.refresh_token)
    record.accessToken = sealSecret(body.access_token)
    record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000
    record.scope = body.scope
    record.pendingState = undefined

    // Best-effort profile lookup for a friendly status line.
    try {
      const me = await spotifyApi(body.access_token, '/me', 'GET', ac.signal)
      if (isObj(me.json)) {
        if (typeof me.json.display_name === 'string') record.displayName = me.json.display_name
        if (typeof me.json.product === 'string') record.product = me.json.product
      }
    } catch {
      /* non-fatal */
    }

    await writeStore(key, record)
    const who = record.displayName ? ` als ${record.displayName}` : ''
    return htmlPage('Spotify verbunden', `Erfolgreich verbunden${who}. Dieses Fenster schließt sich automatisch.`, true)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    void logPluginApiFailure('spotify', 'callback', msg)
    return htmlPage('Verbindung fehlgeschlagen', 'Spotify war nicht erreichbar. Bitte erneut versuchen.', false)
  } finally {
    clearTimeout(timer)
  }
}

export default function spotifyServerHandler(ctx: PluginServerContext): Promise<Response> {
  if (ctx.path[0] === 'callback') return handleCallback(ctx.request)
  if (ctx.request.method !== 'POST') {
    return Promise.resolve(jsonResponse({ error: 'method_not_allowed' }, 405))
  }
  return handlePost(ctx.request)
}
