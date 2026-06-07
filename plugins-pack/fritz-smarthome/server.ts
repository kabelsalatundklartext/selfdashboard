import crypto from 'crypto'
import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import { fetchWithSsrfGuard, UnsafeOutboundUrlError } from '../_shared/ssrf'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 15_000

type ReqBody = {
  url?: string
  username?: string
  password?: string
  action?: 'state' | 'set'
  kind?: 'switch' | 'thermostat'
  ain?: string
  on?: boolean
  /** thermostat target in °C */
  tempC?: number
  /** thermostat: set to off (frost protection / param 253) */
  off?: boolean
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

function normalizeBase(raw: string): string {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_url')
  u.pathname = ''
  u.search = ''
  u.hash = ''
  return u.toString().replace(/\/+$/, '')
}

/** First capture group of a regex, or '' */
function pick(xml: string, re: RegExp): string {
  const m = re.exec(xml)
  return m ? m[1].trim() : ''
}

function numOr(v: string, d: number | null = null): number | null {
  if (v === '') return d
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

/** FRITZ!Box challenge-response: PBKDF2 (2$…) with MD5/UTF-16LE fallback. */
function calcResponse(challenge: string, password: string): string {
  if (challenge.startsWith('2$')) {
    const p = challenge.split('$')
    const iter1 = parseInt(p[1], 10)
    const salt1 = Buffer.from(p[2], 'hex')
    const iter2 = parseInt(p[3], 10)
    const salt2Hex = p[4]
    const salt2 = Buffer.from(salt2Hex, 'hex')
    const hash1 = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt1, iter1, 32, 'sha256')
    const hash2 = crypto.pbkdf2Sync(hash1, salt2, iter2, 32, 'sha256')
    return `${salt2Hex}$${hash2.toString('hex')}`
  }
  const md5 = crypto.createHash('md5').update(Buffer.from(`${challenge}-${password}`, 'utf16le')).digest('hex')
  return `${challenge}-${md5}`
}

async function getText(url: string, signal: AbortSignal): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetchWithSsrfGuard(url, { method: 'GET', cache: 'no-store', signal })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

async function login(base: string, username: string, password: string, signal: AbortSignal): Promise<string | null> {
  const r1 = await getText(`${base}/login_sid.lua?version=2`, signal)
  const challenge = pick(r1.text, /<Challenge>(.*?)<\/Challenge>/)
  const sid0 = pick(r1.text, /<SID>(.*?)<\/SID>/)
  if (!challenge) return null
  if (sid0 && sid0 !== '0000000000000000') return sid0
  const response = calcResponse(challenge, password)
  const url2 = `${base}/login_sid.lua?version=2&username=${encodeURIComponent(username)}&response=${encodeURIComponent(response)}`
  const r2 = await getText(url2, signal)
  const sid = pick(r2.text, /<SID>(.*?)<\/SID>/)
  if (!sid || sid === '0000000000000000') return null
  return sid
}

async function logout(base: string, sid: string, signal: AbortSignal): Promise<void> {
  try {
    await getText(`${base}/login_sid.lua?version=2&logout=1&sid=${sid}`, signal)
  } catch {
    /* best effort */
  }
}

function aha(base: string, sid: string, cmd: string, extra = ''): string {
  return `${base}/webservices/homeautoswitch.lua?switchcmd=${cmd}&sid=${sid}${extra}`
}

type FritzDevice = {
  ain: string
  name: string
  kind: 'thermostat' | 'switch' | 'sensor' | 'contact' | 'other'
  present: boolean
  // thermostat
  tist?: number | null
  tsoll?: number | null
  windowOpen?: boolean
  batteryLow?: boolean
  battery?: number | null
  // switch
  on?: boolean
  power?: number | null
  energy?: number | null
  // sensor
  temperature?: number | null
  humidity?: number | null
  // contact
  open?: boolean
}

function parseDevices(xml: string): FritzDevice[] {
  const out: FritzDevice[] = []
  const re = /<device\s+([^>]*?)>([\s\S]*?)<\/device>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const attrs = m[1]
    const body = m[2]
    const ain = pick(attrs, /identifier="([^"]*)"/)
    if (!ain) continue
    const name = pick(body, /<name>([\s\S]*?)<\/name>/) || ain
    const present = pick(body, /<present>(.*?)<\/present>/) === '1'

    const hasHkr = /<hkr>/.test(body)
    const hasSwitch = /<switch>/.test(body)
    const hasAlert = /<alert>/.test(body)
    const hasTemp = /<temperature>/.test(body)
    const hasHum = /<humidity>/.test(body)

    const dev: FritzDevice = { ain, name, kind: 'other', present }

    // temperature sensor value (tenths °C) — many devices carry it
    if (hasTemp) {
      const c = numOr(pick(body, /<temperature>[\s\S]*?<celsius>(.*?)<\/celsius>/))
      dev.temperature = c != null ? Math.round(c) / 10 : null
    }
    if (hasHum) {
      dev.humidity = numOr(pick(body, /<humidity>[\s\S]*?<rel_humidity>(.*?)<\/rel_humidity>/))
    }

    if (hasHkr) {
      dev.kind = 'thermostat'
      const tist = numOr(pick(body, /<hkr>[\s\S]*?<tist>(.*?)<\/tist>/))
      const tsoll = numOr(pick(body, /<hkr>[\s\S]*?<tsoll>(.*?)<\/tsoll>/))
      dev.tist = tist != null ? tist / 2 : dev.temperature ?? null
      dev.tsoll = tsoll != null ? tsoll : null // raw half-deg (253=off,254=on)
      dev.windowOpen = pick(body, /<windowopenactiv>(.*?)<\/windowopenactiv>/) === '1'
      dev.batteryLow = pick(body, /<batterylow>(.*?)<\/batterylow>/) === '1'
      dev.battery = numOr(pick(body, /<battery>(.*?)<\/battery>/))
    } else if (hasSwitch) {
      dev.kind = 'switch'
      dev.on = pick(body, /<switch>[\s\S]*?<state>(.*?)<\/state>/) === '1'
      const p = numOr(pick(body, /<powermeter>[\s\S]*?<power>(.*?)<\/power>/))
      dev.power = p != null ? Math.round(p) / 1000 : null
      dev.energy = numOr(pick(body, /<powermeter>[\s\S]*?<energy>(.*?)<\/energy>/))
    } else if (hasAlert) {
      dev.kind = 'contact'
      dev.open = pick(body, /<alert>[\s\S]*?<state>(.*?)<\/state>/) === '1'
    } else if (hasTemp || hasHum) {
      dev.kind = 'sensor'
    }
    out.push(dev)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** °C → FRITZ half-degree param (16..56, 253=off, 254=on). */
function tempToParam(tempC: number): number {
  return Math.max(16, Math.min(56, Math.round(tempC * 2)))
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  let base: string
  try {
    base = normalizeBase(String(body.url ?? ''))
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'invalid_url' }, { status: 400 })
  }

  const username = str(body.username)
  const password = openSealedSecret(str(body.password))
  if (!password) {
    return Response.json({ error: 'missing_credentials', detail: 'FRITZ!Box-Passwort eintragen.' }, { status: 400 })
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
  let sid: string | null = null

  try {
    sid = await login(base, username, password, ac.signal)
    if (!sid) {
      void logPluginApiFailure('fritz-smarthome', 'auth', 'auth_failed')
      return Response.json(
        { error: 'auth_failed', detail: 'Login abgelehnt — Benutzer/Passwort prüfen (FRITZ!Box-Benutzer mit Smart-Home-Recht).' },
        { status: 401 },
      )
    }

    if (body.action === 'set') {
      const ain = str(body.ain)
      if (!ain) return Response.json({ error: 'invalid_target' }, { status: 400 })
      const a = encodeURIComponent(ain)
      let url: string
      if (body.kind === 'thermostat') {
        let param: number
        if (body.off === true) {
          param = 253 // Aus (Frostschutz)
        } else {
          const tc = Number(body.tempC)
          if (!Number.isFinite(tc)) return Response.json({ error: 'invalid_target' }, { status: 400 })
          param = tempToParam(tc)
        }
        url = aha(base, sid, 'sethkrtsoll', `&ain=${a}&param=${param}`)
      } else {
        url = aha(base, sid, body.on ? 'setswitchon' : 'setswitchoff', `&ain=${a}`)
      }
      const r = await getText(url, ac.signal)
      if (!r.ok) {
        void logPluginApiFailure('fritz-smarthome', 'set', `http_${r.status}`)
        return Response.json({ error: 'set_failed' }, { status: 502 })
      }
      return Response.json({ ok: true })
    }

    // state
    const r = await getText(aha(base, sid, 'getdevicelistinfos'), ac.signal)
    if (!r.ok) {
      void logPluginApiFailure('fritz-smarthome', 'state', `http_${r.status}`)
      return Response.json({ error: 'upstream_error', detail: `FRITZ!Box antwortete mit HTTP ${r.status}.` }, { status: 502 })
    }
    return Response.json({ devices: parseDevices(r.text) })
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure('fritz-smarthome', 'request', `blocked_url:${e.message}`)
      return Response.json({ error: 'blocked_url', detail: e.message }, { status: 400 })
    }
    if (e instanceof Error && e.name === 'AbortError') {
      void logPluginApiFailure('fritz-smarthome', 'request', 'timeout')
      return Response.json({ error: 'timeout' }, { status: 504 })
    }
    void logPluginApiFailure('fritz-smarthome', 'request', 'network_error', {
      message: e instanceof Error ? e.message : String(e),
    })
    return Response.json({ error: 'network_error' }, { status: 502 })
  } finally {
    if (sid) await logout(base, sid, ac.signal)
    clearTimeout(t)
  }
}

async function handleFritzSmartHomeRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handlePost(req)
}

export default function fritzSmartHomeServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleFritzSmartHomeRequest(ctx.request, ctx.path)
}
