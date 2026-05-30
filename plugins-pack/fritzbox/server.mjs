// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/fritzbox/lib/fritzboxTr064.ts
import DigestClient from "digest-fetch";
import https from "node:https";
var BLOCKED_HOSTNAMES = new Set(
  ["metadata.google.internal", "metadata.goog", "169.254.169.254"].map((h) => h.toLowerCase())
);
function normalizeBaseUrl(raw) {
  const s = raw.trim();
  if (!s) throw new Error("missing_url");
  const withProto = /^https?:\/\//i.test(s) ? s : `http://${s}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("invalid_protocol");
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error("blocked_host");
  return u;
}
function fritzboxRootFromInput(raw) {
  const u = normalizeBaseUrl(raw);
  if (!u.port || u.port === "80" || u.port === "443") {
    if (u.protocol === "http:") u.port = "49000";
    if (u.protocol === "https:") u.port = "49443";
  }
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "";
  const origin = `${u.protocol}//${u.hostname}:${u.port}`;
  return path ? `${origin}${path}` : origin;
}
function tr064OriginFromRoot(root) {
  const u = new URL(root);
  return `${u.protocol}//${u.hostname}:${u.port}`;
}
var DESCRIPTOR_PATHS = [
  "/tr064desc.xml",
  "/tr064/tr064desc.xml",
  "/tr064dev.xml",
  "/tr064/tr064dev.xml",
  "/igddesc.xml"
];
function looksLikeDeviceDescription(xml) {
  if (!xml || xml.length < 80) return false;
  if (/<html[\s>]/i.test(xml) && /<body/i.test(xml)) return false;
  return /<serviceType>/i.test(xml) && (/<deviceType>/i.test(xml) || /<root xmlns/i.test(xml) || /InternetGatewayDevice/i.test(xml));
}
async function fetchDescriptorXml(client, origin, signal, fetchOpts) {
  const tried = [];
  for (const p of DESCRIPTOR_PATHS) {
    const url = `${origin.replace(/\/+$/, "")}${p}`;
    tried.push(p);
    const descRes = await client.fetch(url, { method: "GET", signal, ...fetchOpts });
    const text = await descRes.text();
    if (descRes.status === 401 || descRes.status === 403) {
      throw new Error("unauthorized");
    }
    if (!descRes.ok) continue;
    if (!looksLikeDeviceDescription(text)) continue;
    return { xml: text, path: p };
  }
  throw new Error(`desc_not_found:${tried.join(",")}`);
}
function absUrl(origin, relativeOrAbsolute) {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const base = origin.replace(/\/+$/, "");
  const rel = relativeOrAbsolute.startsWith("/") ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${base}${rel}`;
}
function xmlFirst(body, localName) {
  const re = new RegExp(`<(?:\\w+:)?${localName}>([^<]*)</(?:\\w+:)?${localName}>`, "i");
  const m = body.match(re);
  const v = m?.[1]?.trim();
  return v && v.length > 0 ? v : null;
}
function parseIntSafe(v) {
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function parseDecimalUIntString(xml, ...localNames) {
  for (const name of localNames) {
    const v = xmlFirst(xml, name);
    if (v && /^\d+$/.test(v)) return v;
  }
  return null;
}
function parseTr064Services(descXml) {
  const out = [];
  const serviceBlocks = descXml.split(/<service[\s>]/i);
  for (let i = 1; i < serviceBlocks.length; i++) {
    const block = serviceBlocks[i] ?? "";
    const t = xmlFirst(block, "serviceType");
    const c = xmlFirst(block, "controlURL");
    if (t && c) out.push({ type: t, controlUrl: c });
  }
  return out;
}
function parseUpnpRootDeviceBasics(descXml) {
  const m = descXml.match(/<device[\s>][\s\S]*?<\/device>/i);
  const block = m?.[0] ?? descXml;
  return {
    friendlyName: xmlFirst(block, "friendlyName"),
    modelName: xmlFirst(block, "modelName"),
    manufacturer: xmlFirst(block, "manufacturer")
  };
}
function soapEnvelope(serviceUrn, action) {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body>
<u:${action} xmlns:u="${serviceUrn}"/>
</s:Body>
</s:Envelope>`;
}
async function soapAction(client, controlUrl, serviceUrn, action, signal, fetchOpts) {
  const body = soapEnvelope(serviceUrn, action);
  const soapAction2 = `"${serviceUrn}#${action}"`;
  const res = await client.fetch(controlUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: soapAction2
    },
    body,
    ...fetchOpts
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`soap_http_${res.status}`);
  }
  return text;
}
function digestClient(user, pass) {
  return new DigestClient(user || "", pass || "");
}
async function fetchFritzBoxSummary(conn, signal) {
  const root = fritzboxRootFromInput(conn.baseUrl);
  const origin = tr064OriginFromRoot(root);
  const isHttps = new URL(origin).protocol === "https:";
  const agent = isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const fetchOpts = agent ? { agent } : {};
  const client = digestClient(conn.username, conn.password);
  const { xml: descXml } = await fetchDescriptorXml(client, origin, signal, fetchOpts);
  const services = parseTr064Services(descXml);
  const deviceSvc = services.find((s) => s.type.endsWith("DeviceInfo:1")) || services.find((s) => s.type.includes("DeviceInfo")) || null;
  const wanCommonSvc = services.find((s) => s.type.endsWith("WANCommonInterfaceConfig:1")) || services.find((s) => s.type.includes("WANCommonInterfaceConfig")) || null;
  const hostsSvc = services.find((s) => /:Hosts:1$/i.test(s.type)) || services.find((s) => /:Hosts:2$/i.test(s.type)) || services.find((s) => s.type.includes("Hosts:") && !s.type.includes("IPv6")) || null;
  let modelName = null;
  let softwareVersion = null;
  let manufacturer = null;
  if (deviceSvc) {
    const ctl = absUrl(origin, deviceSvc.controlUrl);
    const xml = await soapAction(client, ctl, deviceSvc.type, "GetInfo", signal, fetchOpts);
    modelName = xmlFirst(xml, "NewModelName");
    softwareVersion = xmlFirst(xml, "NewSoftwareVersion") || xmlFirst(xml, "NewDescriptionVersion");
    manufacturer = xmlFirst(xml, "NewManufacturerName");
  }
  if (!modelName || !manufacturer) {
    const igd = parseUpnpRootDeviceBasics(descXml);
    if (!manufacturer && igd.manufacturer) manufacturer = igd.manufacturer;
    if (!modelName) modelName = igd.modelName || igd.friendlyName;
  }
  let wanAccessType = null;
  let downstreamMaxBps = null;
  let upstreamMaxBps = null;
  let wanTotalBytesReceived = null;
  let wanTotalBytesSent = null;
  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl);
    const xml = await soapAction(client, ctl, wanCommonSvc.type, "GetCommonLinkProperties", signal, fetchOpts);
    wanAccessType = xmlFirst(xml, "NewWANAccessType");
    downstreamMaxBps = parseIntSafe(xmlFirst(xml, "NewLayer1DownstreamMaxBitRate"));
    upstreamMaxBps = parseIntSafe(xmlFirst(xml, "NewLayer1UpstreamMaxBitRate"));
    try {
      const addon = await soapAction(client, ctl, wanCommonSvc.type, "GetAddonInfos", signal, fetchOpts);
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesReceived64",
        "NewX_AVM_DE_TotalBytesReceived64",
        "NewTotalBytesReceived",
        "TotalBytesReceived"
      );
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesSent64",
        "NewX_AVM_DE_TotalBytesSent64",
        "NewTotalBytesSent",
        "TotalBytesSent"
      );
    } catch {
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, wanCommonSvc.type, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, wanCommonSvc.type, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  const wanIpServices = services.filter((s) => {
    const t = s.type;
    return t.includes("WANIPConnection") && !t.includes("WANIPv6");
  });
  let connectionStatus = null;
  let uptimeSec = null;
  let externalIpv4 = null;
  let lastError = null;
  let wanConnectionType = null;
  let wanConnectionName = null;
  let natEnabled = null;
  let wanDnsServers = null;
  let primaryWanIp = null;
  for (const svc of wanIpServices) {
    const ctl = absUrl(origin, svc.controlUrl);
    try {
      const stXml = await soapAction(client, ctl, svc.type, "GetStatusInfo", signal, fetchOpts);
      connectionStatus = xmlFirst(stXml, "NewConnectionStatus") ?? connectionStatus;
      uptimeSec = parseIntSafe(xmlFirst(stXml, "NewUptime")) ?? uptimeSec;
      lastError = xmlFirst(stXml, "NewLastConnectionError") ?? lastError;
      if (!primaryWanIp) primaryWanIp = svc;
      const ipXml = await soapAction(client, ctl, svc.type, "GetExternalIPAddress", signal, fetchOpts);
      const ip = xmlFirst(ipXml, "NewExternalIPAddress");
      if (ip && ip !== "0.0.0.0") {
        externalIpv4 = ip;
        primaryWanIp = svc;
        break;
      }
    } catch {
    }
  }
  if (primaryWanIp) {
    try {
      const ctl = absUrl(origin, primaryWanIp.controlUrl);
      const infoXml = await soapAction(client, ctl, primaryWanIp.type, "GetInfo", signal, fetchOpts);
      wanConnectionType = xmlFirst(infoXml, "NewConnectionType");
      wanConnectionName = xmlFirst(infoXml, "NewName");
      const nat = xmlFirst(infoXml, "NewNATEnabled");
      if (nat === "1" || /^true$/i.test(nat ?? "")) natEnabled = true;
      else if (nat === "0" || /^false$/i.test(nat ?? "")) natEnabled = false;
      wanDnsServers = xmlFirst(infoXml, "NewDNSServers");
    } catch {
    }
  }
  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl);
    const t = primaryWanIp.type;
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  let hostCount = null;
  if (hostsSvc) {
    try {
      const hCtl = absUrl(origin, hostsSvc.controlUrl);
      const hXml = await soapAction(client, hCtl, hostsSvc.type, "GetHostNumberOfEntries", signal, fetchOpts);
      hostCount = parseIntSafe(xmlFirst(hXml, "NewHostNumberOfEntries"));
    } catch {
    }
  }
  return {
    modelName,
    softwareVersion,
    manufacturer,
    wanAccessType,
    downstreamMaxBps,
    upstreamMaxBps,
    connectionStatus,
    uptimeSec,
    externalIpv4,
    lastError,
    wanConnectionType,
    wanConnectionName,
    natEnabled,
    wanDnsServers,
    hostCount,
    wanTotalBytesReceived,
    wanTotalBytesSent
  };
}
async function fetchFritzBoxByteCountersOnly(conn, signal) {
  const root = fritzboxRootFromInput(conn.baseUrl);
  const origin = tr064OriginFromRoot(root);
  const isHttps = new URL(origin).protocol === "https:";
  const agent = isHttps && conn.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : void 0;
  const fetchOpts = agent ? { agent } : {};
  const client = digestClient(conn.username, conn.password);
  const { xml: descXml } = await fetchDescriptorXml(client, origin, signal, fetchOpts);
  const services = parseTr064Services(descXml);
  const wanCommonSvc = services.find((s) => s.type.endsWith("WANCommonInterfaceConfig:1")) || services.find((s) => s.type.includes("WANCommonInterfaceConfig")) || null;
  let wanTotalBytesReceived = null;
  let wanTotalBytesSent = null;
  if (wanCommonSvc) {
    const ctl = absUrl(origin, wanCommonSvc.controlUrl);
    const urn = wanCommonSvc.type;
    try {
      const addon = await soapAction(client, ctl, urn, "GetAddonInfos", signal, fetchOpts);
      wanTotalBytesReceived = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesReceived64",
        "NewX_AVM_DE_TotalBytesReceived64",
        "NewTotalBytesReceived",
        "TotalBytesReceived"
      );
      wanTotalBytesSent = parseDecimalUIntString(
        addon,
        "X_AVM_DE_TotalBytesSent64",
        "NewX_AVM_DE_TotalBytesSent64",
        "NewTotalBytesSent",
        "TotalBytesSent"
      );
    } catch {
    }
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, urn, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, urn, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  const wanIpServices = services.filter((s) => {
    const t = s.type;
    return t.includes("WANIPConnection") && !t.includes("WANIPv6");
  });
  const primaryWanIp = wanIpServices[0] ?? null;
  if (primaryWanIp) {
    const ctl = absUrl(origin, primaryWanIp.controlUrl);
    const t = primaryWanIp.type;
    if (!wanTotalBytesReceived) {
      try {
        const rxXml = await soapAction(client, ctl, t, "GetTotalBytesReceived", signal, fetchOpts);
        wanTotalBytesReceived = parseDecimalUIntString(rxXml, "NewTotalBytesReceived", "TotalBytesReceived");
      } catch {
      }
    }
    if (!wanTotalBytesSent) {
      try {
        const txXml = await soapAction(client, ctl, t, "GetTotalBytesSent", signal, fetchOpts);
        wanTotalBytesSent = parseDecimalUIntString(txXml, "NewTotalBytesSent", "TotalBytesSent");
      } catch {
      }
    }
  }
  return { wanTotalBytesReceived, wanTotalBytesSent };
}

// plugins-pack/fritzbox/server.ts
var FETCH_TIMEOUT_MS = 18e3;
var MAX_BODY_BYTES = 12e3;
function clampStr(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}
async function handleFritzboxPluginRequest(req, _path) {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "body_too_large" }, { status: 413 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  let baseUrl;
  try {
    baseUrl = fritzboxRootFromInput(String(body.baseUrl ?? ""));
  } catch (e) {
    const code = e instanceof Error ? e.message : "bad_url";
    return Response.json({ ok: false, error: code }, { status: 400 });
  }
  const username = clampStr(body.username, 200);
  const password = typeof body.password === "string" ? body.password.slice(0, 500) : "";
  const insecureTls = body.insecureTls === true;
  const lite = body.lite === true;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    if (lite) {
      const counters = await fetchFritzBoxByteCountersOnly(
        { baseUrl, username, password, insecureTls },
        ac.signal
      );
      return Response.json({
        ok: true,
        lite: true,
        ...counters,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const summary = await fetchFritzBoxSummary(
      { baseUrl, username, password, insecureTls },
      ac.signal
    );
    return Response.json({
      ok: true,
      ...summary,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : String(e);
    if (name === "AbortError") {
      void logPluginApiFailure("fritzbox", "request", "timeout", { lite });
      return Response.json({ ok: false, error: "timeout" }, { status: 504 });
    }
    if (msg === "unauthorized") {
      void logPluginApiFailure("fritzbox", "auth", "unauthorized", { lite });
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    void logPluginApiFailure("fritzbox", "request", msg, { lite });
    return Response.json({ ok: false, error: "fetch_failed", message: msg }, { status: 502 });
  } finally {
    clearTimeout(to);
  }
}
function fritzboxServerHandler(ctx) {
  return handleFritzboxPluginRequest(ctx.request, ctx.path);
}
var server_default = fritzboxServerHandler;
export {
  server_default as default,
  fritzboxServerHandler,
  handleFritzboxPluginRequest
};
