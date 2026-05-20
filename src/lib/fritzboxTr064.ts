/**
 * Minimal TR-064 (AVM FRITZ!Box) client: Digest-Auth + SOAP over HTTP(S).
 * Service-URLs werden aus tr064desc.xml gelesen.
 */

import DigestClient from 'digest-fetch'
import https from 'node:https'
import { runWithTr064NodeFetch } from '@/lib/tr064NodeFetch'

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
  /** z. B. IP_Routed, PPPoE (WANIPConnection GetInfo) */
  wanConnectionType: string | null
  /** Anzeigename der WAN-Verbindung in der Box */
  wanConnectionName: string | null
  natEnabled: boolean | null
  /** DNS-Server der WAN-Verbindung, Leerzeichen-getrennt */
  wanDnsServers: string | null
  /** Bekannte Heimnetz-Geräte (Hosts:1 / Hosts:2) */
  hostCount: number | null
  /** WAN-Gesamtbytes (Zähler der Box), für aktuelle Rate: Differenz zwischen Abrufen */
  wanTotalBytesReceived: string | null
  wanTotalBytesSent: string | null
  /** Aktuelle WAN-Rate (Online-Monitor bevorzugt, sonst GetAddonInfos), bit/s */
  wanLiveDownBps: number | null
  wanLiveUpBps: number | null
  /** Woher die Live-Raten stammen (Diagnose) */
  wanLiveSource?: 'monitor' | 'addon' | 'mixed' | null
}

export type FritzWanCounters = Pick<
  FritzBoxSummary,
  'wanTotalBytesReceived' | 'wanTotalBytesSent' | 'wanLiveDownBps' | 'wanLiveUpBps'
>

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

/** Host inkl. Port — für Descriptor & controlURL-Auflösung (immer Wurzel des TR-064-Ports). */
function tr064OriginFromRoot(root: string): string {
  const u = new URL(root)
  return `${u.protocol}//${u.hostname}:${u.port}`
}

/** Bekannte Pfade zur Gerätebeschreibung (AVM / FRITZ!OS variiert). */
export const TR064_DESCRIPTOR_PATHS = [
  '/tr64desc.xml',
  '/tr064desc.xml',
  '/tr064/tr064desc.xml',
  '/tr064/tr64desc.xml',
  '/tr064dev.xml',
  '/tr064/tr064dev.xml',
  '/igddesc.xml',
]

/** TR-064-Ports zum Durchprobieren (HTTP 49000, HTTPS 49443). */
export function tr064OriginsForConnection(conn: FritzBoxConnection): string[] {
  const root = fritzboxRootFromInput(conn.baseUrl)
  const u = new URL(root)
  const host = u.hostname
  const out: string[] = [`${u.protocol}//${host}:${u.port}`]
  if (u.protocol === 'http:') out.push(`https://${host}:49443`)
  else if (u.protocol === 'https:') out.push(`http://${host}:49000`)
  return [...new Set(out)]
}

/** WAN-Durchsatz: HTTP :49000 zuerst (HTTPS liefert oft falsche/kaputte Live-Raten). */
export function tr064OriginsForWan(conn: FritzBoxConnection): string[] {
  const origins = tr064OriginsForConnection(conn)
  return [...origins].sort((a, b) => {
    const rank = (o: string) => (o.startsWith('http:') ? 0 : 1)
    return rank(a) - rank(b)
  })
}

function scoreWanLiveData(
  down: number | null,
  up: number | null,
  hasBytes: boolean,
): number {
  let score = (down ?? 0) + (up ?? 0)
  if (down != null || up != null) score += 1e12
  if (hasBytes) score += 1e6
  return score
}

/** Alle bekannten Descriptor-Dateien — wichtig seit Homeauto: igddesc allein reicht oft nicht für WAN/Addon. */
export async function collectTr064ServicesOnOrigin(
  client: DigestClient,
  origin: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
): Promise<{ services: Tr064Service[]; descXml: string }> {
  const byKey = new Map<string, Tr064Service>()
  let descXml: string | null = null
  const tried: string[] = []

  for (const p of TR064_DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, '')}${p}`
    tried.push(p)
    const descRes = await client.fetch(url, { method: 'GET', signal, ...fetchOpts } as RequestInit)
    const text = await descRes.text()
    if (descRes.status === 401 || descRes.status === 403) {
      throw new Error('unauthorized')
    }
    if (!descRes.ok) continue
    if (!looksLikeDeviceDescription(text)) continue
    if (!descXml) descXml = text
    for (const s of parseTr064Services(text)) {
      const key = `${s.type}\0${s.controlUrl}`
      if (!byKey.has(key)) byKey.set(key, s)
    }
  }

  if (byKey.size === 0) throw new Error(`desc_not_found:${tried.join(',')}`)
  return { services: [...byKey.values()], descXml: descXml ?? '' }
}

function looksLikeDeviceDescription(xml: string): boolean {
  if (!xml || xml.length < 80) return false
  if (/<html[\s>]/i.test(xml) && /<body/i.test(xml)) return false
  return (
    /<serviceType>/i.test(xml) &&
    (/<deviceType>/i.test(xml) || /<root xmlns/i.test(xml) || /InternetGatewayDevice/i.test(xml))
  )
}

export async function fetchDescriptorXml(
  client: DigestClient,
  origin: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
): Promise<{ xml: string; path: string }> {
  const tried: string[] = []
  for (const p of TR064_DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, '')}${p}`
    tried.push(p)
    const descRes = await client.fetch(url, { method: 'GET', signal, ...fetchOpts } as RequestInit)
    const text = await descRes.text()
    if (descRes.status === 401 || descRes.status === 403) {
      throw new Error('unauthorized')
    }
    if (!descRes.ok) continue
    if (!looksLikeDeviceDescription(text)) continue
    return { xml: text, path: p }
  }
  throw new Error(`desc_not_found:${tried.join(',')}`)
}

/**
 * Sucht einen TR-064-Dienst in allen bekannten Descriptor-Dateien.
 * Wichtig für Smart Home: `igddesc.xml` enthält oft kein X_AVM-DE_Homeauto — dann `tr064desc.xml` probieren.
 */
export async function findTr064ServiceAcrossDescriptors(
  client: DigestClient,
  origin: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
  match: (service: Tr064Service) => boolean,
): Promise<{ service: Tr064Service; descriptorPath: string } | null> {
  for (const p of TR064_DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, '')}${p}`
    const descRes = await client.fetch(url, { method: 'GET', signal, ...fetchOpts } as RequestInit)
    const text = await descRes.text()
    if (descRes.status === 401 || descRes.status === 403) throw new Error('unauthorized')
    if (!descRes.ok) continue
    if (!looksLikeDeviceDescription(text)) continue
    const hit = parseTr064Services(text).find(match)
    if (hit) return { service: hit, descriptorPath: p }
  }
  return null
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

function parseIntSafe(v: string | null): number | null {
  if (v == null) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

/** Zähler aus SOAP (nur Ziffern, als String wegen großer Werte). */
function parseDecimalUIntString(xml: string, ...localNames: string[]): string | null {
  for (const name of localNames) {
    const v = xmlFirst(xml, name)
    if (v && /^\d+$/.test(v)) return v
  }
  return null
}

export type Tr064Service = { type: string; controlUrl: string }

function escapeXmlTr064(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** SOAP-Body wie AVM TR-064 First Steps (Kapitel 10). */
export function buildTr064SoapEnvelope(
  serviceUrn: string,
  action: string,
  args: Record<string, string> = {},
): string {
  const inner = Object.entries(args)
    .map(([k, v]) => `<${k}>${escapeXmlTr064(v)}</${k}>`)
    .join('\n')
  const bodyInner = inner ? `\n${inner}\n` : ''
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}">${bodyInner}</u:${action}>
</s:Body>
</s:Envelope>`
}

/** Parst tr064desc.xml nach serviceType + controlURL + SCPDURL. */
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

/** UPnP root device (z. B. igddesc.xml): Modell, wenn kein TR-064 DeviceInfo. */
function parseUpnpRootDeviceBasics(descXml: string): {
  friendlyName: string | null
  modelName: string | null
  manufacturer: string | null
} {
  const m = descXml.match(/<device[\s>][\s\S]*?<\/device>/i)
  const block = m?.[0] ?? descXml
  return {
    friendlyName: xmlFirst(block, 'friendlyName'),
    modelName: xmlFirst(block, 'modelName'),
    manufacturer: xmlFirst(block, 'manufacturer'),
  }
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
  const body = buildTr064SoapEnvelope(serviceUrn, action, args)
  const soapActionHdr = `"${serviceUrn}#${action}"`
  const res = await client.fetch(controlUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      SOAPAction: soapActionHdr,
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

function tr064FetchOpts(origin: string, conn: FritzBoxConnection): { agent?: https.Agent } {
  const isHttps = origin.startsWith('https:')
  const agent =
    isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined
  return agent ? { agent } : {}
}

function servicesHaveWan(services: Tr064Service[]): boolean {
  return services.some((s) => {
    const t = s.type
    return t.includes('WANCommonInterfaceConfig') || (t.includes('WANIPConnection') && !t.includes('WANIPv6'))
  })
}

function liveRatesFromAddonXml(addonXml: string): { wanLiveDownBps: number | null; wanLiveUpBps: number | null } {
  const rx = parseIntSafe(xmlFirst(addonXml, 'NewByteReceiveRate') ?? xmlFirst(addonXml, 'ByteReceiveRate'))
  const tx = parseIntSafe(xmlFirst(addonXml, 'NewByteSendRate') ?? xmlFirst(addonXml, 'ByteSendRate'))
  return {
    wanLiveDownBps: rx != null && rx >= 0 ? rx * 8 : null,
    wanLiveUpBps: tx != null && tx >= 0 ? tx * 8 : null,
  }
}

/** Maximum aus Online-Monitor-Feld (kommaseparierte Zeitreihe), Werte in bit/s. */
function parseMonitorBpsField(monitorXml: string, ...localNames: string[]): number | null {
  let best: number | null = null
  for (const name of localNames) {
    const raw = xmlFirst(monitorXml, name)
    if (!raw) continue
    const parts = raw.includes(',')
      ? raw.split(',').map((s) => parseInt(s.trim(), 10))
      : [parseInt(raw.trim(), 10)]
    for (const n of parts) {
      if (n != null && Number.isFinite(n) && n >= 0) {
        best = best == null ? n : Math.max(best, n)
      }
    }
  }
  return best
}

function maxBps(...vals: Array<number | null | undefined>): number | null {
  let best: number | null = null
  for (const v of vals) {
    if (v != null && Number.isFinite(v) && v >= 0) {
      best = best == null ? v : Math.max(best, v)
    }
  }
  return best
}

function liveRatesFromOnlineMonitorXml(monitorXml: string): {
  wanLiveDownBps: number | null
  wanLiveUpBps: number | null
} {
  const down = parseMonitorBpsField(
    monitorXml,
    'Newds_current_bps',
    'newds_current_bps',
    'NewDSLRXRate_bps',
    'NewByteReceiveRate',
  )
  const up = parseMonitorBpsField(
    monitorXml,
    'Newus_current_bps',
    'newus_current_bps',
    'NewDSLTXRate_bps',
    'NewByteSendRate',
  )
  const downMax = parseIntSafe(xmlFirst(monitorXml, 'Newmax_ds'))
  const upMax = parseIntSafe(xmlFirst(monitorXml, 'Newmax_us'))
  return {
    wanLiveDownBps: maxBps(down, downMax),
    wanLiveUpBps: maxBps(up, upMax),
  }
}

function pickLiveWanRates(
  addon: { wanLiveDownBps: number | null; wanLiveUpBps: number | null },
  monitor: { wanLiveDownBps: number | null; wanLiveUpBps: number | null },
): { wanLiveDownBps: number | null; wanLiveUpBps: number | null; source: 'monitor' | 'addon' | 'mixed' | null } {
  const pickDir = (a: number | null, m: number | null): { bps: number | null; from: 'monitor' | 'addon' | null } => {
    const av = a != null && a >= 0 ? a : null
    const mv = m != null && m >= 0 ? m : null
    if (mv != null && av != null) {
      if (mv >= av) return { bps: mv, from: 'monitor' }
      return { bps: av, from: 'addon' }
    }
    if (mv != null) return { bps: mv, from: 'monitor' }
    if (av != null) return { bps: av, from: 'addon' }
    return { bps: null, from: null }
  }

  const down = pickDir(addon.wanLiveDownBps, monitor.wanLiveDownBps)
  const up = pickDir(addon.wanLiveUpBps, monitor.wanLiveUpBps)
  if (down.bps == null && up.bps == null) {
    return { wanLiveDownBps: null, wanLiveUpBps: null, source: null }
  }

  let source: 'monitor' | 'addon' | 'mixed' | null = null
  if (down.from && up.from) {
    source = down.from === up.from ? down.from : 'mixed'
  } else {
    source = down.from ?? up.from
  }

  return {
    wanLiveDownBps: down.bps ?? 0,
    wanLiveUpBps: up.bps ?? 0,
    source,
  }
}

async function fetchOnlineMonitorLiveRates(
  client: DigestClient,
  ctl: string,
  urn: string,
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
): Promise<{ wanLiveDownBps: number | null; wanLiveUpBps: number | null }> {
  const actions = ['X_AVM-DE_GetOnlineMonitor', 'X_AVM_DE_GetOnlineMonitor'] as const
  let bestDown: number | null = null
  let bestUp: number | null = null

  for (const action of actions) {
    let groupCount = 1
    let gotAny = false
    for (let syncIdx = 0; syncIdx < 4; syncIdx++) {
      try {
        const xml = await soapAction(client, ctl, urn, action, signal, fetchOpts, {
          NewSyncGroupIndex: String(syncIdx),
        })
        if (syncIdx === 0) {
          const n = parseIntSafe(xmlFirst(xml, 'NewTotalNumberSyncGroups'))
          if (n != null && n > 0) groupCount = Math.min(4, n)
        }
        const live = liveRatesFromOnlineMonitorXml(xml)
        gotAny = true
        if (live.wanLiveDownBps != null) {
          bestDown = bestDown == null ? live.wanLiveDownBps : Math.max(bestDown, live.wanLiveDownBps)
        }
        if (live.wanLiveUpBps != null) {
          bestUp = bestUp == null ? live.wanLiveUpBps : Math.max(bestUp, live.wanLiveUpBps)
        }
        if (syncIdx + 1 >= groupCount) break
      } catch {
        if (syncIdx === 0 && !gotAny) break
        if (syncIdx + 1 >= groupCount) break
      }
    }
    if (bestDown != null || bestUp != null) {
      return { wanLiveDownBps: bestDown, wanLiveUpBps: bestUp }
    }
  }
  return { wanLiveDownBps: null, wanLiveUpBps: null }
}

async function readWanByteCounters(
  client: DigestClient,
  origin: string,
  services: Tr064Service[],
  signal: AbortSignal,
  fetchOpts: { agent?: https.Agent },
): Promise<FritzWanCounters> {
  const wanCommonSvc =
    services.find((s) => s.type.endsWith('WANCommonInterfaceConfig:1')) ||
    services.find((s) => s.type.includes('WANCommonInterfaceConfig')) ||
    null

  let wanTotalBytesReceived: string | null = null
  let wanTotalBytesSent: string | null = null
  let wanLiveDownBps: number | null = null
  let wanLiveUpBps: number | null = null

  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl)
    const urn = wanCommonSvc.type
    try {
      const addon = await soapAction(client, ctl, urn, 'GetAddonInfos', signal, fetchOpts)
      const addonLive = liveRatesFromAddonXml(addon)
      const monitorLive = await fetchOnlineMonitorLiveRates(client, ctl, urn, signal, fetchOpts)
      const live = pickLiveWanRates(addonLive, monitorLive)
      wanLiveDownBps = live.wanLiveDownBps
      wanLiveUpBps = live.wanLiveUpBps
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        'X_AVM_DE_TotalBytesReceived64',
        'NewX_AVM_DE_TotalBytesReceived64',
        'NewTotalBytesReceived',
        'TotalBytesReceived',
      )
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        'X_AVM_DE_TotalBytesSent64',
        'NewX_AVM_DE_TotalBytesSent64',
        'NewTotalBytesSent',
        'TotalBytesSent',
      )
    } catch {
      try {
        const monitorLive = await fetchOnlineMonitorLiveRates(client, ctl, urn, signal, fetchOpts)
        wanLiveDownBps = monitorLive.wanLiveDownBps ?? 0
        wanLiveUpBps = monitorLive.wanLiveUpBps ?? 0
        if (wanLiveDownBps === 0 && wanLiveUpBps === 0) {
          wanLiveDownBps = null
          wanLiveUpBps = null
        }
      } catch {
        /* optional */
      }
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, urn, 'GetTotalBytesReceived', signal, fetchOpts)
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, 'NewTotalBytesReceived', 'TotalBytesReceived')
      } catch {
        /* optional */
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, urn, 'GetTotalBytesSent', signal, fetchOpts)
        wanTotalBytesSent = parseDecimalUIntString(txXml, 'NewTotalBytesSent', 'TotalBytesSent')
      } catch {
        /* optional */
      }
    }
  }

  const wanIpServices = services.filter((s) => {
    const t = s.type
    return t.includes('WANIPConnection') && !t.includes('WANIPv6')
  })
  const primaryWanIp = wanIpServices[0] ?? null
  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl)
    const t = primaryWanIp.type
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, 'GetTotalBytesReceived', signal, fetchOpts)
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, 'NewTotalBytesReceived', 'TotalBytesReceived')
      } catch {
        /* optional */
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, 'GetTotalBytesSent', signal, fetchOpts)
        wanTotalBytesSent = parseDecimalUIntString(txXml, 'NewTotalBytesSent', 'TotalBytesSent')
      } catch {
        /* optional */
      }
    }
  }

  return { wanTotalBytesReceived, wanTotalBytesSent, wanLiveDownBps, wanLiveUpBps }
}

async function fetchFritzBoxSummaryOnOrigin(
  conn: FritzBoxConnection,
  origin: string,
  signal: AbortSignal,
): Promise<FritzBoxSummary> {
  const fetchOpts = tr064FetchOpts(origin, conn)
  const client = digestClient(conn.username, conn.password)
  const { services, descXml } = await collectTr064ServicesOnOrigin(client, origin, signal, fetchOpts)

  if (!servicesHaveWan(services)) throw new Error('wan_not_found')

  const deviceSvc =
    services.find((s) => s.type.endsWith('DeviceInfo:1')) ||
    services.find((s) => s.type.includes('DeviceInfo')) ||
    null
  const wanCommonSvc =
    services.find((s) => s.type.endsWith('WANCommonInterfaceConfig:1')) ||
    services.find((s) => s.type.includes('WANCommonInterfaceConfig')) ||
    null

  const hostsSvc =
    services.find((s) => /:Hosts:1$/i.test(s.type)) ||
    services.find((s) => /:Hosts:2$/i.test(s.type)) ||
    services.find((s) => s.type.includes('Hosts:') && !s.type.includes('IPv6')) ||
    null

  let modelName: string | null = null
  let softwareVersion: string | null = null
  let manufacturer: string | null = null

  if (deviceSvc) {
    const ctl = absUrl(origin, deviceSvc.controlUrl)
    const xml = await soapAction(client, ctl, deviceSvc.type, 'GetInfo', signal, fetchOpts)
    modelName = xmlFirst(xml, 'NewModelName')
    softwareVersion = xmlFirst(xml, 'NewSoftwareVersion') || xmlFirst(xml, 'NewDescriptionVersion')
    manufacturer = xmlFirst(xml, 'NewManufacturerName')
  }

  if (!modelName || !manufacturer) {
    const igd = parseUpnpRootDeviceBasics(descXml)
    if (!manufacturer && igd.manufacturer) manufacturer = igd.manufacturer
    if (!modelName) modelName = igd.modelName || igd.friendlyName
  }

  let wanAccessType: string | null = null
  let downstreamMaxBps: number | null = null
  let upstreamMaxBps: number | null = null
  let wanTotalBytesReceived: string | null = null
  let wanTotalBytesSent: string | null = null
  let wanLiveDownBps: number | null = null
  let wanLiveUpBps: number | null = null
  let wanLiveSource: 'monitor' | 'addon' | 'mixed' | null = null
  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl)
    const xml = await soapAction(client, ctl, wanCommonSvc.type, 'GetCommonLinkProperties', signal, fetchOpts)
    wanAccessType = xmlFirst(xml, 'NewWANAccessType')
    downstreamMaxBps = parseIntSafe(xmlFirst(xml, 'NewLayer1DownstreamMaxBitRate'))
    upstreamMaxBps = parseIntSafe(xmlFirst(xml, 'NewLayer1UpstreamMaxBitRate'))
    try {
      const addon = await soapAction(client, ctl, wanCommonSvc.type, 'GetAddonInfos', signal, fetchOpts)
      const addonLive = liveRatesFromAddonXml(addon)
      const monitorLive = await fetchOnlineMonitorLiveRates(client, ctl, wanCommonSvc.type, signal, fetchOpts)
      const live = pickLiveWanRates(addonLive, monitorLive)
      wanLiveDownBps = live.wanLiveDownBps
      wanLiveUpBps = live.wanLiveUpBps
      wanLiveSource = live.source
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        'X_AVM_DE_TotalBytesReceived64',
        'NewX_AVM_DE_TotalBytesReceived64',
        'NewTotalBytesReceived',
        'TotalBytesReceived',
      )
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        'X_AVM_DE_TotalBytesSent64',
        'NewX_AVM_DE_TotalBytesSent64',
        'NewTotalBytesSent',
        'TotalBytesSent',
      )
    } catch {
      try {
        const monitorLive = await fetchOnlineMonitorLiveRates(client, ctl, wanCommonSvc.type, signal, fetchOpts)
        wanLiveDownBps = monitorLive.wanLiveDownBps
        wanLiveUpBps = monitorLive.wanLiveUpBps
        if (wanLiveDownBps != null || wanLiveUpBps != null) wanLiveSource = 'monitor'
      } catch {
        /* GetAddonInfos / OnlineMonitor optional */
      }
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, wanCommonSvc.type, 'GetTotalBytesReceived', signal, fetchOpts)
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, 'NewTotalBytesReceived', 'TotalBytesReceived')
      } catch {
        /* optional */
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, wanCommonSvc.type, 'GetTotalBytesSent', signal, fetchOpts)
        wanTotalBytesSent = parseDecimalUIntString(txXml, 'NewTotalBytesSent', 'TotalBytesSent')
      } catch {
        /* optional */
      }
    }
  }

  const wanIpServices = services.filter((s) => {
    const t = s.type
    return t.includes('WANIPConnection') && !t.includes('WANIPv6')
  })

  let connectionStatus: string | null = null
  let uptimeSec: number | null = null
  let externalIpv4: string | null = null
  let lastError: string | null = null
  let wanConnectionType: string | null = null
  let wanConnectionName: string | null = null
  let natEnabled: boolean | null = null
  let wanDnsServers: string | null = null
  let primaryWanIp: Tr064Service | null = null

  for (const svc of wanIpServices) {
    const ctl = absUrl(origin, svc.controlUrl)
    try {
      const stXml = await soapAction(client, ctl, svc.type, 'GetStatusInfo', signal, fetchOpts)
      connectionStatus = xmlFirst(stXml, 'NewConnectionStatus') ?? connectionStatus
      uptimeSec = parseIntSafe(xmlFirst(stXml, 'NewUptime')) ?? uptimeSec
      lastError = xmlFirst(stXml, 'NewLastConnectionError') ?? lastError
      if (!primaryWanIp) primaryWanIp = svc

      const ipXml = await soapAction(client, ctl, svc.type, 'GetExternalIPAddress', signal, fetchOpts)
      const ip = xmlFirst(ipXml, 'NewExternalIPAddress')
      if (ip && ip !== '0.0.0.0') {
        externalIpv4 = ip
        primaryWanIp = svc
        break
      }
    } catch {
      /* nächster WANIPConnection-Dienst */
    }
  }

  if (primaryWanIp) {
    try {
      const ctl = absUrl(origin, primaryWanIp.controlUrl)
      const infoXml = await soapAction(client, ctl, primaryWanIp.type, 'GetInfo', signal, fetchOpts)
      wanConnectionType = xmlFirst(infoXml, 'NewConnectionType')
      wanConnectionName = xmlFirst(infoXml, 'NewName')
      const nat = xmlFirst(infoXml, 'NewNATEnabled')
      if (nat === '1' || /^true$/i.test(nat ?? '')) natEnabled = true
      else if (nat === '0' || /^false$/i.test(nat ?? '')) natEnabled = false
      wanDnsServers = xmlFirst(infoXml, 'NewDNSServers')
    } catch {
      /* optional */
    }
  }

  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl)
    const t = primaryWanIp.type
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, 'GetTotalBytesReceived', signal, fetchOpts)
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, 'NewTotalBytesReceived', 'TotalBytesReceived')
      } catch {
        /* optional */
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, 'GetTotalBytesSent', signal, fetchOpts)
        wanTotalBytesSent = parseDecimalUIntString(txXml, 'NewTotalBytesSent', 'TotalBytesSent')
      } catch {
        /* optional */
      }
    }
  }

  let hostCount: number | null = null
  if (hostsSvc) {
    try {
      const hCtl = absUrl(origin, hostsSvc.controlUrl)
      const hXml = await soapAction(client, hCtl, hostsSvc.type, 'GetHostNumberOfEntries', signal, fetchOpts)
      hostCount = parseIntSafe(xmlFirst(hXml, 'NewHostNumberOfEntries'))
    } catch {
      /* optional */
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
    wanConnectionType,
    wanConnectionName,
    natEnabled,
    wanDnsServers,
    hostCount,
    wanTotalBytesReceived,
    wanTotalBytesSent,
    wanLiveDownBps,
    wanLiveUpBps,
    wanLiveSource,
  }
}

export async function fetchFritzBoxSummary(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzBoxSummary> {
  return runWithTr064NodeFetch(conn, async () => {
    let lastMsg = 'desc_not_found'
    let best: FritzBoxSummary | null = null
    let bestScore = -1

    for (const origin of tr064OriginsForWan(conn)) {
      try {
        const summary = await fetchFritzBoxSummaryOnOrigin(conn, origin, signal)
        const score = scoreWanLiveData(
          summary.wanLiveDownBps,
          summary.wanLiveUpBps,
          Boolean(summary.wanTotalBytesReceived && summary.wanTotalBytesSent),
        )
        if (score > bestScore) {
          bestScore = score
          best = summary
        }
      } catch (e) {
        lastMsg = e instanceof Error ? e.message : String(e)
        if (lastMsg === 'unauthorized') throw new Error('unauthorized')
      }
    }

    if (best) return best
    throw new Error(lastMsg)
  })
}

/** Nur WAN-Byte-Zähler (weniger SOAP) — für schnellere Live-Takte im UI. */
export async function fetchFritzBoxByteCountersOnly(
  conn: FritzBoxConnection,
  signal: AbortSignal,
): Promise<FritzWanCounters> {
  return runWithTr064NodeFetch(conn, async () => {
    const client = digestClient(conn.username, conn.password)
    let lastMsg = 'desc_not_found'
    let best: FritzWanCounters | null = null
    let bestScore = -1

    for (const origin of tr064OriginsForWan(conn)) {
      const fetchOpts = tr064FetchOpts(origin, conn)
      try {
        const { services } = await collectTr064ServicesOnOrigin(client, origin, signal, fetchOpts)
        if (!servicesHaveWan(services)) {
          lastMsg = 'wan_not_found'
          continue
        }
        const counters = await readWanByteCounters(client, origin, services, signal, fetchOpts)
        const score = scoreWanLiveData(
          counters.wanLiveDownBps,
          counters.wanLiveUpBps,
          Boolean(counters.wanTotalBytesReceived && counters.wanTotalBytesSent),
        )
        if (score > bestScore) {
          bestScore = score
          best = counters
        }
      } catch (e) {
        lastMsg = e instanceof Error ? e.message : String(e)
        if (lastMsg === 'unauthorized') throw new Error('unauthorized')
      }
    }

    if (best) return best
    throw new Error(lastMsg)
  })
}
