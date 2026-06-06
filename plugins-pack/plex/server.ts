import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  token?: string
}

export type PlexSession = {
  user: string
  title: string
  state: 'playing' | 'paused'
  positionMs: number | null
  durationMs: number | null
  player: string
}

export type PlexSessionsPayload = {
  sessions: PlexSession[]
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

/**
 * Normalisiert einen Eintrag aus MediaContainer.Metadata zu einer Session-Zeile.
 * Bei Serien (`type === 'episode'`) ist `grandparentTitle` der Serienname —
 * Anzeige: "Serie — Episodentitel".
 */
function normalizeSession(entry: unknown): PlexSession | null {
  if (!isObject(entry)) return null
  const epTitle = str(entry.title) ?? ''
  const grandparent = str(entry.grandparentTitle)
  const title = grandparent ? (epTitle ? `${grandparent} — ${epTitle}` : grandparent) : epTitle
  if (!title) return null
  const userObj = isObject(entry.User) ? entry.User : null
  const playerObj = isObject(entry.Player) ? entry.Player : null
  const rawState = playerObj ? str(playerObj.state) : null
  return {
    user: (userObj ? str(userObj.title) : null) ?? '—',
    title,
    state: rawState === 'paused' ? 'paused' : 'playing',
    positionMs: num(entry.viewOffset),
    durationMs: num(entry.duration),
    player: (playerObj ? str(playerObj.product) : null) ?? '',
  }
}

function normalizePayload(json: unknown): PlexSessionsPayload {
  const container = isObject(json) && isObject(json.MediaContainer) ? json.MediaContainer : null
  const metadata = container && Array.isArray(container.Metadata) ? container.Metadata : []
  const sessions: PlexSession[] = []
  for (const entry of metadata) {
    const s = normalizeSession(entry)
    if (s) sessions.push(s)
  }
  return { sessions }
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
  if (!token) {
    return Response.json(
      { error: 'missing_token', detail: 'X-Plex-Token fehlt — in den Widget-Einstellungen eintragen.' },
      { status: 400 },
    )
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetchWithSsrfGuard(`${base}/status/sessions`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Plex-Token': token,
      },
      cache: 'no-store',
      signal: ac.signal,
    })

    if (res.status === 401 || res.status === 403) {
      void logPluginApiFailure('plex', 'auth', 'auth_failed', { status: res.status })
      return Response.json(
        { error: 'auth_failed', detail: 'X-Plex-Token prüfen (app.plex.tv → Medieninfo → XML anzeigen → X-Plex-Token in der URL).' },
        { status: res.status },
      )
    }
    if (!res.ok) {
      void logPluginApiFailure('plex', 'upstream', 'bad_status', { status: res.status })
      return Response.json(
        {
          error: 'upstream_error',
          detail: `Plex antwortete mit HTTP ${res.status}. URL prüfen — erwartet wird die Plex-Basis-URL (Standard-Port 32400).`,
        },
        { status: 502 },
      )
    }

    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      void logPluginApiFailure('plex', 'upstream', 'invalid_response')
      return Response.json(
        { error: 'invalid_response', detail: 'Antwort war kein JSON — Plex-Basis-URL prüfen (Standard-Port 32400).' },
        { status: 502 },
      )
    }

    return Response.json(normalizePayload(json))
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('plex', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('plex', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('plex', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json(
      { error: 'network_error', detail: 'Plex nicht erreichbar — URL/Port prüfen (Standard 32400).' },
      { status: 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

async function handlePlexPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function plexServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handlePlexPluginRequest(ctx.request, ctx.path)
}
