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

// plugins-pack/selfmailer-calendar/server.ts
var FETCH_TIMEOUT_MS = 2e4;
function parseBase(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  return new URL(withProto);
}
function normalizeBase(raw) {
  const u = parseBase(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  u.username = "";
  u.password = "";
  u.hash = "";
  let out = u.toString();
  if (out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
function splitTarget(target) {
  const t = (target || "local").trim();
  if (t.includes("::")) {
    const [acc, cal] = t.split("::");
    const id = Number(acc);
    if (Number.isInteger(id)) return { dav_account_id: id, gcal_calendar_id: cal ?? "" };
  }
  return { dav_account_id: null, gcal_calendar_id: "" };
}
function isoFloorToday() {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoPlusDays(days) {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.max(1, Math.min(366, Math.round(days || 30))));
  return d.toISOString();
}
function isoOrNull(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
async function handleCalendarRequest(req) {
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
    base = normalizeBase(String(body.base ?? ""));
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  const token = String(body.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
  const action = body.action ?? "summary";
  const tq = encodeURIComponent(token);
  let url;
  let init;
  if (action === "targets") {
    url = `${base}/api/v1/calendar/targets?token=${tq}`;
    init = { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" };
  } else if (action === "create") {
    const start = String(body.start ?? "").trim();
    const end = String(body.end ?? "").trim();
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
    if (!start || !end) return NextResponse.json({ error: "missing_time" }, { status: 400 });
    const { dav_account_id, gcal_calendar_id } = splitTarget(String(body.target ?? "local"));
    url = `${base}/api/v1/calendar/events?token=${tq}`;
    init = {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        title,
        description: String(body.description ?? ""),
        location: String(body.location ?? ""),
        start,
        end,
        all_day: body.allDay === true,
        dav_account_id,
        gcal_calendar_id
      })
    };
  } else if (action === "update") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    const start = String(body.start ?? "").trim();
    const end = String(body.end ?? "").trim();
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
    if (!start || !end) return NextResponse.json({ error: "missing_time" }, { status: 400 });
    url = `${base}/api/v1/calendar/events/${id}?token=${tq}`;
    init = {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        title,
        description: String(body.description ?? ""),
        location: String(body.location ?? ""),
        start,
        end,
        all_day: body.allDay === true
      })
    };
  } else if (action === "delete") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "missing_id" }, { status: 400 });
    url = `${base}/api/v1/calendar/events/${id}?token=${tq}`;
    init = { method: "DELETE", headers: { Accept: "application/json" }, cache: "no-store" };
  } else {
    const fromIso = isoOrNull(body.from);
    const toIso = isoOrNull(body.to);
    const from = encodeURIComponent(fromIso ?? isoFloorToday());
    const to = encodeURIComponent(toIso ?? isoPlusDays(body.days ?? 30));
    url = `${base}/api/v1/calendar/events?token=${tq}&start_from=${from}&start_to=${to}`;
    init = { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" };
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchWithSsrfGuard(url, { ...init, signal: ac.signal });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const code = res.status === 401 ? "unauthorized" : "fetch_failed";
      void logPluginApiFailure("selfmailer-calendar", action, `http_${res.status}`, {
        status: res.status,
        detail: text.slice(0, 200)
      });
      return NextResponse.json(
        { error: code, status: res.status, detail: text.slice(0, 200) },
        { status: res.status === 401 ? 401 : 502 }
      );
    }
    if (action === "summary") {
      return NextResponse.json({ events: Array.isArray(json) ? json : [] });
    }
    return NextResponse.json(json ?? {});
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("selfmailer-calendar", action, `blocked_url:${e.message}`);
      return NextResponse.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("selfmailer-calendar", action, aborted ? "timeout" : msg);
    return NextResponse.json(
      { error: aborted ? "timeout" : "fetch_failed", detail: msg },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
function selfmailerCalendarServerHandler(ctx) {
  return handleCalendarRequest(ctx.request);
}
var server_default = selfmailerCalendarServerHandler;
export {
  server_default as default,
  handleCalendarRequest,
  selfmailerCalendarServerHandler
};
