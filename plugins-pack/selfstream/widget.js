if(!globalThis.SelfDashboard?.React)throw new Error('SelfDashboard bridge missing — reload page');if(!globalThis.SelfDashboard?.ReactDOM?.createPortal)throw new Error('SelfDashboard.ReactDOM missing — reload page');if(!globalThis.SelfDashboard?.useDashboardStore)throw new Error('SelfDashboard store bridge missing — reload page');
"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // sd-react:react
  var require_react = __commonJS({
    "sd-react:react"(exports, module) {
      module.exports = globalThis.SelfDashboard.React;
    }
  });

  // sd-react:react/jsx-runtime
  var require_jsx_runtime = __commonJS({
    "sd-react:react/jsx-runtime"(exports) {
      var R = globalThis.SelfDashboard.React;
      function jsx2(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx2;
      exports.jsxs = jsx2;
      exports.Fragment = R.Fragment;
    }
  });

  // plugins/selfstream/index.tsx
  var import_react = __toESM(require_react());

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // src/lib/reportLog.ts
  function reportClientLog(input) {
    if (typeof window === "undefined") return;
    const body = JSON.stringify({
      level: input.level ?? "error",
      source: input.source ?? "plugin",
      category: input.category,
      message: input.message,
      detail: input.detail,
      pluginId: input.pluginId,
      instanceId: input.instanceId
    });
    void fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    }).catch(() => {
    });
  }

  // src/lib/pluginLog.ts
  function formatErrorDetail(e) {
    if (e instanceof Error) {
      const stack = e.stack?.trim();
      if (stack) return stack.slice(0, 2e3);
      return e.message || void 0;
    }
    if (typeof e === "string" && e.trim()) return e.trim().slice(0, 2e3);
    if (e != null) {
      try {
        return JSON.stringify(e).slice(0, 2e3);
      } catch {
        return String(e).slice(0, 2e3);
      }
    }
    return void 0;
  }
  function reportPluginError(pluginId, message, opts) {
    reportClientLog({
      pluginId,
      source: "plugin",
      level: opts?.level ?? "error",
      category: opts?.category ?? "widget",
      message,
      detail: opts?.detail,
      instanceId: opts?.instanceId
    });
  }
  function reportPluginCatch(pluginId, e, category = "widget") {
    const message = e instanceof Error ? e.message : String(e);
    reportPluginError(pluginId, message || "Unknown error", {
      category,
      detail: formatErrorDetail(e)
    });
  }

  // src/lib/pluginDev.ts
  async function pluginApiJson(pluginId, path, init) {
    const url = path.startsWith("/api/") ? path : `/api/plugins/${pluginId}${path.startsWith("/") ? path : `/${path}`}`;
    const { timeoutMs, ...rest } = init ?? {};
    const ac = new AbortController();
    const timer = timeoutMs && timeoutMs > 0 ? setTimeout(() => ac.abort(), timeoutMs) : void 0;
    try {
      const res = await fetch(url, {
        ...rest,
        signal: rest.signal ?? ac.signal,
        headers: {
          "Content-Type": "application/json",
          ...rest.headers
        }
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = j.error ?? j.message ?? msg;
        } catch {
        }
        throw new Error(msg);
      }
      if (res.status === 204) return void 0;
      return res.json();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") throw new Error("timeout");
      throw e;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // plugins/selfstream/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "selfstream",
    name: "Selfstream",
    description: "Aktive IPTV-Streams aus dem Selfstream-Admin: Nutzer, Sender/Sendung und Laufzeit. Admin-Passwort wird serverseitig als API-Token genutzt. API: /api/plugins/selfstream.",
    version: "1.1.0",
    author: "SelfDashboard",
    category: "media",
    icon: "\u{1F4FA}",
    iconUrl: "/plugin-logos/selfstream.png",
    defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 }
  };
  function normalizeBase(url) {
    let s = url.trim().replace(/\/$/, "");
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
    if (s.endsWith("/admin")) s = s.slice(0, -"/admin".length).replace(/\/$/, "");
    return s;
  }
  function formatDuration(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "\u2014";
    const s = Math.floor(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `${m}:${String(r).padStart(2, "0")}`;
  }
  function displayLine(item) {
    const showChannel = item.title && item.channel && item.title !== item.channel;
    if (showChannel) return `${item.title} \xB7 ${item.channel}`;
    return item.title || item.channel || "\u2014";
  }
  function errLabel(code, de) {
    const map = de ? {
      auth_failed: "Admin-Passwort falsch.",
      rate_limited: "Zu viele Fehlversuche \u2014 Selfstream blockiert kurz.",
      api_not_found: "API nicht gefunden \u2014 Admin-URL (Port 8080) pr\xFCfen.",
      missing_password: "Passwort fehlt.",
      timeout: "Zeit\xFCberschreitung.",
      network_error: "Selfstream nicht erreichbar (Netzwerk/Docker).",
      selfstream_error: "Fehler bei Selfstream."
    } : {
      auth_failed: "Invalid admin password.",
      rate_limited: "Too many failed attempts \u2014 Selfstream temporarily locked.",
      api_not_found: "API not found \u2014 check admin URL (port 8080).",
      missing_password: "Password missing.",
      timeout: "Request timed out.",
      network_error: "Cannot reach Selfstream (network/Docker).",
      selfstream_error: "Selfstream error."
    };
    return map[code] || code;
  }
  function Heading({ text }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        style: {
          fontSize: "clamp(9px, 2.4cqmin, 10px)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          margin: "0 0 8px"
        },
        children: text
      }
    );
  }
  function Widget({ config }) {
    const { de } = usePluginLocale();
    const [data, setData] = (0, import_react.useState)(null);
    const [error, setError] = (0, import_react.useState)(null);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const base = normalizeBase(config.url || "");
    const password = String(config.password || "").trim();
    const refresh = (config.refreshInterval ?? 10) * 1e3;
    const showIp = config.showIp === true;
    const fetch_ = (0, import_react.useCallback)(async () => {
      if (!base || !password) {
        setLoading(false);
        return;
      }
      try {
        const j = await pluginApiJson("selfstream", "/", {
          method: "POST",
          cache: "no-store",
          body: JSON.stringify({ url: base, password })
        });
        setData(j);
        setError(null);
      } catch (e) {
        reportPluginCatch("selfstream", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [base, password]);
    (0, import_react.useEffect)(() => {
      void fetch_();
      const id = window.setInterval(() => void fetch_(), refresh);
      return () => window.clearInterval(id);
    }, [fetch_, refresh]);
    const shell = {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: "6px 8px 8px",
      containerType: "size",
      minWidth: 0,
      width: "100%"
    };
    if (!base || !password) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { de, shell });
    }
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [70, 55, 80, 50].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "10px", width: `${w}%`, borderRadius: "3px" } }, i)) }) });
    }
    if (error) {
      const code = error.split(" \u2014 ")[0];
      const detail = error.includes(" \u2014 ") ? error.split(" \u2014 ").slice(1).join(" \u2014 ") : void 0;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...shell, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "22px" }, children: "\u26A0\uFE0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "#ef4444", marginTop: "8px", wordBreak: "break-word" }, children: errLabel(code, de) }),
        detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }, children: detail }) : null
      ] });
    }
    const sessions = data?.sessions ?? [];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: shell, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: "Selfstream" }),
      sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "clamp(11px, 3cqmin, 13px)", color: "var(--text-muted)", margin: 0 }, children: de ? "Kein aktiver Stream." : "No active stream." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0, width: "100%", minWidth: 0 }, children: sessions.map((item, i) => {
        const user = item.user || (de ? "Nutzer" : "User");
        const tit = displayLine(item);
        const prog = formatDuration(item.durationSec);
        const tip = [user, tit, prog, showIp && item.ip ? item.ip : ""].filter(Boolean).join("\n");
        const fs = "clamp(10px, 2.8cqmin, 12px)";
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "li",
          {
            title: tip,
            style: {
              listStyle: "none",
              padding: i < sessions.length - 1 ? "0 0 10px 0" : 0,
              margin: 0,
              borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none",
              minWidth: 0
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  width: "100%",
                  minWidth: 0,
                  fontSize: fs,
                  lineHeight: 1.35
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "span",
                    {
                      "aria-hidden": true,
                      style: {
                        fontSize: "0.75em",
                        color: item.isCatchup ? "#a78bfa" : "var(--accent)",
                        flexShrink: 0,
                        width: "1em",
                        textAlign: "center"
                      },
                      children: item.isCatchup ? "\u23EA" : "\u25B6"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "span",
                    {
                      style: {
                        fontWeight: 700,
                        color: "var(--text)",
                        flexShrink: 0,
                        maxWidth: "38%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      },
                      children: user
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0, opacity: 0.85 }, children: ":" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "span",
                    {
                      style: {
                        flex: "1 1 auto",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text)",
                        fontWeight: 500
                      },
                      children: tit
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0, opacity: 0.85 }, children: ":" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "span",
                    {
                      style: {
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      },
                      children: prog
                    }
                  )
                ]
              }
            )
          },
          `${item.user}-${item.channel}-${item.title}-${i}`
        );
      }) })
    ] });
  }
  function EmptyState({ de, shell }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...shell, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "28px" }, children: "\u{1F4FA}" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Selfstream Admin-URL (Port 8080)",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
        "und Admin-Passwort in den Einstellungen"
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Selfstream admin URL (port 8080)",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
        "and admin password in settings"
      ] }) })
    ] });
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
    const inp = {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "6px",
      padding: "6px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Admin-Panel-URL" : "Admin panel URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: config.url || "", onChange: (e) => onChange("url", e.target.value), placeholder: "http://192.168.1.69:8080" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "Port 8080 (nicht 8000). /admin am Ende ist optional." : "Port 8080 (not 8000). Trailing /admin is optional." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Admin-Passwort" : "Admin password" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: config.password || "",
            onChange: (e) => onChange("password", e.target.value),
            placeholder: de ? "Gleiches Kennwort wie beim Login" : "Same password as admin login"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "Wird serverseitig als X-Admin-Token an /api/stats gesendet (wie im Selfstream-Admin nach dem Login)." : "Sent server-side only as X-Admin-Token to /api/stats (same as Selfstream admin after login)." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: config.refreshInterval ?? 10, onChange: (e) => onChange("refreshInterval", Number(e.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 10, children: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 15, children: "15" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 30, children: "30" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 60, children: "60" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: config.showIp === true, onChange: (e) => onChange("showIp", e.target.checked) }),
        de ? "IP im Tooltip anzeigen" : "Show IP in tooltip"
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/selfstream.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
