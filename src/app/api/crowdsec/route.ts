import { NextRequest, NextResponse } from 'next/server'
import { loadCrowdsecDashboard, resolveCrowdsecDbPath } from '@/lib/crowdsecDb'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export const dynamic = 'force-dynamic'

/** GET — CrowdSec-Dashboard-Daten aus crowdsec.db */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const dbPath = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'
  const daysBackRaw = Number(sp.get('daysBack') ?? 30)
  const daysBack =
    daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, Number.isFinite(daysBackRaw) ? daysBackRaw : 30))
  const maxAlertsRaw = Number(sp.get('maxAlerts') ?? 2000)
  const maxAlerts =
    maxAlertsRaw === 0 ? 0 : Math.min(50_000, Math.max(50, Number.isFinite(maxAlertsRaw) ? maxAlertsRaw : 2000))

  try {
    const resolved = resolveCrowdsecDbPath(dbPath)
    const data = await loadCrowdsecDashboard(resolved, { daysBack, maxAlerts })
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'crowdsec_error'
    const status =
      msg === 'missing_db_path' || msg === 'db_not_found' || msg === 'db_not_a_file'
        ? 404
        : msg === 'db_path_not_allowed'
          ? 403
          : msg === 'db_schema_unsupported'
            ? 422
            : 502
    void logPluginApiFailure('crowdsec', 'dashboard', msg, { dbPath, status })
    return NextResponse.json({ error: msg }, { status })
  }
}
