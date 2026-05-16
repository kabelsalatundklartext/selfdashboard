import { NextRequest, NextResponse } from 'next/server'
import { loadFromCrowdsecDb, resolveCrowdsecDbPath } from '@/lib/crowdsecDb'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 20_000

function normalizeLapiUrl(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  return u.toString().replace(/\/+$/, '')
}

/** GET — liest crowdsec.db direkt (kein threat-map-docker). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const daysBack = Number(sp.get('daysBack') || 365)
  const serverLat = Number(sp.get('serverLat') || 0)
  const serverLon = Number(sp.get('serverLon') || 0)
  const serverName = sp.get('serverName')?.trim() || 'Server'
  const dbPathRaw = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'

  try {
    const dbPath = resolveCrowdsecDbPath(dbPathRaw)
    const data = loadFromCrowdsecDb(dbPath, {
      daysBack,
      serverLat,
      serverLon,
      serverName,
    })
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'db_error'
    const status =
      msg === 'db_not_found' || msg === 'missing_db_path' ? 404 : msg === 'db_path_not_allowed' ? 403 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}

/** POST — Unban über CrowdSec LAPI (optional). */
export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const lapiUrl = sp.get('lapiUrl')?.trim()
  const lapiKey = sp.get('lapiKey')?.trim()
  if (!lapiUrl || !lapiKey) {
    return NextResponse.json({ error: 'missing_lapi' }, { status: 400 })
  }

  let body: { ip?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const ip = typeof body.ip === 'string' ? body.ip.trim() : ''
  if (!ip) return NextResponse.json({ error: 'missing_ip' }, { status: 400 })

  const base = normalizeLapiUrl(lapiUrl)
  const headers: Record<string, string> = {
    'X-Api-Key': lapiKey,
    Accept: 'application/json',
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const delDec = await fetch(`${base}/v1/decisions?ip=${encodeURIComponent(ip)}`, {
      method: 'DELETE',
      headers,
      signal: ctrl.signal,
    })
    const delAlert = await fetch(`${base}/v1/alerts?ip=${encodeURIComponent(ip)}`, {
      method: 'DELETE',
      headers,
      signal: ctrl.signal,
    })
    const ok = delDec.ok || delAlert.ok
    return NextResponse.json(
      { success: ok, decisions: delDec.status, alerts: delAlert.status },
      { status: ok ? 200 : 502 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch_failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
