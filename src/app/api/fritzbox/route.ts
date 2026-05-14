import { NextResponse } from 'next/server'
import {
  fetchFritzBoxByteCountersOnly,
  fetchFritzBoxSummary,
  fritzboxRootFromInput,
} from '@/lib/fritzboxTr064'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 18_000
const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'body_too_large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let baseUrl: string
  try {
    baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ''))
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const username = clampStr(body.username, 200)
  const password = typeof body.password === 'string' ? body.password.slice(0, 500) : ''
  const insecureTls = body.insecureTls === true
  const lite = body.lite === true

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    if (lite) {
      const counters = await fetchFritzBoxByteCountersOnly(
        { baseUrl, username, password, insecureTls },
        ac.signal,
      )
      return NextResponse.json({
        ok: true,
        lite: true,
        ...counters,
        fetchedAt: new Date().toISOString(),
      })
    }

    const summary = await fetchFritzBoxSummary(
      { baseUrl, username, password, insecureTls },
      ac.signal,
    )
    return NextResponse.json({
      ok: true,
      ...summary,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    const msg = e instanceof Error ? e.message : String(e)
    if (name === 'AbortError') {
      return NextResponse.json({ ok: false, error: 'timeout' }, { status: 504 })
    }
    if (msg === 'unauthorized') {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: msg }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}
