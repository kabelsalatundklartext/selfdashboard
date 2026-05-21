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
        var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef2 = React.useRef, useEffect2 = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
        exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
          var instRef = useRef2(null);
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

  // node_modules/lucide-react/dist/esm/icons/arrow-down.js
  var ArrowDown = createLucideIcon("ArrowDown", [
    ["path", { d: "M12 5v14", key: "s699le" }],
    ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/arrow-up.js
  var ArrowUp = createLucideIcon("ArrowUp", [
    ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
    ["path", { d: "M12 19V5", key: "x0mq9r" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/trending-up.js
  var TrendingUp = createLucideIcon("TrendingUp", [
    ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", key: "126l90" }],
    ["polyline", { points: "16 7 22 7 22 13", key: "kwv8wd" }]
  ]);

  // plugins/fritzbox/index.tsx
  var import_react4 = __toESM(require_react());

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

  // src/lib/pluginLocale.ts
  function usePluginLocale() {
    const locale = useDashboardStore((s) => s.locale);
    return { locale, de: locale !== "en" };
  }

  // plugins/fritzbox/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var FB_PLOT_H_DEFAULT = 168;
  var FB_PLOT_H_MAX = 220;
  var FB_PLOT_H_VERTICAL_CAP = 280;
  var meta = {
    id: "fritzbox",
    name: "Fritzbox Internet Verlauf",
    description: "WAN-Durchsatz-Verlauf per TR-064. Sprache und Y-Achsen-Maximum in den Einstellungen, sonst wie Dashboard bzw. automatisch aus den Messwerten.",
    version: "2.4.3",
    author: "SelfDashboard",
    category: "network",
    icon: "\u{1F4C8}",
    iconUrl: "/plugin-logos/fritzbox.svg",
    defaultLayout: { w: 4, h: 6, minW: 3, minH: 3 },
    configSchema: [
      {
        key: "baseUrl",
        label: "TR-064 Basis-URL",
        type: "text",
        defaultValue: "http://fritz.box",
        placeholder: "Nur Host (z. B. http://fritz.box) \u2014 ohne /tr064; Port 49000/49443 wird erg\xE4nzt"
      },
      { key: "username", label: "Benutzername", type: "text", defaultValue: "", placeholder: "FRITZ!Box-Benutzer" },
      { key: "password", label: "Passwort", type: "password", defaultValue: "" },
      { key: "refreshSeconds", label: "Aktualisieren (Sek.)", type: "number", defaultValue: 30 },
      {
        key: "liveIntervalSeconds",
        label: "Z\xE4hler-Takt (Sek.)",
        type: "number",
        defaultValue: 0,
        placeholder: "0 = nur \u201EAktualisieren\u201C, 3\u201315 = \xF6fter"
      },
      { key: "insecureTls", label: "HTTPS: selbstsigniert erlauben", type: "boolean", defaultValue: false },
      {
        key: "uiLanguage",
        label: "Sprache (Anzeige)",
        type: "select",
        defaultValue: "auto",
        options: [
          { label: "Wie Dashboard", value: "auto" },
          { label: "Deutsch", value: "de" },
          { label: "English", value: "en" }
        ]
      },
      {
        key: "throughputPanelLayout",
        label: "Anordnung",
        type: "select",
        defaultValue: "vertical",
        options: [
          { label: "Senkrecht: Grafik oben, Kacheln darunter", value: "vertical" },
          { label: "Waagerecht: Grafik links, Kacheln rechts", value: "horizontal" }
        ]
      },
      { key: "throughputShowTitle", label: "\xDCberschrift \u201EDurchsatz-Verlauf\u201C", type: "boolean", defaultValue: true },
      { key: "throughputShowLegend", label: "Legende Download/Upload", type: "boolean", defaultValue: true },
      { key: "throughputShowLive", label: "Live-Werte (\u2193 / \u2191)", type: "boolean", defaultValue: true },
      { key: "throughputShowChart", label: "Kurve anzeigen", type: "boolean", defaultValue: true },
      { key: "throughputShowChartFooter", label: "Zeitachsen-Hinweis (\xE4lter/neuer)", type: "boolean", defaultValue: true },
      { key: "throughputShowStatAvgDown", label: "Karte: \xD8 Download", type: "boolean", defaultValue: true },
      { key: "throughputShowStatAvgUp", label: "Karte: \xD8 Upload", type: "boolean", defaultValue: true },
      { key: "throughputShowStatPeakDown", label: "Karte: Peak Down", type: "boolean", defaultValue: true },
      { key: "throughputShowStatPeakUp", label: "Karte: Peak Up", type: "boolean", defaultValue: true },
      {
        key: "throughputChartHeightPx",
        label: "Grafik-H\xF6he (px)",
        type: "number",
        defaultValue: 168,
        placeholder: `0 = Standard (${FB_PLOT_H_DEFAULT}), 1\u2013${FB_PLOT_H_MAX}`
      },
      {
        key: "throughputChartYMaxMbps",
        label: "Y-Achse Maximum (Mbit/s)",
        type: "number",
        defaultValue: 0,
        placeholder: "0 = automatisch aus Daten"
      },
      {
        key: "throughputClampMbps",
        label: "Max. Messrate (Mbit/s), 0 = nur TR-064",
        type: "number",
        defaultValue: 0,
        placeholder: "z. B. 1000 bei 1-Gbit-Vertrag"
      },
      {
        key: "chartHistoryPoints",
        label: "Max. Messpunkte",
        type: "number",
        defaultValue: 48,
        placeholder: "16\u2013120"
      }
    ]
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
  function clampThroughputBps(down, up, lineDownBps, lineUpBps, userCapMbps) {
    const phyHead = 1.03;
    let d = Number.isFinite(down) ? Math.max(0, down) : 0;
    let u = Number.isFinite(up) ? Math.max(0, up) : 0;
    if (userCapMbps > 0 && Number.isFinite(userCapMbps)) {
      const cap = Math.max(1, userCapMbps) * 1e6;
      return { down: Math.min(d, cap), up: Math.min(u, cap) };
    }
    if (lineDownBps != null && lineDownBps > 0 && Number.isFinite(lineDownBps)) {
      d = Math.min(d, lineDownBps * phyHead);
    }
    if (lineUpBps != null && lineUpBps > 0 && Number.isFinite(lineUpBps)) {
      u = Math.min(u, lineUpBps * phyHead);
    }
    return { down: d, up: u };
  }
  var FB_BPS_HISTORY_STORAGE = "sd:fritzbox:bpsHistory:v1";
  var FB_BPS_HISTORY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1e3;
  function fritzboxBpsHistoryStorageKey(baseUrl, username) {
    return `${FB_BPS_HISTORY_STORAGE}:${encodeURIComponent(baseUrl)}:${encodeURIComponent(username)}`;
  }
  function readCachedBpsHistory(key, maxPoints) {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const j = JSON.parse(raw);
      if (typeof j.t === "number" && Date.now() - j.t > FB_BPS_HISTORY_MAX_AGE_MS) {
        localStorage.removeItem(key);
        return [];
      }
      if (!Array.isArray(j.points) || j.points.length < 2) return [];
      const cap = Math.min(120, Math.max(2, maxPoints));
      const out = [];
      for (const p of j.points) {
        if (!p || typeof p !== "object") continue;
        const o = p;
        const down = Number(o.down);
        const up = Number(o.up);
        if (!Number.isFinite(down) || !Number.isFinite(up) || down < 0 || up < 0) continue;
        out.push({ down, up });
      }
      if (out.length < 2) return [];
      return out.slice(-cap);
    } catch {
      return [];
    }
  }
  function writeCachedBpsHistory(key, points) {
    if (typeof window === "undefined" || points.length < 2) return;
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), points: points.slice(-120) }));
    } catch {
    }
  }
  function pluginDe(r, dashboardDe) {
    const lang = str(r.uiLanguage).toLowerCase();
    if (lang === "de") return true;
    if (lang === "en") return false;
    return dashboardDe;
  }
  function formatMbpsParts(bps, de) {
    if (bps == null || !Number.isFinite(bps) || bps <= 0) return { num: "\u2014", unit: "" };
    const mbps = bps / 1e6;
    const s = mbps >= 100 ? String(Math.round(mbps)) : mbps.toFixed(1);
    return { num: de ? s.replace(".", ",") : s, unit: "Mbit/s" };
  }
  function formatMbps(bps, de) {
    const { num: num2, unit } = formatMbpsParts(bps, de);
    return unit ? `${num2} ${unit}` : num2;
  }
  function niceCeilMbpsFromBps(peakBps) {
    const mb = peakBps / 1e6;
    if (!Number.isFinite(mb) || mb <= 0) return 5;
    const step = mb <= 40 ? 5 : mb <= 100 ? 10 : 25;
    return Math.max(step, Math.ceil(mb / step) * step);
  }
  function mbpsTickList(maxMbps) {
    let step = maxMbps <= 40 ? 5 : maxMbps <= 120 ? 10 : 25;
    const build = (s) => {
      const out2 = [];
      for (let v = maxMbps; v > 0; v -= s) out2.push(v);
      out2.push(0);
      return out2;
    };
    let out = build(step);
    while (out.length > 12) {
      step *= 2;
      out = build(step);
    }
    return out;
  }
  var FB_CHART_DL = "#3b82f6";
  var FB_CHART_UL = "#22c55e";
  function ThroughputStatPill({
    icon: Icon2,
    label,
    value,
    color,
    compact,
    tight
  }) {
    const split = tight && value !== "\u2014" && /\s+Mbit\/s$/i.test(value) ? { num: value.replace(/\s+Mbit\/s$/i, ""), unit: "Mbit/s" } : null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          borderRadius: tight ? "9px" : compact ? "10px" : "12px",
          border: "1px solid var(--border)",
          background: "linear-gradient(165deg, rgba(255,255,255,0.03) 0%, var(--surface-2) 50%, var(--surface-2) 100%)",
          padding: tight ? "6px 7px" : compact ? "7px 9px" : "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: tight ? 2 : compact ? 2 : 4,
          minWidth: 0,
          minHeight: 0,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: tight ? "4px" : "6px",
                fontSize: tight ? "8px" : compact ? "9px" : "10px",
                color: "var(--text-muted)",
                minWidth: 0
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  Icon2,
                  {
                    size: tight ? 11 : compact ? 12 : 14,
                    strokeWidth: 2.2,
                    style: { color, flexShrink: 0, opacity: 0.95 }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "span",
                  {
                    style: {
                      fontWeight: 700,
                      color,
                      letterSpacing: tight ? "0.01em" : "0.02em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0
                    },
                    children: label
                  }
                )
              ]
            }
          ),
          split ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  fontSize: tight ? "12px" : compact ? "clamp(12px, 2cqw, 16px)" : "clamp(14px, 2.2cqw, 19px)",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color: "var(--text)",
                  wordBreak: "break-all"
                },
                children: split.num
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", lineHeight: 1.1 }, children: split.unit })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                fontSize: tight ? "11px" : compact ? "clamp(13px, 2cqw, 17px)" : "clamp(15px, 2.2cqw, 20px)",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--text)",
                wordBreak: "break-word",
                overflowWrap: "anywhere"
              },
              children: value
            }
          )
        ]
      }
    );
  }
  function ThroughputHistoryChart({
    history,
    current,
    de,
    chartHeightPx = 168,
    yMaxMbps = 0,
    display
  }) {
    const gid = (0, import_react4.useId)().replace(/:/g, "");
    const panelRef = (0, import_react4.useRef)(null);
    const [panelSize, setPanelSize] = (0, import_react4.useState)({ w: 0, h: 0 });
    (0, import_react4.useLayoutEffect)(() => {
      const el = panelRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const apply = () => {
        const r = el.getBoundingClientRect();
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        setPanelSize((prev) => prev.w === w && prev.h === h ? prev : { w, h });
      };
      apply();
      const ro = new ResizeObserver(() => apply());
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    if (history.length < 2) return null;
    const hRaw = Math.round(num(chartHeightPx));
    const baseHPx = hRaw <= 0 ? FB_PLOT_H_DEFAULT : Math.min(FB_PLOT_H_MAX, Math.max(1, hRaw || FB_PLOT_H_DEFAULT));
    const {
      layout: layoutPref,
      showTitle,
      showLegend,
      showLive,
      showChart,
      showChartFooter,
      showStatAvgDown,
      showStatAvgUp,
      showStatPeakDown,
      showStatPeakUp
    } = display;
    const rawPeakBps = Math.max(1, ...history.flatMap((h) => [h.down, h.up]));
    const autoMaxMbps = niceCeilMbpsFromBps(rawPeakBps);
    const userRaw = Math.round(num(yMaxMbps));
    const maxMbps = userRaw > 0 ? Math.min(2e3, Math.max(5, niceCeilMbpsFromBps(userRaw * 1e6))) : autoMaxMbps;
    const scaleBps = maxMbps * 1e6;
    const ticks = mbpsTickList(maxMbps);
    const nHist = history.length;
    const avgDownBps = nHist > 0 ? history.reduce((s, p) => s + p.down, 0) / nHist : 0;
    const avgUpBps = nHist > 0 ? history.reduce((s, p) => s + p.up, 0) / nHist : 0;
    const peakSeries = current && Number.isFinite(current.down) && Number.isFinite(current.up) ? [...history, current] : history;
    const peakDownBps = peakSeries.length ? Math.max(0, ...peakSeries.map((p) => p.down)) : 0;
    const peakUpBps = peakSeries.length ? Math.max(0, ...peakSeries.map((p) => p.up)) : 0;
    const UW = 1e3;
    const UH = 100;
    const xAt = (i) => history.length <= 1 ? UW / 2 : i / (history.length - 1) * UW;
    const yAt = (bps) => {
      const clamped = Math.min(Math.max(0, bps), scaleBps);
      return UH - clamped / scaleBps * UH;
    };
    const downPts = history.map((p, i) => `${xAt(i)},${yAt(p.down)}`).join(" ");
    const upPts = history.map((p, i) => `${xAt(i)},${yAt(p.up)}`).join(" ");
    const downArea = `0,${UH} ${downPts} ${UW},${UH}`;
    const fmtMbAxis = (mb) => {
      if (Number.isInteger(mb)) return String(mb);
      const s = mb.toFixed(1);
      return de ? s.replace(".", ",") : s;
    };
    const labelMuted = {
      fontSize: "9px",
      color: "var(--text-muted)",
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1.15
    };
    const labelAxisY = {
      ...labelMuted,
      fontSize: "8px",
      lineHeight: 1.12
    };
    const title = de ? "DURCHSATZ-VERLAUF" : "THROUGHPUT HISTORY";
    const liveDown = formatMbps(current?.down ?? null, de);
    const liveUp = formatMbps(current?.up ?? null, de);
    const showHeaderRow = showTitle || showLegend || showLive;
    const anyStat = showStatAvgDown || showStatAvgUp || showStatPeakDown || showStatPeakUp;
    const statCount = [showStatAvgDown, showStatAvgUp, showStatPeakDown, showStatPeakUp].filter(Boolean).length;
    const statRows = Math.max(1, Math.ceil(statCount / 2));
    const compact = panelSize.h > 0 && panelSize.h < 400;
    const layout = layoutPref === "horizontal" ? "horizontal" : "vertical";
    const pillTight = layout === "horizontal";
    const statRowH = pillTight ? compact ? 50 : 54 : compact ? 56 : 64;
    const statsGridGap = compact ? 6 : 8;
    const statsBlockH = statRows * statRowH + (statRows - 1) * statsGridGap;
    const headerEst = showHeaderRow ? compact ? 48 : 58 : 0;
    const chartFooterH = showChartFooter ? 14 : 0;
    const padX = compact ? 8 : 10;
    const yAxisColW = pillTight ? 48 : 52;
    const chartRowGap = 4;
    const panelPadY = compact ? 16 : 22;
    const stackGap = compact ? 6 : 8;
    let hPx = baseHPx;
    if (layout === "horizontal") {
      if (panelSize.h > 0) {
        const availRow = Math.floor(panelSize.h - headerEst - panelPadY - stackGap) - chartFooterH;
        hPx = Math.min(baseHPx, Math.max(96, availRow));
      } else {
        hPx = Math.min(baseHPx, Math.max(96, statsBlockH - chartFooterH));
      }
    } else if (panelSize.h > 0) {
      const afterChart = showChart ? compact ? 8 : 12 : 0;
      const statsSafety = 24;
      const avail = Math.floor(
        panelSize.h - headerEst - statsBlockH - chartFooterH - panelPadY - stackGap - afterChart - statsSafety
      );
      if (avail >= baseHPx) {
        hPx = Math.min(FB_PLOT_H_VERTICAL_CAP, Math.max(baseHPx, avail));
      } else {
        hPx = Math.max(96, avail);
      }
    }
    const headerBlock = showHeaderRow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          paddingLeft: padX,
          paddingRight: padX,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "100%",
          minWidth: 0,
          overflow: "visible"
        },
        children: [
          showTitle || showLegend ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "10px 14px", minWidth: 0 }, children: [
            showTitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                style: {
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  flexShrink: 0
                },
                children: title
              }
            ) : null,
            showLegend ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 14px", fontSize: "10px", minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", color: FB_CHART_DL, fontWeight: 600 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: "14px", height: "2px", background: FB_CHART_DL, borderRadius: "1px", flexShrink: 0 } }),
                "Download"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", color: FB_CHART_UL, fontWeight: 600 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "span",
                  {
                    style: {
                      width: "14px",
                      height: 0,
                      borderTop: `2px dashed ${FB_CHART_UL}`,
                      flexShrink: 0
                    }
                  }
                ),
                "Upload"
              ] })
            ] }) : null
          ] }) : null,
          showLive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "10px 16px",
                fontSize: "12px",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
                overflow: "visible",
                lineHeight: 1.35
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: FB_CHART_DL, whiteSpace: "nowrap" }, children: [
                  "\u2193 ",
                  liveDown
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: FB_CHART_UL, whiteSpace: "nowrap" }, children: [
                  "\u2191 ",
                  liveUp
                ] })
              ]
            }
          ) : null
        ]
      }
    ) : null;
    const chartBody = showChart ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "stretch", gap: `${chartRowGap}px`, minHeight: `${hPx}px` }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              flexShrink: 0,
              width: `${yAxisColW}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textAlign: "right",
              padding: "2px 2px 1px 0",
              userSelect: "none"
            },
            "aria-hidden": true,
            children: ticks.map((mb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: labelAxisY, title: formatMbps(mb * 1e6, de), children: [
              fmtMbAxis(mb),
              " Mbit/s"
            ] }, mb))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              flex: 1,
              minWidth: 0,
              borderRadius: layout === "vertical" ? 0 : "8px",
              overflow: "hidden",
              background: "rgba(0,0,0,0.2)"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "svg",
              {
                viewBox: `0 0 ${UW} ${UH}`,
                preserveAspectRatio: "none",
                width: "100%",
                height: hPx,
                style: { display: "block" },
                "aria-hidden": true,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", { id: `fbDownFill-${gid}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: FB_CHART_DL, stopOpacity: "0.38" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: FB_CHART_DL, stopOpacity: "0.04" })
                  ] }) }),
                  ticks.filter((mb) => mb > 0).map((mb) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "line",
                    {
                      x1: 0,
                      y1: yAt(mb * 1e6),
                      x2: UW,
                      y2: yAt(mb * 1e6),
                      stroke: "rgba(255,255,255,0.06)",
                      strokeWidth: "0.7",
                      vectorEffect: "non-scaling-stroke"
                    },
                    `g-${mb}`
                  )),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { x1: 0, y1: UH, x2: UW, y2: UH, stroke: "rgba(255,255,255,0.1)", strokeWidth: "0.9", vectorEffect: "non-scaling-stroke" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", { points: downArea, fill: `url(#fbDownFill-${gid})`, stroke: "none" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "polyline",
                    {
                      fill: "none",
                      stroke: FB_CHART_DL,
                      strokeWidth: "2",
                      strokeLinejoin: "round",
                      strokeLinecap: "round",
                      points: downPts,
                      vectorEffect: "non-scaling-stroke"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "polyline",
                    {
                      fill: "none",
                      stroke: FB_CHART_UL,
                      strokeWidth: "2",
                      strokeLinejoin: "round",
                      strokeLinecap: "round",
                      strokeDasharray: "5 4",
                      points: upPts,
                      vectorEffect: "non-scaling-stroke"
                    }
                  )
                ]
              }
            )
          }
        )
      ] }),
      showChartFooter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "2px",
            width: "100%",
            paddingLeft: 0,
            paddingRight: 0,
            boxSizing: "border-box"
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "9px", color: "var(--text-muted)", opacity: 0.88, textAlign: "center" }, children: de ? "\xE4lter \u2190  \u2192 neuer" : "older \u2190  \u2192 newer" })
        }
      ) : null
    ] }) : null;
    const statsSection = anyStat ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: `${statsGridGap}px`,
          marginTop: layout === "vertical" && showChart ? compact ? 8 : 12 : 0,
          width: "100%",
          boxSizing: "border-box",
          paddingLeft: layout === "vertical" ? padX : 0,
          paddingRight: layout === "vertical" ? padX : 0,
          flexShrink: layout === "vertical" ? 0 : void 0,
          alignSelf: layout === "horizontal" ? "stretch" : void 0,
          minHeight: layout === "horizontal" ? statsBlockH : void 0
        },
        children: [
          showStatAvgDown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ThroughputStatPill,
            {
              icon: ArrowDown,
              label: de ? "Download" : "Download",
              value: formatMbps(avgDownBps, de),
              color: FB_CHART_DL,
              compact,
              tight: pillTight
            }
          ) : null,
          showStatAvgUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ThroughputStatPill,
            {
              icon: ArrowUp,
              label: de ? "Upload" : "Upload",
              value: formatMbps(avgUpBps, de),
              color: FB_CHART_UL,
              compact,
              tight: pillTight
            }
          ) : null,
          showStatPeakDown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ThroughputStatPill,
            {
              icon: TrendingUp,
              label: "Peak Down",
              value: formatMbps(peakDownBps, de),
              color: FB_CHART_DL,
              compact,
              tight: pillTight
            }
          ) : null,
          showStatPeakUp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ThroughputStatPill,
            {
              icon: TrendingUp,
              label: "Peak Up",
              value: formatMbps(peakUpBps, de),
              color: FB_CHART_UL,
              compact,
              tight: pillTight
            }
          ) : null
        ]
      }
    ) : null;
    const chartColumn = showChart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minWidth: 0,
          width: "100%",
          minHeight: 0,
          ...layout === "horizontal" ? {
            flex: "1 1 0",
            /** Diagramm darf die Kachel nicht über die Messkarten hinauszeichnen. */
            overflow: "hidden"
          } : {
            /** Vertikal: Höhe = Inhalt — verhindert Überlappung mit den Karten bei Flex-Schrumpfen. */
            flex: "0 0 auto",
            overflow: "visible"
          }
        },
        children: chartBody
      }
    ) : null;
    const mainBody = layout === "horizontal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: "sd-fb-throughput-row",
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: "10px",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          flex: "1 1 auto",
          flexWrap: "nowrap"
        },
        children: [
          chartColumn,
          anyStat ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                flex: showChart ? "0 0 clamp(140px, 38%, 260px)" : "1 1 100%",
                flexShrink: 0,
                maxWidth: showChart ? "min(260px, 46%)" : void 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 0,
                minWidth: 0,
                paddingRight: padX,
                boxSizing: "border-box"
              },
              children: statsSection
            }
          ) : null
        ]
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          width: "100%",
          gap: compact ? 6 : 8,
          overflow: "hidden"
        },
        children: [
          chartColumn,
          statsSection
        ]
      }
    );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: panelRef,
        className: "sd-fb-throughput-panel",
        style: {
          borderRadius: "12px",
          border: "1px solid var(--border)",
          background: "linear-gradient(165deg, rgba(255,255,255,0.04) 0%, var(--surface-2) 40%, var(--surface-2) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          padding: compact ? "6px 0 7px" : "8px 0 10px",
          boxSizing: "border-box",
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: compact ? 6 : 8,
          containerType: "size"
        },
        children: [
          headerBlock,
          mainBody
        ]
      }
    );
  }
  function Widget({ config }) {
    const { de: dashboardDe } = usePluginLocale();
    const r = config;
    const de = pluginDe(r, dashboardDe);
    const baseUrl = str(r.baseUrl);
    const username = str(r.username);
    const password = typeof r.password === "string" ? String(r.password) : "";
    const insecureTls = r.insecureTls === true;
    const refreshSec = (() => {
      const v = r.refreshSeconds;
      if (v === void 0 || v === null || v === "") return 30;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return 30;
      return Math.min(300, Math.max(0, n));
    })();
    const liveInput = r.liveIntervalSeconds;
    const liveEvery = (() => {
      if (liveInput === void 0 || liveInput === null || liveInput === "") return 5;
      const n = Math.round(Number(liveInput));
      if (!Number.isFinite(n)) return 5;
      if (n <= 0) return 0;
      return Math.min(15, Math.max(3, n));
    })();
    const chartCap = Math.min(120, Math.max(16, Math.round(num(r.chartHistoryPoints)) || 48));
    const rawPlotH = Math.round(num(r.throughputChartHeightPx));
    const chartHeightPx = rawPlotH <= 0 ? FB_PLOT_H_DEFAULT : Math.min(FB_PLOT_H_MAX, Math.max(1, rawPlotH || FB_PLOT_H_DEFAULT));
    const chartYMaxMbps = Math.min(2e3, Math.max(0, Math.round(num(r.throughputChartYMaxMbps))));
    const clampMbps = Math.min(2e5, Math.max(0, Math.round(num(r.throughputClampMbps))));
    let showTitle = r.throughputShowTitle !== false;
    let showLegend = r.throughputShowLegend !== false;
    let showLive = r.throughputShowLive !== false;
    let showChart = r.throughputShowChart !== false;
    let showChartFooter = r.throughputShowChartFooter !== false;
    let showStatAvgDown = r.throughputShowStatAvgDown !== false;
    let showStatAvgUp = r.throughputShowStatAvgUp !== false;
    let showStatPeakDown = r.throughputShowStatPeakDown !== false;
    let showStatPeakUp = r.throughputShowStatPeakUp !== false;
    if (!showTitle && !showLegend && !showLive && !showChart && !(showStatAvgDown || showStatAvgUp || showStatPeakDown || showStatPeakUp)) {
      showChart = true;
      showStatAvgDown = true;
      showStatAvgUp = true;
      showStatPeakDown = true;
      showStatPeakUp = true;
    }
    const panelLayout = str(r.throughputPanelLayout).toLowerCase() === "horizontal" ? "horizontal" : "vertical";
    const throughputDisplay = {
      layout: panelLayout,
      showTitle,
      showLegend,
      showLive,
      showChart,
      showChartFooter,
      showStatAvgDown,
      showStatAvgUp,
      showStatPeakDown,
      showStatPeakUp
    };
    const [data, setData] = (0, import_react4.useState)(null);
    const [error, setError] = (0, import_react4.useState)(null);
    const [loading, setLoading] = (0, import_react4.useState)(true);
    const [liveBps, setLiveBps] = (0, import_react4.useState)(null);
    const [bpsHistory, setBpsHistory] = (0, import_react4.useState)(() => {
      if (typeof window === "undefined" || !baseUrl) return [];
      return readCachedBpsHistory(fritzboxBpsHistoryStorageKey(baseUrl, username), 120);
    });
    const prevBytesRef = (0, import_react4.useRef)(null);
    const dataRef = (0, import_react4.useRef)(null);
    const bpsHistoryKeyRef = (0, import_react4.useRef)("");
    (0, import_react4.useEffect)(() => {
      if (!baseUrl) {
        bpsHistoryKeyRef.current = "";
        prevBytesRef.current = null;
        setLiveBps(null);
        setBpsHistory([]);
        return;
      }
      const key = fritzboxBpsHistoryStorageKey(baseUrl, username);
      if (key !== bpsHistoryKeyRef.current) {
        bpsHistoryKeyRef.current = key;
        prevBytesRef.current = null;
        setLiveBps(null);
        setBpsHistory(readCachedBpsHistory(key, 120));
        return;
      }
      setBpsHistory((prev) => {
        const fromDisk = readCachedBpsHistory(key, 120);
        const expanded = fromDisk.length > prev.length ? fromDisk : prev;
        return expanded.slice(-Math.max(2, chartCap));
      });
    }, [baseUrl, username, chartCap]);
    (0, import_react4.useEffect)(() => {
      if (!baseUrl || bpsHistory.length < 2) return;
      writeCachedBpsHistory(fritzboxBpsHistoryStorageKey(baseUrl, username), bpsHistory);
    }, [baseUrl, username, bpsHistory]);
    (0, import_react4.useEffect)(() => {
      dataRef.current = data;
    }, [data]);
    (0, import_react4.useEffect)(() => {
      setBpsHistory((prev) => {
        if (prev.length === 0) return prev;
        const ld = data?.downstreamMaxBps ?? null;
        const lu = data?.upstreamMaxBps ?? null;
        const next = prev.map((p) => clampThroughputBps(p.down, p.up, ld, lu, clampMbps));
        const same = next.length === prev.length && next.every((p, i) => p.down === prev[i].down && p.up === prev[i].up);
        return same ? prev : next;
      });
    }, [data, clampMbps]);
    const load = (0, import_react4.useCallback)(async () => {
      if (!baseUrl) {
        setLoading(false);
        setError(de ? "Keine Basis-URL in den Einstellungen." : "No base URL in settings.");
        setData(null);
        return;
      }
      try {
        const res = await fetch("/api/fritzbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ baseUrl, username, password, insecureTls })
        });
        const j = await res.json();
        if (!res.ok) {
          if (res.status === 401) setError(de ? "Anmeldung fehlgeschlagen." : "Login failed.");
          else if (j.error === "timeout") setError(de ? "Zeit\xFCberschreitung." : "Timeout.");
          else setError(j.message || j.error || `HTTP ${res.status}`);
          setData(null);
          return;
        }
        if (j.ok === false) {
          setError(j.message || j.error || "Error");
          setData(null);
          return;
        }
        setError(null);
        setData(j);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [baseUrl, username, password, insecureTls, de]);
    const loadLite = (0, import_react4.useCallback)(async () => {
      if (!baseUrl || liveEvery <= 0) return;
      const cur = dataRef.current;
      if (!cur || !cur.wanTotalBytesReceived && !cur.wanTotalBytesSent) return;
      try {
        const res = await fetch("/api/fritzbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ baseUrl, username, password, insecureTls, lite: true })
        });
        const j = await res.json();
        if (!res.ok || j.ok === false) return;
        setData((d) => {
          if (!d) return d;
          const next = { ...d };
          if (typeof j.wanTotalBytesReceived === "string" && /^\d+$/.test(j.wanTotalBytesReceived)) {
            next.wanTotalBytesReceived = j.wanTotalBytesReceived;
          }
          if (typeof j.wanTotalBytesSent === "string" && /^\d+$/.test(j.wanTotalBytesSent)) {
            next.wanTotalBytesSent = j.wanTotalBytesSent;
          }
          return next;
        });
      } catch {
      }
    }, [baseUrl, username, password, insecureTls, liveEvery]);
    (0, import_react4.useEffect)(() => {
      void load();
      if (refreshSec <= 0) return void 0;
      const id = window.setInterval(() => void load(), refreshSec * 1e3);
      return () => window.clearInterval(id);
    }, [load, refreshSec]);
    (0, import_react4.useEffect)(() => {
      if (liveEvery <= 0) return void 0;
      const t = window.setTimeout(() => void loadLite(), 600);
      const id = window.setInterval(() => void loadLite(), liveEvery * 1e3);
      return () => {
        window.clearTimeout(t);
        window.clearInterval(id);
      };
    }, [liveEvery, loadLite]);
    (0, import_react4.useEffect)(() => {
      if (!data) return;
      if (!data.wanTotalBytesReceived || !data.wanTotalBytesSent) {
        setLiveBps(null);
        prevBytesRef.current = null;
        return;
      }
      const rx = data.wanTotalBytesReceived;
      const tx = data.wanTotalBytesSent;
      const now = Date.now();
      const pr = prevBytesRef.current;
      if (pr) {
        const dt = (now - pr.t) / 1e3;
        if (dt >= 1 && dt < 600) {
          try {
            const drx = BigInt(rx) - BigInt(pr.rx);
            const dtx = BigInt(tx) - BigInt(pr.tx);
            const zero = BigInt(0);
            if (drx >= zero && dtx >= zero) {
              const down = Number(drx * BigInt(8)) / dt;
              const up = Number(dtx * BigInt(8)) / dt;
              if (Number.isFinite(down) && Number.isFinite(up)) {
                setLiveBps(
                  clampThroughputBps(down, up, data.downstreamMaxBps, data.upstreamMaxBps, clampMbps)
                );
              }
            } else {
              setLiveBps(null);
            }
          } catch {
            setLiveBps(null);
          }
        }
      }
      prevBytesRef.current = { rx, tx, t: now };
    }, [data, clampMbps]);
    (0, import_react4.useEffect)(() => {
      if (!liveBps || !Number.isFinite(liveBps.down) || !Number.isFinite(liveBps.up)) return;
      setBpsHistory((prev) => [...prev, { down: liveBps.down, up: liveBps.up }].slice(-chartCap));
    }, [liveBps, chartCap]);
    const muted = "var(--text-muted)";
    const liveForDisplayRaw = liveBps && Number.isFinite(liveBps.down) && Number.isFinite(liveBps.up) ? liveBps : bpsHistory.length > 0 ? bpsHistory[bpsHistory.length - 1] : null;
    const liveForDisplay = liveForDisplayRaw == null ? null : clampThroughputBps(
      liveForDisplayRaw.down,
      liveForDisplayRaw.up,
      data?.downstreamMaxBps ?? null,
      data?.upstreamMaxBps ?? null,
      clampMbps
    );
    if (!baseUrl && !loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "12px", color: muted, fontSize: "12px", textAlign: "center" }, children: de ? "Bitte TR-064-URL in den Plugin-Einstellungen setzen." : "Set the TR-064 URL in plugin settings." });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          height: "100%",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          boxSizing: "border-box",
          padding: "clamp(4px, 1cqmin, 8px)",
          display: "flex",
          flexDirection: "column",
          containerType: "size",
          overflow: "auto"
        },
        children: [
          error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "11px", color: "#fb7185", textAlign: "center", lineHeight: 1.4, padding: "8px" }, children: error }) : null,
          data && !error ? !data.wanTotalBytesReceived || !data.wanTotalBytesSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: muted,
                fontSize: "12px",
                textAlign: "center",
                padding: "16px"
              },
              children: de ? "Byte-Z\xE4hler (WAN) werden von dieser Box/TR-064 nicht geliefert \u2014 keine Kurve m\xF6glich." : "Byte counters are not exposed for this router/TR-064 session \u2014 chart unavailable."
            }
          ) : bpsHistory.length >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ThroughputHistoryChart,
            {
              history: bpsHistory,
              current: liveForDisplay,
              de,
              chartHeightPx,
              yMaxMbps: chartYMaxMbps,
              display: throughputDisplay
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                flex: 1,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                border: "1px dashed var(--border)",
                color: muted,
                fontSize: "12px",
                textAlign: "center",
                padding: "16px"
              },
              children: loading ? de ? "Lade\u2026" : "Loading\u2026" : de ? "Noch zu wenige Messpunkte f\xFCr die Kurve. Kurz warten oder Z\xE4hler-Takt in den Einstellungen erh\xF6hen." : "Not enough samples yet. Wait a moment or lower the refresh interval / enable counter poll."
            }
          ) : !error && loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: "12px" }, children: de ? "Lade\u2026" : "Loading\u2026" }) : null
        ]
      }
    );
  }
  function Settings({ config, onChange }) {
    const { de: dashboardDe } = usePluginLocale();
    const r = config;
    const de = pluginDe(r, dashboardDe);
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
    const refresh = (() => {
      const v = r.refreshSeconds;
      if (v === void 0 || v === null || v === "") return 30;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return 30;
      return Math.min(300, Math.max(0, n));
    })();
    const liveSettingsVal = (() => {
      const v = r.liveIntervalSeconds;
      if (v === void 0 || v === null || v === "") return 5;
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) return 5;
      return Math.min(15, Math.max(0, n));
    })();
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "Nur der Internet-Durchsatz-Verlauf (WAN) aus den Byte-Z\xE4hlern der FRITZ!Box. Zugriff per",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TR-064" }),
        " (Port ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "49000" }),
        " bei ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        ") \u2014 der Abruf l\xE4uft \xFCber den SelfDashboard-Server."
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "WAN throughput chart from FRITZ!Box byte counters via ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "TR-064" }),
        " (port",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "49000" }),
        " for ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "http" }),
        "). Fetched through the SelfDashboard server."
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Basis-URL" : "Base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            value: str(r.baseUrl),
            onChange: (e) => onChange("baseUrl", e.target.value),
            placeholder: "http://fritz.box"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Benutzername" : "Username" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: str(r.username), onChange: (e) => onChange("username", e.target.value), autoComplete: "off" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Passwort" : "Password" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "password",
            value: typeof r.password === "string" ? r.password : "",
            onChange: (e) => onChange("password", e.target.value),
            autoComplete: "new-password"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "HTTPS: selbstsigniertes Zertifikat erlauben" : "HTTPS: allow self-signed certificate" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            type: "checkbox",
            checked: r.insecureTls === true,
            onChange: (e) => onChange("insecureTls", e.target.checked),
            style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Sprache (Anzeige)" : "Display language" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "select",
          {
            style: inp,
            value: (() => {
              const v = str(r.uiLanguage).toLowerCase();
              return v === "de" || v === "en" ? v : "auto";
            })(),
            onChange: (e) => onChange("uiLanguage", e.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "auto", children: de ? "Wie Dashboard" : "Match dashboard" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "de", children: "Deutsch" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "en", children: "English" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Aktualisieren (Sekunden)" : "Refresh (seconds)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 0,
            max: 300,
            value: refresh,
            onChange: (e) => onChange("refreshSeconds", Math.min(300, Math.max(0, Math.round(Number(e.target.value)) || 0)))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          " = kein periodischer Vollabruf (nur beim \xD6ffnen des Dashboards). F\xFCr laufende Messpunkte",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Z\xE4hler-Takt" }),
          " nutzen. ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1\u2013300" }),
          " = kompletter TR-064-Abruf alle N Sekunden. Sind",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Aktualisieren" }),
          " und ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Z\xE4hler-Takt" }),
          " beide ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          ", zeigen \u2193/\u2191 den",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "letzten Kurvenpunkt" }),
          " (Cache/Verlauf), bis wieder gelesen wird."
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          " = no periodic full refresh (only when the dashboard loads). Use ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Live counters" }),
          " for ongoing samples. ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1\u2013300" }),
          " = full TR-064 poll every N seconds. If ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "both" }),
          " refresh and live counters are",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          ", \u2193/\u2191 show the ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "last chart sample" }),
          " (cache/history) until counters are read again."
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Live-Z\xE4hler (Sekunden)" : "Live counters (seconds)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 0,
            max: 15,
            value: liveSettingsVal,
            onChange: (e) => onChange("liveIntervalSeconds", Math.min(15, Math.max(0, Math.round(Number(e.target.value)) || 0)))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          " = Messpunkte nur beim Intervall ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u201EAktualisieren\u201C" }),
          " (weniger Last).",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "3\u201315" }),
          " = zus\xE4tzliche Abfrage der Z\xE4hler in diesem Takt (fl\xFCssigere Kurve). Ohne Wert intern",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "5" }),
          " s. Sind ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Aktualisieren" }),
          " und ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Z\xE4hler-Takt" }),
          " beide ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          ", gibt es keine neuen Z\xE4hlerst\xE4nde \u2014 \u2193/\u2191 nutzen dann den letzten Punkt der Kurve."
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          " = samples only on the ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Refresh" }),
          " interval (less load). ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "3\u201315" }),
          " = poll counters every N seconds (smoother chart). If empty on old configs, the app uses ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "5" }),
          "s internally. If ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "both" }),
          " ",
          "refresh and live counters are ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
          ", counters are not re-read \u2014 \u2193/\u2191 fall back to the last chart sample."
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            borderTop: "1px solid var(--border)",
            paddingTop: "12px",
            marginTop: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0 }, children: de ? "Grafik" : "Chart" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: 0 }, children: de ? "Layout & Sichtbarkeit" : "Layout & visibility" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Anordnung" : "Arrangement" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "select",
                {
                  style: inp,
                  value: str(r.throughputPanelLayout).toLowerCase() === "horizontal" ? "horizontal" : "vertical",
                  onChange: (e) => onChange("throughputPanelLayout", e.target.value),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "vertical", children: de ? "Senkrecht: Grafik oben, Mess-Kacheln darunter" : "Vertical: chart on top, stat tiles below" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "horizontal", children: de ? "Waagerecht: Grafik links, Mess-Kacheln rechts" : "Horizontal: chart on the left, stat tiles on the right" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "\u201ESenkrecht\u201C = gro\xDFe Grafik in voller Breite oben, die vier Karten darunter (wie im Wunschbild). \u201EWaagerecht\u201C = Grafik links, Karten rechts \u2014 Kachel ggf. breit ziehen." : "\u201CVertical\u201D = full-width chart on top and four stat tiles below (mockup style). \u201CHorizontal\u201D = chart left, tiles right \u2014 use a wider tile if needed." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "\xDCberschrift \u201EDurchsatz-Verlauf\u201C" : "Throughput title" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowTitle !== false,
                  onChange: (e) => onChange("throughputShowTitle", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "Legende Download/Upload" : "Download / upload legend" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowLegend !== false,
                  onChange: (e) => onChange("throughputShowLegend", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "Live-Werte (\u2193 / \u2191)" : "Live values (\u2193 / \u2191)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowLive !== false,
                  onChange: (e) => onChange("throughputShowLive", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "Kurve anzeigen" : "Show chart" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowChart !== false,
                  onChange: (e) => onChange("throughputShowChart", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "Zeitachsen-Hinweis (\xE4lter / neuer)" : "Time-axis hint (older / newer)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowChartFooter !== false,
                  onChange: (e) => onChange("throughputShowChartFooter", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }, children: de ? "Karten (Kacheln)" : "Summary tiles" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "\xD8 Download" : "Avg download" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowStatAvgDown !== false,
                  onChange: (e) => onChange("throughputShowStatAvgDown", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: de ? "\xD8 Upload" : "Avg upload" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowStatAvgUp !== false,
                  onChange: (e) => onChange("throughputShowStatAvgUp", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: "Peak Down" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowStatPeakDown !== false,
                  onChange: (e) => onChange("throughputShowStatPeakDown", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "10px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)" }, children: "Peak Up" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: r.throughputShowStatPeakUp !== false,
                  onChange: (e) => onChange("throughputShowStatPeakUp", e.target.checked),
                  style: { width: "16px", height: "16px", accentColor: "var(--accent)" }
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Plot-H\xF6he (px)" : "Plot height (px)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: "number",
                  min: 0,
                  max: FB_PLOT_H_MAX,
                  step: 1,
                  value: (() => {
                    const v = Math.round(num(r.throughputChartHeightPx));
                    if (v <= 0) return 0;
                    return Math.min(FB_PLOT_H_MAX, Math.max(1, v || FB_PLOT_H_DEFAULT));
                  })(),
                  onChange: (e) => {
                    const n = Math.round(Number(e.target.value)) || 0;
                    onChange("throughputChartHeightPx", n <= 0 ? 0 : Math.min(FB_PLOT_H_MAX, Math.max(1, n)));
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? `0 = intern ${FB_PLOT_H_DEFAULT} px (Standard). Sonst 1\u2013${FB_PLOT_H_MAX} px, Schrittweite 1.` : `0 = default height (${FB_PLOT_H_DEFAULT} px). Otherwise 1\u2013${FB_PLOT_H_MAX} px, step 1.` })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Y-Achse Maximum (Mbit/s)" : "Y-axis maximum (Mbit/s)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: "number",
                  min: 0,
                  max: 2e3,
                  value: Math.min(2e3, Math.max(0, Math.round(num(r.throughputChartYMaxMbps)))),
                  onChange: (e) => onChange("throughputChartYMaxMbps", Math.min(2e3, Math.max(0, Math.round(Number(e.target.value)) || 0)))
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "0 = Skalenende automatisch aus den Daten. Sonst fester Maximalwert; h\xF6here Messwerte werden oben abgeschnitten." : "0 = scale top from data. Otherwise fixed top; higher samples are clipped at the top edge." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Max. Messrate (Mbit/s)" : "Max measured rate (Mbit/s)" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: "number",
                  min: 0,
                  max: 2e5,
                  step: 1,
                  value: Math.min(2e5, Math.max(0, Math.round(num(r.throughputClampMbps)))),
                  onChange: (e) => onChange("throughputClampMbps", Math.min(2e5, Math.max(0, Math.round(Number(e.target.value)) || 0)))
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
                " = nur die TR-064-Werte ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Layer1-MaxBitRate" }),
                " der Box (falls vorhanden) + 3 % Puffer.",
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "> 0" }),
                " = harte Obergrenze in ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Mbit/s" }),
                " f\xFCr beide Richtungen (z.\u202FB. ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1000" }),
                " bei 1-Gbit-Vertrag) \u2014 ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "ohne" }),
                " zus\xE4tzlichen Aufschlag, damit Peaks nicht \xFCber deinen Wert rutschen."
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0" }),
                " = only use TR-064 ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Layer1 max bit rate" }),
                " from the router (when available) + 3% headroom.",
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "> 0" }),
                " = hard cap in ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Mbit/s" }),
                " for both directions (e.g. ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1000" }),
                " on a 1 Gbit/s line) \u2014",
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "no extra margin" }),
                ", so peaks cannot exceed the number you enter."
              ] }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }, children: de ? "Max. Messpunkte" : "Max samples" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  style: inp,
                  type: "number",
                  min: 16,
                  max: 120,
                  value: Math.min(120, Math.max(16, Math.round(num(r.chartHistoryPoints)) || 48)),
                  onChange: (e) => onChange("chartHistoryPoints", Math.min(120, Math.max(16, Math.round(Number(e.target.value)) || 48)))
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.45 }, children: de ? "16\u2013120: wie viele Werte f\xFCr die Kurve gespeichert werden (l\xE4ngerer Verlauf = mehr Punkte)." : "16\u2013120: how many samples are kept for the chart." })
            ] })
          ]
        }
      )
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/fritzbox.tsx
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
lucide-react/dist/esm/icons/arrow-down.js:
lucide-react/dist/esm/icons/arrow-up.js:
lucide-react/dist/esm/icons/trending-up.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
