// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/pihole/server.ts
var FETCH_TIMEOUT_MS = 12e3;
var sessionCache = /* @__PURE__ */ new Map();
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
function cacheKey(base, password, totp) {
  return `${base}\0${password}\0${totp}`;
}
function isObject(j) {
  return j != null && typeof j === "object" && !Array.isArray(j);
}
function piHoleErrorDetail(j, fallback) {
  if (isObject(j) && isObject(j.error) && typeof j.error.message === "string") {
    return j.error.message;
  }
  return fallback;
}
async function fetchJson(url, method, headers, body, signal) {
  const h = { ...headers, Accept: "application/json" };
  if (body != null) h["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : null,
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
function authHeaders(session) {
  if (!session) return {};
  return { "X-FTL-SID": session.sid, "X-FTL-CSRF": session.csrf };
}
async function login(base, password, totp, signal) {
  const payload = { password };
  if (totp !== "") {
    const n = Number(totp);
    if (Number.isFinite(n)) payload.totp = Math.trunc(n);
  }
  const url = apiEndpoint(base, "api/auth");
  const r = await fetchJson(url, "POST", {}, payload, signal);
  if (!r.ok) {
    const detail = piHoleErrorDetail(r.json, r.text.slice(0, 240));
    const err = new Error("auth_failed");
    err.status = r.status;
    err.detail = detail;
    throw err;
  }
  if (!isObject(r.json) || !isObject(r.json.session)) {
    const err = new Error("auth_invalid");
    err.status = 502;
    err.detail = "missing session in auth response";
    throw err;
  }
  const sess = r.json.session;
  const sid = typeof sess.sid === "string" ? sess.sid : "";
  const csrf = typeof sess.csrf === "string" ? sess.csrf : "";
  if (!sid) {
    const err = new Error("auth_invalid");
    err.status = 502;
    err.detail = "empty session id";
    throw err;
  }
  const validity = typeof sess.validity === "number" && sess.validity > 0 ? sess.validity : 300;
  return { sid, csrf, expiresAt: Date.now() + validity * 1e3 - 5e3 };
}
async function getSession(base, password, totp, signal, force = false) {
  if (!password) return null;
  const key = cacheKey(base, password, totp);
  if (!force) {
    const cached = sessionCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached;
  }
  const session = await login(base, password, totp, signal);
  sessionCache.set(key, session);
  return session;
}
async function apiRequest(base, password, totp, apiPath, method, body, signal) {
  const url = apiEndpoint(base, apiPath);
  let session = await getSession(base, password, totp, signal);
  let r = await fetchJson(url, method, authHeaders(session), body, signal);
  if (r.status === 401 && password) {
    session = await getSession(base, password, totp, signal, true);
    r = await fetchJson(url, method, authHeaders(session), body, signal);
  }
  return r;
}
async function handlePiholePluginRequest(req, _path) {
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
  return handlePiholePost(req);
}
async function handlePiholePost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  let base;
  try {
    base = normalizeBase(String(body.url ?? ""));
  } catch {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }
  const password = String(body.password ?? "");
  const totp = body.totp != null && body.totp !== "" ? String(body.totp).trim() : "";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (body.action === "blocking") {
      if (typeof body.blocking !== "boolean") {
        return Response.json({ error: "missing_blocking" }, { status: 400 });
      }
      const br = await apiRequest(
        base,
        password,
        totp,
        "api/dns/blocking",
        "POST",
        { blocking: body.blocking },
        ac.signal
      );
      if (!br.ok) {
        const detail = piHoleErrorDetail(br.json, br.text.slice(0, 240));
        return Response.json(
          { error: "blocking_failed", status: br.status, detail: detail || br.text.slice(0, 240) },
          { status: br.status === 401 || br.status === 403 ? br.status : 502 }
        );
      }
      const blocking2 = isObject(br.json) && typeof br.json.blocking === "boolean" ? br.json.blocking : body.blocking;
      return Response.json({ ok: true, blocking: blocking2 });
    }
    const summaryRes = await apiRequest(base, password, totp, "api/stats/summary", "GET", null, ac.signal);
    if (!summaryRes.ok) {
      const detail = piHoleErrorDetail(summaryRes.json, summaryRes.text.slice(0, 240));
      const st = summaryRes.status === 401 || summaryRes.status === 403 ? summaryRes.status : 502;
      void logPluginApiFailure("pihole", "summary", detail || "summary_failed", {
        status: summaryRes.status
      });
      return Response.json(
        { error: "summary_failed", status: summaryRes.status, detail: detail || summaryRes.text.slice(0, 240) },
        { status: st }
      );
    }
    const blockingRes = await apiRequest(base, password, totp, "api/dns/blocking", "GET", null, ac.signal);
    let blocking = null;
    if (blockingRes.ok && isObject(blockingRes.json) && typeof blockingRes.json.blocking === "boolean") {
      blocking = blockingRes.json.blocking;
    }
    return Response.json({
      summary: isObject(summaryRes.json) ? summaryRes.json : null,
      blocking,
      blockingHttp: blockingRes.status
    });
  } catch (e) {
    const err = e;
    if (err.message === "auth_failed" || err.message === "auth_invalid") {
      void logPluginApiFailure("pihole", "auth", err.message, {
        status: err.status,
        detail: err.detail
      });
      return Response.json(
        { error: err.message, status: err.status ?? 401, detail: err.detail ?? "" },
        { status: err.status === 401 || err.status === 403 ? err.status : 502 }
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    const aborted = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("pihole", "request", aborted ? "timeout" : msg);
    return Response.json(
      { error: aborted ? "timeout" : "fetch_failed", detail: msg },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
function piholeServerHandler(ctx) {
  return handlePiholePluginRequest(ctx.request, ctx.path);
}
export {
  piholeServerHandler as default
};
