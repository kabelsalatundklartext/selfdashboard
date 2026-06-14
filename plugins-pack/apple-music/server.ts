import { logPluginApiFailure } from '../_shared/log'
import { openSealedSecret, sealSecret } from '../_shared/secret-crypto'
import { dataDir } from '../_shared/data-dir'
import type { PluginServerContext } from '../_shared/plugin-server-types'

import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash, createPrivateKey, sign as signData } from 'node:crypto'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Apple Music developer token
//
// Unlike Spotify, Apple Music playback runs entirely in the browser via
// MusicKit JS. The server's only job is to mint a short-lived **developer
// token** (an ES256 JWT signed with the MusicKit private key, the `.p8`) which
// the widget hands to MusicKit. The developer token is public by design — it
// ships to the browser — but the private key that signs it never leaves here.
//
// The per-user "Music User Token" (the actual Apple Music login) is obtained
// and stored client-side by MusicKit JS itself; the server never sees it.
// ---------------------------------------------------------------------------

/** Apple rejects tokens whose exp is more than 6 months out — stay well under. */
const TOKEN_TTL_SEC = 150 * 24 * 60 * 60
/** Re-mint the token once it has less than a day of life left. */
const TOKEN_SKEW_SEC = 24 * 60 * 60

type StoreFile = {
  teamId: string
  keyId: string
  /** sealed (sdsec1:) PKCS#8 PEM private key from the .p8 file */
  privateKey: string
  appName?: string
  /** cached developer token (not secret) */
  developerToken?: string
  /** unix seconds when developerToken expires */
  tokenExp?: number
  updatedAt: string
}

function storeDir(): string {
  return join(dataDir(), 'apple-music')
}

/** Lookup key derived from the non-secret Team ID + Key ID pair. */
function storeKey(teamId: string, keyId: string): string {
  return createHash('sha256').update(`${teamId.trim()}:${keyId.trim()}`).digest('hex').slice(0, 24)
}

function storePath(key: string): string {
  return join(storeDir(), `${key}.json`)
}

async function readStore(key: string): Promise<StoreFile | null> {
  try {
    const raw = await readFile(storePath(key), 'utf8')
    const j = JSON.parse(raw) as StoreFile
    return j && typeof j === 'object' && typeof j.teamId === 'string' ? j : null
  } catch {
    return null
  }
}

async function writeStore(key: string, data: StoreFile): Promise<void> {
  await mkdir(storeDir(), { recursive: true })
  const path = storePath(key)
  const tmp = `${path}.tmp`
  data.updatedAt = new Date().toISOString()
  await writeFile(tmp, `${JSON.stringify(data)}\n`, 'utf8')
  await rename(tmp, path)
}

async function deleteStore(key: string): Promise<void> {
  try {
    await unlink(storePath(key))
  } catch {
    /* already gone */
  }
}

// ---------------------------------------------------------------------------
// ES256 JWT minting (no external dependency — Node's crypto signs P-256)
// ---------------------------------------------------------------------------

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Builds a signed Apple Music developer token. Throws `invalid_key` when the
 * PEM cannot be parsed as a P-256 private key.
 */
function buildDeveloperToken(privateKeyPem: string, teamId: string, keyId: string): { token: string; exp: number } {
  let key
  try {
    key = createPrivateKey({ key: privateKeyPem })
  } catch {
    throw new Error('invalid_key')
  }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_SEC
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ iss: teamId, iat: now, exp }))
  const signingInput = `${header}.${payload}`
  // Apple requires the JOSE/IEEE-P1363 (r||s) signature format, not DER.
  const signature = signData('SHA256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' })
  return { token: `${signingInput}.${b64url(signature)}`, exp }
}

/** Returns a valid cached developer token, re-minting it when close to expiry. */
function ensureDeveloperToken(key: string, record: StoreFile): { token: string; exp: number } {
  const now = Math.floor(Date.now() / 1000)
  if (record.developerToken && record.tokenExp && record.tokenExp - TOKEN_SKEW_SEC > now) {
    return { token: record.developerToken, exp: record.tokenExp }
  }
  const pem = openSealedSecret(record.privateKey)
  if (!pem) throw new Error('secret_unreadable')
  const minted = buildDeveloperToken(pem, record.teamId, record.keyId)
  record.developerToken = minted.token
  record.tokenExp = minted.exp
  void writeStore(key, record)
  return minted
}

// ---------------------------------------------------------------------------
// Request actions (POST /api/plugins/apple-music)
// ---------------------------------------------------------------------------

type ReqBody = {
  action?: string
  teamId?: string
  keyId?: string
  privateKey?: string
  appName?: string
}

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data as Record<string, unknown>, { status })
}

async function handleSave(body: ReqBody): Promise<Response> {
  const teamId = String(body.teamId ?? '').trim()
  const keyId = String(body.keyId ?? '').trim()
  const privateKey = openSealedSecret(String(body.privateKey ?? '').trim()) || String(body.privateKey ?? '').trim()
  const appName = String(body.appName ?? '').trim() || undefined
  if (!teamId || !keyId || !privateKey) return jsonResponse({ error: 'missing_credentials' }, 400)

  // Validate by actually minting a token — catches a bad .p8 immediately.
  let minted: { token: string; exp: number }
  try {
    minted = buildDeveloperToken(privateKey, teamId, keyId)
  } catch {
    return jsonResponse({ error: 'invalid_key' }, 400)
  }

  const key = storeKey(teamId, keyId)
  await writeStore(key, {
    teamId,
    keyId,
    privateKey: sealSecret(privateKey),
    appName,
    developerToken: minted.token,
    tokenExp: minted.exp,
    updatedAt: '',
  })
  return jsonResponse({ ok: true, tokenExp: minted.exp })
}

async function handleStatus(body: ReqBody): Promise<Response> {
  const teamId = String(body.teamId ?? '').trim()
  const keyId = String(body.keyId ?? '').trim()
  if (!teamId || !keyId) return jsonResponse({ configured: false })
  const record = await readStore(storeKey(teamId, keyId))
  return jsonResponse({ configured: Boolean(record?.privateKey), tokenExp: record?.tokenExp })
}

async function handleToken(body: ReqBody): Promise<Response> {
  const teamId = String(body.teamId ?? '').trim()
  const keyId = String(body.keyId ?? '').trim()
  if (!teamId || !keyId) return jsonResponse({ error: 'not_configured' }, 400)
  const key = storeKey(teamId, keyId)
  const record = await readStore(key)
  if (!record?.privateKey) return jsonResponse({ error: 'not_configured' }, 400)
  const { token, exp } = ensureDeveloperToken(key, record)
  return jsonResponse({ developerToken: token, exp, appName: record.appName })
}

async function handleDisconnect(body: ReqBody): Promise<Response> {
  const teamId = String(body.teamId ?? '').trim()
  const keyId = String(body.keyId ?? '').trim()
  if (teamId && keyId) await deleteStore(storeKey(teamId, keyId))
  return jsonResponse({ ok: true })
}

async function handlePost(req: Request): Promise<Response> {
  let body: ReqBody
  try {
    body = (await req.json()) as ReqBody
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const action = String(body.action ?? 'token')
  try {
    switch (action) {
      case 'save':
        return await handleSave(body)
      case 'status':
        return await handleStatus(body)
      case 'token':
      case 'developer-token':
        return await handleToken(body)
      case 'disconnect':
        return await handleDisconnect(body)
      default:
        return jsonResponse({ error: 'invalid_action' }, 400)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'invalid_key' || msg === 'secret_unreadable' || msg === 'not_configured') {
      void logPluginApiFailure('apple-music', action, msg)
      return jsonResponse({ error: msg }, msg === 'secret_unreadable' ? 401 : 400)
    }
    void logPluginApiFailure('apple-music', action, msg)
    return jsonResponse({ error: 'server_error', detail: msg }, 500)
  }
}

export default function appleMusicServerHandler(ctx: PluginServerContext): Promise<Response> {
  if (ctx.request.method !== 'POST') {
    return Promise.resolve(jsonResponse({ error: 'method_not_allowed' }, 405))
  }
  return handlePost(ctx.request)
}
