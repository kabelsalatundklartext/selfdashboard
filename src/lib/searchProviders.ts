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
