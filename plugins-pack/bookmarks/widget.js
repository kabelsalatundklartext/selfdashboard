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

  // ../plugins/bookmarks/index.tsx
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

  // src/lib/pluginLocale.ts
  function usePluginLocale() {
    const locale = useDashboardStore((s) => s.locale);
    return { locale, de: locale !== "en" };
  }

  // ../plugins/bookmarks/index.tsx
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
    const [apps, setApps] = (0, import_react4.useState)(data.apps);
    const [groups, setGroups] = (0, import_react4.useState)(data.groups);
    const [layout, setLayout] = (0, import_react4.useState)(() => parseData(config.data ?? config.apps).layout ?? "grid");
    const [editing, setEditing] = (0, import_react4.useState)(null);
    const [editData, setEditData] = (0, import_react4.useState)({});
    const [dragAppId, setDragAppId] = (0, import_react4.useState)(null);
    const [dragOverId, setDragOverId] = (0, import_react4.useState)(null);
    const [dragOverGroup, setDragOverGroup] = (0, import_react4.useState)(null);
    const fileRef = (0, import_react4.useRef)(null);
    const [tileMin, setTileMin] = (0, import_react4.useState)(() => clampTileMin(data.tileMinPx));
    const [tileMax, setTileMax] = (0, import_react4.useState)(() => clampTileMax(data.tileMaxPx ?? 240, clampTileMin(data.tileMinPx)));
    const [tileFixed, setTileFixed] = (0, import_react4.useState)(() => data.tileFixed === true);
    (0, import_react4.useEffect)(() => {
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
