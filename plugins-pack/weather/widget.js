if(!globalThis.SelfDashboard?.React)throw new Error('SelfDashboard bridge missing — reload page');if(!globalThis.SelfDashboard?.ReactDOM?.createPortal)throw new Error('SelfDashboard.ReactDOM missing — reload page');
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

  // node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
  var require_use_sync_external_store_shim_development = __commonJS({
    "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports) {
      "use strict";
      (function() {
        function is(x, y) {
          return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
        }
        function useSyncExternalStore$2(subscribe, getSnapshot) {
          didWarnOld18Alpha || void 0 === React.startTransition || (didWarnOld18Alpha = true, console.error(
            "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
          ));
          var value = getSnapshot();
          if (!didWarnUncachedGetSnapshot) {
            var cachedValue = getSnapshot();
            objectIs(value, cachedValue) || (console.error(
              "The result of getSnapshot should be cached to avoid an infinite loop"
            ), didWarnUncachedGetSnapshot = true);
          }
          cachedValue = useState2({
            inst: { value, getSnapshot }
          });
          var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
          useLayoutEffect2(
            function() {
              inst.value = value;
              inst.getSnapshot = getSnapshot;
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            },
            [subscribe, value, getSnapshot]
          );
          useEffect2(
            function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
              return subscribe(function() {
                checkIfSnapshotChanged(inst) && forceUpdate({ inst });
              });
            },
            [subscribe]
          );
          useDebugValue2(value);
          return value;
        }
        function checkIfSnapshotChanged(inst) {
          var latestGetSnapshot = inst.getSnapshot;
          inst = inst.value;
          try {
            var nextValue = latestGetSnapshot();
            return !objectIs(inst, nextValue);
          } catch (error) {
            return true;
          }
        }
        function useSyncExternalStore$1(subscribe, getSnapshot) {
          return getSnapshot();
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState2 = React.useState, useEffect2 = React.useEffect, useLayoutEffect2 = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
        exports.useSyncExternalStore = void 0 !== React.useSyncExternalStore ? React.useSyncExternalStore : shim;
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // node_modules/use-sync-external-store/shim/index.js
  var require_shim = __commonJS({
    "node_modules/use-sync-external-store/shim/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_use_sync_external_store_shim_development();
      }
    }
  });

  // node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
  var require_with_selector_development = __commonJS({
    "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js"(exports) {
      "use strict";
      (function() {
        function is(x, y) {
          return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef2 = React.useRef, useEffect2 = React.useEffect, useMemo2 = React.useMemo, useDebugValue2 = React.useDebugValue;
        exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
          var instRef = useRef2(null);
          if (null === instRef.current) {
            var inst = { hasValue: false, value: null };
            instRef.current = inst;
          } else inst = instRef.current;
          instRef = useMemo2(
            function() {
              function memoizedSelector(nextSnapshot) {
                if (!hasMemo) {
                  hasMemo = true;
                  memoizedSnapshot = nextSnapshot;
                  nextSnapshot = selector(nextSnapshot);
                  if (void 0 !== isEqual && inst.hasValue) {
                    var currentSelection = inst.value;
                    if (isEqual(currentSelection, nextSnapshot))
                      return memoizedSelection = currentSelection;
                  }
                  return memoizedSelection = nextSnapshot;
                }
                currentSelection = memoizedSelection;
                if (objectIs(memoizedSnapshot, nextSnapshot))
                  return currentSelection;
                var nextSelection = selector(nextSnapshot);
                if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                  return memoizedSnapshot = nextSnapshot, currentSelection;
                memoizedSnapshot = nextSnapshot;
                return memoizedSelection = nextSelection;
              }
              var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
              return [
                function() {
                  return memoizedSelector(getSnapshot());
                },
                null === maybeGetServerSnapshot ? void 0 : function() {
                  return memoizedSelector(maybeGetServerSnapshot());
                }
              ];
            },
            [getSnapshot, getServerSnapshot, selector, isEqual]
          );
          var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
          useEffect2(
            function() {
              inst.hasValue = true;
              inst.value = value;
            },
            [value]
          );
          useDebugValue2(value);
          return value;
        };
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // node_modules/use-sync-external-store/shim/with-selector.js
  var require_with_selector = __commonJS({
    "node_modules/use-sync-external-store/shim/with-selector.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_with_selector_development();
      }
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

  // ../plugins/weather/index.tsx
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

  // node_modules/zustand/esm/vanilla.mjs
  var import_meta = {};
  var createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const destroy = () => {
      if ((import_meta.env ? import_meta.env.MODE : void 0) !== "production") {
        console.warn(
          "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
        );
      }
      listeners.clear();
    };
    const api = { setState, getState, getInitialState, subscribe, destroy };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

  // node_modules/zustand/esm/index.mjs
  var import_react3 = __toESM(require_react(), 1);
  var import_with_selector = __toESM(require_with_selector(), 1);
  var import_meta2 = {};
  var { useDebugValue } = import_react3.default;
  var { useSyncExternalStoreWithSelector } = import_with_selector.default;
  var didWarnAboutEqualityFn = false;
  var identity = (arg) => arg;
  function useStore(api, selector = identity, equalityFn) {
    if ((import_meta2.env ? import_meta2.env.MODE : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
      console.warn(
        "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
      );
      didWarnAboutEqualityFn = true;
    }
    const slice = useSyncExternalStoreWithSelector(
      api.subscribe,
      api.getState,
      api.getServerState || api.getInitialState,
      selector,
      equalityFn
    );
    useDebugValue(slice);
    return slice;
  }
  var createImpl = (createState) => {
    if ((import_meta2.env ? import_meta2.env.MODE : void 0) !== "production" && typeof createState !== "function") {
      console.warn(
        "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
      );
    }
    const api = typeof createState === "function" ? createStore(createState) : createState;
    const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  var create = (createState) => createState ? createImpl(createState) : createImpl;

  // node_modules/zustand/esm/middleware.mjs
  var import_meta3 = {};
  function createJSONStorage(getStorage, options) {
    let storage;
    try {
      storage = getStorage();
    } catch (_e) {
      return;
    }
    const persistStorage = {
      getItem: (name) => {
        var _a;
        const parse = (str22) => {
          if (str22 === null) {
            return null;
          }
          return JSON.parse(str22, options == null ? void 0 : options.reviver);
        };
        const str2 = (_a = storage.getItem(name)) != null ? _a : null;
        if (str2 instanceof Promise) {
          return str2.then(parse);
        }
        return parse(str2);
      },
      setItem: (name, newValue) => storage.setItem(
        name,
        JSON.stringify(newValue, options == null ? void 0 : options.replacer)
      ),
      removeItem: (name) => storage.removeItem(name)
    };
    return persistStorage;
  }
  var toThenable = (fn) => (input) => {
    try {
      const result = fn(input);
      if (result instanceof Promise) {
        return result;
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result);
        },
        catch(_onRejected) {
          return this;
        }
      };
    } catch (e) {
      return {
        then(_onFulfilled) {
          return this;
        },
        catch(onRejected) {
          return toThenable(onRejected)(e);
        }
      };
    }
  };
  var oldImpl = (config, baseOptions) => (set, get, api) => {
    let options = {
      getStorage: () => localStorage,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      partialize: (state) => state,
      version: 0,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState
      }),
      ...baseOptions
    };
    let hasHydrated = false;
    const hydrationListeners = /* @__PURE__ */ new Set();
    const finishHydrationListeners = /* @__PURE__ */ new Set();
    let storage;
    try {
      storage = options.getStorage();
    } catch (_e) {
    }
    if (!storage) {
      return config(
        (...args) => {
          console.warn(
            `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
          );
          set(...args);
        },
        get,
        api
      );
    }
    const thenableSerialize = toThenable(options.serialize);
    const setItem = () => {
      const state = options.partialize({ ...get() });
      let errorInSync;
      const thenable = thenableSerialize({ state, version: options.version }).then(
        (serializedValue) => storage.setItem(options.name, serializedValue)
      ).catch((e) => {
        errorInSync = e;
      });
      if (errorInSync) {
        throw errorInSync;
      }
      return thenable;
    };
    const savedSetState = api.setState;
    api.setState = (state, replace) => {
      savedSetState(state, replace);
      void setItem();
    };
    const configResult = config(
      (...args) => {
        set(...args);
        void setItem();
      },
      get,
      api
    );
    let stateFromStorage;
    const hydrate = () => {
      var _a;
      if (!storage) return;
      hasHydrated = false;
      hydrationListeners.forEach((cb) => cb(get()));
      const postRehydrationCallback = ((_a = options.onRehydrateStorage) == null ? void 0 : _a.call(options, get())) || void 0;
      return toThenable(storage.getItem.bind(storage))(options.name).then((storageValue) => {
        if (storageValue) {
          return options.deserialize(storageValue);
        }
      }).then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
            if (options.migrate) {
              return options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              );
            }
            console.error(
              `State loaded from storage couldn't be migrated since no migrate function was provided`
            );
          } else {
            return deserializedStorageValue.state;
          }
        }
      }).then((migratedState) => {
        var _a2;
        stateFromStorage = options.merge(
          migratedState,
          (_a2 = get()) != null ? _a2 : configResult
        );
        set(stateFromStorage, true);
        return setItem();
      }).then(() => {
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
        hasHydrated = true;
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
      }).catch((e) => {
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
      });
    };
    api.persist = {
      setOptions: (newOptions) => {
        options = {
          ...options,
          ...newOptions
        };
        if (newOptions.getStorage) {
          storage = newOptions.getStorage();
        }
      },
      clearStorage: () => {
        storage == null ? void 0 : storage.removeItem(options.name);
      },
      getOptions: () => options,
      rehydrate: () => hydrate(),
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        hydrationListeners.add(cb);
        return () => {
          hydrationListeners.delete(cb);
        };
      },
      onFinishHydration: (cb) => {
        finishHydrationListeners.add(cb);
        return () => {
          finishHydrationListeners.delete(cb);
        };
      }
    };
    hydrate();
    return stateFromStorage || configResult;
  };
  var newImpl = (config, baseOptions) => (set, get, api) => {
    let options = {
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => state,
      version: 0,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState
      }),
      ...baseOptions
    };
    let hasHydrated = false;
    const hydrationListeners = /* @__PURE__ */ new Set();
    const finishHydrationListeners = /* @__PURE__ */ new Set();
    let storage = options.storage;
    if (!storage) {
      return config(
        (...args) => {
          console.warn(
            `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
          );
          set(...args);
        },
        get,
        api
      );
    }
    const setItem = () => {
      const state = options.partialize({ ...get() });
      return storage.setItem(options.name, {
        state,
        version: options.version
      });
    };
    const savedSetState = api.setState;
    api.setState = (state, replace) => {
      savedSetState(state, replace);
      void setItem();
    };
    const configResult = config(
      (...args) => {
        set(...args);
        void setItem();
      },
      get,
      api
    );
    api.getInitialState = () => configResult;
    let stateFromStorage;
    const hydrate = () => {
      var _a, _b;
      if (!storage) return;
      hasHydrated = false;
      hydrationListeners.forEach((cb) => {
        var _a2;
        return cb((_a2 = get()) != null ? _a2 : configResult);
      });
      const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
      return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
            if (options.migrate) {
              return [
                true,
                options.migrate(
                  deserializedStorageValue.state,
                  deserializedStorageValue.version
                )
              ];
            }
            console.error(
              `State loaded from storage couldn't be migrated since no migrate function was provided`
            );
          } else {
            return [false, deserializedStorageValue.state];
          }
        }
        return [false, void 0];
      }).then((migrationResult) => {
        var _a2;
        const [migrated2, migratedState] = migrationResult;
        stateFromStorage = options.merge(
          migratedState,
          (_a2 = get()) != null ? _a2 : configResult
        );
        set(stateFromStorage, true);
        if (migrated2) {
          return setItem();
        }
      }).then(() => {
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
        stateFromStorage = get();
        hasHydrated = true;
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
      }).catch((e) => {
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
      });
    };
    api.persist = {
      setOptions: (newOptions) => {
        options = {
          ...options,
          ...newOptions
        };
        if (newOptions.storage) {
          storage = newOptions.storage;
        }
      },
      clearStorage: () => {
        storage == null ? void 0 : storage.removeItem(options.name);
      },
      getOptions: () => options,
      rehydrate: () => hydrate(),
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        hydrationListeners.add(cb);
        return () => {
          hydrationListeners.delete(cb);
        };
      },
      onFinishHydration: (cb) => {
        finishHydrationListeners.add(cb);
        return () => {
          finishHydrationListeners.delete(cb);
        };
      }
    };
    if (!options.skipHydration) {
      hydrate();
    }
    return stateFromStorage || configResult;
  };
  var persistImpl = (config, baseOptions) => {
    if ("getStorage" in baseOptions || "serialize" in baseOptions || "deserialize" in baseOptions) {
      if ((import_meta3.env ? import_meta3.env.MODE : void 0) !== "production") {
        console.warn(
          "[DEPRECATED] `getStorage`, `serialize` and `deserialize` options are deprecated. Use `storage` option instead."
        );
      }
      return oldImpl(config, baseOptions);
    }
    return newImpl(config, baseOptions);
  };
  var persist = persistImpl;

  // src/lib/dashboardStatePayload.ts
  function pickPersistedDashboardState(s) {
    return {
      dashboards: s.dashboards,
      activeDashboardId: s.activeDashboardId,
      locale: s.locale,
      editMode: s.editMode,
      showDashboardTabs: s.showDashboardTabs,
      navbarStyle: s.navbarStyle,
      dashboardZoom: s.dashboardZoom,
      gridGap: s.gridGap,
      gridPadding: s.gridPadding,
      navbarSearchEnabled: s.navbarSearchEnabled,
      navbarSearchPosition: s.navbarSearchPosition,
      navbarSearchProviders: s.navbarSearchProviders,
      navbarSearchLastProvider: s.navbarSearchLastProvider,
      navbarSearchWidthPx: s.navbarSearchWidthPx,
      navbarSearchCustomProviders: s.navbarSearchCustomProviders ?? [],
      kioskModeEnabled: s.kioskModeEnabled === true,
      kioskModeIdleSeconds: typeof s.kioskModeIdleSeconds === "number" && Number.isFinite(s.kioskModeIdleSeconds) ? Math.min(60, Math.max(3, Math.round(s.kioskModeIdleSeconds))) : 5
    };
  }

  // src/lib/removedPlugins.ts
  var REMOVED_PLUGIN_IDS = /* @__PURE__ */ new Set(["crowdsec-threat-map"]);
  function stripRemovedPlugins(dashboards) {
    return dashboards.map((d) => ({
      ...d,
      plugins: d.plugins.filter((p) => !REMOVED_PLUGIN_IDS.has(p.pluginId))
    }));
  }

  // src/lib/searchProviders.ts
  var SEARCH_PROVIDER_LIST = [
    {
      id: "google",
      label: { en: "Google", de: "Google" },
      buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
    },
    {
      id: "duckduckgo",
      label: { en: "DuckDuckGo", de: "DuckDuckGo" },
      buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
    },
    {
      id: "bing",
      label: { en: "Bing", de: "Bing" },
      buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
    },
    {
      id: "brave",
      label: { en: "Brave", de: "Brave" },
      buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
    },
    {
      id: "ecosia",
      label: { en: "Ecosia", de: "Ecosia" },
      buildUrl: (q) => `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(q)}`
    },
    {
      id: "wikipedia-de",
      label: { en: "Wiki DE", de: "Wiki DE" },
      buildUrl: (q) => `https://de.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`
    },
    {
      id: "wikipedia-en",
      label: { en: "Wiki EN", de: "Wiki EN" },
      buildUrl: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`
    }
  ];
  var SEARCH_PROVIDER_IDS = SEARCH_PROVIDER_LIST.map((p) => p.id);
  function defaultSearchProviders() {
    return {
      google: true,
      duckduckgo: true,
      bing: false,
      brave: false,
      ecosia: false,
      "wikipedia-de": false,
      "wikipedia-en": false
    };
  }
  function normalizeSearchProviders(raw) {
    const base = defaultSearchProviders();
    if (!raw || typeof raw !== "object") return base;
    const o = raw;
    for (const id of SEARCH_PROVIDER_IDS) {
      if (typeof o[id] === "boolean") base[id] = o[id];
    }
    return base;
  }
  var CUSTOM_SEARCH_ID_PREFIX = "custom_";
  function newCustomSearchProviderId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${CUSTOM_SEARCH_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "")}`;
    }
    return `${CUSTOM_SEARCH_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
  function isHttpHttpsUrl(u) {
    try {
      const url = new URL(u);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
  function buildCustomSearchUrl(template, query) {
    const raw = template.trim();
    const term = query.trim();
    if (!raw || !term) return null;
    if (!/\{q\}|%s/i.test(raw)) return null;
    const enc = encodeURIComponent(term);
    const joined = raw.includes("{q}") ? raw.split("{q}").join(enc) : raw.replace("%s", enc);
    if (!isHttpHttpsUrl(joined)) return null;
    return joined;
  }
  function normalizeCustomSearchProviders(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const x of raw) {
      if (!x || typeof x !== "object" || Array.isArray(x)) continue;
      const o = x;
      const id = typeof o.id === "string" ? o.id.trim() : "";
      if (!id.startsWith(CUSTOM_SEARCH_ID_PREFIX) || id.length > 80) continue;
      const name = typeof o.name === "string" ? o.name.trim().slice(0, 80) : "";
      const urlTemplate = typeof o.urlTemplate === "string" ? o.urlTemplate.trim().slice(0, 2e3) : "";
      if (!name || !urlTemplate) continue;
      if (!/\{q\}|%s/i.test(urlTemplate)) continue;
      const enabled = o.enabled === false ? false : true;
      out.push({ id, name, urlTemplate, enabled });
      if (out.length >= 20) break;
    }
    return out;
  }
  function firstEnabledSearchTargetId(builtin, customs, fallback = "duckduckgo") {
    for (const id of SEARCH_PROVIDER_IDS) {
      if (builtin[id]) return id;
    }
    const c = customs.find((x) => x.enabled);
    if (c) return c.id;
    return fallback;
  }
  function isSearchTargetEnabled(id, builtin, customs) {
    if (SEARCH_PROVIDER_IDS.includes(id)) {
      return Boolean(builtin[id]);
    }
    const c = customs.find((x) => x.id === id);
    return Boolean(c?.enabled);
  }

  // src/lib/store.ts
  var DEFAULT_DASHBOARD = {
    id: "home",
    name: "Home",
    icon: "\u{1F3E0}",
    plugins: [],
    theme: "dark"
  };
  function migrateOldStore() {
    try {
      const old = localStorage.getItem("selfdashboard-config");
      if (!old) return null;
      const parsed = JSON.parse(old);
      if (!parsed?.state) return null;
      const s = parsed.state;
      return [{ id: "home", name: s.title ?? "Home", icon: "\u{1F3E0}", theme: s.theme ?? "dark", customColors: s.customColors, customLogo: s.customLogo, plugins: s.plugins ?? [] }];
    } catch {
      return null;
    }
  }
  function makeId(name, existing) {
    const base = name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "dashboard";
    if (!existing.includes(base)) return base;
    let i = 2;
    while (existing.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }
  var migrated = typeof window !== "undefined" ? migrateOldStore() : null;
  var useDashboardStore = create()(
    persist(
      (set, get) => ({
        dashboards: migrated ?? [DEFAULT_DASHBOARD],
        activeDashboardId: migrated?.[0]?.id ?? "home",
        locale: "de",
        editMode: false,
        showDashboardTabs: true,
        navbarStyle: "icon-text",
        dashboardZoom: 1,
        gridGap: 8,
        gridPadding: 12,
        navbarSearchEnabled: false,
        navbarSearchPosition: "center",
        navbarSearchProviders: defaultSearchProviders(),
        navbarSearchLastProvider: "duckduckgo",
        navbarSearchWidthPx: 320,
        navbarSearchCustomProviders: [],
        kioskModeEnabled: false,
        kioskModeIdleSeconds: 5,
        activeDashboard: () => {
          const s = get();
          const found = s.dashboards.find((d) => d.id === s.activeDashboardId);
          if (found) return found;
          if (s.dashboards[0]) return s.dashboards[0];
          return DEFAULT_DASHBOARD;
        },
        addDashboard: (name, icon) => {
          const existing = get().dashboards.map((d) => d.id);
          const id = makeId(name, existing);
          const newDash = { id, name, icon, theme: "dark", plugins: [] };
          set((s) => ({ dashboards: [...s.dashboards, newDash], activeDashboardId: id }));
          return id;
        },
        removeDashboard: (id) => set((s) => {
          const remaining = s.dashboards.filter((d) => d.id !== id);
          if (remaining.length === 0) return s;
          return { dashboards: remaining, activeDashboardId: s.activeDashboardId === id ? remaining[0].id : s.activeDashboardId };
        }),
        updateDashboard: (id, patch) => set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, ...patch } : d) })),
        setActiveDashboard: (id) => set({ activeDashboardId: id }),
        setLocale: (locale) => set({ locale }),
        setEditMode: (editMode) => set({ editMode }),
        setShowDashboardTabs: (showDashboardTabs) => set({ showDashboardTabs }),
        setNavbarStyle: (navbarStyle) => set({ navbarStyle }),
        setDashboardZoom: (raw) => {
          const n = typeof raw === "number" ? raw : Number(raw);
          const z = Number.isFinite(n) ? Math.round(n * 10) / 10 : 1;
          set({ dashboardZoom: Math.min(1.5, Math.max(0.6, z)) });
        },
        setGridGap: (gridGap) => set({ gridGap }),
        setGridPadding: (gridPadding) => set({ gridPadding }),
        setTheme: (theme) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, theme } : d) }));
        },
        setTitle: (name) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, name } : d) }));
        },
        setCustomLogo: (customLogo) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customLogo } : d) }));
        },
        setCustomColors: (colors) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: { ...d.customColors, ...colors } } : d) }));
        },
        resetCustomColors: () => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, customColors: void 0 } : d) }));
        },
        addPlugin: (instance) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: [...d.plugins, instance] } : d) }));
        },
        removePlugin: (instanceId) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.filter((p) => p.instanceId !== instanceId) } : d) }));
        },
        updatePluginConfig: (instanceId, config) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, config: { ...p.config, ...config } } : p) } : d) }));
        },
        updatePluginLayout: (instanceId, layout) => {
          const id = get().activeDashboardId;
          set((s) => ({ dashboards: s.dashboards.map((d) => d.id === id ? { ...d, plugins: d.plugins.map((p) => p.instanceId === instanceId ? { ...p, layout } : p) } : d) }));
        },
        updatePluginLayoutPhone: (instanceId, patch) => {
          const id = get().activeDashboardId;
          set((s) => ({
            dashboards: s.dashboards.map((d) => {
              if (d.id !== id) return d;
              return {
                ...d,
                plugins: d.plugins.map((p) => {
                  if (p.instanceId !== instanceId) return p;
                  const merged = { ...p.layoutPhone ?? {}, ...patch };
                  const cleaned = Object.fromEntries(
                    Object.entries(merged).filter(([, v]) => v !== void 0)
                  );
                  return Object.keys(cleaned).length > 0 ? { ...p, layoutPhone: cleaned } : { ...p, layoutPhone: void 0 };
                })
              };
            })
          }));
        },
        updatePluginLayoutTablet: (instanceId, patch) => {
          const id = get().activeDashboardId;
          set((s) => ({
            dashboards: s.dashboards.map((d) => {
              if (d.id !== id) return d;
              return {
                ...d,
                plugins: d.plugins.map((p) => {
                  if (p.instanceId !== instanceId) return p;
                  const merged = { ...p.layoutTablet ?? {}, ...patch };
                  const cleaned = Object.fromEntries(
                    Object.entries(merged).filter(([, v]) => v !== void 0)
                  );
                  return Object.keys(cleaned).length > 0 ? { ...p, layoutTablet: cleaned } : { ...p, layoutTablet: void 0 };
                })
              };
            })
          }));
        },
        setPluginResponsiveLayouts: (instanceId, layouts) => {
          const id = get().activeDashboardId;
          set((s) => ({
            dashboards: s.dashboards.map((d) => {
              if (d.id !== id) return d;
              return {
                ...d,
                plugins: d.plugins.map((p) => {
                  if (p.instanceId !== instanceId) return p;
                  let next = { ...p };
                  if ("layoutPhone" in layouts) {
                    if (layouts.layoutPhone === null) next = { ...next, layoutPhone: void 0 };
                    else if (layouts.layoutPhone !== void 0) {
                      const lp = layouts.layoutPhone;
                      next = Object.keys(lp).length > 0 ? { ...next, layoutPhone: lp } : { ...next, layoutPhone: void 0 };
                    }
                  }
                  if ("layoutTablet" in layouts) {
                    if (layouts.layoutTablet === null) next = { ...next, layoutTablet: void 0 };
                    else if (layouts.layoutTablet !== void 0) {
                      const lt = layouts.layoutTablet;
                      next = Object.keys(lt).length > 0 ? { ...next, layoutTablet: lt } : { ...next, layoutTablet: void 0 };
                    }
                  }
                  return next;
                })
              };
            })
          }));
        },
        setNavbarSearchEnabled: (navbarSearchEnabled) => set({ navbarSearchEnabled }),
        setNavbarSearchPosition: (navbarSearchPosition) => set({ navbarSearchPosition }),
        setNavbarSearchProviderEnabled: (id, enabled) => set((s) => {
          const next = { ...s.navbarSearchProviders, [id]: enabled };
          const last = s.navbarSearchLastProvider;
          const customs = s.navbarSearchCustomProviders;
          const stillOk = isSearchTargetEnabled(last, next, customs);
          const nextLast = stillOk ? last : firstEnabledSearchTargetId(next, customs);
          return { navbarSearchProviders: next, navbarSearchLastProvider: nextLast };
        }),
        setNavbarSearchCustomProviderEnabled: (id, enabled) => set((s) => {
          const customs = s.navbarSearchCustomProviders.map((c) => c.id === id ? { ...c, enabled } : c);
          const last = s.navbarSearchLastProvider;
          const stillOk = isSearchTargetEnabled(last, s.navbarSearchProviders, customs);
          const nextLast = stillOk ? last : firstEnabledSearchTargetId(s.navbarSearchProviders, customs);
          return { navbarSearchCustomProviders: customs, navbarSearchLastProvider: nextLast };
        }),
        setNavbarSearchLastProvider: (navbarSearchLastProvider) => set({ navbarSearchLastProvider }),
        setNavbarSearchWidthPx: (raw) => {
          const n = typeof raw === "number" ? raw : Number(raw);
          const w = Number.isFinite(n) ? Math.round(n) : 320;
          set({ navbarSearchWidthPx: Math.min(920, Math.max(200, w)) });
        },
        addNavbarSearchCustomProvider: (name, urlTemplate) => {
          const n = name.trim().slice(0, 80);
          const u = urlTemplate.trim();
          if (!n || !u) return false;
          if (!/\{q\}|%s/i.test(u)) return false;
          if (buildCustomSearchUrl(u, "test") == null) return false;
          if (get().navbarSearchCustomProviders.length >= 20) return false;
          const id = newCustomSearchProviderId();
          set((s) => ({
            navbarSearchCustomProviders: [...s.navbarSearchCustomProviders, { id, name: n, urlTemplate: u, enabled: true }],
            navbarSearchLastProvider: id
          }));
          return true;
        },
        removeNavbarSearchCustomProvider: (id) => set((s) => {
          const customs = s.navbarSearchCustomProviders.filter((c) => c.id !== id);
          const last = s.navbarSearchLastProvider;
          const stillOk = isSearchTargetEnabled(last, s.navbarSearchProviders, customs);
          const nextLast = stillOk ? last : firstEnabledSearchTargetId(s.navbarSearchProviders, customs);
          return { navbarSearchCustomProviders: customs, navbarSearchLastProvider: nextLast };
        }),
        setKioskModeEnabled: (kioskModeEnabled) => set({ kioskModeEnabled }),
        setKioskModeIdleSeconds: (raw) => {
          const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : 5;
          set({ kioskModeIdleSeconds: Math.min(60, Math.max(3, n)) });
        }
      }),
      {
        name: "selfdashboard-v2",
        partialize: (state) => pickPersistedDashboardState(state),
        onRehydrateStorage: () => (state) => {
          if (state && state.dashboards.length === 0) {
            const m = migrateOldStore();
            if (m) {
              state.dashboards = m;
              state.activeDashboardId = m[0].id;
            }
          }
          if (state) {
            const z = state.dashboardZoom;
            if (typeof z !== "number" || !Number.isFinite(z)) {
              const n = Number(z);
              state.dashboardZoom = Number.isFinite(n) ? Math.min(1.5, Math.max(0.6, Math.round(n * 10) / 10)) : 1;
            }
            if (typeof state.navbarSearchEnabled !== "boolean") state.navbarSearchEnabled = false;
            if (state.navbarSearchPosition !== "left" && state.navbarSearchPosition !== "center" && state.navbarSearchPosition !== "right") {
              state.navbarSearchPosition = "center";
            }
            state.navbarSearchProviders = normalizeSearchProviders(state.navbarSearchProviders);
            state.navbarSearchCustomProviders = normalizeCustomSearchProviders(
              state.navbarSearchCustomProviders
            );
            const customs = state.navbarSearchCustomProviders;
            const last = String(state.navbarSearchLastProvider ?? "");
            if (!last || !isSearchTargetEnabled(last, state.navbarSearchProviders, customs)) {
              state.navbarSearchLastProvider = firstEnabledSearchTargetId(state.navbarSearchProviders, customs);
            }
            const w = state.navbarSearchWidthPx;
            if (typeof w !== "number" || !Number.isFinite(w)) {
              state.navbarSearchWidthPx = 320;
            } else {
              state.navbarSearchWidthPx = Math.min(920, Math.max(200, Math.round(w)));
            }
            if (typeof state.kioskModeEnabled !== "boolean") state.kioskModeEnabled = false;
            const idle = state.kioskModeIdleSeconds;
            if (typeof idle !== "number" || !Number.isFinite(idle)) {
              state.kioskModeIdleSeconds = 5;
            } else {
              state.kioskModeIdleSeconds = Math.min(60, Math.max(3, Math.round(idle)));
            }
            state.dashboards = stripRemovedPlugins(state.dashboards);
          }
        }
      }
    )
  );

  // ../plugins/weather/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "weather",
    name: "Weather",
    description: "Stadt oder PLZ \u2014 aktuelles Wetter plus optional st\xFCndlicher Tagesverlauf (Open-Meteo). Ort ausblendbar, Skalierung der Stunden-Karten. Kein API-Key.",
    version: "1.3.0",
    author: "SelfDashboard",
    category: "utility",
    icon: "\u{1F324}\uFE0F",
    /** Gestapelte Ansicht: +2 Zeilen für Tagesverlauf unter dem aktuellen Block. */
    stackedExtraH: 2,
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
        key: "showDayTimeline",
        label: "Tagesverlauf (st\xFCndlich)",
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
        key: "dayTimelineWidthPct",
        label: "Tagesverlauf: Kartenbreite (%)",
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
  function clampDayTimelineWidthPct(v) {
    const n = Math.round(num(v, 100));
    return Math.min(130, Math.max(70, n));
  }
  function cfgShowDayTimeline(raw) {
    const v = raw.showDayTimeline;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    const leg = raw.showDailyForecast;
    if (leg === false || leg === "false" || leg === 0 || leg === "0") return false;
    if (leg === true || leg === "true" || leg === 1 || leg === "1") return true;
    return true;
  }
  function cfgDayTimelineWidthPct(raw) {
    return clampDayTimelineWidthPct(raw.dayTimelineWidthPct ?? raw.dailyForecastWidthPct);
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
  async function geocode(query, countryCode, signal, lang) {
    const params = new URLSearchParams({
      name: query,
      count: "8",
      language: lang,
      format: "json"
    });
    const cc = countryCode.trim().toUpperCase();
    if (cc.length === 2) params.set("countryCode", cc);
    const j = await pluginApiJson(
      "weather",
      `/api/weather?action=geocode&${params}`,
      { signal, cache: "no-store" }
    );
    const first = j.results?.[0];
    if (!first) return null;
    return first;
  }
  function parseHourlyTimeline(j, de, maxSlots = 12) {
    const h = j.hourly;
    if (!h?.time?.length) return [];
    const codes = h.weather_code ?? [];
    const temps = h.temperature_2m ?? [];
    const days = h.is_day ?? [];
    const now = Date.now();
    const raw = [];
    const n = Math.min(h.time.length, codes.length, temps.length);
    for (let i = 0; i < n; i++) {
      const timeIso = h.time[i];
      const t = new Date(timeIso).getTime();
      if (!Number.isFinite(t) || t < now - 90 * 6e4) continue;
      const temp = num(temps[i], NaN);
      if (!Number.isFinite(temp)) continue;
      const isDay = num(days[i], 1) === 1;
      raw.push({
        timeIso,
        hourLabel: new Date(timeIso).toLocaleTimeString(de ? "de-DE" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        temp,
        code: num(codes[i], 0),
        isDay
      });
    }
    if (raw.length <= maxSlots) return raw;
    const out = [];
    const step = (raw.length - 1) / (maxSlots - 1);
    for (let i = 0; i < maxSlots; i++) {
      out.push(raw[Math.round(i * step)]);
    }
    return out;
  }
  async function fetchForecast(lat, lon, signal, de, includeHourly) {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      timezone: "auto",
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m"
    });
    if (includeHourly) {
      params.set("includeHourly", "1");
    }
    const j = await pluginApiJson(
      "weather",
      `/api/weather?action=forecast&${params}`,
      { signal, cache: "no-store" }
    );
    if (!j.current) throw new Error(de ? "Keine aktuellen Werte" : "No current values");
    const hourly = includeHourly ? parseHourlyTimeline(j, de) : [];
    return { current: j.current, hourly };
  }
  var WEATHER_SPLIT_MIN_PX = 420;
  function Widget({ config }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const locationQuery = str(config.locationQuery);
    const countryCode = str(config.countryCode);
    const refreshMinutes = clampRefresh(config.refreshMinutes);
    const cfgRaw = config;
    const showDayTimeline = cfgShowDayTimeline(cfgRaw);
    const showPlaceLabel = cfgRaw.showPlaceLabel !== false;
    const timelineScale = cfgDayTimelineWidthPct(cfgRaw) / 100;
    const [placeLabel, setPlaceLabel] = (0, import_react4.useState)(null);
    const [current, setCurrent] = (0, import_react4.useState)(null);
    const [hourly, setHourly] = (0, import_react4.useState)([]);
    const [loading, setLoading] = (0, import_react4.useState)(false);
    const [error, setError] = (0, import_react4.useState)(null);
    (0, import_react4.useEffect)(() => {
      const ac = new AbortController();
      let cancelled = false;
      async function run() {
        if (!locationQuery) {
          setPlaceLabel(null);
          setCurrent(null);
          setHourly([]);
          setError(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const hit = await geocode(locationQuery, countryCode, ac.signal, de ? "de" : "en");
          if (cancelled) return;
          if (!hit) {
            setPlaceLabel(null);
            setCurrent(null);
            setHourly([]);
            setError(de ? "Ort nicht gefunden." : "Location not found.");
            return;
          }
          setPlaceLabel(formatPlace(hit));
          const { current: cur, hourly: hrs } = await fetchForecast(
            hit.latitude,
            hit.longitude,
            ac.signal,
            de,
            showDayTimeline
          );
          if (cancelled) return;
          setCurrent(cur);
          setHourly(hrs);
        } catch (e) {
          if (cancelled || e.name === "AbortError") return;
          reportPluginCatch("weather", e, "open-meteo");
          setError(
            de ? "Wetter-API nicht erreichbar (Server braucht Internet zu Open-Meteo)." : "Weather API unreachable (server needs outbound internet to Open-Meteo)."
          );
          setCurrent(null);
          setHourly([]);
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
    }, [locationQuery, countryCode, refreshMinutes, de, showDayTimeline]);
    const rootRef = (0, import_react4.useRef)(null);
    const [splitLayout, setSplitLayout] = (0, import_react4.useState)(false);
    (0, import_react4.useLayoutEffect)(() => {
      const el = rootRef.current;
      if (!el) return;
      const measure = () => {
        const w = el.getBoundingClientRect().width;
        const next = w >= WEATHER_SPLIT_MIN_PX && showDayTimeline && hourly.length > 0;
        setSplitLayout((p) => p === next ? p : next);
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [showDayTimeline, hourly.length]);
    const t = (0, import_react4.useMemo)(
      () => ({
        hint: de ? "Stadt oder PLZ in den Einstellungen eintragen." : "Set city or postal code in settings.",
        temp: de ? "Temperatur" : "Temperature",
        feels: de ? "Gef\xFChlt" : "Feels like",
        hum: de ? "Luftfeuchte" : "Humidity",
        wind: de ? "Wind" : "Wind",
        dayTimeline: de ? "Tagesverlauf" : "Today"
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
    if (error && !current) {
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
    const wdir = num(current?.wind_direction_10m, 0);
    const wspd = num(current?.wind_speed_10m, 0);
    const summary = wmoSummary(code, de);
    const WeatherIcon = wmoIconComponent(code, isDay);
    const iconColor = wmoIconColor(code, isDay);
    const iconGlow = wmoIconGlowFilter(code, isDay);
    const hasTimeline = showDayTimeline && hourly.length > 0;
    const splitView = splitLayout && hasTimeline;
    const slotScale = timelineScale;
    const slotGap = `${Math.max(2, Math.round(4 * slotScale))}px`;
    const padSlot = `${Math.max(2, Math.round(3 * slotScale))}px ${Math.max(1, Math.round(2 * slotScale))}px`;
    const slotBr = `${Math.max(6, Math.round(7 * slotScale))}px`;
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
          gap: "clamp(4px, 1.1cqmin, 8px)",
          padding: "clamp(6px, 2cqmin, 12px)",
          boxSizing: "border-box",
          overflow: "auto"
        },
        children: [
          placeLabel && showPlaceLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
                gap: splitView ? "clamp(10px, 2.2cqmin, 20px)" : void 0
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      flex: splitView ? "0 1 44%" : void 0,
                      maxWidth: splitView ? "48%" : void 0,
                      minWidth: splitView ? 0 : void 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "clamp(4px, 1.2cqmin, 8px)",
                      ...splitView ? {
                        paddingRight: "clamp(6px, 1.5cqmin, 12px)",
                        borderRight: "1px solid color-mix(in srgb, var(--border) 55%, transparent)"
                      } : {}
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: iconColor,
                            minHeight: "clamp(26px, 10cqmin, 52px)"
                          },
                          "aria-label": summary,
                          title: summary,
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            WeatherIcon,
                            {
                              "aria-hidden": true,
                              strokeWidth: 1.75,
                              style: {
                                width: "clamp(28px, 11cqmin, 56px)",
                                height: "clamp(28px, 11cqmin, 56px)",
                                color: iconColor,
                                filter: iconGlow,
                                opacity: loading && temp == null ? 0.45 : 1,
                                transition: "opacity 0.2s, color 0.35s ease"
                              }
                            }
                          )
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", flexWrap: "wrap" }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            className: "tabular-nums",
                            style: {
                              fontSize: "clamp(1.4rem, min(10cqmin, 18vw), 2.75rem)",
                              fontWeight: 800,
                              color: "var(--accent)",
                              fontVariantNumeric: "tabular-nums",
                              lineHeight: 1
                            },
                            children: loading && temp == null ? "\u2026" : temp != null ? `${Math.round(temp)}\xB0` : "\u2014"
                          }
                        ),
                        feels != null && temp != null && Math.abs(feels - temp) >= 0.5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "clamp(10px, 2.2cqmin, 12px)", color: muted }, children: [
                          t.feels,
                          " ",
                          Math.round(feels),
                          "\xB0"
                        ] })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "center",
                            gap: "clamp(8px, 3cqmin, 16px)",
                            flexWrap: "wrap",
                            fontSize: "clamp(10px, 2.2cqmin, 12px)",
                            color: muted
                          },
                          children: [
                            hum != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.hum,
                              " ",
                              Math.round(hum),
                              "%"
                            ] }),
                            wspd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                              t.wind,
                              " ",
                              Math.round(wspd),
                              " km/h ",
                              windCompass(wdir, de)
                            ] })
                          ]
                        }
                      )
                    ]
                  }
                ),
                hasTimeline && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      flex: splitView ? "1 1 0" : void 0,
                      minWidth: splitView ? 0 : void 0,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: splitView ? "center" : void 0,
                      marginTop: splitView ? 0 : "clamp(2px, 0.8cqmin, 6px)"
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "p",
                        {
                          style: {
                            margin: "0 0 6px",
                            textAlign: "center",
                            fontSize: "clamp(9px, 2cqmin, 11px)",
                            fontWeight: 600,
                            color: muted,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            flexShrink: 0
                          },
                          children: t.dayTimeline
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            gap: slotGap,
                            width: "100%",
                            minWidth: 0,
                            overflowX: "auto",
                            overflowY: "hidden",
                            paddingBottom: "2px",
                            scrollbarWidth: "thin"
                          },
                          children: hourly.map((slot) => {
                            const SlotIcon = wmoIconComponent(slot.code, slot.isDay);
                            const slotColor = wmoIconColor(slot.code, slot.isDay);
                            const tip = `${slot.hourLabel} \xB7 ${wmoSummary(slot.code, de)} \xB7 ${Math.round(slot.temp)}\xB0`;
                            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                              "div",
                              {
                                title: tip,
                                style: {
                                  flex: splitView ? "1 1 0" : "0 0 auto",
                                  minWidth: splitView ? 0 : `${Math.max(44, Math.round(52 * slotScale))}px`,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: `${Math.max(1, Math.round(2 * slotScale))}px`,
                                  padding: padSlot,
                                  borderRadius: slotBr,
                                  background: "color-mix(in srgb, var(--surface) 92%, var(--background))",
                                  border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                                  boxSizing: "border-box"
                                },
                                children: [
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: dailyTypeClamp(slotScale, 8, 1.8, 10),
                                        fontWeight: 700,
                                        color: muted,
                                        lineHeight: 1.05,
                                        textAlign: "center"
                                      },
                                      children: slot.hourLabel
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                    SlotIcon,
                                    {
                                      "aria-hidden": true,
                                      strokeWidth: 1.85,
                                      style: {
                                        width: dailyTypeClamp(slotScale, 14, 3.5, 20),
                                        height: dailyTypeClamp(slotScale, 14, 3.5, 20),
                                        color: slotColor,
                                        filter: wmoIconGlowFilter(slot.code, slot.isDay),
                                        flexShrink: 0
                                      }
                                    }
                                  ),
                                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                                    "span",
                                    {
                                      className: "tabular-nums",
                                      style: {
                                        fontSize: dailyTypeClamp(slotScale, 9, 2, 11),
                                        fontWeight: 700,
                                        color: "var(--accent)",
                                        fontVariantNumeric: "tabular-nums",
                                        lineHeight: 1.05
                                      },
                                      children: [
                                        Math.round(slot.temp),
                                        "\xB0"
                                      ]
                                    }
                                  )
                                ]
                              },
                              slot.timeIso
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
    const timelineOn = cfgShowDayTimeline(cfgRaw);
    const placeOn = cfgRaw.showPlaceLabel !== false;
    const widthPct = cfgDayTimelineWidthPct(cfgRaw);
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: "Stadt oder PLZ" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.locationQuery),
            onChange: (e) => onChange("locationQuery", e.target.value),
            placeholder: "z. B. Berlin, K\xF6ln, 80331"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4 }, children: "Nach dem Speichern l\xE4dt das Widget automatisch Wetterdaten (Open-Meteo). Bei PLZ optional Land setzen." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: "Land (ISO, optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.countryCode),
            onChange: (e) => onChange("countryCode", e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2)),
            placeholder: "z. B. DE",
            maxLength: 2
          }
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
                checked: timelineOn,
                onChange: (e) => onChange("showDayTimeline", e.target.checked),
                style: { marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, accentColor: "var(--accent)" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: de ? "Tagesverlauf (st\xFCndlich)" : "Hourly timeline" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { display: "block", fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, marginTop: "4px" }, children: de ? "St\xFCndliche Temperatur und Wetter-Symbol f\xFCr die n\xE4chsten Stunden (ersetzt die fr\xFChere 7-Tage-Vorschau)." : "Hourly temperature and weather icon for the coming hours (replaces the former 7-day forecast)." })
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: timelineOn ? 1 : 0.55 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Tagesverlauf: Kartenbreite (%)" : "Timeline card width (%)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "range",
              min: 70,
              max: 130,
              step: 1,
              value: widthPct,
              disabled: !timelineOn,
              onChange: (e) => onChange("dayTimelineWidthPct", clampDayTimelineWidthPct(Number(e.target.value))),
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
              disabled: !timelineOn,
              value: widthPct,
              onChange: (e) => onChange("dayTimelineWidthPct", clampDayTimelineWidthPct(e.target.value))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.4, marginBottom: 0 }, children: de ? "Skaliert Breite, Abst\xE4nde und Schrift der Stunden-Karten. 100 % = Standard." : "Scales width, gaps, and type for hour slots. 100% is default." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: "Aktualisieren alle (Minuten)" }),
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
        "Wetterdaten:",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: "https://open-meteo.com/", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)" }, children: "Open-Meteo" }),
        " ",
        "(nicht kommerziell, ohne API-Key)."
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

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

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
lucide-react/dist/esm/icons/moon.js:
lucide-react/dist/esm/icons/sun.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
