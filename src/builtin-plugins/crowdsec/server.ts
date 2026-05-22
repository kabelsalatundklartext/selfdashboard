import { logPluginApiFailure } from '@/lib/pluginLogServer'
import type { PluginServerContext } from '@/lib/pluginServerRegistry'
import { crowdsecUnbanIp } from './lib/crowdsecDocker'
import { loadCrowdsecDashboard, resolveCrowdsecDbPath } from './lib/crowdsecDb'

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
    return Response.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'crowdsec_error'
    const status =
      msg === 'crowdsec_timeout'
        ? 504
        : msg === 'missing_db_path' || msg === 'db_not_found' || msg === 'db_not_a_file'
          ? 404
          : msg === 'db_path_not_allowed'
            ? 403
            : msg === 'db_schema_unsupported'
              ? 422
              : 502
    void logPluginApiFailure('crowdsec', 'dashboard', msg, { dbPath, status })
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

export async function crowdsecServerHandler(ctx: PluginServerContext): Promise<Response> {
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
