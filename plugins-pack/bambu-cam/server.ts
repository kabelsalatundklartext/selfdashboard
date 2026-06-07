import tls from 'tls'
import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret } from '../_shared/secret-crypto'
import type { PluginServerContext } from '../_shared/plugin-server-types'

export const dynamic = 'force-dynamic'

const CONNECT_TIMEOUT_MS = 8_000
const MAX_JPEG = 6 * 1024 * 1024

/** Nur private LAN-IPv4 erlauben (Drucker/Kamera im Heimnetz) — blockt Cloud-Metadaten & öffentliche Ziele. */
function isPrivateHost(h: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h.trim())
  if (!m) return false
  const o = m.slice(1).map(Number)
  if (o.some((x) => x > 255)) return false
  if (o[0] === 10) return true
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true
  if (o[0] === 192 && o[1] === 168) return true
  return false
}

/** Bambu P1/A1 Kamera-Auth (80 Byte): Header + 'bblp' + Zugangscode, je 32-Byte-Feld. */
function authPacket(accessCode: string): Buffer {
  const b = Buffer.alloc(80)
  b.writeUInt32LE(0x40, 0)
  b.writeUInt32LE(0x3000, 4)
  b.writeUInt32LE(0, 8)
  b.writeUInt32LE(0, 12)
  Buffer.from('bblp', 'ascii').copy(b, 16)
  Buffer.from(accessCode, 'ascii').copy(b, 48, 0, 32)
  return b
}

/** Verbindet zu host:6000 (TLS, self-signed), liest den ersten kompletten JPEG-Frame. */
function grabSnapshot(host: string, accessCode: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let done = false
    let chunks = Buffer.alloc(0)
    let payloadLen = -1
    const socket = tls.connect(
      { host, port: 6000, rejectUnauthorized: false, timeout: CONNECT_TIMEOUT_MS },
      () => socket.write(authPacket(accessCode)),
    )
    const finish = (err: Error | null, jpeg?: Buffer) => {
      if (done) return
      done = true
      try {
        socket.destroy()
      } catch {
        /* noop */
      }
      if (err) reject(err)
      else resolve(jpeg as Buffer)
    }
    const timer = setTimeout(() => finish(new Error('timeout')), CONNECT_TIMEOUT_MS + 1500)
    socket.on('data', (d: Buffer) => {
      chunks = Buffer.concat([chunks, d])
      if (chunks.length > MAX_JPEG + 64) {
        clearTimeout(timer)
        finish(new Error('frame_too_large'))
        return
      }
      for (;;) {
        if (payloadLen < 0) {
          if (chunks.length < 16) return
          payloadLen = chunks.readUInt32LE(0)
          if (payloadLen <= 0 || payloadLen > MAX_JPEG) {
            clearTimeout(timer)
            finish(new Error('bad_frame'))
            return
          }
          chunks = chunks.subarray(16)
        }
        if (chunks.length < payloadLen) return
        const jpeg = chunks.subarray(0, payloadLen)
        if (jpeg.length > 3 && jpeg[0] === 0xff && jpeg[1] === 0xd8) {
          clearTimeout(timer)
          finish(null, Buffer.from(jpeg))
          return
        }
        chunks = chunks.subarray(payloadLen)
        payloadLen = -1
      }
    })
    socket.on('timeout', () => {
      clearTimeout(timer)
      finish(new Error('timeout'))
    })
    socket.on('error', (e) => {
      clearTimeout(timer)
      finish(e instanceof Error ? e : new Error('socket_error'))
    })
    socket.on('close', () => {
      clearTimeout(timer)
      finish(new Error('closed'))
    })
  })
}

async function handleGet(req: Request): Promise<Response> {
  const sp = new URL(req.url).searchParams
  const action = sp.get('action') || ''

  if (action === 'snapshot') {
    const host = (sp.get('host') || '').trim()
    if (!isPrivateHost(host)) return Response.json({ error: 'invalid_host' }, { status: 400 })
    const code = openSealedSecret(sp.get('code') || '')
    if (!code) return Response.json({ error: 'missing_code' }, { status: 400 })
    try {
      const jpeg = await grabSnapshot(host, code)
      return new Response(new Uint8Array(jpeg), {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store, max-age=0' },
      })
    } catch (e) {
      void logPluginApiFailure('bambu-cam', 'snapshot', e instanceof Error ? e.message : 'error')
      return Response.json({ error: 'snapshot_failed', detail: e instanceof Error ? e.message : 'error' }, { status: 502 })
    }
  }

  if (action === 'proxy') {
    const raw = sp.get('url') || ''
    let u: URL
    try {
      u = new URL(raw)
    } catch {
      return Response.json({ error: 'invalid_url' }, { status: 400 })
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return Response.json({ error: 'invalid_url' }, { status: 400 })
    if (!isPrivateHost(u.hostname)) return Response.json({ error: 'invalid_host' }, { status: 400 })
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 15_000)
      const r = await fetch(raw, { cache: 'no-store', signal: ac.signal })
      clearTimeout(t)
      if (!r.ok || !r.body) {
        void logPluginApiFailure('bambu-cam', 'proxy', `http_${r.status}`)
        return Response.json({ error: 'proxy_failed' }, { status: 502 })
      }
      return new Response(r.body, {
        headers: {
          'Content-Type': r.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'no-store, max-age=0',
        },
      })
    } catch (e) {
      void logPluginApiFailure('bambu-cam', 'proxy', e instanceof Error ? e.message : 'error')
      return Response.json({ error: 'proxy_failed' }, { status: 502 })
    }
  }

  return Response.json({ error: 'invalid_action' }, { status: 400 })
}

async function handleBambuCamRequest(req: Request, _path: string[]): Promise<Response> {
  if (req.method !== 'GET') return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  return handleGet(req)
}

export default function bambuCamServerHandler(ctx: PluginServerContext): Promise<Response> {
  return handleBambuCamRequest(ctx.request, ctx.path)
}
