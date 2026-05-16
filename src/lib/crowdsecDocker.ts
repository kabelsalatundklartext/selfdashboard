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

/** Runs cscli inside the CrowdSec container (requires Docker socket). */
export async function crowdsecDeleteDecisionIp(containerName: string, ip: string): Promise<void> {
  const trimmed = ip.trim()
  if (!trimmed || !/^[\d.a-fA-F:]+$/.test(trimmed)) {
    throw new Error('invalid_ip')
  }
  const id = await findContainerId(containerName)
  const create = await dockerRequest(
    'POST',
    `/containers/${id}/exec`,
    JSON.stringify({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['cscli', 'decisions', 'delete', '--ip', trimmed],
    }),
  )
  if (!create.ok) throw new Error(`docker_exec_create_${create.status}`)
  const execId = (JSON.parse(create.body) as { Id?: string }).Id
  if (!execId) throw new Error('docker_exec_no_id')
  const start = await dockerRequest('POST', `/exec/${execId}/start`, JSON.stringify({ Detach: false }), 30_000)
  if (!start.ok) throw new Error(`docker_exec_start_${start.status}`)
}
