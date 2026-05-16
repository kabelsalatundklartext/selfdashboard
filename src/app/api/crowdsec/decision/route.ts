import { NextRequest, NextResponse } from 'next/server'
import { crowdsecUnbanIp } from '@/lib/crowdsecDocker'

export const dynamic = 'force-dynamic'

/** POST — Entfernt eine IP-Sperre via `docker exec … cscli decisions delete` (optional, Docker-Socket nötig). */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const ip = typeof o.ip === 'string' ? o.ip.trim() : ''
  const container =
    typeof o.container === 'string' && o.container.trim()
      ? o.container.trim()
      : process.env.CROWDSEC_CONTAINER || 'crowdsec'

  if (!ip) return NextResponse.json({ error: 'missing_ip' }, { status: 400 })

  try {
    await crowdsecUnbanIp(container, ip)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'delete_failed'
    const status =
      msg === 'docker_unavailable' || msg === 'crowdsec_container_not_found'
        ? 503
        : msg === 'invalid_ip'
          ? 400
          : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
