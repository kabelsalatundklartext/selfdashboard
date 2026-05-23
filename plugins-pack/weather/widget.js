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

  // plugins/weather/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/cloud-drizzle.js
  var CloudDrizzle = createLucideIcon("CloudDrizzle", [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "1pljnt" }],
    ["path", { d: "M8 19v1", key: "1dk2by" }],
    ["path", { d: "M8 14v1", key: "84yxot" }],
    ["path", { d: "M16 19v1", key: "v220m7" }],
    ["path", { d: "M16 14v1", key: "g12gj6" }],
    ["path", { d: "M12 21v1", key: "q8vafk" }],
    ["path", { d: "M12 16v1", key: "1mx6rx" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-fog.js
  var CloudFog = createLucideIcon("CloudFog", [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "1pljnt" }],
    ["path", { d: "M16 17H7", key: "pygtm1" }],
    ["path", { d: "M17 21H9", key: "1u2q02" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-lightning.js
  var CloudLightning = createLucideIcon("CloudLightning", [
    ["path", { d: "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973", key: "1cez44" }],
    ["path", { d: "m13 12-3 5h4l-3 5", key: "1t22er" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-moon.js
  var CloudMoon = createLucideIcon("CloudMoon", [
    ["path", { d: "M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z", key: "p44pc9" }],
    ["path", { d: "M10.1 9A6 6 0 0 1 16 4a4.24 4.24 0 0 0 6 6 6 6 0 0 1-3 5.197", key: "16nha0" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-off.js
  var CloudOff = createLucideIcon("CloudOff", [
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
    ["path", { d: "M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193", key: "yfwify" }],
    [
      "path",
      { d: "M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07", key: "jlfiyv" }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-rain.js
  var CloudRain = createLucideIcon("CloudRain", [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "1pljnt" }],
    ["path", { d: "M16 14v6", key: "1j4efv" }],
    ["path", { d: "M8 14v6", key: "17c4r9" }],
    ["path", { d: "M12 16v6", key: "c8a4gj" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-snow.js
  var CloudSnow = createLucideIcon("CloudSnow", [
    ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "1pljnt" }],
    ["path", { d: "M8 15h.01", key: "a7atzg" }],
    ["path", { d: "M8 19h.01", key: "puxtts" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }],
    ["path", { d: "M12 21h.01", key: "h35vbk" }],
    ["path", { d: "M16 15h.01", key: "rnfrdf" }],
    ["path", { d: "M16 19h.01", key: "1vcnzz" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud-sun.js
  var CloudSun = createLucideIcon("CloudSun", [
    ["path", { d: "M12 2v2", key: "tus03m" }],
    ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
    ["path", { d: "M20 12h2", key: "1q8mjw" }],
    ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }],
    ["path", { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128", key: "dpwdj0" }],
    ["path", { d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z", key: "s09mg5" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/cloud.js
  var Cloud = createLucideIcon("Cloud", [
    ["path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z", key: "p7xjir" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/loader-circle.js
  var LoaderCircle = createLucideIcon("LoaderCircle", [
    ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/moon.js
  var Moon = createLucideIcon("Moon", [
    ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z", key: "a7tn18" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/sun.js
  var Sun = createLucideIcon("Sun", [
    ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
    ["path", { d: "M12 2v2", key: "tus03m" }],
    ["path", { d: "M12 20v2", key: "1lh1kg" }],
    ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
    ["path", { d: "m17.66 17.66 1.41 1.41", key: "ptbguv" }],
    ["path", { d: "M2 12h2", key: "1t8f8n" }],
    ["path", { d: "M20 12h2", key: "1q8mjw" }],
    ["path", { d: "m6.34 17.66-1.41 1.41", key: "1m8zz5" }],
    ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/sunrise.js
  var Sunrise = createLucideIcon("Sunrise", [
    ["path", { d: "M12 2v8", key: "1q4o3n" }],
    ["path", { d: "m4.93 10.93 1.41 1.41", key: "2a7f42" }],
    ["path", { d: "M2 18h2", key: "j10viu" }],
    ["path", { d: "M20 18h2", key: "wocana" }],
    ["path", { d: "m19.07 10.93-1.41 1.41", key: "15zs5n" }],
    ["path", { d: "M22 22H2", key: "19qnx5" }],
    ["path", { d: "m8 6 4-4 4 4", key: "ybng9g" }],
    ["path", { d: "M16 18a4 4 0 0 0-8 0", key: "1lzouq" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/sunset.js
  var Sunset = createLucideIcon("Sunset", [
    ["path", { d: "M12 10V2", key: "16sf7g" }],
    ["path", { d: "m4.93 10.93 1.41 1.41", key: "2a7f42" }],
    ["path", { d: "M2 18h2", key: "j10viu" }],
    ["path", { d: "M20 18h2", key: "wocana" }],
    ["path", { d: "m19.07 10.93-1.41 1.41", key: "15zs5n" }],
    ["path", { d: "M22 22H2", key: "19qnx5" }],
    ["path", { d: "m16 6-4 4-4-4", key: "6wukr" }],
    ["path", { d: "M16 18a4 4 0 0 0-8 0", key: "1lzouq" }]
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

  // plugins/weather/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "weather",
    name: "Weather",
    description: "Stadt oder PLZ \u2014 aktuelles Wetter mit 3-Stunden-Verlauf (0, 3, 6 \u2026 21, 24) und optional 7-Tage-Vorschau. Open-Meteo, kein API-Key. API: /api/plugins/weather/resolve.",
    version: "1.6.1",
    author: "SelfDashboard",
    category: "utility",
    icon: "\u{1F324}\uFE0F",
    /** Gestapelte Ansicht: +2 Zeilen, damit Vorschau/„Nächste Tage“ nicht abgeschnitten wirkt. */
    stackedExtraH: 2,
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    configSchema: [
      {
        key: "locationQuery",
        label: "Stadt oder PLZ",
        type: "text",
        placeholder: "z. B. Berlin, Hamburg, 10115",
        defaultValue: ""
      },
      {
        key: "countryCode",
        label: "Land (ISO, optional)",
        type: "text",
        placeholder: "DE \u2014 hilft bei PLZ",
        defaultValue: "DE"
      },
      {
        key: "refreshMinutes",
        label: "Aktualisieren alle (Minuten)",
        type: "number",
        defaultValue: 15
      },
      {
        key: "showDailyForecast",
        label: "7-Tage-Vorschau",
        type: "boolean",
        defaultValue: true
      },
      {
        key: "showPlaceLabel",
        label: "Ort / Stadtnamen anzeigen",
        type: "boolean",
        defaultValue: true
      },
      {
        key: "showHumidityWind",
        label: "Luftfeuchtigkeit & Wind",
        type: "boolean",
        defaultValue: true
      },
      {
        key: "showSunTimes",
        label: "Sonnenauf- & -untergang",
        type: "boolean",
        defaultValue: true
      },
      {
        key: "showHourTimeline",
        label: "3-Stunden-Verlauf (0\u201324)",
        type: "boolean",
        defaultValue: true
      },
      {
        key: "dailyForecastWidthPct",
        label: "7-Tage: Kartenbreite (%)",
        type: "number",
        defaultValue: 100
      }
    ]
  };
  function str(v) {
    return typeof v === "string" ? v.trim() : "";
  }
  function num(v, fallback) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  function clampRefresh(v) {
    const n = Math.round(num(v, 15));
    return Math.min(120, Math.max(5, n));
  }
  function clampDailyForecastWidthPct(v) {
    const n = Math.round(num(v, 100));
    return Math.min(130, Math.max(70, n));
  }
  function cfgBool(raw, key, defaultValue = true) {
    const v = raw[key];
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    return defaultValue;
  }
  function cfgShowDailyForecast(raw) {
    return cfgBool(raw, "showDailyForecast", true);
  }
  function cfgDailyForecastWidthPct(raw) {
    return clampDailyForecastWidthPct(raw.dailyForecastWidthPct ?? raw.dayTimelineWidthPct);
  }
  function dailyTypeClamp(scale, minPx, cq, maxPx) {
    return `clamp(${Math.max(5, Math.round(minPx * scale))}px, ${(cq * scale).toFixed(2)}cqmin, ${Math.max(6, Math.round(maxPx * scale))}px)`;
  }
  function formatPlace(hit) {
    const parts = [hit.name, hit.admin1, hit.country_code].filter(Boolean);
    return parts.join(", ");
  }
  function windCompass(deg, de) {
    const ro = de ? ["N", "NO", "O", "SO", "S", "SW", "W", "NW"] : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const i = Math.round((deg % 360 + 360) % 360 / 45) % 8;
    return ro[i] ?? "N";
  }
  function wmoIconColor(code, isDay) {
    const c = Math.round(code);
    if (c === 95 || c === 96 || c === 99) return "#f97316";
    if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return "#7dd3fc";
    if (c === 61 || c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return "#3b82f6";
    if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return "#38bdf8";
    if (c === 45 || c === 48) return "#9ca3af";
    if (c === 3) return "#94a3b8";
    if (c === 2) return isDay ? "#fcd34d" : "#a5b4fc";
    if (c === 1) return isDay ? "#fde047" : "#c4b5fd";
    if (c === 0) return isDay ? "#facc15" : "#a5b4fc";
    return "#94a3b8";
  }
  function wmoIconGlowFilter(code, isDay) {
    const rgb = wmoIconColor(code, isDay);
    return `drop-shadow(0 2px 8px color-mix(in srgb, ${rgb} 45%, transparent))`;
  }
  function wmoIconComponent(code, isDay) {
    const c = Math.round(code);
    if (c === 95 || c === 96 || c === 99) return CloudLightning;
    if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return CloudSnow;
    if (c === 61 || c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return CloudRain;
    if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return CloudDrizzle;
    if (c === 45 || c === 48) return CloudFog;
    if (c === 3) return Cloud;
    if (c === 2) return isDay ? CloudSun : CloudMoon;
    if (c === 1) return isDay ? CloudSun : CloudMoon;
    if (c === 0) return isDay ? Sun : Moon;
    return Cloud;
  }
  function wmoSummary(code, de) {
    const c = Math.round(code);
    const m = {
      0: ["Klar", "Clear"],
      1: ["Meist klar", "Mainly clear"],
      2: ["Teils wolkig", "Partly cloudy"],
      3: ["Bew\xF6lkt", "Overcast"],
      45: ["Nebel", "Fog"],
      48: ["Nebel mit Reif", "Rime fog"],
      51: ["Nieselregen", "Light drizzle"],
      53: ["Nieselregen", "Drizzle"],
      55: ["Nieselregen", "Dense drizzle"],
      56: ["Gefrierender Niesel", "Freezing drizzle"],
      57: ["Gefrierender Niesel", "Freezing drizzle"],
      61: ["Regen", "Slight rain"],
      63: ["Regen", "Moderate rain"],
      65: ["Starker Regen", "Heavy rain"],
      66: ["Gefrierender Regen", "Freezing rain"],
      67: ["Gefrierender Regen", "Freezing rain"],
      71: ["Schnee", "Slight snow"],
      73: ["Schnee", "Moderate snow"],
      75: ["Starker Schneefall", "Heavy snow"],
      77: ["Schneegriesel", "Snow grains"],
      80: ["Regenschauer", "Rain showers"],
      81: ["Regenschauer", "Rain showers"],
      82: ["Starkregen", "Violent rain showers"],
      85: ["Schneeschauer", "Snow showers"],
      86: ["Schneeschauer", "Snow showers"],
      95: ["Gewitter", "Thunderstorm"],
      96: ["Gewitter mit Hagel", "Thunderstorm & hail"],
      99: ["Gewitter mit Hagel", "Thunderstorm & hail"]
    };
    const pair = m[c];
    if (pair) return de ? pair[0] : pair[1];
    return de ? "Wetter" : "Weather";
  }
  var RESOLVE_FETCH_TIMEOUT_MS = 45e3;
  var FORECAST_FETCH_TIMEOUT_MS = 28e3;
  function abortSignalWithTimeout(parent, ms) {
    const ac = new AbortController();
    const onParentAbort = () => ac.abort();
    const timer = setTimeout(() => ac.abort(), ms);
    if (parent.aborted) ac.abort();
    else parent.addEventListener("abort", onParentAbort);
    ac.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        parent.removeEventListener("abort", onParentAbort);
      },
      { once: true }
    );
    return ac.signal;
  }
  function mapWeatherError(e, de) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : String(e);
    if (name === "AbortError" || msg.includes("timeout") || msg.includes("aborted")) {
      return de ? "Zeit\xFCberschreitung \u2014 Open-Meteo antwortet nicht. Bitte kurz warten oder erneut laden." : "Timeout \u2014 Open-Meteo did not respond. Wait a moment or reload.";
    }
    if (msg.includes("geocode_empty") || msg.includes("missing_name")) {
      return de ? "Ort nicht gefunden." : "Location not found.";
    }
    return de ? "Wetter-API nicht erreichbar (Server braucht Internet zu Open-Meteo)." : "Weather API unreachable (server needs outbound internet to Open-Meteo).";
  }
  async function resolveWeather(query, countryCode, signal, lang, includeDaily) {
    const params = new URLSearchParams({
      name: query,
      language: lang,
      includeHourly: "1"
    });
    const cc = countryCode.trim().toUpperCase();
    if (cc.length === 2) params.set("countryCode", cc);
    if (includeDaily) params.set("includeDaily", "1");
    const j = await pluginApiJson(
      "weather",
      `/resolve?${params}`,
      { signal, cache: "no-store", timeoutMs: RESOLVE_FETCH_TIMEOUT_MS }
    );
    const hit = j.place;
    if (!hit || !j.forecast) return null;
    return { hit, forecast: j.forecast };
  }
  async function fetchWeatherForecast(lat, lon, signal, includeDaily) {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      includeHourly: "1"
    });
    if (includeDaily) params.set("includeDaily", "1");
    return pluginApiJson("weather", `/forecast?${params}`, {
      signal,
      cache: "no-store",
      timeoutMs: FORECAST_FETCH_TIMEOUT_MS
    });
  }
  function parseDailyForecast(j, maxDays) {
    const d = j.daily;
    if (!d?.time?.length) return [];
    const codes = d.weather_code ?? [];
    const maxT = d.temperature_2m_max ?? [];
    const minT = d.temperature_2m_min ?? [];
    const out = [];
    const available = Math.min(d.time.length, codes.length, maxT.length, minT.length);
    for (let i = 1; i < available && out.length < maxDays; i++) {
      const date = d.time[i];
      const code = num(codes[i], 0);
      const day = {
        date,
        code,
        max: num(maxT[i], NaN),
        min: num(minT[i], NaN)
      };
      if (Number.isFinite(day.max) && Number.isFinite(day.min)) out.push(day);
    }
    return out;
  }
  function todayDateKeyFromHourly(times) {
    const now = Date.now();
    let best = null;
    for (const iso of times) {
      const t = new Date(iso).getTime();
      if (Number.isFinite(t) && t <= now + 6e4) best = iso.slice(0, 10);
    }
    return best ?? times[0]?.slice(0, 10) ?? null;
  }
  var TODAY_SLOT_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  function parseTodayDayPeriods(j) {
    const h = j.hourly;
    if (!h?.time?.length) return [];
    const temps = h.temperature_2m ?? [];
    const codes = h.weather_code ?? [];
    const isDays = h.is_day ?? [];
    const fallbackCode = num(j.current?.weather_code, 2);
    const fallbackIsDay = (j.current?.is_day ?? 1) === 1;
    const todayKey = todayDateKeyFromHourly(h.time);
    if (!todayKey) return [];
    const byHour = /* @__PURE__ */ new Map();
    const n = Math.min(h.time.length, temps.length);
    for (let i = 0; i < n; i++) {
      const iso = h.time[i];
      if (!iso.startsWith(todayKey)) continue;
      const temp = num(temps[i], NaN);
      if (!Number.isFinite(temp)) continue;
      const hour = new Date(iso).getHours();
      byHour.set(hour, {
        temp,
        code: i < codes.length ? num(codes[i], fallbackCode) : fallbackCode,
        isDay: i < isDays.length ? num(isDays[i], 0) === 1 : fallbackIsDay
      });
    }
    const pickHour = (slotHour) => {
      const direct = byHour.get(slotHour === 24 ? 23 : slotHour);
      if (direct) return direct;
      for (let d = 1; d < 24; d++) {
        const lo = slotHour - d;
        const hi = slotHour + d;
        if (lo >= 0 && byHour.has(lo)) return byHour.get(lo);
        if (hi <= 23 && byHour.has(hi)) return byHour.get(hi);
      }
      return null;
    };
    const out = [];
    for (const slotHour of TODAY_SLOT_HOURS) {
      const data = pickHour(slotHour);
      const label = String(slotHour);
      if (!data) {
        out.push({ label, min: NaN, max: NaN, code: fallbackCode, isDay: fallbackIsDay });
        continue;
      }
      out.push({
        label,
        min: data.temp,
        max: data.temp,
        code: data.code,
        isDay: data.isDay
      });
    }
    return out;
  }
  function formatSunTime(iso, de) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "\u2014";
    return d.toLocaleTimeString(de ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function parseTodaySunTimes(j) {
    const d = j.daily;
    if (!d?.time?.length) return null;
    const sunrises = d.sunrise ?? [];
    const sunsets = d.sunset ?? [];
    const todayKey = todayDateKeyFromHourly(j.hourly?.time ?? []) ?? d.time[0]?.slice(0, 10);
    if (!todayKey) return null;
    const idx = d.time.findIndex((t) => t.slice(0, 10) === todayKey);
    const i = idx >= 0 ? idx : 0;
    const sunrise = sunrises[i];
    const sunset = sunsets[i];
    if (!sunrise || !sunset) return null;
    return { sunrise, sunset };
  }
  function formatPeriodTemps(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "\u2014";
    const a = Math.round(min);
    const b = Math.round(max);
    return a === b ? `${a}\xB0` : `${a}\xB0\u2013${b}\xB0`;
  }
  function parseForecastPayload(j, includeDaily, de) {
    if (!j.current) throw new Error(de ? "Keine aktuellen Werte" : "No current values");
    return {
      current: j.current,
      daily: includeDaily ? parseDailyForecast(j, 7) : [],
      dayPeriods: parseTodayDayPeriods(j),
      sunTimes: parseTodaySunTimes(j)
    };
  }
  var WEATHER_SPLIT_MIN_PX = 420;
  function Widget({ config, editMode }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const locationQuery = str(config.locationQuery);
    const countryCode = str(config.countryCode);
    const refreshMinutes = clampRefresh(config.refreshMinutes);
    const cfgRaw = config;
    const showDailyForecast = cfgShowDailyForecast(cfgRaw);
    const showPlaceLabel = cfgBool(cfgRaw, "showPlaceLabel", true);
    const showHumidityWind = cfgBool(cfgRaw, "showHumidityWind", true);
    const showSunTimesRow = cfgBool(cfgRaw, "showSunTimes", true);
    const showHourTimeline = cfgBool(cfgRaw, "showHourTimeline", true);
    const dailyForecastScale = cfgDailyForecastWidthPct(cfgRaw) / 100;
    const [placeLabel, setPlaceLabel] = (0, import_react3.useState)(null);
    const [current, setCurrent] = (0, import_react3.useState)(null);
    const [daily, setDaily] = (0, import_react3.useState)([]);
    const [dayPeriods, setDayPeriods] = (0, import_react3.useState)([]);
    const [sunTimes, setSunTimes] = (0, import_react3.useState)(null);
    const [loading, setLoading] = (0, import_react3.useState)(false);
    const [error, setError] = (0, import_react3.useState)(null);
    const fetchKeyRef = (0, import_react3.useRef)("");
    const coordsRef = (0, import_react3.useRef)(null);
    const hasLiveDataRef = (0, import_react3.useRef)(false);
    (0, import_react3.useEffect)(() => {
      const ac = new AbortController();
      let cancelled = false;
      const fetchKey = `${locationQuery}\0${countryCode}\0${showDailyForecast ? 1 : 0}`;
      async function run() {
        if (!locationQuery) {
          fetchKeyRef.current = "";
          coordsRef.current = null;
          hasLiveDataRef.current = false;
          setPlaceLabel(null);
          setCurrent(null);
          setDaily([]);
          setDayPeriods([]);
          setSunTimes(null);
          setError(null);
          setLoading(false);
          return;
        }
        const queryChanged = fetchKeyRef.current !== fetchKey;
        if (queryChanged) {
          fetchKeyRef.current = fetchKey;
          coordsRef.current = null;
          hasLiveDataRef.current = false;
          setPlaceLabel(null);
          setCurrent(null);
          setDaily([]);
          setDayPeriods([]);
          setSunTimes(null);
        }
        setLoading(true);
        if (queryChanged || !hasLiveDataRef.current) setError(null);
        const fetchTimeoutMs = queryChanged || !coordsRef.current ? RESOLVE_FETCH_TIMEOUT_MS : FORECAST_FETCH_TIMEOUT_MS;
        const runSignal = abortSignalWithTimeout(ac.signal, fetchTimeoutMs);
        try {
          let hit;
          let forecast;
          const cached = !queryChanged ? coordsRef.current : null;
          if (cached) {
            forecast = await fetchWeatherForecast(
              cached.lat,
              cached.lon,
              runSignal,
              showDailyForecast
            );
            hit = cached.hit;
          } else {
            const resolved = await resolveWeather(
              locationQuery,
              countryCode,
              runSignal,
              de ? "de" : "en",
              showDailyForecast
            );
            if (cancelled) return;
            if (!resolved) {
              coordsRef.current = null;
              hasLiveDataRef.current = false;
              setPlaceLabel(null);
              setCurrent(null);
              setDaily([]);
              setDayPeriods([]);
              setSunTimes(null);
              setError(de ? "Ort nicht gefunden." : "Location not found.");
              return;
            }
            hit = resolved.hit;
            forecast = resolved.forecast;
            coordsRef.current = {
              lat: hit.latitude,
              lon: hit.longitude,
              hit
            };
          }
          if (cancelled) return;
          const { current: cur, daily: dail, dayPeriods: periods, sunTimes: sun } = parseForecastPayload(
            forecast,
            showDailyForecast,
            de
          );
          if (cancelled) return;
          setPlaceLabel(formatPlace(hit));
          setCurrent(cur);
          setDaily(dail);
          setDayPeriods(periods);
          setSunTimes(sun);
          hasLiveDataRef.current = true;
          setError(null);
        } catch (e) {
          if (cancelled || e.name === "AbortError") return;
          reportPluginCatch("weather", e, "open-meteo");
          if (!queryChanged && hasLiveDataRef.current) {
            setError(null);
            return;
          }
          setError(mapWeatherError(e, de));
          if (queryChanged) {
            coordsRef.current = null;
            hasLiveDataRef.current = false;
            setCurrent(null);
            setDaily([]);
            setDayPeriods([]);
            setSunTimes(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void run();
      const ms = refreshMinutes * 6e4;
      const id = window.setInterval(() => void run(), ms);
      return () => {
        cancelled = true;
        ac.abort();
        window.clearInterval(id);
      };
    }, [locationQuery, countryCode, refreshMinutes, de, showDailyForecast]);
    const rootRef = (0, import_react3.useRef)(null);
    const [layoutMetrics, setLayoutMetrics] = (0, import_react3.useState)({ split: false, h: 0 });
    (0, import_react3.useLayoutEffect)(() => {
      const el = rootRef.current;
      if (!el) return;
      const measure = () => {
        const { width: w, height: h } = el.getBoundingClientRect();
        const nextSplit = w >= WEATHER_SPLIT_MIN_PX && showDailyForecast && daily.length > 0;
        const roundedH = Math.round(h);
        setLayoutMetrics((prev) => prev.split === nextSplit && prev.h === roundedH ? prev : { split: nextSplit, h: roundedH });
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [showDailyForecast, daily.length]);
    const t = (0, import_react3.useMemo)(
      () => ({
        hint: de ? "Stadt oder PLZ in den Einstellungen eintragen." : "Set city or postal code in settings.",
        temp: de ? "Temperatur" : "Temperature",
        feels: de ? "Gef\xFChlt" : "Feels like",
        hum: de ? "Luftfeuchte" : "Humidity",
        wind: de ? "Wind" : "Wind",
        nextDays: de ? "N\xE4chste Tage" : "Next days",
        sunrise: de ? "Aufgang" : "Sunrise",
        sunset: de ? "Untergang" : "Sunset"
      }),
      [de]
    );
    const muted = "var(--text-muted)";
    const text = "var(--text)";
    if (!locationQuery) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            textAlign: "center"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "clamp(11px, 2.8cqmin, 13px)", color: muted, margin: 0, lineHeight: 1.35 }, children: t.hint })
        }
      );
    }
    const hasLiveCurrent = current != null && Number.isFinite(num(current.temperature_2m, NaN));
    if (loading && !hasLiveCurrent && !error) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "8px",
            textAlign: "center"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              LoaderCircle,
              {
                "aria-hidden": true,
                className: "sd-widget-load-spin",
                strokeWidth: 1.75,
                style: {
                  width: "clamp(28px, 9cqmin, 40px)",
                  height: "clamp(28px, 9cqmin, 40px)",
                  color: "var(--accent)"
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "clamp(11px, 2.8cqmin, 13px)", color: muted, margin: 0, lineHeight: 1.35 }, children: de ? "Wetter wird geladen\u2026" : "Loading weather\u2026" })
          ]
        }
      );
    }
    if (error && !hasLiveCurrent) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px",
            textAlign: "center"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              CloudOff,
              {
                "aria-hidden": true,
                strokeWidth: 1.75,
                style: {
                  width: "clamp(26px, 9cqmin, 40px)",
                  height: "clamp(26px, 9cqmin, 40px)",
                  color: "#fb7185",
                  filter: "drop-shadow(0 2px 6px rgba(251, 113, 133, 0.35))"
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "clamp(11px, 2.8cqmin, 13px)", color: muted, margin: 0 }, children: error })
          ]
        }
      );
    }
    const temp = current?.temperature_2m;
    const feels = current?.apparent_temperature;
    const hum = current?.relative_humidity_2m;
    const code = num(current?.weather_code, 0);
    const isDay = (current?.is_day ?? 1) === 1;
    const refreshing = loading && hasLiveCurrent;
    const wdir = num(current?.wind_direction_10m, 0);
    const wspd = num(current?.wind_speed_10m, 0);
    const summary = wmoSummary(code, de);
    const WeatherIcon = wmoIconComponent(code, isDay);
    const iconColor = wmoIconColor(code, isDay);
    const iconGlow = wmoIconGlowFilter(code, isDay);
    const hasDaily = showDailyForecast && daily.length > 0;
    const splitView = layoutMetrics.split && hasDaily;
    const containerH = layoutMetrics.h;
    const compactSplit = splitView && containerH > 0 && containerH < 380;
    const tightSplit = splitView && containerH > 0 && containerH < 260;
    const heightScale = splitView && containerH > 0 ? Math.min(1, Math.max(0.68, (containerH - 100) / 300)) : 1;
    const dayScale = dailyForecastScale * (compactSplit ? heightScale : 1);
    const rootPad = compactSplit ? "clamp(4px, 1.2cqmin, 8px)" : "clamp(6px, 2cqmin, 12px)";
    const splitGap = compactSplit ? "clamp(6px, 1.5cqmin, 12px)" : "clamp(10px, 2.2cqmin, 20px)";
    const tempFont = compactSplit ? "clamp(1.1rem, min(8cqmin, 14vw), 2rem)" : "clamp(1.5rem, min(11cqmin, 20vw), 3rem)";
    const mainIconSize = compactSplit ? "clamp(24px, min(7cqmin, 10vw), 44px)" : "clamp(32px, min(10cqmin, 14vw), 60px)";
    const dayGapGrid = `${Math.max(2, Math.round(5 * dayScale))}px`;
    const dayGapStackTight = `${Math.max(1, Math.round(3 * dayScale))}px`;
    const padDayCell = (narrow) => narrow ? `${Math.max(2, Math.round(3 * dayScale))}px ${Math.max(1, Math.round(2 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px` : `${Math.max(3, Math.round(5 * dayScale))}px ${Math.max(1, Math.round(2 * dayScale))}px ${Math.max(2, Math.round(4 * dayScale))}px`;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: rootRef,
        style: {
          height: "100%",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          containerType: "size",
          display: "flex",
          flexDirection: "column",
          gap: compactSplit ? "clamp(2px, 0.8cqmin, 6px)" : "clamp(4px, 1.1cqmin, 8px)",
          padding: rootPad,
          ...(editMode ? { paddingTop: "clamp(30px, 7cqmin, 38px)" } : {}),
          boxSizing: "border-box",
          overflow: "hidden",
          opacity: refreshing ? 0.72 : 1,
          transition: "opacity 0.2s ease"
        },
        children: [
          error && hasLiveCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "p",
            {
              style: {
                margin: 0,
                flexShrink: 0,
                fontSize: "clamp(10px, 2.2cqmin, 11px)",
                color: "#fb7185",
                textAlign: "center",
                lineHeight: 1.3
              },
              children: error
            }
          ),
          placeLabel && showPlaceLabel && !hasDaily && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "p",
            {
              style: {
                margin: 0,
                fontSize: "clamp(10px, 2.4cqmin, 12px)",
                fontWeight: 600,
                color: muted,
                textAlign: "center",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0
              },
              title: placeLabel,
              children: placeLabel
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: splitView ? "row" : "column",
                alignItems: splitView ? "stretch" : void 0,
                justifyContent: splitView ? "flex-start" : "center",
                gap: splitView ? splitGap : void 0,
                overflow: "hidden"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      flex: splitView ? "0 1 36%" : void 0,
                      maxWidth: splitView ? "40%" : void 0,
                      minWidth: splitView ? 0 : void 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: splitView ? "flex-start" : "center",
                      alignItems: "center",
                      gap: compactSplit ? "clamp(2px, 0.8cqmin, 5px)" : "clamp(4px, 1.2cqmin, 8px)",
                      alignSelf: splitView ? "stretch" : void 0,
                      ...splitView ? {
                        minHeight: 0,
                        overflow: "hidden",
                        paddingRight: compactSplit ? "clamp(4px, 1cqmin, 8px)" : "clamp(6px, 1.5cqmin, 12px)",
                        borderRight: "1px solid color-mix(in srgb, var(--border) 55%, transparent)"
                      } : {}
                    },
                    children: [
                      showHumidityWind && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "center",
                            gap: "clamp(8px, 3cqmin, 16px)",
                            flexWrap: "wrap",
                            fontSize: "clamp(10px, 2.2cqmin, 12px)",
                            color: muted,
                            width: "100%",
                            flexShrink: 0
                          },
                          children: [
                            hum != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.hum,
                              " ",
                              Math.round(hum),
                              "%"
                            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.hum,
                              " \u2014"
                            ] }),
                            wspd > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.wind,
                              " ",
                              Math.round(wspd),
                              " km/h ",
                              windCompass(wdir, de)
                            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.wind,
                              " \u2014"
                            ] })
                          ]
                        }
                      ),
                      showSunTimesRow && sunTimes && !tightSplit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "center",
                            gap: "clamp(10px, 3cqmin, 18px)",
                            flexWrap: "wrap",
                            fontSize: "clamp(10px, 2.2cqmin, 12px)",
                            color: muted,
                            width: "100%",
                            flexShrink: 0
                          },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: "4px" }, children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sunrise, { "aria-hidden": true, style: { width: 13, height: 13, color: "#fbbf24", flexShrink: 0 } }),
                              formatSunTime(sunTimes.sunrise, de)
                            ] }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: "4px" }, children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sunset, { "aria-hidden": true, style: { width: 13, height: 13, color: "#fb923c", flexShrink: 0 } }),
                              formatSunTime(sunTimes.sunset, de)
                            ] })
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "clamp(2px, 0.6cqmin, 4px)",
                            width: "100%"
                          },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "clamp(8px, 2.5cqmin, 16px)",
                                  flexWrap: "nowrap",
                                  color: iconColor
                                },
                                "aria-label": summary,
                                title: summary,
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: tempFont,
                                        fontWeight: 800,
                                        color: "var(--accent)",
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1,
                                        flexShrink: 0
                                      },
                                      children: temp != null ? `${Math.round(temp)}\xB0` : "\u2014"
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    WeatherIcon,
                                    {
                                      "aria-hidden": true,
                                      strokeWidth: 1.75,
                                      style: {
                                        width: mainIconSize,
                                        height: mainIconSize,
                                        color: iconColor,
                                        filter: iconGlow,
                                        opacity: refreshing ? 0.55 : 1,
                                        transition: "opacity 0.2s, color 0.35s ease",
                                        flexShrink: 0
                                      }
                                    }
                                  )
                                ]
                              }
                            ),
                            !tightSplit && feels != null && temp != null && Math.abs(feels - temp) >= 0.5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "clamp(10px, 2.2cqmin, 12px)", color: muted, lineHeight: 1.2 }, children: [
                              t.feels,
                              " ",
                              Math.round(feels),
                              "\xB0"
                            ] })
                          ]
                        }
                      ),
                      !compactSplit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "p",
                        {
                          style: {
                            margin: 0,
                            textAlign: "center",
                            fontSize: "clamp(11px, 2.6cqmin, 14px)",
                            color: text,
                            fontWeight: 600,
                            lineHeight: 1.25
                          },
                          children: summary
                        }
                      ),
                      showHourTimeline && dayPeriods.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            display: "grid",
                            gridTemplateColumns: `repeat(${dayPeriods.length}, minmax(0, 1fr))`,
                            gap: compactSplit ? "clamp(1px, 0.5cqmin, 4px)" : "clamp(2px, 0.8cqmin, 6px)",
                            width: "100%",
                            maxWidth: "100%",
                            margin: compactSplit ? "1px 0 0" : "2px 0 0",
                            flexShrink: 0
                          },
                          children: dayPeriods.map((slot) => {
                            const SlotIcon = wmoIconComponent(slot.code, slot.isDay);
                            const slotColor = wmoIconColor(slot.code, slot.isDay);
                            const slotSummary = wmoSummary(slot.code, de);
                            const tempLabel = formatPeriodTemps(slot.min, slot.max);
                            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "2px",
                                  padding: compactSplit ? "2px 0 1px" : "4px 1px 3px",
                                  borderRadius: "7px",
                                  background: "color-mix(in srgb, var(--surface) 88%, var(--background))",
                                  border: "1px solid color-mix(in srgb, var(--border) 65%, transparent)",
                                  minWidth: 0
                                },
                                title: de ? `${slot.label} Uhr \u2014 ${slotSummary}, ${tempLabel}` : `${slot.label}:00 \u2014 ${slotSummary}, ${tempLabel}`,
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "span",
                                    {
                                      style: {
                                        fontSize: "clamp(8px, 1.7cqmin, 10px)",
                                        fontWeight: 700,
                                        color: muted,
                                        lineHeight: 1
                                      },
                                      children: slot.label
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    SlotIcon,
                                    {
                                      "aria-hidden": true,
                                      strokeWidth: 1.75,
                                      style: {
                                        width: "clamp(12px, 3.2cqmin, 18px)",
                                        height: "clamp(12px, 3.2cqmin, 18px)",
                                        color: slotColor,
                                        filter: wmoIconGlowFilter(slot.code, slot.isDay),
                                        flexShrink: 0
                                      }
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: "clamp(9px, 2cqmin, 11px)",
                                        fontWeight: 700,
                                        color: "var(--accent)",
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1.05,
                                        textAlign: "center"
                                      },
                                      children: tempLabel
                                    }
                                  )
                                ]
                              },
                              slot.label
                            );
                          })
                        }
                      )
                    ]
                  }
                ),
                hasDaily && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      flex: splitView ? "1 1 0" : void 0,
                      minWidth: splitView ? 0 : void 0,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: splitView ? "flex-start" : void 0,
                      marginTop: splitView ? 0 : "clamp(2px, 0.8cqmin, 6px)",
                      overflow: splitView ? "hidden" : void 0
                    },
                    children: [
                      placeLabel && showPlaceLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "p",
                        {
                          style: {
                            margin: "0 0 clamp(4px, 1cqmin, 8px)",
                            fontSize: splitView ? dailyTypeClamp(dayScale, 9, 2.2, 12) : "clamp(10px, 2.4cqmin, 12px)",
                            fontWeight: 600,
                            color: muted,
                            textAlign: "center",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            width: "100%"
                          },
                          title: placeLabel,
                          children: placeLabel
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "p",
                        {
                          style: {
                            margin: compactSplit ? "0 0 3px" : "0 0 6px",
                            textAlign: "center",
                            fontSize: splitView ? dailyTypeClamp(dayScale, 10, 2.4, 13) : "clamp(9px, 2cqmin, 11px)",
                            fontWeight: 600,
                            color: muted,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            lineHeight: 1.15,
                            flexShrink: 0
                          },
                          children: t.nextDays
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                            gap: splitView ? `${Math.max(4, Math.round(7 * dayScale))}px` : dayGapStackTight,
                            width: "100%",
                            minWidth: 0,
                            minHeight: splitView ? 0 : void 0,
                            flex: splitView ? 1 : void 0,
                            overflowY: splitView ? "auto" : void 0,
                            alignContent: "start"
                          },
                          children: daily.map((day) => {
                            const d = /* @__PURE__ */ new Date(day.date + "T12:00:00");
                            const weekday = d.toLocaleDateString(de ? "de-DE" : "en-GB", { weekday: "short" });
                            const dayNum = d.toLocaleDateString(de ? "de-DE" : "en-GB", { day: "numeric", month: "numeric" });
                            const DayIcon = wmoIconComponent(day.code, true);
                            const dayColor = wmoIconColor(day.code, true);
                            const tip = `${weekday} ${dayNum} \xB7 ${wmoSummary(day.code, de)} \xB7 ${Math.round(day.max)}\xB0 / ${Math.round(day.min)}\xB0`;
                            const narrowDaily = !splitView;
                            const pad = splitView ? `${Math.max(4, Math.round(7 * dayScale))}px ${Math.max(2, Math.round(3 * dayScale))}px ${Math.max(3, Math.round(5 * dayScale))}px` : padDayCell(narrowDaily);
                            const br = `${Math.max(6, Math.round((splitView ? 10 : 8) * dayScale))}px`;
                            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                              "div",
                              {
                                title: tip,
                                style: {
                                  minWidth: 0,
                                  width: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: `${Math.max(1, Math.round(2 * dayScale))}px`,
                                  padding: pad,
                                  borderRadius: br,
                                  background: "color-mix(in srgb, var(--surface) 92%, var(--background))",
                                  border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                                  boxSizing: "border-box"
                                },
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "span",
                                    {
                                      style: {
                                        fontSize: splitView ? dailyTypeClamp(dayScale, 10, 2.4, 13) : dailyTypeClamp(dayScale, 8, 1.8, 10),
                                        fontWeight: 700,
                                        color: muted,
                                        textTransform: "capitalize",
                                        lineHeight: 1.05,
                                        textAlign: "center"
                                      },
                                      children: weekday
                                    }
                                  ),
                                !compactSplit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                  "span",
                                  {
                                    style: {
                                      fontSize: splitView ? dailyTypeClamp(dayScale, 8, 2, 11) : dailyTypeClamp(dayScale, 7, 1.6, 9),
                                      color: muted,
                                      lineHeight: 1,
                                      textAlign: "center"
                                    },
                                    children: dayNum
                                  }
                                ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    DayIcon,
                                    {
                                      "aria-hidden": true,
                                      strokeWidth: 1.85,
                                      style: {
                                        width: splitView ? dailyTypeClamp(dayScale, 20, 5.5, 30) : dailyTypeClamp(dayScale, 16, 4.5, 22),
                                        height: splitView ? dailyTypeClamp(dayScale, 20, 5.5, 30) : dailyTypeClamp(dayScale, 16, 4.5, 22),
                                        color: dayColor,
                                        filter: wmoIconGlowFilter(day.code, true),
                                        flexShrink: 0
                                      }
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: splitView ? dailyTypeClamp(dayScale, 12, 2.8, 16) : dailyTypeClamp(dayScale, 9, 2, 11),
                                        fontWeight: 700,
                                        color: "var(--accent)",
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1.05
                                      },
                                      children: [
                                        Math.round(day.max),
                                        "\xB0"
                                      ]
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: splitView ? dailyTypeClamp(dayScale, 10, 2.4, 13) : dailyTypeClamp(dayScale, 8, 1.8, 10),
                                        fontWeight: 600,
                                        color: muted,
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1
                                      },
                                      children: [
                                        Math.round(day.min),
                                        "\xB0"
                                      ]
                                    }
                                  )
                                ]
                              },
                              day.date
                            );
                          })
                        }
                      )
                    ]
                  }
                )
              ]
            }
          )
        ]
      }
    );
  }
  function Settings({ config, onChange }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const cfgRaw = config;
    const dailyOn = cfgShowDailyForecast(cfgRaw);
    const placeOn = cfgBool(cfgRaw, "showPlaceLabel", true);
    const humidityWindOn = cfgBool(cfgRaw, "showHumidityWind", true);
    const sunTimesOn = cfgBool(cfgRaw, "showSunTimes", true);
    const hourTimelineOn = cfgBool(cfgRaw, "showHourTimeline", true);
    const widthPct = cfgDailyForecastWidthPct(cfgRaw);
    const checkRow = (key, checked, title, hint) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "label",
      {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          cursor: "pointer",
          fontSize: "13px",
          color: "var(--text)",
          lineHeight: 1.35
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked,
              onChange: (e) => onChange(key, e.target.checked),
              style: { marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, accentColor: "var(--accent)" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginTop: "4px" }, children: hint })
          ] })
        ]
      },
      key
    );
    const inp = {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "6px",
      padding: "6px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Stadt oder PLZ" : "City or postal code" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.locationQuery),
            onChange: (e) => onChange("locationQuery", e.target.value),
            placeholder: de ? "z. B. Berlin, K\xF6ln, 80331" : "e.g. Berlin, London, 10001"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4 }, children: de ? "Nach dem Speichern l\xE4dt das Widget automatisch Wetterdaten (Open-Meteo). Bei PLZ optional Land setzen." : "After saving, the widget loads weather data (Open-Meteo). For postal codes, set country optionally." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Land (ISO, optional)" : "Country (ISO, optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.countryCode),
            onChange: (e) => onChange("countryCode", e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2)),
            placeholder: de ? "z. B. DE" : "e.g. DE",
            maxLength: 2
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "0 0 2px", fontWeight: 600 }, children: de ? "Anzeige im Widget" : "Widget display" }),
        checkRow(
          "showHumidityWind",
          humidityWindOn,
          de ? "Luftfeuchtigkeit & Wind" : "Humidity & wind",
          de ? "Zeile oben mit Luftfeuchte und Wind (km/h, Himmelsrichtung)." : "Top row with humidity and wind speed/direction."
        ),
        checkRow(
          "showSunTimes",
          sunTimesOn,
          de ? "Sonnenauf- & -untergang" : "Sunrise & sunset",
          de ? "Zeiten mit Symbolen unter Luftfeuchte/Wind (Open-Meteo, heute)." : "Times with icons below humidity/wind (Open-Meteo, today)."
        ),
        checkRow(
          "showHourTimeline",
          hourTimelineOn,
          de ? "3-Stunden-Verlauf (0\u201324)" : "3-hour timeline (0\u201324)",
          de ? "Kleine Kacheln mit Uhrzeit, Icon und Temperatur unter dem aktuellen Wetter." : "Small tiles with hour, icon and temperature below current weather."
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "label",
        {
          style: {
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--text)",
            lineHeight: 1.35
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: dailyOn,
                onChange: (e) => onChange("showDailyForecast", e.target.checked),
                style: { marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, accentColor: "var(--accent)" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: de ? "7-Tage-Vorschau" : "7-day forecast" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginTop: "4px" }, children: de ? "Rechts die n\xE4chsten 7 Tage ab morgen (heute nicht doppelt). Der 3-Stunden-Verlauf ist separat ein-/ausblendbar." : "Next 7 days on the right (from tomorrow). The 3-hour timeline is toggled separately." })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "label",
        {
          style: {
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--text)",
            lineHeight: 1.35
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: placeOn,
                onChange: (e) => onChange("showPlaceLabel", e.target.checked),
                style: { marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, accentColor: "var(--accent)" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: de ? "Ort / Stadtnamen" : "Location line" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginTop: "4px" }, children: de ? "Zeigt die aufgel\xF6ste Adresse oben im Widget (z. B. \u201EHamburg, \u2026, DE\u201C)." : "Shows the resolved place name at the top of the widget." })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: dailyOn ? 1 : 0.55 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "7-Tage: Kartenbreite (%)" : "7-day card width (%)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "range",
              min: 70,
              max: 130,
              step: 1,
              value: widthPct,
              disabled: !dailyOn,
              onChange: (e) => onChange("dailyForecastWidthPct", clampDailyForecastWidthPct(Number(e.target.value))),
              style: { flex: "1 1 140px", minWidth: "120px", accentColor: "var(--accent)" }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              style: { ...inp, width: "72px", flexShrink: 0 },
              type: "number",
              min: 70,
              max: 130,
              disabled: !dailyOn,
              value: widthPct,
              onChange: (e) => onChange("dailyForecastWidthPct", clampDailyForecastWidthPct(e.target.value))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4, marginBottom: 0 }, children: de ? "Skaliert Mindestbreite, Abst\xE4nde und Schrift der Tageskarten (nur wenn die 7-Tage-Vorschau aktiv ist). 100 % = Standard." : "Scales minimum width, gaps, and type for day cards when the 7-day forecast is on. 100% is default." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Aktualisieren alle (Minuten)" : "Refresh every (minutes)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 5,
            max: 120,
            value: clampRefresh(config.refreshMinutes),
            onChange: (e) => onChange("refreshMinutes", clampRefresh(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }, children: [
        de ? "Wetterdaten:" : "Weather data:",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: "https://open-meteo.com/", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)" }, children: "Open-Meteo" }),
        " ",
        de ? "(nicht kommerziell, ohne API-Key)." : "(non-commercial, no API key)."
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/weather.tsx
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
lucide-react/dist/esm/icons/cloud-drizzle.js:
lucide-react/dist/esm/icons/cloud-fog.js:
lucide-react/dist/esm/icons/cloud-lightning.js:
lucide-react/dist/esm/icons/cloud-moon.js:
lucide-react/dist/esm/icons/cloud-off.js:
lucide-react/dist/esm/icons/cloud-rain.js:
lucide-react/dist/esm/icons/cloud-snow.js:
lucide-react/dist/esm/icons/cloud-sun.js:
lucide-react/dist/esm/icons/cloud.js:
lucide-react/dist/esm/icons/loader-circle.js:
lucide-react/dist/esm/icons/moon.js:
lucide-react/dist/esm/icons/sun.js:
lucide-react/dist/esm/icons/sunrise.js:
lucide-react/dist/esm/icons/sunset.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
