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

  // sd-react:react-dom
  var require_react_dom = __commonJS({
    "sd-react:react-dom"(exports, module) {
      var rd = globalThis.SelfDashboard?.ReactDOM;
      if (!rd?.createPortal) throw new Error("SelfDashboard.ReactDOM missing \u2014 reload page");
      module.exports = { createPortal: rd.createPortal, default: rd };
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

  // ../plugins/calendar/index.tsx
  var import_react4 = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());

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

  // node_modules/lucide-react/dist/esm/icons/chevron-left.js
  var ChevronLeft = createLucideIcon("ChevronLeft", [
    ["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/chevron-right.js
  var ChevronRight = createLucideIcon("ChevronRight", [
    ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/layout-grid.js
  var LayoutGrid = createLucideIcon("LayoutGrid", [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]
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

  // node_modules/lucide-react/dist/esm/icons/plus.js
  var Plus = createLucideIcon("Plus", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
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
    const api2 = { setState, getState, getInitialState, subscribe, destroy };
    const initialState = state = createState(setState, getState, api2);
    return api2;
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
  function useStore(api2, selector = identity, equalityFn) {
    if ((import_meta2.env ? import_meta2.env.MODE : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
      console.warn(
        "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
      );
      didWarnAboutEqualityFn = true;
    }
    const slice = useSyncExternalStoreWithSelector(
      api2.subscribe,
      api2.getState,
      api2.getServerState || api2.getInitialState,
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
    const api2 = typeof createState === "function" ? createStore(createState) : createState;
    const useBoundStore = (selector, equalityFn) => useStore(api2, selector, equalityFn);
    Object.assign(useBoundStore, api2);
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
        const parse = (str2) => {
          if (str2 === null) {
            return null;
          }
          return JSON.parse(str2, options == null ? void 0 : options.reviver);
        };
        const str = (_a = storage.getItem(name)) != null ? _a : null;
        if (str instanceof Promise) {
          return str.then(parse);
        }
        return parse(str);
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
  var oldImpl = (config, baseOptions) => (set, get, api2) => {
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
        api2
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
    const savedSetState = api2.setState;
    api2.setState = (state, replace) => {
      savedSetState(state, replace);
      void setItem();
    };
    const configResult = config(
      (...args) => {
        set(...args);
        void setItem();
      },
      get,
      api2
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
    api2.persist = {
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
  var newImpl = (config, baseOptions) => (set, get, api2) => {
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
        api2
      );
    }
    const setItem = () => {
      const state = options.partialize({ ...get() });
      return storage.setItem(options.name, {
        state,
        version: options.version
      });
    };
    const savedSetState = api2.setState;
    api2.setState = (state, replace) => {
      savedSetState(state, replace);
      void setItem();
    };
    const configResult = config(
      (...args) => {
        set(...args);
        void setItem();
      },
      get,
      api2
    );
    api2.getInitialState = () => configResult;
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
    api2.persist = {
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
      kioskModeIdleSeconds: typeof s.kioskModeIdleSeconds === "number" && Number.isFinite(s.kioskModeIdleSeconds) ? Math.min(60, Math.max(3, Math.round(s.kioskModeIdleSeconds))) : 5,
      navbarBackgroundImage: typeof s.navbarBackgroundImage === "string" ? s.navbarBackgroundImage : "",
      navbarBackgroundOverlay: typeof s.navbarBackgroundOverlay === "number" && Number.isFinite(s.navbarBackgroundOverlay) ? Math.min(80, Math.max(0, Math.round(s.navbarBackgroundOverlay))) : 45
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
        navbarBackgroundImage: "",
        navbarBackgroundOverlay: 45,
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
        },
        setNavbarBackgroundImage: (navbarBackgroundImage) => set({ navbarBackgroundImage: navbarBackgroundImage ?? "" }),
        setNavbarBackgroundOverlay: (raw) => {
          const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : 45;
          set({ navbarBackgroundOverlay: Math.min(80, Math.max(0, n)) });
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
            if (typeof state.navbarBackgroundImage !== "string") state.navbarBackgroundImage = "";
            const ov = state.navbarBackgroundOverlay;
            if (typeof ov !== "number" || !Number.isFinite(ov)) {
              state.navbarBackgroundOverlay = 45;
            } else {
              state.navbarBackgroundOverlay = Math.min(80, Math.max(0, Math.round(ov)));
            }
            state.dashboards = stripRemovedPlugins(state.dashboards);
          }
        }
      }
    )
  );

  // src/lib/pluginLocale.ts
  function usePluginLocale() {
    const locale = useDashboardStore((s) => s.locale);
    return { locale, de: locale !== "en" };
  }

  // ../plugins/calendar/api-client.ts
  async function request(path, init) {
    const res = await fetch("/api/calendar" + path, {
      headers: { "Content-Type": "application/json" },
      ...init
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      let detail;
      try {
        const j = await res.json();
        msg = j.error ?? j.message ?? j.syncError ?? msg;
        detail = JSON.stringify(j).slice(0, 500);
      } catch {
      }
      reportPluginError("calendar", msg, { category: `api${path.split("?")[0]}`, detail });
      throw new Error(msg);
    }
    if (res.status === 204) return void 0;
    return res.json();
  }
  var api = {
    summary: () => request("/summary"),
    status: () => request("/status"),
    listAccounts: () => request("/accounts"),
    createAccount: (body) => request("/accounts", { method: "POST", body: JSON.stringify(body) }),
    updateAccount: (id, body) => request(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteAccount: (id) => request(`/accounts/${id}`, { method: "DELETE" }),
    syncAccount: (id) => request(`/accounts/${id}/sync`, { method: "POST" }),
    testAccount: (id) => request(`/accounts/${id}/test`, { method: "POST" }),
    listCalendars: () => request("/calendars"),
    updateCalendar: (id, body) => request(`/calendars/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    listEvents: (startIso, endIso, calendarId) => request(`/events?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}${calendarId ? `&calendarId=${calendarId}` : ""}`),
    createEvent: (body) => request("/events", { method: "POST", body: JSON.stringify(body) }),
    updateEvent: (id, body) => request(`/events/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE" }),
    listConflicts: () => request("/conflicts"),
    resolveConflict: (id, side) => request(`/conflicts/${id}`, { method: "POST", body: JSON.stringify({ side }) })
  };

  // ../plugins/calendar/i18n.ts
  function localeToBcp47(locale) {
    return locale === "en" ? "en-US" : "de-DE";
  }
  var dict = {
    de: {
      calendar: "Kalender",
      today: "Heute",
      conflicts: "Konflikte",
      upcoming: "Anstehend",
      noUpcoming: "Keine Termine in den n\xE4chsten 7 Tagen",
      syncedAt: "Synchronisiert",
      syncing: "Synchronisiere\u2026",
      error: "Fehler",
      open: "\xD6ffnen",
      accounts: "Konten",
      addAccount: "Konto hinzuf\xFCgen",
      addCaldav: "+ CalDAV-Konto",
      addIcs: "+ ICS-Abo",
      add: "Hinzuf\xFCgen",
      cancel: "Abbrechen",
      save: "Speichern",
      delete: "L\xF6schen",
      remove: "Entfernen",
      sync: "Sync",
      test: "Testen",
      new: "Neu",
      newEvent: "+ Termin",
      title: "Titel",
      location: "Ort",
      notes: "Notizen",
      start: "Beginn",
      end: "Ende",
      allDay: "Ganzt\xE4gig",
      recurrence: "Wiederholung",
      noRecurrence: "keine Wiederholung",
      daily: "t\xE4glich",
      weekly: "w\xF6chentlich",
      monthly: "monatlich",
      yearly: "j\xE4hrlich",
      month: "Monat",
      agenda: "Agenda",
      displayName: "Anzeigename",
      url: "URL",
      username: "Benutzername",
      password: "Passwort",
      appPassword: "App-spezifisches Passwort",
      verifySsl: "SSL-Zertifikat pr\xFCfen",
      confirmDeleteEvent: "Termin wirklich l\xF6schen?",
      confirmDeleteAccount: "Konto entfernen? Lokale Daten werden gel\xF6scht.",
      readOnly: "schreibgesch\xFCtzt",
      pending: "wartet auf Sync",
      conflictBanner: "Konflikt: Diese Veranstaltung wurde lokal UND remote ge\xE4ndert.",
      keepRemote: "Remote behalten",
      keepLocal: "Lokale Version behalten",
      iCloudHint: "Bei iCloud / Google ein app-spezifisches Passwort verwenden.",
      nothingHere: "Noch keine Konten konfiguriert.",
      pickProvider: "Konto-Typ w\xE4hlen",
      calendars: "Kalender",
      selectCalendar: "Kalender",
      untitled: "(ohne Titel)",
      refreshInterval: "Aktualisierungs-Intervall (Sek.)",
      next: "weiter",
      prev: "zur\xFCck",
      todayBtn: "Heute",
      close: "Schlie\xDFen",
      agendaTitle: "Agenda (n\xE4chste 30 Tage)",
      moreEvents: "weitere",
      noWritableCalendar: "Kein beschreibbarer Kalender \u2014 zuerst ein CalDAV-Konto anlegen.",
      monthView: "Monatsansicht",
      addEvent: "Termin hinzuf\xFCgen",
      setupCalendarFirst: "Kalender-Konto einrichten (CalDAV)",
      dayEvents: "Termine am",
      noEventsThisDay: "Keine Termine an diesem Tag",
      syncFailed: "Speichern ok, aber Upload zu CalDAV fehlgeschlagen",
      syncPending: "Wird beim n\xE4chsten Sync hochgeladen",
      viewCompact: "Liste",
      viewMonth: "Monat",
      upcomingOnly: "Termine \u2014 nur anstehend",
      saving: "Speichere\u2026",
      eventSaved: "Termin gespeichert",
      eventSavedSyncing: "Termin gespeichert \u2014 wird zu WEB.DE synchronisiert\u2026",
      readOnlyCalendarHint: "\u201EGeburtstage\u201C und \u201Eweb\u201C sind bei WEB.DE nur lesbar. Termine bitte unter \u201EMein Kalender\u201C anlegen.",
      pickWritableCalendar: "Bitte einen beschreibbaren Kalender w\xE4hlen (z. B. Mein Kalender).",
      editAccount: "Bearbeiten",
      editAccountTitle: "Konto bearbeiten",
      passwordLeaveBlank: "Leer lassen = Passwort unver\xE4ndert",
      eventCount: "Termine",
      openDay: "Tag \xF6ffnen",
      calendarActive: "Kalender einblenden",
      calendarInactive: "Kalender ausblenden",
      defaultCalendar: "Standard",
      setDefaultCalendar: "Als Standard f\xFCr neue Termine"
    },
    en: {
      calendar: "Calendar",
      today: "Today",
      conflicts: "Conflicts",
      upcoming: "Upcoming",
      noUpcoming: "No events in the next 7 days",
      syncedAt: "Synced",
      syncing: "Syncing\u2026",
      error: "Error",
      open: "Open",
      accounts: "Accounts",
      addAccount: "Add account",
      addCaldav: "+ CalDAV account",
      addIcs: "+ ICS feed",
      add: "Add",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      remove: "Remove",
      sync: "Sync",
      test: "Test",
      new: "New",
      newEvent: "+ Event",
      title: "Title",
      location: "Location",
      notes: "Notes",
      start: "Start",
      end: "End",
      allDay: "All day",
      recurrence: "Repeat",
      noRecurrence: "no repeat",
      daily: "daily",
      weekly: "weekly",
      monthly: "monthly",
      yearly: "yearly",
      month: "Month",
      agenda: "Agenda",
      displayName: "Display name",
      url: "URL",
      username: "Username",
      password: "Password",
      appPassword: "App-specific password",
      verifySsl: "Verify SSL certificate",
      confirmDeleteEvent: "Delete this event?",
      confirmDeleteAccount: "Remove account? Local data will be deleted.",
      readOnly: "read-only",
      pending: "pending sync",
      conflictBanner: "Conflict: this event was changed both locally AND remotely.",
      keepRemote: "Keep remote",
      keepLocal: "Keep local",
      iCloudHint: "For iCloud / Google use an app-specific password.",
      nothingHere: "No accounts configured yet.",
      pickProvider: "Choose account type",
      calendars: "Calendars",
      selectCalendar: "Calendar",
      untitled: "(untitled)",
      refreshInterval: "Refresh interval (sec.)",
      next: "next",
      prev: "previous",
      todayBtn: "Today",
      close: "Close",
      agendaTitle: "Agenda (next 30 days)",
      moreEvents: "more",
      noWritableCalendar: "No writable calendar \u2014 add a CalDAV account first.",
      monthView: "Month view",
      addEvent: "Add event",
      setupCalendarFirst: "Set up a calendar account (CalDAV)",
      dayEvents: "Events on",
      noEventsThisDay: "No events on this day",
      syncFailed: "Saved locally, but CalDAV upload failed",
      syncPending: "Will upload on next sync",
      viewCompact: "List",
      viewMonth: "Month",
      upcomingOnly: "Events \u2014 upcoming only",
      saving: "Saving\u2026",
      eventSaved: "Event saved",
      eventSavedSyncing: "Event saved \u2014 syncing to CalDAV\u2026",
      readOnlyCalendarHint: "\u201CBirthdays\u201D and \u201Cweb\u201D are read-only on WEB.DE. Create events on \u201CMy calendar\u201D.",
      pickWritableCalendar: "Choose a writable calendar (e.g. My calendar).",
      editAccount: "Edit",
      editAccountTitle: "Edit account",
      passwordLeaveBlank: "Leave blank to keep current password",
      eventCount: "events",
      openDay: "Open day",
      calendarActive: "Show calendar",
      calendarInactive: "Hide calendar",
      defaultCalendar: "Default",
      setDefaultCalendar: "Default for new events"
    }
  };
  function t(key, locale = "de") {
    return dict[locale]?.[key] ?? dict.de[key] ?? key;
  }

  // ../plugins/calendar/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "calendar",
    name: "Kalender",
    description: "CalDAV + ICS Kalender mit Two-Way-Sync. iCloud, Nextcloud, Fastmail, Posteo \u2026",
    version: "1.2.4",
    author: "SelfDashboard Community",
    category: "productivity",
    icon: "\u{1F4C5}",
    defaultLayout: { w: 6, h: 8, minW: 3, minH: 6 },
    stackedExtraH: 2
  };
  var ICONS = {
    calendar: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "3", y1: "10", x2: "21", y2: "10" })
    ] }),
    sync: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "23 4 23 10 17 10" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "1 20 1 14 7 14" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
    ] }),
    cog: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
    ] }),
    close: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
    ] })
  };
  var fmtTime = (iso, allDay, locale) => {
    if (allDay) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString(localeToBcp47(locale), { hour: "2-digit", minute: "2-digit" });
  };
  var fmtDay = (iso, locale) => new Date(iso).toLocaleDateString(localeToBcp47(locale), { weekday: "short", day: "2-digit", month: "short" });
  var fmtFullDay = (d, locale) => d.toLocaleDateString(localeToBcp47(locale), { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  function dateKeyLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function dateKeyFromIso(iso) {
    return dateKeyLocal(new Date(iso));
  }
  function startOfLocalDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function ModalPortal({ children }) {
    const [mounted, setMounted] = (0, import_react4.useState)(false);
    (0, import_react4.useEffect)(() => {
      setMounted(true);
    }, []);
    if (!mounted || typeof document === "undefined") return null;
    try {
      if (typeof import_react_dom.createPortal === "function") {
        return (0, import_react_dom.createPortal)(children, document.body);
      }
    } catch {
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "fixed", inset: 0, zIndex: 3e4, pointerEvents: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { pointerEvents: "auto", width: "100%", height: "100%" }, children }) });
  }
  function weekdayShortLabels(locale) {
    const tag = localeToBcp47(locale);
    const fmt = new Intl.DateTimeFormat(tag, { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return fmt.format(d);
    });
  }
  var toInputDateTime = (iso) => {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 6e4).toISOString().slice(0, 16);
  };
  var fromInputDateTime = (val) => new Date(val).toISOString();
  var TILE_VIEW_STORAGE_KEY = "sd-cal-tile-view";
  var DEFAULT_CALENDAR_STORAGE_KEY = "sd-cal-default-calendar-id";
  function isCalendarVisible(c) {
    return c.visible !== false;
  }
  function loadDefaultCalendarId() {
    try {
      return localStorage.getItem(DEFAULT_CALENDAR_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  function saveDefaultCalendarId(id) {
    try {
      localStorage.setItem(DEFAULT_CALENDAR_STORAGE_KEY, id);
    } catch {
    }
  }
  function pickDefaultWritableCalendar(cals) {
    const writable = cals.filter((c) => !c.readOnly && isCalendarVisible(c));
    if (!writable.length) return void 0;
    const savedId = loadDefaultCalendarId();
    if (savedId) {
      const saved = writable.find((c) => c.id === savedId);
      if (saved) return saved;
    }
    const score = (c) => {
      const n = c.name.toLowerCase().trim();
      if (/geburt|birth/.test(n)) return 0;
      if (n === "web" || n === "web.de") return 0;
      if (/mein kalender|mein|standard|privat|home/.test(n)) return 5;
      if (/kalender/.test(n)) return 3;
      return 1;
    };
    return [...writable].sort((a, b) => score(b) - score(a))[0];
  }
  function eventRowKey(ev) {
    return `${ev.id}:${ev.instanceStart ?? ev.dtstart}`;
  }
  function filterUpcomingEvents(events) {
    const now = Date.now();
    return events.filter((ev) => {
      const endMs = ev.dtend ? /^\d{4}-\d{2}-\d{2}$/.test(ev.dtend) ? (/* @__PURE__ */ new Date(ev.dtend + "T23:59:59")).getTime() : new Date(ev.dtend).getTime() : /^\d{4}-\d{2}-\d{2}$/.test(ev.dtstart) ? (/* @__PURE__ */ new Date(ev.dtstart + "T23:59:59")).getTime() : new Date(ev.dtstart).getTime();
      return endMs >= now;
    }).sort((a, b) => a.dtstart.localeCompare(b.dtstart));
  }
  var widgetNavBtnStyle = {
    border: "1px solid var(--border)",
    borderRadius: "4px",
    background: "transparent",
    cursor: "pointer",
    padding: "2px 8px",
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };
  var widgetMiniBtnStyle = {
    border: "1px solid var(--border)",
    borderRadius: "4px",
    background: "transparent",
    cursor: "pointer",
    padding: "2px 6px",
    color: "var(--text-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };
  function Widget({ config }) {
    const { locale } = usePluginLocale();
    const t2 = (k) => t(k, locale);
    const refreshInterval = Math.max(15, config.refreshInterval ?? 60) * 1e3;
    const [summary, setSummary] = (0, import_react4.useState)(null);
    const [status, setStatus] = (0, import_react4.useState)("loading");
    const [errorMsg, setErrorMsg] = (0, import_react4.useState)(null);
    const [modalOpen, setModalOpen] = (0, import_react4.useState)(false);
    const [modalInitialView, setModalInitialView] = (0, import_react4.useState)("month");
    const [calendars, setCalendars] = (0, import_react4.useState)([]);
    const [eventDialog, setEventDialog] = (0, import_react4.useState)(null);
    const [tileView, setTileView] = (0, import_react4.useState)("month");
    const [monthCursor, setMonthCursor] = (0, import_react4.useState)(() => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(1);
      return d;
    });
    const [selectedDay, setSelectedDay] = (0, import_react4.useState)(() => startOfLocalDay(/* @__PURE__ */ new Date()));
    const [monthEvents, setMonthEvents] = (0, import_react4.useState)([]);
    const [listEvents, setListEvents] = (0, import_react4.useState)([]);
    const [dayPopup, setDayPopup] = (0, import_react4.useState)(null);
    const [flash, setFlash] = (0, import_react4.useState)(null);
    const timerRef = (0, import_react4.useRef)(null);
    const flashTimerRef = (0, import_react4.useRef)(null);
    const writableCalendars = (0, import_react4.useMemo)(() => calendars.filter((c) => !c.readOnly), [calendars]);
    const visibleCalendarIds = (0, import_react4.useMemo)(
      () => new Set(calendars.filter(isCalendarVisible).map((c) => c.id)),
      [calendars]
    );
    const loadCalendars = (0, import_react4.useCallback)(async () => {
      const cals = await api.listCalendars();
      setCalendars(cals);
      return cals;
    }, []);
    const openMonthModal = () => {
      setModalInitialView("month");
      setModalOpen(true);
    };
    const openNewEvent = async () => {
      try {
        const cals = await loadCalendars();
        const writable = cals.filter((c) => !c.readOnly);
        if (writable.length === 0) {
          setModalInitialView("accounts");
          setModalOpen(true);
          return;
        }
        const pick = pickDefaultWritableCalendar(writable);
        setEventDialog({
          calendarId: pick?.id ?? writable[0].id,
          allDay: false,
          dtstart: (tileView === "month" ? selectedDay : /* @__PURE__ */ new Date()).toISOString()
        });
      } catch (e) {
        setStatus("error");
        setErrorMsg(e?.message ?? String(e));
      }
    };
    const openEventFromTile = async (ev) => {
      try {
        await loadCalendars();
        setEventDialog({
          id: ev.id,
          calendarId: ev.calendarId,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          syncState: ev.syncState,
          calendarColor: ev.calendarColor,
          calendarName: ev.calendarName
        });
      } catch {
        openMonthModal();
      }
    };
    const refresh = (0, import_react4.useCallback)(async () => {
      try {
        const data = await api.summary();
        setSummary(data);
        setStatus("ok");
        setErrorMsg(null);
      } catch (e) {
        reportPluginCatch("calendar", e, "summary");
        setStatus("error");
        setErrorMsg(e?.message ?? String(e));
      }
    }, []);
    (0, import_react4.useEffect)(() => {
      refresh();
      const loop = () => {
        timerRef.current = setTimeout(async () => {
          await refresh();
          loop();
        }, refreshInterval);
      };
      loop();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [refresh, refreshInterval]);
    (0, import_react4.useEffect)(() => {
      loadCalendars().catch(() => void 0);
      try {
        const saved = localStorage.getItem(TILE_VIEW_STORAGE_KEY);
        if (saved === "compact" || saved === "month") setTileView(saved);
      } catch {
      }
    }, [loadCalendars]);
    const monthRange = (0, import_react4.useMemo)(() => {
      const start = new Date(monthCursor);
      start.setDate(1);
      start.setDate(1 - (start.getDay() + 6) % 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 42);
      return { start, end };
    }, [monthCursor]);
    const refreshMonthEvents = (0, import_react4.useCallback)(async () => {
      try {
        const evs = await api.listEvents(monthRange.start.toISOString(), monthRange.end.toISOString());
        setMonthEvents(evs.filter((e) => visibleCalendarIds.has(e.calendarId)));
      } catch {
        setMonthEvents([]);
      }
    }, [monthRange, visibleCalendarIds]);
    const refreshListEvents = (0, import_react4.useCallback)(async () => {
      const start = /* @__PURE__ */ new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      try {
        const evs = await api.listEvents(start.toISOString(), end.toISOString());
        setListEvents(evs.filter((e) => visibleCalendarIds.has(e.calendarId)));
      } catch {
        setListEvents([]);
      }
    }, [visibleCalendarIds]);
    (0, import_react4.useEffect)(() => {
      if (tileView === "month") refreshMonthEvents();
      if (tileView === "compact") refreshListEvents();
    }, [tileView, refreshMonthEvents, refreshListEvents]);
    const compactUpcoming = (0, import_react4.useMemo)(() => filterUpcomingEvents(listEvents), [listEvents]);
    const showFlash = (0, import_react4.useCallback)((msg) => {
      setFlash(msg);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash(null), 4500);
    }, []);
    const setTileViewPersist = (v) => {
      setTileView(v);
      try {
        localStorage.setItem(TILE_VIEW_STORAGE_KEY, v);
      } catch {
      }
    };
    const triggerSyncAll = async () => {
      setStatus("syncing");
      try {
        const accounts = await api.listAccounts();
        await Promise.all(accounts.filter((a) => a.enabled).map((a) => api.syncAccount(a.id).catch(() => void 0)));
        await refresh();
        await refreshListEvents();
        if (tileView === "month") await refreshMonthEvents();
      } catch (e) {
        setStatus("error");
        setErrorMsg(e?.message ?? String(e));
      }
    };
    const refreshAllEvents = (0, import_react4.useCallback)(async () => {
      await refresh();
      await refreshListEvents();
      if (tileView === "month") await refreshMonthEvents();
    }, [refresh, refreshListEvents, refreshMonthEvents, tileView]);
    const monthEventsByDay = (0, import_react4.useMemo)(() => {
      const map = {};
      for (const ev of monthEvents) {
        const key = dateKeyFromIso(ev.dtstart);
        (map[key] = map[key] || []).push(ev);
      }
      for (const k of Object.keys(map)) map[k].sort((a, b) => a.dtstart.localeCompare(b.dtstart));
      return map;
    }, [monthEvents]);
    const selectedDayEvents = (0, import_react4.useMemo)(
      () => monthEventsByDay[dateKeyLocal(selectedDay)] ?? [],
      [monthEventsByDay, selectedDay]
    );
    const monthLabel = monthCursor.toLocaleDateString(localeToBcp47(locale), { month: "long", year: "numeric" });
    const openEventFromMonth = (ev) => {
      loadCalendars().catch(() => void 0);
      setEventDialog(ev);
    };
    const openDayPopup = (day) => {
      const d = startOfLocalDay(day);
      setSelectedDay(d);
      setDayPopup(d);
    };
    const shiftMonth = (delta) => {
      setMonthCursor((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + delta);
        return d;
      });
    };
    const goToday = () => {
      const t3 = startOfLocalDay(/* @__PURE__ */ new Date());
      setSelectedDay(t3);
      setMonthCursor(new Date(t3.getFullYear(), t3.getMonth(), 1));
    };
    const statusDotColor = status === "ok" ? "#4ade80" : status === "syncing" ? "var(--accent)" : status === "error" ? "#f87171" : "var(--text-muted)";
    const conflictColor = (summary?.conflicts ?? 0) > 0 ? "#f87171" : "var(--text)";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
        height: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        color: "var(--text)",
        overflow: "hidden"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border)"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--accent)" }, children: ICONS.calendar }),
            t2("calendar")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "4px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, { title: t2("viewMonth"), active: tileView === "month", onClick: () => setTileViewPersist("month"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { size: 14 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, { title: t2("viewCompact"), active: tileView === "compact", onClick: () => setTileViewPersist("compact"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { size: 14 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              IconButton,
              {
                title: writableCalendars.length > 0 ? t2("addEvent") : t2("setupCalendarFirst"),
                onClick: openNewEvent,
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, { title: t2("monthView"), onClick: openMonthModal, children: ICONS.calendar }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, { title: t2("sync"), onClick: triggerSyncAll, busy: status === "syncing", children: ICONS.sync }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, { title: t2("accounts"), onClick: () => {
              setModalInitialView("accounts");
              setModalOpen(true);
            }, children: ICONS.cog })
          ] })
        ] }),
        flash && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
          padding: "8px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          background: "rgba(74,222,128,0.12)",
          border: "1px solid #4ade80",
          color: "var(--text)"
        }, children: flash }),
        tileView === "compact" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatBox, { label: t2("today"), value: summary ? String(summary.todayCount) : "\u2013" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatBox, { label: t2("conflicts"), value: summary ? String(summary.conflicts) : "\u2013", valueColor: conflictColor })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flexGrow: 1, display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden", minHeight: 0 }, children: [
            !summary && listEvents.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }, children: "\u2026" }),
            compactUpcoming.length === 0 && summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              color: "var(--text-muted)",
              fontSize: "12px",
              fontStyle: "italic"
            }, children: t2("noUpcoming") }),
            compactUpcoming.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                onClick: () => openEventFromTile(ev),
                style: {
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${ev.calendarColor ?? "#5a9bd4"}`,
                  fontSize: "12px",
                  minWidth: 0
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: {
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    minWidth: "58px"
                  }, children: [
                    fmtDay(ev.dtstart, locale),
                    !ev.allDay && ` ${fmtTime(ev.dtstart, false, locale)}`
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ev.summary || t2("untitled") })
                ]
              },
              eventRowKey(ev)
            ))
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden", minHeight: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": t2("prev"), onClick: () => shiftMonth(-1), style: widgetNavBtnStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 14 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              flexGrow: 1,
              minWidth: 0,
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              textTransform: "capitalize"
            }, children: monthLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": t2("next"), onClick: () => shiftMonth(1), style: widgetNavBtnStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14 }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: goToday, style: {
            ...widgetNavBtnStyle,
            alignSelf: "center",
            fontSize: "11px",
            padding: "2px 10px"
          }, children: t2("todayBtn") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { overflow: "auto", flex: "0 0 auto", border: "1px solid var(--border)", borderRadius: "6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            MonthView,
            {
              locale,
              compact: true,
              countOnly: true,
              cursor: monthCursor,
              range: monthRange,
              selectedDay,
              eventsByDay: monthEventsByDay,
              onSelectDay: (d) => setSelectedDay(startOfLocalDay(d)),
              onClickDay: openDayPopup,
              onClickEvent: openEventFromMonth
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            WidgetDayEventsPanel,
            {
              locale,
              day: selectedDay,
              events: selectedDayEvents,
              canAdd: true,
              onAdd: openNewEvent,
              onClickEvent: openEventFromMonth,
              onOpenDayPopup: () => openDayPopup(selectedDay)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "6px",
          borderTop: "1px solid var(--border)",
          fontSize: "11px",
          color: "var(--text-muted)"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: statusDotColor,
              marginRight: "6px",
              ...status === "syncing" ? { animation: "sd-cal-pulse 1.2s ease-in-out infinite" } : {}
            } }),
            status === "ok" && t2("syncedAt"),
            status === "syncing" && t2("syncing"),
            status === "error" && `${t2("error")}: ${(errorMsg ?? "").slice(0, 40)}`,
            status === "loading" && "\u2026"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: openMonthModal,
              style: {
                all: "unset",
                cursor: "pointer",
                padding: "2px 8px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              },
              children: t2("open")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes sd-cal-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes sd-cal-spin { to { transform: rotate(360deg); } }
      ` }),
      modalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        CalendarModal,
        {
          locale,
          initialView: modalInitialView,
          onClose: () => {
            setModalOpen(false);
            void refreshAllEvents();
          }
        },
        modalInitialView
      ),
      eventDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        EventDialog,
        {
          locale,
          event: eventDialog,
          calendars: writableCalendars,
          onClose: () => setEventDialog(null),
          onSaved: (msg) => {
            setEventDialog(null);
            if (msg) showFlash(msg);
            void refreshAllEvents();
          }
        }
      ),
      dayPopup && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        DayEventsPopup,
        {
          locale,
          day: dayPopup,
          events: monthEventsByDay[dateKeyLocal(dayPopup)] ?? [],
          canAdd: true,
          onClose: () => setDayPopup(null),
          onAdd: () => {
            setDayPopup(null);
            const pick = pickDefaultWritableCalendar(writableCalendars);
            setEventDialog({
              calendarId: pick?.id ?? writableCalendars[0]?.id,
              allDay: false,
              dtstart: dayPopup.toISOString()
            });
          },
          onClickEvent: (ev) => {
            setDayPopup(null);
            openEventFromMonth(ev);
          }
        }
      )
    ] });
  }
  function IconButton({ children, onClick, title, busy, active }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick,
        title,
        style: {
          all: "unset",
          cursor: "pointer",
          width: "24px",
          height: "24px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          color: active ? "var(--accent)" : "var(--text-muted)",
          border: active ? "1px solid var(--accent)" : "1px solid transparent",
          background: active ? "var(--accent)14" : void 0
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.borderColor = "var(--border)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "transparent";
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: busy ? { animation: "sd-cal-spin 1s linear infinite", display: "inline-flex" } : { display: "inline-flex" }, children })
      }
    );
  }
  function StatBox({ label, value, valueColor }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "4px",
      padding: "8px 10px"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "20px", fontWeight: 600, lineHeight: 1.1, marginTop: "2px", color: valueColor ?? "var(--text)" }, children: value })
    ] });
  }
  function Settings({ config, onChange }) {
    const { locale } = usePluginLocale();
    const t2 = (k) => t(k, locale);
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }, children: t2("refreshInterval") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 15,
            value: config.refreshInterval ?? 60,
            onChange: (e) => onChange("refreshInterval", Math.max(15, Number(e.target.value)))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: locale === "de" ? "Konten und Kalender werden direkt im Kalender-Vollbild verwaltet (Zahnrad-Icon auf der Karte)." : "Manage accounts and calendars in the full-screen calendar view (cog icon on the tile)." })
    ] });
  }
  function CalendarModal({ locale, onClose, initialView = "month" }) {
    const t2 = (k) => t(k, locale);
    const [view, setView] = (0, import_react4.useState)(initialView);
    const [cursor, setCursor] = (0, import_react4.useState)(() => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(1);
      return d;
    });
    const [calendars, setCalendars] = (0, import_react4.useState)([]);
    const [accounts, setAccounts] = (0, import_react4.useState)([]);
    const [events, setEvents] = (0, import_react4.useState)([]);
    const [eventDialog, setEventDialog] = (0, import_react4.useState)(null);
    const [accountDialog, setAccountDialog] = (0, import_react4.useState)(null);
    const [loading, setLoading] = (0, import_react4.useState)(false);
    const [selectedDay, setSelectedDay] = (0, import_react4.useState)(() => startOfLocalDay(/* @__PURE__ */ new Date()));
    const [dayPopup, setDayPopup] = (0, import_react4.useState)(null);
    const range = (0, import_react4.useMemo)(() => {
      if (view === "agenda") {
        const start2 = /* @__PURE__ */ new Date();
        start2.setHours(0, 0, 0, 0);
        const end2 = new Date(start2);
        end2.setDate(end2.getDate() + 30);
        return { start: start2, end: end2 };
      }
      const start = new Date(cursor);
      start.setDate(1);
      start.setDate(1 - (start.getDay() + 6) % 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 42);
      return { start, end };
    }, [view, cursor]);
    const refresh = (0, import_react4.useCallback)(async () => {
      setLoading(true);
      try {
        const [cals, accs] = await Promise.all([api.listCalendars(), api.listAccounts()]);
        setCalendars(cals);
        setAccounts(accs);
        if (view !== "accounts") {
          const evs = await api.listEvents(range.start.toISOString(), range.end.toISOString());
          setEvents(evs);
        }
      } finally {
        setLoading(false);
      }
    }, [view, range]);
    (0, import_react4.useEffect)(() => {
      refresh();
    }, [refresh]);
    const toggleCalendar = async (id) => {
      const cal = calendars.find((c) => c.id === id);
      if (!cal) return;
      const visible = !isCalendarVisible(cal);
      await api.updateCalendar(id, { visible });
      setCalendars((prev) => prev.map((c) => c.id === id ? { ...c, visible } : c));
      if (view !== "accounts") {
        const evs = await api.listEvents(range.start.toISOString(), range.end.toISOString());
        setEvents(evs);
      }
    };
    const eventsByDay = (0, import_react4.useMemo)(() => {
      const map = {};
      for (const ev of events) {
        const key = dateKeyFromIso(ev.dtstart);
        (map[key] = map[key] || []).push(ev);
      }
      for (const k of Object.keys(map)) map[k].sort((a, b) => a.dtstart.localeCompare(b.dtstart));
      return map;
    }, [events]);
    const selectedDayEvents = eventsByDay[dateKeyLocal(selectedDay)] ?? [];
    const writableCalendars = calendars.filter((c) => !c.readOnly);
    const allWritableCalendars = writableCalendars;
    const title = view === "agenda" ? t2("agendaTitle") : view === "accounts" ? t2("accounts") : cursor.toLocaleDateString(localeToBcp47(locale), { month: "long", year: "numeric" });
    const openNewOnDay = (day) => {
      const pick = pickDefaultWritableCalendar(writableCalendars);
      if (!pick) {
        setView("accounts");
        return;
      }
      setEventDialog({
        event: {
          calendarId: pick.id,
          allDay: false,
          dtstart: startOfLocalDay(day).toISOString()
        }
      });
    };
    const openDayPopup = (day) => {
      setSelectedDay(startOfLocalDay(day));
      setDayPopup(startOfLocalDay(day));
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 25e3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              onClick: (e) => e.stopPropagation(),
              style: {
                width: "min(1100px, 100%)",
                height: "min(88vh, 920px)",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                overflow: "hidden",
                display: "grid",
                gridTemplateRows: "auto 1fr"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap"
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "17px", fontWeight: 600, minWidth: "220px", color: "var(--text)" }, children: title }),
                  view !== "accounts" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "inline-flex" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => view === "month" ? setCursor((d) => {
                      const n = new Date(d);
                      n.setMonth(n.getMonth() - 1);
                      return n;
                    }) : null, disabled: view === "agenda", children: "\u2039" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => {
                      const d = /* @__PURE__ */ new Date();
                      d.setDate(1);
                      setCursor(d);
                      setSelectedDay(startOfLocalDay(/* @__PURE__ */ new Date()));
                    }, children: t2("todayBtn") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => view === "month" ? setCursor((d) => {
                      const n = new Date(d);
                      n.setMonth(n.getMonth() + 1);
                      return n;
                    }) : null, disabled: view === "agenda", children: "\u203A" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "inline-flex" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => setView("month"), active: view === "month", children: t2("month") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => setView("agenda"), active: view === "agenda", children: t2("agenda") }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => setView("accounts"), active: view === "accounts", children: t2("accounts") })
                  ] }),
                  view !== "accounts" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    ModalBtn,
                    {
                      primary: true,
                      onClick: () => {
                        const pick = pickDefaultWritableCalendar(writableCalendars);
                        if (!pick) {
                          setView("accounts");
                          return;
                        }
                        setEventDialog({
                          event: { calendarId: pick.id, allDay: true, dtstart: (/* @__PURE__ */ new Date()).toISOString() }
                        });
                      },
                      children: t2("newEvent")
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { ghost: true, onClick: onClose, children: ICONS.close })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }, children: [
                  view !== "accounts" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarFilterBar, { accounts, calendars, onToggle: toggleCalendar, t: t2 }),
                  false,
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { style: { flex: 1, overflow: "auto", background: "var(--background)", minWidth: 0, minHeight: 0 }, children: [
                    view === "month" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", minHeight: "100%" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        MonthView,
                        {
                          locale,
                          compact: true,
                          cursor,
                          range,
                          selectedDay,
                          eventsByDay,
                          onSelectDay: (day) => setSelectedDay(startOfLocalDay(day)),
                          onClickDay: openDayPopup,
                          onClickEvent: (ev) => setEventDialog({ event: ev })
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        DayEventsPanel,
                        {
                          locale,
                          day: selectedDay,
                          events: selectedDayEvents,
                          canAdd: true,
                          onAdd: () => openNewOnDay(selectedDay),
                          onClickEvent: (ev) => setEventDialog({ event: ev })
                        }
                      )
                    ] }),
                    view === "agenda" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      AgendaView,
                      {
                        eventsByDay,
                        locale,
                        onClickEvent: (ev) => setEventDialog({ event: ev })
                      }
                    ),
                    view === "accounts" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      AccountsView,
                      {
                        accounts,
                        calendars,
                        locale,
                        onAddCaldav: () => setAccountDialog({ mode: "create", provider: "caldav" }),
                        onAddIcs: () => setAccountDialog({ mode: "create", provider: "ics" }),
                        onEditAccount: (a) => setAccountDialog({ mode: "edit", account: a }),
                        onRefresh: refresh
                      }
                    )
                  ] })
                ] })
              ]
            }
          ),
          eventDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            EventDialog,
            {
              locale,
              event: eventDialog.event,
              calendars: allWritableCalendars,
              onClose: () => setEventDialog(null),
              onSaved: () => {
                setEventDialog(null);
                refresh();
              }
            }
          ),
          accountDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            AccountDialog,
            {
              locale,
              target: accountDialog,
              onClose: () => setAccountDialog(null),
              onSaved: () => {
                setAccountDialog(null);
                refresh();
              }
            }
          ),
          dayPopup && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            DayEventsPopup,
            {
              locale,
              day: dayPopup,
              events: eventsByDay[dateKeyLocal(dayPopup)] ?? [],
              canAdd: true,
              onClose: () => setDayPopup(null),
              onAdd: () => {
                setDayPopup(null);
                openNewOnDay(dayPopup);
              },
              onClickEvent: (ev) => {
                setDayPopup(null);
                setEventDialog({ event: ev });
              }
            }
          )
        ]
      }
    ) });
  }
  function CalendarFilterBar({ accounts, calendars, onToggle, t: t2 }) {
    if (!calendars.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      padding: "8px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "10px", color: "var(--text-muted)", alignSelf: "center", marginRight: "4px" }, children: [
        t2("calendars"),
        ":"
      ] }),
      accounts.flatMap((a) => calendars.filter((c) => c.accountId === a.id).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          onClick: () => onToggle(c.id),
          style: {
            all: "unset",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            border: `1px solid ${!isCalendarVisible(c) ? "var(--border)" : c.color}`,
            opacity: !isCalendarVisible(c) ? 0.45 : 1,
            color: "var(--text)",
            background: !isCalendarVisible(c) ? "transparent" : `${c.color}22`
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: "8px", height: "8px", borderRadius: "2px", background: c.color } }),
            c.name
          ]
        },
        c.id
      )))
    ] });
  }
  function DayEventsPopup({ locale, day, events, canAdd, onClose, onAdd, onClickEvent }) {
    const t2 = (k) => t(k, locale);
    const sorted = (0, import_react4.useMemo)(
      () => [...events].sort((a, b) => a.dtstart.localeCompare(b.dtstart)),
      [events]
    );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 26e3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "min(420px, 92vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "15px", fontWeight: 600, color: "var(--text)" }, children: [
              fmtFullDay(day, locale),
              sorted.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }, children: [
                "(",
                sorted.length,
                " ",
                t2("eventCount"),
                ")"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { all: "unset", cursor: "pointer", color: "var(--text-muted)" }, children: ICONS.close })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "12px 16px", overflowY: "auto", flex: 1 }, children: [
            !sorted.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }, children: t2("noEventsThisDay") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: sorted.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                onClick: () => onClickEvent(ev),
                style: {
                  all: "unset",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "grid",
                  gridTemplateColumns: "72px 4px 1fr",
                  gap: "10px",
                  alignItems: "center",
                  padding: "8px 10px",
                  background: "var(--background)",
                  borderRadius: "6px",
                  border: "1px solid var(--border)"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: "var(--text-muted)" }, children: ev.allDay ? t2("allDay") : fmtTime(ev.dtstart, false, locale) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: ev.calendarColor ?? "#5a9bd4", width: "4px", height: "100%", borderRadius: "2px" } }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "14px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ev.summary || t2("untitled") })
                ]
              },
              eventRowKey(ev)
            )) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: onClose, children: t2("close") }),
            canAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: onAdd, children: t2("newEvent") })
          ] })
        ] })
      }
    ) });
  }
  function WidgetDayEventsPanel({ locale, day, events, canAdd, onAdd, onClickEvent, onOpenDayPopup }) {
    const t2 = (k) => t(k, locale);
    const sorted = (0, import_react4.useMemo)(
      () => [...events].sort((a, b) => a.dtstart.localeCompare(b.dtstart)),
      [events]
    );
    const dayLabel = day.toLocaleDateString(localeToBcp47(locale), {
      weekday: "short",
      day: "2-digit",
      month: "short"
    });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
      flexGrow: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      background: "var(--surface)",
      overflow: "hidden"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "6px 10px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: [
          dayLabel,
          sorted.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { marginLeft: "6px", fontWeight: 400, color: "var(--text-muted)" }, children: [
            "(",
            sorted.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "4px", flexShrink: 0 }, children: [
          canAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onAdd, title: t2("addEvent"), style: widgetMiniBtnStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onOpenDayPopup, title: t2("openDay"), style: widgetMiniBtnStyle, children: ICONS.calendar })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flexGrow: 1, overflowY: "auto", padding: "4px 8px 8px", minHeight: 0 }, children: !sorted.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--text-muted)", fontSize: "11px", fontStyle: "italic", padding: "4px 2px" }, children: t2("noEventsThisDay") }) : sorted.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          onClick: () => onClickEvent(ev),
          style: {
            all: "unset",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "5px 6px",
            marginBottom: "4px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            borderLeft: `3px solid ${ev.calendarColor ?? "#5a9bd4"}`,
            fontSize: "11px",
            minWidth: 0,
            boxSizing: "border-box"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: "10px", color: "var(--text-muted)", minWidth: "44px", flexShrink: 0 }, children: ev.allDay ? t2("allDay") : fmtTime(ev.dtstart, false, locale) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)" }, children: ev.summary || t2("untitled") })
          ]
        },
        eventRowKey(ev)
      )) })
    ] });
  }
  function DayEventsPanel({ locale, day, events, canAdd, onAdd, onClickEvent }) {
    const t2 = (k) => t(k, locale);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      padding: "12px 16px",
      flex: "1 1 40%",
      minHeight: "140px",
      overflowY: "auto"
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--text)" }, children: [
          t2("dayEvents"),
          " ",
          fmtFullDay(day, locale)
        ] }),
        canAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: onAdd, children: t2("newEvent") })
      ] }),
      !events.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }, children: t2("noEventsThisDay") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: events.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          onClick: () => onClickEvent(ev),
          style: {
            all: "unset",
            cursor: "pointer",
            textAlign: "left",
            display: "grid",
            gridTemplateColumns: "72px 4px 1fr",
            gap: "10px",
            alignItems: "center",
            padding: "8px 10px",
            background: "var(--background)",
            borderRadius: "6px",
            border: "1px solid var(--border)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: "var(--text-muted)" }, children: ev.allDay ? t2("allDay") : fmtTime(ev.dtstart, false, locale) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: ev.calendarColor ?? "#5a9bd4", width: "4px", height: "100%", borderRadius: "2px" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "14px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: ev.summary || t2("untitled") })
          ]
        },
        ev.id
      )) })
    ] });
  }
  function ModalBtn({ children, onClick, active, primary, ghost, disabled }) {
    const bg = primary ? "var(--accent)" : ghost ? "transparent" : "var(--background)";
    const color = primary ? "#fff" : active ? "var(--accent)" : "var(--text)";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => !disabled && onClick && onClick(),
        disabled,
        style: {
          all: "unset",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: "6px 12px",
          background: bg,
          color,
          border: `1px solid ${primary ? "var(--accent)" : active ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "4px",
          fontSize: "13px",
          opacity: disabled ? 0.4 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        },
        children
      }
    );
  }
  function MonthView({ locale, cursor, range, eventsByDay, selectedDay, compact, countOnly, onSelectDay, onClickDay, onClickEvent }) {
    const t2 = (k) => t(k, locale);
    const weekdays = (0, import_react4.useMemo)(() => weekdayShortLabels(locale), [locale]);
    const today = startOfLocalDay(/* @__PURE__ */ new Date());
    const month = cursor.getMonth();
    const selectedKey = dateKeyLocal(selectedDay);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(range.start);
      d.setDate(range.start.getDate() + i);
      cells.push(d);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gridAutoRows: countOnly ? "minmax(40px, auto)" : compact ? "minmax(52px, auto)" : "minmax(96px, 1fr)",
      flex: compact ? "0 0 auto" : void 0,
      minHeight: compact ? void 0 : "360px"
    }, children: [
      weekdays.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
        padding: "6px 8px",
        textAlign: "right",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        borderRight: "1px solid var(--border)"
      }, children: w }, w)),
      cells.map((day, i) => {
        const key = dateKeyLocal(day);
        const dayEvents = eventsByDay[key] || [];
        const visible = dayEvents.slice(0, compact ? 2 : 3);
        const more = dayEvents.length - visible.length;
        const isOther = day.getMonth() !== month;
        const isToday = dateKeyLocal(day) === dateKeyLocal(today);
        const isSelected = key === selectedKey;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            onClick: () => {
              onSelectDay(day);
              onClickDay(day);
            },
            style: {
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              padding: "4px 4px 4px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              cursor: "pointer",
              background: isSelected ? "var(--accent)14" : isOther ? "rgba(0,0,0,0.10)" : void 0,
              outline: isSelected ? "2px solid var(--accent)" : void 0,
              outlineOffset: "-2px",
              overflow: "hidden",
              minWidth: 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                fontSize: "11px",
                fontWeight: 500,
                marginLeft: "auto",
                marginBottom: "2px",
                color: isOther ? "var(--text-muted)" : "var(--text)",
                ...isToday ? {
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                } : {}
              }, children: day.getDate() }),
              countOnly ? dayEvents.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "2px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                fontSize: "10px",
                fontWeight: 700,
                lineHeight: 1,
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "10px",
                minWidth: "18px",
                padding: "2px 6px",
                textAlign: "center"
              }, children: dayEvents.length }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }, children: [
                visible.map((ev) => {
                  const isConflict = ev.syncState === "conflict";
                  const isPending = ev.syncState !== "synced" && ev.syncState !== "local_new";
                  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        onClickEvent(ev);
                      },
                      style: {
                        all: "unset",
                        cursor: "pointer",
                        fontSize: "10px",
                        padding: "2px 5px",
                        borderRadius: "3px",
                        background: isConflict ? "#f87171" : ev.calendarColor ?? "#5a9bd4",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        borderLeft: "2px solid rgba(0,0,0,0.25)",
                        opacity: isPending ? 0.7 : 1,
                        ...isConflict ? { animation: "sd-cal-pulse 1.5s ease-in-out infinite" } : {}
                      },
                      children: ev.allDay ? ev.summary : `${fmtTime(ev.dtstart, false, locale)} ${ev.summary ?? ""}`
                    },
                    eventRowKey(ev)
                  );
                }),
                more > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "9px", color: "var(--text-muted)", textAlign: "right", padding: "0 4px" }, children: [
                  "+",
                  more,
                  " ",
                  t2("moreEvents")
                ] })
              ] })
            ]
          },
          i
        );
      })
    ] });
  }
  function AgendaView({ eventsByDay, locale, onClickEvent }) {
    const t2 = (k) => t(k, locale);
    const days = Object.keys(eventsByDay).sort();
    if (!days.length) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "24px", color: "var(--text-muted)", fontStyle: "italic" }, children: t2("noUpcoming") });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
      padding: "16px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      maxWidth: "800px",
      margin: "0 auto"
    }, children: days.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "4px"
      }, children: fmtFullDay(new Date(k), locale) }),
      eventsByDay[k].map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          onClick: () => onClickEvent(ev),
          style: {
            all: "unset",
            cursor: "pointer",
            display: "grid",
            gridTemplateColumns: "80px 4px 1fr auto",
            gap: "12px",
            alignItems: "center",
            padding: "10px",
            background: "var(--surface)",
            borderRadius: "4px",
            border: "1px solid var(--border)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontFamily: "ui-monospace, monospace", fontSize: "12px", color: "var(--text-muted)" }, children: ev.allDay ? t2("allDay") : fmtTime(ev.dtstart, false, locale) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: ev.calendarColor ?? "#5a9bd4", width: "4px", height: "100%", borderRadius: "2px" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "14px", color: "var(--text)" }, children: ev.summary || t2("untitled") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: ev.calendarName ?? "" })
            ] }),
            ev.syncState === "conflict" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "#f87171", fontSize: "11px" }, children: [
              "\u26A0 ",
              t("conflicts", locale)
            ] })
          ]
        },
        ev.id
      ))
    ] }, k)) });
  }
  function AccountsView({ accounts, calendars, locale, onAddCaldav, onAddIcs, onEditAccount, onRefresh }) {
    const t2 = (k) => t(k, locale);
    const [defaultCalId, setDefaultCalId] = (0, import_react4.useState)(() => loadDefaultCalendarId());
    const toggleVisible = async (c) => {
      const visible = !isCalendarVisible(c);
      await api.updateCalendar(c.id, { visible });
      onRefresh();
    };
    const setDefault = (id) => {
      saveDefaultCalendarId(id);
      setDefaultCalId(id);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "24px", maxWidth: "900px", margin: "0 auto" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px", marginBottom: "20px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: onAddCaldav, children: t2("addCaldav") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: onAddIcs, children: t2("addIcs") })
      ] }),
      accounts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
        padding: "14px 16px",
        background: "rgba(90,155,212,0.08)",
        border: "1px solid #5a9bd4",
        borderRadius: "4px",
        fontSize: "13px",
        color: "var(--text)"
      }, children: t2("nothingHere") }),
      accounts.map((a) => {
        const cals = calendars.filter((c) => c.accountId === a.id);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { color: "var(--text)" }, children: a.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
              fontSize: "10px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }, children: a.provider }),
            a.lastSyncStatus === "ok" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "#4ade80", fontSize: "11px" }, children: [
              "\u2713 ",
              t("syncedAt", locale)
            ] }),
            a.lastSyncStatus === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: {
              padding: "4px 8px",
              fontSize: "11px",
              background: "rgba(248,113,113,0.10)",
              border: "1px solid #f87171",
              borderRadius: "4px"
            }, children: [
              "\u26A0 ",
              a.lastSyncError ?? t2("error")
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => onEditAccount(a), children: t2("editAccount") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: async () => {
              await api.syncAccount(a.id);
              onRefresh();
            }, children: t2("sync") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: async () => {
              if (!confirm(t2("confirmDeleteAccount"))) return;
              await api.deleteAccount(a.id);
              onRefresh();
            }, children: t2("remove") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }, children: [
            a.endpoint ?? "",
            " \xB7 ",
            a.calendarCount,
            " ",
            t("calendars", locale).toLowerCase(),
            " \xB7",
            locale === "de" ? " letzter Sync: " : " last sync: ",
            a.lastSyncAt ?? "nie / never"
          ] }),
          cals.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 0",
            borderTop: "1px solid var(--border)"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: isCalendarVisible(c),
                title: isCalendarVisible(c) ? t2("calendarInactive") : t2("calendarActive"),
                onChange: () => {
                  void toggleVisible(c);
                },
                style: { width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "color",
                value: c.color,
                onChange: async (e) => {
                  await api.updateCalendar(c.id, { color: e.target.value });
                  onRefresh();
                },
                style: { width: "32px", height: "24px", padding: 0, border: 0, background: "transparent", cursor: "pointer" }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
              flex: 1,
              fontSize: "13px",
              color: "var(--text)",
              opacity: isCalendarVisible(c) ? 1 : 0.45
            }, children: c.name }),
            !c.readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                title: t2("setDefaultCalendar"),
                onClick: () => setDefault(c.id),
                style: {
                  all: "unset",
                  cursor: "pointer",
                  fontSize: "15px",
                  lineHeight: 1,
                  color: defaultCalId === c.id ? "var(--accent)" : "var(--text-muted)"
                },
                children: defaultCalId === c.id ? "\u2605" : "\u2606"
              }
            ),
            c.readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: [
              "\u{1F512} ",
              t2("readOnly")
            ] }),
            defaultCalId === c.id && !c.readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "var(--accent)", textTransform: "uppercase" }, children: t2("defaultCalendar") })
          ] }, c.id))
        ] }, a.id);
      })
    ] });
  }
  function EventDialog({ event, calendars, locale, onClose, onSaved }) {
    const t2 = (k) => t(k, locale);
    const isNew = !event?.id;
    const isConflict = event?.syncState === "conflict";
    const defaultCal = pickDefaultWritableCalendar(calendars) ?? calendars[0];
    const [form, setForm] = (0, import_react4.useState)({
      calendarId: event?.calendarId ?? defaultCal?.id ?? "",
      summary: event?.summary ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      dtstart: event?.dtstart ?? (/* @__PURE__ */ new Date()).toISOString(),
      dtend: event?.dtend ?? "",
      allDay: event?.allDay ?? false,
      rrule: event?.rrule ?? ""
    });
    const [error, setError] = (0, import_react4.useState)(null);
    const [success, setSuccess] = (0, import_react4.useState)(null);
    const [saving, setSaving] = (0, import_react4.useState)(false);
    const selectedCal = calendars.find((c) => c.id === form.calendarId);
    const calendarReadOnly = Boolean(selectedCal?.readOnly);
    const inp = {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "4px",
      padding: "6px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%"
    };
    const save = async () => {
      if (!form.calendarId || calendarReadOnly) {
        setError(t2("pickWritableCalendar"));
        return;
      }
      setError(null);
      setSuccess(null);
      setSaving(true);
      try {
        const payload = {
          calendarId: form.calendarId,
          summary: form.summary,
          description: form.description,
          location: form.location,
          allDay: form.allDay,
          dtstart: form.dtstart.length === 10 ? form.dtstart : fromInputDateTime(toInputDateTime(form.dtstart)),
          dtend: form.dtend ? form.dtend.length === 10 ? form.dtend : fromInputDateTime(toInputDateTime(form.dtend)) : void 0,
          rrule: form.rrule || void 0
        };
        const res = isNew ? await api.createEvent(payload) : await api.updateEvent(event.id, payload);
        const syncErr = res?.syncError;
        const syncPending = res?.syncPending;
        const fatal = res?.error;
        if (fatal) {
          setError(fatal);
          return;
        }
        const msg = syncErr ? `${t2("syncFailed")}: ${syncErr}` : syncPending ? t2("eventSavedSyncing") : t2("eventSaved");
        setSuccess(msg);
        window.setTimeout(() => onSaved(syncErr ? void 0 : msg), syncErr ? 2200 : 1100);
      } catch (e) {
        setError(e?.message ?? String(e));
      } finally {
        setSaving(false);
      }
    };
    const del = async () => {
      if (!event?.id) return;
      if (!confirm(t2("confirmDeleteEvent"))) return;
      try {
        await api.deleteEvent(event.id);
        onSaved();
      } catch (e) {
        setError(e?.message ?? String(e));
      }
    };
    const resolve = async (side) => {
      if (!event?.id) return;
      try {
        await api.resolveConflict(event.id, side);
        onSaved();
      } catch (e) {
        setError(e?.message ?? String(e));
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 27e3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "min(520px, 92vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "15px", fontWeight: 600, color: "var(--text)" }, children: isNew ? locale === "de" ? "Neuer Termin" : "New event" : locale === "de" ? "Termin bearbeiten" : "Edit event" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { all: "unset", cursor: "pointer", color: "var(--text-muted)" }, children: ICONS.close })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }, children: [
            isConflict && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              padding: "10px 12px",
              fontSize: "12px",
              background: "rgba(251,191,36,0.10)",
              border: "1px solid #fbbf24",
              borderRadius: "4px",
              color: "var(--text)"
            }, children: t2("conflictBanner") }),
            error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              padding: "10px 12px",
              fontSize: "12px",
              background: "rgba(248,113,113,0.10)",
              border: "1px solid #f87171",
              borderRadius: "4px",
              color: "var(--text)"
            }, children: error }),
            success && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              padding: "10px 12px",
              fontSize: "12px",
              background: "rgba(74,222,128,0.12)",
              border: "1px solid #4ade80",
              borderRadius: "4px",
              color: "var(--text)"
            }, children: success }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("title"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: form.summary, onChange: (e) => setForm({ ...form, summary: e.target.value }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { label: t2("selectCalendar"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { style: inp, value: form.calendarId, onChange: (e) => setForm({ ...form, calendarId: e.target.value }), children: calendars.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: c.id, children: [
                c.name,
                c.readOnly ? ` (${t2("readOnly")})` : ""
              ] }, c.id)) }),
              calendarReadOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "11px", color: "#fbbf24", marginTop: "4px" }, children: t2("readOnlyCalendarHint") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: form.allDay, onChange: (e) => setForm({ ...form, allDay: e.target.checked }) }),
              t2("allDay")
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("start"), flex: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: form.allDay ? "date" : "datetime-local",
                  value: form.allDay ? form.dtstart.slice(0, 10) : toInputDateTime(form.dtstart),
                  onChange: (e) => setForm({ ...form, dtstart: form.allDay ? e.target.value : fromInputDateTime(e.target.value) })
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("end"), flex: true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: form.allDay ? "date" : "datetime-local",
                  value: form.allDay ? (form.dtend || "").slice(0, 10) : form.dtend ? toInputDateTime(form.dtend) : "",
                  onChange: (e) => setForm({ ...form, dtend: form.allDay ? e.target.value : fromInputDateTime(e.target.value) })
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("location"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: form.location, onChange: (e) => setForm({ ...form, location: e.target.value }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("notes"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "textarea",
              {
                style: { ...inp, minHeight: "60px", resize: "vertical" },
                value: form.description,
                onChange: (e) => setForm({ ...form, description: e.target.value })
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("recurrence"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: inp, value: form.rrule, onChange: (e) => setForm({ ...form, rrule: e.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", children: t2("noRecurrence") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "FREQ=DAILY", children: t2("daily") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "FREQ=WEEKLY", children: t2("weekly") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "FREQ=MONTHLY", children: t2("monthly") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "FREQ=YEARLY", children: t2("yearly") })
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px"
          }, children: [
            !isNew && !isConflict && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: del, children: t2("delete") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
            isConflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: () => resolve("remote"), children: t2("keepRemote") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: () => resolve("local"), children: t2("keepLocal") })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: onClose, disabled: saving, children: t2("cancel") }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: save, disabled: saving || calendarReadOnly, children: saving ? t2("saving") : isNew ? t2("add") : t2("save") })
            ] })
          ] })
        ] })
      }
    ) });
  }
  function Field({ label, children, flex }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "4px", ...flex ? { flex: 1 } : {} }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: {
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--text-muted)"
      }, children: label }),
      children
    ] });
  }
  function AccountDialog({ target, locale, onClose, onSaved }) {
    const t2 = (k) => t(k, locale);
    const isEdit = target.mode === "edit";
    const provider = isEdit ? target.account.provider : target.provider;
    const [form, setForm] = (0, import_react4.useState)(() => {
      if (isEdit) {
        return {
          name: target.account.name,
          url: target.account.url ?? "",
          username: target.account.username ?? "",
          password: "",
          verifySsl: true
        };
      }
      return { name: "", url: "", username: "", password: "", verifySsl: true };
    });
    const [error, setError] = (0, import_react4.useState)(null);
    const [saving, setSaving] = (0, import_react4.useState)(false);
    const inp = {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "4px",
      padding: "6px 10px",
      fontSize: "13px",
      outline: "none",
      width: "100%"
    };
    const save = async () => {
      setError(null);
      setSaving(true);
      try {
        if (isEdit) {
          const body = { name: form.name || target.account.name };
          if (provider === "caldav") {
            body.caldav = {
              url: form.url,
              username: form.username,
              verifySsl: form.verifySsl,
              ...form.password ? { password: form.password } : {}
            };
          } else {
            body.ics = {
              url: form.url,
              username: form.username || void 0,
              ...form.password ? { password: form.password } : {}
            };
          }
          await api.updateAccount(target.account.id, body);
        } else {
          const body = provider === "caldav" ? { name: form.name || form.url, provider, caldav: { url: form.url, username: form.username, password: form.password, verifySsl: form.verifySsl } } : { name: form.name || form.url, provider, ics: { url: form.url, username: form.username || void 0, password: form.password || void 0 } };
          await api.createAccount(body);
        }
        onSaved();
      } catch (e) {
        setError(e?.message ?? String(e));
      } finally {
        setSaving(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 20001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "min(480px, 92vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "15px", fontWeight: 600, color: "var(--text)" }, children: isEdit ? t2("editAccountTitle") : provider === "caldav" ? t2("addCaldav") : t2("addIcs") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onClose, style: { all: "unset", cursor: "pointer", color: "var(--text-muted)" }, children: ICONS.close })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("displayName"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                style: inp,
                value: form.name,
                onChange: (e) => setForm({ ...form, name: e.target.value }),
                placeholder: provider === "caldav" ? "iCloud privat" : "Schulferien BW"
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("url"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                style: inp,
                value: form.url,
                onChange: (e) => setForm({ ...form, url: e.target.value }),
                placeholder: provider === "caldav" ? "https://caldav.icloud.com/  or  https://nextcloud.example.com/remote.php/dav/" : "https://\u2026 .ics  or  webcal://\u2026"
              }
            ) }),
            provider === "caldav" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("username"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: form.username, onChange: (e) => setForm({ ...form, username: e.target.value }) }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("appPassword"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: "password",
                  value: form.password,
                  onChange: (e) => setForm({ ...form, password: e.target.value }),
                  placeholder: isEdit ? t2("passwordLeaveBlank") : void 0
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "inline-flex", gap: "8px", fontSize: "13px", color: "var(--text)" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: form.verifySsl, onChange: (e) => setForm({ ...form, verifySsl: e.target.checked }) }),
                t2("verifySsl")
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                padding: "10px 12px",
                fontSize: "12px",
                background: "rgba(90,155,212,0.08)",
                border: "1px solid #5a9bd4",
                borderRadius: "4px",
                color: "var(--text)"
              }, children: t2("iCloudHint") })
            ] }),
            provider === "ics" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { style: { fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }, children: locale === "de" ? "Mit Authentifizierung (selten)" : "With authentication (rare)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("username"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: form.username, onChange: (e) => setForm({ ...form, username: e.target.value }) }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: t2("password"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, type: "password", value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }) }) })
              ] })
            ] }),
            error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              padding: "10px 12px",
              fontSize: "12px",
              background: "rgba(248,113,113,0.10)",
              border: "1px solid #f87171",
              borderRadius: "4px",
              color: "var(--text)"
            }, children: error })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { onClick: onClose, children: t2("cancel") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalBtn, { primary: true, onClick: save, children: saving ? "\u2026" : isEdit ? t2("save") : t2("add") })
          ] })
        ] })
      }
    ) });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/calendar.tsx
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
lucide-react/dist/esm/icons/chevron-left.js:
lucide-react/dist/esm/icons/chevron-right.js:
lucide-react/dist/esm/icons/layout-grid.js:
lucide-react/dist/esm/icons/list.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
