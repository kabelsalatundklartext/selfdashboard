// sd-server-shim:next-server-stub
var NextResponse = class extends Response {
  static json(data, init) {
    const status = init && typeof init.status === "number" ? init.status : 200;
    const headers = init && init.headers ? init.headers : void 0;
    return Response.json(data, { status, headers });
  }
};

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

// plugins-pack/adguard/server.ts
var FETCH_TIMEOUT_MS = 12e3;
var STATS_RECENT_MS = 7 * 24 * 60 * 60 * 1e3;
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
  if (path.endsWith("/control")) {
    path = path.slice(0, -"/control".length) || "/";
    u.pathname = path;
  }
  let out = u.toString();
  if (out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
function normalizeBase(raw) {
  return finalizeBaseUrl(parseBase(raw));
}
function controlEndpoint(base, controlPath) {
  const path = controlPath.replace(/^\//, "");
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return new URL(path, prefix).toString();
}
async function fetchJson(url, headers, signal) {
  const res = await fetchWithSsrfGuard(url, { method: "GET", headers, cache: "no-store", signal });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}
async function fetchJsonPost(url, headers, body, signal) {
  const h = { ...headers, "Content-Type": "application/json" };
  const res = await fetchWithSsrfGuard(url, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body),
    cache: "no-store",
    signal
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}
function isStatsObject(j) {
  return j != null && typeof j === "object" && !Array.isArray(j);
}
function num(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}
function seriesOrScalar(stats, numKey, seriesKey) {
  const s = stats[seriesKey];
  if (Array.isArray(s) && s.length > 0) {
    return s.reduce((acc, x) => acc + (Number(x) || 0), 0);
  }
  const n = stats[numKey];
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}
function dnsMetric(stats) {
  return Math.round(seriesOrScalar(stats, "num_dns_queries", "dns_queries"));
}
function blockedMetric(stats) {
  return Math.round(
    seriesOrScalar(stats, "num_blocked_filtering", "blocked_filtering") + seriesOrScalar(stats, "num_replaced_safebrowsing", "replaced_safebrowsing") + seriesOrScalar(stats, "num_replaced_parental", "replaced_parental") + seriesOrScalar(stats, "num_replaced_safesearch", "replaced_safesearch") + num(stats.blocked_threat) + num(stats.blocked_malware) + num(stats.blocked_ad)
  );
}
function statsTotals(j) {
  return { q: dnsMetric(j), b: blockedMetric(j) };
}
async function fetchStatsBundle(base, headers, signal) {
  const candidates = [
    `${controlEndpoint(base, "control/stats")}?recent=${STATS_RECENT_MS}`,
    controlEndpoint(base, "control/stats")
  ];
  let last = null;
  for (const url of candidates) {
    const r = await fetchJson(url, headers, signal);
    last = r;
    if (!r.ok) continue;
    if (!isStatsObject(r.json)) {
      return { error: "invalid_stats", status: 502, detail: r.text.slice(0, 200) };
    }
    const { q, b } = statsTotals(r.json);
    const isLast = url === candidates[candidates.length - 1];
    if (q > 0 || b > 0 || isLast) {
      return { stats: r.json, tried: url };
    }
  }
  if (last && !last.ok) {
    const detail = isStatsObject(last.json) && "message" in last.json ? String(last.json.message ?? "") : last.text.slice(0, 240);
    return {
      error: "stats_failed",
      status: last.status,
      detail: detail || last.text.slice(0, 240)
    };
  }
  if (last && isStatsObject(last.json)) {
    return { stats: last.json, tried: candidates[candidates.length - 1] };
  }
  return { error: "stats_failed", status: 502, detail: "empty response" };
}
async function handleAdguardPluginRequest(req, _path) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBase(String(body.url ?? ""));
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  const user = String(body.username ?? "");
  const pass = openSealedSecret(String(body.password ?? ""));
  const headers = { Accept: "application/json" };
  if (user !== "" || pass !== "") {
    const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${token}`;
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (body.action === "protection") {
      if (typeof body.enabled !== "boolean") {
        return NextResponse.json({ error: "missing_enabled" }, { status: 400 });
      }
      const url = controlEndpoint(base, "control/protection");
      const pr = await fetchJsonPost(url, headers, { enabled: body.enabled }, ac.signal);
      if (!pr.ok) {
        const detail = isStatsObject(pr.json) && "message" in pr.json ? String(pr.json.message ?? "") : pr.text.slice(0, 240);
        return NextResponse.json(
          { error: "protection_failed", status: pr.status, detail: detail || pr.text.slice(0, 240) },
          { status: pr.status === 401 || pr.status === 403 ? pr.status : 502 }
        );
      }
      const statusUrl2 = controlEndpoint(base, "control/status");
      const statusRes2 = await fetchJson(statusUrl2, headers, ac.signal);
      return NextResponse.json({
        ok: true,
        status: statusRes2.ok && isStatsObject(statusRes2.json) ? statusRes2.json : null
      });
    }
    const statsBundle = await fetchStatsBundle(base, headers, ac.signal);
    if ("error" in statsBundle) {
      const st = statsBundle.status === 401 || statsBundle.status === 403 ? statsBundle.status : 502;
      void logPluginApiFailure("adguard", "stats", statsBundle.error, {
        status: statsBundle.status,
        detail: statsBundle.detail
      });
      return NextResponse.json(
        { error: statsBundle.error, status: statsBundle.status, detail: statsBundle.detail },
        { status: st }
      );
    }
    const statusUrl = controlEndpoint(base, "control/status");
    const statusRes = await fetchJson(statusUrl, headers, ac.signal);
    let statsConfig = null;
    const cfgUrl = controlEndpoint(base, "control/stats/config");
    const cfgRes = await fetchJson(cfgUrl, headers, ac.signal);
    if (cfgRes.ok && isStatsObject(cfgRes.json)) statsConfig = cfgRes.json;
    return NextResponse.json({
      stats: statsBundle.stats,
      status: statusRes.ok && isStatsObject(statusRes.json) ? statusRes.json : null,
      statusHttp: statusRes.status,
      statsConfig
    });
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("adguard", "request", `blocked_url:${e.message}`);
      return NextResponse.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("adguard", "request", aborted ? "timeout" : msg);
    return NextResponse.json(
      { error: aborted ? "timeout" : "fetch_failed", detail: msg },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
function adguardServerHandler(ctx) {
  return handleAdguardPluginRequest(ctx.request, ctx.path);
}
export {
  adguardServerHandler,
  handleAdguardPluginRequest
};
