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

  // sd-react:react-dom
  var require_react_dom = __commonJS({
    "sd-react:react-dom"(exports, module) {
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
          cachedValue = useState3({
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
          useEffect3(
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
        var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState3 = React.useState, useEffect3 = React.useEffect, useLayoutEffect = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
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
        var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef2 = React.useRef, useEffect3 = React.useEffect, useMemo = React.useMemo, useDebugValue2 = React.useDebugValue;
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
          useEffect3(
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

  // plugins/scratchpad/index.tsx
  var import_react3 = __toESM(require_react());

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
  var import_react2 = __toESM(require_react(), 1);
  var import_with_selector = __toESM(require_with_selector(), 1);
  var import_meta2 = {};
  var { useDebugValue } = import_react2.default;
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
    (0, import_react3.useEffect)(() => {
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
    const [draft, setDraft] = (0, import_react3.useState)(savedNote);
    const [confirmOpen, setConfirmOpen] = (0, import_react3.useState)(false);
    (0, import_react3.useEffect)(() => {
      setDraft(savedNote);
    }, [savedNote, instanceId]);
    const dirty = draft !== savedNote;
    const persist2 = (0, import_react3.useCallback)(() => {
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
              onConfirm: persist2
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
*/
