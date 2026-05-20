/**
 * TR-064 X_AVM-DE_Homeauto — FRITZ!DECT / FRITZ!Smart Energy (Leistung & Zählerstand).
 */
import DigestClient from 'digest-fetch'
import https from 'node:https'
import {
  fritzboxRootFromInput,
  parseTr064Services,
  type FritzBoxConnection,
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

const DESCRIPTOR_PATHS = [
  '/tr064desc.xml',
  '/tr064/tr064desc.xml',
  '/tr064dev.xml',
  '/tr064/tr064dev.xml',
]

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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function soapEnvelope(serviceUrn: string, action: string, args: Record<string, string> = {}): string {
  const inner = Object.entries(args)
    .map(([k, v]) => `<${k}>${escapeXml(v)}</${k}>`)
    .join('')
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}">${inner}</u:${action}>
</s:Body>
</s:Envelope>`
}

async function soapAction(
  client: DigestClient,
  controlUrl: string,
  serviceUrn: string,
  action: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
  args: Record<string, string> = {},
): Promise<string> {
  const body = soapEnvelope(serviceUrn, action, args)
  const res = await client.fetch(controlUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${serviceUrn}#${action}"`,
    },
    body,
    ...fetchOpts,
  } as RequestInit)
  const text = await res.text()
  if (res.status === 401 || res.status === 403) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`soap_http_${res.status}`)
  return text
}

async function fetchDescriptor(
  client: DigestClient,
  origin: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
): Promise<string> {
  for (const p of DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, '')}${p}`
    const res = await client.fetch(url, { method: 'GET', signal, ...fetchOpts } as RequestInit)
    const text = await res.text()
    if (res.status === 401 || res.status === 403) throw new Error('unauthorized')
    if (!res.ok) continue
    if (/<serviceType>/i.test(text) && /<controlURL>/i.test(text)) return text
  }
  throw new Error('desc_not_found')
}

function homeautoService(services: ReturnType<typeof parseTr064Services>) {
  return (
    services.find((s) => /X_AVM-DE_Homeauto:1$/i.test(s.type)) ||
    services.find((s) => /X_AVM-DE_Homeautomation:1$/i.test(s.type)) ||
    services.find((s) => s.type.includes('Homeauto')) ||
    null
  )
}

/** AIN: 12 Ziffern → „11630 0425503“ */
export function normalizeAin(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 12) throw new Error('bad_ain')
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

function parseMultimeterInfos(raw: string | null): Pick<FritzEnergyReading, 'powerW' | 'energyWh' | 'voltageV'> {
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

export async function fetchFritzEnergyReading(
  conn: FritzBoxConnection,
  ainRaw: string,
  signal: AbortSignal,
): Promise<FritzEnergyReading> {
  const ain = normalizeAin(ainRaw)
  const root = fritzboxRootFromInput(conn.baseUrl)
  const origin = tr064OriginFromRoot(root)
  const isHttps = new URL(origin).protocol === 'https:'
  const agent =
    isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined
  const fetchOpts = agent ? { agent } : {}
  const client = new DigestClient(conn.username || '', conn.password || '')

  const descXml = await fetchDescriptor(client, origin, signal, fetchOpts)
  const services = parseTr064Services(descXml)
  const ha = homeautoService(services)
  if (!ha) throw new Error('homeauto_not_found')

  const ctl = absUrl(origin, ha.controlUrl)
  const xml = await soapAction(client, ctl, ha.type, 'GetSpecificDeviceInfos', signal, fetchOpts, {
    NewAIN: ain,
  })

  const supported = xmlFirst(xml, 'NewMultimeterIsSupported')
  const multimeterSupported = supported === '1' || /^true$/i.test(supported ?? '')
  const infos = parseMultimeterInfos(xmlFirst(xml, 'NewMultimeterInfos'))

  return { ...infos, multimeterSupported }
}

/** Geräteliste für Einstellungen (AIN + Name). */
export async function listFritzSmartDevices(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzSmartDevice[]> {
  const root = fritzboxRootFromInput(conn.baseUrl)
  const origin = tr064OriginFromRoot(root)
  const isHttps = new URL(origin).protocol === 'https:'
  const agent =
    isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined
  const fetchOpts = agent ? { agent } : {}
  const client = new DigestClient(conn.username || '', conn.password || '')

  const descXml = await fetchDescriptor(client, origin, signal, fetchOpts)
  const services = parseTr064Services(descXml)
  const ha = homeautoService(services)
  if (!ha) throw new Error('homeauto_not_found')

  const ctl = absUrl(origin, ha.controlUrl)
  const xml = await soapAction(client, ctl, ha.type, 'GetDeviceList', signal, fetchOpts)
  const listRaw = xmlFirst(xml, 'NewDeviceList') ?? ''
  const out: FritzSmartDevice[] = []
  for (const line of listRaw.split('\n')) {
    const t = line.trim()
    if (!t) continue
    const parts = t.split(',')
    if (parts.length < 2) continue
    const ain = parts[1]?.trim()
    if (!ain || ain.length < 10) continue
    try {
      out.push({
        ain: normalizeAin(ain),
        name: (parts[0] ?? '').trim() || ain,
        productName: parts[2]?.trim() || null,
      })
    } catch {
      /* skip invalid AIN */
    }
  }
  return out
}
