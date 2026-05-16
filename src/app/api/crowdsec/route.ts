import { NextRequest, NextResponse } from 'next/server'
import { loadFromCrowdsecDb, probeCrowdsecDb, resolveCrowdsecDbPath } from '@/lib/crowdsecDb'

export const dynamic = 'force-dynamic'

/** GET — liest crowdsec.db direkt (kein LAPI, kein threat-map-docker). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const daysBack = Number(sp.get('daysBack') || 365)
  const serverLat = Number(sp.get('serverLat') || 0)
  const serverLon = Number(sp.get('serverLon') || 0)
  const serverName = sp.get('serverName')?.trim() || 'Server'
  const dbPathRaw = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'
  const probe = sp.get('probe') === '1'

  try {
    const dbPath = resolveCrowdsecDbPath(dbPathRaw)
    const data = loadFromCrowdsecDb(dbPath, {
      daysBack,
      serverLat,
      serverLon,
      serverName,
    })
    if (probe) {
      const stats = probeCrowdsecDb(dbPath, daysBack)
      return NextResponse.json({ ...data, probe: stats })
    }
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'db_error'
    const status =
      msg === 'db_not_found' ||
      msg === 'missing_db_path' ||
      msg === 'db_not_a_file'
        ? 404
        : msg === 'db_path_not_allowed' || msg === 'db_schema_unsupported'
          ? 403
          : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
