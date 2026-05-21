import { NextRequest, NextResponse } from 'next/server'
import { openMeteoForecast, openMeteoGeocode } from '@/lib/openMeteo'
import { logPluginApiFailure } from '@/lib/pluginLogServer'

export const dynamic = 'force-dynamic'

/** Proxy Open-Meteo (geocode + forecast) — browser calls same-origin; server needs outbound HTTPS. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const action = sp.get('action')?.trim()

  try {
    if (action === 'geocode') {
      const name = sp.get('name')?.trim()
      if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 })
      const language = sp.get('language')?.trim() || 'de'
      const countryCode = sp.get('countryCode')?.trim() || undefined
      const data = await openMeteoGeocode({ name, countryCode, language })
      return NextResponse.json(data)
    }

    if (action === 'forecast') {
      const lat = Number(sp.get('latitude'))
      const lon = Number(sp.get('longitude'))
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return NextResponse.json({ error: 'invalid_coordinates' }, { status: 400 })
      }
      const includeDaily = sp.get('daily') === '1' || sp.get('daily') === 'true'
      const data = await openMeteoForecast({ latitude: lat, longitude: lon, includeDaily })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'open_meteo_error'
    const isAbort = e instanceof Error && e.name === 'AbortError'
    void logPluginApiFailure('weather', action ?? 'weather', isAbort ? 'timeout' : msg)
    return NextResponse.json(
      {
        error: isAbort ? 'timeout' : msg,
        hint: 'SelfDashboard container must reach geocoding-api.open-meteo.com and api.open-meteo.com (HTTPS outbound).',
      },
      { status: 502 },
    )
  }
}
