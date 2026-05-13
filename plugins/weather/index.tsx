'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'weather',
  name: 'Weather',
  description:
    'Stadt oder PLZ eingeben — Temperatur, gefühlt, Luftfeuchte, Wind und Bedingungen werden automatisch per Open-Meteo geladen (kein API-Key).',
  version: '1.0.0',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🌤️',
  configSchema: [
    {
      key: 'locationQuery',
      label: 'Stadt oder PLZ',
      type: 'text',
      placeholder: 'z. B. Berlin, Hamburg, 10115',
      defaultValue: '',
    },
    {
      key: 'countryCode',
      label: 'Land (ISO, optional)',
      type: 'text',
      placeholder: 'DE — hilft bei PLZ',
      defaultValue: 'DE',
    },
    {
      key: 'refreshMinutes',
      label: 'Aktualisieren alle (Minuten)',
      type: 'number',
      defaultValue: 15,
    },
  ],
}

interface GeoHit {
  name: string
  latitude: number
  longitude: number
  country_code?: string
  admin1?: string
}

interface GeocodeJson {
  results?: GeoHit[]
}

interface CurrentJson {
  temperature_2m?: number
  relative_humidity_2m?: number
  apparent_temperature?: number
  is_day?: number
  weather_code?: number
  wind_speed_10m?: number
  wind_direction_10m?: number
}

interface ForecastJson {
  current?: CurrentJson
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

function clampRefresh(v: unknown): number {
  const n = Math.round(num(v, 15))
  return Math.min(120, Math.max(5, n))
}

function formatPlace(hit: GeoHit): string {
  const parts = [hit.name, hit.admin1, hit.country_code].filter(Boolean)
  return parts.join(', ')
}

function windCompass(deg: number, de: boolean): string {
  const ro = de
    ? ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
    : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const i = Math.round(((deg % 360) + 360) % 360 / 45) % 8
  return ro[i] ?? 'N'
}

function wmoSummary(code: number, de: boolean): string {
  const c = Math.round(code)
  const m: Record<number, [string, string]> = {
    0: ['Klar', 'Clear'],
    1: ['Meist klar', 'Mainly clear'],
    2: ['Teils wolkig', 'Partly cloudy'],
    3: ['Bewölkt', 'Overcast'],
    45: ['Nebel', 'Fog'],
    48: ['Nebel mit Reif', 'Rime fog'],
    51: ['Nieselregen', 'Light drizzle'],
    53: ['Nieselregen', 'Drizzle'],
    55: ['Nieselregen', 'Dense drizzle'],
    56: ['Gefrierender Niesel', 'Freezing drizzle'],
    57: ['Gefrierender Niesel', 'Freezing drizzle'],
    61: ['Regen', 'Slight rain'],
    63: ['Regen', 'Moderate rain'],
    65: ['Starker Regen', 'Heavy rain'],
    66: ['Gefrierender Regen', 'Freezing rain'],
    67: ['Gefrierender Regen', 'Freezing rain'],
    71: ['Schnee', 'Slight snow'],
    73: ['Schnee', 'Moderate snow'],
    75: ['Starker Schneefall', 'Heavy snow'],
    77: ['Schneegriesel', 'Snow grains'],
    80: ['Regenschauer', 'Rain showers'],
    81: ['Regenschauer', 'Rain showers'],
    82: ['Starkregen', 'Violent rain showers'],
    85: ['Schneeschauer', 'Snow showers'],
    86: ['Schneeschauer', 'Snow showers'],
    95: ['Gewitter', 'Thunderstorm'],
    96: ['Gewitter mit Hagel', 'Thunderstorm & hail'],
    99: ['Gewitter mit Hagel', 'Thunderstorm & hail'],
  }
  const pair = m[c]
  if (pair) return de ? pair[0] : pair[1]
  return de ? 'Wetter' : 'Weather'
}

async function geocode(query: string, countryCode: string, signal: AbortSignal): Promise<GeoHit | null> {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'de',
    format: 'json',
  })
  const cc = countryCode.trim().toUpperCase()
  if (cc.length === 2) params.set('countryCode', cc)

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`)
  const j = (await res.json()) as GeocodeJson
  const first = j.results?.[0]
  if (!first) return null
  return first
}

async function fetchCurrent(lat: number, lon: number, signal: AbortSignal): Promise<CurrentJson> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Forecast HTTP ${res.status}`)
  const j = (await res.json()) as ForecastJson
  if (!j.current) throw new Error('Keine aktuellen Werte')
  return j.current
}

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'

  const locationQuery = str(config.locationQuery)
  const countryCode = str(config.countryCode)
  const refreshMinutes = clampRefresh(config.refreshMinutes)

  const [placeLabel, setPlaceLabel] = useState<string | null>(null)
  const [current, setCurrent] = useState<CurrentJson | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false

    async function run() {
      if (!locationQuery) {
        setPlaceLabel(null)
        setCurrent(null)
        setError(null)
        setUpdatedAt(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const hit = await geocode(locationQuery, countryCode, ac.signal)
        if (cancelled) return
        if (!hit) {
          setPlaceLabel(null)
          setCurrent(null)
          setError(de ? 'Ort nicht gefunden.' : 'Location not found.')
          setUpdatedAt(null)
          return
        }
        setPlaceLabel(formatPlace(hit))
        const cur = await fetchCurrent(hit.latitude, hit.longitude, ac.signal)
        if (cancelled) return
        setCurrent(cur)
        setUpdatedAt(new Date())
      } catch (e) {
        if (cancelled || (e as Error).name === 'AbortError') return
        setError(de ? 'Netzwerk- oder API-Fehler.' : 'Network or API error.')
        setCurrent(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    const ms = refreshMinutes * 60_000
    const id = window.setInterval(() => void run(), ms)
    return () => {
      cancelled = true
      ac.abort()
      window.clearInterval(id)
    }
  }, [locationQuery, countryCode, refreshMinutes, de])

  const t = useMemo(
    () => ({
      hint: de ? 'Stadt oder PLZ in den Einstellungen eintragen.' : 'Set city or postal code in settings.',
      temp: de ? 'Temperatur' : 'Temperature',
      feels: de ? 'Gefühlt' : 'Feels like',
      hum: de ? 'Luftfeuchte' : 'Humidity',
      wind: de ? 'Wind' : 'Wind',
      updated: de ? 'Stand' : 'Updated',
    }),
    [de],
  )

  const muted = 'var(--text-muted)'
  const text = 'var(--text)'

  if (!locationQuery) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0, lineHeight: 1.35 }}>{t.hint}</p>
      </div>
    )
  }

  if (error && !current) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 'clamp(20px, 8cqmin, 36px)', margin: 0 }}>🌧️</p>
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0 }}>{error}</p>
      </div>
    )
  }

  const temp = current?.temperature_2m
  const feels = current?.apparent_temperature
  const hum = current?.relative_humidity_2m
  const code = num(current?.weather_code, 0)
  const wdir = num(current?.wind_direction_10m, 0)
  const wspd = num(current?.wind_speed_10m, 0)
  const summary = wmoSummary(code, de)

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'clamp(4px, 1.2cqmin, 8px)',
        padding: 'clamp(6px, 2cqmin, 12px)',
        boxSizing: 'border-box',
      }}
    >
      {placeLabel && (
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(10px, 2.4cqmin, 12px)',
            fontWeight: 600,
            color: muted,
            textAlign: 'center',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={placeLabel}
        >
          {placeLabel}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span
          className="tabular-nums"
          style={{
            fontSize: 'clamp(1.4rem, min(10cqmin, 18vw), 2.75rem)',
            fontWeight: 800,
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {loading && temp == null ? '…' : temp != null ? `${Math.round(temp)}°` : '—'}
        </span>
        {feels != null && temp != null && Math.abs(feels - temp) >= 0.5 && (
          <span style={{ fontSize: 'clamp(10px, 2.2cqmin, 12px)', color: muted }}>
            {t.feels} {Math.round(feels)}°
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 'clamp(11px, 2.6cqmin, 14px)',
          color: text,
          fontWeight: 600,
          lineHeight: 1.25,
        }}
      >
        {summary}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(8px, 3cqmin, 16px)',
          flexWrap: 'wrap',
          fontSize: 'clamp(10px, 2.2cqmin, 12px)',
          color: muted,
        }}
      >
        {hum != null && (
          <span>
            {t.hum} {Math.round(hum)}%
          </span>
        )}
        {wspd > 0 && (
          <span>
            {t.wind} {Math.round(wspd)} km/h {windCompass(wdir, de)}
          </span>
        )}
      </div>

      {updatedAt && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 'clamp(9px, 2cqmin, 11px)', color: muted }}>
          {t.updated}: {updatedAt.toLocaleString(de ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const inp: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Stadt oder PLZ
        </label>
        <input
          style={inp}
          value={str(config.locationQuery)}
          onChange={(e) => onChange('locationQuery', e.target.value)}
          placeholder="z. B. Berlin, Köln, 80331"
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
          Nach dem Speichern lädt das Widget automatisch Wetterdaten (Open-Meteo). Bei PLZ optional Land setzen.
        </p>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Land (ISO, optional)
        </label>
        <input
          style={inp}
          value={str(config.countryCode)}
          onChange={(e) => onChange('countryCode', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
          placeholder="z. B. DE"
          maxLength={2}
        />
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Aktualisieren alle (Minuten)
        </label>
        <input
          style={inp}
          type="number"
          min={5}
          max={120}
          value={clampRefresh(config.refreshMinutes)}
          onChange={(e) => onChange('refreshMinutes', clampRefresh(e.target.value))}
        />
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        Wetterdaten:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
          Open-Meteo
        </a>{' '}
        (nicht kommerziell, ohne API-Key).
      </p>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
