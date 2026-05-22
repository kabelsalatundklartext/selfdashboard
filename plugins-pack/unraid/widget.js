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

  // plugins/unraid/index.tsx
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

  // plugins/unraid/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "unraid",
    name: "Unraid",
    description: "System-\xDCbersicht per Unraid GraphQL API (7.2+): CPU, RAM, Array, Cache/Pool-Disks. RAM-Anzeige umschaltbar (used / 1\u2212verf\xFCgbar / API-%); Darstellung an Theme-Textfarben angeglichen.",
    version: "1.5.5",
    author: "SelfDashboard",
    category: "system",
    icon: "\u{1F5A5}\uFE0F",
    iconUrl: "/plugin-logos/unraid.svg"
  };
  var QUERY = `query SelfDashboardUnraid {
  info {
    cpu {
      manufacturer
      brand
      cores
      threads
      packages {
        temp
      }
    }
    os {
      hostname
      uptime
    }
  }
  metrics {
    cpu {
      percentTotal
    }
    memory {
      total
      used
      free
      available
      percentTotal
    }
  }
  array {
    state
    capacity {
      kilobytes {
        total
        used
        free
      }
    }
    disks {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
      fsType
      comment
    }
    caches {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
      fsType
      comment
    }
  }
}`;
  function num(v) {
    if (v == null || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  function packageTempMax(packages) {
    const arr = packages?.temp;
    if (!Array.isArray(arr)) return 0;
    let m = 0;
    for (const t of arr) {
      const v = typeof t === "number" ? t : Number(t);
      if (Number.isFinite(v) && v > m) m = v;
    }
    return Math.round(m);
  }
  function fmtKb(kb) {
    if (kb >= 1024 ** 3) return `${(kb / 1024 ** 3).toFixed(1)} TB`;
    if (kb >= 1024 ** 2) return `${(kb / 1024 ** 2).toFixed(1)} GB`;
    return `${(kb / 1024).toFixed(0)} MB`;
  }
  function fmtBytes(b) {
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${b} B`;
  }
  function pct(used, total) {
    return total ? Math.round(used / total * 100) : 0;
  }
  function formatDiskStatus(status, de) {
    if (!status) return "\u2014";
    const mapDe = {
      DISK_OK: "OK",
      DISK_NP: "Leer",
      DISK_NP_MISSING: "Fehlt",
      DISK_INVALID: "Ung\xFCltig",
      DISK_WRONG: "Falsch",
      DISK_DSBL: "Aus",
      DISK_NP_DSBL: "Aus (leer)",
      DISK_DSBL_NEW: "Neu (aus)",
      DISK_NEW: "Neu"
    };
    const mapEn = {
      DISK_OK: "OK",
      DISK_NP: "Empty",
      DISK_NP_MISSING: "Missing",
      DISK_INVALID: "Invalid",
      DISK_WRONG: "Wrong",
      DISK_DSBL: "Disabled",
      DISK_NP_DSBL: "Disabled (empty)",
      DISK_DSBL_NEW: "New (disabled)",
      DISK_NEW: "New"
    };
    const map = de ? mapDe : mapEn;
    return map[status] ?? status.replace(/^DISK_/, "");
  }
  function diskTypeLabel(t, de) {
    if (!t) return "";
    const mapDe = {
      DATA: "Daten",
      PARITY: "Parity",
      BOOT: "Boot",
      FLASH: "Flash",
      CACHE: "Cache"
    };
    const mapEn = {
      DATA: "Data",
      PARITY: "Parity",
      BOOT: "Boot",
      FLASH: "Flash",
      CACHE: "Cache"
    };
    const map = de ? mapDe : mapEn;
    return map[t] ?? t;
  }
  function parseDiskSuffixLabelMode(v, fallback) {
    const s = String(v ?? fallback).trim();
    if (s === "off" || s === "cache" || s === "fsType" || s === "comment") return s;
    return fallback;
  }
  function fsTypeLabel(fsType) {
    const t = fsType?.trim();
    if (!t) return "";
    return t.toUpperCase();
  }
  function diskSuffixLabel(disk, mode, de) {
    switch (mode) {
      case "off":
        return "";
      case "cache":
        return diskTypeLabel(disk.diskType, de);
      case "fsType":
        return fsTypeLabel(disk.fsType);
      case "comment":
        return disk.comment?.trim() ?? "";
      default:
        return "";
    }
  }
  function arrayHeading(state, locale) {
    const raw = (state ?? "").trim();
    if (!raw || /^started$/i.test(raw)) return "Array";
    return `Array \u2014 ${translateArrayState(raw, locale)}`;
  }
  function translateArrayState(state, locale) {
    const de = locale !== "en";
    const k = state.trim().toLowerCase().replace(/\s+/g, "_");
    const table = {
      started: ["Gestartet", "Started"],
      stopped: ["Gestoppt", "Stopped"],
      stopping: ["Stoppt\u2026", "Stopping\u2026"],
      starting: ["Startet\u2026", "Starting\u2026"],
      new_array: ["Neues Array", "New array"],
      recon: ["Parity-Sync", "Parity sync"],
      parity_check: ["Parity-Check", "Parity check"],
      clearing: ["Wird geleert\u2026", "Clearing\u2026"],
      disabled: ["Deaktiviert", "Disabled"]
    };
    const pair = table[k];
    if (pair) return de ? pair[0] : pair[1];
    return state;
  }
  var HEAT = {
    ok: "#22c55e",
    mid: "#f59e0b",
    hot: "#ef4444"
  };
  function heatSolid(pct2) {
    const p = Math.min(100, Math.max(0, pct2));
    if (p < 50) return HEAT.ok;
    if (p < 80) return HEAT.mid;
    return HEAT.hot;
  }
  function Bar({ value }) {
    const w = Math.min(100, Math.max(0, value));
    const fill = heatSolid(w);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        title: `${Math.round(w)}%`,
        style: {
          height: "5px",
          borderRadius: "999px",
          width: "100%",
          overflow: "hidden",
          background: "var(--border)",
          border: "1px solid color-mix(in srgb, var(--border) 90%, transparent)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              height: "100%",
              width: `${w}%`,
              background: fill,
              borderRadius: "999px",
              transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
            }
          }
        )
      }
    );
  }
  function Row({ label, value, bar, pct: p, title }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        title,
        style: {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minHeight: "20px",
          width: "100%",
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              title: label,
              style: {
                flex: "1 1 34%",
                minWidth: 0,
                fontSize: "11px",
                color: "var(--text)",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: label
            }
          ),
          bar && p !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: "1 1 38%", minWidth: "40px", maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { value: p }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 38%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: "tabular-nums",
              style: {
                flex: "0 0 auto",
                maxWidth: "42%",
                fontSize: "11px",
                color: "var(--text)",
                fontWeight: 500,
                textAlign: "right",
                whiteSpace: "nowrap",
                paddingLeft: "6px",
                fontVariantNumeric: "tabular-nums"
              },
              children: value
            }
          )
        ]
      }
    );
  }
  function Heading({ text }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        style: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          margin: "12px 0 8px",
          paddingBottom: "4px",
          borderBottom: "1px solid var(--border)"
        },
        children: text
      }
    );
  }
  function DiskVolumeRow({
    disk,
    de,
    suffixLabelMode
  }) {
    const used = Math.max(0, disk.fsSize - disk.fsFree);
    const p = pct(used, disk.fsSize);
    const kind = diskSuffixLabel(disk, suffixLabelMode, de);
    const title = [disk.name, kind, formatDiskStatus(disk.status, de)].filter(Boolean).join(" \u2014 ");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          borderTop: "1px solid var(--border)",
          paddingTop: "10px",
          marginTop: "10px",
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "6px", minWidth: 0, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                style: {
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flex: "1 1 40%"
                },
                title,
                children: [
                  disk.name,
                  kind ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontWeight: 500, color: "var(--text-muted)", marginLeft: "6px", fontSize: "10px" }, children: [
                    "(",
                    kind,
                    ")"
                  ] }) : null
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                className: "tabular-nums",
                style: {
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  lineHeight: 1.35,
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500
                },
                children: [
                  formatDiskStatus(disk.status, de),
                  " \xB7 ",
                  disk.temp > 0 ? `${disk.temp}\xB0C` : "\u2014",
                  " \xB7 ",
                  p,
                  "%"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: "1 1 auto", minWidth: "48px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { value: p }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                className: "tabular-nums",
                style: {
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  paddingLeft: "6px",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500
                },
                children: [
                  fmtKb(used),
                  " / ",
                  fmtKb(disk.fsSize)
                ]
              }
            )
          ] })
        ]
      }
    );
  }
  function mapDisk(raw) {
    return {
      id: String(raw.id ?? raw.name ?? ""),
      name: String(raw.name ?? ""),
      status: String(raw.status ?? ""),
      temp: Math.round(num(raw.temp)),
      fsSize: num(raw.fsSize),
      fsFree: num(raw.fsFree),
      diskType: raw.type ? String(raw.type) : void 0,
      fsType: raw.fsType ? String(raw.fsType) : void 0,
      comment: raw.comment ? String(raw.comment).trim() : void 0
    };
  }
  function mapResponse(d) {
    const info = d?.info;
    const metrics = d?.metrics;
    const arr = d?.array;
    const cpuInfo = info?.cpu;
    const mCpu = metrics?.cpu;
    const mMem = metrics?.memory;
    const kb = arr?.capacity;
    const kbInner = kb?.kilobytes;
    const disksRaw = arr?.disks ?? [];
    const disks = disksRaw.map((x) => mapDisk(x));
    const cachesRaw = arr?.caches ?? [];
    const pools = cachesRaw.filter((c) => c && num(c.fsSize) > 0).map((c) => mapDisk(c));
    const packages = cpuInfo?.packages;
    return {
      cpu: cpuInfo ? {
        brand: String(cpuInfo.brand ?? cpuInfo.manufacturer ?? "CPU"),
        cores: num(cpuInfo.cores),
        threads: num(cpuInfo.threads),
        utilization: Math.round(num(mCpu?.percentTotal)),
        temp: packageTempMax(packages)
      } : void 0,
      memory: mMem ? {
        total: num(mMem.total),
        used: num(mMem.used),
        free: num(mMem.free),
        available: mMem.available !== void 0 && mMem.available !== null ? num(mMem.available) : void 0,
        percentTotal: num(mMem.percentTotal)
      } : void 0,
      array: arr ? {
        state: String(arr.state ?? ""),
        capacity: {
          kilobytes: {
            total: num(kbInner?.total),
            used: num(kbInner?.used),
            free: num(kbInner?.free)
          }
        },
        disks
      } : void 0,
      pools: pools.length ? pools : void 0
    };
  }
  function flag(config, key, defaultTrue = true) {
    const v = config[key];
    if (v === void 0 || v === null) return defaultTrue;
    return v !== false;
  }
  function aggregateDisks(disks) {
    let total = 0;
    let used = 0;
    for (const d of disks) {
      total += d.fsSize;
      used += Math.max(0, d.fsSize - d.fsFree);
    }
    return { total, used };
  }
  function parseRamDisplayMode(v) {
    const s = String(v ?? "used").trim();
    if (s === "available" || s === "percentTotal") return s;
    return "used";
  }
  function ramRow(mode, mem, de) {
    const { total, used, available, percentTotal } = mem;
    if (mode === "percentTotal") {
      const p = Number.isFinite(percentTotal) ? Math.round(Math.min(100, Math.max(0, percentTotal))) : pct(used, total);
      return {
        rowLabel: de ? "Anteil (API %)" : "Share (API %)",
        value: `${p}% \xB7 ${fmtBytes(used)} / ${fmtBytes(total)}`,
        barPct: p
      };
    }
    if (mode === "available" && total > 0 && available !== void 0) {
      const committed = Math.max(0, Math.min(total, total - available));
      const p = pct(committed, total);
      return {
        rowLabel: de ? "Belegung" : "Committed",
        value: `${fmtBytes(committed)} / ${fmtBytes(total)}`,
        barPct: p,
        rowTitle: de ? `Balken: (gesamt \u2212 verf\xFCgbar) / gesamt. Verf\xFCgbar: ${fmtBytes(available)}.` : `Bar: (total \u2212 available) / total. Available: ${fmtBytes(available)}.`
      };
    }
    return {
      rowLabel: de ? "Verbrauch" : "Used",
      value: `${fmtBytes(used)} / ${fmtBytes(total)}`,
      barPct: pct(used, total)
    };
  }
  function Widget({ config }) {
    const { locale, de } = usePluginLocale();
    const [data, setData] = (0, import_react.useState)(null);
    const [error, setError] = (0, import_react.useState)(null);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const url = config.url?.replace(/\/$/, "");
    const apiKey = config.apiKey;
    const refresh = (config.refreshInterval ?? 5) * 1e3;
    const showCpu = flag(config, "showCpu");
    const showCpuLoad = flag(config, "showCpuLoad");
    const showCpuPkgTemp = flag(config, "showCpuPkgTemp");
    const showCpuCores = flag(config, "showCpuCores");
    const showRam = flag(config, "showRam");
    const showArray = flag(config, "showArray");
    const showArrayTotal = flag(config, "showArrayTotal");
    const showArrayDisks = flag(config, "showArrayDisks");
    const showPools = flag(config, "showPools");
    const showPoolsTotal = flag(config, "showPoolsTotal");
    const showPoolsDisks = flag(config, "showPoolsDisks");
    const ramMode = parseRamDisplayMode(config.ramDisplayMode);
    const arrayLabelMode = parseDiskSuffixLabelMode(
      config.arrayDiskLabelMode,
      "cache"
    );
    const poolLabelMode = parseDiskSuffixLabelMode(
      config.poolDiskLabelMode,
      "fsType"
    );
    const fetch_ = (0, import_react.useCallback)(async () => {
      if (!url || !apiKey) {
        setLoading(false);
        return;
      }
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        };
        const res = await fetch(`${url}/graphql`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: QUERY })
        });
        const rawText = await res.text();
        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          throw new Error(res.ok ? "Ung\xFCltige JSON-Antwort" : `HTTP ${res.status}`);
        }
        if (!res.ok) {
          const hint = json.errors?.map((e) => e.message).filter(Boolean).join("; ");
          throw new Error(hint || `HTTP ${res.status}`);
        }
        if (json.errors?.length) {
          throw new Error(json.errors.map((e) => e.message ?? "GraphQL").join("; "));
        }
        setData(mapResponse(json.data));
        setError(null);
      } catch (e) {
        reportPluginCatch("unraid", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }, [url, apiKey]);
    (0, import_react.useEffect)(() => {
      fetch_();
      const id = setInterval(fetch_, refresh);
      return () => clearInterval(id);
    }, [fetch_, refresh]);
    const shellStyle = {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: "10px 14px 14px",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      background: "transparent"
    };
    if (!url || !apiKey)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "sd-plugin-no-scrollbar",
          style: { ...shellStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "32px" }, children: "\u{1F5A5}\uFE0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text)", marginTop: "10px", lineHeight: 1.45, fontWeight: 500 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "URL & API Key",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
              "in Einstellungen eintragen"
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "URL & API key",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
              "in settings"
            ] }) })
          ]
        }
      );
    if (loading)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sd-plugin-no-scrollbar", style: shellStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [80, 60, 90, 70].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "12px", width: `${w}%`, borderRadius: "3px" } }, i)) }) });
    if (error)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "sd-plugin-no-scrollbar",
          style: { ...shellStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "24px" }, children: "\u26A0\uFE0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "#ef4444", marginTop: "10px", wordBreak: "break-word", fontWeight: 600 }, children: error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? "URL ohne Endpfad, API-Key mit Rolle VIEWER oder ADMIN." : "Base URL without path; API key with VIEWER or ADMIN role." })
          ]
        }
      );
    const arrayKb = data?.array?.capacity?.kilobytes;
    const poolDisks = data?.pools ?? [];
    const poolAgg = aggregateDisks(poolDisks);
    const poolPct = poolAgg.total ? pct(poolAgg.used, poolAgg.total) : 0;
    const ramResolved = showRam && data?.memory ? ramRow(ramMode === "available" && data.memory.available === void 0 ? "used" : ramMode, data.memory, de) : null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sd-plugin-no-scrollbar", style: shellStyle, children: [
      showCpu && data?.cpu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: `CPU \u2014 ${data.cpu.brand}` }),
        showCpuLoad && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Auslastung" : "Load", value: `${data.cpu.utilization}%`, bar: true, pct: data.cpu.utilization }),
        showCpuPkgTemp && data.cpu.temp > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Paket-Temp." : "Package temp.", value: `${data.cpu.temp}\xB0C`, bar: true, pct: data.cpu.temp }),
        showCpuCores && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Kerne / Threads" : "Cores / threads", value: `${data.cpu.cores} / ${data.cpu.threads}` })
      ] }),
      ramResolved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: "RAM" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: ramResolved.rowLabel, value: ramResolved.value, bar: true, pct: ramResolved.barPct, title: ramResolved.rowTitle })
      ] }),
      showArray && data?.array && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: arrayHeading(data.array.state, locale) }),
        showArrayTotal && arrayKb && num(arrayKb.total) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Gesamt" : "Total", value: `${fmtKb(num(arrayKb.used))} / ${fmtKb(num(arrayKb.total))}`, bar: true, pct: pct(num(arrayKb.used), num(arrayKb.total)) }),
        showArrayDisks && data.array.disks?.filter((d) => d.status !== "DISK_NP" && d.fsSize > 0).map((disk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskVolumeRow, { disk, de, suffixLabelMode: arrayLabelMode }, disk.id))
      ] }),
      showPools && poolDisks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: de ? "Pools / Cache" : "Pools / cache" }),
        showPoolsTotal && poolAgg.total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Gesamt (Cache)" : "Total (cache)", value: `${fmtKb(poolAgg.used)} / ${fmtKb(poolAgg.total)}`, bar: true, pct: poolPct }),
        showPoolsDisks && poolDisks.map((disk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskVolumeRow, { disk, de, suffixLabelMode: poolLabelMode }, disk.id))
      ] })
    ] });
  }
  function ToggleRow({
    label,
    on,
    onToggle
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }, onClick: onToggle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)", flex: 1 }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            width: "36px",
            height: "20px",
            borderRadius: "10px",
            background: on ? "var(--accent)" : "var(--border)",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                position: "absolute",
                top: "2px",
                left: on ? "18px" : "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s"
              }
            }
          )
        }
      )
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
    const sub = (key, def = true) => flag(config, key, def);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Unraid-Basis-URL" : "Unraid base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: config.url || "", onChange: (e) => onChange("url", e.target.value), placeholder: "http://192.168.1.10 oder https://tower" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: "API Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, type: "password", value: config.apiKey || "", onChange: (e) => onChange("apiKey", e.target.value), placeholder: "x-api-key" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: config.refreshInterval ?? 5, onChange: (e) => onChange("refreshInterval", Number(e.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 2, children: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 10, children: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 30, children: "30" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 60, children: "60" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Anzeige \u2014 grob" : "Display \u2014 overview" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "\u{1F5A5}\uFE0F CPU (Sektion)" : "\u{1F5A5}\uFE0F CPU (section)", on: sub("showCpu"), onToggle: () => onChange("showCpu", !sub("showCpu")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: "\u{1F4BE} RAM", on: sub("showRam"), onToggle: () => onChange("showRam", !sub("showRam")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: "\u{1F5C4}\uFE0F Array", on: sub("showArray"), onToggle: () => onChange("showArray", !sub("showArray")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "\u{1F4BF} Pools / Cache" : "\u{1F4BF} Pools / cache", on: sub("showPools"), onToggle: () => onChange("showPools", !sub("showPools")) })
        ] })
      ] }),
      sub("showCpu") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "CPU \u2014 Details" : "CPU \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Auslastung %" : "Load %", on: sub("showCpuLoad"), onToggle: () => onChange("showCpuLoad", !sub("showCpuLoad")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Paket-Temperatur" : "Package temperature", on: sub("showCpuPkgTemp"), onToggle: () => onChange("showCpuPkgTemp", !sub("showCpuPkgTemp")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Kerne / Threads" : "Cores / threads", on: sub("showCpuCores"), onToggle: () => onChange("showCpuCores", !sub("showCpuCores")) })
        ] })
      ] }),
      sub("showArray") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Array \u2014 Details" : "Array \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Gesamt-Balken" : "Total bar", on: sub("showArrayTotal"), onToggle: () => onChange("showArrayTotal", !sub("showArrayTotal")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ToggleRow,
            {
              label: de ? "Einzelne Disks (Status \xB7 Temp \xB7 %)" : "Individual disks (status \xB7 temp \xB7 %)",
              on: sub("showArrayDisks"),
              onToggle: () => onChange("showArrayDisks", !sub("showArrayDisks"))
            }
          ),
          sub("showArrayDisks") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Zusatzlabel (in Klammern)" : "Suffix label (in parentheses)" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                style: { ...inp, cursor: "pointer" },
                value: parseDiskSuffixLabelMode(config.arrayDiskLabelMode, "cache"),
                onChange: (e) => onChange("arrayDiskLabelMode", e.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "off", children: de ? "Aus \u2014 nur Diskname" : "Off \u2014 disk name only" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cache", children: de ? "Disk-Rolle (Daten/Parity \u2026)" : "Disk role (data/parity \u2026)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "fsType", children: de ? "Dateisystem (fsType)" : "Filesystem (fsType)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "comment", children: de ? "Kommentar (falls gesetzt)" : "Comment (if set)" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.45, margin: "8px 0 0" }, children: de ? "Standard: Disk-Rolle (z. B. disk1 (Daten)). fsType zeigt XFS/ZFS, falls die API es liefert." : "Default: disk role (e.g. disk1 (Data)). fsType shows XFS/ZFS when the API provides it." })
          ] })
        ] })
      ] }),
      sub("showPools") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Pools / Cache \u2014 Details" : "Pools / cache \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ToggleRow,
            {
              label: de ? "Gesamt-Balken (alle Cache-Disks)" : "Total bar (all cache disks)",
              on: sub("showPoolsTotal"),
              onToggle: () => onChange("showPoolsTotal", !sub("showPoolsTotal"))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Einzelne Cache-Disks" : "Individual cache disks", on: sub("showPoolsDisks"), onToggle: () => onChange("showPoolsDisks", !sub("showPoolsDisks")) }),
          sub("showPoolsDisks") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Zusatzlabel (in Klammern)" : "Suffix label (in parentheses)" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "select",
              {
                style: { ...inp, cursor: "pointer" },
                value: parseDiskSuffixLabelMode(config.poolDiskLabelMode, "fsType"),
                onChange: (e) => onChange("poolDiskLabelMode", e.target.value),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "off", children: de ? "Aus \u2014 nur Poolname" : "Off \u2014 pool name only" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "fsType", children: de ? "Dateisystem (fsType)" : "Filesystem (fsType)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cache", children: de ? "Cache-Typ (API type)" : "Cache type (API type)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "comment", children: de ? "Kommentar (falls gesetzt)" : "Comment (if set)" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.45, margin: "8px 0 0" }, children: de ? "z. B. nvme-raid (ZFS). Allocation Profile liefert die GraphQL-API derzeit nicht \u2014 fsType ist meist die beste Alternative." : "e.g. nvme-raid (ZFS). Allocation profile is not in the GraphQL API yet \u2014 fsType is usually the best alternative." })
          ] })
        ] })
      ] }),
      sub("showRam") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "RAM \u2014 Anzeige" : "RAM \u2014 display" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Balken und Text" : "Bar and text" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              style: { ...inp, cursor: "pointer" },
              value: String(config.ramDisplayMode ?? "used"),
              onChange: (e) => onChange("ramDisplayMode", e.target.value),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "used", children: de ? "Verbrauch (used / total)" : "Used (used / total)" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "available", children: de ? "Belegung (1 \u2212 verf\xFCgbar / total)" : "Committed (1 \u2212 available / total)" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "percentTotal", children: "API % (metrics.percentTotal)" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.45, margin: "8px 0 0" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            "\u201E1 \u2212 verf\xFCgbar\u201C wirkt oft n\xE4her am Unraid-Dashboard als reines ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "used" }),
            ". Erfordert",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "metrics.memory.available" }),
            " in der API (Unraid 7.2+)."
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            "\u201C1 \u2212 available\u201D often matches the Unraid dashboard better than raw ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "used" }),
            ". Requires",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "metrics.memory.available" }),
            " in the API (Unraid 7.2+)."
          ] }) })
        ] })
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/unraid.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
