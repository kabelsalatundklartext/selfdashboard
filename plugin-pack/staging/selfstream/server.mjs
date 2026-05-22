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

// plugins/selfstream/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
function parseBase(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  return new URL(withProto);
}
function finalizeBaseUrl(u) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  u.username = "";
  u.password = "";
  u.hash = "";
  let path = u.pathname.replace(/\/+$/, "") || "";
  if (path.endsWith("/admin")) {
    path = path.slice(0, -"/admin".length) || "/";
    u.pathname = path;
  }
  let out = u.toString();
  if (out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
function normalizeBase(raw) {
  return finalizeBaseUrl(parseBase(raw));
}
function apiEndpoint(base, apiPath) {
  const path = apiPath.replace(/^\//, "");
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return new URL(path, prefix).toString();
}
function isObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}
function num(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function sessionTitle(channel, np) {
  const t = str(np?.title);
  if (t) return t;
  return channel || "\u2014";
}
function elapsedFromStarted(started) {
  const now = Math.floor(Date.now() / 1e3);
  const s = num(started);
  if (s <= 0) return 0;
  const sec = s > 1e12 ? Math.floor(s / 1e3) : Math.floor(s);
  return Math.max(0, now - sec);
}
function mapLive(row) {
  const channel = str(row.channel);
  const np = row.now_playing;
  return {
    user: str(row.user) || "\u2014",
    channel,
    title: sessionTitle(channel, np),
    durationSec: elapsedFromStarted(row.started_at),
    isCatchup: false,
    ip: str(row.ip)
  };
}
function mapCatchup(row) {
  const channel = str(row.channel);
  const title = str(row.epg_title) || channel || "\u2014";
  return {
    user: str(row.user) || "\u2014",
    channel,
    title,
    durationSec: Math.max(0, Math.floor(num(row.duration))),
    isCatchup: true,
    ip: str(row.ip)
  };
}
function normalizeStats(json) {
  if (!isObject(json)) {
    return { activeStreams: 0, sessions: [] };
  }
  const live = Array.isArray(json.active_sessions) ? json.active_sessions.map(mapLive) : [];
  const catchup = Array.isArray(json.active_catchup) ? json.active_catchup.map(mapCatchup) : [];
  const sessions = [...live, ...catchup];
  const activeStreams = num(json.active_streams) || sessions.length;
  return { activeStreams, sessions };
}
async function handleSelfstreamPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handleSelfstreamPost(req);
}
async function handleSelfstreamPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBase(String(body.url ?? process.env.SELFSTREAM_URL ?? ""));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid_url";
    return Response.json({ error: msg }, { status: 400 });
  }
  const password = String(body.password ?? process.env.SELFSTREAM_ADMIN_TOKEN ?? "").trim();
  if (!password) {
    return Response.json({ error: "missing_password" }, { status: 400 });
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = apiEndpoint(base, "/api/stats");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Admin-Token": password
      },
      cache: "no-store",
      signal: ac.signal
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const detail = isObject(json) && typeof json.detail === "string" ? json.detail : text.slice(0, 200) || `HTTP ${res.status}`;
      const error = res.status === 401 ? "auth_failed" : res.status === 429 ? "rate_limited" : res.status === 404 ? "api_not_found" : "selfstream_error";
      void logPluginApiFailure("selfstream", "upstream", error, { upstreamStatus: res.status, detail });
      return Response.json({ error, detail }, { status: res.status === 401 ? 401 : 502 });
    }
    return Response.json(normalizeStats(json));
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("selfstream", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("selfstream", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
function selfstreamServerHandler(ctx) {
  return handleSelfstreamPluginRequest(ctx.request, ctx.path);
}
var server_default = selfstreamServerHandler;
export {
  server_default as default,
  dynamic,
  handleSelfstreamPluginRequest,
  selfstreamServerHandler
};
