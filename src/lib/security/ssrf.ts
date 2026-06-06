import 'server-only'
import net from 'net'
import { lookup } from 'node:dns/promises'

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
    // IPv4-mapped IPv6 — both dotted (::ffff:127.0.0.1) and hex (::ffff:7f00:1)
    // form (the URL parser normalizes to hex!) — check the embedded IPv4.
    const embedded = embeddedIpv4(normalized)
    if (embedded) return isAlwaysBlockedIp(embedded)
  }
  return false
}

/** Extract the IPv4 inside an IPv4-mapped IPv6 address, or null. */
function embeddedIpv4(normalizedV6: string): string | null {
  if (!normalizedV6.startsWith('::ffff:')) return null
  const rest = normalizedV6.slice('::ffff:'.length)
  if (net.isIPv4(rest)) return rest
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (!hex) return null
  const hi = parseInt(hex[1], 16)
  const lo = parseInt(hex[2], 16)
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
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

/**
 * Static checks + DNS resolution: every address the hostname resolves to must
 * pass the IP blocklist. Closes the "evil.example.com → 127.0.0.1 / 169.254.169.254"
 * bypass of the literal-hostname check. (Note: a TTL-0 rebinding attacker could
 * still swap records between this check and the actual connect; full pinning
 * would require a custom dispatcher. This covers the practical cases.)
 */
export async function assertSafeOutboundUrlResolved(urlStr: string): Promise<void> {
  assertSafeOutboundUrl(urlStr)
  const u = new URL(urlStr)
  const host = u.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '')
  if (net.isIP(host)) return // literal IP already checked above

  let addrs: Array<{ address: string }>
  try {
    addrs = await lookup(host, { all: true, verbatim: true })
  } catch {
    throw new UnsafeOutboundUrlError('dns_lookup_failed')
  }
  if (addrs.length === 0) throw new UnsafeOutboundUrlError('dns_lookup_failed')
  for (const { address } of addrs) {
    if (isAlwaysBlockedIp(address)) throw new UnsafeOutboundUrlError('blocked_ip_resolved')
    if (blockPrivateLanUrls() && isPrivateLanIp(address)) {
      throw new UnsafeOutboundUrlError('private_ip_blocked')
    }
  }
}

export async function fetchWithSsrfGuard(
  urlStr: string,
  init?: RequestInit,
  maxRedirects = 5,
): Promise<Response> {
  await assertSafeOutboundUrlResolved(urlStr)
  let current = urlStr

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const resp = await fetch(current, { ...init, redirect: 'manual' })
    if (resp.status < 300 || resp.status >= 400) return resp

    const location = resp.headers.get('location')
    if (!location) return resp
    current = new URL(location, current).href
    await assertSafeOutboundUrlResolved(current)
  }

  throw new UnsafeOutboundUrlError('too_many_redirects')
}
