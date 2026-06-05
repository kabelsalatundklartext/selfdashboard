import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000
const MAX_ENTITIES = 25
const ENTITY_ID_RE = /^[a-z_]+\.[a-z0-9_]+$/i

type ReqBody = {
  url?: string
  token?: string
  entities?: unknown
}

export type HaEntityPayload = {
  id: string
  name?: string
  state?: string
  unit?: string | null
  error?: string
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

function parseEntities(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const id = item.trim()
    if (!ENTITY_ID_RE.test(id)) continue
    if (!out.includes(id)) out.push(id)
    if (out.length >= MAX_ENTITIES) break
  }
  return out
}

async function fetchState(
  base: string,
  id: string,
  token: string,
  signal: AbortSignal,
): Promise<{ status: number; json: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchWithSsrfGuard(`${base}/api/states/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers,
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
  return { status: res.status, json }
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
  const entities = parseEntities(body.entities)
  if (entities.length === 0) {
    return Response.json(
      { error: 'missing_entities', detail: 'Mindestens eine gültige entity_id (z. B. sensor.temperatur) angeben.' },
      { status: 400 },
    )
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const results: HaEntityPayload[] = []
    for (const id of entities) {
      const r = await fetchState(base, id, token, ac.signal)
      if (r.status === 401 || r.status === 403) {
        void logPluginApiFailure('home-assistant', 'auth', 'auth_failed', { status: r.status })
        return Response.json(
          { error: 'auth_failed', detail: 'Long-Lived Access Token prüfen (Profil → Sicherheit).' },
          { status: r.status },
        )
      }
      if (r.status === 404) {
        results.push({ id, error: 'not_found' })
        continue
      }
      if (r.status < 200 || r.status >= 300 || !isObject(r.json)) {
        results.push({ id, error: `http_${r.status}` })
        continue
      }
      const attrs = isObject(r.json.attributes) ? r.json.attributes : {}
      results.push({
        id,
        name: str(attrs.friendly_name) ?? id,
        state: str(r.json.state) ?? '',
        unit: str(attrs.unit_of_measurement),
      })
    }
    return Response.json({ entities: results })
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('home-assistant', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('home-assistant', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('home-assistant', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleHomeAssistantPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function homeAssistantServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleHomeAssistantPluginRequest(ctx.request, ctx.path)
}
