import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Nur private IPv4 — verhindert SSRF ins öffentliche Internet */
function isPrivateLanIpv4(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1') return true
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (!m) return false
  const [a, b, c, d] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
  if ([a, b, c, d].some((n) => n > 255)) return false
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

/**
 * Lädt eine JSON-URL serverseitig (z. B. Unraid net-stats) und reicht sie an den Browser durch.
 * So entfällt CORS; der Tower muss die URL trotzdem ohne Login-HTML liefern (z. B. kleiner http.server auf extra Port).
 */
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('target')
  if (!target?.trim()) {
    return NextResponse.json({ error: 'Parameter target fehlt' }, { status: 400 })
  }

  let u: URL
  try {
    u = new URL(target)
  } catch {
    return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 })
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return NextResponse.json({ error: 'Nur http(s)' }, { status: 400 })
  }

  if (!isPrivateLanIpv4(u.hostname)) {
    return NextResponse.json({ error: 'Nur private LAN-IPv4 (10.x / 172.16–31.x / 192.168.x / 127.0.0.1)' }, { status: 403 })
  }

  try {
    const res = await fetch(target, {
      cache: 'no-store',
      redirect: 'follow',
      headers: { Accept: 'application/json, text/plain, */*' },
    })
    const body = await res.text()
    const ct = res.headers.get('content-type') || 'application/json; charset=utf-8'
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
