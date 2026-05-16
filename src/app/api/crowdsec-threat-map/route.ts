import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 20_000

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

function normalizeBase(raw: string): string {
  const u = parseBase(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  u.pathname = u.pathname.replace(/\/+$/, '') || ''
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

function endpoint(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  const action = req.nextUrl.searchParams.get('action') || 'metrics'
  if (!url) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_url'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const target =
    action === 'whitelist'
      ? endpoint(base, '/whitelist-status')
      : endpoint(base, '/metrics')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(target, { cache: 'no-store', signal: ctrl.signal })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream_error', status: res.status, detail: text.slice(0, 500) }, { status: 502 })
    }
    if (action === 'whitelist') {
      try {
        return NextResponse.json(JSON.parse(text))
      } catch {
        return NextResponse.json({ error: 'invalid_json' }, { status: 502 })
      }
    }
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch_failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  if (!url) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_url'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  let body: { ip?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const ip = typeof body.ip === 'string' ? body.ip.trim() : ''
  if (!ip) {
    return NextResponse.json({ error: 'missing_ip' }, { status: 400 })
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(endpoint(base, '/unban'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ip }),
      cache: 'no-store',
      signal: ctrl.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = { raw: text }
    }
    return NextResponse.json(json, { status: res.ok ? 200 : 502 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch_failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
