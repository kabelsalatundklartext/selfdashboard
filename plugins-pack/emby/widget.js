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

  // plugins/emby/index.tsx
  var import_react = __toESM(require_react());

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

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // plugins/emby/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "emby",
    name: "Emby",
    description: "Aktive Wiedergaben per Emby-/Jellyfin-kompatibler API: Nutzer, Titel, Ger\xE4t, Pause (Basis-URL + API-Key).",
    version: "1.0.5",
    author: "SelfDashboard",
    category: "media",
    icon: "\u{1F3AC}",
    iconUrl: "/plugin-logos/emby.png"
  };
  function num(v) {
    if (v == null || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  function normalizeBase(url) {
    return url.trim().replace(/\/$/, "");
  }
  async function fetchSessionsJson(base, apiKey) {
    const headers = {
      Accept: "application/json",
      "X-Emby-Token": apiKey
    };
    const tryPaths = ["/emby/Sessions", "/Sessions"];
    let lastErr = null;
    for (const p of tryPaths) {
      const res = await fetch(`${base}${p}`, { method: "GET", headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
      if (res.status === 404) continue;
      const t = await res.text().catch(() => "");
      lastErr = res.status === 401 ? "401 \u2014 API-Key pr\xFCfen" : `HTTP ${res.status}${t ? `: ${t.slice(0, 120)}` : ""}`;
      throw new Error(lastErr || `HTTP ${res.status}`);
    }
    throw new Error(lastErr || "Sessions-Endpoint nicht gefunden (/emby/Sessions oder /Sessions)");
  }
  function ticksToMs(ticks) {
    return Math.round(ticks / 1e4);
  }
  function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "\u2014";
    const s = Math.floor(ms / 1e3);
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }
  function playingSessions(sessions) {
    return sessions.filter((s) => s.NowPlayingItem && (s.NowPlayingItem.Name || s.NowPlayingItem.SeriesName));
  }
  function sessionTitle(s, de) {
    const it = s.NowPlayingItem;
    if (!it) return "\u2014";
    const series = it.SeriesName?.trim();
    const name = it.Name?.trim();
    if (series && name) return `${series} \u2014 ${name}`;
    return name || series || it.Type || (de ? "Wiedergabe" : "Playback");
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
    const [sessions, setSessions] = (0, import_react.useState)([]);
    const [error, setError] = (0, import_react.useState)(null);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const base = normalizeBase(config.url || "");
    const apiKey = String(config.apiKey || "").trim();
    const refresh = (config.refreshInterval ?? 10) * 1e3;
    const fetch_ = (0, import_react.useCallback)(async () => {
      if (!base || !apiKey) {
        setLoading(false);
        return;
      }
      try {
        const list = await fetchSessionsJson(base, apiKey);
        setSessions(list);
        setError(null);
      } catch (e) {
        reportPluginCatch("emby", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }, [base, apiKey]);
    (0, import_react.useEffect)(() => {
      fetch_();
      const id = setInterval(fetch_, refresh);
      return () => clearInterval(id);
    }, [fetch_, refresh]);
    const shell = {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: "8px 12px 12px",
      containerType: "size",
      minWidth: 0,
      width: "100%"
    };
    if (!base || !apiKey) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...shell, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "28px" }, children: "\u{1F3AC}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Emby-Basis-URL und API-Key",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
          "in den Einstellungen eintragen"
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Emby base URL and API key",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
          "in settings"
        ] }) })
      ] });
    }
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [70, 55, 80, 50].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "10px", width: `${w}%`, borderRadius: "3px" } }, i)) }) });
    }
    if (error) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...shell, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "22px" }, children: "\u26A0\uFE0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "#ef4444", marginTop: "8px", wordBreak: "break-word" }, children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? "CORS: Aufruf aus dem Browser \u2014 gleiche Domain/Reverse-Proxy oder Emby-Netzwerk-Zugriff pr\xFCfen." : "CORS: browser call \u2014 check same domain/reverse proxy or Emby network access." })
      ] });
    }
    const active = playingSessions(sessions);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: shell, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: "Emby" }),
      active.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "clamp(11px, 3cqmin, 13px)", color: "var(--text-muted)", margin: 0 }, children: de ? "Keine aktive Wiedergabe." : "Nothing playing." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0, width: "100%", minWidth: 0 }, children: active.map((s, i) => {
        const it = s.NowPlayingItem;
        const pos = num(s.PlayState?.PositionTicks);
        const run = num(it.RunTimeTicks);
        const prog = run > 0 ? `${formatDuration(ticksToMs(pos))} / ${formatDuration(ticksToMs(run))}` : formatDuration(ticksToMs(pos));
        const paused = s.PlayState?.IsPaused === true;
        const device = [s.DeviceName, s.Client].filter(Boolean).join(" \xB7 ") || (de ? "Ger\xE4t" : "Device");
        const user = s.UserName || (de ? "Nutzer" : "User");
        const tit = sessionTitle(s, de);
        const tip = [device, tit, prog].join("\n");
        const fs = "clamp(10px, 2.8cqmin, 12px)";
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "li",
          {
            title: tip,
            style: {
              listStyle: "none",
              padding: i < active.length - 1 ? "0 0 10px 0" : 0,
              margin: 0,
              borderBottom: i < active.length - 1 ? "1px solid var(--border)" : "none",
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
                        color: paused ? "#f59e0b" : "var(--accent)",
                        flexShrink: 0,
                        width: "1em",
                        textAlign: "center"
                      },
                      children: paused ? "\u23F8" : "\u25B6"
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
          s.Id ?? `${user}-${device}-${tit}-${i}`
        );
      }) })
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Basis-URL (ohne /emby)" : "Base URL (without /emby)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: config.url || "",
            onChange: (e) => onChange("url", e.target.value),
            placeholder: "http://192.168.1.20:8096"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Jellyfin nutzt oft denselben Port \u2014 das Plugin versucht ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/emby/Sessions" }),
          " und ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/Sessions" }),
          "."
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Jellyfin often uses the same port \u2014 this plugin tries ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/emby/Sessions" }),
          " and ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/Sessions" }),
          "."
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "API-Key" : "API key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, type: "password", value: config.apiKey || "", onChange: (e) => onChange("apiKey", e.target.value), placeholder: de ? "Emby \u2192 Dashboard \u2192 API-Schl\xFCssel" : "Emby \u2192 Dashboard \u2192 API key" })
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
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/emby.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
