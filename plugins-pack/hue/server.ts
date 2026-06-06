import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 10_000

type ReqBody = {
  url?: string
  apiKey?: string
  action?: 'state' | 'set' | 'pair'
  target?: 'group' | 'light'
  id?: string
  on?: boolean
  /** Brightness 1–254 (Hue scale). */
  bri?: number
  /** Colour as #rrggbb — converted to xy server-side. */
  hex?: string
}

type HueLamp = {
  id: string
  name: string
  on: boolean
  /** 0–100 %, null when unknown. */
  brightness: number | null
  reachable: boolean
  kind?: string
  /** true when the lamp/room supports colour (xy). */
  hasColor: boolean
  /** Approx. current colour as #rrggbb (for the swatch), null when none. */
  color: string | null
}

/** hex #rrggbb → Hue xy (CIE). */
function hexToXy(hex: string): [number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const intval = parseInt(m[1], 16)
  const gamma = (c: number) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92)
  const r = gamma(((intval >> 16) & 255) / 255)
  const g = gamma(((intval >> 8) & 255) / 255)
  const b = gamma((intval & 255) / 255)
  const X = r * 0.4124 + g * 0.3576 + b * 0.1805
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const Z = r * 0.0193 + g * 0.1192 + b * 0.9505
  const sum = X + Y + Z
  if (sum === 0) return [0.3127, 0.329]
  return [Number((X / sum).toFixed(4)), Number((Y / sum).toFixed(4))]
}

/** Hue xy → approx. #rrggbb for display. */
function xyToHex(xy: unknown): string | null {
  if (!Array.isArray(xy) || xy.length < 2) return null
  const x = Number(xy[0])
  const y = Number(xy[1])
  if (!Number.isFinite(x) || !Number.isFinite(y) || y === 0) return null
  const z = 1 - x - y
  const Y = 1
  const X = (Y / y) * x
  const Z = (Y / y) * z
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153
  const max = Math.max(r, g, b)
  if (max > 1) {
    r /= max
    g /= max
    b /= max
  }
  const rev = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
  const cl = (c: number) => Math.max(0, Math.min(255, Math.round(rev(Math.max(0, c)) * 255)))
  return '#' + [cl(r), cl(g), cl(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

/** Hue bri (1–254) → percent (0–100). */
function briToPct(bri: unknown): number | null {
  const n = typeof bri === 'number' ? bri : Number(bri)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round((n / 254) * 100)))
}

/** percent (0–100) → Hue bri (1–254). */
function pctToBri(pct: number): number {
  return Math.max(1, Math.min(254, Math.round((pct / 100) * 254)))
}

function normalizeBridge(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.pathname = ''
  u.search = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

/** Hue returns [{error:{...}}] arrays on auth/other failures. */
function hueError(json: unknown): string | null {
  if (Array.isArray(json) && json.length > 0 && isObject(json[0]) && isObject(json[0].error)) {
    const e = json[0].error as Record<string, unknown>
    const type = Number(e.type)
    if (type === 1) return 'auth_failed' // unauthorized user
    if (type === 101) return 'link_button' // link button not pressed
    return str(e.description) || 'hue_error'
  }
  return null
}

async function hueFetch(
  url: string,
  init: { method?: string; body?: string },
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetchWithSsrfGuard(url, {
    method: init.method ?? 'GET',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init.body,
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
  return { ok: res.ok, status: res.status, json }
}

function supportsColor(type: string, state: Record<string, unknown>): boolean {
  if ('xy' in state) return true
  return /color/i.test(type) && !/temperature/i.test(type)
}

function mapLights(obj: unknown): HueLamp[] {
  if (!isObject(obj)) return []
  const out: HueLamp[] = []
  for (const [id, raw] of Object.entries(obj)) {
    if (!isObject(raw)) continue
    const state = isObject(raw.state) ? raw.state : {}
    const type = str(raw.type)
    const hasColor = supportsColor(type, state)
    out.push({
      id,
      name: str(raw.name) || `Lampe ${id}`,
      on: state.on === true,
      brightness: briToPct(state.bri),
      reachable: state.reachable !== false,
      kind: type || undefined,
      hasColor,
      color: hasColor ? xyToHex(state.xy) : null,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function mapGroups(obj: unknown): HueLamp[] {
  if (!isObject(obj)) return []
  const out: HueLamp[] = []
  for (const [id, raw] of Object.entries(obj)) {
    if (!isObject(raw)) continue
    // Nur echte Räume/Zonen (keine Hue-internen Sondergruppen ohne Lampen).
    const lights = Array.isArray(raw.lights) ? raw.lights : []
    const type = str(raw.type)
    if (lights.length === 0 && type !== 'Room' && type !== 'Zone') continue
    const state = isObject(raw.state) ? raw.state : {}
    const action = isObject(raw.action) ? raw.action : {}
    const hasColor = 'xy' in action
    out.push({
      id,
      name: str(raw.name) || `Gruppe ${id}`,
      on: state.any_on === true,
      brightness: briToPct(action.bri),
      reachable: true,
      kind: type || undefined,
      hasColor,
      color: hasColor ? xyToHex(action.xy) : null,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
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
    base = normalizeBridge(String(body.url ?? ''))
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'invalid_url' }, { status: 400 })
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    // Pairing: Bridge-Knopf drücken, dann hier einen API-Key erzeugen.
    if (body.action === 'pair') {
      const r = await hueFetch(
        `${base}/api`,
        { method: 'POST', body: JSON.stringify({ devicetype: 'selfdashboard#hue' }) },
        ac.signal,
      )
      const err = hueError(r.json)
      if (err === 'link_button') {
        return Response.json(
          { error: 'link_button', detail: 'Bridge-Knopf drücken und innerhalb 30 s erneut koppeln.' },
          { status: 409 },
        )
      }
      if (Array.isArray(r.json) && isObject(r.json[0]) && isObject(r.json[0].success)) {
        const username = str((r.json[0].success as Record<string, unknown>).username)
        if (username) return Response.json({ ok: true, apiKey: username })
      }
      return Response.json({ error: err || 'pair_failed', detail: 'Unerwartete Bridge-Antwort.' }, { status: 502 })
    }

    const key = openSealedSecret(String(body.apiKey ?? ''))
    if (!key) return Response.json({ error: 'missing_api_key' }, { status: 400 })

    // Schalten / dimmen.
    if (body.action === 'set') {
      const target = body.target === 'light' ? 'light' : 'group'
      const id = str(body.id)
      if (!/^[0-9]+$/.test(id)) return Response.json({ error: 'invalid_id' }, { status: 400 })
      const payload: Record<string, unknown> = {}
      if (typeof body.on === 'boolean') payload.on = body.on
      if (typeof body.bri === 'number' && Number.isFinite(body.bri)) {
        payload.on = body.on !== false
        payload.bri = pctToBri(body.bri <= 100 ? body.bri : briToPct(body.bri) ?? 100)
      }
      if (typeof body.hex === 'string') {
        const xy = hexToXy(body.hex)
        if (xy) {
          payload.on = body.on !== false
          payload.xy = xy
        }
      }
      if (Object.keys(payload).length === 0) {
        return Response.json({ error: 'nothing_to_set' }, { status: 400 })
      }
      const path =
        target === 'group'
          ? `${base}/api/${key}/groups/${id}/action`
          : `${base}/api/${key}/lights/${id}/state`
      const r = await hueFetch(path, { method: 'PUT', body: JSON.stringify(payload) }, ac.signal)
      const err = hueError(r.json)
      if (err) {
        const st = err === 'auth_failed' ? 401 : 502
        void logPluginApiFailure('hue', 'set', err)
        return Response.json({ error: err }, { status: st })
      }
      return Response.json({ ok: true })
    }

    // Status (default): Gruppen + Lampen.
    const [groupsRes, lightsRes] = await Promise.all([
      hueFetch(`${base}/api/${key}/groups`, {}, ac.signal),
      hueFetch(`${base}/api/${key}/lights`, {}, ac.signal),
    ])
    const err = hueError(groupsRes.json) || hueError(lightsRes.json)
    if (err) {
      const st = err === 'auth_failed' ? 401 : 502
      void logPluginApiFailure('hue', 'state', err)
      return Response.json(
        { error: err, detail: err === 'auth_failed' ? 'API-Key ungültig — Bridge neu koppeln.' : '' },
        { status: st },
      )
    }
    return Response.json({
      groups: mapGroups(groupsRes.json),
      lights: mapLights(lightsRes.json),
    })
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('hue', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('hue', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('hue', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleHuePluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function hueServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleHuePluginRequest(ctx.request, ctx.path)
}
