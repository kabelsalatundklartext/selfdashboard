/** Built-in web search targets — query is URL-encoded when opening. */

export type SearchProviderId =
  | 'google'
  | 'duckduckgo'
  | 'bing'
  | 'brave'
  | 'ecosia'
  | 'wikipedia-de'
  | 'wikipedia-en'

export interface SearchProviderDef {
  id: SearchProviderId
  /** Short label for navbar pills */
  label: { en: string; de: string }
  buildUrl: (query: string) => string
}

export const SEARCH_PROVIDER_LIST: SearchProviderDef[] = [
  {
    id: 'google',
    label: { en: 'Google', de: 'Google' },
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'duckduckgo',
    label: { en: 'DuckDuckGo', de: 'DuckDuckGo' },
    buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'bing',
    label: { en: 'Bing', de: 'Bing' },
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'brave',
    label: { en: 'Brave', de: 'Brave' },
    buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'ecosia',
    label: { en: 'Ecosia', de: 'Ecosia' },
    buildUrl: (q) => `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(q)}`,
  },
  {
    id: 'wikipedia-de',
    label: { en: 'Wiki DE', de: 'Wiki DE' },
    buildUrl: (q) => `https://de.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
  {
    id: 'wikipedia-en',
    label: { en: 'Wiki EN', de: 'Wiki EN' },
    buildUrl: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
  },
]

export const SEARCH_PROVIDER_IDS = SEARCH_PROVIDER_LIST.map((p) => p.id)

export function defaultSearchProviders(): Record<SearchProviderId, boolean> {
  return {
    google: true,
    duckduckgo: true,
    bing: false,
    brave: false,
    ecosia: false,
    'wikipedia-de': false,
    'wikipedia-en': false,
  }
}

export function normalizeSearchProviders(raw: unknown): Record<SearchProviderId, boolean> {
  const base = defaultSearchProviders()
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Record<string, boolean>
  for (const id of SEARCH_PROVIDER_IDS) {
    if (typeof o[id] === 'boolean') base[id] = o[id]
  }
  return base
}

export function firstEnabledProviderId(
  enabled: Record<SearchProviderId, boolean>,
  fallback: SearchProviderId = 'duckduckgo',
): SearchProviderId {
  for (const id of SEARCH_PROVIDER_IDS) {
    if (enabled[id]) return id
  }
  return fallback
}

/** User-defined search engine (name + URL template with `{q}` or `%s` for the query). */
export interface NavbarCustomSearchProvider {
  id: string
  name: string
  /** Must include `{q}` or `%s` once; query is URL-encoded when substituted. */
  urlTemplate: string
  enabled: boolean
}

const CUSTOM_SEARCH_ID_PREFIX = 'custom_'

export function newCustomSearchProviderId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${CUSTOM_SEARCH_ID_PREFIX}${crypto.randomUUID().replace(/-/g, '')}`
  }
  return `${CUSTOM_SEARCH_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function isHttpHttpsUrl(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Build final search URL from template; returns null if template is invalid or URL is not http(s). */
export function buildCustomSearchUrl(template: string, query: string): string | null {
  const raw = template.trim()
  const term = query.trim()
  if (!raw || !term) return null
  if (!/\{q\}|%s/i.test(raw)) return null
  const enc = encodeURIComponent(term)
  const joined = raw.includes('{q}') ? raw.split('{q}').join(enc) : raw.replace('%s', enc)
  if (!isHttpHttpsUrl(joined)) return null
  return joined
}

export function normalizeCustomSearchProviders(raw: unknown): NavbarCustomSearchProvider[] {
  if (!Array.isArray(raw)) return []
  const out: NavbarCustomSearchProvider[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const o = x as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id.trim() : ''
    if (!id.startsWith(CUSTOM_SEARCH_ID_PREFIX) || id.length > 80) continue
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : ''
    const urlTemplate = typeof o.urlTemplate === 'string' ? o.urlTemplate.trim().slice(0, 2000) : ''
    if (!name || !urlTemplate) continue
    if (!/\{q\}|%s/i.test(urlTemplate)) continue
    const enabled = o.enabled === false ? false : true
    out.push({ id, name, urlTemplate, enabled })
    if (out.length >= 20) break
  }
  return out
}

export function anySearchProviderEnabled(
  builtin: Record<SearchProviderId, boolean>,
  customs: NavbarCustomSearchProvider[],
): boolean {
  for (const id of SEARCH_PROVIDER_IDS) {
    if (builtin[id]) return true
  }
  return customs.some((c) => c.enabled)
}

/** First enabled builtin, else first enabled custom, else `fallback` builtin id. */
export function firstEnabledSearchTargetId(
  builtin: Record<SearchProviderId, boolean>,
  customs: NavbarCustomSearchProvider[],
  fallback: SearchProviderId = 'duckduckgo',
): string {
  for (const id of SEARCH_PROVIDER_IDS) {
    if (builtin[id]) return id
  }
  const c = customs.find((x) => x.enabled)
  if (c) return c.id
  return fallback
}

export function isSearchTargetEnabled(
  id: string,
  builtin: Record<SearchProviderId, boolean>,
  customs: NavbarCustomSearchProvider[],
): boolean {
  if ((SEARCH_PROVIDER_IDS as readonly string[]).includes(id)) {
    return Boolean(builtin[id as SearchProviderId])
  }
  const c = customs.find((x) => x.id === id)
  return Boolean(c?.enabled)
}

export function buildSearchUrlForQuery(
  id: string,
  query: string,
  customs: NavbarCustomSearchProvider[],
): string | null {
  const term = query.trim()
  if (!term) return null
  const builtin = SEARCH_PROVIDER_LIST.find((p) => p.id === id)
  if (builtin) return builtin.buildUrl(term)
  const c = customs.find((x) => x.id === id && x.enabled)
  if (!c) return null
  return buildCustomSearchUrl(c.urlTemplate, term)
}
