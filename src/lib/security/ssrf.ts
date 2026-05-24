import 'server-only'
import net from 'net'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  'instance-data',
])

/** Cloud / link-local metadata and loopback — always blocked. */
function isAlwaysBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    return false
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    if (normalized === '::1') return true
    if (normalized.startsWith('fe80:')) return true
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  }
  return false
}

function isPrivateLanIp(ip: string): boolean {
  if (!net.isIPv4(ip)) return false
  const [a, b] = ip.split('.').map(Number)
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function blockPrivateLanUrls(): boolean {
  const v = process.env.SELFDASHBOARD_BLOCK_PRIVATE_CALENDAR_URLS?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export class UnsafeOutboundUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeOutboundUrlError'
  }
}

export function assertSafeOutboundUrl(urlStr: string): void {
  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    throw new UnsafeOutboundUrlError('invalid_url')
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new UnsafeOutboundUrlError('unsupported_protocol')
  }

  const host = u.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '')
  if (!host) throw new UnsafeOutboundUrlError('missing_host')
  if (BLOCKED_HOSTNAMES.has(host)) throw new UnsafeOutboundUrlError('blocked_host')
  if (host.endsWith('.local') || host.endsWith('.internal')) {
    throw new UnsafeOutboundUrlError('blocked_host')
  }

  const ipVersion = net.isIP(host)
  if (ipVersion) {
    if (isAlwaysBlockedIp(host)) throw new UnsafeOutboundUrlError('blocked_ip')
    if (blockPrivateLanUrls() && isPrivateLanIp(host)) {
      throw new UnsafeOutboundUrlError('private_ip_blocked')
    }
    return
  }

  if (host.endsWith('.localhost')) throw new UnsafeOutboundUrlError('blocked_host')
}

export async function fetchWithSsrfGuard(
  urlStr: string,
  init?: RequestInit,
  maxRedirects = 5,
): Promise<Response> {
  assertSafeOutboundUrl(urlStr)
  let current = urlStr

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const resp = await fetch(current, { ...init, redirect: 'manual' })
    if (resp.status < 300 || resp.status >= 400) return resp

    const location = resp.headers.get('location')
    if (!location) return resp
    current = new URL(location, current).href
    assertSafeOutboundUrl(current)
  }

  throw new UnsafeOutboundUrlError('too_many_redirects')
}
