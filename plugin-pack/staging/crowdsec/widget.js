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
          cachedValue = useState5({
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
        var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState5 = React.useState, useEffect3 = React.useEffect, useLayoutEffect2 = React.useLayoutEffect, useDebugValue2 = React.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
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
        var React = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef2 = React.useRef, useEffect3 = React.useEffect, useMemo2 = React.useMemo, useDebugValue2 = React.useDebugValue;
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
      function jsx6(type, props, key) {
        if (key !== void 0) return R.createElement(type, { ...props, key });
        return R.createElement(type, props);
      }
      exports.jsx = jsx6;
      exports.jsxs = jsx6;
      exports.Fragment = R.Fragment;
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

  // ../plugins/crowdsec/CrowdsecWidget.tsx
  var import_react7 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var import_react3 = __toESM(require_react());

  // node_modules/lucide-react/dist/esm/shared/src/utils.js
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && array.indexOf(className) === index;
  }).join(" ");

  // node_modules/lucide-react/dist/esm/Icon.js
  var import_react2 = __toESM(require_react());

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
  var Icon = (0, import_react2.forwardRef)(
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
      return (0, import_react2.createElement)(
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
          ...iconNode.map(([tag, attrs]) => (0, import_react2.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      );
    }
  );

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component = (0, import_react3.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react3.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
        ...props
      })
    );
    Component.displayName = `${iconName}`;
    return Component;
  };

  // node_modules/lucide-react/dist/esm/icons/copy.js
  var Copy = createLucideIcon("Copy", [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/gavel.js
  var Gavel = createLucideIcon("Gavel", [
    ["path", { d: "m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8", key: "15492f" }],
    ["path", { d: "m16 16 6-6", key: "vzrcl6" }],
    ["path", { d: "m8 8 6-6", key: "18bi4p" }],
    ["path", { d: "m9 7 8 8", key: "5jnvq1" }],
    ["path", { d: "m21 11-8-8", key: "z4y7zo" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/globe.js
  var Globe = createLucideIcon("Globe", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
    ["path", { d: "M2 12h20", key: "9i4pu4" }]
  ]);

  // node_modules/lucide-react/dist/esm/icons/search.js
  var Search = createLucideIcon("Search", [
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
    ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
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

  // node_modules/lucide-react/dist/esm/icons/trash-2.js
  var Trash2 = createLucideIcon("Trash2", [
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
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

  // ../plugins/crowdsec/CrowdsecLogo.tsx
  var import_react4 = __toESM(require_react());
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var BRAND_LOGO_SRC = "/plugin-logos/crowdsec_breit.png";
  var ICON_LOGO_SRC = "/plugin-logos/crowdsec.png";
  function LogoFallback({ height }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { height, width: height, viewBox: "0 0 64 64", "aria-hidden": true, className: "cs-logo-svg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", { id: "cs-logo-grad-fb", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: "#5eb3ff" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: "#2b7fd4" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "32", cy: "32", r: "30", fill: "currentColor", fillOpacity: "0.12", stroke: "url(#cs-logo-grad-fb)", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          fill: "url(#cs-logo-grad-fb)",
          d: "M32 12c-8 6-18 7-18 7v14c0 12 8 20 18 23 10-3 18-11 18-23V19s-10-1-18-7zm0 8c3 2 8 3 12 3v11c0 8-5 14-12 16-7-2-12-8-12-16V23c4 0 9-1 12-3z"
        }
      )
    ] });
  }
  function CrowdsecLogo({ size = 28, variant = "icon" }) {
    const [failed, setFailed] = (0, import_react4.useState)(false);
    const src = variant === "brand" ? BRAND_LOGO_SRC : ICON_LOGO_SRC;
    if (failed) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoFallback, { height: variant === "brand" ? 32 : size });
    }
    if (variant === "brand") {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          src,
          alt: "CrowdSec",
          className: "cs-logo-img cs-logo-img-brand",
          decoding: "async",
          onError: () => setFailed(true)
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "img",
      {
        src,
        alt: "",
        width: size,
        height: size,
        className: "cs-logo-img",
        decoding: "async",
        onError: () => setFailed(true)
      }
    );
  }

  // ../plugins/crowdsec/constants.ts
  var COUNTRY_NAME = {
    DE: "Deutschland",
    US: "USA",
    FR: "Frankreich",
    GB: "UK",
    NL: "Niederlande",
    CN: "China",
    RU: "Russland",
    BR: "Brasilien",
    IN: "Indien",
    SG: "Singapur",
    PL: "Polen",
    IT: "Italien",
    ES: "Spanien",
    SE: "Schweden",
    CH: "Schweiz",
    AT: "\xD6sterreich",
    UA: "Ukraine",
    TR: "T\xFCrkei",
    JP: "Japan",
    KR: "Korea",
    AU: "Australien",
    CA: "Kanada"
  };

  // ../plugins/crowdsec/CountryFlag.tsx
  var import_react5 = __toESM(require_react());

  // ../plugins/crowdsec/flags.ts
  function countryCodeToEmoji(code) {
    const cc = normalizeCountryCode(code);
    if (!cc || cc === "??") return "\u{1F310}";
    const A = 127462;
    return String.fromCodePoint(...[...cc].map((c) => A + c.toUpperCase().charCodeAt(0) - 65));
  }
  function normalizeCountryCode(raw) {
    const s = String(raw ?? "").trim().toUpperCase();
    if (!s || s === "??" || s === "XX" || s === "UNKNOWN") return "";
    if (s.length === 2 && /^[A-Z]{2}$/.test(s)) return s;
    return "";
  }
  function flagImageUrl(code, width = 40) {
    const cc = normalizeCountryCode(code).toLowerCase();
    if (!cc) return "";
    return `https://flagcdn.com/w${width}/${cc}.png`;
  }

  // ../plugins/crowdsec/CountryFlag.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime());
  function CountryFlag({ code, size = 22, className = "", title }) {
    const cc = normalizeCountryCode(code) || normalizeCountryCode(code.slice(0, 2));
    const emoji = countryCodeToEmoji(cc || code);
    const src = cc ? flagImageUrl(cc, size <= 20 ? 40 : 80) : "";
    const [imgOk, setImgOk] = (0, import_react5.useState)(Boolean(src));
    if (!src || !imgOk) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "span",
        {
          className: `cs-flag cs-flag-emoji ${className}`.trim(),
          style: { fontSize: Math.round(size * 0.85), lineHeight: 1 },
          title: title || cc || code,
          "aria-hidden": true,
          children: emoji
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "img",
      {
        src,
        alt: "",
        width: size,
        height: Math.round(size * 0.72),
        className: `cs-flag ${className}`.trim(),
        title: title || cc,
        loading: "lazy",
        decoding: "async",
        referrerPolicy: "no-referrer",
        onError: () => setImgOk(false)
      }
    );
  }

  // ../plugins/crowdsec/IpLookupMenu.tsx
  var import_react6 = __toESM(require_react());
  var import_react_dom = __toESM(require_react_dom());
  var import_jsx_runtime3 = __toESM(require_jsx_runtime());
  function IpLookupMenu({ item, de, anchorEl, services, onClose }) {
    const menuRef = (0, import_react6.useRef)(null);
    const [pos, setPos] = (0, import_react6.useState)({ left: 0, top: 0 });
    (0, import_react6.useLayoutEffect)(() => {
      if (!anchorEl || !menuRef.current) return;
      const rect = anchorEl.getBoundingClientRect();
      const mw = menuRef.current.offsetWidth || 165;
      const mh = menuRef.current.offsetHeight || 260;
      let x = rect.left - mw - 8;
      let y = rect.top - 8;
      if (x < 10) x = rect.right + 8;
      if (x + mw > window.innerWidth - 10) x = window.innerWidth - mw - 10;
      if (y + mh > window.innerHeight - 10) y = window.innerHeight - mh - 10;
      if (y < 10) y = 10;
      setPos({ left: x, top: y });
    }, [anchorEl, item.ip]);
    (0, import_react6.useEffect)(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      const onClick = (e) => {
        const t = e.target;
        if (menuRef.current?.contains(t)) return;
        if (anchorEl?.contains(t)) return;
        onClose();
      };
      document.addEventListener("keydown", onKey);
      document.addEventListener("click", onClick, true);
      return () => {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onClick, true);
      };
    }, [anchorEl, onClose]);
    const cc = normalizeCountryCode(item.country);
    const menu = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        ref: menuRef,
        className: "cs-wl-menu",
        role: "menu",
        style: { left: pos.left, top: pos.top },
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "cs-wl-menu-title", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CountryFlag, { code: cc || item.country, size: 16 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
              COUNTRY_NAME[cc] || cc || "?",
              " \xB7 ",
              item.ip,
              item.city ? ` \xB7 ${item.city}` : ""
            ] })
          ] }),
          services.map((s) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "a",
            {
              className: "cs-wl-menu-item",
              href: s.href(item),
              target: "_blank",
              rel: "noopener noreferrer",
              role: "menuitem",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cs-wl-menu-icon", "aria-hidden": true, children: s.icon }),
                s.label
              ]
            },
            s.id
          )),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "cs-wl-menu-close", onClick: onClose, children: [
            "\u2715 ",
            de ? "SCHLIESSEN" : "CLOSE"
          ] })
        ]
      }
    );
    if (typeof document === "undefined") return menu;
    return (0, import_react_dom.createPortal)(menu, document.body);
  }

  // ../plugins/crowdsec/ipLookup.ts
  var LOOKUP_SERVICES = [
    {
      id: "cti",
      label: "CrowdSec CTI",
      icon: "\u{1F6E1}",
      href: (d) => `https://app.crowdsec.net/cti/${encodeURIComponent(d.ip)}`
    },
    {
      id: "shodan",
      label: "Shodan",
      icon: "\u{1F50D}",
      href: (d) => `https://www.shodan.io/host/${encodeURIComponent(d.ip)}`
    },
    {
      id: "censys",
      label: "Censys",
      icon: "\u{1F310}",
      href: (d) => `https://search.censys.io/hosts/${encodeURIComponent(d.ip)}`
    },
    {
      id: "ripe",
      label: "RIPE",
      icon: "\u{1F4CB}",
      href: (d) => {
        const q = d.iprange?.trim() || d.ip;
        return `https://apps.db.ripe.net/db-web-ui/query?bflag=true&dflag=false&rflag=false&source=GRS&searchtext=${encodeURIComponent(q)}`;
      }
    },
    {
      id: "ripestat",
      label: "RIPEstat",
      icon: "\u{1F4CA}",
      href: (d) => {
        const q = d.iprange?.trim() || d.ip;
        return `https://stat.ripe.net/${encodeURIComponent(q)}`;
      }
    },
    {
      id: "criminalip",
      label: "Criminal IP",
      icon: "\u26A0\uFE0F",
      href: (d) => `https://www.criminalip.io/asset/report/${encodeURIComponent(d.ip)}`
    }
  ];
  var DEFAULT_LOOKUP_ENABLED = {
    cti: true,
    shodan: true,
    censys: true,
    ripe: true,
    ripestat: true,
    criminalip: true
  };

  // ../plugins/crowdsec/presets.ts
  var DAY_RANGE_PRESETS = [
    { days: 1, de: "1 Tag", en: "1 day" },
    { days: 7, de: "7 Tage", en: "7 days" },
    { days: 30, de: "30 Tage", en: "30 days" },
    { days: 90, de: "90 Tage", en: "90 days" },
    { days: 365, de: "1 Jahr", en: "1 year" },
    { days: 730, de: "2 Jahre", en: "2 years" },
    { days: 1825, de: "5 Jahre", en: "5 years" },
    { days: 3650, de: "10 Jahre", en: "10 years" },
    { days: 0, de: "Alle", en: "All" }
  ];
  var MAX_ALERT_PRESETS = [
    { value: 500, de: "500", en: "500" },
    { value: 1e3, de: "1.000", en: "1,000" },
    { value: 2e3, de: "2.000", en: "2,000" },
    { value: 5e3, de: "5.000", en: "5,000" },
    { value: 1e4, de: "10.000", en: "10,000" },
    { value: 0, de: "Alle", en: "All" }
  ];
  var DAY_PRESET_VALUES = DAY_RANGE_PRESETS.map((p) => p.days);
  function nearestDayPreset(days) {
    const presets = DAY_PRESET_VALUES;
    if (presets.some((d) => d === days)) return days;
    if (days <= 0) return 0;
    const positive = presets.filter((d) => d > 0);
    return positive.reduce((best, d) => Math.abs(d - days) < Math.abs(best - days) ? d : best, 30);
  }
  function nearestMaxAlerts(value) {
    const presets = MAX_ALERT_PRESETS.map((p) => p.value);
    if (presets.some((v) => v === value)) return value;
    if (value <= 0) return 0;
    return presets.reduce((best, v) => v > 0 && Math.abs(v - value) < Math.abs(best - value) ? v : best, 2e3);
  }
  function alertRangeLabel(days, de) {
    const hit = DAY_RANGE_PRESETS.find((p) => p.days === days);
    if (hit) return de ? hit.de : hit.en;
    if (days <= 0) return de ? "Alle" : "All";
    if (days === 1) return de ? "1 Tag" : "1 day";
    return de ? `${days} Tage` : `${days} days`;
  }

  // ../plugins/crowdsec/CrowdsecWidget.tsx
  var import_jsx_runtime4 = __toESM(require_jsx_runtime());
  function cfgBool(v, fallback) {
    if (v === void 0 || v === null || v === "") return fallback;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return fallback;
  }
  function cfgNum(v, fallback) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : fallback;
  }
  function cfgStr(v, fallback) {
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  }
  function parseCrowdsecConfig(raw) {
    const lookupRaw = raw.lookupEnabled;
    const lookupEnabled = { ...DEFAULT_LOOKUP_ENABLED };
    if (lookupRaw && typeof lookupRaw === "object" && !Array.isArray(lookupRaw)) {
      for (const id of Object.keys(DEFAULT_LOOKUP_ENABLED)) {
        lookupEnabled[id] = cfgBool(lookupRaw[id], DEFAULT_LOOKUP_ENABLED[id]);
      }
    }
    return {
      dbPath: cfgStr(raw.dbPath, "/crowdsec-data/crowdsec.db"),
      daysBack: nearestDayPreset(cfgNum(raw.daysBack, 30)),
      refreshSeconds: Math.min(600, Math.max(5, cfgNum(raw.refreshSeconds, 30))),
      maxAlerts: nearestMaxAlerts(cfgNum(raw.maxAlerts, 2e3)),
      dockerUnban: cfgBool(raw.dockerUnban, false),
      crowdsecContainer: cfgStr(raw.crowdsecContainer, "crowdsec"),
      confirmUnban: cfgBool(raw.confirmUnban, true),
      showCountriesList: cfgBool(raw.showCountriesList, true),
      lookupEnabled
    };
  }
  function formatInt(n, locale) {
    return Math.round(n).toLocaleString(locale === "en" ? "en-GB" : "de-DE");
  }
  function formatRelative(iso, locale) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const sec = Math.round((d.getTime() - Date.now()) / 1e3);
    const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "de", { numeric: "auto" });
    const abs = Math.abs(sec);
    if (abs < 60) return rtf.format(sec, "second");
    const min = Math.round(sec / 60);
    if (Math.abs(min) < 60) return rtf.format(min, "minute");
    const hr = Math.round(min / 60);
    if (Math.abs(hr) < 48) return rtf.format(hr, "hour");
    const day = Math.round(hr / 24);
    return rtf.format(day, "day");
  }
  function feedMatchesSearch(item, q) {
    if (!q) return true;
    const cc = normalizeCountryCode(item.country);
    const hay = [
      item.ip,
      cc,
      COUNTRY_NAME[cc] || "",
      item.city,
      item.scenario,
      item.asname,
      item.asnumber
    ].join(" ").toLowerCase();
    return hay.includes(q);
  }
  function CrowdsecWidget({ config: raw, locale, layoutMode = "desktop", theme = "dark" }) {
    const de = locale !== "en";
    const cfg = (0, import_react7.useMemo)(() => parseCrowdsecConfig(raw), [raw]);
    const layoutClass = layoutMode === "phone" ? "cs-layout-phone" : layoutMode === "tablet" ? "cs-layout-tablet" : "";
    const [data, setData] = (0, import_react7.useState)(null);
    const [error, setError] = (0, import_react7.useState)(null);
    const [loading, setLoading] = (0, import_react7.useState)(true);
    const [tab, setTab] = (0, import_react7.useState)("overview");
    const [search, setSearch] = (0, import_react7.useState)("");
    const [selectedKey, setSelectedKey] = (0, import_react7.useState)(null);
    const [lookupItem, setLookupItem] = (0, import_react7.useState)(null);
    const [lookupAnchor, setLookupAnchor] = (0, import_react7.useState)(null);
    const [unbanPending, setUnbanPending] = (0, import_react7.useState)(null);
    const [unbanBusy, setUnbanBusy] = (0, import_react7.useState)(false);
    const [unbanMsg, setUnbanMsg] = (0, import_react7.useState)(null);
    const lookupServices = (0, import_react7.useMemo)(
      () => LOOKUP_SERVICES.filter((s) => cfg.lookupEnabled[s.id]),
      [cfg.lookupEnabled]
    );
    const fetchData = (0, import_react7.useCallback)(async () => {
      const params = new URLSearchParams({
        dbPath: cfg.dbPath,
        daysBack: String(cfg.daysBack),
        maxAlerts: String(cfg.maxAlerts)
      });
      try {
        const res = await fetch(`/api/crowdsec?${params}`);
        const json = await res.json();
        if (!res.ok) {
          const code = typeof json.error === "string" ? json.error : "crowdsec_error";
          reportPluginError("crowdsec", code, {
            category: "fetch",
            detail: JSON.stringify(json).slice(0, 500)
          });
          setError(code);
          setData(null);
          return;
        }
        setData(json);
        setError(null);
      } catch {
        setError("network_error");
        setData(null);
      } finally {
        setLoading(false);
      }
    }, [cfg.dbPath, cfg.daysBack, cfg.maxAlerts]);
    (0, import_react7.useEffect)(() => {
      setLoading(true);
      void fetchData();
      const id = window.setInterval(() => void fetchData(), cfg.refreshSeconds * 1e3);
      return () => window.clearInterval(id);
    }, [fetchData, cfg.refreshSeconds, cfg.daysBack, cfg.maxAlerts]);
    const q = search.trim().toLowerCase();
    const baseFeed = (0, import_react7.useMemo)(() => {
      if (!data) return [];
      if (tab === "bans") return data.feed.filter((f) => f.active_ban);
      return data.feed;
    }, [data, tab]);
    const filteredFeed = (0, import_react7.useMemo)(() => baseFeed.filter((f) => feedMatchesSearch(f, q)), [baseFeed, q]);
    const errLabel = (code) => {
      const map = de ? {
        db_not_found: "crowdsec.db nicht gefunden \u2014 Pfad und Volume pr\xFCfen.",
        db_path_not_allowed: "Datenbankpfad nicht erlaubt.",
        db_schema_unsupported: "Datenbankschema wird nicht unterst\xFCtzt.",
        network_error: "Netzwerkfehler beim Laden.",
        crowdsec_error: "Fehler beim Lesen der Datenbank."
      } : {
        db_not_found: "crowdsec.db not found \u2014 check path and volume mount.",
        db_path_not_allowed: "Database path not allowed.",
        db_schema_unsupported: "Database schema not supported.",
        network_error: "Network error while loading.",
        crowdsec_error: "Failed to read database."
      };
      return map[code] || code;
    };
    const copyIp = async (ip) => {
      try {
        await navigator.clipboard.writeText(ip);
      } catch {
      }
    };
    const doUnban = async (item) => {
      setUnbanBusy(true);
      setUnbanMsg(null);
      try {
        const res = await fetch("/api/crowdsec/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: item.ip, container: cfg.crowdsecContainer })
        });
        const json = await res.json();
        if (!res.ok) {
          setUnbanMsg(typeof json.error === "string" ? json.error : "delete_failed");
          return;
        }
        setUnbanPending(null);
        void fetchData();
      } catch {
        setUnbanMsg("network_error");
      } finally {
        setUnbanBusy(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "section",
      {
        className: `cs-widget ${layoutClass} cs-theme-${theme}`.trim(),
        style: { position: "relative" },
        "data-theme": theme,
        children: [
          error ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-error", children: errLabel(error) }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "cs-sidebar", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("header", { className: "cs-brand", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CrowdsecLogo, { variant: "brand" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-nav", "aria-label": de ? "Navigation" : "Navigation", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "overview" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("overview"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Shield, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "\xDCbersicht" : "Overview"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.alertsInRange, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? `Alerts (${alertRangeLabel(cfg.daysBack, true)})` : `Alerts (${alertRangeLabel(cfg.daysBack, false)})` })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "bans" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("bans"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Gavel, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "Banns" : "Bans"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.activeBans, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? "Aktive Banns" : "Active bans" })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                  "button",
                  {
                    type: "button",
                    className: `cs-nav-item cs-nav-item-btn${tab === "countries" ? " cs-nav-item-active" : ""}`,
                    onClick: () => setTab("countries"),
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "cs-nav-row", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Globe, { size: 14, strokeWidth: 2.2, "aria-hidden": true }),
                        de ? "L\xE4nder" : "Countries"
                      ] }),
                      data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-stat", children: formatInt(data.countryCount, locale) }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-nav-sub", children: de ? "L\xE4nder" : "Countries" })
                      ] })
                    ]
                  }
                )
              ] }),
              data && (cfg.showCountriesList || tab === "countries") && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "section",
                {
                  className: `cs-sidebar-extra${cfg.showCountriesList ? " cs-sidebar-extra-pinned" : ""}`,
                  children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-country-list", children: data.countries.slice(0, 40).map((c) => {
                    const cc = normalizeCountryCode(c.country) || "??";
                    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "cs-country-row", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CountryFlag, { code: cc, size: 18 }),
                        COUNTRY_NAME[cc] || cc
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tabular-nums", children: formatInt(c.count, locale) })
                    ] }, `${cc}-${c.count}`);
                  }) })
                }
              ),
              data?.geoip && !data.geoip.enabled && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-range-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-geoip-hint", children: de ? "GeoIP: GeoLite2-*.mmdb fehlt im CrowdSec-Ordner (L\xE4nder/Flaggen)." : "GeoIP: GeoLite2-*.mmdb missing in CrowdSec data folder (countries/flags)." }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-feed-panel", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "cs-feed-toolbar", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "cs-search-wrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Search, { size: 14, strokeWidth: 2, "aria-hidden": true }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "input",
                    {
                      className: "cs-search",
                      type: "search",
                      value: search,
                      onChange: (e) => setSearch(e.target.value),
                      placeholder: de ? "Filter IP\u2026" : "Filter IP\u2026"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-feed-count", children: filteredFeed.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-feed-list", children: [
                loading && !data && !error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-loading", children: de ? "Lade\u2026" : "Loading\u2026" }),
                !loading && filteredFeed.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "cs-empty", children: de ? "Keine Eintr\xE4ge im Zeitraum." : "No entries in this period." }),
                filteredFeed.map((item) => {
                  const cc = normalizeCountryCode(item.country);
                  const key = `${item.alertId}-${item.ip}`;
                  const selected = selectedKey === key;
                  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                    "article",
                    {
                      className: `cs-card${selected ? " cs-card-selected" : ""}`,
                      onClick: () => setSelectedKey(key),
                      onKeyDown: (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedKey(key);
                        }
                      },
                      role: "button",
                      tabIndex: 0,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CountryFlag, { code: cc || item.country, size: 20, title: COUNTRY_NAME[cc] || cc }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "cs-card-body", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "cs-card-top", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-card-ip", children: item.ip }),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-scenario-tag", title: item.scenario, children: item.scenario }),
                            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "cs-card-time", children: formatRelative(item.time_iso, locale) })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "span",
                            {
                              className: `cs-status ${item.active_ban ? "cs-status-ban" : "cs-status-free"}`,
                              title: item.active_ban ? de ? "Zu diesem Alert existiert ein Ban-Eintrag in der CrowdSec-Datenbank (decisions)." : "This alert has a linked ban record in the CrowdSec database (decisions)." : de ? "Nur Alert \u2014 kein Ban zu diesem Alert (abgelaufen, nie gesperrt, oder anderer Vorfall). Das ist kein manuelles Entsperren in SelfDashboard." : "Alert only \u2014 no ban linked to this alert (expired, never banned, or a separate incident). Not a manual unban in SelfDashboard.",
                              children: item.active_ban ? de ? "Ban aktiv" : "Ban active" : de ? "Nur Alert" : "Alert only"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-card-actions", onClick: (e) => e.stopPropagation(), children: [
                          lookupServices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-icon-btn",
                              title: de ? "IP-Lookup" : "IP lookup",
                              "aria-label": de ? "IP-Lookup" : "IP lookup",
                              onClick: (e) => {
                                setLookupItem(item);
                                setLookupAnchor(e.currentTarget);
                              },
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Search, { size: 15, strokeWidth: 2, "aria-hidden": true })
                            }
                          ),
                          cfg.dockerUnban && item.active_ban && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-unban-btn",
                              disabled: unbanBusy,
                              title: de ? "Entsperren" : "Unban",
                              "aria-label": de ? "Entsperren" : "Unban",
                              onClick: (e) => {
                                e.stopPropagation();
                                setUnbanPending(item);
                              },
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Trash2, { size: 13, strokeWidth: 2, "aria-hidden": true })
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "cs-icon-btn",
                              title: de ? "IP kopieren" : "Copy IP",
                              "aria-label": de ? "IP kopieren" : "Copy IP",
                              onClick: () => void copyIp(item.ip),
                              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Copy, { size: 14, strokeWidth: 2, "aria-hidden": true })
                            }
                          )
                        ] })
                      ]
                    },
                    key
                  );
                })
              ] })
            ] })
          ] }),
          lookupItem && lookupServices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            IpLookupMenu,
            {
              item: lookupItem,
              de,
              anchorEl: lookupAnchor,
              services: lookupServices,
              onClose: () => {
                setLookupItem(null);
                setLookupAnchor(null);
              }
            }
          ),
          unbanPending && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("section", { className: "cs-confirm-overlay", role: "dialog", "aria-modal": "true", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "cs-confirm-box", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: 0 }, children: de ? `Sperre f\xFCr ${unbanPending.ip} per cscli im Container \u201E${cfg.crowdsecContainer}\u201C aufheben?` : `Remove ban for ${unbanPending.ip} via cscli in container \u201C${cfg.crowdsecContainer}\u201D?` }),
            unbanMsg && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { style: { margin: "8px 0 0", color: "#ef4444", fontSize: 10 }, children: unbanMsg }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "cs-confirm-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  className: "cs-btn-ghost",
                  onClick: () => setUnbanPending(null),
                  disabled: unbanBusy,
                  children: de ? "Abbrechen" : "Cancel"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "button",
                {
                  type: "button",
                  className: "cs-btn-danger",
                  disabled: unbanBusy,
                  onClick: () => void doUnban(unbanPending),
                  children: unbanBusy ? "\u2026" : de ? "Entsperren" : "Unban"
                }
              )
            ] })
          ] }) })
        ]
      }
    );
  }

  // ../plugins/crowdsec/index.tsx
  var import_jsx_runtime5 = __toESM(require_jsx_runtime());
  var meta = {
    id: "crowdsec",
    name: "CrowdSec",
    description: "Kompaktes CrowdSec-Dashboard aus crowdsec.db: \xDCbersicht, Banns, L\xE4nder und durchsuchbarer IP-Feed mit Lookup-Links und optionalem Entsperren per Docker/cscli.",
    version: "1.3.8",
    author: "SelfDashboard",
    category: "security",
    icon: "\u{1F6E1}\uFE0F",
    iconUrl: "/plugin-logos/crowdsec.png",
    defaultLayout: { w: 5, h: 6, minW: 4, minH: 4 },
    stackedExtraH: 2
  };
  function CrowdsecSettings({ config, onChange }) {
    const locale = useDashboardStore((s) => s.locale);
    const de = locale !== "en";
    const cfg = parseCrowdsecConfig(config);
    const lookup = cfg.lookupEnabled;
    const setLookup = (id, enabled) => {
      onChange("lookupEnabled", { ...lookup, [id]: enabled });
    };
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "cs-settings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Datenbankpfad" : "Database path" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "text",
            value: cfg.dbPath,
            onChange: (e) => onChange("dbPath", e.target.value),
            placeholder: "/crowdsec-data/crowdsec.db"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Zeitraum (Alerts aus DB)" : "Time range (alerts from DB)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "select",
          {
            value: cfg.daysBack,
            onChange: (e) => onChange("daysBack", Number(e.target.value)),
            children: DAY_RANGE_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: p.days, children: de ? p.de : p.en }, p.days))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Aktualisierung (Sek.)" : "Refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "number",
            min: 5,
            max: 600,
            value: cfg.refreshSeconds,
            onChange: (e) => onChange("refreshSeconds", Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Max. Alerts aus DB" : "Max alerts from DB" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { value: cfg.maxAlerts, onChange: (e) => onChange("maxAlerts", Number(e.target.value)), children: MAX_ALERT_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: p.value, children: de ? p.de : p.en }, p.value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.45 }, children: de ? "\u201EAlle\u201C beim Zeitraum = gesamte Datenbank. \u201EAlle\u201C bei Max. Alerts = kein LIMIT (kann bei sehr gro\xDFen DBs l\xE4nger laden)." : "\u201CAll\u201D time range = entire database. \u201CAll\u201D max alerts = no LIMIT (large DBs may load slower)." }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: cfg.showCountriesList,
            onChange: (e) => onChange("showCountriesList", e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "L\xE4nderliste in der Sidebar dauerhaft anzeigen" : "Always show country list in sidebar" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: cfg.dockerUnban,
            onChange: (e) => onChange("dockerUnban", e.target.checked)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "Entsperren per Docker/cscli" : "Unban via Docker/cscli" })
      ] }),
      cfg.dockerUnban && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "cs-settings-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: de ? "CrowdSec-Container" : "CrowdSec container" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "text",
            value: cfg.crowdsecContainer,
            onChange: (e) => onChange("crowdsecContainer", e.target.value),
            placeholder: "crowdsec"
          }
        )
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: "12px 0 4px", fontSize: 12, color: "var(--text-muted)" }, children: de ? "IP-Lookup-Dienste" : "IP lookup services" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("section", { className: "cs-lookup-grid", children: LOOKUP_SERVICES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: lookup[s.id] ?? DEFAULT_LOOKUP_ENABLED[s.id],
            onChange: (e) => setLookup(s.id, e.target.checked)
          }
        ),
        s.label
      ] }, s.id)) })
    ] });
  }
  function Widget({ config, layoutMode, theme }) {
    const locale = useDashboardStore((s) => s.locale);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CrowdsecWidget, { config, locale, layoutMode, theme });
  }
  var component = {
    Widget,
    Settings: CrowdsecSettings
  };

  // plugin-pack/staging/.entries/crowdsec.tsx
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
lucide-react/dist/esm/icons/copy.js:
lucide-react/dist/esm/icons/gavel.js:
lucide-react/dist/esm/icons/globe.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/shield.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
