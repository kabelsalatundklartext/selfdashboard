import { logPluginApiFailure } from '@/lib/pluginLogServer'
import { openSealedSecret } from '@/lib/secretCrypto'
import { assertSafeOutboundUrlResolved, UnsafeOutboundUrlError } from '@/lib/security/ssrf'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import {
  fetchFritzBoxByteCountersOnly,
  fetchFritzBoxSummary,
  fritzboxRootFromInput,
} from './lib/fritzboxTr064'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 18_000
const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export async function handleFritzboxPluginRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
  }

  const len = Number(req.headers.get('content-length') || 0)
  if (len > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: 'body_too_large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  let baseUrl: string
  try {
    baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ''))
    await assertSafeOutboundUrlResolved(baseUrl)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      return Response.json({ ok: false, error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    const code = e instanceof Error ? e.message : 'bad_url'
    return Response.json({ ok: false, error: code }, { status: 400 })
  }

  const username = clampStr(body.username, 200)
  const password = openSealedSecret(
    typeof body.password === 'string' ? body.password.slice(0, 2000) : '',
  ).slice(0, 500)
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
      return Response.json({
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
    return Response.json({
      ok: true,
      ...summary,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    const msg = e instanceof Error ? e.message : String(e)
    if (name === 'AbortError') {
      void logPluginApiFailure('fritzbox', 'request', 'timeout', { lite })
      return Response.json({ ok: false, error: 'timeout' }, { status: 504 })
    }
    if (msg === 'unauthorized') {
      void logPluginApiFailure('fritzbox', 'auth', 'unauthorized', { lite })
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    void logPluginApiFailure('fritzbox', 'request', msg, { lite })
    return Response.json({ ok: false, error: 'fetch_failed', message: msg }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}

export function fritzboxServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleFritzboxPluginRequest(ctx.request)
}

export default fritzboxServerHandler
