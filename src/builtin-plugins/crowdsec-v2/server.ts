import Database from 'better-sqlite3'
import { logPluginApiFailure } from '@/lib/pluginLogServer'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import { crowdsecUnbanIp } from '@/builtin-plugins/crowdsec/lib/crowdsecDocker'
import { loadCrowdsecDashboard, resolveCrowdsecDbPath } from '@/builtin-plugins/crowdsec/lib/crowdsecDb'
import type { CrowdsecDashboardData } from '@/builtin-plugins/crowdsec/lib/crowdsecMetrics'

function decisionUntilClause(alias = 'd'): string {
  const untilSec = `CAST(
    CASE
      WHEN ${alias}.until IS NULL OR TRIM(CAST(${alias}.until AS TEXT)) = '' THEN NULL
      WHEN CAST(${alias}.until AS INTEGER) > 10000000000000 THEN CAST(${alias}.until AS INTEGER) / 1000000
      WHEN CAST(${alias}.until AS INTEGER) > 1000000000000 THEN CAST(${alias}.until AS INTEGER) / 1000
      WHEN CAST(${alias}.until AS INTEGER) > 1000000000 THEN CAST(${alias}.until AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${alias}.until AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`
  return `(${untilSec} IS NOT NULL AND ${untilSec} > CAST(strftime('%s', 'now') AS INTEGER))`
}

function countActiveDecisionsSplit(dbPath: string): { local: number; capi: number } {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'")
      .all() as { name: string }[]
    if (tables.length === 0) return { local: 0, capi: 0 }
    const cols = db.prepare('PRAGMA table_info(decisions)').all() as { name: string }[]
    const names = new Set(cols.map((c) => c.name))
    if (!names.has('until')) return { local: 0, capi: 0 }
    const where = `WHERE ${decisionUntilClause('d')}`
    let simulated = ''
    if (names.has('simulated')) {
      simulated = ' AND (d.simulated IS NULL OR d.simulated = 0)'
    }
    let scope = ''
    if (names.has('scope')) {
      scope =
        " AND (d.scope IS NULL OR TRIM(CAST(d.scope AS TEXT)) = '' OR LOWER(TRIM(CAST(d.scope AS TEXT))) IN ('ip', 'range'))"
    }
    const base = `${where}${simulated}${scope}`
    if (names.has('origin')) {
      const capiRow = db
        .prepare(
          `SELECT COUNT(*) AS c FROM decisions d ${base} AND LOWER(TRIM(CAST(d.origin AS TEXT))) IN ('capi', 'lists')`,
        )
        .get() as { c: number }
      const localRow = db
        .prepare(
          `SELECT COUNT(*) AS c FROM decisions d ${base} AND (d.origin IS NULL OR TRIM(CAST(d.origin AS TEXT)) = '' OR LOWER(TRIM(CAST(d.origin AS TEXT))) NOT IN ('capi', 'lists'))`,
        )
        .get() as { c: number }
      return { local: Number(localRow?.c ?? 0), capi: Number(capiRow?.c ?? 0) }
    }
    const total = db.prepare(`SELECT COUNT(*) AS c FROM decisions d ${base}`).get() as { c: number }
    const n = Number(total?.c ?? 0)
    return { local: n, capi: 0 }
  } finally {
    db.close()
  }
}

async function handleDashboardGet(req: Request): Promise<Response> {
  const sp = new URL(req.url).searchParams
  const dbPath = sp.get('dbPath')?.trim() || process.env.CROWDSEC_DB_PATH || '/crowdsec-data/crowdsec.db'
  const daysBackRaw = Number(sp.get('daysBack') ?? 30)
  const daysBack =
    daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, Number.isFinite(daysBackRaw) ? daysBackRaw : 30))
  const maxAlertsRaw = Number(sp.get('maxAlerts') ?? 500)
  const maxAlerts =
    maxAlertsRaw === 0 ? 0 : Math.min(2000, Math.max(50, Number.isFinite(maxAlertsRaw) ? maxAlertsRaw : 500))
  const timeoutMs = Math.min(120_000, Math.max(15_000, Number(process.env.CROWDSEC_QUERY_TIMEOUT_MS) || 45_000))

  try {
    const resolved = resolveCrowdsecDbPath(dbPath)
    const data = await Promise.race([
      loadCrowdsecDashboard(resolved, { daysBack, maxAlerts }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('crowdsec_timeout')), timeoutMs)
      }),
    ])
    const split = countActiveDecisionsSplit(resolved)
    const enriched: CrowdsecDashboardData & { localActiveBans: number; capiActiveBans: number } = {
      ...data,
      localActiveBans: split.local,
      capiActiveBans: split.capi > 0 ? split.capi : Math.max(0, data.activeBans - split.local),
    }
    return Response.json(enriched)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'crowdsec_error'
    const status =
      msg === 'crowdsec_timeout'
        ? 504
        : msg === 'db_not_found' || msg === 'db_not_a_file'
          ? 404
          : msg === 'db_path_not_allowed'
            ? 403
            : msg === 'db_schema_unsupported'
              ? 422
              : 502
    void logPluginApiFailure('crowdsec-v2', 'dashboard', msg, { dbPath, status })
    return Response.json({ error: msg }, { status })
  }
}

async function handleDecisionPost(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const ip = typeof o.ip === 'string' ? o.ip.trim() : ''
  const container =
    typeof o.container === 'string' && o.container.trim()
      ? o.container.trim()
      : process.env.CROWDSEC_CONTAINER || 'crowdsec'

  if (!ip) return Response.json({ error: 'missing_ip' }, { status: 400 })

  try {
    await crowdsecUnbanIp(container, ip)
    return Response.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'delete_failed'
    const status =
      msg === 'docker_unavailable' || msg === 'crowdsec_container_not_found'
        ? 503
        : msg === 'invalid_ip'
          ? 400
          : 502
    return Response.json({ error: msg }, { status })
  }
}

export async function crowdsecV2ServerHandler(ctx: PluginServerContext): Promise<Response> {
  const [seg] = ctx.path
  const method = ctx.request.method.toUpperCase()

  if ((seg === 'decision' || seg === 'decisions') && method === 'POST') {
    return handleDecisionPost(ctx.request)
  }

  if (method === 'GET' && (!seg || seg === 'dashboard')) {
    return handleDashboardGet(ctx.request)
  }

  return Response.json(
    { error: 'not_found', pluginId: ctx.pluginId, path: ctx.path.join('/') },
    { status: 404 },
  )
}
