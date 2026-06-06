import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 15_000

type ChannelRef = { interface?: string; address?: string }

type ReqBody = {
  url?: string
  username?: string
  password?: string
  action?: 'list' | 'state' | 'set'
  /** state: channels to read (interface + channel address). */
  channels?: ChannelRef[]
  /** set: what kind of thing to control. */
  kind?: 'device' | 'program' | 'sysvar'
  interface?: string
  address?: string
  valueKey?: string
  valueType?: 'boolean' | 'double' | 'integer' | 'string'
  value?: unknown
  /** set program / sysvar by ise id. */
  id?: string
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
}

function normalizeBase(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.pathname = ''
  u.search = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

type RpcResult = { ok: boolean; status: number; result: unknown; error: unknown }

async function rpc(
  base: string,
  method: string,
  params: Record<string, unknown>,
  signal: AbortSignal,
): Promise<RpcResult> {
  const res = await fetchWithSsrfGuard(`${base}/api/homematic.cgi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: '1.1', method, params, id: Date.now() }),
    cache: 'no-store',
    signal,
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  const result = isObject(json) ? json.result : undefined
  const error = isObject(json) ? json.error : undefined
  return { ok: res.ok, status: res.status, result, error }
}

/** Map a Device.listAllDetail entry to a compact device with channels. */
type MappedChannel = { address: string; name: string; index: number }
type MappedDevice = { address: string; name: string; type: string; interface: string; channels: MappedChannel[] }

function mapDevices(result: unknown): MappedDevice[] {
  if (!Array.isArray(result)) return []
  const out: MappedDevice[] = []
  for (const d of result) {
    if (!isObject(d)) continue
    const address = str(d.address)
    if (!address) continue
    const iface = str(d.interface) || 'BidCos-RF'
    const channelsRaw = Array.isArray(d.channels) ? d.channels : []
    const channels: MappedChannel[] = []
    for (const c of channelsRaw) {
      if (!isObject(c)) continue
      const caddr = str(c.address)
      if (!caddr || !caddr.includes(':')) continue // skip device-level (:0 maintenance often kept, but require channel form)
      const idx = Number(caddr.split(':')[1])
      channels.push({ address: caddr, name: str(c.name) || caddr, index: Number.isFinite(idx) ? idx : 0 })
    }
    out.push({
      address,
      name: str(d.name) || address,
      type: str(d.type),
      interface: iface,
      channels,
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

type MappedSysvar = { id: string; name: string; value: unknown; unit: string; type: string }

function mapSysvars(result: unknown): MappedSysvar[] {
  if (!Array.isArray(result)) return []
  const out: MappedSysvar[] = []
  for (const s of result) {
    if (!isObject(s)) continue
    const name = str(s.name)
    if (!name) continue
    out.push({
      id: str(s.id) || str(s.ise_id),
      name,
      value: s.value,
      unit: str(s.unit),
      type: str(s.type) || str(s.valueType),
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

type MappedProgram = { id: string; name: string }

function mapPrograms(result: unknown): MappedProgram[] {
  if (!Array.isArray(result)) return []
  const out: MappedProgram[] = []
  for (const p of result) {
    if (!isObject(p)) continue
    const id = str(p.id) || str(p.ise_id)
    const name = str(p.name)
    if (!id || !name) continue
    out.push({ id, name })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

async function login(base: string, username: string, password: string, signal: AbortSignal): Promise<string | null> {
  const r = await rpc(base, 'Session.login', { username, password }, signal)
  const sid = str(r.result)
  return sid || null
}

async function logout(base: string, sid: string, signal: AbortSignal): Promise<void> {
  try {
    await rpc(base, 'Session.logout', { _session_id_: sid }, signal)
  } catch {
    /* best effort */
  }
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

  const username = str(body.username)
  const password = openSealedSecret(str(body.password))
  if (!username || !password) {
    return Response.json(
      { error: 'missing_credentials', detail: 'CCU-Benutzer und Passwort eintragen.' },
      { status: 400 },
    )
  }

  const action = body.action ?? 'state'
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  let sid: string | null = null

  try {
    sid = await login(base, username, password, ac.signal)
    if (!sid) {
      void logPluginApiFailure('homematic', 'auth', 'auth_failed')
      return Response.json(
        { error: 'auth_failed', detail: 'Login abgelehnt — CCU-Benutzer/Passwort prüfen.' },
        { status: 401 },
      )
    }

    // --- Settings picker: full lists of devices, sysvars and programs ---
    if (action === 'list') {
      const [dev, sys, prg] = await Promise.all([
        rpc(base, 'Device.listAllDetail', { _session_id_: sid }, ac.signal),
        rpc(base, 'SysVar.getAll', { _session_id_: sid }, ac.signal),
        rpc(base, 'Program.getAll', { _session_id_: sid }, ac.signal),
      ])
      return Response.json({
        devices: mapDevices(dev.result),
        sysvars: mapSysvars(sys.result),
        programs: mapPrograms(prg.result),
      })
    }

    // --- Control: switch/dim a device datapoint, run a program ---
    if (action === 'set') {
      if (body.kind === 'program') {
        const id = str(body.id)
        if (!/^[0-9]+$/.test(id)) return Response.json({ error: 'invalid_id' }, { status: 400 })
        const r = await rpc(base, 'Program.execute', { _session_id_: sid, id }, ac.signal)
        if (r.error) {
          void logPluginApiFailure('homematic', 'set', 'program_failed')
          return Response.json({ error: 'set_failed' }, { status: 502 })
        }
        return Response.json({ ok: true })
      }

      // device datapoint
      const iface = str(body.interface) || 'BidCos-RF'
      const address = str(body.address)
      const valueKey = str(body.valueKey)
      if (!address || !address.includes(':') || !valueKey) {
        return Response.json({ error: 'invalid_target' }, { status: 400 })
      }
      const vType = body.valueType ?? 'boolean'
      let value: unknown = body.value
      if (vType === 'boolean') value = body.value === true || body.value === 'true' || body.value === 1
      else if (vType === 'double' || vType === 'integer') value = num(body.value) ?? 0
      else value = str(body.value)
      const r = await rpc(
        base,
        'Interface.setValue',
        { _session_id_: sid, interface: iface, address, valueKey, type: vType, value },
        ac.signal,
      )
      if (r.error) {
        void logPluginApiFailure('homematic', 'set', 'device_failed')
        return Response.json({ error: 'set_failed' }, { status: 502 })
      }
      return Response.json({ ok: true })
    }

    // --- State: read selected channel values + all sysvars ---
    const channels = Array.isArray(body.channels) ? body.channels : []
    const valuesByAddress: Record<string, Record<string, unknown>> = {}
    await Promise.all(
      channels.slice(0, 40).map(async (ch) => {
        const iface = str(ch.interface) || 'BidCos-RF'
        const address = str(ch.address)
        if (!address || !address.includes(':')) return
        const r = await rpc(
          base,
          'Interface.getParamset',
          { _session_id_: sid, interface: iface, address, paramsetKey: 'VALUES' },
          ac.signal,
        )
        if (isObject(r.result)) valuesByAddress[address] = r.result as Record<string, unknown>
      }),
    )
    const sys = await rpc(base, 'SysVar.getAll', { _session_id_: sid }, ac.signal)
    return Response.json({ channels: valuesByAddress, sysvars: mapSysvars(sys.result) })
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('homematic', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('homematic', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('homematic', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    if (sid) await logout(base, sid, ac.signal)
    clearTimeout(t)
  }
}

async function handleHomematicPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function homematicServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleHomematicPluginRequest(ctx.request, ctx.path)
}
