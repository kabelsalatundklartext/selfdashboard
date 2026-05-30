/**
 * Helpers for plugin authors (browser / widget code only).
 * Import from here in `plugins/<id>/index.tsx` — do not import server-only modules.
 */

export { formatErrorDetail, reportPluginCatch, reportPluginError } from '@/lib/pluginLog'
export type { PluginLogOptions } from '@/lib/pluginLog'

import { kioskAwareFetch } from '@/lib/kiosk/kioskClientFetch'

function fetchAbortSignal(outer?: AbortSignal, timeoutMs?: number): { signal?: AbortSignal; cleanup: () => void } {
  const timers: ReturnType<typeof setTimeout>[] = []
  const cleanup = () => {
    for (const t of timers) clearTimeout(t)
  }
  const parts: AbortSignal[] = []
  if (outer) parts.push(outer)
  if (timeoutMs && timeoutMs > 0) {
    const tc = new AbortController()
    timers.push(setTimeout(() => tc.abort(), timeoutMs))
    parts.push(tc.signal)
  }
  if (parts.length === 0) return { signal: undefined, cleanup }
  if (parts.length === 1) return { signal: parts[0], cleanup }
  const anyFn = (AbortSignal as { any?: (signals: AbortSignal[]) => AbortSignal }).any
  if (typeof anyFn === 'function') return { signal: anyFn(parts), cleanup }
  const linked = new AbortController()
  const onAbort = () => linked.abort()
  for (const s of parts) {
    if (s.aborted) {
      linked.abort()
      break
    }
    s.addEventListener('abort', onAbort, { once: true })
  }
  return { signal: linked.signal, cleanup }
}

/**
 * Call same-origin SelfDashboard API routes from a widget.
 * Failed responses are logged automatically (Settings → Protokoll) via the global fetch hook.
 *
 * @param pluginId — must match `meta.id`
 * @param path — e.g. `/` → `/api/plugins/<pluginId>/`, or full `/api/...`
 */
export async function pluginApiJson<T>(
  pluginId: string,
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const url = path.startsWith('/api/')
    ? path
    : `/api/plugins/${pluginId}${path.startsWith('/') ? path : `/${path}`}`
  const { timeoutMs, signal: outerSignal, ...rest } = init ?? {}
  const { signal, cleanup } = fetchAbortSignal(outerSignal ?? undefined, timeoutMs)
  try {
    const res = await kioskAwareFetch(url, {
      ...rest,
      ...(signal ? { signal } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(rest.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try {
        const j = (await res.json()) as { error?: string; message?: string; loadError?: string }
        msg = j.error ?? j.message ?? msg
        if (j.loadError) msg = `${msg}: ${j.loadError}`
      } catch {
        /* body not json */
      }
      throw new Error(msg)
    }
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('timeout')
    throw e
  } finally {
    cleanup()
  }
}

function staleApiCacheKey(url: string): string {
  return `sd:stale-api:${url}`
}

function readStaleApiCache<T>(url: string, maxAgeMs: number): T | null {
  if (typeof sessionStorage === 'undefined' || maxAgeMs <= 0) return null
  try {
    const raw = sessionStorage.getItem(staleApiCacheKey(url))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt: number; body: T }
    if (!parsed || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > maxAgeMs) return null
    return parsed.body
  } catch {
    return null
  }
}

function writeStaleApiCache(url: string, body: unknown): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(staleApiCacheKey(url), JSON.stringify({ savedAt: Date.now(), body }))
  } catch {
    /* quota / private mode */
  }
}

/**
 * Return cached JSON immediately when fresh enough, then refresh in the background.
 * Helps widgets show last data on reload while the server warms up.
 */
export async function pluginApiJsonWithStale<T>(
  pluginId: string,
  path: string,
  init?: RequestInit & { timeoutMs?: number; staleMaxAgeMs?: number },
): Promise<T> {
  const url = path.startsWith('/api/')
    ? path
    : `/api/plugins/${pluginId}${path.startsWith('/') ? path : `/${path}`}`
  const staleMaxAgeMs = init?.staleMaxAgeMs ?? 60_000
  const cached = readStaleApiCache<T>(url, staleMaxAgeMs)
  if (cached !== null) {
    void pluginApiJson<T>(pluginId, path, init)
      .then((fresh) => writeStaleApiCache(url, fresh))
      .catch(() => {})
    return cached
  }
  const fresh = await pluginApiJson<T>(pluginId, path, init)
  writeStaleApiCache(url, fresh)
  return fresh
}
