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
      function jsx6(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx6;
      exports.jsxs = jsx6;
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

  // plugins/crowdsec/CrowdsecWidget.tsx
  var import_react6 = __toESM(require_react());

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

  // plugins/crowdsec/CrowdsecLogo.tsx
  var import_react3 = __toESM(require_react());
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var BRAND_LOGO_SRC = "/plugin-logos/crowdsec_breit.png";
  var ICON_LOGO_SRC = "/plugin-logos/crowdsec.png";
  function LogoFallback({ height }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { height, width: height, viewBox: "0 0 64 64", "aria-hidden": true, className: "cs-logo-svg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", { id: "cs-logo-grad-fb", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: "#5eb3ff" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: "#2b7fd4" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "32", cy: "32", r: "30", fill: "currentColor", fillOpacity: "0.12", stroke: "url(#cs-logo-grad-fb)", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          fill: "url(#cs-logo-grad-fb)",
          d: "M32 12c-8 6-18 7-18 7v14c0 12 8 20 18 23 10-3 18-11 18-23V19s-10-1-18-7zm0 8c3 2 8 3 12 3v11c0 8-5 14-12 16-7-2-12-8-12-16V23c4 0 9-1 12-3z"
        }
      )
    ] });
  }
  function CrowdsecLogo({ size = 28, variant = "icon" }) {
    const [failed, setFailed] = (0, import_react3.useState)(false);
    const src = variant === "brand" ? BRAND_LOGO_SRC : ICON_LOGO_SRC;
    if (failed) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoFallback, { height: variant === "brand" ? 32 : size });
    }
    if (variant === "brand") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          src,
          alt: "CrowdSec",
          className: "cs-logo-img cs-logo-img-brand",
          decoding: "async",
          onError: () => setFailed(true)
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "img",
      {
        src,
        alt: "",
        width: size,
        height: size,
        className: "cs-logo-img",
        decoding: "async",
        onError: () => setFailed(true)
      }
    );
  }

  // plugins/crowdsec/constants.ts
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

  // plugins/crowdsec/CountryFlag.tsx
  var import_react4 = __toESM(require_react());

  // plugins/crowdsec/flags.ts
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

  // plugins/crowdsec/CountryFlag.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  function CountryFlag({ code, size = 22, className = "", title }) {
    const cc = normalizeCountryCode(code) || normalizeCountryCode(code.slice(0, 2));
    const emoji = countryCodeToEmoji(cc || code);
    const src = cc ? flagImageUrl(cc, size <= 20 ? 40 : 80) : "";
    const [imgOk, setImgOk] = (0, import_react4.useState)(Boolean(src));
    if (!src || !imgOk) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "span",
        {
          className: `cs-flag cs-flag-emoji ${className}`.trim(),
          style: { fontSize: Math.round(size * 0.85), lineHeight: 1 },
          title: title || cc || code,
          "aria-hidden": true,
          children: emoji
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "img",
      {
        src,
        alt: "",
        width: size,
        height: Math.round(size * 0.72),
        className: `cs-flag ${className}`.trim(),
        title: title || cc,
        loading: "lazy",
        decoding: "async",
        referrerPolicy: "no-referrer",
        onError: () => setImgOk(false)
      }
    );
  }

  // plugins/crowdsec/IpLookupMenu.tsx
  var import_react5 = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  var import_jsx_runtime3 = __toESM(require_jsx_runtime());
  function IpLookupMenu({ item, de, anchorEl, services, onClose }) {
    const menuRef = (0, import_react5.useRef)(null);
    const [pos, setPos] = (0, import_react5.useState)({ left: 0, top: 0 });
    (0, import_react5.useLayoutEffect)(() => {
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
    (0, import_react5.useEffect)(() => {
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
        className: "cs-wl-menu",
        role: "menu",
        style: { left: pos.left, top: pos.top },
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "cs-wl-menu-title", children: [
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
              className: "cs-wl-menu-item",
              href: s.href(item),
              target: "_blank",
              rel: "noopener noreferrer",
              role: "menuitem",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cs-wl-menu-icon", "aria-hidden": true, children: s.icon }),
                s.label
              ]
            },
            s.id
          )),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "cs-wl-menu-close", onClick: onClose, children: [
            "\u2715 ",
            de ? "SCHLIESSEN" : "CLOSE"
          ] })
        ]
      }
    );
    if (typeof document === "undefined") return menu;
    return (0, import_react_dom.createPortal)(menu, document.body);
  }

  // plugins/crowdsec/ipLookup.ts
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

  // plugins/crowdsec/presets.ts
  var DAY_RANGE_PRESETS = [
    { days: 1, de: "1 Tag", en: "1 day" },
    { days: 7, de: "7 Tage", en: "7 days" },
    { days: 30, de: "30 Tage", en: "30 days" },
    { days: 90, de: "90 Tage", en: "90 days" },
    { days: 365, de: "1 Jahr", en: "1 year" },
    { days: 730, de: "2 Jahre", en: "2 years" },
    { days: 1825, de: "5 Jahre", en: "5 years" },
    { days: 3650, de: "10 Jahre", en: "10 years" },
    { days: 0, de: "Alle", en: "All" }
  ];
  var MAX_ALERT_PRESETS = [
    { value: 500, de: "500", en: "500" },
    { value: 1e3, de: "1.000", en: "1,000" },
    { value: 2e3, de: "2.000", en: "2,000" },
    { value: 5e3, de: "5.000", en: "5,000" },
    { value: 1e4, de: "10.000", en: "10,000" },
    { value: 0, de: "Alle", en: "All" }
  ];
  var DAY_PRESET_VALUES = DAY_RANGE_PRESETS.map((p) => p.days);
  function nearestDayPreset(days) {
    const presets = DAY_PRESET_VALUES;
    if (presets.some((d) => d === days)) return days;
    if (days <= 0) return 0;
    const positive = presets.filter((d) => d > 0);
    return positive.reduce((best, d) => Math.abs(d - days) < Math.abs(best - days) ? d : best, 30);
  }
  function nearestMaxAlerts(value) {
    const presets = MAX_ALERT_PRESETS.map((p) => p.value);
    if (presets.some((v) => v === value)) return value;
    if (value <= 0) return 0;
    return presets.reduce((best, v) => v > 0 && Math.abs(v - value) < Math.abs(best - value) ? v : best, 2e3);
  }
  function alertRangeLabel(days, de) {
    const hit = DAY_RANGE_PRESETS.find((p) => p.days === days);
    if (hit) return de ? hit.de : hit.en;
    if (days <= 0) return de ? "Alle" : "All";
    if (days === 1) return de ? "1 Tag" : "1 day";
    return de ? `${days} Tage` : `${days} days`;
  }

  // plugins/crowdsec/CrowdsecWidget.tsx
  var import_jsx_runtime4 = __toESM(require_jsx_runtime());
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
  function parseCrowdsecConfig(raw) {
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
      confirmUnban: cfgBool(raw.confirmUnban, true),
      showCountriesList: cfgBool(raw.showCountriesList, true),
      lookupEnabled
    };
  }
  function formatInt(n, locale) {
    return Math.round(n).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
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
  function CrowdsecWidget({ config: raw, locale, layoutMode = "desktop", theme = "dark" }) {
    const de = locale !== "en";
    const cfg = (0, import_react6.useMemo)(() => parseCrowdsecConfig(raw), [raw]);
    const layoutClass = layoutMode === "phone" ? "cs-layout-phone" : layoutMode === "tablet" ? "cs-layout-tablet" : "";
    const [data, setData] = (0, import_react6.useState)(null);
    const [error, setError] = (0, import_react6.useState)(null);
    const [loading, setLoading] = (0, import_react6.useState)(true);
    const [tab, setTab] = (0, import_react6.useState)("overview");
    const [search, setSearch] = (0, import_react6.useState)("");
    const [selectedKey, setSelectedKey] = (0, import_react6.useState)(null);
    const [lookupItem, setLookupItem] = (0, import_react6.useState)(null);
    const [lookupAnchor, setLookupAnchor] = (0, import_react6.useState)(null);
    const [unbanPending, setUnbanPending] = (0, import_react6.useState)(null);
    const [unbanBusy, setUnbanBusy] = (0, import_react6.useState)(false);
    const [unbanMsg, setUnbanMsg] = (0, import_react6.useState)(null);
    const lookupServices = (0, import_react6.useMemo)(
      () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
      [cfg.lookupEnabled]
    );
    const fetchData = (0, import_react6.useCallback)(async () => {
      const params = new URLSearchParams({
        dbPath: cfg.dbPath,
        daysBack: String(cfg.daysBack),
        maxAlerts: String(Math.min(cfg.maxAlerts, 2e3))
      });
      try {
        const json = await pluginApiJson("crowdsec", `/?${params}`, {
          timeoutMs: 5e4
        });
        setData(json);
        setError(null);
      } catch (e) {
        const code = e instanceof Error ? e.message : "crowdsec_error";
        reportPluginError("crowdsec", code, { category: "fetch" });
        setError(code.startsWith("HTTP ") ? "network_error" : code);
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [cfg.dbPath, cfg.daysBack, cfg.maxAlerts]);
    (0, import_react6.useEffect)(() => {
      setLoading(true);
      void fetchData();
      const id = window.setInterval(() => void fetchData(), cfg.refreshSeconds * 1e3);
      return () => window.clearInterval(id);
    }, [fetchData, cfg.refreshSeconds, cfg.daysBack, cfg.maxAlerts]);
    const q = search.trim().toLowerCase();
    const baseFeed = (0, import_react6.useMemo)(() => {
      if (!data) return [];
      if (tab === "bans") return data.feed.filter((f) => f.active_ban);
      return data.feed;
    }, [data, tab]);
    const filteredFeed = (0, import_react6.useMemo)(() => baseFeed.filter((f) => feedMatchesSearch(f, q)), [baseFeed, q]);
    const errLabel = (code) => {
      const map = de ? {
        db_not_found: "crowdsec.db nicht gefunden \u2014 Pfad und Volume pr\xFCfen.",
        db_path_not_allowed: "Datenbankpfad nicht erlaubt.",
        db_schema_unsupported: "Datenbankschema wird nicht unterst\xFCtzt.",
        network_error: "Netzwerkfehler beim Laden.",
        crowdsec_error: "Fehler beim Lesen der Datenbank."
      } : {
        db_not_found: "crowdsec.db not found \u2014 check path and volume mount.",
        db_path_not_allowed: "Database path not allowed.",
        db_schema_unsupported: "Database schema not supported.",
        network_error: "Network error while loading.",
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
        await pluginApiJson("crowdsec", "/decision", {
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
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "section",
      {
        className: `cs-widget ${layoutClass} cs-theme-${theme}`.trim(),
        style: { position: "relative" },
        "data-theme": theme,
        children: [
          error ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-error", children: errLabel(error) }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "cs-sidebar", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("header", { className: "cs-brand", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CrowdsecLogo, { variant: "brand" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-nav", "aria-label": de ? "Navigation" : "Navigation", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "overview" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("overview"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Shield, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "\xDCbersicht" : "Overview"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.alertsInRange, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? `Alerts (${alertRangeLabel(cfg.daysBack, true)})` : `Alerts (${alertRangeLabel(cfg.daysBack, false)})` })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "bans" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("bans"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Gavel, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "Banns" : "Bans"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.activeBans, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? "Aktive Banns" : "Active bans" })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "countries" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("countries"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Globe, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "L\xE4nder" : "Countries"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.countryCount, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? "alle in DB" : "all in DB" })
                      ] })
                    ]
                  }
                )
              ] }),
              data && (cfg.showCountriesList || tab === "countries") && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "section",
                {
                  className: `cs-sidebar-extra${cfg.showCountriesList ? " cs-sidebar-extra-pinned" : ""}`,
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-country-list", children: data.countries.slice(0, 40).map((c) => {
                    const cc = normalizeCountryCode(c.country) || "??";
                    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "cs-country-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CountryFlag, { code: cc, size: 18 }),
                        COUNTRY_NAME[cc] || cc
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tabular-nums", children: formatInt(c.count, locale) })
                    ] }, `${cc}-${c.count}`);
                  }) })
                }
              ),
              data?.geoip && !data.geoip.enabled && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-range-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-geoip-hint", children: de ? "GeoIP: GeoLite2-*.mmdb fehlt im CrowdSec-Ordner (L\xE4nder/Flaggen)." : "GeoIP: GeoLite2-*.mmdb missing in CrowdSec data folder (countries/flags)." }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-feed-panel", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "cs-feed-toolbar", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "cs-search-wrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Search, { size: 14, strokeWidth: 2, "aria-hidden": true }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "input",
                    {
                      className: "cs-search",
                      type: "search",
                      value: search,
                      onChange: (e) => setSearch(e.target.value),
                      placeholder: de ? "Filter IP\u2026" : "Filter IP\u2026"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-feed-count", children: filteredFeed.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-feed-list", children: [
                loading && !data && !error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-loading", children: de ? "Lade\u2026" : "Loading\u2026" }),
                !loading && filteredFeed.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-empty", children: de ? "Keine Eintr\xE4ge im Zeitraum." : "No entries in this period." }),
                filteredFeed.map((item) => {
                  const cc = normalizeCountryCode(item.country);
                  const key = `${item.alertId}-${item.ip}`;
                  const selected = selectedKey === key;
                  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                    "article",
                    {
                      className: `cs-card${selected ? " cs-card-selected" : ""}`,
                      onClick: () => setSelectedKey(key),
                      onKeyDown: (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedKey(key);
                        }
                      },
                      role: "button",
                      tabIndex: 0,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CountryFlag, { code: cc || item.country, size: 20, title: COUNTRY_NAME[cc] || cc }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-card-body", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "cs-card-top", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-card-ip", children: item.ip }),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-scenario-tag", title: item.scenario, children: item.scenario }),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-card-time", children: formatRelative(item.time_iso, locale) })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "span",
                            {
                              className: `cs-status ${item.active_ban ? "cs-status-ban" : "cs-status-free"}`,
                              title: item.active_ban ? de ? "Aktiver Ban wie cscli: decisions.until liegt in der Zukunft (IP oder Alert verkn\xFCpft)." : "Active ban (cscli-aligned): decisions.until is in the future (IP or linked alert)." : de ? "Nur Alert \u2014 kein aktiver Ban (until abgelaufen/leer oder cscli listet die IP nicht). CrowdSec kann sp\xE4ter erneut sperren." : "Alert only \u2014 no active ban (until past/empty or cscli shows none). CrowdSec may ban later.",
                              children: item.active_ban ? de ? "Ban aktiv" : "Ban active" : de ? "Nur Alert" : "Alert only"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-card-actions", onClick: (e) => e.stopPropagation(), children: [
                          lookupServices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-icon-btn",
                              title: de ? "IP-Lookup" : "IP lookup",
                              "aria-label": de ? "IP-Lookup" : "IP lookup",
                              onClick: (e) => {
                                setLookupItem(item);
                                setLookupAnchor(e.currentTarget);
                              },
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Search, { size: 15, strokeWidth: 2, "aria-hidden": true })
                            }
                          ),
                          cfg.dockerUnban && item.active_ban && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-unban-btn",
                              disabled: unbanBusy,
                              title: de ? "Entsperren" : "Unban",
                              "aria-label": de ? "Entsperren" : "Unban",
                              onClick: (e) => {
                                e.stopPropagation();
                                setUnbanPending(item);
                              },
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Trash2, { size: 13, strokeWidth: 2, "aria-hidden": true })
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-icon-btn",
                              title: de ? "IP kopieren" : "Copy IP",
                              "aria-label": de ? "IP kopieren" : "Copy IP",
                              onClick: () => void copyIp(item.ip),
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Copy, { size: 14, strokeWidth: 2, "aria-hidden": true })
                            }
                          )
                        ] })
                      ]
                    },
                    key
                  );
                })
              ] })
            ] })
          ] }),
          lookupItem && lookupServices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
          unbanPending && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-confirm-overlay", role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "cs-confirm-box", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: 0 }, children: de ? `Sperre f\xFCr ${unbanPending.ip} per cscli im Container \u201E${cfg.crowdsecContainer}\u201C aufheben?` : `Remove ban for ${unbanPending.ip} via cscli in container \u201C${cfg.crowdsecContainer}\u201D?` }),
            unbanMsg && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: "8px 0 0", color: "#ef4444", fontSize: 10 }, children: unbanMsg }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-confirm-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  className: "cs-btn-ghost",
                  onClick: () => setUnbanPending(null),
                  disabled: unbanBusy,
                  children: de ? "Abbrechen" : "Cancel"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  className: "cs-btn-danger",
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

  // plugins/crowdsec/index.tsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime());
  var meta = {
    id: "crowdsec",
    name: "CrowdSec",
    description: "Kompaktes CrowdSec-Dashboard aus crowdsec.db: \xDCbersicht, Banns, L\xE4nder und durchsuchbarer IP-Feed mit Lookup-Links und optionalem Entsperren per Docker/cscli. API: /api/plugins/crowdsec.",
    version: "1.4.4",
    author: "SelfDashboard",
    category: "security",
    icon: "\u{1F6E1}\uFE0F",
    iconUrl: "/plugin-logos/crowdsec.png",
    defaultLayout: { w: 5, h: 6, minW: 4, minH: 4 },
    stackedExtraH: 2
  };
  function CrowdsecSettings({ config, onChange }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const cfg = parseCrowdsecConfig(config);
    const lookup = cfg.lookupEnabled;
    const setLookup = (id, enabled) => {
      onChange("lookupEnabled", { ...lookup, [id]: enabled });
    };
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "cs-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Datenbankpfad" : "Database path" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "text",
            value: cfg.dbPath,
            onChange: (e) => onChange("dbPath", e.target.value),
            placeholder: "/crowdsec-data/crowdsec.db"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Zeitraum (Alerts aus DB)" : "Time range (alerts from DB)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "select",
          {
            value: cfg.daysBack,
            onChange: (e) => onChange("daysBack", Number(e.target.value)),
            children: DAY_RANGE_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: p.days, children: de ? p.de : p.en }, p.days))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Max. Alerts aus DB" : "Max alerts from DB" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { value: cfg.maxAlerts, onChange: (e) => onChange("maxAlerts", Number(e.target.value)), children: MAX_ALERT_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: p.value, children: de ? p.de : p.en }, p.value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.45 }, children: de ? "\u201EAlle\u201C beim Zeitraum = gesamte Datenbank. \u201EAlle\u201C bei Max. Alerts = kein LIMIT (kann bei sehr gro\xDFen DBs l\xE4nger laden)." : "\u201CAll\u201D time range = entire database. \u201CAll\u201D max alerts = no LIMIT (large DBs may load slower)." }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: cfg.showCountriesList,
            onChange: (e) => onChange("showCountriesList", e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "L\xE4nderliste in der Sidebar dauerhaft anzeigen" : "Always show country list in sidebar" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: cfg.dockerUnban,
            onChange: (e) => onChange("dockerUnban", e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Entsperren per Docker/cscli" : "Unban via Docker/cscli" })
      ] }),
      cfg.dockerUnban && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "CrowdSec-Container" : "CrowdSec container" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "text",
            value: cfg.crowdsecContainer,
            onChange: (e) => onChange("crowdsecContainer", e.target.value),
            placeholder: "crowdsec"
          }
        )
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: "12px 0 4px", fontSize: 12, color: "var(--text-muted)" }, children: de ? "IP-Lookup-Dienste" : "IP lookup services" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("section", { className: "cs-lookup-grid", children: LOOKUP_SERVICES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
  function Widget({ config, layoutMode, theme }) {
    const locale = useDashboardStore((s) => s.locale);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CrowdsecWidget, { config, locale, layoutMode, theme });
  }
  var component = {
    Widget,
    Settings: CrowdsecSettings
  };

  // plugin-pack/staging/.entries/crowdsec.tsx
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
lucide-react/dist/esm/icons/gavel.js:
lucide-react/dist/esm/icons/globe.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/shield.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
