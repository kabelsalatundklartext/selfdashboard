// node_modules/server-only/index.js
throw new Error(
  "This module cannot be imported from a Client Component module. It should only be used from a Server Component."
);

// src/lib/errorLog.ts
import { appendFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import { join as join2 } from "path";

// src/lib/dataDir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// src/lib/errorLogTypes.ts
var DEFAULT_LOG_SETTINGS = { retentionDays: 7 };
function isLogRetentionDays(n) {
  return n === 3 || n === 7 || n === 30;
}

// src/lib/errorLog.ts
var MAX_FILE_BYTES = 3e6;
var MAX_FIELD = 4e3;
var MAX_MESSAGE = 2e3;
var logFilePath = () => join2(dataDir(), "error-log.jsonl");
var settingsPath = () => join2(dataDir(), "log-settings.json");
function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function clampField(s, max) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\u2026`;
}
function sanitizeLogText(raw) {
  let s = raw;
  s = s.replace(/("password"\s*:\s*)"[^"]*"/gi, '$1"[redacted]"');
  s = s.replace(/(password=)[^&\s]+/gi, "$1[redacted]");
  s = s.replace(/(Authorization:\s*Basic\s+)[A-Za-z0-9+/=]+/gi, "$1[redacted]");
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]");
  return s;
}
async function readLogSettings() {
  try {
    const raw = await readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (isLogRetentionDays(parsed.retentionDays)) {
      return { retentionDays: parsed.retentionDays };
    }
  } catch {
  }
  return { ...DEFAULT_LOG_SETTINGS };
}
function retentionCutoff(days) {
  return Date.now() - days * 24 * 60 * 60 * 1e3;
}
function parseLine(line) {
  const t = line.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t);
    if (typeof o.id !== "string" || typeof o.ts !== "string" || typeof o.message !== "string") return null;
    return o;
  } catch {
    return null;
  }
}
async function readAllEntries() {
  try {
    const raw = await readFile(logFilePath(), "utf8");
    const lines = raw.split("\n");
    const out = [];
    for (const line of lines) {
      const e = parseLine(line);
      if (e) out.push(e);
    }
    return out;
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
    if (code === "ENOENT") return [];
    throw e;
  }
}
async function writeAllEntries(entries) {
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  const file = logFilePath();
  const body = entries.length ? `${entries.map((e) => JSON.stringify(e)).join("\n")}
` : "";
  const tmp = `${file}.tmp`;
  try {
    await writeFile(tmp, body, "utf8");
    await rename(tmp, file);
  } catch {
    await writeFile(file, body, "utf8");
  }
}
async function purgeExpiredLogs(retentionDays) {
  const days = retentionDays ?? (await readLogSettings()).retentionDays;
  const cutoff = retentionCutoff(days);
  const all = await readAllEntries();
  const kept = all.filter((e) => {
    const t = Date.parse(e.ts);
    return Number.isFinite(t) && t >= cutoff;
  });
  if (kept.length === all.length) return 0;
  await writeAllEntries(kept);
  return all.length - kept.length;
}
async function trimOversizedFile() {
  try {
    const raw = await readFile(logFilePath(), "utf8");
    if (Buffer.byteLength(raw, "utf8") <= MAX_FILE_BYTES) return;
    const entries = await readAllEntries();
    const drop = Math.max(1, Math.floor(entries.length * 0.25));
    await writeAllEntries(entries.slice(drop));
  } catch {
  }
}
async function appendErrorLog(input) {
  const settings = await readLogSettings();
  await purgeExpiredLogs(settings.retentionDays);
  const entry = {
    id: newId(),
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    level: input.level,
    source: input.source,
    category: input.category ? clampField(input.category, 120) : void 0,
    message: clampField(sanitizeLogText(input.message), MAX_MESSAGE),
    detail: input.detail ? clampField(sanitizeLogText(input.detail), MAX_FIELD) : void 0,
    pluginId: input.pluginId ? clampField(input.pluginId, 80) : void 0,
    instanceId: input.instanceId ? clampField(input.instanceId, 120) : void 0
  };
  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  await appendFile(logFilePath(), `${JSON.stringify(entry)}
`, "utf8");
  await trimOversizedFile();
  return entry;
}

// src/lib/pluginLogServer.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  try {
    await appendErrorLog({
      level: "error",
      source: "api",
      pluginId,
      category: `${pluginId}/${operation}`,
      message,
      detail: detail ? JSON.stringify(detail).slice(0, 4e3) : void 0
    });
  } catch {
  }
}

// plugins/weather/server.ts
var GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
var FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
var FETCH_TIMEOUT_MS = 1e4;
var FETCH_RETRIES = 1;
var CACHE_TTL_MS = 8 * 60 * 1e3;
var CACHE_MAX = 64;
var cache = /* @__PURE__ */ new Map();
function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    cache.delete(key);
    return null;
  }
  return e.data;
}
function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}
async function fetchOpenMeteo(url) {
  let lastErr;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { cache: "no-store", signal: ac.signal });
      if (res.ok || res.status < 500 || attempt === FETCH_RETRIES) return res;
      lastErr = new Error(`open_meteo_http_${res.status}`);
    } catch (e) {
      lastErr = e;
      if (attempt === FETCH_RETRIES) throw e;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("open_meteo_fetch_failed");
}
async function openMeteoGeocode(params) {
  const cc = params.countryCode?.trim().toUpperCase() ?? "";
  const cacheKey = `geo:${params.name.trim().toLowerCase()}:${cc}:${params.language}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const q = new URLSearchParams({
    name: params.name.trim(),
    count: "8",
    language: params.language,
    format: "json"
  });
  if (cc.length === 2) q.set("countryCode", cc);
  const res = await fetchOpenMeteo(`${GEOCODE_BASE}?${q}`);
  if (!res.ok) throw new Error(`geocode_http_${res.status}`);
  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}
async function openMeteoForecast(params) {
  const cacheKey = `fc:${params.latitude.toFixed(4)}:${params.longitude.toFixed(4)}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    timezone: "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m"
  });
  if (params.includeHourly) q.set("hourly", "temperature_2m");
  if (params.includeDaily) q.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  const days = params.includeDaily ? 8 : params.includeHourly ? 2 : 1;
  q.set("forecast_days", String(days));
  const res = await fetchOpenMeteo(`${FORECAST_BASE}?${q}`);
  if (!res.ok) throw new Error(`forecast_http_${res.status}`);
  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}
async function openMeteoResolve(params) {
  const cc = params.countryCode?.trim().toUpperCase() ?? "";
  const cacheKey = `resolve:${params.name.trim().toLowerCase()}:${cc}:${params.language}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}`;
  const cached = cacheGet(cacheKey);
  if (cached?.place && cached.forecast) return cached;
  const geo = await openMeteoGeocode({
    name: params.name,
    countryCode: params.countryCode,
    language: params.language
  });
  const place = geo.results?.[0];
  if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
    throw new Error("geocode_empty");
  }
  const forecast = await openMeteoForecast({
    latitude: place.latitude,
    longitude: place.longitude,
    includeHourly: params.includeHourly,
    includeDaily: params.includeDaily
  });
  const out = { place, forecast };
  cacheSet(cacheKey, out);
  return out;
}
function readIncludeFlags(sp) {
  const includeHourly = sp.get("includeHourly") === "1" || sp.get("includeHourly") === "true" || sp.has("hourly");
  const dailyParam = sp.get("daily");
  const includeDaily = sp.get("includeDaily") === "1" || sp.get("includeDaily") === "true" || dailyParam === "1" || dailyParam === "true" || sp.has("forecast_days") || Boolean(dailyParam?.includes("weather_code"));
  return { includeHourly, includeDaily };
}
function resolveAction(req, path) {
  const segment = path[0]?.trim();
  if (segment === "geocode" || segment === "forecast" || segment === "resolve") return segment;
  const url = new URL(req.url);
  const legacy = url.searchParams.get("action")?.trim();
  if (legacy === "geocode" || legacy === "forecast" || legacy === "resolve") return legacy;
  return "";
}
async function handleWeatherPluginRequest(req, path) {
  if (req.method !== "GET") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  const action = resolveAction(req, path);
  const sp = new URL(req.url).searchParams;
  try {
    if (action === "geocode") {
      const name = sp.get("name")?.trim();
      if (!name) return Response.json({ error: "missing_name" }, { status: 400 });
      const language = sp.get("language")?.trim() || "de";
      const countryCode = sp.get("countryCode")?.trim() || void 0;
      const data = await openMeteoGeocode({ name, countryCode, language });
      return Response.json(data);
    }
    if (action === "forecast") {
      const lat = Number(sp.get("latitude"));
      const lon = Number(sp.get("longitude"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json({ error: "invalid_coordinates" }, { status: 400 });
      }
      const { includeHourly, includeDaily } = readIncludeFlags(sp);
      const data = await openMeteoForecast({ latitude: lat, longitude: lon, includeHourly, includeDaily });
      return Response.json(data);
    }
    if (action === "resolve") {
      const name = sp.get("name")?.trim();
      if (!name) return Response.json({ error: "missing_name" }, { status: 400 });
      const language = sp.get("language")?.trim() || "de";
      const countryCode = sp.get("countryCode")?.trim() || void 0;
      const { includeHourly, includeDaily } = readIncludeFlags(sp);
      const data = await openMeteoResolve({ name, countryCode, language, includeHourly, includeDaily });
      return Response.json(data);
    }
    return Response.json({ error: "invalid_action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "open_meteo_error";
    const isAbort = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("weather", action || "weather", isAbort ? "timeout" : msg);
    return Response.json(
      {
        error: isAbort ? "timeout" : msg,
        hint: "Server must reach geocoding-api.open-meteo.com and api.open-meteo.com (HTTPS outbound)."
      },
      { status: 502 }
    );
  }
}
function weatherServerHandler(ctx) {
  return handleWeatherPluginRequest(ctx.request, ctx.path);
}
var server_default = weatherServerHandler;
export {
  server_default as default,
  handleWeatherPluginRequest,
  weatherServerHandler
};
