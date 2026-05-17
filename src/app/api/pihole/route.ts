import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLog'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type Session = { sid: string; csrf: string; expiresAt: number }

const sessionCache = new Map<string, Session>()

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

function finalizeBaseUrl(u: URL): string {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let path = u.pathname.replace(/\/+$/, '') || ''
  if (path.endsWith('/admin')) {
    path = path.slice(0, -'/admin'.length) || '/'
    u.pathname = path
  }
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

function normalizeBase(raw: string): string {
  return finalizeBaseUrl(parseBase(raw))
}

function apiEndpoint(base: string, apiPath: string): string {
  const path = apiPath.replace(/^\//, '')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return new URL(path, prefix).toString()
}

function cacheKey(base: string, password: string, totp: string): string {
  return `${base}\0${password}\0${totp}`
}

function isObject(j: unknown): j is Record<string, unknown> {
  return j != null && typeof j === 'object' && !Array.isArray(j)
}

function piHoleErrorDetail(j: unknown, fallback: string): string {
  if (isObject(j) && isObject(j.error) && typeof j.error.message === 'string') {
    return j.error.message
  }
  return fallback
}

async function fetchJson(
  url: string,
  method: 'GET' | 'POST' | 'DELETE',
  headers: Record<string, string>,
  body: unknown | null,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const h: Record<string, string> = { ...headers, Accept: 'application/json' }
  if (body != null) h['Content-Type'] = 'application/json'
  const res = await fetch(url, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : undefined,
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
  return { ok: res.ok, status: res.status, json, text }
}

function authHeaders(session: Session | null): Record<string, string> {
  if (!session) return {}
  return { 'X-FTL-SID': session.sid, 'X-FTL-CSRF': session.csrf }
}

async function login(
  base: string,
  password: string,
  totp: string,
  signal: AbortSignal,
): Promise<Session> {
  const payload: Record<string, unknown> = { password }
  if (totp !== '') {
    const n = Number(totp)
    if (Number.isFinite(n)) payload.totp = Math.trunc(n)
  }
  const url = apiEndpoint(base, 'api/auth')
  const r = await fetchJson(url, 'POST', {}, payload, signal)
  if (!r.ok) {
    const detail = piHoleErrorDetail(r.json, r.text.slice(0, 240))
    const err = new Error('auth_failed') as Error & { status?: number; detail?: string }
    err.status = r.status
    err.detail = detail
    throw err
  }
  if (!isObject(r.json) || !isObject(r.json.session)) {
    const err = new Error('auth_invalid') as Error & { status?: number; detail?: string }
    err.status = 502
    err.detail = 'missing session in auth response'
    throw err
  }
  const sess = r.json.session
  const sid = typeof sess.sid === 'string' ? sess.sid : ''
  const csrf = typeof sess.csrf === 'string' ? sess.csrf : ''
  if (!sid) {
    const err = new Error('auth_invalid') as Error & { status?: number; detail?: string }
    err.status = 502
    err.detail = 'empty session id'
    throw err
  }
  const validity = typeof sess.validity === 'number' && sess.validity > 0 ? sess.validity : 300
  return { sid, csrf, expiresAt: Date.now() + validity * 1000 - 5000 }
}

async function getSession(
  base: string,
  password: string,
  totp: string,
  signal: AbortSignal,
  force = false,
): Promise<Session | null> {
  if (!password) return null
  const key = cacheKey(base, password, totp)
  if (!force) {
    const cached = sessionCache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached
  }
  const session = await login(base, password, totp, signal)
  sessionCache.set(key, session)
  return session
}

async function apiRequest(
  base: string,
  password: string,
  totp: string,
  apiPath: string,
  method: 'GET' | 'POST',
  body: unknown | null,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const url = apiEndpoint(base, apiPath)
  let session = await getSession(base, password, totp, signal)
  let r = await fetchJson(url, method, authHeaders(session), body, signal)
  if (r.status === 401 && password) {
    session = await getSession(base, password, totp, signal, true)
    r = await fetchJson(url, method, authHeaders(session), body, signal)
  }
  return r
}

type ReqBody = {
  url?: string
  password?: string
  totp?: string | number
  action?: string
  blocking?: boolean
}

export async function POST(req: Request) {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const password = String(body.password ?? '')
  const totp = body.totp != null && body.totp !== '' ? String(body.totp).trim() : ''

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    if (body.action === 'blocking') {
      if (typeof body.blocking !== 'boolean') {
        return NextResponse.json({ error: 'missing_blocking' }, { status: 400 })
      }
      const br = await apiRequest(
        base,
        password,
        totp,
        'api/dns/blocking',
        'POST',
        { blocking: body.blocking },
        ac.signal,
      )
      if (!br.ok) {
        const detail = piHoleErrorDetail(br.json, br.text.slice(0, 240))
        return NextResponse.json(
          { error: 'blocking_failed', status: br.status, detail: detail || br.text.slice(0, 240) },
          { status: br.status === 401 || br.status === 403 ? br.status : 502 },
        )
      }
      const blocking =
        isObject(br.json) && typeof br.json.blocking === 'boolean' ? br.json.blocking : body.blocking
      return NextResponse.json({ ok: true, blocking })
    }

    const summaryRes = await apiRequest(base, password, totp, 'api/stats/summary', 'GET', null, ac.signal)
    if (!summaryRes.ok) {
      const detail = piHoleErrorDetail(summaryRes.json, summaryRes.text.slice(0, 240))
      const st =
        summaryRes.status === 401 || summaryRes.status === 403 ? summaryRes.status : 502
      void logPluginApiFailure('pihole', 'summary', detail || 'summary_failed', {
        status: summaryRes.status,
      })
      return NextResponse.json(
        { error: 'summary_failed', status: summaryRes.status, detail: detail || summaryRes.text.slice(0, 240) },
        { status: st },
      )
    }

    const blockingRes = await apiRequest(base, password, totp, 'api/dns/blocking', 'GET', null, ac.signal)
    let blocking: boolean | null = null
    if (blockingRes.ok && isObject(blockingRes.json) && typeof blockingRes.json.blocking === 'boolean') {
      blocking = blockingRes.json.blocking
    }

    return NextResponse.json({
      summary: isObject(summaryRes.json) ? summaryRes.json : null,
      blocking,
      blockingHttp: blockingRes.status,
    })
  } catch (e) {
    const err = e as Error & { status?: number; detail?: string }
    if (err.message === 'auth_failed' || err.message === 'auth_invalid') {
      void logPluginApiFailure('pihole', 'auth', err.message, {
        status: err.status,
        detail: err.detail,
      })
      return NextResponse.json(
        { error: err.message, status: err.status ?? 401, detail: err.detail ?? '' },
        { status: err.status === 401 || err.status === 403 ? err.status : 502 },
      )
    }
    const msg = e instanceof Error ? e.message : String(e)
    const aborted = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('pihole', 'request', aborted ? 'timeout' : msg)
    return NextResponse.json(
      { error: aborted ? 'timeout' : 'fetch_failed', detail: msg },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(t)
  }
}
