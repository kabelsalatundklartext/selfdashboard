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

  // plugins/iframe/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/app-window.js
  var AppWindow = createLucideIcon("AppWindow", [
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }],
    ["path", { d: "M10 4v4", key: "pp8u80" }],
    ["path", { d: "M2 8h20", key: "d11cs7" }],
    ["path", { d: "M6 4v4", key: "1svtjw" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/external-link.js
  var ExternalLink = createLucideIcon("ExternalLink", [
    ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
    ["path", { d: "M10 14 21 3", key: "gplh6r" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/refresh-cw.js
  var RefreshCw = createLucideIcon("RefreshCw", [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
    ["path", { d: "M8 16H3v5", key: "1cv678" }]
  ]);

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // plugins/iframe/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var EXAMPLE_URL = "http://192.168.1.10:8080";
  function iframeStrings(de) {
    return {
      hintNoUrlBefore: de ? "URL der einzubettenden Seite eintragen \u2014 z.\u202FB." : "Enter the URL to embed \u2014 e.g.",
      openPage: de ? "Seite \xF6ffnen" : "Open page",
      linkModeHelp: de ? "Modus \u201ENur Link\u201C: sinnvoll, wenn die Zielseite nicht per iframe eingebettet werden darf (X-Frame-Options)." : "\u201CLink only\u201D mode: use when the target page cannot be embedded (X-Frame-Options).",
      loadSlowHint: de ? "Die Seite antwortet nicht wie erwartet (iframe / Layout). Neu laden oder im Tab \xF6ffnen." : "The page is taking unusually long (iframe / layout). Reload or open in a new tab.",
      reload: de ? "Erneut laden" : "Reload",
      iframeTitle: de ? "Eingebettete Seite" : "Embedded page",
      openInNewTab: de ? "In neuem Tab" : "Open in new tab",
      settingsUrlLabel: de ? "Seiten-URL" : "Page URL",
      settingsUrlHelpDe: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Ohne ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http://" }),
        " wird ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        " ",
        "angenommen. F\xFCr HTTPS die vollst\xE4ndige URL angeben."
      ] }),
      settingsUrlHelpEn: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "If you omit ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http://" }),
        ", ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        " is assumed. Use a full ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "https://" }),
        " URL when needed."
      ] }),
      embedToggle: de ? "Per iframe einbetten" : "Embed as iframe",
      settingsFootnote: de ? "Hinweis: Bleibt die Vorschau leer, sendet die Zielseite evtl. X-Frame-Options \u2014 dann \u201EEinbetten\u201C aus und nur per Link \xF6ffnen (oder Reverse-Proxy auf dieselbe Origin)." : "If the preview stays blank, the target may send X-Frame-Options \u2014 turn off \u201CEmbed\u201D and use link mode (or reverse-proxy under the same origin).",
      viewportLabel: de ? "Ansicht (Viewport)" : "View (viewport)",
      viewportAuto: de ? "Automatisch (volle Widget-Breite)" : "Automatic (full widget width)",
      viewportMobile: de ? "Immer mobil (schmale Spalte)" : "Always mobile (narrow column)",
      viewportDesktop: de ? "Immer Desktop (breit, ggf. horizontal scrollen)" : "Always desktop (wide; may scroll horizontally)",
      viewportHelp: de ? "\u201EMobil\u201C: schmale Layout-Breite. Breites Panel: gleichm\xE4\xDFig skaliert, sodass die volle Widget-H\xF6he genutzt wird (unten nicht abgeschnitten)." : "\u201CMobile\u201D: narrow layout. Wide panel: scaled so the full widget height is used (no cut-off at the bottom).",
      mobileWidthLabel: de ? "Mobile Breite (px)" : "Mobile width (px)"
    };
  }
  var meta = {
    id: "iframe",
    name: "Iframe",
    description: "Embed any website (iframe) or open as a link; use link mode when X-Frame-Options blocks embedding. Optional mobile or desktop viewport.",
    version: "2.1.4",
    author: "SelfDashboard",
    category: "utility",
    icon: "\u{1F5BC}\uFE0F"
  };
  function str(v) {
    return typeof v === "string" ? v.trim() : "";
  }
  function normalizeUrl(raw) {
    const s = raw.trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : `http://${s}`;
  }
  function parseViewportMode(v) {
    if (v === "mobile" || v === "desktop" || v === "auto") return v;
    return "auto";
  }
  var DESKTOP_FRAME_MIN_WIDTH = 1280;
  function clampMobileFrameWidth(v) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return 390;
    return Math.min(480, Math.max(320, Math.round(n)));
  }
  function Widget({ config }) {
    const { de } = usePluginLocale();
    const s = (0, import_react3.useMemo)(() => iframeStrings(de), [de]);
    const url = normalizeUrl(str(config.url));
    const embed = config.embed !== false;
    const r = config;
    const viewportMode = parseViewportMode(r.viewportMode);
    const mobileFrameWidth = clampMobileFrameWidth(r.mobileFrameWidth);
    const iframeHostRef = (0, import_react3.useRef)(null);
    const [frameNonce, setFrameNonce] = (0, import_react3.useState)(0);
    const [iframeLoaded, setIframeLoaded] = (0, import_react3.useState)(false);
    const [loadSlow, setLoadSlow] = (0, import_react3.useState)(false);
    const [slotRect, setSlotRect] = (0, import_react3.useState)({ w: 0, h: 0 });
    const lastBoxRef = (0, import_react3.useRef)({ w: -1, h: -1 });
    const skipResizeBounceUntil = (0, import_react3.useRef)(0);
    const bumpFrame = (0, import_react3.useCallback)(() => {
      setIframeLoaded(false);
      setLoadSlow(false);
      setFrameNonce((n) => n + 1);
    }, []);
    (0, import_react3.useEffect)(() => {
      if (!url || !embed) return;
      setIframeLoaded(false);
      setLoadSlow(false);
      setFrameNonce((n) => n + 1);
      lastBoxRef.current = { w: -1, h: -1 };
      skipResizeBounceUntil.current = Date.now() + 320;
    }, [url, embed, viewportMode, mobileFrameWidth]);
    (0, import_react3.useEffect)(() => {
      if (!url || !embed) return;
      const el = iframeHostRef.current;
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        const cr = entries[0]?.contentRect;
        if (!cr) return;
        const w = Math.round(cr.width);
        const h = Math.round(cr.height);
        if (viewportMode === "mobile") {
          setSlotRect({ w, h });
        } else {
          setSlotRect({ w: 0, h: 0 });
        }
        const prev = lastBoxRef.current;
        lastBoxRef.current = { w, h };
        if (Date.now() < skipResizeBounceUntil.current) return;
        if (prev.h >= 0 && prev.h < 28 && h >= 48 && w >= 48) bumpFrame();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [url, embed, bumpFrame, viewportMode, mobileFrameWidth]);
    (0, import_react3.useEffect)(() => {
      if (!url || !embed || iframeLoaded) return;
      const t = window.setTimeout(() => setLoadSlow(true), 12e3);
      return () => clearTimeout(t);
    }, [url, embed, iframeLoaded, frameNonce]);
    const shell = {
      height: "100%",
      width: "100%",
      minHeight: 0,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "hidden",
      containerType: "size"
    };
    if (!url) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            ...shell,
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            textAlign: "center",
            gap: "10px"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { size: 34, strokeWidth: 2, style: { color: "var(--accent)", opacity: 0.9 }, "aria-hidden": true }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.45, maxWidth: "26em" }, children: [
              s.hintNoUrlBefore,
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "11px" }, children: EXAMPLE_URL })
            ] })
          ]
        }
      );
    }
    if (!embed) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            ...shell,
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            gap: "14px",
            textAlign: "center"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { size: 30, strokeWidth: 2, style: { color: "var(--accent)" }, "aria-hidden": true })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "a",
              {
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "var(--accent)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                  border: "none"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 16, "aria-hidden": true }),
                  s.openPage
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.45, maxWidth: "28em" }, children: s.linkModeHelp })
          ]
        }
      );
    }
    const hostOuter = {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      width: "100%",
      position: "relative",
      background: "var(--surface)",
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      overflow: viewportMode === "desktop" ? "auto" : "hidden"
    };
    const hostInner = viewportMode === "desktop" ? {
      minWidth: DESKTOP_FRAME_MIN_WIDTH,
      width: `max(100%, ${DESKTOP_FRAME_MIN_WIDTH}px)`,
      minHeight: 0,
      height: "100%",
      position: "relative",
      flex: "0 0 auto"
    } : {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      width: "100%",
      height: "100%",
      position: "relative"
    };
    const wideMobileSlot = slotRect.w > mobileFrameWidth && slotRect.h > 0;
    const mobileScale = wideMobileSlot ? slotRect.w / mobileFrameWidth : 1;
    const mobileLogicalHeight = wideMobileSlot ? slotRect.h * mobileFrameWidth / slotRect.w : 0;
    const mobileSlotClip = {
      position: "absolute",
      inset: 0,
      overflow: "hidden"
    };
    const mobileScaledStage = wideMobileSlot ? {
      position: "absolute",
      left: 0,
      top: 0,
      width: mobileFrameWidth,
      height: mobileLogicalHeight,
      transform: `scale(${mobileScale})`,
      transformOrigin: "top left"
    } : {
      position: "absolute",
      inset: 0
    };
    const mobileFlexFill = {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      width: "100%",
      height: "100%",
      position: "relative"
    };
    const frameBody = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      !iframeLoaded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 12,
            textAlign: "center",
            background: "color-mix(in srgb, var(--surface) 92%, var(--background))",
            zIndex: 1,
            pointerEvents: loadSlow ? "auto" : "none"
          },
          "aria-hidden": !loadSlow,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { width: "min(220px, 70%)", height: 10, borderRadius: 4, opacity: 0.55 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { width: "min(160px, 55%)", height: 10, borderRadius: 4, opacity: 0.45 } }),
            loadSlow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.45, maxWidth: 280 }, children: s.loadSlowHint }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => bumpFrame(),
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 14, "aria-hidden": true }),
                    s.reload
                  ]
                }
              )
            ] }) : null
          ]
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "iframe",
        {
          title: s.iframeTitle,
          src: url,
          loading: "eager",
          onLoad: () => {
            setIframeLoaded(true);
            setLoadSlow(false);
          },
          style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
            background: "var(--surface)"
          },
          sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals",
          referrerPolicy: "strict-origin-when-cross-origin"
        },
        `${url}#${frameNonce}`
      )
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: shell, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: iframeHostRef, style: hostOuter, children: viewportMode === "mobile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: mobileFlexFill, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: mobileSlotClip, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: mobileScaledStage, children: frameBody }) }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hostInner, children: frameBody }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-2)"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "a",
            {
              href: url,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "inline-flex",
                gap: "5px",
                alignItems: "center",
                textDecoration: "none"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12, "aria-hidden": true }),
                s.openInNewTab
              ]
            }
          )
        }
      )
    ] });
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
    const s = (0, import_react3.useMemo)(() => iframeStrings(de), [de]);
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
    const embed = config.embed !== false;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: s.settingsUrlLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.url),
            onChange: (e) => onChange("url", e.target.value),
            placeholder: EXAMPLE_URL
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }, children: de ? s.settingsUrlHelpDe : s.settingsUrlHelpEn })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)", flex: 1, lineHeight: 1.35 }, children: s.embedToggle }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: embed,
            onChange: (e) => onChange("embed", e.target.checked),
            style: { width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0 },
            "aria-label": s.embedToggle
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: s.viewportLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            style: { ...inp, cursor: "pointer" },
            value: parseViewportMode(config.viewportMode),
            onChange: (e) => onChange("viewportMode", e.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "auto", children: s.viewportAuto }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "mobile", children: s.viewportMobile }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "desktop", children: s.viewportDesktop })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }, children: s.viewportHelp })
      ] }),
      parseViewportMode(config.viewportMode) === "mobile" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: s.mobileWidthLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 320,
            max: 480,
            step: 10,
            value: clampMobileFrameWidth(config.mobileFrameWidth),
            onChange: (e) => {
              const raw = e.target.value === "" ? 390 : Number(e.target.value);
              onChange("mobileFrameWidth", Number.isFinite(raw) ? raw : 390);
            }
          }
        )
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }, children: s.settingsFootnote })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/iframe.tsx
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
lucide-react/dist/esm/icons/app-window.js:
lucide-react/dist/esm/icons/external-link.js:
lucide-react/dist/esm/icons/refresh-cw.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
