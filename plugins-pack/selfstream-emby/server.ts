import { logPluginApiFailure } from '../_shared/log'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'

type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

const FETCH_TIMEOUT_MS = 12_000

/** Emby/Jellyfin-Basis-URL säubern (Schema ergänzen, /admin + trailing slash weg). */
function normalizeBase(raw: string): string {
  let t = String(raw ?? '').trim().replace(/\/+$/, '')
  if (!t) throw new Error('missing_url')
  if (!/^https?:\/\//i.test(t)) t = `http://${t}`
  if (t.endsWith('/admin')) t = t.slice(0, -'/admin'.length).replace(/\/+$/, '')
  const u = new URL(t)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

/**
 * Server-Proxy für Emby/Jellyfin-Sessions. Früher holte das Widget die
 * Sessions direkt aus dem Browser → API-Key im DevTools-Netzwerktab sichtbar
 * und CORS-Fehler, sobald das Dashboard über einen anderen Origin
 * (Reverse-Proxy/HTTPS) läuft. Jetzt server-zu-server mit SSRF-Guard.
 */
async function handle(request: Request): Promise<Response> {
  let body: { url?: unknown; apiKey?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }
  const apiKey = String(body.apiKey ?? '').trim()
  if (!apiKey) return Response.json({ error: 'missing_key' }, { status: 400 })

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch {
    return Response.json({ error: 'missing_url' }, { status: 400 })
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  // Emby UND Jellyfin teilen sich die Sessions-API: erst /emby/Sessions, dann /Sessions.
  const paths = ['/emby/Sessions', '/Sessions']
  try {
    let lastStatus = 0
    let lastDetail = ''
    for (const p of paths) {
      const res = await fetchWithSsrfGuard(`${base}${p}`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'X-Emby-Token': apiKey },
        cache: 'no-store',
        signal: ac.signal,
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        return Response.json({ sessions: Array.isArray(data) ? data : [] })
      }
      lastStatus = res.status
      if (res.status === 404) continue
      lastDetail = (await res.text().catch(() => '')).slice(0, 200)
      break
    }
    const error =
      lastStatus === 401 ? 'auth_failed' : lastStatus === 404 ? 'api_not_found' : 'upstream_error'
    void logPluginApiFailure('selfstream-emby', 'upstream', error, {
      upstreamStatus: lastStatus,
      detail: lastDetail,
    })
    return Response.json({ error, detail: lastDetail }, { status: lastStatus === 401 ? 401 : 502 })
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('selfstream-emby', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('selfstream-emby', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('selfstream-emby', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

export default function selfstreamEmbyServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handle(ctx.request)
}
