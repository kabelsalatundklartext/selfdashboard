// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/_shared/plugin-server-cache.ts
function createPluginServerCache(options) {
  const maxEntries = Math.max(1, options.maxEntries ?? 32);
  const ttlMs = Math.max(0, options.ttlMs);
  const cache = /* @__PURE__ */ new Map();
  function evictIfNeeded() {
    while (cache.size >= maxEntries) {
      const first = cache.keys().next().value;
      if (!first) break;
      cache.delete(first);
    }
  }
  return {
    get(key) {
      const entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key, data) {
      if (ttlMs <= 0) return;
      evictIfNeeded();
      cache.set(key, { expires: Date.now() + ttlMs, data });
    },
    delete(key) {
      cache.delete(key);
    },
    clear() {
      cache.clear();
    }
  };
}

// plugins-pack/docker/lib/dockerEngine.ts
import * as http from "node:http";
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
var MIN_SYSTEM_CPU_DELTA_NS = BigInt(1e7);

// plugins-pack/crowdsec/lib/crowdsecDocker.ts
function findContainerId(containerName) {
  return dockerGet("/containers/json?all=1").then((r) => {
    if (!r.ok) throw new Error("docker_unavailable");
    const list = JSON.parse(r.body);
    const needle = containerName.replace(/^\//, "");
    const hit = list.find(
      (c) => (c.Names ?? []).some((n) => {
        const base = n.replace(/^\//, "");
        return base === needle || base.endsWith(`/${needle}`);
      })
    );
    if (!hit?.Id) throw new Error("crowdsec_container_not_found");
    return hit.Id;
  });
}
async function dockerExec(containerName, cmd, timeoutMs = 3e4) {
  const id = await findContainerId(containerName);
  const create = await dockerRequest(
    "POST",
    `/containers/${id}/exec`,
    JSON.stringify({ AttachStdout: true, AttachStderr: true, Cmd: cmd })
  );
  if (!create.ok) throw new Error(`docker_exec_create_${create.status}`);
  const execId = JSON.parse(create.body).Id;
  if (!execId) throw new Error("docker_exec_no_id");
  const start = await dockerRequest(
    "POST",
    `/exec/${execId}/start`,
    JSON.stringify({ Detach: false, Tty: false }),
    timeoutMs
  );
  if (!start.ok) throw new Error(`docker_exec_start_${start.status}`);
  const inspect = await dockerGet(`/exec/${execId}/json`);
  if (inspect.ok) {
    try {
      const code = Number(JSON.parse(inspect.body).ExitCode ?? 1);
      if (code !== 0) throw new Error(`cscli_exit_${code}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("cscli_exit_")) throw e;
    }
  }
}
async function crowdsecUnbanIp(containerName, ip) {
  const trimmed = ip.trim();
  if (!trimmed || !/^[\d.a-fA-F:]+$/.test(trimmed)) throw new Error("invalid_ip");
  try {
    await dockerExec(containerName, ["cscli", "decisions", "delete", "--ip", trimmed]);
  } catch {
  }
  try {
    await dockerExec(containerName, ["cscli", "alerts", "delete", "--ip", trimmed]);
  } catch {
  }
}

// plugins-pack/crowdsec/lib/crowdsecDb.ts
import fs2 from "fs";
import path2 from "path";
import Database from "better-sqlite3";

// plugins-pack/crowdsec/lib/crowdsecGeoip.ts
import fs from "fs";
import path from "path";
import maxmind from "maxmind";
var readerCache = null;
function isPublicIp(ip) {
  if (!ip || !/^[\d.a-fA-F:]+$/.test(ip)) return false;
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return false;
    if (lower.startsWith("fe80")) return false;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
    return true;
  }
  const p = ip.split(".").map((x) => Number(x));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  if (p[0] === 10 || p[0] === 127) return false;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false;
  if (p[0] === 192 && p[1] === 168) return false;
  if (p[0] === 169 && p[1] === 254) return false;
  return true;
}
function geoipCandidatePaths() {
  const roots = /* @__PURE__ */ new Set();
  if (process.env.CROWDSEC_GEOIP_PATH?.trim()) {
    roots.add(path.resolve(process.env.CROWDSEC_GEOIP_PATH.trim()));
  }
  const dataDir = process.env.CROWDSEC_DATA_DIR || "/crowdsec-data";
  roots.add(path.resolve(dataDir));
  roots.add(path.resolve("/crowdsec-data"));
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.add(path.resolve(process.env.SELFDASHBOARD_DATA_DIR));
  }
  roots.add("/usr/share/GeoIP");
  roots.add("/usr/local/share/GeoIP");
  roots.add("/var/lib/crowdsec/geoip");
  const fileNames = [
    "GeoLite2-City.mmdb",
    "GeoLite2-Country.mmdb",
    "geoip/GeoLite2-City.mmdb",
    "geoip/GeoLite2-Country.mmdb",
    "GeoIP/GeoLite2-City.mmdb",
    "GeoIP/GeoLite2-Country.mmdb"
  ];
  const candidates = [];
  for (const root of roots) {
    if (root.toLowerCase().endsWith(".mmdb")) {
      candidates.push(root);
      continue;
    }
    for (const name of fileNames) {
      candidates.push(path.join(root, name));
    }
  }
  return [...new Set(candidates)];
}
function findGeoipDatabase() {
  for (const p of geoipCandidatePaths()) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
    }
  }
  return null;
}
async function createGeoipLookup() {
  const dbPath = findGeoipDatabase();
  if (!dbPath) return null;
  try {
    if (!readerCache || readerCache.path !== dbPath) {
      const reader2 = await maxmind.open(dbPath);
      readerCache = { path: dbPath, reader: reader2 };
    }
    const reader = readerCache.reader;
    return {
      dbPath,
      lookup(ip) {
        if (!isPublicIp(ip)) return { country: "", city: "", lat: null, lon: null };
        try {
          const hit = reader.get(ip);
          if (!hit) return { country: "", city: "", lat: null, lon: null };
          const country = hit.country?.iso_code?.trim().toUpperCase() || "";
          const city = hit.city?.names?.en || hit.city?.names?.de || (hit.city?.names ? Object.values(hit.city.names)[0] : "") || "";
          const lat = typeof hit.location?.latitude === "number" ? hit.location.latitude : null;
          const lon = typeof hit.location?.longitude === "number" ? hit.location.longitude : null;
          return { country, city: typeof city === "string" ? city : "", lat, lon };
        } catch {
          return { country: "", city: "", lat: null, lon: null };
        }
      }
    };
  } catch {
    readerCache = null;
    return null;
  }
}
function normalizeCountryCode(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s || s === "??" || s === "XX" || s === "UNKNOWN") return "";
  if (/^[A-Z]{2}$/.test(s)) return s;
  return "";
}
function applyGeoipToCountry(ip, country, city, geoip) {
  const cc = normalizeCountryCode(country);
  const c = city?.trim() || "";
  const g = geoip ? geoip.lookup(ip) : null;
  const lat = g?.lat ?? null;
  const lon = g?.lon ?? null;
  if (cc) return { country: cc, city: c || (g?.city ?? ""), lat, lon };
  if (g?.country) return { country: g.country, city: g.city || c, lat, lon };
  return { country: "??", city: c, lat, lon };
}

// plugins-pack/crowdsec/lib/crowdsecDb.ts
function isUsableIp(ip) {
  if (!ip) return false;
  if (ip === "0.0.0.0" || ip === "::") return false;
  return /^[\d.a-fA-F:]+$/.test(ip);
}
function extractIpFromSerialized(raw) {
  if (!raw) return "";
  const m = raw.match(/"source_ip"\s*:\s*"([^"]+)"/) || raw.match(/"ip"\s*:\s*"([^"]+)"/);
  return m?.[1]?.trim() ?? "";
}
function extractMetaFromSerialized(raw) {
  if (!raw) return { country: "", city: "" };
  const tryParse = () => {
    const t = raw.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) return null;
    try {
      const walk = (v) => {
        if (!v || typeof v !== "object") return null;
        if (Array.isArray(v)) {
          for (const x of v) {
            const hit = walk(x);
            if (hit?.country) return hit;
          }
          return null;
        }
        const o = v;
        const city2 = typeof o.City === "string" ? o.City : typeof o.city === "string" ? o.city : "";
        for (const key of ["IsoCode", "iso_code", "country_code", "CountryCode", "GeoIsoCode", "country"]) {
          const val = o[key];
          if (typeof val === "string" && /^[A-Za-z]{2}$/.test(val.trim())) {
            return { country: val.trim().toUpperCase(), city: city2 };
          }
        }
        for (const val of Object.values(o)) {
          const hit = walk(val);
          if (hit?.country) return hit;
        }
        return city2 ? { country: "", city: city2 } : null;
      };
      return walk(JSON.parse(t));
    } catch {
      return null;
    }
  };
  const parsed = tryParse();
  if (parsed?.country) return parsed;
  const countryPatterns = [
    /"IsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"iso_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"country_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"CountryCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"GeoIsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"country"\s*:\s*"([A-Za-z]{2})"/i
  ];
  let country = "";
  for (const re of countryPatterns) {
    const m = raw.match(re);
    if (m?.[1]) {
      country = m[1].toUpperCase();
      break;
    }
  }
  const city = raw.match(/"City"\s*:\s*"([^"]+)"/i)?.[1] ?? raw.match(/"city"\s*:\s*"([^"]+)"/)?.[1] ?? "";
  return { country, city };
}
function parseTimestampValue(v) {
  if (v === null || v === void 0 || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1e3 : v;
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  const s = String(v).trim();
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    const ms = n < 1e12 ? n * 1e3 : n;
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  const d = new Date(s.replace(" ", "T"));
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}
function parseCreatedAt(row) {
  for (const v of [row.created_at, row.started_at, row.stopped_at]) {
    const d = parseTimestampValue(v);
    if (d) return d;
  }
  return null;
}
function pickCol(names, candidates, fallback = "''") {
  for (const c of candidates) {
    if (names.has(c)) return `a.${c}`;
  }
  return fallback;
}
function decisionUntilUnixSecExpr(alias = "d") {
  const col = `${alias}.until`;
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`;
}
function decisionUntilClause(alias = "d") {
  const untilSec = decisionUntilUnixSecExpr(alias);
  return `(${untilSec} IS NOT NULL AND ${untilSec} > CAST(strftime('%s', 'now') AS INTEGER))`;
}
function decisionSchemaMeta(db) {
  const decisionTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'").all();
  if (decisionTables.length === 0) {
    return {
      hasTable: false,
      linkCol: null,
      hasUntil: false,
      hasValue: false,
      hasScope: false,
      hasSimulated: false,
      hasOrigin: false
    };
  }
  const dCols = db.prepare("PRAGMA table_info(decisions)").all();
  const dNames = new Set(dCols.map((c) => c.name));
  const linkCol = dNames.has("alert_decisions") ? "alert_decisions" : dNames.has("alert_id") ? "alert_id" : null;
  return {
    hasTable: true,
    linkCol,
    hasUntil: dNames.has("until"),
    hasValue: dNames.has("value"),
    hasScope: dNames.has("scope"),
    hasSimulated: dNames.has("simulated"),
    hasOrigin: dNames.has("origin")
  };
}
function activeDecisionWhere(meta) {
  const parts = [];
  if (!meta.hasUntil) return "WHERE 1=0";
  parts.push(decisionUntilClause("d"));
  if (meta.hasSimulated) {
    parts.push(`(d.simulated IS NULL OR d.simulated = 0)`);
  }
  if (meta.hasScope) {
    parts.push(
      `(d.scope IS NULL OR TRIM(CAST(d.scope AS TEXT)) = '' OR LOWER(TRIM(CAST(d.scope AS TEXT))) IN ('ip', 'range'))`
    );
  }
  if (meta.hasOrigin) {
    parts.push(
      `(d.origin IS NULL OR LOWER(TRIM(CAST(d.origin AS TEXT))) NOT IN ('capi', 'lists', 'listfile'))`
    );
  }
  return `WHERE ${parts.join(" AND ")}`;
}
function loadActiveBannedIpSet(db) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable || !meta.hasValue) return /* @__PURE__ */ new Set();
  const rows = db.prepare(
    `SELECT DISTINCT TRIM(CAST(d.value AS TEXT)) AS ip FROM decisions d ${activeDecisionWhere(meta)}`
  ).all();
  const out = /* @__PURE__ */ new Set();
  for (const r of rows) {
    const ip = r.ip?.trim() ?? "";
    if (isUsableIp(ip)) out.add(ip);
  }
  return out;
}
function loadAlertIdsWithActiveBan(db) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable || !meta.linkCol) return /* @__PURE__ */ new Set();
  const rows = db.prepare(
    `SELECT DISTINCT d.${meta.linkCol} AS alert_id FROM decisions d ${activeDecisionWhere(meta)}`
  ).all();
  const out = /* @__PURE__ */ new Set();
  for (const r of rows) {
    const id = Number(r.alert_id);
    if (Number.isFinite(id) && id > 0) out.add(id);
  }
  return out;
}
function loadActiveBanFeed(db, geoip) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable || !meta.hasValue) return [];
  const cols = db.prepare("PRAGMA table_info(decisions)").all();
  const names = new Set(cols.map((c) => c.name));
  const scenarioExpr = names.has("scenario") ? "d.scenario" : "''";
  const createdExpr = names.has("created_at") ? "d.created_at" : names.has("updated_at") ? "d.updated_at" : "NULL";
  const rows = db.prepare(
    `SELECT TRIM(CAST(d.value AS TEXT)) AS ip,
              ${scenarioExpr} AS scenario,
              ${createdExpr} AS created_at
       FROM decisions d
       ${activeDecisionWhere(meta)}
       ORDER BY ${createdExpr} DESC`
  ).all();
  const seen = /* @__PURE__ */ new Set();
  const feed = [];
  for (const row of rows) {
    const ip = row.ip?.trim() ?? "";
    if (!isUsableIp(ip) || seen.has(ip)) continue;
    seen.add(ip);
    const dt = parseTimestampValue(row.created_at) ?? /* @__PURE__ */ new Date();
    const geo = applyGeoipToCountry(ip, "", "", geoip);
    feed.push({
      alertId: 0,
      ip,
      country: geo.country,
      city: geo.city,
      scenario: cleanScenario(row.scenario ? String(row.scenario) : "ban"),
      time_iso: dt.toISOString(),
      asname: "",
      asnumber: "",
      iprange: formatIpRange(ip, null),
      active_ban: true,
      lat: geo.lat,
      lon: geo.lon
    });
  }
  return feed;
}
function createdAtUnixSecExpr(alias = "a") {
  const col = `${alias}.created_at`;
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`;
}
function countAlertsSince(db, cutoffUnix) {
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("created_at")) return 0;
  const base = "a.scenario IS NOT NULL AND TRIM(a.scenario) != '' AND TRIM(a.scenario) != 'unknown'";
  const ts = createdAtUnixSecExpr("a");
  const row = cutoffUnix > 0 ? db.prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${ts} >= ? AND ${base}`).get(cutoffUnix) : db.prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${base}`).get();
  return Number(row?.c ?? 0);
}
function formatAsNumber(v) {
  const s = v.trim();
  if (!s) return "";
  return s.toUpperCase().startsWith("AS") ? s.toUpperCase() : `AS${s}`;
}
function formatIpRange(ip, range) {
  const r = range?.trim();
  if (r && r.includes("/")) return r;
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  return "";
}
function cleanScenario(s) {
  return s.replace(/^crowdsecurity\//i, "").trim() || "unknown";
}
function resolveCountryFromRow(row, geoip) {
  const scenario = row.scenario ? String(row.scenario).trim() : "";
  if (!scenario || scenario === "unknown") return null;
  let ip = row.ip ? String(row.ip).trim() : "";
  if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized);
  if (!isUsableIp(ip)) return null;
  const meta = extractMetaFromSerialized(row.event_serialized);
  let country = row.country ? String(row.country).trim().toUpperCase() : "";
  if (!country || country === "??") country = meta.country || "";
  const geo = applyGeoipToCountry(ip, country, meta.city, geoip);
  country = geo.country;
  if (!country || country === "??") return null;
  return country;
}
function countriesFromRows(rows, geoip) {
  const countryMap = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const country = resolveCountryFromRow(row, geoip);
    if (!country) continue;
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }
  return [...countryMap.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
}
function loadCountriesFromDatabase(db, geoip) {
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  const countryCol = names.has("source_country") ? "a.source_country" : names.has("country") ? "a.country" : null;
  if (countryCol) {
    const rows2 = db.prepare(
      `SELECT UPPER(TRIM(CAST(${countryCol} AS TEXT))) AS country, COUNT(*) AS count
         FROM alerts a
         WHERE TRIM(COALESCE(a.scenario, '')) != '' AND TRIM(a.scenario) != 'unknown'
           AND TRIM(COALESCE(${countryCol}, '')) != ''
           AND UPPER(TRIM(CAST(${countryCol} AS TEXT))) != '??'
         GROUP BY country
         HAVING country != ''
         ORDER BY count DESC`
    ).all();
    return rows2.map((r) => ({ country: r.country, count: Number(r.count) }));
  }
  const cutoff90 = Math.floor((Date.now() - 90 * 864e5) / 1e3);
  const { sql, params } = buildAlertsSql(db, cutoff90, { includeEvents: false });
  const rows = db.prepare(`${sql}
LIMIT 15000`).all(...params);
  return countriesFromRows(rows, geoip);
}
function buildAlertsSql(db, cutoffUnix, opts = {}) {
  const includeEvents = opts.includeEvents !== false;
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  const ipParts = [];
  if (names.has("source_ip")) ipParts.push("a.source_ip");
  if (names.has("source_value")) ipParts.push("a.source_value");
  const ipExpr = ipParts.length ? `COALESCE(${ipParts.join(", ")})` : "''";
  const countryCol = pickCol(names, ["source_country", "country"]);
  const asNameCol = pickCol(names, ["source_as_name", "as_name"]);
  const asNumCol = pickCol(names, ["source_as_number", "as_number"]);
  const rangeCol = pickCol(names, ["source_range", "ip_range"]);
  const latCol = pickCol(names, ["source_latitude", "latitude"], "0");
  const lonCol = pickCol(names, ["source_longitude", "longitude"], "0");
  const startedCol = names.has("started_at") ? "a.started_at" : "NULL";
  const stoppedCol = names.has("stopped_at") ? "a.stopped_at" : "NULL";
  const eventTables = includeEvents ? db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").all() : [];
  const eventSerializedExpr = eventTables.length > 0 ? `(SELECT e.serialized FROM events e WHERE e.alert_events = a.id ORDER BY e.id DESC LIMIT 1)` : "NULL";
  const whereParts = ["TRIM(COALESCE(a.scenario, '')) != ''", "TRIM(a.scenario) != 'unknown'"];
  const params = [];
  if (cutoffUnix > 0) {
    whereParts.unshift(`${createdAtUnixSecExpr("a")} >= ?`);
    params.push(cutoffUnix);
  }
  const sql = `
SELECT
  a.id,
  a.scenario,
  ${ipExpr} AS ip,
  ${countryCol} AS country,
  ${asNameCol} AS as_name,
  ${asNumCol} AS as_number,
  ${rangeCol} AS ip_range,
  ${latCol} AS latitude,
  ${lonCol} AS longitude,
  a.created_at,
  ${startedCol} AS started_at,
  ${stoppedCol} AS stopped_at,
  ${eventSerializedExpr} AS event_serialized
FROM alerts a
WHERE ${whereParts.join(" AND ")}
ORDER BY a.created_at DESC
`;
  return { sql, params };
}
var ALLOWED_DB_ROOTS = () => {
  const roots = [
    path2.resolve(process.env.CROWDSEC_DATA_DIR || "/crowdsec-data"),
    path2.resolve("/crowdsec-data")
  ];
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.push(path2.resolve(process.env.SELFDASHBOARD_DATA_DIR));
  }
  return [...new Set(roots)];
};
function resolveCrowdsecDbPath(userPath) {
  const trimmed = userPath.trim() || "/crowdsec-data/crowdsec.db";
  const resolved = path2.resolve(trimmed);
  const allowed = ALLOWED_DB_ROOTS().some(
    (root) => resolved === root || resolved.startsWith(`${root}${path2.sep}`)
  );
  if (!allowed) throw new Error("db_path_not_allowed");
  if (!fs2.existsSync(resolved)) throw new Error("db_not_found");
  if (!fs2.statSync(resolved).isFile()) throw new Error("db_not_a_file");
  return resolved;
}
var dashboardInflight = null;
var dashboardInflightKey = "";
async function loadCrowdsecDashboard(dbPath, opts = {}) {
  const key = `${dbPath}|${opts.daysBack ?? 30}|${opts.maxAlerts ?? 2e3}`;
  if (dashboardInflight && dashboardInflightKey === key) return dashboardInflight;
  dashboardInflightKey = key;
  dashboardInflight = loadCrowdsecDashboardInner(dbPath, opts).finally(() => {
    dashboardInflight = null;
    dashboardInflightKey = "";
  });
  return dashboardInflight;
}
async function loadCrowdsecDashboardInner(dbPath, opts = {}) {
  const daysBackRaw = opts.daysBack ?? 30;
  const daysBack = daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, daysBackRaw));
  const maxAlertsRaw = opts.maxAlerts ?? 2e3;
  const maxAlerts = maxAlertsRaw === 0 ? 0 : Math.min(5e4, Math.max(50, maxAlertsRaw));
  const cutoffUnix = daysBack === 0 ? 0 : Math.floor((Date.now() - daysBack * 864e5) / 1e3);
  const geoip = await createGeoipLookup();
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const alertsInRange = countAlertsSince(db, cutoffUnix);
    const alertsLast24h = alertsInRange;
    const bannedIps = loadActiveBannedIpSet(db);
    const activeBans = bannedIps.size;
    const bannedAlertIds = loadAlertIdsWithActiveBan(db);
    const banFeed = loadActiveBanFeed(db, geoip);
    const { sql, params } = buildAlertsSql(db, cutoffUnix);
    const rows = maxAlerts > 0 ? db.prepare(`${sql}
LIMIT ?`).all(...params, maxAlerts) : db.prepare(sql).all(...params);
    const feed = [];
    const feedSeen = /* @__PURE__ */ new Set();
    const scenarios = /* @__PURE__ */ new Set();
    for (const row of rows) {
      const scenario = row.scenario ? String(row.scenario).trim() : "";
      if (!scenario || scenario === "unknown") continue;
      let ip = row.ip ? String(row.ip).trim() : "";
      if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized);
      if (!isUsableIp(ip)) continue;
      const dt = parseCreatedAt(row);
      if (!dt) continue;
      const meta = extractMetaFromSerialized(row.event_serialized);
      let country = row.country ? String(row.country).trim().toUpperCase() : "";
      if (!country || country === "??") country = meta.country || "";
      let city = meta.city;
      const geo = applyGeoipToCountry(ip, country, city, geoip);
      country = geo.country;
      city = geo.city;
      const isBan = bannedAlertIds.has(row.id) || bannedIps.has(ip);
      scenarios.add(cleanScenario(scenario));
      const feedKey = `${row.id}|${ip}`;
      if (!feedSeen.has(feedKey)) {
        feedSeen.add(feedKey);
        feed.push({
          alertId: row.id,
          ip,
          country,
          city,
          scenario: cleanScenario(scenario),
          time_iso: dt.toISOString(),
          asname: row.as_name ? String(row.as_name) : "",
          asnumber: formatAsNumber(row.as_number != null ? String(row.as_number) : ""),
          iprange: formatIpRange(ip, row.ip_range),
          active_ban: isBan,
          lat: geo.lat,
          lon: geo.lon
        });
      }
    }
    const countries = loadCountriesFromDatabase(db, geoip);
    return {
      feed,
      banFeed,
      alertsInRange,
      alertsLast24h,
      activeBans,
      countryCount: countries.length,
      scenarioCount: scenarios.size,
      countries,
      geoip: {
        enabled: Boolean(geoip),
        path: geoip?.dbPath ?? null
      }
    };
  } finally {
    db.close();
  }
}

// plugins-pack/crowdsec/server.ts
var dashboardCache = createPluginServerCache({
  ttlMs: Math.max(0, Number(process.env.CROWDSEC_DASHBOARD_CACHE_MS) || 2e4),
  maxEntries: 16
});
async function handleDashboardGet(req) {
  const sp = new URL(req.url).searchParams;
  const dbPath = sp.get("dbPath")?.trim() || process.env.CROWDSEC_DB_PATH || "/crowdsec-data/crowdsec.db";
  const daysBackRaw = Number(sp.get("daysBack") ?? 30);
  const daysBack = daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, Number.isFinite(daysBackRaw) ? daysBackRaw : 30));
  const maxAlertsRaw = Number(sp.get("maxAlerts") ?? 500);
  const maxAlerts = maxAlertsRaw === 0 ? 0 : Math.min(2e3, Math.max(50, Number.isFinite(maxAlertsRaw) ? maxAlertsRaw : 500));
  const timeoutMs = Math.min(12e4, Math.max(15e3, Number(process.env.CROWDSEC_QUERY_TIMEOUT_MS) || 45e3));
  const cacheKey = `${dbPath}|${daysBack}|${maxAlerts}`;
  const cached = dashboardCache.get(cacheKey);
  if (cached) {
    return Response.json(cached, { headers: { "X-SD-Cache": "hit" } });
  }
  try {
    const resolved = resolveCrowdsecDbPath(dbPath);
    const data = await Promise.race([
      loadCrowdsecDashboard(resolved, { daysBack, maxAlerts }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("crowdsec_timeout")), timeoutMs);
      })
    ]);
    dashboardCache.set(cacheKey, data);
    return Response.json(data, { headers: { "X-SD-Cache": "miss" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "crowdsec_error";
    const status = msg === "crowdsec_timeout" ? 504 : msg === "missing_db_path" || msg === "db_not_found" || msg === "db_not_a_file" ? 404 : msg === "db_path_not_allowed" ? 403 : msg === "db_schema_unsupported" ? 422 : 502;
    void logPluginApiFailure("crowdsec", "dashboard", msg, { dbPath, status });
    return Response.json({ error: msg }, { status });
  }
}
async function handleDecisionPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? body : {};
  const ip = typeof o.ip === "string" ? o.ip.trim() : "";
  const container = typeof o.container === "string" && o.container.trim() ? o.container.trim() : process.env.CROWDSEC_CONTAINER || "crowdsec";
  if (!ip) return Response.json({ error: "missing_ip" }, { status: 400 });
  try {
    await crowdsecUnbanIp(container, ip);
    dashboardCache.clear();
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "delete_failed";
    const status = msg === "docker_unavailable" || msg === "crowdsec_container_not_found" ? 503 : msg === "invalid_ip" ? 400 : 502;
    return Response.json({ error: msg }, { status });
  }
}
async function crowdsecServerHandler(ctx) {
  const [seg] = ctx.path;
  const method = ctx.request.method.toUpperCase();
  if ((seg === "decision" || seg === "decisions") && method === "POST") {
    return handleDecisionPost(ctx.request);
  }
  if (method === "GET" && (!seg || seg === "dashboard")) {
    return handleDashboardGet(ctx.request);
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: ctx.path.join("/") },
    { status: 404 }
  );
}
export {
  crowdsecServerHandler
};
