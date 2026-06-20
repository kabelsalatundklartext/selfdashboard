import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLogServer'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '@/lib/security/ssrf'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'

// Live-Sync (ein IMAP-Login je Konto auf der SelfMailer-Seite) darf laenger
// dauern als ein reiner Cache-Lesezugriff — deshalb grosszuegiges Timeout.
const FETCH_TIMEOUT_MS = 20_000

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

/** Basis-URL saeubern: Protokoll pruefen, Credentials/Hash/Trailing-Slash weg. */
function normalizeBase(raw: string): string {
  const u = parseBase(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

type ReqBody = { base?: string; token?: string; live?: boolean }

/**
 * Proxy auf den SelfMailer-Endpoint ``/api/v1/dashboard/summary``.
 *
 * Server-zu-Server (kein CORS/Mixed-Content im Browser), Token bleibt im
 * Request-Body und wandert nur an SelfMailer weiter. Antwort wird 1:1
 * durchgereicht: { total_unseen, accounts[], recent[] }.
 */
export async function handleSelfmailerRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.base ?? ''))
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const token = String(body.token ?? '').trim()
  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 })

  const live = body.live === true ? '1' : '0'
  const url = `${base}/api/v1/dashboard/summary?token=${encodeURIComponent(token)}&live=${live}`

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchWithSsrfGuard(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: ac.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    if (!res.ok) {
      const code = res.status === 401 ? 'unauthorized' : 'fetch_failed'
      void logPluginApiFailure('selfmailer', 'summary', `http_${res.status}`, {
        status: res.status,
        detail: text.slice(0, 200),
      })
      return NextResponse.json(
        { error: code, status: res.status, detail: text.slice(0, 200) },
        { status: res.status === 401 ? 401 : 502 },
      )
    }
    return NextResponse.json(json ?? {})
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('selfmailer', 'summary', `blocked_url:${e.message}`)
      return NextResponse.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('selfmailer', 'summary', aborted ? 'timeout' : msg)
    return NextResponse.json(
      { error: aborted ? 'timeout' : 'fetch_failed', detail: msg },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(t)
  }
}

export function selfmailerServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleSelfmailerRequest(ctx.request)
}

export default selfmailerServerHandler
