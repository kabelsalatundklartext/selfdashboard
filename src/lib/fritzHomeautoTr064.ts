/**
 * TR-064 X_AVM-DE_Homeauto — FRITZ!Smart Energy / Steckdosen.
 * Deskriptor: https://box:49443/tr64desc.xml (nicht tr064desc.xml).
 * Aktionen (AVM 2025): GetInfo, GetGenericDeviceInfos (Index), GetSpecificDeviceInfos (AIN).
 */
import DigestClient from 'digest-fetch'
import https from 'node:https'
import {
  buildTr064SoapEnvelope,
  findTr064ServiceAcrossDescriptors,
  fritzboxRootFromInput,
  parseScpdActionNames,
  tr064OriginsForConnection,
  type FritzBoxConnection,
  type Tr064Service,
} from '@/lib/fritzboxTr064'

export type FritzEnergyReading = {
  powerW: number
  energyWh: number
  voltageV: number | null
  multimeterSupported: boolean
}

export type FritzSmartDevice = {
  ain: string
  name: string
  productName: string | null
}

function tr064OriginFromRoot(root: string): string {
  const u = new URL(root)
  return `${u.protocol}//${u.hostname}:${u.port}`
}

function absUrl(origin: string, relativeOrAbsolute: string): string {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute
  const base = origin.replace(/\/+$/, '')
  const rel = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`
  return `${base}${rel}`
}

function xmlFirst(body: string, localName: string): string | null {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, 'i')
  const m = body.match(re)
  const v = m?.[1]?.trim()
  return v && v.length > 0 ? v : null
}

function parseUi4(v: string | null): number | null {
  if (v == null) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

function soapFaultCode(xml: string): string | null {
  if (!/<s:Fault/i.test(xml) && !/<UPnPError/i.test(xml)) return null
  return xmlFirst(xml, 'errorCode')
}

function isHomeautoService(s: Tr064Service): boolean {
  if (/X_AVM-DE_Homeauto/i.test(s.type) || /X_AVM-DE_Homeautomation/i.test(s.type)) return true
  if (/X_HomeAuto/i.test(s.type)) return true
  if (/homeauto/i.test(s.type)) return true
  return /\/x_homeauto/i.test(s.controlUrl) || /homeauto/i.test(s.controlUrl)
}

function fetchOptsForOrigin(conn: FritzBoxConnection, origin: string): { agent?: https.Agent } {
  const isHttps = origin.startsWith('https:')
  const agent =
    isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined
  return agent ? { agent } : {}
}

function controlUrlsForService(conn: FritzBoxConnection, ha: Tr064Service): string[] {
  return tr064OriginsForConnection(conn).map((o) => absUrl(o, ha.controlUrl))
}

async function resolveHomeautoService(
  conn: FritzBoxConnection,
  client: DigestClient,
  signal: AbortSignal,
): Promise<Tr064Service> {
  for (const origin of tr064OriginsForConnection(conn)) {
    const fetchOpts = fetchOptsForOrigin(conn, origin)
    const hit = await findTr064ServiceAcrossDescriptors(client, origin, signal, fetchOpts, isHomeautoService)
    if (hit) return hit.service
  }
  throw new Error('homeauto_not_found')
}

type HomeautoCtx = {
  client: DigestClient
  ha: Tr064Service
  controlUrls: string[]
}

async function homeautoCtx(conn: FritzBoxConnection, signal: AbortSignal): Promise<HomeautoCtx> {
  const client = new DigestClient(conn.username || '', conn.password || '')
  const ha = await resolveHomeautoService(conn, client, signal)
  return { client, ha, controlUrls: controlUrlsForService(conn, ha) }
}

/** AIN: 12 Ziffern → „11630 0425503“ */
export function normalizeAin(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 12) throw new Error('bad_ain')
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

function ainMatches(a: string, b: string): boolean {
  return a.replace(/\D/g, '') === b.replace(/\D/g, '')
}

function ainVariants(ain: string): string[] {
  const digits = ain.replace(/\D/g, '')
  const spaced = normalizeAin(digits)
  return [...new Set([spaced, digits])]
}

function parseLegacyMultimeterInfos(raw: string | null): Pick<FritzEnergyReading, 'powerW' | 'energyWh' | 'voltageV'> {
  if (!raw) return { powerW: 0, energyWh: 0, voltageV: null }
  const parts = raw.split(',').map((p) => parseInt(p.trim(), 10))
  if (parts.length < 4 || parts.some((n) => !Number.isFinite(n))) {
    return { powerW: 0, energyWh: 0, voltageV: null }
  }
  const [powerMw, voltageMv, , energyWh] = parts
  return {
    powerW: Math.max(0, powerMw / 1000),
    energyWh: Math.max(0, energyWh),
    voltageV: voltageMv > 0 ? voltageMv / 1000 : null,
  }
}

function parseReadingFromHomeautoXml(xml: string): FritzEnergyReading {
  const enabled = xmlFirst(xml, 'NewMultimeterIsEnabled') ?? xmlFirst(xml, 'NewMultimeterIsSupported')
  const multimeterSupported =
    enabled === 'ENABLED' || enabled === '1' || /^true$/i.test(enabled ?? '')

  const powerCentiW = parseUi4(xmlFirst(xml, 'NewMultimeterPower'))
  const energyWh = parseUi4(xmlFirst(xml, 'NewMultimeterEnergy'))
  if (powerCentiW != null || energyWh != null) {
    return {
      powerW: powerCentiW != null ? Math.max(0, powerCentiW / 100) : 0,
      energyWh: energyWh != null ? Math.max(0, energyWh) : 0,
      voltageV: null,
      multimeterSupported,
    }
  }

  const legacy = parseLegacyMultimeterInfos(xmlFirst(xml, 'NewMultimeterInfos'))
  return { ...legacy, multimeterSupported }
}

function deviceFromHomeautoXml(xml: string): FritzSmartDevice | null {
  const ainRaw = xmlFirst(xml, 'NewAIN')
  if (!ainRaw) return null
  try {
    return {
      ain: normalizeAin(ainRaw),
      name: xmlFirst(xml, 'NewDeviceName')?.trim() || ainRaw,
      productName: xmlFirst(xml, 'NewProductName')?.trim() || null,
    }
  } catch {
    return null
  }
}

type SoapVariant = { label: string; namespacedArgs: boolean }

const SOAP_VARIANTS: SoapVariant[] = [
  { label: 'plain', namespacedArgs: false },
  { label: 'ns-args', namespacedArgs: true },
]

async function postSoap(
  client: DigestClient,
  controlUrl: string,
  serviceUrn: string,
  action: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
  args: Record<string, string>,
  variant: SoapVariant,
): Promise<string> {
  const body = buildTr064SoapEnvelope(serviceUrn, action, args, { namespacedArgs: variant.namespacedArgs })
  const res = await client.fetch(controlUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      SOAPAction: `"${serviceUrn}#${action}"`,
    },
    body,
    ...fetchOpts,
  } as RequestInit)
  const text = await res.text()
  if (res.status === 401 || res.status === 403) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`soap_http_${res.status}`)
  const fault = soapFaultCode(text)
  if (fault) throw new Error(`homeauto_fault_${fault}`)
  return text
}

async function callHomeautoAction(
  ctx: HomeautoCtx,
  conn: FritzBoxConnection,
  signal: AbortSignal,
  action: string,
  args: Record<string, string>,
): Promise<string> {
  let lastErr: Error | null = null
  for (const controlUrl of ctx.controlUrls) {
    const origin = new URL(controlUrl).origin
    const fetchOpts = fetchOptsForOrigin(conn, origin)
    for (const variant of SOAP_VARIANTS) {
      try {
        return await postSoap(ctx.client, controlUrl, ctx.ha.type, action, signal, fetchOpts, args, variant)
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e))
        const msg = lastErr.message
        if (msg === 'homeauto_fault_502' || msg === 'homeauto_fault_401') continue
        if (msg.startsWith('homeauto_fault_')) throw lastErr
      }
    }
  }
  throw lastErr ?? new Error('homeauto_soap_failed')
}

/** Geräteliste per GetGenericDeviceInfos (Index 0..n). */
export async function listFritzSmartDevices(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzSmartDevice[]> {
  const ctx = await homeautoCtx(conn, signal)
  const out: FritzSmartDevice[] = []

  for (let index = 0; index < 128; index++) {
    let xml: string
    try {
      xml = await callHomeautoAction(ctx, conn, signal, 'GetGenericDeviceInfos', { NewIndex: String(index) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'homeauto_fault_713' || index > 0) break
      if (msg === 'homeauto_fault_606') throw new Error('homeauto_unauthorized')
      throw e
    }
    const dev = deviceFromHomeautoXml(xml)
    if (!dev) break
    out.push(dev)
  }

  return out
}

export async function fetchFritzEnergyReading(
  conn: FritzBoxConnection,
  ainRaw: string,
  signal: AbortSignal,
): Promise<FritzEnergyReading> {
  const ain = normalizeAin(ainRaw)
  const ctx = await homeautoCtx(conn, signal)

  for (const ainTry of ainVariants(ain)) {
    try {
      const xml = await callHomeautoAction(ctx, conn, signal, 'GetSpecificDeviceInfos', { NewAIN: ainTry })
      return parseReadingFromHomeautoXml(xml)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'homeauto_fault_606') throw new Error('homeauto_unauthorized')
      if (!msg.startsWith('homeauto_fault_')) throw e
    }
  }

  for (let index = 0; index < 128; index++) {
    let xml: string
    try {
      xml = await callHomeautoAction(ctx, conn, signal, 'GetGenericDeviceInfos', { NewIndex: String(index) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'homeauto_fault_713' || index > 0) break
      if (msg === 'homeauto_fault_606') throw new Error('homeauto_unauthorized')
      throw e
    }
    const devAin = xmlFirst(xml, 'NewAIN')
    if (!devAin || !ainMatches(devAin, ain)) continue
    return parseReadingFromHomeautoXml(xml)
  }

  throw new Error('device_not_found')
}

/** Für Diagnose: SCPD-Aktionen der Box. */
export async function fetchHomeautoScpdActionNames(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<string[]> {
  const ctx = await homeautoCtx(conn, signal)
  const scpdRel = ctx.ha.scpdUrl ?? '/x_homeautoSCPD.xml'
  for (const origin of tr064OriginsForConnection(conn)) {
    const url = absUrl(origin, scpdRel)
    const fetchOpts = fetchOptsForOrigin(conn, origin)
    const res = await ctx.client.fetch(url, { method: 'GET', signal, ...fetchOpts } as RequestInit)
    const text = await res.text()
    if (!res.ok) continue
    if (/<actionList/i.test(text)) return parseScpdActionNames(text)
  }
  return []
}
