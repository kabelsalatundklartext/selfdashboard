import 'server-only'

import fs from 'fs'
import path from 'path'
import {
  crowdsecCscli,
  crowdsecContainerReady,
  dockerRestartContainer,
} from '@/lib/crowdsecDocker'

export type WhitelistStatus = {
  ip: string
  lastCheck: string
  lastChange: string
  /** ok | aktualisiert | fehler | unbekannt | deaktiviert */
  status: string
  message?: string
}

export type WhitelistConfig = {
  enabled: boolean
  filePath: string
  intervalSec: number
  containerName: string
  restartWaitSec: number
}

const DEFAULT_FILE = '/crowdsec-postoverflows/s01-whitelist/my-whitelist.yaml'

let status: WhitelistStatus = {
  ip: '',
  lastCheck: '',
  lastChange: '',
  status: 'unbekannt',
}

let loopTimer: ReturnType<typeof setInterval> | null = null
let updateRunning = false

function allowedWhitelistRoots(): string[] {
  const roots = [
    path.resolve(process.env.CROWDSEC_POSTOVERFLOWS_DIR || '/crowdsec-postoverflows'),
    path.resolve('/crowdsec-postoverflows'),
  ]
  if (process.env.CROWDSEC_DATA_DIR) {
    roots.push(path.resolve(process.env.CROWDSEC_DATA_DIR, 'postoverflows'))
  }
  return [...new Set(roots)]
}

export function resolveWhitelistFilePath(userPath: string): string {
  const trimmed = (userPath || DEFAULT_FILE).trim()
  const resolved = path.resolve(trimmed || DEFAULT_FILE)
  const allowed = allowedWhitelistRoots().some(
    (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`),
  )
  if (!allowed) throw new Error('whitelist_path_not_allowed')
  return resolved
}

function nowDe(): string {
  return new Date().toLocaleString('de-DE', { hour12: false })
}

async function fetchPublicIp(): Promise<string | null> {
  const urls = ['https://api.ipify.org', 'https://ifconfig.me', 'https://checkip.amazonaws.com']
  for (const url of urls) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(t)
      if (!res.ok) continue
      const ip = (await res.text()).trim()
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip
    } catch {
      /* next */
    }
  }
  return null
}

function readIpFromYaml(filePath: string): string {
  if (!fs.existsSync(filePath)) return ''
  try {
    const m = fs.readFileSync(filePath, 'utf8').match(/(\d{1,3}(?:\.\d{1,3}){3})/)
    return m?.[1] ?? ''
  } catch {
    return ''
  }
}

function writeWhitelistYaml(filePath: string, ip: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const yaml = [
    'name: my-whitelist',
    'description: dynamic whitelist (SelfDashboard)',
    'whitelist:',
    '  reason: dynamic',
    '  ip:',
    `  - "${ip}"`,
    '',
  ].join('\n')
  fs.writeFileSync(filePath, yaml, 'utf8')
}

async function removeBanForIp(containerName: string, ip: string): Promise<void> {
  try {
    await crowdsecCscli(containerName, ['decisions', 'delete', '--ip', ip])
  } catch {
    /* may not exist */
  }
}

export function getWhitelistStatus(): WhitelistStatus {
  return { ...status }
}

export async function runWhitelistUpdate(cfg: WhitelistConfig): Promise<WhitelistStatus> {
  if (!cfg.enabled) {
    status = { ip: '', lastCheck: nowDe(), lastChange: '', status: 'deaktiviert' }
    return getWhitelistStatus()
  }
  if (updateRunning) return getWhitelistStatus()
  updateRunning = true

  const checkStr = nowDe()
  try {
    const filePath = resolveWhitelistFilePath(cfg.filePath)
    const ip = await fetchPublicIp()
    if (!ip) {
      status = {
        ip: status.ip,
        lastCheck: checkStr,
        lastChange: status.lastChange,
        status: 'fehler',
        message: 'public_ip_failed',
      }
      return getWhitelistStatus()
    }

    status = { ...status, ip, lastCheck: checkStr }
    const previous = readIpFromYaml(filePath)

    if (previous === ip) {
      await removeBanForIp(cfg.containerName, ip)
      status = {
        ip,
        lastCheck: checkStr,
        lastChange: status.lastChange,
        status: 'ok',
        message: 'unchanged',
      }
      return getWhitelistStatus()
    }

    writeWhitelistYaml(filePath, ip)
    await dockerRestartContainer(cfg.containerName)

    const waitMs = Math.min(120, Math.max(5, cfg.restartWaitSec)) * 1000
    await new Promise((r) => setTimeout(r, waitMs))

    for (let i = 0; i < 15; i++) {
      if (await crowdsecContainerReady(cfg.containerName)) break
      await new Promise((r) => setTimeout(r, 5000))
    }

    await new Promise((r) => setTimeout(r, 5000))
    await removeBanForIp(cfg.containerName, ip)

    const changeStr = nowDe()
    status = {
      ip,
      lastCheck: checkStr,
      lastChange: changeStr,
      status: 'aktualisiert',
      message: previous ? `${previous} → ${ip}` : ip,
    }
  } catch (e) {
    status = {
      ip: status.ip,
      lastCheck: checkStr,
      lastChange: status.lastChange,
      status: 'fehler',
      message: e instanceof Error ? e.message : 'whitelist_error',
    }
  } finally {
    updateRunning = false
  }

  return getWhitelistStatus()
}

export function configureWhitelistLoop(cfg: WhitelistConfig): void {
  if (loopTimer) {
    clearInterval(loopTimer)
    loopTimer = null
  }
  if (!cfg.enabled) return

  const intervalMs = Math.min(86_400, Math.max(60, cfg.intervalSec)) * 1000
  const tick = () => {
    void runWhitelistUpdate(cfg)
  }
  void tick()
  loopTimer = setInterval(tick, intervalMs)
}

export function parseWhitelistConfigFromSearchParams(sp: URLSearchParams): WhitelistConfig {
  return {
    enabled: sp.get('whitelistEnabled') === '1' || sp.get('whitelistEnabled') === 'true',
    filePath: sp.get('whitelistPath')?.trim() || process.env.CROWDSEC_WHITELIST_FILE || DEFAULT_FILE,
    intervalSec: Math.min(86_400, Math.max(60, Number(sp.get('whitelistInterval') || 900) || 900)),
    containerName: sp.get('crowdsecContainer')?.trim() || process.env.CROWDSEC_CONTAINER || 'crowdsec',
    restartWaitSec: Math.min(120, Math.max(5, Number(sp.get('whitelistRestartWait') || 15) || 15)),
  }
}
