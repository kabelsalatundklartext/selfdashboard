// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/_shared/secret-crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join as join2 } from "node:path";

// plugins-pack/_shared/data-dir.ts
import { join } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}

// plugins-pack/_shared/secret-crypto.ts
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
var KEY_LEN = 32;
var cachedKey = null;
function deriveKey(material) {
  return scryptSync(material, "selfdashboard.calendar.v1", KEY_LEN);
}
function loadOrCreateKey() {
  if (cachedKey) return cachedKey;
  const envKey = process.env.SELFDASHBOARD_CALENDAR_KEY?.trim();
  if (envKey) {
    cachedKey = deriveKey(envKey);
    return cachedKey;
  }
  const keyFile = join2(dataDir(), ".calendar-key");
  if (existsSync(keyFile)) {
    cachedKey = deriveKey(readFileSync(keyFile, "utf8").trim());
    return cachedKey;
  }
  const fresh = randomBytes(32).toString("base64");
  writeFileSync(keyFile, fresh, "utf8");
  try {
    chmodSync(keyFile, 384);
  } catch {
  }
  cachedKey = deriveKey(fresh);
  return cachedKey;
}
var TAG_LEN = 16;
var SEALED_SECRET_PREFIX = "sdsec1:";
function isSealedSecret(value) {
  return typeof value === "string" && value.startsWith(SEALED_SECRET_PREFIX);
}
function openSealedSecret(value) {
  if (!isSealedSecret(value)) return value;
  try {
    const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), "base64");
    if (buf.length < IV_LEN + TAG_LEN + 1) return "";
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, loadOrCreateKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

// plugins-pack/_shared/insecure-fetch.ts
import https from "node:https";
import nodeFetch from "node-fetch";

// plugins-pack/_shared/ssrf.ts
import net from "node:net";
import { lookup } from "node:dns/promises";
var BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "instance-data"
]);
function isAlwaysBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:")) return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    const embedded = embeddedIpv4(normalized);
    if (embedded) return isAlwaysBlockedIp(embedded);
  }
  return false;
}
function embeddedIpv4(normalizedV6) {
  if (!normalizedV6.startsWith("::ffff:")) return null;
  const rest = normalizedV6.slice("::ffff:".length);
  if (net.isIPv4(rest)) return rest;
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return `${hi >> 8 & 255}.${hi & 255}.${lo >> 8 & 255}.${lo & 255}`;
}
function isPrivateLanIp(ip) {
  if (!net.isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}
function blockPrivateLanUrls() {
  const v = process.env.SELFDASHBOARD_BLOCK_PRIVATE_CALENDAR_URLS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
var UnsafeOutboundUrlError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsafeOutboundUrlError";
  }
};
function assertSafeOutboundUrl(urlStr) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new UnsafeOutboundUrlError("invalid_url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new UnsafeOutboundUrlError("unsupported_protocol");
  }
  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host) throw new UnsafeOutboundUrlError("missing_host");
  if (BLOCKED_HOSTNAMES.has(host)) throw new UnsafeOutboundUrlError("blocked_host");
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeOutboundUrlError("blocked_host");
  }
  const ipVersion = net.isIP(host);
  if (ipVersion) {
    if (isAlwaysBlockedIp(host)) throw new UnsafeOutboundUrlError("blocked_ip");
    if (blockPrivateLanUrls() && isPrivateLanIp(host)) {
      throw new UnsafeOutboundUrlError("private_ip_blocked");
    }
    return;
  }
  if (host.endsWith(".localhost")) throw new UnsafeOutboundUrlError("blocked_host");
}
async function assertSafeOutboundUrlResolved(urlStr) {
  assertSafeOutboundUrl(urlStr);
  const u = new URL(urlStr);
  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (net.isIP(host)) return;
  let addrs;
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeOutboundUrlError("dns_lookup_failed");
  }
  if (addrs.length === 0) throw new UnsafeOutboundUrlError("dns_lookup_failed");
  for (const { address } of addrs) {
    if (isAlwaysBlockedIp(address)) throw new UnsafeOutboundUrlError("blocked_ip_resolved");
    if (blockPrivateLanUrls() && isPrivateLanIp(address)) {
      throw new UnsafeOutboundUrlError("private_ip_blocked");
    }
  }
}

// plugins-pack/_shared/insecure-fetch.ts
async function fetchChecked(url, init = {}, opts = {}) {
  await assertSafeOutboundUrlResolved(url);
  const isHttps = url.toLowerCase().startsWith("https:");
  const agent = isHttps && opts.insecureTls === true ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const res = await nodeFetch(url, {
    redirect: "manual",
    ...init,
    ...agent ? { agent } : {}
  });
  return res;
}
async function fetchCheckedJson(url, init = {}, opts = {}) {
  const res = await fetchChecked(url, init, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text, res };
}

// plugins-pack/openmediavault/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 15e3;
function num(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}
function str(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function normalizeBase(raw) {
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(t) ? t : `http://${t}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  u.username = "";
  u.password = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
function collectCookies(res) {
  const raw = res.headers.raw()["set-cookie"] ?? [];
  return raw.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
}
function parseCpuPct(v) {
  const direct = num(v);
  if (direct != null) return Math.max(0, Math.min(100, direct));
  if (isObject(v)) {
    const inner = num(v.utilization) ?? num(v.usage) ?? num(v.value) ?? num(v.cpuUsage);
    if (inner != null) return Math.max(0, Math.min(100, inner));
  }
  return null;
}
function parseMemPct(root) {
  const used = num(root.memUsed);
  const total = num(root.memTotal);
  if (used != null && total != null && total > 0) return Math.max(0, Math.min(100, used / total * 100));
  const mem = root.memory;
  if (isObject(mem)) {
    const u = num(mem.used) ?? num(mem.memUsed);
    const t = num(mem.total) ?? num(mem.memTotal);
    if (u != null && t != null && t > 0) return Math.max(0, Math.min(100, u / t * 100));
    const pct = num(mem.utilization) ?? num(mem.percent) ?? num(mem.usage);
    if (pct != null) return Math.max(0, Math.min(100, pct <= 1 ? pct * 100 : pct));
  }
  const direct = num(root.memUtilization);
  if (direct != null) return Math.max(0, Math.min(100, direct <= 1 ? direct * 100 : direct));
  return null;
}
function parseUptime(v) {
  if (typeof v === "number" && Number.isFinite(v)) return { uptimeSec: v, uptimeText: null };
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return { uptimeSec: null, uptimeText: null };
    const n = Number(t);
    if (Number.isFinite(n) && /^[\d.]+$/.test(t)) return { uptimeSec: n, uptimeText: null };
    return { uptimeSec: null, uptimeText: t };
  }
  return { uptimeSec: null, uptimeText: null };
}
function parseLoadAvg(v) {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v)) {
    const parts = v.map((x) => num(x)).filter((x) => x != null);
    return parts.length ? parts.map((x) => x.toFixed(2)).join(", ") : null;
  }
  if (isObject(v)) {
    const parts = [v["1min"] ?? v.one, v["5min"] ?? v.five, v["15min"] ?? v.fifteen].map((x) => num(x)).filter((x) => x != null);
    return parts.length ? parts.map((x) => x.toFixed(2)).join(", ") : null;
  }
  return null;
}
function normalizeInformation(json) {
  const root = isObject(json) && isObject(json.response) ? json.response : isObject(json) ? json : null;
  if (!root) return null;
  const up = parseUptime(root.uptime);
  return {
    hostname: str(root.hostname),
    version: str(root.version),
    uptimeSec: up.uptimeSec,
    uptimeText: up.uptimeText,
    cpuPct: parseCpuPct(root.cpuUsage ?? root.cpuUtilization),
    memUsedPct: parseMemPct(root),
    loadAvg: parseLoadAvg(root.loadAverage ?? root.loadavg)
  };
}
function rpcErrorMessage(json) {
  if (!isObject(json)) return null;
  const err = json.error;
  if (err == null) return null;
  if (typeof err === "string") return err;
  if (isObject(err)) return str(err.message) ?? "RPC error";
  return "RPC error";
}
async function handlePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBase(String(body.url ?? ""));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "invalid_url" }, { status: 400 });
  }
  const username = String(body.username ?? "").trim() || "admin";
  const password = openSealedSecret(String(body.password ?? "").trim());
  if (!password) {
    return Response.json(
      { error: "missing_credentials", detail: "Passwort eintragen (Web-UI-Login, z. B. admin)." },
      { status: 400 }
    );
  }
  const insecureTls = body.insecureTls !== false;
  const rpcUrl = `${base}/rpc.php`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const login = await fetchCheckedJson(
      rpcUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ service: "session", method: "login", params: { username, password } }),
        signal: ac.signal
      },
      { insecureTls }
    );
    const loginErr = rpcErrorMessage(login.json);
    if (loginErr || login.status === 401 || login.status === 403) {
      void logPluginApiFailure("openmediavault", "auth", "auth_failed", {
        status: login.status,
        message: loginErr ?? void 0
      });
      return Response.json(
        { error: "auth_failed", detail: "Login abgelehnt \u2014 Web-UI-Benutzer und Passwort pr\xFCfen." },
        { status: 401 }
      );
    }
    if (!login.ok) {
      void logPluginApiFailure("openmediavault", "auth", `login_http_${login.status}`, { status: login.status });
      return Response.json(
        { error: "upstream_error", detail: `RPC-Login fehlgeschlagen (HTTP ${login.status}) \u2014 URL pr\xFCfen (erwartet OMV-Web-UI).` },
        { status: 502 }
      );
    }
    const cookie = collectCookies(login.res);
    if (!cookie) {
      void logPluginApiFailure("openmediavault", "auth", "no_cookie");
      return Response.json(
        { error: "upstream_error", detail: "OMV hat kein Session-Cookie geliefert." },
        { status: 502 }
      );
    }
    const info = await fetchCheckedJson(
      rpcUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: cookie },
        body: JSON.stringify({ service: "system", method: "getInformation", params: null }),
        signal: ac.signal
      },
      { insecureTls }
    );
    const infoErr = rpcErrorMessage(info.json);
    if (infoErr || info.status === 401 || info.status === 403) {
      void logPluginApiFailure("openmediavault", "upstream", "rpc_error", {
        status: info.status,
        message: infoErr ?? void 0
      });
      return Response.json(
        { error: "upstream_error", detail: infoErr ?? `OMV-RPC-Fehler (HTTP ${info.status}).` },
        { status: 502 }
      );
    }
    if (!info.ok) {
      void logPluginApiFailure("openmediavault", "upstream", `http_${info.status}`, { status: info.status });
      return Response.json(
        { error: "upstream_error", detail: `OMV antwortete mit HTTP ${info.status}.` },
        { status: 502 }
      );
    }
    const normalized = normalizeInformation(info.json);
    if (!normalized) {
      void logPluginApiFailure("openmediavault", "upstream", "unexpected_response");
      return Response.json(
        { error: "upstream_error", detail: "Unerwartetes Antwortformat von system.getInformation." },
        { status: 502 }
      );
    }
    return Response.json(normalized);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("openmediavault", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("openmediavault", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure("openmediavault", "request", "tls_error", { message: msg });
      return Response.json(
        { error: "tls_error", detail: "TLS-Zertifikat abgelehnt \u2014 \u201ESelbstsigniertes Zertifikat erlauben\u201C aktivieren." },
        { status: 502 }
      );
    }
    void logPluginApiFailure("openmediavault", "request", "network_error", { message: msg });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
async function handleOmvPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function openmediavaultServerHandler(ctx) {
  return handleOmvPluginRequest(ctx.request, ctx.path);
}
export {
  openmediavaultServerHandler as default,
  dynamic
};
