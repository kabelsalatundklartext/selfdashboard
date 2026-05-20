import 'server-only'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'node:crypto'
import { dataDir } from '@/lib/dataDir'

export type EnergySample = {
  /** Unix ms */
  t: number
  powerW: number
  energyWh: number
}

export type EnergyStoreFile = {
  ain: string
  baseUrl: string
  /** YYYY-MM-DD (Europe/Berlin) → kWh (aus Zählerstand minus Tages-Baseline) */
  dailyKwh: Record<string, number>
  /** Erster Zählerstand Wh pro Kalendertag (Europe/Berlin) */
  dayBaselineWh: Record<string, number>
  /** letzte 7 Tage Detail (max ~10k Punkte) */
  recent: EnergySample[]
  updatedAt: string
}

const MAX_RECENT = 10_080
const MAX_DAILY_KEYS = 400

function storeDir() {
  return join(dataDir(), 'fritz-energy')
}

export function energyStoreKey(baseUrl: string, ain: string): string {
  const norm = `${baseUrl.trim().toLowerCase()}|${ain.replace(/\s/g, '')}`
  return createHash('sha256').update(norm).digest('hex').slice(0, 24)
}

function storePath(key: string) {
  return join(storeDir(), `${key}.json`)
}

function berlinDateKey(ms: number): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date(ms))
}

function berlinMonthPrefix(ms: number): string {
  return berlinDateKey(ms).slice(0, 7)
}

function pruneDaily(daily: Record<string, number>): Record<string, number> {
  const keys = Object.keys(daily).sort()
  if (keys.length <= MAX_DAILY_KEYS) return daily
  const keep = new Set(keys.slice(-MAX_DAILY_KEYS))
  const out: Record<string, number> = {}
  for (const k of keys) {
    if (keep.has(k)) out[k] = daily[k]!
  }
  return out
}

function pruneRecent(recent: EnergySample[]): EnergySample[] {
  if (recent.length <= MAX_RECENT) return recent
  return recent.slice(-MAX_RECENT)
}

export async function readEnergyStore(key: string): Promise<EnergyStoreFile | null> {
  try {
    const raw = await readFile(storePath(key), 'utf8')
    const j = JSON.parse(raw) as EnergyStoreFile
    if (!j || typeof j !== 'object') return null
    return j
  } catch {
    return null
  }
}

async function writeEnergyStore(key: string, data: EnergyStoreFile): Promise<void> {
  const dir = storeDir()
  await mkdir(dir, { recursive: true })
  const path = storePath(key)
  const tmp = `${path}.tmp`
  await writeFile(tmp, `${JSON.stringify(data)}\n`, 'utf8')
  await rename(tmp, path)
}

export type EnergyAggregates = {
  currentPowerW: number
  todayKwh: number
  last7DaysKwh: number
  monthKwh: number
  energyWhTotal: number
}

function sumDailyRange(daily: Record<string, number>, fromKey: string, toKey: string): number {
  let sum = 0
  for (const [k, v] of Object.entries(daily)) {
    if (k >= fromKey && k <= toKey) sum += v
  }
  return sum
}

function computeAggregates(store: EnergyStoreFile, sample: EnergySample): EnergyAggregates {
  const todayKey = berlinDateKey(sample.t)
  const monthPrefix = berlinMonthPrefix(sample.t)

  const todayKwh = store.dailyKwh[todayKey] ?? 0

  const keys = Object.keys(store.dailyKwh).sort()
  const last7Keys = keys.slice(-7)
  const last7DaysKwh = last7Keys.reduce((a, k) => a + (store.dailyKwh[k] ?? 0), 0)

  const monthKwh = sumDailyRange(store.dailyKwh, `${monthPrefix}-01`, `${todayKey}`)

  return {
    currentPowerW: sample.powerW,
    todayKwh,
    last7DaysKwh,
    monthKwh,
    energyWhTotal: sample.energyWh,
  }
}

/**
 * Neuen Messpunkt speichern und Tagesverbrauch aus Zähler-Delta aktualisieren.
 */
export async function appendEnergySample(
  key: string,
  meta: { ain: string; baseUrl: string },
  sample: EnergySample,
): Promise<{ store: EnergyStoreFile; aggregates: EnergyAggregates }> {
  let store =
    (await readEnergyStore(key)) ??
    ({
      ain: meta.ain,
      baseUrl: meta.baseUrl,
      dailyKwh: {},
      dayBaselineWh: {},
      recent: [],
      updatedAt: new Date(0).toISOString(),
    } satisfies EnergyStoreFile)

  const dayKey = berlinDateKey(sample.t)
  if (store.dayBaselineWh[dayKey] == null) {
    store.dayBaselineWh[dayKey] = sample.energyWh
  }
  const baseline = store.dayBaselineWh[dayKey]!
  const todayKwh =
    sample.energyWh >= baseline ? (sample.energyWh - baseline) / 1000 : 0
  store.dailyKwh[dayKey] = todayKwh

  store.recent = pruneRecent([...store.recent, sample])
  store.dailyKwh = pruneDaily(store.dailyKwh)
  if (Object.keys(store.dayBaselineWh).length > MAX_DAILY_KEYS) {
    const keep = new Set(Object.keys(store.dailyKwh).sort().slice(-MAX_DAILY_KEYS))
    const bl: Record<string, number> = {}
    for (const k of keep) {
      if (store.dayBaselineWh[k] != null) bl[k] = store.dayBaselineWh[k]!
    }
    store.dayBaselineWh = bl
  }
  store.updatedAt = new Date().toISOString()
  store.ain = meta.ain
  store.baseUrl = meta.baseUrl

  await writeEnergyStore(key, store)
  return { store, aggregates: computeAggregates(store, sample) }
}

export function aggregatesFromStore(store: EnergyStoreFile): EnergyAggregates | null {
  const last = store.recent[store.recent.length - 1]
  if (!last) return null
  return computeAggregates(store, last)
}
