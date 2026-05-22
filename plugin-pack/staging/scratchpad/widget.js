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

  // sd-react:react-dom
  var require_react_dom = __commonJS({
    "sd-react:react-dom"(exports, module) {
      var rd = globalThis.SelfDashboard?.ReactDOM;
      if (!rd?.createPortal) throw new Error("SelfDashboard.ReactDOM missing \u2014 reload page");
      module.exports = { createPortal: rd.createPortal, default: rd };
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

  // plugins/scratchpad/index.tsx
  var import_react2 = __toESM(require_react());

  // src/components/ui/Portal.tsx
  var import_react = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  function Portal({ children }) {
    const [mounted, setMounted] = (0, import_react.useState)(false);
    (0, import_react.useEffect)(() => {
      setMounted(true);
    }, []);
    if (!mounted) return null;
    return (0, import_react_dom.createPortal)(children, document.body);
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

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // plugins/scratchpad/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "scratchpad",
    name: "Notizzettel",
    description: "Kurzer Merkzettel \u2014 direkt im Widget bearbeitbar, Speichern mit Sicherheitsabfrage.",
    version: "1.1.1",
    author: "Du",
    category: "utility",
    icon: "\u{1F4DD}",
    configSchema: [
      {
        key: "title",
        label: "Titel",
        type: "text",
        defaultValue: "Notizzettel",
        placeholder: "z. B. Heute erledigen"
      }
    ]
  };
  function SaveConfirmModal({
    open,
    title,
    de,
    onCancel,
    onConfirm
  }) {
    (0, import_react2.useEffect)(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === "Escape") onCancel();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [open, onCancel]);
    if (!open) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 1e5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        },
        role: "presentation",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)"
              },
              onClick: onCancel,
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: "animate-fade-in",
              role: "dialog",
              "aria-modal": "true",
              "aria-labelledby": "scratchpad-confirm-title",
              style: {
                position: "relative",
                width: "100%",
                maxWidth: "400px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.55)"
              },
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: "scratchpad-confirm-title", style: { margin: "0 0 8px", fontSize: "1rem", fontWeight: 700, color: "var(--text)" }, children: de ? "\xC4nderungen speichern?" : "Save changes?" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 18px", fontSize: "13px", lineHeight: 1.5, color: "var(--text-muted)" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  "Die Notiz unter \u201E",
                  title,
                  "\u201C wird im Dashboard dauerhaft \xFCberschrieben. Fortfahren?"
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  "The note under \u201C",
                  title,
                  "\u201D will be permanently overwritten on the dashboard. Continue?"
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      type: "button",
                      className: "btn-ghost",
                      style: { padding: "8px 14px", fontSize: "13px" },
                      onClick: onCancel,
                      children: de ? "Abbrechen" : "Cancel"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn-accent", style: { padding: "8px 16px", fontSize: "13px" }, onClick: onConfirm, children: de ? "Speichern" : "Save" })
                ] })
              ]
            }
          )
        ]
      }
    ) });
  }
  function Widget({ instanceId, config }) {
    const { de } = usePluginLocale();
    const title = config.title || (de ? "Notizzettel" : "Scratchpad");
    const savedNote = config.note || "";
    const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig);
    const [draft, setDraft] = (0, import_react2.useState)(savedNote);
    const [confirmOpen, setConfirmOpen] = (0, import_react2.useState)(false);
    (0, import_react2.useEffect)(() => {
      setDraft(savedNote);
    }, [savedNote, instanceId]);
    const dirty = draft !== savedNote;
    const persist = (0, import_react2.useCallback)(() => {
      updatePluginConfig(instanceId, { note: draft });
      setConfirmOpen(false);
    }, [draft, instanceId, updatePluginConfig]);
    const inp = {
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "8px",
      padding: "10px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      fontFamily: "inherit",
      resize: "none",
      flex: 1,
      minHeight: "80px",
      lineHeight: 1.45
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4px 2px 0",
          gap: "8px",
          overflow: "hidden",
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "h3",
            {
              style: {
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text)",
                flexShrink: 0
              },
              children: title
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "textarea",
            {
              style: inp,
              value: draft,
              onChange: (e) => setDraft(e.target.value),
              placeholder: de ? "Notiz \u2026 (Speichern nicht vergessen)" : "Note \u2026 (remember to save)",
              spellCheck: true,
              "aria-label": de ? "Notiz" : "Note"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", flexShrink: 0, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: "btn-ghost",
                style: { padding: "6px 12px", fontSize: "12px", opacity: dirty ? 1 : 0.45 },
                disabled: !dirty,
                onClick: () => setDraft(savedNote),
                children: de ? "Verwerfen" : "Discard"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: "btn-accent",
                style: { padding: "6px 14px", fontSize: "12px" },
                disabled: !dirty,
                onClick: () => setConfirmOpen(true),
                children: de ? "Speichern \u2026" : "Save\u2026"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            SaveConfirmModal,
            {
              open: confirmOpen,
              title,
              de,
              onCancel: () => setConfirmOpen(false),
              onConfirm: persist
            }
          )
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
      padding: "8px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "label",
          {
            style: {
              fontSize: "11px",
              color: "var(--text-muted)",
              display: "block",
              marginBottom: "6px"
            },
            children: de ? "Titel" : "Title"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inputStyle,
            value: config.title || "",
            onChange: (e) => onChange("title", e.target.value),
            placeholder: de ? "\xDCberschrift" : "Heading"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", lineHeight: 1.5, color: "var(--text-muted)", margin: 0 }, children: de ? "Den Notiztext tr\xE4gst du direkt im Widget ein \u2014 dort wird vor dem Speichern nachgefragt, damit nichts aus Versehen \xFCberschrieben wird." : "Enter the note text in the widget \u2014 it asks before saving so nothing is overwritten by accident." })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/scratchpad.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
    if (typeof void 0 === "function") (void 0)();
  })(typeof window !== "undefined" ? window.SelfDashboard : globalThis.SelfDashboard);
})();
