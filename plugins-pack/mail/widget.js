if(!globalThis.SelfDashboard?.React)throw new Error('SelfDashboard bridge missing — reload page');
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
      function jsx7(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx7;
      exports.jsxs = jsx7;
      exports.Fragment = R.Fragment;
    }
  });

  // plugins/mail/index.tsx
  var import_react8 = __toESM(require_react());

  // src/components/plugins/WidgetErrorBoundary.tsx
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

  // src/components/plugins/WidgetErrorBoundary.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var WidgetErrorBoundary = class extends import_react.Component {
    constructor() {
      super(...arguments);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error, info) {
      reportPluginCatch(this.props.pluginId, error, "render");
      if (info.componentStack?.trim()) {
        reportPluginCatch(
          this.props.pluginId,
          new Error(info.componentStack.trim().slice(0, 500)),
          "react-stack"
        );
      }
    }
    render() {
      if (this.state.error) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "12px",
              lineHeight: 1.4
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 6px", color: "#f87171", fontWeight: 600 }, children: "Plugin-Fehler" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, wordBreak: "break-word" }, children: this.state.error.message }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "8px 0 0", fontSize: "10px", opacity: 0.85 }, children: "Details in Einstellungen \u2192 Protokoll" })
            ] })
          }
        );
      }
      return this.props.children;
    }
  };

  // src/lib/pluginRegistry.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  function wrapWidgetWithLogging(meta2, Widget) {
    function SafeWidget(props) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(WidgetErrorBoundary, { pluginId: meta2.id, instanceId: props.instanceId, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Widget, { ...props }) });
    }
    SafeWidget.displayName = `Widget(${meta2.id})`;
    return SafeWidget;
  }
  var PluginRegistry = class {
    constructor() {
      this.plugins = /* @__PURE__ */ new Map();
    }
    register(meta2, component2, opts) {
      if (this.plugins.has(meta2.id) && !opts?.replace) {
        console.warn(`[SelfDashboard] Plugin "${meta2.id}" is already registered. Skipping.`);
        return;
      }
      const wrapped = {
        ...component2,
        Widget: wrapWidgetWithLogging(meta2, component2.Widget)
      };
      this.plugins.set(meta2.id, { meta: meta2, component: wrapped });
      console.info(
        `[SelfDashboard] Plugin registered: ${meta2.name} v${meta2.version} (id=${meta2.id}, errors \u2192 Protokoll)`
      );
    }
    get(id) {
      return this.plugins.get(id);
    }
    getAll() {
      return Array.from(this.plugins.values());
    }
    getByCategory(category) {
      return this.getAll().filter((p) => p.meta.category === category);
    }
    isRegistered(id) {
      return this.plugins.has(id);
    }
    unregister(id) {
      this.plugins.delete(id);
    }
  };
  var pluginRegistry = new PluginRegistry();
  var registerPlugin = (meta2, component2, opts) => {
    pluginRegistry.register(meta2, component2, opts);
  };

  // src/lib/pluginNavbarRegistry.ts
  var slots = /* @__PURE__ */ new Map();
  var listeners = /* @__PURE__ */ new Set();
  var version = 0;
  function notifyNavbarSlots() {
    version += 1;
    for (const fn of listeners) fn();
  }
  function registerNavbarSlot(id, component2) {
    slots.set(id, component2);
    notifyNavbarSlots();
  }

  // src/lib/pluginAppSettingsRegistry.ts
  var panels = /* @__PURE__ */ new Map();
  var listeners2 = /* @__PURE__ */ new Set();
  var version2 = 0;
  function notifyAppSettings() {
    version2 += 1;
    for (const fn of listeners2) fn();
  }
  function registerAppSettingsPanel(id, labels, component2) {
    panels.set(id, { label: labels, component: component2 });
    notifyAppSettings();
  }

  // src/components/layout/NavbarMail.tsx
  var import_react5 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var import_react3 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/shared/src/utils.js
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && array.indexOf(className) === index;
  }).join(" ");

  // node_modules/lucide-react/dist/esm/Icon.js
  var import_react2 = __toESM(require_react());

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
  var Icon = (0, import_react2.forwardRef)(
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
      return (0, import_react2.createElement)(
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
          ...iconNode.map(([tag, attrs]) => (0, import_react2.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      );
    }
  );

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component2 = (0, import_react3.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react3.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
        ...props
      })
    );
    Component2.displayName = `${iconName}`;
    return Component2;
  };

  // node_modules/lucide-react/dist/esm/icons/mail.js
  var Mail = createLucideIcon("Mail", [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/plus.js
  var Plus = createLucideIcon("Plus", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/refresh-cw.js
  var RefreshCw = createLucideIcon("RefreshCw", [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
    ["path", { d: "M8 16H3v5", key: "1cv678" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/trash-2.js
  var Trash2 = createLucideIcon("Trash2", [
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
  ]);

  // src/lib/mail/events.ts
  var MAIL_CONFIG_CHANGED = "selfdashboard:mail-config-changed";
  function dispatchMailConfigChanged(detail) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(MAIL_CONFIG_CHANGED, { detail }));
    }
  }

  // src/lib/mail/errors.ts
  function formatMailError(message) {
    const m = message.toLowerCase();
    if (m.includes("unsupported state") || m.includes("unable to authenticate data") || m.includes("auth tag") || m.includes("encrypted payload")) {
      return "Passwort nicht lesbar \u2014 nach Docker-Neustart in Einstellungen \u2192 E-Mail Passwort neu eintragen und \u201ESpeichern\u201C.";
    }
    if (m.includes("enotfound") && m.includes(":5000")) {
      return "IMAP-Host darf keine Webmail-URL sein \u2014 nur IP/Hostname (z. B. 192.168.1.15), Port 993.";
    }
    if (m.includes("wrong version number")) {
      return "SSL/TLS passt nicht \u2014 Port 993 mit \u201ESSL/TLS\u201C an, oder Zertifikat-Pr\xFCfung aus.";
    }
    if (m.includes("unable to verify the first certificate")) {
      return "TLS-Zertifikat abgelehnt \u2014 \u201ETLS-Zertifikat pr\xFCfen\u201C ausschalten (lokale Synology).";
    }
    if (m.includes("greeting") && m.includes("tls")) {
      return "IMAP antwortet nicht mit TLS \u2014 \u201ESSL/TLS\u201C aktivieren (Port 993).";
    }
    return message;
  }
  function isMailConfigError(message) {
    if (!message) return false;
    const m = message.toLowerCase();
    return m.includes("passwort nicht lesbar") || m.includes("passwort speichern") || m.includes("kein abrufbares konto") || m.includes("unsupported state") || m.includes("unable to authenticate data");
  }

  // src/lib/mail/types.ts
  var MAIL_POLL_INTERVAL_MIN = 1;
  var MAIL_POLL_INTERVAL_MAX = 900;
  var MAIL_POLL_INTERVAL_DEFAULT = 120;
  var MAIL_UNREAD_MAX_AGE_MIN = 0;
  var MAIL_UNREAD_MAX_AGE_MAX_DAYS = 3650;
  var MAIL_UNREAD_MAX_AGE_MAX_YEARS = 10;
  var MAIL_UNREAD_MAX_AGE_DEFAULT = 30;
  var DAYS_PER_YEAR = 365;
  function clampPollIntervalSeconds(seconds) {
    if (!Number.isFinite(seconds)) return MAIL_POLL_INTERVAL_DEFAULT;
    return Math.max(
      MAIL_POLL_INTERVAL_MIN,
      Math.min(MAIL_POLL_INTERVAL_MAX, Math.round(seconds))
    );
  }
  function clampUnreadMaxAgeDays(days) {
    if (!Number.isFinite(days)) return MAIL_UNREAD_MAX_AGE_DEFAULT;
    const n = Math.round(days);
    if (n <= MAIL_UNREAD_MAX_AGE_MIN) return MAIL_UNREAD_MAX_AGE_MIN;
    return Math.min(MAIL_UNREAD_MAX_AGE_MAX_DAYS, n);
  }
  function unreadMaxAgeDaysToInput(days, unit) {
    if (days <= 0) return 0;
    if (unit === "years") return Math.max(1, Math.round(days / DAYS_PER_YEAR));
    return days;
  }
  function unreadMaxAgeInputToDays(value, unit) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const n = Math.round(value);
    if (unit === "years") return clampUnreadMaxAgeDays(n * DAYS_PER_YEAR);
    return clampUnreadMaxAgeDays(n);
  }
  function formatUnreadMaxAgeSummary(days, de) {
    if (days <= 0) return de ? "aus" : "off";
    if (days >= DAYS_PER_YEAR && days % DAYS_PER_YEAR === 0) {
      const y = days / DAYS_PER_YEAR;
      return de ? `${y} Jahr${y === 1 ? "" : "e"}` : `${y} year${y === 1 ? "" : "s"}`;
    }
    return de ? `${days} Tage` : `${days} days`;
  }
  function formatMailFolderLabel(path) {
    if (path.includes(".")) {
      const parts2 = path.split(".");
      return parts2[parts2.length - 1] || path;
    }
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
  }

  // src/components/layout/useNavbarCompact.ts
  var import_react4 = __toESM(require_react());
  var NAVBAR_COMPACT_MQ = "(max-width: 1023px)";
  var NAVBAR_PHONE_MQ = "(max-width: 639px)";
  function subscribeMq(query, cb) {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }
  function snapshotMq(query) {
    return window.matchMedia(query).matches;
  }
  function useNavbarCompact() {
    const compact = (0, import_react4.useSyncExternalStore)(
      (cb) => subscribeMq(NAVBAR_COMPACT_MQ, cb),
      () => snapshotMq(NAVBAR_COMPACT_MQ),
      () => false
    );
    const phone = (0, import_react4.useSyncExternalStore)(
      (cb) => subscribeMq(NAVBAR_PHONE_MQ, cb),
      () => snapshotMq(NAVBAR_PHONE_MQ),
      () => false
    );
    return { compact, phone };
  }

  // src/lib/mail/clientApi.ts
  var MAIL_PLUGIN_ID = "mail";
  function mailApiUrl(path, query = "") {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `/api/plugins/${MAIL_PLUGIN_ID}${p}${query}`;
  }

  // src/components/layout/NavbarMail.tsx
  var import_jsx_runtime3 = __toESM(require_jsx_runtime());
  var PULSE_MS = 12e3;
  function NavbarMail({ locale }) {
    const { compact, phone } = useNavbarCompact();
    const [data, setData] = (0, import_react5.useState)(null);
    const [pulsing, setPulsing] = (0, import_react5.useState)(false);
    const prevUnread = (0, import_react5.useRef)(null);
    const pulseTimer = (0, import_react5.useRef)(null);
    const triggerPulse = (0, import_react5.useCallback)(() => {
      setPulsing(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_MS);
    }, []);
    const load = (0, import_react5.useCallback)(async (opts) => {
      try {
        const q = opts?.refresh ? "?refresh=1" : "";
        const res = await fetch(mailApiUrl("/status", q), { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        const unread2 = j.unread ?? 0;
        const hadNew = unread2 > 0;
        if (hadNew) {
          const prev = prevUnread.current;
          if (prev === null || unread2 > prev) {
            triggerPulse();
          }
        }
        prevUnread.current = unread2;
        setData({
          ...j,
          unread: unread2,
          enabled: j.navbarEnabled,
          hasNew: hadNew && Boolean(j.navbarEnabled)
        });
      } catch {
      }
    }, [triggerPulse]);
    (0, import_react5.useEffect)(() => {
      void load({ refresh: true });
      const onConfig = (e) => {
        const forceRefresh = e.detail?.forceRefresh;
        void load(forceRefresh ? { refresh: true } : void 0);
      };
      window.addEventListener(MAIL_CONFIG_CHANGED, onConfig);
      return () => {
        window.removeEventListener(MAIL_CONFIG_CHANGED, onConfig);
        if (pulseTimer.current) clearTimeout(pulseTimer.current);
      };
    }, [load]);
    (0, import_react5.useEffect)(() => {
      if (!data?.enabled) return;
      const sec = typeof data.pollIntervalSeconds === "number" && data.pollIntervalSeconds > 0 ? data.pollIntervalSeconds : MAIL_POLL_INTERVAL_DEFAULT;
      const pollMs = clampPollIntervalSeconds(sec) * 1e3;
      const id = window.setInterval(() => void load(), pollMs);
      return () => window.clearInterval(id);
    }, [load, data?.enabled, data?.pollIntervalSeconds]);
    if (!data?.enabled) return null;
    const unread = data.unread ?? 0;
    const hasUnread = unread > 0;
    const hasNew = Boolean(data.hasNew) || hasUnread;
    const lastError = data.lastError ? formatMailError(data.lastError) : void 0;
    const configError = isMailConfigError(lastError);
    const iconSize = phone ? 18 : compact ? 17 : 16;
    const breakdown = (data.accounts ?? []).filter((a) => a.unread > 0);
    const title = locale === "de" ? hasNew ? breakdown.length > 1 ? `${unread} ungelesen (${breakdown.map((a) => `${a.label}: ${a.unread}`).join(", ")})` : `${unread} ungelesene E-Mail${unread === 1 ? "" : "s"}` : lastError ? `E-Mail: ${lastError}` : "E-Mail: keine neuen Nachrichten" : hasNew ? breakdown.length > 1 ? `${unread} unread (${breakdown.map((a) => `${a.label}: ${a.unread}`).join(", ")})` : `${unread} unread email${unread === 1 ? "" : "s"}` : lastError ? `Mail: ${lastError}` : "Mail: no new messages";
    const open = () => {
      const url = data.openUrl?.trim();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };
    const alert = hasUnread || pulsing;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "button",
      {
        type: "button",
        className: [
          "navbar-mail-btn",
          alert ? "navbar-mail-btn--alert" : "",
          pulsing ? "navbar-mail-btn--pulse" : "",
          phone ? "navbar-mail-btn--phone" : "",
          lastError && !hasUnread && !configError ? "navbar-mail-btn--error" : "",
          lastError && !hasUnread && configError ? "navbar-mail-btn--warn" : ""
        ].filter(Boolean).join(" "),
        onClick: open,
        title: data.openUrl ? title : locale === "de" ? `${title} \u2014 Webmail-URL in Einstellungen speichern` : `${title} \u2014 save webmail URL in settings`,
        "aria-label": title,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "navbar-mail-icon-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Mail, { size: iconSize, strokeWidth: hasNew ? 2.25 : 2 }) }),
          hasUnread ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "navbar-mail-badge", "aria-hidden": true, children: unread > 99 ? "99+" : unread }) : lastError && !configError ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "navbar-mail-dot navbar-mail-dot--error" }) : lastError && configError ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "navbar-mail-dot navbar-mail-dot--warn", title: lastError }) : null
        ]
      }
    );
  }

  // src/components/settings/MailSettingsPanel.tsx
  var import_react7 = __toESM(require_react());

  // src/components/settings/MailNavbarToggle.tsx
  var import_react6 = __toESM(require_react());
  var import_jsx_runtime4 = __toESM(require_jsx_runtime());
  function Toggle({ value, onChange, disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        role: "switch",
        "aria-checked": value,
        tabIndex: disabled ? -1 : 0,
        onClick: () => !disabled && onChange(!value),
        onKeyDown: (e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onChange(!value);
          }
        },
        style: {
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          flexShrink: 0,
          cursor: disabled ? "wait" : "pointer",
          opacity: disabled ? 0.6 : 1,
          background: value ? "var(--accent)" : "var(--border)",
          position: "relative",
          transition: "background 0.2s"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: {
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s"
        } })
      }
    );
  }
  async function saveMailNavbarEnabled(enabled) {
    const res = await fetch(mailApiUrl("/settings"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navbarEnabled: enabled })
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
    dispatchMailConfigChanged();
  }
  function MailNavbarToggle({ locale, enabled: enabledProp, onEnabledChange, standalone }) {
    const de = locale === "de";
    const [internalEnabled, setInternalEnabled] = (0, import_react6.useState)(false);
    const [busy, setBusy] = (0, import_react6.useState)(false);
    const [err, setErr] = (0, import_react6.useState)(null);
    const load = (0, import_react6.useCallback)(async () => {
      try {
        const res = await fetch(mailApiUrl("/settings"), { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        setInternalEnabled(Boolean(j.navbarEnabled ?? j.config?.enabled));
      } catch {
      }
    }, []);
    (0, import_react6.useEffect)(() => {
      if (standalone) void load();
    }, [standalone, load]);
    const enabled = standalone ? internalEnabled : Boolean(enabledProp);
    const apply = async (next) => {
      setErr(null);
      if (standalone) {
        setBusy(true);
        setInternalEnabled(next);
        try {
          await saveMailNavbarEnabled(next);
        } catch (e) {
          setInternalEnabled(!next);
          setErr(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
        return;
      }
      if (onEnabledChange) {
        setBusy(true);
        try {
          await onEnabledChange(next);
          dispatchMailConfigChanged();
        } catch (e) {
          setErr(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { fontSize: "13px", fontWeight: 500, color: "var(--text)", margin: 0 }, children: de ? "E-Mail-Symbol in der Navbar" : "Email icon in navbar" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", lineHeight: 1.45 }, children: enabled ? de ? "An \u2014 ungelesene Mails werden abgefragt und als Badge angezeigt." : "On \u2014 polls unread mail and shows a badge." : de ? "Aus \u2014 kein Symbol, keine IMAP-Abfrage im Hintergrund." : "Off \u2014 no icon and no background IMAP polling." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Toggle, { value: enabled, onChange: (v) => void apply(v), disabled: busy })
      ] }),
      err ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { fontSize: "11px", color: "#f87171", margin: 0 }, children: err }) : null
    ] });
  }

  // src/components/settings/MailSettingsPanel.tsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime());
  var inp = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    width: "100%"
  };
  var emptyForm = () => ({
    label: "",
    enabled: true,
    host: "",
    port: 993,
    secure: true,
    username: "",
    password: "",
    mailbox: "*",
    openUrl: "",
    verifyTls: true
  });
  function MailSettingsPanel({
    locale,
    onOpenProtocol
  }) {
    const de = locale === "de";
    const [navbarEnabled, setNavbarEnabled] = (0, import_react7.useState)(false);
    const [pollIntervalSeconds, setPollIntervalSeconds] = (0, import_react7.useState)(MAIL_POLL_INTERVAL_DEFAULT);
    const [pollDraft, setPollDraft] = (0, import_react7.useState)(String(MAIL_POLL_INTERVAL_DEFAULT));
    const [unreadMaxAgeDays, setUnreadMaxAgeDays] = (0, import_react7.useState)(MAIL_UNREAD_MAX_AGE_DEFAULT);
    const [unreadMaxAgeUnit, setUnreadMaxAgeUnit] = (0, import_react7.useState)("days");
    const [unreadMaxAgeDraft, setUnreadMaxAgeDraft] = (0, import_react7.useState)(String(MAIL_UNREAD_MAX_AGE_DEFAULT));
    const [accounts, setAccounts] = (0, import_react7.useState)([]);
    const [selectedId, setSelectedId] = (0, import_react7.useState)(null);
    const [form, setForm] = (0, import_react7.useState)(emptyForm());
    const [hasPassword, setHasPassword] = (0, import_react7.useState)(false);
    const [status, setStatus] = (0, import_react7.useState)(null);
    const [busy, setBusy] = (0, import_react7.useState)(false);
    const [msg, setMsg] = (0, import_react7.useState)(null);
    const [err, setErr] = (0, import_react7.useState)(null);
    const [previewOpen, setPreviewOpen] = (0, import_react7.useState)(false);
    const [previewBusy, setPreviewBusy] = (0, import_react7.useState)(false);
    const [previewErr, setPreviewErr] = (0, import_react7.useState)(null);
    const [previewTotal, setPreviewTotal] = (0, import_react7.useState)(0);
    const [previewMessages, setPreviewMessages] = (0, import_react7.useState)([]);
    const [previewTruncated, setPreviewTruncated] = (0, import_react7.useState)(false);
    const [previewSkippedStale, setPreviewSkippedStale] = (0, import_react7.useState)(0);
    const [previewSkippedDuplicate, setPreviewSkippedDuplicate] = (0, import_react7.useState)(0);
    const [previewMaxAgeDays, setPreviewMaxAgeDays] = (0, import_react7.useState)(30);
    const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];
    const applyAccountToForm = (a) => {
      setForm({
        label: a.label,
        enabled: a.enabled,
        host: a.host,
        port: a.port,
        secure: a.secure,
        username: a.username,
        password: "",
        mailbox: a.mailbox || "*",
        openUrl: a.openUrl,
        verifyTls: a.verifyTls
      });
      setHasPassword(Boolean(a.hasPassword));
    };
    const load = (0, import_react7.useCallback)(async () => {
      try {
        const res = await fetch("/api/plugins/mail/settings", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        setNavbarEnabled(Boolean(j.navbarEnabled));
        if (typeof j.pollIntervalSeconds === "number") {
          const sec = clampPollIntervalSeconds(j.pollIntervalSeconds);
          setPollIntervalSeconds(sec);
          setPollDraft(String(sec));
        }
        if (typeof j.unreadMaxAgeDays === "number") {
          const days = clampUnreadMaxAgeDays(j.unreadMaxAgeDays);
          setUnreadMaxAgeDays(days);
          const unit = days >= 365 && days % 365 === 0 ? "years" : "days";
          setUnreadMaxAgeUnit(unit);
          setUnreadMaxAgeDraft(String(unreadMaxAgeDaysToInput(days, unit)));
        }
        const list = j.accounts ?? [];
        setAccounts(list);
        if (list.length > 0) {
          const pick = selectedId && list.some((a) => a.id === selectedId) ? selectedId : list[0].id;
          setSelectedId(pick);
          applyAccountToForm(list.find((a) => a.id === pick));
        } else {
          setSelectedId(null);
          setForm(emptyForm());
        }
        if (j.status) setStatus(j.status);
      } catch {
      }
    }, [selectedId]);
    (0, import_react7.useEffect)(() => {
      void load();
    }, []);
    const refreshStatusFromCache = (0, import_react7.useCallback)(async () => {
      try {
        const res = await fetch("/api/plugins/mail/status", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        setStatus({
          unread: j.unread ?? 0,
          lastSyncAt: j.lastSyncAt,
          lastError: j.lastError,
          accounts: j.accounts ?? []
        });
        if (typeof j.pollIntervalSeconds === "number") {
          const sec = clampPollIntervalSeconds(j.pollIntervalSeconds);
          setPollIntervalSeconds(sec);
          setPollDraft(String(sec));
        }
      } catch {
      }
    }, []);
    (0, import_react7.useEffect)(() => {
      if (!navbarEnabled) return;
      const ms = clampPollIntervalSeconds(pollIntervalSeconds) * 1e3;
      void refreshStatusFromCache();
      const id = window.setInterval(() => void refreshStatusFromCache(), ms);
      return () => window.clearInterval(id);
    }, [navbarEnabled, pollIntervalSeconds, refreshStatusFromCache]);
    const selectAccount = (id) => {
      const a = accounts.find((x) => x.id === id);
      if (!a) return;
      setSelectedId(id);
      applyAccountToForm(a);
      setMsg(null);
      setErr(null);
    };
    const resolvePollInterval = () => {
      const parsed = parseInt(pollDraft.trim(), 10);
      return clampPollIntervalSeconds(Number.isFinite(parsed) ? parsed : pollIntervalSeconds);
    };
    const syncUnreadMaxAgeDraft = (days, unit = unreadMaxAgeUnit) => {
      setUnreadMaxAgeDays(days);
      setUnreadMaxAgeDraft(String(unreadMaxAgeDaysToInput(days, unit)));
    };
    const resolveUnreadMaxAge = () => {
      const parsed = parseInt(unreadMaxAgeDraft.trim(), 10);
      if (!Number.isFinite(parsed)) return unreadMaxAgeDays;
      return unreadMaxAgeInputToDays(parsed, unreadMaxAgeUnit);
    };
    const applyUnreadMaxAgePreset = (days) => {
      const unit = days >= 365 && days % 365 === 0 ? "years" : "days";
      setUnreadMaxAgeUnit(unit);
      syncUnreadMaxAgeDraft(days, unit);
    };
    const savePollInterval = async () => {
      const sec = resolvePollInterval();
      setPollIntervalSeconds(sec);
      setPollDraft(String(sec));
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollIntervalSeconds: sec })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (typeof j.pollIntervalSeconds === "number") {
          const saved = clampPollIntervalSeconds(j.pollIntervalSeconds);
          setPollIntervalSeconds(saved);
          setPollDraft(String(saved));
        }
        if (j.status) setStatus(j.status);
        if (j.accounts) setAccounts(j.accounts);
        setMsg(de ? `Intervall gespeichert (${sec} s)` : `Interval saved (${sec} s)`);
        dispatchMailConfigChanged({
          unread: j.status?.unread,
          pollIntervalSeconds: sec
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const saveUnreadMaxAge = async () => {
      const days = resolveUnreadMaxAge();
      syncUnreadMaxAgeDraft(days);
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unreadMaxAgeDays: days })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (typeof j.unreadMaxAgeDays === "number") {
          const saved = clampUnreadMaxAgeDays(j.unreadMaxAgeDays);
          const unit = saved >= 365 && saved % 365 === 0 ? "years" : "days";
          setUnreadMaxAgeUnit(unit);
          syncUnreadMaxAgeDraft(saved, unit);
        }
        if (j.status) setStatus(j.status);
        if (j.accounts) setAccounts(j.accounts);
        setMsg(
          days === 0 ? de ? "Altersfilter aus \u2014 alle IMAP-Ungelesen z\xE4hlen" : "Age filter off \u2014 all IMAP unread counted" : de ? `Altersfilter gespeichert (${formatUnreadMaxAgeSummary(days, true)})` : `Age filter saved (${formatUnreadMaxAgeSummary(days, false)})`
        );
        dispatchMailConfigChanged({
          unread: j.status?.unread,
          forceRefresh: true
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const accountBody = () => ({
      id: selected?.id,
      label: form.label,
      enabled: form.enabled,
      host: form.host,
      port: form.port,
      secure: form.secure,
      username: form.username,
      mailbox: form.mailbox,
      openUrl: form.openUrl,
      verifyTls: form.verifyTls,
      ...form.password ? { password: form.password } : {}
    });
    const save = async () => {
      if (!selected) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pollIntervalSeconds: resolvePollInterval(),
            account: accountBody()
          })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (j.accounts) setAccounts(j.accounts);
        setStatus(j.status ?? null);
        if (typeof j.pollIntervalSeconds === "number") {
          const saved = clampPollIntervalSeconds(j.pollIntervalSeconds);
          setPollIntervalSeconds(saved);
          setPollDraft(String(saved));
        }
        setHasPassword(hasPassword || Boolean(form.password));
        setForm((f) => ({ ...f, password: "" }));
        setMsg(de ? "Gespeichert" : "Saved");
        dispatchMailConfigChanged({
          openUrl: form.openUrl.trim() || null,
          unread: j.status?.unread,
          forceRefresh: true
        });
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        setErr(m);
        reportPluginError("mail", m, { category: "settings/save" });
      } finally {
        setBusy(false);
      }
    };
    const addAccount = async () => {
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: {
              label: de ? `Konto ${accounts.length + 1}` : `Account ${accounts.length + 1}`,
              host: "",
              port: 993,
              secure: true,
              mailbox: "*",
              enabled: true
            }
          })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        const list = j.accounts ?? [];
        setAccounts(list);
        if (list.length > 0) {
          const neu = list[list.length - 1];
          setSelectedId(neu.id);
          applyAccountToForm(neu);
        }
        setMsg(de ? "Konto hinzugef\xFCgt" : "Account added");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const deleteAccount = async () => {
      if (!selected || accounts.length === 0) return;
      if (!window.confirm(de ? `\u201E${selected.label}" wirklich l\xF6schen?` : `Delete "${selected.label}"?`)) return;
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/plugins/mail/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteAccountId: selected.id })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        const list = j.accounts ?? [];
        setAccounts(list);
        setStatus(j.status ?? null);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          applyAccountToForm(list[0]);
        } else {
          setSelectedId(null);
          setForm(emptyForm());
        }
        dispatchMailConfigChanged({ openUrl: form.openUrl.trim() || null });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const showUnreadPreview = async () => {
      if (!selected) return;
      setPreviewBusy(true);
      setPreviewErr(null);
      try {
        const res = await fetch("/api/plugins/mail/unread-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: selected.id, ...accountBody() })
        });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        setPreviewTotal(j.total ?? 0);
        setPreviewMessages(j.messages ?? []);
        setPreviewTruncated(Boolean(j.truncated));
        setPreviewSkippedStale(j.skippedStale ?? 0);
        setPreviewSkippedDuplicate(j.skippedDuplicate ?? 0);
        setPreviewMaxAgeDays(j.maxUnreadAgeDays ?? 30);
        setPreviewOpen(true);
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        setPreviewErr(m);
        reportPluginError("mail", m, { category: "settings/unread-preview" });
      } finally {
        setPreviewBusy(false);
      }
    };
    const markAllReadOnServer = async () => {
      if (!selected) return;
      const label = form.label || selected.label || selected.username;
      const scope = form.mailbox.trim() === "*" || !form.mailbox.trim() ? de ? "alle IMAP-Ordner dieses Kontos (ohne Papierkorb)" : "all IMAP folders for this account (except trash)" : de ? `Ordner \u201E${form.mailbox.trim()}\u201C inkl. Unterordner` : `mailbox \u201C${form.mailbox.trim()}\u201D including subfolders`;
      const step1 = window.confirm(
        de ? `Alle per IMAP als ungelesen gemeldeten Mails f\xFCr \u201E${label}\u201C als GELESEN markieren?

Bereich: ${scope}

MailPlus/Thunderbird zeigen sie oft nicht \u2014 SelfDashboard setzt dann serverseitig das Gelesen-Flag.` : `Mark all IMAP-reported unread mail for \u201C${label}\u201D as READ?

Scope: ${scope}

MailPlus/Thunderbird may not list them \u2014 SelfDashboard will set the Seen flag on the server.`
      );
      if (!step1) return;
      const step2 = window.confirm(
        de ? `Letzte Best\xE4tigung: wirklich ALLE ungelesenen Mails in diesem Bereich als gelesen markieren?

Das kann nicht r\xFCckg\xE4ngig gemacht werden (au\xDFer du markierst sie in einem Mail-Programm wieder als ungelesen).` : `Final confirmation: mark ALL unread messages in this scope as read?

This cannot be undone from SelfDashboard (you would need to mark them unread again in a mail client).`
      );
      if (!step2) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/mark-all-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: selected.id, ...accountBody() })
        });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (j.status) setStatus(j.status);
        const n = j.marked ?? 0;
        const detail = j.folders && j.folders.length > 0 ? j.folders.map((f) => `${formatMailFolderLabel(f.path)}: ${f.marked}`).join(", ") : "";
        setMsg(
          de ? `${n} Nachricht(en) auf dem Server als gelesen markiert${detail ? ` (${detail})` : ""}.` : `${n} message(s) marked read on the server${detail ? ` (${detail})` : ""}.`
        );
        dispatchMailConfigChanged({
          unread: j.status?.unread ?? 0,
          forceRefresh: true
        });
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        setErr(m);
        reportPluginError("mail", m, { category: "settings/mark-all-read" });
      } finally {
        setBusy(false);
      }
    };
    const test = async () => {
      if (!selected) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: selected.id, ...accountBody() })
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        const unread = j.unread ?? 0;
        if (j.status) setStatus(j.status);
        const withMail = (j.folders ?? []).filter((f) => f.unread > 0);
        const hint = j.mode === "all-except-trash" ? de ? " (alle Ordner, ohne Papierkorb)" : " (all folders, except trash)" : j.mode === "synology-accounts" || j.mode === "accounts" ? de ? " (nur MailPlus-Konten)" : " (MailPlus accounts only)" : "";
        if (!j.status) {
          setStatus({
            unread,
            accounts: [{ id: selected.id, label: form.label || selected.label, unread }],
            lastSyncAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const navbarHint = !navbarEnabled ? de ? " Navbar-Symbol ist aus \u2014 oben einschalten." : " Navbar icon is off \u2014 enable it above." : j.navbarUpdated ? de ? " Navbar wurde aktualisiert." : " Navbar updated." : de ? " \u201ESpeichern\u201C f\xFCr dauerhafte Navbar-Daten." : " Use \u201CSave\u201D for persistent navbar data.";
        if (navbarEnabled && j.navbarUpdated) {
          dispatchMailConfigChanged({
            openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
            unread: j.status?.unread ?? unread,
            forceRefresh: true
          });
        }
        setMsg(
          de ? `\u201E${form.label}" OK \u2014 ${unread} ungelesen${hint}${withMail.length ? ` \xB7 ${withMail.map((f) => `${f.path.split("/").pop()}: ${f.unread}`).join(", ")}` : ""}.${navbarHint}` : `"${form.label}" OK \u2014 ${unread} unread${hint}${withMail.length ? ` \xB7 ${withMail.map((f) => `${f.path.split("/").pop()}: ${f.unread}`).join(", ")}` : ""}.${navbarHint}`
        );
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        setErr(m);
        reportPluginError("mail", m, { category: "settings/test" });
      } finally {
        setBusy(false);
      }
    };
    const syncNow = async () => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/plugins/mail/status?refresh=1", { cache: "no-store" });
        const j = await res.json();
        setStatus(j);
        await load();
        setMsg(de ? "Aktualisiert" : "Refreshed");
        dispatchMailConfigChanged({
          openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
          unread: j.unread,
          forceRefresh: true
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const resetMailCache = async () => {
      const ok = window.confirm(
        de ? "Gespeicherte Ungelesen-Z\xE4hler in SelfDashboard l\xF6schen und sofort neu per IMAP abfragen?\n\nHinweis: E-Mails auf Synology werden nicht gel\xF6scht. Wenn danach noch \u201EGeister\u201C-Mails erscheinen, liegen sie noch als UNSEEN auf dem Mail-Server (MailPlus zeigt sie oft nicht)." : "Clear stored unread counts in SelfDashboard and query IMAP again now?\n\nNote: Mail on Synology is not deleted. If ghost messages still appear, they remain UNSEEN on the mail server (MailPlus often hides them)."
      );
      if (!ok) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/plugins/mail/reset-cache", { method: "POST", cache: "no-store" });
        const j = await res.json();
        if (!res.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${res.status}`);
        setStatus({
          unread: j.unread ?? 0,
          lastSyncAt: j.lastSyncAt,
          lastError: j.lastError,
          accounts: j.accounts ?? []
        });
        await load();
        setMsg(
          de ? `Cache geleert \u2014 neu gez\xE4hlt: ${j.unread ?? 0} ungelesen` : `Cache cleared \u2014 recount: ${j.unread ?? 0} unread`
        );
        dispatchMailConfigChanged({
          openUrl: (j.openUrl ?? form.openUrl.trim()) || null,
          unread: j.unread,
          forceRefresh: true
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    };
    const accountUnread = (id) => status?.accounts?.find((a) => a.id === id)?.unread ?? 0;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }, children: de ? "Mehrere IMAP-Konten m\xF6glich \u2014 die Navbar zeigt die Summe aller ungelesenen Mails." : "Multiple IMAP accounts supported \u2014 the navbar badge shows the total unread count." }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        MailNavbarToggle,
        {
          locale,
          enabled: navbarEnabled,
          onEnabledChange: async (v) => {
            setNavbarEnabled(v);
            await saveMailNavbarEnabled(v);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }, children: de ? "E-Mail-Konten" : "Email accounts" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "btn-ghost", style: { fontSize: "12px", padding: "6px 10px" }, disabled: busy, onClick: () => void addAccount(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Plus, { size: 14 }),
          " ",
          de ? "Konto" : "Account"
        ] })
      ] }),
      accounts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", margin: 0 }, children: de ? "Noch kein Konto \u2014 \u201EKonto\u201C hinzuf\xFCgen und IMAP-Daten eintragen." : "No account yet \u2014 add one and enter IMAP details." }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: accounts.map((a) => {
        const u = accountUnread(a.id);
        const active = a.id === selected?.id;
        return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => selectAccount(a.id),
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              background: active ? "color-mix(in srgb, var(--accent) 18%, var(--surface-2))" : "var(--surface-2)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              color: "var(--text)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontSize: "13px", fontWeight: active ? 600 : 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
                a.label || a.username || a.id,
                !a.enabled ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { color: "var(--text-muted)", fontWeight: 400 }, children: [
                  " (",
                  de ? "aus" : "off",
                  ")"
                ] }) : null
              ] }),
              u > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: {
                flexShrink: 0,
                minWidth: "20px",
                height: "20px",
                padding: "0 6px",
                borderRadius: "10px",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: "20px",
                textAlign: "center"
              }, children: u > 99 ? "99+" : u }) : null
            ]
          },
          a.id
        );
      }) }),
      selected ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        opacity: navbarEnabled ? 1 : 0.45,
        pointerEvents: navbarEnabled ? "auto" : "none"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            value: form.label,
            onChange: (e) => setForm({ ...form, label: e.target.value }),
            placeholder: de ? "Anzeigename" : "Display name"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "label",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: !form.enabled ? "#fbbf24" : "var(--text)",
              padding: !form.enabled ? "8px 10px" : void 0,
              borderRadius: !form.enabled ? "8px" : void 0,
              background: !form.enabled ? "color-mix(in srgb, #fbbf24 12%, transparent)" : void 0,
              border: !form.enabled ? "1px solid color-mix(in srgb, #fbbf24 35%, var(--border))" : void 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: form.enabled, onChange: (e) => setForm({ ...form, enabled: e.target.checked }) }),
              de ? "Dieses Konto abfragen" : "Poll this account",
              !form.enabled ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: "11px", color: "#fbbf24" }, children: de ? "(aus \u2014 Navbar z\xE4hlt dieses Konto nicht)" : "(off \u2014 excluded from navbar poll)" }) : null
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            value: form.host,
            onChange: (e) => setForm({ ...form, host: e.target.value }),
            placeholder: de ? "192.168.1.15" : "192.168.1.15"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "input",
            {
              style: { ...inp, flex: 1 },
              type: "number",
              value: form.port,
              onChange: (e) => setForm({ ...form, port: parseInt(e.target.value, 10) || 993 })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text)", whiteSpace: "nowrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: form.secure, onChange: (e) => setForm({ ...form, secure: e.target.checked }) }),
            "SSL/TLS"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            value: form.username,
            onChange: (e) => setForm({ ...form, username: e.target.value }),
            placeholder: de ? "Benutzername" : "Username",
            autoComplete: "username"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: form.password,
            onChange: (e) => setForm({ ...form, password: e.target.value }),
            placeholder: hasPassword ? de ? "Passwort (leer = unver\xE4ndert)" : "Password (blank = unchanged)" : de ? "Passwort" : "Password",
            autoComplete: "new-password"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            value: form.mailbox,
            onChange: (e) => setForm({ ...form, mailbox: e.target.value }),
            placeholder: de ? "* = alle Ordner" : "* = all folders"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "-8px 0 4px", lineHeight: 1.45 }, children: de ? "\u201E*\u201C = alle IMAP-Ordner mit ungelesenen Mails, nur Papierkorb wird ausgelassen (inkl. Gesendet, Unterordner, \u2026). Optional nur MailPlus-Konten: @accounts" : "\u201C*\u201D = all IMAP folders with unread mail, trash excluded only. MailPlus sidebar only: @accounts" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }, children: de ? "Webmail-URL (Klick in Navbar)" : "Webmail URL (navbar click)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: inp,
            value: form.openUrl,
            onChange: (e) => setForm({ ...form, openUrl: e.target.value }),
            placeholder: "http://192.168.1.15:5000/mail/#inbox"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: form.verifyTls, onChange: (e) => setForm({ ...form, verifyTls: e.target.checked }) }),
          de ? "TLS-Zertifikat pr\xFCfen" : "Verify TLS certificate"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-accent", disabled: busy, onClick: () => void save(), children: de ? "Speichern" : "Save" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-ghost", disabled: busy, onClick: () => void test(), children: de ? "Testen" : "Test" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              disabled: busy || previewBusy,
              onClick: () => void showUnreadPreview(),
              title: de ? "Betreffzeilen der gez\xE4hlten ungelesenen Mails" : "Subjects of counted unread mail",
              children: previewBusy ? de ? "Lade\u2026" : "Loading\u2026" : de ? "Ungelesen anzeigen" : "Show unread"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              disabled: busy,
              onClick: () => void markAllReadOnServer(),
              style: { color: "#fbbf24" },
              title: de ? "IMAP: alle UNSEEN als gelesen markieren (2\xD7 best\xE4tigen)" : "IMAP: mark all UNSEEN as read (double confirm)",
              children: de ? "Alles als gelesen (IMAP)" : "Mark all read (IMAP)"
            }
          ),
          accounts.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              disabled: busy,
              onClick: () => void deleteAccount(),
              style: { color: "#f87171", marginLeft: "auto" },
              title: de ? "Konto l\xF6schen" : "Delete account",
              children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Trash2, { size: 14 })
            }
          ) : null
        ] })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }, children: de ? "Abfrage-Intervall (alle Konten)" : "Poll interval (all accounts)" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: { ...inp, flex: "1 1 120px", minWidth: "80px" },
            type: "number",
            min: MAIL_POLL_INTERVAL_MIN,
            max: MAIL_POLL_INTERVAL_MAX,
            step: 1,
            value: pollDraft,
            onChange: (e) => setPollDraft(e.target.value),
            onBlur: () => {
              const n = resolvePollInterval();
              setPollIntervalSeconds(n);
              setPollDraft(String(n));
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-ghost", style: { fontSize: "12px" }, disabled: busy, onClick: () => void savePollInterval(), children: de ? "Intervall speichern" : "Save interval" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "-8px 0 0", lineHeight: 1.45 }, children: de ? `${MAIL_POLL_INTERVAL_MIN}\u2013${MAIL_POLL_INTERVAL_MAX} s (Standard ${MAIL_POLL_INTERVAL_DEFAULT}). Server synct per IMAP im Hintergrund; Anzeige liest den Cache. \u201EAlle Konten aktualisieren\u201C = sofort neuer IMAP-Lauf.` : `${MAIL_POLL_INTERVAL_MIN}\u2013${MAIL_POLL_INTERVAL_MAX} s (default ${MAIL_POLL_INTERVAL_DEFAULT}). Server syncs via IMAP in the background; UI reads cache. \u201CRefresh all accounts\u201D forces IMAP now.` }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "4px" }, children: de ? "Altersfilter ungelesen (alle Konten)" : "Unread age filter (all accounts)" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }, children: [
        { id: "off", label: de ? "Aus" : "Off", days: 0 },
        { id: "30d", label: "30", days: 30 },
        { id: "1y", label: de ? "1 Jahr" : "1 year", days: 365 },
        { id: "max", label: "Max", days: MAIL_UNREAD_MAX_AGE_MAX_DAYS }
      ].map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          className: "btn-ghost",
          style: {
            fontSize: "12px",
            padding: "4px 10px",
            borderColor: unreadMaxAgeDays === p.days ? "var(--accent)" : void 0,
            color: unreadMaxAgeDays === p.days ? "var(--accent)" : void 0
          },
          disabled: busy,
          onClick: () => applyUnreadMaxAgePreset(p.days),
          children: p.label
        },
        p.id
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            style: { ...inp, flex: "1 1 100px", minWidth: "72px", maxWidth: "120px" },
            type: "number",
            min: 1,
            max: unreadMaxAgeUnit === "years" ? MAIL_UNREAD_MAX_AGE_MAX_YEARS : MAIL_UNREAD_MAX_AGE_MAX_DAYS,
            step: 1,
            value: unreadMaxAgeDraft,
            disabled: unreadMaxAgeDays === 0,
            onChange: (e) => setUnreadMaxAgeDraft(e.target.value),
            onBlur: () => syncUnreadMaxAgeDraft(resolveUnreadMaxAge())
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "select",
          {
            style: { ...inp, flex: "0 0 auto", width: "auto", minWidth: "88px" },
            value: unreadMaxAgeUnit,
            disabled: unreadMaxAgeDays === 0,
            onChange: (e) => {
              const unit = e.target.value;
              const parsed = parseInt(unreadMaxAgeDraft.trim(), 10);
              const days = unreadMaxAgeDays > 0 ? unreadMaxAgeDays : Number.isFinite(parsed) ? unreadMaxAgeInputToDays(parsed, unit) : MAIL_UNREAD_MAX_AGE_DEFAULT;
              setUnreadMaxAgeUnit(unit);
              syncUnreadMaxAgeDraft(days > 0 ? days : MAIL_UNREAD_MAX_AGE_DEFAULT, unit);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "days", children: de ? "Tage" : "Days" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "years", children: de ? "Jahre" : "Years" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-ghost", style: { fontSize: "12px" }, disabled: busy, onClick: () => void saveUnreadMaxAge(), children: de ? "Altersfilter speichern" : "Save age filter" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "-8px 0 0", lineHeight: 1.45 }, children: de ? `Ungelesen \xE4lter als der Wert wird ignoriert (Standard ${MAIL_UNREAD_MAX_AGE_DEFAULT} Tage). Aus = alle IMAP-UNSEEN. Max = ${MAIL_UNREAD_MAX_AGE_MAX_YEARS} Jahre. Eingabe in Tagen oder Jahren (bis ${MAIL_UNREAD_MAX_AGE_MAX_DAYS} Tage).` : `Unread older than the value is ignored (default ${MAIL_UNREAD_MAX_AGE_DEFAULT} days). Off = all IMAP UNSEEN. Max = ${MAIL_UNREAD_MAX_AGE_MAX_YEARS} years. Enter days or years (up to ${MAIL_UNREAD_MAX_AGE_MAX_DAYS} days).` }),
      status ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "10px 12px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          de ? "Gesamt ungelesen" : "Total unread",
          ": ",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: "var(--text)" }, children: status.unread }),
          status.lastSyncAt ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
            " \xB7 Sync: ",
            new Date(status.lastSyncAt).toLocaleString(de ? "de-DE" : "en-US")
          ] }) : null
        ] }),
        status.accounts && status.accounts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { style: { margin: "8px 0 0", paddingLeft: "18px" }, children: status.accounts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { style: { marginBottom: "6px" }, children: [
          a.label,
          ": ",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: "var(--text)" }, children: a.unread }),
          a.lastError ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { color: "#f87171" }, children: [
            " \u2014 ",
            a.lastError
          ] }) : null,
          a.unread > 0 && a.unreadFolders?.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { style: { margin: "4px 0 0", paddingLeft: "16px", fontSize: "11px" }, children: a.unreadFolders.map((f) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            formatMailFolderLabel(f.path),
            ": ",
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: "var(--text)" }, children: f.unread })
          ] }, f.path)) }) : null
        ] }, a.id)) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.45 }, children: de ? "Protokoll: Einstellungen \u2192 Protokoll, Filter \u201Email\u201C. Nach Container-Neustart Passwort erneut speichern (Verschl\xFCsselungsschl\xFCssel)." : "Logs: Settings \u2192 Logs, filter \u201Cmail\u201D. Re-save password after container restart (encryption key)." }),
        status.lastError && status.unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "#fbbf24", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "Die Zahl oben kann ein \xE4lterer Stand sein, solange die Abfrage blockiert ist." : "The count above may be stale while polling is blocked." }) : null,
        status.lastError ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { color: "#f87171", marginTop: "6px" }, children: status.lastError }) : null,
        (status.lastError || err) && onOpenProtocol ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "button",
          {
            type: "button",
            className: "btn-ghost",
            style: { marginTop: "10px", fontSize: "12px", width: "100%" },
            onClick: onOpenProtocol,
            children: de ? "Fehler im Protokoll (mail)" : "Open log (mail)"
          }
        ) : null
      ] }) : null,
      msg ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: "12px", color: "#4ade80" }, children: msg }) : null,
      err ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { fontSize: "12px", color: "#f87171" }, children: [
        err,
        onOpenProtocol ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-ghost", style: { marginTop: "8px", fontSize: "12px" }, onClick: onOpenProtocol, children: de ? "Im Protokoll anzeigen" : "Show in log" }) : null
      ] }) : null,
      previewErr ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: "12px", color: "#f87171" }, children: previewErr }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "btn-ghost", disabled: busy, onClick: () => void syncNow(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RefreshCw, { size: 14 }),
          " ",
          de ? "Alle Konten aktualisieren" : "Refresh all accounts"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "button",
          {
            type: "button",
            className: "btn-ghost",
            disabled: busy,
            onClick: () => void resetMailCache(),
            title: de ? "Nur SelfDashboard-Z\xE4hler in mail.json leeren, dann IMAP" : "Clear SelfDashboard counters in mail.json, then IMAP",
            children: de ? "Mail-Cache leeren" : "Clear mail cache"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }, children: de ? "SelfDashboard speichert keine E-Mails \u2014 nur Z\xE4hler in mail.json. \u201ECache leeren\u201C = Z\xE4hler zur\xFCcksetzen + frischer IMAP-Lauf. Hilft bei veraltetem Badge, nicht wenn Synology/IMAP die Mail noch als UNSEEN f\xFChrt (dann MailPlus-Suche im richtigen Konto, z.\u202FB. Web Mail SSchmidt)." : "SelfDashboard does not store emails \u2014 only counters in mail.json. \u201CClear cache\u201D resets counts + fresh IMAP. Helps stale badges, not when Synology/IMAP still reports UNSEEN (search the correct account in MailPlus, e.g. Web Mail SSchmidt)." }),
      previewOpen ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "div",
        {
          role: "dialog",
          "aria-modal": "true",
          onClick: (e) => {
            if (e.target === e.currentTarget) setPreviewOpen(false);
          },
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 10050,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
            width: "min(560px, 100%)",
            maxHeight: "min(80vh, 640px)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: "15px", fontWeight: 600, color: "var(--text)" }, children: de ? "Ungelesene Mails (IMAP)" : "Unread mail (IMAP)" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "btn-ghost", style: { fontSize: "12px" }, onClick: () => setPreviewOpen(false), children: de ? "Schlie\xDFen" : "Close" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }, children: [
              de ? "Gez\xE4hlt" : "Counted",
              ": ",
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: "var(--text)" }, children: previewTotal }),
              " \xB7 ",
              de ? "Aufgelistet" : "Listed",
              ": ",
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: "var(--text)" }, children: previewMessages.length }),
              previewTruncated ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { color: "#fbbf24" }, children: [
                " \xB7 ",
                de ? "Liste gek\xFCrzt" : "List truncated"
              ] }) : null,
              previewSkippedStale > 0 || previewSkippedDuplicate > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { color: "#fbbf24" }, children: [
                previewSkippedStale > 0 ? de ? ` \xB7 ${previewSkippedStale} \xE4lter als ${formatUnreadMaxAgeSummary(previewMaxAgeDays, true)} ignoriert` : ` \xB7 ${previewSkippedStale} older than ${formatUnreadMaxAgeSummary(previewMaxAgeDays, false)} ignored` : "",
                previewSkippedDuplicate > 0 ? de ? ` \xB7 ${previewSkippedDuplicate} Duplikat(e) ignoriert` : ` \xB7 ${previewSkippedDuplicate} duplicate(s) ignored` : ""
              ] }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px" }, children: previewMessages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: 0, fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }, children: de ? "Keine ungelesenen Nachrichten per IMAP-SEARCH." : "No unread messages via IMAP SEARCH." }) : (() => {
              const byFolder = /* @__PURE__ */ new Map();
              for (const m of previewMessages) {
                const list = byFolder.get(m.folder) ?? [];
                list.push(m);
                byFolder.set(m.folder, list);
              }
              return [...byFolder.entries()].map(([folder, items]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginBottom: "14px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  marginBottom: "6px"
                }, children: [
                  items[0]?.folderLabel ?? formatMailFolderLabel(folder),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontWeight: 400, textTransform: "none" }, children: [
                    " (",
                    items.length,
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { style: { margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }, children: items.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { style: { fontSize: "13px", color: "var(--text)" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontWeight: 500 }, children: m.note === "noselect" ? de ? `Noselect-Ordner \u2014 ${previewTotal} gez\xE4hlt, Betreffzeilen nicht per IMAP abrufbar` : m.subject : m.subject === "(no subject)" ? de ? "(ohne Betreff)" : m.subject : m.subject }),
                  m.from ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: m.from }) : null,
                  m.date ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: new Date(m.date).toLocaleString(de ? "de-DE" : "en-US") }) : null,
                  m.uid > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { fontSize: "10px", color: "var(--text-muted)", fontFamily: "ui-monospace, monospace" }, children: [
                    "UID ",
                    m.uid
                  ] }) : null
                ] }, `${folder}-${m.uid}-${i}`)) })
              ] }, folder));
            })() })
          ] })
        }
      ) : null
    ] });
  }

  // src/lib/pluginDev.ts
  async function pluginApiJson(pluginId, path, init) {
    const url = path.startsWith("/api/") ? path : `/api/plugins/${pluginId}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers
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
  }

  // plugins/mail/index.tsx
  var import_jsx_runtime6 = __toESM(require_jsx_runtime());
  var meta = {
    id: "mail",
    name: "E-Mail / IMAP",
    description: "Navbar-Badge mit ungelesenen Mails, mehrere IMAP-Konten.",
    version: "1.0.0",
    author: "SelfDashboard",
    category: "productivity",
    icon: "\u2709\uFE0F",
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }
  };
  function MailStatusSummary() {
    const [unread, setUnread] = (0, import_react8.useState)(null);
    (0, import_react8.useEffect)(() => {
      void pluginApiJson(MAIL_PLUGIN_ID, "/status").then((j) => setUnread(j.unread ?? 0)).catch(() => setUnread(null));
    }, []);
    if (unread === null) return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u2026" });
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
      unread,
      " ungelesen"
    ] });
  }
  function MailStatusWidget(_props) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: "flex flex-col items-center justify-center h-full text-center p-3",
        style: { color: "var(--text-muted)", fontSize: "12px" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: "24px", marginBottom: "8px" }, children: "\u2709\uFE0F" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(MailStatusSummary, {})
        ]
      }
    );
  }
  function registerMailPluginSurfaces() {
    registerNavbarSlot(meta.id, NavbarMail);
    registerAppSettingsPanel(meta.id, { de: "E-Mail", en: "Email" }, MailSettingsPanel);
  }
  registerMailPluginSurfaces();
  var component = {
    Widget: MailStatusWidget
  };
  registerPlugin(meta, component, { replace: true });

  // plugin-pack/staging/.entries/mail.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/mail.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/refresh-cw.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
