import 'server-only'

import DigestClient from 'digest-fetch'
import https from 'node:https'
import {
  fritzboxRootFromInput,
  parseTr064Services,
  type FritzBoxConnection,
  type Tr064Service,
} from '@/lib/fritzboxTr064'

export type { FritzBoxConnection, Tr064Service }

/** Descriptor-Pfade inkl. tr64desc — für Homeauto oft nötig (igddesc allein reicht nicht). */
const TR064_DESCRIPTOR_PATHS = [
  '/tr64desc.xml',
  '/tr064desc.xml',
  '/tr064/tr064desc.xml',
  '/tr064/tr64desc.xml',
  '/tr064dev.xml',
  '/tr064/tr064dev.xml',
  '/igddesc.xml',
]

function looksLikeDeviceDescription(xml: string): boolean {
  if (!xml || xml.length < 80) return false
  if (/<html[\s>]/i.test(xml) && /<body/i.test(xml)) return false
  return (
    /<serviceType>/i.test(xml) &&
    (/<deviceType>/i.test(xml) || /<root xmlns/i.test(xml) || /InternetGatewayDevice/i.test(xml))
  )
}

function escapeXmlTr064(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** HTTP/HTTPS-Origins für TR-064 (Homeauto, Geräteliste). */
export function tr064OriginsForConnection(conn: FritzBoxConnection): string[] {
  const root = fritzboxRootFromInput(conn.baseUrl)
  const u = new URL(root)
  const host = u.hostname
  const out: string[] = [`${u.protocol}//${host}:${u.port}`]
  if (u.protocol === 'http:') out.push(`https://${host}:49443`)
  else if (u.protocol === 'https:') out.push(`http://${host}:49000`)
  return [...new Set(out)]
}

/**
 * Sucht einen TR-064-Dienst in allen bekannten Descriptor-Dateien.
 * Wichtig für Smart Home: igddesc.xml enthält oft kein X_AVM-DE_Homeauto.
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
