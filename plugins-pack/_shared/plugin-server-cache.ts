type CacheEntry = { expires: number; data: unknown }

export type PluginServerCache = {
  get: (key: string) => unknown | null
  set: (key: string, data: unknown) => void
  delete: (key: string) => void
  clear: () => void
}

export function createPluginServerCache(options: {
  ttlMs: number
  maxEntries?: number
}): PluginServerCache {
  const maxEntries = Math.max(1, options.maxEntries ?? 32)
  const ttlMs = Math.max(0, options.ttlMs)
  const cache = new Map<string, CacheEntry>()

  function evictIfNeeded(): void {
    while (cache.size >= maxEntries) {
      const first = cache.keys().next().value
      if (!first) break
      cache.delete(first)
    }
  }

  return {
    get(key: string): unknown | null {
      const entry = cache.get(key)
      if (!entry) return null
      if (Date.now() > entry.expires) {
        cache.delete(key)
        return null
      }
      return entry.data
    },
    set(key: string, data: unknown): void {
      if (ttlMs <= 0) return
      evictIfNeeded()
      cache.set(key, { expires: Date.now() + ttlMs, data })
    },
    delete(key: string): void {
      cache.delete(key)
    },
    clear(): void {
      cache.clear()
    },
  }
}
