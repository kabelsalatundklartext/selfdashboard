import { openSealedSecret, sealSecret } from '../../_shared/secret-crypto'
import { dataDir } from '../../_shared/data-dir'

import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// Persistent connection store — data/alexa/connection.json.
//
// The Amazon session (alexa-remote2 "cookieData": login cookie, refresh token,
// device-registration data) NEVER leaves the server. It is sealed at rest with
// the shared credential crypto, exactly like the Spotify refresh token. The
// widget only ever sends a region/host config, never any session material.
//
// Single-connection model: one Amazon account per dashboard ("connection.json").
// ---------------------------------------------------------------------------

export type AlexaConfig = {
  /** IP or hostname the user's browser uses to reach the login proxy. */
  host: string
  /** TCP port the login proxy listens on. */
  port: number
  /** Amazon login page, e.g. "amazon.de". */
  amazonPage: string
  /** Alexa service API host, e.g. "layla.amazon.de". */
  serviceHost: string
}

export type StoreFile = AlexaConfig & {
  /** sealed (sdsec1:) JSON of alexa-remote2 cookieData — the full session. */
  cookieData?: string
  customerName?: string
  connectedAt?: string
  updatedAt: string
}

function storeDir(): string {
  return join(dataDir(), 'alexa')
}

function storePath(): string {
  return join(storeDir(), 'connection.json')
}

export async function readStore(): Promise<StoreFile | null> {
  try {
    const raw = await readFile(storePath(), 'utf8')
    const j = JSON.parse(raw) as StoreFile
    return j && typeof j === 'object' ? j : null
  } catch {
    return null
  }
}

export async function writeStore(data: StoreFile): Promise<void> {
  await mkdir(storeDir(), { recursive: true })
  const path = storePath()
  const tmp = `${path}.tmp`
  data.updatedAt = new Date().toISOString()
  await writeFile(tmp, `${JSON.stringify(data)}\n`, 'utf8')
  await rename(tmp, path)
}

export async function deleteStore(): Promise<void> {
  try {
    await unlink(storePath())
  } catch {
    /* already gone */
  }
}

/** Persist (or update) the connection config without touching the session. */
export async function saveConfig(cfg: AlexaConfig): Promise<StoreFile> {
  const prev = await readStore()
  const next: StoreFile = { ...prev, ...cfg, updatedAt: '' }
  await writeStore(next)
  return next
}

/** Seal and persist the live Amazon session blob plus the account name. */
export async function saveSession(cookieData: unknown, customerName?: string): Promise<void> {
  const prev = (await readStore()) ?? {
    host: '',
    port: 0,
    amazonPage: 'amazon.de',
    serviceHost: 'layla.amazon.de',
    updatedAt: '',
  }
  prev.cookieData = sealSecret(JSON.stringify(cookieData ?? null))
  if (customerName) prev.customerName = customerName
  prev.connectedAt = new Date().toISOString()
  await writeStore(prev)
}

/** Read and unseal the stored session blob, or null when not connected. */
export async function readSession(): Promise<unknown | null> {
  const record = await readStore()
  if (!record?.cookieData) return null
  try {
    const json = openSealedSecret(record.cookieData)
    return json ? JSON.parse(json) : null
  } catch {
    return null
  }
}
