import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

function normalizeBase(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

function controlEndpoint(base: string, controlPath: string): string {
  const path = controlPath.replace(/^\//, '')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return new URL(path, prefix).toString()
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const res = await fetch(url, { method: 'GET', headers, cache: 'no-store', signal })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json, text }
}

export async function POST(req: Request) {
  let body: { url?: string; username?: string; password?: string }
  try {
    body = (await req.json()) as { url?: string; username?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const user = String(body.username ?? '')
  const pass = String(body.password ?? '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (user !== '' || pass !== '') {
    const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')
    headers.Authorization = `Basic ${token}`
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  const statsUrl = controlEndpoint(base, 'control/stats')
  const statusUrl = controlEndpoint(base, 'control/status')

  try {
    const [statsRes, statusRes] = await Promise.all([
      fetchJson(statsUrl, headers, ac.signal),
      fetchJson(statusUrl, headers, ac.signal),
    ])

    if (!statsRes.ok) {
      const detail =
        typeof statsRes.json === 'object' && statsRes.json !== null && 'message' in statsRes.json
          ? String((statsRes.json as { message?: string }).message ?? '')
          : statsRes.text.slice(0, 240)
      return NextResponse.json(
        {
          error: 'stats_failed',
          status: statsRes.status,
          detail: detail || statsRes.text.slice(0, 240),
        },
        { status: statsRes.status === 401 || statsRes.status === 403 ? statsRes.status : 502 },
      )
    }

    return NextResponse.json({
      stats: statsRes.json,
      status: statusRes.ok ? statusRes.json : null,
      statusHttp: statusRes.status,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const aborted = e instanceof Error && e.name === 'AbortError'
    return NextResponse.json(
      { error: aborted ? 'timeout' : 'fetch_failed', detail: msg },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(t)
  }
}
