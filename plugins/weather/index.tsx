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
  Loader2,
  Moon,
  Sun,
} from 'lucide-react'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'
import type { Locale } from '@/lib/i18n'
import { reportPluginCatch } from '@/lib/pluginLog'
import { pluginApiJson } from '@/lib/pluginDev'
import { useDashboardStore } from '@/lib/store'

export const meta: PluginMeta = {
  id: 'weather',
  name: 'Weather',
  description:
    'Stadt oder PLZ — aktuelles Wetter mit Tagesabschnitten (0–6, 6–12, 12–18, 18–24) und optional 7-Tage-Vorschau. Open-Meteo, kein API-Key. API: /api/plugins/weather/resolve.',
  version: '1.5.5',
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
      defaultValue: true,
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
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    weather_code?: number[]
    is_day?: number[]
  }
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

interface DayPeriod {
  label: string
  min: number
  max: number
  code: number
  isDay: boolean
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

function cfgShowDailyForecast(raw: Record<string, unknown>): boolean {
  const v = raw.showDailyForecast
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  return true
}

function cfgDailyForecastWidthPct(raw: Record<string, unknown>): number {
  return clampDailyForecastWidthPct(raw.dailyForecastWidthPct ?? raw.dayTimelineWidthPct)
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

/** Full resolve = geocode + forecast on server (sequential). */
const RESOLVE_FETCH_TIMEOUT_MS = 45_000
/** Periodic refresh: forecast only (one upstream call). */
const FORECAST_FETCH_TIMEOUT_MS = 28_000

function abortSignalWithTimeout(parent: AbortSignal, ms: number): AbortSignal {
  const ac = new AbortController()
  const onParentAbort = () => ac.abort()
  const timer = setTimeout(() => ac.abort(), ms)
  if (parent.aborted) ac.abort()
  else parent.addEventListener('abort', onParentAbort)
  ac.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timer)
      parent.removeEventListener('abort', onParentAbort)
    },
    { once: true },
  )
  return ac.signal
}

function mapWeatherError(e: unknown, de: boolean): string {
  const name = e instanceof Error ? e.name : ''
  const msg = e instanceof Error ? e.message : String(e)
  if (name === 'AbortError' || msg.includes('timeout') || msg.includes('aborted')) {
    return de
      ? 'Zeitüberschreitung — Open-Meteo antwortet nicht. Bitte kurz warten oder erneut laden.'
      : 'Timeout — Open-Meteo did not respond. Wait a moment or reload.'
  }
  if (msg.includes('geocode_empty') || msg.includes('missing_name')) {
    return de ? 'Ort nicht gefunden.' : 'Location not found.'
  }
  return de
    ? 'Wetter-API nicht erreichbar (Server braucht Internet zu Open-Meteo).'
    : 'Weather API unreachable (server needs outbound internet to Open-Meteo).'
}

/** `/api/plugins/weather/resolve` — server logic in `plugins/weather/server.ts`. */
async function resolveWeather(
  query: string,
  countryCode: string,
  signal: AbortSignal,
  lang: 'de' | 'en',
  includeDaily: boolean,
): Promise<{ hit: GeoHit; forecast: ForecastJson } | null> {
  const params = new URLSearchParams({
    name: query,
    language: lang,
    includeHourly: '1',
  })
  const cc = countryCode.trim().toUpperCase()
  if (cc.length === 2) params.set('countryCode', cc)
  if (includeDaily) params.set('includeDaily', '1')

  const j = await pluginApiJson<{ place?: GeoHit; forecast?: ForecastJson }>(
    'weather',
    `/resolve?${params}`,
    { signal, cache: 'no-store', timeoutMs: RESOLVE_FETCH_TIMEOUT_MS },
  )
  const hit = j.place
  if (!hit || !j.forecast) return null
  return { hit, forecast: j.forecast }
}

async function fetchWeatherForecast(
  lat: number,
  lon: number,
  signal: AbortSignal,
  includeDaily: boolean,
): Promise<ForecastJson> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    includeHourly: '1',
  })
  if (includeDaily) params.set('includeDaily', '1')
  return pluginApiJson<ForecastJson>('weather', `/forecast?${params}`, {
    signal,
    cache: 'no-store',
    timeoutMs: FORECAST_FETCH_TIMEOUT_MS,
  })
}

/** Open-Meteo daily[0] = heute — Widget zeigt die nächsten `maxDays` Tage ab morgen. */
function parseDailyForecast(j: ForecastJson, maxDays: number): DailyDay[] {
  const d = j.daily
  if (!d?.time?.length) return []
  const codes = d.weather_code ?? []
  const maxT = d.temperature_2m_max ?? []
  const minT = d.temperature_2m_min ?? []
  const out: DailyDay[] = []
  const available = Math.min(d.time.length, codes.length, maxT.length, minT.length)
  for (let i = 1; i < available && out.length < maxDays; i++) {
    const date = d.time[i]!
    const code = num(codes[i], 0)
    const day: DailyDay = {
      date,
      code,
      max: num(maxT[i], NaN),
      min: num(minT[i], NaN),
    }
    if (Number.isFinite(day.max) && Number.isFinite(day.min)) out.push(day)
  }
  return out
}

function todayDateKeyFromHourly(times: string[]): string | null {
  const now = Date.now()
  let best: string | null = null
  for (const iso of times) {
    const t = new Date(iso).getTime()
    if (Number.isFinite(t) && t <= now + 60_000) best = iso.slice(0, 10)
  }
  return best ?? times[0]?.slice(0, 10) ?? null
}

function hourBucket(hour: number): number {
  if (hour >= 18) return 3
  if (hour >= 12) return 2
  if (hour >= 6) return 1
  return 0
}

function dominantWeatherCode(codes: number[]): number {
  if (!codes.length) return 0
  const counts = new Map<number, number>()
  for (const c of codes) {
    const k = Math.round(c)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let best = Math.round(codes[0]!)
  let bestN = 0
  for (const [c, n] of counts) {
    if (n > bestN) {
      bestN = n
      best = c
    }
  }
  return best
}

function parseTodayDayPeriods(j: ForecastJson): DayPeriod[] {
  const h = j.hourly
  if (!h?.time?.length) return []
  const temps = h.temperature_2m ?? []
  const codes = h.weather_code ?? []
  const isDays = h.is_day ?? []
  const fallbackCode = num(j.current?.weather_code, 2)
  const fallbackIsDay = (j.current?.is_day ?? 1) === 1
  const labels = ['0–6', '6–12', '12–18', '18–24']
  const todayKey = todayDateKeyFromHourly(h.time)
  if (!todayKey) return []
  const buckets: number[][] = [[], [], [], []]
  const codeBuckets: number[][] = [[], [], [], []]
  let dayVotes = [0, 0, 0, 0]
  const n = Math.min(h.time.length, temps.length)
  for (let i = 0; i < n; i++) {
    const iso = h.time[i]!
    if (!iso.startsWith(todayKey)) continue
    const temp = num(temps[i], NaN)
    if (!Number.isFinite(temp)) continue
    const hour = new Date(iso).getHours()
    const b = hourBucket(hour)
    buckets[b]!.push(temp)
    if (i < codes.length) codeBuckets[b]!.push(num(codes[i], fallbackCode))
    if (i < isDays.length && num(isDays[i], 0) === 1) dayVotes[b]!++
  }
  const out: DayPeriod[] = []
  for (let b = 0; b < 4; b++) {
    const vals = buckets[b]!
    const slotCodes = codeBuckets[b]!
    const code = slotCodes.length ? dominantWeatherCode(slotCodes) : fallbackCode
    const isDay = vals.length ? dayVotes[b]! >= vals.length / 2 : fallbackIsDay
    if (!vals.length) {
      out.push({ label: labels[b]!, min: NaN, max: NaN, code, isDay })
      continue
    }
    out.push({
      label: labels[b]!,
      min: Math.min(...vals),
      max: Math.max(...vals),
      code,
      isDay,
    })
  }
  return out
}

function formatPeriodTemps(min: number, max: number): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return '—'
  const a = Math.round(min)
  const b = Math.round(max)
  return a === b ? `${a}°` : `${a}°–${b}°`
}

function parseForecastPayload(
  j: ForecastJson,
  includeDaily: boolean,
  de: boolean,
): { current: CurrentJson; daily: DailyDay[]; dayPeriods: DayPeriod[] } {
  if (!j.current) throw new Error(de ? 'Keine aktuellen Werte' : 'No current values')
  return {
    current: j.current,
    daily: includeDaily ? parseDailyForecast(j, 7) : [],
    dayPeriods: parseTodayDayPeriods(j),
  }
}

/** Ab dieser Widget-Breite (px): aktuelles Wetter links, 7-Tage-Vorschau rechts (mit gleichmäßigem Tages-Raster). */
const WEATHER_SPLIT_MIN_PX = 420

function Widget({ config }: PluginWidgetProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'

  const locationQuery = str(config.locationQuery)
  const countryCode = str(config.countryCode)
  const refreshMinutes = clampRefresh(config.refreshMinutes)
  const cfgRaw = config as Record<string, unknown>
  const showDailyForecast = cfgShowDailyForecast(cfgRaw)
  const showPlaceLabel = cfgRaw.showPlaceLabel !== false
  const dailyForecastScale = cfgDailyForecastWidthPct(cfgRaw) / 100

  const [placeLabel, setPlaceLabel] = useState<string | null>(null)
  const [current, setCurrent] = useState<CurrentJson | null>(null)
  const [daily, setDaily] = useState<DailyDay[]>([])
  const [dayPeriods, setDayPeriods] = useState<DayPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchKeyRef = useRef('')
  const coordsRef = useRef<{ lat: number; lon: number; hit: GeoHit } | null>(null)
  const hasLiveDataRef = useRef(false)

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false
    const fetchKey = `${locationQuery}\0${countryCode}\0${showDailyForecast ? 1 : 0}`

    async function run() {
      if (!locationQuery) {
        fetchKeyRef.current = ''
        coordsRef.current = null
        hasLiveDataRef.current = false
        setPlaceLabel(null)
        setCurrent(null)
        setDaily([])
        setDayPeriods([])
        setError(null)
        setLoading(false)
        return
      }

      const queryChanged = fetchKeyRef.current !== fetchKey
      if (queryChanged) {
        fetchKeyRef.current = fetchKey
        coordsRef.current = null
        hasLiveDataRef.current = false
        setPlaceLabel(null)
        setCurrent(null)
        setDaily([])
        setDayPeriods([])
      }

      setLoading(true)
      if (queryChanged || !hasLiveDataRef.current) setError(null)
      const fetchTimeoutMs = queryChanged || !coordsRef.current ? RESOLVE_FETCH_TIMEOUT_MS : FORECAST_FETCH_TIMEOUT_MS
      const runSignal = abortSignalWithTimeout(ac.signal, fetchTimeoutMs)
      try {
        let hit: GeoHit
        let forecast: ForecastJson
        const cached = !queryChanged ? coordsRef.current : null
        if (cached) {
          forecast = await fetchWeatherForecast(
            cached.lat,
            cached.lon,
            runSignal,
            showDailyForecast,
          )
          hit = cached.hit
        } else {
          const resolved = await resolveWeather(
            locationQuery,
            countryCode,
            runSignal,
            de ? 'de' : 'en',
            showDailyForecast,
          )
          if (cancelled) return
          if (!resolved) {
            coordsRef.current = null
            hasLiveDataRef.current = false
            setPlaceLabel(null)
            setCurrent(null)
            setDaily([])
            setDayPeriods([])
            setError(de ? 'Ort nicht gefunden.' : 'Location not found.')
            return
          }
          hit = resolved.hit
          forecast = resolved.forecast
          coordsRef.current = {
            lat: hit.latitude,
            lon: hit.longitude,
            hit,
          }
        }
        if (cancelled) return
        const { current: cur, daily: dail, dayPeriods: periods } = parseForecastPayload(
          forecast,
          showDailyForecast,
          de,
        )
        if (cancelled) return
        setPlaceLabel(formatPlace(hit))
        setCurrent(cur)
        setDaily(dail)
        setDayPeriods(periods)
        hasLiveDataRef.current = true
        setError(null)
      } catch (e) {
        if (cancelled || (e as Error).name === 'AbortError') return
        reportPluginCatch('weather', e, 'open-meteo')
        if (!queryChanged && hasLiveDataRef.current) {
          setError(null)
          return
        }
        setError(mapWeatherError(e, de))
        if (queryChanged) {
          coordsRef.current = null
          hasLiveDataRef.current = false
          setCurrent(null)
          setDaily([])
          setDayPeriods([])
        }
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

  const hasLiveCurrent =
    current != null && Number.isFinite(num(current.temperature_2m, NaN))

  if (loading && !hasLiveCurrent && !error) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '8px',
          textAlign: 'center',
        }}
      >
        <Loader2
          aria-hidden
          className="sd-widget-load-spin"
          strokeWidth={1.75}
          style={{
            width: 'clamp(28px, 9cqmin, 40px)',
            height: 'clamp(28px, 9cqmin, 40px)',
            color: 'var(--accent)',
          }}
        />
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0, lineHeight: 1.35 }}>
          {de ? 'Wetter wird geladen…' : 'Loading weather…'}
        </p>
      </div>
    )
  }

  if (error && !hasLiveCurrent) {
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
  const refreshing = loading && hasLiveCurrent
  const wdir = num(current?.wind_direction_10m, 0)
  const wspd = num(current?.wind_speed_10m, 0)
  const summary = wmoSummary(code, de)
  const WeatherIcon = wmoIconComponent(code, isDay)
  const iconColor = wmoIconColor(code, isDay)
  const iconGlow = wmoIconGlowFilter(code, isDay)

  const hasDaily = showDailyForecast && daily.length > 0
  const splitView = splitLayout && hasDaily

  const dayScale = dailyForecastScale
  const dayGapGrid = `${Math.max(2, Math.round(5 * dayScale))}px`
  /** Untereinander (schmal): festes 7-Spalten-Raster ohne Horizontal-Scroll. */
  const dayGapStackTight = `${Math.max(1, Math.round(3 * dayScale))}px`
  const padDayCell = (narrow: boolean) =>
    narrow
      ? `${Math.max(2, Math.round(3 * dayScale))}px ${Math.max(1, Math.round(2 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px`
      : `${Math.max(3, Math.round(5 * dayScale))}px ${Math.max(1, Math.round(2 * dayScale))}px ${Math.max(2, Math.round(4 * dayScale))}px`

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
        opacity: refreshing ? 0.72 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {error && hasLiveCurrent && (
        <p
          style={{
            margin: 0,
            flexShrink: 0,
            fontSize: 'clamp(10px, 2.2cqmin, 11px)',
            color: '#fb7185',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {error}
        </p>
      )}
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
            flex: splitView ? '0 1 38%' : undefined,
            maxWidth: splitView ? '42%' : undefined,
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
          {(hum != null || wspd > 0) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 'clamp(8px, 3cqmin, 16px)',
                flexWrap: 'wrap',
                fontSize: 'clamp(10px, 2.2cqmin, 12px)',
                color: muted,
                width: '100%',
                flexShrink: 0,
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
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(2px, 0.6cqmin, 4px)',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(8px, 2.5cqmin, 16px)',
                flexWrap: 'nowrap',
                color: iconColor,
              }}
              aria-label={summary}
              title={summary}
            >
              <span
                className="tabular-nums"
                style={{
                  fontSize: 'clamp(1.5rem, min(11cqmin, 20vw), 3rem)',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {temp != null ? `${Math.round(temp)}°` : '—'}
              </span>
              <WeatherIcon
                aria-hidden
                strokeWidth={1.75}
                style={{
                  width: 'clamp(32px, min(10cqmin, 14vw), 60px)',
                  height: 'clamp(32px, min(10cqmin, 14vw), 60px)',
                  color: iconColor,
                  filter: iconGlow,
                  opacity: refreshing ? 0.55 : 1,
                  transition: 'opacity 0.2s, color 0.35s ease',
                  flexShrink: 0,
                }}
              />
            </div>
            {feels != null && temp != null && Math.abs(feels - temp) >= 0.5 && (
              <span style={{ fontSize: 'clamp(10px, 2.2cqmin, 12px)', color: muted, lineHeight: 1.2 }}>
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

          {dayPeriods.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 'clamp(4px, 1.2cqmin, 8px)',
                width: '100%',
                maxWidth: 'min(100%, 320px)',
                margin: '2px 0 0',
              }}
            >
              {dayPeriods.map((slot) => {
                const SlotIcon = wmoIconComponent(slot.code, slot.isDay)
                const slotColor = wmoIconColor(slot.code, slot.isDay)
                const slotSummary = wmoSummary(slot.code, de)
                return (
                  <div
                    key={slot.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '5px 2px 4px',
                      borderRadius: '8px',
                      background: 'color-mix(in srgb, var(--surface) 88%, var(--background))',
                      border: '1px solid color-mix(in srgb, var(--border) 65%, transparent)',
                      minWidth: 0,
                    }}
                    title={
                      de
                        ? `${slot.label} Uhr — ${slotSummary}, ${formatPeriodTemps(slot.min, slot.max)}`
                        : `${slot.label} — ${slotSummary}, ${formatPeriodTemps(slot.min, slot.max)}`
                    }
                  >
                    <SlotIcon
                      aria-hidden
                      strokeWidth={1.75}
                      style={{
                        width: 'clamp(14px, 4.5cqmin, 22px)',
                        height: 'clamp(14px, 4.5cqmin, 22px)',
                        color: slotColor,
                        filter: wmoIconGlowFilter(slot.code, slot.isDay),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 'clamp(9px, 2cqmin, 11px)',
                        fontWeight: 700,
                        color: muted,
                        lineHeight: 1.1,
                      }}
                    >
                      {slot.label}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 'clamp(10px, 2.2cqmin, 12px)',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                        textAlign: 'center',
                      }}
                    >
                      {formatPeriodTemps(slot.min, slot.max)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
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
                fontSize: splitView
                  ? dailyTypeClamp(dayScale, 10, 2.4, 13)
                  : 'clamp(9px, 2cqmin, 11px)',
                fontWeight: 600,
                color: muted,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {t.nextDays}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: splitView ? `${Math.max(4, Math.round(7 * dayScale))}px` : dayGapStackTight,
                width: '100%',
                minWidth: 0,
                minHeight: 0,
                alignContent: 'center',
              }}
            >
              {daily.map((day) => {
                const d = new Date(day.date + 'T12:00:00')
                const weekday = d.toLocaleDateString(de ? 'de-DE' : 'en-GB', { weekday: 'short' })
                const dayNum = d.toLocaleDateString(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'numeric' })
                const DayIcon = wmoIconComponent(day.code, true)
                const dayColor = wmoIconColor(day.code, true)
                const tip = `${weekday} ${dayNum} · ${wmoSummary(day.code, de)} · ${Math.round(day.max)}° / ${Math.round(day.min)}°`
                const narrowDaily = !splitView
                const pad = splitView
                  ? `${Math.max(4, Math.round(7 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px ${Math.max(3, Math.round(5 * dayScale))}px`
                  : padDayCell(narrowDaily)
                const br = `${Math.max(6, Math.round((splitView ? 10 : 8) * dayScale))}px`
                return (
                  <div
                    key={day.date}
                    title={tip}
                    style={{
                      minWidth: 0,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: `${Math.max(1, Math.round(2 * dayScale))}px`,
                      padding: pad,
                      borderRadius: br,
                      background: 'color-mix(in srgb, var(--surface) 92%, var(--background))',
                      border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span
                      style={{
                        fontSize: splitView
                          ? dailyTypeClamp(dayScale, 10, 2.4, 13)
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
                          ? dailyTypeClamp(dayScale, 8, 2, 11)
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
                          ? dailyTypeClamp(dayScale, 20, 5.5, 30)
                          : dailyTypeClamp(dayScale, 16, 4.5, 22),
                        height: splitView
                          ? dailyTypeClamp(dayScale, 20, 5.5, 30)
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
                          ? dailyTypeClamp(dayScale, 12, 2.8, 16)
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
                          ? dailyTypeClamp(dayScale, 10, 2.4, 13)
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
    </div>
  )
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const locale = useDashboardStore((s) => s.locale) as Locale
  const de = locale !== 'en'
  const cfgRaw = config as Record<string, unknown>
  const dailyOn = cfgShowDailyForecast(cfgRaw)
  const placeOn = cfgRaw.showPlaceLabel !== false
  const widthPct = cfgDailyForecastWidthPct(cfgRaw)

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
          {de ? 'Stadt oder PLZ' : 'City or postal code'}
        </label>
        <input
          style={inp}
          value={str(config.locationQuery)}
          onChange={(e) => onChange('locationQuery', e.target.value)}
          placeholder={de ? 'z. B. Berlin, Köln, 80331' : 'e.g. Berlin, London, 10001'}
        />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
          {de
            ? 'Nach dem Speichern lädt das Widget automatisch Wetterdaten (Open-Meteo). Bei PLZ optional Land setzen.'
            : 'After saving, the widget loads weather data (Open-Meteo). For postal codes, set country optionally.'}
        </p>
      </div>

      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {de ? 'Land (ISO, optional)' : 'Country (ISO, optional)'}
        </label>
        <input
          style={inp}
          value={str(config.countryCode)}
          onChange={(e) => onChange('countryCode', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
          placeholder={de ? 'z. B. DE' : 'e.g. DE'}
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
                ? 'Tagesabschnitte (0–6 … 18–24) bleiben links beim aktuellen Wetter. Rechts: die nächsten 7 Tage ab morgen (heute nicht doppelt).'
                : 'Day blocks (0–6 … 18–24) stay on the left. Right: next 7 days starting tomorrow (today omitted).'}
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
          {de ? 'Aktualisieren alle (Minuten)' : 'Refresh every (minutes)'}
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
        {de ? 'Wetterdaten:' : 'Weather data:'}{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
          Open-Meteo
        </a>{' '}
        {de ? '(nicht kommerziell, ohne API-Key).' : '(non-commercial, no API key).'}
      </p>
    </div>
  )
}

export const component: PluginComponent = { Widget, Settings }
