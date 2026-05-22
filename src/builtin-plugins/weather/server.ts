import { logPluginApiFailure } from '../_shared/log'

/** Inlined — volume server.mjs must not import @/lib (Next.js). */
type PluginServerContext = {
  pluginId: string
  path: string[]
  request: Request
}

const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
/** Per upstream call; resolve chains geocode + forecast. */
const FETCH_TIMEOUT_MS = 12_000
const FETCH_RETRIES = 1
const RESOLVE_BUDGET_MS = 28_000
const CACHE_TTL_MS = 8 * 60 * 1000
const CACHE_MAX = 64

type CacheEntry = { expires: number; data: unknown }
const cache = new Map<string, CacheEntry>()

type OpenMeteoPlace = {
  name: string
  latitude: number
  longitude: number
  country_code?: string
  admin1?: string
}

function cacheGet(key: string): unknown | null {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() > e.expires) {
    cache.delete(key)
    return null
  }
  return e.data
}

function cacheSet(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data })
}

async function fetchOpenMeteo(url: string): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { cache: 'no-store', signal: ac.signal })
      if (res.ok || res.status < 500 || attempt === FETCH_RETRIES) return res
      lastErr = new Error(`open_meteo_http_${res.status}`)
    } catch (e) {
      lastErr = e
      if (attempt === FETCH_RETRIES) throw e
    } finally {
      clearTimeout(timer)
    }
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
  }
  throw lastErr instanceof Error ? lastErr : new Error('open_meteo_fetch_failed')
}

async function openMeteoGeocode(params: {
  name: string
  countryCode?: string
  language: string
}): Promise<unknown> {
  const cc = params.countryCode?.trim().toUpperCase() ?? ''
  const cacheKey = `geo:${params.name.trim().toLowerCase()}:${cc}:${params.language}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const q = new URLSearchParams({
    name: params.name.trim(),
    count: '8',
    language: params.language,
    format: 'json',
  })
  if (cc.length === 2) q.set('countryCode', cc)

  const res = await fetchOpenMeteo(`${GEOCODE_BASE}?${q}`)
  if (!res.ok) throw new Error(`geocode_http_${res.status}`)
  const data = await res.json()
  cacheSet(cacheKey, data)
  return data
}

async function openMeteoForecast(params: {
  latitude: number
  longitude: number
  includeHourly?: boolean
  includeDaily?: boolean
}): Promise<unknown> {
  const cacheKey = `fc:${params.latitude.toFixed(4)}:${params.longitude.toFixed(4)}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    timezone: 'auto',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
  })
  if (params.includeHourly) q.set('hourly', 'temperature_2m')
  if (params.includeDaily) q.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  const days = params.includeDaily ? 8 : params.includeHourly ? 2 : 1
  q.set('forecast_days', String(days))

  const res = await fetchOpenMeteo(`${FORECAST_BASE}?${q}`)
  if (!res.ok) throw new Error(`forecast_http_${res.status}`)
  const data = await res.json()
  cacheSet(cacheKey, data)
  return data
}

function resolveBudgetAbort(): AbortSignal {
  const ac = new AbortController()
  setTimeout(() => ac.abort(), RESOLVE_BUDGET_MS)
  return ac.signal
}

async function openMeteoResolve(params: {
  name: string
  countryCode?: string
  language: string
  includeHourly?: boolean
  includeDaily?: boolean
}): Promise<{ place: OpenMeteoPlace; forecast: unknown }> {
  const cc = params.countryCode?.trim().toUpperCase() ?? ''
  const cacheKey = `resolve:${params.name.trim().toLowerCase()}:${cc}:${params.language}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}`
  const cached = cacheGet(cacheKey) as { place: OpenMeteoPlace; forecast: unknown } | null
  if (cached?.place && cached.forecast) return cached

  const budget = resolveBudgetAbort()
  const work = (async () => {
    const geo = (await openMeteoGeocode({
      name: params.name,
      countryCode: params.countryCode,
      language: params.language,
    })) as { results?: OpenMeteoPlace[] }
    const place = geo.results?.[0]
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      throw new Error('geocode_empty')
    }

    const forecast = await openMeteoForecast({
      latitude: place.latitude,
      longitude: place.longitude,
      includeHourly: params.includeHourly,
      includeDaily: params.includeDaily,
    })

    return { place, forecast }
  })()

  try {
    const raced =
      typeof AbortSignal !== 'undefined' && 'any' in AbortSignal
        ? await Promise.race([
            work,
            new Promise<never>((_, reject) => {
              budget.addEventListener(
                'abort',
                () => reject(Object.assign(new Error('resolve_budget'), { name: 'AbortError' })),
                { once: true },
              )
            }),
          ])
        : await work
    cacheSet(cacheKey, raced)
    return raced
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw Object.assign(new Error('timeout'), { name: 'AbortError' })
    }
    throw e
  }
}

function readIncludeFlags(sp: URLSearchParams): { includeHourly: boolean; includeDaily: boolean } {
  const includeHourly =
    sp.get('includeHourly') === '1' ||
    sp.get('includeHourly') === 'true' ||
    sp.has('hourly')
  const dailyParam = sp.get('daily')
  const includeDaily =
    sp.get('includeDaily') === '1' ||
    sp.get('includeDaily') === 'true' ||
    dailyParam === '1' ||
    dailyParam === 'true' ||
    sp.has('forecast_days') ||
    Boolean(dailyParam?.includes('weather_code'))
  return { includeHourly, includeDaily }
}

function resolveAction(req: Request, path: string[]): string {
  const segment = path[0]?.trim()
  if (segment === 'geocode' || segment === 'forecast' || segment === 'resolve') return segment
  const url = new URL(req.url)
  const legacy = url.searchParams.get('action')?.trim()
  if (legacy === 'geocode' || legacy === 'forecast' || legacy === 'resolve') return legacy
  return ''
}

export async function handleWeatherPluginRequest(req: Request, path: string[]): Promise<Response> {
  if (req.method !== 'GET') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const action = resolveAction(req, path)
  const sp = new URL(req.url).searchParams

  try {
    if (action === 'geocode') {
      const name = sp.get('name')?.trim()
      if (!name) return Response.json({ error: 'missing_name' }, { status: 400 })
      const language = sp.get('language')?.trim() || 'de'
      const countryCode = sp.get('countryCode')?.trim() || undefined
      const data = await openMeteoGeocode({ name, countryCode, language })
      return Response.json(data)
    }

    if (action === 'forecast') {
      const lat = Number(sp.get('latitude'))
      const lon = Number(sp.get('longitude'))
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json({ error: 'invalid_coordinates' }, { status: 400 })
      }
      const { includeHourly, includeDaily } = readIncludeFlags(sp)
      const data = await openMeteoForecast({ latitude: lat, longitude: lon, includeHourly, includeDaily })
      return Response.json(data)
    }

    if (action === 'resolve') {
      const name = sp.get('name')?.trim()
      if (!name) return Response.json({ error: 'missing_name' }, { status: 400 })
      const language = sp.get('language')?.trim() || 'de'
      const countryCode = sp.get('countryCode')?.trim() || undefined
      const { includeHourly, includeDaily } = readIncludeFlags(sp)
      const data = await openMeteoResolve({ name, countryCode, language, includeHourly, includeDaily })
      return Response.json(data)
    }

    return Response.json({ error: 'invalid_action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'open_meteo_error'
    const isAbort = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('weather', action || 'weather', isAbort ? 'timeout' : msg)
    return Response.json(
      {
        error: isAbort ? 'timeout' : msg,
        hint: 'Server must reach geocoding-api.open-meteo.com and api.open-meteo.com (HTTPS outbound).',
      },
      { status: 502 },
    )
  }
}

export function weatherServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleWeatherPluginRequest(ctx.request, ctx.path)
}

export default weatherServerHandler
