import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret, sealSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import { dataDir } from '../_shared/data-dir'
import type { PluginServerContext } from '../_shared/plugin-server-types'

import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes, createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Google Smart Device Management (SDM) — the only *official* way to read and
// control Google Nest devices. Unlike a generic "Google Home" API (which does
// not exist for third-party apps), SDM exposes Nest thermostats, cameras,
// doorbells and displays. Auth is a Google OAuth flow gated through the Device
// Access "partner connection" page; the API itself is a normal REST service.
//
//   Auth (partner connection):  https://nestservices.google.com/partnerconnections/{projectId}/auth
//   Token exchange/refresh:     https://oauth2.googleapis.com/token
//   API base:                   https://smartdevicemanagement.googleapis.com/v1
//
// The refresh token never leaves the server — the widget only ever sends the
// (non-secret) projectId + clientId pair as a lookup key.
// ---------------------------------------------------------------------------

const AUTH_BASE = 'https://nestservices.google.com/partnerconnections'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SDM_API = 'https://smartdevicemanagement.googleapis.com/v1'
const SCOPE = 'https://www.googleapis.com/auth/sdm.service'
const FETCH_TIMEOUT_MS = 12_000
/** Refresh the access token a little before it actually expires. */
const TOKEN_SKEW_MS = 30_000

type StoreFile = {
  projectId: string
  clientId: string
  /** sealed (sdsec1:) */
  clientSecret: string
  /** sealed (sdsec1:) */
  refreshToken?: string
  /** sealed (sdsec1:) */
  accessToken?: string
  /** unix ms when accessToken expires */
  expiresAt?: number
  /** anti-CSRF state for an in-flight authorization, `${key}.${rand}` */
  pendingState?: string
  /** exact redirect_uri used to start the flow (must match on token exchange) */
  redirectUri?: string
  /** last known device count, for a friendly status line */
  deviceCount?: number
  updatedAt: string
}

function storeDir(): string {
  return join(dataDir(), 'google-home')
}

/** Lookup key derived from the non-secret Project ID + Client ID pair. */
function storeKey(projectId: string, clientId: string): string {
  return createHash('sha256').update(`${projectId.trim()}:${clientId.trim()}`).digest('hex').slice(0, 24)
}

function storePath(key: string): string {
  return join(storeDir(), `${key}.json`)
}

async function readStore(key: string): Promise<StoreFile | null> {
  try {
    const raw = await readFile(storePath(key), 'utf8')
    const j = JSON.parse(raw) as StoreFile
    return j && typeof j === 'object' && typeof j.projectId === 'string' ? j : null
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
// Google OAuth helpers
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

async function tokenRequest(
  form: Record<string, string>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; body: TokenResp }> {
  const res = await fetchWithSsrfGuard(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
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

  const { body } = await tokenRequest(
    {
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: record.clientId,
      client_secret: secret,
    },
    signal,
  )
  if (!body.access_token) {
    // invalid_grant => the user revoked access; force a fresh connect.
    if (body.error === 'invalid_grant') throw new Error('reauth_required')
    throw new Error('refresh_failed')
  }
  record.accessToken = sealSecret(body.access_token)
  record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000
  if (body.refresh_token) record.refreshToken = sealSecret(body.refresh_token)
  await writeStore(key, record)
  return body.access_token
}

async function sdmApi(
  token: string,
  path: string,
  method: 'GET' | 'POST',
  signal: AbortSignal,
  jsonBody?: unknown,
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetchWithSsrfGuard(`${SDM_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(jsonBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
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

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

/** Pull Google's human-readable error message out of an error body. */
function sdmErrorDetail(json: unknown, text: string): string {
  if (isObj(json) && isObj(json.error) && typeof json.error.message === 'string') {
    return json.error.message
  }
  return text.slice(0, 200)
}

// ---------------------------------------------------------------------------
// Device normalization — collapse the verbose SDM trait map into a flat shape
// the widget can render directly.
// ---------------------------------------------------------------------------

const TRAIT = {
  info: 'sdm.devices.traits.Info',
  connectivity: 'sdm.devices.traits.Connectivity',
  temperature: 'sdm.devices.traits.Temperature',
  humidity: 'sdm.devices.traits.Humidity',
  setpoint: 'sdm.devices.traits.ThermostatTemperatureSetpoint',
  mode: 'sdm.devices.traits.ThermostatMode',
  hvac: 'sdm.devices.traits.ThermostatHvac',
} as const

type NormalDevice = {
  /** full SDM resource name: enterprises/{projectId}/devices/{id} */
  name: string
  /** short type, e.g. THERMOSTAT, CAMERA, DOORBELL, DISPLAY */
  type: string
  label: string
  room?: string
  online?: boolean
  isThermostat: boolean
  ambientC?: number
  humidity?: number
  heatC?: number
  coolC?: number
  mode?: string
  availableModes?: string[]
  hvac?: string
}

function shortType(type: string): string {
  const i = type.lastIndexOf('.')
  return i >= 0 ? type.slice(i + 1) : type
}

function roomName(device: Record<string, unknown>): string | undefined {
  const rel = device.parentRelations
  if (!Array.isArray(rel)) return undefined
  for (const r of rel) {
    if (isObj(r) && typeof r.displayName === 'string' && r.displayName.trim()) return r.displayName.trim()
  }
  return undefined
}

function normalizeDevice(device: unknown): NormalDevice | null {
  if (!isObj(device) || typeof device.name !== 'string') return null
  const traits = isObj(device.traits) ? device.traits : {}
  const type = shortType(str(device.type))
  const info = isObj(traits[TRAIT.info]) ? (traits[TRAIT.info] as Record<string, unknown>) : null
  const customName = info && typeof info.customName === 'string' ? info.customName.trim() : ''

  const conn = isObj(traits[TRAIT.connectivity]) ? (traits[TRAIT.connectivity] as Record<string, unknown>) : null
  const online = conn ? str(conn.status).toUpperCase() === 'ONLINE' : undefined

  const tempTrait = isObj(traits[TRAIT.temperature]) ? (traits[TRAIT.temperature] as Record<string, unknown>) : null
  const humTrait = isObj(traits[TRAIT.humidity]) ? (traits[TRAIT.humidity] as Record<string, unknown>) : null
  const spTrait = isObj(traits[TRAIT.setpoint]) ? (traits[TRAIT.setpoint] as Record<string, unknown>) : null
  const modeTrait = isObj(traits[TRAIT.mode]) ? (traits[TRAIT.mode] as Record<string, unknown>) : null
  const hvacTrait = isObj(traits[TRAIT.hvac]) ? (traits[TRAIT.hvac] as Record<string, unknown>) : null

  const isThermostat = Boolean(modeTrait || spTrait) || type === 'THERMOSTAT'
  const room = roomName(device)
  const label = customName || room || (type ? type.charAt(0) + type.slice(1).toLowerCase() : 'Gerät')

  const availableModes = modeTrait && Array.isArray(modeTrait.availableModes)
    ? modeTrait.availableModes.filter((m): m is string => typeof m === 'string')
    : undefined

  return {
    name: device.name,
    type,
    label,
    room,
    online,
    isThermostat,
    ambientC: tempTrait ? num(tempTrait.ambientTemperatureCelsius) : undefined,
    humidity: humTrait ? num(humTrait.ambientHumidityPercent) : undefined,
    heatC: spTrait ? num(spTrait.heatCelsius) : undefined,
    coolC: spTrait ? num(spTrait.coolCelsius) : undefined,
    mode: modeTrait ? str(modeTrait.mode) || undefined : undefined,
    availableModes,
    hvac: hvacTrait ? str(hvacTrait.status) || undefined : undefined,
  }
}

function normalizeDevices(json: unknown): NormalDevice[] {
  if (!isObj(json) || !Array.isArray(json.devices)) return []
  return json.devices.map(normalizeDevice).filter((d): d is NormalDevice => d !== null)
}

// ---------------------------------------------------------------------------
// Request actions (POST /api/plugins/google-home)
// ---------------------------------------------------------------------------

type ReqBody = {
  action?: string
  projectId?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  device?: string
  command?: string
  params?: Record<string, unknown>
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data as Record<string, unknown>, { status })
}

async function handleBegin(body: ReqBody): Promise<Response> {
  const projectId = str(body.projectId)
  const clientId = str(body.clientId)
  const secret = openSealedSecret(str(body.clientSecret)) || str(body.clientSecret)
  const redirectUri = str(body.redirectUri)
  if (!projectId || !clientId || !secret) return jsonResponse({ error: 'missing_credentials' }, 400)
  if (!/^[a-z0-9-]{6,}$/i.test(projectId)) return jsonResponse({ error: 'invalid_project' }, 400)
  if (!/^https?:\/\//i.test(redirectUri)) return jsonResponse({ error: 'invalid_redirect' }, 400)

  const key = storeKey(projectId, clientId)
  const state = `${key}.${randomBytes(16).toString('hex')}`
  await writeStore(key, {
    projectId,
    clientId,
    clientSecret: sealSecret(secret),
    pendingState: state,
    redirectUri,
    updatedAt: '',
  })

  const authUrl = `${AUTH_BASE}/${encodeURIComponent(projectId)}/auth?${new URLSearchParams({
    redirect_uri: redirectUri,
    access_type: 'offline',
    prompt: 'consent',
    client_id: clientId,
    response_type: 'code',
    scope: SCOPE,
    state,
  }).toString()}`
  return jsonResponse({ authUrl })
}

async function handleStatus(body: ReqBody): Promise<Response> {
  const projectId = str(body.projectId)
  const clientId = str(body.clientId)
  if (!projectId || !clientId) return jsonResponse({ connected: false })
  const record = await readStore(storeKey(projectId, clientId))
  return jsonResponse({ connected: Boolean(record?.refreshToken), deviceCount: record?.deviceCount })
}

async function handleDisconnect(body: ReqBody): Promise<Response> {
  const projectId = str(body.projectId)
  const clientId = str(body.clientId)
  if (projectId && clientId) await deleteStore(storeKey(projectId, clientId))
  return jsonResponse({ ok: true })
}

async function handleDevices(body: ReqBody, signal: AbortSignal): Promise<Response> {
  const projectId = str(body.projectId)
  const clientId = str(body.clientId)
  if (!projectId || !clientId) return jsonResponse({ connected: false })
  const key = storeKey(projectId, clientId)
  const record = await readStore(key)
  if (!record?.refreshToken) return jsonResponse({ connected: false })

  const token = await ensureAccessToken(key, record, signal)
  const res = await sdmApi(token, `/enterprises/${encodeURIComponent(projectId)}/devices`, 'GET', signal)
  if (res.status === 401) throw new Error('reauth_required')
  if (res.status >= 400) {
    const detail = sdmErrorDetail(res.json, res.text)
    void logPluginApiFailure('google-home', 'devices', 'api_error', { status: res.status, detail })
    return jsonResponse({ connected: true, error: 'api_error', status: res.status, detail }, 502)
  }

  const devices = normalizeDevices(res.json)
  if (record.deviceCount !== devices.length) {
    record.deviceCount = devices.length
    void writeStore(key, record)
  }
  return jsonResponse({ connected: true, devices })
}

/**
 * Whitelisted thermostat commands. Locking the command set down means the
 * widget can never coerce the server into firing an arbitrary SDM command.
 */
const ALLOWED_COMMANDS: Record<string, (p: Record<string, unknown>) => Record<string, unknown> | null> = {
  'sdm.devices.commands.ThermostatMode.SetMode': (p) => {
    const mode = str(p.mode).toUpperCase()
    return ['HEAT', 'COOL', 'HEATCOOL', 'OFF'].includes(mode) ? { mode } : null
  },
  'sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat': (p) => {
    const heatCelsius = num(p.heatCelsius)
    return heatCelsius !== undefined && heatCelsius >= 5 && heatCelsius <= 35 ? { heatCelsius } : null
  },
  'sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool': (p) => {
    const coolCelsius = num(p.coolCelsius)
    return coolCelsius !== undefined && coolCelsius >= 5 && coolCelsius <= 35 ? { coolCelsius } : null
  },
}

async function handleCommand(body: ReqBody, signal: AbortSignal): Promise<Response> {
  const projectId = str(body.projectId)
  const clientId = str(body.clientId)
  const device = str(body.device)
  const command = str(body.command)
  if (!projectId || !clientId) return jsonResponse({ error: 'missing_credentials' }, 400)

  const validate = ALLOWED_COMMANDS[command]
  if (!validate) return jsonResponse({ error: 'invalid_command' }, 400)
  const params = validate(isObj(body.params) ? body.params : {})
  if (!params) return jsonResponse({ error: 'invalid_params' }, 400)

  const key = storeKey(projectId, clientId)
  const record = await readStore(key)
  if (!record?.refreshToken) return jsonResponse({ error: 'not_connected' }, 400)

  // The device must belong to *this stored project* — derive the prefix from the
  // record, never from caller-supplied input — and the device id must be a plain
  // SDM identifier (no slashes / traversal). Both halves are then re-encoded.
  const prefix = `enterprises/${record.projectId}/devices/`
  if (!device.startsWith(prefix)) return jsonResponse({ error: 'invalid_device' }, 400)
  const deviceId = device.slice(prefix.length)
  if (!/^[A-Za-z0-9_-]+$/.test(deviceId)) return jsonResponse({ error: 'invalid_device' }, 400)

  const token = await ensureAccessToken(key, record, signal)
  const apiPath = `/enterprises/${encodeURIComponent(record.projectId)}/devices/${encodeURIComponent(deviceId)}:executeCommand`
  const res = await sdmApi(token, apiPath, 'POST', signal, { command, params })
  if (res.status === 401) throw new Error('reauth_required')
  if (res.status >= 400) {
    const detail = sdmErrorDetail(res.json, res.text)
    void logPluginApiFailure('google-home', 'command', 'api_error', { status: res.status, detail })
    return jsonResponse({ error: 'api_error', status: res.status, detail }, 502)
  }
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
  const action = str(body.action) || 'devices'
  try {
    switch (action) {
      case 'begin':
        return await handleBegin(body)
      case 'status':
        return await handleStatus(body)
      case 'disconnect':
        return await handleDisconnect(body)
      case 'command':
        return await handleCommand(body, ac.signal)
      case 'devices':
      case 'state':
        return await handleDevices(body, ac.signal)
      default:
        return jsonResponse({ error: 'invalid_action' }, 400)
    }
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('google-home', action, `blocked_url:${e.message}`)
      return jsonResponse({ error: 'blocked_url', detail: e.message }, 400)
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'reauth_required' || msg === 'refresh_failed' || msg === 'not_connected' || msg === 'secret_unreadable') {
      void logPluginApiFailure('google-home', action, msg)
      return jsonResponse({ error: msg }, 401)
    }
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('google-home', action, aborted ? 'timeout' : msg)
    return jsonResponse({ error: aborted ? 'timeout' : 'fetch_failed', detail: msg }, aborted ? 504 : 502)
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// OAuth callback (GET /api/plugins/google-home/callback)
// ---------------------------------------------------------------------------

/** Escape any value interpolated into the callback HTML page (reflected XSS guard). */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function htmlPage(title: string, message: string, ok: boolean): Response {
  const color = ok ? '#34a853' : '#ef4444'
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;max-width:420px;padding:32px">
<div style="font-size:48px;margin-bottom:16px">${ok ? '✅' : '⚠️'}</div>
<h1 style="font-size:20px;margin:0 0 8px;color:${color}">${esc(title)}</h1>
<p style="font-size:14px;line-height:1.5;color:#b3b3b3;margin:0">${esc(message)}</p>
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
    return htmlPage('Verbindung abgebrochen', `Google meldete: ${oauthError}. Du kannst das Fenster schließen.`, false)
  }
  if (!code || !state || !state.includes('.')) {
    return htmlPage('Ungültige Antwort', 'Es fehlen Parameter (code/state). Bitte erneut verbinden.', false)
  }

  const key = state.split('.', 1)[0] ?? ''
  const record = await readStore(key)
  if (!record || record.pendingState !== state || !record.redirectUri) {
    void logPluginApiFailure('google-home', 'callback', 'state_mismatch')
    return htmlPage('Sicherheitsprüfung fehlgeschlagen', 'Der State stimmt nicht überein. Bitte starte die Verbindung neu.', false)
  }

  const secret = openSealedSecret(record.clientSecret)
  if (!secret) return htmlPage('Fehler', 'Client Secret konnte nicht gelesen werden.', false)

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const { body } = await tokenRequest(
      {
        grant_type: 'authorization_code',
        code,
        client_id: record.clientId,
        client_secret: secret,
        redirect_uri: record.redirectUri,
      },
      ac.signal,
    )
    if (!body.access_token || !body.refresh_token) {
      void logPluginApiFailure('google-home', 'callback', body.error || 'token_exchange_failed', {
        detail: body.error_description,
      })
      return htmlPage(
        'Token-Austausch fehlgeschlagen',
        `${body.error_description || body.error || 'Unbekannter Fehler'}. Redirect-URI / OAuth-Client in Google Cloud prüfen.`,
        false,
      )
    }

    record.refreshToken = sealSecret(body.refresh_token)
    record.accessToken = sealSecret(body.access_token)
    record.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000
    record.pendingState = undefined

    // Best-effort device count for a friendly status line.
    try {
      const list = await sdmApi(
        body.access_token,
        `/enterprises/${encodeURIComponent(record.projectId)}/devices`,
        'GET',
        ac.signal,
      )
      if (isObj(list.json) && Array.isArray(list.json.devices)) record.deviceCount = list.json.devices.length
    } catch {
      /* non-fatal */
    }

    await writeStore(key, record)
    const count = typeof record.deviceCount === 'number' ? ` ${record.deviceCount} Gerät(e) gefunden.` : ''
    return htmlPage('Google Nest verbunden', `Erfolgreich verbunden.${count} Dieses Fenster schließt sich automatisch.`, true)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    void logPluginApiFailure('google-home', 'callback', msg)
    return htmlPage('Verbindung fehlgeschlagen', 'Google war nicht erreichbar. Bitte erneut versuchen.', false)
  } finally {
    clearTimeout(timer)
  }
}

export default function googleHomeServerHandler(ctx: PluginServerContext): Promise<Response> {
  if (ctx.path[0] === 'callback') return handleCallback(ctx.request)
  if (ctx.request.method !== 'POST') {
    return Promise.resolve(jsonResponse({ error: 'method_not_allowed' }, 405))
  }
  return handlePost(ctx.request)
}
