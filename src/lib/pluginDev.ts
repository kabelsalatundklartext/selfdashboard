/**
 * Helpers for plugin authors (browser / widget code only).
 * Import from here in `plugins/<id>/index.tsx` — do not import server-only modules.
 */

export { formatErrorDetail, reportPluginCatch, reportPluginError } from '@/lib/pluginLog'
export type { PluginLogOptions } from '@/lib/pluginLog'

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
    const res = await fetch(url, {
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
        const j = (await res.json()) as { error?: string; message?: string }
        msg = j.error ?? j.message ?? msg
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
