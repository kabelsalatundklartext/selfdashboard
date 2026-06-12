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
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim();
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
async function fetchWithSsrfGuard(urlStr, init, maxRedirects = 5) {
  await assertSafeOutboundUrlResolved(urlStr);
  let current = urlStr;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const resp = await fetch(current, { ...init, redirect: "manual" });
    if (resp.status < 300 || resp.status >= 400) return resp;
    const location = resp.headers.get("location");
    if (!location) return resp;
    current = new URL(location, current).href;
    await assertSafeOutboundUrlResolved(current);
  }
  throw new UnsafeOutboundUrlError("too_many_redirects");
}

// plugins-pack/zoraxy/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
function n(v) {
  const x = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
}
function countList(v) {
  if (Array.isArray(v)) return v.length;
  if (isObject(v)) {
    let total = 0;
    let sawArray = false;
    for (const val of Object.values(v)) {
      if (Array.isArray(val)) {
        total += val.length;
        sawArray = true;
      }
    }
    return sawArray ? total : Object.keys(v).length;
  }
  return void 0;
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
function collectCookies(jar, res) {
  const headers = res.headers;
  let raw = [];
  if (typeof headers.getSetCookie === "function") {
    raw = headers.getSetCookie();
  } else {
    const single = res.headers.get("set-cookie");
    if (single) raw = [single];
  }
  for (const c of raw) {
    const pair = c.split(";", 1)[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}
function cookieHeader(jar) {
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}
function extractCsrfToken(html) {
  const m = html.match(/name=["']zoraxy\.csrf\.Token["'][^>]*content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["'][^>]*name=["']zoraxy\.csrf\.Token["']/i);
  return m ? m[1] : "";
}
async function readBody(res) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
}
async function safeGet(base, path, jar, signal) {
  try {
    const res = await fetchWithSsrfGuard(`${base}${path}`, {
      method: "GET",
      headers: { Accept: "application/json", Cookie: cookieHeader(jar) },
      cache: "no-store",
      signal
    });
    const b = await readBody(res);
    return res.ok ? b.json : null;
  } catch {
    return null;
  }
}
function lastRecord(v) {
  let arr = v;
  if (isObject(v)) arr = v.Records ?? v.records ?? v.Logs ?? v.logs ?? v;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const last = arr[arr.length - 1];
  return isObject(last) ? last : null;
}
function summarizeUptime(data) {
  let values;
  if (Array.isArray(data)) values = data;
  else if (isObject(data)) values = Object.values(data);
  else return null;
  let online = 0;
  let offline = 0;
  let monitored = 0;
  for (const v of values) {
    const rec = lastRecord(v);
    if (!rec) continue;
    monitored++;
    if (rec.Online === true) online++;
    else offline++;
  }
  if (monitored === 0) return null;
  return { uptimeOnline: online, uptimeOffline: offline, uptimeMonitored: monitored };
}
function summarizeHosts(list) {
  let active = 0;
  let disabled = 0;
  let upstreams = 0;
  for (const entry of list) {
    if (!isObject(entry)) continue;
    if (entry.Disabled === true) disabled++;
    else active++;
    if (Array.isArray(entry.ActiveOrigins)) upstreams += entry.ActiveOrigins.length;
  }
  return { total: list.length, active, disabled, upstreams };
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
  const username = String(body.username ?? "").trim();
  const password = openSealedSecret(String(body.password ?? "").trim());
  if (!username || !password) {
    return Response.json(
      {
        error: "missing_credentials",
        detail: "Benutzer und Passwort (Web-UI-Login) in den Widget-Einstellungen eintragen."
      },
      { status: 400 }
    );
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  const jar = /* @__PURE__ */ new Map();
  try {
    const pageRes = await fetchWithSsrfGuard(
      `${base}/login.html`,
      { method: "GET", headers: { Accept: "text/html" }, cache: "no-store", signal: ac.signal }
    );
    collectCookies(jar, pageRes);
    const csrfToken = extractCsrfToken(await pageRes.text());
    const loginHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    };
    if (csrfToken) loginHeaders["X-CSRF-Token"] = csrfToken;
    const jarBefore = cookieHeader(jar);
    if (jarBefore) loginHeaders.Cookie = jarBefore;
    const loginRes = await fetchWithSsrfGuard(
      `${base}/api/auth/login`,
      {
        method: "POST",
        headers: loginHeaders,
        body: new URLSearchParams({ username, password, rmbme: "true" }).toString(),
        cache: "no-store",
        signal: ac.signal
      }
    );
    collectCookies(jar, loginRes);
    const login = await readBody(loginRes);
    const loginErr = isObject(login.json) && typeof login.json.error === "string" ? login.json.error : "";
    if (loginErr) {
      void logPluginApiFailure("zoraxy", "auth", "auth_failed", { status: login.status, reason: loginErr });
      return Response.json(
        { error: "auth_failed", detail: `Zoraxy: "${loginErr}" (HTTP ${login.status})` },
        { status: 401 }
      );
    }
    if (!login.ok) {
      void logPluginApiFailure("zoraxy", "auth", "no_session", { status: login.status, hadToken: Boolean(csrfToken) });
      return Response.json(
        {
          error: "auth_failed",
          detail: `Login fehlgeschlagen (HTTP ${login.status}${csrfToken ? "" : ", kein CSRF-Token gefunden"}).`
        },
        { status: login.status === 403 ? 403 : 502 }
      );
    }
    const listRes = await fetchWithSsrfGuard(
      `${base}/api/proxy/list?type=host`,
      {
        method: "GET",
        headers: { Accept: "application/json", Cookie: cookieHeader(jar) },
        cache: "no-store",
        signal: ac.signal
      }
    );
    const list = await readBody(listRes);
    if (list.status === 401 || list.status === 403) {
      void logPluginApiFailure("zoraxy", "auth", "session_rejected", { status: list.status });
      return Response.json(
        { error: "auth_failed", detail: "Session abgelehnt \u2014 Berechtigungen des Zoraxy-Benutzers pr\xFCfen." },
        { status: list.status }
      );
    }
    if (!list.ok || !Array.isArray(list.json)) {
      const detail = isObject(list.json) && typeof list.json.error === "string" ? list.json.error : "";
      void logPluginApiFailure("zoraxy", "upstream", "bad_list", { status: list.status });
      return Response.json(
        { error: "upstream_error", detail: detail || `Host-Liste nicht lesbar (HTTP ${list.status}).` },
        { status: 502 }
      );
    }
    const payload = summarizeHosts(list.json);
    const want = Array.isArray(body.want) ? body.want : [];
    const jobs = [];
    if (want.includes("uptime")) {
      jobs.push(
        safeGet(base, "/api/utm/log", jar, ac.signal).then((j) => {
          const u = summarizeUptime(j);
          if (u) Object.assign(payload, u);
        })
      );
    }
    if (want.includes("stats")) {
      jobs.push(
        safeGet(base, "/api/stats/summary", jar, ac.signal).then((j) => {
          if (isObject(j)) {
            payload.requests = n(j.TotalRequest);
            payload.valid = n(j.ValidRequest);
            payload.blocked = n(j.ErrorRequest);
          }
        })
      );
    }
    const countEndpoints = [
      ["redirects", "/api/redirect/list", "redirects"],
      ["streams", "/api/streamprox/config/list", "streams"],
      ["blacklist", "/api/blacklist/list", "blacklist"],
      ["whitelist", "/api/whitelist/list", "whitelist"]
    ];
    for (const [group, path, field] of countEndpoints) {
      if (!want.includes(group)) continue;
      jobs.push(
        safeGet(base, path, jar, ac.signal).then((j) => {
          const c = countList(j);
          if (c !== void 0) payload[field] = c;
        })
      );
    }
    if (jobs.length) await Promise.allSettled(jobs);
    return Response.json(payload);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("zoraxy", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("zoraxy", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("zoraxy", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json(
      { error: "network_error", detail: "Zoraxy nicht erreichbar \u2014 URL/Port pr\xFCfen (Standard 8000)." },
      { status: 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
async function handleZoraxyPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function zoraxyServerHandler(ctx) {
  return handleZoraxyPluginRequest(ctx.request, ctx.path);
}
export {
  zoraxyServerHandler as default,
  dynamic
};
