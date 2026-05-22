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

  // plugins/bookmarks/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/check.js
  var Check = createLucideIcon("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);

  // node_modules/lucide-react/dist/esm/icons/external-link.js
  var ExternalLink = createLucideIcon("ExternalLink", [
    ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
    ["path", { d: "M10 14 21 3", key: "gplh6r" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/folder-plus.js
  var FolderPlus = createLucideIcon("FolderPlus", [
    ["path", { d: "M12 10v6", key: "1bos4e" }],
    ["path", { d: "M9 13h6", key: "1uhe8q" }],
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
        key: "1kt360"
      }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/grip-vertical.js
  var GripVertical = createLucideIcon("GripVertical", [
    ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
    ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
    ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
    ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
    ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
    ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/pen-line.js
  var PenLine = createLucideIcon("PenLine", [
    ["path", { d: "M12 20h9", key: "t2du7b" }],
    ["path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z", key: "ymcmye" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/plus.js
  var Plus = createLucideIcon("Plus", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/trash-2.js
  var Trash2 = createLucideIcon("Trash2", [
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/upload.js
  var Upload = createLucideIcon("Upload", [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
    ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/x.js
  var X = createLucideIcon("X", [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
  ]);

  // scripts/plugin-host-shims/plugin-locale-shim.ts
  function usePluginLocale() {
    const fn = globalThis.SelfDashboard?.usePluginLocale;
    if (!fn) {
      throw new Error("SelfDashboard.usePluginLocale missing \u2014 reload the page (Ctrl+F5)");
    }
    return fn();
  }

  // plugins/bookmarks/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "bookmarks",
    name: "App Bookmarks",
    description: "Quick links with groups, custom icons, drag & drop, responsive grid or horizontal row.",
    version: "1.6.2",
    author: "SelfDashboard",
    category: "utility",
    icon: "\u{1F516}",
    stackedExtraH: 2
  };
  var DEFAULT_DATA = {
    layout: "grid",
    tileMinPx: 108,
    tileMaxPx: 240,
    tileFixed: false,
    groups: [{ id: "default", name: "Meine Apps" }],
    apps: [
      { id: "1", name: "Portainer", url: "http://localhost:9000", icon: "\u{1F433}", newTab: true, group: "default" },
      { id: "2", name: "Nextcloud", url: "http://localhost:8080", icon: "\u2601\uFE0F", newTab: true, group: "default" },
      { id: "3", name: "Jellyfin", url: "http://localhost:8096", icon: "\u{1F3AC}", newTab: true, group: "default" },
      { id: "4", name: "Unraid", url: "http://tower", icon: "\u{1F5A5}\uFE0F", newTab: true, group: "default" }
    ]
  };
  function clampTileMin(v) {
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    if (!Number.isFinite(n)) return 108;
    return Math.min(240, Math.max(72, Math.round(n)));
  }
  function clampTileMax(v, minPx) {
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    if (!Number.isFinite(n)) return Math.max(200, minPx + 32);
    return Math.min(400, Math.max(minPx + 40, Math.round(n)));
  }
  function normalizeTiles(p) {
    const raw = p ?? {};
    const min = clampTileMin(raw.tileMinPx);
    return {
      tileMinPx: min,
      tileMaxPx: clampTileMax(raw.tileMaxPx, min),
      tileFixed: raw.tileFixed === true
    };
  }
  function parseData(raw) {
    try {
      const p = JSON.parse(raw);
      const layout = p?.layout === "row" ? "row" : "grid";
      const tiles = normalizeTiles(p);
      if (p?.apps) {
        return {
          apps: p.apps,
          groups: p.groups?.length ? p.groups : [{ id: "default", name: "Meine Apps" }],
          layout,
          ...tiles
        };
      }
      if (Array.isArray(p) && p.length > 0)
        return {
          layout: "grid",
          groups: [{ id: "default", name: "Meine Apps" }],
          apps: p.map((a) => ({ ...a, group: "default" })),
          ...normalizeTiles(void 0)
        };
    } catch {
    }
    return DEFAULT_DATA;
  }
  function serializeBookmarkData(a, g, l, tileMin, tileMax, tileFixed) {
    const min = clampTileMin(tileMin);
    const max = clampTileMax(tileMax, min);
    return JSON.stringify({ apps: a, groups: g, layout: l, tileMinPx: min, tileMaxPx: max, tileFixed });
  }
  function AppIcon({ icon }) {
    if (icon?.startsWith("data:") || icon?.startsWith("http"))
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          src: icon,
          alt: "",
          style: {
            width: "clamp(18px, 5cqmin, 26px)",
            height: "clamp(18px, 5cqmin, 26px)",
            borderRadius: "4px",
            objectFit: "cover",
            flexShrink: 0
          }
        }
      );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "clamp(16px, 4.5cqmin, 20px)", flexShrink: 0, lineHeight: 1 }, children: icon || "\u{1F517}" });
  }
  var linkBaseStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    textDecoration: "none",
    transition: "border-color 0.15s"
  };
  function Widget({ config }) {
    const data = parseData(config.data ?? config.apps);
    const layout = data.layout ?? "grid";
    const minPx = clampTileMin(data.tileMinPx);
    const maxPx = clampTileMax(data.tileMaxPx ?? 240, minPx);
    const tileFixed = data.tileFixed === true;
    const gridTemplateColumns = layout === "grid" ? tileFixed ? `repeat(auto-fill, minmax(${minPx}px, ${minPx}px))` : `repeat(auto-fit, minmax(min(100%, clamp(${minPx}px, 24cqmin, ${maxPx}px)), 1fr))` : void 0;
    const outer = {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      height: "100%",
      width: "100%",
      overflow: "auto",
      justifyContent: "flex-start",
      alignItems: "stretch",
      minHeight: 0,
      boxSizing: "border-box",
      containerType: "size"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: outer, children: data.groups.map((group) => {
      const apps = data.apps.filter((a) => a.group === group.id);
      if (apps.length === 0 || group.hidden) return null;
      const listStyle = layout === "row" ? {
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: "6px",
        overflowX: "auto",
        overflowY: "hidden",
        width: "100%",
        minHeight: 0,
        WebkitOverflowScrolling: "touch"
      } : {
        display: "grid",
        gridTemplateColumns,
        gap: "clamp(4px, 1.5cqmin, 10px)",
        alignContent: "start",
        width: "100%",
        flex: 1,
        minHeight: 0
      };
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { minWidth: 0, flex: layout === "grid" ? 1 : void 0, display: "flex", flexDirection: "column", minHeight: 0 }, children: [
        data.groups.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }, children: group.name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: listStyle, children: apps.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "a",
          {
            href: app.url,
            target: app.newTab ? "_blank" : "_self",
            rel: "noopener noreferrer",
            style: {
              ...linkBaseStyle,
              flex: layout === "row" ? "0 0 auto" : void 0,
              width: layout === "grid" ? "100%" : void 0,
              minWidth: layout === "row" ? `${minPx}px` : void 0,
              maxWidth: layout === "row" ? tileFixed ? `${minPx}px` : `min(${maxPx}px, 95cqw)` : void 0,
              minHeight: layout === "grid" ? "clamp(40px, 11cqmin, 52px)" : void 0,
              boxSizing: "border-box"
            },
            onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--accent)",
            onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--border)",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppIcon, { icon: app.icon }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "clamp(11px, 3.2cqmin, 14px)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: app.name }),
              app.newTab && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 10, style: { color: "var(--text-muted)", flexShrink: 0 } })
            ]
          },
          app.id
        )) })
      ] }, group.id);
    }) });
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
    const data = parseData(config.data ?? config.apps);
    const [apps, setApps] = (0, import_react3.useState)(data.apps);
    const [groups, setGroups] = (0, import_react3.useState)(data.groups);
    const [layout, setLayout] = (0, import_react3.useState)(() => parseData(config.data ?? config.apps).layout ?? "grid");
    const [editing, setEditing] = (0, import_react3.useState)(null);
    const [editData, setEditData] = (0, import_react3.useState)({});
    const [dragAppId, setDragAppId] = (0, import_react3.useState)(null);
    const [dragOverId, setDragOverId] = (0, import_react3.useState)(null);
    const [dragOverGroup, setDragOverGroup] = (0, import_react3.useState)(null);
    const fileRef = (0, import_react3.useRef)(null);
    const [tileMin, setTileMin] = (0, import_react3.useState)(() => clampTileMin(data.tileMinPx));
    const [tileMax, setTileMax] = (0, import_react3.useState)(() => clampTileMax(data.tileMaxPx ?? 240, clampTileMin(data.tileMinPx)));
    const [tileFixed, setTileFixed] = (0, import_react3.useState)(() => data.tileFixed === true);
    (0, import_react3.useEffect)(() => {
      const d = parseData(config.data ?? config.apps);
      setApps(d.apps);
      setGroups(d.groups);
      setLayout(d.layout ?? "grid");
      setTileMin(clampTileMin(d.tileMinPx));
      setTileMax(clampTileMax(d.tileMaxPx ?? 240, clampTileMin(d.tileMinPx)));
      setTileFixed(d.tileFixed === true);
    }, [config.data, config.apps]);
    const saveAll = (a, g, nextLayout) => {
      const l = nextLayout ?? layout;
      setApps(a);
      setGroups(g);
      if (nextLayout !== void 0) setLayout(l);
      onChange("data", serializeBookmarkData(a, g, l, tileMin, tileMax, tileFixed));
    };
    const persistTiles = (next) => {
      const tm = clampTileMin(next.min ?? tileMin);
      const tx = clampTileMax(next.max ?? tileMax, tm);
      const tf = next.fixed ?? tileFixed;
      setTileMin(tm);
      setTileMax(tx);
      if (next.fixed !== void 0) setTileFixed(tf);
      onChange("data", serializeBookmarkData(apps, groups, layout, tm, tx, tf));
    };
    const startEdit = (app) => {
      setEditing(app.id);
      setEditData({ ...app });
    };
    const commitEdit = () => {
      if (!editing) return;
      saveAll(apps.map((a) => a.id === editing ? { ...a, ...editData } : a), groups);
      setEditing(null);
      setEditData({});
    };
    const addApp = (groupId) => {
      const n = { id: Date.now().toString(), name: de ? "Neue App" : "New app", url: "http://", icon: "\u{1F517}", newTab: true, group: groupId };
      saveAll([...apps, n], groups);
      startEdit(n);
    };
    const removeApp = (id) => {
      saveAll(apps.filter((a) => a.id !== id), groups);
      if (editing === id) setEditing(null);
    };
    const addGroup = () => {
      const g = { id: Date.now().toString(), name: de ? "Neue Gruppe" : "New group" };
      saveAll(apps, [...groups, g]);
    };
    const removeGroup = (id) => saveAll(apps.filter((a) => a.group !== id), groups.filter((g) => g.id !== id));
    const renameGroup = (id, name) => saveAll(apps, groups.map((g) => g.id === id ? { ...g, name } : g));
    const handleIconUpload = (file) => {
      const r = new FileReader();
      r.onload = (e) => setEditData((d) => ({ ...d, icon: e.target?.result }));
      r.readAsDataURL(file);
    };
    const onDragStart = (id) => setDragAppId(id);
    const onDragEnd = () => {
      setDragAppId(null);
      setDragOverId(null);
      setDragOverGroup(null);
    };
    const onDragOverApp = (e, targetId) => {
      e.preventDefault();
      setDragOverId(targetId);
    };
    const onDropOnApp = (targetId) => {
      if (!dragAppId || dragAppId === targetId) {
        onDragEnd();
        return;
      }
      const from = apps.findIndex((a) => a.id === dragAppId);
      const to = apps.findIndex((a) => a.id === targetId);
      const updated = [...apps];
      const [item] = updated.splice(from, 1);
      item.group = updated[Math.min(to, updated.length - 1)]?.group ?? item.group;
      updated.splice(to, 0, item);
      saveAll(updated, groups);
      onDragEnd();
    };
    const onDragOverGroup = (e, groupId) => {
      e.preventDefault();
      setDragOverGroup(groupId);
    };
    const onDropOnGroup = (groupId) => {
      if (!dragAppId) {
        onDragEnd();
        return;
      }
      saveAll(apps.map((a) => a.id === dragAppId ? { ...a, group: groupId } : a), groups);
      onDragEnd();
    };
    const inp = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", padding: "5px 8px", fontSize: "13px", outline: "none", width: "100%" };
    const layoutBtn = (active) => ({
      flex: 1,
      padding: "8px 10px",
      borderRadius: "8px",
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      background: active ? "var(--accent)22" : "var(--surface-2)",
      color: "var(--text)",
      fontSize: "12px",
      fontWeight: active ? 600 : 400,
      cursor: "pointer"
    });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }, children: de ? "Darstellung" : "Layout" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => saveAll(apps, groups, "grid"), style: layoutBtn(layout === "grid"), children: de ? "Raster (Kacheln f\xFCllen die Breite, weniger Spalten wenn schmal)" : "Grid (tiles grow to fill width; fewer columns when narrow)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => saveAll(apps, groups, "row"), style: layoutBtn(layout === "row"), children: de ? "Waagerecht (scrollbar)" : "Horizontal (scroll)" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { paddingTop: "14px", borderTop: "1px solid var(--border)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 8px" }, children: de ? "Kachelbreite" : "Tile width" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-end" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text)" }, children: [
            de ? "Min. (px)" : "Min (px)",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "number",
                min: 72,
                max: 240,
                step: 4,
                value: tileMin,
                onChange: (e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isFinite(n)) return;
                  persistTiles({ min: n });
                },
                style: { ...inp, width: "88px" }
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "label",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "12px",
                color: layout === "grid" && tileFixed ? "var(--text-muted)" : "var(--text)",
                opacity: layout === "grid" && tileFixed ? 0.6 : 1
              },
              title: layout === "grid" && tileFixed ? de ? "Bei festem Raster entspricht die Spaltenbreite der Mindestbreite." : "With fixed grid, column width equals min width." : void 0,
              children: [
                de ? "Max. (px)" : "Max (px)",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "number",
                    min: 112,
                    max: 400,
                    step: 4,
                    disabled: layout === "grid" && tileFixed,
                    value: tileMax,
                    onChange: (e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isFinite(n)) return;
                      persistTiles({ max: n });
                    },
                    style: { ...inp, width: "88px", opacity: layout === "grid" && tileFixed ? 0.7 : 1 }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text)", cursor: "pointer", paddingBottom: "6px", maxWidth: "320px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: tileFixed, onChange: (e) => persistTiles({ fixed: e.target.checked }) }),
            de ? "Feste Breite: Raster ohne Strecken; waagerecht gleich breite Kacheln." : "Fixed width: grid columns do not stretch; horizontal row uses equal tile width."
          ] })
        ] })
      ] }),
      groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            onDragOver: (e) => onDragOverGroup(e, group.id),
            onDrop: () => onDropOnGroup(group.id),
            style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "6px 8px", borderRadius: "8px", background: dragOverGroup === group.id ? "var(--accent)18" : "transparent", border: `1px dashed ${dragOverGroup === group.id ? "var(--accent)" : "transparent"}`, transition: "all 0.15s" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: { ...inp, fontWeight: 600, flex: 1, background: "transparent", border: "1px solid var(--border)" },
                  value: group.name,
                  onChange: (e) => renameGroup(group.id, e.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: () => addApp(group.id),
                  style: { background: "var(--accent)", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 13 })
                }
              ),
              groups.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: () => removeGroup(group.id),
                  style: { background: "none", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 7px", cursor: "pointer", color: "var(--text-muted)", display: "flex" },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "4px" }, children: [
          apps.filter((a) => a.group === group.id).map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: editing === app.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: "40px", height: "40px", borderRadius: "8px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppIcon, { icon: editData.icon || "\u{1F517}" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: { ...inp, fontSize: "18px", textAlign: "center" },
                  value: editData.icon?.startsWith("data:") ? "" : editData.icon || "",
                  onChange: (e) => setEditData((d) => ({ ...d, icon: e.target.value })),
                  placeholder: "Emoji"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: () => fileRef.current?.click(),
                  style: { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, display: "flex" },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 13 })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  ref: fileRef,
                  type: "file",
                  accept: "image/*",
                  style: { display: "none" },
                  onChange: (e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { style: inp, value: editData.group || group.id, onChange: (e) => setEditData((d) => ({ ...d, group: e.target.value })), children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: g.id, children: g.name }, g.id)) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: editData.name || "", onChange: (e) => setEditData((d) => ({ ...d, name: e.target.value })), placeholder: de ? "App-Name" : "App name" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: editData.url || "", onChange: (e) => setEditData((d) => ({ ...d, url: e.target.value })), placeholder: "http://192.168.1.x:port" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text)", cursor: "pointer" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: editData.newTab ?? true, onChange: (e) => setEditData((d) => ({ ...d, newTab: e.target.checked })) }),
                de ? "Neuer Tab" : "New tab"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "6px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setEditing(null), style: { background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "var(--text-muted)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: commitEdit, style: { background: "var(--accent)", border: "none", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 13 }),
                  " OK"
                ] })
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              draggable: true,
              onDragStart: () => onDragStart(app.id),
              onDragEnd,
              onDragOver: (e) => onDragOverApp(e, app.id),
              onDrop: () => onDropOnApp(app.id),
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: dragOverId === app.id ? "var(--accent)11" : "var(--surface-2)",
                border: `1px solid ${dragOverId === app.id ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "8px",
                padding: "8px 10px",
                cursor: "grab",
                transition: "all 0.12s",
                opacity: dragAppId === app.id ? 0.4 : 1
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 14, style: { color: "var(--text-muted)", flexShrink: 0 } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppIcon, { icon: app.icon }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "13px", fontWeight: 500, color: "var(--text)", margin: 0 }, children: app.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: app.url })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }, children: app.newTab ? "\u2197" : "\u2192" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => startEdit(app), style: { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 13 }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => removeApp(app.id), style: { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 }) })
              ]
            }
          ) }, app.id)),
          apps.filter((a) => a.group === group.id).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "8px", fontStyle: "italic" }, children: de ? "Gruppe ist leer \u2014 App hinzuf\xFCgen oder hierher ziehen" : "Group is empty \u2014 add an app or drag here" })
        ] })
      ] }, group.id)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: addGroup, style: { width: "100%", background: "var(--surface-2)", border: "1px dashed var(--border)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { size: 14 }),
        " ",
        de ? "Gruppe hinzuf\xFCgen" : "Add group"
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/bookmarks.tsx
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
lucide-react/dist/esm/icons/check.js:
lucide-react/dist/esm/icons/external-link.js:
lucide-react/dist/esm/icons/folder-plus.js:
lucide-react/dist/esm/icons/grip-vertical.js:
lucide-react/dist/esm/icons/pen-line.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/upload.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
