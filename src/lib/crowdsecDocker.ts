import 'server-only'

import { dockerGet, dockerRequest } from '@/lib/dockerEngine'

function findContainerId(containerName: string): Promise<string> {
  return dockerGet('/containers/json?all=1').then((r) => {
    if (!r.ok) throw new Error('docker_unavailable')
    const list = JSON.parse(r.body) as { Id: string; Names?: string[] }[]
    const needle = containerName.replace(/^\//, '')
    const hit = list.find((c) =>
      (c.Names ?? []).some((n) => {
        const base = n.replace(/^\//, '')
        return base === needle || base.endsWith(`/${needle}`)
      }),
    )
    if (!hit?.Id) throw new Error('crowdsec_container_not_found')
    return hit.Id
  })
}

async function dockerExec(containerName: string, cmd: string[], timeoutMs = 30_000): Promise<{ code: number; output: string }> {
  const id = await findContainerId(containerName)
  const create = await dockerRequest(
    'POST',
    `/containers/${id}/exec`,
    JSON.stringify({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: cmd,
    }),
  )
  if (!create.ok) throw new Error(`docker_exec_create_${create.status}`)
  const execId = (JSON.parse(create.body) as { Id?: string }).Id
  if (!execId) throw new Error('docker_exec_no_id')
  const start = await dockerRequest(
    'POST',
    `/exec/${execId}/start`,
    JSON.stringify({ Detach: false, Tty: false }),
    timeoutMs,
  )
  const output = start.body?.trim() ?? ''
  if (!start.ok) throw new Error(`docker_exec_start_${start.status}`)
  const inspect = await dockerGet(`/exec/${execId}/json`)
  let code = 1
  if (inspect.ok) {
    try {
      code = Number((JSON.parse(inspect.body) as { ExitCode?: number }).ExitCode ?? 1)
    } catch {
      code = 1
    }
  }
  return { code, output }
}

export async function dockerRestartContainer(containerName: string): Promise<void> {
  const id = await findContainerId(containerName)
  const r = await dockerRequest('POST', `/containers/${id}/restart`, undefined, 90_000)
  if (!r.ok) throw new Error(`docker_restart_${r.status}`)
}

export async function crowdsecCscli(containerName: string, args: string[]): Promise<void> {
  const { code } = await dockerExec(containerName, ['cscli', ...args])
  if (code !== 0) throw new Error(`cscli_exit_${code}`)
}

/** Entfernt Decision + Alert für eine IP (wie threat-map-docker Unban). */
export async function crowdsecUnbanIp(containerName: string, ip: string): Promise<void> {
  const trimmed = ip.trim()
  if (!trimmed || !/^[\d.a-fA-F:]+$/.test(trimmed)) {
    throw new Error('invalid_ip')
  }
  try {
    await crowdsecCscli(containerName, ['decisions', 'delete', '--ip', trimmed])
  } catch {
    /* decision may not exist */
  }
  try {
    await crowdsecCscli(containerName, ['alerts', 'delete', '--ip', trimmed])
  } catch {
    /* alert may not exist */
  }
}

/** @deprecated use crowdsecUnbanIp */
export const crowdsecDeleteDecisionIp = crowdsecUnbanIp

export async function crowdsecContainerReady(containerName: string): Promise<boolean> {
  try {
    await dockerExec(containerName, ['cscli', 'version'], 15_000)
    return true
  } catch {
    return false
  }
}
