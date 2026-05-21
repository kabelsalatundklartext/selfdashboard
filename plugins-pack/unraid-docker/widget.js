if(!globalThis.SelfDashboard?.React)throw new Error('SelfDashboard bridge missing — reload page');
"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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

  // plugins/unraid-docker/index.tsx
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

  // node_modules/lucide-react/dist/esm/icons/grip-vertical.js
  var GripVertical = createLucideIcon("GripVertical", [
    ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
    ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
    ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
    ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
    ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
    ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }]
  ]);

  // node_modules/graphql-ws/dist/common-CGW11Fyb.js
  function extendedTypeof(val) {
    if (val === null) {
      return "null";
    }
    if (Array.isArray(val)) {
      return "array";
    }
    return typeof val;
  }
  function isObject(val) {
    return extendedTypeof(val) === "object";
  }
  function areGraphQLFormattedErrors(obj) {
    return Array.isArray(obj) && // must be at least one error
    obj.length > 0 && // error has at least a message
    obj.every((ob) => "message" in ob);
  }
  function limitCloseReason(reason, whenTooLong) {
    return reason.length < 124 ? reason : whenTooLong;
  }
  var GRAPHQL_TRANSPORT_WS_PROTOCOL = "graphql-transport-ws";
  var CloseCode = /* @__PURE__ */ ((CloseCode2) => {
    CloseCode2[CloseCode2["InternalServerError"] = 4500] = "InternalServerError";
    CloseCode2[CloseCode2["InternalClientError"] = 4005] = "InternalClientError";
    CloseCode2[CloseCode2["BadRequest"] = 4400] = "BadRequest";
    CloseCode2[CloseCode2["BadResponse"] = 4004] = "BadResponse";
    CloseCode2[CloseCode2["Unauthorized"] = 4401] = "Unauthorized";
    CloseCode2[CloseCode2["Forbidden"] = 4403] = "Forbidden";
    CloseCode2[CloseCode2["SubprotocolNotAcceptable"] = 4406] = "SubprotocolNotAcceptable";
    CloseCode2[CloseCode2["ConnectionInitialisationTimeout"] = 4408] = "ConnectionInitialisationTimeout";
    CloseCode2[CloseCode2["ConnectionAcknowledgementTimeout"] = 4504] = "ConnectionAcknowledgementTimeout";
    CloseCode2[CloseCode2["SubscriberAlreadyExists"] = 4409] = "SubscriberAlreadyExists";
    CloseCode2[CloseCode2["TooManyInitialisationRequests"] = 4429] = "TooManyInitialisationRequests";
    return CloseCode2;
  })(CloseCode || {});
  var MessageType = /* @__PURE__ */ ((MessageType2) => {
    MessageType2["ConnectionInit"] = "connection_init";
    MessageType2["ConnectionAck"] = "connection_ack";
    MessageType2["Ping"] = "ping";
    MessageType2["Pong"] = "pong";
    MessageType2["Subscribe"] = "subscribe";
    MessageType2["Next"] = "next";
    MessageType2["Error"] = "error";
    MessageType2["Complete"] = "complete";
    return MessageType2;
  })(MessageType || {});
  function validateMessage(val) {
    if (!isObject(val)) {
      throw new Error(
        `Message is expected to be an object, but got ${extendedTypeof(val)}`
      );
    }
    if (!val.type) {
      throw new Error(`Message is missing the 'type' property`);
    }
    if (typeof val.type !== "string") {
      throw new Error(
        `Message is expects the 'type' property to be a string, but got ${extendedTypeof(
          val.type
        )}`
      );
    }
    switch (val.type) {
      case "connection_init":
      case "connection_ack":
      case "ping":
      case "pong": {
        if (val.payload != null && !isObject(val.payload)) {
          throw new Error(
            `"${val.type}" message expects the 'payload' property to be an object or nullish or missing, but got "${val.payload}"`
          );
        }
        break;
      }
      case "subscribe": {
        if (typeof val.id !== "string") {
          throw new Error(
            `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
              val.id
            )}`
          );
        }
        if (!val.id) {
          throw new Error(
            `"${val.type}" message requires a non-empty 'id' property`
          );
        }
        if (!isObject(val.payload)) {
          throw new Error(
            `"${val.type}" message expects the 'payload' property to be an object, but got ${extendedTypeof(
              val.payload
            )}`
          );
        }
        if (typeof val.payload.query !== "string") {
          throw new Error(
            `"${val.type}" message payload expects the 'query' property to be a string, but got ${extendedTypeof(
              val.payload.query
            )}`
          );
        }
        if (val.payload.variables != null && !isObject(val.payload.variables)) {
          throw new Error(
            `"${val.type}" message payload expects the 'variables' property to be a an object or nullish or missing, but got ${extendedTypeof(
              val.payload.variables
            )}`
          );
        }
        if (val.payload.operationName != null && extendedTypeof(val.payload.operationName) !== "string") {
          throw new Error(
            `"${val.type}" message payload expects the 'operationName' property to be a string or nullish or missing, but got ${extendedTypeof(
              val.payload.operationName
            )}`
          );
        }
        if (val.payload.extensions != null && !isObject(val.payload.extensions)) {
          throw new Error(
            `"${val.type}" message payload expects the 'extensions' property to be a an object or nullish or missing, but got ${extendedTypeof(
              val.payload.extensions
            )}`
          );
        }
        break;
      }
      case "next": {
        if (typeof val.id !== "string") {
          throw new Error(
            `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
              val.id
            )}`
          );
        }
        if (!val.id) {
          throw new Error(
            `"${val.type}" message requires a non-empty 'id' property`
          );
        }
        if (!isObject(val.payload)) {
          throw new Error(
            `"${val.type}" message expects the 'payload' property to be an object, but got ${extendedTypeof(
              val.payload
            )}`
          );
        }
        break;
      }
      case "error": {
        if (typeof val.id !== "string") {
          throw new Error(
            `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
              val.id
            )}`
          );
        }
        if (!val.id) {
          throw new Error(
            `"${val.type}" message requires a non-empty 'id' property`
          );
        }
        if (!areGraphQLFormattedErrors(val.payload)) {
          throw new Error(
            `"${val.type}" message expects the 'payload' property to be an array of GraphQL errors, but got ${JSON.stringify(
              val.payload
            )}`
          );
        }
        break;
      }
      case "complete": {
        if (typeof val.id !== "string") {
          throw new Error(
            `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
              val.id
            )}`
          );
        }
        if (!val.id) {
          throw new Error(
            `"${val.type}" message requires a non-empty 'id' property`
          );
        }
        break;
      }
      default:
        throw new Error(`Invalid message 'type' property "${val.type}"`);
    }
    return val;
  }
  function parseMessage(data, reviver) {
    return validateMessage(
      typeof data === "string" ? JSON.parse(data, reviver) : data
    );
  }
  function stringifyMessage(msg, replacer) {
    validateMessage(msg);
    return JSON.stringify(msg, replacer);
  }

  // node_modules/graphql-ws/dist/client.js
  function createClient(options) {
    const {
      url,
      connectionParams,
      lazy = true,
      onNonLazyError = console.error,
      lazyCloseTimeout: lazyCloseTimeoutMs = 0,
      keepAlive = 0,
      disablePong,
      connectionAckWaitTimeout = 0,
      retryAttempts = 5,
      retryWait = async function randomisedExponentialBackoff(retries2) {
        const retryDelaySeconds = Math.pow(2, retries2);
        await new Promise(
          (resolve) => setTimeout(
            resolve,
            retryDelaySeconds * 1e3 + // add random timeout from 300ms to 3s
            Math.floor(Math.random() * (3e3 - 300) + 300)
          )
        );
      },
      shouldRetry = isLikeCloseEvent,
      on,
      webSocketImpl,
      /**
       * Generates a v4 UUID to be used as the ID using `Math`
       * as the random number generator. Supply your own generator
       * in case you need more uniqueness.
       *
       * Reference: https://gist.github.com/jed/982883
       */
      generateID = function generateUUID() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
          return v.toString(16);
        });
      },
      jsonMessageReplacer: replacer,
      jsonMessageReviver: reviver
    } = options;
    let ws;
    if (webSocketImpl) {
      if (!isWebSocket(webSocketImpl)) {
        throw new Error("Invalid WebSocket implementation provided");
      }
      ws = webSocketImpl;
    } else if (typeof WebSocket !== "undefined") {
      ws = WebSocket;
    } else if (typeof global !== "undefined") {
      ws = global.WebSocket || // @ts-expect-error: Support more browsers
      global.MozWebSocket;
    } else if (typeof window !== "undefined") {
      ws = window.WebSocket || // @ts-expect-error: Support more browsers
      window.MozWebSocket;
    }
    if (!ws)
      throw new Error(
        "WebSocket implementation missing; on Node you can `import WebSocket from 'ws';` and pass `webSocketImpl: WebSocket` to `createClient`"
      );
    const WebSocketImpl = ws;
    const emitter = (() => {
      const message = /* @__PURE__ */ (() => {
        const listeners2 = {};
        return {
          on(id, listener) {
            listeners2[id] = listener;
            return () => {
              delete listeners2[id];
            };
          },
          emit(message2) {
            if ("id" in message2) listeners2[message2.id]?.(message2);
          }
        };
      })();
      const listeners = {
        connecting: on?.connecting ? [on.connecting] : [],
        opened: on?.opened ? [on.opened] : [],
        connected: on?.connected ? [on.connected] : [],
        ping: on?.ping ? [on.ping] : [],
        pong: on?.pong ? [on.pong] : [],
        message: on?.message ? [message.emit, on.message] : [message.emit],
        closed: on?.closed ? [on.closed] : [],
        error: on?.error ? [on.error] : []
      };
      return {
        onMessage: message.on,
        on(event, listener) {
          const l = listeners[event];
          l.push(listener);
          return () => {
            l.splice(l.indexOf(listener), 1);
          };
        },
        emit(event, ...args) {
          for (const listener of [...listeners[event]]) {
            listener(...args);
          }
        }
      };
    })();
    function errorOrClosed(cb) {
      const listening = [
        // errors are fatal and more critical than close events, throw them first
        emitter.on("error", (err) => {
          listening.forEach((unlisten) => unlisten());
          cb(err);
        }),
        // closes can be graceful and not fatal, throw them second (if error didnt throw)
        emitter.on("closed", (event) => {
          listening.forEach((unlisten) => unlisten());
          cb(event);
        })
      ];
    }
    let connecting, locks = 0, lazyCloseTimeout, retrying = false, retries = 0, disposed = false;
    async function connect() {
      clearTimeout(lazyCloseTimeout);
      const [socket, throwOnClose] = await (connecting ?? (connecting = new Promise(
        (connected, denied) => (async () => {
          if (retrying) {
            await retryWait(retries);
            if (!locks) {
              connecting = void 0;
              return denied({ code: 1e3, reason: "All Subscriptions Gone" });
            }
            retries++;
          }
          emitter.emit("connecting", retrying);
          const socket2 = new WebSocketImpl(
            typeof url === "function" ? await url() : url,
            GRAPHQL_TRANSPORT_WS_PROTOCOL
          );
          let connectionAckTimeout, queuedPing;
          function enqueuePing() {
            if (isFinite(keepAlive) && keepAlive > 0) {
              clearTimeout(queuedPing);
              queuedPing = setTimeout(() => {
                if (socket2.readyState === WebSocketImpl.OPEN) {
                  socket2.send(stringifyMessage({ type: MessageType.Ping }));
                  emitter.emit("ping", false, void 0);
                }
              }, keepAlive);
            }
          }
          errorOrClosed((errOrEvent) => {
            connecting = void 0;
            clearTimeout(connectionAckTimeout);
            clearTimeout(queuedPing);
            denied(errOrEvent);
            if (errOrEvent instanceof TerminatedCloseEvent) {
              socket2.close(4499, "Terminated");
              socket2.onerror = null;
              socket2.onclose = null;
            }
          });
          socket2.onerror = (err) => emitter.emit("error", err);
          socket2.onclose = (event) => emitter.emit("closed", event);
          socket2.onopen = async () => {
            try {
              emitter.emit("opened", socket2);
              const payload = typeof connectionParams === "function" ? await connectionParams() : connectionParams;
              if (socket2.readyState !== WebSocketImpl.OPEN) return;
              socket2.send(
                stringifyMessage(
                  payload ? {
                    type: MessageType.ConnectionInit,
                    payload
                  } : {
                    type: MessageType.ConnectionInit
                    // payload is completely absent if not provided
                  },
                  replacer
                )
              );
              if (isFinite(connectionAckWaitTimeout) && connectionAckWaitTimeout > 0) {
                connectionAckTimeout = setTimeout(() => {
                  socket2.close(
                    CloseCode.ConnectionAcknowledgementTimeout,
                    "Connection acknowledgement timeout"
                  );
                }, connectionAckWaitTimeout);
              }
              enqueuePing();
            } catch (err) {
              emitter.emit("error", err);
              socket2.close(
                CloseCode.InternalClientError,
                limitCloseReason(
                  err instanceof Error ? err.message : String(err),
                  "Internal client error"
                )
              );
            }
          };
          let acknowledged = false;
          socket2.onmessage = ({ data }) => {
            try {
              const message = parseMessage(data, reviver);
              emitter.emit("message", message);
              if (message.type === "ping" || message.type === "pong") {
                emitter.emit(message.type, true, message.payload);
                if (message.type === "pong") {
                  enqueuePing();
                } else if (!disablePong) {
                  socket2.send(
                    stringifyMessage(
                      message.payload ? {
                        type: MessageType.Pong,
                        payload: message.payload
                      } : {
                        type: MessageType.Pong
                        // payload is completely absent if not provided
                      }
                    )
                  );
                  emitter.emit("pong", false, message.payload);
                }
                return;
              }
              if (acknowledged) return;
              if (message.type !== MessageType.ConnectionAck)
                throw new Error(
                  `First message cannot be of type ${message.type}`
                );
              clearTimeout(connectionAckTimeout);
              acknowledged = true;
              emitter.emit("connected", socket2, message.payload, retrying);
              retrying = false;
              retries = 0;
              connected([
                socket2,
                new Promise((_, reject) => errorOrClosed(reject))
              ]);
            } catch (err) {
              socket2.onmessage = null;
              emitter.emit("error", err);
              socket2.close(
                CloseCode.BadResponse,
                limitCloseReason(
                  err instanceof Error ? err.message : String(err),
                  "Bad response"
                )
              );
            }
          };
        })()
      )));
      if (socket.readyState === WebSocketImpl.CLOSING) await throwOnClose;
      let release = () => {
      };
      const released = new Promise((resolve) => release = resolve);
      return [
        socket,
        release,
        Promise.race([
          // wait for
          released.then(() => {
            if (!locks) {
              const complete = () => socket.close(1e3, "Normal Closure");
              if (isFinite(lazyCloseTimeoutMs) && lazyCloseTimeoutMs > 0) {
                lazyCloseTimeout = setTimeout(() => {
                  if (socket.readyState === WebSocketImpl.OPEN) complete();
                }, lazyCloseTimeoutMs);
              } else {
                complete();
              }
            }
          }),
          // or
          throwOnClose
        ])
      ];
    }
    function shouldRetryConnectOrThrow(errOrCloseEvent) {
      if (isLikeCloseEvent(errOrCloseEvent) && (isFatalInternalCloseCode(errOrCloseEvent.code) || [
        CloseCode.InternalServerError,
        CloseCode.InternalClientError,
        CloseCode.BadRequest,
        CloseCode.BadResponse,
        CloseCode.Unauthorized,
        // CloseCode.Forbidden, might grant access out after retry
        CloseCode.SubprotocolNotAcceptable,
        // CloseCode.ConnectionInitialisationTimeout, might not time out after retry
        // CloseCode.ConnectionAcknowledgementTimeout, might not time out after retry
        CloseCode.SubscriberAlreadyExists,
        CloseCode.TooManyInitialisationRequests
        // 4499, // Terminated, probably because the socket froze, we want to retry
      ].includes(errOrCloseEvent.code)))
        throw errOrCloseEvent;
      if (disposed) return false;
      if (isLikeCloseEvent(errOrCloseEvent) && errOrCloseEvent.code === 1e3)
        return locks > 0;
      if (!retryAttempts || retries >= retryAttempts) throw errOrCloseEvent;
      if (!shouldRetry(errOrCloseEvent)) throw errOrCloseEvent;
      return retrying = true;
    }
    if (!lazy) {
      (async () => {
        locks++;
        for (; ; ) {
          try {
            const [, , throwOnClose] = await connect();
            await throwOnClose;
          } catch (errOrCloseEvent) {
            try {
              if (!shouldRetryConnectOrThrow(errOrCloseEvent)) return;
            } catch (errOrCloseEvent2) {
              return onNonLazyError?.(errOrCloseEvent2);
            }
          }
        }
      })();
    }
    function subscribe(payload, sink) {
      const id = generateID(payload);
      let done = false, errored = false, releaser = () => {
        locks--;
        done = true;
      };
      (async () => {
        locks++;
        for (; ; ) {
          try {
            const [socket, release, waitForReleaseOrThrowOnClose] = await connect();
            if (done) return release();
            const unlisten = emitter.onMessage(id, (message) => {
              switch (message.type) {
                case MessageType.Next: {
                  sink.next(message.payload);
                  return;
                }
                case MessageType.Error: {
                  errored = true, done = true;
                  sink.error(message.payload);
                  releaser();
                  return;
                }
                case MessageType.Complete: {
                  done = true;
                  releaser();
                  return;
                }
              }
            });
            socket.send(
              stringifyMessage(
                {
                  id,
                  type: MessageType.Subscribe,
                  payload
                },
                replacer
              )
            );
            releaser = () => {
              if (!done && socket.readyState === WebSocketImpl.OPEN)
                socket.send(
                  stringifyMessage(
                    {
                      id,
                      type: MessageType.Complete
                    },
                    replacer
                  )
                );
              locks--;
              done = true;
              release();
            };
            await waitForReleaseOrThrowOnClose.finally(unlisten);
            return;
          } catch (errOrCloseEvent) {
            if (!shouldRetryConnectOrThrow(errOrCloseEvent)) return;
          }
        }
      })().then(() => {
        if (!errored) sink.complete();
      }).catch((err) => {
        sink.error(err);
      });
      return () => {
        if (!done) releaser();
      };
    }
    return {
      on: emitter.on,
      subscribe,
      iterate(request) {
        const pending = [];
        const deferred = {
          done: false,
          error: null,
          resolve: () => {
          }
        };
        const dispose = subscribe(request, {
          next(val) {
            pending.push(val);
            deferred.resolve();
          },
          error(err) {
            deferred.done = true;
            deferred.error = err;
            deferred.resolve();
          },
          complete() {
            deferred.done = true;
            deferred.resolve();
          }
        });
        const iterator = (async function* iterator2() {
          for (; ; ) {
            if (!pending.length) {
              await new Promise((resolve) => deferred.resolve = resolve);
            }
            while (pending.length) {
              yield pending.shift();
            }
            if (deferred.error) {
              throw deferred.error;
            }
            if (deferred.done) {
              return;
            }
          }
        })();
        iterator.throw = async (err) => {
          if (!deferred.done) {
            deferred.done = true;
            deferred.error = err;
            deferred.resolve();
          }
          return { done: true, value: void 0 };
        };
        iterator.return = async () => {
          dispose();
          return { done: true, value: void 0 };
        };
        return iterator;
      },
      async dispose() {
        disposed = true;
        if (connecting) {
          const [socket] = await connecting;
          socket.close(1e3, "Normal Closure");
        }
      },
      terminate() {
        if (connecting) {
          emitter.emit("closed", new TerminatedCloseEvent());
        }
      }
    };
  }
  var TerminatedCloseEvent = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "TerminatedCloseEvent");
      __publicField(this, "message", "4499: Terminated");
      __publicField(this, "code", 4499);
      __publicField(this, "reason", "Terminated");
      __publicField(this, "wasClean", false);
    }
  };
  function isLikeCloseEvent(val) {
    return isObject(val) && "code" in val && "reason" in val;
  }
  function isFatalInternalCloseCode(code) {
    if ([
      1e3,
      // Normal Closure is not an erroneous close code
      1001,
      // Going Away
      1006,
      // Abnormal Closure
      1005,
      // No Status Received
      1012,
      // Service Restart
      1013,
      // Try Again Later
      1014
      // Bad Gateway
    ].includes(code))
      return false;
    return code >= 1e3 && code <= 1999;
  }
  function isWebSocket(val) {
    return typeof val === "function" && "constructor" in val && "CLOSED" in val && "CLOSING" in val && "CONNECTING" in val && "OPEN" in val;
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

  // plugins/unraid-docker/index.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var meta = {
    id: "unraid-docker",
    name: "Unraid Docker",
    description: "Docker-Container \xFCber die Unraid GraphQL API (7.2+): kompakte Tabellenansicht oder klassische Zeile wie beim Docker-Plugin, zweistufige Aktions-Best\xE4tigung, CDN-Icons, granulare CPU/RAM- und Button-Optionen, Live-Stats per WebSocket (optional).",
    version: "0.4.15",
    author: "SelfDashboard",
    category: "system",
    icon: "\u{1F9F1}",
    iconUrl: "/plugin-logos/unraid-docker.png",
    /** Halbe Rasterbreite (6/12) wie typisches Docker-Widget; minW verhindert zu schmale Spalte. */
    defaultLayout: { w: 6, h: 5, minW: 4 },
    stackedExtraH: 2
  };
  var COMPACT_TABLE_NARROW_PX = 440;
  var COMPACT_TABLE_AUTO_NAMES_MIN_PX = 520;
  var LIST_QUERY = `query SelfDashboardUnraidDocker($skipCache: Boolean!) {
  docker {
    id
    containers(skipCache: $skipCache) {
      id
      names
      state
      status
      image
      iconUrl
    }
  }
}`;
  var STATS_SUB = `subscription SelfDashboardDockerContainerStats {
  dockerContainerStats {
    id
    cpuPercent
    memUsage
    memPercent
    netIO
    blockIO
  }
}`;
  var M_START = `mutation SelfDashboardDockerStart($id: PrefixedID!) {
  docker { start(id: $id) { id names state } }
}`;
  var M_STOP = `mutation SelfDashboardDockerStop($id: PrefixedID!) {
  docker { stop(id: $id) { id names state } }
}`;
  var M_UNPAUSE = `mutation SelfDashboardDockerUnpause($id: PrefixedID!) {
  docker { unpause(id: $id) { id names state } }
}`;
  var HEAT_GREEN = "#22c55e";
  var HEAT_AMBER = "#f59e0b";
  var HEAT_RED = "#ef4444";
  function heatColorForPct(p) {
    if (p == null || !Number.isFinite(p)) return "var(--text-muted)";
    if (p < 12) return HEAT_GREEN;
    if (p < 50) return HEAT_AMBER;
    return HEAT_RED;
  }
  function graphqlWsUrl(base) {
    const trimmed = base.replace(/\/$/, "");
    const root = trimmed.replace(/\/graphql\/?$/i, "");
    if (root.startsWith("https://")) return `wss://${root.slice(8)}/graphql`;
    if (root.startsWith("http://")) return `ws://${root.slice(7)}/graphql`;
    return `${root}/graphql`;
  }
  function containerName(c) {
    const n = c.names?.[0] ?? "";
    const id = (c.id ?? "").trim();
    return n.replace(/^\//, "") || (id ? id.slice(0, 12) : "\u2014");
  }
  function graphqlStateLower(state) {
    const s = (state ?? "").toString().trim().toLowerCase();
    if (s === "running") return "running";
    if (s === "exited") return "exited";
    if (s === "paused") return "paused";
    return s || "unknown";
  }
  function isRunningState(state) {
    return String(state ?? "").toUpperCase() === "RUNNING";
  }
  function isPausedState(state) {
    return String(state ?? "").toUpperCase() === "PAUSED";
  }
  function sortContainers(a, b) {
    const ar = isRunningState(a.state) ? 0 : isPausedState(a.state) ? 1 : 2;
    const br = isRunningState(b.state) ? 0 : isPausedState(b.state) ? 1 : 2;
    if (ar !== br) return ar - br;
    return containerName(a).localeCompare(containerName(b), void 0, { sensitivity: "base" });
  }
  function parseListSort(v) {
    if (v === "name" || v === "cpu_desc" || v === "cpu_asc" || v === "mem_desc" || v === "mem_asc" || v === "custom") return v;
    return "default";
  }
  function cfgBool(v, ifMissing) {
    if (v === void 0 || v === null || v === "") return ifMissing;
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return ifMissing;
  }
  function normalizeIdOrder(v) {
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === "string" && x.trim() !== "").map((x) => x.trim());
  }
  function applyCustomContainerOrder(items, customOrder, getId, sortFallback) {
    const map = /* @__PURE__ */ new Map();
    for (const t of items) {
      const id = getId(t);
      if (id) map.set(id, t);
    }
    const used = /* @__PURE__ */ new Set();
    const out = [];
    for (const oid of customOrder) {
      let hit = map.get(oid);
      if (!hit) {
        for (const [kid, t] of map) {
          if (used.has(kid)) continue;
          if (kid === oid || kid.startsWith(oid) || oid.startsWith(kid.slice(0, 12))) {
            hit = t;
            break;
          }
        }
      }
      if (hit) {
        const id = getId(hit);
        if (id && !used.has(id)) {
          out.push(hit);
          used.add(id);
        }
      }
    }
    const rest = items.filter((t) => {
      const id = getId(t);
      return id ? !used.has(id) : true;
    });
    rest.sort(sortFallback);
    return [...out, ...rest];
  }
  function unraidCpuFromStats(c, stats) {
    const s = stats[c.id];
    const p = s?.cpuPercent;
    return typeof p === "number" && Number.isFinite(p) ? p : null;
  }
  function unraidMemFromStats(c, stats) {
    const s = stats[c.id];
    const p = s?.memPercent;
    return typeof p === "number" && Number.isFinite(p) ? p : null;
  }
  function applyUnraidSort(arr, mode, stats) {
    const copy = arr.slice();
    if (mode === "custom") {
      copy.sort(sortContainers);
      return copy;
    }
    if (mode === "default") {
      copy.sort(sortContainers);
      return copy;
    }
    if (mode === "name") {
      copy.sort((a, b) => containerName(a).localeCompare(containerName(b), void 0, { sensitivity: "base" }));
      return copy;
    }
    const desc = mode === "cpu_desc" || mode === "mem_desc";
    const useMem = mode === "mem_desc" || mode === "mem_asc";
    copy.sort((a, b) => {
      const va = useMem ? unraidMemFromStats(a, stats) : unraidCpuFromStats(a, stats);
      const vb = useMem ? unraidMemFromStats(b, stats) : unraidCpuFromStats(b, stats);
      if (va != null && vb != null && va !== vb) return desc ? vb - va : va - vb;
      if (va != null && vb == null) return -1;
      if (va == null && vb != null) return 1;
      return sortContainers(a, b);
    });
    return copy;
  }
  function buildOrderedUnraidList(items, listSort, customOrder, stats) {
    if (listSort === "custom" && customOrder.length > 0) {
      return applyCustomContainerOrder(items, customOrder, (c) => c.id.trim(), sortContainers);
    }
    if (listSort === "custom") {
      return applyUnraidSort(items, "default", stats);
    }
    return applyUnraidSort(items, listSort, stats);
  }
  function fmtCpuCompact(p, running) {
    if (!running) return "\u2014";
    if (p == null || !Number.isFinite(p)) return "\u2014";
    if (p < 10) return `${p.toFixed(2)}%`;
    if (p < 100) return `${p.toFixed(1)}%`;
    return `${Math.round(p)}%`;
  }
  function fmtMemUsageCompact(raw) {
    if (!raw?.trim()) return "";
    const t = raw.trim();
    const idx = t.indexOf(" / ");
    if (idx === -1) return t;
    return t.slice(0, idx).trim();
  }
  function stateBadgeLabel(state, locale) {
    const s = (state ?? "").toLowerCase();
    const de = locale !== "en";
    if (s === "running") return de ? "Aktiv" : "Active";
    if (s === "exited" || s === "dead") return de ? "Aus" : "Off";
    if (s === "paused") return de ? "Pause" : "Paused";
    if (s === "restarting") return de ? "Warte" : "Wait";
    const raw = (state ?? "").trim();
    if (!raw) return de ? "?" : "?";
    return raw.length <= 7 ? raw : `${raw.slice(0, 6)}\u2026`;
  }
  function stateBadgeStyle(state, compact, micro, textOnly) {
    const base = {
      display: "inline-block",
      fontWeight: 600,
      fontSize: micro ? "6px" : compact ? "7px" : textOnly ? "9px" : "8px",
      letterSpacing: micro || compact || textOnly ? 0 : "0.02em",
      padding: textOnly ? 0 : micro ? "0 2px" : compact ? "1px 4px" : "2px 6px",
      borderRadius: textOnly ? 0 : micro ? "3px" : "4px",
      whiteSpace: "nowrap",
      lineHeight: micro ? 1.05 : 1.2,
      textTransform: "none",
      maxWidth: micro ? "100%" : void 0,
      boxSizing: "border-box",
      background: textOnly ? "transparent" : void 0
    };
    const s = (state ?? "").toLowerCase();
    if (s === "running") {
      return { ...base, background: textOnly ? "transparent" : "#15803d", color: textOnly ? "#4ade80" : "#fff" };
    }
    if (s === "exited" || s === "dead") {
      return { ...base, background: textOnly ? "transparent" : "#7f1d1d", color: textOnly ? "#f87171" : "#fecaca" };
    }
    if (s === "paused") {
      return { ...base, background: textOnly ? "transparent" : "#854d0e", color: textOnly ? "#fbbf24" : "#fef08a" };
    }
    return { ...base, background: textOnly ? "transparent" : "var(--border)", color: "var(--text-muted)" };
  }
  var ACTION_ICON = "#b91c1c";
  function IconStop({ disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, style: { opacity: disabled ? 0.35 : 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2", fill: ACTION_ICON }) });
  }
  function IconPlay({ disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": true, style: { opacity: disabled ? 0.35 : 1 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 5v14l11-7z", fill: ACTION_ICON }) });
  }
  function IconRestart({ disabled: _disabled }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        "aria-hidden": true,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          color: ACTION_ICON,
          fontSize: "15px",
          fontWeight: 800,
          lineHeight: 1,
          opacity: _disabled ? 0.35 : 1,
          transform: "scaleX(-1)"
        },
        children: "\u21BB"
      }
    );
  }
  function actionVerb(a) {
    switch (a) {
      case "start":
        return "starten";
      case "stop":
        return "stoppen";
      case "restart":
        return "neu starten";
      case "unpause":
        return "fortsetzen";
      default:
        return a;
    }
  }
  function actionVerbEn(a) {
    switch (a) {
      case "start":
        return "start";
      case "stop":
        return "stop";
      case "restart":
        return "restart";
      case "unpause":
        return "resume";
      default:
        return a;
    }
  }
  function actionNoun(a) {
    switch (a) {
      case "start":
        return "Start";
      case "stop":
        return "Stopp";
      case "restart":
        return "Neustart";
      case "unpause":
        return "Fortsetzen";
      default:
        return a;
    }
  }
  function actionNounEn(a) {
    switch (a) {
      case "start":
        return "Start";
      case "stop":
        return "Stop";
      case "restart":
        return "Restart";
      case "unpause":
        return "Resume";
      default:
        return a;
    }
  }
  function barFillPct(value) {
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }
  function statsLineUnraid(running, st, showCpu, showRam, memCompact) {
    if (!running || !showCpu && !showRam) return null;
    const parts = [];
    if (showCpu) {
      parts.push(`CPU ${fmtCpuCompact(st?.cpuPercent ?? null, true)}`);
    }
    if (showRam && st?.memUsage) {
      const raw = st.memUsage;
      const ram = memCompact && raw.includes(" / ") ? fmtMemUsageCompact(raw) : raw;
      parts.push(`RAM ${ram}`);
    }
    return parts.join(" \xB7 ");
  }
  function MiniBar({
    label,
    fillPct,
    tooltip,
    barColor
  }) {
    const track = {
      width: 38,
      height: 5,
      background: "var(--border)",
      borderRadius: 3,
      overflow: "hidden",
      flexShrink: 0
    };
    const fill = {
      display: "block",
      height: "100%",
      width: `${fillPct}%`,
      background: barColor,
      borderRadius: 3,
      transition: "width 0.35s ease-out"
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { title: tooltip, style: { display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "7px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.02em", width: "1em", textAlign: "right" }, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: track, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: fill }) })
    ] });
  }
  function SettingsSectionTitle({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 6px" }, children });
  }
  function Heading({ text }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "p",
      {
        style: {
          fontSize: "clamp(9px, 2.4cqmin, 10px)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          margin: "0 0 8px"
        },
        children: text
      }
    );
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
  var IMAGE_EMOJI = [
    ["pihole", "\u{1F573}\uFE0F"],
    ["pi-hole", "\u{1F573}\uFE0F"],
    ["cloudflared", "\u2601\uFE0F"],
    ["uptime-kuma", "\u{1F4C8}"],
    ["uptime_kuma", "\u{1F4C8}"],
    ["sonarr", "\u{1F4FA}"],
    ["radarr", "\u{1F3AC}"],
    ["lidarr", "\u{1F3B5}"],
    ["prowlarr", "\u{1F441}\uFE0F"],
    ["bazarr", "\u{1F4AC}"],
    ["ombi", "\u{1F37F}"],
    ["plex", "\u25B6\uFE0F"],
    ["jellyfin", "\u{1F39E}\uFE0F"],
    ["emby", "\u{1F39E}\uFE0F"],
    ["immich", "\u{1F5BC}\uFE0F"],
    ["nextcloud", "\u2601\uFE0F"],
    ["mariadb", "\u{1F5C4}\uFE0F"],
    ["postgres", "\u{1F418}"],
    ["mongo", "\u{1F343}"],
    ["redis", "\u2B55"],
    ["nginx", "\u{1F30A}"],
    ["caddy", "\u{1F512}"],
    ["traefik", "\u{1F500}"],
    ["portainer", "\u{1F9F0}"],
    ["homepage", "\u{1F3E0}"],
    ["homarr", "\u{1F4CA}"],
    ["grafana", "\u{1F4C8}"],
    ["prometheus", "\u{1F525}"],
    ["nzbget", "\u{1F4E5}"],
    ["sabnzbd", "\u{1F4E5}"],
    ["ollama", "\u{1F999}"],
    ["qbittorrent", "\u{1F9F2}"],
    ["transmission", "\u{1F4E1}"],
    ["deluge", "\u{1F30A}"]
  ];
  function serviceMark(image, displayName) {
    const base = (image.split(":")[0]?.split("@")[0] ?? "").toLowerCase();
    const slug = base.split("/").pop() ?? base;
    for (const [k, emoji] of IMAGE_EMOJI) {
      if (slug.includes(k)) return { kind: "emoji", v: emoji };
    }
    const raw = displayName.replace(/^\/+/, "").trim();
    const ch = (raw[0] || slug[0] || "?").toUpperCase();
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i) * (i + 1)) % 360;
    const bg = `linear-gradient(135deg, hsl(${h} 52% 40%), hsl(${(h + 48) % 360} 48% 26%))`;
    return { kind: "letter", letter: ch, bg };
  }
  var DASHBOARD_ICONS_PNG_BASE = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png";
  var ICON_SLUG_ALIASES = {
    adguardhome: "adguard-home",
    immichserver: "immich",
    "immich-server": "immich",
    jdownloader2: "jdownloader",
    "jdownloader-2": "jdownloader",
    postgres: "postgresql"
  };
  function buildLabelIconUrl(labels) {
    if (!labels) return null;
    const keys = [
      "org.opencontainers.image.icon",
      "net.unraid.docker.icon",
      "traefik.icon",
      "org.label-schema.icon",
      "ICON",
      "com.docker.desktop.extension.api.icon"
    ];
    for (const k of keys) {
      const raw = labels[k];
      if (typeof raw !== "string") continue;
      const v = raw.trim();
      if (!v) continue;
      if (/^https?:\/\//i.test(v)) return v;
      if (/^data:image\//i.test(v)) return v;
    }
    return null;
  }
  function slugCandidatesFromImage(image) {
    const raw = (image.split(":")[0]?.split("@")[0] ?? "").toLowerCase();
    const last = raw.split("/").pop()?.replace(/[^a-z0-9._-]/g, "") ?? "docker";
    const dashed = last.replace(/_/g, "-");
    const set = /* @__PURE__ */ new Set();
    const add = (s) => {
      const t = s.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (t.length >= 2) set.add(t);
    };
    add(dashed);
    add(dashed.replace(/-server$/i, ""));
    add(dashed.replace(/^linuxserver-/, ""));
    const alias = ICON_SLUG_ALIASES[dashed.replace(/-/g, "")] ?? ICON_SLUG_ALIASES[dashed];
    if (alias) add(alias);
    if (set.size === 0) set.add("docker");
    return Array.from(set).slice(0, 8);
  }
  function dashboardIconPngUrls(image) {
    return slugCandidatesFromImage(image).map((slug) => `${DASHBOARD_ICONS_PNG_BASE}/${encodeURIComponent(slug)}.png`);
  }
  function letterHue(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 3)) % 360;
    return h;
  }
  function ContainerAvatar({
    image,
    name,
    labels,
    useDashboardIcons
  }) {
    const labelUrl = (0, import_react4.useMemo)(() => buildLabelIconUrl(labels), [labels]);
    const cdnUrls = (0, import_react4.useMemo)(() => dashboardIconPngUrls(image), [image]);
    const mark = (0, import_react4.useMemo)(() => serviceMark(image, name), [image, name]);
    const [labelFailed, setLabelFailed] = (0, import_react4.useState)(false);
    const [cdnIdx, setCdnIdx] = (0, import_react4.useState)(0);
    (0, import_react4.useEffect)(() => {
      setLabelFailed(false);
      setCdnIdx(0);
    }, [labelUrl, image, name, useDashboardIcons]);
    const tryLabel = Boolean(labelUrl) && !labelFailed;
    const tryCdn = useDashboardIcons && (!labelUrl || labelFailed) && cdnIdx < cdnUrls.length;
    const remoteSrc = tryLabel ? labelUrl : tryCdn ? cdnUrls[cdnIdx] : null;
    const onRemoteError = (0, import_react4.useCallback)(() => {
      if (tryLabel) {
        setLabelFailed(true);
        return;
      }
      setCdnIdx((i) => i + 1);
    }, [tryLabel]);
    const box = (inner) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        "aria-hidden": true,
        style: {
          width: 24,
          height: 24,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          boxSizing: "border-box"
        },
        children: inner
      }
    );
    if (remoteSrc) {
      return box(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "img",
          {
            src: remoteSrc,
            alt: "",
            width: 24,
            height: 24,
            loading: "lazy",
            referrerPolicy: "no-referrer",
            onError: onRemoteError,
            style: {
              width: 24,
              height: 24,
              objectFit: "contain",
              display: "block",
              background: "color-mix(in srgb, var(--surface) 88%, var(--background))"
            }
          },
          remoteSrc
        )
      );
    }
    if (mark.kind === "emoji") {
      return box(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 14, lineHeight: 1, background: "var(--surface)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }, children: mark.v })
      );
    }
    const hue = letterHue(`${name}:${image}`);
    return box(
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "span",
        {
          style: {
            width: "100%",
            height: "100%",
            fontSize: 12,
            fontWeight: 800,
            color: "#fff",
            background: `hsl(${hue} 52% 44%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "-0.02em"
          },
          children: mark.letter
        }
      )
    );
  }
  function fmtUpdatedAgo(ts, locale) {
    if (ts == null) return "";
    const de = locale !== "en";
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1e3));
    if (sec < 8) return de ? "Gerade aktualisiert" : "Updated just now";
    if (sec < 60) return de ? `Vor ${sec}s aktualisiert` : `Updated ${sec}s ago`;
    const m = Math.floor(sec / 60);
    if (m < 60) return de ? `Vor ${m} Min. aktualisiert` : `Updated ${m} min ago`;
    const h = Math.floor(m / 60);
    return de ? `Vor ${h} Std. aktualisiert` : `Updated ${h}h ago`;
  }
  async function graphql(baseUrl, apiKey, query, variables) {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(variables != null ? { query, variables } : { query }),
      cache: "no-store"
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
    if (!json.data) throw new Error("Leere GraphQL-Antwort");
    return json.data;
  }
  function Widget({ config, instanceId }) {
    const { locale, de } = usePluginLocale();
    const url = String(config.url ?? "").trim().replace(/\/$/, "");
    const apiKey = String(config.apiKey ?? "").trim();
    const r = config;
    const showStopped = cfgBool(r.showStopped, false);
    const skipCache = cfgBool(r.skipCache, false);
    const compactTableView = cfgBool(r.homarrTable, true);
    const useDashboardIcons = cfgBool(r.useDashboardIcons, true);
    const showContainerNames = cfgBool(r.showContainerNames, false);
    const memoryShowLimit = cfgBool(r.memoryShowLimit, false);
    const actionsOn = cfgBool(r.allowActions, true);
    const liveStats = cfgBool(r.liveStats, true);
    const statsOn = cfgBool(r.showStats, true);
    const showBtnStart = actionsOn && cfgBool(r.showBtnStart, true);
    const showBtnStop = actionsOn && cfgBool(r.showBtnStop, true);
    const showBtnRestart = actionsOn && cfgBool(r.showBtnRestart, true);
    const showStatCpu = statsOn && cfgBool(r.showStatCpu, true);
    const showStatRam = statsOn && cfgBool(r.showStatRam, true);
    const showStatBars = statsOn && cfgBool(r.showStatBars, true);
    const wsEnabled = liveStats && (showStatCpu || showStatRam);
    const refresh = (Number(r.refreshInterval) || 15) * 1e3;
    const maxRows = Math.min(200, Math.max(5, Number(r.maxRows) || 80));
    const listSort = parseListSort(r.listSort);
    const customOrder = (0, import_react4.useMemo)(() => normalizeIdOrder(r.customContainerOrder), [r.customContainerOrder]);
    const customOrderKey = customOrder.join("|");
    const [list, setList] = (0, import_react4.useState)([]);
    const [statsById, setStatsById] = (0, import_react4.useState)({});
    const [statsErr, setStatsErr] = (0, import_react4.useState)(null);
    const [error, setError] = (0, import_react4.useState)(null);
    const [loading, setLoading] = (0, import_react4.useState)(true);
    const [busyId, setBusyId] = (0, import_react4.useState)(null);
    const [pending, setPending] = (0, import_react4.useState)(null);
    const pendingRef = (0, import_react4.useRef)(null);
    pendingRef.current = pending;
    const [actionError, setActionError] = (0, import_react4.useState)(null);
    const [lastFetchOk, setLastFetchOk] = (0, import_react4.useState)(null);
    const latest = (0, import_react4.useRef)(0);
    const tableWrapRef = (0, import_react4.useRef)(null);
    const [narrow, setNarrow] = (0, import_react4.useState)(false);
    const [autoNamesByWidth, setAutoNamesByWidth] = (0, import_react4.useState)(false);
    const editMode = useDashboardStore((s) => s.editMode);
    const updatePluginConfig = useDashboardStore((s) => s.updatePluginConfig);
    const displayList = (0, import_react4.useMemo)(
      () => buildOrderedUnraidList(list, listSort, customOrder, statsById),
      [list, listSort, customOrderKey, statsById]
    );
    const onReorderRows = (0, import_react4.useCallback)(
      (dragId, dropId) => {
        if (!dragId || !dropId || dragId === dropId) return;
        const ids = displayList.map((c) => c.id.trim()).filter(Boolean);
        const from = ids.indexOf(dragId);
        const to = ids.indexOf(dropId);
        if (from < 0 || to < 0) return;
        const next = ids.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        updatePluginConfig(instanceId, { customContainerOrder: next, listSort: "custom" });
      },
      [displayList, instanceId, updatePluginConfig]
    );
    const fetch_ = (0, import_react4.useCallback)(async () => {
      if (!url || !apiKey) {
        setError(de ? "URL und API-Key in den Einstellungen setzen." : "Set URL and API key in settings.");
        setLoading(false);
        return;
      }
      const id = ++latest.current;
      try {
        const data = await graphql(url, apiKey, LIST_QUERY, {
          skipCache
        });
        if (latest.current !== id) return;
        const raw = data.docker?.containers;
        if (!Array.isArray(raw)) throw new Error(de ? "Unerwartetes Format" : "Unexpected format");
        let rows = raw.filter((c) => c && typeof c.id === "string");
        if (!showStopped) {
          rows = rows.filter((c) => String(c.state ?? "").toUpperCase() !== "EXITED");
        }
        const sorted = buildOrderedUnraidList(rows, listSort, customOrder, {}).slice(0, maxRows);
        setList(sorted);
        setError(null);
        setLastFetchOk(Date.now());
      } catch (e) {
        if (latest.current === id) {
          reportPluginCatch("unraid-docker", e, "fetch");
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (latest.current === id) setLoading(false);
      }
    }, [url, apiKey, showStopped, skipCache, maxRows, listSort, customOrderKey, de]);
    (0, import_react4.useEffect)(() => {
      setLoading(true);
      void fetch_();
      const t = setInterval(() => void fetch_(), refresh);
      return () => {
        clearInterval(t);
        latest.current++;
      };
    }, [fetch_, refresh]);
    (0, import_react4.useEffect)(() => {
      if (!url || !apiKey || !wsEnabled) {
        setStatsErr(null);
        return;
      }
      let disposed = false;
      setStatsErr(null);
      const client = createClient({
        url: graphqlWsUrl(url),
        connectionParams: () => ({
          "x-api-key": apiKey,
          headers: { "x-api-key": apiKey }
        }),
        lazy: false,
        retryAttempts: 5,
        shouldRetry: () => !disposed,
        on: {
          error: (err) => {
            if (!disposed) setStatsErr(err instanceof Error ? err.message : String(err));
          }
        }
      });
      const unsub = client.subscribe(
        { query: STATS_SUB },
        {
          next: (res) => {
            if (disposed) return;
            const payload = res;
            const row = payload.data?.dockerContainerStats;
            if (!row || typeof row.id !== "string") return;
            const id = row.id;
            const cpu = typeof row.cpuPercent === "number" ? row.cpuPercent : Number(row.cpuPercent);
            const memP = typeof row.memPercent === "number" ? row.memPercent : Number(row.memPercent);
            const memUsage = typeof row.memUsage === "string" ? row.memUsage : "\u2014";
            setStatsById((prev) => ({
              ...prev,
              [id]: {
                cpuPercent: Number.isFinite(cpu) ? cpu : 0,
                memUsage,
                memPercent: Number.isFinite(memP) ? memP : 0
              }
            }));
          },
          error: (e) => {
            if (!disposed) setStatsErr(e instanceof Error ? e.message : String(e));
          },
          complete: () => {
          }
        }
      );
      return () => {
        disposed = true;
        unsub();
        client.dispose();
      };
    }, [url, apiKey, wsEnabled]);
    const runMutation = (0, import_react4.useCallback)(
      async (mutation, cid) => {
        await graphql(url, apiKey, mutation, { id: cid });
      },
      [url, apiKey]
    );
    const goSecondStep = (0, import_react4.useCallback)(() => {
      setPending((cur) => cur && cur.step === 1 ? { ...cur, step: 2 } : cur);
    }, []);
    const cancelPending = (0, import_react4.useCallback)(() => {
      setPending(null);
      setActionError(null);
    }, []);
    const executeAction = (0, import_react4.useCallback)(async () => {
      const p = pendingRef.current;
      if (!p || p.step !== 2 || !p.id.trim()) return;
      setBusyId(p.id);
      setActionError(null);
      try {
        if (p.action === "start") await runMutation(M_START, p.id);
        else if (p.action === "unpause") await runMutation(M_UNPAUSE, p.id);
        else if (p.action === "stop") await runMutation(M_STOP, p.id);
        else {
          await runMutation(M_STOP, p.id);
          await runMutation(M_START, p.id);
        }
        setPending(null);
        await fetch_();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyId(null);
      }
    }, [runMutation, fetch_]);
    const beginAction = (0, import_react4.useCallback)((id, name, action) => {
      setActionError(null);
      setPending({ id, name, action, step: 1 });
    }, []);
    (0, import_react4.useLayoutEffect)(() => {
      if (!compactTableView) return;
      const el = tableWrapRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const apply = () => {
        const w = el.getBoundingClientRect().width;
        const nextNarrow = w > 0 && w < COMPACT_TABLE_NARROW_PX;
        const nextAuto = w >= COMPACT_TABLE_AUTO_NAMES_MIN_PX;
        setNarrow((prev) => prev === nextNarrow ? prev : nextNarrow);
        setAutoNamesByWidth((prev) => prev === nextAuto ? prev : nextAuto);
      };
      apply();
      const ro = new ResizeObserver(() => apply());
      ro.observe(el);
      return () => ro.disconnect();
    }, [compactTableView, actionsOn, list.length, showContainerNames]);
    const shell = {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      padding: compactTableView ? 0 : "8px 12px 12px",
      containerType: "size",
      minWidth: 0,
      width: "100%",
      overflow: "hidden"
    };
    const scrollBody = {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: compactTableView ? "auto" : "hidden",
      padding: compactTableView ? "6px 10px 4px" : 0
    };
    const thStyle = {
      textAlign: "left",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      padding: "6px 8px",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap"
    };
    const tdCompact = {
      padding: "5px 8px",
      verticalAlign: "middle",
      borderBottom: "1px solid color-mix(in srgb, var(--border) 85%, transparent)",
      fontSize: "11px",
      lineHeight: 1.3
    };
    const iconAct = {
      border: "none",
      background: "transparent",
      padding: "4px",
      cursor: "pointer",
      borderRadius: "6px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0
    };
    const btn = {
      fontSize: "clamp(9px, 2.2cqmin, 10px)",
      padding: "2px 7px",
      borderRadius: "4px",
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      cursor: "pointer",
      lineHeight: 1.25,
      fontWeight: 600
    };
    const btnMuted = {
      ...btn,
      color: "var(--text-muted)",
      fontWeight: 500
    };
    if (!url || !apiKey) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...shell, padding: "12px", justifyContent: "center", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.55 }, children: de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "URL & API-Key",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
        "wie beim Unraid-Widget eintragen."
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        "URL & API key",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
        "same as the Unraid widget."
      ] }) });
    }
    if (loading && list.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...scrollBody, padding: compactTableView ? "10px 12px" : void 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [70, 55, 80, 50].map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skeleton", style: { height: "10px", width: `${w}%`, borderRadius: "3px" } }, i)) }) }) });
    }
    if (error) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...shell, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...scrollBody, padding: "12px", color: "#ef4444", fontSize: "12px", lineHeight: 1.45 }, children: [
        error,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { marginTop: 10, color: "var(--text-muted)", fontSize: "11px" }, children: de ? "API-Key: Docker lesen/schreiben. WebSocket (wss/ws) muss zu Unraid erreichbar sein f\xFCr Live-CPU/RAM." : "API key: Docker read/write. WebSocket (wss/ws) must reach Unraid for live CPU/RAM." })
      ] }) });
    }
    const showNamesEffective = showContainerNames || autoNamesByWidth;
    const iconRow = !showNamesEffective;
    const tightMetrics = iconRow && narrow;
    const tdRow = tightMetrics ? { ...tdCompact, padding: "1px 2px", fontSize: "10px" } : narrow ? { ...tdCompact, padding: "4px 5px", fontSize: "10px" } : iconRow ? { ...tdCompact, padding: "5px 4px" } : tdCompact;
    const thDyn = tightMetrics ? { ...thStyle, fontSize: "8px", letterSpacing: "0.03em", padding: "3px 2px" } : narrow ? { ...thStyle, fontSize: "8px", letterSpacing: "0.04em", padding: "5px 5px" } : thStyle;
    const thRow = iconRow && !narrow ? { ...thDyn, padding: "5px 4px" } : thDyn;
    const colWidths = iconRow ? narrow ? [
      editMode ? "56px" : "44px",
      "40px",
      "34px",
      "38px",
      editMode ? "52px" : "44px"
    ] : [null, "76px", "60px", "72px", editMode ? "96px" : "88px"] : narrow ? [null, "56px", "50px", "64px", "52px"] : [null, "78px", "62px", "74px", "64px"];
    const iconActBox = iconRow ? {
      width: colWidths[4],
      maxWidth: colWidths[4],
      minWidth: colWidths[4],
      boxSizing: "border-box"
    } : null;
    const headers = narrow ? showNamesEffective ? [de ? "Name" : "Name", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"] : ["", de ? "St." : "St.", "CPU", de ? "Sp." : "Mem.", de ? "Akt." : "Act."] : showNamesEffective ? [de ? "Name" : "Name", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"] : ["", de ? "Status" : "State", "CPU", de ? "Speicher" : "Memory", de ? "Aktionen" : "Actions"];
    const metricAlign = iconRow ? "left" : "right";
    const memAlign = iconRow ? "left" : metricAlign;
    const tableMinW = narrow && showNamesEffective ? 300 : 0;
    const iconActEff = tightMetrics || iconRow ? { ...iconAct, padding: "2px" } : iconAct;
    const actionBtnGap = tightMetrics ? 1 : iconRow ? 3 : narrow ? 4 : 6;
    const tableLayoutWidth = "100%";
    const fs = "clamp(9px, 2.6cqmin, 11px)";
    const valuesLive = liveStats && (showStatCpu || showStatRam);
    const fetchStatsClassic = showStatCpu || showStatRam;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: shell, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: scrollBody, children: [
        !compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          Heading,
          {
            text: de ? `Unraid Docker \xB7 ${list.length}${showStopped ? "" : " aktiv"}` : `Unraid Docker \xB7 ${list.length}${showStopped ? "" : " active"}`
          }
        ) : null,
        actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "#ef4444", margin: "0 0 8px", lineHeight: 1.4 }, children: actionError }) : null,
        list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: fs, color: "var(--text-muted)", margin: 0 }, children: de ? "Keine Container in der Liste." : "No containers in the list." }) : compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: tableWrapRef, style: { width: "100%", minWidth: 0, overflowX: tableMinW > 0 ? "auto" : void 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "table",
          {
            style: {
              width: tableLayoutWidth,
              maxWidth: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              minWidth: tableMinW > 0 ? tableMinW : void 0
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: colWidths.map((w, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: w != null ? { width: w } : void 0 }, idx)) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "th",
                  {
                    style: {
                      ...thRow,
                      textAlign: iconRow ? "center" : "left",
                      ...iconRow ? { width: colWidths[0] ?? void 0 } : {}
                    },
                    title: !showNamesEffective ? de ? "Name (ausgeblendet)" : "Name (hidden)" : void 0,
                    children: headers[0] || "\xA0"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: iconRow ? "center" : "center" }, children: headers[1] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: metricAlign, fontVariantNumeric: "tabular-nums" }, children: headers[2] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { ...thRow, textAlign: memAlign, fontVariantNumeric: "tabular-nums" }, children: headers[3] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "th",
                  {
                    style: {
                      ...thRow,
                      textAlign: iconRow ? "left" : tightMetrics ? "left" : "right",
                      ...iconActBox ?? {}
                    },
                    children: headers[4]
                  }
                )
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: displayList.flatMap((c, i) => {
                const name = containerName(c);
                const cid = c.id.trim();
                const running = isRunningState(c.state);
                const paused = isPausedState(c.state);
                const stLower = graphqlStateLower(c.state);
                const busy = busyId === cid;
                const isPendingHere = pending != null && cid !== "" && pending.id === cid;
                const rowPending = isPendingHere ? pending : null;
                const canStart = !running && !paused && showBtnStart;
                const canUnpause = paused && showBtnStart;
                const canStop = (running || paused) && showBtnStop;
                const canRestart = running && showBtnRestart;
                const anyBtn = canStart || canUnpause || canStop || canRestart;
                const showControls = Boolean(cid && (anyBtn || rowPending));
                const zebra = i % 2 === 0 ? "color-mix(in srgb, var(--text) 5%, var(--background))" : "color-mix(in srgb, var(--text) 2%, var(--background))";
                const st = statsById[cid];
                const cpuPct = st?.cpuPercent ?? null;
                const memPct = st?.memPercent ?? null;
                const memFull = running && st?.memUsage ? st.memUsage : "\u2014";
                const memCell = memFull === "\u2014" ? "\u2014" : memoryShowLimit ? memFull : fmtMemUsageCompact(memFull);
                const memDisplay = !showStatRam ? "\u2014" : !running || !valuesLive ? "\u2014" : memCell === "\u2014" ? "\u2014" : memCell;
                const iconSrc = (c.iconUrl ?? "").trim();
                const tip = [name, c.state, (c.status ?? "").trim(), (c.image ?? "").split(":")[0]].filter(Boolean).join("\n");
                const dragTrProps = editMode && displayList.length > 1 && cid ? {
                  draggable: true,
                  onDragStart: (e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("text/plain", cid);
                    e.dataTransfer.effectAllowed = "move";
                  },
                  onDragOver: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                  },
                  onDrop: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const d = e.dataTransfer.getData("text/plain");
                    if (d && d !== cid) onReorderRows(d, cid);
                  }
                } : {};
                const mainRow = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { style: { background: zebra }, title: tip, ...dragTrProps, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: { ...tdRow, minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: showNamesEffective ? 8 : 4,
                        minWidth: 0,
                        justifyContent: showNamesEffective ? void 0 : "center"
                      },
                      children: [
                        editMode && displayList.length > 1 && cid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              cursor: "grab",
                              flexShrink: 0,
                              color: "var(--text-muted)",
                              display: "inline-flex",
                              alignItems: "center",
                              lineHeight: 0,
                              paddingRight: 2
                            },
                            title: de ? "Zeile ziehen zum Umsortieren" : "Drag row to reorder",
                            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 14, strokeWidth: 2.2 })
                          }
                        ) : null,
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: !showNamesEffective ? name : void 0, style: { flexShrink: 0 }, children: iconSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            "aria-hidden": true,
                            style: {
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                              boxSizing: "border-box"
                            },
                            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "img",
                              {
                                src: iconSrc,
                                alt: "",
                                width: 24,
                                height: 24,
                                loading: "lazy",
                                referrerPolicy: "no-referrer",
                                style: {
                                  width: 24,
                                  height: 24,
                                  objectFit: "contain",
                                  display: "block",
                                  background: "color-mix(in srgb, var(--surface) 88%, var(--background))"
                                }
                              }
                            )
                          }
                        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContainerAvatar, { image: c.image ?? "", name, useDashboardIcons }) }),
                        showNamesEffective ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              fontWeight: 600,
                              color: "var(--text)",
                              flex: "1 1 auto",
                              minWidth: 0,
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              lineHeight: 1.25
                            },
                            children: name
                          }
                        ) : null
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "td",
                    {
                      style: {
                        ...tdRow,
                        textAlign: iconRow ? "left" : "center",
                        minWidth: iconRow ? 0 : tightMetrics ? 42 : narrow ? 52 : 44
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: stateBadgeStyle(stLower, narrow, tightMetrics, iconRow), title: stateBadgeLabel(stLower, locale), children: stateBadgeLabel(stLower, locale) })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "td",
                    {
                      style: {
                        ...tdRow,
                        textAlign: metricAlign,
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: showStatCpu && valuesLive && running ? heatColorForPct(cpuPct) : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        paddingLeft: iconRow ? 0 : void 0,
                        paddingRight: iconRow ? 0 : showNamesEffective ? 4 : void 0
                      },
                      children: showStatCpu ? valuesLive ? fmtCpuCompact(cpuPct, running) : "\u2014" : "\u2014"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "td",
                    {
                      style: {
                        ...tdRow,
                        textAlign: memAlign,
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        color: showStatRam && valuesLive && running && memDisplay !== "\u2014" ? heatColorForPct(memPct) : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: iconRow && narrow ? "hidden" : iconRow ? void 0 : "hidden",
                        textOverflow: iconRow && narrow ? "ellipsis" : iconRow ? void 0 : "ellipsis",
                        paddingLeft: iconRow ? 0 : showNamesEffective ? 2 : void 0,
                        paddingRight: iconRow ? 0 : void 0
                      },
                      title: memFull,
                      children: memDisplay
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "td",
                    {
                      style: {
                        ...tdRow,
                        textAlign: iconRow ? "left" : tightMetrics ? "left" : "right",
                        whiteSpace: "nowrap",
                        overflow: "visible",
                        ...iconActBox ?? {}
                      },
                      children: actionsOn && !rowPending && showControls && anyBtn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "span",
                        {
                          style: {
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: iconRow ? "flex-start" : tightMetrics ? "flex-start" : "flex-end",
                            gap: actionBtnGap
                          },
                          children: [
                            canStart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "button",
                              {
                                type: "button",
                                style: iconActEff,
                                title: de ? "Start" : "Start",
                                disabled: busy || pending != null,
                                onClick: () => beginAction(cid, name, "start"),
                                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { disabled: busy || pending != null })
                              }
                            ) : null,
                            canUnpause ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "button",
                              {
                                type: "button",
                                style: iconActEff,
                                title: de ? "Fortsetzen" : "Resume",
                                disabled: busy || pending != null,
                                onClick: () => beginAction(cid, name, "unpause"),
                                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPlay, { disabled: busy || pending != null })
                              }
                            ) : null,
                            running || paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                              canStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                "button",
                                {
                                  type: "button",
                                  style: iconActEff,
                                  title: de ? "Stopp" : "Stop",
                                  disabled: busy || pending != null,
                                  onClick: () => beginAction(cid, name, "stop"),
                                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconStop, { disabled: busy || pending != null })
                                }
                              ) : null,
                              canRestart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                                "button",
                                {
                                  type: "button",
                                  style: iconActEff,
                                  title: de ? "Neustart" : "Restart",
                                  disabled: busy || pending != null,
                                  onClick: () => beginAction(cid, name, "restart"),
                                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconRestart, { disabled: busy || pending != null })
                                }
                              ) : null
                            ] }) : null,
                            busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "var(--text-muted)" }, children: "\u2026" }) : null
                          ]
                        }
                      ) : null
                    }
                  )
                ] }, cid || `${name}-${i}`);
                if (showControls && rowPending) {
                  const confirmRow = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { style: { background: zebra }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "td",
                    {
                      colSpan: 5,
                      style: {
                        padding: "0 8px 10px",
                        borderBottom: "1px solid color-mix(in srgb, var(--border) 85%, transparent)"
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            fontSize: "clamp(9px, 2.3cqmin, 11px)",
                            lineHeight: 1.4,
                            color: "var(--text-muted)",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "6px 8px"
                          },
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 6px", color: "var(--text)" }, children: rowPending.step === 1 ? de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                              " wirklich ",
                              actionVerb(rowPending.action),
                              "?",
                              " ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                              "Really ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionVerbEn(rowPending.action) }),
                              " ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                              "?",
                              " ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                            ] }) : de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                              "Zweite Best\xE4tigung: ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNoun(rowPending.action) }),
                              " f\xFCr ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                              ".",
                              " ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                              "Second confirmation: ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNounEn(rowPending.action) }),
                              " for ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                              ".",
                              " ",
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                            ] }) }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btnMuted, onClick: cancelPending, disabled: busy, children: de ? "Abbrechen" : "Cancel" }),
                              rowPending.step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: goSecondStep, disabled: busy, children: de ? "Weiter" : "Next" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: () => void executeAction(), disabled: busy, children: de ? "Ausf\xFChren" : "Run" })
                            ] })
                          ]
                        }
                      )
                    }
                  ) }, `${cid || name}-confirm`);
                  return [mainRow, confirmRow];
                }
                return [mainRow];
              }) })
            ]
          }
        ) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0, width: "100%", minWidth: 0 }, children: displayList.map((c, i) => {
          const name = containerName(c);
          const cid = c.id.trim();
          const running = isRunningState(c.state);
          const paused = isPausedState(c.state);
          const status = (c.status ?? "").trim() || String(c.state ?? "");
          const img = (c.image ?? "").split(":")[0]?.split("@")[0] ?? "";
          const st = statsById[cid];
          const tipParts = [name, String(c.state ?? ""), status, img];
          const sl = statsLineUnraid(running, st, showStatCpu, showStatRam, !memoryShowLimit);
          if (sl) tipParts.push(sl);
          const tip = tipParts.filter(Boolean).join("\n");
          const isBusy = cid !== "" && busyId === cid;
          const isPendingHere = pending != null && cid !== "" && pending.id === cid;
          const rowPending = isPendingHere ? pending : null;
          const canStart = !running && !paused && showBtnStart;
          const canUnpause = paused && showBtnStart;
          const canStop = (running || paused) && showBtnStop;
          const canRestart = running && showBtnRestart;
          const anyBtn = canStart || canUnpause || canStop || canRestart;
          const showControls = Boolean(cid !== "" && (anyBtn || rowPending));
          const showStatsInRow = running && fetchStatsClassic && (showStatCpu || showStatRam);
          const cpuFill = running && showStatCpu && valuesLive ? barFillPct(st?.cpuPercent ?? null) : 0;
          const ramFill = running && showStatRam && valuesLive ? barFillPct(st?.memPercent ?? null) : 0;
          const textStatsInline = showStatsInRow && !showStatBars ? statsLineUnraid(running, st, showStatCpu, showStatRam, !memoryShowLimit) : null;
          const cpuBarTip = showStatCpu ? `CPU ${fmtCpuCompact(st?.cpuPercent ?? null, true)}` : "";
          const ramBarTip = showStatRam ? statsLineUnraid(running, st, false, true, !memoryShowLimit) ?? "RAM" : "";
          const reorderRow = editMode && displayList.length > 1 && !!cid;
          const dragClassicProps = reorderRow ? {
            draggable: true,
            onDragStart: (e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/plain", cid);
              e.dataTransfer.effectAllowed = "move";
            },
            onDragOver: (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
            },
            onDrop: (e) => {
              e.preventDefault();
              e.stopPropagation();
              const d = e.dataTransfer.getData("text/plain");
              if (d && d !== cid) onReorderRows(d, cid);
            }
          } : {};
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "li",
            {
              ...dragClassicProps,
              title: tip,
              style: {
                listStyle: "none",
                margin: 0,
                padding: i < displayList.length - 1 ? "0 0 6px 0" : 0,
                borderBottom: i < displayList.length - 1 ? "1px solid var(--border)" : "none",
                minWidth: 0
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "4px 6px",
                      width: "100%",
                      minWidth: 0,
                      fontSize: fs,
                      lineHeight: 1.35,
                      flexWrap: "nowrap"
                    },
                    children: [
                      reorderRow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            cursor: "grab",
                            flexShrink: 0,
                            color: "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            lineHeight: 0
                          },
                          title: de ? "Ziehen zum Umsortieren" : "Drag to reorder",
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 14, strokeWidth: 2.2 })
                        }
                      ) : null,
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            color: running ? "var(--accent)" : "var(--text-muted)",
                            flexShrink: 0,
                            width: "0.65em",
                            textAlign: "center",
                            fontSize: "0.78em"
                          },
                          "aria-hidden": true,
                          children: running ? "\u25CF" : "\u25CB"
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            fontWeight: 700,
                            color: "var(--text)",
                            flex: "0 1 32%",
                            minWidth: 0,
                            maxWidth: "40%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          },
                          children: name
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0 }, children: ":" }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "span",
                        {
                          style: {
                            color: "var(--text-muted)",
                            flex: "1 1 0%",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          },
                          children: status
                        }
                      ),
                      showStatsInRow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)", flexShrink: 0 }, children: ":" }),
                        showStatBars ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
                          showStatCpu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { label: "C", fillPct: cpuFill, tooltip: cpuBarTip, barColor: "var(--accent)" }) : null,
                          showStatRam ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { label: "R", fillPct: ramFill, tooltip: ramBarTip, barColor: "#5b9bd5" }) : null
                        ] }) : textStatsInline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "span",
                          {
                            style: {
                              flex: "0 1 36%",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "var(--text-muted)",
                              fontSize: "clamp(8px, 2.2cqmin, 10px)"
                            },
                            title: textStatsInline,
                            children: textStatsInline
                          }
                        ) : null
                      ] }) : null,
                      !rowPending && showControls && anyBtn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: "auto" }, children: [
                        canStart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container starten" : "Start container",
                            disabled: isBusy || pending != null,
                            onClick: () => beginAction(cid, name, "start"),
                            children: "Start"
                          }
                        ) : null,
                        canUnpause ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Fortsetzen" : "Resume",
                            disabled: isBusy || pending != null,
                            onClick: () => beginAction(cid, name, "unpause"),
                            children: de ? "Fortsetzen" : "Resume"
                          }
                        ) : null,
                        canStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container stoppen" : "Stop container",
                            disabled: isBusy || pending != null,
                            onClick: () => beginAction(cid, name, "stop"),
                            children: de ? "Stopp" : "Stop"
                          }
                        ) : null,
                        canRestart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "button",
                          {
                            type: "button",
                            style: btn,
                            title: de ? "Container neu starten" : "Restart container",
                            disabled: isBusy || pending != null,
                            onClick: () => beginAction(cid, name, "restart"),
                            children: de ? "Neustart" : "Restart"
                          }
                        ) : null,
                        isBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "8px", color: "var(--text-muted)", whiteSpace: "nowrap" }, children: "\u2026" }) : null
                      ] }) : null
                    ]
                  }
                ),
                showControls && rowPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "div",
                  {
                    style: {
                      marginTop: 6,
                      paddingLeft: "calc(0.65em + 6px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      minWidth: 0
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                      "div",
                      {
                        style: {
                          fontSize: "clamp(9px, 2.3cqmin, 11px)",
                          lineHeight: 1.4,
                          color: "var(--text-muted)",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          padding: "6px 8px"
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 6px", color: "var(--text)" }, children: rowPending.step === 1 ? de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            " wirklich ",
                            actionVerb(rowPending.action),
                            "? ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Really ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionVerbEn(rowPending.action) }),
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            "?",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(1/2)" })
                          ] }) : de ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Zweite Best\xE4tigung: ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNoun(rowPending.action) }),
                            " f\xFCr ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            ".",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                            "Second confirmation: ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionNounEn(rowPending.action) }),
                            " for ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                            ".",
                            " ",
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--text-muted)" }, children: "(2/2)" })
                          ] }) }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btnMuted, onClick: cancelPending, disabled: isBusy, children: de ? "Abbrechen" : "Cancel" }),
                            rowPending.step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: goSecondStep, disabled: isBusy, children: de ? "Weiter" : "Next" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: btn, onClick: () => void executeAction(), disabled: isBusy, children: de ? "Ausf\xFChren" : "Run" })
                          ] })
                        ]
                      }
                    )
                  }
                ) : null
              ]
            },
            cid || `${name}-${i}`
          );
        }) })
      ] }),
      compactTableView ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "8px 12px",
            borderTop: "1px solid var(--border)",
            background: "color-mix(in srgb, var(--surface) 90%, var(--background))",
            fontSize: "11px",
            color: "var(--text-muted)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": true, style: { fontSize: "15px", lineHeight: 1 }, children: "\u{1F433}" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                de ? "Gesamt" : "Total",
                " ",
                list.length,
                " ",
                list.length === 1 ? de ? "Container" : "container" : de ? "Container" : "containers"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { whiteSpace: "nowrap", flexShrink: 0, color: statsErr ? "#f87171" : void 0 }, title: !wsEnabled ? de ? "Live CPU/RAM aus" : "Live CPU/RAM off" : void 0, children: statsErr || fmtUpdatedAgo(lastFetchOk, locale) })
          ]
        }
      ) : null
    ] });
  }
  function Settings({ config, onChange }) {
    const { de } = usePluginLocale();
    const r = config;
    const inp = (0, import_react4.useMemo)(
      () => ({
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "13px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box"
      }),
      []
    );
    const sub = (key, def = false) => cfgBool(config[key], def);
    const actionsOn = cfgBool(r.allowActions, true);
    const statsOn = cfgBool(r.showStats, true);
    const compactTableOn = cfgBool(r.homarrTable, true);
    const dashboardIconsOn = cfgBool(r.useDashboardIcons, true);
    const liveOn = cfgBool(r.liveStats, true);
    const btnStartOn = actionsOn && cfgBool(r.showBtnStart, true);
    const btnStopOn = actionsOn && cfgBool(r.showBtnStop, true);
    const btnRestartOn = actionsOn && cfgBool(r.showBtnRestart, true);
    const statCpuOn = statsOn && cfgBool(r.showStatCpu, true);
    const statRamOn = statsOn && cfgBool(r.showStatRam, true);
    const statBarsOn = statsOn && cfgBool(r.showStatBars, true);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.45, margin: 0 }, children: de ? "Gleiche Optionen wie beim Docker-Plugin: kompakte Tabelle oder klassische Zeile, Icons (CDN), zweistufige Aktions-Best\xE4tigung, CPU/RAM-Steuerung. Daten von Unraid GraphQL + optional WebSocket-Stats." : "Same options as the Docker plugin: compact table or classic row, icons (CDN), two-step action confirmation, CPU/RAM toggles. Data from Unraid GraphQL plus optional WebSocket stats." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }, children: de ? "Unraid-Basis-URL" : "Unraid base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, value: String(r.url ?? ""), onChange: (e) => onChange("url", e.target.value), placeholder: "https://tower oder http://192.168.1.10" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }, children: "API Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: inp, type: "password", value: String(r.apiKey ?? ""), onChange: (e) => onChange("apiKey", e.target.value), placeholder: "x-api-key" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ToggleRow,
        {
          label: de ? "Kompakte Tabelle (Name \xB7 Status \xB7 CPU \xB7 Speicher \xB7 Aktionen)" : "Compact table (name \xB7 state \xB7 CPU \xB7 memory \xB7 actions)",
          on: compactTableOn,
          onToggle: () => onChange("homarrTable", !compactTableOn)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: compactTableOn ? 1 : 0.45, pointerEvents: compactTableOn ? "auto" : "none" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ToggleRow,
          {
            label: de ? "Namen in der Tabelle anzeigen (aus: nur Icon \u2014 ab ca. 520 px Kachelbreite trotzdem automatisch)" : "Show names in table (off: icon only \u2014 auto when the tile is ~520px+ wide)",
            on: sub("showContainerNames", false),
            onToggle: () => onChange("showContainerNames", !sub("showContainerNames", false))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ToggleRow,
          {
            label: de ? "Icons: Unraid-URL + CDN (walkxcode/dashboard-icons) wenn kein Icon" : "Icons: Unraid icon URL + CDN (walkxcode/dashboard-icons) when missing",
            on: dashboardIconsOn,
            onToggle: () => onChange("useDashboardIcons", !dashboardIconsOn)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ToggleRow,
          {
            label: de ? "Speicher: genutzt + Limit (l\xE4ngere Zeile)" : "Memory: show used + limit (longer line)",
            on: sub("memoryShowLimit"),
            onToggle: () => onChange("memoryShowLimit", !sub("memoryShowLimit"))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ToggleRow,
        {
          label: de ? "Live-CPU/RAM (WebSocket-Subscription)" : "Live CPU/RAM (WebSocket subscription)",
          on: liveOn,
          onToggle: () => onChange("liveStats", !liveOn)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSectionTitle, { children: de ? "Auslastung" : "Usage" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "CPU/RAM-Spalten & Live-Daten" : "CPU/RAM columns & live values", on: statsOn, onToggle: () => onChange("showStats", !statsOn) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: statsOn ? 1 : 0.45, pointerEvents: statsOn ? "auto" : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "CPU anzeigen" : "Show CPU",
                on: statCpuOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatCpu", true);
                    return;
                  }
                  onChange("showStatCpu", !statCpuOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "RAM anzeigen" : "Show RAM",
                on: statRamOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatRam", true);
                    return;
                  }
                  onChange("showStatRam", !statRamOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "CPU/RAM als Balken (klassische Ansicht; sonst Text in der Zeile)" : "CPU/RAM as bars (classic view; otherwise inline text)",
                on: statBarsOn,
                onToggle: () => {
                  if (!statsOn) {
                    onChange("showStats", true);
                    onChange("showStatBars", true);
                    return;
                  }
                  onChange("showStatBars", !statBarsOn);
                }
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSectionTitle, { children: de ? "Aktionen" : "Actions" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Buttons (Start / Stopp / Neustart \u2026)" : "Buttons (start / stop / restart \u2026)", on: actionsOn, onToggle: () => onChange("allowActions", !actionsOn) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { opacity: actionsOn ? 1 : 0.45, pointerEvents: actionsOn ? "auto" : "none" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Start" : "Button: start",
                on: btnStartOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnStart", true);
                    return;
                  }
                  onChange("showBtnStart", !btnStartOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Stopp" : "Button: stop",
                on: btnStopOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnStop", true);
                    return;
                  }
                  onChange("showBtnStop", !btnStopOn);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              ToggleRow,
              {
                label: de ? "Button: Neustart" : "Button: restart",
                on: btnRestartOn,
                onToggle: () => {
                  if (!actionsOn) {
                    onChange("allowActions", true);
                    onChange("showBtnRestart", true);
                    return;
                  }
                  onChange("showBtnRestart", !btnRestartOn);
                }
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "Auch gestoppte Container (EXITED)" : "Include stopped (EXITED) containers", on: sub("showStopped"), onToggle: () => onChange("showStopped", !sub("showStopped")) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, { label: de ? "skipCache: true (Liste)" : "skipCache: true (list query)", on: sub("skipCache"), onToggle: () => onChange("skipCache", !sub("skipCache")) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Aktualisierung Liste (Sek.)" : "List refresh (sec.)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: Number(r.refreshInterval) || 15, onChange: (e) => onChange("refreshInterval", Number(e.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 5, children: "5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 10, children: "10" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 15, children: "15" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 20, children: "20" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 30, children: "30" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: 60, children: "60" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Max. Zeilen" : "Max rows" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            style: inp,
            type: "number",
            min: 5,
            max: 200,
            step: 5,
            value: Number.isFinite(Number(r.maxRows)) ? Number(r.maxRows) : 80,
            onChange: (e) => onChange("maxRows", e.target.value === "" ? 80 : Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }, children: de ? "Container-Reihenfolge" : "Container order" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { style: { ...inp, cursor: "pointer" }, value: parseListSort(r.listSort), onChange: (e) => onChange("listSort", e.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "default", children: de ? "Standard (l\xE4uft / pausiert / gestoppt, dann Name)" : "Default (running / paused / stopped, then name)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "name", children: de ? "Nur Name (A\u2013Z)" : "Name only (A\u2013Z)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cpu_desc", children: de ? "CPU (h\xF6chste zuerst)" : "CPU (highest first)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cpu_asc", children: de ? "CPU (niedrigste zuerst)" : "CPU (lowest first)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "mem_desc", children: de ? "RAM % (h\xF6chste zuerst)" : "RAM % (highest first)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "mem_asc", children: de ? "RAM % (niedrigste zuerst)" : "RAM % (lowest first)" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "custom", children: de ? "Manuell (im Bearbeitungsmodus Zeilen ziehen)" : "Manual (drag rows in edit mode)" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.4 }, children: de ? "CPU/RAM-Sortierung nutzt Live-WebSocket-Werte, sobald vorhanden; sonst wie \u201EStandard\u201C. Manuell: Bearbeitung an, Zeilen mit \u22EE\u22EE ziehen." : "CPU/RAM sorting uses live WebSocket values when available; otherwise tie-break like \u201CDefault\u201D. Manual: edit mode on, drag \u22EE\u22EE rows." })
      ] })
    ] });
  }
  var component = { Widget, Settings };

  // plugin-pack/staging/.entries/unraid-docker.tsx
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
lucide-react/dist/esm/icons/grip-vertical.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.383.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
