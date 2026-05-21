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

  // plugins/adguard/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/activity.js
  var Activity = createLucideIcon("Activity", [
    [
      "path",
      {
        d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
        key: "169zse"
      }
    ]
  ]);

  // node_modules/lucide-react/dist/esm/icons/ban.js
  var Ban = createLucideIcon("Ban", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "m4.9 4.9 14.2 14.2", key: "1m5liu" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/network.js
  var Network = createLucideIcon("Network", [
    ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1", key: "4q2zg0" }],
    ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1", key: "8cvhb9" }],
    ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1", key: "1egb70" }],
    ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", key: "1jsf9p" }],
    ["path", { d: "M12 12V8", key: "2874zd" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/percent.js
  var Percent = createLucideIcon("Percent", [
    ["line", { x1: "19", x2: "5", y1: "5", y2: "19", key: "1x9vlm" }],
    ["circle", { cx: "6.5", cy: "6.5", r: "2.5", key: "4mh3h7" }],
    ["circle", { cx: "17.5", cy: "17.5", r: "2.5", key: "1mdrzq" }]
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

  // plugins/adguard/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "adguard",
    name: "AdGuard Home",
    description: "DNS-Statistik und Schutzstatus per AdGuard-Home-API (Basis-URL + optional Basic-Auth). Schutz per Klick umschalten. Daten via /api/adguard (CORS-frei).",
    version: "1.1.6",
    author: "SelfDashboard",
    category: "network",
    icon: "\u{1F6E1}\uFE0F",
    iconUrl: "/plugin-logos/adguard.png"
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
    return s;
  }
  function seriesOrScalar(stats, numKey, seriesKey) {
    const s = stats[seriesKey];
    if (Array.isArray(s) && s.length > 0) {
      return s.reduce((acc, x) => acc + (Number(x) || 0), 0);
    }
    const n = stats[numKey];
    if (typeof n === "number" && Number.isFinite(n)) return n;
    return 0;
  }
  function dnsQueries(stats) {
    return Math.round(seriesOrScalar(stats, "num_dns_queries", "dns_queries"));
  }
  function blockedTotal(stats) {
    return Math.round(
      seriesOrScalar(stats, "num_blocked_filtering", "blocked_filtering") + seriesOrScalar(stats, "num_replaced_safebrowsing", "replaced_safebrowsing") + seriesOrScalar(stats, "num_replaced_parental", "replaced_parental") + seriesOrScalar(stats, "num_replaced_safesearch", "replaced_safesearch") + num(stats.blocked_threat) + num(stats.blocked_malware) + num(stats.blocked_ad)
    );
  }
  function formatInt(n, locale) {
    return Math.round(n).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
  }
  var TINT = {
    sky: { solid: "#38bdf8", wash: "rgba(56, 189, 248, 0.2)", rim: "rgba(56, 189, 248, 0.38)" },
    rose: { solid: "#fb7185", wash: "rgba(251, 113, 133, 0.18)", rim: "rgba(251, 113, 133, 0.4)" },
    violet: { solid: "#c084fc", wash: "rgba(192, 132, 252, 0.2)", rim: "rgba(192, 132, 252, 0.38)" },
    emerald: { solid: "#34d399", wash: "rgba(52, 211, 153, 0.18)", rim: "rgba(52, 211, 153, 0.38)" }
  };
  function StatTile({
    label,
    value,
    tint,
    icon: Icon2,
    footer
  }) {
    const c = TINT[tint];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "sd-adguard-tile",
        style: {
          borderRadius: "12px",
          background: `linear-gradient(118deg, ${c.wash} 0%, var(--surface-2) 52%, var(--surface-2) 100%)`,
          border: "1px solid var(--border)",
          boxShadow: `inset 0 0 0 1px ${c.rim}55, inset 0 1px 0 rgba(255,255,255,0.04)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: footer ? "space-between" : "center",
          gap: "2px",
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon2, { size: 13, strokeWidth: 2.25, style: { color: c.solid, flexShrink: 0, opacity: 0.95 }, "aria-hidden": true }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "span",
              {
                className: "sd-adguard-tile-label",
                style: {
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  lineHeight: 1.2,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                },
                children: label
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: "tabular-nums sd-adguard-tile-value",
              style: {
                fontWeight: 800,
                color: c.solid,
                lineHeight: 1.12,
                fontVariantNumeric: "tabular-nums",
                marginTop: "4px"
              },
              children: value
            }
          ),
          footer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: "auto", width: "100%", flexShrink: 0 }, children: footer }) : null
        ]
      }
    );
  }
  function Widget({ config }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const base = normalizeBase(str(config.url));
    const username = str(config.username);
    const password = str(config.password);
    const refreshSec = Math.min(300, Math.max(10, Math.round(num(config.refreshSeconds) || 20)));
    const [data, setData] = (0, import_react4.useState)(null);
    const [error, setError] = (0, import_react4.useState)(null);
    const [loading, setLoading] = (0, import_react4.useState)(true);
    const [protBusy, setProtBusy] = (0, import_react4.useState)(false);
    const fetch_ = (0, import_react4.useCallback)(async () => {
      if (!base) {
        setLoading(false);
        return;
      }
      try {
        const j = await pluginApiJson("adguard", "/", {
          method: "POST",
          body: JSON.stringify({ url: base, username, password })
        });
        setData({
          stats: j.stats ?? {},
          status: j.status ?? null,
          statsConfig: j.statsConfig ?? null
        });
        setError(null);
      } catch (e) {
        reportPluginCatch("adguard", e, "fetch");
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("401") || msg.includes("403")) {
          setError(de ? "Anmeldung fehlgeschlagen (Benutzer/Passwort)." : "Login failed (user/password).");
        } else if (msg.includes("timeout")) {
          setError(de ? "Zeit\xFCberschreitung \u2014 AdGuard erreichbar?" : "Timeout \u2014 is AdGuard reachable?");
        } else {
          setError(de ? `API-Fehler: ${msg}` : `API error: ${msg}`);
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [base, username, password, de]);
    const toggleProtection = (0, import_react4.useCallback)(async () => {
      if (!base || protBusy) return;
      const currentlyOn = data?.status?.protection_enabled === true;
      const next = !currentlyOn;
      setProtBusy(true);
      setError(null);
      try {
        await pluginApiJson("adguard", "/", {
          method: "POST",
          body: JSON.stringify({ action: "protection", url: base, username, password, enabled: next })
        });
        await fetch_();
      } catch (e) {
        reportPluginCatch("adguard", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setProtBusy(false);
      }
    }, [base, username, password, de, protBusy, data?.status?.protection_enabled, fetch_]);
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
            textAlign: "center",
            background: "radial-gradient(ellipse at 50% 35%, rgba(56,189,248,0.14) 0%, transparent 58%)"
          },
          children: [
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
                  background: "linear-gradient(145deg, rgba(56,189,248,0.22), rgba(192,132,252,0.18))",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.22)"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 30, strokeWidth: 2, style: { color: "#7dd3fc" }, "aria-hidden": true })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.45, maxWidth: "22em" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--accent)", fontWeight: 600 }, children: "AdGuard Home" }),
              " \u2014 Basis-URL in den Einstellungen eintragen"
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--accent)", fontWeight: 600 }, children: "AdGuard Home" }),
              " \u2014 set the base URL in settings"
            ] }) })
          ]
        }
      );
    }
    if (loading && !data) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sd-plugin-no-scrollbar", style: shellPadded, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [75, 50, 90, 40].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "10px", width: `${w}%`, borderRadius: "3px" } }, i)) }) });
    }
    if (error && !data) {
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
            textAlign: "center",
            background: "radial-gradient(ellipse at 50% 30%, rgba(251,113,133,0.12) 0%, transparent 55%)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(145deg, rgba(251,113,133,0.25), rgba(244,63,94,0.12))",
                  border: "1px solid rgba(251, 113, 133, 0.45)"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { size: 24, strokeWidth: 2, style: { color: "#fda4af" }, "aria-hidden": true })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text)", marginTop: "10px", wordBreak: "break-word", maxWidth: "100%", fontWeight: 600 }, children: error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? "URL (http://IP:Port), Benutzer und Passwort wie im AdGuard-Web-UI pr\xFCfen." : "Check URL (http://IP:port), username and password as in the AdGuard web UI." })
          ]
        }
      );
    }
    const stats = data?.stats ?? {};
    const status = data?.status;
    const statsCfg = data?.statsConfig;
    const total = dnsQueries(stats);
    const blocked = blockedTotal(stats);
    const pct = total > 0 ? Math.min(100, Math.round(blocked / total * 1e3) / 10) : 0;
    const avgSec = num(stats.avg_processing_time);
    const avgMs = avgSec > 0 ? avgSec * 1e3 : 0;
    const protection = status?.protection_enabled === true;
    const running = status?.running === true;
    const statsDisabled = statsCfg != null && statsCfg.enabled === false;
    const pctBar = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sd-adguard-pctbar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          height: "7px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(192,132,252,0.25)",
          overflow: "hidden"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              width: `${Math.min(100, pct)}%`,
              height: "100%",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #a78bfa, #f472b6, #fb7185)",
              boxShadow: "0 0 12px rgba(244, 114, 182, 0.45)",
              transition: "width 0.35s ease"
            }
          }
        )
      }
    ) });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "sd-plugin-no-scrollbar sd-adguard-host",
        style: { ...shell, background: "radial-gradient(ellipse 120% 80% at 10% -20%, rgba(56,189,248,0.08) 0%, transparent 50%)" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .sd-adguard-host {
          padding: 14px 14px 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .sd-adguard-host .sd-adguard-stat-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          min-width: 0;
          flex: 1 1 auto;
          min-height: 0;
          align-content: stretch;
          align-items: stretch;
        }
        .sd-adguard-host .sd-adguard-tile,
        .sd-adguard-host .sd-adguard-tile-placeholder {
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
        }
        /* Schmal + viel H\xF6he: eine Spalte lesbar. Schmal + wenig H\xF6he: zwei Spalten, damit alles ohne Scroll passt */
        @container (max-width: 320px) and (min-height: 500px) {
          .sd-adguard-host .sd-adguard-stat-grid {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(4, 1fr);
          }
        }
        @container (max-height: 460px) {
          .sd-adguard-host .sd-adguard-stat-grid {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }
        }
        .sd-adguard-host .sd-adguard-tile {
          padding: 9px 10px 9px 11px;
          min-height: clamp(48px, min(16cqmin, 13cqh), 86px);
        }
        .sd-adguard-host .sd-adguard-tile-value {
          font-size: clamp(0.78rem, min(4.8cqmin, 3.8cqh), 1.45rem);
        }
        .sd-adguard-host .sd-adguard-tile .sd-adguard-tile-label {
          font-size: clamp(8px, min(1.9cqmin, 1.6cqh), 10px);
        }
        @container (max-height: 380px) {
          .sd-adguard-host {
            padding: 9px 9px 8px;
          }
          .sd-adguard-host .sd-adguard-top {
            gap: 5px !important;
            margin-bottom: 6px !important;
          }
          .sd-adguard-host .sd-adguard-prot-btn {
            padding: 5px 10px !important;
          }
          .sd-adguard-host .sd-adguard-tile {
            min-height: clamp(40px, min(12cqmin, 10cqh), 72px);
            padding: 5px 7px 5px 8px;
          }
          .sd-adguard-host .sd-adguard-tile-value {
            font-size: clamp(0.68rem, min(4cqmin, 3.2cqh), 1.15rem);
            margin-top: 2px !important;
          }
          .sd-adguard-host .sd-adguard-pctbar {
            margin-top: 5px !important;
          }
          .sd-adguard-host .sd-adguard-pctbar > div:first-child {
            height: 5px !important;
          }
        }
        @container (max-height: 260px) {
          .sd-adguard-host {
            padding: 6px 6px 5px;
          }
          .sd-adguard-host .sd-adguard-stat-grid {
            gap: 4px;
          }
          .sd-adguard-host .sd-adguard-tile {
            min-height: 0;
            padding: 4px 5px;
          }
          .sd-adguard-host .sd-adguard-tile-value {
            font-size: clamp(0.62rem, min(3.5cqmin, 2.8cqh), 0.95rem);
          }
        }
      ` }),
          error && data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "#fb7185", margin: "0 0 8px", textAlign: "center", lineHeight: 1.35 }, children: error }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: "sd-adguard-top",
              style: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px", width: "100%", alignItems: "stretch", flexShrink: 0 },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    disabled: protBusy,
                    "aria-pressed": protection,
                    className: "sd-adguard-prot-btn",
                    onClick: () => void toggleProtection(),
                    style: {
                      width: "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "clamp(9px, min(2.4cqmin, 2cqh), 12px)",
                      fontWeight: 800,
                      padding: "8px 14px",
                      borderRadius: "999px",
                      border: protection ? "1px solid rgba(52, 211, 153, 0.55)" : "1px solid rgba(251, 113, 133, 0.45)",
                      background: protection ? "linear-gradient(120deg, rgba(52,211,153,0.35) 0%, rgba(34,197,94,0.18) 100%)" : "linear-gradient(120deg, rgba(251,113,133,0.22) 0%, rgba(244,63,94,0.12) 100%)",
                      color: protection ? "#ecfdf5" : "#ffe4e6",
                      boxShadow: protection ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.22), 0 0 0 1px rgba(52, 211, 153, 0.28)" : "inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.2), 0 0 0 1px rgba(251, 113, 133, 0.28)",
                      cursor: protBusy ? "wait" : "pointer",
                      opacity: protBusy ? 0.75 : 1,
                      fontFamily: "inherit"
                    },
                    children: [
                      protection ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { size: 13, "aria-hidden": true }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldOff, { size: 13, "aria-hidden": true }),
                      protBusy ? "\u2026" : protection ? de ? "Schutz: AN" : "On" : de ? "Schutz: AUS" : "Off"
                    ]
                  }
                ),
                running === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "span",
                  {
                    style: {
                      alignSelf: "center",
                      fontSize: "clamp(10px, 2.4cqmin, 11px)",
                      color: "#fde68a",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.4)"
                    },
                    children: de ? "DNS inaktiv" : "DNS off"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sd-adguard-stat-grid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: de ? "DNS-Anfragen" : "DNS queries", value: formatInt(total, locale), tint: "sky", icon: Network }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: de ? "Gesperrt" : "Blocked", value: formatInt(blocked, locale), tint: "rose", icon: Ban }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              StatTile,
              {
                label: de ? "Block-Anteil" : "Blocked %",
                value: `${pct.toLocaleString(de ? "de-DE" : "en-GB")}%`,
                tint: "violet",
                icon: Percent,
                footer: pctBar
              }
            ),
            avgSec > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, { label: de ? "\xD8 Antwortzeit" : "Avg response", value: `${avgMs.toFixed(1)} ms`, tint: "emerald", icon: Activity }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                className: "sd-adguard-tile sd-adguard-tile-placeholder",
                style: {
                  borderRadius: "12px",
                  border: "1px dashed rgba(52, 211, 153, 0.35)",
                  background: "rgba(52, 211, 153, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  minHeight: 0,
                  height: "100%",
                  boxSizing: "border-box"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "clamp(10px, 2.3cqmin, 11px)", color: "var(--text-muted)", textAlign: "center" }, children: de ? "Keine Latenz-Daten" : "No latency data" })
              }
            )
          ] }),
          statsDisabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "#fbbf24", marginTop: "10px", marginBottom: 0, textAlign: "center", lineHeight: 1.45 }, children: de ? "Statistiken sind in AdGuard Home aus \u2014 Einstellungen \u2192 Allgemeine Einstellungen \u2192 Statistiken einschalten." : "Statistics are off in AdGuard Home \u2014 enable them under Settings \u2192 General settings \u2192 Statistics." })
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
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(config.url),
            onChange: (e) => onChange("url", e.target.value),
            placeholder: "http://192.168.1.5:3000"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }, children: [
          "Nur die Weboberfl\xE4chen-Adresse (z.\u202FB. ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http://IP:3000" }),
          "). Nicht mit",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "/control" }),
          " enden \u2014 das wird automatisch erg\xE4nzt. Falls die URL schon",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "\u2026/control" }),
          " ist, wird das entfernt."
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "Benutzername (optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: str(config.username), onChange: (e) => onChange("username", e.target.value), placeholder: "", autoComplete: "off" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: "Passwort (optional)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: str(config.password),
            onChange: (e) => onChange("password", e.target.value),
            placeholder: "",
            autoComplete: "new-password"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }, children: "Entspricht dem AdGuard-Admin-Login (HTTP Basic). Leer lassen, falls kein Passwort gesetzt ist." })
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

  // plugin-pack/staging/.entries/adguard.tsx
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
lucide-react/dist/esm/icons/activity.js:
lucide-react/dist/esm/icons/ban.js:
lucide-react/dist/esm/icons/network.js:
lucide-react/dist/esm/icons/percent.js:
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
