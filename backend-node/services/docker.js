'use strict';
const Dockerode = require('dockerode');
const docker = process.env.DOCKER_HOST
  ? new Dockerode({ host: process.env.DOCKER_HOST, port: +(process.env.DOCKER_PORT||2376) })
  : new Dockerode({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

async function listContainers() {
  try {
    const list = await docker.listContainers({ all: true });
    return Promise.all(list.map(async c => {
      const base = { id: c.Id.slice(0,12), fullId: c.Id, name: c.Names[0].replace('/',''), image: c.Image,
        status: c.State, statusText: c.Status, ports: c.Ports.filter(p=>p.PublicPort).map(p=>`${p.PublicPort}→${p.PrivatePort}`),
        labels: c.Labels||{}, cpu:0, memMB:0, memLimitMB:0, memPct:0, netRxMB:0, netTxMB:0, blockRdMB:0, blockWrMB:0, pids:0 };
      if (c.State !== 'running') return base;
      try {
        const [stats, inspect] = await Promise.all([
          new Promise(res => docker.getContainer(c.Id).stats({ stream:false }, (e,s) => res(e?null:s))),
          docker.getContainer(c.Id).inspect(),
        ]);
        if (stats) {
          const cd = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
          const sd = stats.cpu_stats.system_cpu_usage      - stats.precpu_stats.system_cpu_usage;
          const n  = stats.cpu_stats.online_cpus||1;
          base.cpu       = sd>0 ? Math.round(cd/sd*n*1000)/10 : 0;
          base.memMB     = Math.round((stats.memory_stats.usage||0)/1024/1024);
          base.memLimitMB= Math.round((stats.memory_stats.limit||0)/1024/1024);
          base.memPct    = base.memLimitMB>0 ? Math.round(base.memMB/base.memLimitMB*100) : 0;
          const nets = Object.values(stats.networks||{});
          base.netRxMB   = Math.round(nets.reduce((s,n)=>s+n.rx_bytes,0)/1024/1024*10)/10;
          base.netTxMB   = Math.round(nets.reduce((s,n)=>s+n.tx_bytes,0)/1024/1024*10)/10;
          base.pids      = stats.pids_stats?.current||0;
          const blk      = stats.blkio_stats?.io_service_bytes_recursive||[];
          base.blockRdMB = Math.round(blk.filter(b=>b.op==='Read').reduce((s,b)=>s+b.value,0)/1024/1024);
          base.blockWrMB = Math.round(blk.filter(b=>b.op==='Write').reduce((s,b)=>s+b.value,0)/1024/1024);
        }
        if (inspect) {
          base.restartPolicy = inspect.HostConfig.RestartPolicy.Name;
          base.networks      = Object.keys(inspect.NetworkSettings.Networks||{});
          base.mounts        = (inspect.Mounts||[]).map(m=>({ src:m.Source, dst:m.Destination, rw:m.RW }));
        }
      } catch {}
      return base;
    }));
  } catch (e) { console.error('docker:', e.message); return []; }
}

async function getLogs(id, tail=100) {
  try {
    const data = await docker.getContainer(id).logs({ stdout:true, stderr:true, tail, timestamps:true });
    return data.toString().split('\n').filter(Boolean).map(l=>l.replace(/[\x00-\x08\x0e-\x1f]/g,'').trim()).filter(Boolean);
  } catch (e) { return [`[ERROR] ${e.message}`]; }
}

async function containerAction(id, action) {
  const c = docker.getContainer(id);
  await ({ start:()=>c.start(), stop:()=>c.stop(), restart:()=>c.restart(), pause:()=>c.pause(), unpause:()=>c.unpause() })[action]?.();
  return { ok: true };
}

async function getImages()   { try { return (await docker.listImages({all:false})).map(i=>({ id:i.Id.slice(7,19), tags:i.RepoTags, sizeMB:Math.round(i.Size/1024/1024), created:i.Created })); } catch { return []; } }
async function getNetworks() { try { return await docker.listNetworks(); } catch { return []; } }
async function getVolumes()  { try { return (await docker.listVolumes()).Volumes||[]; } catch { return []; } }

module.exports = { listContainers, getLogs, containerAction, getImages, getNetworks, getVolumes };
