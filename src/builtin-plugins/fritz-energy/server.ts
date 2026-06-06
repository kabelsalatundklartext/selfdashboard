import { logPluginApiFailure } from '@/lib/pluginLogServer'
import { openSealedSecret } from '@/lib/secretCrypto'
import { assertSafeOutboundUrlResolved, UnsafeOutboundUrlError } from '@/lib/security/ssrf'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import {
  fetchFritzEnergyReading,
  listFritzSmartDevices,
  normalizeAin,
} from '../fritzbox/lib/fritzHomeautoTr064'
import { fetchFritzEnergyHistoryFromBox } from '../fritzbox/lib/fritzEnergyImport'
import {
  appendEnergySample,
  aggregatesFromStore,
  energyStoreKey,
  importBoxEnergyHistory,
  monthlyKwhFromStore,
  readEnergyStore,
  storeNeedsHistoryImport,
  syncBoxEnergyPeriods,
} from '../fritzbox/lib/fritzEnergyStore'
import { fritzboxRootFromInput, type FritzBoxConnection } from '../fritzbox/lib/fritzboxTr064'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 20_000
const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

async function connFromBody(body: Record<string, unknown>): Promise<FritzBoxConnection> {
  const baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ''))
  await assertSafeOutboundUrlResolved(baseUrl)
  return {
    baseUrl,
    username: clampStr(body.username, 200),
    password: openSealedSecret(
      typeof body.password === 'string' ? body.password.slice(0, 2000) : '',
    ).slice(0, 500),
    insecureTls: body.insecureTls === true,
  }
}

async function handlePost(req: Request): Promise<Response> {
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

  if (body.action === 'listDevices') {
    let conn: FritzBoxConnection
    try {
      conn = await connFromBody(body)
    } catch (e) {
      if (e instanceof UnsafeOutboundUrlError) {
        return Response.json({ ok: false, error: 'blocked_url', detail: e.message }, { status: 400 })
      }
      const code = e instanceof Error ? e.message : 'bad_url'
      return Response.json({ ok: false, error: code }, { status: 400 })
    }
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    try {
      const devices = await listFritzSmartDevices(conn, ac.signal)
      return Response.json({ ok: true, devices })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return Response.json({ ok: false, error: msg }, { status: 502 })
    } finally {
      clearTimeout(to)
    }
  }

  let ain: string
  try {
    ain = normalizeAin(String(body.ain ?? ''))
  } catch {
    return Response.json({ ok: false, error: 'bad_ain' }, { status: 400 })
  }

  let conn: FritzBoxConnection
  try {
    conn = await connFromBody(body)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      return Response.json({ ok: false, error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    const code = e instanceof Error ? e.message : 'bad_url'
    return Response.json({ ok: false, error: code }, { status: 400 })
  }

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const reading = await fetchFritzEnergyReading(conn, ain, ac.signal)
    if (!reading.multimeterSupported) {
      return Response.json({ ok: false, error: 'no_multimeter' }, { status: 422 })
    }

    const key = energyStoreKey(conn.baseUrl, ain)
    const sample = {
      t: Date.now(),
      powerW: reading.powerW,
      energyWh: reading.energyWh,
    }

    const forceImport = body.action === 'importHistory' || body.importHistory === true
    let store = await readEnergyStore(key)
    let boxSynced = false
    try {
      const box = await fetchFritzEnergyHistoryFromBox(conn, ain, ac.signal)
      if (box) {
        boxSynced = true
        store =
          forceImport || storeNeedsHistoryImport(store)
            ? await importBoxEnergyHistory(key, { ain, baseUrl: conn.baseUrl }, box, sample)
            : await syncBoxEnergyPeriods(key, { ain, baseUrl: conn.baseUrl }, box, sample)
      }
    } catch {
      /* Verlauf optional — Live-Werte weiterhin aus TR-064 */
    }

    const { store: storeOut, aggregates } = await appendEnergySample(key, { ain, baseUrl: conn.baseUrl }, sample)
    const storeFinal = storeOut

    return Response.json({
      ok: true,
      ain,
      fetchedAt: new Date().toISOString(),
      voltageV: reading.voltageV,
      ...aggregates,
      monthlyKwh: monthlyKwhFromStore(storeFinal),
      recent: storeFinal.recent.slice(-288),
      historyImported: Boolean(storeFinal.historyImportedAt),
      boxPeriods: storeFinal.boxPeriodKwh ?? null,
      periodsFromBox: boxSynced && storeFinal.boxPeriodKwh != null,
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    const msg = e instanceof Error ? e.message : String(e)
    if (name === 'AbortError') {
      void logPluginApiFailure('fritz-energy', 'request', 'timeout', { ain })
      return Response.json({ ok: false, error: 'timeout' }, { status: 504 })
    }
    if (msg === 'unauthorized') {
      void logPluginApiFailure('fritz-energy', 'auth', 'unauthorized', { ain })
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    void logPluginApiFailure('fritz-energy', 'request', msg, { ain })
    return Response.json({ ok: false, error: msg || 'fetch_failed' }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}

async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const baseUrl = url.searchParams.get('baseUrl') ?? ''
  const ainRaw = url.searchParams.get('ain') ?? ''
  let ain: string
  try {
    ain = normalizeAin(ainRaw)
  } catch {
    return Response.json({ ok: false, error: 'bad_ain' }, { status: 400 })
  }
  let root: string
  try {
    root = fritzboxRootFromInput(baseUrl)
  } catch {
    return Response.json({ ok: false, error: 'bad_url' }, { status: 400 })
  }

  const key = energyStoreKey(root, ain)
  const store = await readEnergyStore(key)
  if (!store) {
    return Response.json({ ok: true, cached: false })
  }
  const aggregates = aggregatesFromStore(store)
  return Response.json({
    ok: true,
    cached: true,
    ain: store.ain,
    updatedAt: store.updatedAt,
    aggregates,
    monthlyKwh: monthlyKwhFromStore(store),
    recent: store.recent.slice(-288),
    dailyKwh: store.dailyKwh,
    boxPeriods: store.boxPeriodKwh ?? null,
  })
}

export async function handleFritzEnergyPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method === 'GET') return handleGet(req)
  if (req.method === 'POST') return handlePost(req)
  return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}

export function fritzEnergyServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleFritzEnergyPluginRequest(ctx.request, ctx.path)
}

export default fritzEnergyServerHandler
