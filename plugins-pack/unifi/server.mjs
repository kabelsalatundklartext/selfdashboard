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
var LEGACY_SALT = "selfdashboard.calendar.v1";
var cachedPrimaryKey = null;
var cachedLegacyKey = null;
function keyMaterial() {
  const envKey = (process.env.SELFDASHBOARD_SECRET_KEY ?? process.env.SELFDASHBOARD_CALENDAR_KEY)?.trim();
  if (envKey) return envKey;
  const keyFile = join2(dataDir(), ".calendar-key");
  if (existsSync(keyFile)) return readFileSync(keyFile, "utf8").trim();
  const fresh = randomBytes(32).toString("base64");
  try {
    writeFileSync(keyFile, fresh, { flag: "wx" });
    try {
      chmodSync(keyFile, 384);
    } catch {
    }
    return fresh;
  } catch {
    if (existsSync(keyFile)) return readFileSync(keyFile, "utf8").trim();
    return fresh;
  }
}
function installSalt() {
  const saltFile = join2(dataDir(), ".secret-salt");
  try {
    if (existsSync(saltFile)) {
      const v = readFileSync(saltFile, "utf8").trim();
      if (v) return v;
    }
    const fresh = randomBytes(16).toString("hex");
    try {
      writeFileSync(saltFile, fresh, { flag: "wx" });
      try {
        chmodSync(saltFile, 384);
      } catch {
      }
      return fresh;
    } catch {
      const v = existsSync(saltFile) ? readFileSync(saltFile, "utf8").trim() : "";
      return v || LEGACY_SALT;
    }
  } catch {
    return LEGACY_SALT;
  }
}
function primaryKey() {
  if (!cachedPrimaryKey) cachedPrimaryKey = scryptSync(keyMaterial(), installSalt(), KEY_LEN);
  return cachedPrimaryKey;
}
function legacyKey() {
  if (!cachedLegacyKey) cachedLegacyKey = scryptSync(keyMaterial(), LEGACY_SALT, KEY_LEN);
  return cachedLegacyKey;
}
function decryptGcm(key, iv, enc, tag) {
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
var TAG_LEN = 16;
var SEALED_SECRET_PREFIX = "sdsec1:";
function isSealedSecret(value) {
  return typeof value === "string" && value.startsWith(SEALED_SECRET_PREFIX);
}
function openSealedSecret(value) {
  if (!isSealedSecret(value)) return value;
  const buf = Buffer.from(value.slice(SEALED_SECRET_PREFIX.length), "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) return "";
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  try {
    return decryptGcm(primaryKey(), iv, enc, tag);
  } catch {
    try {
      return decryptGcm(legacyKey(), iv, enc, tag);
    } catch {
      return "";
    }
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

// plugins-pack/unifi/server.ts
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
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
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
function normalizeHealth(json) {
  if (!isObject(json) || !Array.isArray(json.data)) return null;
  const subsystems = [];
  for (const entry of json.data) {
    if (!isObject(entry)) continue;
    const name = str(entry.subsystem);
    if (!name) continue;
    const devices = num(entry.num_ap) ?? num(entry.num_sw) ?? num(entry.num_gw) ?? 0;
    const user = num(entry.num_user);
    const guest = num(entry.num_guest);
    const clients = user != null || guest != null ? (user ?? 0) + (guest ?? 0) : num(entry.num_sta) ?? 0;
    subsystems.push({
      name,
      status: str(entry.status) ?? "unknown",
      devices,
      clients
    });
  }
  return { subsystems };
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
      { error: "missing_credentials", detail: "Benutzername und Passwort eintragen (lokaler Controller-Benutzer)." },
      { status: 400 }
    );
  }
  const site = String(body.site ?? "").trim() || "default";
  if (!/^[a-z0-9_-]+$/i.test(site)) {
    return Response.json({ error: "invalid_site", detail: "Site darf nur a\u2013z, 0\u20139, _ und - enthalten." }, { status: 400 });
  }
  const insecureTls = body.insecureTls === true;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const loginBody = JSON.stringify({ username, password });
    const loginInit = {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: loginBody,
      signal: ac.signal
    };
    let unifiOs = true;
    let login = await fetchCheckedJson(`${base}/api/auth/login`, loginInit, { insecureTls });
    if (login.status === 404) {
      unifiOs = false;
      login = await fetchCheckedJson(`${base}/api/login`, loginInit, { insecureTls });
    }
    if (login.status === 400 || login.status === 401 || login.status === 403) {
      void logPluginApiFailure("unifi", "auth", "auth_failed", { status: login.status });
      return Response.json(
        {
          error: "auth_failed",
          detail: "Login abgelehnt \u2014 lokalen Controller-Benutzer (ohne 2FA) pr\xFCfen. Ubiquiti-Cloud-Accounts mit 2FA funktionieren nicht."
        },
        { status: 401 }
      );
    }
    if (!login.ok) {
      void logPluginApiFailure("unifi", "auth", `login_http_${login.status}`, { status: login.status });
      return Response.json(
        { error: "upstream_error", detail: `Login fehlgeschlagen (HTTP ${login.status}).` },
        { status: 502 }
      );
    }
    const cookie = collectCookies(login.res);
    if (!cookie) {
      void logPluginApiFailure("unifi", "auth", "no_cookie");
      return Response.json(
        { error: "upstream_error", detail: "Controller hat kein Session-Cookie geliefert." },
        { status: 502 }
      );
    }
    const healthInit = {
      method: "GET",
      headers: { Accept: "application/json", Cookie: cookie },
      signal: ac.signal
    };
    const osPath = `${base}/proxy/network/api/s/${site}/stat/health`;
    const legacyPath = `${base}/api/s/${site}/stat/health`;
    let health = await fetchCheckedJson(unifiOs ? osPath : legacyPath, healthInit, { insecureTls });
    if (health.status === 404) {
      health = await fetchCheckedJson(unifiOs ? legacyPath : osPath, healthInit, { insecureTls });
    }
    if (health.status === 401 || health.status === 403) {
      void logPluginApiFailure("unifi", "auth", "session_rejected", { status: health.status });
      return Response.json(
        { error: "auth_failed", detail: "Session abgelehnt \u2014 Benutzerrechte pr\xFCfen (Netzwerk-Anwendung, mind. Lesen)." },
        { status: health.status }
      );
    }
    if (health.status === 404) {
      void logPluginApiFailure("unifi", "upstream", "site_not_found", { site });
      return Response.json(
        { error: "site_not_found", detail: `Site \u201E${site}" nicht gefunden \u2014 Site-Namen pr\xFCfen (intern, nicht Anzeigename).` },
        { status: 404 }
      );
    }
    if (!health.ok) {
      void logPluginApiFailure("unifi", "upstream", `http_${health.status}`, { status: health.status });
      return Response.json(
        { error: "upstream_error", detail: `Controller antwortete mit HTTP ${health.status}.` },
        { status: 502 }
      );
    }
    const normalized = normalizeHealth(health.json);
    if (!normalized) {
      void logPluginApiFailure("unifi", "upstream", "unexpected_response");
      return Response.json(
        { error: "upstream_error", detail: "Unerwartetes Antwortformat von stat/health." },
        { status: 502 }
      );
    }
    return Response.json(normalized);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("unifi", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("unifi", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/certificate|self.signed|unable to verify/i.test(msg)) {
      void logPluginApiFailure("unifi", "request", "tls_error", { message: msg });
      return Response.json(
        { error: "tls_error", detail: "TLS-Zertifikat abgelehnt \u2014 \u201ESelbstsigniertes Zertifikat erlauben\u201C aktivieren." },
        { status: 502 }
      );
    }
    void logPluginApiFailure("unifi", "request", "network_error", { message: msg });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
async function handleUnifiPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function unifiServerHandler(ctx) {
  return handleUnifiPluginRequest(ctx.request, ctx.path);
}
export {
  unifiServerHandler as default,
  dynamic
};
