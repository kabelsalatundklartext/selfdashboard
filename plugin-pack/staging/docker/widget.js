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

  // node_modules/lucide-react/dist/esm/icons/grip-vertical.js
  var GripVertical = createLucideIcon("GripVertical", [
    ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
    ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
    ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
    ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
    ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
    ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }]
  ]);

  // plugins/docker/index.tsx
  var import_react3 = __toESM(require_react());

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

  // plugins/docker/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "docker",
    name: "Docker",
    description: "Docker: kompakte Tabellenansicht oder klassische Zeile. Icons aus Container-Labels + optional CDN (walkxcode/dashboard-icons). Steuerung & Stats konfigurierbar. API: /api/plugins/docker/containers.",
    version: "1.9.0",
    author: "SelfDashboard",
    category: "system",
    icon: "\u{1F433}",
    iconUrl: "/plugin-logos/docker.png",
    defaultLayout: { w: 6, h: 5, minW: 4 },
    stackedExtraH: 2
  };
  var COMPACT_TABLE_NARROW_PX = 440;
  var COMPACT_TABLE_AUTO_NAMES_MIN_PX = 520;
  function dockerContainerId(c) {
    const o = c;
    const raw = c.Id ?? o.id;
    return typeof raw === "string" ? raw.trim() : "";
  }
  function isDockerRunning(c) {
    const o = c;
    const st = c.State ?? o.state;
    return typeof st === "string" && st.toLowerCase() === "running";
  }
  function actionVerb(a) {
    switch (a) {
      case "start":
        return "starten";
      case "stop":
        return "stoppen";
      case "restart":
        return "neu starten";
      default:
        return a;
    }
  }
  function actionVerbEn(a) {
    switch (a) {
      case "start":
        return "start";
      case "stop":
        return "stop";
      case "restart":
        return "restart";
      default:
        return a;
    }
  }
  function actionNoun(a) {
    switch (a) {
      case "start":
        return "Start";
      case "stop":
        return "Stopp";
      case "restart":
        return "Neustart";
      default:
        return a;
    }
  }
  function actionNounEn(a) {
    switch (a) {
      case "start":
        return "Start";
      case "stop":
        return "Stop";
      case "restart":
        return "Restart";
      default:
        return a;
    }
  }
  function containerName(c) {
    const n = c.Names?.[0] ?? "";
    const id = dockerContainerId(c);
    return n.replace(/^\//, "") || (id ? id.slice(0, 12) : "\u2014");
  }
  function sortContainers(a, b) {
    const ar = isDockerRunning(a) ? 0 : 1;
    const br = isDockerRunning(b) ? 0 : 1;
    if (ar !== br) return ar - br;
    return containerName(a).localeCompare(containerName(b), void 0, { sensitivity: "base" });
  }
  function parseListSort(v) {
    if (v === "name" || v === "cpu_desc" || v === "cpu_asc" || v === "mem_desc" || v === "mem_asc" || v === "custom") return v;
    return "default";
  }
  function cfgBool(v, ifMissing) {
    if (v === void 0 || v === null || v === "") return ifMissing;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return ifMissing;
  }
  function normalizeIdOrder(v) {
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === "string" && x.trim() !== "").map((x) => x.trim());
  }
  function applyCustomContainerOrder(items, customOrder, getId, sortFallback) {
    const map = /* @__PURE__ */ new Map();
    for (const t of items) {
      const id = getId(t);
      if (id) map.set(id, t);
    }
    const used = /* @__PURE__ */ new Set();
    const out = [];
    for (const oid of customOrder) {
      let hit = map.get(oid);
      if (!hit) {
        for (const [kid, t] of map) {
          if (used.has(kid)) continue;
          if (kid === oid || kid.startsWith(oid) || oid.startsWith(kid.slice(0, 12))) {
            hit = t;
            break;
          }
        }
      }
      if (hit) {
        const id = getId(hit);
        if (id && !used.has(id)) {
          out.push(hit);
          used.add(id);
        }
      }
    }
    const rest = items.filter((t) => {
      const id = getId(t);
      return id ? !used.has(id) : true;
    });
    rest.sort(sortFallback);
    return [...out, ...rest];
  }
  function buildOrderedDockerList(items, listSort, customOrder) {
    if (listSort === "custom" && customOrder.length > 0) {
      return applyCustomContainerOrder(items, customOrder, dockerContainerId, sortContainers);
    }
    if (listSort === "custom") {
      return applyDockerSort(items, "default");
    }
    return applyDockerSort(items, listSort);
  }
  function dockerCpuPct(c) {
    const p = c.sdStats?.cpuPct;
    return typeof p === "number" && Number.isFinite(p) ? p : null;
  }
  function dockerMemSortKey(c) {
    const b = c.sdStats?.memUsageBytes;
    if (typeof b === "number" && Number.isFinite(b) && b >= 0) return b;
    const mp = c.sdStats?.memPct;
    return typeof mp === "number" && Number.isFinite(mp) && mp >= 0 ? mp : null;
  }
  function applyDockerSort(arr, mode) {
    const copy = arr.slice();
    if (mode === "custom") {
      copy.sort(sortContainers);
      return copy;
    }
    if (mode === "default") {
      copy.sort(sortContainers);
      return copy;
    }
    if (mode === "name") {
      copy.sort((a, b) => containerName(a).localeCompare(containerName(b), void 0, { sensitivity: "base" }));
      return copy;
    }
    const desc = mode === "cpu_desc" || mode === "mem_desc";
    const useMem = mode === "mem_desc" || mode === "mem_asc";
    copy.sort((a, b) => {
      const va = useMem ? dockerMemSortKey(a) : dockerCpuPct(a);
      const vb = useMem ? dockerMemSortKey(b) : dockerCpuPct(b);
      if (va != null && vb != null && va !== vb) return desc ? vb - va : va - vb;
      if (va != null && vb == null) return -1;
      if (va == null && vb != null) return 1;
      return sortContainers(a, b);
    });
    return copy;
  }
  function fmtBytesShort(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "\u2014";
    const gib = bytes / 1024 ** 3;
    if (gib >= 1) return `${gib < 10 ? gib.toFixed(1) : gib.toFixed(0)} GiB`;
    const mib = bytes / 1024 ** 2;
    return `${mib < 10 ? mib.toFixed(1) : mib.toFixed(0)} MiB`;
  }
  function fmtCpuPct(p) {
    if (p == null || !Number.isFinite(p)) return "\u2014";
    if (p < 10) return `${p.toFixed(1)} %`;
    return `${Math.round(p)} %`;
  }
  function statsLine(c, running, showCpu, showRam) {
    if (!running || !showCpu && !showRam) return null;
    const s = c.sdStats;
    const parts = [];
    if (showCpu) {
      parts.push(`CPU ${fmtCpuPct(s?.cpuPct ?? null)}`);
    }
    if (showRam) {
      let ram = "\u2014";
      if (s?.memUsageBytes != null && Number.isFinite(s.memUsageBytes)) {
        if (s.memLimitBytes != null && s.memLimitBytes > 0) {
          ram = `${fmtBytesShort(s.memUsageBytes)} / ${fmtBytesShort(s.memLimitBytes)}`;
          if (s.memPct != null && Number.isFinite(s.memPct)) ram += ` (${s.memPct.toFixed(0)} %)`;
        } else {
          ram = fmtBytesShort(s.memUsageBytes);
        }
      }
      parts.push(`RAM ${ram}`);
    }
    return parts.join(" \xB7 ");
  }
  function barFillPct(value) {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }
  function ramPercentForBar(s) {
    if (!s) return null;
    if (s.memPct != null && Number.isFinite(s.memPct)) return s.memPct;
    if (s.memUsageBytes != null && s.memLimitBytes != null && s.memLimitBytes > 0) {
      return s.memUsageBytes / s.memLimitBytes * 100;
    }
    return null;
  }
  var HEAT_GREEN = "#22c55e";
  var HEAT_AMBER = "#f59e0b";
  var HEAT_RED = "#ef4444";
  function heatColorForPct(p) {
    if (p == null || !Number.isFinite(p)) return "var(--text-muted)";
    if (p < 12) return HEAT_GREEN;
    if (p < 50) return HEAT_AMBER;
    return HEAT_RED;
  }
  function fmtMemoryCompact(s, running) {
    if (!running) return "\u2014";
    if (s?.memUsageBytes == null || !Number.isFinite(s.memUsageBytes)) return "\u2014";
    return fmtBytesShort(s.memUsageBytes);
  }
  var IMAGE_EMOJI = [
    ["pihole", "\u{1F573}\uFE0F"],
    ["pi-hole", "\u{1F573}\uFE0F"],
    ["cloudflared", "\u2601\uFE0F"],
    ["uptime-kuma", "\u{1F4C8}"],
    ["uptime_kuma", "\u{1F4C8}"],
    ["sonarr", "\u{1F4FA}"],
    ["radarr", "\u{1F3AC}"],
    ["lidarr", "\u{1F3B5}"],
    ["prowlarr", "\u{1F441}\uFE0F"],
    ["bazarr", "\u{1F4AC}"],
    ["ombi", "\u{1F37F}"],
    ["plex", "\u25B6\uFE0F"],
    ["jellyfin", "\u{1F39E}\uFE0F"],
    ["emby", "\u{1F39E}\uFE0F"],
    ["immich", "\u{1F5BC}\uFE0F"],
    ["nextcloud", "\u2601\uFE0F"],
    ["mariadb", "\u{1F5C4}\uFE0F"],
    ["postgres", "\u{1F418}"],
    ["mongo", "\u{1F343}"],
    ["redis", "\u2B55"],
    ["nginx", "\u{1F30A}"],
    ["caddy", "\u{1F512}"],
    ["traefik", "\u{1F500}"],
    ["portainer", "\u{1F9F0}"],
    ["homepage", "\u{1F3E0}"],
    ["homarr", "\u{1F4CA}"],
    ["grafana", "\u{1F4C8}"],
    ["prometheus", "\u{1F525}"],
    ["nzbget", "\u{1F4E5}"],
    ["sabnzbd", "\u{1F4E5}"],
    ["ollama", "\u{1F999}"],
    ["qbittorrent", "\u{1F9F2}"],
    ["transmission", "\u{1F4E1}"],
    ["deluge", "\u{1F30A}"]
  ];
  function serviceMark(image, displayName) {
    const base = (image.split(":")[0]?.split("@")[0] ?? "").toLowerCase();
    const slug = base.split("/").pop() ?? base;
    for (const [k, emoji] of IMAGE_EMOJI) {
      if (slug.includes(k)) return { kind: "emoji", v: emoji };
    }
    const raw = displayName.replace(/^\/+/, "").trim();
    const ch = (raw[0] || slug[0] || "?").toUpperCase();
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i) * (i + 1)) % 360;
    const bg = `linear-gradient(135deg, hsl(${h} 52% 40%), hsl(${(h + 48) % 360} 48% 26%))`;
    return { kind: "letter", letter: ch, bg };
  }
  function fmtUpdatedAgo(ts, locale) {
    if (ts == null) return "";
    const de = locale !== "en";
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1e3));
    if (sec < 8) return de ? "Gerade aktualisiert" : "Updated just now";
    if (sec < 60) return de ? `Vor ${sec}s aktualisiert` : `Updated ${sec}s ago`;
    const m = Math.floor(sec / 60);
    if (m < 60) return de ? `Vor ${m} Min. aktualisiert` : `Updated ${m} min ago`;
    const h = Math.floor(m / 60);
    return de ? `Vor ${h} Std. aktualisiert` : `Updated ${h}h ago`;
  }
  function fmtCpuCompact(p, running) {
    if (!running) return "\u2014";
    if (p == null || !Number.isFinite(p)) return "\u2014";
    if (p < 10) return `${p.toFixed(2)}%`;
    if (p < 100) return `${p.toFixed(1)}%`;
    return `${Math.round(p)}%`;
  }
  function stateBadgeLabel(state, locale) {
    const s = (state ?? "").toLowerCase();
    const de = locale !== "en";
    if (s === "running") return de ? "Aktiv" : "Active";
    if (s === "exited" || s === "dead") return de ? "Aus" : "Off";
    if (s === "paused") return de ? "Pause" : "Paused";
    if (s === "restarting") return de ? "Warte" : "Wait";
    const raw = (state ?? "").trim();
    if (!raw) return de ? "?" : "?";
    return raw.length <= 7 ? raw : `${raw.slice(0, 6)}\u2026`;
  }
  function stateBadgeStyle(state, compact, micro, textOnly) {
    const base = {
      display: "inline-block",
      fontWeight: 600,
      fontSize: micro ? "6px" : compact ? "7px" : textOnly ? "9px" : "8px",
      letterSpacing: micro || compact || textOnly ? 0 : "0.02em",
      padding: textOnly ? 0 : micro ? "0 2px" : compact ? "1px 4px" : "2px 6px",
      borderRadius: textOnly ? 0 : micro ? "3px" : "4px",
      whiteSpace: "nowrap",
      lineHeight: micro ? 1.05 : 1.2,
      textTransform: "none",
      maxWidth: micro ? "100%" : void 0,
      boxSizing: "border-box",
      background: textOnly ? "transparent" : void 0
    };
    const s = (state ?? "").toLowerCase();
    if (s === "running") {
      return {
        ...base,
        background: textOnly ? "transparent" : "#15803d",
        color: textOnly ? "#4ade80" : "#fff"
      };
    }
    if (s === "exited" || s === "dead") {
      return {
        ...base,
        background: textOnly ? "transparent" : "#7f1d1d",
        color: textOnly ? "#f87171" : "#fecaca"
      };
    }
    if (s === "paused") {
      return {
        ...base,
        background: textOnly ? "transparent" : "#854d0e",
        color: textOnly ? "#fbbf24" : "#fef08a"
      };
    }
    return {
      ...base,
      background: textOnly ? "transparent" : "var(--border)",
      color: "var(--text-muted)"
    };
  }
  var ACTION_ICON = "#b91c1c";
  function IconStop({ disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, style: { opacity: disabled ? 0.35 : 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2", fill: ACTION_ICON }) });
  }
  function IconPlay({ disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": true, style: { opacity: disabled ? 0.35 : 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 5v14l11-7z", fill: ACTION_ICON }) });
  }
  function IconRestart({ disabled: _disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        "aria-hidden": true,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          color: ACTION_ICON,
          fontSize: "15px",
          fontWeight: 800,
          lineHeight: 1,
          opacity: _disabled ? 0.35 : 1,
          transform: "scaleX(-1)"
        },
        children: "\u21BB"
      }
    );
  }
  function MiniBar({
    label,
    fillPct,
    tooltip,
    barColor
  }) {
    const track = {
      width: 38,
      height: 5,
      background: "var(--border)",
      borderRadius: 3,
      overflow: "hidden",
      flexShrink: 0
    };
    const fill = {
      display: "block",
      height: "100%",
      width: `${fillPct}%`,
      background: barColor,
      borderRadius: 3,
      transition: "width 0.35s ease-out"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { title: tooltip, style: { display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "7px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.02em", width: "1em", textAlign: "right" }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: track, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: fill }) })
    ] });
  }
  function SettingsSectionTitle({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 6px" }, children });
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
  var DASHBOARD_ICONS_PNG_BASE = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png";
  var ICON_SLUG_ALIASES = {
    adguardhome: "adguard-home",
    immichserver: "immich",
    "immich-server": "immich",
    jdownloader2: "jdownloader",
    "jdownloader-2": "jdownloader",
    postgres: "postgresql"
  };
  function buildLabelIconUrl(labels) {
    if (!labels) return null;
    const keys = [
      "org.opencontainers.image.icon",
      "net.unraid.docker.icon",
      "traefik.icon",
      "org.label-schema.icon",
      "ICON",
      "com.docker.desktop.extension.api.icon"
    ];
    for (const k of keys) {
      const raw = labels[k];
      if (typeof raw !== "string") continue;
      const v = raw.trim();
      if (!v) continue;
      if (/^https?:\/\//i.test(v)) return v;
      if (/^data:image\//i.test(v)) return v;
    }
    return null;
  }
  function slugCandidatesFromImage(image) {
    const raw = (image.split(":")[0]?.split("@")[0] ?? "").toLowerCase();
    const last = raw.split("/").pop()?.replace(/[^a-z0-9._-]/g, "") ?? "docker";
    const dashed = last.replace(/_/g, "-");
    const set = /* @__PURE__ */ new Set();
    const add = (s) => {
      const t = s.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (t.length >= 2) set.add(t);
    };
    add(dashed);
    add(dashed.replace(/-server$/i, ""));
    add(dashed.replace(/^linuxserver-/, ""));
    const alias = ICON_SLUG_ALIASES[dashed.replace(/-/g, "")] ?? ICON_SLUG_ALIASES[dashed];
    if (alias) add(alias);
    if (set.size === 0) set.add("docker");
    return [...set].slice(0, 8);
  }
  function dashboardIconPngUrls(image) {
    return slugCandidatesFromImage(image).map(
      (slug) => `${DASHBOARD_ICONS_PNG_BASE}/${encodeURIComponent(slug)}.png`
    );
  }
  function letterHue(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 3)) % 360;
    return h;
  }
  function ContainerAvatar({
    image,
    name,
    labels,
    useDashboardIcons
  }) {
    const labelUrl = (0, import_react3.useMemo)(() => buildLabelIconUrl(labels), [labels]);
    const cdnUrls = (0, import_react3.useMemo)(() => dashboardIconPngUrls(image), [image]);
    const mark = (0, import_react3.useMemo)(() => serviceMark(image, name), [image, name]);
    const [labelFailed, setLabelFailed] = (0, import_react3.useState)(false);
    const [cdnIdx, setCdnIdx] = (0, import_react3.useState)(0);
    (0, import_react3.useEffect)(() => {
      setLabelFailed(false);
      setCdnIdx(0);
    }, [labelUrl, image, name, useDashboardIcons]);
    const tryLabel = Boolean(labelUrl) && !labelFailed;
    const tryCdn = useDashboardIcons && (!labelUrl || labelFailed) && cdnIdx < cdnUrls.length;
    const remoteSrc = tryLabel ? labelUrl : tryCdn ? cdnUrls[cdnIdx] : null;
    const onRemoteError = (0, import_react3.useCallback)(() => {
      if (tryLabel) {
        setLabelFailed(true);
        return;
      }
      setCdnIdx((i) => i + 1);
    }, [tryLabel]);
    const box = (inner) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        "aria-hidden": true,
        style: {
          width: 24,
          height: 24,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          boxSizing: "border-box"
        },
        children: inner
      }
    );
    if (remoteSrc) {
      return box(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "img",
          {
            src: remoteSrc,
            alt: "",
            width: 24,
            height: 24,
            loading: "lazy",
            referrerPolicy: "no-referrer",
            onError: onRemoteError,
            style: {
              width: 24,
              height: 24,
              objectFit: "contain",
              display: "block",
              background: "color-mix(in srgb, var(--surface) 88%, var(--background))"
            }
          },
          remoteSrc
        )
      );
    }
    if (mark.kind === "emoji") {
      return box(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 14, lineHeight: 1, background: "var(--surface)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }, children: mark.v })
      );
    }
    const hue = letterHue(`${name}:${image}`);
    return box(
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "span",
        {
          style: {
            width: "100%",
            height: "100%",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            background: `hsl(${hue} 52% 44%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "-0.02em"
          },
          children: mark.letter
        }
      )
    );
  }
  function DockerTableCompact({
    list,
    locale,
    busyId,
    pending,
    useDashboardIcons,
    showContainerNames,
    showStatCpu,
    showStatRam,
    showBtnStart,
    showBtnStop,
    showBtnRestart,
    btn,
    btnMuted,
    thStyle,
    tdCompact,
    iconAct,
    beginAction,
    goSecondStep,
    executeAction,
    cancelPending,
    reorderEnabled = false,
    onReorderRows
  }) {
    const wrapRef = (0, import_react3.useRef)(null);
    const [narrow, setNarrow] = (0, import_react3.useState)(false);
    const [autoNamesByWidth, setAutoNamesByWidth] = (0, import_react3.useState)(false);
    (0, import_react3.useLayoutEffect)(() => {
      const el = wrapRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const apply = () => {
        const w = el.getBoundingClientRect().width;
        const nextNarrow = w > 0 && w < COMPACT_TABLE_NARROW_PX;
        const nextAuto = w >= COMPACT_TABLE_AUTO_NAMES_MIN_PX;
        setNarrow((prev) => prev === nextNarrow ? prev : nextNarrow);
        setAutoNamesByWidth((prev) => prev === nextAuto ? prev : nextAuto);
      };
      apply();
      const ro = new ResizeObserver(() => apply());
      ro.observe(el);
      return () => ro.disconnect();
    }, [showContainerNames, showStatCpu, showStatRam, list.length]);
    const de = locale !== "en";
    const showNamesEffective = showContainerNames || autoNamesByWidth;
    const iconRow = !showNamesEffective;
    const tightMetrics = iconRow && narrow;
    const tdRow = tightMetrics ? { ...tdCompact, padding: "1px 2px", fontSize: "10px" } : narrow ? { ...tdCompact, padding: "4px 5px", fontSize: "10px" } : iconRow ? { ...tdCompact, padding: "5px 4px" } : tdCompact;
    const thDyn = tightMetrics ? { ...thStyle, fontSize: "8px", letterSpacing: "0.03em", padding: "3px 2px" } : narrow ? { ...thStyle, fontSize: "8px", letterSpacing: "0.04em", padding: "5px 5px" } : thStyle;
    const thRow = iconRow && !narrow ? { ...thDyn, padding: "5px 4px" } : thDyn;
    const colWidths = iconRow ? narrow ? [
      reorderEnabled ? "56px" : "44px",
      "40px",
      "34px",
      "38px",
      reorderEnabled ? "52px" : "44px"
    ] : [null, "76px", "60px", "72px", reorderEnabled ? "96px" : "88px"] : narrow ? [null, "56px", "50px", "64px", "52px"] : [null, "78px", "62px", "74px", "64px"];
    const iconActBox = iconRow ? {
      width: colWidths[4],
      maxWidth: colWidths[4],
      minWidth: colWidths[4],
      boxSizing: "border-box"
    } : null;
    const headers = narrow ? showNamesEffective ? [de ? "Name" : "Name", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"] : ["", de ? "St." : "St.", "CPU", de ? "Sp." : "Mem.", de ? "Akt." : "Act."] : showNamesEffective ? [de ? "Name" : "Name", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"] : ["", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"];
    const metricAlign = iconRow ? "left" : "right";
    const memAlign = iconRow ? "left" : metricAlign;
    const tableMinW = narrow && showNamesEffective ? 300 : 0;
    const iconActEff = tightMetrics || iconRow ? { ...iconAct, padding: "2px" } : iconAct;
    const actionBtnGap = tightMetrics ? 1 : iconRow ? 3 : narrow ? 4 : 6;
    const tableLayoutWidth = "100%";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: wrapRef, style: { width: "100%", minWidth: 0, overflowX: tableMinW > 0 ? "auto" : void 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "table",
      {
        style: {
          width: tableLayoutWidth,
          maxWidth: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          minWidth: tableMinW > 0 ? tableMinW : void 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: colWidths.map((w, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: w != null ? { width: w } : void 0 }, idx)) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "th",
              {
                style: {
                  ...thRow,
                  textAlign: iconRow ? "center" : "left",
                  ...iconRow ? { width: colWidths[0] ?? void 0 } : {}
                },
                title: !showNamesEffective ? de ? "Name (ausgeblendet)" : "Name (hidden)" : void 0,
                children: headers[0] || "\xA0"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: iconRow ? "center" : "center" }, children: headers[1] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: metricAlign, fontVariantNumeric: "tabular-nums" }, children: headers[2] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: memAlign, fontVariantNumeric: "tabular-nums" }, children: headers[3] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "th",
              {
                style: {
                  ...thRow,
                  textAlign: iconRow ? "left" : tightMetrics ? "left" : "right",
                  ...iconActBox ?? {}
                },
                children: headers[4]
              }
            )
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: list.flatMap((c, i) => {
            const name = containerName(c);
            const st = c.State ?? "\u2014";
            const imgRef = (c.Image ?? "").split(":")[0]?.split("@")[0] ?? "";
            const running = isDockerRunning(c);
            const cid = dockerContainerId(c);
            const isBusy = cid !== "" && busyId === cid;
            const isPendingHere = pending != null && cid !== "" && pending.id === cid;
            const rowPending = isPendingHere ? pending : null;
            const canStart = !running && showBtnStart;
            const canStop = running && showBtnStop;
            const canRestart = running && showBtnRestart;
            const anyBtn = canStart || canStop || canRestart;
            const showControls = Boolean(cid && (anyBtn || rowPending));
            const s = c.sdStats;
            const cpuPct = s?.cpuPct ?? null;
            const ramPct = ramPercentForBar(s);
            const memStr = fmtMemoryCompact(s, running);
            const tipParts = [name, st, (c.Status ?? "").trim(), imgRef];
            const tip = tipParts.filter(Boolean).join("\n");
            const zebra = i % 2 === 0 ? "color-mix(in srgb, var(--text) 5%, var(--background))" : "color-mix(in srgb, var(--text) 2%, var(--background))";
            const avatar = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContainerAvatar, { image: c.Image ?? "", name, labels: c.Labels, useDashboardIcons });
            const dragRowProps = reorderEnabled && cid ? {
              draggable: true,
              onDragStart: (e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain", cid);
                e.dataTransfer.effectAllowed = "move";
              },
              onDragOver: (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
              },
              onDrop: (e) => {
                e.preventDefault();
                e.stopPropagation();
                const d = e.dataTransfer.getData("text/plain");
                if (d && d !== cid && onReorderRows) onReorderRows(d, cid);
              }
            } : {};
            const mainRow = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: zebra }, title: tip, ...dragRowProps, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { ...tdRow, minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: showNamesEffective ? 8 : 4,
                    minWidth: 0,
                    justifyContent: showNamesEffective ? void 0 : "center"
                  },
                  children: [
                    reorderEnabled && cid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "span",
                      {
                        style: {
                          cursor: "grab",
                          flexShrink: 0,
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          lineHeight: 0,
                          paddingRight: 2
                        },
                        title: de ? "Zeile ziehen zum Umsortieren" : "Drag row to reorder",
                        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 14, strokeWidth: 2.2 })
                      }
                    ) : null,
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: !showNamesEffective ? name : void 0, style: { flexShrink: 0 }, children: avatar }),
                    showNamesEffective ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "span",
                      {
                        style: {
                          fontWeight: 600,
                          color: "var(--text)",
                          flex: "1 1 auto",
                          minWidth: 0,
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          lineHeight: 1.25
                        },
                        children: name
                      }
                    ) : null
                  ]
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "td",
                {
                  style: {
                    ...tdRow,
                    textAlign: iconRow ? "left" : "center",
                    minWidth: iconRow ? 0 : tightMetrics ? 42 : narrow ? 52 : 44
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: stateBadgeStyle(st, narrow, tightMetrics, iconRow), title: stateBadgeLabel(st, locale), children: stateBadgeLabel(st, locale) })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "td",
                {
                  style: {
                    ...tdRow,
                    textAlign: metricAlign,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: showStatCpu ? heatColorForPct(running ? cpuPct : null) : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    paddingLeft: iconRow ? 0 : void 0,
                    paddingRight: iconRow ? 0 : showNamesEffective ? 4 : void 0
                  },
                  children: showStatCpu ? fmtCpuCompact(cpuPct, running) : "\u2014"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "td",
                {
                  title: showStatRam ? memStr : void 0,
                  style: {
                    ...tdRow,
                    textAlign: memAlign,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: showStatRam ? heatColorForPct(running ? ramPct : null) : "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: iconRow && narrow ? "hidden" : iconRow ? void 0 : "hidden",
                    textOverflow: iconRow && narrow ? "ellipsis" : iconRow ? void 0 : "ellipsis",
                    paddingLeft: iconRow ? 0 : showNamesEffective ? 2 : void 0,
                    paddingRight: iconRow ? 0 : void 0
                  },
                  children: showStatRam ? memStr : "\u2014"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "td",
                {
                  style: {
                    ...tdRow,
                    textAlign: iconRow ? "left" : tightMetrics ? "left" : "right",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    ...iconActBox ?? {}
                  },
                  children: !rowPending && showControls && anyBtn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "span",
                    {
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: iconRow ? "flex-start" : tightMetrics ? "flex-start" : "flex-end",
                        gap: actionBtnGap
                      },
                      children: [
                        canStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: iconActEff,
                            title: de ? "Container stoppen" : "Stop container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "stop");
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconStop, { disabled: isBusy || pending != null })
                          }
                        ) : null,
                        canStart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: iconActEff,
                            title: de ? "Container starten" : "Start container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "start");
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { disabled: isBusy || pending != null })
                          }
                        ) : null,
                        canRestart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: iconActEff,
                            title: de ? "Container neu starten" : "Restart container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "restart");
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconRestart, { disabled: isBusy || pending != null })
                          }
                        ) : null,
                        isBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "var(--text-muted)" }, children: "\u2026" }) : null
                      ]
                    }
                  ) : null
                }
              )
            ] }, cid ?? `${name}-${i}`);
            if (showControls && rowPending) {
              const confirmRow = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { style: { background: zebra }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "td",
                {
                  colSpan: 5,
                  style: { padding: "0 8px 10px", borderBottom: "1px solid color-mix(in srgb, var(--border) 85%, transparent)" },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        fontSize: "clamp(9px, 2.3cqmin, 11px)",
                        lineHeight: 1.4,
                        color: "var(--text-muted)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        padding: "6px 8px"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 6px", color: "var(--text)" }, children: rowPending.step === 1 ? de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                          " wirklich ",
                          actionVerb(rowPending.action),
                          "?",
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                          "Really ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionVerbEn(rowPending.action) }),
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                          "?",
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                        ] }) : de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                          "Zweite Best\xE4tigung: ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNoun(rowPending.action) }),
                          " f\xFCr ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                          ".",
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                          "Second confirmation: ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNounEn(rowPending.action) }),
                          " for ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                          ".",
                          " ",
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                        ] }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btnMuted, onClick: cancelPending, disabled: isBusy, children: de ? "Abbrechen" : "Cancel" }),
                          rowPending.step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: goSecondStep, disabled: isBusy, children: de ? "Weiter" : "Next" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: () => void executeAction(), disabled: isBusy, children: de ? "Ausf\xFChren" : "Run" })
                        ] })
                      ]
                    }
                  )
                }
              ) }, `${cid ?? name}-confirm`);
              return [mainRow, confirmRow];
            }
            return [mainRow];
          }) })
        ]
      }
    ) });
  }
  function Widget({ config, instanceId }) {
    const [list, setList] = (0, import_react3.useState)([]);
    const [error, setError] = (0, import_react3.useState)(null);
    const [loading, setLoading] = (0, import_react3.useState)(true);
    const [pending, setPending] = (0, import_react3.useState)(null);
    const pendingRef = (0, import_react3.useRef)(null);
    pendingRef.current = pending;
    const [busyId, setBusyId] = (0, import_react3.useState)(null);
    const [actionError, setActionError] = (0, import_react3.useState)(null);
    const [lastFetchOk, setLastFetchOk] = (0, import_react3.useState)(null);
    const latestFetch = (0, import_react3.useRef)(0);
    const showAll = cfgBool(config.showStopped, false);
    const r = config;
    const compactTableView = cfgBool(r.homarrTable, true);
    const useDashboardIcons = cfgBool(r.useDashboardIcons, true);
    const showContainerNames = cfgBool(r.showContainerNames, false);
    const actionsOn = cfgBool(r.allowActions, true);
    const statsOn = cfgBool(r.showStats, true);
    const showBtnStart = actionsOn && cfgBool(r.showBtnStart, true);
    const showBtnStop = actionsOn && cfgBool(r.showBtnStop, true);
    const showBtnRestart = actionsOn && cfgBool(r.showBtnRestart, true);
    const showStatCpu = statsOn && cfgBool(r.showStatCpu, true);
    const showStatRam = statsOn && cfgBool(r.showStatRam, true);
    const showStatBars = statsOn && cfgBool(r.showStatBars, true);
    const fetchStats = showStatCpu || showStatRam;
    const refresh = (Number(config.refreshInterval) || 15) * 1e3;
    const maxRows = Math.min(200, Math.max(5, Number(config.maxRows) || 80));
    const listSort = parseListSort(r.listSort);
    const customOrder = (0, import_react3.useMemo)(() => normalizeIdOrder(r.customContainerOrder), [r.customContainerOrder]);
    const customOrderKey = customOrder.join("|");
    const displayList = (0, import_react3.useMemo)(
      () => buildOrderedDockerList(list, listSort, customOrder),
      [list, listSort, customOrderKey]
    );
    const locale = useDashboardStore((s) => s.locale);
    const editMode = useDashboardStore((s) => s.editMode);
    const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig);
    const de = locale !== "en";
    const onReorderRows = (0, import_react3.useCallback)(
      (dragId, dropId) => {
        if (!dragId || !dropId || dragId === dropId) return;
        const ids = displayList.map((c) => dockerContainerId(c)).filter(Boolean);
        const from = ids.indexOf(dragId);
        const to = ids.indexOf(dropId);
        if (from < 0 || to < 0) return;
        const next = ids.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        updatePluginConfig(instanceId, { customContainerOrder: next, listSort: "custom" });
      },
      [displayList, instanceId, updatePluginConfig]
    );
    const fetchBusyRef = (0, import_react3.useRef)(false);
    const fetch_ = (0, import_react3.useCallback)(async () => {
      if (fetchBusyRef.current) return;
      fetchBusyRef.current = true;
      const id = ++latestFetch.current;
      const q = showAll ? "all=1" : "all=0";
      const path = `/containers?${q}${fetchStats ? "&stats=1" : ""}`;
      try {
        const data = await pluginApiJson("docker", path, { method: "GET", cache: "no-store" });
        if (!Array.isArray(data)) throw new Error("Unerwartetes Antwortformat");
        if (latestFetch.current !== id) return;
        const sorted = buildOrderedDockerList(data, listSort, customOrder);
        setList(sorted.slice(0, maxRows));
        setError(null);
        setLastFetchOk(Date.now());
      } catch (e) {
        if (latestFetch.current === id) {
          reportPluginCatch("docker", e, "fetch");
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        fetchBusyRef.current = false;
        if (latestFetch.current === id) setLoading(false);
      }
    }, [showAll, maxRows, fetchStats, listSort, customOrderKey]);
    (0, import_react3.useEffect)(() => {
      fetch_();
      const timer = setInterval(fetch_, refresh);
      return () => {
        clearInterval(timer);
        latestFetch.current++;
      };
    }, [fetch_, refresh]);
    const goSecondStep = (0, import_react3.useCallback)(() => {
      setPending((cur) => cur && cur.step === 1 ? { ...cur, step: 2 } : cur);
    }, []);
    const executeAction = (0, import_react3.useCallback)(async () => {
      const p = pendingRef.current;
      if (!p || p.step !== 2 || !p.id) return;
      setBusyId(p.id);
      setActionError(null);
      try {
        await pluginApiJson("docker", "/containers", {
          method: "POST",
          body: JSON.stringify({ id: p.id, action: p.action }),
          cache: "no-store"
        });
        setPending(null);
        await fetch_();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyId(null);
      }
    }, [fetch_]);
    const cancelPending = (0, import_react3.useCallback)(() => {
      setPending(null);
      setActionError(null);
    }, []);
    const beginAction = (0, import_react3.useCallback)((id, name, action) => {
      setActionError(null);
      setPending({ id, name, action, step: 1 });
    }, []);
    const shell = {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      padding: compactTableView ? 0 : "8px 12px 12px",
      containerType: "size",
      minWidth: 0,
      width: "100%",
      overflow: "hidden"
    };
    const scrollBody = {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: compactTableView ? "auto" : "hidden",
      padding: compactTableView ? "6px 10px 4px" : 0
    };
    const btn = {
      fontSize: "clamp(9px, 2.2cqmin, 10px)",
      padding: "2px 7px",
      borderRadius: "4px",
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      cursor: "pointer",
      lineHeight: 1.25,
      fontWeight: 600
    };
    const btnMuted = {
      ...btn,
      color: "var(--text-muted)",
      fontWeight: 500
    };
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...scrollBody, padding: compactTableView ? "10px 12px" : void 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [70, 55, 80, 50].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "10px", width: `${w}%`, borderRadius: "3px" } }, i)) }) }) });
    }
    if (error) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...shell, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            ...scrollBody,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "12px"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "22px" }, children: "\u26A0\uFE0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "#ef4444", marginTop: "8px", wordBreak: "break-word" }, children: error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: /EACCES|permission denied/i.test(error) ? de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "Typisch unter Unraid: Prozess im Container darf den Socket nicht \xF6ffnen \u2014 Template nutzt",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "--group-add=281" }),
              " (Docker-Gruppe). GID pr\xFCfen:",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "stat -c %g /var/run/docker.sock" }),
              ". Au\xDFerdem: Volume",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
              " mounten. Neuere Images laufen als root."
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "Common on Unraid: the container user cannot open the socket \u2014 add",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "--group-add=281" }),
              " (Docker group). Check GID:",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "stat -c %g /var/run/docker.sock" }),
              ". Also mount",
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
              ". Many images run as root."
            ] }) : de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "SelfDashboard braucht Zugriff auf ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
              " (Volume-Mount). Nur dieselbe Seite wie das Dashboard (kein externes CORS)."
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "SelfDashboard needs access to ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
              " (volume mount). Same origin as the dashboard (no external CORS)."
            ] }) })
          ]
        }
      ) });
    }
    const fs = "clamp(9px, 2.6cqmin, 11px)";
    const thStyle = {
      textAlign: "left",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      padding: "6px 8px",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap"
    };
    const tdCompact = {
      padding: "5px 8px",
      verticalAlign: "middle",
      borderBottom: "1px solid color-mix(in srgb, var(--border) 85%, transparent)",
      fontSize: "11px",
      lineHeight: 1.3
    };
    const iconAct = {
      border: "none",
      background: "transparent",
      padding: "4px",
      cursor: "pointer",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: shell, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: scrollBody, children: [
        !compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: de ? `Docker \xB7 ${list.length}${showAll ? "" : " laufend"}` : `Docker \xB7 ${list.length}${showAll ? "" : " running"}` }) : null,
        actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "#ef4444", margin: "0 0 8px", lineHeight: 1.4 }, children: actionError }) : null,
        list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: fs, color: "var(--text-muted)", margin: 0 }, children: de ? "Keine Container in der Liste." : "No containers in the list." }) : compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          DockerTableCompact,
          {
            list: displayList,
            locale,
            busyId,
            pending,
            useDashboardIcons,
            showContainerNames,
            showStatCpu,
            showStatRam,
            showBtnStart,
            showBtnStop,
            showBtnRestart,
            btn,
            btnMuted,
            thStyle,
            tdCompact,
            iconAct,
            beginAction,
            goSecondStep,
            executeAction,
            cancelPending,
            reorderEnabled: editMode && displayList.length > 1,
            onReorderRows
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0, width: "100%", minWidth: 0 }, children: displayList.map((c, i) => {
          const name = containerName(c);
          const st = c.State ?? "\u2014";
          const status = (c.Status ?? "").trim() || st;
          const img = (c.Image ?? "").split(":")[0]?.split("@")[0] ?? "";
          const running = isDockerRunning(c);
          const tipParts = [name, st, status, img];
          const sl = statsLine(c, running, showStatCpu, showStatRam);
          if (sl) tipParts.push(sl);
          const tip = tipParts.filter(Boolean).join("\n");
          const cid = dockerContainerId(c);
          const isBusy = cid !== "" && busyId === cid;
          const isPendingHere = pending != null && cid !== "" && pending.id === cid;
          const rowPending = isPendingHere ? pending : null;
          const canStart = !running && showBtnStart;
          const canStop = running && showBtnStop;
          const canRestart = running && showBtnRestart;
          const anyBtn = canStart || canStop || canRestart;
          const showControls = Boolean(cid !== "" && (anyBtn || rowPending));
          const showStatsInRow = running && fetchStats && (showStatCpu || showStatRam);
          const s = c.sdStats;
          const cpuFill = running && showStatCpu ? barFillPct(s?.cpuPct ?? null) : 0;
          const ramFill = running && showStatRam ? barFillPct(ramPercentForBar(s)) : 0;
          const textStatsInline = showStatsInRow && !showStatBars ? statsLine(c, running, showStatCpu, showStatRam) : null;
          const cpuBarTip = showStatCpu ? `CPU ${fmtCpuPct(s?.cpuPct ?? null)}` : "";
          const ramBarTip = showStatRam ? statsLine(c, running, false, true) ?? "RAM" : "";
          const reorderRow = editMode && displayList.length > 1 && !!cid;
          const dragClassicProps = reorderRow ? {
            draggable: true,
            onDragStart: (e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/plain", cid);
              e.dataTransfer.effectAllowed = "move";
            },
            onDragOver: (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
            },
            onDrop: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const d = e.dataTransfer.getData("text/plain");
              if (d && d !== cid) onReorderRows(d, cid);
            }
          } : {};
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "li",
            {
              ...dragClassicProps,
              title: tip,
              style: {
                listStyle: "none",
                margin: 0,
                padding: i < displayList.length - 1 ? "0 0 6px 0" : 0,
                borderBottom: i < displayList.length - 1 ? "1px solid var(--border)" : "none",
                minWidth: 0
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "4px 6px",
                      width: "100%",
                      minWidth: 0,
                      fontSize: fs,
                      lineHeight: 1.35,
                      flexWrap: "nowrap"
                    },
                    children: [
                      reorderRow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            cursor: "grab",
                            flexShrink: 0,
                            color: "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            lineHeight: 0
                          },
                          title: de ? "Ziehen zum Umsortieren" : "Drag to reorder",
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 14, strokeWidth: 2.2 })
                        }
                      ) : null,
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: { color: running ? "var(--accent)" : "var(--text-muted)", flexShrink: 0, width: "0.65em", textAlign: "center", fontSize: "0.78em" },
                          "aria-hidden": true,
                          children: running ? "\u25CF" : "\u25CB"
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            fontWeight: 700,
                            color: "var(--text)",
                            flex: "0 1 32%",
                            minWidth: 0,
                            maxWidth: "40%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          },
                          children: name
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0 }, children: ":" }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            color: "var(--text-muted)",
                            flex: "1 1 0%",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          },
                          children: status
                        }
                      ),
                      showStatsInRow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0 }, children: ":" }),
                        showStatBars ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
                          showStatCpu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { label: "C", fillPct: cpuFill, tooltip: cpuBarTip, barColor: "var(--accent)" }) : null,
                          showStatRam ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { label: "R", fillPct: ramFill, tooltip: ramBarTip, barColor: "#5b9bd5" }) : null
                        ] }) : textStatsInline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              flex: "0 1 36%",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "var(--text-muted)",
                              fontSize: "clamp(8px, 2.2cqmin, 10px)"
                            },
                            title: textStatsInline,
                            children: textStatsInline
                          }
                        ) : null
                      ] }) : null,
                      !rowPending && showControls && anyBtn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: "auto" }, children: [
                        canStart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container starten" : "Start container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "start");
                            },
                            children: "Start"
                          }
                        ) : null,
                        canStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container stoppen" : "Stop container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "stop");
                            },
                            children: de ? "Stopp" : "Stop"
                          }
                        ) : null,
                        canRestart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container neu starten" : "Restart container",
                            disabled: isBusy || pending != null,
                            onClick: () => {
                              if (cid == null || cid === "") return;
                              beginAction(cid, name, "restart");
                            },
                            children: de ? "Neustart" : "Restart"
                          }
                        ) : null,
                        isBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "8px", color: "var(--text-muted)", whiteSpace: "nowrap" }, children: "\u2026" }) : null
                      ] }) : null
                    ]
                  }
                ),
                showControls && rowPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      marginTop: 6,
                      paddingLeft: "calc(0.65em + 6px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      minWidth: 0
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                      "div",
                      {
                        style: {
                          fontSize: "clamp(9px, 2.3cqmin, 11px)",
                          lineHeight: 1.4,
                          color: "var(--text-muted)",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          padding: "6px 8px"
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 6px", color: "var(--text)" }, children: rowPending.step === 1 ? de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            " wirklich ",
                            actionVerb(rowPending.action),
                            "? ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Really ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionVerbEn(rowPending.action) }),
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            "?",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                          ] }) : de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Zweite Best\xE4tigung: ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNoun(rowPending.action) }),
                            " f\xFCr ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            ".",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Second confirmation: ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNounEn(rowPending.action) }),
                            " for ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            ".",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                          ] }) }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btnMuted, onClick: cancelPending, disabled: isBusy, children: de ? "Abbrechen" : "Cancel" }),
                            rowPending.step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: goSecondStep, disabled: isBusy, children: de ? "Weiter" : "Next" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: () => void executeAction(), disabled: isBusy, children: de ? "Ausf\xFChren" : "Run" })
                          ] })
                        ]
                      }
                    )
                  }
                ) : null
              ]
            },
            cid ?? `${name}-${i}`
          );
        }) })
      ] }),
      compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "8px 12px",
            borderTop: "1px solid var(--border)",
            background: "color-mix(in srgb, var(--surface) 90%, var(--background))",
            fontSize: "11px",
            color: "var(--text-muted)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": true, style: { fontSize: "15px", lineHeight: 1 }, children: "\u{1F433}" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                de ? "Gesamt" : "Total",
                " ",
                list.length,
                " ",
                list.length === 1 ? de ? "Container" : "container" : de ? "Container" : "containers"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { whiteSpace: "nowrap", flexShrink: 0 }, children: fmtUpdatedAgo(lastFetchOk, locale) })
          ]
        }
      ) : null
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
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
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
    const sub = (key, def = false) => cfgBool(config[key], def);
    const r = config;
    const actionsOn = cfgBool(r.allowActions, true);
    const statsOn = cfgBool(r.showStats, true);
    const compactTableOn = cfgBool(r.homarrTable, true);
    const dashboardIconsOn = cfgBool(r.useDashboardIcons, true);
    const btnStartOn = actionsOn && cfgBool(r.showBtnStart, true);
    const btnStopOn = actionsOn && cfgBool(r.showBtnStop, true);
    const btnRestartOn = actionsOn && cfgBool(r.showBtnRestart, true);
    const statCpuOn = statsOn && cfgBool(r.showStatCpu, true);
    const statRamOn = statsOn && cfgBool(r.showStatRam, true);
    const statBarsOn = statsOn && cfgBool(r.showStatBars, true);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.45, margin: 0 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Daten kommen von ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/api/docker-containers" }),
        " (Server liest",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
        "). Beim Docker-/Unraid-Template den Socket als Volume einbinden."
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Data comes from ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/api/docker-containers" }),
        " (server reads",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/var/run/docker.sock" }),
        "). Mount the socket in your Docker/Unraid template."
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ToggleRow,
        {
          label: de ? "Kompakte Tabelle (Name \xB7 Status \xB7 CPU \xB7 Speicher \xB7 Aktionen)" : "Compact table (name \xB7 state \xB7 CPU \xB7 memory \xB7 actions)",
          on: compactTableOn,
          onToggle: () => onChange("homarrTable", !compactTableOn)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: compactTableOn ? 1 : 0.45, pointerEvents: compactTableOn ? "auto" : "none" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ToggleRow,
          {
            label: de ? "Namen in der Tabelle anzeigen (aus: nur Icon \u2014 ab ca. 520 px Kachelbreite trotzdem automatisch)" : "Show names in table (off: icon only \u2014 auto when the tile is ~520px+ wide)",
            on: sub("showContainerNames", false),
            onToggle: () => onChange("showContainerNames", !sub("showContainerNames", false))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ToggleRow,
          {
            label: de ? "Icons: Container-Labels + CDN (walkxcode/dashboard-icons)" : "Icons: container labels + CDN (walkxcode/dashboard-icons)",
            on: dashboardIconsOn,
            onToggle: () => onChange("useDashboardIcons", !dashboardIconsOn)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.4 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Unraid-Community-Templates setzen oft ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "9px" }, children: "net.unraid.docker.icon" }),
          ". Ohne CDN: nur Label-URL, Emoji oder Buchstabe-Kachel."
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          "Unraid community templates often set ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "9px" }, children: "net.unraid.docker.icon" }),
          ". Without CDN: label URL, emoji, or letter tile only."
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSectionTitle, { children: de ? "Aktionen" : "Actions" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Buttons (Start / Stopp / Neustart)" : "Buttons (start / stop / restart)", on: actionsOn, onToggle: () => onChange("allowActions", !actionsOn) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: actionsOn ? 1 : 0.45, pointerEvents: actionsOn ? "auto" : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Start" : "Button: start",
                on: btnStartOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnStart", true);
                    return;
                  }
                  onChange("showBtnStart", !btnStartOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Stopp" : "Button: stop",
                on: btnStopOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnStop", true);
                    return;
                  }
                  onChange("showBtnStop", !btnStopOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Neustart" : "Button: restart",
                on: btnRestartOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnRestart", true);
                    return;
                  }
                  onChange("showBtnRestart", !btnRestartOn);
                }
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSectionTitle, { children: de ? "Auslastung" : "Usage" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Docker-Stats (CPU / RAM)" : "Docker stats (CPU / RAM)", on: statsOn, onToggle: () => onChange("showStats", !statsOn) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: statsOn ? 1 : 0.45, pointerEvents: statsOn ? "auto" : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "CPU anzeigen" : "Show CPU",
                on: statCpuOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatCpu", true);
                    return;
                  }
                  onChange("showStatCpu", !statCpuOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "RAM anzeigen" : "Show RAM",
                on: statRamOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatRam", true);
                    return;
                  }
                  onChange("showStatRam", !statRamOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "CPU/RAM als Balken (wie Unraid, sonst Text in der Zeile)" : "CPU/RAM as bars (Unraid-style; otherwise inline text)",
                on: statBarsOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatBars", true);
                    return;
                  }
                  onChange("showStatBars", !statBarsOn);
                }
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Auch gestoppte Container" : "Include stopped containers", on: sub("showStopped"), onToggle: () => onChange("showStopped", !sub("showStopped")) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: config.refreshInterval ?? 15, onChange: (e) => onChange("refreshInterval", Number(e.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 10, children: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 15, children: "15" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 30, children: "30" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 60, children: "60" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Max. Zeilen" : "Max rows" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 5,
            max: 200,
            step: 5,
            value: Number.isFinite(Number(config.maxRows)) ? Number(config.maxRows) : 80,
            onChange: (e) => onChange("maxRows", e.target.value === "" ? 80 : Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Container-Reihenfolge" : "Container order" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            style: { ...inp, cursor: "pointer" },
            value: parseListSort(r.listSort),
            onChange: (e) => onChange("listSort", e.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "default", children: de ? "Standard (laufend zuerst, dann Name)" : "Default (running first, then name)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "name", children: de ? "Nur Name (A\u2013Z)" : "Name only (A\u2013Z)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cpu_desc", children: de ? "CPU (h\xF6chste zuerst)" : "CPU (highest first)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cpu_asc", children: de ? "CPU (niedrigste zuerst)" : "CPU (lowest first)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "mem_desc", children: de ? "RAM (h\xF6chste zuerst)" : "RAM (highest first)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "mem_asc", children: de ? "RAM (niedrigste zuerst)" : "RAM (lowest first)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "custom", children: de ? "Manuell (im Bearbeitungsmodus Zeilen ziehen)" : "Manual (drag rows in edit mode)" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.4 }, children: de ? "CPU/RAM nutzen die angezeigten Messwerte, wenn vorhanden; sonst wie \u201EStandard\u201C. Zum manuellen Sortieren Dashboard-Bearbeitung aktivieren, \u22EE\u22EE-Griff ziehen \u2014 die Auswahl springt auf \u201EManuell\u201C." : "CPU/RAM use live values when available; otherwise tie-break like \u201CDefault\u201D. For manual order, enable dashboard edit mode and drag the \u22EE\u22EE handle \u2014 the dropdown switches to \u201CManual\u201D." })
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/docker.tsx
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
lucide-react/dist/esm/icons/grip-vertical.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
