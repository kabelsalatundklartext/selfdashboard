'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SelfDashboard — Widget Definitions
   Each widget: { id, title, icon, minW, minH, render(snap, el) }
═══════════════════════════════════════════════════════════════════════════ */

window.WIDGETS = {};

// ── helpers ────────────────────────────────────────────────────────────────
const esc = s => String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const barColor = p => p>=85?'var(--cr)':p>=65?'var(--wn)':'var(--ok)';
const tempColor = t => { if(!t) return 'var(--mu)'; return t>=75?'var(--cr)':t>=60?'var(--wn)':'var(--ok)'; };
const fmtDate = d => { try { return new Date(d).toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'}); } catch { return d; } };
const fmtTime = d => { try { const dt=new Date(d); return dt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}); } catch { return ''; } };

function minibar(pct, label) {
  const w = Math.min(pct||0, 100);
  const c = barColor(w);
  return `<div class="mbar-wrap">
    <div class="mbar"><div class="mbar-fill" style="width:${w}%;background:${c}"></div></div>
    <span class="mbar-val" style="color:${c}">${label}</span>
  </div>`;
}

// ── register helper ─────────────────────────────────────────────────────────
function reg(def) { window.WIDGETS[def.id] = def; }

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-system', title: 'System', icon: 'ti-cpu', minW: 3, minH: 3,
  render(snap, el) {
    const sys = snap?.system || {};
    const cpu = sys.cpu || {};
    const ram = sys.ram || {};
    const sw  = sys.swap || {};
    const net = (sys.network||[])[0] || {};
    const temp = sys.temps?.cpu;

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-cpu"></i>System</div>
        <span class="c-muted" style="font-size:11px">${sys.uptimeFmt||'–'}</span>
      </div>
      <div class="widget-body">
        <div class="sys-metrics">
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-cpu"></i>CPU</div>
            <div class="sys-m-val" style="color:${barColor(cpu.pct||0)}">${(cpu.pct||0).toFixed(1)}%</div>
            <div class="sys-m-sub">${cpu.cores||0} Kerne · ${cpu.freqMHz||0} MHz</div>
            <div class="sys-bar"><div class="sys-bar-fill" style="width:${cpu.pct||0}%;background:${barColor(cpu.pct||0)}"></div></div>
          </div>
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-device-laptop"></i>RAM</div>
            <div class="sys-m-val" style="color:${barColor(ram.pct||0)}">${ram.pct||0}%</div>
            <div class="sys-m-sub">${(ram.usedGB||0).toFixed(1)} / ${(ram.totalGB||0).toFixed(1)} GB</div>
            <div class="sys-bar"><div class="sys-bar-fill" style="width:${ram.pct||0}%;background:${barColor(ram.pct||0)}"></div></div>
          </div>
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-temperature"></i>CPU Temp</div>
            <div class="sys-m-val" style="color:${tempColor(temp)}">${temp ? temp+'°C' : '–'}</div>
            <div class="sys-m-sub">${cpu.brand||''}</div>
          </div>
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-arrows-exchange"></i>Swap</div>
            <div class="sys-m-val" style="color:${barColor(sw.pct||0)}">${sw.pct||0}%</div>
            <div class="sys-m-sub">${(sw.usedGB||0).toFixed(1)} / ${(sw.totalGB||0).toFixed(1)} GB</div>
            <div class="sys-bar"><div class="sys-bar-fill" style="width:${sw.pct||0}%;background:${barColor(sw.pct||0)}"></div></div>
          </div>
        </div>
        ${net.iface ? `
        <div style="display:flex;gap:8px;margin-top:4px">
          <div class="sys-metric" style="flex:1">
            <div class="sys-m-label"><i class="ti ti-arrow-down"></i>${net.iface} ↓</div>
            <div class="sys-m-val c-green" id="net-rx-val">–</div>
          </div>
          <div class="sys-metric" style="flex:1">
            <div class="sys-m-label"><i class="ti ti-arrow-up"></i>${net.iface} ↑</div>
            <div class="sys-m-val c-blue" id="net-tx-val">–</div>
          </div>
        </div>` : ''}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCKER OVERVIEW WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-docker', title: 'Docker', icon: 'ti-brand-docker', minW: 4, minH: 4,
  render(snap, el) {
    const cts = snap?.containers || [];
    const running = cts.filter(c=>c.status==='running');
    const stopped = cts.filter(c=>c.status!=='running');
    const top = [...running].sort((a,b)=>b.cpu-a.cpu).slice(0, 10);

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left">
          <i class="ti ti-brand-docker"></i>Docker
          <span class="pill pill-g">${running.length} läuft</span>
          <span class="pill pill-r">${stopped.length} gestoppt</span>
        </div>
        <button class="link-btn" onclick="window.switchView('docker')">Alle →</button>
      </div>
      <div class="widget-body no-pad">
        <table class="dt" style="min-width:0">
          <thead><tr>
            <th>Name</th><th>CPU</th><th>RAM</th><th>Netz ↓/↑</th><th>Uptime</th>
          </tr></thead>
          <tbody>
            ${top.map(c => {
              const rp = c.memLimitMB>0 ? Math.round(c.memMB/c.memLimitMB*100) : 0;
              return `<tr onclick="window.switchView('docker')">
                <td><div class="ct-name-cell"><div class="sdot ${c.status}"></div>${esc(c.name)}</div></td>
                <td>${minibar(c.cpu, c.cpu.toFixed(1)+'%')}</td>
                <td>${minibar(rp, c.memMB+'MB')}</td>
                <td style="font-size:11px"><span class="c-green">↓${c.netRxMB}</span> <span class="c-blue">↑${c.netTxMB}</span></td>
                <td class="c-muted" style="font-size:11px">${c.statusText||'–'}</td>
              </tr>`;
            }).join('')}
            ${!top.length ? `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--mu)">Keine Container</td></tr>` : ''}
          </tbody>
        </table>
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-storage', title: 'Speicher', icon: 'ti-database', minW: 3, minH: 3,
  render(snap, el) {
    const unraid = snap?.unraidServers?.[0] || {};
    const disks = unraid.array?.disks || [];
    const storage = snap?.storage || {};
    const parts = storage.partitions || [];

    const showDisks = disks.length ? disks : parts.filter(p=>
      ['/mnt/disk','/mnt/cache','/mnt/pool'].some(m=>p.mount?.startsWith(m))
    ).slice(0,8).map(p=>({
      name: p.mount, type: p.mount.includes('cache')||p.mount.includes('pool') ? 'Cache' : 'Data',
      fsSize: p.totalGB, fsUsed: p.usedGB, temp: null, device: ''
    }));

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-database"></i>Speicher</div>
        <button class="link-btn" onclick="window.switchView('storage')">Details →</button>
      </div>
      <div class="widget-body no-pad">
        ${showDisks.map(d => {
          const pct = d.fsSize>0 ? Math.round(d.fsUsed/d.fsSize*100) : 0;
          const pip = d.type==='Parity'?'#534AB7':d.type==='Cache'?'#185FA5':'var(--ok)';
          return `<div class="disk-row">
            <div class="disk-pip" style="background:${pip}"></div>
            <div class="disk-label">${esc(d.name)}</div>
            <div class="disk-bar-wrap">
              <div class="disk-track"><div class="disk-fill" style="width:${pct}%;background:${barColor(pct)}"></div></div>
              <div class="disk-sub"><span>${d.fsUsed}/${d.fsSize} GB</span></div>
            </div>
            <div class="disk-right">
              <span style="color:${barColor(pct)};font-size:11px;font-weight:500">${pct}%</span>
              ${d.temp ? `<span class="disk-temp" style="color:${tempColor(d.temp)};font-size:11px">${d.temp}°</span>` : ''}
            </div>
          </div>`;
        }).join('') || `<div style="padding:20px;text-align:center;color:var(--mu);font-size:12px">Keine Daten — Unraid API konfigurieren</div>`}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// WEATHER WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-weather', title: 'Wetter', icon: 'ti-cloud', minW: 2, minH: 3,
  render(snap, el) {
    const w = snap?.weather;
    if (!w || !w.current) {
      el.innerHTML = `
        <div class="widget-hd"><div class="widget-hd-left"><i class="ti ti-cloud"></i>Wetter</div></div>
        <div class="widget-body" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--mu)">
          <i class="ti ti-map-pin" style="font-size:32px"></i>
          <div style="font-size:12px">Standort in Einstellungen konfigurieren</div>
          <button class="btn-ghost" onclick="window.switchView('settings')" style="font-size:11px">Einstellungen öffnen</button>
        </div>`;
      return;
    }
    const cur = w.current;
    const fc  = w.forecast || [];
    const isUrl = typeof cur.icon === 'string' && cur.icon.startsWith('http');

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-cloud"></i>${esc(w.city||'Wetter')}</div>
        <span style="font-size:10px;color:var(--mu)">${w.provider}</span>
      </div>
      <div class="weather-current">
        <div class="weather-icon">${isUrl ? `<img src="${cur.icon}" style="width:56px;height:56px">` : cur.icon}</div>
        <div>
          <div class="weather-temp">${cur.temp}°</div>
          <div class="weather-sub">${esc(cur.description||'')} · Gefühlt ${cur.feelsLike}°</div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail"><i class="ti ti-droplet"></i>${cur.humidity}%</div>
        <div class="weather-detail"><i class="ti ti-wind"></i>${cur.windKmh} km/h</div>
      </div>
      <div class="weather-forecast">
        ${fc.slice(0,7).map(day => {
          const isUrlFc = typeof day.icon === 'string' && day.icon.startsWith('http');
          return `<div class="wf-day">
            <div class="wf-date">${fmtDate(day.date)}</div>
            <div class="wf-icon">${isUrlFc ? `<img src="${day.icon}" style="width:28px">` : day.icon}</div>
            <div class="wf-temps"><span class="wf-max">${day.maxT}°</span><span class="wf-min">${day.minT}°</span></div>
            ${day.precip>0 ? `<div class="wf-precip">${day.precip}mm</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-calendar', title: 'Kalender', icon: 'ti-calendar', minW: 2, minH: 3,
  render(snap, el) {
    const events = snap?.calendar || [];
    const now = new Date();
    const upcoming = events
      .filter(e => e.start && new Date(e.start) >= new Date(now.toDateString()))
      .slice(0, 15);

    if (!events.length) {
      el.innerHTML = `
        <div class="widget-hd"><div class="widget-hd-left"><i class="ti ti-calendar"></i>Kalender</div></div>
        <div class="widget-body" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--mu)">
          <i class="ti ti-calendar-off" style="font-size:32px"></i>
          <div style="font-size:12px">iCal URL in Einstellungen konfigurieren</div>
        </div>`;
      return;
    }

    // Group by date
    const groups = {};
    upcoming.forEach(e => {
      const d = e.start.slice(0,10);
      if (!groups[d]) groups[d] = [];
      groups[d].push(e);
    });

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-calendar"></i>Kalender</div>
        <span style="font-size:11px;color:var(--mu)">${upcoming.length} Termine</span>
      </div>
      <div class="widget-body no-pad">
        ${Object.entries(groups).slice(0,5).map(([date, evts]) => `
          <div class="cal-day-header">
            <span>${fmtDate(date)}</span>
            <span>${evts.length} Termin${evts.length!==1?'e':''}</span>
          </div>
          ${evts.map(e => `
            <div class="cal-event">
              <div class="cal-dot"></div>
              <div style="flex:1">
                <div class="cal-title">${esc(e.title)}</div>
                ${e.location ? `<div class="cal-loc"><i class="ti ti-map-pin" style="font-size:10px"></i> ${esc(e.location)}</div>` : ''}
              </div>
              <div class="cal-time">${e.start.includes('T') ? fmtTime(e.start) : 'Ganztag'}</div>
            </div>
          `).join('')}
        `).join('')}
        ${!upcoming.length ? `<div class="cal-empty">Keine bevorstehenden Termine</div>` : ''}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CROWDSEC WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-crowdsec', title: 'CrowdSec', icon: 'ti-shield', minW: 3, minH: 3,
  render(snap, el) {
    const cs = snap?.crowdsec || {};
    const alerts = cs.alerts || [];
    const types = {
      'brute-force': { label:'Brute Force', color:'#e09d50', bg:'rgba(224,157,80,.15)' },
      'port-scan':   { label:'Port Scan',   color:'#7f77dd', bg:'rgba(127,119,221,.15)' },
      'web-attack':  { label:'Web Attack',  color:'#e05555', bg:'rgba(224,85,85,.15)' },
      'exploit':     { label:'Exploit',     color:'#d85a30', bg:'rgba(216,90,48,.15)' },
      'other':       { label:'Sonstige',    color:'#6d7a96', bg:'rgba(109,122,150,.15)' },
    };
    const flags = {RU:'🇷🇺',CN:'🇨🇳',DE:'🇩🇪',US:'🇺🇸',BR:'🇧🇷',IN:'🇮🇳',NL:'🇳🇱',FR:'🇫🇷',UA:'🇺🇦',TR:'🇹🇷',IR:'🇮🇷',KR:'🇰🇷',GB:'🇬🇧',JP:'🇯🇵',SG:'🇸🇬',AU:'🇦🇺',CA:'🇨🇦',PL:'🇵🇱'};
    const uniqIPs = new Set(alerts.map(a=>a.ip)).size;
    const uniqCN  = new Set(alerts.filter(a=>a.country).map(a=>a.country)).size;
    const timeSince = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60) return 'jetzt'; if(s<3600) return Math.floor(s/60)+'m'; return Math.floor(s/3600)+'h'; };

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left">
          <i class="ti ti-shield-check"></i>CrowdSec
          <span class="pill ${cs.online?'pill-g':'pill-r'}">${cs.online?'Online':'Offline'}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:11px">
          <span class="c-red">${cs.totalAlerts||alerts.length} Angriffe</span>
          <span class="c-muted">${uniqIPs} IPs</span>
          <span class="c-muted">${uniqCN} Länder</span>
        </div>
      </div>
      <div class="widget-body no-pad">
        ${alerts.slice(0,12).map(a => {
          const tp = types[a.type] || types.other;
          const flag = a.country ? (flags[a.country]||'🌐') : '🌐';
          const ago = a.createdAt ? timeSince(a.createdAt) : '–';
          return `<div class="cs-event">
            <div class="cs-dot" style="background:${tp.color}"></div>
            <span>${flag}</span>
            <span class="cs-ip">${esc(a.ip||'–')}</span>
            ${a.country?`<span class="c-muted" style="font-size:10px">${a.country}</span>`:''}
            <span class="cs-type-pill" style="color:${tp.color};background:${tp.bg}">${tp.label}</span>
            <span class="cs-time">${ago}</span>
          </div>`;
        }).join('') || `<div style="padding:20px;text-align:center;color:var(--mu);font-size:12px">Keine Ereignisse</div>`}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADGUARD WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-adguard', title: 'AdGuard', icon: 'ti-shield-check', minW: 2, minH: 3,
  render(snap, el) {
    const ag = snap?.adguard || {};
    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left">
          <i class="ti ti-shield-check"></i>AdGuard Home
          <span class="pill ${ag.online?'pill-g':'pill-r'}">${ag.online?'Online':'Offline'}</span>
        </div>
        <span style="font-size:11px;color:var(--mu)">${ag.version||''}</span>
      </div>
      <div class="widget-body">
        <div class="sys-metrics">
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-search"></i>Anfragen</div>
            <div class="sys-m-val">${(ag.queries||0).toLocaleString()}</div>
            <div class="sys-m-sub">heute</div>
          </div>
          <div class="sys-metric">
            <div class="sys-m-label"><i class="ti ti-ban"></i>Geblockt</div>
            <div class="sys-m-val c-red">${ag.blockedPct||0}%</div>
            <div class="sys-m-sub">${(ag.blocked||0).toLocaleString()} Anfragen</div>
            <div class="sys-bar"><div class="sys-bar-fill" style="width:${ag.blockedPct||0}%;background:var(--rd)"></div></div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:11px;font-weight:600;color:var(--mu);margin-bottom:6px">TOP GEBLOCKT</div>
        ${(ag.topBlocked||[]).slice(0,6).map(d=>`
          <div class="ag-row">
            <span class="ag-domain">${esc(d.name||d)}</span>
            <span class="ag-cnt">${(d.count||0).toLocaleString()}×</span>
          </div>
        `).join('') || `<div style="text-align:center;color:var(--mu);font-size:11px;padding:10px">Keine Daten</div>`}
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// APPS LAUNCHER WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-apps', title: 'Apps', icon: 'ti-apps', minW: 3, minH: 2,
  render(snap, el, apps) {
    const list = (apps||[]).filter(a=>a.pinned);
    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-apps"></i>Schnellzugriff</div>
        <button class="link-btn" onclick="window.switchView('apps')">Alle →</button>
      </div>
      <div class="widget-body no-pad">
        <div class="apps-launcher-grid">
          ${list.map(a=>`
            <button class="al-btn" onclick="window.open('${esc(a.url)}','_blank','noopener')" title="${esc(a.url)}">
              <div class="al-ico" style="background:${a.bg}"><i class="ti ${a.icon}" style="color:${a.ic}"></i></div>
              ${esc(a.name)}
            </button>
          `).join('') || `<div style="padding:16px;color:var(--mu);font-size:12px">Noch keine Apps. <button class="link-btn" onclick="document.getElementById('open-add-app').click()">App hinzufügen →</button></div>`}
        </div>
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// UNRAID OVERVIEW WIDGET  (shows all configured servers)
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-unraid', title: 'Unraid Server', icon: 'ti-server', minW: 4, minH: 3,
  render(snap, el) {
    const servers = snap?.unraidServers || [];
    if (!servers.length) {
      el.innerHTML = `
        <div class="widget-hd"><div class="widget-hd-left"><i class="ti ti-server"></i>Unraid Server</div></div>
        <div class="widget-body" style="text-align:center;color:var(--mu);font-size:12px;padding:20px">
          Keine Server konfiguriert. <button class="link-btn" onclick="window.switchView('settings')">Einstellungen →</button>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="widget-hd">
        <div class="widget-hd-left"><i class="ti ti-server"></i>Unraid Server</div>
        <button class="link-btn" onclick="window.switchView('unraid')">Details →</button>
      </div>
      <div class="widget-body no-pad">
        <div class="unraid-servers-grid" style="padding:10px;gap:10px">
          ${servers.map(s => {
            const mem = s.info?.memory || {};
            const totalGB = mem.total ? Math.round(mem.total/1073741824) : 0;
            const freeGB  = mem.free  ? Math.round(mem.free /1073741824) : 0;
            const usedPct = totalGB ? Math.round((totalGB-freeGB)/totalGB*100) : 0;
            const cap = s.array?.capacity || {};
            const arrPct = cap.total ? Math.round(cap.used/cap.total*100) : 0;
            const cpu = s.info?.cpu || {};
            const disks = s.array?.disks || [];
            const shares = s.shares || [];
            return `<div class="unraid-server-card" style="min-width:0">
              <div class="usc-hd">
                <i class="ti ti-server"></i>${esc(s.name)}
                <span class="usc-online pill ${s.online?'pill-g':'pill-r'}">${s.online?'Online':'Offline/Demo'}</span>
                <span style="font-size:10px;color:var(--mu);margin-left:auto">v${s.info?.os?.version||'–'}</span>
              </div>
              <div class="usc-kpis">
                <div class="usc-kpi">
                  <div class="usc-kpi-v">${cpu.cores||'–'}</div>
                  <div class="usc-kpi-l">CPU Kerne</div>
                </div>
                <div class="usc-kpi">
                  <div class="usc-kpi-v" style="color:${barColor(usedPct)}">${totalGB}GB</div>
                  <div class="usc-kpi-l">RAM (${usedPct}% genutzt)</div>
                </div>
                <div class="usc-kpi">
                  <div class="usc-kpi-v" style="color:${barColor(arrPct)}">${arrPct}%</div>
                  <div class="usc-kpi-l">Array (${cap.used||0}/${cap.total||0}G)</div>
                </div>
                <div class="usc-kpi">
                  <div class="usc-kpi-v">${disks.filter(d=>d.type!=='Parity').length}</div>
                  <div class="usc-kpi-l">Datenträger</div>
                </div>
              </div>
              <div style="padding:8px 12px;font-size:11px;color:var(--mu)">
                Array: <b>${s.array?.state||'–'}</b> · 
                Shares: <b>${shares.length}</b> · 
                VMs: <b>${(s.vms||[]).length}</b>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// QUICK STATS WIDGET  (tiny 4-kpi card)
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-quickstats', title: 'Schnellübersicht', icon: 'ti-chart-bar', minW: 2, minH: 2,
  render(snap, el) {
    const cts   = snap?.containers || [];
    const sys   = snap?.system || {};
    const unr   = snap?.unraidServers?.[0] || {};
    const run   = cts.filter(c=>c.status==='running').length;
    const arrState = unr.array?.state;

    const kpis = [
      { label:'Container',  val:run,                         sub:`${cts.length-run} gestoppt`,   color:run?'var(--gn)':'var(--mu)' },
      { label:'CPU',        val:(sys.cpu?.pct||0).toFixed(1)+'%', sub:`${sys.cpu?.cores||0} Kerne`, color:barColor(sys.cpu?.pct||0) },
      { label:'RAM',        val:(sys.ram?.pct||0)+'%',       sub:`${(sys.ram?.usedGB||0).toFixed(1)}/${(sys.ram?.totalGB||0).toFixed(1)}GB`, color:barColor(sys.ram?.pct||0) },
      { label:'Array',      val:arrState||'–',               sub:unr.config?.name||'Unraid',     color:arrState==='Started'?'var(--gn)':'var(--mu)' },
    ];

    el.innerHTML = `
      <div class="widget-hd"><div class="widget-hd-left"><i class="ti ti-chart-bar"></i>Schnellübersicht</div></div>
      <div class="widget-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;height:100%">
          ${kpis.map(k=>`
            <div class="sys-metric">
              <div class="sys-m-label">${k.label}</div>
              <div class="sys-m-val" style="color:${k.color};font-size:18px">${k.val}</div>
              <div class="sys-m-sub">${k.sub}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK WIDGET
// ═══════════════════════════════════════════════════════════════════════════
reg({
  id: 'w-network', title: 'Netzwerk', icon: 'ti-network', minW: 2, minH: 2,
  render(snap, el) {
    const ifaces = snap?.system?.network || [];
    el.innerHTML = `
      <div class="widget-hd"><div class="widget-hd-left"><i class="ti ti-network"></i>Netzwerk</div></div>
      <div class="widget-body">
        ${ifaces.map(n=>`
          <div style="margin-bottom:10px">
            <div style="font-size:12px;font-weight:500;margin-bottom:4px">${esc(n.iface)}</div>
            <div style="display:flex;gap:12px;font-size:12px">
              <span class="c-green">↓ <span id="iface-rx-${esc(n.iface)}">–</span></span>
              <span class="c-blue">↑ <span id="iface-tx-${esc(n.iface)}">–</span></span>
            </div>
          </div>
        `).join('') || `<div style="text-align:center;color:var(--mu);font-size:12px;padding:16px">Keine Netzwerkdaten</div>`}
      </div>`;
  }
});
