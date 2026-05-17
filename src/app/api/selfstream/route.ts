import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12_000

type SelfstreamNowPlaying = {
  title?: string
  desc?: string
  start?: string
  stop?: string
}

type SelfstreamSessionRow = {
  user?: string
  channel?: string
  started_at?: number | string
  ip?: string
  now_playing?: SelfstreamNowPlaying | null
}

type SelfstreamCatchupRow = {
  user?: string
  channel?: string
  epg_title?: string
  catchup_time?: string
  duration?: number
  ip?: string
}

import type { SelfstreamDashboardPayload, SelfstreamNowPlayingItem } from '@/lib/selfstreamTypes'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export type { SelfstreamDashboardPayload, SelfstreamNowPlayingItem } from '@/lib/selfstreamTypes'

function parseBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  return new URL(withProto)
}

function finalizeBaseUrl(u: URL): string {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  u.username = ''
  u.password = ''
  u.hash = ''
  let path = u.pathname.replace(/\/+$/, '') || ''
  if (path.endsWith('/admin')) {
    path = path.slice(0, -'/admin'.length) || '/'
    u.pathname = path
  }
  let out = u.toString()
  if (out.endsWith('/')) out = out.slice(0, -1)
  return out
}

function normalizeBase(raw: string): string {
  return finalizeBaseUrl(parseBase(raw))
}

function apiEndpoint(base: string, apiPath: string): string {
  const path = apiPath.replace(/^\//, '')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return new URL(path, prefix).toString()
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function num(v: unknown): number {
  if (v == null || v === '') return 0
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v))
  return Number.isFinite(n) ? n : 0
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function sessionTitle(channel: string, np: SelfstreamNowPlaying | null | undefined): string {
  const t = str(np?.title)
  if (t) return t
  return channel || '—'
}

function elapsedFromStarted(started: number | string | undefined): number {
  const now = Math.floor(Date.now() / 1000)
  const s = num(started)
  if (s <= 0) return 0
  // Unix seconds (selfstream active_sessions) or ms
  const sec = s > 1e12 ? Math.floor(s / 1000) : Math.floor(s)
  return Math.max(0, now - sec)
}

function mapLive(row: SelfstreamSessionRow): SelfstreamNowPlayingItem {
  const channel = str(row.channel)
  const np = row.now_playing
  return {
    user: str(row.user) || '—',
    channel,
    title: sessionTitle(channel, np),
    durationSec: elapsedFromStarted(row.started_at),
    isCatchup: false,
    ip: str(row.ip),
  }
}

function mapCatchup(row: SelfstreamCatchupRow): SelfstreamNowPlayingItem {
  const channel = str(row.channel)
  const title = str(row.epg_title) || channel || '—'
  return {
    user: str(row.user) || '—',
    channel,
    title,
    durationSec: Math.max(0, Math.floor(num(row.duration))),
    isCatchup: true,
    ip: str(row.ip),
  }
}

function normalizeStats(json: unknown): SelfstreamDashboardPayload {
  if (!isObject(json)) {
    return { activeStreams: 0, sessions: [] }
  }
  const live = Array.isArray(json.active_sessions)
    ? (json.active_sessions as SelfstreamSessionRow[]).map(mapLive)
    : []
  const catchup = Array.isArray(json.active_catchup)
    ? (json.active_catchup as SelfstreamCatchupRow[]).map(mapCatchup)
    : []
  const sessions = [...live, ...catchup]
  const activeStreams = num(json.active_streams) || sessions.length
  return { activeStreams, sessions }
}

type ReqBody = {
  url?: string
  password?: string
}

export async function POST(req: Request) {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? process.env.SELFSTREAM_URL ?? ''))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_url'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const password = String(body.password ?? process.env.SELFSTREAM_ADMIN_TOKEN ?? '').trim()
  if (!password) {
    return NextResponse.json({ error: 'missing_password' }, { status: 400 })
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

  try {
    const url = apiEndpoint(base, '/api/stats')
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Admin-Token': password,
      },
      cache: 'no-store',
      signal: ac.signal,
    })
    const text = await res.text()
    let json: unknown = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    if (!res.ok) {
      const detail =
        isObject(json) && typeof json.detail === 'string'
          ? json.detail
          : text.slice(0, 200) || `HTTP ${res.status}`
      const error =
        res.status === 401
          ? 'auth_failed'
          : res.status === 429
            ? 'rate_limited'
            : res.status === 404
              ? 'api_not_found'
              : 'selfstream_error'
      void logPluginApiFailure('selfstream', 'upstream', error, { upstreamStatus: res.status, detail })
      return NextResponse.json({ error, detail }, { status: res.status === 401 ? 401 : 502 })
    }
    return NextResponse.json(normalizeStats(json))
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('selfstream', 'request', 'timeout')
      return NextResponse.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('selfstream', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return NextResponse.json({ error: 'network_error' }, { status: 502 })
  } finally {
    clearTimeout(t)
  }
}
