import AlexaRemote from 'alexa-remote2'
import { logPluginApiFailure } from '../../_shared/log'
import { readSession, readStore, saveSession, deleteStore, type AlexaConfig } from './store'

// ---------------------------------------------------------------------------
// alexa-remote2 connection manager.
//
// Amazon has no public consumer API for Alexa. alexa-remote2 talks to the same
// private cloud the Alexa app uses. Auth happens once through a local login
// proxy (the user signs in to Amazon, incl. 2FA); the resulting session blob is
// sealed on disk and reused — alexa-remote2 refreshes the cookie on its own and
// we re-persist it via the 'cookie' event.
//
// NOTE: alexa-remote2 performs its own outbound HTTPS to fixed Amazon hosts, so
// it does not pass through the shared fetchWithSsrfGuard. That is acceptable
// because the destinations are not user-controlled, but it is a deliberate
// deviation from the fetch-based plugins worth keeping in mind.
// ---------------------------------------------------------------------------

type Alexa = InstanceType<typeof AlexaRemote>

let live: Alexa | null = null
let liveInit: Promise<Alexa> | null = null
let pending: { alexa: Alexa; proxyUrl: string; startedAt: number } | null = null

/** Promisify alexa-remote2's (err, body) callback methods. */
function call<T>(fn: (cb: (err?: Error, body?: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, body) => (err ? reject(err) : resolve(body as T)))
  })
}

function attachRefreshPersist(alexa: Alexa): void {
  alexa.on('cookie', () => {
    // Fired on initial login AND on every background cookie refresh.
    void saveSession(alexa.cookieData).catch(() => {})
  })
}

function buildBaseOptions(cfg: { amazonPage: string; serviceHost: string }): Record<string, unknown> {
  return {
    amazonPage: cfg.amazonPage,
    alexaServiceHost: cfg.serviceHost,
    useWsMqtt: false,
    usePushConnection: false,
    // No background refresh timer inside a request process; alexa-remote2 still
    // refreshes the cookie on demand from the stored registration data.
    cookieRefreshInterval: 0,
  }
}

// ---------------------------------------------------------------------------
// Login (proxy flow) — mirrors the Spotify "begin → external login" shape.
// ---------------------------------------------------------------------------

export function loginPending(): boolean {
  // A proxy login started in the last 10 minutes is considered in-flight.
  return Boolean(pending && Date.now() - pending.startedAt < 10 * 60 * 1000)
}

export async function beginLogin(cfg: AlexaConfig): Promise<{ proxyUrl: string }> {
  // Tear down any previous in-flight proxy so the port is free.
  if (pending) {
    try {
      pending.alexa.stop()
    } catch {
      /* ignore */
    }
    pending = null
  }

  const alexa = new AlexaRemote()
  const proxyUrl = `http://${cfg.host}:${cfg.port}/`

  alexa.on('cookie', () => {
    // Login (or refresh) complete: seal the session and let the next request
    // re-init a clean API client from it. Drop the proxy instance.
    void saveSession(alexa.cookieData)
      .then(() => fetchCustomerName(alexa))
      .catch(() => {})
    try {
      alexa.stopProxyServer(() => {})
    } catch {
      /* ignore */
    }
    // Force a fresh init on the next action.
    live = null
    liveInit = null
    pending = null
  })

  const options = {
    ...buildBaseOptions(cfg),
    proxyOnly: true,
    proxyOwnIp: cfg.host,
    proxyPort: cfg.port,
    formerRegistrationData: (await readSession()) ?? undefined,
  }

  await new Promise<void>((resolve) => {
    try {
      alexa.init(options as never, (err?: Error) => {
        if (err) void logPluginApiFailure('alexa', 'begin', err.message)
        resolve()
      })
    } catch (e) {
      void logPluginApiFailure('alexa', 'begin', e instanceof Error ? e.message : String(e))
      resolve()
    }
  })

  pending = { alexa, proxyUrl, startedAt: Date.now() }
  return { proxyUrl }
}

async function fetchCustomerName(alexa: Alexa): Promise<void> {
  try {
    const me = await call<{ customerName?: string } | undefined>((cb) => alexa.getUsersMe(cb))
    if (me?.customerName) await saveSession(alexa.cookieData, me.customerName)
  } catch {
    /* non-fatal */
  }
}

// ---------------------------------------------------------------------------
// Authenticated client (re-init from the sealed session, cached in module).
// ---------------------------------------------------------------------------

async function initFromStore(): Promise<Alexa> {
  const record = await readStore()
  const session = await readSession()
  if (!record || !session) throw new Error('not_connected')

  const alexa = new AlexaRemote()
  attachRefreshPersist(alexa)

  const options = {
    ...buildBaseOptions(record),
    // Passing the cookieData object as `cookie` lets alexa-remote2 reuse the
    // registration data and refresh internally.
    cookie: session,
    formerRegistrationData: session,
  }

  await new Promise<void>((resolve, reject) => {
    alexa.init(options as never, (err?: Error) => (err ? reject(err) : resolve()))
  })
  return alexa
}

export async function ensureLive(): Promise<Alexa> {
  if (live) return live
  if (!liveInit) {
    liveInit = initFromStore()
      .then((a) => {
        live = a
        return a
      })
      .catch((e) => {
        liveInit = null
        throw e
      })
  }
  return liveInit
}

/** Drop the cached client (e.g. after an auth error) so the next call re-inits. */
function dropLive(): void {
  if (live) {
    try {
      live.stop()
    } catch {
      /* ignore */
    }
  }
  live = null
  liveInit = null
}

export async function disconnect(): Promise<void> {
  dropLive()
  if (pending) {
    try {
      pending.alexa.stop()
    } catch {
      /* ignore */
    }
    pending = null
  }
  await deleteStore()
}

/** Wrap an authenticated call, mapping auth failures to a re-auth signal. */
async function withLive<T>(label: string, fn: (alexa: Alexa) => Promise<T>): Promise<T> {
  let alexa: Alexa
  try {
    alexa = await ensureLive()
  } catch (e) {
    if (e instanceof Error && e.message === 'not_connected') throw e
    throw new Error('reauth_required')
  }
  try {
    return await fn(alexa)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/auth|cookie|401|403|forbidden|login/i.test(msg)) {
      dropLive()
      void logPluginApiFailure('alexa', label, 'reauth_required', { detail: msg })
      throw new Error('reauth_required')
    }
    throw e
  }
}

// ---------------------------------------------------------------------------
// Normalized data accessors
// ---------------------------------------------------------------------------

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export type DeviceLite = {
  serial: string
  name: string
  type: string
  online: boolean
  hasMusic: boolean
}

export async function listDevices(): Promise<DeviceLite[]> {
  return withLive('devices', async (alexa) => {
    const body = await call<{ devices?: unknown[] }>((cb) => alexa.getDevices(cb))
    const raw = Array.isArray(body?.devices) ? body.devices : []
    return raw
      .filter(isObj)
      .map((d) => {
        const caps = Array.isArray(d.capabilities) ? (d.capabilities as unknown[]) : []
        const hasMusic =
          d.hasMusicPlayer === true || caps.some((c) => typeof c === 'string' && c.includes('AUDIO_PLAYER'))
        return {
          serial: typeof d.serialNumber === 'string' ? d.serialNumber : '',
          name: typeof d.accountName === 'string' ? d.accountName : 'Echo',
          type: typeof d.deviceType === 'string' ? d.deviceType : '',
          online: d.online === true,
          hasMusic,
        } satisfies DeviceLite
      })
      .filter((d) => d.serial)
  })
}

export type PlayerLite = {
  serial: string
  state: string
  title?: string
  artist?: string
  album?: string
  imageUrl?: string
  provider?: string
  volume?: number
  muted?: boolean
}

export async function getPlayer(serial: string): Promise<PlayerLite> {
  return withLive('player', async (alexa) => {
    const body = await call<{ playerInfo?: Record<string, unknown> }>((cb) => alexa.getPlayerInfo(serial, cb))
    const p = isObj(body?.playerInfo) ? body.playerInfo : {}
    const info = isObj(p.infoText) ? p.infoText : {}
    const art = isObj(p.mainArt) ? p.mainArt : {}
    const provider = isObj(p.provider) ? p.provider : {}
    const volume = isObj(p.volume) ? p.volume : {}
    return {
      serial,
      state: typeof p.state === 'string' ? p.state : 'IDLE',
      title: typeof info.title === 'string' ? info.title : undefined,
      artist: typeof info.subText1 === 'string' ? info.subText1 : undefined,
      album: typeof info.subText2 === 'string' ? info.subText2 : undefined,
      imageUrl: typeof art.url === 'string' ? art.url : undefined,
      provider: typeof provider.providerName === 'string' ? provider.providerName : undefined,
      volume: typeof volume.volume === 'number' ? volume.volume : undefined,
      muted: volume.muted === true,
    } satisfies PlayerLite
  })
}

const PLAYER_COMMANDS = new Set(['play', 'pause', 'next', 'previous', 'forward', 'rewind'])

export async function control(serial: string, command: string, value?: number): Promise<void> {
  return withLive('control', async (alexa) => {
    if (command === 'volume') {
      const vol = Math.max(0, Math.min(100, Math.round(value ?? 0)))
      await call((cb) => alexa.sendCommand(serial, 'volume', vol, cb))
      return
    }
    if (!PLAYER_COMMANDS.has(command)) throw new Error('invalid_command')
    await call((cb) => alexa.sendCommand(serial, command as never, '' as never, cb))
  })
}

export type SmarthomeLite = { id: string; name: string }

export async function listSmarthome(): Promise<SmarthomeLite[]> {
  return withLive('smarthome', async (alexa) => {
    const body = await call<unknown>((cb) => alexa.getSmarthomeEntities(cb))
    const raw = Array.isArray(body) ? body : isObj(body) && Array.isArray(body.entities) ? body.entities : []
    return (raw as unknown[])
      .filter(isObj)
      .map((e) => ({
        id: typeof e.id === 'string' ? e.id : typeof e.applianceId === 'string' ? e.applianceId : '',
        name: typeof e.name === 'string' ? e.name : typeof e.friendlyName === 'string' ? e.friendlyName : 'Gerät',
      }))
      .filter((e) => e.id)
  })
}

export async function toggleSmarthome(id: string, on: boolean): Promise<void> {
  return withLive('smarthome-toggle', async (alexa) => {
    await call((cb) => alexa.executeSmarthomeDeviceAction([id], [on ? 'turnOn' : 'turnOff'], 'APPLIANCE', cb))
  })
}

export type RoutineLite = { id: string; name: string }

function routineName(r: Record<string, unknown>): string {
  if (typeof r.name === 'string' && r.name.trim()) return r.name.trim()
  const triggers = Array.isArray(r.triggers) ? r.triggers : []
  for (const t of triggers) {
    if (isObj(t) && isObj(t.payload) && typeof t.payload.utterance === 'string' && t.payload.utterance.trim()) {
      return t.payload.utterance.trim()
    }
  }
  return typeof r.automationId === 'string' ? r.automationId.slice(0, 18) : 'Routine'
}

export async function listRoutines(): Promise<RoutineLite[]> {
  return withLive('routines', async (alexa) => {
    const body = await call<unknown>((cb) => alexa.getAutomationRoutines(200, cb))
    const raw = Array.isArray(body) ? body : []
    return (raw as unknown[])
      .filter(isObj)
      .map((r) => ({
        id: typeof r.automationId === 'string' ? r.automationId : '',
        name: routineName(r),
      }))
      .filter((r) => r.id)
  })
}

export async function runRoutine(automationId: string, serial?: string): Promise<void> {
  return withLive('routine-run', async (alexa) => {
    const body = await call<unknown>((cb) => alexa.getAutomationRoutines(200, cb))
    const raw = Array.isArray(body) ? body : []
    const routine = (raw as unknown[]).filter(isObj).find((r) => r.automationId === automationId)
    if (!routine) throw new Error('routine_not_found')

    let target = serial
    if (!target) {
      const devices = await call<{ devices?: unknown[] }>((cb) => alexa.getDevices(cb))
      const first = (Array.isArray(devices?.devices) ? devices.devices : [])
        .filter(isObj)
        .find((d) => d.online === true)
      target = first && typeof first.serialNumber === 'string' ? first.serialNumber : undefined
    }
    if (!target) throw new Error('no_device')
    await call((cb) => alexa.executeAutomationRoutine(target as string, routine as never, cb))
  })
}
