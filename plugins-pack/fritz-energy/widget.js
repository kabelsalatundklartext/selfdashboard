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

  // plugins/fritz-energy/index.tsx
  var import_react3 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var import_react2 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/shared/src/utils.js
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && array.indexOf(className) === index;
  }).join(" ");

  // node_modules/lucide-react/dist/esm/Icon.js
  var import_react = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/defaultAttributes.js
  var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  // node_modules/lucide-react/dist/esm/Icon.js
  var Icon = (0, import_react.forwardRef)(
    ({
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className = "",
      children,
      iconNode,
      ...rest
    }, ref) => {
      return (0, import_react.createElement)(
        "svg",
        {
          ref,
          ...defaultAttributes,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
          className: mergeClasses("lucide", className),
          ...rest
        },
        [
          ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      );
    }
  );

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component = (0, import_react2.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
        ...props
      })
    );
    Component.displayName = `${iconName}`;
    return Component;
  };

  // node_modules/lucide-react/dist/esm/icons/bolt.js
  var Bolt = createLucideIcon("Bolt", [
    [
      "path",
      {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
        key: "yt0hxn"
      }
    ],
    ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/calendar-days.js
  var CalendarDays = createLucideIcon("CalendarDays", [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }],
    ["path", { d: "M8 14h.01", key: "6423bh" }],
    ["path", { d: "M12 14h.01", key: "1etili" }],
    ["path", { d: "M16 14h.01", key: "1gbofw" }],
    ["path", { d: "M8 18h.01", key: "lrp35t" }],
    ["path", { d: "M12 18h.01", key: "mhygvu" }],
    ["path", { d: "M16 18h.01", key: "kzsmim" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/calendar.js
  var Calendar = createLucideIcon("Calendar", [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/chevron-left.js
  var ChevronLeft = createLucideIcon("ChevronLeft", [
    ["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/chevron-right.js
  var ChevronRight = createLucideIcon("ChevronRight", [
    ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/zap.js
  var Zap = createLucideIcon("Zap", [
    [
      "path",
      {
        d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        key: "1xq2db"
      }
    ]
  ]);

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
  function fetchAbortSignal(outer, timeoutMs) {
    const timers = [];
    const cleanup = () => {
      for (const t of timers) clearTimeout(t);
    };
    const parts = [];
    if (outer) parts.push(outer);
    if (timeoutMs && timeoutMs > 0) {
      const tc = new AbortController();
      timers.push(setTimeout(() => tc.abort(), timeoutMs));
      parts.push(tc.signal);
    }
    if (parts.length === 0) return { signal: void 0, cleanup };
    if (parts.length === 1) return { signal: parts[0], cleanup };
    const anyFn = AbortSignal.any;
    if (typeof anyFn === "function") return { signal: anyFn(parts), cleanup };
    const linked = new AbortController();
    const onAbort = () => linked.abort();
    for (const s of parts) {
      if (s.aborted) {
        linked.abort();
        break;
      }
      s.addEventListener("abort", onAbort, { once: true });
    }
    return { signal: linked.signal, cleanup };
  }
  async function pluginApiJson(pluginId, path, init) {
    const url = path.startsWith("/api/") ? path : `/api/plugins/${pluginId}${path.startsWith("/") ? path : `/${path}`}`;
    const { timeoutMs, signal: outerSignal, ...rest } = init ?? {};
    const { signal, cleanup } = fetchAbortSignal(outerSignal ?? void 0, timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        ...signal ? { signal } : {},
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
      cleanup();
    }
  }

  // plugins/fritz-energy/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "fritz-energy",
    name: "FRITZ! Steckdose Energie",
    description: "Stromverbrauch FRITZ!Smart Energy / Steckdose per TR-064 (aktuell, heute, 7 Tage, Monat). API: /api/plugins/fritz-energy.",
    version: "1.2.0",
    author: "SelfDashboard",
    category: "network",
    icon: "\u26A1",
    iconUrl: "/plugin-logos/fritzbox.svg",
    defaultLayout: { w: 2, h: 2, minW: 1, minH: 2 }
  };
  function str(v) {
    return typeof v === "string" ? v.trim() : "";
  }
  function num(v, fallback = 0) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function pluginDe(r, dashboardDe) {
    const lang = str(r.uiLanguage).toLowerCase();
    if (lang === "de") return true;
    if (lang === "en") return false;
    return dashboardDe;
  }
  function fritzEnergyError(code, de) {
    const base = code.split(":")[0];
    switch (base) {
      case "unauthorized":
        return de ? "Anmeldung fehlgeschlagen \u2014 Benutzername und Passwort pr\xFCfen (FRITZ!Box-Benutzer mit TR-064-Recht)." : "Login failed \u2014 check username and password (FRITZ!Box user with TR-064 access).";
      case "desc_not_found":
        return de ? "TR-064 nicht erreichbar \u2014 Basis-URL (http://192.168.1.1), Benutzer/Passwort, Zugriff f\xFCr Apps in der Box." : "TR-064 unreachable \u2014 check base URL (http://192.168.1.1), credentials, app access on the router.";
      case "homeauto_not_found":
        return de ? "Smart-Home-Dienst nicht gefunden \u2014 TR-064-URL und Smart-Home-Rechte des Benutzers pr\xFCfen." : "Smart Home service not found \u2014 check TR-064 URL and user Smart Home rights.";
      case "timeout":
        return de ? "Zeit\xFCberschreitung beim Abruf." : "Request timed out.";
      case "network":
        return de ? "Netzwerkfehler \u2014 Server erreicht die Box nicht." : "Network error \u2014 server cannot reach the router.";
      case "list_failed":
        return de ? "Ger\xE4teliste konnte nicht geladen werden." : "Could not load device list.";
      case "import_failed":
        return de ? "Verlauf konnte nicht von der FRITZ!Box gelesen werden." : "Could not import history from FRITZ!Box.";
      case "device_not_found":
        return de ? "Steckdose mit dieser AIN nicht gefunden." : "No outlet found for this AIN.";
      case "homeauto_unauthorized":
        return de ? "FRITZ!-Benutzer hat keine Smart-Home-Rechte. In der Box: System \u2192 FRITZ!-Benutzer \u2192 Benutzer bearbeiten \u2192 \u201ESmart Home\u201C aktivieren." : "FRITZ!Box user lacks Smart Home rights. Enable Smart Home for this user in System \u2192 FRITZ!Box users.";
      case "no_multimeter":
        return de ? "Ger\xE4t meldet keine Leistungsmessung \u2014 FRITZ!Smart Energy 200?" : "Device has no power meter.";
      default:
        if (base.startsWith("homeauto_fault_")) {
          return de ? `FRITZ!Box Homeauto-Fehler (${base}). AIN pr\xFCfen oder HTTPS + selbstsigniert nutzen.` : `FRITZ!Box Homeauto error (${base}). Check AIN or use HTTPS with self-signed TLS.`;
        }
        return code;
    }
  }
  function formatKwh(n, locale) {
    const loc = locale === "en" ? "en-GB" : "de-DE";
    if (n < 0.01 && n > 0) return `${(n * 1e3).toLocaleString(loc, { maximumFractionDigits: 0 })} Wh`;
    return `${n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
  }
  function formatW(n, locale) {
    const loc = locale === "en" ? "en-GB" : "de-DE";
    if (n >= 1e3) return `${(n / 1e3).toLocaleString(loc, { maximumFractionDigits: 2 })} kW`;
    return `${Math.round(n).toLocaleString(loc)} W`;
  }
  var TINT = {
    amber: { solid: "#f59e0b", wash: "rgba(245, 158, 11, 0.18)", rim: "rgba(245, 158, 11, 0.38)" },
    sky: { solid: "#38bdf8", wash: "rgba(56, 189, 248, 0.18)", rim: "rgba(56, 189, 248, 0.38)" },
    violet: { solid: "#a78bfa", wash: "rgba(167, 139, 250, 0.18)", rim: "rgba(167, 139, 250, 0.38)" },
    emerald: { solid: "#34d399", wash: "rgba(52, 211, 153, 0.18)", rim: "rgba(52, 211, 153, 0.38)" }
  };
  function StatTile({
    label,
    value,
    sub,
    icon: Icon2,
    tint,
    fill
  }) {
    const c = TINT[tint];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: fill ? "sd-fritz-energy-tile" : void 0,
        style: {
          borderRadius: "12px",
          background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
          border: "1px solid var(--border)",
          boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
          padding: fill ? "9px 10px 9px 11px" : "8px 10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "2px",
          minWidth: 0,
          minHeight: 0,
          height: fill ? "100%" : void 0,
          boxSizing: "border-box",
          containerType: fill ? "size" : "inline-size"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 13, strokeWidth: 2.25, style: { color: c.solid, flexShrink: 0, opacity: 0.95 }, "aria-hidden": true }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "span",
              {
                className: fill ? "sd-fritz-energy-tile-label" : void 0,
                style: {
                  fontSize: fill ? void 0 : "9px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: label
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: `tabular-nums${fill ? " sd-fritz-energy-tile-value" : ""}`,
              style: {
                fontSize: fill ? void 0 : "clamp(0.78rem, min(3.5cqmin, 2.8cqh), 1.35rem)",
                fontWeight: 800,
                lineHeight: 1.12,
                color: c.solid,
                fontVariantNumeric: "tabular-nums",
                marginTop: fill ? "4px" : "2px"
              },
              children: value
            }
          ),
          sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.3, marginTop: "2px" }, children: sub }) : null
        ]
      }
    );
  }
  function viewModeFromConfig(config) {
    const v = str(config.viewMode).toLowerCase();
    return v === "grid" ? "grid" : "carousel";
  }
  function PowerSparkline({ points, compact }) {
    if (points.length < 2) return null;
    const w = 280;
    const h = compact ? 28 : 40;
    const vals = points.map((p) => p.powerW);
    const max = Math.max(1, ...vals);
    const step = w / (vals.length - 1);
    const d = vals.map((v, i) => {
      const x = i * step;
      const y = h - v / max * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "svg",
      {
        viewBox: `0 0 ${w} ${h}`,
        width: "100%",
        height: h,
        style: { display: "block", marginTop: compact ? 4 : 6 },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, fill: "none", stroke: "#f59e0b", strokeWidth: compact ? 1.5 : 2, strokeLinejoin: "round" })
      }
    );
  }
  function useWidgetSize(ref) {
    const [size, setSize] = (0, import_react3.useState)({ compact: false, narrow: false });
    (0, import_react3.useEffect)(() => {
      const el = ref.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({
          narrow: width < 150,
          compact: height < 130 || width < 220
        });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [ref]);
    return size;
  }
  function EnergyCarousel({
    views,
    recent,
    de,
    forceCompact
  }) {
    const rootRef = (0, import_react3.useRef)(null);
    const { compact: autoCompact, narrow } = useWidgetSize(rootRef);
    const compact = forceCompact || autoCompact || narrow;
    const [idx, setIdx] = (0, import_react3.useState)(0);
    const n = views.length;
    const safeIdx = n > 0 ? (idx % n + n) % n : 0;
    const view = views[safeIdx];
    if (!view) return null;
    const go = (delta) => setIdx((i) => (i + delta + n) % n);
    const showSpark = view.showSparkline && !compact;
    const navBtn = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: narrow ? 22 : compact ? 26 : 28,
      height: narrow ? 22 : compact ? 26 : 28,
      borderRadius: 6,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      cursor: "pointer",
      flexShrink: 0,
      padding: 0
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: rootRef,
        className: "sd-fritz-energy-carousel-host",
        style: {
          display: "flex",
          flexDirection: "column",
          gap: compact ? 5 : 7,
          minHeight: 0,
          height: "100%",
          containerType: "size"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .sd-fritz-energy-carousel-host .sd-fritz-energy-carousel-value {
          font-size: clamp(0.85rem, min(4.2cqmin, 3.4cqh), 1.35rem);
        }
      ` }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: compact ? 4 : 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => go(-1), style: navBtn, "aria-label": de ? "Vorherige Ansicht" : "Previous view", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: compact ? 15 : 16, "aria-hidden": true }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, minWidth: 0, textAlign: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: compact ? 9 : 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(view.icon, { size: narrow ? 12 : compact ? 11 : 12, style: { color: view.accent }, "aria-hidden": true }),
                  narrow ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: view.label })
                ]
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => go(1), style: navBtn, "aria-label": de ? "N\xE4chste Ansicht" : "Next view", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: compact ? 15 : 16, "aria-hidden": true }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                borderRadius: compact ? 10 : 12,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                padding: compact ? "8px 6px" : "10px 8px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: compact ? 2 : 4,
                flex: "1 1 auto",
                minHeight: 0
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    className: "tabular-nums sd-fritz-energy-carousel-value",
                    style: {
                      fontWeight: 800,
                      lineHeight: 1.08,
                      color: view.accent,
                      fontVariantNumeric: "tabular-nums"
                    },
                    children: view.value
                  }
                ),
                view.sub && !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 10, color: "var(--text-muted)" }, children: view.sub }) : null
              ]
            }
          ),
          showSpark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerSparkline, { points: recent.slice(-60), compact }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: compact ? 4 : 5,
                flexWrap: "wrap",
                minHeight: compact ? 14 : 16
              },
              children: [
                views.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => setIdx(i),
                    "aria-label": v.label,
                    "aria-current": i === safeIdx ? "true" : void 0,
                    style: {
                      width: compact ? 6 : 7,
                      height: compact ? 6 : 7,
                      borderRadius: "50%",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      background: i === safeIdx ? view.accent : "var(--border)",
                      opacity: i === safeIdx ? 1 : 0.55
                    }
                  },
                  v.id
                )),
                compact && view.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "span",
                  {
                    style: {
                      fontSize: 9,
                      color: "var(--text-muted)",
                      marginLeft: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: narrow ? "42%" : "55%"
                    },
                    title: view.sub,
                    children: narrow && view.subShort ? view.subShort : view.sub
                  }
                ) : null
              ]
            }
          )
        ]
      }
    );
  }
  function Widget({ config }) {
    const { locale, de } = usePluginLocale();
    const rootRef = (0, import_react3.useRef)(null);
    const [data, setData] = (0, import_react3.useState)(null);
    const [err, setErr] = (0, import_react3.useState)(null);
    const viewMode = viewModeFromConfig(config);
    const baseUrl = str(config.baseUrl) || "http://192.168.1.1";
    const username = str(config.username);
    const password = str(config.password);
    const ain = str(config.ain);
    const refreshSec = Math.min(300, Math.max(15, num(config.refreshSeconds, 60)));
    const insecureTls = config.insecureTls === true;
    const fetchEnergy = (0, import_react3.useCallback)(async () => {
      if (!ain) {
        setErr(locale === "en" ? "Set AIN in settings" : "AIN in den Einstellungen eintragen");
        return;
      }
      setErr(null);
      try {
        const j = await pluginApiJson("fritz-energy", "/", {
          method: "POST",
          body: JSON.stringify({ baseUrl, username, password, ain, insecureTls })
        });
        if (!j.ok) {
          setErr(j.error ?? "fetch_failed");
          setData(null);
          return;
        }
        setData(j);
      } catch (e) {
        reportPluginCatch("fritz-energy", e, "fetch");
        setErr("network");
        setData(null);
      }
    }, [ain, baseUrl, username, password, insecureTls, locale]);
    (0, import_react3.useEffect)(() => {
      void fetchEnergy();
      const id = setInterval(() => void fetchEnergy(), refreshSec * 1e3);
      return () => clearInterval(id);
    }, [fetchEnergy, refreshSec]);
    const labels = de ? { now: "Aktuell", today: "Heute", week: "7 Tage", month: "Monat" } : { now: "Now", today: "Today", week: "7 days", month: "Month" };
    if (!ain) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--text-muted)" }, children: de ? "Bitte AIN der Steckdose in den Widget-Einstellungen eintragen (z. B. 11630 0425503)." : "Enter the device AIN in widget settings." });
    }
    if (err) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: 13, color: "var(--danger, #f87171)" }, children: fritzEnergyError(err, de) });
    }
    const power = num(data?.currentPowerW);
    const today = num(data?.todayKwh);
    const week = num(data?.last7DaysKwh);
    const month = num(data?.monthKwh);
    const recent = Array.isArray(data?.recent) ? data.recent : [];
    const carouselViews = [
      {
        id: "now",
        label: labels.now,
        value: formatW(power, locale),
        sub: data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : void 0,
        subShort: data?.voltageV != null ? `${num(data.voltageV).toFixed(0)}V` : void 0,
        icon: Zap,
        accent: "#f59e0b",
        showSparkline: true
      },
      {
        id: "today",
        label: labels.today,
        value: formatKwh(today, locale),
        icon: Bolt,
        accent: "#38bdf8"
      },
      {
        id: "week",
        label: labels.week,
        value: formatKwh(week, locale),
        icon: CalendarDays,
        accent: "#a78bfa"
      },
      {
        id: "month",
        label: labels.month,
        value: formatKwh(month, locale),
        icon: Calendar,
        accent: "#34d399"
      }
    ];
    if (viewMode === "carousel") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        EnergyCarousel,
        {
          views: carouselViews,
          recent,
          de,
          forceCompact: config.compactUi === true
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: rootRef,
        className: "sd-fritz-energy-host",
        style: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
          containerType: "size"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .sd-fritz-energy-host .sd-fritz-energy-tile-value {
          font-size: clamp(0.78rem, min(4.8cqmin, 3.8cqh), 1.45rem);
        }
        .sd-fritz-energy-host .sd-fritz-energy-tile-label {
          font-size: clamp(8px, min(1.9cqmin, 1.6cqh), 10px);
        }
      ` }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: "sd-fritz-energy-stat-grid",
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gridTemplateRows: "1fr 1fr",
                gap: 8,
                flex: 1,
                minHeight: 0,
                alignContent: "stretch"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  StatTile,
                  {
                    label: labels.now,
                    value: formatW(power, locale),
                    sub: data?.voltageV != null ? `${num(data.voltageV).toFixed(1)} V` : void 0,
                    icon: Zap,
                    tint: "amber",
                    fill: true
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: labels.today, value: formatKwh(today, locale), icon: Bolt, tint: "sky", fill: true }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: labels.week, value: formatKwh(week, locale), icon: CalendarDays, tint: "violet", fill: true }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: labels.month, value: formatKwh(month, locale), icon: Calendar, tint: "emerald", fill: true })
              ]
            }
          )
        ]
      }
    );
  }
  function Settings({ config, onChange }) {
    const { de: dashboardDe } = usePluginLocale();
    const r = config;
    const de = pluginDe(r, dashboardDe);
    const [devices, setDevices] = (0, import_react3.useState)([]);
    const [listErr, setListErr] = (0, import_react3.useState)(null);
    const [listing, setListing] = (0, import_react3.useState)(false);
    const [importing, setImporting] = (0, import_react3.useState)(false);
    const [importMsg, setImportMsg] = (0, import_react3.useState)(null);
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
    const refresh = (() => {
      const v = r.refreshSeconds;
      if (v === void 0 || v === null || v === "") return 60;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return 60;
      return Math.min(300, Math.max(15, n));
    })();
    const importHistory = async () => {
      if (!str(r.ain)) {
        setImportMsg(de ? "Zuerst AIN eintragen." : "Enter AIN first.");
        return;
      }
      setImporting(true);
      setImportMsg(null);
      try {
        const j = await pluginApiJson("fritz-energy", "/", {
          method: "POST",
          body: JSON.stringify({
            action: "importHistory",
            importHistory: true,
            baseUrl: str(r.baseUrl) || "http://192.168.1.1",
            username: str(r.username),
            password: typeof r.password === "string" ? r.password : "",
            ain: str(r.ain),
            insecureTls: r.insecureTls === true
          })
        });
        if (!j.ok) {
          setImportMsg(fritzEnergyError(j.error ?? "import_failed", de));
          return;
        }
        setImportMsg(
          j.historyImported ? de ? "Verlauf von der FRITZ!Box \xFCbernommen (heute / 7 Tage / Monat)." : "History imported from FRITZ!Box (today / 7 days / month)." : de ? "Kein Verlauf von der Box \u2014 nur Live-Werte. Smart-Home-Rechte und FRITZ!OS 7+ pr\xFCfen." : "No history from box \u2014 live values only. Check Smart Home rights and FRITZ!OS 7+."
        );
      } catch {
        setImportMsg(fritzEnergyError("network", de));
      } finally {
        setImporting(false);
      }
    };
    const loadDevices = async () => {
      setListing(true);
      setListErr(null);
      try {
        const j = await pluginApiJson("fritz-energy", "/", {
          method: "POST",
          body: JSON.stringify({
            action: "listDevices",
            baseUrl: str(r.baseUrl) || "http://192.168.1.1",
            username: str(r.username),
            password: typeof r.password === "string" ? r.password : "",
            insecureTls: r.insecureTls === true
          })
        });
        if (!j.ok) {
          setListErr(fritzEnergyError(j.error ?? "list_failed", de));
          setDevices([]);
          return;
        }
        setDevices(j.devices ?? []);
        if ((j.devices ?? []).length === 0) {
          setListErr(de ? "Keine Smart-Home-Ger\xE4te gefunden." : "No Smart Home devices found.");
        }
      } catch {
        setListErr(fritzEnergyError("network", de));
      } finally {
        setListing(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Stromverbrauch per ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TR-064" }),
        " (Port ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "49000" }),
        " bei",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        "). Basis-URL z.\u202FB.",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http://192.168.1.1" }),
        " \u2014 bei HTTPS Haken \u201Eselbstsigniert\u201C. Heute / 7 Tage / Monat kommen bei jedem Abruf von der FRITZ!Box (nicht lokal mitgez\xE4hlt)."
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Power use via ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TR-064" }),
        " (port ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "49000" }),
        " for",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        "). Base URL e.g.",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http://192.168.1.1" }),
        " \u2014 for HTTPS enable self-signed TLS. Today / 7 days / month are read from the FRITZ!Box on every poll (not counted locally)."
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Basis-URL" : "Base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(r.baseUrl),
            onChange: (e) => onChange("baseUrl", e.target.value),
            placeholder: "http://192.168.1.1"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Benutzername" : "Username" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: str(r.username), onChange: (e) => onChange("username", e.target.value), autoComplete: "off" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Passwort" : "Password" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: typeof r.password === "string" ? r.password : "",
            onChange: (e) => onChange("password", e.target.value),
            autoComplete: "new-password"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "HTTPS: selbstsigniertes Zertifikat erlauben" : "HTTPS: allow self-signed certificate" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: r.insecureTls === true,
            onChange: (e) => onChange("insecureTls", e.target.checked),
            style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Widget-Anzeige" : "Widget layout" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            style: inp,
            value: viewModeFromConfig(r),
            onChange: (e) => onChange("viewMode", e.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "carousel", children: de ? "Einzelwert mit Pfeilen (\u2190 \u2192)" : "Single value with arrows (\u2190 \u2192)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "grid", children: de ? "Alle Kacheln gleichzeitig" : "All tiles at once" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "Einzelansicht: Aktuell, Heute, 7 Tage und Monat per Pfeil oder Punkt wechseln. Widget verkleinern (min. 1 Spalte breit)." : "Carousel: now, today, 7 days, month. Shrink the widget on the dashboard (min. 1 column wide)." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "Immer kompakte Darstellung" : "Always use compact layout" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: r.compactUi === true,
            onChange: (e) => onChange("compactUi", e.target.checked),
            style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "-6px 0 0", lineHeight: 1.45 }, children: de ? "Ohne Haken passt sich die Ansicht beim Verkleinern automatisch an (Verlauf aus, kleinere Schrift)." : "When off, the UI adapts when you resize smaller (hides sparkline, smaller text)." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Sprache (Anzeige)" : "Display language" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            style: inp,
            value: (() => {
              const v = str(r.uiLanguage).toLowerCase();
              return v === "de" || v === "en" ? v : "auto";
            })(),
            onChange: (e) => onChange("uiLanguage", e.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "auto", children: de ? "Wie Dashboard" : "Match dashboard" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "de", children: "Deutsch" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "en", children: "English" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            borderTop: "1px solid var(--border)",
            paddingTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0 }, children: de ? "Steckdose" : "Outlet" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "AIN" : "AIN" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  value: str(r.ain),
                  onChange: (e) => onChange("ain", e.target.value),
                  placeholder: "11630 0425503"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "AIN in der FRITZ!Box unter Smart Home \u2192 Ger\xE4t \u2192 Allgemein. Unten \u201EGer\xE4te laden\u201C w\xE4hlt die AIN per Klick." : "AIN in FRITZ!Box Smart Home \u2192 device \u2192 General. Use \u201CLoad devices\u201D below to pick one." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => void loadDevices(),
                  disabled: listing,
                  style: {
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: listing ? "wait" : "pointer"
                  },
                  children: listing ? de ? "Lade Ger\xE4te\u2026" : "Loading devices\u2026" : de ? "Ger\xE4te laden" : "Load devices"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => void importHistory(),
                  disabled: importing,
                  style: {
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: importing ? "wait" : "pointer"
                  },
                  children: importing ? de ? "Importiere Verlauf\u2026" : "Importing history\u2026" : de ? "Verlauf von FRITZ!Box holen" : "Import history from FRITZ!Box"
                }
              )
            ] }),
            importMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }, children: importMsg }) : null,
            listErr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--danger, #f87171)", margin: 0, lineHeight: 1.45 }, children: listErr }) : null,
            devices.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { margin: 0, paddingLeft: 18, fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }, children: devices.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { style: { marginBottom: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                type: "button",
                style: {
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "12px"
                },
                onClick: () => onChange("ain", d.ain),
                children: [
                  d.name,
                  " \u2014 ",
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: d.ain })
                ]
              }
            ) }, d.ain)) }) : null
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Aktualisieren (Sekunden)" : "Refresh (seconds)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 15,
            max: 300,
            value: refresh,
            onChange: (e) => onChange("refreshSeconds", Math.min(300, Math.max(15, Math.round(Number(e.target.value)) || 60)))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "15\u2013300: wie oft Leistung und Z\xE4hler von der Box geholt werden." : "15\u2013300: how often power and meter values are polled." })
      ] })
    ] });
  }
  var component = {
    Widget,
    Settings
  };

  // plugin-pack/staging/.entries/fritz-energy.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/bolt.js:
lucide-react/dist/esm/icons/calendar-days.js:
lucide-react/dist/esm/icons/calendar.js:
lucide-react/dist/esm/icons/chevron-left.js:
lucide-react/dist/esm/icons/chevron-right.js:
lucide-react/dist/esm/icons/zap.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
