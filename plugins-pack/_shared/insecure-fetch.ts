/**
 * fetch für Plugin-Server, die Dienste mit selbstsignierten Zertifikaten
 * ansprechen müssen (Proxmox, TrueNAS, UniFi, OPNsense, …):
 * - SSRF-Check (DNS-aufgelöst) vor jedem Request
 * - optional `insecureTls` über einen pro-Request https.Agent
 *   (KEIN globales NODE_TLS_REJECT_UNAUTHORIZED)
 * - node-fetch statt global fetch, damit der Agent greift
 */
import https from 'node:https'
import nodeFetch from 'node-fetch'
import { assertSafeOutboundUrlResolved } from './ssrf'

export type CheckedResponse = {
  ok: boolean
  status: number
  headers: {
    get(name: string): string | null
    raw(): Record<string, string[]>
  }
  text(): Promise<string>
}

export type CheckedInit = {
  method?: string
  headers?: Record<string, string>
  body?: string
  signal?: AbortSignal
  redirect?: 'manual' | 'follow' | 'error'
}

export async function fetchChecked(
  url: string,
  init: CheckedInit = {},
  opts: { insecureTls?: boolean } = {},
): Promise<CheckedResponse> {
  await assertSafeOutboundUrlResolved(url)
  const isHttps = url.toLowerCase().startsWith('https:')
  const agent =
    isHttps && opts.insecureTls === true ? new https.Agent({ rejectUnauthorized: false }) : undefined
  const res = await nodeFetch(url, {
    redirect: 'manual',
    ...init,
    ...(agent ? { agent } : {}),
  } as Record<string, unknown>)
  return res as unknown as CheckedResponse
}

/** Bequemer JSON-Wrapper: parst defensiv, liefert Text für Fehlerdetails mit. */
export async function fetchCheckedJson(
  url: string,
  init: CheckedInit = {},
  opts: { insecureTls?: boolean } = {},
): Promise<{ ok: boolean; status: number; json: unknown; text: string; res: CheckedResponse }> {
  const res = await fetchChecked(url, init, opts)
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json, text, res }
}
