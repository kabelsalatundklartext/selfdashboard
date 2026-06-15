import http from 'node:http'
import https from 'node:https'
import { createHmac } from 'node:crypto'
import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret, sealSecret } from '../_shared/secret-crypto'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const TIMEOUT_MS = 10_000
const MAX_BODY = 8 * 1024 * 1024
/** Token früher als das Lease-Ende erneuern, um Race-Conditions zu vermeiden. */
const TOKEN_MARGIN_MS = 60_000
const DEFAULT_LEASE_S = 3600
/** Lebensdauer des signierten Snapshot-Tokens (begrenzt Replay aus Logs/History). */
const SNAP_TOKEN_TTL_MS = 10 * 60 * 1000
/** Obergrenze für den In-Memory-Token-Cache → kein unbegrenztes Wachsen bei Credential-Wechseln. */
const MAX_TOKEN_CACHE = 16

/** Erlaubte PTZ-Operationen (Whitelist — verhindert beliebige Kamera-Kommandos). */
const PTZ_OPS = new Set([
  'Left', 'Right', 'Up', 'Down',
  'LeftUp', 'LeftDown', 'RightUp', 'RightDown',
  'ZoomInc', 'ZoomDec', 'FocusInc', 'FocusDec',
  'Stop', 'ToPos', 'Auto',
])

type Transport = { host: string; port: number; secure: boolean; insecure: boolean }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Nur private LAN-IPv4 erlauben — blockt Cloud-Metadaten & öffentliche Ziele (wie bambu-cam).
 * Alles außer RFC-1918-IPv4 (IPv6, Hostnamen, ::ffff:-gemappt) wird bewusst per Regex abgelehnt.
 */
function isPrivateHost(h: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h.trim())
  if (!m) return false
  const o = m.slice(1).map(Number)
  if (o.some((x) => x > 255)) return false
  if (o[0] === 10) return true
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true
  if (o[0] === 192 && o[1] === 168) return true
  return false
}

function parsePort(raw: unknown, secure: boolean): number {
  const n = num(raw)
  if (n >= 1 && n <= 65535) return Math.floor(n)
  return secure ? 443 : 80
}

/** Roher HTTP/HTTPS-Request (Node-Module) — Reolink nutzt selbstsigniertes TLS, das undici/fetch ablehnt. */
function rawRequest(
  t: Transport,
  opts: { method: string; path: string; body?: string; accept: string },
): Promise<{ status: number; body: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const mod = t.secure ? https : http
    const headers: Record<string, string> = { Accept: opts.accept }
    if (opts.body != null) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = String(Buffer.byteLength(opts.body))
    }
    const reqOpts: https.RequestOptions = {
      host: t.host,
      port: t.port,
      path: opts.path,
      method: opts.method,
      headers,
      timeout: TIMEOUT_MS,
    }
    if (t.secure) reqOpts.rejectUnauthorized = !t.insecure
    const req = mod.request(reqOpts, (res) => {
      const chunks: Buffer[] = []
      let total = 0
      res.on('data', (c: Buffer) => {
        total += c.length
        if (total > MAX_BODY + 1024) {
          req.destroy(new Error('response_too_large'))
          return
        }
        chunks.push(c)
      })
      res.on('end', () =>
        resolve({
          status: res.statusCode || 0,
          body: Buffer.concat(chunks),
          contentType: String(res.headers['content-type'] || ''),
        }),
      )
    })
    req.on('error', (e) => reject(e instanceof Error ? e : new Error('request_error')))
    req.on('timeout', () => req.destroy(new Error('timeout')))
    if (opts.body != null) req.write(opts.body)
    req.end()
  })
}

// ---- Token-Cache (modulweit, Best-Effort; Server ist langlebig) ----
const tokenCache = new Map<string, { token: string; expires: number }>()

/** Passwort fließt als kurzer HMAC in den Key ein → kein Token-Reuse über Widgets mit gleichem User aber anderem Passwort. */
function cacheKey(t: Transport, user: string, pass: string): string {
  const pw = createHmac('sha256', 'reolink-token-cache').update(pass).digest('hex').slice(0, 16)
  return `${t.secure ? 's' : ''}${t.host}:${t.port}|${user}|${pw}`
}

class ReolinkError extends Error {
  constructor(
    public detail: string,
    public rspCode: number,
    public status = 502,
  ) {
    super(detail)
    this.name = 'ReolinkError'
  }
}

/** Parst die Reolink-Antwort `[{cmd,code,value|error}]` und liefert das erste Element. */
function firstResult(buf: Buffer): Record<string, unknown> | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(buf.toString('utf8'))
  } catch {
    return null
  }
  const first = Array.isArray(parsed) ? parsed[0] : parsed
  return isObject(first) ? first : null
}

/** Kamera-Fehlertext: gekappt (kein DoS/Log-Injection durch riesige Bodies) und token-redigiert. */
function sanitizeDetail(s: string): string {
  return s.replace(/token[=:\s"]+[^\s",}]+/gi, 'token=[redacted]').slice(0, 256)
}

function errorDetail(result: Record<string, unknown> | null): string {
  if (result && isObject(result.error)) {
    const d = result.error.detail
    if (typeof d === 'string') return sanitizeDetail(d)
  }
  return ''
}

function rspCodeOf(result: Record<string, unknown> | null): number {
  if (result && isObject(result.error)) return num(result.error.rspCode)
  return 0
}

async function login(t: Transport, user: string, pass: string): Promise<{ token: string; expires: number }> {
  const body = JSON.stringify([
    { cmd: 'Login', action: 0, param: { User: { Version: '0', userName: user, password: pass } } },
  ])
  const res = await rawRequest(t, {
    method: 'POST',
    path: '/cgi-bin/api.cgi?cmd=Login',
    body,
    accept: 'application/json',
  })
  const result = firstResult(res.body)
  const value = result && isObject(result.value) ? result.value : null
  const tokenObj = value && isObject(value.Token) ? value.Token : null
  const name = tokenObj && typeof tokenObj.name === 'string' ? tokenObj.name : ''
  if (num(result?.code) !== 0 || !name) {
    const detail = errorDetail(result)
    const rsp = rspCodeOf(result)
    const auth = rsp === -6 || /password|user|login/i.test(detail)
    throw new ReolinkError(detail || `Login fehlgeschlagen (HTTP ${res.status}).`, rsp, auth ? 401 : 502)
  }
  const leaseS = num(tokenObj?.leaseTime) || DEFAULT_LEASE_S
  return { token: name, expires: Date.now() + leaseS * 1000 - TOKEN_MARGIN_MS }
}

async function getToken(t: Transport, user: string, pass: string, forceNew: boolean): Promise<string> {
  const key = cacheKey(t, user, pass)
  const cached = tokenCache.get(key)
  if (!forceNew && cached && cached.expires > Date.now()) return cached.token
  const fresh = await login(t, user, pass)
  // Ältesten Eintrag verdrängen, falls das Cache-Limit erreicht ist (Credential-Wechsel hinterlässt sonst Leichen).
  if (tokenCache.size >= MAX_TOKEN_CACHE) {
    const oldest = tokenCache.keys().next().value
    if (oldest) tokenCache.delete(oldest)
  }
  tokenCache.set(key, fresh)
  return fresh.token
}

function invalidateToken(t: Transport, user: string, pass: string): void {
  tokenCache.delete(cacheKey(t, user, pass))
}

/** Führt einen CGI-Befehl aus; bei Token-/Login-Fehler genau ein Re-Login-Versuch. */
async function apiCommand(
  t: Transport,
  user: string,
  pass: string,
  cmd: string,
  param: Record<string, unknown>,
): Promise<unknown> {
  let lastErr: ReolinkError | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(t, user, pass, attempt === 1)
    const body = JSON.stringify([{ cmd, action: 0, param }])
    const res = await rawRequest(t, {
      method: 'POST',
      path: `/cgi-bin/api.cgi?cmd=${encodeURIComponent(cmd)}&token=${encodeURIComponent(token)}`,
      body,
      accept: 'application/json',
    })
    const result = firstResult(res.body)
    if (num(result?.code) === 0) return result?.value
    const detail = errorDetail(result)
    const rsp = rspCodeOf(result)
    lastErr = new ReolinkError(detail || `${cmd} fehlgeschlagen (HTTP ${res.status}).`, rsp)
    // -6 = "login first" / Token abgelaufen → einmal neu einloggen
    if (attempt === 0 && (rsp === -6 || /login|token/i.test(detail))) {
      invalidateToken(t, user, pass)
      continue
    }
    break
  }
  throw lastErr ?? new ReolinkError(`${cmd} fehlgeschlagen.`, 0)
}

async function snapshot(t: Transport, user: string, pass: string, channel: number): Promise<Buffer> {
  let lastErr: ReolinkError | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(t, user, pass, attempt === 1)
    const rs = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
    const path = `/cgi-bin/api.cgi?cmd=Snap&channel=${channel}&rs=${rs}&token=${encodeURIComponent(token)}`
    const res = await rawRequest(t, { method: 'GET', path, accept: 'image/jpeg' })
    const b = res.body
    const isJpeg = b.length > 3 && b[0] === 0xff && b[1] === 0xd8
    if (res.contentType.includes('image') || isJpeg) return b
    // JPEG nicht erhalten → vermutlich JSON-Fehler (Token abgelaufen)
    const result = firstResult(b)
    const detail = errorDetail(result)
    lastErr = new ReolinkError(detail || `Snapshot fehlgeschlagen (HTTP ${res.status}).`, rspCodeOf(result))
    if (attempt === 0) {
      invalidateToken(t, user, pass)
      continue
    }
    break
  }
  throw lastErr ?? new ReolinkError('Snapshot fehlgeschlagen.', 0)
}

// ---- Normalisierung ----

function aiFlags(v: unknown): { people: boolean; vehicle: boolean; animal: boolean; supported: string[] } {
  const out = { people: false, vehicle: false, animal: false, supported: [] as string[] }
  if (!isObject(v)) return out
  const map: Array<[string, 'people' | 'vehicle' | 'animal']> = [
    ['people', 'people'],
    ['vehicle', 'vehicle'],
    ['dog_cat', 'animal'],
    ['animal', 'animal'],
  ]
  for (const [key, slot] of map) {
    const o = v[key]
    if (!isObject(o)) continue
    if (num(o.support) === 1 && !out.supported.includes(slot)) out.supported.push(slot)
    if (num(o.alarm_state) === 1) out[slot] = true
  }
  return out
}

function channelList(v: unknown): Array<{ channel: number; name: string; online: boolean }> {
  if (!isObject(v) || !Array.isArray(v.status)) return []
  return v.status
    .filter(isObject)
    .map((s) => ({
      channel: num(s.channel),
      name: typeof s.name === 'string' && s.name ? s.name : `CH${num(s.channel)}`,
      online: num(s.online) === 1,
    }))
}

// ---- Handler ----

type ReqBody = {
  action?: string
  host?: string
  port?: number | string
  secure?: boolean
  insecure?: boolean
  username?: string
  password?: string
  channel?: number | string
  op?: string
  speed?: number | string
  presetId?: number | string
}

/** Inhalt des verschlüsselten Snapshot-Tokens — ersetzt Credentials in der GET-URL. */
type SnapToken = { h: string; u: string; p: string; c: number; s: boolean; i: boolean; pt: number; exp: number }

function buildTransport(host: string, port: unknown, secure: boolean, insecure: boolean): Transport {
  return { host, port: parsePort(port, secure), secure, insecure }
}

function mapError(e: unknown, op: string): Response {
  if (e instanceof ReolinkError) {
    void logPluginApiFailure('reolink', op, 'reolink_error', { rspCode: e.rspCode, detail: e.detail })
    return Response.json(
      { error: e.status === 401 ? 'auth_failed' : 'upstream_error', detail: e.detail },
      { status: e.status },
    )
  }
  const msg = e instanceof Error ? e.message : String(e)
  const timeout = msg === 'timeout'
  void logPluginApiFailure('reolink', op, timeout ? 'timeout' : 'network_error', { message: msg })
  return Response.json(
    {
      error: timeout ? 'timeout' : 'network_error',
      detail: timeout
        ? 'Kamera antwortet nicht — IP/Port erreichbar?'
        : 'Kamera nicht erreichbar — IP/Port/HTTPS-Einstellung prüfen.',
    },
    { status: timeout ? 504 : 502 },
  )
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const host = String(body.host ?? '').trim()
  if (!isPrivateHost(host)) {
    return Response.json({ error: 'invalid_host', detail: 'Nur private LAN-IPv4 erlaubt.' }, { status: 400 })
  }
  const user = String(body.username ?? '').trim()
  const pass = openSealedSecret(String(body.password ?? '').trim())
  if (!user || !pass) {
    return Response.json(
      { error: 'missing_credentials', detail: 'Benutzer und Passwort in den Widget-Einstellungen eintragen.' },
      { status: 400 },
    )
  }
  const t = buildTransport(host, body.port, body.secure === true, body.insecure !== false)
  const channel = Math.max(0, Math.min(63, num(body.channel)))
  const action = String(body.action ?? 'status')

  try {
    if (action === 'snap-token') {
      // Opaker, verschlüsselter Token mit Ablauf — ersetzt das versiegelte Passwort in der Snapshot-GET-URL.
      const payload: SnapToken = {
        h: host,
        u: user,
        p: pass,
        c: channel,
        s: t.secure,
        i: t.insecure,
        pt: t.port,
        exp: Date.now() + SNAP_TOKEN_TTL_MS,
      }
      return Response.json({ token: sealSecret(JSON.stringify(payload)), ttlMs: SNAP_TOKEN_TTL_MS })
    }

    if (action === 'status') {
      let model = ''
      let name = ''
      let channelNum = 1
      try {
        const dev = await apiCommand(t, user, pass, 'GetDevInfo', {})
        const info = isObject(dev) && isObject(dev.DevInfo) ? dev.DevInfo : isObject(dev) ? dev : null
        if (info) {
          model = typeof info.model === 'string' ? info.model : ''
          name = typeof info.name === 'string' ? info.name : ''
          channelNum = Math.max(1, num(info.channelNum) || 1)
        }
      } catch {
        /* DevInfo optional */
      }
      let channels: Array<{ channel: number; name: string; online: boolean }> = []
      if (channelNum > 1) {
        try {
          channels = channelList(await apiCommand(t, user, pass, 'GetChannelstatus', {}))
        } catch {
          /* NVR-Status optional */
        }
      }
      const ai = aiFlags(await apiCommand(t, user, pass, 'GetAiState', { channel }).catch(() => null))
      let motion = false
      try {
        const md = await apiCommand(t, user, pass, 'GetMdState', { channel })
        motion = isObject(md) && num(md.state) === 1
      } catch {
        /* Motion optional */
      }
      return Response.json({ ok: true, model, name, channelNum, channels, ai, motion })
    }

    if (action === 'ptz') {
      const op = String(body.op ?? '')
      if (!PTZ_OPS.has(op)) return Response.json({ error: 'invalid_op' }, { status: 400 })
      const speed = Math.max(1, Math.min(64, num(body.speed) || 32))
      const param: Record<string, unknown> = { channel, op, speed }
      if (op === 'ToPos') param.id = Math.max(0, num(body.presetId))
      await apiCommand(t, user, pass, 'PtzCtrl', param)
      return Response.json({ ok: true })
    }

    if (action === 'presets') {
      const v = await apiCommand(t, user, pass, 'GetPtzPreset', { channel })
      const raw = isObject(v) && Array.isArray(v.PtzPreset) ? v.PtzPreset : []
      const presets = raw
        .filter(isObject)
        .filter((p) => num(p.enable) === 1)
        .map((p) => ({ id: num(p.id), name: typeof p.name === 'string' && p.name ? p.name : `Preset ${num(p.id)}` }))
      return Response.json({ ok: true, presets })
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })
  } catch (e) {
    return mapError(e, action)
  }
}

async function handleGet(req: Request): Promise<Response> {
  const sp = new URL(req.url).searchParams
  if (sp.get('action') !== 'snapshot') {
    return Response.json({ error: 'invalid_action' }, { status: 400 })
  }
  // Credentials kommen nicht mehr (versiegelt) in der URL, sondern in einem verschlüsselten,
  // kurzlebigen Token (per POST `snap-token` geholt) → kein Credential in Access-Logs/History.
  const raw = openSealedSecret(sp.get('tok') || '')
  let tok: SnapToken | null = null
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    if (isObject(parsed)) tok = parsed as SnapToken
  } catch {
    tok = null
  }
  if (!tok || typeof tok.exp !== 'number' || tok.exp < Date.now()) {
    return Response.json({ error: 'token_expired' }, { status: 401 })
  }
  const host = String(tok.h || '').trim()
  if (!isPrivateHost(host)) return Response.json({ error: 'invalid_host' }, { status: 400 })
  const user = String(tok.u || '').trim()
  const pass = String(tok.p || '')
  if (!user || !pass) return Response.json({ error: 'missing_credentials' }, { status: 400 })
  const t = buildTransport(host, tok.pt, tok.s === true, tok.i !== false)
  const channel = Math.max(0, Math.min(63, num(tok.c)))
  try {
    const jpeg = await snapshot(t, user, pass, channel)
    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store, max-age=0',
        // Token steckt im Query → nie als Referer weitergeben.
        'Referrer-Policy': 'no-referrer',
      },
    })
  } catch (e) {
    return mapError(e, 'snapshot')
  }
}

async function handleReolinkRequest(req: Request): Promise<Response> {
  if (req.method === 'GET') return handleGet(req)
  if (req.method === 'POST') return handlePost(req)
  return Response.json({ error: 'method_not_allowed' }, { status: 405 })
}

export default function reolinkServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleReolinkRequest(ctx.request)
}
