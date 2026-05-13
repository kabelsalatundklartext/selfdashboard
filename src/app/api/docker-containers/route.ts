import { NextResponse } from 'next/server'
import * as http from 'node:http'

export const dynamic = 'force-dynamic'

function socketPath(): string {
  return process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
}

function dockerGet(pathAndQuery: string): Promise<{ ok: boolean; status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: socketPath(),
        path: pathAndQuery,
        method: 'GET',
        headers: { Host: 'localhost', Accept: 'application/json' },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: string | Buffer) => {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        })
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          const code = res.statusCode ?? 500
          resolve({ ok: code >= 200 && code < 300, status: code, body })
        })
      },
    )
    req.on('error', reject)
    req.setTimeout(12_000, () => {
      req.destroy()
      reject(new Error('Timeout beim Docker-Socket'))
    })
    req.end()
  })
}

/**
 * GET /api/docker-containers?all=0|1
 * Liefert die rohe JSON-Liste von GET /containers/json (Docker Engine API).
 * Erfordert Zugriff auf den Unix-Socket (z. B. Volume /var/run/docker.sock im Container).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1' ? 'true' : 'false'
  try {
    const r = await dockerGet(`/containers/json?all=${all}`)
    if (!r.ok) {
      return NextResponse.json(
        { error: r.body?.slice(0, 400) || `Docker HTTP ${r.status}` },
        { status: r.status >= 400 && r.status < 600 ? r.status : 502 },
      )
    }
    let data: unknown
    try {
      data = JSON.parse(r.body) as unknown
    } catch {
      return NextResponse.json({ error: 'Ungültige JSON-Antwort von Docker' }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const hint =
      msg.includes('ENOENT') || msg.includes('ENOTDIR')
        ? 'Docker-Socket nicht gefunden — z. B. -v /var/run/docker.sock:/var/run/docker.sock am SelfDashboard-Container.'
        : msg
    return NextResponse.json({ error: hint }, { status: 503 })
  }
}
