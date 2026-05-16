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

async function dockerExec(containerName: string, cmd: string[], timeoutMs = 30_000): Promise<void> {
  const id = await findContainerId(containerName)
  const create = await dockerRequest(
    'POST',
    `/containers/${id}/exec`,
    JSON.stringify({ AttachStdout: true, AttachStderr: true, Cmd: cmd }),
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
  if (!start.ok) throw new Error(`docker_exec_start_${start.status}`)
  const inspect = await dockerGet(`/exec/${execId}/json`)
  if (inspect.ok) {
    try {
      const code = Number((JSON.parse(inspect.body) as { ExitCode?: number }).ExitCode ?? 1)
      if (code !== 0) throw new Error(`cscli_exit_${code}`)
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('cscli_exit_')) throw e
    }
  }
}

export async function crowdsecUnbanIp(containerName: string, ip: string): Promise<void> {
  const trimmed = ip.trim()
  if (!trimmed || !/^[\d.a-fA-F:]+$/.test(trimmed)) throw new Error('invalid_ip')
  try {
    await dockerExec(containerName, ['cscli', 'decisions', 'delete', '--ip', trimmed])
  } catch {
    /* may not exist */
  }
  try {
    await dockerExec(containerName, ['cscli', 'alerts', 'delete', '--ip', trimmed])
  } catch {
    /* may not exist */
  }
}
