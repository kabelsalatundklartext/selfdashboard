// sd-server-shim:plugin-log-stub
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? " " + JSON.stringify(detail).slice(0, 500) : "";
  console.error("[SelfDashboard][" + pluginId + "] " + operation + ": " + message + extra);
}

// plugins/docker/lib/dockerEngine.ts
import * as http from "node:http";

// plugins/docker/lib/dockerShared.ts
var CONTAINER_ID_RE = /^[a-f0-9]{8,128}$/i;

// plugins/docker/lib/dockerEngine.ts
function socketPath() {
  return process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock";
}
function dockerRequest(method, pathAndQuery, body, timeoutMs = 12e3) {
  return new Promise((resolve, reject) => {
    const payload = body ?? "";
    const headers = {
      Host: "localhost",
      Accept: "application/json"
    };
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload, "utf8");
    }
    const req = http.request(
      {
        socketPath: socketPath(),
        path: pathAndQuery,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
        });
        res.on("end", () => {
          const resBody = Buffer.concat(chunks).toString("utf8");
          const code = res.statusCode ?? 500;
          resolve({ ok: code >= 200 && code < 300, status: code, body: resBody });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Timeout beim Docker-Socket"));
    });
    if (payload) req.write(payload, "utf8");
    req.end();
  });
}
function dockerGet(pathAndQuery) {
  return dockerRequest("GET", pathAndQuery, void 0, 12e3);
}
var STATS_ONE_SHOT_TIMEOUT_MS = 6e3;
var MIN_SYSTEM_CPU_DELTA_NS = BigInt(1e7);
function parseDockerStatsJson(body) {
  try {
    const patched = body.replace(/"system_cpu_usage"\s*:\s*(\d+)/g, '"system_cpu_usage":"$1"').replace(/"total_usage"\s*:\s*(\d+)/g, '"total_usage":"$1"');
    return JSON.parse(patched, (key, val) => {
      if ((key === "system_cpu_usage" || key === "total_usage") && typeof val === "string" && /^\d+$/.test(val)) {
        return BigInt(val);
      }
      return val;
    });
  } catch {
    return null;
  }
}
function toBigU(v) {
  const zero = BigInt(0);
  if (typeof v === "bigint") return v >= zero ? v : zero;
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return BigInt(Math.trunc(v));
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  return zero;
}
function memoryUsageBytesNoCache(mem) {
  if (!mem) return null;
  const usageRaw = mem.usage;
  const limitRaw = mem.limit;
  const usageTotal = typeof usageRaw === "number" && Number.isFinite(usageRaw) && usageRaw >= 0 ? usageRaw : null;
  if (usageTotal == null) return null;
  const memLimitBytes = typeof limitRaw === "number" && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : null;
  const statsRaw = mem.stats;
  let memUsageBytes = usageTotal;
  if (statsRaw && typeof statsRaw === "object") {
    const st = statsRaw;
    const num = (k) => {
      const v = st[k];
      return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
    };
    const tif = num("total_inactive_file");
    if (tif != null && tif < usageTotal) memUsageBytes = usageTotal - tif;
    else {
      const inactiveFile = num("inactive_file");
      if (inactiveFile != null && inactiveFile < usageTotal) memUsageBytes = usageTotal - inactiveFile;
    }
  }
  return { usage: memUsageBytes, limit: memLimitBytes };
}
function parseOneShotStats(body) {
  const j = parseDockerStatsJson(body);
  if (!j) return null;
  const ms = j.memory_stats;
  const memParsed = memoryUsageBytesNoCache(ms);
  const memUsageBytes = memParsed ? memParsed.usage : null;
  const memLimitBytes = memParsed?.limit ?? null;
  const memPct = memUsageBytes != null && memLimitBytes != null && memLimitBytes > 0 ? Math.min(100, memUsageBytes / memLimitBytes * 100) : null;
  const cpu_stats = j.cpu_stats;
  const precpu_stats = j.precpu_stats;
  const cpuUsage = (x) => x?.cpu_usage ?? void 0;
  const totalUsage = (u) => toBigU(u?.total_usage);
  const ncpusFrom = (cs) => {
    const n = Number(cs?.online_cpus);
    if (Number.isFinite(n) && n > 0) return n;
    const per = cpuUsage(cs)?.percpu_usage;
    return Array.isArray(per) && per.length > 0 ? per.length : 1;
  };
  let cpuPct = null;
  if (cpu_stats && precpu_stats && Object.keys(precpu_stats).length > 0) {
    const cpuDelta = totalUsage(cpuUsage(cpu_stats)) - totalUsage(cpuUsage(precpu_stats));
    const sysDelta = toBigU(cpu_stats.system_cpu_usage) - toBigU(precpu_stats.system_cpu_usage);
    const ncpus = ncpusFrom(cpu_stats);
    if (sysDelta >= MIN_SYSTEM_CPU_DELTA_NS && cpuDelta > BigInt(0) && ncpus > 0) {
      const pRaw = cpuDelta * BigInt(ncpus) * BigInt(100) / sysDelta;
      const p = Number(pRaw);
      if (Number.isFinite(p)) cpuPct = Math.min(9999, Math.max(0, p));
    }
  }
  return { cpuPct, memUsageBytes, memLimitBytes, memPct };
}
async function fetchContainerStats(id) {
  try {
    const pathPrimed = `/containers/${encodeURIComponent(id)}/stats?stream=false&one-shot=false`;
    const pathLegacy = `/containers/${encodeURIComponent(id)}/stats?stream=false`;
    let r = await dockerRequest("GET", pathPrimed, void 0, STATS_ONE_SHOT_TIMEOUT_MS);
    if (!r.ok && r.status === 400) {
      r = await dockerRequest("GET", pathLegacy, void 0, STATS_ONE_SHOT_TIMEOUT_MS);
    }
    if (!r.ok) return null;
    return parseOneShotStats(r.body);
  } catch {
    return null;
  }
}
async function poolMap(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const nWorkers = Math.max(1, Math.min(concurrency, items.length || 1));
  const workers = Array.from({ length: items.length === 0 ? 0 : nWorkers }, async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

// plugins/docker/server.ts
function parseContainerAction(body) {
  if (!body || typeof body !== "object") return null;
  const o = body;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const action = o.action;
  if (!CONTAINER_ID_RE.test(id)) return null;
  if (action !== "start" && action !== "stop" && action !== "restart") return null;
  return { id, action };
}
async function handleListGet(req) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1" ? "true" : "false";
  const includeStats = searchParams.get("stats") === "1";
  try {
    const r = await dockerGet(`/containers/json?all=${all}`);
    if (!r.ok) {
      const err = r.body?.slice(0, 400) || `Docker HTTP ${r.status}`;
      void logPluginApiFailure("docker", "list", err, { status: r.status });
      return Response.json(
        { error: err },
        { status: r.status >= 400 && r.status < 600 ? r.status : 502 }
      );
    }
    let data;
    try {
      data = JSON.parse(r.body);
    } catch {
      return Response.json({ error: "Ung\xFCltige JSON-Antwort von Docker" }, { status: 502 });
    }
    if (includeStats && Array.isArray(data)) {
      const arr = data;
      const runningIds = [];
      for (const c of arr) {
        const id = typeof c.Id === "string" ? c.Id : "";
        if (c.State === "running" && CONTAINER_ID_RE.test(id)) runningIds.push(id);
      }
      const unique = [...new Set(runningIds)];
      const statsArray = await poolMap(unique, 8, async (id) => ({ id, stats: await fetchContainerStats(id) }));
      const byId = new Map(statsArray.map((x) => [x.id, x.stats]));
      for (const c of arr) {
        const id = typeof c.Id === "string" ? c.Id : "";
        if (c.State === "running" && CONTAINER_ID_RE.test(id)) {
          c.sdStats = byId.get(id) ?? null;
        } else {
          c.sdStats = null;
        }
      }
    }
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/EACCES|permission denied/i.test(msg)) {
      void logPluginApiFailure("docker", "list", "docker_socket_eacces");
      return Response.json(
        {
          error: "Kein Zugriff auf den Docker-Socket (EACCES). Unter Unraid: Extra Parameter --group-add=281 (oder GID von stat -c %g /var/run/docker.sock). Neuere Images laufen als root und umgehen das oft automatisch."
        },
        { status: 503 }
      );
    }
    const hint = msg.includes("ENOENT") || msg.includes("ENOTDIR") ? "Docker-Socket nicht gefunden \u2014 z. B. -v /var/run/docker.sock:/var/run/docker.sock am SelfDashboard-Container." : msg;
    void logPluginApiFailure("docker", "list", hint);
    return Response.json({ error: hint }, { status: 503 });
  }
}
async function handleActionPost(req) {
  let parsed;
  try {
    const raw = await req.text();
    let body;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      return Response.json({ error: "Ung\xFCltiges JSON" }, { status: 400 });
    }
    const p = parseContainerAction(body);
    if (!p) {
      return Response.json({ error: "Ung\xFCltige Parameter (id, action)" }, { status: 400 });
    }
    parsed = p;
  } catch {
    return Response.json({ error: "Body konnte nicht gelesen werden" }, { status: 400 });
  }
  const path = parsed.action === "start" ? `/containers/${encodeURIComponent(parsed.id)}/start` : parsed.action === "stop" ? `/containers/${encodeURIComponent(parsed.id)}/stop?t=10` : `/containers/${encodeURIComponent(parsed.id)}/restart?t=10`;
  try {
    const r = await dockerRequest("POST", path, "", 6e4);
    if (!r.ok) {
      let msg = r.body?.slice(0, 500) || `Docker HTTP ${r.status}`;
      try {
        const j = JSON.parse(r.body);
        if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
      } catch {
      }
      const status = r.status >= 400 && r.status < 600 ? r.status : 502;
      void logPluginApiFailure("docker", parsed.action, msg, { id: parsed.id, status: r.status });
      return Response.json({ error: msg }, { status });
    }
    return Response.json({ ok: true, action: parsed.action, id: parsed.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/EACCES|permission denied/i.test(msg)) {
      void logPluginApiFailure("docker", parsed.action, "docker_socket_eacces", { id: parsed.id });
      return Response.json(
        {
          error: "Kein Zugriff auf den Docker-Socket (EACCES). Unter Unraid: Extra Parameter --group-add=281 (oder GID von stat -c %g /var/run/docker.sock). Neuere Images laufen als root und umgehen das oft automatisch."
        },
        { status: 503 }
      );
    }
    void logPluginApiFailure("docker", parsed.action, msg, { id: parsed.id });
    return Response.json({ error: msg }, { status: 503 });
  }
}
async function dockerServerHandler(ctx) {
  const method = ctx.request.method.toUpperCase();
  const [seg] = ctx.path;
  if (method === "GET" && (!seg || seg === "containers")) {
    return handleListGet(ctx.request);
  }
  if (method === "POST" && (!seg || seg === "containers")) {
    return handleActionPost(ctx.request);
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: ctx.path.join("/") },
    { status: 404 }
  );
}
var server_default = dockerServerHandler;
export {
  server_default as default,
  dockerServerHandler
};
