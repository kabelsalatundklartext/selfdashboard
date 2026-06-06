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

// plugins-pack/homematic/server.ts
var dynamic = "force-dynamic";
var FETCH_TIMEOUT_MS = 15e3;
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function num(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}
function normalizeBase(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_url");
  u.pathname = "";
  u.search = "";
  u.hash = "";
  return u.toString().replace(/\/+$/, "");
}
async function rpc(base, method, params, signal) {
  const res = await fetchWithSsrfGuard(`${base}/api/homematic.cgi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: "1.1", method, params, id: Date.now() }),
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
  const result = isObject(json) ? json.result : void 0;
  const error = isObject(json) ? json.error : void 0;
  return { ok: res.ok, status: res.status, result, error };
}
function buildRoomMap(result) {
  const map = {};
  if (!Array.isArray(result)) return map;
  for (const r of result) {
    if (!isObject(r)) continue;
    const name = str(r.name);
    const ids = Array.isArray(r.channelIds) ? r.channelIds : [];
    if (!name) continue;
    for (const cid of ids) map[str(cid)] = name;
  }
  return map;
}
function mapDevices(result, rooms = {}) {
  if (!Array.isArray(result)) return [];
  const out = [];
  for (const d of result) {
    if (!isObject(d)) continue;
    const address = str(d.address);
    if (!address) continue;
    const iface = str(d.interface) || "BidCos-RF";
    const channelsRaw = Array.isArray(d.channels) ? d.channels : [];
    const channels = [];
    let devRoom = "";
    for (const c of channelsRaw) {
      if (!isObject(c)) continue;
      const caddr = str(c.address);
      if (!caddr || !caddr.includes(":")) continue;
      const idx = Number(caddr.split(":")[1]);
      const room = rooms[str(c.id)] || "";
      if (room && !devRoom) devRoom = room;
      channels.push({ address: caddr, name: str(c.name) || caddr, index: Number.isFinite(idx) ? idx : 0, room });
    }
    out.push({
      address,
      name: str(d.name) || address,
      type: str(d.type),
      interface: iface,
      room: devRoom,
      channels
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
function mapSysvars(result) {
  if (!Array.isArray(result)) return [];
  const out = [];
  for (const s of result) {
    if (!isObject(s)) continue;
    const name = str(s.name);
    if (!name) continue;
    out.push({
      id: str(s.id) || str(s.ise_id),
      name,
      value: s.value,
      unit: str(s.unit),
      type: str(s.type) || str(s.valueType)
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
function mapPrograms(result) {
  if (!Array.isArray(result)) return [];
  const out = [];
  for (const p of result) {
    if (!isObject(p)) continue;
    const id = str(p.id) || str(p.ise_id);
    const name = str(p.name);
    if (!id || !name) continue;
    out.push({ id, name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
async function login(base, username, password, signal) {
  const r = await rpc(base, "Session.login", { username, password }, signal);
  const sid = str(r.result);
  return sid || null;
}
async function logout(base, sid, signal) {
  try {
    await rpc(base, "Session.logout", { _session_id_: sid }, signal);
  } catch {
  }
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
  const username = str(body.username);
  const password = openSealedSecret(str(body.password));
  if (!username || !password) {
    return Response.json(
      { error: "missing_credentials", detail: "CCU-Benutzer und Passwort eintragen." },
      { status: 400 }
    );
  }
  const action = body.action ?? "state";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let sid = null;
  try {
    sid = await login(base, username, password, ac.signal);
    if (!sid) {
      void logPluginApiFailure("homematic", "auth", "auth_failed");
      return Response.json(
        { error: "auth_failed", detail: "Login abgelehnt \u2014 CCU-Benutzer/Passwort pr\xFCfen." },
        { status: 401 }
      );
    }
    if (action === "list") {
      const [dev, sys2, prg, rooms] = await Promise.all([
        rpc(base, "Device.listAllDetail", { _session_id_: sid }, ac.signal),
        rpc(base, "SysVar.getAll", { _session_id_: sid }, ac.signal),
        rpc(base, "Program.getAll", { _session_id_: sid }, ac.signal),
        rpc(base, "Room.getAll", { _session_id_: sid }, ac.signal)
      ]);
      return Response.json({
        devices: mapDevices(dev.result, buildRoomMap(rooms.result)),
        sysvars: mapSysvars(sys2.result),
        programs: mapPrograms(prg.result)
      });
    }
    if (action === "set") {
      if (body.kind === "program") {
        const id = str(body.id);
        if (!/^[0-9]+$/.test(id)) return Response.json({ error: "invalid_id" }, { status: 400 });
        const r2 = await rpc(base, "Program.execute", { _session_id_: sid, id }, ac.signal);
        if (r2.error) {
          void logPluginApiFailure("homematic", "set", "program_failed");
          return Response.json({ error: "set_failed" }, { status: 502 });
        }
        return Response.json({ ok: true });
      }
      if (body.kind === "multi") {
        const iface2 = str(body.interface) || "BidCos-RF";
        const address2 = str(body.address);
        if (!address2 || !address2.includes(":") || !isObject(body.values)) {
          return Response.json({ error: "invalid_target" }, { status: 400 });
        }
        const r2 = await rpc(
          base,
          "Interface.putParamset",
          { _session_id_: sid, interface: iface2, address: address2, paramsetKey: "VALUES", set: body.values },
          ac.signal
        );
        if (r2.error) {
          void logPluginApiFailure("homematic", "set", "putparamset_failed");
          return Response.json({ error: "set_failed" }, { status: 502 });
        }
        return Response.json({ ok: true });
      }
      const iface = str(body.interface) || "BidCos-RF";
      const address = str(body.address);
      const valueKey = str(body.valueKey);
      if (!address || !address.includes(":") || !valueKey) {
        return Response.json({ error: "invalid_target" }, { status: 400 });
      }
      const vType = body.valueType ?? "boolean";
      let value = body.value;
      if (vType === "boolean") value = body.value === true || body.value === "true" || body.value === 1;
      else if (vType === "double" || vType === "integer") value = num(body.value) ?? 0;
      else value = str(body.value);
      const r = await rpc(
        base,
        "Interface.setValue",
        { _session_id_: sid, interface: iface, address, valueKey, type: vType, value },
        ac.signal
      );
      if (r.error) {
        void logPluginApiFailure("homematic", "set", "device_failed");
        return Response.json({ error: "set_failed" }, { status: 502 });
      }
      return Response.json({ ok: true });
    }
    const channels = Array.isArray(body.channels) ? body.channels : [];
    const valuesByAddress = {};
    await Promise.all(
      channels.slice(0, 40).map(async (ch) => {
        const iface = str(ch.interface) || "BidCos-RF";
        const address = str(ch.address);
        if (!address || !address.includes(":")) return;
        const r = await rpc(
          base,
          "Interface.getParamset",
          { _session_id_: sid, interface: iface, address, paramsetKey: "VALUES" },
          ac.signal
        );
        if (isObject(r.result)) valuesByAddress[address] = r.result;
      })
    );
    const sys = await rpc(base, "SysVar.getAll", { _session_id_: sid }, ac.signal);
    return Response.json({ channels: valuesByAddress, sysvars: mapSysvars(sys.result) });
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("homematic", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("homematic", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("homematic", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    if (sid) await logout(base, sid, ac.signal);
    clearTimeout(t);
  }
}
async function handleHomematicPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePost(req);
}
function homematicServerHandler(ctx) {
  return handleHomematicPluginRequest(ctx.request, ctx.path);
}
export {
  homematicServerHandler as default,
  dynamic
};
