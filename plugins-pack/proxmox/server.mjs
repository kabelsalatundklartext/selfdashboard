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

// plugins-pack/proxmox/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 12e3;
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
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  if (!u.port && u.protocol === "https:") u.port = "8006";
  u.username = "";
  u.password = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
function normalizeResources(json) {
  const data = isObject(json) && Array.isArray(json.data) ? json.data : [];
  const nodes = [];
  const vms = { running: 0, total: 0 };
  const lxc = { running: 0, total: 0 };
  for (const entry of data) {
    if (!isObject(entry)) continue;
    const type = str(entry.type);
    const status = str(entry.status) ?? "unknown";
    if (type === "node") {
      const cpu = num(entry.cpu);
      const mem = num(entry.mem);
      const maxmem = num(entry.maxmem);
      const memPct = mem != null && maxmem != null && maxmem > 0 ? mem / maxmem * 100 : null;
      nodes.push({
        name: str(entry.node) ?? str(entry.name) ?? "?",
        status,
        cpuPct: cpu != null ? cpu * 100 : null,
        memPct,
        memUsedGb: mem != null ? mem / 1024 ** 3 : null,
        memTotalGb: maxmem != null ? maxmem / 1024 ** 3 : null,
        uptimeSec: num(entry.uptime)
      });
    } else if (type === "qemu") {
      vms.total += 1;
      if (status === "running") vms.running += 1;
    } else if (type === "lxc") {
      lxc.total += 1;
      if (status === "running") lxc.running += 1;
    }
  }
  nodes.sort((a, b) => a.name.localeCompare(b.name));
  return { nodes, vms, lxc };
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
  const apiToken = openSealedSecret(String(body.apiToken ?? "").trim());
  if (!apiToken) {
    return Response.json(
      { error: "missing_token", detail: "API-Token fehlt (Format user@realm!tokenid=uuid)." },
      { status: 400 }
    );
  }
  const insecureTls = body.insecureTls !== false;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetchCheckedJson(
      `${base}/api2/json/cluster/resources`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `PVEAPIToken=${apiToken}`
        },
        signal: ac.signal
      },
      { insecureTls }
    );
    if (r.status === 401 || r.status === 403) {
      void logPluginApiFailure("proxmox", "auth", "auth_failed", { status: r.status });
      return Response.json(
        {
          error: "auth_failed",
          detail: "API-Token pr\xFCfen (Format user@realm!tokenid=uuid). Token braucht \u201EPrivilege Separation\u201C aus oder die Rolle PVEAuditor auf /."
        },
        { status: r.status }
      );
    }
    if (!r.ok) {
      void logPluginApiFailure("proxmox", "upstream", `http_${r.status}`, { status: r.status });
      return Response.json(
        { error: "upstream_error", detail: `Proxmox antwortete mit HTTP ${r.status}.` },
        { status: 502 }
      );
    }
    return Response.json(normalizeResources(r.json));
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("proxmox", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("proxmox", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure("proxmox", "request", "tls_error", { message: msg });
      return Response.json(
        { error: "tls_error", detail: "TLS-Zertifikat abgelehnt \u2014 \u201ESelbstsigniertes Zertifikat erlauben\u201C aktivieren." },
        { status: 502 }
      );
    }
    void logPluginApiFailure("proxmox", "request", "network_error", { message: msg });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
async function handleProxmoxPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function proxmoxServerHandler(ctx) {
  return handleProxmoxPluginRequest(ctx.request, ctx.path);
}
export {
  proxmoxServerHandler as default,
  dynamic
};
