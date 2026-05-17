import { formatErrorDetail } from '@/lib/pluginLog'
import { reportClientLog } from '@/lib/reportLog'
import type { LogLevel } from '@/lib/errorLogTypes'

const DEDUPE_MS = 4000
const recent = new Map<string, number>()

function shouldLog(key: string): boolean {
  const now = Date.now()
  const prev = recent.get(key)
  if (prev != null && now - prev < DEDUPE_MS) return false
  recent.set(key, now)
  if (recent.size > 200) {
    for (const [k, t] of recent) {
      if (now - t > DEDUPE_MS) recent.delete(k)
    }
  }
  return true
}

/** Map /api/... path to plugin id for log grouping. */
export function pluginIdFromApiUrl(url: string): string | undefined {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://local')
    if (!u.pathname.startsWith('/api/')) return undefined
    if (u.pathname.startsWith('/api/logs')) return undefined
    if (u.pathname.startsWith('/api/dashboard-state')) return undefined
    const seg = u.pathname.slice('/api/'.length).split('/').filter(Boolean)
    if (!seg.length) return undefined
    if (seg[0] === 'calendar') return 'calendar'
    if (seg[0] === 'docker-container-stats' || seg[0] === 'docker-containers') return 'docker'
    return seg[0]
  } catch {
    return undefined
  }
}

function logFetchFailure(
  url: string,
  message: string,
  detail?: string,
  level: LogLevel = 'error',
): void {
  const pluginId = pluginIdFromApiUrl(url)
  const key = `${pluginId ?? 'api'}:${message}:${url}`.slice(0, 240)
  if (!shouldLog(key)) return
  reportClientLog({
    level,
    source: pluginId ? 'plugin' : 'api',
    category: 'fetch',
    pluginId,
    message,
    detail: detail ? detail.slice(0, 4000) : undefined,
  })
}

let installed = false

/**
 * Wraps window.fetch once: failed same-origin /api/* responses and network errors
 * are sent to Settings → Protokoll (except /api/logs to avoid loops).
 */
export function installGlobalFetchLogger(): void {
  if (typeof window === 'undefined' || installed) return
  installed = true
  const native = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const isApi =
      url.startsWith('/api/') ||
      (url.startsWith('http') && typeof window !== 'undefined' && url.startsWith(window.location.origin + '/api/'))
    const skip = url.includes('/api/logs')

    try {
      const res = await native(input, init)
      if (isApi && !skip && !res.ok) {
        let detail: string | undefined
        let message = `${res.status} ${res.statusText}`.trim()
        try {
          const clone = res.clone()
          const ct = clone.headers.get('content-type') ?? ''
          if (ct.includes('application/json')) {
            const j = (await clone.json()) as Record<string, unknown>
            const err = j.error ?? j.message ?? j.syncError
            if (typeof err === 'string' && err.trim()) message = err.trim()
            detail = JSON.stringify(j).slice(0, 800)
          } else {
            const text = await clone.text()
            if (text.trim()) detail = text.slice(0, 800)
          }
        } catch {
          /* ignore body read */
        }
        logFetchFailure(url, message, `GET ${url}\n${detail ?? ''}`.trim())
      }
      return res
    } catch (e) {
      if (isApi && !skip) {
        logFetchFailure(url, e instanceof Error ? e.message : 'Network error', formatErrorDetail(e))
      }
      throw e
    }
  }
}
