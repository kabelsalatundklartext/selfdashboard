import { logPluginApiFailure } from '../_shared/log'
import { readStore, saveConfig, type AlexaConfig } from './lib/store'
import {
  beginLogin,
  control,
  disconnect,
  getPlayer,
  listDevices,
  listRoutines,
  listSmarthome,
  loginPending,
  runRoutine,
  toggleSmarthome,
} from './lib/connection'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

// Allowed Amazon regions — keeps amazonPage/serviceHost to a known set.
const REGIONS: Record<string, { amazonPage: string; serviceHost: string }> = {
  de: { amazonPage: 'amazon.de', serviceHost: 'layla.amazon.de' },
  com: { amazonPage: 'amazon.com', serviceHost: 'pitangui.amazon.com' },
  'co.uk': { amazonPage: 'amazon.co.uk', serviceHost: 'alexa.amazon.co.uk' },
  'co.jp': { amazonPage: 'amazon.co.jp', serviceHost: 'alexa.amazon.co.jp' },
}

const PORT_MIN = 1024
const PORT_MAX = 65535

type ReqBody = {
  action?: string
  region?: string
  host?: string
  port?: number
  serial?: string
  command?: string
  value?: number
  id?: string
  on?: boolean
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data as Record<string, unknown>, { status })
}

function resolveConfig(body: ReqBody): AlexaConfig | null {
  const region = REGIONS[String(body.region ?? 'de')] ?? REGIONS.de
  const host = String(body.host ?? '').trim()
  const port = Number(body.port)
  if (!host || !/^[a-zA-Z0-9.\-:]+$/.test(host)) return null
  if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) return null
  return { host, port, amazonPage: region.amazonPage, serviceHost: region.serviceHost }
}

async function handleBegin(body: ReqBody): Promise<Response> {
  const cfg = resolveConfig(body)
  if (!cfg) return jsonResponse({ error: 'invalid_config' }, 400)
  await saveConfig(cfg)
  const { proxyUrl } = await beginLogin(cfg)
  return jsonResponse({ proxyUrl })
}

async function handleStatus(): Promise<Response> {
  const record = await readStore()
  return jsonResponse({
    connected: Boolean(record?.cookieData),
    customerName: record?.customerName,
    host: record?.host,
    port: record?.port,
    amazonPage: record?.amazonPage,
    loginPending: loginPending(),
  })
}

async function handleDevices(): Promise<Response> {
  return jsonResponse({ devices: await listDevices() })
}

async function handlePlayer(body: ReqBody): Promise<Response> {
  const serial = String(body.serial ?? '').trim()
  if (!serial) return jsonResponse({ error: 'missing_serial' }, 400)
  return jsonResponse(await getPlayer(serial))
}

async function handleControl(body: ReqBody): Promise<Response> {
  const serial = String(body.serial ?? '').trim()
  const command = String(body.command ?? '').trim()
  if (!serial || !command) return jsonResponse({ error: 'missing_params' }, 400)
  await control(serial, command, typeof body.value === 'number' ? body.value : undefined)
  return jsonResponse({ ok: true })
}

async function handleSmarthome(): Promise<Response> {
  return jsonResponse({ devices: await listSmarthome() })
}

async function handleSmarthomeToggle(body: ReqBody): Promise<Response> {
  const id = String(body.id ?? '').trim()
  if (!id) return jsonResponse({ error: 'missing_id' }, 400)
  await toggleSmarthome(id, body.on === true)
  return jsonResponse({ ok: true })
}

async function handleRoutines(): Promise<Response> {
  return jsonResponse({ routines: await listRoutines() })
}

async function handleRoutineRun(body: ReqBody): Promise<Response> {
  const id = String(body.id ?? '').trim()
  if (!id) return jsonResponse({ error: 'missing_id' }, 400)
  const serial = String(body.serial ?? '').trim() || undefined
  await runRoutine(id, serial)
  return jsonResponse({ ok: true })
}

async function handleDisconnect(): Promise<Response> {
  await disconnect()
  return jsonResponse({ ok: true })
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const action = String(body.action ?? 'status')
  try {
    switch (action) {
      case 'begin':
        return await handleBegin(body)
      case 'status':
        return await handleStatus()
      case 'devices':
        return await handleDevices()
      case 'player':
        return await handlePlayer(body)
      case 'control':
        return await handleControl(body)
      case 'smarthome':
        return await handleSmarthome()
      case 'smarthome-toggle':
        return await handleSmarthomeToggle(body)
      case 'routines':
        return await handleRoutines()
      case 'routine-run':
        return await handleRoutineRun(body)
      case 'disconnect':
        return await handleDisconnect()
      default:
        return jsonResponse({ error: 'invalid_action' }, 400)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'not_connected' || msg === 'reauth_required') {
      return jsonResponse({ error: msg }, 401)
    }
    if (msg === 'invalid_command' || msg === 'no_device' || msg === 'routine_not_found') {
      return jsonResponse({ error: msg }, 400)
    }
    void logPluginApiFailure('alexa', action, 'fetch_failed', { detail: msg })
    return jsonResponse({ error: 'fetch_failed', detail: msg }, 502)
  }
}

export default function alexaServerHandler(ctx: PluginServerContext): Promise<Response> {
  if (ctx.request.method !== 'POST') {
    return Promise.resolve(jsonResponse({ error: 'method_not_allowed' }, 405))
  }
  return handlePost(ctx.request)
}
