import { NextResponse } from 'next/server'
import { logPluginApiFailure } from '@/lib/pluginLogServer'
import {
  fetchFritzEnergyReading,
  listFritzSmartDevices,
  normalizeAin,
} from '@/lib/fritzHomeautoTr064'
import {
  appendEnergySample,
  aggregatesFromStore,
  energyStoreKey,
  readEnergyStore,
} from '@/lib/fritzEnergyStore'
import { fritzboxRootFromInput, type FritzBoxConnection } from '@/lib/fritzboxTr064'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 20_000
const MAX_BODY_BYTES = 12_000

function clampStr(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

function connFromBody(body: Record<string, unknown>): FritzBoxConnection {
  return {
    baseUrl: fritzboxRootFromInput(String(body.baseUrl ?? '')),
    username: clampStr(body.username, 200),
    password: typeof body.password === 'string' ? body.password.slice(0, 500) : '',
    insecureTls: body.insecureTls === true,
  }
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

  if (body.action === 'listDevices') {
    let conn: FritzBoxConnection
    try {
      conn = connFromBody(body)
    } catch (e) {
      const code = e instanceof Error ? e.message : 'bad_url'
      return NextResponse.json({ ok: false, error: code }, { status: 400 })
    }
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    try {
      const devices = await listFritzSmartDevices(conn, ac.signal)
      return NextResponse.json({ ok: true, devices })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, error: msg }, { status: 502 })
    } finally {
      clearTimeout(to)
    }
  }

  let ain: string
  try {
    ain = normalizeAin(String(body.ain ?? ''))
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_ain' }, { status: 400 })
  }

  let conn: FritzBoxConnection
  try {
    conn = connFromBody(body)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'bad_url'
    return NextResponse.json({ ok: false, error: code }, { status: 400 })
  }

  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const reading = await fetchFritzEnergyReading(conn, ain, ac.signal)
    if (!reading.multimeterSupported) {
      return NextResponse.json({ ok: false, error: 'no_multimeter' }, { status: 422 })
    }

    const key = energyStoreKey(conn.baseUrl, ain)
    const sample = {
      t: Date.now(),
      powerW: reading.powerW,
      energyWh: reading.energyWh,
    }
    const { store, aggregates } = await appendEnergySample(key, { ain, baseUrl: conn.baseUrl }, sample)

    return NextResponse.json({
      ok: true,
      ain,
      fetchedAt: new Date().toISOString(),
      voltageV: reading.voltageV,
      ...aggregates,
      recent: store.recent.slice(-288),
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    const msg = e instanceof Error ? e.message : String(e)
    if (name === 'AbortError') {
      void logPluginApiFailure('fritz-energy', 'request', 'timeout', { ain })
      return NextResponse.json({ ok: false, error: 'timeout' }, { status: 504 })
    }
    if (msg === 'unauthorized') {
      void logPluginApiFailure('fritz-energy', 'auth', 'unauthorized', { ain })
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    void logPluginApiFailure('fritz-energy', 'request', msg, { ain })
    return NextResponse.json({ ok: false, error: msg || 'fetch_failed' }, { status: 502 })
  } finally {
    clearTimeout(to)
  }
}

/** Geräteliste oder gespeicherte Werte ohne neuen Box-Abruf */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const baseUrl = url.searchParams.get('baseUrl') ?? ''
  const ainRaw = url.searchParams.get('ain') ?? ''
  let ain: string
  try {
    ain = normalizeAin(ainRaw)
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_ain' }, { status: 400 })
  }
  let root: string
  try {
    root = fritzboxRootFromInput(baseUrl)
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_url' }, { status: 400 })
  }

  const key = energyStoreKey(root, ain)
  const store = await readEnergyStore(key)
  if (!store) {
    return NextResponse.json({ ok: true, cached: false })
  }
  const aggregates = aggregatesFromStore(store)
  return NextResponse.json({
    ok: true,
    cached: true,
    ain: store.ain,
    updatedAt: store.updatedAt,
    aggregates,
    recent: store.recent.slice(-288),
    dailyKwh: store.dailyKwh,
  })
}
