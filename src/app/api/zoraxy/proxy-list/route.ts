import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BASE_LEN = 512
const MAX_KEY_LEN = 512

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/**
 * POST /api/zoraxy/proxy-list
 * Body: { "baseUrl": "https://host:8000", "apiKey": "…" } — uses Zoraxy plugin REST: GET /plugin/api/proxy/list + Bearer.
 * Or: { "baseUrl": "…", "noAuth": true } — GET /api/proxy/list (only if Zoraxy was started with -noauth).
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const baseRaw = typeof body.baseUrl === 'string' ? body.baseUrl : ''
  const baseUrl = normalizeBase(baseRaw)
  if (!baseUrl || baseUrl.length > MAX_BASE_LEN) {
    return NextResponse.json({ error: 'baseUrl fehlt oder ist zu lang' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(baseUrl)
  } catch {
    return NextResponse.json({ error: 'baseUrl ist keine gültige URL' }, { status: 400 })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Nur http(s) erlaubt' }, { status: 400 })
  }

  const noAuth = body.noAuth === true
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!noAuth && !apiKey) {
    return NextResponse.json({ error: 'apiKey setzen oder noAuth: true (nur bei Zoraxy -noauth)' }, { status: 400 })
  }
  if (apiKey.length > MAX_KEY_LEN) {
    return NextResponse.json({ error: 'apiKey zu lang' }, { status: 400 })
  }

  const path = noAuth ? '/api/proxy/list' : '/plugin/api/proxy/list'
  const target = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (!noAuth && apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  try {
    const r = await fetch(target, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
    const text = await r.text()
    if (!r.ok) {
      const hint =
        r.status === 401
          ? '401 — API-Key prüfen (Zoraxy: Plugin-REST-Key mit GET /plugin/api/proxy/list) oder noAuth, falls Zoraxy mit -noauth läuft.'
          : text?.slice(0, 400) || `HTTP ${r.status}`
      return NextResponse.json({ error: hint }, { status: r.status >= 400 && r.status < 600 ? r.status : 502 })
    }
    let data: unknown
    try {
      data = JSON.parse(text) as unknown
    } catch {
      return NextResponse.json({ error: 'Keine gültige JSON-Antwort von Zoraxy' }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg.includes('aborted') ? 'Timeout bei Zoraxy' : msg }, { status: 503 })
  }
}
