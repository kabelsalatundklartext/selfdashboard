import { NextResponse } from 'next/server'
import { assertSafeRemoteDockerBase, remoteDockerRequest } from '@/lib/dockerEngineRemote'
import { CONTAINER_ID_RE } from '@/lib/dockerShared'
import { parseOneShotStats, poolMap } from '@/lib/dockerEngine'

export const dynamic = 'force-dynamic'

const MAX_BODY = 48_000
const MAX_IDS = 120

type OpList = {
  op: 'list'
  baseUrl: string
  apiVersion?: string
  tlsInsecure?: boolean
  all?: boolean
  stats?: boolean
}

type OpStats = {
  op: 'stats'
  baseUrl: string
  apiVersion?: string
  tlsInsecure?: boolean
  ids: string[]
}

type OpAction = {
  op: 'action'
  baseUrl: string
  apiVersion?: string
  tlsInsecure?: boolean
  id: string
  action: 'start' | 'stop' | 'restart'
}

type Incoming = OpList | OpStats | OpAction

function normApiVersion(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) return 'v1.41'
  const cleaned = s.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!/^v\d+\.\d+$/i.test(cleaned)) return 'v1.41'
  return cleaned.toLowerCase()
}

function parseIncoming(body: unknown): Incoming | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const op = o.op
  const baseUrl = typeof o.baseUrl === 'string' ? o.baseUrl.trim() : ''
  if (!baseUrl) return null
  if (baseUrl.length > 512) return null
  try {
    assertSafeRemoteDockerBase(baseUrl)
  } catch {
    return null
  }
  const apiVersion = normApiVersion(o.apiVersion)
  const tlsInsecure = o.tlsInsecure === true

  if (op === 'list') {
    return {
      op: 'list',
      baseUrl,
      apiVersion,
      tlsInsecure,
      all: o.all === true,
      stats: o.stats === true,
    }
  }
  if (op === 'stats') {
    const idsRaw = o.ids
    if (!Array.isArray(idsRaw)) return null
    const ids = idsRaw
      .filter((x): x is string => typeof x === 'string' && CONTAINER_ID_RE.test(x.trim()))
      .map((x) => x.trim())
      .slice(0, MAX_IDS)
    return { op: 'stats', baseUrl, apiVersion, tlsInsecure, ids }
  }
  if (op === 'action') {
    const id = typeof o.id === 'string' ? o.id.trim() : ''
    const action = o.action
    if (!CONTAINER_ID_RE.test(id)) return null
    if (action !== 'start' && action !== 'stop' && action !== 'restart') return null
    return { op: 'action', baseUrl, apiVersion, tlsInsecure, id, action }
  }
  return null
}

/**
 * POST /api/unraid-docker
 * Proxies Docker Engine HTTP(S) API to a configurable host (e.g. Unraid with Docker TCP/TLS).
 * Body: { op: "list" | "stats" | "action", baseUrl, apiVersion?, tlsInsecure?, ... }
 */
export async function POST(req: Request) {
  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ error: 'Body konnte nicht gelesen werden' }, { status: 400 })
  }
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: 'Body zu groß' }, { status: 400 })
  }
  let body: unknown
  try {
    body = raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const parsed = parseIncoming(body)
  if (!parsed) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 })
  }

  const { baseUrl, apiVersion, tlsInsecure } = parsed

  try {
    if (parsed.op === 'list') {
      const all = parsed.all ? 'true' : 'false'
      const r = await remoteDockerRequest({
        baseUrl,
        apiVersion,
        method: 'GET',
        path: `containers/json?all=${all}`,
        tlsInsecure,
        timeoutMs: 20_000,
      })
      if (!r.ok) {
        return NextResponse.json(
          { error: r.body?.slice(0, 500) || `Docker HTTP ${r.status}` },
          { status: r.status >= 400 && r.status < 600 ? r.status : 502 },
        )
      }
      let data: unknown
      try {
        data = JSON.parse(r.body) as unknown
      } catch {
        return NextResponse.json({ error: 'Ungültige JSON-Antwort von Docker' }, { status: 502 })
      }
      if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Unerwartetes Antwortformat' }, { status: 502 })
      }

      if (parsed.stats) {
        const arr = data as Record<string, unknown>[]
        const runningIds: string[] = []
        for (const c of arr) {
          const id = typeof c.Id === 'string' ? c.Id : ''
          if (c.State === 'running' && CONTAINER_ID_RE.test(id)) runningIds.push(id)
        }
        const unique = [...new Set(runningIds)]
        const statsArray = await poolMap(unique, 8, async (id) => {
          const rs = await remoteDockerRequest({
            baseUrl,
            apiVersion,
            method: 'GET',
            path: `containers/${encodeURIComponent(id)}/stats?stream=false`,
            tlsInsecure,
            timeoutMs: 8000,
          })
          if (!rs.ok) return { id, stats: null as ReturnType<typeof parseOneShotStats> }
          return { id, stats: parseOneShotStats(rs.body) }
        })
        const byId = new Map(statsArray.map((x) => [x.id, x.stats]))
        for (const c of arr) {
          const id = typeof c.Id === 'string' ? c.Id : ''
          if (c.State === 'running' && CONTAINER_ID_RE.test(id)) {
            c.sdStats = byId.get(id) ?? null
          } else {
            c.sdStats = null
          }
        }
      }

      return NextResponse.json(data)
    }

    if (parsed.op === 'stats') {
      const stats: Record<string, ReturnType<typeof parseOneShotStats>> = {}
      const statsArray = await poolMap(parsed.ids, 10, async (id) => {
        const rs = await remoteDockerRequest({
          baseUrl,
          apiVersion,
          method: 'GET',
          path: `containers/${encodeURIComponent(id)}/stats?stream=false`,
          tlsInsecure,
          timeoutMs: 8000,
        })
        if (!rs.ok) return { id, stats: null }
        return { id, stats: parseOneShotStats(rs.body) }
      })
      for (const { id, stats: s } of statsArray) {
        stats[id] = s
      }
      return NextResponse.json({ stats })
    }

    const path =
      parsed.action === 'start'
        ? `containers/${encodeURIComponent(parsed.id)}/start`
        : parsed.action === 'stop'
          ? `containers/${encodeURIComponent(parsed.id)}/stop?t=10`
          : `containers/${encodeURIComponent(parsed.id)}/restart?t=10`

    const r = await remoteDockerRequest({
      baseUrl,
      apiVersion,
      method: 'POST',
      path,
      body: '',
      tlsInsecure,
      timeoutMs: 60_000,
    })
    if (!r.ok) {
      let msg = r.body?.slice(0, 500) || `Docker HTTP ${r.status}`
      try {
        const j = JSON.parse(r.body) as { message?: string }
        if (typeof j.message === 'string' && j.message.trim()) msg = j.message.trim()
      } catch {
        /* */
      }
      const status = r.status >= 400 && r.status < 600 ? r.status : 502
      return NextResponse.json({ error: msg }, { status })
    }
    return NextResponse.json({ ok: true, action: parsed.action, id: parsed.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
