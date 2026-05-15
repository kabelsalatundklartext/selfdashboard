'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'weather',
  name: 'Weather',
  description:
    'Stadt oder PLZ — aktuelles Wetter (Temperatur, gefühlt, Luftfeuchte, Wind) per Open-Meteo. Optional 7-Tage-Vorschau (Max/Min, Symbol pro Tag), einstellbare Kartenbreite, Ort optional ausblendbar. Kein API-Key.',
  version: '1.2.1',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🌤️',
  /** Gestapelte Ansicht: +2 Zeilen, damit Vorschau/„Nächste Tage“ nicht abgeschnitten wirkt. */
  stackedExtraH: 2,
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
    {
      key: 'showDailyForecast',
      label: '7-Tage-Vorschau',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'showPlaceLabel',
      label: 'Ort / Stadtnamen anzeigen',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'dailyForecastWidthPct',
      label: '7-Tage: Kartenbreite (%)',
      type: 'number',
      defaultValue: 100,
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
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
  }
}

interface DailyDay {
  date: string
  code: number
  max: number
  min: number
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

/** 70–130 %: skaliert Mindestbreite und Typo der 7-Tage-Karten. */
function clampDailyForecastWidthPct(v: unknown): number {
  const n = Math.round(num(v, 100))
  return Math.min(130, Math.max(70, n))
}

function dailyTypeClamp(scale: number, minPx: number, cq: number, maxPx: number): string {
  return `clamp(${Math.max(5, Math.round(minPx * scale))}px, ${(cq * scale).toFixed(2)}cqmin, ${Math.max(6, Math.round(maxPx * scale))}px)`
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

/** WMO-Code → Akzentfarbe für das Wetter-Icon (Lucide nutzt `currentColor` / Stroke) */
function wmoIconColor(code: number, isDay: boolean): string {
  const c = Math.round(code)
  if (c === 95 || c === 96 || c === 99) return '#f97316' // Gewitter
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return '#7dd3fc' // Schnee
  if (c === 61 || c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return '#3b82f6' // Regen
  if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return '#38bdf8' // Niesel / gefrierend
  if (c === 45 || c === 48) return '#9ca3af' // Nebel
  if (c === 3) return '#94a3b8' // stark bewölkt
  if (c === 2) return isDay ? '#fcd34d' : '#a5b4fc' // teils bewölkt
  if (c === 1) return isDay ? '#fde047' : '#c4b5fd' // meist klar
  if (c === 0) return isDay ? '#facc15' : '#a5b4fc' // klar: Sonne / Mond
  return '#94a3b8'
}

function wmoIconGlowFilter(code: number, isDay: boolean): string {
  const rgb = wmoIconColor(code, isDay)
  return `drop-shadow(0 2px 8px color-mix(in srgb, ${rgb} 45%, transparent))`
}

/** WMO weather code + Open-Meteo `is_day` → Lucide icon (SVG, theme-aware color from parent). */
function wmoIconComponent(code: number, isDay: boolean): LucideIcon {
  const c = Math.round(code)
  if (c === 95 || c === 96 || c === 99) return CloudLightning
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return CloudSnow
  if (c === 61 || c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return CloudRain
  if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return CloudDrizzle
  if (c === 45 || c === 48) return CloudFog
  if (c === 3) return Cloud
  if (c === 2) return isDay ? CloudSun : CloudMoon
  if (c === 1) return isDay ? CloudSun : CloudMoon
  if (c === 0) return isDay ? Sun : Moon
  return Cloud
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

async function geocode(query: string, countryCode: string, signal: AbortSignal, lang: 'de' | 'en'): Promise<GeoHit | null> {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: lang,
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

function parseDailyForecast(j: ForecastJson, maxDays: number): DailyDay[] {
  const d = j.daily
  if (!d?.time?.length) return []
  const codes = d.weather_code ?? []
  const maxT = d.temperature_2m_max ?? []
  const minT = d.temperature_2m_min ?? []
  const out: DailyDay[] = []
  const n = Math.min(maxDays, d.time.length, codes.length, maxT.length, minT.length)
  for (let i = 0; i < n; i++) {
    const date = d.time[i]!
    const code = num(codes[i], 0)
    out.push({
      date,
      code,
      max: num(maxT[i], NaN),
      min: num(minT[i], NaN),
    })
  }
  return out.filter((x) => Number.isFinite(x.max) && Number.isFinite(x.min))
}

async function fetchForecast(
  lat: number,
  lon: number,
  signal: AbortSignal,
  de: boolean,
  includeDaily: boolean,
): Promise<{ current: CurrentJson; daily: DailyDay[] }> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',
  })
  if (includeDaily) {
    params.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
    params.set('forecast_days', '7')
  }
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Forecast HTTP ${res.status}`)
  const j = (await res.json()) as ForecastJson
  if (!j.current) throw new Error(de ? 'Keine aktuellen Werte' : 'No current values')
  const daily = includeDaily ? parseDailyForecast(j, 7) : []
  return { current: j.current, daily }
}

/** Ab dieser Widget-Breite (px): aktuelles Wetter links, 7-Tage-Vorschau rechts (mit gleichmäßigem Tages-Raster). */
const WEATHER_SPLIT_MIN_PX = 420

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'

  const locationQuery = str(config.locationQuery)
  const countryCode = str(config.countryCode)
  const refreshMinutes = clampRefresh(config.refreshMinutes)
  const showDailyForecast = (config as Record<string, unknown>).showDailyForecast === true
  const showPlaceLabel = (config as Record<string, unknown>).showPlaceLabel !== false
  const dailyForecastScale = clampDailyForecastWidthPct((config as Record<string, unknown>).dailyForecastWidthPct) / 100

  const [placeLabel, setPlaceLabel] = useState<string | null>(null)
  const [current, setCurrent] = useState<CurrentJson | null>(null)
  const [daily, setDaily] = useState<DailyDay[]>([])
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
        setDaily([])
        setError(null)
        setUpdatedAt(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const hit = await geocode(locationQuery, countryCode, ac.signal, de ? 'de' : 'en')
        if (cancelled) return
        if (!hit) {
          setPlaceLabel(null)
          setCurrent(null)
          setDaily([])
          setError(de ? 'Ort nicht gefunden.' : 'Location not found.')
          setUpdatedAt(null)
          return
        }
        setPlaceLabel(formatPlace(hit))
        const { current: cur, daily: dail } = await fetchForecast(hit.latitude, hit.longitude, ac.signal, de, showDailyForecast)
        if (cancelled) return
        setCurrent(cur)
        setDaily(dail)
        setUpdatedAt(new Date())
      } catch (e) {
        if (cancelled || (e as Error).name === 'AbortError') return
        setError(de ? 'Netzwerk- oder API-Fehler.' : 'Network or API error.')
        setCurrent(null)
        setDaily([])
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
  }, [locationQuery, countryCode, refreshMinutes, de, showDailyForecast])

  const rootRef = useRef<HTMLDivElement>(null)
  const [splitLayout, setSplitLayout] = useState(false)

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const w = el.getBoundingClientRect().width
      const next = w >= WEATHER_SPLIT_MIN_PX && showDailyForecast && daily.length > 0
      setSplitLayout((p) => (p === next ? p : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showDailyForecast, daily.length])

  const t = useMemo(
    () => ({
      hint: de ? 'Stadt oder PLZ in den Einstellungen eintragen.' : 'Set city or postal code in settings.',
      temp: de ? 'Temperatur' : 'Temperature',
      feels: de ? 'Gefühlt' : 'Feels like',
      hum: de ? 'Luftfeuchte' : 'Humidity',
      wind: de ? 'Wind' : 'Wind',
      updated: de ? 'Stand' : 'Updated',
      nextDays: de ? 'Nächste Tage' : 'Next days',
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
        <CloudOff
          aria-hidden
          strokeWidth={1.75}
          style={{
            width: 'clamp(26px, 9cqmin, 40px)',
            height: 'clamp(26px, 9cqmin, 40px)',
            color: '#fb7185',
            filter: 'drop-shadow(0 2px 6px rgba(251, 113, 133, 0.35))',
          }}
        />
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0 }}>{error}</p>
      </div>
    )
  }

  const temp = current?.temperature_2m
  const feels = current?.apparent_temperature
  const hum = current?.relative_humidity_2m
  const code = num(current?.weather_code, 0)
  const isDay = (current?.is_day ?? 1) === 1
  const wdir = num(current?.wind_direction_10m, 0)
  const wspd = num(current?.wind_speed_10m, 0)
  const summary = wmoSummary(code, de)
  const WeatherIcon = wmoIconComponent(code, isDay)
  const iconColor = wmoIconColor(code, isDay)
  const iconGlow = wmoIconGlowFilter(code, isDay)

  const hasDaily = showDailyForecast && daily.length > 0
  const splitView = splitLayout && hasDaily

  const dayScale = dailyForecastScale
  const dayScrollMinW = `${Math.min(72, Math.max(36, Math.round(48 * dayScale)))}px`
  const dayGapFlex = `${Math.max(3, Math.round(6 * dayScale))}px`
  const dayGapGrid = `${Math.max(2, Math.round(5 * dayScale))}px`

  return (
    <div
      ref={rootRef}
      style={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        containerType: 'size',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(4px, 1.1cqmin, 8px)',
        padding: 'clamp(6px, 2cqmin, 12px)',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      {placeLabel && showPlaceLabel && (
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
            flexShrink: 0,
          }}
          title={placeLabel}
        >
          {placeLabel}
        </p>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: splitView ? 'row' : 'column',
          alignItems: splitView ? 'stretch' : undefined,
          justifyContent: splitView ? 'flex-start' : 'center',
          gap: splitView ? 'clamp(10px, 2.2cqmin, 20px)' : undefined,
        }}
      >
        <div
          style={{
            flex: splitView ? '0 1 44%' : undefined,
            maxWidth: splitView ? '48%' : undefined,
            minWidth: splitView ? 0 : undefined,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(4px, 1.2cqmin, 8px)',
            ...(splitView
              ? {
                  paddingRight: 'clamp(6px, 1.5cqmin, 12px)',
                  borderRight: '1px solid color-mix(in srgb, var(--border) 55%, transparent)',
                }
              : {}),
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: iconColor,
              minHeight: 'clamp(26px, 10cqmin, 52px)',
            }}
            aria-label={summary}
            title={summary}
          >
            <WeatherIcon
              aria-hidden
              strokeWidth={1.75}
              style={{
                width: 'clamp(28px, 11cqmin, 56px)',
                height: 'clamp(28px, 11cqmin, 56px)',
                color: iconColor,
                filter: iconGlow,
                opacity: loading && temp == null ? 0.45 : 1,
                transition: 'opacity 0.2s, color 0.35s ease',
              }}
            />
          </div>

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
        </div>

        {hasDaily && (
          <div
            style={{
              flex: splitView ? '1 1 0' : undefined,
              minWidth: splitView ? 0 : undefined,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: splitView ? 'center' : undefined,
              marginTop: splitView ? 0 : 'clamp(2px, 0.8cqmin, 6px)',
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                textAlign: 'center',
                fontSize: 'clamp(9px, 2cqmin, 11px)',
                fontWeight: 600,
                color: muted,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {t.nextDays}
            </p>
            <div
              style={
                splitView
                  ? {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      gap: dayGapGrid,
                      width: '100%',
                      minHeight: 0,
                      alignContent: 'center',
                    }
                  : {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: dayGapFlex,
                      justifyContent: 'flex-start',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      paddingBottom: '4px',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'thin',
                    }
              }
            >
              {daily.map((day) => {
                const d = new Date(day.date + 'T12:00:00')
                const weekday = d.toLocaleDateString(de ? 'de-DE' : 'en-GB', { weekday: 'short' })
                const dayNum = d.toLocaleDateString(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'numeric' })
                const DayIcon = wmoIconComponent(day.code, true)
                const dayColor = wmoIconColor(day.code, true)
                const tip = `${weekday} ${dayNum} · ${wmoSummary(day.code, de)} · ${Math.round(day.max)}° / ${Math.round(day.min)}°`
                const padSplit = `${Math.max(3, Math.round(5 * dayScale))}px ${Math.max(1, Math.round(2 * dayScale))}px ${Math.max(2, Math.round(4 * dayScale))}px`
                const padScroll = `${Math.max(2, Math.round(4 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px`
                const br = `${Math.max(6, Math.round(8 * dayScale))}px`
                return (
                  <div
                    key={day.date}
                    title={tip}
                    style={{
                      minWidth: splitView ? 0 : dayScrollMinW,
                      width: splitView ? '100%' : undefined,
                      flex: splitView ? undefined : '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: `${Math.max(1, Math.round(2 * dayScale))}px`,
                      padding: splitView ? padSplit : padScroll,
                      borderRadius: br,
                      background: 'color-mix(in srgb, var(--surface) 92%, var(--background))',
                      border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span
                      style={{
                        fontSize: splitView
                          ? dailyTypeClamp(dayScale, 7, 1.6, 9)
                          : dailyTypeClamp(dayScale, 8, 1.8, 10),
                        fontWeight: 700,
                        color: muted,
                        textTransform: 'capitalize',
                        lineHeight: 1.05,
                        textAlign: 'center',
                      }}
                    >
                      {weekday}
                    </span>
                    <span
                      style={{
                        fontSize: splitView
                          ? dailyTypeClamp(dayScale, 6, 1.4, 8)
                          : dailyTypeClamp(dayScale, 7, 1.6, 9),
                        color: muted,
                        lineHeight: 1,
                        textAlign: 'center',
                      }}
                    >
                      {dayNum}
                    </span>
                    <DayIcon
                      aria-hidden
                      strokeWidth={1.85}
                      style={{
                        width: splitView
                          ? dailyTypeClamp(dayScale, 14, 3.8, 20)
                          : dailyTypeClamp(dayScale, 16, 4.5, 22),
                        height: splitView
                          ? dailyTypeClamp(dayScale, 14, 3.8, 20)
                          : dailyTypeClamp(dayScale, 16, 4.5, 22),
                        color: dayColor,
                        filter: wmoIconGlowFilter(day.code, true),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: splitView
                          ? dailyTypeClamp(dayScale, 8, 1.8, 10)
                          : dailyTypeClamp(dayScale, 9, 2, 11),
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.05,
                      }}
                    >
                      {Math.round(day.max)}°
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: splitView
                          ? dailyTypeClamp(dayScale, 7, 1.6, 9)
                          : dailyTypeClamp(dayScale, 8, 1.8, 10),
                        fontWeight: 600,
                        color: muted,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(day.min)}°
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {updatedAt && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 'clamp(9px, 2cqmin, 11px)', color: muted, flexShrink: 0 }}>
          {t.updated}: {updatedAt.toLocaleString(de ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
  const dailyOn = (config as Record<string, unknown>).showDailyForecast === true
  const placeOn = (config as Record<string, unknown>).showPlaceLabel !== false
  const widthPct = clampDailyForecastWidthPct((config as Record<string, unknown>).dailyForecastWidthPct)

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
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text)',
            lineHeight: 1.35,
          }}
        >
          <input
            type="checkbox"
            checked={dailyOn}
            onChange={(e) => onChange('showDailyForecast', e.target.checked)}
            style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, accentColor: 'var(--accent)' }}
          />
          <span>
            <strong>{de ? '7-Tage-Vorschau' : '7-day forecast'}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '4px' }}>
              {de
                ? 'Zeigt die nächsten sieben Tage mit Symbol, Höchst- und Tiefsttemperatur (Open-Meteo daily).'
                : 'Shows the next seven days with icon, high and low temperatures (Open-Meteo daily).'}
            </span>
          </span>
        </label>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text)',
            lineHeight: 1.35,
          }}
        >
          <input
            type="checkbox"
            checked={placeOn}
            onChange={(e) => onChange('showPlaceLabel', e.target.checked)}
            style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, accentColor: 'var(--accent)' }}
          />
          <span>
            <strong>{de ? 'Ort / Stadtnamen' : 'Location line'}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '4px' }}>
              {de
                ? 'Zeigt die aufgelöste Adresse oben im Widget (z. B. „Hamburg, …, DE“).'
                : 'Shows the resolved place name at the top of the widget.'}
            </span>
          </span>
        </label>
      </div>

      <div style={{ opacity: dailyOn ? 1 : 0.55 }}>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? '7-Tage: Kartenbreite (%)' : '7-day card width (%)'}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="range"
            min={70}
            max={130}
            step={1}
            value={widthPct}
            disabled={!dailyOn}
            onChange={(e) => onChange('dailyForecastWidthPct', clampDailyForecastWidthPct(Number(e.target.value)))}
            style={{ flex: '1 1 140px', minWidth: '120px', accentColor: 'var(--accent)' }}
          />
          <input
            style={{ ...inp, width: '72px', flexShrink: 0 }}
            type="number"
            min={70}
            max={130}
            disabled={!dailyOn}
            value={widthPct}
            onChange={(e) => onChange('dailyForecastWidthPct', clampDailyForecastWidthPct(e.target.value))}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4, marginBottom: 0 }}>
          {de
            ? 'Skaliert Mindestbreite, Abstände und Schrift der Tageskarten (nur wenn die 7-Tage-Vorschau aktiv ist). 100 % = Standard.'
            : 'Scales minimum width, gaps, and type for day cards when the 7-day forecast is on. 100% is default.'}
        </p>
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
