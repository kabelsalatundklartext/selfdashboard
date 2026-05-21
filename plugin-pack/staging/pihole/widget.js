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
          useLayoutEffect(
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
        var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState2 = React.useState, useEffect2 = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
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
        var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect2 = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
        exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
          var instRef = useRef(null);
          if (null === instRef.current) {
            var inst = { hasValue: false, value: null };
            instRef.current = inst;
          } else inst = instRef.current;
          instRef = useMemo(
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

  // plugins/pihole/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/chevron-right.js
  var ChevronRight = createLucideIcon("ChevronRight", [
    ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/globe.js
  var Globe = createLucideIcon("Globe", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
    ["path", { d: "M2 12h20", key: "9i4pu4" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/hand.js
  var Hand = createLucideIcon("Hand", [
    ["path", { d: "M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0", key: "aigmz7" }],
    ["path", { d: "M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2", key: "1n6bmn" }],
    ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8", key: "a9iiix" }],
    [
      "path",
      {
        d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
        key: "1s1gnw"
      }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/list.js
  var List = createLucideIcon("List", [
    ["line", { x1: "8", x2: "21", y1: "6", y2: "6", key: "7ey8pc" }],
    ["line", { x1: "8", x2: "21", y1: "12", y2: "12", key: "rjfblc" }],
    ["line", { x1: "8", x2: "21", y1: "18", y2: "18", key: "c3b1m8" }],
    ["line", { x1: "3", x2: "3.01", y1: "6", y2: "6", key: "1g7gq3" }],
    ["line", { x1: "3", x2: "3.01", y1: "12", y2: "12", key: "1pjlvk" }],
    ["line", { x1: "3", x2: "3.01", y1: "18", y2: "18", key: "28t2mc" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/pie-chart.js
  var PieChart = createLucideIcon("PieChart", [
    ["path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83", key: "k2fpak" }],
    ["path", { d: "M22 12A10 10 0 0 0 12 2v10z", key: "1rfc4y" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/shield-off.js
  var ShieldOff = createLucideIcon("ShieldOff", [
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
    [
      "path",
      {
        d: "M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71",
        key: "1jlk70"
      }
    ],
    [
      "path",
      {
        d: "M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264",
        key: "18rp1v"
      }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/shield.js
  var Shield = createLucideIcon("Shield", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y"
      }
    ]
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
          return s.dashboards.find((d) => d.id === s.activeDashboardId) ?? s.dashboards[0];
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

  // plugins/pihole/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "pihole",
    name: "Pi-hole",
    description: "Pi-hole-v6-Statistik wie im Web-Dashboard (Anfragen, blockiert, Anteil, Domains auf Listen). Blocking per Klick. Daten via /api/pihole.",
    version: "1.1.1",
    author: "SelfDashboard",
    category: "network",
    icon: "\u{1F573}\uFE0F",
    iconUrl: "/plugin-logos/pihole.png",
    stackedExtraH: 1
  };
  function str(v) {
    return typeof v === "string" ? v.trim() : "";
  }
  function num(v) {
    if (v == null || v === "") return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  function normalizeBase(url) {
    let s = url.trim().replace(/\/$/, "");
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
    if (s.endsWith("/admin")) s = s.slice(0, -"/admin".length).replace(/\/$/, "");
    return s;
  }
  function record(v) {
    return v != null && typeof v === "object" && !Array.isArray(v) ? v : {};
  }
  function formatInt(n, locale) {
    return Math.round(n).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
  }
  function formatPercent(pct, locale) {
    const loc = locale === "en" ? "en-GB" : "de-DE";
    const s = pct.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${s} %`;
  }
  function adminHref(base, path) {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }
  function BoxFooterLink({ href, children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "a",
      {
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "6px 10px",
          color: "rgba(255,255,255,0.92)",
          fontSize: "clamp(8px, 2cqmin, 10px)",
          textDecoration: "none",
          lineHeight: 1.3,
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              style: {
                flexShrink: 0,
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 11, strokeWidth: 2.5, "aria-hidden": true })
            }
          )
        ]
      }
    );
  }
  function BoxFooterText({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "6px 10px",
          color: "rgba(255,255,255,0.92)",
          fontSize: "clamp(8px, 2cqmin, 10px)",
          lineHeight: 1.3,
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              style: {
                flexShrink: 0,
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 11, strokeWidth: 2.5, "aria-hidden": true, style: { opacity: 0.85 } })
            }
          )
        ]
      }
    );
  }
  function PiHoleSmallBox({
    title,
    value,
    bg,
    footerBg,
    icon: Icon2,
    footer
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "sd-pihole-box",
        style: {
          position: "relative",
          borderRadius: "4px",
          background: bg,
          color: "#fff",
          overflow: "hidden",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.28)"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "10px 12px 8px", flex: "1 1 auto", minHeight: 0, position: "relative", zIndex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "clamp(9px, 2.2cqmin, 11px)", fontWeight: 600, opacity: 0.95, lineHeight: 1.25 }, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "p",
              {
                className: "tabular-nums",
                style: {
                  margin: "6px 0 0",
                  fontSize: "clamp(1.15rem, min(6.5cqmin, 5cqh), 2rem)",
                  fontWeight: 700,
                  lineHeight: 1.05,
                  fontVariantNumeric: "tabular-nums"
                },
                children: value
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Icon2,
            {
              size: 72,
              strokeWidth: 1.25,
              "aria-hidden": true,
              style: {
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-52%)",
                opacity: 0.22,
                pointerEvents: "none",
                zIndex: 0
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: footerBg, marginTop: "auto", flexShrink: 0 }, children: footer })
        ]
      }
    );
  }
  function Widget({ config }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const base = normalizeBase(str(config.url));
    const password = str(config.password);
    const totp = str(config.totp);
    const refreshSec = Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20)));
    const [data, setData] = (0, import_react4.useState)(null);
    const [error, setError] = (0, import_react4.useState)(null);
    const [loading, setLoading] = (0, import_react4.useState)(true);
    const [blockBusy, setBlockBusy] = (0, import_react4.useState)(false);
    const fetch_ = (0, import_react4.useCallback)(async () => {
      if (!base) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/pihole", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ url: base, password, totp: totp || void 0 })
        });
        const j = await res.json();
        if (!res.ok) {
          const code = j.status ?? res.status;
          if (res.status === 401 || res.status === 403 || j.error === "auth_failed") {
            setError(de ? "Anmeldung fehlgeschlagen (Passwort / 2FA)." : "Login failed (password / 2FA).");
          } else if (j.error === "timeout") {
            setError(de ? "Zeit\xFCberschreitung \u2014 Pi-hole erreichbar?" : "Timeout \u2014 is Pi-hole reachable?");
          } else {
            const d = j.detail ? ` ${j.detail}` : "";
            setError(de ? `API-Fehler (${code}).${d}` : `API error (${code}).${d}`);
          }
          setData(null);
          return;
        }
        setData({
          summary: j.summary ?? null,
          blocking: typeof j.blocking === "boolean" ? j.blocking : null
        });
        setError(null);
      } catch (e) {
        reportPluginCatch("pihole", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [base, password, totp, de]);
    const toggleBlocking = (0, import_react4.useCallback)(async () => {
      if (!base || blockBusy || data?.blocking == null) return;
      const next = !data.blocking;
      setBlockBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/pihole", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            action: "blocking",
            url: base,
            password,
            totp: totp || void 0,
            blocking: next
          })
        });
        const j = await res.json();
        if (!res.ok) {
          const d = j.detail ? ` ${j.detail}` : "";
          setError(
            de ? `Blocking konnte nicht ge\xE4ndert werden (${res.status}).${d}` : `Could not change blocking (${res.status}).${d}`
          );
          return;
        }
        await fetch_();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBlockBusy(false);
      }
    }, [base, password, totp, de, blockBusy, data?.blocking, fetch_]);
    (0, import_react4.useEffect)(() => {
      void fetch_();
      const id = window.setInterval(() => void fetch_(), refreshSec * 1e3);
      return () => window.clearInterval(id);
    }, [fetch_, refreshSec]);
    const shell = {
      height: "100%",
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      containerType: "size",
      minWidth: 0,
      width: "100%",
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    };
    const shellPadded = { ...shell, padding: "14px 14px 12px" };
    if (!base) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          className: "sd-plugin-no-scrollbar",
          style: {
            ...shellPadded,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "radial-gradient(ellipse at 50% 35%, rgba(249,115,22,0.14) 0%, transparent 58%)"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyHint, { de })
        }
      );
    }
    if (loading && !data) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSkeleton, { shellPadded });
    }
    if (error && !data) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorView, { de, error, shellPadded });
    }
    const queries = record(data?.summary?.queries);
    const clients = record(data?.summary?.clients);
    const gravity = record(data?.summary?.gravity);
    const total = num(queries.total);
    const blocked = num(queries.blocked);
    const pctRaw = num(queries.percent_blocked);
    const pct = pctRaw > 0 ? Math.min(100, Math.round(pctRaw * 10) / 10) : total > 0 ? Math.min(100, Math.round(blocked / total * 1e3) / 10) : 0;
    const activeClients = num(clients.active);
    const domainsOnLists = num(gravity.domains_being_blocked) || num(gravity.domains_on_lists) || num(data?.summary?.domains_being_blocked);
    const blockingOn = data?.blocking === true;
    const blockingKnown = data?.blocking != null;
    const labels = de ? {
      totalQueries: "Anfragen insgesamt",
      queriesBlocked: "Blockierte Anfragen",
      percentBlocked: "Prozentsatz blockiert",
      domainsOnLists: "Dom\xE4nen auf Listen",
      activeClients: (n) => n === 1 ? "1 aktiver Client" : `${formatInt(n, locale)} aktive Clients`,
      listBlocked: "Blockierte Anfragen anzeigen",
      listAll: "Alle Anfragen anzeigen",
      manageLists: "Listen verwalten"
    } : {
      totalQueries: "Total Queries",
      queriesBlocked: "Queries Blocked",
      percentBlocked: "Percentage Blocked",
      domainsOnLists: "Domains on Lists",
      activeClients: (n) => n === 1 ? "1 active client" : `${formatInt(n, locale)} active clients`,
      listBlocked: "List blocked queries",
      listAll: "List all queries",
      manageLists: "Manage lists"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sd-plugin-no-scrollbar sd-pihole-host", style: { ...shell, background: "var(--background)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .sd-pihole-host {
          padding: 10px 10px 8px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          gap: 8px;
        }
        .sd-pihole-host .sd-pihole-box-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          min-width: 0;
          flex: 1 1 auto;
          min-height: 0;
          align-content: start;
        }
        @container (max-width: 520px) {
          .sd-pihole-host .sd-pihole-box-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @container (max-width: 280px) {
          .sd-pihole-host .sd-pihole-box-grid { grid-template-columns: 1fr; }
        }
        @container (max-height: 320px) {
          .sd-pihole-host { padding: 6px 6px 5px; gap: 5px; }
          .sd-pihole-host .sd-pihole-box-grid { gap: 5px; }
        }
      ` }),
      error && data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "#fb7185", margin: 0, textAlign: "center", lineHeight: 1.35 }, children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          disabled: blockBusy || !blockingKnown,
          "aria-pressed": blockingOn,
          className: "sd-pihole-block-btn",
          onClick: () => void toggleBlocking(),
          style: {
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "clamp(9px, min(2.4cqmin, 2cqh), 12px)",
            fontWeight: 800,
            padding: "7px 12px",
            borderRadius: "6px",
            border: blockingOn ? "1px solid rgba(52, 211, 153, 0.55)" : "1px solid rgba(251, 113, 133, 0.45)",
            background: blockingOn ? "linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)" : "linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)",
            color: blockingOn ? "#ecfdf5" : "#ffe4e6",
            cursor: blockBusy || !blockingKnown ? "wait" : "pointer",
            opacity: blockBusy || !blockingKnown ? 0.75 : 1,
            fontFamily: "inherit"
          },
          children: [
            blockingOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 13, "aria-hidden": true }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { size: 13, "aria-hidden": true }),
            blockBusy ? "\u2026" : blockingOn ? de ? "Blocking: AN" : "Blocking: On" : de ? "Blocking: AUS" : "Blocking: Off"
          ]
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sd-pihole-box-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          PiHoleSmallBox,
          {
            title: labels.totalQueries,
            value: formatInt(total, locale),
            bg: "#00c0ef",
            footerBg: "rgba(0,0,0,0.12)",
            icon: Globe,
            footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoxFooterText, { children: labels.activeClients(activeClients) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          PiHoleSmallBox,
          {
            title: labels.queriesBlocked,
            value: formatInt(blocked, locale),
            bg: "#dd4b39",
            footerBg: "rgba(0,0,0,0.14)",
            icon: Hand,
            footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoxFooterLink, { href: adminHref(base, "/queries?status=blocked"), children: labels.listBlocked })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          PiHoleSmallBox,
          {
            title: labels.percentBlocked,
            value: formatPercent(pct, locale),
            bg: "#f39c12",
            footerBg: "rgba(0,0,0,0.12)",
            icon: PieChart,
            footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoxFooterLink, { href: adminHref(base, "/queries"), children: labels.listAll })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          PiHoleSmallBox,
          {
            title: labels.domainsOnLists,
            value: formatInt(domainsOnLists, locale),
            bg: "#00a65a",
            footerBg: "rgba(0,0,0,0.12)",
            icon: List,
            footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoxFooterLink, { href: adminHref(base, "/groups/domains"), children: labels.manageLists })
          }
        )
      ] })
    ] });
  }
  function EmptyHint({ de }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            width: "clamp(52px, 18cqmin, 72px)",
            height: "clamp(52px, 18cqmin, 72px)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, rgba(249,115,22,0.22), rgba(251,191,36,0.18))",
            border: "1px solid rgba(249, 115, 22, 0.35)"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 30, strokeWidth: 2, style: { color: "#fdba74" }, "aria-hidden": true })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.45, maxWidth: "22em" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--accent)", fontWeight: 600 }, children: "Pi-hole" }),
        " \u2014 Basis-URL in den Einstellungen eintragen"
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--accent)", fontWeight: 600 }, children: "Pi-hole" }),
        " \u2014 set the base URL in settings"
      ] }) })
    ] });
  }
  function LoadingSkeleton({ shellPadded }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sd-plugin-no-scrollbar", style: shellPadded, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }, children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "72px", borderRadius: "4px" } }, i)) }) });
  }
  function ErrorView({
    de,
    error,
    shellPadded
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "sd-plugin-no-scrollbar",
        style: {
          ...shellPadded,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { size: 24, strokeWidth: 2, style: { color: "#fda4af" }, "aria-hidden": true }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text)", marginTop: "10px", wordBreak: "break-word", fontWeight: 600 }, children: error }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? "URL (http://IP), Pi-hole v6 und Web-Passwort pr\xFCfen." : "Check URL (http://IP), Pi-hole v6 and web password." })
        ]
      }
    );
  }
  function Settings({ config, onChange }) {
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "Basis-URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: str(config.url), onChange: (e) => onChange("url", e.target.value), placeholder: "http://192.168.1.10" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "Web-Passwort (optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: str(config.password),
            onChange: (e) => onChange("password", e.target.value),
            autoComplete: "new-password"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "2FA-Code (optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.totp),
            onChange: (e) => onChange("totp", e.target.value.replace(/\D/g, "").slice(0, 6)),
            placeholder: "123456",
            inputMode: "numeric",
            autoComplete: "one-time-code"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "Aktualisieren (Sekunden)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 10,
            max: 300,
            value: Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20))),
            onChange: (e) => onChange("refreshSeconds", Math.min(300, Math.max(10, Math.round(Number(e.target.value)) || 20)))
          }
        )
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/pihole.tsx
  (function(SD) {
    if (!SD || !SD.registerPlugin) throw new Error("SelfDashboard bridge missing");
    SD.registerPlugin(meta, component, { replace: true });
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
lucide-react/dist/esm/icons/chevron-right.js:
lucide-react/dist/esm/icons/globe.js:
lucide-react/dist/esm/icons/hand.js:
lucide-react/dist/esm/icons/list.js:
lucide-react/dist/esm/icons/pie-chart.js:
lucide-react/dist/esm/icons/shield-off.js:
lucide-react/dist/esm/icons/shield.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
