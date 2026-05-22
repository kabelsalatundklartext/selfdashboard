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
      function jsx3(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx3;
      exports.jsxs = jsx3;
      exports.Fragment = R.Fragment;
    }
  });

  // plugins/mail/index.tsx
  var import_react5 = __toESM(require_react());

  // src/components/layout/NavbarMail.tsx
  var import_react4 = __toESM(require_react());

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

  // node_modules/lucide-react/dist/esm/icons/mail.js
  var Mail = createLucideIcon("Mail", [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }]
  ]);

  // src/builtin-plugins/mail/lib/events.ts
  var MAIL_CONFIG_CHANGED = "selfdashboard:mail-config-changed";

  // src/builtin-plugins/mail/lib/errors.ts
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

  // src/builtin-plugins/mail/lib/types.ts
  var MAIL_POLL_INTERVAL_MIN = 1;
  var MAIL_POLL_INTERVAL_MAX = 900;
  var MAIL_POLL_INTERVAL_DEFAULT = 120;
  function clampPollIntervalSeconds(seconds) {
    if (!Number.isFinite(seconds)) return MAIL_POLL_INTERVAL_DEFAULT;
    return Math.max(
      MAIL_POLL_INTERVAL_MIN,
      Math.min(MAIL_POLL_INTERVAL_MAX, Math.round(seconds))
    );
  }

  // src/components/layout/useNavbarCompact.ts
  var import_react3 = __toESM(require_react());
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
    const compact = (0, import_react3.useSyncExternalStore)(
      (cb) => subscribeMq(NAVBAR_COMPACT_MQ, cb),
      () => snapshotMq(NAVBAR_COMPACT_MQ),
      () => false
    );
    const phone = (0, import_react3.useSyncExternalStore)(
      (cb) => subscribeMq(NAVBAR_PHONE_MQ, cb),
      () => snapshotMq(NAVBAR_PHONE_MQ),
      () => false
    );
    return { compact, phone };
  }

  // src/builtin-plugins/mail/lib/clientApi.ts
  var MAIL_PLUGIN_ID = "mail";
  function mailApiUrl(path, query = "") {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `/api/plugins/${MAIL_PLUGIN_ID}${p}${query}`;
  }

  // src/components/layout/NavbarMail.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var PULSE_MS = 12e3;
  function NavbarMail({ locale }) {
    const { compact, phone } = useNavbarCompact();
    const [data, setData] = (0, import_react4.useState)(null);
    const [pulsing, setPulsing] = (0, import_react4.useState)(false);
    const prevUnread = (0, import_react4.useRef)(null);
    const pulseTimer = (0, import_react4.useRef)(null);
    const triggerPulse = (0, import_react4.useCallback)(() => {
      setPulsing(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPulsing(false), PULSE_MS);
    }, []);
    const load = (0, import_react4.useCallback)(async (opts) => {
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
    (0, import_react4.useEffect)(() => {
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
    (0, import_react4.useEffect)(() => {
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "navbar-mail-icon-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: iconSize, strokeWidth: hasNew ? 2.25 : 2 }) }),
          hasUnread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "navbar-mail-badge", "aria-hidden": true, children: unread > 99 ? "99+" : unread }) : lastError && !configError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "navbar-mail-dot navbar-mail-dot--error" }) : lastError && configError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "navbar-mail-dot navbar-mail-dot--warn", title: lastError }) : null
        ]
      }
    );
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

  // plugins/mail/index.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  var meta = {
    id: "mail",
    name: "E-Mail / IMAP",
    description: "Navbar-Badge mit ungelesenen Mails, mehrere IMAP-Konten. API: /api/plugins/mail.",
    version: "1.1.0",
    author: "SelfDashboard",
    category: "productivity",
    icon: "\u2709\uFE0F",
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }
  };
  function MailStatusSummary() {
    const [unread, setUnread] = (0, import_react5.useState)(null);
    (0, import_react5.useEffect)(() => {
      void pluginApiJson(MAIL_PLUGIN_ID, "/status").then((j) => setUnread(j.unread ?? 0)).catch(() => setUnread(null));
    }, []);
    if (unread === null) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u2026" });
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
      unread,
      " ungelesen"
    ] });
  }
  function MailStatusWidget(_props) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        className: "flex flex-col items-center justify-center h-full text-center p-3",
        style: { color: "var(--text-muted)", fontSize: "12px" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: "24px", marginBottom: "8px" }, children: "\u2709\uFE0F" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MailStatusSummary, {})
        ]
      }
    );
  }
  function registerMailPluginSurfaces() {
    const SD = typeof window !== "undefined" ? window.SelfDashboard : void 0;
    if (!SD?.registerNavbarSlot) return;
    SD.registerNavbarSlot(meta.id, NavbarMail);
  }
  var component = {
    Widget: MailStatusWidget
  };

  // plugin-pack/staging/.entries/mail.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof registerMailPluginSurfaces === "function") registerMailPluginSurfaces();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/mail.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
