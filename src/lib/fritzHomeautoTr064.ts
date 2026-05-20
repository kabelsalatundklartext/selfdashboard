import 'server-only'

/**
 * TR-064 X_AVM-DE_Homeauto — FRITZ!Smart Energy / Steckdosen.
 * Descriptor: https://box:49443/tr64desc.xml
 */
import DigestClient from 'digest-fetch'
import {
  buildTr064SoapEnvelope,
  findTr064ServiceAcrossDescriptors,
  tr064OriginsForConnection,
  type FritzBoxConnection,
  type Tr064Service,
} from '@/lib/fritzboxTr064'
import { runWithTr064NodeFetch } from '@/lib/tr064NodeFetch'
import https from 'node:https'

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
  return /X_AVM-DE_Homeauto/i.test(s.type) || /\/x_homeauto/i.test(s.controlUrl)
}

function tr064FetchOpts(origin: string, conn: FritzBoxConnection): { agent?: https.Agent } {
  const isHttps = origin.startsWith('https:')
  const agent =
    isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined
  return agent ? { agent } : {}
}

async function resolveHomeautoService(
  conn: FritzBoxConnection,
  client: DigestClient,
  signal: AbortSignal,
): Promise<{ service: Tr064Service; origin: string }> {
  for (const origin of tr064OriginsForConnection(conn)) {
    const hit = await findTr064ServiceAcrossDescriptors(
      client,
      origin,
      signal,
      tr064FetchOpts(origin, conn),
      isHomeautoService,
    )
    if (hit) return { service: hit.service, origin }
  }
  throw new Error('homeauto_not_found')
}

type HomeautoCtx = {
  client: DigestClient
  ha: Tr064Service
  controlUrl: string
}

async function homeautoCtx(conn: FritzBoxConnection, signal: AbortSignal): Promise<HomeautoCtx> {
  const client = new DigestClient(conn.username || '', conn.password || '')
  const { service: ha, origin } = await resolveHomeautoService(conn, client, signal)
  const controlUrl = absUrl(origin, ha.controlUrl)
  return { client, ha, controlUrl }
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

function parseReadingFromHomeautoXml(xml: string): FritzEnergyReading {
  const enabled = xmlFirst(xml, 'NewMultimeterIsEnabled')
  const multimeterSupported =
    enabled === 'ENABLED' || enabled === '1' || /^true$/i.test(enabled ?? '')

  const powerCentiW = parseUi4(xmlFirst(xml, 'NewMultimeterPower'))
  const energyWh = parseUi4(xmlFirst(xml, 'NewMultimeterEnergy'))

  return {
    powerW: powerCentiW != null ? Math.max(0, powerCentiW / 100) : 0,
    energyWh: energyWh != null ? Math.max(0, energyWh) : 0,
    voltageV: null,
    multimeterSupported,
  }
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

async function callHomeautoAction(
  ctx: HomeautoCtx,
  signal: AbortSignal,
  action: string,
  args: Record<string, string> = {},
): Promise<string> {
  const body = buildTr064SoapEnvelope(ctx.ha.type, action, args)
  const res = await ctx.client.fetch(ctx.controlUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      SOAPAction: `"${ctx.ha.type}#${action}"`,
    },
    body,
  } as RequestInit)
  const text = await res.text()
  if (res.status === 401 || res.status === 403) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`soap_http_${res.status}`)
  const fault = soapFaultCode(text)
  if (fault) throw new Error(`homeauto_fault_${fault}`)
  return text
}

/** Geräteliste per GetGenericDeviceInfos (Index 0..n). */
export async function listFritzSmartDevices(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzSmartDevice[]> {
  return runWithTr064NodeFetch(conn, async () => {
    const ctx = await homeautoCtx(conn, signal)
    const out: FritzSmartDevice[] = []

    for (let index = 0; index < 128; index++) {
      let xml: string
      try {
        xml = await callHomeautoAction(ctx, signal, 'GetGenericDeviceInfos', {
          NewIndex: String(index),
        })
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
  })
}

export async function fetchFritzEnergyReading(
  conn: FritzBoxConnection,
  ainRaw: string,
  signal: AbortSignal,
): Promise<FritzEnergyReading> {
  return runWithTr064NodeFetch(conn, async () => {
    const ain = normalizeAin(ainRaw)
    const ctx = await homeautoCtx(conn, signal)

    try {
      const xml = await callHomeautoAction(ctx, signal, 'GetSpecificDeviceInfos', { NewAIN: ain })
      return parseReadingFromHomeautoXml(xml)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'homeauto_fault_606') throw new Error('homeauto_unauthorized')
      if (!msg.startsWith('homeauto_fault_')) throw e
    }

    for (let index = 0; index < 128; index++) {
      let xml: string
      try {
        xml = await callHomeautoAction(ctx, signal, 'GetGenericDeviceInfos', {
          NewIndex: String(index),
        })
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
  })
}
