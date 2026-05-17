import { NextRequest, NextResponse } from 'next/server'
import { loadCrowdsecDashboard, resolveCrowdsecDbPath } from '@/lib/crowdsecDb'
import { logPluginApiFailure } from '@/lib/pluginLog'

export const dynamic = 'force-dynamic'

/** GET — CrowdSec-Dashboard-Daten aus crowdsec.db */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const dbPath = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'
  const daysBack = Math.min(3650, Math.max(1, Number(sp.get('daysBack') || 30) || 30))
  const statsHours = Math.min(168, Math.max(1, Number(sp.get('statsHours') || 24) || 24))
  const maxAlerts = Math.min(5000, Math.max(50, Number(sp.get('maxAlerts') || 500) || 500))

  try {
    const resolved = resolveCrowdsecDbPath(dbPath)
    const data = await loadCrowdsecDashboard(resolved, { daysBack, statsHours, maxAlerts })
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
