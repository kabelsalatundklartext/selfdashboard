import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchCheckedJson } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  apiKey?: string
  apiSecret?: string
  insecureTls?: boolean
}

export type OpnsenseGatewayPayload = {
  name: string
  up: boolean
  delay: string | null
}

export type OpnsenseStatusPayload = {
  version: string | null
  productName: string | null
  updatesAvailable: boolean
  gateways: OpnsenseGatewayPayload[]
}

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t || null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/+$/, '')
  if (!t) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.username = ''
  u.password = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

function parseFirmwareStatus(json: unknown): {
  version: string | null
  productName: string | null
  updatesAvailable: boolean
} {
  if (!isObject(json)) return { version: null, productName: null, updatesAvailable: false }
  const product = isObject(json.product) ? json.product : null
  const version =
    str(json.product_version) ?? (product ? str(product.product_version) : null)
  const productName =
    str(json.product_name) ?? (product ? str(product.product_name) : null) ?? 'OPNsense'
  const newPackages = Array.isArray(json.new_packages) ? json.new_packages : null
  const upgradePackages = Array.isArray(json.upgrade_packages) ? json.upgrade_packages : null
  const updatesAvailable =
    str(json.status) === 'update' ||
    json.upgrade_needs_reboot === '1' ||
    json.upgrade_needs_reboot === 1 ||
    json.upgrade_needs_reboot === true ||
    (newPackages != null && newPackages.length > 0) ||
    (upgradePackages != null && upgradePackages.length > 0)
  return { version, productName, updatesAvailable }
}

function parseGateways(json: unknown): OpnsenseGatewayPayload[] {
  if (!isObject(json) || !Array.isArray(json.items)) return []
  const out: OpnsenseGatewayPayload[] = []
  for (const item of json.items) {
    if (!isObject(item)) continue
    const name = str(item.name)
    if (!name) continue
    const status = (str(item.status) ?? '').toLowerCase()
    out.push({
      name,
      up: status !== 'down',
      delay: str(item.delay),
    })
  }
  return out
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'invalid_url' }, { status: 400 })
  }
  const apiKey = String(body.apiKey ?? '').trim()
  const apiSecret = openSealedSecret(String(body.apiSecret ?? '').trim())
  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: 'missing_credentials', detail: 'API-Key und API-Secret in den Einstellungen eintragen.' },
      { status: 400 },
    )
  }
  const insecureTls = body.insecureTls === true

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const fw = await fetchCheckedJson(
      `${base}/api/core/firmware/status`,
      { method: 'GET', headers, signal: ac.signal },
      { insecureTls },
    )
    if (fw.status === 401 || fw.status === 403) {
      void logPluginApiFailure('opnsense', 'auth', 'auth_failed', { status: fw.status })
      return Response.json(
        { error: 'auth_failed', detail: 'API-Key/-Secret prüfen (System → Zugang → Benutzer → API-Schlüssel).' },
        { status: fw.status },
      )
    }
    if (!fw.ok || !isObject(fw.json)) {
      void logPluginApiFailure('opnsense', 'upstream', 'firmware_status_failed', { status: fw.status })
      return Response.json(
        {
          error: 'api_not_found',
          detail: `Firmware-Status nicht abrufbar (HTTP ${fw.status}). Basis-URL prüfen.`,
        },
        { status: 502 },
      )
    }
    const { version, productName, updatesAvailable } = parseFirmwareStatus(fw.json)

    let gateways: OpnsenseGatewayPayload[] = []
    try {
      const gw = await fetchCheckedJson(
        `${base}/api/routes/gateway/status`,
        { method: 'GET', headers, signal: ac.signal },
        { insecureTls },
      )
      if (gw.ok) gateways = parseGateways(gw.json)
    } catch {
      gateways = []
    }

    const payload: OpnsenseStatusPayload = { version, productName, updatesAvailable, gateways }
    return Response.json(payload)
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('opnsense', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('opnsense', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure('opnsense', 'request', 'tls_error', { message: msg })
      return Response.json({ error: 'tls_error', detail: msg }, { status: 502 })
    }
    void logPluginApiFailure('opnsense', 'request', 'network_error', { message: msg })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleOpnsensePluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function opnsenseServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleOpnsensePluginRequest(ctx.request, ctx.path)
}
