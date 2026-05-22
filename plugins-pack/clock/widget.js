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

  // plugins/clock/index.tsx
  var import_react = __toESM(require_react());

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // plugins/clock/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "clock",
    name: "Clock & Date",
    description: "Displays the current time and date with timezone support.",
    version: "1.2.2",
    author: "SelfDashboard",
    category: "utility",
    icon: "\u{1F550}",
    configSchema: [
      { key: "timezone", label: "Timezone", type: "text", placeholder: "Europe/Berlin", defaultValue: "" },
      { key: "format24h", label: "24h Format", type: "boolean", defaultValue: true },
      { key: "showSeconds", label: "Show Seconds", type: "boolean", defaultValue: true },
      { key: "showDate", label: "Show Date", type: "boolean", defaultValue: true },
      { key: "cityName", label: "City Name", type: "text", placeholder: "z.B. Berlin, New York, Tokyo", defaultValue: "" }
    ]
  };
  var TIMEZONES = [
    { label: "Local (auto)", value: "" },
    { label: "Europe/Berlin", value: "Europe/Berlin" },
    { label: "Europe/London", value: "Europe/London" },
    { label: "Europe/Paris", value: "Europe/Paris" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "America/Los_Angeles", value: "America/Los_Angeles" },
    { label: "America/Chicago", value: "America/Chicago" },
    { label: "Asia/Tokyo", value: "Asia/Tokyo" },
    { label: "Asia/Shanghai", value: "Asia/Shanghai" },
    { label: "Asia/Dubai", value: "Asia/Dubai" },
    { label: "Australia/Sydney", value: "Australia/Sydney" },
    { label: "UTC", value: "UTC" }
  ];
  function Widget({ config }) {
    const { de } = usePluginLocale();
    const [now, setNow] = (0, import_react.useState)(null);
    const tz = config.timezone || void 0;
    const is24h = config.format24h !== false;
    const showSeconds = config.showSeconds !== false;
    const showDate = config.showDate !== false;
    const loc = de ? "de-DE" : "en-GB";
    (0, import_react.useEffect)(() => {
      setNow(/* @__PURE__ */ new Date());
      const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
      return () => clearInterval(id);
    }, []);
    const timeStr = now ? now.toLocaleTimeString(loc, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      ...showSeconds ? { second: "2-digit" } : {},
      hour12: !is24h
    }) : "--:--:--";
    const dateStr = now ? now.toLocaleDateString(loc, {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }) : "";
    const cityName = config.cityName?.trim();
    const tzLabel = cityName || tz || "";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          minWidth: 0,
          gap: "2px",
          padding: "2px 4px",
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "p",
            {
              className: "tabular-nums tracking-tight",
              style: {
                color: "var(--accent)",
                fontVariantNumeric: "tabular-nums",
                fontSize: showSeconds ? "clamp(0.85rem, min(5vw, 18cqmin), 2.5rem)" : "clamp(0.95rem, min(5.5vw, 22cqmin), 3rem)",
                fontWeight: 800,
                lineHeight: 1.05,
                textAlign: "center",
                wordBreak: "break-word"
              },
              children: timeStr
            }
          ),
          showDate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "p",
            {
              style: {
                fontSize: "clamp(0.65rem, min(2.8vw, 9cqmin), 0.95rem)",
                color: "var(--text-muted)",
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: "100%"
              },
              children: dateStr
            }
          ),
          (cityName || tz) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "0.75em", marginTop: "4px", padding: "2px 8px", borderRadius: "999px", background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }, children: tzLabel })
        ]
      }
    );
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
    const inputStyle = {
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Zeitzone" : "Timezone" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "select",
          {
            style: { ...inputStyle, cursor: "pointer" },
            value: config.timezone || "",
            onChange: (e) => onChange("timezone", e.target.value),
            children: TIMEZONES.map((tz) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: tz.value, children: tz.value === "" ? de ? "Lokal (auto)" : "Local (auto)" : tz.label }, tz.value))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }, children: de ? "Nicht in der Liste? Unten manuell eintragen:" : "Not in the list? Enter manually below:" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: { ...inputStyle, marginTop: "4px" },
            value: config.timezone || "",
            onChange: (e) => onChange("timezone", e.target.value),
            placeholder: de ? "z. B. America/Toronto" : "e.g. America/Toronto"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Stadtname" : "City name" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: { ...inputStyle },
            value: config.cityName || "",
            onChange: (e) => onChange("cityName", e.target.value),
            placeholder: de ? "z. B. Berlin, New York, Tokyo" : "e.g. Berlin, New York, Tokyo"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }, children: de ? "Wird unter der Uhrzeit angezeigt" : "Shown under the time" })
      ] }),
      [
        { key: "format24h", label: de ? "24-Stunden-Format" : "24-hour format", default: true },
        { key: "showSeconds", label: de ? "Sekunden anzeigen" : "Show seconds", default: true },
        { key: "showDate", label: de ? "Datum anzeigen" : "Show date", default: true }
      ].map(({ key, label, default: def }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              width: "36px",
              height: "20px",
              borderRadius: "10px",
              background: config[key] ?? def ? "var(--accent)" : "var(--border)",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
              flexShrink: 0
            },
            onClick: () => onChange(key, !(config[key] ?? def)),
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              position: "absolute",
              top: "2px",
              left: config[key] ?? def ? "18px" : "2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s"
            } })
          }
        )
      ] }, key))
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/clock.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
