import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchCheckedJson } from '../_shared/insecure-fetch'
import { UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type ReqBody = {
  url?: string
  apiToken?: string
  insecureTls?: boolean
}

export type ProxmoxNodePayload = {
  name: string
  status: string
  cpuPct: number | null
  memPct: number | null
  memUsedGb: number | null
  memTotalGb: number | null
  uptimeSec: number | null
}

export type ProxmoxPayload = {
  nodes: ProxmoxNodePayload[]
  vms: { running: number; total: number }
  lxc: { running: number; total: number }
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
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
  // Proxmox spricht standardmäßig HTTPS auf 8006.
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  if (!u.port && u.protocol === 'https:') u.port = '8006'
  u.username = ''
  u.password = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

function normalizeResources(json: unknown): ProxmoxPayload {
  const data = isObject(json) && Array.isArray(json.data) ? json.data : []
  const nodes: ProxmoxNodePayload[] = []
  const vms = { running: 0, total: 0 }
  const lxc = { running: 0, total: 0 }

  for (const entry of data) {
    if (!isObject(entry)) continue
    const type = str(entry.type)
    const status = str(entry.status) ?? 'unknown'
    if (type === 'node') {
      const cpu = num(entry.cpu) // Anteil 0..1
      const mem = num(entry.mem)
      const maxmem = num(entry.maxmem)
      const memPct = mem != null && maxmem != null && maxmem > 0 ? (mem / maxmem) * 100 : null
      nodes.push({
        name: str(entry.node) ?? str(entry.name) ?? '?',
        status,
        cpuPct: cpu != null ? cpu * 100 : null,
        memPct,
        memUsedGb: mem != null ? mem / 1024 ** 3 : null,
        memTotalGb: maxmem != null ? maxmem / 1024 ** 3 : null,
        uptimeSec: num(entry.uptime),
      })
    } else if (type === 'qemu') {
      vms.total += 1
      if (status === 'running') vms.running += 1
    } else if (type === 'lxc') {
      lxc.total += 1
      if (status === 'running') lxc.running += 1
    }
  }

  nodes.sort((a, b) => a.name.localeCompare(b.name))
  return { nodes, vms, lxc }
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

  const apiToken = openSealedSecret(String(body.apiToken ?? '').trim())
  if (!apiToken) {
    return Response.json(
      { error: 'missing_token', detail: 'API-Token fehlt (Format user@realm!tokenid=uuid).' },
      { status: 400 },
    )
  }
  const insecureTls = body.insecureTls !== false

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const r = await fetchCheckedJson(
      `${base}/api2/json/cluster/resources`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `PVEAPIToken=${apiToken}`,
        },
        signal: ac.signal,
      },
      { insecureTls },
    )

    if (r.status === 401 || r.status === 403) {
      void logPluginApiFailure('proxmox', 'auth', 'auth_failed', { status: r.status })
      return Response.json(
        {
          error: 'auth_failed',
          detail:
            'API-Token prüfen (Format user@realm!tokenid=uuid). Token braucht „Privilege Separation“ aus oder die Rolle PVEAuditor auf /.',
        },
        { status: r.status },
      )
    }
    if (!r.ok) {
      void logPluginApiFailure('proxmox', 'upstream', `http_${r.status}`, { status: r.status })
      return Response.json(
        { error: 'upstream_error', detail: `Proxmox antwortete mit HTTP ${r.status}.` },
        { status: 502 },
      )
    }

    return Response.json(normalizeResources(r.json))
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('proxmox', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('proxmox', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure('proxmox', 'request', 'tls_error', { message: msg })
      return Response.json(
        { error: 'tls_error', detail: 'TLS-Zertifikat abgelehnt — „Selbstsigniertes Zertifikat erlauben“ aktivieren.' },
        { status: 502 },
      )
    }
    void logPluginApiFailure('proxmox', 'request', 'network_error', { message: msg })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}

async function handleProxmoxPluginRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function proxmoxServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleProxmoxPluginRequest(ctx.request, ctx.path)
}
