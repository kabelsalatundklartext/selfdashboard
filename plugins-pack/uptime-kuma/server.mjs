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

// plugins-pack/uptime-kuma/server.ts
var FETCH_TIMEOUT_MS = 12e3;
function isObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}
function str(v) {
  return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
}
function normalizeBase(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  u.username = "";
  u.password = "";
  u.hash = "";
  let out = u.toString().replace(/\/+$/, "");
  if (out.endsWith("/dashboard")) out = out.slice(0, -"/dashboard".length);
  return out.replace(/\/+$/, "");
}
function normalizeSlug(raw) {
  const slug = str(raw).replace(/^\/+|\/+$/g, "");
  if (!slug) throw new Error("missing_slug");
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) throw new Error("invalid_slug");
  return slug;
}
function normalizeStatusText(raw) {
  const s = raw.trim().toLowerCase();
  if (s === "down" || s === "pending" || s === "maintenance") return s;
  return "up";
}
function heartbeatStatus(code) {
  switch (code) {
    case 0:
      return "down";
    case 2:
      return "pending";
    case 3:
      return "maintenance";
    default:
      return "up";
  }
}
function statusRank(status) {
  switch (status) {
    case "down":
      return 0;
    case "pending":
      return 1;
    case "maintenance":
      return 2;
    default:
      return 3;
  }
}
function looksLikeHtml(text) {
  const t = text.trimStart().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}
function parseJson(text) {
  if (!text || looksLikeHtml(text)) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function latestHeartbeatStatus(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const last = list[list.length - 1];
  if (!isObject(last)) return null;
  const code = typeof last.status === "number" && Number.isFinite(last.status) ? last.status : 1;
  return heartbeatStatus(code);
}
function buildPayload(slug, pageJson, heartbeatJson) {
  if (!isObject(pageJson) || !Array.isArray(pageJson.publicGroupList)) return null;
  const heartbeatList = heartbeatJson && isObject(heartbeatJson) && isObject(heartbeatJson.heartbeatList) ? heartbeatJson.heartbeatList : null;
  const monitors = [];
  const counts = { up: 0, down: 0, pending: 0, maintenance: 0, total: 0 };
  for (const group of pageJson.publicGroupList) {
    if (!isObject(group) || !Array.isArray(group.monitorList)) continue;
    const groupName = str(group.name) || "\u2014";
    for (const m of group.monitorList) {
      if (!isObject(m)) continue;
      const name = str(m.name);
      if (!name) continue;
      const id = typeof m.id === "number" && Number.isFinite(m.id) ? m.id : monitors.length + 1;
      const fromSummary = str(m.status);
      const fromHeartbeat = heartbeatList && m.id != null ? latestHeartbeatStatus(heartbeatList[String(m.id)]) : null;
      const status = fromSummary ? normalizeStatusText(fromSummary) : fromHeartbeat ?? "pending";
      counts[status] += 1;
      counts.total += 1;
      monitors.push({
        id,
        name,
        group: groupName,
        type: str(m.type) || "http",
        status
      });
    }
  }
  monitors.sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name));
  return { slug, monitors, counts };
}
async function fetchUpstream(url, signal) {
  const res = await fetchWithSsrfGuard(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, json: parseJson(text), text };
}
function invalidResponseDetail(page, slug) {
  if (page.json && isObject(page.json) && !Array.isArray(page.json.publicGroupList)) {
    return "Antwort ohne publicGroupList \u2014 Slug oder Status-Page pr\xFCfen.";
  }
  if (looksLikeHtml(page.text)) {
    return `Kein JSON von /api/status-page/${slug} \u2014 URL/Port pr\xFCfen.`;
  }
  if (!page.json) {
    return `Ung\xFCltiges JSON (HTTP ${page.status}) von /api/status-page/${slug}.`;
  }
  return "Status-Page ohne Monitore oder unbekanntes Format.";
}
async function handleUptimeKumaPluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handleUptimeKumaPost(req);
}
async function handleUptimeKumaPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  let slug;
  try {
    base = normalizeBase(String(body.url ?? process.env.UPTIME_KUMA_URL ?? ""));
    slug = normalizeSlug(String(body.slug ?? process.env.UPTIME_KUMA_STATUS_SLUG ?? ""));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid_request";
    return Response.json({ error: msg }, { status: 400 });
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const pageUrl = `${base}/api/status-page/${encodeURIComponent(slug)}`;
    const heartbeatUrl = `${base}/api/status-page/heartbeat/${encodeURIComponent(slug)}`;
    const page = await fetchUpstream(pageUrl, ac.signal);
    if (!page.ok) {
      const detail = page.json && isObject(page.json) && typeof page.json.msg === "string" ? page.json.msg : page.text.slice(0, 200);
      const error = page.status === 404 ? "status_page_not_found" : "uptime_kuma_error";
      void logPluginApiFailure("uptime-kuma", "upstream", error, { upstreamStatus: page.status, detail });
      return Response.json({ error, detail }, { status: page.status === 404 ? 404 : 502 });
    }
    const heartbeat = await fetchUpstream(heartbeatUrl, ac.signal);
    const payload = buildPayload(slug, page.json, heartbeat.ok ? heartbeat.json : null);
    if (!payload) {
      const detail = invalidResponseDetail(page, slug);
      void logPluginApiFailure("uptime-kuma", "upstream", "invalid_response", { detail });
      return Response.json({ error: "invalid_response", detail }, { status: 502 });
    }
    return Response.json(payload);
  } catch (e) {
    if (e instanceof UnsafeOutboundUrlError) {
      void logPluginApiFailure("uptime-kuma", "request", `blocked_url:${e.message}`);
      return Response.json({ error: "blocked_url", detail: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.name === "AbortError") {
      void logPluginApiFailure("uptime-kuma", "request", "timeout");
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    void logPluginApiFailure("uptime-kuma", "request", "network_error", {
      message: e instanceof Error ? e.message : String(e)
    });
    return Response.json({ error: "network_error" }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
function uptimeKumaServerHandler(ctx) {
  return handleUptimeKumaPluginRequest(ctx.request, ctx.path);
}
export {
  uptimeKumaServerHandler as default
};
