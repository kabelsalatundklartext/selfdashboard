import { NextRequest, NextResponse } from 'next/server'
import { parseCrowdsecMetricsText } from '@/lib/crowdsecMetrics'
import { loadFromCrowdsecDb, resolveCrowdsecDbPath } from '@/lib/crowdsecDb'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 20_000

function normalizeExporterUrl(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  let out = u.toString().replace(/\/+$/, '')
  return out
}

async function fetchExporterMetrics(baseUrl: string): Promise<string> {
  const target = `${baseUrl}/metrics`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(target, { cache: 'no-store', signal: ctrl.signal })
    const text = await res.text()
    if (!res.ok) {
      return JSON.stringify({ error: 'upstream_error', status: res.status, detail: text.slice(0, 500) })
    }
    return text
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch_failed'
    return JSON.stringify({ error: msg })
  } finally {
    clearTimeout(timer)
  }
}

/** GET ?mode=database|exporter&dbPath=…&url=…&daysBack=…&serverLat=… */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const mode = (sp.get('mode') || 'database').trim()
  const daysBack = Number(sp.get('daysBack') || 365)
  const serverLat = Number(sp.get('serverLat') || 0)
  const serverLon = Number(sp.get('serverLon') || 0)
  const serverName = sp.get('serverName')?.trim() || 'Server'

  if (mode === 'exporter') {
    const url = sp.get('url')?.trim()
    if (!url) return NextResponse.json({ error: 'missing_url' }, { status: 400 })
    try {
      const base = normalizeExporterUrl(url)
      const text = await fetchExporterMetrics(base)
      if (text.startsWith('{') && text.includes('"error"')) {
        return NextResponse.json(JSON.parse(text), { status: 502 })
      }
      return new NextResponse(text, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'invalid_url'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  const dbPathRaw = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'
  try {
    const dbPath = resolveCrowdsecDbPath(dbPathRaw)
    const data = await loadFromCrowdsecDb(dbPath, {
      daysBack,
      serverLat,
      serverLon,
      serverName,
    })
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'db_error'
    const status = msg === 'db_not_found' || msg === 'missing_db_path' ? 404 : msg === 'db_path_not_allowed' ? 403 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}

/** POST unban via CrowdSec LAPI (optional) */
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

  const base = normalizeExporterUrl(lapiUrl)
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
