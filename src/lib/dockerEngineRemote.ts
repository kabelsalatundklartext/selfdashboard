import * as http from 'node:http'
import * as https from 'node:https'
import { URL } from 'node:url'

/** Build `https://host:2376/v1.41/containers/json?all=true` from base + version + path */
export function buildRemoteDockerUrl(baseUrl: string, apiVersion: string, dockerPath: string): URL {
  const base = baseUrl.trim().replace(/\/+$/, '')
  const v = (apiVersion || 'v1.41').trim().replace(/^\/+/, '').replace(/\/+$/, '') || 'v1.41'
  const p = dockerPath.replace(/^\//, '')
  return new URL(`${v}/${p}`, `${base}/`)
}

export function assertSafeRemoteDockerBase(raw: string): URL {
  const s = raw.trim()
  if (!s) throw new Error('missing_base_url')
  const u = new URL(/^https?:\/\//i.test(s) ? s : `http://${s}`)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('invalid_protocol')
  if (!u.hostname) throw new Error('invalid_host')
  // SSRF hardening: no credentials in URL (avoid leaking to logs); user can use TLS client later
  u.username = ''
  u.password = ''
  return u
}

export async function remoteDockerRequest(opts: {
  baseUrl: string
  apiVersion: string
  method: 'GET' | 'POST'
  /** e.g. `containers/json?all=true` — without API version prefix */
  path: string
  body?: string
  tlsInsecure?: boolean
  timeoutMs?: number
}): Promise<{ ok: boolean; status: number; body: string }> {
  const url = buildRemoteDockerUrl(opts.baseUrl, opts.apiVersion, opts.path)
  const payload = opts.body ?? ''
  const timeoutMs = opts.timeoutMs ?? 15_000
  const isHttps = url.protocol === 'https:'

  return new Promise((resolve, reject) => {
    const lib = isHttps ? https : http
    const headers: http.OutgoingHttpHeaders = {
      Host: url.host,
      Accept: 'application/json',
    }
    if (opts.method === 'POST') {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(payload, 'utf8')
    }
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: opts.method,
        headers,
        ...(isHttps ? { agent: new https.Agent({ rejectUnauthorized: opts.tlsInsecure ? false : true }) } : {}),
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: string | Buffer) => {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        })
        res.on('end', () => {
          const resBody = Buffer.concat(chunks).toString('utf8')
          const code = res.statusCode ?? 500
          resolve({ ok: code >= 200 && code < 300, status: code, body: resBody })
        })
      },
    )
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      reject(new Error('Timeout bei Remote-Docker'))
    })
    if (payload) req.write(payload, 'utf8')
    req.end()
  })
}
