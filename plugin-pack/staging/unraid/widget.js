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

  // ../plugins/unraid/index.tsx
  var import_react2 = __toESM(require_react());

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
  var import_react = __toESM(require_react(), 1);
  var import_with_selector = __toESM(require_with_selector(), 1);
  var import_meta2 = {};
  var { useDebugValue } = import_react.default;
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

  // src/lib/pluginLocale.ts
  function usePluginLocale() {
    const locale = useDashboardStore((s) => s.locale);
    return { locale, de: locale !== "en" };
  }

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

  // ../plugins/unraid/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "unraid",
    name: "Unraid",
    description: "System-\xDCbersicht per Unraid GraphQL API (7.2+): CPU, RAM, Array, Cache/Pool-Disks. RAM-Anzeige umschaltbar (used / 1\u2212verf\xFCgbar / API-%); Darstellung an Theme-Textfarben angeglichen.",
    version: "1.5.3",
    author: "SelfDashboard",
    category: "system",
    icon: "\u{1F5A5}\uFE0F",
    iconUrl: "/plugin-logos/unraid.svg"
  };
  var QUERY = `query SelfDashboardUnraid {
  info {
    cpu {
      manufacturer
      brand
      cores
      threads
      packages {
        temp
      }
    }
    os {
      hostname
      uptime
    }
  }
  metrics {
    cpu {
      percentTotal
    }
    memory {
      total
      used
      free
      available
      percentTotal
    }
  }
  array {
    state
    capacity {
      kilobytes {
        total
        used
        free
      }
    }
    disks {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
    }
    caches {
      id
      name
      status
      temp
      fsSize
      fsFree
      fsUsed
      type
    }
  }
}`;
  function num(v) {
    if (v == null || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  }
  function packageTempMax(packages) {
    const arr = packages?.temp;
    if (!Array.isArray(arr)) return 0;
    let m = 0;
    for (const t of arr) {
      const v = typeof t === "number" ? t : Number(t);
      if (Number.isFinite(v) && v > m) m = v;
    }
    return Math.round(m);
  }
  function fmtKb(kb) {
    if (kb >= 1024 ** 3) return `${(kb / 1024 ** 3).toFixed(1)} TB`;
    if (kb >= 1024 ** 2) return `${(kb / 1024 ** 2).toFixed(1)} GB`;
    return `${(kb / 1024).toFixed(0)} MB`;
  }
  function fmtBytes(b) {
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${b} B`;
  }
  function pct(used, total) {
    return total ? Math.round(used / total * 100) : 0;
  }
  function formatDiskStatus(status, de) {
    if (!status) return "\u2014";
    const mapDe = {
      DISK_OK: "OK",
      DISK_NP: "Leer",
      DISK_NP_MISSING: "Fehlt",
      DISK_INVALID: "Ung\xFCltig",
      DISK_WRONG: "Falsch",
      DISK_DSBL: "Aus",
      DISK_NP_DSBL: "Aus (leer)",
      DISK_DSBL_NEW: "Neu (aus)",
      DISK_NEW: "Neu"
    };
    const mapEn = {
      DISK_OK: "OK",
      DISK_NP: "Empty",
      DISK_NP_MISSING: "Missing",
      DISK_INVALID: "Invalid",
      DISK_WRONG: "Wrong",
      DISK_DSBL: "Disabled",
      DISK_NP_DSBL: "Disabled (empty)",
      DISK_DSBL_NEW: "New (disabled)",
      DISK_NEW: "New"
    };
    const map = de ? mapDe : mapEn;
    return map[status] ?? status.replace(/^DISK_/, "");
  }
  function diskTypeLabel(t, de) {
    if (!t) return "";
    const mapDe = {
      DATA: "Daten",
      PARITY: "Parity",
      BOOT: "Boot",
      FLASH: "Flash",
      CACHE: "Cache"
    };
    const mapEn = {
      DATA: "Data",
      PARITY: "Parity",
      BOOT: "Boot",
      FLASH: "Flash",
      CACHE: "Cache"
    };
    const map = de ? mapDe : mapEn;
    return map[t] ?? t;
  }
  function arrayHeading(state, locale) {
    const raw = (state ?? "").trim();
    if (!raw || /^started$/i.test(raw)) return "Array";
    return `Array \u2014 ${translateArrayState(raw, locale)}`;
  }
  function translateArrayState(state, locale) {
    const de = locale !== "en";
    const k = state.trim().toLowerCase().replace(/\s+/g, "_");
    const table = {
      started: ["Gestartet", "Started"],
      stopped: ["Gestoppt", "Stopped"],
      stopping: ["Stoppt\u2026", "Stopping\u2026"],
      starting: ["Startet\u2026", "Starting\u2026"],
      new_array: ["Neues Array", "New array"],
      recon: ["Parity-Sync", "Parity sync"],
      parity_check: ["Parity-Check", "Parity check"],
      clearing: ["Wird geleert\u2026", "Clearing\u2026"],
      disabled: ["Deaktiviert", "Disabled"]
    };
    const pair = table[k];
    if (pair) return de ? pair[0] : pair[1];
    return state;
  }
  var HEAT = {
    ok: "#22c55e",
    mid: "#f59e0b",
    hot: "#ef4444"
  };
  function heatSolid(pct2) {
    const p = Math.min(100, Math.max(0, pct2));
    if (p < 50) return HEAT.ok;
    if (p < 80) return HEAT.mid;
    return HEAT.hot;
  }
  function Bar({ value }) {
    const w = Math.min(100, Math.max(0, value));
    const fill = heatSolid(w);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        title: `${Math.round(w)}%`,
        style: {
          height: "5px",
          borderRadius: "999px",
          width: "100%",
          overflow: "hidden",
          background: "var(--border)",
          border: "1px solid color-mix(in srgb, var(--border) 90%, transparent)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              height: "100%",
              width: `${w}%`,
              background: fill,
              borderRadius: "999px",
              transition: "width 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
            }
          }
        )
      }
    );
  }
  function Row({ label, value, bar, pct: p, title }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        title,
        style: {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minHeight: "20px",
          width: "100%",
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              title: label,
              style: {
                flex: "1 1 34%",
                minWidth: 0,
                fontSize: "11px",
                color: "var(--text)",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: label
            }
          ),
          bar && p !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: "1 1 38%", minWidth: "40px", maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { value: p }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: "1 1 38%" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: "tabular-nums",
              style: {
                flex: "0 0 auto",
                maxWidth: "42%",
                fontSize: "11px",
                color: "var(--text)",
                fontWeight: 500,
                textAlign: "right",
                whiteSpace: "nowrap",
                paddingLeft: "6px",
                fontVariantNumeric: "tabular-nums"
              },
              children: value
            }
          )
        ]
      }
    );
  }
  function Heading({ text }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        style: {
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          margin: "12px 0 8px",
          paddingBottom: "4px",
          borderBottom: "1px solid var(--border)"
        },
        children: text
      }
    );
  }
  function DiskVolumeRow({ disk, de }) {
    const used = Math.max(0, disk.fsSize - disk.fsFree);
    const p = pct(used, disk.fsSize);
    const kind = diskTypeLabel(disk.diskType, de);
    const title = [disk.name, kind, formatDiskStatus(disk.status, de)].filter(Boolean).join(" \u2014 ");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          borderTop: "1px solid var(--border)",
          paddingTop: "10px",
          marginTop: "10px",
          minWidth: 0
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "6px", minWidth: 0, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                style: {
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flex: "1 1 40%"
                },
                title,
                children: [
                  disk.name,
                  kind ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontWeight: 500, color: "var(--text-muted)", marginLeft: "6px", fontSize: "10px" }, children: [
                    "(",
                    kind,
                    ")"
                  ] }) : null
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                className: "tabular-nums",
                style: {
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  lineHeight: 1.35,
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500
                },
                children: [
                  formatDiskStatus(disk.status, de),
                  " \xB7 ",
                  disk.temp > 0 ? `${disk.temp}\xB0C` : "\u2014",
                  " \xB7 ",
                  p,
                  "%"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: "1 1 auto", minWidth: "48px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { value: p }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "span",
              {
                className: "tabular-nums",
                style: {
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  paddingLeft: "6px",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500
                },
                children: [
                  fmtKb(used),
                  " / ",
                  fmtKb(disk.fsSize)
                ]
              }
            )
          ] })
        ]
      }
    );
  }
  function mapDisk(raw) {
    return {
      id: String(raw.id ?? raw.name ?? ""),
      name: String(raw.name ?? ""),
      status: String(raw.status ?? ""),
      temp: Math.round(num(raw.temp)),
      fsSize: num(raw.fsSize),
      fsFree: num(raw.fsFree),
      diskType: raw.type ? String(raw.type) : void 0
    };
  }
  function mapResponse(d) {
    const info = d?.info;
    const metrics = d?.metrics;
    const arr = d?.array;
    const cpuInfo = info?.cpu;
    const mCpu = metrics?.cpu;
    const mMem = metrics?.memory;
    const kb = arr?.capacity;
    const kbInner = kb?.kilobytes;
    const disksRaw = arr?.disks ?? [];
    const disks = disksRaw.map((x) => mapDisk(x));
    const cachesRaw = arr?.caches ?? [];
    const pools = cachesRaw.filter((c) => c && num(c.fsSize) > 0).map((c) => mapDisk(c));
    const packages = cpuInfo?.packages;
    return {
      cpu: cpuInfo ? {
        brand: String(cpuInfo.brand ?? cpuInfo.manufacturer ?? "CPU"),
        cores: num(cpuInfo.cores),
        threads: num(cpuInfo.threads),
        utilization: Math.round(num(mCpu?.percentTotal)),
        temp: packageTempMax(packages)
      } : void 0,
      memory: mMem ? {
        total: num(mMem.total),
        used: num(mMem.used),
        free: num(mMem.free),
        available: mMem.available !== void 0 && mMem.available !== null ? num(mMem.available) : void 0,
        percentTotal: num(mMem.percentTotal)
      } : void 0,
      array: arr ? {
        state: String(arr.state ?? ""),
        capacity: {
          kilobytes: {
            total: num(kbInner?.total),
            used: num(kbInner?.used),
            free: num(kbInner?.free)
          }
        },
        disks
      } : void 0,
      pools: pools.length ? pools : void 0
    };
  }
  function flag(config, key, defaultTrue = true) {
    const v = config[key];
    if (v === void 0 || v === null) return defaultTrue;
    return v !== false;
  }
  function aggregateDisks(disks) {
    let total = 0;
    let used = 0;
    for (const d of disks) {
      total += d.fsSize;
      used += Math.max(0, d.fsSize - d.fsFree);
    }
    return { total, used };
  }
  function parseRamDisplayMode(v) {
    const s = String(v ?? "used").trim();
    if (s === "available" || s === "percentTotal") return s;
    return "used";
  }
  function ramRow(mode, mem, de) {
    const { total, used, available, percentTotal } = mem;
    if (mode === "percentTotal") {
      const p = Number.isFinite(percentTotal) ? Math.round(Math.min(100, Math.max(0, percentTotal))) : pct(used, total);
      return {
        rowLabel: de ? "Anteil (API %)" : "Share (API %)",
        value: `${p}% \xB7 ${fmtBytes(used)} / ${fmtBytes(total)}`,
        barPct: p
      };
    }
    if (mode === "available" && total > 0 && available !== void 0) {
      const committed = Math.max(0, Math.min(total, total - available));
      const p = pct(committed, total);
      return {
        rowLabel: de ? "Belegung" : "Committed",
        value: `${fmtBytes(committed)} / ${fmtBytes(total)}`,
        barPct: p,
        rowTitle: de ? `Balken: (gesamt \u2212 verf\xFCgbar) / gesamt. Verf\xFCgbar: ${fmtBytes(available)}.` : `Bar: (total \u2212 available) / total. Available: ${fmtBytes(available)}.`
      };
    }
    return {
      rowLabel: de ? "Verbrauch" : "Used",
      value: `${fmtBytes(used)} / ${fmtBytes(total)}`,
      barPct: pct(used, total)
    };
  }
  function Widget({ config }) {
    const { locale, de } = usePluginLocale();
    const [data, setData] = (0, import_react2.useState)(null);
    const [error, setError] = (0, import_react2.useState)(null);
    const [loading, setLoading] = (0, import_react2.useState)(true);
    const url = config.url?.replace(/\/$/, "");
    const apiKey = config.apiKey;
    const refresh = (config.refreshInterval ?? 5) * 1e3;
    const showCpu = flag(config, "showCpu");
    const showCpuLoad = flag(config, "showCpuLoad");
    const showCpuPkgTemp = flag(config, "showCpuPkgTemp");
    const showCpuCores = flag(config, "showCpuCores");
    const showRam = flag(config, "showRam");
    const showArray = flag(config, "showArray");
    const showArrayTotal = flag(config, "showArrayTotal");
    const showArrayDisks = flag(config, "showArrayDisks");
    const showPools = flag(config, "showPools");
    const showPoolsTotal = flag(config, "showPoolsTotal");
    const showPoolsDisks = flag(config, "showPoolsDisks");
    const ramMode = parseRamDisplayMode(config.ramDisplayMode);
    const fetch_ = (0, import_react2.useCallback)(async () => {
      if (!url || !apiKey) {
        setLoading(false);
        return;
      }
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        };
        const res = await fetch(`${url}/graphql`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: QUERY })
        });
        const rawText = await res.text();
        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          throw new Error(res.ok ? "Ung\xFCltige JSON-Antwort" : `HTTP ${res.status}`);
        }
        if (!res.ok) {
          const hint = json.errors?.map((e) => e.message).filter(Boolean).join("; ");
          throw new Error(hint || `HTTP ${res.status}`);
        }
        if (json.errors?.length) {
          throw new Error(json.errors.map((e) => e.message ?? "GraphQL").join("; "));
        }
        setData(mapResponse(json.data));
        setError(null);
      } catch (e) {
        reportPluginCatch("unraid", e, "fetch");
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }, [url, apiKey]);
    (0, import_react2.useEffect)(() => {
      fetch_();
      const id = setInterval(fetch_, refresh);
      return () => clearInterval(id);
    }, [fetch_, refresh]);
    const shellStyle = {
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: "10px 14px 14px",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      background: "transparent"
    };
    if (!url || !apiKey)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "sd-plugin-no-scrollbar",
          style: { ...shellStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "32px" }, children: "\u{1F5A5}\uFE0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "var(--text)", marginTop: "10px", lineHeight: 1.45, fontWeight: 500 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "URL & API Key",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
              "in Einstellungen eintragen"
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              "URL & API key",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
              "in settings"
            ] }) })
          ]
        }
      );
    if (loading)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sd-plugin-no-scrollbar", style: shellStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [80, 60, 90, 70].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "12px", width: `${w}%`, borderRadius: "3px" } }, i)) }) });
    if (error)
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "sd-plugin-no-scrollbar",
          style: { ...shellStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "24px" }, children: "\u26A0\uFE0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "#ef4444", marginTop: "10px", wordBreak: "break-word", fontWeight: 600 }, children: error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.45 }, children: de ? "URL ohne Endpfad, API-Key mit Rolle VIEWER oder ADMIN." : "Base URL without path; API key with VIEWER or ADMIN role." })
          ]
        }
      );
    const arrayKb = data?.array?.capacity?.kilobytes;
    const poolDisks = data?.pools ?? [];
    const poolAgg = aggregateDisks(poolDisks);
    const poolPct = poolAgg.total ? pct(poolAgg.used, poolAgg.total) : 0;
    const ramResolved = showRam && data?.memory ? ramRow(ramMode === "available" && data.memory.available === void 0 ? "used" : ramMode, data.memory, de) : null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sd-plugin-no-scrollbar", style: shellStyle, children: [
      showCpu && data?.cpu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: `CPU \u2014 ${data.cpu.brand}` }),
        showCpuLoad && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Auslastung" : "Load", value: `${data.cpu.utilization}%`, bar: true, pct: data.cpu.utilization }),
        showCpuPkgTemp && data.cpu.temp > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Paket-Temp." : "Package temp.", value: `${data.cpu.temp}\xB0C`, bar: true, pct: data.cpu.temp }),
        showCpuCores && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Kerne / Threads" : "Cores / threads", value: `${data.cpu.cores} / ${data.cpu.threads}` })
      ] }),
      ramResolved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: "RAM" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: ramResolved.rowLabel, value: ramResolved.value, bar: true, pct: ramResolved.barPct, title: ramResolved.rowTitle })
      ] }),
      showArray && data?.array && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: arrayHeading(data.array.state, locale) }),
        showArrayTotal && arrayKb && num(arrayKb.total) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Gesamt" : "Total", value: `${fmtKb(num(arrayKb.used))} / ${fmtKb(num(arrayKb.total))}`, bar: true, pct: pct(num(arrayKb.used), num(arrayKb.total)) }),
        showArrayDisks && data.array.disks?.filter((d) => d.status !== "DISK_NP" && d.fsSize > 0).map((disk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskVolumeRow, { disk, de }, disk.id))
      ] }),
      showPools && poolDisks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, { text: de ? "Pools / Cache" : "Pools / cache" }),
        showPoolsTotal && poolAgg.total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { label: de ? "Gesamt (Cache)" : "Total (cache)", value: `${fmtKb(poolAgg.used)} / ${fmtKb(poolAgg.total)}`, bar: true, pct: poolPct }),
        showPoolsDisks && poolDisks.map((disk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiskVolumeRow, { disk, de }, disk.id))
      ] })
    ] });
  }
  function ToggleRow({
    label,
    on,
    onToggle
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }, onClick: onToggle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "13px", color: "var(--text)", flex: 1 }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            width: "36px",
            height: "20px",
            borderRadius: "10px",
            background: on ? "var(--accent)" : "var(--border)",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                position: "absolute",
                top: "2px",
                left: on ? "18px" : "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s"
              }
            }
          )
        }
      )
    ] });
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
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
    const sub = (key, def = true) => flag(config, key, def);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "16px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Unraid-Basis-URL" : "Unraid base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: config.url || "", onChange: (e) => onChange("url", e.target.value), placeholder: "http://192.168.1.10 oder https://tower" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: "API Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, type: "password", value: config.apiKey || "", onChange: (e) => onChange("apiKey", e.target.value), placeholder: "x-api-key" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: config.refreshInterval ?? 5, onChange: (e) => onChange("refreshInterval", Number(e.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 2, children: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 10, children: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 30, children: "30" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 60, children: "60" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Anzeige \u2014 grob" : "Display \u2014 overview" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "\u{1F5A5}\uFE0F CPU (Sektion)" : "\u{1F5A5}\uFE0F CPU (section)", on: sub("showCpu"), onToggle: () => onChange("showCpu", !sub("showCpu")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: "\u{1F4BE} RAM", on: sub("showRam"), onToggle: () => onChange("showRam", !sub("showRam")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: "\u{1F5C4}\uFE0F Array", on: sub("showArray"), onToggle: () => onChange("showArray", !sub("showArray")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "\u{1F4BF} Pools / Cache" : "\u{1F4BF} Pools / cache", on: sub("showPools"), onToggle: () => onChange("showPools", !sub("showPools")) })
        ] })
      ] }),
      sub("showCpu") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "CPU \u2014 Details" : "CPU \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Auslastung %" : "Load %", on: sub("showCpuLoad"), onToggle: () => onChange("showCpuLoad", !sub("showCpuLoad")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Paket-Temperatur" : "Package temperature", on: sub("showCpuPkgTemp"), onToggle: () => onChange("showCpuPkgTemp", !sub("showCpuPkgTemp")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Kerne / Threads" : "Cores / threads", on: sub("showCpuCores"), onToggle: () => onChange("showCpuCores", !sub("showCpuCores")) })
        ] })
      ] }),
      sub("showArray") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Array \u2014 Details" : "Array \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Gesamt-Balken" : "Total bar", on: sub("showArrayTotal"), onToggle: () => onChange("showArrayTotal", !sub("showArrayTotal")) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ToggleRow,
            {
              label: de ? "Einzelne Disks (Status \xB7 Temp \xB7 %)" : "Individual disks (status \xB7 temp \xB7 %)",
              on: sub("showArrayDisks"),
              onToggle: () => onChange("showArrayDisks", !sub("showArrayDisks"))
            }
          )
        ] })
      ] }),
      sub("showPools") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Pools / Cache \u2014 Details" : "Pools / cache \u2014 details" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            ToggleRow,
            {
              label: de ? "Gesamt-Balken (alle Cache-Disks)" : "Total bar (all cache disks)",
              on: sub("showPoolsTotal"),
              onToggle: () => onChange("showPoolsTotal", !sub("showPoolsTotal"))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Einzelne Cache-Disks" : "Individual cache disks", on: sub("showPoolsDisks"), onToggle: () => onChange("showPoolsDisks", !sub("showPoolsDisks")) })
        ] })
      ] }),
      sub("showRam") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "RAM \u2014 Anzeige" : "RAM \u2014 display" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { paddingLeft: "4px", borderLeft: "2px solid var(--border)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }, children: de ? "Balken und Text" : "Bar and text" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              style: { ...inp, cursor: "pointer" },
              value: String(config.ramDisplayMode ?? "used"),
              onChange: (e) => onChange("ramDisplayMode", e.target.value),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "used", children: de ? "Verbrauch (used / total)" : "Used (used / total)" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "available", children: de ? "Belegung (1 \u2212 verf\xFCgbar / total)" : "Committed (1 \u2212 available / total)" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "percentTotal", children: "API % (metrics.percentTotal)" })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.45, margin: "8px 0 0" }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            "\u201E1 \u2212 verf\xFCgbar\u201C wirkt oft n\xE4her am Unraid-Dashboard als reines ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "used" }),
            ". Erfordert",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "metrics.memory.available" }),
            " in der API (Unraid 7.2+)."
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            "\u201C1 \u2212 available\u201D often matches the Unraid dashboard better than raw ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "used" }),
            ". Requires",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { style: { fontSize: "10px" }, children: "metrics.memory.available" }),
            " in the API (Unraid 7.2+)."
          ] }) })
        ] })
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/unraid.tsx
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
*/
