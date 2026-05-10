'use strict';
const axios = require('axios');

// Build server list from env
function getServers() {
  const servers = [];
  for (let i = 1; i <= 5; i++) {
    const name = process.env[`UNRAID_${i}_NAME`];
    const host = process.env[`UNRAID_${i}_HOST`];
    const key  = process.env[`UNRAID_${i}_API_KEY`];
    if (host && host.trim()) {
      servers.push({ id: `unraid${i}`, name: name || `Tower ${i}`, host: host.trim(), key: key || '' });
    }
  }
  return servers;
}

const GQL_QUERY = `{
  info {
    os { platform version }
    cpu { brand cores threads speed }
    memory { total free }
    uptime
  }
  array {
    state
    capacity { total used free }
    disks { name size fsSize fsUsed temp status type device }
  }
  shares { name free size }
  vms { name state coreCount memoryMin }
  config { name registrationName }
}`;

async function fetchServer(srv) {
  if (!srv.key) return getMock(srv);
  try {
    const { data } = await axios.post(
      `${srv.host}/graphql`,
      { query: GQL_QUERY },
      { headers: { 'x-api-key': srv.key, 'Content-Type': 'application/json' }, timeout: 8000 }
    );
    return { id: srv.id, name: srv.name, host: srv.host, online: true, ...data.data };
  } catch (e) {
    console.warn(`Unraid ${srv.name} error:`, e.message);
    return { ...getMock(srv), online: false, error: e.message };
  }
}

async function getAllServers() {
  const servers = getServers();
  if (!servers.length) return [getMock({ id: 'unraid1', name: 'Tower (Demo)', host: '' })];
  return Promise.all(servers.map(fetchServer));
}

function getMock(srv) {
  return {
    id: srv.id, name: srv.name, host: srv.host, online: false,
    info: {
      os: { platform: 'linux', version: '6.12.8' },
      cpu: { brand: 'AMD Ryzen 9 5950X', cores: 16, threads: 32, speed: 3.8 },
      memory: { total: 68719476736, free: 18924232704 },
      uptime: 1234567,
    },
    array: {
      state: 'Started',
      capacity: { total: 48000, used: 28800, free: 19200 },
      disks: [
        { name: 'Parity',   size: 16000, fsSize: 16000, fsUsed: 0,     temp: 35, status: 'DISK_OK', type: 'Parity', device: 'sda' },
        { name: 'Disk 1',   size: 16000, fsSize: 16000, fsUsed: 14200, temp: 38, status: 'DISK_OK', type: 'Data',   device: 'sdb' },
        { name: 'Disk 2',   size: 12000, fsSize: 12000, fsUsed: 8100,  temp: 42, status: 'DISK_OK', type: 'Data',   device: 'sdc' },
        { name: 'Disk 3',   size: 12000, fsSize: 12000, fsUsed: 6500,  temp: 51, status: 'DISK_OK', type: 'Data',   device: 'sdd' },
        { name: 'Cache',    size: 2000,  fsSize: 2000,  fsUsed: 1200,  temp: 48, status: 'DISK_OK', type: 'Cache',  device: 'nvme0n1' },
        { name: 'FastPool', size: 1000,  fsSize: 1000,  fsUsed: 300,   temp: 44, status: 'DISK_OK', type: 'Cache',  device: 'nvme1n1' },
      ],
    },
    shares: [
      { name: 'Media', size: 20000, free: 5800 }, { name: 'Backups', size: 12000, free: 3900 },
      { name: 'AppData', size: 2000, free: 1680 }, { name: 'Downloads', size: 4000, free: 2800 },
    ],
    vms: [],
    config: { name: srv.name, registrationName: 'Homelab' },
  };
}

module.exports = { getAllServers, getServers };
