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
      function jsx10(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx10;
      exports.jsxs = jsx10;
      exports.Fragment = R.Fragment;
    }
  });

  // sd-react:react-dom
  var require_react_dom = __commonJS({
    "sd-react:react-dom"(exports, module) {
      var rd = globalThis.SelfDashboard?.ReactDOM;
      if (!rd?.createPortal) throw new Error("SelfDashboard.ReactDOM missing \u2014 reload page");
      module.exports = { createPortal: rd.createPortal, default: rd };
    }
  });

  // scripts/plugin-host-shims/dashboard-store-shim.ts
  function hostStore() {
    const h = globalThis.SelfDashboard?.useDashboardStore;
    if (!h) {
      throw new Error("SelfDashboard.useDashboardStore missing \u2014 reload the page (Ctrl+F5)");
    }
    return h;
  }
  var useDashboardStore = new Proxy(((...args) => hostStore()(...args)), {
    get(_target, prop) {
      const h = hostStore();
      const v = h[prop];
      return typeof v === "function" ? v.bind(h) : v;
    }
  });

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

  // src/lib/kiosk/kioskClientFetch.ts
  function isPublicKioskPage() {
    return typeof window !== "undefined" && window.location.pathname === "/kiosk";
  }
  function kioskAwareFetch(input, init = {}) {
    if (!isPublicKioskPage()) return fetch(input, init);
    const headers = new Headers(init.headers);
    headers.set("X-SD-Kiosk-View", "1");
    return fetch(input, {
      ...init,
      credentials: init.credentials ?? "same-origin",
      headers
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
      const res = await kioskAwareFetch(url, {
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

  // node_modules/lucide-react/dist/esm/icons/copy.js
  var Copy = createLucideIcon("Copy", [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/crosshair.js
  var Crosshair = createLucideIcon("Crosshair", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["line", { x1: "22", x2: "18", y1: "12", y2: "12", key: "l9bcsi" }],
    ["line", { x1: "6", x2: "2", y1: "12", y2: "12", key: "13hhkx" }],
    ["line", { x1: "12", x2: "12", y1: "6", y2: "2", key: "10w3f3" }],
    ["line", { x1: "12", x2: "12", y1: "22", y2: "18", key: "15g9kq" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/gavel.js
  var Gavel = createLucideIcon("Gavel", [
    ["path", { d: "m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8", key: "15492f" }],
    ["path", { d: "m16 16 6-6", key: "vzrcl6" }],
    ["path", { d: "m8 8 6-6", key: "18bi4p" }],
    ["path", { d: "m9 7 8 8", key: "5jnvq1" }],
    ["path", { d: "m21 11-8-8", key: "z4y7zo" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/globe.js
  var Globe = createLucideIcon("Globe", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
    ["path", { d: "M2 12h20", key: "9i4pu4" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/home.js
  var Home = createLucideIcon("Home", [
    ["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", key: "y5dka4" }],
    ["polyline", { points: "9 22 9 12 15 12 15 22", key: "e2us08" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/info.js
  var Info = createLucideIcon("Info", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 16v-4", key: "1dtifu" }],
    ["path", { d: "M12 8h.01", key: "e9boi3" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/network.js
  var Network = createLucideIcon("Network", [
    ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1", key: "4q2zg0" }],
    ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1", key: "8cvhb9" }],
    ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1", key: "1egb70" }],
    ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", key: "1jsf9p" }],
    ["path", { d: "M12 12V8", key: "2874zd" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/refresh-cw.js
  var RefreshCw = createLucideIcon("RefreshCw", [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
    ["path", { d: "M8 16H3v5", key: "1cv678" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/search.js
  var Search = createLucideIcon("Search", [
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
    ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/shield.js
  var Shield = createLucideIcon("Shield", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y"
      }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/trash-2.js
  var Trash2 = createLucideIcon("Trash2", [
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
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

  // plugins-pack/crowdsec-v2/CrowdsecV2Widget.tsx
  var import_react7 = __toESM(require_react());

  // plugins-pack/crowdsec-v2/lib/flags.ts
  function countryCodeToEmoji(code) {
    const cc = normalizeCountryCode(code);
    if (!cc || cc === "??") return "\u{1F310}";
    const A = 127462;
    return String.fromCodePoint(...[...cc].map((c) => A + c.toUpperCase().charCodeAt(0) - 65));
  }
  function normalizeCountryCode(raw) {
    const s = String(raw ?? "").trim().toUpperCase();
    if (!s || s === "??" || s === "XX" || s === "UNKNOWN") return "";
    if (s.length === 2 && /^[A-Z]{2}$/.test(s)) return s;
    return "";
  }
  function flagImageUrl(code, width = 40) {
    const cc = normalizeCountryCode(code).toLowerCase();
    if (!cc) return "";
    return `https://flagcdn.com/w${width}/${cc}.png`;
  }

  // plugins-pack/crowdsec-v2/lib/constants.ts
  var COUNTRY_NAME = {
    DE: "Deutschland",
    US: "USA",
    FR: "Frankreich",
    GB: "UK",
    NL: "Niederlande",
    CN: "China",
    RU: "Russland",
    BR: "Brasilien",
    IN: "Indien",
    SG: "Singapur",
    PL: "Polen",
    IT: "Italien",
    ES: "Spanien",
    SE: "Schweden",
    CH: "Schweiz",
    AT: "\xD6sterreich",
    UA: "Ukraine",
    TR: "T\xFCrkei",
    JP: "Japan",
    KR: "Korea",
    AU: "Australien",
    CA: "Kanada"
  };
  var COUNTRY_CENTROIDS = {
    DE: [51.1, 10.4],
    US: [39.8, -98.6],
    FR: [46.2, 2.2],
    GB: [55.4, -3.4],
    NL: [52.1, 5.3],
    CN: [35.9, 104.2],
    RU: [61.5, 105.3],
    BR: [-14.2, -51.9],
    IN: [20.6, 78.9],
    SG: [1.35, 103.8],
    PL: [51.9, 19.1],
    IT: [41.9, 12.6],
    ES: [40.5, -3.7],
    SE: [60.1, 18.6],
    CH: [46.8, 8.2],
    AT: [47.5, 14.5],
    UA: [48.4, 31.2],
    TR: [38.9, 35.2],
    JP: [36.2, 138.3],
    KR: [35.9, 127.8],
    AU: [-25.3, 133.8],
    CA: [56.1, -106.3]
  };
  var MAP_W = 360;
  var MAP_H = 180;
  var WORLD_MAP_IMAGE = "/api/plugins/custom-assets/crowdsec-v2/world-map-equirect.svg";
  function coordsForCountry(code) {
    const cc = normalizeCountryCode(code);
    if (!cc) return null;
    return COUNTRY_CENTROIDS[cc] ?? null;
  }
  function projectLatLon(lat, lon) {
    return {
      x: (lon + 180) / 360 * MAP_W,
      y: (90 - lat) / 180 * MAP_H
    };
  }

  // plugins-pack/crowdsec-v2/lib/format.ts
  function formatInt(n, locale) {
    return Math.round(n).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
  }
  function formatCompact(n, locale) {
    const abs = Math.abs(n);
    if (abs >= 1e6) {
      return `${(n / 1e6).toLocaleString(locale === "en" ? "en-GB" : "de-DE", { maximumFractionDigits: 1 })}M`;
    }
    if (abs >= 1e3) {
      return `${(n / 1e3).toLocaleString(locale === "en" ? "en-GB" : "de-DE", { maximumFractionDigits: 1 })}k`;
    }
    return formatInt(n, locale);
  }
  function formatRelative(iso, locale) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const sec = Math.round((d.getTime() - Date.now()) / 1e3);
    const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "de", { numeric: "auto" });
    const abs = Math.abs(sec);
    if (abs < 60) return rtf.format(sec, "second");
    const min = Math.round(sec / 60);
    if (Math.abs(min) < 60) return rtf.format(min, "minute");
    const hr = Math.round(min / 60);
    if (Math.abs(hr) < 48) return rtf.format(hr, "hour");
    const day = Math.round(hr / 24);
    return rtf.format(day, "day");
  }
  function feedMatchesSearch(item, q) {
    if (!q) return true;
    const cc = normalizeCountryCode(item.country);
    const hay = [
      item.ip,
      cc,
      COUNTRY_NAME[cc] || "",
      item.city,
      item.scenario,
      item.asname,
      item.asnumber
    ].join(" ").toLowerCase();
    return hay.includes(q);
  }
  function mapFocusFromCountry(code, zoomW = 72, zoomH = 36) {
    const coords = coordsForCountry(code);
    if (!coords) return null;
    const { x: cx, y: cy } = projectLatLon(coords[0], coords[1]);
    const cc = normalizeCountryCode(code);
    return {
      x: Math.max(0, Math.min(MAP_W - zoomW, cx - zoomW / 2)),
      y: Math.max(0, Math.min(MAP_H - zoomH, cy - zoomH / 2)),
      w: zoomW,
      h: zoomH,
      countryCode: cc || void 0
    };
  }

  // plugins-pack/crowdsec-v2/components/CountryFlag.tsx
  var import_react3 = __toESM(require_react());
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  function CountryFlag({
    code,
    size = 18,
    className = "",
    title
  }) {
    const cc = normalizeCountryCode(code) || normalizeCountryCode(code.slice(0, 2));
    const emoji = countryCodeToEmoji(cc || code);
    const src = cc ? flagImageUrl(cc, size <= 20 ? 40 : 80) : "";
    const [imgOk, setImgOk] = (0, import_react3.useState)(Boolean(src));
    if (!src || !imgOk) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "span",
        {
          className: `csv2-flag csv2-flag-emoji ${className}`.trim(),
          style: { fontSize: Math.round(size * 0.85), lineHeight: 1 },
          title: title || cc || code,
          "aria-hidden": true,
          children: emoji
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "img",
      {
        src,
        alt: "",
        width: size,
        height: Math.round(size * 0.72),
        className: `csv2-flag ${className}`.trim(),
        title: title || cc,
        loading: "lazy",
        decoding: "async",
        referrerPolicy: "no-referrer",
        onError: () => setImgOk(false)
      }
    );
  }

  // plugins-pack/crowdsec-v2/components/FeedTable.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  function originParts(cc, countryRaw, city) {
    const name = COUNTRY_NAME[cc] || cc || countryRaw || "?";
    const cityTrim = city?.trim();
    return { name, city: cityTrim };
  }
  function FeedTable({
    items,
    locale,
    selectedKey,
    onSelect,
    onLookup,
    onMapZoom,
    onCopy,
    onUnban,
    dockerUnban,
    unbanBusy,
    de
  }) {
    if (items.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "csv2-empty", children: de ? "Keine Eintr\xE4ge." : "No entries." });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "csv2-table-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("table", { className: "csv2-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "Status" : "Status" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "IP" : "IP" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "Herkunft" : "Origin" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "Angriffsart" : "Attack type" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "Zeit" : "Time" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("th", { children: de ? "Aktionen" : "Actions" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: items.map((item) => {
        const cc = normalizeCountryCode(item.country);
        const key = `${item.alertId}-${item.ip}`;
        const selected = selectedKey === key;
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "tr",
          {
            className: selected ? "csv2-row-selected" : void 0,
            onClick: () => onSelect(key),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "span",
                {
                  className: item.active_ban ? "csv2-badge csv2-badge-ban" : "csv2-badge csv2-badge-alert",
                  children: item.active_ban ? de ? "GEBANNT" : "BANNED" : "ALERT"
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "csv2-cell-ip", children: item.ip }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: "csv2-cell-origin", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CountryFlag, { code: cc || item.country, size: 16 }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "csv2-cell-origin-text", children: (() => {
                  const { name, city } = originParts(cc, item.country, item.city);
                  return city ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
                    name,
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "csv2-cell-origin-city", children: [
                      " \xB7 ",
                      city
                    ] })
                  ] }) : name;
                })() })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "csv2-cell-scenario", title: item.scenario, children: item.scenario }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { className: "csv2-cell-time", children: formatRelative(item.time_iso, locale) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("td", { className: "csv2-cell-actions", onClick: (e) => e.stopPropagation(), children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "csv2-icon-btn",
                    title: de ? "IP-Lookup" : "IP lookup",
                    onClick: (e) => onLookup(item, e.currentTarget),
                    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Search, { size: 14 })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "csv2-icon-btn",
                    title: de ? "Auf Karte zoomen" : "Zoom map",
                    onClick: () => onMapZoom(item),
                    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Crosshair, { size: 14 })
                  }
                ),
                dockerUnban && item.active_ban && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "csv2-icon-btn csv2-icon-btn-danger",
                    disabled: unbanBusy,
                    title: de ? "Entsperren" : "Unban",
                    onClick: () => onUnban(item),
                    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Trash2, { size: 13 })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    className: "csv2-icon-btn",
                    title: de ? "IP kopieren" : "Copy IP",
                    onClick: () => onCopy(item.ip),
                    children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Copy, { size: 13 })
                  }
                )
              ] })
            ]
          },
          key
        );
      }) })
    ] }) });
  }

  // plugins-pack/crowdsec-v2/components/IpLookupMenu.tsx
  var import_react4 = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  var import_jsx_runtime3 = __toESM(require_jsx_runtime());
  function IpLookupMenu({
    item,
    de,
    anchorEl,
    services,
    onClose
  }) {
    const menuRef = (0, import_react4.useRef)(null);
    const [pos, setPos] = (0, import_react4.useState)({ left: 0, top: 0 });
    (0, import_react4.useLayoutEffect)(() => {
      if (!anchorEl || !menuRef.current) return;
      const rect = anchorEl.getBoundingClientRect();
      const mw = menuRef.current.offsetWidth || 165;
      const mh = menuRef.current.offsetHeight || 260;
      let x = rect.left - mw - 8;
      let y = rect.top - 8;
      if (x < 10) x = rect.right + 8;
      if (x + mw > window.innerWidth - 10) x = window.innerWidth - mw - 10;
      if (y + mh > window.innerHeight - 10) y = window.innerHeight - mh - 10;
      if (y < 10) y = 10;
      setPos({ left: x, top: y });
    }, [anchorEl, item.ip]);
    (0, import_react4.useEffect)(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      const onClick = (e) => {
        const t = e.target;
        if (menuRef.current?.contains(t)) return;
        if (anchorEl?.contains(t)) return;
        onClose();
      };
      document.addEventListener("keydown", onKey);
      document.addEventListener("click", onClick, true);
      return () => {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onClick, true);
      };
    }, [anchorEl, onClose]);
    const cc = normalizeCountryCode(item.country);
    const menu = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        ref: menuRef,
        className: "csv2-wl-menu",
        role: "menu",
        style: { left: pos.left, top: pos.top },
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "csv2-wl-menu-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CountryFlag, { code: cc || item.country, size: 16 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              COUNTRY_NAME[cc] || cc || "?",
              " \xB7 ",
              item.ip,
              item.city ? ` \xB7 ${item.city}` : ""
            ] })
          ] }),
          services.map((s) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "a",
            {
              className: "csv2-wl-menu-item",
              href: s.href(item),
              target: "_blank",
              rel: "noopener noreferrer",
              role: "menuitem",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "csv2-wl-menu-icon", "aria-hidden": true, children: s.icon }),
                s.label
              ]
            },
            s.id
          )),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "csv2-wl-menu-close", onClick: onClose, children: [
            "\u2715 ",
            de ? "SCHLIESSEN" : "CLOSE"
          ] })
        ]
      }
    );
    if (typeof document === "undefined") return menu;
    return (0, import_react_dom.createPortal)(menu, document.body);
  }

  // plugins-pack/crowdsec-v2/lib/presets.ts
  var DAY_RANGE_PRESETS = [
    { days: 1, de: "1 Tag", en: "1 day" },
    { days: 7, de: "7 Tage", en: "7 days" },
    { days: 30, de: "30 Tage", en: "30 days" },
    { days: 90, de: "90 Tage", en: "90 days" },
    { days: 365, de: "1 Jahr", en: "1 year" },
    { days: 0, de: "Alle", en: "All" }
  ];
  var MAX_ALERT_PRESETS = [
    { value: 500, de: "500", en: "500" },
    { value: 1e3, de: "1.000", en: "1,000" },
    { value: 2e3, de: "2.000", en: "2,000" },
    { value: 5e3, de: "5.000", en: "5,000" },
    { value: 0, de: "Alle", en: "All" }
  ];
  var DAY_PRESET_VALUES = DAY_RANGE_PRESETS.map((p) => p.days);
  function nearestDayPreset(days) {
    if (DAY_PRESET_VALUES.some((d) => d === days)) return days;
    if (days <= 0) return 0;
    const positive = DAY_PRESET_VALUES.filter((d) => d > 0);
    return positive.reduce((best, d) => Math.abs(d - days) < Math.abs(best - days) ? d : best, 30);
  }
  function nearestMaxAlerts(value) {
    const presets = MAX_ALERT_PRESETS.map((p) => p.value);
    if (presets.some((v) => v === value)) return value;
    if (value <= 0) return 0;
    return presets.reduce(
      (best, v) => v > 0 && Math.abs(v - value) < Math.abs(best - value) ? v : best,
      2e3
    );
  }
  function alertRangeLabel(days, de) {
    const hit = DAY_RANGE_PRESETS.find((p) => p.days === days);
    if (hit) return de ? hit.de : hit.en;
    if (days <= 0) return de ? "Alle" : "All";
    return de ? `${days} Tage` : `${days} days`;
  }

  // plugins-pack/crowdsec-v2/components/CrowdsecLogo.tsx
  var import_react5 = __toESM(require_react());
  var import_jsx_runtime4 = __toESM(require_jsx_runtime());
  var BRAND_LOGO_SRC = "/plugin-logos/crowdsec_breit.png";
  var ICON_LOGO_SRC = "/plugin-logos/crowdsec.png";
  function LogoFallback({ height }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { height, width: height, viewBox: "0 0 64 64", "aria-hidden": true, className: "csv2-logo-svg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("linearGradient", { id: "csv2-logo-grad", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "0%", stopColor: "#5eb3ff" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("stop", { offset: "100%", stopColor: "#2b7fd4" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "circle",
        {
          cx: "32",
          cy: "32",
          r: "30",
          fill: "currentColor",
          fillOpacity: "0.12",
          stroke: "url(#csv2-logo-grad)",
          strokeWidth: "2"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "path",
        {
          fill: "url(#csv2-logo-grad)",
          d: "M32 12c-8 6-18 7-18 7v14c0 12 8 20 18 23 10-3 18-11 18-23V19s-10-1-18-7zm0 8c3 2 8 3 12 3v11c0 8-5 14-12 16-7-2-12-8-12-16V23c4 0 9-1 12-3z"
        }
      )
    ] });
  }
  function CrowdsecLogo({ variant = "brand" }) {
    const [failed, setFailed] = (0, import_react5.useState)(false);
    const src = variant === "brand" ? BRAND_LOGO_SRC : ICON_LOGO_SRC;
    if (failed) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LogoFallback, { height: variant === "brand" ? 32 : 24 });
    if (variant === "brand") {
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "img",
        {
          src,
          alt: "CrowdSec",
          className: "csv2-logo-img csv2-logo-img-brand",
          decoding: "async",
          onError: () => setFailed(true)
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "img",
      {
        src,
        alt: "",
        width: 24,
        height: 24,
        className: "csv2-logo-img",
        decoding: "async",
        onError: () => setFailed(true)
      }
    );
  }

  // plugins-pack/crowdsec-v2/components/Sidebar.tsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime());
  var NAV = [
    { id: "overview", icon: Home, de: "\xDCbersicht", en: "Overview" },
    { id: "decisions", icon: Gavel, de: "Entscheidungen", en: "Decisions" },
    { id: "countries", icon: Globe, de: "L\xE4nder", en: "Countries" },
    { id: "scenarios", icon: Shield, de: "Szenarien", en: "Scenarios", stub: true },
    { id: "bouncers", icon: Network, de: "Bouncers", en: "Bouncers", stub: true },
    { id: "about", icon: Info, de: "\xDCber CrowdSec", en: "About", stub: true }
  ];
  function Sidebar({
    tab,
    onTab,
    data,
    daysBack,
    locale,
    online
  }) {
    const de = locale !== "en";
    const localBans = data?.localActiveBans ?? 0;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("aside", { className: "csv2-sidebar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("header", { className: "csv2-brand", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CrowdsecLogo, { variant: "brand" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("nav", { className: "csv2-nav", "aria-label": de ? "Navigation" : "Navigation", children: NAV.map(({ id, icon: Icon2, de: labelDe, en: labelEn, stub }) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "button",
        {
          type: "button",
          className: `csv2-nav-btn${tab === id ? " csv2-nav-btn-active" : ""}${stub ? " csv2-nav-btn-stub" : ""}`,
          onClick: () => onTab(id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "csv2-nav-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon2, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
              de ? labelDe : labelEn
            ] }),
            id === "overview" && data && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-stat", children: formatInt(data.alertsInRange, locale) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-sub", children: de ? `Alerts (${alertRangeLabel(daysBack, true)})` : `Alerts (${alertRangeLabel(daysBack, false)})` })
            ] }),
            id === "decisions" && data && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-stat", children: formatInt(localBans, locale) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-sub", children: de ? "Lokal aktiv" : "Local active" })
            ] }),
            id === "countries" && data && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-stat", children: formatInt(data.countryCount, locale) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "csv2-nav-sub", children: de ? "in DB" : "in DB" })
            ] })
          ]
        },
        id
      )) }),
      (tab === "countries" || tab === "overview") && data && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("section", { className: "csv2-sidebar-countries", children: data.countries.slice(0, 8).map((c) => {
        const cc = normalizeCountryCode(c.country) || "??";
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "csv2-country-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CountryFlag, { code: cc, size: 14 }),
            COUNTRY_NAME[cc] || cc
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "tabular-nums", children: formatInt(c.count, locale) })
        ] }, `${cc}-${c.count}`);
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("footer", { className: "csv2-sidebar-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Zap, { size: 12, "aria-hidden": true }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "SelfDashboard" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `csv2-dot${online ? " csv2-dot-on" : ""}` }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Online" : "Online" })
      ] })
    ] });
  }

  // plugins-pack/crowdsec-v2/components/WorldMap.tsx
  var import_react6 = __toESM(require_react());
  var import_jsx_runtime6 = __toESM(require_jsx_runtime());
  function WorldMap({
    countries,
    highlightCode,
    focus,
    onSelectCountry,
    onResetZoom,
    de = true
  }) {
    const markers = (0, import_react6.useMemo)(() => {
      const max = Math.max(1, ...countries.map((c) => c.count));
      return countries.map((c) => {
        const cc = normalizeCountryCode(c.country);
        const coords = cc ? coordsForCountry(cc) : null;
        if (!coords) return null;
        const { x, y } = projectLatLon(coords[0], coords[1]);
        const r = 2.5 + c.count / max * 5;
        return { cc, x, y, r, count: c.count };
      }).filter(Boolean);
    }, [countries]);
    const hi = normalizeCountryCode(highlightCode || "");
    const hiMarker = hi ? markers.find((m) => m.cc === hi) : null;
    const viewBox = focus ? `${focus.x} ${focus.y} ${focus.w} ${focus.h}` : `0 0 ${MAP_W} ${MAP_H}`;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "csv2-map-panel", children: [
      focus && onResetZoom && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "csv2-map-reset", onClick: onResetZoom, children: de ? "Gesamt" : "Global" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "svg",
        {
          className: "csv2-map",
          viewBox,
          preserveAspectRatio: "xMidYMid meet",
          "aria-label": "Attack map",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "image",
              {
                href: WORLD_MAP_IMAGE,
                x: 0,
                y: 0,
                width: MAP_W,
                height: MAP_H,
                preserveAspectRatio: "none",
                opacity: 0.92
              }
            ),
            markers.map((m) => {
              const active = hi === m.cc;
              return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("g", { className: "csv2-map-dot-wrap", onClick: () => onSelectCountry?.(m.cc), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "circle",
                {
                  cx: m.x,
                  cy: m.y,
                  r: m.r,
                  className: active ? "csv2-map-dot csv2-map-dot-active" : "csv2-map-dot"
                }
              ) }, m.cc);
            }),
            hiMarker && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: hiMarker.x, cy: hiMarker.y, r: 12, className: "csv2-map-pulse" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "line",
                {
                  x1: hiMarker.x,
                  y1: hiMarker.y + 14,
                  x2: hiMarker.x,
                  y2: MAP_H - 4,
                  className: "csv2-map-pin-line"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: hiMarker.x, cy: hiMarker.y, r: 3.5, className: "csv2-map-pin" })
            ] })
          ]
        }
      )
    ] });
  }

  // plugins-pack/crowdsec-v2/lib/ipLookup.ts
  var LOOKUP_SERVICES = [
    {
      id: "cti",
      label: "CrowdSec CTI",
      icon: "\u{1F6E1}",
      href: (d) => `https://app.crowdsec.net/cti/${encodeURIComponent(d.ip)}`
    },
    {
      id: "shodan",
      label: "Shodan",
      icon: "\u{1F50D}",
      href: (d) => `https://www.shodan.io/host/${encodeURIComponent(d.ip)}`
    },
    {
      id: "censys",
      label: "Censys",
      icon: "\u{1F310}",
      href: (d) => `https://search.censys.io/hosts/${encodeURIComponent(d.ip)}`
    },
    {
      id: "ripe",
      label: "RIPE",
      icon: "\u{1F4CB}",
      href: (d) => {
        const q = d.iprange?.trim() || d.ip;
        return `https://apps.db.ripe.net/db-web-ui/query?bflag=true&dflag=false&rflag=false&source=GRS&searchtext=${encodeURIComponent(q)}`;
      }
    },
    {
      id: "ripestat",
      label: "RIPEstat",
      icon: "\u{1F4CA}",
      href: (d) => {
        const q = d.iprange?.trim() || d.ip;
        return `https://stat.ripe.net/${encodeURIComponent(q)}`;
      }
    },
    {
      id: "criminalip",
      label: "Criminal IP",
      icon: "\u26A0\uFE0F",
      href: (d) => `https://www.criminalip.io/asset/report/${encodeURIComponent(d.ip)}`
    }
  ];
  var DEFAULT_LOOKUP_ENABLED = {
    cti: true,
    shodan: true,
    censys: true,
    ripe: true,
    ripestat: true,
    criminalip: true
  };

  // plugins-pack/crowdsec-v2/lib/config.ts
  function cfgBool(v, fallback) {
    if (v === void 0 || v === null || v === "") return fallback;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return fallback;
  }
  function cfgNum(v, fallback) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : fallback;
  }
  function cfgStr(v, fallback) {
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  }
  function parseCrowdsecV2Config(raw) {
    const lookupRaw = raw.lookupEnabled;
    const lookupEnabled = { ...DEFAULT_LOOKUP_ENABLED };
    if (lookupRaw && typeof lookupRaw === "object" && !Array.isArray(lookupRaw)) {
      for (const id of Object.keys(DEFAULT_LOOKUP_ENABLED)) {
        lookupEnabled[id] = cfgBool(lookupRaw[id], DEFAULT_LOOKUP_ENABLED[id]);
      }
    }
    return {
      dbPath: cfgStr(raw.dbPath, "/crowdsec-data/crowdsec.db"),
      daysBack: nearestDayPreset(cfgNum(raw.daysBack, 30)),
      refreshSeconds: Math.min(600, Math.max(5, cfgNum(raw.refreshSeconds, 30))),
      maxAlerts: nearestMaxAlerts(cfgNum(raw.maxAlerts, 500)),
      dockerUnban: cfgBool(raw.dockerUnban, false),
      crowdsecContainer: cfgStr(raw.crowdsecContainer, "crowdsec"),
      lookupEnabled
    };
  }

  // plugins-pack/crowdsec-v2/CrowdsecV2Widget.tsx
  var import_jsx_runtime7 = __toESM(require_jsx_runtime());
  function CrowdsecV2Widget({
    config: raw,
    locale,
    layoutMode = "desktop",
    theme = "dark"
  }) {
    const de = locale !== "en";
    const cfg = (0, import_react7.useMemo)(() => parseCrowdsecV2Config(raw), [raw]);
    const layoutClass = layoutMode === "phone" ? "csv2-layout-phone" : layoutMode === "tablet" ? "csv2-layout-tablet" : "";
    const [data, setData] = (0, import_react7.useState)(null);
    const [error, setError] = (0, import_react7.useState)(null);
    const [loading, setLoading] = (0, import_react7.useState)(true);
    const [tab, setTab] = (0, import_react7.useState)("overview");
    const [feedFilter, setFeedFilter] = (0, import_react7.useState)("all");
    const [search, setSearch] = (0, import_react7.useState)("");
    const [selectedKey, setSelectedKey] = (0, import_react7.useState)(null);
    const [mapFocus, setMapFocus] = (0, import_react7.useState)(null);
    const [mapHighlight, setMapHighlight] = (0, import_react7.useState)();
    const [lookupItem, setLookupItem] = (0, import_react7.useState)(null);
    const [lookupAnchor, setLookupAnchor] = (0, import_react7.useState)(null);
    const [unbanPending, setUnbanPending] = (0, import_react7.useState)(null);
    const [unbanBusy, setUnbanBusy] = (0, import_react7.useState)(false);
    const [unbanMsg, setUnbanMsg] = (0, import_react7.useState)(null);
    const lookupServices = (0, import_react7.useMemo)(
      () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
      [cfg.lookupEnabled]
    );
    const fetchData = (0, import_react7.useCallback)(async () => {
      const params = new URLSearchParams({
        dbPath: cfg.dbPath,
        daysBack: String(cfg.daysBack),
        maxAlerts: String(Math.min(cfg.maxAlerts, 2e3))
      });
      try {
        const json = await pluginApiJson("crowdsec-v2", `/?${params}`, {
          timeoutMs: 5e4
        });
        setData(json);
        setError(null);
      } catch (e) {
        const code = e instanceof Error ? e.message : "crowdsec_error";
        reportPluginError("crowdsec-v2", code, { category: "fetch" });
        setError(code.startsWith("HTTP ") ? "network_error" : code);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [cfg.dbPath, cfg.daysBack, cfg.maxAlerts]);
    (0, import_react7.useEffect)(() => {
      setLoading(true);
      void fetchData();
      const id = window.setInterval(() => void fetchData(), cfg.refreshSeconds * 1e3);
      return () => window.clearInterval(id);
    }, [fetchData, cfg.refreshSeconds]);
    (0, import_react7.useEffect)(() => {
      if (tab === "decisions") setFeedFilter("ban");
      else if (tab === "overview") setFeedFilter("all");
    }, [tab]);
    const q = search.trim().toLowerCase();
    const filteredFeed = (0, import_react7.useMemo)(() => {
      if (!data) return [];
      let list = data.feed;
      if (feedFilter === "ban") list = list.filter((f) => f.active_ban);
      if (feedFilter === "alert") list = list.filter((f) => !f.active_ban);
      return list.filter((f) => feedMatchesSearch(f, q));
    }, [data, feedFilter, q]);
    const localBans = data?.localActiveBans ?? 0;
    const capiBans = data?.capiActiveBans ?? (data ? Math.max(0, data.activeBans - localBans) : 0);
    const errLabel = (code) => {
      const map = de ? {
        db_not_found: "crowdsec.db nicht gefunden \u2014 Pfad pr\xFCfen.",
        db_path_not_allowed: "Datenbankpfad nicht erlaubt.",
        network_error: "Netzwerkfehler.",
        crowdsec_error: "Fehler beim Lesen der DB."
      } : {
        db_not_found: "crowdsec.db not found.",
        db_path_not_allowed: "Database path not allowed.",
        network_error: "Network error.",
        crowdsec_error: "Failed to read database."
      };
      return map[code] || code;
    };
    const copyIp = async (ip) => {
      try {
        await navigator.clipboard.writeText(ip);
      } catch {
      }
    };
    const doUnban = async (item) => {
      setUnbanBusy(true);
      setUnbanMsg(null);
      try {
        await pluginApiJson("crowdsec-v2", "/decision", {
          method: "POST",
          body: JSON.stringify({ ip: item.ip, container: cfg.crowdsecContainer })
        });
        setUnbanPending(null);
        void fetchData();
      } catch (e) {
        setUnbanMsg(e instanceof Error ? e.message : "network_error");
      } finally {
        setUnbanBusy(false);
      }
    };
    const zoomMap = (item) => {
      const cc = normalizeCountryCode(item.country);
      if (cc) {
        setMapHighlight(cc);
        setMapFocus(mapFocusFromCountry(cc));
      }
      setSelectedKey(`${item.alertId}-${item.ip}`);
    };
    const onResetZoom = () => {
      setMapFocus(null);
      setMapHighlight(void 0);
    };
    const selectCountryOnMap = (cc) => {
      setMapHighlight(cc);
      setMapFocus(mapFocusFromCountry(cc));
    };
    const showStub = tab === "scenarios" || tab === "bouncers" || tab === "about";
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "section",
      {
        className: `csv2-widget ${layoutClass} csv2-theme-${theme}`.trim(),
        "data-theme": theme,
        style: { position: "relative" },
        children: [
          error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "csv2-error", children: errLabel(error) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "csv2-split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              Sidebar,
              {
                tab,
                onTab: setTab,
                data,
                daysBack: cfg.daysBack,
                locale,
                online: !error && Boolean(data)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("section", { className: "csv2-main", children: showStub ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "csv2-stub", children: de ? "Dieser Bereich folgt in einer sp\xE4teren Version. Nutze \xDCbersicht, Entscheidungen oder L\xE4nder." : "This section comes in a later version. Use Overview, Decisions or Countries." }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "csv2-stat-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "csv2-stat csv2-stat-alerts", children: [
                  data ? formatCompact(data.alertsInRange, locale) : "\u2014",
                  " ",
                  de ? "Alerts" : "Alerts"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "csv2-stat csv2-stat-local", children: [
                  data ? formatInt(localBans, locale) : "\u2014",
                  " ",
                  de ? "Lokal" : "Local"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "csv2-stat csv2-stat-capi", children: [
                  data ? formatCompact(capiBans, locale) : "\u2014",
                  " CAPI"
                ] })
              ] }),
              data && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("section", { className: "csv2-map-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                WorldMap,
                {
                  countries: data.countries,
                  highlightCode: mapHighlight,
                  focus: mapFocus,
                  onSelectCountry: selectCountryOnMap,
                  onResetZoom,
                  de
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("header", { className: "csv2-toolbar", children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "csv2-search-wrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Search, { size: 14, "aria-hidden": true }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "input",
                    {
                      className: "csv2-search",
                      type: "search",
                      value: search,
                      onChange: (e) => setSearch(e.target.value),
                      placeholder: de ? "IP-Adresse suchen\u2026" : "Search IP\u2026"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "csv2-filter-chips", role: "group", "aria-label": de ? "Filter" : "Filter", children: ["ban", "alert", "all"].map((f) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    type: "button",
                    className: `csv2-chip${feedFilter === f ? " csv2-chip-active" : ""}`,
                    onClick: () => setFeedFilter(f),
                    children: f === "ban" ? de ? "Ban aktiv" : "Ban active" : f === "alert" ? de ? "Nur Alert" : "Alert only" : de ? "Alle" : "All"
                  },
                  f
                )) }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "csv2-count", children: filteredFeed.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "csv2-feed", children: [
                loading && !data && !error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "csv2-loading", children: de ? "Lade\u2026" : "Loading\u2026" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  FeedTable,
                  {
                    items: filteredFeed,
                    locale,
                    selectedKey,
                    onSelect: setSelectedKey,
                    onLookup: (item, el) => {
                      setLookupItem(item);
                      setLookupAnchor(el);
                    },
                    onMapZoom: zoomMap,
                    onCopy: (ip) => void copyIp(ip),
                    onUnban: (item) => setUnbanPending(item),
                    dockerUnban: cfg.dockerUnban,
                    unbanBusy,
                    de
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("footer", { className: "csv2-footer", children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: de ? "Letzte Aktualisierung: gerade eben" : "Last update: just now" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: "csv2-refresh-btn",
                    onClick: () => void fetchData(),
                    disabled: loading,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RefreshCw, { size: 12, "aria-hidden": true }),
                      de ? "Aktualisieren" : "Refresh"
                    ]
                  }
                )
              ] })
            ] }) })
          ] }),
          lookupItem && lookupServices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            IpLookupMenu,
            {
              item: lookupItem,
              de,
              anchorEl: lookupAnchor,
              services: lookupServices,
              onClose: () => {
                setLookupItem(null);
                setLookupAnchor(null);
              }
            }
          ),
          unbanPending && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("section", { className: "csv2-confirm-overlay", role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("article", { className: "csv2-confirm-box", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { margin: 0 }, children: de ? `Sperre f\xFCr ${unbanPending.ip} per cscli im Container \u201E${cfg.crowdsecContainer}" aufheben?` : `Remove ban for ${unbanPending.ip} via cscli in container "${cfg.crowdsecContainer}"?` }),
            unbanMsg && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "csv2-unban-err", children: unbanMsg }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("nav", { className: "csv2-confirm-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "button",
                {
                  type: "button",
                  className: "csv2-btn-ghost",
                  onClick: () => setUnbanPending(null),
                  disabled: unbanBusy,
                  children: de ? "Abbrechen" : "Cancel"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "button",
                {
                  type: "button",
                  className: "csv2-btn-danger",
                  disabled: unbanBusy,
                  onClick: () => void doUnban(unbanPending),
                  children: unbanBusy ? "\u2026" : de ? "Entsperren" : "Unban"
                }
              )
            ] })
          ] }) })
        ]
      }
    );
  }

  // plugins-pack/crowdsec-v2/components/CrowdsecV2Settings.tsx
  var import_jsx_runtime8 = __toESM(require_jsx_runtime());
  function CrowdsecV2Settings({ config, onChange }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const cfg = parseCrowdsecV2Config(config);
    const lookup = cfg.lookupEnabled;
    const setLookup = (id, enabled) => {
      onChange("lookupEnabled", { ...lookup, [id]: enabled });
    };
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "csv2-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "Datenbankpfad" : "Database path" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "text",
            value: cfg.dbPath,
            onChange: (e) => onChange("dbPath", e.target.value),
            placeholder: "/crowdsec-data/crowdsec.db"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "Zeitraum (Alerts)" : "Time range (alerts)" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: cfg.daysBack, onChange: (e) => onChange("daysBack", Number(e.target.value)), children: DAY_RANGE_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: p.days, children: de ? p.de : p.en }, p.days)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "number",
            min: 5,
            max: 600,
            value: cfg.refreshSeconds,
            onChange: (e) => onChange("refreshSeconds", Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "Max. Alerts" : "Max alerts" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("select", { value: cfg.maxAlerts, onChange: (e) => onChange("maxAlerts", Number(e.target.value)), children: MAX_ALERT_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: p.value, children: de ? p.de : p.en }, p.value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row csv2-settings-check", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "checkbox",
            checked: cfg.dockerUnban,
            onChange: (e) => onChange("dockerUnban", e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "Entsperren per Docker/cscli" : "Unban via Docker/cscli" })
      ] }),
      cfg.dockerUnban && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "csv2-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: de ? "CrowdSec-Container" : "CrowdSec container" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "text",
            value: cfg.crowdsecContainer,
            onChange: (e) => onChange("crowdsecContainer", e.target.value),
            placeholder: "crowdsec"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "csv2-settings-hint", children: de ? "IP-Lookup-Dienste" : "IP lookup services" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("section", { className: "csv2-lookup-grid", children: LOOKUP_SERVICES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "checkbox",
            checked: lookup[s.id] ?? DEFAULT_LOOKUP_ENABLED[s.id],
            onChange: (e) => setLookup(s.id, e.target.checked)
          }
        ),
        s.label
      ] }, s.id)) })
    ] });
  }

  // plugins-pack/crowdsec-v2/index.tsx
  var import_jsx_runtime9 = __toESM(require_jsx_runtime());
  var meta = {
    id: "crowdsec-v2",
    name: "CrowdSec V2",
    description: "CrowdSec-Dashboard mit Sidebar, Weltkarte, Alert/Bann-Liste inkl. Angriffsart, L\xE4nder\xFCbersicht und IP-Lookup. API: /api/plugins/crowdsec-v2.",
    version: "1.0.1",
    author: "SelfDashboard",
    category: "security",
    icon: "\u{1F6E1}\uFE0F",
    iconUrl: "/plugin-logos/crowdsec.png",
    defaultLayout: { w: 6, h: 7, minW: 5, minH: 5 },
    stackedExtraH: 2
  };
  function Widget(props) {
    const locale = useDashboardStore((s) => s.locale);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CrowdsecV2Widget, { ...props, locale });
  }
  var component = {
    Widget,
    Settings: CrowdsecV2Settings
  };

  // plugin-pack/staging/.entries/crowdsec-v2.tsx
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
lucide-react/dist/esm/icons/copy.js:
lucide-react/dist/esm/icons/crosshair.js:
lucide-react/dist/esm/icons/gavel.js:
lucide-react/dist/esm/icons/globe.js:
lucide-react/dist/esm/icons/home.js:
lucide-react/dist/esm/icons/info.js:
lucide-react/dist/esm/icons/network.js:
lucide-react/dist/esm/icons/refresh-cw.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/shield.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/zap.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
