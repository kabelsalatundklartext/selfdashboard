import { NextRequest, NextResponse } from 'next/server'
import {
  configureWhitelistLoop,
  getWhitelistStatus,
  parseWhitelistConfigFromSearchParams,
  runWhitelistUpdate,
} from '@/lib/crowdsecWhitelist'

export const dynamic = 'force-dynamic'

/** GET — Whitelist-Status; startet Hintergrund-Loop wenn aktiviert. POST — sofortiger Update-Lauf. */
export async function GET(req: NextRequest) {
  const cfg = parseWhitelistConfigFromSearchParams(req.nextUrl.searchParams)
  try {
    if (cfg.enabled) configureWhitelistLoop(cfg)
    const force = req.nextUrl.searchParams.get('force') === '1'
    const data = force && cfg.enabled ? await runWhitelistUpdate(cfg) : getWhitelistStatus()
    return NextResponse.json({ ...data, enabled: cfg.enabled })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'whitelist_error'
    const status = msg === 'whitelist_path_not_allowed' ? 403 : 502
    return NextResponse.json({ error: msg, status: 'fehler' }, { status })
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    const j = await req.json()
    if (j && typeof j === 'object') body = j as Record<string, unknown>
  } catch {
    /* use query only */
  }
  const sp = new URLSearchParams(req.nextUrl.searchParams)
  if (body.whitelistEnabled != null) sp.set('whitelistEnabled', String(body.whitelistEnabled))
  if (body.whitelistPath != null) sp.set('whitelistPath', String(body.whitelistPath))
  if (body.whitelistInterval != null) sp.set('whitelistInterval', String(body.whitelistInterval))
  if (body.crowdsecContainer != null) sp.set('crowdsecContainer', String(body.crowdsecContainer))
  if (body.whitelistRestartWait != null) sp.set('whitelistRestartWait', String(body.whitelistRestartWait))

  const cfg = parseWhitelistConfigFromSearchParams(sp)
  if (!cfg.enabled) {
    return NextResponse.json({ error: 'whitelist_disabled' }, { status: 400 })
  }
  try {
    const data = await runWhitelistUpdate(cfg)
    configureWhitelistLoop(cfg)
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'whitelist_error'
    const status = msg === 'whitelist_path_not_allowed' ? 403 : 502
    return NextResponse.json({ error: msg, status: 'fehler' }, { status })
  }
}
