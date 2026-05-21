import 'server-only'

const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
const FETCH_TIMEOUT_MS = 15_000

async function fetchOpenMeteo(url: string): Promise<Response> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { cache: 'no-store', signal: ac.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function openMeteoGeocode(params: {
  name: string
  countryCode?: string
  language: string
}): Promise<unknown> {
  const q = new URLSearchParams({
    name: params.name.trim(),
    count: '8',
    language: params.language,
    format: 'json',
  })
  const cc = params.countryCode?.trim().toUpperCase()
  if (cc && cc.length === 2) q.set('countryCode', cc)

  const res = await fetchOpenMeteo(`${GEOCODE_BASE}?${q}`)
  if (!res.ok) throw new Error(`geocode_http_${res.status}`)
  return res.json()
}

export async function openMeteoForecast(params: {
  latitude: number
  longitude: number
  includeDaily: boolean
}): Promise<unknown> {
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    timezone: 'auto',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
  })
  if (params.includeDaily) {
    q.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
    q.set('forecast_days', '7')
  }

  const res = await fetchOpenMeteo(`${FORECAST_BASE}?${q}`)
  if (!res.ok) throw new Error(`forecast_http_${res.status}`)
  return res.json()
}
