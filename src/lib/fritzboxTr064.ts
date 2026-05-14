/**
 * Minimal TR-064 (AVM FRITZ!Box) client: Digest-Auth + SOAP over HTTP(S).
 * Service-URLs werden aus tr064desc.xml gelesen.
 */

import DigestClient from 'digest-fetch'
import https from 'node:https'

const BLOCKED_HOSTNAMES = new Set(
  ['metadata.google.internal', 'metadata.goog', '169.254.169.254'].map((h) => h.toLowerCase()),
)

export type FritzBoxConnection = {
  baseUrl: string
  username: string
  password: string
  /** HTTPS mit selbstsigniertem Zertifikat (z. B. Port 49443) */
  insecureTls: boolean
}

export type FritzBoxSummary = {
  modelName: string | null
  softwareVersion: string | null
  manufacturer: string | null
  wanAccessType: string | null
  downstreamMaxBps: number | null
  upstreamMaxBps: number | null
  connectionStatus: string | null
  uptimeSec: number | null
  externalIpv4: string | null
  lastError: string | null
}

function normalizeBaseUrl(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_url')
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`
  const u = new URL(withProto)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  const host = u.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error('blocked_host')
  return u
}

/** Basis-URL inkl. Port (TR-064: Standard 49000 bei http, 49443 bei https ohne Port). */
export function fritzboxRootFromInput(raw: string): string {
  const u = normalizeBaseUrl(raw)
  if (!u.port || u.port === '80' || u.port === '443') {
    if (u.protocol === 'http:') u.port = '49000'
    if (u.protocol === 'https:') u.port = '49443'
  }
  let path = u.pathname.replace(/\/+$/, '')
  if (path === '') path = ''
  const origin = `${u.protocol}//${u.hostname}:${u.port}`
  return path ? `${origin}${path}` : origin
}

function absUrl(root: string, relativeOrAbsolute: string): string {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute
  const base = root.endsWith('/') ? root.slice(0, -1) : root
  const rel = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`
  return `${base}${rel}`
}

function xmlFirst(body: string, localName: string): string | null {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, 'i')
  const m = body.match(re)
  const v = m?.[1]?.trim()
  return v && v.length > 0 ? v : null
}

function parseIntSafe(v: string | null): number | null {
  if (v == null) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

export type Tr064Service = { type: string; controlUrl: string }

/** Parst tr064desc.xml nach serviceType + controlURL. */
export function parseTr064Services(descXml: string): Tr064Service[] {
  const out: Tr064Service[] = []
  const serviceBlocks = descXml.split(/<service[\s>]/i)
  for (let i = 1; i < serviceBlocks.length; i++) {
    const block = serviceBlocks[i] ?? ''
    const t = xmlFirst(block, 'serviceType')
    const c = xmlFirst(block, 'controlURL')
    if (t && c) out.push({ type: t, controlUrl: c })
  }
  return out
}

function soapEnvelope(serviceUrn: string, action: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}"/>
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
): Promise<string> {
  const body = soapEnvelope(serviceUrn, action)
  const soapAction = `"${serviceUrn}#${action}"`
  const res = await client.fetch(controlUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: soapAction,
    },
    body,
    ...fetchOpts,
  } as RequestInit)
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`soap_http_${res.status}`)
  }
  return text
}

function digestClient(user: string, pass: string): DigestClient {
  return new DigestClient(user || '', pass || '')
}

export async function fetchFritzBoxSummary(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzBoxSummary> {
  const root = fritzboxRootFromInput(conn.baseUrl)
  const u = new URL(root)
  const isHttps = u.protocol === 'https:'
  const agent =
    isHttps && conn.insecureTls
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined
  const fetchOpts = agent ? { agent } : {}

  const descUrl = absUrl(root, '/tr064desc.xml')
  const client = digestClient(conn.username, conn.password)

  const descRes = await client.fetch(descUrl, { method: 'GET', signal, ...fetchOpts } as RequestInit)
  const descXml = await descRes.text()
  if (!descRes.ok) {
    throw new Error(descRes.status === 401 || descRes.status === 403 ? 'unauthorized' : `desc_${descRes.status}`)
  }

  const services = parseTr064Services(descXml)

  const deviceSvc =
    services.find((s) => s.type.endsWith('DeviceInfo:1')) ||
    services.find((s) => s.type.includes('DeviceInfo')) ||
    null
  const wanCommonSvc =
    services.find((s) => s.type.endsWith('WANCommonInterfaceConfig:1')) ||
    services.find((s) => s.type.includes('WANCommonInterfaceConfig')) ||
    null

  let modelName: string | null = null
  let softwareVersion: string | null = null
  let manufacturer: string | null = null

  if (deviceSvc) {
    const ctl = absUrl(root, deviceSvc.controlUrl)
    const xml = await soapAction(client, ctl, deviceSvc.type, 'GetInfo', signal, fetchOpts)
    modelName = xmlFirst(xml, 'NewModelName')
    softwareVersion = xmlFirst(xml, 'NewSoftwareVersion') || xmlFirst(xml, 'NewDescriptionVersion')
    manufacturer = xmlFirst(xml, 'NewManufacturerName')
  }

  let wanAccessType: string | null = null
  let downstreamMaxBps: number | null = null
  let upstreamMaxBps: number | null = null
  if (wanCommonSvc) {
    const ctl = absUrl(root, wanCommonSvc.controlUrl)
    const xml = await soapAction(client, ctl, wanCommonSvc.type, 'GetCommonLinkProperties', signal, fetchOpts)
    wanAccessType = xmlFirst(xml, 'NewWANAccessType')
    downstreamMaxBps = parseIntSafe(xmlFirst(xml, 'NewLayer1DownstreamMaxBitRate'))
    upstreamMaxBps = parseIntSafe(xmlFirst(xml, 'NewLayer1UpstreamMaxBitRate'))
  }

  const wanIpServices = services.filter((s) => {
    const t = s.type
    return t.includes('WANIPConnection') && !t.includes('WANIPv6')
  })

  let connectionStatus: string | null = null
  let uptimeSec: number | null = null
  let externalIpv4: string | null = null
  let lastError: string | null = null

  for (const svc of wanIpServices) {
    const ctl = absUrl(root, svc.controlUrl)
    try {
      const stXml = await soapAction(client, ctl, svc.type, 'GetStatusInfo', signal, fetchOpts)
      connectionStatus = xmlFirst(stXml, 'NewConnectionStatus') ?? connectionStatus
      uptimeSec = parseIntSafe(xmlFirst(stXml, 'NewUptime')) ?? uptimeSec
      lastError = xmlFirst(stXml, 'NewLastConnectionError') ?? lastError

      const ipXml = await soapAction(client, ctl, svc.type, 'GetExternalIPAddress', signal, fetchOpts)
      const ip = xmlFirst(ipXml, 'NewExternalIPAddress')
      if (ip && ip !== '0.0.0.0') {
        externalIpv4 = ip
        break
      }
    } catch {
      /* nächster WANIPConnection-Dienst */
    }
  }

  return {
    modelName,
    softwareVersion,
    manufacturer,
    wanAccessType,
    downstreamMaxBps,
    upstreamMaxBps,
    connectionStatus,
    uptimeSec,
    externalIpv4,
    lastError,
  }
}
