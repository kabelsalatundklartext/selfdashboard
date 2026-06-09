'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
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
  LoaderCircle,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from 'lucide-react'
import { usePluginLocale } from '@/lib/pluginLocale'
import { useDashboardStore } from '@/lib/store'
import type { PluginComponent, PluginMeta, PluginSettingsProps, PluginWidgetProps } from '@/types'

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
function nm(v: unknown, d: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : d
}
function clampRefresh(v: unknown): number {
  const n = Math.round(nm(v, 15))
  return Math.min(120, Math.max(5, n))
}
function clampWidth(v: unknown): number {
  const n = Math.round(nm(v, 100))
  return Math.min(130, Math.max(70, n))
}
function cfgBool(c: Record<string, unknown>, key: string, d = true): boolean {
  const v = c[key]
  if (v === false || v === 'false' || v === 0 || v === '0') return false
  if (v === true || v === 'true' || v === 1 || v === '1') return true
  return d
}
function widthPct(c: Record<string, unknown>): number {
  return clampWidth((c.dailyForecastWidthPct as unknown) ?? (c.dayTimelineWidthPct as unknown))
}
function sc(t: number, lo: number, mid: number, hi: number): string {
  return `clamp(${Math.max(5, Math.round(lo * t))}px, ${(mid * t).toFixed(2)}cqmin, ${Math.max(6, Math.round(hi * t))}px)`
}

type Place = { name: string; latitude: number; longitude: number; country_code?: string; admin1?: string }
function placeLabel(p: Place): string {
  return [p.name, p.admin1, p.country_code].filter(Boolean).join(', ')
}
function windDir(deg: number, de: boolean): string {
  const pts = de ? ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return pts[i] ?? 'N'
}

function codeColor(code: number, day: boolean): string {
  const e = Math.round(code)
  if (e === 95 || e === 96 || e === 99) return '#f97316'
  if (e === 71 || e === 73 || e === 75 || e === 77 || e === 85 || e === 86) return '#7dd3fc'
  if (e === 61 || e === 63 || e === 65 || e === 66 || e === 67 || e === 80 || e === 81 || e === 82) return '#3b82f6'
  if (e === 51 || e === 53 || e === 55 || e === 56 || e === 57) return '#38bdf8'
  if (e === 45 || e === 48) return '#9ca3af'
  if (e === 3) return '#94a3b8'
  if (e === 2) return day ? '#fcd34d' : '#a5b4fc'
  if (e === 1) return day ? '#fde047' : '#c4b5fd'
  if (e === 0) return day ? '#facc15' : '#a5b4fc'
  return '#94a3b8'
}
function codeShadow(code: number, day: boolean): string {
  return `drop-shadow(0 2px 8px color-mix(in srgb, ${codeColor(code, day)} 45%, transparent))`
}
function codeIcon(code: number, day: boolean): LucideIcon {
  const e = Math.round(code)
  if (e === 95 || e === 96 || e === 99) return CloudLightning
  if (e === 71 || e === 73 || e === 75 || e === 77 || e === 85 || e === 86) return CloudSnow
  if (e === 61 || e === 63 || e === 65 || e === 66 || e === 67 || e === 80 || e === 81 || e === 82) return CloudRain
  if (e === 51 || e === 53 || e === 55 || e === 56 || e === 57) return CloudDrizzle
  if (e === 45 || e === 48) return CloudFog
  if (e === 3) return Cloud
  if (e === 2 || e === 1) return day ? CloudSun : CloudMoon
  if (e === 0) return day ? Sun : Moon
  return Cloud
}
const CODE_LABELS: Record<number, [string, string]> = {
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
function codeLabel(code: number, de: boolean): string {
  const p = CODE_LABELS[Math.round(code)]
  return p ? (de ? p[0] : p[1]) : de ? 'Wetter' : 'Weather'
}

type Current = Record<string, unknown>
type Forecast = {
  current?: Current
  hourly?: Record<string, unknown[]>
  daily?: Record<string, unknown[]>
  air_quality?: Record<string, unknown>
}
type DailyDay = { date: string; code: number; max: number; min: number }
type Period = { label: string; temp: number; code: number; isDay: boolean; prob: number }
type SunTimes = { sunrise: string; sunset: string }
type RainHour = { hour: number; prob: number; mm: number }
type AirQuality = { aqi: number | null; pm25: number | null }
type Hour24 = { hour: number; temp: number; code: number; isDay: boolean; prob: number }

const TIMELINE_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

function todayKey(times: unknown[]): string | null {
  const now = Date.now()
  let key: string | null = null
  for (const t of times) {
    const ms = new Date(String(t)).getTime()
    if (Number.isFinite(ms) && ms <= now + 60_000) key = String(t).slice(0, 10)
  }
  return key ?? (times[0] ? String(times[0]).slice(0, 10) : null)
}

function buildDaily(fc: Forecast, max: number): DailyDay[] {
  const d = fc.daily
  if (!d?.time?.length) return []
  const codes = d.weather_code ?? []
  const tmax = d.temperature_2m_max ?? []
  const tmin = d.temperature_2m_min ?? []
  const out: DailyDay[] = []
  const n = Math.min(d.time.length, codes.length, tmax.length, tmin.length)
  for (let i = 1; i < n && out.length < max; i++) {
    const day: DailyDay = { date: String(d.time[i]), code: nm(codes[i], 0), max: nm(tmax[i], NaN), min: nm(tmin[i], NaN) }
    if (Number.isFinite(day.max) && Number.isFinite(day.min)) out.push(day)
  }
  return out
}

function buildPeriods(fc: Forecast): Period[] {
  const h = fc.hourly
  if (!h?.time?.length) return []
  const temps = h.temperature_2m ?? []
  const codes = h.weather_code ?? []
  const days = h.is_day ?? []
  const probs = h.precipitation_probability ?? []
  const fallbackCode = nm(fc.current?.weather_code, 2)
  const fallbackDay = nm(fc.current?.is_day, 1) === 1
  const key = todayKey(h.time)
  if (!key) return []
  const byHour = new Map<number, { temp: number; code: number; isDay: boolean; prob: number }>()
  const n = Math.min(h.time.length, temps.length)
  for (let i = 0; i < n; i++) {
    const t = String(h.time[i])
    if (!t.startsWith(key)) continue
    const temp = nm(temps[i], NaN)
    if (!Number.isFinite(temp)) continue
    const hour = new Date(t).getHours()
    byHour.set(hour, {
      temp,
      code: i < codes.length ? nm(codes[i], fallbackCode) : fallbackCode,
      isDay: i < days.length ? nm(days[i], 0) === 1 : fallbackDay,
      prob: i < probs.length ? nm(probs[i], NaN) : NaN,
    })
  }
  const nearest = (hour: number) => {
    const exact = byHour.get(hour === 24 ? 23 : hour)
    if (exact) return exact
    for (let x = 1; x < 24; x++) {
      const lo = hour - x
      const hi = hour + x
      if (lo >= 0 && byHour.has(lo)) return byHour.get(lo)!
      if (hi <= 23 && byHour.has(hi)) return byHour.get(hi)!
    }
    return null
  }
  const out: Period[] = []
  for (const hour of TIMELINE_HOURS) {
    const v = nearest(hour)
    if (!v) out.push({ label: String(hour), temp: NaN, code: fallbackCode, isDay: fallbackDay, prob: NaN })
    else out.push({ label: String(hour), temp: v.temp, code: v.code, isDay: v.isDay, prob: v.prob })
  }
  return out
}

function fmtTime(iso: string, de: boolean): string {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString(de ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
}

function buildSun(fc: Forecast): SunTimes | null {
  const d = fc.daily
  if (!d?.time?.length) return null
  const rises = d.sunrise ?? []
  const sets = d.sunset ?? []
  const key = todayKey(fc.hourly?.time ?? []) ?? String(d.time[0]).slice(0, 10)
  if (!key) return null
  const idx = d.time.findIndex((t) => String(t).slice(0, 10) === key)
  const u = idx >= 0 ? idx : 0
  const sr = rises[u]
  const ss = sets[u]
  return !sr || !ss ? null : { sunrise: String(sr), sunset: String(ss) }
}

function buildRainForecast(fc: Forecast, count: number): RainHour[] {
  const h = fc.hourly
  if (!h?.time?.length) return []
  const probs = h.precipitation_probability ?? []
  const mm = h.precipitation ?? []
  const now = Date.now()
  const out: RainHour[] = []
  for (let i = 0; i < h.time.length && out.length < count; i++) {
    const ms = new Date(String(h.time[i])).getTime()
    if (!Number.isFinite(ms) || ms < now - 60 * 60 * 1000) continue
    out.push({
      hour: new Date(String(h.time[i])).getHours(),
      prob: Math.max(0, Math.min(100, Math.round(nm(probs[i], 0)))),
      mm: Math.max(0, nm(mm[i], 0)),
    })
  }
  return out
}

function build24h(fc: Forecast, count: number): Hour24[] {
  const h = fc.hourly
  if (!h?.time?.length) return []
  const temps = h.temperature_2m ?? []
  const codes = h.weather_code ?? []
  const days = h.is_day ?? []
  const probs = h.precipitation_probability ?? []
  const now = Date.now()
  const fb = nm(fc.current?.weather_code, 2)
  const out: Hour24[] = []
  for (let i = 0; i < h.time.length && out.length < count; i++) {
    const ms = new Date(String(h.time[i])).getTime()
    if (!Number.isFinite(ms) || ms < now - 60 * 60 * 1000) continue
    out.push({
      hour: new Date(String(h.time[i])).getHours(),
      temp: nm(temps[i], NaN),
      code: i < codes.length ? nm(codes[i], fb) : fb,
      isDay: i < days.length ? nm(days[i], 1) === 1 : true,
      prob: Math.max(0, Math.min(100, Math.round(nm(probs[i], 0)))),
    })
  }
  return out
}

function buildAir(fc: Forecast): AirQuality | null {
  const a = fc.air_quality
  if (!a) return null
  const aqiRaw = nm(a.european_aqi, NaN)
  const pmRaw = nm(a.pm2_5, NaN)
  const aqi = Number.isFinite(aqiRaw) ? Math.round(aqiRaw) : null
  const pm25 = Number.isFinite(pmRaw) ? Math.round(pmRaw * 10) / 10 : null
  if (aqi == null && pm25 == null) return null
  return { aqi, pm25 }
}

function aqiLabel(aqi: number, de: boolean): string {
  const bands: [number, string, string][] = [
    [20, 'sehr gut', 'very good'],
    [40, 'gut', 'good'],
    [60, 'mäßig', 'moderate'],
    [80, 'schlecht', 'poor'],
    [100, 'sehr schlecht', 'very poor'],
  ]
  for (const [max, dl, el] of bands) if (aqi <= max) return de ? dl : el
  return de ? 'extrem schlecht' : 'extremely poor'
}

function aqiColor(aqi: number): string {
  if (aqi <= 20) return '#22c55e'
  if (aqi <= 40) return '#84cc16'
  if (aqi <= 60) return '#eab308'
  if (aqi <= 80) return '#f97316'
  if (aqi <= 100) return '#ef4444'
  return '#a21caf'
}

type Assembled = { current: Current; daily: DailyDay[]; periods: Period[]; sun: SunTimes | null; rain: RainHour[]; air: AirQuality | null; hours24: Hour24[] }
function assemble(fc: Forecast, includeDaily: boolean, de: boolean): Assembled {
  if (!fc.current) throw new Error(de ? 'Keine aktuellen Werte' : 'No current values')
  return {
    current: fc.current,
    daily: includeDaily ? buildDaily(fc, 7) : [],
    periods: buildPeriods(fc),
    sun: buildSun(fc),
    rain: buildRainForecast(fc, 12),
    air: buildAir(fc),
    hours24: build24h(fc, 24),
  }
}

const RESOLVE_TIMEOUT = 45_000
const FORECAST_TIMEOUT = 28_000

async function callWeather<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`/api/plugins/weather${path}`, { signal, cache: 'no-store', headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      msg = (j.error as string) ?? msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return (await res.json()) as T
}

function timeoutSignal(parent: AbortSignal, ms: number): AbortSignal {
  const ac = new AbortController()
  const onAbort = () => ac.abort()
  const timer = setTimeout(() => ac.abort(), ms)
  if (parent.aborted) ac.abort()
  else parent.addEventListener('abort', onAbort)
  ac.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timer)
      parent.removeEventListener('abort', onAbort)
    },
    { once: true },
  )
  return ac.signal
}

async function resolveWeather(
  name: string,
  countryCode: string,
  signal: AbortSignal,
  lang: string,
  daily: boolean,
  air: boolean,
): Promise<{ hit: Place; forecast: Forecast } | null> {
  const q = new URLSearchParams({ name, language: lang, includeHourly: '1' })
  const cc = countryCode.trim().toUpperCase()
  if (cc.length === 2) q.set('countryCode', cc)
  if (daily) q.set('includeDaily', '1')
  if (air) q.set('includeAir', '1')
  const data = await callWeather<{ place?: Place; forecast?: Forecast }>(`/resolve?${q}`, signal)
  if (!data.place || !data.forecast) return null
  return { hit: data.place, forecast: data.forecast }
}

async function forecastWeather(lat: number, lon: number, signal: AbortSignal, daily: boolean, air: boolean): Promise<Forecast> {
  const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), includeHourly: '1' })
  if (daily) q.set('includeDaily', '1')
  if (air) q.set('includeAir', '1')
  return callWeather<Forecast>(`/forecast?${q}`, signal)
}

function errorText(e: unknown, de: boolean): string {
  const name = e instanceof Error ? e.name : ''
  const msg = e instanceof Error ? e.message : String(e)
  if (name === 'AbortError' || msg.includes('timeout') || msg.includes('aborted')) {
    return de
      ? 'Zeitüberschreitung — Open-Meteo antwortet nicht. Bitte kurz warten oder erneut laden.'
      : 'Timeout — Open-Meteo did not respond. Wait a moment or reload.'
  }
  if (msg.includes('geocode_empty') || msg.includes('missing_name')) return de ? 'Ort nicht gefunden.' : 'Location not found.'
  return de
    ? 'Wetter-API nicht erreichbar (Server braucht Internet zu Open-Meteo).'
    : 'Weather API unreachable (server needs outbound internet to Open-Meteo).'
}

type SmBox = { x: number; y: number; w: number; h: number }
const SM_COLS = 12
const SM_UNIT = 26
const SM_GAP = 4
const SM_BLOCKS: { id: string; de: string; en: string; def: SmBox }[] = [
  { id: 'place', de: 'Ort / Stadtname', en: 'Location', def: { x: 0, y: 0, w: 12, h: 1 } },
  { id: 'current', de: 'Aktuelles Wetter', en: 'Current weather', def: { x: 0, y: 1, w: 12, h: 3 } },
  { id: 'stats', de: 'Werte', en: 'Stats', def: { x: 0, y: 4, w: 12, h: 2 } },
  { id: 'hourly', de: '3-Stunden-Verlauf', en: '3-hour timeline', def: { x: 0, y: 6, w: 12, h: 3 } },
  { id: 'pills', de: '24-Stunden-Pillen', en: '24-hour pills', def: { x: 0, y: 9, w: 12, h: 5 } },
  { id: 'seven', de: '7-Tage', en: '7-day', def: { x: 0, y: 14, w: 12, h: 4 } },
  { id: 'rain', de: 'Regen-Vorschau', en: 'Rain outlook', def: { x: 0, y: 18, w: 12, h: 2 } },
]
function parseSmLayout(raw: string): Record<string, SmBox> {
  try {
    const o = JSON.parse(raw || '{}') as unknown
    if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, SmBox>
  } catch {
    /* ignore */
  }
  return {}
}

const SIDE_BY_SIDE = 420

function Widget({ config, instanceId, editMode }: PluginWidgetProps) {
  const { de } = usePluginLocale()
  const cfg = config as Record<string, unknown>
  const name = str(cfg.locationQuery)
  const country = str(cfg.countryCode)
  const refreshMin = clampRefresh(cfg.refreshMinutes)
  const showDaily = cfgBool(cfg, 'showDailyForecast', true)
  const showPlace = cfgBool(cfg, 'showPlaceLabel', true)
  const showHumidityWind = cfgBool(cfg, 'showHumidityWind', true)
  const showSun = cfgBool(cfg, 'showSunTimes', true)
  const showTimeline = cfgBool(cfg, 'showHourTimeline', true)
  const showRainForecast = cfgBool(cfg, 'showRainForecast', true)
  const showTimelineRain = cfgBool(cfg, 'showTimelineRain', true)
  const showUvGusts = cfgBool(cfg, 'showUvGusts', true)
  const showAirQuality = cfgBool(cfg, 'showAirQuality', true)
  const widthScale = widthPct(cfg) / 100
  const layout = str(cfg.layout) || 'sidebar'
  const updatePluginConfig = useDashboardStore((st) => st.updatePluginConfig)
  const smSevenVertical = cfg.smSevenVertical === true
  const smEnabled: Record<string, boolean> = {
    place: cfg.smPlace !== false,
    current: cfg.smCurrent !== false,
    stats: cfg.smStats !== false,
    hourly: cfg.smHourly !== false,
    pills: cfg.smPills === true,
    seven: cfg.smSeven !== false,
    rain: cfg.smRain === true,
  }

  const [place, setPlace] = useState<string | null>(null)
  const [current, setCurrent] = useState<Current | null>(null)
  const [daily, setDaily] = useState<DailyDay[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [sun, setSun] = useState<SunTimes | null>(null)
  const [rainHours, setRainHours] = useState<RainHour[]>([])
  const [air, setAir] = useState<AirQuality | null>(null)
  const [hours24, setHours24] = useState<Hour24[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const keyRef = useRef('')
  const placeRef = useRef<{ lat: number; lon: number; hit: Place } | null>(null)
  const haveRef = useRef(false)

  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false
    const sig = `${name} ${country} ${showDaily ? 1 : 0} ${showAirQuality ? 1 : 0}`
    async function run() {
      if (!name) {
        keyRef.current = ''
        placeRef.current = null
        haveRef.current = false
        setPlace(null)
        setCurrent(null)
        setDaily([])
        setPeriods([])
        setSun(null)
        setRainHours([])
        setAir(null)
        setHours24([])
        setError(null)
        setLoading(false)
        return
      }
      const changed = keyRef.current !== sig
      if (changed) {
        keyRef.current = sig
        placeRef.current = null
        haveRef.current = false
        setPlace(null)
        setCurrent(null)
        setDaily([])
        setPeriods([])
        setSun(null)
        setRainHours([])
        setAir(null)
        setHours24([])
      }
      setLoading(true)
      if (changed || !haveRef.current) setError(null)
      const ms = changed || !placeRef.current ? RESOLVE_TIMEOUT : FORECAST_TIMEOUT
      const signal = timeoutSignal(ac.signal, ms)
      try {
        let hit: Place
        let forecast: Forecast
        const cached = changed ? null : placeRef.current
        if (cached) {
          forecast = await forecastWeather(cached.lat, cached.lon, signal, showDaily, showAirQuality)
          hit = cached.hit
        } else {
          const r = await resolveWeather(name, country, signal, de ? 'de' : 'en', showDaily, showAirQuality)
          if (cancelled) return
          if (!r) {
            placeRef.current = null
            haveRef.current = false
            setPlace(null)
            setCurrent(null)
            setDaily([])
            setPeriods([])
            setSun(null)
        setRainHours([])
        setAir(null)
        setHours24([])
            setError(de ? 'Ort nicht gefunden.' : 'Location not found.')
            return
          }
          hit = r.hit
          forecast = r.forecast
          placeRef.current = { lat: hit.latitude, lon: hit.longitude, hit }
        }
        if (cancelled) return
        const a = assemble(forecast, showDaily, de)
        if (cancelled) return
        setPlace(placeLabel(hit))
        setCurrent(a.current)
        setDaily(a.daily)
        setPeriods(a.periods)
        setSun(a.sun)
        setRainHours(a.rain)
        setAir(a.air)
        setHours24(a.hours24)
        haveRef.current = true
        setError(null)
      } catch (e) {
        if (cancelled || (e instanceof Error && e.name === 'AbortError')) return
        if (!changed && haveRef.current) {
          setError(null)
          return
        }
        setError(errorText(e, de))
        if (changed) {
          placeRef.current = null
          haveRef.current = false
          setCurrent(null)
          setDaily([])
          setPeriods([])
          setSun(null)
        setRainHours([])
        setAir(null)
        setHours24([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    const id = window.setInterval(() => void run(), refreshMin * 60_000)
    return () => {
      cancelled = true
      ac.abort()
      window.clearInterval(id)
    }
  }, [name, country, refreshMin, de, showDaily, showAirQuality])

  const rootRef = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(false)
  const smStored = useMemo(() => parseSmLayout(str(cfg.customLayout)), [cfg.customLayout])
  const [smLayout, setSmLayout] = useState<Record<string, SmBox>>(smStored)
  useEffect(() => setSmLayout(smStored), [smStored])
  const [smEdit, setSmEdit] = useState(false)
  useEffect(() => {
    if (!editMode) setSmEdit(false)
  }, [editMode])
  const smGridRef = useRef<HTMLDivElement>(null)
  const smDrag = useRef<{ id: string; mode: 'move' | 'resize'; sx: number; sy: number; box: SmBox; colW: number; rowH: number } | null>(null)
  const smDefaults: Record<string, SmBox> = (() => {
    const out: Record<string, SmBox> = {}
    let y = 0
    for (const b of SM_BLOCKS) {
      if (!smEnabled[b.id]) continue
      out[b.id] = { x: 0, y, w: 12, h: b.def.h }
      y += b.def.h
    }
    return out
  })()
  const smBoxOf = (id: string): SmBox => smLayout[id] || smDefaults[id] || (SM_BLOCKS.find((b) => b.id === id) as { def: SmBox }).def
  const smStart = (id: string, mode: 'move' | 'resize', e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const grid = smGridRef.current
    const colW = grid ? grid.clientWidth / SM_COLS : 30
    smDrag.current = { id, mode, sx: e.clientX, sy: e.clientY, box: smBoxOf(id), colW, rowH: SM_UNIT + SM_GAP }
    try {
      grid?.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const smMove = (e: ReactPointerEvent) => {
    const d = smDrag.current
    if (!d) return
    const cols = Math.round((e.clientX - d.sx) / d.colW)
    const rows = Math.round((e.clientY - d.sy) / d.rowH)
    setSmLayout((prev) => {
      const nb: SmBox =
        d.mode === 'move'
          ? { ...d.box, x: Math.max(0, Math.min(SM_COLS - d.box.w, d.box.x + cols)), y: Math.max(0, d.box.y + rows) }
          : { ...d.box, w: Math.max(1, Math.min(SM_COLS - d.box.x, d.box.w + cols)), h: Math.max(1, d.box.h + rows) }
      return { ...prev, [d.id]: nb }
    })
  }
  const smEnd = () => {
    if (!smDrag.current) return
    smDrag.current = null
    setSmLayout((prev) => {
      if (instanceId) updatePluginConfig(instanceId, { customLayout: JSON.stringify(prev) })
      return prev
    })
  }
  const smToggleSeven = () => {
    if (instanceId) updatePluginConfig(instanceId, { smSevenVertical: !smSevenVertical })
  }
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const next = el.getBoundingClientRect().width >= SIDE_BY_SIDE
      setWide((p) => (p === next ? p : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [showDaily, daily.length])

  const tr = useMemo(
    () => ({
      hint: de ? 'Stadt oder PLZ in den Einstellungen eintragen.' : 'Set city or postal code in settings.',
      feels: de ? 'Gefühlt' : 'Feels like',
      hum: de ? 'Luftfeuchte' : 'Humidity',
      wind: 'Wind',
      nextDays: de ? 'Nächste Tage' : 'Next days',
    }),
    [de],
  )
  const muted = 'var(--text-muted)'

  if (!name) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0, lineHeight: 1.35 }}>{tr.hint}</p>
      </div>
    )
  }

  const haveTemp = current != null && Number.isFinite(nm(current.temperature_2m, NaN))

  if (loading && !haveTemp && !error) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 8, textAlign: 'center' }}>
        <LoaderCircle aria-hidden className="sd-widget-load-spin" strokeWidth={1.75} style={{ width: 'clamp(28px, 9cqmin, 40px)', height: 'clamp(28px, 9cqmin, 40px)', color: 'var(--accent)' }} />
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0, lineHeight: 1.35 }}>{de ? 'Wetter wird geladen…' : 'Loading weather…'}</p>
      </div>
    )
  }

  if (error && !haveTemp) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, textAlign: 'center' }}>
        <CloudOff aria-hidden strokeWidth={1.75} style={{ width: 'clamp(26px, 9cqmin, 40px)', height: 'clamp(26px, 9cqmin, 40px)', color: '#fb7185', filter: 'drop-shadow(0 2px 6px rgba(251, 113, 133, 0.35))' }} />
        <p style={{ fontSize: 'clamp(11px, 2.8cqmin, 13px)', color: muted, margin: 0 }}>{error}</p>
      </div>
    )
  }

  const temp = current?.temperature_2m
  const feels = current?.apparent_temperature
  const humidity = current?.relative_humidity_2m
  const code = nm(current?.weather_code, 0)
  const isDay = nm(current?.is_day, 1) === 1
  const stale = loading && haveTemp
  const windDeg = nm(current?.wind_direction_10m, 0)
  const windSpeed = nm(current?.wind_speed_10m, 0)
  const uv = current?.uv_index != null ? nm(current.uv_index, NaN) : NaN
  const gusts = nm(current?.wind_gusts_10m, 0)
  const firstRain = rainHours.find((r) => r.prob >= 40 || r.mm >= 0.2) ?? null
  const rainSummary = firstRain
    ? de
      ? `Regen ab ~${firstRain.hour} Uhr (${firstRain.prob}%)`
      : `Rain from ~${firstRain.hour}:00 (${firstRain.prob}%)`
    : de
      ? 'Die nächsten Stunden trocken'
      : 'Dry for the next hours'
  const label = codeLabel(code, de)
  const Icon = codeIcon(code, isDay)
  const color = codeColor(code, isDay)
  const shadow = codeShadow(code, isDay)
  const haveDaily = showDaily && daily.length > 0
  const s = widthScale

  const tempIconEl = (tempPx: string, iconPx: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(7px, 2.2cqmin, 14px)', color }} aria-label={label} title={label}>
      <span className="tabular-nums" style={{ fontSize: tempPx, fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, flexShrink: 0 }}>{temp != null ? `${Math.round(nm(temp, 0))}°` : '—'}</span>
      <Icon aria-hidden strokeWidth={1.75} style={{ width: iconPx, height: iconPx, color, filter: shadow, opacity: stale ? 0.55 : 1, flexShrink: 0 }} />
    </div>
  )

  const placeEl =
    place && showPlace ? (
      <p style={{ margin: 0, fontSize: 'clamp(9px, 2.2cqmin, 11px)', fontWeight: 600, color: muted, textAlign: 'center', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0, maxWidth: '100%' }} title={place}>{place}</p>
    ) : null

  const feelsEl =
    feels != null && temp != null && Math.abs(nm(feels, 0) - nm(temp, 0)) >= 0.5 ? (
      <span style={{ fontSize: 'clamp(9px, 2.1cqmin, 11px)', color: muted, lineHeight: 1.15 }}>{tr.feels} {Math.round(nm(feels, 0))}°</span>
    ) : null

  const statsEl =
    showHumidityWind || showSun || showUvGusts || (showAirQuality && air) ? (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', columnGap: 'clamp(5px, 1.8cqmin, 11px)', rowGap: 0, flexWrap: 'wrap', fontSize: 'clamp(8px, 2cqmin, 10.5px)', color: muted, width: '100%', flexShrink: 0, lineHeight: 1.15 }}>
        {showHumidityWind ? <span>{tr.hum} {humidity != null ? `${Math.round(nm(humidity, 0))}%` : '—'}</span> : null}
        {showHumidityWind ? <span>{windSpeed > 0 ? `${tr.wind} ${Math.round(windSpeed)} km/h ${windDir(windDeg, de)}` : `${tr.wind} —`}</span> : null}
        {showUvGusts ? <span>UV {Number.isFinite(uv) ? Math.round(uv) : '—'}</span> : null}
        {showUvGusts ? <span>{de ? 'Böen' : 'Gusts'} {gusts > 0 ? `${Math.round(gusts)} km/h` : '—'}</span> : null}
        {showAirQuality && air && air.aqi != null ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: aqiColor(air.aqi), flexShrink: 0 }} />
            {air.aqi} {aqiLabel(air.aqi, de)}
          </span>
        ) : null}
        {showAirQuality && air && air.pm25 != null ? <span>PM2.5 {air.pm25}</span> : null}
        {showSun && sun ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Sunrise aria-hidden style={{ width: 11, height: 11, color: '#fbbf24', flexShrink: 0 }} />
            {fmtTime(sun.sunrise, de)}
          </span>
        ) : null}
        {showSun && sun ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Sunset aria-hidden style={{ width: 11, height: 11, color: '#fb923c', flexShrink: 0 }} />
            {fmtTime(sun.sunset, de)}
          </span>
        ) : null}
      </div>
    ) : null

  const statsChipsEl = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: '100%', flexShrink: 0 }}>
      {([[tr.hum, humidity != null ? `${Math.round(nm(humidity, 0))}%` : '—'], [tr.wind, windSpeed > 0 ? `${Math.round(windSpeed)} ${windDir(windDeg, de)}` : '—'], ['UV', Number.isFinite(uv) ? String(Math.round(uv)) : '—'], [de ? 'Böen' : 'Gusts', gusts > 0 ? String(Math.round(gusts)) : '—'], [de ? 'Luft' : 'Air', air && air.aqi != null ? String(air.aqi) : '—'], ['PM2.5', air && air.pm25 != null ? String(air.pm25) : '—']] as [string, string][]).map(([k, v]) => (
        <div key={k} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(8px, 1.7cqmin, 9.5px)', color: muted }}>{k}</div>
          <div style={{ fontSize: 'clamp(10px, 2.2cqmin, 12px)', fontWeight: 700, color: 'var(--text)' }}>{v}</div>
        </div>
      ))}
    </div>
  )

  const statsPillsEl = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
      {([showHumidityWind ? `${tr.hum} ${humidity != null ? Math.round(nm(humidity, 0)) + '%' : '—'}` : null, showHumidityWind ? `${tr.wind} ${windSpeed > 0 ? Math.round(windSpeed) + ' km/h' : '—'}` : null, showUvGusts ? `UV ${Number.isFinite(uv) ? Math.round(uv) : '—'}` : null, showUvGusts ? `${de ? 'Böen' : 'Gusts'} ${gusts > 0 ? Math.round(gusts) : '—'}` : null, showAirQuality && air && air.aqi != null ? `${de ? 'Luft' : 'Air'} ${air.aqi}` : null, showAirQuality && air && air.pm25 != null ? `PM2.5 ${air.pm25}` : null].filter(Boolean) as string[]).map((t, i) => (
        <span key={i} style={{ background: 'var(--surface-2)', borderRadius: 999, padding: '3px 10px', fontSize: 'clamp(8px, 2cqmin, 10.5px)', color: 'var(--text)' }}>{t}</span>
      ))}
    </div>
  )

  const currentCentered = (large = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(1px, 0.5cqmin, 3px)', width: '100%', flexShrink: 0 }}>
      {tempIconEl(large ? 'clamp(1.7rem, min(13cqmin, 20vw), 3rem)' : 'clamp(1.4rem, min(10cqmin, 18vw), 2.5rem)', large ? 'clamp(34px, min(11cqmin, 15vw), 56px)' : 'clamp(28px, min(9cqmin, 13vw), 48px)')}
      {feelsEl}
      <p style={{ margin: 0, textAlign: 'center', fontSize: 'clamp(10px, 2.4cqmin, 13px)', color: 'var(--text)', fontWeight: 600, lineHeight: 1.2 }}>{label}</p>
    </div>
  )

  const currentInline = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexShrink: 0 }}>
      {tempIconEl('clamp(1.3rem, 7.5cqmin, 2.1rem)', 'clamp(24px, 6.5cqmin, 40px)')}
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <div style={{ fontSize: 'clamp(11px, 2.5cqmin, 14px)', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {feels != null && temp != null && Math.abs(nm(feels, 0) - nm(temp, 0)) >= 0.5 ? <div style={{ fontSize: 'clamp(9px, 2.1cqmin, 11px)', color: muted }}>{tr.feels} {Math.round(nm(feels, 0))}°</div> : null}
      </div>
    </div>
  )

  const hourlyEl =
    showTimeline && periods.length > 0 ? (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${periods.length}, minmax(0, 1fr))`, gap: 'clamp(2px, 0.7cqmin, 5px)', width: '100%', flexShrink: 0 }}>
        {periods.map((p) => {
          const PIcon = codeIcon(p.code, p.isDay)
          const pColor = codeColor(p.code, p.isDay)
          const t = Number.isFinite(p.temp) ? `${Math.round(p.temp)}°` : '—'
          return (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 1px', borderRadius: 6, background: 'color-mix(in srgb, var(--surface) 88%, var(--background))', border: '1px solid color-mix(in srgb, var(--border) 65%, transparent)', minWidth: 0 }}>
              <span style={{ fontSize: 'clamp(8px, 1.6cqmin, 9.5px)', fontWeight: 700, color: muted, lineHeight: 1 }}>{p.label}</span>
              <PIcon aria-hidden strokeWidth={1.75} style={{ width: 'clamp(11px, 2.9cqmin, 16px)', height: 'clamp(11px, 2.9cqmin, 16px)', color: pColor, filter: codeShadow(p.code, p.isDay), flexShrink: 0 }} />
              <span className="tabular-nums" style={{ fontSize: 'clamp(8px, 1.9cqmin, 10.5px)', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>{t}</span>
              {showTimelineRain && Number.isFinite(p.prob) ? <span style={{ fontSize: 'clamp(7px, 1.4cqmin, 8.5px)', fontWeight: 600, color: p.prob >= 50 ? '#3b82f6' : muted, lineHeight: 1 }}>{Math.round(p.prob)}%</span> : null}
            </div>
          )
        })}
      </div>
    ) : null

  const rainEl =
    showRainForecast && rainHours.length > 0 ? (
      <div style={{ width: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 'clamp(8px, 1.7cqmin, 9.5px)', color: muted, fontWeight: 600, textAlign: 'center', lineHeight: 1.15 }}>{rainSummary}</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%' }}>
          {rainHours.map((r) => (
            <div key={r.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 0 }}>
              <div style={{ width: '100%', height: 11, display: 'flex', alignItems: 'flex-end', background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: `${Math.max(3, r.prob)}%`, background: r.prob >= 50 ? '#3b82f6' : r.prob >= 20 ? '#60a5fa' : '#93c5fd', opacity: r.prob > 0 ? 1 : 0.3 }} />
              </div>
              <span style={{ fontSize: 'clamp(6px, 1.3cqmin, 8px)', color: muted, lineHeight: 1 }}>{r.hour}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null

  const hasRain = showRainForecast && rainHours.length > 0
  const rainFill =
    hasRain ? (
      <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 'clamp(8px, 1.7cqmin, 9.5px)', color: muted, fontWeight: 600, textAlign: 'center', lineHeight: 1.15, flexShrink: 0 }}>{rainSummary}</span>
        <div style={{ flex: 1, minHeight: 16, display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%' }}>
          {rainHours.map((r) => (
            <div key={r.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 0, height: '100%' }}>
              <div style={{ width: '100%', flex: 1, minHeight: 8, display: 'flex', alignItems: 'flex-end', background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: `${Math.max(3, r.prob)}%`, background: r.prob >= 50 ? '#3b82f6' : r.prob >= 20 ? '#60a5fa' : '#93c5fd', opacity: r.prob > 0 ? 1 : 0.3 }} />
              </div>
              <span style={{ fontSize: 'clamp(6px, 1.3cqmin, 8px)', color: muted, lineHeight: 1, flexShrink: 0 }}>{r.hour}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null

  const nextDaysLabel = (
    <p style={{ margin: 0, textAlign: 'center', fontSize: 'clamp(8px, 1.9cqmin, 10px)', fontWeight: 600, color: muted, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>{tr.nextDays}</p>
  )

  const wd = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString(de ? 'de-DE' : 'en-GB', { weekday: 'short' })
  const dm = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString(de ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'numeric' })
  const vfill: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2, height: '100%', width: '100%' }

  const sevenGridEl = (low: boolean, date: boolean): ReactNode =>
    haveDaily ? (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: `${Math.max(3, Math.round(5 * s))}px`, width: '100%', height: '100%' }}>
        {daily.map((d) => {
          const DIcon = codeIcon(d.code, true)
          return (
            <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, padding: '4px 2px', borderRadius: 8, background: 'color-mix(in srgb, var(--surface) 92%, var(--background))', border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)', minWidth: 0 }}>
              <span style={{ fontSize: 'clamp(8px, 1.9cqmin, 11px)', fontWeight: 700, color: muted, textTransform: 'capitalize' }}>{wd(d.date)}</span>
              {date ? <span style={{ fontSize: 'clamp(7px, 1.6cqmin, 9px)', color: muted }}>{dm(d.date)}</span> : null}
              <DIcon aria-hidden strokeWidth={1.85} style={{ width: 'clamp(14px, 3.6cqmin, 20px)', height: 'clamp(14px, 3.6cqmin, 20px)', color: codeColor(d.code, true), filter: codeShadow(d.code, true), flexShrink: 0 }} />
              <span className="tabular-nums" style={{ fontSize: 'clamp(9px, 2.2cqmin, 12px)', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(d.max)}°</span>
              {low ? <span className="tabular-nums" style={{ fontSize: 'clamp(8px, 1.7cqmin, 10px)', color: muted }}>{Math.round(d.min)}°</span> : null}
            </div>
          )
        })}
      </div>
    ) : null

  const sevenListEl: ReactNode = haveDaily ? (
    <div style={vfill}>
      {daily.map((d) => {
        const DIcon = codeIcon(d.code, true)
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--surface) 92%, var(--background))', border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)', borderRadius: 6, padding: '0 8px', minHeight: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: 'clamp(9px, 2cqmin, 11px)', fontWeight: 700, color: muted, width: 22, textTransform: 'capitalize', flexShrink: 0 }}>{wd(d.date)}</span>
            <DIcon aria-hidden strokeWidth={1.85} style={{ width: 13, height: 13, color: codeColor(d.code, true), flexShrink: 0 }} />
            <span style={{ flex: 1 }} />
            <span className="tabular-nums" style={{ fontSize: 'clamp(10px, 2.1cqmin, 12px)', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(d.max)}°</span>
            <span className="tabular-nums" style={{ fontSize: 'clamp(8px, 1.8cqmin, 10px)', color: muted }}>{Math.round(d.min)}°</span>
          </div>
        )
      })}
    </div>
  ) : null

  const sevenBarsEl: ReactNode = haveDaily ? (
    <div style={vfill}>
      {daily.map((d) => {
        const DIcon = codeIcon(d.code, true)
        const mx = Math.max(...daily.map((x) => x.max)) || 1
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minHeight: 0 }}>
            <span style={{ fontSize: 'clamp(9px, 2cqmin, 11px)', fontWeight: 700, color: muted, width: 18, textTransform: 'capitalize' }}>{wd(d.date)}</span>
            <DIcon aria-hidden strokeWidth={1.85} style={{ width: 12, height: 12, color: codeColor(d.code, true), flexShrink: 0 }} />
            <div style={{ flex: 1, height: 7, background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((d.max / mx) * 100)}%`, background: codeColor(d.code, true), opacity: 0.8 }} />
            </div>
            <span className="tabular-nums" style={{ fontSize: 'clamp(9px, 2.1cqmin, 12px)', fontWeight: 700, color: 'var(--accent)', width: 24, textAlign: 'right' }}>{Math.round(d.max)}°</span>
          </div>
        )
      })}
    </div>
  ) : null

  const sevenChipsEl: ReactNode = haveDaily ? (
    <div style={vfill}>
      {daily.map((d) => {
        const DIcon = codeIcon(d.code, true)
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb, var(--surface) 90%, var(--background))', borderRadius: 999, padding: '0 10px', minHeight: 0 }}>
            <span style={{ fontSize: 'clamp(9px, 2cqmin, 11px)', fontWeight: 700, color: muted, width: 18, textTransform: 'capitalize' }}>{wd(d.date)}</span>
            <DIcon aria-hidden strokeWidth={1.85} style={{ width: 14, height: 14, color: codeColor(d.code, true), flexShrink: 0 }} />
            <span style={{ flex: 1 }} />
            <span className="tabular-nums" style={{ fontSize: 'clamp(10px, 2.1cqmin, 12px)', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(d.max)}°</span>
          </div>
        )
      })}
    </div>
  ) : null

  const sevenIconEl: ReactNode = haveDaily ? (
    <div style={vfill}>
      {daily.map((d) => {
        const DIcon = codeIcon(d.code, true)
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px', minHeight: 0 }}>
            <span style={{ width: 20, fontSize: 'clamp(9px, 2cqmin, 11px)', fontWeight: 700, color: muted, textTransform: 'capitalize' }}>{wd(d.date)}</span>
            <DIcon aria-hidden strokeWidth={1.85} style={{ width: 14, height: 14, color: codeColor(d.code, true), flexShrink: 0 }} />
            <span style={{ flex: 1 }} />
            <span className="tabular-nums" style={{ fontSize: 'clamp(10px, 2.1cqmin, 12px)', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(d.max)}°</span>
          </div>
        )
      })}
    </div>
  ) : null

  const sideCol = (sevenEl: ReactNode, w: number) => (
    <div style={{ width: w, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {haveDaily ? nextDaysLabel : null}
      <div style={{ flex: 1, minHeight: 0 }}>{sevenEl}</div>
    </div>
  )

  const sidebarLayout = (leftTop: ReactNode, sevenEl: ReactNode, sidebarW: number, centerLeft = false): ReactNode => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: hasRain ? 'flex-start' : 'center', gap: 'clamp(2px, 0.7cqmin, 5px)', alignItems: centerLeft ? 'center' : 'stretch', overflow: 'hidden' }}>
        {leftTop}
        {hasRain ? rainFill : null}
        {hourlyEl}
      </div>
      {sideCol(sevenEl, sidebarW)}
    </div>
  )

  const stackedFallback: ReactNode = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(3px, 1cqmin, 6px)', width: '100%' }}>
      {placeEl}
      {statsEl}
      {currentCentered(false)}
      {hourlyEl}
      {rainEl}
      {haveDaily ? <div style={{ width: '100%', height: 120, flexShrink: 0 }}>{sevenGridEl(false, false)}</div> : null}
    </div>
  )

  const statsGridEl = (
    <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(1px, 0.7cqmin, 4px) clamp(8px, 2.6cqmin, 20px)', alignContent: 'center', fontSize: 'clamp(9px, 2.2cqmin, 12.5px)', lineHeight: 1.2 }}>
      {showHumidityWind ? <span><span style={{ color: muted }}>{tr.hum}</span> <span style={{ color: 'var(--text)', fontWeight: 600 }}>{humidity != null ? `${Math.round(nm(humidity, 0))}%` : '—'}</span></span> : null}
      {showHumidityWind ? <span><span style={{ color: muted }}>{tr.wind}</span> <span style={{ color: 'var(--text)', fontWeight: 600 }}>{windSpeed > 0 ? `${Math.round(windSpeed)} km/h ${windDir(windDeg, de)}` : '—'}</span></span> : null}
      {showUvGusts ? <span><span style={{ color: muted }}>UV</span> <span style={{ color: 'var(--text)', fontWeight: 600 }}>{Number.isFinite(uv) ? Math.round(uv) : '—'}</span></span> : null}
      {showUvGusts ? <span><span style={{ color: muted }}>{de ? 'Böen' : 'Gusts'}</span> <span style={{ color: 'var(--text)', fontWeight: 600 }}>{gusts > 0 ? `${Math.round(gusts)} km/h` : '—'}</span></span> : null}
      {showAirQuality && air && air.aqi != null ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: muted }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: aqiColor(air.aqi), flexShrink: 0 }} />{air.aqi} {aqiLabel(air.aqi, de)}</span> : null}
      {showSun && sun ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: muted }}><Sunrise aria-hidden style={{ width: 12, height: 12, color: '#fbbf24', flexShrink: 0 }} />{fmtTime(sun.sunrise, de)}<Sunset aria-hidden style={{ width: 12, height: 12, color: '#fb923c', flexShrink: 0, marginLeft: 6 }} />{fmtTime(sun.sunset, de)}</span> : null}
    </div>
  )

  const headerRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.4cqmin, 18px)', width: '100%', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.6cqmin, 11px)', flexShrink: 0, color }} aria-label={label} title={label}>
        <span className="tabular-nums" style={{ fontSize: 'clamp(1.4rem, 7cqmin, 2.6rem)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>{temp != null ? `${Math.round(nm(temp, 0))}°` : '—'}</span>
        <Icon aria-hidden strokeWidth={1.75} style={{ width: 'clamp(26px, 6.4cqmin, 46px)', height: 'clamp(26px, 6.4cqmin, 46px)', color, filter: shadow, opacity: stale ? 0.55 : 1, flexShrink: 0 }} />
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(11px, 2.4cqmin, 16px)', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
          {feels != null && temp != null && Math.abs(nm(feels, 0) - nm(temp, 0)) >= 0.5 ? <div style={{ fontSize: 'clamp(10px, 2.2cqmin, 13px)', color: muted }}>{tr.feels} {Math.round(nm(feels, 0))}°</div> : null}
        </div>
      </div>
      {statsGridEl}
    </div>
  )

  const pills24El: ReactNode =
    hours24.length > 0 ? (
      <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
        {[0, 12].map((off) => (
          <div key={off} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 3, width: '100%', flex: 1, minHeight: 0, maxHeight: 130 }}>
            {hours24.slice(off, off + 12).map((x, k) => {
              const idx = off + k
              const PI = codeIcon(x.code, x.isDay)
              const first = idx === 0
              const ic = x.prob >= 50 ? '#3b82f6' : x.prob >= 20 ? '#60a5fa' : x.prob >= 15 ? '#93c5fd' : codeColor(x.code, x.isDay)
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', overflow: 'hidden', gap: 1, padding: '2px 0', borderRadius: 9, minWidth: 0, boxSizing: 'border-box', background: first ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'var(--surface-2)', border: '1px solid ' + (first ? 'var(--accent)' : 'var(--border)') }}>
                  <span style={{ fontSize: 'clamp(7px, 1.5cqmin, 10px)', fontWeight: 700, color: first ? 'var(--accent)' : muted, lineHeight: 1 }}>{first ? (de ? 'jetzt' : 'now') : x.hour}</span>
                  <PI aria-hidden strokeWidth={1.75} style={{ width: 'clamp(11px, 2.8cqmin, 15px)', height: 'clamp(11px, 2.8cqmin, 15px)', color: ic, flexShrink: 0 }} />
                  <span className="tabular-nums" style={{ fontSize: 'clamp(8px, 1.9cqmin, 11px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.05 }}>{Number.isFinite(x.temp) ? `${Math.round(x.temp)}°` : '—'}</span>
                  <span style={{ fontSize: 'clamp(7px, 1.5cqmin, 9px)', fontWeight: 600, color: x.prob >= 20 ? '#3b82f6' : 'transparent', lineHeight: 1 }}>{x.prob}%</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    ) : null

  const smContent: Record<string, ReactNode> = {
    place: placeEl,
    current: currentCentered(false),
    stats: statsEl,
    hourly: hourlyEl,
    pills: pills24El,
    seven: smSevenVertical ? sevenListEl : sevenGridEl(true, false),
    rain: rainFill,
  }
  const selfmadeEl: ReactNode = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%' }}>
      {editMode ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, marginBottom: 2 }}>
          <button
            type="button"
            onClick={() => setSmEdit((v) => !v)}
            title={de ? 'Anordnen' : 'Arrange'}
            style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6, border: '1px solid var(--border)', background: smEdit ? 'var(--accent)' : 'var(--surface-2)', color: smEdit ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            {smEdit ? (de ? '✓ Fertig' : '✓ Done') : (de ? '✎ Anordnen' : '✎ Arrange')}
          </button>
        </div>
      ) : null}
      <div
        ref={smGridRef}
        onPointerMove={smMove}
        onPointerUp={smEnd}
        onPointerCancel={smEnd}
        style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: `repeat(${SM_COLS}, 1fr)`, gridAutoRows: `${SM_UNIT}px`, gap: SM_GAP, overflowY: smEdit ? 'auto' : 'hidden', overflowX: 'hidden', alignContent: 'start' }}
      >
        {SM_BLOCKS.filter((b) => smEnabled[b.id]).map((b) => {
          const box = smBoxOf(b.id)
          return (
            <div
              key={b.id}
              onPointerDown={smEdit ? (e) => smStart(b.id, 'move', e) : undefined}
              style={{ gridColumn: `${box.x + 1} / span ${box.w}`, gridRow: `${box.y + 1} / span ${box.h}`, position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 8, padding: smEdit ? 3 : 0, boxSizing: 'border-box', border: smEdit ? '1px dashed var(--accent)' : '1px solid transparent', background: smEdit ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent', cursor: smEdit ? 'move' : 'default', touchAction: smEdit ? 'none' : 'auto', userSelect: 'none' }}
            >
              <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', pointerEvents: smEdit ? 'none' : 'auto' }}>{smContent[b.id]}</div>
              {smEdit && b.id === 'seven' ? (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={smToggleSeven}
                  title={de ? 'Waagerecht / senkrecht' : 'Horizontal / vertical'}
                  style={{ position: 'absolute', left: 3, top: 3, fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 5, border: '1px solid var(--accent)', background: 'var(--surface)', color: 'var(--accent)', cursor: 'pointer', zIndex: 2 }}
                >
                  {smSevenVertical ? '↕' : '↔'}
                </button>
              ) : null}
              {smEdit ? (
                <div
                  onPointerDown={(e) => smStart(b.id, 'resize', e)}
                  title={de ? 'Größe ziehen' : 'Resize'}
                  style={{ position: 'absolute', right: 0, bottom: 0, width: 15, height: 15, cursor: 'nwse-resize', background: 'var(--accent)', borderRadius: '6px 0 5px 0', opacity: 0.85, touchAction: 'none' }}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )

  const layoutEl: ReactNode = (() => {
    switch (layout) {
      case 'bottombar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1cqmin, 7px)', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              {currentInline}
              <div style={{ flex: 1, minWidth: 170 }}>{statsEl}</div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>{rainEl}{hourlyEl}</div>
            <div style={{ flexShrink: 0, height: 92 }}>{sevenGridEl(false, false)}</div>
          </div>
        )
      case 'statgrid':
        return sidebarLayout(<>{placeEl}{currentInline}{statsChipsEl}</>, sevenListEl, 168)
      case 'rainfocus':
        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: hasRain ? 'flex-start' : 'center', gap: 'clamp(3px, 0.9cqmin, 7px)' }}>
              {currentInline}
              {hasRain ? rainFill : null}
              {hourlyEl}
            </div>
            {sideCol(sevenChipsEl, 132)}
          </div>
        )
      case 'tworows':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1cqmin, 7px)', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>{currentInline}{statsEl}</div>
              <div style={{ width: 280, flexShrink: 0 }}>{sevenGridEl(true, false)}</div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>{rainEl}{hourlyEl}</div>
          </div>
        )
      case 'sparkline':
        return sidebarLayout(<>{placeEl}{currentInline}{statsEl}</>, sevenBarsEl, 188)
      case 'pills':
        return sidebarLayout(<>{currentCentered(false)}{statsPillsEl}</>, sevenChipsEl, 150, true)
      case 'minimal':
        return sidebarLayout(<>{currentCentered(true)}{statsEl}</>, sevenListEl, 150, true)
      case 'fullwidth':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1cqmin, 7px)', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>{currentInline}{statsEl}</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>{rainEl}{hourlyEl}</div>
              <div style={{ width: 250, flexShrink: 0 }}>{sevenGridEl(false, false)}</div>
            </div>
          </div>
        )
      case 'iconseven':
        return sidebarLayout(<>{currentInline}{statsEl}</>, sevenIconEl, 122)
      case 'pills24':
        return (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', width: '100%', height: '100%' }}>
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1cqmin, 8px)', overflow: 'hidden' }}>
              {placeEl}
              {headerRow}
              {pills24El ?? hourlyEl}
            </div>
            {sideCol(sevenListEl, 150)}
          </div>
        )
      case 'selfmade':
        return selfmadeEl
      case 'sidebar':
      default:
        return sidebarLayout(<>{placeEl}{currentInline}{statsEl}</>, sevenListEl, 150)
    }
  })()

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
        gap: 'clamp(2px, 0.8cqmin, 5px)',
        padding: 'clamp(5px, 1.6cqmin, 11px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        opacity: stale ? 0.72 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {error && haveTemp ? (
        <p style={{ margin: 0, flexShrink: 0, fontSize: 'clamp(9px, 2.1cqmin, 11px)', color: '#fb7185', textAlign: 'center', lineHeight: 1.2 }}>{error}</p>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: wide && haveDaily ? 'hidden' : 'auto', overflowX: 'hidden' }}>
        {wide && haveDaily ? layoutEl : stackedFallback}
      </div>
    </div>
  )
}


const inp: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
}

function Settings({ config, onChange }: PluginSettingsProps) {
  const { de } = usePluginLocale()
  const cfg = config as Record<string, unknown>
  const showDaily = cfgBool(cfg, 'showDailyForecast', true)
  const width = widthPct(cfg)

  const check = (key: string, val: boolean, title: string, hint: string) => (
    <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text)', lineHeight: 1.35 }}>
      <input type="checkbox" checked={val} onChange={(e) => onChange(key, e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: 'var(--accent)' }} />
      <span>
        <strong>{title}</strong>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginTop: 4 }}>{hint}</span>
      </span>
    </label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{de ? 'Stadt oder PLZ' : 'City or postal code'}</label>
        <input style={inp} value={str(cfg.locationQuery)} onChange={(e) => onChange('locationQuery', e.target.value)} placeholder={de ? 'z. B. Berlin, Köln, 80331' : 'e.g. Berlin, London, 10001'} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>{de ? 'Nach dem Speichern lädt das Widget automatisch Wetterdaten (Open-Meteo). Bei PLZ optional Land setzen.' : 'After saving, the widget loads weather data (Open-Meteo). For postal codes, set country optionally.'}</p>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{de ? 'Land (ISO, optional)' : 'Country (ISO, optional)'}</label>
        <input style={inp} value={str(cfg.countryCode)} onChange={(e) => onChange('countryCode', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))} placeholder={de ? 'z. B. DE' : 'e.g. DE'} maxLength={2} />
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Layout</label>
        <select style={inp} value={str(cfg.layout) || 'sidebar'} onChange={(e) => onChange('layout', e.target.value)}>
          <option value="sidebar">{de ? 'Sidebar-Liste' : 'Sidebar list'}</option>
          <option value="pills24">{de ? '24-Stunden-Pillen' : '24-hour pills'}</option>
          <option value="bottombar">{de ? 'Untere Leiste' : 'Bottom bar'}</option>
          <option value="statgrid">{de ? 'Werte-Kacheln' : 'Stat grid'}</option>
          <option value="rainfocus">{de ? 'Regen-Fokus' : 'Rain focus'}</option>
          <option value="tworows">{de ? 'Zwei Reihen' : 'Two rows'}</option>
          <option value="sparkline">{de ? 'Temperatur-Balken' : 'Temp bars'}</option>
          <option value="pills">{de ? 'Pillen' : 'Pills'}</option>
          <option value="minimal">Minimal</option>
          <option value="fullwidth">{de ? 'Vollbreite oben' : 'Full-width top'}</option>
          <option value="iconseven">{de ? 'Icon-7-Tage' : 'Icon 7-day'}</option>
          <option value="selfmade">{de ? 'Selbst gestalten' : 'Build your own'}</option>
        </select>
      </div>
      {str(cfg.layout) === 'selfmade' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 600 }}>{de ? 'Bausteine (für „Selbst gestalten")' : 'Blocks (for "Build your own")'}</p>
          {check('smPlace', cfgBool(cfg, 'smPlace', true), de ? 'Ort / Stadtname' : 'Location', '')}
          {check('smCurrent', cfgBool(cfg, 'smCurrent', true), de ? 'Aktuelles Wetter' : 'Current weather', '')}
          {check('smStats', cfgBool(cfg, 'smStats', true), de ? 'Werte (Feuchte/Wind/UV/…)' : 'Stats (humidity/wind/UV/…)', '')}
          {check('smHourly', cfgBool(cfg, 'smHourly', true), de ? '3-Stunden-Verlauf' : '3-hour timeline', '')}
          {check('smPills', cfgBool(cfg, 'smPills', false), de ? '24-Stunden-Pillen' : '24-hour pills', '')}
          {check('smSeven', cfgBool(cfg, 'smSeven', true), de ? '7-Tage' : '7-day', '')}
          {check('smRain', cfgBool(cfg, 'smRain', false), de ? 'Regen-Vorschau' : 'Rain outlook', '')}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{de ? 'Danach im Widget auf „✎ Anordnen" tippen und Bausteine verschieben / in der Größe ziehen.' : 'Then tap "✎ Arrange" in the widget to move/resize the blocks.'}</p>
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 600 }}>{de ? 'Anzeige im Widget' : 'Widget display'}</p>
        {check('showHumidityWind', cfgBool(cfg, 'showHumidityWind', true), de ? 'Luftfeuchtigkeit & Wind' : 'Humidity & wind', de ? 'Zeile oben mit Luftfeuchte und Wind (km/h, Himmelsrichtung).' : 'Top row with humidity and wind speed/direction.')}
        {check('showSunTimes', cfgBool(cfg, 'showSunTimes', true), de ? 'Sonnenauf- & -untergang' : 'Sunrise & sunset', de ? 'Zeiten mit Symbolen unter Luftfeuchte/Wind (Open-Meteo, heute).' : 'Times with icons below humidity/wind (Open-Meteo, today).')}
        {check('showHourTimeline', cfgBool(cfg, 'showHourTimeline', true), de ? '3-Stunden-Verlauf (0–24)' : '3-hour timeline (0–24)', de ? 'Kleine Kacheln mit Uhrzeit, Icon und Temperatur unter dem aktuellen Wetter.' : 'Small tiles with hour, icon and temperature below current weather.')}
        {check('showRainForecast', cfgBool(cfg, 'showRainForecast', true), de ? 'Regen-Vorschau' : 'Rain outlook', de ? 'Mini-Balken der Regenwahrscheinlichkeit der nächsten Stunden + Hinweis „Regen ab …".' : 'Mini bars of rain probability for the next hours + a "rain from …" hint.')}
        {check('showTimelineRain', cfgBool(cfg, 'showTimelineRain', true), de ? 'Regen-% im 3-Stunden-Verlauf' : 'Rain % in 3h timeline', de ? 'Zeigt je Verlaufs-Kachel die Niederschlagswahrscheinlichkeit.' : 'Shows rain probability per timeline tile.')}
        {check('showUvGusts', cfgBool(cfg, 'showUvGusts', true), de ? 'UV-Index & Windböen' : 'UV index & wind gusts', de ? 'Zusätzliche Zeile mit UV-Index und Windböen.' : 'Extra row with UV index and wind gusts.')}
        {check('showAirQuality', cfgBool(cfg, 'showAirQuality', true), de ? 'Luftqualität (AQI)' : 'Air quality (AQI)', de ? 'Europäischer Luftqualitätsindex + PM2.5 (Open-Meteo Air-Quality).' : 'European air quality index + PM2.5 (Open-Meteo air quality).')}
      </div>
      {check('showDailyForecast', showDaily, de ? '7-Tage-Vorschau' : '7-day forecast', de ? 'Rechts die nächsten 7 Tage ab morgen (heute nicht doppelt). Der 3-Stunden-Verlauf ist separat ein-/ausblendbar.' : 'Next 7 days on the right (from tomorrow). The 3-hour timeline is toggled separately.')}
      {check('showPlaceLabel', cfgBool(cfg, 'showPlaceLabel', true), de ? 'Ort / Stadtnamen' : 'Location line', de ? 'Zeigt die aufgelöste Adresse oben im Widget (z. B. „Hamburg, …, DE").' : 'Shows the resolved place name at the top of the widget.')}
      <div style={{ opacity: showDaily ? 1 : 0.55 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{de ? '7-Tage: Kartenbreite (%)' : '7-day card width (%)'}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input type="range" min={70} max={130} step={1} value={width} disabled={!showDaily} onChange={(e) => onChange('dailyForecastWidthPct', clampWidth(Number(e.target.value)))} style={{ flex: '1 1 140px', minWidth: 120, accentColor: 'var(--accent)' }} />
          <input style={{ ...inp, width: 72, flexShrink: 0 }} type="number" min={70} max={130} disabled={!showDaily} value={width} onChange={(e) => onChange('dailyForecastWidthPct', clampWidth(e.target.value))} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4, marginBottom: 0 }}>{de ? 'Skaliert Mindestbreite, Abstände und Schrift der Tageskarten (nur wenn die 7-Tage-Vorschau aktiv ist). 100 % = Standard.' : 'Scales minimum width, gaps, and type for day cards when the 7-day forecast is on. 100% is default.'}</p>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{de ? 'Aktualisieren alle (Minuten)' : 'Refresh every (minutes)'}</label>
        <input style={inp} type="number" min={5} max={120} value={clampRefresh(cfg.refreshMinutes)} onChange={(e) => onChange('refreshMinutes', clampRefresh(e.target.value))} />
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
        {de ? 'Wetterdaten:' : 'Weather data:'} <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Open-Meteo</a> {de ? '(nicht kommerziell, ohne API-Key).' : '(non-commercial, no API key).'}
      </p>
    </div>
  )
}

export const meta: PluginMeta = {
  id: 'weather',
  name: 'Weather',
  description:
    'Stadt oder PLZ — aktuelles Wetter mit 3-Stunden-Verlauf (0, 3, 6 … 21, 24) und optional 7-Tage-Vorschau. Open-Meteo, kein API-Key. API: /api/plugins/weather/resolve.',
  version: '1.10.5',
  author: 'SelfDashboard',
  category: 'utility',
  icon: '🌤️',
  stackedExtraH: 2,
  configSchema: [
    { key: 'locationQuery', label: 'Stadt oder PLZ', type: 'text', placeholder: 'z. B. Berlin, Hamburg, 10115', defaultValue: '' },
    { key: 'countryCode', label: 'Land (ISO, optional)', type: 'text', placeholder: 'DE — hilft bei PLZ', defaultValue: 'DE' },
    { key: 'refreshMinutes', label: 'Aktualisieren alle (Minuten)', type: 'number', defaultValue: 15 },
    { key: 'showDailyForecast', label: '7-Tage-Vorschau', type: 'boolean', defaultValue: true },
    { key: 'showPlaceLabel', label: 'Ort / Stadtnamen anzeigen', type: 'boolean', defaultValue: true },
    { key: 'showHumidityWind', label: 'Luftfeuchtigkeit & Wind', type: 'boolean', defaultValue: true },
    { key: 'showSunTimes', label: 'Sonnenauf- & -untergang', type: 'boolean', defaultValue: true },
    { key: 'showHourTimeline', label: '3-Stunden-Verlauf (0–24)', type: 'boolean', defaultValue: true },
    { key: 'showRainForecast', label: 'Regen-Vorschau', type: 'boolean', defaultValue: true },
    { key: 'showTimelineRain', label: 'Regen-% im 3h-Verlauf', type: 'boolean', defaultValue: true },
    { key: 'showUvGusts', label: 'UV-Index & Windböen', type: 'boolean', defaultValue: true },
    { key: 'showAirQuality', label: 'Luftqualität (AQI)', type: 'boolean', defaultValue: true },
    { key: 'layout', label: 'Layout', type: 'text', defaultValue: 'sidebar' },
    { key: 'customLayout', label: 'Selfmade-Layout (JSON)', type: 'text', defaultValue: '' },
    { key: 'smPlace', label: 'Selfmade: Ort', type: 'boolean', defaultValue: true },
    { key: 'smSevenVertical', label: 'Selfmade: 7-Tage senkrecht', type: 'boolean', defaultValue: false },
    { key: 'smCurrent', label: 'Selfmade: Aktuelles Wetter', type: 'boolean', defaultValue: true },
    { key: 'smStats', label: 'Selfmade: Werte', type: 'boolean', defaultValue: true },
    { key: 'smHourly', label: 'Selfmade: 3-Stunden-Verlauf', type: 'boolean', defaultValue: true },
    { key: 'smPills', label: 'Selfmade: 24-Stunden-Pillen', type: 'boolean', defaultValue: false },
    { key: 'smSeven', label: 'Selfmade: 7-Tage', type: 'boolean', defaultValue: true },
    { key: 'smRain', label: 'Selfmade: Regen-Vorschau', type: 'boolean', defaultValue: false },
    { key: 'dailyForecastWidthPct', label: '7-Tage: Kartenbreite (%)', type: 'number', defaultValue: 100 },
  ],
}

export const component: PluginComponent = {
  Widget,
  Settings,
}
