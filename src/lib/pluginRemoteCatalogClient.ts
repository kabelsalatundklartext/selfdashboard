'use client'

/** Client-side cache for GET /api/plugins/remote-catalog (dedupes Navbar + UpdateBanner on load). */
export type RemoteCatalogPayload = {
  configured: boolean
  indexUrl?: string | null
  repository?: string | null
  ref?: string | null
  updatesCount: number
  available: Array<{
    id: string
    name?: string
    version?: string
    updateAvailable?: boolean
    installedVersion?: string | null
    installed?: boolean
    files?: string[]
    [key: string]: unknown
  }>
}

const CACHE_TTL_MS = 60_000

let cached: { at: number; data: RemoteCatalogPayload } | null = null
let inflight: Promise<RemoteCatalogPayload> | null = null

export function invalidateRemoteCatalogCache(): void {
  cached = null
}

function normalizeRemoteCatalog(data: Partial<RemoteCatalogPayload>): RemoteCatalogPayload {
  return {
    configured: !!data.configured,
    indexUrl: data.indexUrl ?? null,
    repository: data.repository ?? null,
    ref: data.ref ?? null,
    updatesCount: typeof data.updatesCount === 'number' ? data.updatesCount : 0,
    available: Array.isArray(data.available) ? data.available : [],
  }
}

export async function fetchRemoteCatalog(options?: { force?: boolean }): Promise<RemoteCatalogPayload> {
  const force = options?.force === true
  const now = Date.now()
  if (!force && cached && now - cached.at < CACHE_TTL_MS) {
    return cached.data
  }
  if (!force && inflight) {
    return inflight
  }

  inflight = (async () => {
    const res = await fetch('/api/plugins/remote-catalog', { cache: 'no-store' })
    if (!res.ok) throw new Error('remote_catalog_failed')
    const raw = (await res.json()) as Partial<RemoteCatalogPayload>
    const data = normalizeRemoteCatalog(raw)
    cached = { at: Date.now(), data }
    return data
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}
