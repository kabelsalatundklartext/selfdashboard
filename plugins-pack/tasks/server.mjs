var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
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

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse2(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse2(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports, module) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug2(...args) {
          if (!debug2.enabled) {
            return;
          }
          const self = debug2;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index2 = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index2++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index2];
              match = formatter.call(self, val);
              args.splice(index2, 1);
              index2--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug2.namespace = namespace;
        debug2.useColors = createDebug.useColors();
        debug2.color = createDebug.selectColor(namespace);
        debug2.extend = extend2;
        debug2.destroy = createDebug.destroy;
        Object.defineProperty(debug2, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug2);
        }
        return debug2;
      }
      function extend2(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports, module) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index2 = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index2++;
        if (match === "%c") {
          lastC = index2;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("tty");
    var util = __require("util");
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = __require("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/sax/lib/sax.js
var require_sax = __commonJS({
  "node_modules/sax/lib/sax.js"(exports) {
    (function(sax) {
      sax.parser = function(strict, opt) {
        return new SAXParser(strict, opt);
      };
      sax.SAXParser = SAXParser;
      sax.SAXStream = SAXStream;
      sax.createStream = createStream;
      sax.MAX_BUFFER_LENGTH = 64 * 1024;
      var buffers = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      sax.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function SAXParser(strict, opt) {
        if (!(this instanceof SAXParser)) {
          return new SAXParser(strict, opt);
        }
        var parser = this;
        clearBuffers(parser);
        parser.q = parser.c = "";
        parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
        parser.tags = [];
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.strict = !!strict;
        parser.noscript = !!(strict || parser.opt.noscript);
        parser.state = S.BEGIN;
        parser.strictEntities = parser.opt.strictEntities;
        parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
        parser.attribList = [];
        if (parser.opt.xmlns) {
          parser.ns = Object.create(rootNS);
        }
        if (parser.opt.unquotedAttributeValues === void 0) {
          parser.opt.unquotedAttributeValues = !strict;
        }
        parser.trackPosition = parser.opt.position !== false;
        if (parser.trackPosition) {
          parser.position = parser.line = parser.column = 0;
        }
        emit(parser, "onready");
      }
      if (!Object.create) {
        Object.create = function(o) {
          function F() {
          }
          F.prototype = o;
          var newf = new F();
          return newf;
        };
      }
      if (!Object.keys) {
        Object.keys = function(o) {
          var a = [];
          for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
          return a;
        };
      }
      function checkBufferLength(parser) {
        var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
        var maxActual = 0;
        for (var i = 0, l = buffers.length; i < l; i++) {
          var len = parser[buffers[i]].length;
          if (len > maxAllowed) {
            switch (buffers[i]) {
              case "textNode":
                closeText(parser);
                break;
              case "cdata":
                emitNode(parser, "oncdata", parser.cdata);
                parser.cdata = "";
                break;
              case "script":
                emitNode(parser, "onscript", parser.script);
                parser.script = "";
                break;
              default:
                error(parser, "Max buffer length exceeded: " + buffers[i]);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        var m = sax.MAX_BUFFER_LENGTH - maxActual;
        parser.bufferCheckPosition = m + parser.position;
      }
      function clearBuffers(parser) {
        for (var i = 0, l = buffers.length; i < l; i++) {
          parser[buffers[i]] = "";
        }
      }
      function flushBuffers(parser) {
        closeText(parser);
        if (parser.cdata !== "") {
          emitNode(parser, "oncdata", parser.cdata);
          parser.cdata = "";
        }
        if (parser.script !== "") {
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
      }
      SAXParser.prototype = {
        end: function() {
          end(this);
        },
        write,
        resume: function() {
          this.error = null;
          return this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          flushBuffers(this);
        }
      };
      var Stream;
      try {
        Stream = __require("stream").Stream;
      } catch (ex) {
        Stream = function() {
        };
      }
      if (!Stream) Stream = function() {
      };
      var streamWraps = sax.EVENTS.filter(function(ev) {
        return ev !== "error" && ev !== "end";
      });
      function createStream(strict, opt) {
        return new SAXStream(strict, opt);
      }
      function SAXStream(strict, opt) {
        if (!(this instanceof SAXStream)) {
          return new SAXStream(strict, opt);
        }
        Stream.apply(this);
        this._parser = new SAXParser(strict, opt);
        this.writable = true;
        this.readable = true;
        var me = this;
        this._parser.onend = function() {
          me.emit("end");
        };
        this._parser.onerror = function(er) {
          me.emit("error", er);
          me._parser.error = null;
        };
        this._decoder = null;
        streamWraps.forEach(function(ev) {
          Object.defineProperty(me, "on" + ev, {
            get: function() {
              return me._parser["on" + ev];
            },
            set: function(h) {
              if (!h) {
                me.removeAllListeners(ev);
                me._parser["on" + ev] = h;
                return h;
              }
              me.on(ev, h);
            },
            enumerable: true,
            configurable: false
          });
        });
      }
      SAXStream.prototype = Object.create(Stream.prototype, {
        constructor: {
          value: SAXStream
        }
      });
      SAXStream.prototype.write = function(data) {
        if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
          if (!this._decoder) {
            var SD = __require("string_decoder").StringDecoder;
            this._decoder = new SD("utf8");
          }
          data = this._decoder.write(data);
        }
        this._parser.write(data.toString());
        this.emit("data", data);
        return true;
      };
      SAXStream.prototype.end = function(chunk) {
        if (chunk && chunk.length) {
          this.write(chunk);
        }
        this._parser.end();
        return true;
      };
      SAXStream.prototype.on = function(ev, handler) {
        var me = this;
        if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser["on" + ev] = function() {
            var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }
        return Stream.prototype.on.call(me, ev, handler);
      };
      var CDATA = "[CDATA[";
      var DOCTYPE = "DOCTYPE";
      var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
      var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
      var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };
      var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function isWhitespace(c) {
        return c === " " || c === "\n" || c === "\r" || c === "	";
      }
      function isQuote(c) {
        return c === '"' || c === "'";
      }
      function isAttribEnd(c) {
        return c === ">" || isWhitespace(c);
      }
      function isMatch(regex, c) {
        return regex.test(c);
      }
      function notMatch(regex, c) {
        return !isMatch(regex, c);
      }
      var S = 0;
      sax.STATE = {
        BEGIN: S++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: S++,
        // leading whitespace
        TEXT: S++,
        // general stuff
        TEXT_ENTITY: S++,
        // &amp and such.
        OPEN_WAKA: S++,
        // <
        SGML_DECL: S++,
        // <!BLARG
        SGML_DECL_QUOTED: S++,
        // <!BLARG foo "bar
        DOCTYPE: S++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: S++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: S++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: S++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: S++,
        // <!-
        COMMENT: S++,
        // <!--
        COMMENT_ENDING: S++,
        // <!-- blah -
        COMMENT_ENDED: S++,
        // <!-- blah --
        CDATA: S++,
        // <![CDATA[ something
        CDATA_ENDING: S++,
        // ]
        CDATA_ENDING_2: S++,
        // ]]
        PROC_INST: S++,
        // <?hi
        PROC_INST_BODY: S++,
        // <?hi there
        PROC_INST_ENDING: S++,
        // <?hi "there" ?
        OPEN_TAG: S++,
        // <strong
        OPEN_TAG_SLASH: S++,
        // <strong /
        ATTRIB: S++,
        // <a
        ATTRIB_NAME: S++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: S++,
        // <a foo _
        ATTRIB_VALUE: S++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: S++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: S++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: S++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: S++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: S++,
        // <foo bar=&quot
        CLOSE_TAG: S++,
        // </a
        CLOSE_TAG_SAW_WHITE: S++,
        // </a   >
        SCRIPT: S++,
        // <script> ...
        SCRIPT_ENDING: S++
        // <script> ... <
      };
      sax.XML_ENTITIES = {
        "amp": "&",
        "gt": ">",
        "lt": "<",
        "quot": '"',
        "apos": "'"
      };
      sax.ENTITIES = {
        "amp": "&",
        "gt": ">",
        "lt": "<",
        "quot": '"',
        "apos": "'",
        "AElig": 198,
        "Aacute": 193,
        "Acirc": 194,
        "Agrave": 192,
        "Aring": 197,
        "Atilde": 195,
        "Auml": 196,
        "Ccedil": 199,
        "ETH": 208,
        "Eacute": 201,
        "Ecirc": 202,
        "Egrave": 200,
        "Euml": 203,
        "Iacute": 205,
        "Icirc": 206,
        "Igrave": 204,
        "Iuml": 207,
        "Ntilde": 209,
        "Oacute": 211,
        "Ocirc": 212,
        "Ograve": 210,
        "Oslash": 216,
        "Otilde": 213,
        "Ouml": 214,
        "THORN": 222,
        "Uacute": 218,
        "Ucirc": 219,
        "Ugrave": 217,
        "Uuml": 220,
        "Yacute": 221,
        "aacute": 225,
        "acirc": 226,
        "aelig": 230,
        "agrave": 224,
        "aring": 229,
        "atilde": 227,
        "auml": 228,
        "ccedil": 231,
        "eacute": 233,
        "ecirc": 234,
        "egrave": 232,
        "eth": 240,
        "euml": 235,
        "iacute": 237,
        "icirc": 238,
        "igrave": 236,
        "iuml": 239,
        "ntilde": 241,
        "oacute": 243,
        "ocirc": 244,
        "ograve": 242,
        "oslash": 248,
        "otilde": 245,
        "ouml": 246,
        "szlig": 223,
        "thorn": 254,
        "uacute": 250,
        "ucirc": 251,
        "ugrave": 249,
        "uuml": 252,
        "yacute": 253,
        "yuml": 255,
        "copy": 169,
        "reg": 174,
        "nbsp": 160,
        "iexcl": 161,
        "cent": 162,
        "pound": 163,
        "curren": 164,
        "yen": 165,
        "brvbar": 166,
        "sect": 167,
        "uml": 168,
        "ordf": 170,
        "laquo": 171,
        "not": 172,
        "shy": 173,
        "macr": 175,
        "deg": 176,
        "plusmn": 177,
        "sup1": 185,
        "sup2": 178,
        "sup3": 179,
        "acute": 180,
        "micro": 181,
        "para": 182,
        "middot": 183,
        "cedil": 184,
        "ordm": 186,
        "raquo": 187,
        "frac14": 188,
        "frac12": 189,
        "frac34": 190,
        "iquest": 191,
        "times": 215,
        "divide": 247,
        "OElig": 338,
        "oelig": 339,
        "Scaron": 352,
        "scaron": 353,
        "Yuml": 376,
        "fnof": 402,
        "circ": 710,
        "tilde": 732,
        "Alpha": 913,
        "Beta": 914,
        "Gamma": 915,
        "Delta": 916,
        "Epsilon": 917,
        "Zeta": 918,
        "Eta": 919,
        "Theta": 920,
        "Iota": 921,
        "Kappa": 922,
        "Lambda": 923,
        "Mu": 924,
        "Nu": 925,
        "Xi": 926,
        "Omicron": 927,
        "Pi": 928,
        "Rho": 929,
        "Sigma": 931,
        "Tau": 932,
        "Upsilon": 933,
        "Phi": 934,
        "Chi": 935,
        "Psi": 936,
        "Omega": 937,
        "alpha": 945,
        "beta": 946,
        "gamma": 947,
        "delta": 948,
        "epsilon": 949,
        "zeta": 950,
        "eta": 951,
        "theta": 952,
        "iota": 953,
        "kappa": 954,
        "lambda": 955,
        "mu": 956,
        "nu": 957,
        "xi": 958,
        "omicron": 959,
        "pi": 960,
        "rho": 961,
        "sigmaf": 962,
        "sigma": 963,
        "tau": 964,
        "upsilon": 965,
        "phi": 966,
        "chi": 967,
        "psi": 968,
        "omega": 969,
        "thetasym": 977,
        "upsih": 978,
        "piv": 982,
        "ensp": 8194,
        "emsp": 8195,
        "thinsp": 8201,
        "zwnj": 8204,
        "zwj": 8205,
        "lrm": 8206,
        "rlm": 8207,
        "ndash": 8211,
        "mdash": 8212,
        "lsquo": 8216,
        "rsquo": 8217,
        "sbquo": 8218,
        "ldquo": 8220,
        "rdquo": 8221,
        "bdquo": 8222,
        "dagger": 8224,
        "Dagger": 8225,
        "bull": 8226,
        "hellip": 8230,
        "permil": 8240,
        "prime": 8242,
        "Prime": 8243,
        "lsaquo": 8249,
        "rsaquo": 8250,
        "oline": 8254,
        "frasl": 8260,
        "euro": 8364,
        "image": 8465,
        "weierp": 8472,
        "real": 8476,
        "trade": 8482,
        "alefsym": 8501,
        "larr": 8592,
        "uarr": 8593,
        "rarr": 8594,
        "darr": 8595,
        "harr": 8596,
        "crarr": 8629,
        "lArr": 8656,
        "uArr": 8657,
        "rArr": 8658,
        "dArr": 8659,
        "hArr": 8660,
        "forall": 8704,
        "part": 8706,
        "exist": 8707,
        "empty": 8709,
        "nabla": 8711,
        "isin": 8712,
        "notin": 8713,
        "ni": 8715,
        "prod": 8719,
        "sum": 8721,
        "minus": 8722,
        "lowast": 8727,
        "radic": 8730,
        "prop": 8733,
        "infin": 8734,
        "ang": 8736,
        "and": 8743,
        "or": 8744,
        "cap": 8745,
        "cup": 8746,
        "int": 8747,
        "there4": 8756,
        "sim": 8764,
        "cong": 8773,
        "asymp": 8776,
        "ne": 8800,
        "equiv": 8801,
        "le": 8804,
        "ge": 8805,
        "sub": 8834,
        "sup": 8835,
        "nsub": 8836,
        "sube": 8838,
        "supe": 8839,
        "oplus": 8853,
        "otimes": 8855,
        "perp": 8869,
        "sdot": 8901,
        "lceil": 8968,
        "rceil": 8969,
        "lfloor": 8970,
        "rfloor": 8971,
        "lang": 9001,
        "rang": 9002,
        "loz": 9674,
        "spades": 9824,
        "clubs": 9827,
        "hearts": 9829,
        "diams": 9830
      };
      Object.keys(sax.ENTITIES).forEach(function(key) {
        var e = sax.ENTITIES[key];
        var s2 = typeof e === "number" ? String.fromCharCode(e) : e;
        sax.ENTITIES[key] = s2;
      });
      for (var s in sax.STATE) {
        sax.STATE[sax.STATE[s]] = s;
      }
      S = sax.STATE;
      function emit(parser, event, data) {
        parser[event] && parser[event](data);
      }
      function emitNode(parser, nodeType, data) {
        if (parser.textNode) closeText(parser);
        emit(parser, nodeType, data);
      }
      function closeText(parser) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode) emit(parser, "ontext", parser.textNode);
        parser.textNode = "";
      }
      function textopts(opt, text) {
        if (opt.trim) text = text.trim();
        if (opt.normalize) text = text.replace(/\s+/g, " ");
        return text;
      }
      function error(parser, er) {
        closeText(parser);
        if (parser.trackPosition) {
          er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
        }
        er = new Error(er);
        parser.error = er;
        emit(parser, "onerror", er);
        return parser;
      }
      function end(parser) {
        if (parser.sawRoot && !parser.closedRoot) strictFail(parser, "Unclosed root tag");
        if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
          error(parser, "Unexpected end");
        }
        closeText(parser);
        parser.c = "";
        parser.closed = true;
        emit(parser, "onend");
        SAXParser.call(parser, parser.strict, parser.opt);
        return parser;
      }
      function strictFail(parser, message) {
        if (typeof parser !== "object" || !(parser instanceof SAXParser)) {
          throw new Error("bad call to strictFail");
        }
        if (parser.strict) {
          error(parser, message);
        }
      }
      function newTag(parser) {
        if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
        var parent = parser.tags[parser.tags.length - 1] || parser;
        var tag = parser.tag = { name: parser.tagName, attributes: {} };
        if (parser.opt.xmlns) {
          tag.ns = parent.ns;
        }
        parser.attribList.length = 0;
        emitNode(parser, "onopentagstart", tag);
      }
      function qname(name, attribute) {
        var i = name.indexOf(":");
        var qualName = i < 0 ? ["", name] : name.split(":");
        var prefix = qualName[0];
        var local = qualName[1];
        if (attribute && name === "xmlns") {
          prefix = "xmlns";
          local = "";
        }
        return { prefix, local };
      }
      function attrib(parser) {
        if (!parser.strict) {
          parser.attribName = parser.attribName[parser.looseCase]();
        }
        if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
          parser.attribName = parser.attribValue = "";
          return;
        }
        if (parser.opt.xmlns) {
          var qn = qname(parser.attribName, true);
          var prefix = qn.prefix;
          var local = qn.local;
          if (prefix === "xmlns") {
            if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
              strictFail(
                parser,
                "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
              strictFail(
                parser,
                "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue
              );
            } else {
              var tag = parser.tag;
              var parent = parser.tags[parser.tags.length - 1] || parser;
              if (tag.ns === parent.ns) {
                tag.ns = Object.create(parent.ns);
              }
              tag.ns[local] = parser.attribValue;
            }
          }
          parser.attribList.push([parser.attribName, parser.attribValue]);
        } else {
          parser.tag.attributes[parser.attribName] = parser.attribValue;
          emitNode(parser, "onattribute", {
            name: parser.attribName,
            value: parser.attribValue
          });
        }
        parser.attribName = parser.attribValue = "";
      }
      function openTag(parser, selfClosing) {
        if (parser.opt.xmlns) {
          var tag = parser.tag;
          var qn = qname(parser.tagName);
          tag.prefix = qn.prefix;
          tag.local = qn.local;
          tag.uri = tag.ns[qn.prefix] || "";
          if (tag.prefix && !tag.uri) {
            strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(parser.tagName));
            tag.uri = qn.prefix;
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns && parent.ns !== tag.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              emitNode(parser, "onopennamespace", {
                prefix: p,
                uri: tag.ns[p]
              });
            });
          }
          for (var i = 0, l = parser.attribList.length; i < l; i++) {
            var nv = parser.attribList[i];
            var name = nv[0];
            var value = nv[1];
            var qualName = qname(name, true);
            var prefix = qualName.prefix;
            var local = qualName.local;
            var uri = prefix === "" ? "" : tag.ns[prefix] || "";
            var a = {
              name,
              value,
              prefix,
              local,
              uri
            };
            if (prefix && prefix !== "xmlns" && !uri) {
              strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(prefix));
              a.uri = prefix;
            }
            parser.tag.attributes[name] = a;
            emitNode(parser, "onattribute", a);
          }
          parser.attribList.length = 0;
        }
        parser.tag.isSelfClosing = !!selfClosing;
        parser.sawRoot = true;
        parser.tags.push(parser.tag);
        emitNode(parser, "onopentag", parser.tag);
        if (!selfClosing) {
          if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
            parser.state = S.SCRIPT;
          } else {
            parser.state = S.TEXT;
          }
          parser.tag = null;
          parser.tagName = "";
        }
        parser.attribName = parser.attribValue = "";
        parser.attribList.length = 0;
      }
      function closeTag(parser) {
        if (!parser.tagName) {
          strictFail(parser, "Weird empty close tag.");
          parser.textNode += "</>";
          parser.state = S.TEXT;
          return;
        }
        if (parser.script) {
          if (parser.tagName !== "script") {
            parser.script += "</" + parser.tagName + ">";
            parser.tagName = "";
            parser.state = S.SCRIPT;
            return;
          }
          emitNode(parser, "onscript", parser.script);
          parser.script = "";
        }
        var t = parser.tags.length;
        var tagName = parser.tagName;
        if (!parser.strict) {
          tagName = tagName[parser.looseCase]();
        }
        var closeTo = tagName;
        while (t--) {
          var close = parser.tags[t];
          if (close.name !== closeTo) {
            strictFail(parser, "Unexpected close tag");
          } else {
            break;
          }
        }
        if (t < 0) {
          strictFail(parser, "Unmatched closing tag: " + parser.tagName);
          parser.textNode += "</" + parser.tagName + ">";
          parser.state = S.TEXT;
          return;
        }
        parser.tagName = tagName;
        var s2 = parser.tags.length;
        while (s2-- > t) {
          var tag = parser.tag = parser.tags.pop();
          parser.tagName = parser.tag.name;
          emitNode(parser, "onclosetag", parser.tagName);
          var x = {};
          for (var i in tag.ns) {
            x[i] = tag.ns[i];
          }
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (parser.opt.xmlns && tag.ns !== parent.ns) {
            Object.keys(tag.ns).forEach(function(p) {
              var n = tag.ns[p];
              emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
            });
          }
        }
        if (t === 0) parser.closedRoot = true;
        parser.tagName = parser.attribValue = parser.attribName = "";
        parser.attribList.length = 0;
        parser.state = S.TEXT;
      }
      function parseEntity(parser) {
        var entity = parser.entity;
        var entityLC = entity.toLowerCase();
        var num;
        var numStr = "";
        if (parser.ENTITIES[entity]) {
          return parser.ENTITIES[entity];
        }
        if (parser.ENTITIES[entityLC]) {
          return parser.ENTITIES[entityLC];
        }
        entity = entityLC;
        if (entity.charAt(0) === "#") {
          if (entity.charAt(1) === "x") {
            entity = entity.slice(2);
            num = parseInt(entity, 16);
            numStr = num.toString(16);
          } else {
            entity = entity.slice(1);
            num = parseInt(entity, 10);
            numStr = num.toString(10);
          }
        }
        entity = entity.replace(/^0+/, "");
        if (isNaN(num) || numStr.toLowerCase() !== entity) {
          strictFail(parser, "Invalid character entity");
          return "&" + parser.entity + ";";
        }
        return String.fromCodePoint(num);
      }
      function beginWhiteSpace(parser, c) {
        if (c === "<") {
          parser.state = S.OPEN_WAKA;
          parser.startTagPosition = parser.position;
        } else if (!isWhitespace(c)) {
          strictFail(parser, "Non-whitespace before first tag.");
          parser.textNode = c;
          parser.state = S.TEXT;
        }
      }
      function charAt(chunk, i) {
        var result = "";
        if (i < chunk.length) {
          result = chunk.charAt(i);
        }
        return result;
      }
      function write(chunk) {
        var parser = this;
        if (this.error) {
          throw this.error;
        }
        if (parser.closed) {
          return error(
            parser,
            "Cannot write after close. Assign an onready handler."
          );
        }
        if (chunk === null) {
          return end(parser);
        }
        if (typeof chunk === "object") {
          chunk = chunk.toString();
        }
        var i = 0;
        var c = "";
        while (true) {
          c = charAt(chunk, i++);
          parser.c = c;
          if (!c) {
            break;
          }
          if (parser.trackPosition) {
            parser.position++;
            if (c === "\n") {
              parser.line++;
              parser.column = 0;
            } else {
              parser.column++;
            }
          }
          switch (parser.state) {
            case S.BEGIN:
              parser.state = S.BEGIN_WHITESPACE;
              if (c === "\uFEFF") {
                continue;
              }
              beginWhiteSpace(parser, c);
              continue;
            case S.BEGIN_WHITESPACE:
              beginWhiteSpace(parser, c);
              continue;
            case S.TEXT:
              if (parser.sawRoot && !parser.closedRoot) {
                var starti = i - 1;
                while (c && c !== "<" && c !== "&") {
                  c = charAt(chunk, i++);
                  if (c && parser.trackPosition) {
                    parser.position++;
                    if (c === "\n") {
                      parser.line++;
                      parser.column = 0;
                    } else {
                      parser.column++;
                    }
                  }
                }
                parser.textNode += chunk.substring(starti, i - 1);
              }
              if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else {
                if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
                  strictFail(parser, "Text data outside of root node.");
                }
                if (c === "&") {
                  parser.state = S.TEXT_ENTITY;
                } else {
                  parser.textNode += c;
                }
              }
              continue;
            case S.SCRIPT:
              if (c === "<") {
                parser.state = S.SCRIPT_ENDING;
              } else {
                parser.script += c;
              }
              continue;
            case S.SCRIPT_ENDING:
              if (c === "/") {
                parser.state = S.CLOSE_TAG;
              } else {
                parser.script += "<" + c;
                parser.state = S.SCRIPT;
              }
              continue;
            case S.OPEN_WAKA:
              if (c === "!") {
                parser.state = S.SGML_DECL;
                parser.sgmlDecl = "";
              } else if (isWhitespace(c)) {
              } else if (isMatch(nameStart, c)) {
                parser.state = S.OPEN_TAG;
                parser.tagName = c;
              } else if (c === "/") {
                parser.state = S.CLOSE_TAG;
                parser.tagName = "";
              } else if (c === "?") {
                parser.state = S.PROC_INST;
                parser.procInstName = parser.procInstBody = "";
              } else {
                strictFail(parser, "Unencoded <");
                if (parser.startTagPosition + 1 < parser.position) {
                  var pad = parser.position - parser.startTagPosition;
                  c = new Array(pad).join(" ") + c;
                }
                parser.textNode += "<" + c;
                parser.state = S.TEXT;
              }
              continue;
            case S.SGML_DECL:
              if (parser.sgmlDecl + c === "--") {
                parser.state = S.COMMENT;
                parser.comment = "";
                parser.sgmlDecl = "";
                continue;
              }
              if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
                parser.state = S.DOCTYPE_DTD;
                parser.doctype += "<!" + parser.sgmlDecl + c;
                parser.sgmlDecl = "";
              } else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
                emitNode(parser, "onopencdata");
                parser.state = S.CDATA;
                parser.sgmlDecl = "";
                parser.cdata = "";
              } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
                parser.state = S.DOCTYPE;
                if (parser.doctype || parser.sawRoot) {
                  strictFail(
                    parser,
                    "Inappropriately located doctype declaration"
                  );
                }
                parser.doctype = "";
                parser.sgmlDecl = "";
              } else if (c === ">") {
                emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
                parser.sgmlDecl = "";
                parser.state = S.TEXT;
              } else if (isQuote(c)) {
                parser.state = S.SGML_DECL_QUOTED;
                parser.sgmlDecl += c;
              } else {
                parser.sgmlDecl += c;
              }
              continue;
            case S.SGML_DECL_QUOTED:
              if (c === parser.q) {
                parser.state = S.SGML_DECL;
                parser.q = "";
              }
              parser.sgmlDecl += c;
              continue;
            case S.DOCTYPE:
              if (c === ">") {
                parser.state = S.TEXT;
                emitNode(parser, "ondoctype", parser.doctype);
                parser.doctype = true;
              } else {
                parser.doctype += c;
                if (c === "[") {
                  parser.state = S.DOCTYPE_DTD;
                } else if (isQuote(c)) {
                  parser.state = S.DOCTYPE_QUOTED;
                  parser.q = c;
                }
              }
              continue;
            case S.DOCTYPE_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.q = "";
                parser.state = S.DOCTYPE;
              }
              continue;
            case S.DOCTYPE_DTD:
              if (c === "]") {
                parser.doctype += c;
                parser.state = S.DOCTYPE;
              } else if (c === "<") {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else if (isQuote(c)) {
                parser.doctype += c;
                parser.state = S.DOCTYPE_DTD_QUOTED;
                parser.q = c;
              } else {
                parser.doctype += c;
              }
              continue;
            case S.DOCTYPE_DTD_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.state = S.DOCTYPE_DTD;
                parser.q = "";
              }
              continue;
            case S.COMMENT:
              if (c === "-") {
                parser.state = S.COMMENT_ENDING;
              } else {
                parser.comment += c;
              }
              continue;
            case S.COMMENT_ENDING:
              if (c === "-") {
                parser.state = S.COMMENT_ENDED;
                parser.comment = textopts(parser.opt, parser.comment);
                if (parser.comment) {
                  emitNode(parser, "oncomment", parser.comment);
                }
                parser.comment = "";
              } else {
                parser.comment += "-" + c;
                parser.state = S.COMMENT;
              }
              continue;
            case S.COMMENT_ENDED:
              if (c !== ">") {
                strictFail(parser, "Malformed comment");
                parser.comment += "--" + c;
                parser.state = S.COMMENT;
              } else if (parser.doctype && parser.doctype !== true) {
                parser.state = S.DOCTYPE_DTD;
              } else {
                parser.state = S.TEXT;
              }
              continue;
            case S.CDATA:
              if (c === "]") {
                parser.state = S.CDATA_ENDING;
              } else {
                parser.cdata += c;
              }
              continue;
            case S.CDATA_ENDING:
              if (c === "]") {
                parser.state = S.CDATA_ENDING_2;
              } else {
                parser.cdata += "]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.CDATA_ENDING_2:
              if (c === ">") {
                if (parser.cdata) {
                  emitNode(parser, "oncdata", parser.cdata);
                }
                emitNode(parser, "onclosecdata");
                parser.cdata = "";
                parser.state = S.TEXT;
              } else if (c === "]") {
                parser.cdata += "]";
              } else {
                parser.cdata += "]]" + c;
                parser.state = S.CDATA;
              }
              continue;
            case S.PROC_INST:
              if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else if (isWhitespace(c)) {
                parser.state = S.PROC_INST_BODY;
              } else {
                parser.procInstName += c;
              }
              continue;
            case S.PROC_INST_BODY:
              if (!parser.procInstBody && isWhitespace(c)) {
                continue;
              } else if (c === "?") {
                parser.state = S.PROC_INST_ENDING;
              } else {
                parser.procInstBody += c;
              }
              continue;
            case S.PROC_INST_ENDING:
              if (c === ">") {
                emitNode(parser, "onprocessinginstruction", {
                  name: parser.procInstName,
                  body: parser.procInstBody
                });
                parser.procInstName = parser.procInstBody = "";
                parser.state = S.TEXT;
              } else {
                parser.procInstBody += "?" + c;
                parser.state = S.PROC_INST_BODY;
              }
              continue;
            case S.OPEN_TAG:
              if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else {
                newTag(parser);
                if (c === ">") {
                  openTag(parser);
                } else if (c === "/") {
                  parser.state = S.OPEN_TAG_SLASH;
                } else {
                  if (!isWhitespace(c)) {
                    strictFail(parser, "Invalid character in tag name");
                  }
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.OPEN_TAG_SLASH:
              if (c === ">") {
                openTag(parser, true);
                closeTag(parser);
              } else {
                strictFail(parser, "Forward-slash in opening tag not followed by >");
                parser.state = S.ATTRIB;
              }
              continue;
            case S.ATTRIB:
              if (isWhitespace(c)) {
                continue;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (c === ">") {
                strictFail(parser, "Attribute without value");
                parser.attribValue = parser.attribName;
                attrib(parser);
                openTag(parser);
              } else if (isWhitespace(c)) {
                parser.state = S.ATTRIB_NAME_SAW_WHITE;
              } else if (isMatch(nameBody, c)) {
                parser.attribName += c;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_NAME_SAW_WHITE:
              if (c === "=") {
                parser.state = S.ATTRIB_VALUE;
              } else if (isWhitespace(c)) {
                continue;
              } else {
                strictFail(parser, "Attribute without value");
                parser.tag.attributes[parser.attribName] = "";
                parser.attribValue = "";
                emitNode(parser, "onattribute", {
                  name: parser.attribName,
                  value: ""
                });
                parser.attribName = "";
                if (c === ">") {
                  openTag(parser);
                } else if (isMatch(nameStart, c)) {
                  parser.attribName = c;
                  parser.state = S.ATTRIB_NAME;
                } else {
                  strictFail(parser, "Invalid attribute name");
                  parser.state = S.ATTRIB;
                }
              }
              continue;
            case S.ATTRIB_VALUE:
              if (isWhitespace(c)) {
                continue;
              } else if (isQuote(c)) {
                parser.q = c;
                parser.state = S.ATTRIB_VALUE_QUOTED;
              } else {
                if (!parser.opt.unquotedAttributeValues) {
                  error(parser, "Unquoted attribute value");
                }
                parser.state = S.ATTRIB_VALUE_UNQUOTED;
                parser.attribValue = c;
              }
              continue;
            case S.ATTRIB_VALUE_QUOTED:
              if (c !== parser.q) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_Q;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              parser.q = "";
              parser.state = S.ATTRIB_VALUE_CLOSED;
              continue;
            case S.ATTRIB_VALUE_CLOSED:
              if (isWhitespace(c)) {
                parser.state = S.ATTRIB;
              } else if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                strictFail(parser, "No whitespace between attributes");
                parser.attribName = c;
                parser.attribValue = "";
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
              }
              continue;
            case S.ATTRIB_VALUE_UNQUOTED:
              if (!isAttribEnd(c)) {
                if (c === "&") {
                  parser.state = S.ATTRIB_VALUE_ENTITY_U;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              if (c === ">") {
                openTag(parser);
              } else {
                parser.state = S.ATTRIB;
              }
              continue;
            case S.CLOSE_TAG:
              if (!parser.tagName) {
                if (isWhitespace(c)) {
                  continue;
                } else if (notMatch(nameStart, c)) {
                  if (parser.script) {
                    parser.script += "</" + c;
                    parser.state = S.SCRIPT;
                  } else {
                    strictFail(parser, "Invalid tagname in closing tag.");
                  }
                } else {
                  parser.tagName = c;
                }
              } else if (c === ">") {
                closeTag(parser);
              } else if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else if (parser.script) {
                parser.script += "</" + parser.tagName;
                parser.tagName = "";
                parser.state = S.SCRIPT;
              } else {
                if (!isWhitespace(c)) {
                  strictFail(parser, "Invalid tagname in closing tag");
                }
                parser.state = S.CLOSE_TAG_SAW_WHITE;
              }
              continue;
            case S.CLOSE_TAG_SAW_WHITE:
              if (isWhitespace(c)) {
                continue;
              }
              if (c === ">") {
                closeTag(parser);
              } else {
                strictFail(parser, "Invalid characters in closing tag");
              }
              continue;
            case S.TEXT_ENTITY:
            case S.ATTRIB_VALUE_ENTITY_Q:
            case S.ATTRIB_VALUE_ENTITY_U:
              var returnState;
              var buffer;
              switch (parser.state) {
                case S.TEXT_ENTITY:
                  returnState = S.TEXT;
                  buffer = "textNode";
                  break;
                case S.ATTRIB_VALUE_ENTITY_Q:
                  returnState = S.ATTRIB_VALUE_QUOTED;
                  buffer = "attribValue";
                  break;
                case S.ATTRIB_VALUE_ENTITY_U:
                  returnState = S.ATTRIB_VALUE_UNQUOTED;
                  buffer = "attribValue";
                  break;
              }
              if (c === ";") {
                var parsedEntity = parseEntity(parser);
                if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
                  parser.entity = "";
                  parser.state = returnState;
                  parser.write(parsedEntity);
                } else {
                  parser[buffer] += parsedEntity;
                  parser.entity = "";
                  parser.state = returnState;
                }
              } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
                parser.entity += c;
              } else {
                strictFail(parser, "Invalid character in entity name");
                parser[buffer] += "&" + parser.entity + c;
                parser.entity = "";
                parser.state = returnState;
              }
              continue;
            default: {
              throw new Error(parser, "Unknown state: " + parser.state);
            }
          }
        }
        if (parser.position >= parser.bufferCheckPosition) {
          checkBufferLength(parser);
        }
        return parser;
      }
      if (!String.fromCodePoint) {
        (function() {
          var stringFromCharCode = String.fromCharCode;
          var floor = Math.floor;
          var fromCodePoint = function() {
            var MAX_SIZE = 16384;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index2 = -1;
            var length = arguments.length;
            if (!length) {
              return "";
            }
            var result = "";
            while (++index2 < length) {
              var codePoint = Number(arguments[index2]);
              if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
              codePoint < 0 || // not a valid Unicode code point
              codePoint > 1114111 || // not a valid Unicode code point
              floor(codePoint) !== codePoint) {
                throw RangeError("Invalid code point: " + codePoint);
              }
              if (codePoint <= 65535) {
                codeUnits.push(codePoint);
              } else {
                codePoint -= 65536;
                highSurrogate = (codePoint >> 10) + 55296;
                lowSurrogate = codePoint % 1024 + 56320;
                codeUnits.push(highSurrogate, lowSurrogate);
              }
              if (index2 + 1 === length || codeUnits.length > MAX_SIZE) {
                result += stringFromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
              }
            }
            return result;
          };
          if (Object.defineProperty) {
            Object.defineProperty(String, "fromCodePoint", {
              value: fromCodePoint,
              configurable: true,
              writable: true
            });
          } else {
            String.fromCodePoint = fromCodePoint;
          }
        })();
      }
    })(typeof exports === "undefined" ? exports.sax = {} : exports);
  }
});

// node_modules/xml-js/lib/array-helper.js
var require_array_helper = __commonJS({
  "node_modules/xml-js/lib/array-helper.js"(exports, module) {
    module.exports = {
      isArray: function(value) {
        if (Array.isArray) {
          return Array.isArray(value);
        }
        return Object.prototype.toString.call(value) === "[object Array]";
      }
    };
  }
});

// node_modules/xml-js/lib/options-helper.js
var require_options_helper = __commonJS({
  "node_modules/xml-js/lib/options-helper.js"(exports, module) {
    var isArray = require_array_helper().isArray;
    module.exports = {
      copyOptions: function(options) {
        var key, copy = {};
        for (key in options) {
          if (options.hasOwnProperty(key)) {
            copy[key] = options[key];
          }
        }
        return copy;
      },
      ensureFlagExists: function(item, options) {
        if (!(item in options) || typeof options[item] !== "boolean") {
          options[item] = false;
        }
      },
      ensureSpacesExists: function(options) {
        if (!("spaces" in options) || typeof options.spaces !== "number" && typeof options.spaces !== "string") {
          options.spaces = 0;
        }
      },
      ensureAlwaysArrayExists: function(options) {
        if (!("alwaysArray" in options) || typeof options.alwaysArray !== "boolean" && !isArray(options.alwaysArray)) {
          options.alwaysArray = false;
        }
      },
      ensureKeyExists: function(key, options) {
        if (!(key + "Key" in options) || typeof options[key + "Key"] !== "string") {
          options[key + "Key"] = options.compact ? "_" + key : key;
        }
      },
      checkFnExists: function(key, options) {
        return key + "Fn" in options;
      }
    };
  }
});

// node_modules/xml-js/lib/xml2js.js
var require_xml2js = __commonJS({
  "node_modules/xml-js/lib/xml2js.js"(exports, module) {
    var sax = require_sax();
    var expat = { on: function() {
    }, parse: function() {
    } };
    var helper = require_options_helper();
    var isArray = require_array_helper().isArray;
    var options;
    var pureJsParser = true;
    var currentElement;
    function validateOptions(userOptions) {
      options = helper.copyOptions(userOptions);
      helper.ensureFlagExists("ignoreDeclaration", options);
      helper.ensureFlagExists("ignoreInstruction", options);
      helper.ensureFlagExists("ignoreAttributes", options);
      helper.ensureFlagExists("ignoreText", options);
      helper.ensureFlagExists("ignoreComment", options);
      helper.ensureFlagExists("ignoreCdata", options);
      helper.ensureFlagExists("ignoreDoctype", options);
      helper.ensureFlagExists("compact", options);
      helper.ensureFlagExists("alwaysChildren", options);
      helper.ensureFlagExists("addParent", options);
      helper.ensureFlagExists("trim", options);
      helper.ensureFlagExists("nativeType", options);
      helper.ensureFlagExists("nativeTypeAttributes", options);
      helper.ensureFlagExists("sanitize", options);
      helper.ensureFlagExists("instructionHasAttributes", options);
      helper.ensureFlagExists("captureSpacesBetweenElements", options);
      helper.ensureAlwaysArrayExists(options);
      helper.ensureKeyExists("declaration", options);
      helper.ensureKeyExists("instruction", options);
      helper.ensureKeyExists("attributes", options);
      helper.ensureKeyExists("text", options);
      helper.ensureKeyExists("comment", options);
      helper.ensureKeyExists("cdata", options);
      helper.ensureKeyExists("doctype", options);
      helper.ensureKeyExists("type", options);
      helper.ensureKeyExists("name", options);
      helper.ensureKeyExists("elements", options);
      helper.ensureKeyExists("parent", options);
      helper.checkFnExists("doctype", options);
      helper.checkFnExists("instruction", options);
      helper.checkFnExists("cdata", options);
      helper.checkFnExists("comment", options);
      helper.checkFnExists("text", options);
      helper.checkFnExists("instructionName", options);
      helper.checkFnExists("elementName", options);
      helper.checkFnExists("attributeName", options);
      helper.checkFnExists("attributeValue", options);
      helper.checkFnExists("attributes", options);
      return options;
    }
    function nativeType2(value) {
      var nValue = Number(value);
      if (!isNaN(nValue)) {
        return nValue;
      }
      var bValue = value.toLowerCase();
      if (bValue === "true") {
        return true;
      } else if (bValue === "false") {
        return false;
      }
      return value;
    }
    function addField(type, value) {
      var key;
      if (options.compact) {
        if (!currentElement[options[type + "Key"]] && (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(options[type + "Key"]) !== -1 : options.alwaysArray)) {
          currentElement[options[type + "Key"]] = [];
        }
        if (currentElement[options[type + "Key"]] && !isArray(currentElement[options[type + "Key"]])) {
          currentElement[options[type + "Key"]] = [currentElement[options[type + "Key"]]];
        }
        if (type + "Fn" in options && typeof value === "string") {
          value = options[type + "Fn"](value, currentElement);
        }
        if (type === "instruction" && ("instructionFn" in options || "instructionNameFn" in options)) {
          for (key in value) {
            if (value.hasOwnProperty(key)) {
              if ("instructionFn" in options) {
                value[key] = options.instructionFn(value[key], key, currentElement);
              } else {
                var temp = value[key];
                delete value[key];
                value[options.instructionNameFn(key, temp, currentElement)] = temp;
              }
            }
          }
        }
        if (isArray(currentElement[options[type + "Key"]])) {
          currentElement[options[type + "Key"]].push(value);
        } else {
          currentElement[options[type + "Key"]] = value;
        }
      } else {
        if (!currentElement[options.elementsKey]) {
          currentElement[options.elementsKey] = [];
        }
        var element = {};
        element[options.typeKey] = type;
        if (type === "instruction") {
          for (key in value) {
            if (value.hasOwnProperty(key)) {
              break;
            }
          }
          element[options.nameKey] = "instructionNameFn" in options ? options.instructionNameFn(key, value, currentElement) : key;
          if (options.instructionHasAttributes) {
            element[options.attributesKey] = value[key][options.attributesKey];
            if ("instructionFn" in options) {
              element[options.attributesKey] = options.instructionFn(element[options.attributesKey], key, currentElement);
            }
          } else {
            if ("instructionFn" in options) {
              value[key] = options.instructionFn(value[key], key, currentElement);
            }
            element[options.instructionKey] = value[key];
          }
        } else {
          if (type + "Fn" in options) {
            value = options[type + "Fn"](value, currentElement);
          }
          element[options[type + "Key"]] = value;
        }
        if (options.addParent) {
          element[options.parentKey] = currentElement;
        }
        currentElement[options.elementsKey].push(element);
      }
    }
    function manipulateAttributes(attributes) {
      if ("attributesFn" in options && attributes) {
        attributes = options.attributesFn(attributes, currentElement);
      }
      if ((options.trim || "attributeValueFn" in options || "attributeNameFn" in options || options.nativeTypeAttributes) && attributes) {
        var key;
        for (key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            if (options.trim) attributes[key] = attributes[key].trim();
            if (options.nativeTypeAttributes) {
              attributes[key] = nativeType2(attributes[key]);
            }
            if ("attributeValueFn" in options) attributes[key] = options.attributeValueFn(attributes[key], key, currentElement);
            if ("attributeNameFn" in options) {
              var temp = attributes[key];
              delete attributes[key];
              attributes[options.attributeNameFn(key, attributes[key], currentElement)] = temp;
            }
          }
        }
      }
      return attributes;
    }
    function onInstruction(instruction) {
      var attributes = {};
      if (instruction.body && (instruction.name.toLowerCase() === "xml" || options.instructionHasAttributes)) {
        var attrsRegExp = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))\s*/g;
        var match;
        while ((match = attrsRegExp.exec(instruction.body)) !== null) {
          attributes[match[1]] = match[2] || match[3] || match[4];
        }
        attributes = manipulateAttributes(attributes);
      }
      if (instruction.name.toLowerCase() === "xml") {
        if (options.ignoreDeclaration) {
          return;
        }
        currentElement[options.declarationKey] = {};
        if (Object.keys(attributes).length) {
          currentElement[options.declarationKey][options.attributesKey] = attributes;
        }
        if (options.addParent) {
          currentElement[options.declarationKey][options.parentKey] = currentElement;
        }
      } else {
        if (options.ignoreInstruction) {
          return;
        }
        if (options.trim) {
          instruction.body = instruction.body.trim();
        }
        var value = {};
        if (options.instructionHasAttributes && Object.keys(attributes).length) {
          value[instruction.name] = {};
          value[instruction.name][options.attributesKey] = attributes;
        } else {
          value[instruction.name] = instruction.body;
        }
        addField("instruction", value);
      }
    }
    function onStartElement(name, attributes) {
      var element;
      if (typeof name === "object") {
        attributes = name.attributes;
        name = name.name;
      }
      attributes = manipulateAttributes(attributes);
      if ("elementNameFn" in options) {
        name = options.elementNameFn(name, currentElement);
      }
      if (options.compact) {
        element = {};
        if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
          element[options.attributesKey] = {};
          var key;
          for (key in attributes) {
            if (attributes.hasOwnProperty(key)) {
              element[options.attributesKey][key] = attributes[key];
            }
          }
        }
        if (!(name in currentElement) && (isArray(options.alwaysArray) ? options.alwaysArray.indexOf(name) !== -1 : options.alwaysArray)) {
          currentElement[name] = [];
        }
        if (currentElement[name] && !isArray(currentElement[name])) {
          currentElement[name] = [currentElement[name]];
        }
        if (isArray(currentElement[name])) {
          currentElement[name].push(element);
        } else {
          currentElement[name] = element;
        }
      } else {
        if (!currentElement[options.elementsKey]) {
          currentElement[options.elementsKey] = [];
        }
        element = {};
        element[options.typeKey] = "element";
        element[options.nameKey] = name;
        if (!options.ignoreAttributes && attributes && Object.keys(attributes).length) {
          element[options.attributesKey] = attributes;
        }
        if (options.alwaysChildren) {
          element[options.elementsKey] = [];
        }
        currentElement[options.elementsKey].push(element);
      }
      element[options.parentKey] = currentElement;
      currentElement = element;
    }
    function onText(text) {
      if (options.ignoreText) {
        return;
      }
      if (!text.trim() && !options.captureSpacesBetweenElements) {
        return;
      }
      if (options.trim) {
        text = text.trim();
      }
      if (options.nativeType) {
        text = nativeType2(text);
      }
      if (options.sanitize) {
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      addField("text", text);
    }
    function onComment(comment) {
      if (options.ignoreComment) {
        return;
      }
      if (options.trim) {
        comment = comment.trim();
      }
      addField("comment", comment);
    }
    function onEndElement(name) {
      var parentElement = currentElement[options.parentKey];
      if (!options.addParent) {
        delete currentElement[options.parentKey];
      }
      currentElement = parentElement;
    }
    function onCdata(cdata) {
      if (options.ignoreCdata) {
        return;
      }
      if (options.trim) {
        cdata = cdata.trim();
      }
      addField("cdata", cdata);
    }
    function onDoctype(doctype) {
      if (options.ignoreDoctype) {
        return;
      }
      doctype = doctype.replace(/^ /, "");
      if (options.trim) {
        doctype = doctype.trim();
      }
      addField("doctype", doctype);
    }
    function onError(error) {
      error.note = error;
    }
    module.exports = function(xml, userOptions) {
      var parser = pureJsParser ? sax.parser(true, {}) : parser = new expat.Parser("UTF-8");
      var result = {};
      currentElement = result;
      options = validateOptions(userOptions);
      if (pureJsParser) {
        parser.opt = { strictEntities: true };
        parser.onopentag = onStartElement;
        parser.ontext = onText;
        parser.oncomment = onComment;
        parser.onclosetag = onEndElement;
        parser.onerror = onError;
        parser.oncdata = onCdata;
        parser.ondoctype = onDoctype;
        parser.onprocessinginstruction = onInstruction;
      } else {
        parser.on("startElement", onStartElement);
        parser.on("text", onText);
        parser.on("comment", onComment);
        parser.on("endElement", onEndElement);
        parser.on("error", onError);
      }
      if (pureJsParser) {
        parser.write(xml).close();
      } else {
        if (!parser.parse(xml)) {
          throw new Error("XML parsing error: " + parser.getError());
        }
      }
      if (result[options.elementsKey]) {
        var temp = result[options.elementsKey];
        delete result[options.elementsKey];
        result[options.elementsKey] = temp;
        delete result.text;
      }
      return result;
    };
  }
});

// node_modules/xml-js/lib/xml2json.js
var require_xml2json = __commonJS({
  "node_modules/xml-js/lib/xml2json.js"(exports, module) {
    var helper = require_options_helper();
    var xml2js = require_xml2js();
    function validateOptions(userOptions) {
      var options = helper.copyOptions(userOptions);
      helper.ensureSpacesExists(options);
      return options;
    }
    module.exports = function(xml, userOptions) {
      var options, js, json, parentKey;
      options = validateOptions(userOptions);
      js = xml2js(xml, options);
      parentKey = "compact" in options && options.compact ? "_parent" : "parent";
      if ("addParent" in options && options.addParent) {
        json = JSON.stringify(js, function(k, v) {
          return k === parentKey ? "_" : v;
        }, options.spaces);
      } else {
        json = JSON.stringify(js, null, options.spaces);
      }
      return json.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    };
  }
});

// node_modules/xml-js/lib/js2xml.js
var require_js2xml = __commonJS({
  "node_modules/xml-js/lib/js2xml.js"(exports, module) {
    var helper = require_options_helper();
    var isArray = require_array_helper().isArray;
    var currentElement;
    var currentElementName;
    function validateOptions(userOptions) {
      var options = helper.copyOptions(userOptions);
      helper.ensureFlagExists("ignoreDeclaration", options);
      helper.ensureFlagExists("ignoreInstruction", options);
      helper.ensureFlagExists("ignoreAttributes", options);
      helper.ensureFlagExists("ignoreText", options);
      helper.ensureFlagExists("ignoreComment", options);
      helper.ensureFlagExists("ignoreCdata", options);
      helper.ensureFlagExists("ignoreDoctype", options);
      helper.ensureFlagExists("compact", options);
      helper.ensureFlagExists("indentText", options);
      helper.ensureFlagExists("indentCdata", options);
      helper.ensureFlagExists("indentAttributes", options);
      helper.ensureFlagExists("indentInstruction", options);
      helper.ensureFlagExists("fullTagEmptyElement", options);
      helper.ensureFlagExists("noQuotesForNativeAttributes", options);
      helper.ensureSpacesExists(options);
      if (typeof options.spaces === "number") {
        options.spaces = Array(options.spaces + 1).join(" ");
      }
      helper.ensureKeyExists("declaration", options);
      helper.ensureKeyExists("instruction", options);
      helper.ensureKeyExists("attributes", options);
      helper.ensureKeyExists("text", options);
      helper.ensureKeyExists("comment", options);
      helper.ensureKeyExists("cdata", options);
      helper.ensureKeyExists("doctype", options);
      helper.ensureKeyExists("type", options);
      helper.ensureKeyExists("name", options);
      helper.ensureKeyExists("elements", options);
      helper.checkFnExists("doctype", options);
      helper.checkFnExists("instruction", options);
      helper.checkFnExists("cdata", options);
      helper.checkFnExists("comment", options);
      helper.checkFnExists("text", options);
      helper.checkFnExists("instructionName", options);
      helper.checkFnExists("elementName", options);
      helper.checkFnExists("attributeName", options);
      helper.checkFnExists("attributeValue", options);
      helper.checkFnExists("attributes", options);
      helper.checkFnExists("fullTagEmptyElement", options);
      return options;
    }
    function writeIndentation(options, depth, firstLine) {
      return (!firstLine && options.spaces ? "\n" : "") + Array(depth + 1).join(options.spaces);
    }
    function writeAttributes(attributes, options, depth) {
      if (options.ignoreAttributes) {
        return "";
      }
      if ("attributesFn" in options) {
        attributes = options.attributesFn(attributes, currentElementName, currentElement);
      }
      var key, attr, attrName, quote, result = [];
      for (key in attributes) {
        if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== void 0) {
          quote = options.noQuotesForNativeAttributes && typeof attributes[key] !== "string" ? "" : '"';
          attr = "" + attributes[key];
          attr = attr.replace(/"/g, "&quot;");
          attrName = "attributeNameFn" in options ? options.attributeNameFn(key, attr, currentElementName, currentElement) : key;
          result.push(options.spaces && options.indentAttributes ? writeIndentation(options, depth + 1, false) : " ");
          result.push(attrName + "=" + quote + ("attributeValueFn" in options ? options.attributeValueFn(attr, key, currentElementName, currentElement) : attr) + quote);
        }
      }
      if (attributes && Object.keys(attributes).length && options.spaces && options.indentAttributes) {
        result.push(writeIndentation(options, depth, false));
      }
      return result.join("");
    }
    function writeDeclaration(declaration, options, depth) {
      currentElement = declaration;
      currentElementName = "xml";
      return options.ignoreDeclaration ? "" : "<?xml" + writeAttributes(declaration[options.attributesKey], options, depth) + "?>";
    }
    function writeInstruction(instruction, options, depth) {
      if (options.ignoreInstruction) {
        return "";
      }
      var key;
      for (key in instruction) {
        if (instruction.hasOwnProperty(key)) {
          break;
        }
      }
      var instructionName = "instructionNameFn" in options ? options.instructionNameFn(key, instruction[key], currentElementName, currentElement) : key;
      if (typeof instruction[key] === "object") {
        currentElement = instruction;
        currentElementName = instructionName;
        return "<?" + instructionName + writeAttributes(instruction[key][options.attributesKey], options, depth) + "?>";
      } else {
        var instructionValue = instruction[key] ? instruction[key] : "";
        if ("instructionFn" in options) instructionValue = options.instructionFn(instructionValue, key, currentElementName, currentElement);
        return "<?" + instructionName + (instructionValue ? " " + instructionValue : "") + "?>";
      }
    }
    function writeComment(comment, options) {
      return options.ignoreComment ? "" : "<!--" + ("commentFn" in options ? options.commentFn(comment, currentElementName, currentElement) : comment) + "-->";
    }
    function writeCdata(cdata, options) {
      return options.ignoreCdata ? "" : "<![CDATA[" + ("cdataFn" in options ? options.cdataFn(cdata, currentElementName, currentElement) : cdata.replace("]]>", "]]]]><![CDATA[>")) + "]]>";
    }
    function writeDoctype(doctype, options) {
      return options.ignoreDoctype ? "" : "<!DOCTYPE " + ("doctypeFn" in options ? options.doctypeFn(doctype, currentElementName, currentElement) : doctype) + ">";
    }
    function writeText(text, options) {
      if (options.ignoreText) return "";
      text = "" + text;
      text = text.replace(/&amp;/g, "&");
      text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return "textFn" in options ? options.textFn(text, currentElementName, currentElement) : text;
    }
    function hasContent(element, options) {
      var i;
      if (element.elements && element.elements.length) {
        for (i = 0; i < element.elements.length; ++i) {
          switch (element.elements[i][options.typeKey]) {
            case "text":
              if (options.indentText) {
                return true;
              }
              break;
            // skip to next key
            case "cdata":
              if (options.indentCdata) {
                return true;
              }
              break;
            // skip to next key
            case "instruction":
              if (options.indentInstruction) {
                return true;
              }
              break;
            // skip to next key
            case "doctype":
            case "comment":
            case "element":
              return true;
            default:
              return true;
          }
        }
      }
      return false;
    }
    function writeElement(element, options, depth) {
      currentElement = element;
      currentElementName = element.name;
      var xml = [], elementName = "elementNameFn" in options ? options.elementNameFn(element.name, element) : element.name;
      xml.push("<" + elementName);
      if (element[options.attributesKey]) {
        xml.push(writeAttributes(element[options.attributesKey], options, depth));
      }
      var withClosingTag = element[options.elementsKey] && element[options.elementsKey].length || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
      if (!withClosingTag) {
        if ("fullTagEmptyElementFn" in options) {
          withClosingTag = options.fullTagEmptyElementFn(element.name, element);
        } else {
          withClosingTag = options.fullTagEmptyElement;
        }
      }
      if (withClosingTag) {
        xml.push(">");
        if (element[options.elementsKey] && element[options.elementsKey].length) {
          xml.push(writeElements(element[options.elementsKey], options, depth + 1));
          currentElement = element;
          currentElementName = element.name;
        }
        xml.push(options.spaces && hasContent(element, options) ? "\n" + Array(depth + 1).join(options.spaces) : "");
        xml.push("</" + elementName + ">");
      } else {
        xml.push("/>");
      }
      return xml.join("");
    }
    function writeElements(elements, options, depth, firstLine) {
      return elements.reduce(function(xml, element) {
        var indent = writeIndentation(options, depth, firstLine && !xml);
        switch (element.type) {
          case "element":
            return xml + indent + writeElement(element, options, depth);
          case "comment":
            return xml + indent + writeComment(element[options.commentKey], options);
          case "doctype":
            return xml + indent + writeDoctype(element[options.doctypeKey], options);
          case "cdata":
            return xml + (options.indentCdata ? indent : "") + writeCdata(element[options.cdataKey], options);
          case "text":
            return xml + (options.indentText ? indent : "") + writeText(element[options.textKey], options);
          case "instruction":
            var instruction = {};
            instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
            return xml + (options.indentInstruction ? indent : "") + writeInstruction(instruction, options, depth);
        }
      }, "");
    }
    function hasContentCompact(element, options, anyContent) {
      var key;
      for (key in element) {
        if (element.hasOwnProperty(key)) {
          switch (key) {
            case options.parentKey:
            case options.attributesKey:
              break;
            // skip to next key
            case options.textKey:
              if (options.indentText || anyContent) {
                return true;
              }
              break;
            // skip to next key
            case options.cdataKey:
              if (options.indentCdata || anyContent) {
                return true;
              }
              break;
            // skip to next key
            case options.instructionKey:
              if (options.indentInstruction || anyContent) {
                return true;
              }
              break;
            // skip to next key
            case options.doctypeKey:
            case options.commentKey:
              return true;
            default:
              return true;
          }
        }
      }
      return false;
    }
    function writeElementCompact(element, name, options, depth, indent) {
      currentElement = element;
      currentElementName = name;
      var elementName = "elementNameFn" in options ? options.elementNameFn(name, element) : name;
      if (typeof element === "undefined" || element === null || element === "") {
        return "fullTagEmptyElementFn" in options && options.fullTagEmptyElementFn(name, element) || options.fullTagEmptyElement ? "<" + elementName + "></" + elementName + ">" : "<" + elementName + "/>";
      }
      var xml = [];
      if (name) {
        xml.push("<" + elementName);
        if (typeof element !== "object") {
          xml.push(">" + writeText(element, options) + "</" + elementName + ">");
          return xml.join("");
        }
        if (element[options.attributesKey]) {
          xml.push(writeAttributes(element[options.attributesKey], options, depth));
        }
        var withClosingTag = hasContentCompact(element, options, true) || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
        if (!withClosingTag) {
          if ("fullTagEmptyElementFn" in options) {
            withClosingTag = options.fullTagEmptyElementFn(name, element);
          } else {
            withClosingTag = options.fullTagEmptyElement;
          }
        }
        if (withClosingTag) {
          xml.push(">");
        } else {
          xml.push("/>");
          return xml.join("");
        }
      }
      xml.push(writeElementsCompact(element, options, depth + 1, false));
      currentElement = element;
      currentElementName = name;
      if (name) {
        xml.push((indent ? writeIndentation(options, depth, false) : "") + "</" + elementName + ">");
      }
      return xml.join("");
    }
    function writeElementsCompact(element, options, depth, firstLine) {
      var i, key, nodes, xml = [];
      for (key in element) {
        if (element.hasOwnProperty(key)) {
          nodes = isArray(element[key]) ? element[key] : [element[key]];
          for (i = 0; i < nodes.length; ++i) {
            switch (key) {
              case options.declarationKey:
                xml.push(writeDeclaration(nodes[i], options, depth));
                break;
              case options.instructionKey:
                xml.push((options.indentInstruction ? writeIndentation(options, depth, firstLine) : "") + writeInstruction(nodes[i], options, depth));
                break;
              case options.attributesKey:
              case options.parentKey:
                break;
              // skip
              case options.textKey:
                xml.push((options.indentText ? writeIndentation(options, depth, firstLine) : "") + writeText(nodes[i], options));
                break;
              case options.cdataKey:
                xml.push((options.indentCdata ? writeIndentation(options, depth, firstLine) : "") + writeCdata(nodes[i], options));
                break;
              case options.doctypeKey:
                xml.push(writeIndentation(options, depth, firstLine) + writeDoctype(nodes[i], options));
                break;
              case options.commentKey:
                xml.push(writeIndentation(options, depth, firstLine) + writeComment(nodes[i], options));
                break;
              default:
                xml.push(writeIndentation(options, depth, firstLine) + writeElementCompact(nodes[i], key, options, depth, hasContentCompact(nodes[i], options)));
            }
            firstLine = firstLine && !xml.length;
          }
        }
      }
      return xml.join("");
    }
    module.exports = function(js, options) {
      options = validateOptions(options);
      var xml = [];
      currentElement = js;
      currentElementName = "_root_";
      if (options.compact) {
        xml.push(writeElementsCompact(js, options, 0, true));
      } else {
        if (js[options.declarationKey]) {
          xml.push(writeDeclaration(js[options.declarationKey], options, 0));
        }
        if (js[options.elementsKey] && js[options.elementsKey].length) {
          xml.push(writeElements(js[options.elementsKey], options, 0, !xml.length));
        }
      }
      return xml.join("");
    };
  }
});

// node_modules/xml-js/lib/json2xml.js
var require_json2xml = __commonJS({
  "node_modules/xml-js/lib/json2xml.js"(exports, module) {
    var js2xml = require_js2xml();
    module.exports = function(json, options) {
      if (json instanceof Buffer) {
        json = json.toString();
      }
      var js = null;
      if (typeof json === "string") {
        try {
          js = JSON.parse(json);
        } catch (e) {
          throw new Error("The JSON structure is invalid");
        }
      } else {
        js = json;
      }
      return js2xml(js, options);
    };
  }
});

// node_modules/xml-js/lib/index.js
var require_lib = __commonJS({
  "node_modules/xml-js/lib/index.js"(exports, module) {
    var xml2js = require_xml2js();
    var xml2json = require_xml2json();
    var js2xml = require_js2xml();
    var json2xml = require_json2xml();
    module.exports = {
      xml2js,
      xml2json,
      js2xml,
      json2xml
    };
  }
});

// node_modules/base-64/base64.js
var require_base64 = __commonJS({
  "node_modules/base-64/base64.js"(exports, module) {
    (function(root) {
      var freeExports = typeof exports == "object" && exports;
      var freeModule = typeof module == "object" && module && module.exports == freeExports && module;
      var freeGlobal = typeof global == "object" && global;
      if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
        root = freeGlobal;
      }
      var InvalidCharacterError = function(message) {
        this.message = message;
      };
      InvalidCharacterError.prototype = new Error();
      InvalidCharacterError.prototype.name = "InvalidCharacterError";
      var error = function(message) {
        throw new InvalidCharacterError(message);
      };
      var TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;
      var decode = function(input) {
        input = String(input).replace(REGEX_SPACE_CHARACTERS, "");
        var length = input.length;
        if (length % 4 == 0) {
          input = input.replace(/==?$/, "");
          length = input.length;
        }
        if (length % 4 == 1 || // http://whatwg.org/C#alphanumeric-ascii-characters
        /[^+a-zA-Z0-9/]/.test(input)) {
          error(
            "Invalid character: the string to be decoded is not correctly encoded."
          );
        }
        var bitCounter = 0;
        var bitStorage;
        var buffer;
        var output = "";
        var position = -1;
        while (++position < length) {
          buffer = TABLE.indexOf(input.charAt(position));
          bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
          if (bitCounter++ % 4) {
            output += String.fromCharCode(
              255 & bitStorage >> (-2 * bitCounter & 6)
            );
          }
        }
        return output;
      };
      var encode2 = function(input) {
        input = String(input);
        if (/[^\0-\xFF]/.test(input)) {
          error(
            "The string to be encoded contains characters outside of the Latin1 range."
          );
        }
        var padding = input.length % 3;
        var output = "";
        var position = -1;
        var a;
        var b;
        var c;
        var buffer;
        var length = input.length - padding;
        while (++position < length) {
          a = input.charCodeAt(position) << 16;
          b = input.charCodeAt(++position) << 8;
          c = input.charCodeAt(++position);
          buffer = a + b + c;
          output += TABLE.charAt(buffer >> 18 & 63) + TABLE.charAt(buffer >> 12 & 63) + TABLE.charAt(buffer >> 6 & 63) + TABLE.charAt(buffer & 63);
        }
        if (padding == 2) {
          a = input.charCodeAt(position) << 8;
          b = input.charCodeAt(++position);
          buffer = a + b;
          output += TABLE.charAt(buffer >> 10) + TABLE.charAt(buffer >> 4 & 63) + TABLE.charAt(buffer << 2 & 63) + "=";
        } else if (padding == 1) {
          buffer = input.charCodeAt(position);
          output += TABLE.charAt(buffer >> 2) + TABLE.charAt(buffer << 4 & 63) + "==";
        }
        return output;
      };
      var base642 = {
        "encode": encode2,
        "decode": decode,
        "version": "1.0.0"
      };
      if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
        define(function() {
          return base642;
        });
      } else if (freeExports && !freeExports.nodeType) {
        if (freeModule) {
          freeModule.exports = base642;
        } else {
          for (var key in base642) {
            base642.hasOwnProperty(key) && (freeExports[key] = base642[key]);
          }
        }
      } else {
        root.base64 = base642;
      }
    })(exports);
  }
});

// plugins-pack/tasks/lib/crypto.ts
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
var ALGO = "aes-256-gcm";
var IV_LEN = 12;
var KEY_LEN = 32;
var TAG_LEN = 16;
var cachedKey = null;
function resolveAppDataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join(process.cwd(), "data");
}
function deriveKey(material) {
  return scryptSync(material, "selfdashboard.calendar.v1", KEY_LEN);
}
function loadOrCreateKey() {
  if (cachedKey) return cachedKey;
  const envKey = process.env.SELFDASHBOARD_CALENDAR_KEY?.trim();
  if (envKey) {
    cachedKey = deriveKey(envKey);
    return cachedKey;
  }
  const keyFile = join(resolveAppDataDir(), ".calendar-key");
  if (existsSync(keyFile)) {
    cachedKey = deriveKey(readFileSync(keyFile, "utf8").trim());
    return cachedKey;
  }
  const fresh = randomBytes(32).toString("base64");
  writeFileSync(keyFile, fresh, "utf8");
  try {
    chmodSync(keyFile, 384);
  } catch {
  }
  cachedKey = deriveKey(fresh);
  return cachedKey;
}
function encrypt(plaintext) {
  if (!plaintext) return "";
  const key = loadOrCreateKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}
function decrypt(payload) {
  if (!payload) return "";
  const key = loadOrCreateKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("encrypted payload too short");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const enc = buf.subarray(IV_LEN, buf.length - TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// plugins-pack/tasks/lib/store.ts
import {
  existsSync as existsSync2,
  mkdirSync,
  readdirSync,
  readFileSync as readFileSync2,
  renameSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { join as join2 } from "node:path";

// plugins-pack/tasks/lib/types.ts
var STORE_VERSION = 2;
var EMPTY_STORE = {
  version: STORE_VERSION,
  accounts: [],
  lists: [],
  tasks: [],
  syncLog: []
};
function isCalDavConfig(config) {
  return "url" in config && "passwordEncrypted" in config;
}
function isGoogleConfig(config) {
  return "clientSecretEncrypted" in config && !("url" in config) && !("tenantId" in config);
}
function isMicrosoftConfig(config) {
  return "clientSecretEncrypted" in config && !("url" in config) && "tenantId" in config;
}
function isOAuthProvider(provider) {
  return provider === "google" || provider === "microsoft";
}
function normalizeAccount(account2) {
  if (account2.provider && account2.config) return account2;
  const legacy = account2;
  return {
    ...legacy,
    provider: "caldav",
    config: legacy.config
  };
}

// plugins-pack/tasks/lib/store.ts
function resolveAppDataDir2() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join2(process.cwd(), "data");
}
function ensureDir(dir) {
  if (!existsSync2(dir)) mkdirSync(dir, { recursive: true });
}
function usersDataDir() {
  return join2(resolveAppDataDir2(), "users");
}
function userStorePath(userId) {
  return join2(usersDataDir(), userId, "tasks", "store.json");
}
var chain = Promise.resolve();
function withLock(fn) {
  const next = chain.then(fn);
  chain = next.catch(() => void 0);
  return next;
}
function readSyncFromPath(path) {
  if (!existsSync2(path)) return structuredClone(EMPTY_STORE);
  try {
    const raw = readFileSync2(path, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: (parsed.accounts ?? []).map((a) => normalizeAccount(a)),
      lists: parsed.lists ?? [],
      tasks: parsed.tasks ?? [],
      syncLog: parsed.syncLog ?? []
    };
  } catch {
    try {
      renameSync(path, path + ".corrupt-" + Date.now());
    } catch {
    }
    return structuredClone(EMPTY_STORE);
  }
}
function writeSyncToPath(path, store) {
  ensureDir(join2(path, ".."));
  const tmp = path + ".tmp";
  writeFileSync2(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, path);
}
function listTasksOwnerUserIds() {
  const root = usersDataDir();
  if (!existsSync2(root)) return [];
  const ids = [];
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (existsSync2(userStorePath(ent.name))) ids.push(ent.name);
  }
  return ids;
}
async function readUserStore(userId) {
  return withLock(() => structuredClone(readSyncFromPath(userStorePath(userId))));
}
async function mutateUserStore(userId, fn) {
  return withLock(async () => {
    const path = userStorePath(userId);
    const store = readSyncFromPath(path);
    const result = await fn(store);
    writeSyncToPath(path, store);
    return result;
  });
}
async function findAccountOwnerUserId(accountId) {
  for (const userId of listTasksOwnerUserIds()) {
    const store = await readUserStore(userId);
    if (store.accounts.some((a) => a.id === accountId)) return userId;
  }
  return null;
}
function newId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rand}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}

// plugins-pack/tasks/lib/api-helpers.ts
function toAccountView(a, lists) {
  const base = {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    listCount: lists.filter((l) => l.accountId === a.id).length
  };
  if (a.provider === "google" && isGoogleConfig(a.config)) {
    return {
      ...base,
      endpoint: "Google Tasks",
      googleConnected: Boolean(a.config.refreshTokenEncrypted),
      googleClientId: a.config.clientId
    };
  }
  if (a.provider === "microsoft" && isMicrosoftConfig(a.config)) {
    return {
      ...base,
      endpoint: "Microsoft To Do",
      microsoftConnected: Boolean(a.config.refreshTokenEncrypted),
      microsoftClientId: a.config.clientId,
      microsoftTenantId: a.config.tenantId
    };
  }
  if (isCalDavConfig(a.config)) {
    let endpoint = "";
    try {
      endpoint = new URL(a.config.url).host;
    } catch {
      endpoint = a.config.url;
    }
    return {
      ...base,
      endpoint,
      url: a.config.url,
      username: a.config.username
    };
  }
  return base;
}
function buildAccount(body, ownerUserId) {
  const provider = body.provider ?? (body.microsoft ? "microsoft" : body.google ? "google" : "caldav");
  if (provider === "google") {
    const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim();
    const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim();
    const clientId = body.google?.clientId?.trim() || envId || "";
    const clientSecret = body.google?.clientSecret || envSecret || "";
    if (!clientId || !clientSecret) {
      throw new Error("Google Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)");
    }
    const config = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret)
    };
    return {
      id: newId("acc"),
      name: body.name.trim() || "Google Tasks",
      provider: "google",
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId
    };
  }
  if (provider === "microsoft") {
    const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim();
    const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim();
    const clientId = body.microsoft?.clientId?.trim() || envId || "";
    const clientSecret = body.microsoft?.clientSecret || envSecret || "";
    if (!clientId || !clientSecret) {
      throw new Error("Microsoft Client-ID und Client-Secret erforderlich (oder Env-Variablen setzen)");
    }
    const config = {
      clientId,
      clientSecretEncrypted: encrypt(clientSecret),
      tenantId: body.microsoft?.tenantId?.trim() || "common"
    };
    return {
      id: newId("acc"),
      name: body.name.trim() || "Microsoft To Do",
      provider: "microsoft",
      config,
      enabled: true,
      createdAt: nowIso(),
      ownerUserId
    };
  }
  if (!body.caldav?.url || !body.caldav.username || !body.caldav.password) {
    throw new Error("CalDAV URL, Benutzername und Passwort erforderlich");
  }
  return {
    id: newId("acc"),
    name: body.name.trim() || "CalDAV",
    provider: "caldav",
    config: {
      url: body.caldav.url.trim(),
      username: body.caldav.username.trim(),
      passwordEncrypted: encrypt(body.caldav.password),
      verifySsl: body.caldav.verifySsl !== false
    },
    enabled: true,
    createdAt: nowIso(),
    ownerUserId
  };
}
function applyAccountUpdate(a, body) {
  if (body.name?.trim()) a.name = body.name.trim();
  if (typeof body.enabled === "boolean") a.enabled = body.enabled;
  if (a.provider === "caldav" && body.caldav && isCalDavConfig(a.config)) {
    if (body.caldav.url?.trim()) a.config.url = body.caldav.url.trim();
    if (body.caldav.username?.trim()) a.config.username = body.caldav.username.trim();
    if (body.caldav.password) a.config.passwordEncrypted = encrypt(body.caldav.password);
    if (typeof body.caldav.verifySsl === "boolean") a.config.verifySsl = body.caldav.verifySsl;
  }
  if (a.provider === "google" && body.google && isGoogleConfig(a.config)) {
    if (body.google.clientId?.trim()) a.config.clientId = body.google.clientId.trim();
    if (body.google.clientSecret) a.config.clientSecretEncrypted = encrypt(body.google.clientSecret);
  }
  if (a.provider === "microsoft" && body.microsoft && isMicrosoftConfig(a.config)) {
    if (body.microsoft.clientId?.trim()) a.config.clientId = body.microsoft.clientId.trim();
    if (body.microsoft.clientSecret) a.config.clientSecretEncrypted = encrypt(body.microsoft.clientSecret);
    if (body.microsoft.tenantId?.trim()) a.config.tenantId = body.microsoft.tenantId.trim();
  }
}
function buildSummary(store) {
  const visibleLists = store.lists.filter((l) => l.visible);
  const visibleIds = new Set(visibleLists.map((l) => l.id));
  const active = store.tasks.filter((t) => visibleIds.has(t.listId) && t.syncState !== "local_deleted");
  const open = active.filter((t) => !t.completed).length;
  const completed = active.filter((t) => t.completed).length;
  const pendingSync = active.filter(
    (t) => t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted"
  ).length;
  const lists = visibleLists.map((l) => ({
    id: l.id,
    name: l.name,
    open: active.filter((t) => t.listId === l.id && !t.completed).length
  }));
  return { open, completed, pendingSync, lists };
}
function taskToView(t, list) {
  return {
    id: t.id,
    listId: t.listId,
    listName: list?.name,
    uid: t.uid,
    summary: t.summary,
    completed: t.completed,
    due: t.due,
    syncState: t.syncState,
    readOnly: list?.readOnly ?? false
  };
}
function ok(data, status = 200) {
  return Response.json(data, { status });
}
function badRequest(msg) {
  return Response.json({ error: msg }, { status: 400 });
}
function forbidden(msg) {
  return Response.json({ error: msg }, { status: 403 });
}
function notFound(msg) {
  return Response.json({ error: msg }, { status: 404 });
}
function html(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// plugins-pack/tasks/lib/google.ts
var TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";
var GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
var TASKS_API = "https://tasks.googleapis.com/tasks/v1";
var emptyResult = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function cfg(account2) {
  if (account2.provider !== "google" || !isGoogleConfig(account2.config)) {
    throw new Error("not a google account");
  }
  return account2.config;
}
function resolveGoogleClientCredentials(config) {
  const envId = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_ID?.trim();
  const envSecret = process.env.SELFDASHBOARD_GOOGLE_TASKS_CLIENT_SECRET?.trim();
  const clientId = config.clientId?.trim() || envId || "";
  let clientSecret = "";
  if (config.clientSecretEncrypted) {
    try {
      clientSecret = decrypt(config.clientSecretEncrypted);
    } catch {
      clientSecret = "";
    }
  }
  if (!clientSecret && envSecret) clientSecret = envSecret;
  if (!clientId || !clientSecret) {
    throw new Error("Google Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_GOOGLE_TASKS_*)");
  }
  return { clientId, clientSecret };
}
function googleRedirectUri(req) {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim();
  if (env) return `${env.replace(/\/+$/, "")}/api/plugins/tasks/google/callback`;
  return `${new URL(req.url).origin}/api/plugins/tasks/google/callback`;
}
function buildGoogleAuthUrl(req, account2, state) {
  const { clientId } = resolveGoogleClientCredentials(cfg(account2));
  const redirectUri = googleRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: TASKS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}
async function tokenRequest(body) {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString()
  });
  return res.json();
}
async function exchangeGoogleCode(account2, code, redirectUri) {
  const { clientId, clientSecret } = resolveGoogleClientCredentials(cfg(account2));
  const json = await tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token exchange failed");
  }
  if (!json.refresh_token) {
    throw new Error("Kein Refresh-Token \u2014 Google-Konto erneut verbinden (prompt=consent).");
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString();
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
}
async function refreshGoogleAccessToken(account2) {
  const c = cfg(account2);
  const { clientId, clientSecret } = resolveGoogleClientCredentials(c);
  if (!c.refreshTokenEncrypted) throw new Error("Google nicht verbunden");
  const refreshToken = decrypt(c.refreshTokenEncrypted);
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString()
  };
}
async function ensureGoogleAccessToken(account2) {
  const c = cfg(account2);
  if (c.accessTokenEncrypted && c.accessTokenExpiresAt && new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 6e4) {
    return decrypt(c.accessTokenEncrypted);
  }
  const fresh = await refreshGoogleAccessToken(account2);
  c.accessTokenEncrypted = encrypt(fresh.accessToken);
  c.accessTokenExpiresAt = fresh.expiresAt;
  return fresh.accessToken;
}
function applyGoogleTokens(account2, tokens) {
  const c = cfg(account2);
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken);
  c.accessTokenEncrypted = encrypt(tokens.accessToken);
  c.accessTokenExpiresAt = tokens.expiresAt;
}
async function googleFetch(account2, path, init) {
  const token = await ensureGoogleAccessToken(account2);
  const url = path.startsWith("http") ? path : `${TASKS_API}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers
    }
  });
}
async function testGoogleAccount(account2) {
  try {
    if (!cfg(account2).refreshTokenEncrypted) {
      return { ok: false, error: "Google noch nicht verbunden \u2014 \u201EMit Google verbinden\u201C klicken." };
    }
    const lists = await discoverGoogleTaskLists(account2);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function discoverGoogleTaskLists(account2) {
  const res = await googleFetch(account2, "/users/@me/lists");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return (json.items ?? []).filter((l) => l.id).map((l) => ({ remoteId: l.id, name: l.title?.trim() || l.id, readOnly: false }));
}
function googleUid(taskId) {
  return `google-${taskId}`;
}
function parseGoogleDue(due) {
  if (!due) return void 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(due)) return due.slice(0, 10);
  return due;
}
async function syncGoogleTaskList(account2, list, store, pushOnly = false) {
  const pull = pushOnly ? emptyResult() : await pullGoogleList(account2, list, store);
  const push = await pushGoogleList(account2, list, store);
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors]
  };
}
async function pullGoogleList(account2, list, store) {
  const result = emptyResult();
  const res = await googleFetch(
    account2,
    `/lists/${encodeURIComponent(list.remoteId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`
  );
  const json = await res.json();
  if (!res.ok) {
    result.errors.push(json.error?.message || `HTTP ${res.status}`);
    return result;
  }
  for (const remote of json.items ?? []) {
    if (!remote.id) continue;
    const uid = googleUid(remote.id);
    const completed = remote.status === "completed";
    const summary = remote.title?.trim() || "\u2014";
    const etag = remote.updated || "";
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${uid}`,
        listId: list.id,
        uid,
        remoteHref: remote.id,
        remoteEtag: etag,
        icalData: "",
        summary,
        completed,
        due: parseGoogleDue(remote.due),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.updated,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== etag) {
        local.syncState = "conflict";
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== etag) {
      local.summary = summary;
      local.completed = completed;
      local.due = parseGoogleDue(remote.due);
      local.remoteHref = remote.id;
      local.remoteEtag = etag;
      local.remoteModifiedAt = remote.updated;
      local.syncState = "synced";
      result.updated++;
    }
  }
  return result;
}
async function pushGoogleList(account2, list, store) {
  const result = emptyResult();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          const res = await googleFetch(
            account2,
            `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
            { method: "DELETE" }
          );
          if (!res.ok && res.status !== 404) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error?.message || `HTTP ${res.status}`);
          }
        }
        store.tasks = store.tasks.filter((t) => t.id !== task.id);
        result.deleted++;
        continue;
      }
      const body = {
        title: task.summary,
        status: task.completed ? "completed" : "needsAction"
      };
      if (task.due) {
        body.due = /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? `${task.due}T00:00:00.000Z` : task.due;
      }
      if (task.syncState === "local_new") {
        const res = await googleFetch(account2, `/lists/${encodeURIComponent(list.remoteId)}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const json = await res.json();
        if (!res.ok || !json.id) throw new Error(json.error?.message || `HTTP ${res.status}`);
        task.uid = googleUid(json.id);
        task.remoteHref = json.id;
        task.remoteEtag = json.updated || nowIso();
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified" && task.remoteHref) {
        const res = await googleFetch(
          account2,
          `/lists/${encodeURIComponent(list.remoteId)}/tasks/${encodeURIComponent(task.remoteHref)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
        task.remoteEtag = json.updated || nowIso();
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return result;
}

// plugins-pack/tasks/lib/microsoft.ts
var SCOPES = "Tasks.ReadWrite offline_access";
var GRAPH = "https://graph.microsoft.com/v1.0";
var emptyResult2 = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function cfg2(account2) {
  if (account2.provider !== "microsoft" || !isMicrosoftConfig(account2.config)) {
    throw new Error("not a microsoft account");
  }
  return account2.config;
}
function tenantId(config) {
  return config.tenantId?.trim() || "common";
}
function authBase(config) {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId(config))}/oauth2/v2.0`;
}
function resolveMicrosoftClientCredentials(config) {
  const envId = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_ID?.trim();
  const envSecret = process.env.SELFDASHBOARD_MICROSOFT_TASKS_CLIENT_SECRET?.trim();
  const clientId = config.clientId?.trim() || envId || "";
  let clientSecret = "";
  if (config.clientSecretEncrypted) {
    try {
      clientSecret = decrypt(config.clientSecretEncrypted);
    } catch {
      clientSecret = "";
    }
  }
  if (!clientSecret && envSecret) clientSecret = envSecret;
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft Client-ID und Client-Secret fehlen (Widget oder SELFDASHBOARD_MICROSOFT_TASKS_*)");
  }
  return { clientId, clientSecret };
}
function microsoftRedirectUri(req) {
  const env = process.env.SELFDASHBOARD_PUBLIC_URL?.trim();
  if (env) return `${env.replace(/\/+$/, "")}/api/plugins/tasks/microsoft/callback`;
  return `${new URL(req.url).origin}/api/plugins/tasks/microsoft/callback`;
}
function buildMicrosoftAuthUrl(req, account2, state) {
  const c = cfg2(account2);
  const { clientId } = resolveMicrosoftClientCredentials(c);
  const redirectUri = microsoftRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    response_mode: "query",
    state,
    prompt: "consent"
  });
  return `${authBase(c)}/authorize?${params.toString()}`;
}
async function tokenRequest2(config, body) {
  const { clientId, clientSecret } = resolveMicrosoftClientCredentials(config);
  const res = await fetch(`${authBase(config)}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: clientId, client_secret: clientSecret }).toString()
  });
  return res.json();
}
async function exchangeMicrosoftCode(account2, code, redirectUri) {
  const c = cfg2(account2);
  const json = await tokenRequest2(c, {
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token exchange failed");
  }
  if (!json.refresh_token) {
    throw new Error("Kein Refresh-Token \u2014 Microsoft-Konto erneut verbinden (offline_access).");
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString();
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt };
}
async function refreshMicrosoftAccessToken(account2) {
  const c = cfg2(account2);
  if (!c.refreshTokenEncrypted) throw new Error("Microsoft nicht verbunden");
  const refreshToken = decrypt(c.refreshTokenEncrypted);
  const json = await tokenRequest2(c, {
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPES
  });
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || "token refresh failed");
  }
  return {
    accessToken: json.access_token,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1e3).toISOString()
  };
}
async function ensureMicrosoftAccessToken(account2) {
  const c = cfg2(account2);
  if (c.accessTokenEncrypted && c.accessTokenExpiresAt && new Date(c.accessTokenExpiresAt).getTime() > Date.now() + 6e4) {
    return decrypt(c.accessTokenEncrypted);
  }
  const fresh = await refreshMicrosoftAccessToken(account2);
  c.accessTokenEncrypted = encrypt(fresh.accessToken);
  c.accessTokenExpiresAt = fresh.expiresAt;
  return fresh.accessToken;
}
function applyMicrosoftTokens(account2, tokens) {
  const c = cfg2(account2);
  c.refreshTokenEncrypted = encrypt(tokens.refreshToken);
  c.accessTokenEncrypted = encrypt(tokens.accessToken);
  c.accessTokenExpiresAt = tokens.expiresAt;
}
async function graphFetch(account2, path, init) {
  const token = await ensureMicrosoftAccessToken(account2);
  const url = path.startsWith("http") ? path : `${GRAPH}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...init?.headers
    }
  });
}
async function graphJson(account2, path, init) {
  const res = await graphFetch(account2, path, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}
async function fetchAllPages(account2, path) {
  const out = [];
  let next = path.startsWith("http") ? path : `${GRAPH}${path}`;
  while (next) {
    const json = await graphJson(account2, next);
    out.push(...json.value ?? []);
    next = json["@odata.nextLink"];
  }
  return out;
}
async function testMicrosoftAccount(account2) {
  try {
    if (!cfg2(account2).refreshTokenEncrypted) {
      return { ok: false, error: "Microsoft noch nicht verbunden \u2014 \u201EMit Microsoft verbinden\u201C klicken." };
    }
    const lists = await discoverMicrosoftTaskLists(account2);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function discoverMicrosoftTaskLists(account2) {
  const lists = await fetchAllPages(account2, "/me/todo/lists");
  return lists.filter((l) => l.id).map((l) => ({
    remoteId: l.id,
    name: l.displayName?.trim() || l.id,
    readOnly: l.isOwner === false
  }));
}
function msUid(taskId) {
  return `microsoft-${taskId}`;
}
function parseMsDue(due) {
  if (!due?.dateTime) return void 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(due.dateTime)) return due.dateTime.slice(0, 10);
  return due.dateTime;
}
function msDueBody(due) {
  if (!due) return {};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(due) ? `${due}T00:00:00.0000000` : due;
  return { dueDateTime: { dateTime: date, timeZone: "UTC" } };
}
async function syncMicrosoftTaskList(account2, list, store, pushOnly = false) {
  const pull = pushOnly ? emptyResult2() : await pullMicrosoftList(account2, list, store);
  const push = await pushMicrosoftList(account2, list, store);
  return {
    added: pull.added + push.added,
    updated: pull.updated + push.updated,
    deleted: pull.deleted + push.deleted,
    conflicts: pull.conflicts + push.conflicts,
    errors: [...pull.errors, ...push.errors]
  };
}
async function pullMicrosoftList(account2, list, store) {
  const result = emptyResult2();
  let remotes;
  try {
    remotes = await fetchAllPages(
      account2,
      `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks?$top=100`
    );
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
    return result;
  }
  for (const remote of remotes) {
    if (!remote.id) continue;
    const uid = msUid(remote.id);
    const completed = remote.status === "completed";
    const summary = remote.title?.trim() || "\u2014";
    const etag = remote.lastModifiedDateTime || "";
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${uid}`,
        listId: list.id,
        uid,
        remoteHref: remote.id,
        remoteEtag: etag,
        icalData: "",
        summary,
        completed,
        due: parseMsDue(remote.dueDateTime),
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.lastModifiedDateTime,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== etag) {
        local.syncState = "conflict";
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== etag) {
      local.summary = summary;
      local.completed = completed;
      local.due = parseMsDue(remote.dueDateTime);
      local.remoteHref = remote.id;
      local.remoteEtag = etag;
      local.remoteModifiedAt = remote.lastModifiedDateTime;
      local.syncState = "synced";
      result.updated++;
    }
  }
  return result;
}
async function pushMicrosoftList(account2, list, store) {
  const result = emptyResult2();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  const listPath = `/me/todo/lists/${encodeURIComponent(list.remoteId)}/tasks`;
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          const res = await graphFetch(
            account2,
            `${listPath}/${encodeURIComponent(task.remoteHref)}`,
            { method: "DELETE" }
          );
          if (!res.ok && res.status !== 404) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error?.message || `HTTP ${res.status}`);
          }
        }
        store.tasks = store.tasks.filter((t) => t.id !== task.id);
        result.deleted++;
        continue;
      }
      const body = {
        title: task.summary,
        status: task.completed ? "completed" : "notStarted",
        ...msDueBody(task.due)
      };
      if (task.syncState === "local_new") {
        const json = await graphJson(account2, listPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!json.id) throw new Error("create failed");
        task.uid = msUid(json.id);
        task.remoteHref = json.id;
        task.remoteEtag = json.lastModifiedDateTime || nowIso();
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified" && task.remoteHref) {
        const json = await graphJson(
          account2,
          `${listPath}/${encodeURIComponent(task.remoteHref)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        task.remoteEtag = json.lastModifiedDateTime || nowIso();
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return result;
}

// plugins-pack/tasks/lib/oauth-pending.ts
import { randomBytes as randomBytes2 } from "node:crypto";
var pending = /* @__PURE__ */ new Map();
var TTL_MS = 15 * 60 * 1e3;
function createOAuthState(userId, accountId) {
  const state = randomBytes2(24).toString("hex");
  pending.set(state, { userId, accountId, expiresAt: Date.now() + TTL_MS });
  return state;
}
function consumeOAuthState(state) {
  const row = pending.get(state);
  if (!row) return null;
  pending.delete(state);
  if (row.expiresAt < Date.now()) return null;
  return row;
}

// node_modules/ical.js/dist/ical.js
var Binary = class _Binary {
  /**
   * Creates a binary value from the given string.
   *
   * @param {String} aString        The binary value string
   * @return {Binary}               The binary value instance
   */
  static fromString(aString) {
    return new _Binary(aString);
  }
  /**
   * Creates a new ICAL.Binary instance
   *
   * @param {String} aValue     The binary data for this value
   */
  constructor(aValue) {
    this.value = aValue;
  }
  /**
   * The type name, to be used in the jCal object.
   * @default "binary"
   * @constant
   */
  icaltype = "binary";
  /**
   * Base64 decode the current value
   *
   * @return {String}         The base64-decoded value
   */
  decodeValue() {
    return this._b64_decode(this.value);
  }
  /**
   * Encodes the passed parameter with base64 and sets the internal
   * value to the result.
   *
   * @param {String} aValue      The raw binary value to encode
   */
  setEncodedValue(aValue) {
    this.value = this._b64_encode(aValue);
  }
  _b64_encode(data) {
    let b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "", tmp_arr = [];
    if (!data) {
      return data;
    }
    do {
      o1 = data.charCodeAt(i++);
      o2 = data.charCodeAt(i++);
      o3 = data.charCodeAt(i++);
      bits = o1 << 16 | o2 << 8 | o3;
      h1 = bits >> 18 & 63;
      h2 = bits >> 12 & 63;
      h3 = bits >> 6 & 63;
      h4 = bits & 63;
      tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);
    enc = tmp_arr.join("");
    let r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + "===".slice(r || 3);
  }
  _b64_decode(data) {
    let b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];
    if (!data) {
      return data;
    }
    data += "";
    do {
      h1 = b64.indexOf(data.charAt(i++));
      h2 = b64.indexOf(data.charAt(i++));
      h3 = b64.indexOf(data.charAt(i++));
      h4 = b64.indexOf(data.charAt(i++));
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
      o1 = bits >> 16 & 255;
      o2 = bits >> 8 & 255;
      o3 = bits & 255;
      if (h3 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1);
      } else if (h4 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1, o2);
      } else {
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
      }
    } while (i < data.length);
    dec = tmp_arr.join("");
    return dec;
  }
  /**
   * The string representation of this value
   * @return {String}
   */
  toString() {
    return this.value;
  }
};
var DURATION_LETTERS = /([PDWHMTS]{1,1})/;
var DATA_PROPS_TO_COPY = ["weeks", "days", "hours", "minutes", "seconds", "isNegative"];
var Duration = class _Duration {
  /**
   * Returns a new ICAL.Duration instance from the passed seconds value.
   *
   * @param {Number} aSeconds       The seconds to create the instance from
   * @return {Duration}             The newly created duration instance
   */
  static fromSeconds(aSeconds) {
    return new _Duration().fromSeconds(aSeconds);
  }
  /**
   * Checks if the given string is an iCalendar duration value.
   *
   * @param {String} value      The raw ical value
   * @return {Boolean}          True, if the given value is of the
   *                              duration ical type
   */
  static isValueString(string) {
    return string[0] === "P" || string[1] === "P";
  }
  /**
   * Creates a new {@link ICAL.Duration} instance from the passed string.
   *
   * @param {String} aStr       The string to parse
   * @return {Duration}         The created duration instance
   */
  static fromString(aStr) {
    let pos = 0;
    let dict = /* @__PURE__ */ Object.create(null);
    let chunks = 0;
    while ((pos = aStr.search(DURATION_LETTERS)) !== -1) {
      let type = aStr[pos];
      let numeric = aStr.slice(0, Math.max(0, pos));
      aStr = aStr.slice(pos + 1);
      chunks += parseDurationChunk(type, numeric, dict);
    }
    if (chunks < 2) {
      throw new Error(
        'invalid duration value: Not enough duration components in "' + aStr + '"'
      );
    }
    return new _Duration(dict);
  }
  /**
   * Creates a new ICAL.Duration instance from the given data object.
   *
   * @param {Object} aData                An object with members of the duration
   * @param {Number=} aData.weeks         Duration in weeks
   * @param {Number=} aData.days          Duration in days
   * @param {Number=} aData.hours         Duration in hours
   * @param {Number=} aData.minutes       Duration in minutes
   * @param {Number=} aData.seconds       Duration in seconds
   * @param {Boolean=} aData.isNegative   If true, the duration is negative
   * @return {Duration}                   The createad duration instance
   */
  static fromData(aData) {
    return new _Duration(aData);
  }
  /**
   * Creates a new ICAL.Duration instance.
   *
   * @param {Object} data                 An object with members of the duration
   * @param {Number=} data.weeks          Duration in weeks
   * @param {Number=} data.days           Duration in days
   * @param {Number=} data.hours          Duration in hours
   * @param {Number=} data.minutes        Duration in minutes
   * @param {Number=} data.seconds        Duration in seconds
   * @param {Boolean=} data.isNegative    If true, the duration is negative
   */
  constructor(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  }
  /**
   * The weeks in this duration
   * @type {Number}
   * @default 0
   */
  weeks = 0;
  /**
   * The days in this duration
   * @type {Number}
   * @default 0
   */
  days = 0;
  /**
   * The days in this duration
   * @type {Number}
   * @default 0
   */
  hours = 0;
  /**
   * The minutes in this duration
   * @type {Number}
   * @default 0
   */
  minutes = 0;
  /**
   * The seconds in this duration
   * @type {Number}
   * @default 0
   */
  seconds = 0;
  /**
   * The seconds in this duration
   * @type {Boolean}
   * @default false
   */
  isNegative = false;
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icalduration"
   */
  icalclass = "icalduration";
  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "duration"
   */
  icaltype = "duration";
  /**
   * Returns a clone of the duration object.
   *
   * @return {Duration}      The cloned object
   */
  clone() {
    return _Duration.fromData(this);
  }
  /**
   * The duration value expressed as a number of seconds.
   *
   * @return {Number}             The duration value in seconds
   */
  toSeconds() {
    let seconds = this.seconds + 60 * this.minutes + 3600 * this.hours + 86400 * this.days + 7 * 86400 * this.weeks;
    return this.isNegative ? -seconds : seconds;
  }
  /**
   * Reads the passed seconds value into this duration object. Afterwards,
   * members like {@link ICAL.Duration#days days} and {@link ICAL.Duration#weeks weeks} will be set up
   * accordingly.
   *
   * @param {Number} aSeconds     The duration value in seconds
   * @return {Duration}           Returns this instance
   */
  fromSeconds(aSeconds) {
    let secs = Math.abs(aSeconds);
    this.isNegative = aSeconds < 0;
    this.days = trunc(secs / 86400);
    if (this.days % 7 == 0) {
      this.weeks = this.days / 7;
      this.days = 0;
    } else {
      this.weeks = 0;
    }
    secs -= (this.days + 7 * this.weeks) * 86400;
    this.hours = trunc(secs / 3600);
    secs -= this.hours * 3600;
    this.minutes = trunc(secs / 60);
    secs -= this.minutes * 60;
    this.seconds = secs;
    return this;
  }
  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Object} aData                An object with members of the duration
   * @param {Number=} aData.weeks         Duration in weeks
   * @param {Number=} aData.days          Duration in days
   * @param {Number=} aData.hours         Duration in hours
   * @param {Number=} aData.minutes       Duration in minutes
   * @param {Number=} aData.seconds       Duration in seconds
   * @param {Boolean=} aData.isNegative   If true, the duration is negative
   */
  fromData(aData) {
    for (let prop of DATA_PROPS_TO_COPY) {
      if (aData && prop in aData) {
        this[prop] = aData[prop];
      } else {
        this[prop] = 0;
      }
    }
  }
  /**
   * Resets the duration instance to the default values, i.e. PT0S
   */
  reset() {
    this.isNegative = false;
    this.weeks = 0;
    this.days = 0;
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
  }
  /**
   * Compares the duration instance with another one.
   *
   * @param {Duration} aOther             The instance to compare with
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compare(aOther) {
    let thisSeconds = this.toSeconds();
    let otherSeconds = aOther.toSeconds();
    return (thisSeconds > otherSeconds) - (thisSeconds < otherSeconds);
  }
  /**
   * Normalizes the duration instance. For example, a duration with a value
   * of 61 seconds will be normalized to 1 minute and 1 second.
   */
  normalize() {
    this.fromSeconds(this.toSeconds());
  }
  /**
   * The string representation of this duration.
   * @return {String}
   */
  toString() {
    if (this.toSeconds() == 0) {
      return "PT0S";
    } else {
      let str = "";
      if (this.isNegative) str += "-";
      str += "P";
      let hasWeeks = false;
      if (this.weeks) {
        if (this.days || this.hours || this.minutes || this.seconds) {
          str += this.weeks * 7 + this.days + "D";
        } else {
          str += this.weeks + "W";
          hasWeeks = true;
        }
      } else if (this.days) {
        str += this.days + "D";
      }
      if (!hasWeeks) {
        if (this.hours || this.minutes || this.seconds) {
          str += "T";
          if (this.hours) {
            str += this.hours + "H";
          }
          if (this.minutes) {
            str += this.minutes + "M";
          }
          if (this.seconds) {
            str += this.seconds + "S";
          }
        }
      }
      return str;
    }
  }
  /**
   * The iCalendar string representation of this duration.
   * @return {String}
   */
  toICALString() {
    return this.toString();
  }
};
function parseDurationChunk(letter, number, object) {
  let type;
  switch (letter) {
    case "P":
      if (number && number === "-") {
        object.isNegative = true;
      } else {
        object.isNegative = false;
      }
      break;
    case "D":
      type = "days";
      break;
    case "W":
      type = "weeks";
      break;
    case "H":
      type = "hours";
      break;
    case "M":
      type = "minutes";
      break;
    case "S":
      type = "seconds";
      break;
    default:
      return 0;
  }
  if (type) {
    if (!number && number !== 0) {
      throw new Error(
        'invalid duration value: Missing number before "' + letter + '"'
      );
    }
    let num = parseInt(number, 10);
    if (isStrictlyNaN(num)) {
      throw new Error(
        'invalid duration value: Invalid number "' + number + '" before "' + letter + '"'
      );
    }
    object[type] = num;
  }
  return 1;
}
var Period = class _Period {
  /**
   * Creates a new {@link ICAL.Period} instance from the passed string.
   *
   * @param {String} str            The string to parse
   * @param {Property} prop         The property this period will be on
   * @return {Period}               The created period instance
   */
  static fromString(str, prop) {
    let parts = str.split("/");
    if (parts.length !== 2) {
      throw new Error(
        'Invalid string value: "' + str + '" must contain a "/" char.'
      );
    }
    let options = {
      start: Time.fromDateTimeString(parts[0], prop)
    };
    let end = parts[1];
    if (Duration.isValueString(end)) {
      options.duration = Duration.fromString(end);
    } else {
      options.end = Time.fromDateTimeString(end, prop);
    }
    return new _Period(options);
  }
  /**
   * Creates a new {@link ICAL.Period} instance from the given data object.
   * The passed data object cannot contain both and end date and a duration.
   *
   * @param {Object} aData                  An object with members of the period
   * @param {Time=} aData.start             The start of the period
   * @param {Time=} aData.end               The end of the period
   * @param {Duration=} aData.duration      The duration of the period
   * @return {Period}                       The period instance
   */
  static fromData(aData) {
    return new _Period(aData);
  }
  /**
   * Returns a new period instance from the given jCal data array. The first
   * member is always the start date string, the second member is either a
   * duration or end date string.
   *
   * @param {jCalComponent} aData           The jCal data array
   * @param {Property} aProp                The property this jCal data is on
   * @param {Boolean} aLenient              If true, data value can be both date and date-time
   * @return {Period}                       The period instance
   */
  static fromJSON(aData, aProp, aLenient) {
    function fromDateOrDateTimeString(aValue, dateProp) {
      if (aLenient) {
        return Time.fromString(aValue, dateProp);
      } else {
        return Time.fromDateTimeString(aValue, dateProp);
      }
    }
    if (Duration.isValueString(aData[1])) {
      return _Period.fromData({
        start: fromDateOrDateTimeString(aData[0], aProp),
        duration: Duration.fromString(aData[1])
      });
    } else {
      return _Period.fromData({
        start: fromDateOrDateTimeString(aData[0], aProp),
        end: fromDateOrDateTimeString(aData[1], aProp)
      });
    }
  }
  /**
   * Creates a new ICAL.Period instance. The passed data object cannot contain both and end date and
   * a duration.
   *
   * @param {Object} aData                  An object with members of the period
   * @param {Time=} aData.start             The start of the period
   * @param {Time=} aData.end               The end of the period
   * @param {Duration=} aData.duration      The duration of the period
   */
  constructor(aData) {
    this.wrappedJSObject = this;
    if (aData && "start" in aData) {
      if (aData.start && !(aData.start instanceof Time)) {
        throw new TypeError(".start must be an instance of ICAL.Time");
      }
      this.start = aData.start;
    }
    if (aData && aData.end && aData.duration) {
      throw new Error("cannot accept both end and duration");
    }
    if (aData && "end" in aData) {
      if (aData.end && !(aData.end instanceof Time)) {
        throw new TypeError(".end must be an instance of ICAL.Time");
      }
      this.end = aData.end;
    }
    if (aData && "duration" in aData) {
      if (aData.duration && !(aData.duration instanceof Duration)) {
        throw new TypeError(".duration must be an instance of ICAL.Duration");
      }
      this.duration = aData.duration;
    }
  }
  /**
   * The start of the period
   * @type {Time}
   */
  start = null;
  /**
   * The end of the period
   * @type {Time}
   */
  end = null;
  /**
   * The duration of the period
   * @type {Duration}
   */
  duration = null;
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icalperiod"
   */
  icalclass = "icalperiod";
  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "period"
   */
  icaltype = "period";
  /**
   * Returns a clone of the duration object.
   *
   * @return {Period}      The cloned object
   */
  clone() {
    return _Period.fromData({
      start: this.start ? this.start.clone() : null,
      end: this.end ? this.end.clone() : null,
      duration: this.duration ? this.duration.clone() : null
    });
  }
  /**
   * Calculates the duration of the period, either directly or by subtracting
   * start from end date.
   *
   * @return {Duration}      The calculated duration
   */
  getDuration() {
    if (this.duration) {
      return this.duration;
    } else {
      return this.end.subtractDate(this.start);
    }
  }
  /**
   * Calculates the end date of the period, either directly or by adding
   * duration to start date.
   *
   * @return {Time}          The calculated end date
   */
  getEnd() {
    if (this.end) {
      return this.end;
    } else {
      let end = this.start.clone();
      end.addDuration(this.duration);
      return end;
    }
  }
  /**
   * Compare this period with a date or other period. To maintain the logic where a.compare(b)
   * returns 1 when a > b, this function will return 1 when the period is after the date, 0 when the
   * date is within the period, and -1 when the period is before the date. When comparing two
   * periods, as soon as they overlap in any way this will return 0.
   *
   * @param {Time|Period} dt    The date or other period to compare with
   */
  compare(dt) {
    if (dt.compare(this.start) < 0) {
      return 1;
    } else if (dt.compare(this.getEnd()) > 0) {
      return -1;
    } else {
      return 0;
    }
  }
  /**
   * The string representation of this period.
   * @return {String}
   */
  toString() {
    return this.start + "/" + (this.end || this.duration);
  }
  /**
   * The jCal representation of this period type.
   * @return {Object}
   */
  toJSON() {
    return [this.start.toString(), (this.end || this.duration).toString()];
  }
  /**
   * The iCalendar string representation of this period.
   * @return {String}
   */
  toICALString() {
    return this.start.toICALString() + "/" + (this.end || this.duration).toICALString();
  }
};
var Time = class _Time {
  static _dowCache = {};
  static _wnCache = {};
  /**
   * Returns the days in the given month
   *
   * @param {Number} month      The month to check
   * @param {Number} year       The year to check
   * @return {Number}           The number of days in the month
   */
  static daysInMonth(month, year) {
    let _daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let days = 30;
    if (month < 1 || month > 12) return days;
    days = _daysInMonth[month];
    if (month == 2) {
      days += _Time.isLeapYear(year);
    }
    return days;
  }
  /**
   * Checks if the year is a leap year
   *
   * @param {Number} year       The year to check
   * @return {Boolean}          True, if the year is a leap year
   */
  static isLeapYear(year) {
    if (year <= 1752) {
      return year % 4 == 0;
    } else {
      return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
    }
  }
  /**
   * Create a new ICAL.Time from the day of year and year. The date is returned
   * in floating timezone.
   *
   * @param {Number} aDayOfYear     The day of year
   * @param {Number} aYear          The year to create the instance in
   * @return {Time}                 The created instance with the calculated date
   */
  static fromDayOfYear(aDayOfYear, aYear) {
    let year = aYear;
    let doy = aDayOfYear;
    let tt = new _Time();
    tt.auto_normalize = false;
    let is_leap = _Time.isLeapYear(year) ? 1 : 0;
    if (doy < 1) {
      year--;
      is_leap = _Time.isLeapYear(year) ? 1 : 0;
      doy += _Time.daysInYearPassedMonth[is_leap][12];
      return _Time.fromDayOfYear(doy, year);
    } else if (doy > _Time.daysInYearPassedMonth[is_leap][12]) {
      is_leap = _Time.isLeapYear(year) ? 1 : 0;
      doy -= _Time.daysInYearPassedMonth[is_leap][12];
      year++;
      return _Time.fromDayOfYear(doy, year);
    }
    tt.year = year;
    tt.isDate = true;
    for (let month = 11; month >= 0; month--) {
      if (doy > _Time.daysInYearPassedMonth[is_leap][month]) {
        tt.month = month + 1;
        tt.day = doy - _Time.daysInYearPassedMonth[is_leap][month];
        break;
      }
    }
    tt.auto_normalize = true;
    return tt;
  }
  /**
   * Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.
   *
   * @deprecated                Use {@link ICAL.Time.fromDateString} instead
   * @param {String} str        The string to create from
   * @return {Time}             The date/time instance
   */
  static fromStringv2(str) {
    return new _Time({
      year: parseInt(str.slice(0, 4), 10),
      month: parseInt(str.slice(5, 7), 10),
      day: parseInt(str.slice(8, 10), 10),
      isDate: true
    });
  }
  /**
   * Returns a new ICAL.Time instance from a date string, e.g 2015-01-02.
   *
   * @param {String} aValue     The string to create from
   * @return {Time}             The date/time instance
   */
  static fromDateString(aValue) {
    return new _Time({
      year: strictParseInt(aValue.slice(0, 4)),
      month: strictParseInt(aValue.slice(5, 7)),
      day: strictParseInt(aValue.slice(8, 10)),
      isDate: true
    });
  }
  /**
   * Returns a new ICAL.Time instance from a date-time string, e.g
   * 2015-01-02T03:04:05. If a property is specified, the timezone is set up
   * from the property's TZID parameter.
   *
   * @param {String} aValue         The string to create from
   * @param {Property=} prop        The property the date belongs to
   * @return {Time}                 The date/time instance
   */
  static fromDateTimeString(aValue, prop) {
    if (aValue.length < 19) {
      throw new Error(
        'invalid date-time value: "' + aValue + '"'
      );
    }
    let zone;
    let zoneId;
    if (aValue.slice(-1) === "Z") {
      zone = Timezone.utcTimezone;
    } else if (prop) {
      zoneId = prop.getParameter("tzid");
      if (prop.parent) {
        if (prop.parent.name === "standard" || prop.parent.name === "daylight") {
          zone = Timezone.localTimezone;
        } else if (zoneId) {
          zone = prop.parent.getTimeZoneByID(zoneId);
        }
      }
    }
    const timeData = {
      year: strictParseInt(aValue.slice(0, 4)),
      month: strictParseInt(aValue.slice(5, 7)),
      day: strictParseInt(aValue.slice(8, 10)),
      hour: strictParseInt(aValue.slice(11, 13)),
      minute: strictParseInt(aValue.slice(14, 16)),
      second: strictParseInt(aValue.slice(17, 19))
    };
    if (zoneId && !zone) {
      timeData.timezone = zoneId;
    }
    return new _Time(timeData, zone);
  }
  /**
   * Returns a new ICAL.Time instance from a date or date-time string,
   *
   * @param {String} aValue         The string to create from
   * @param {Property=} prop        The property the date belongs to
   * @return {Time}                 The date/time instance
   */
  static fromString(aValue, aProperty) {
    if (aValue.length > 10) {
      return _Time.fromDateTimeString(aValue, aProperty);
    } else {
      return _Time.fromDateString(aValue);
    }
  }
  /**
   * Creates a new ICAL.Time instance from the given Javascript Date.
   *
   * @param {?Date} aDate             The Javascript Date to read, or null to reset
   * @param {Boolean} [useUTC=false]  If true, the UTC values of the date will be used
   */
  static fromJSDate(aDate, useUTC) {
    let tt = new _Time();
    return tt.fromJSDate(aDate, useUTC);
  }
  /**
   * Creates a new ICAL.Time instance from the the passed data object.
   *
   * @param {timeInit} aData          Time initialization
   * @param {Timezone=} aZone         Timezone this position occurs in
   */
  static fromData = function fromData(aData, aZone) {
    let t = new _Time();
    return t.fromData(aData, aZone);
  };
  /**
   * Creates a new ICAL.Time instance from the current moment.
   * The instance is “floating” - has no timezone relation.
   * To create an instance considering the time zone, call
   * ICAL.Time.fromJSDate(new Date(), true)
   * @return {Time}
   */
  static now() {
    return _Time.fromJSDate(/* @__PURE__ */ new Date(), false);
  }
  /**
   * Returns the date on which ISO week number 1 starts.
   *
   * @see Time#weekNumber
   * @param {Number} aYear                  The year to search in
   * @param {weekDay=} aWeekStart           The week start weekday, used for calculation.
   * @return {Time}                         The date on which week number 1 starts
   */
  static weekOneStarts(aYear, aWeekStart) {
    let t = _Time.fromData({
      year: aYear,
      month: 1,
      day: 1,
      isDate: true
    });
    let dow = t.dayOfWeek();
    let wkst = aWeekStart || _Time.DEFAULT_WEEK_START;
    if (dow > _Time.THURSDAY) {
      t.day += 7;
    }
    if (wkst > _Time.THURSDAY) {
      t.day -= 7;
    }
    t.day -= dow - wkst;
    return t;
  }
  /**
   * Get the dominical letter for the given year. Letters range from A - G for
   * common years, and AG to GF for leap years.
   *
   * @param {Number} yr           The year to retrieve the letter for
   * @return {String}             The dominical letter.
   */
  static getDominicalLetter(yr) {
    let LTRS = "GFEDCBA";
    let dom = (yr + (yr / 4 | 0) + (yr / 400 | 0) - (yr / 100 | 0) - 1) % 7;
    let isLeap = _Time.isLeapYear(yr);
    if (isLeap) {
      return LTRS[(dom + 6) % 7] + LTRS[dom];
    } else {
      return LTRS[dom];
    }
  }
  static #epochTime = null;
  /**
   * January 1st, 1970 as an ICAL.Time.
   * @type {Time}
   * @constant
   * @instance
   */
  static get epochTime() {
    if (!this.#epochTime) {
      this.#epochTime = _Time.fromData({
        year: 1970,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        isDate: false,
        timezone: "Z"
      });
    }
    return this.#epochTime;
  }
  static _cmp_attr(a, b, attr) {
    if (a[attr] > b[attr]) return 1;
    if (a[attr] < b[attr]) return -1;
    return 0;
  }
  /**
   * The days that have passed in the year after a given month. The array has
   * two members, one being an array of passed days for non-leap years, the
   * other analog for leap years.
   * @example
   * var isLeapYear = ICAL.Time.isLeapYear(year);
   * var passedDays = ICAL.Time.daysInYearPassedMonth[isLeapYear][month];
   * @type {Array.<Array.<Number>>}
   */
  static daysInYearPassedMonth = [
    [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365],
    [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]
  ];
  static SUNDAY = 1;
  static MONDAY = 2;
  static TUESDAY = 3;
  static WEDNESDAY = 4;
  static THURSDAY = 5;
  static FRIDAY = 6;
  static SATURDAY = 7;
  /**
   * The default weekday for the WKST part.
   * @constant
   * @default ICAL.Time.MONDAY
   */
  static DEFAULT_WEEK_START = 2;
  // MONDAY
  /**
   * Creates a new ICAL.Time instance.
   *
   * @param {timeInit} data           Time initialization
   * @param {Timezone} zone           timezone this position occurs in
   */
  constructor(data, zone) {
    this.wrappedJSObject = this;
    this._time = /* @__PURE__ */ Object.create(null);
    this._time.year = 0;
    this._time.month = 1;
    this._time.day = 1;
    this._time.hour = 0;
    this._time.minute = 0;
    this._time.second = 0;
    this._time.isDate = false;
    this.fromData(data, zone);
  }
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icaltime"
   */
  icalclass = "icaltime";
  _cachedUnixTime = null;
  /**
   * The type name, to be used in the jCal object. This value may change and
   * is strictly defined by the {@link ICAL.Time#isDate isDate} member.
   * @type {String}
   * @default "date-time"
   */
  get icaltype() {
    return this.isDate ? "date" : "date-time";
  }
  /**
   * The timezone for this time.
   * @type {Timezone}
   */
  zone = null;
  /**
   * Internal uses to indicate that a change has been made and the next read
   * operation must attempt to normalize the value (for example changing the
   * day to 33).
   *
   * @type {Boolean}
   * @private
   */
  _pendingNormalization = false;
  /**
   * The year of this date.
   * @type {Number}
   */
  get year() {
    return this._getTimeAttr("year");
  }
  set year(val) {
    this._setTimeAttr("year", val);
  }
  /**
   * The month of this date.
   * @type {Number}
   */
  get month() {
    return this._getTimeAttr("month");
  }
  set month(val) {
    this._setTimeAttr("month", val);
  }
  /**
   * The day of this date.
   * @type {Number}
   */
  get day() {
    return this._getTimeAttr("day");
  }
  set day(val) {
    this._setTimeAttr("day", val);
  }
  /**
   * The hour of this date-time.
   * @type {Number}
   */
  get hour() {
    return this._getTimeAttr("hour");
  }
  set hour(val) {
    this._setTimeAttr("hour", val);
  }
  /**
   * The minute of this date-time.
   * @type {Number}
   */
  get minute() {
    return this._getTimeAttr("minute");
  }
  set minute(val) {
    this._setTimeAttr("minute", val);
  }
  /**
   * The second of this date-time.
   * @type {Number}
   */
  get second() {
    return this._getTimeAttr("second");
  }
  set second(val) {
    this._setTimeAttr("second", val);
  }
  /**
   * If true, the instance represents a date (as opposed to a date-time)
   * @type {Boolean}
   */
  get isDate() {
    return this._getTimeAttr("isDate");
  }
  set isDate(val) {
    this._setTimeAttr("isDate", val);
  }
  /**
   * @private
   * @param {String} attr             Attribute to get (one of: year, month,
   *                                  day, hour, minute, second, isDate)
   * @return {Number|Boolean}         Current value for the attribute
   */
  _getTimeAttr(attr) {
    if (this._pendingNormalization) {
      this._normalize();
      this._pendingNormalization = false;
    }
    return this._time[attr];
  }
  /**
   * @private
   * @param {String} attr             Attribute to set (one of: year, month,
   *                                  day, hour, minute, second, isDate)
   * @param {Number|Boolean} val      New value for the attribute
   */
  _setTimeAttr(attr, val) {
    if (attr === "isDate" && val && !this._time.isDate) {
      this.adjust(0, 0, 0, 0);
    }
    this._cachedUnixTime = null;
    this._pendingNormalization = true;
    this._time[attr] = val;
  }
  /**
   * Returns a clone of the time object.
   *
   * @return {Time}              The cloned object
   */
  clone() {
    return new _Time(this._time, this.zone);
  }
  /**
   * Reset the time instance to epoch time
   */
  reset() {
    this.fromData(_Time.epochTime);
    this.zone = Timezone.utcTimezone;
  }
  /**
   * Reset the time instance to the given date/time values.
   *
   * @param {Number} year             The year to set
   * @param {Number} month            The month to set
   * @param {Number} day              The day to set
   * @param {Number} hour             The hour to set
   * @param {Number} minute           The minute to set
   * @param {Number} second           The second to set
   * @param {Timezone} timezone       The timezone to set
   */
  resetTo(year, month, day, hour, minute, second, timezone) {
    this.fromData({
      year,
      month,
      day,
      hour,
      minute,
      second,
      zone: timezone
    });
  }
  /**
   * Set up the current instance from the Javascript date value.
   *
   * @param {?Date} aDate             The Javascript Date to read, or null to reset
   * @param {Boolean} [useUTC=false]  If true, the UTC values of the date will be used
   */
  fromJSDate(aDate, useUTC) {
    if (!aDate) {
      this.reset();
    } else {
      if (useUTC) {
        this.zone = Timezone.utcTimezone;
        this.year = aDate.getUTCFullYear();
        this.month = aDate.getUTCMonth() + 1;
        this.day = aDate.getUTCDate();
        this.hour = aDate.getUTCHours();
        this.minute = aDate.getUTCMinutes();
        this.second = aDate.getUTCSeconds();
      } else {
        this.zone = Timezone.localTimezone;
        this.year = aDate.getFullYear();
        this.month = aDate.getMonth() + 1;
        this.day = aDate.getDate();
        this.hour = aDate.getHours();
        this.minute = aDate.getMinutes();
        this.second = aDate.getSeconds();
      }
    }
    this._cachedUnixTime = null;
    return this;
  }
  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {timeInit} aData          Time initialization
   * @param {Timezone=} aZone         Timezone this position occurs in
   */
  fromData(aData, aZone) {
    if (aData) {
      for (let [key, value] of Object.entries(aData)) {
        if (key === "icaltype") continue;
        this[key] = value;
      }
    }
    if (aZone) {
      this.zone = aZone;
    }
    if (aData && !("isDate" in aData)) {
      this.isDate = !("hour" in aData);
    } else if (aData && "isDate" in aData) {
      this.isDate = aData.isDate;
    }
    if (aData && "timezone" in aData) {
      let zone = TimezoneService.get(
        aData.timezone
      );
      this.zone = zone || Timezone.localTimezone;
    }
    if (aData && "zone" in aData) {
      this.zone = aData.zone;
    }
    if (!this.zone) {
      this.zone = Timezone.localTimezone;
    }
    this._cachedUnixTime = null;
    return this;
  }
  /**
   * Calculate the day of week.
   * @param {weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {weekDay}
   */
  dayOfWeek(aWeekStart) {
    let firstDow = aWeekStart || _Time.SUNDAY;
    let dowCacheKey = (this.year << 12) + (this.month << 8) + (this.day << 3) + firstDow;
    if (dowCacheKey in _Time._dowCache) {
      return _Time._dowCache[dowCacheKey];
    }
    let q = this.day;
    let m = this.month + (this.month < 3 ? 12 : 0);
    let Y = this.year - (this.month < 3 ? 1 : 0);
    let h = q + Y + trunc((m + 1) * 26 / 10) + trunc(Y / 4);
    {
      h += trunc(Y / 100) * 6 + trunc(Y / 400);
    }
    h = (h + 7 - firstDow) % 7 + 1;
    _Time._dowCache[dowCacheKey] = h;
    return h;
  }
  /**
   * Calculate the day of year.
   * @return {Number}
   */
  dayOfYear() {
    let is_leap = _Time.isLeapYear(this.year) ? 1 : 0;
    let diypm = _Time.daysInYearPassedMonth;
    return diypm[is_leap][this.month - 1] + this.day;
  }
  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * week. The resulting ICAL.Time instance is of icaltype date, even if this
   * is a date-time.
   *
   * @param {weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {Time}      The start of the week (cloned)
   */
  startOfWeek(aWeekStart) {
    let firstDow = aWeekStart || _Time.SUNDAY;
    let result = this.clone();
    result.day -= (this.dayOfWeek() + 7 - firstDow) % 7;
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * Returns a copy of the current date/time, shifted to the end of the week.
   * The resulting ICAL.Time instance is of icaltype date, even if this is a
   * date-time.
   *
   * @param {weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {Time}      The end of the week (cloned)
   */
  endOfWeek(aWeekStart) {
    let firstDow = aWeekStart || _Time.SUNDAY;
    let result = this.clone();
    result.day += (7 - this.dayOfWeek() + firstDow - _Time.SUNDAY) % 7;
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * month. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {Time}      The start of the month (cloned)
   */
  startOfMonth() {
    let result = this.clone();
    result.day = 1;
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * month.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {Time}      The end of the month (cloned)
   */
  endOfMonth() {
    let result = this.clone();
    result.day = _Time.daysInMonth(result.month, result.year);
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * Returns a copy of the current date/time, rewound to the start of the
   * year. The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {Time}      The start of the year (cloned)
   */
  startOfYear() {
    let result = this.clone();
    result.day = 1;
    result.month = 1;
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * Returns a copy of the current date/time, shifted to the end of the
   * year.  The resulting ICAL.Time instance is of icaltype date, even if
   * this is a date-time.
   *
   * @return {Time}      The end of the year (cloned)
   */
  endOfYear() {
    let result = this.clone();
    result.day = 31;
    result.month = 12;
    result.isDate = true;
    result.hour = 0;
    result.minute = 0;
    result.second = 0;
    return result;
  }
  /**
   * First calculates the start of the week, then returns the day of year for
   * this date. If the day falls into the previous year, the day is zero or negative.
   *
   * @param {weekDay=} aFirstDayOfWeek
   *        The week start weekday, defaults to SUNDAY
   * @return {Number}     The calculated day of year
   */
  startDoyWeek(aFirstDayOfWeek) {
    let firstDow = aFirstDayOfWeek || _Time.SUNDAY;
    let delta = this.dayOfWeek() - firstDow;
    if (delta < 0) delta += 7;
    return this.dayOfYear() - delta;
  }
  /**
   * Get the dominical letter for the current year. Letters range from A - G
   * for common years, and AG to GF for leap years.
   *
   * @param {Number} yr           The year to retrieve the letter for
   * @return {String}             The dominical letter.
   */
  getDominicalLetter() {
    return _Time.getDominicalLetter(this.year);
  }
  /**
   * Finds the nthWeekDay relative to the current month (not day).  The
   * returned value is a day relative the month that this month belongs to so
   * 1 would indicate the first of the month and 40 would indicate a day in
   * the following month.
   *
   * @param {Number} aDayOfWeek   Day of the week see the day name constants
   * @param {Number} aPos         Nth occurrence of a given week day values
   *        of 1 and 0 both indicate the first weekday of that type. aPos may
   *        be either positive or negative
   *
   * @return {Number} numeric value indicating a day relative
   *                   to the current month of this time object
   */
  nthWeekDay(aDayOfWeek, aPos) {
    let daysInMonth = _Time.daysInMonth(this.month, this.year);
    let weekday;
    let pos = aPos;
    let start = 0;
    let otherDay = this.clone();
    if (pos >= 0) {
      otherDay.day = 1;
      if (pos != 0) {
        pos--;
      }
      start = otherDay.day;
      let startDow = otherDay.dayOfWeek();
      let offset = aDayOfWeek - startDow;
      if (offset < 0)
        offset += 7;
      start += offset;
      start -= aDayOfWeek;
      weekday = aDayOfWeek;
    } else {
      otherDay.day = daysInMonth;
      let endDow = otherDay.dayOfWeek();
      pos++;
      weekday = endDow - aDayOfWeek;
      if (weekday < 0) {
        weekday += 7;
      }
      weekday = daysInMonth - weekday;
    }
    weekday += pos * 7;
    return start + weekday;
  }
  /**
   * Checks if current time is the nth weekday, relative to the current
   * month.  Will always return false when rule resolves outside of current
   * month.
   *
   * @param {weekDay} aDayOfWeek                 Day of week to check
   * @param {Number} aPos                        Relative position
   * @return {Boolean}                           True, if it is the nth weekday
   */
  isNthWeekDay(aDayOfWeek, aPos) {
    let dow = this.dayOfWeek();
    if (aPos === 0 && dow === aDayOfWeek) {
      return true;
    }
    let day = this.nthWeekDay(aDayOfWeek, aPos);
    if (day === this.day) {
      return true;
    }
    return false;
  }
  /**
   * Calculates the ISO 8601 week number. The first week of a year is the
   * week that contains the first Thursday. The year can have 53 weeks, if
   * January 1st is a Friday.
   *
   * Note there are regions where the first week of the year is the one that
   * starts on January 1st, which may offset the week number. Also, if a
   * different week start is specified, this will also affect the week
   * number.
   *
   * @see Time.weekOneStarts
   * @param {weekDay} aWeekStart                  The weekday the week starts with
   * @return {Number}                             The ISO week number
   */
  weekNumber(aWeekStart) {
    let wnCacheKey = (this.year << 12) + (this.month << 8) + (this.day << 3) + aWeekStart;
    if (wnCacheKey in _Time._wnCache) {
      return _Time._wnCache[wnCacheKey];
    }
    let week1;
    let dt = this.clone();
    dt.isDate = true;
    let isoyear = this.year;
    if (dt.month == 12 && dt.day > 25) {
      week1 = _Time.weekOneStarts(isoyear + 1, aWeekStart);
      if (dt.compare(week1) < 0) {
        week1 = _Time.weekOneStarts(isoyear, aWeekStart);
      } else {
        isoyear++;
      }
    } else {
      week1 = _Time.weekOneStarts(isoyear, aWeekStart);
      if (dt.compare(week1) < 0) {
        week1 = _Time.weekOneStarts(--isoyear, aWeekStart);
      }
    }
    let daysBetween = dt.subtractDate(week1).toSeconds() / 86400;
    let answer = trunc(daysBetween / 7) + 1;
    _Time._wnCache[wnCacheKey] = answer;
    return answer;
  }
  /**
   * Adds the duration to the current time. The instance is modified in
   * place.
   *
   * @param {Duration} aDuration         The duration to add
   */
  addDuration(aDuration) {
    let mult = aDuration.isNegative ? -1 : 1;
    let second = this.second;
    let minute = this.minute;
    let hour = this.hour;
    let day = this.day;
    second += mult * aDuration.seconds;
    minute += mult * aDuration.minutes;
    hour += mult * aDuration.hours;
    day += mult * aDuration.days;
    day += mult * 7 * aDuration.weeks;
    this.second = second;
    this.minute = minute;
    this.hour = hour;
    this.day = day;
    this._cachedUnixTime = null;
  }
  /**
   * Subtract the date details (_excluding_ timezone).  Useful for finding
   * the relative difference between two time objects excluding their
   * timezone differences.
   *
   * @param {Time} aDate     The date to subtract
   * @return {Duration}      The difference as a duration
   */
  subtractDate(aDate) {
    let unixTime = this.toUnixTime() + this.utcOffset();
    let other = aDate.toUnixTime() + aDate.utcOffset();
    return Duration.fromSeconds(unixTime - other);
  }
  /**
   * Subtract the date details, taking timezones into account.
   *
   * @param {Time} aDate  The date to subtract
   * @return {Duration}   The difference in duration
   */
  subtractDateTz(aDate) {
    let unixTime = this.toUnixTime();
    let other = aDate.toUnixTime();
    return Duration.fromSeconds(unixTime - other);
  }
  /**
   * Compares the ICAL.Time instance with another one, or a period.
   *
   * @param {Time|Period} aOther                  The instance to compare with
   * @return {Number}                             -1, 0 or 1 for less/equal/greater
   */
  compare(other) {
    if (other instanceof Period) {
      return -1 * other.compare(this);
    } else {
      let a = this.toUnixTime();
      let b = other.toUnixTime();
      if (a > b) return 1;
      if (b > a) return -1;
      return 0;
    }
  }
  /**
   * Compares only the date part of this instance with another one.
   *
   * @param {Time} other                  The instance to compare with
   * @param {Timezone} tz                 The timezone to compare in
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compareDateOnlyTz(other, tz) {
    let a = this.convertToZone(tz);
    let b = other.convertToZone(tz);
    let rc = 0;
    if ((rc = _Time._cmp_attr(a, b, "year")) != 0) return rc;
    if ((rc = _Time._cmp_attr(a, b, "month")) != 0) return rc;
    if ((rc = _Time._cmp_attr(a, b, "day")) != 0) return rc;
    return rc;
  }
  /**
   * Convert the instance into another timezone. The returned ICAL.Time
   * instance is always a copy.
   *
   * @param {Timezone} zone      The zone to convert to
   * @return {Time}              The copy, converted to the zone
   */
  convertToZone(zone) {
    let copy = this.clone();
    let zone_equals = this.zone.tzid == zone.tzid;
    if (!this.isDate && !zone_equals) {
      Timezone.convert_time(copy, this.zone, zone);
    }
    copy.zone = zone;
    return copy;
  }
  /**
   * Calculates the UTC offset of the current date/time in the timezone it is
   * in.
   *
   * @return {Number}     UTC offset in seconds
   */
  utcOffset() {
    if (this.zone == Timezone.localTimezone || this.zone == Timezone.utcTimezone) {
      return 0;
    } else {
      return this.zone.utcOffset(this);
    }
  }
  /**
   * Returns an RFC 5545 compliant ical representation of this object.
   *
   * @return {String} ical date/date-time
   */
  toICALString() {
    let string = this.toString();
    if (string.length > 10) {
      return design.icalendar.value["date-time"].toICAL(string);
    } else {
      return design.icalendar.value.date.toICAL(string);
    }
  }
  /**
   * The string representation of this date/time, in jCal form
   * (including : and - separators).
   * @return {String}
   */
  toString() {
    let result = this.year + "-" + pad2(this.month) + "-" + pad2(this.day);
    if (!this.isDate) {
      result += "T" + pad2(this.hour) + ":" + pad2(this.minute) + ":" + pad2(this.second);
      if (this.zone === Timezone.utcTimezone) {
        result += "Z";
      }
    }
    return result;
  }
  /**
   * Converts the current instance to a Javascript date
   * @return {Date}
   */
  toJSDate() {
    if (this.zone == Timezone.localTimezone) {
      if (this.isDate) {
        return new Date(this.year, this.month - 1, this.day);
      } else {
        return new Date(
          this.year,
          this.month - 1,
          this.day,
          this.hour,
          this.minute,
          this.second,
          0
        );
      }
    } else {
      return new Date(this.toUnixTime() * 1e3);
    }
  }
  _normalize() {
    if (this._time.isDate) {
      this._time.hour = 0;
      this._time.minute = 0;
      this._time.second = 0;
    }
    this.adjust(0, 0, 0, 0);
    return this;
  }
  /**
   * Adjust the date/time by the given offset
   *
   * @param {Number} aExtraDays       The extra amount of days
   * @param {Number} aExtraHours      The extra amount of hours
   * @param {Number} aExtraMinutes    The extra amount of minutes
   * @param {Number} aExtraSeconds    The extra amount of seconds
   * @param {Number=} aTime           The time to adjust, defaults to the
   *                                    current instance.
   */
  adjust(aExtraDays, aExtraHours, aExtraMinutes, aExtraSeconds, aTime) {
    let minutesOverflow, hoursOverflow, daysOverflow = 0, yearsOverflow = 0;
    let second, minute, hour, day;
    let daysInMonth;
    let time = aTime || this._time;
    if (!time.isDate) {
      second = time.second + aExtraSeconds;
      time.second = second % 60;
      minutesOverflow = trunc(second / 60);
      if (time.second < 0) {
        time.second += 60;
        minutesOverflow--;
      }
      minute = time.minute + aExtraMinutes + minutesOverflow;
      time.minute = minute % 60;
      hoursOverflow = trunc(minute / 60);
      if (time.minute < 0) {
        time.minute += 60;
        hoursOverflow--;
      }
      hour = time.hour + aExtraHours + hoursOverflow;
      time.hour = hour % 24;
      daysOverflow = trunc(hour / 24);
      if (time.hour < 0) {
        time.hour += 24;
        daysOverflow--;
      }
    }
    if (time.month > 12) {
      yearsOverflow = trunc((time.month - 1) / 12);
    } else if (time.month < 1) {
      yearsOverflow = trunc(time.month / 12) - 1;
    }
    time.year += yearsOverflow;
    time.month -= 12 * yearsOverflow;
    day = time.day + aExtraDays + daysOverflow;
    if (day > 0) {
      for (; ; ) {
        daysInMonth = _Time.daysInMonth(time.month, time.year);
        if (day <= daysInMonth) {
          break;
        }
        time.month++;
        if (time.month > 12) {
          time.year++;
          time.month = 1;
        }
        day -= daysInMonth;
      }
    } else {
      while (day <= 0) {
        if (time.month == 1) {
          time.year--;
          time.month = 12;
        } else {
          time.month--;
        }
        day += _Time.daysInMonth(time.month, time.year);
      }
    }
    time.day = day;
    this._cachedUnixTime = null;
    return this;
  }
  /**
   * Sets up the current instance from unix time, the number of seconds since
   * January 1st, 1970.
   *
   * @param {Number} seconds      The seconds to set up with
   */
  fromUnixTime(seconds) {
    this.zone = Timezone.utcTimezone;
    let date = new Date(seconds * 1e3);
    this.year = date.getUTCFullYear();
    this.month = date.getUTCMonth() + 1;
    this.day = date.getUTCDate();
    if (this._time.isDate) {
      this.hour = 0;
      this.minute = 0;
      this.second = 0;
    } else {
      this.hour = date.getUTCHours();
      this.minute = date.getUTCMinutes();
      this.second = date.getUTCSeconds();
    }
    this._cachedUnixTime = null;
  }
  /**
   * Converts the current instance to seconds since January 1st 1970.
   *
   * @return {Number}         Seconds since 1970
   */
  toUnixTime() {
    if (this._cachedUnixTime !== null) {
      return this._cachedUnixTime;
    }
    let offset = this.utcOffset();
    let ms = Date.UTC(
      this.year,
      this.month - 1,
      this.day,
      this.hour,
      this.minute,
      this.second - offset
    );
    this._cachedUnixTime = ms / 1e3;
    return this._cachedUnixTime;
  }
  /**
   * Converts time to into Object which can be serialized then re-created
   * using the constructor.
   *
   * @example
   * // toJSON will automatically be called
   * var json = JSON.stringify(mytime);
   *
   * var deserialized = JSON.parse(json);
   *
   * var time = new ICAL.Time(deserialized);
   *
   * @return {Object}
   */
  toJSON() {
    let copy = [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "isDate"
    ];
    let result = /* @__PURE__ */ Object.create(null);
    let i = 0;
    let len = copy.length;
    let prop;
    for (; i < len; i++) {
      prop = copy[i];
      result[prop] = this[prop];
    }
    if (this.zone) {
      result.timezone = this.zone.tzid;
    }
    return result;
  }
};
var CHAR = /[^ \t]/;
var VALUE_DELIMITER = ":";
var PARAM_DELIMITER = ";";
var PARAM_NAME_DELIMITER = "=";
var DEFAULT_VALUE_TYPE$1 = "unknown";
var DEFAULT_PARAM_TYPE = "text";
var RFC6868_REPLACE_MAP$1 = { "^'": '"', "^n": "\n", "^^": "^" };
function parse(input) {
  let state = {};
  let root = state.component = [];
  state.stack = [root];
  parse._eachLine(input, function(err, line) {
    parse._handleContentLine(line, state);
  });
  if (state.stack.length > 1) {
    throw new ParserError(
      "invalid ical body. component began but did not end"
    );
  }
  state = null;
  return root.length == 1 ? root[0] : root;
}
parse.property = function(str, designSet) {
  let state = {
    component: [[], []],
    designSet: designSet || design.defaultSet
  };
  parse._handleContentLine(str, state);
  return state.component[1][0];
};
parse.component = function(str) {
  return parse(str);
};
var ParserError = class extends Error {
  name = this.constructor.name;
};
parse.ParserError = ParserError;
parse._handleContentLine = function(line, state) {
  let valuePos = line.indexOf(VALUE_DELIMITER);
  let paramPos = line.indexOf(PARAM_DELIMITER);
  let lastParamIndex;
  let lastValuePos;
  let name;
  let value;
  let params = {};
  if (paramPos !== -1 && valuePos !== -1) {
    if (paramPos > valuePos) {
      paramPos = -1;
    }
  }
  let parsedParams;
  if (paramPos !== -1) {
    name = line.slice(0, Math.max(0, paramPos)).toLowerCase();
    parsedParams = parse._parseParameters(line.slice(Math.max(0, paramPos)), 0, state.designSet);
    if (parsedParams[2] == -1) {
      throw new ParserError("Invalid parameters in '" + line + "'");
    }
    params = parsedParams[0];
    let parsedParamLength;
    if (typeof parsedParams[1] === "string") {
      parsedParamLength = parsedParams[1].length;
    } else {
      parsedParamLength = parsedParams[1].reduce((accumulator, currentValue) => {
        return accumulator + currentValue.length;
      }, 0);
    }
    lastParamIndex = parsedParamLength + parsedParams[2] + paramPos;
    if ((lastValuePos = line.slice(Math.max(0, lastParamIndex)).indexOf(VALUE_DELIMITER)) !== -1) {
      value = line.slice(Math.max(0, lastParamIndex + lastValuePos + 1));
    } else {
      throw new ParserError("Missing parameter value in '" + line + "'");
    }
  } else if (valuePos !== -1) {
    name = line.slice(0, Math.max(0, valuePos)).toLowerCase();
    value = line.slice(Math.max(0, valuePos + 1));
    if (name === "begin") {
      let newComponent = [value.toLowerCase(), [], []];
      if (state.stack.length === 1) {
        state.component.push(newComponent);
      } else {
        state.component[2].push(newComponent);
      }
      state.stack.push(state.component);
      state.component = newComponent;
      if (!state.designSet) {
        state.designSet = design.getDesignSet(state.component[0]);
      }
      return;
    } else if (name === "end") {
      state.component = state.stack.pop();
      return;
    }
  } else {
    throw new ParserError(
      'invalid line (no token ";" or ":") "' + line + '"'
    );
  }
  let valueType;
  let multiValue = false;
  let structuredValue = false;
  let propertyDetails;
  let splitName;
  let ungroupedName;
  if (state.designSet.propertyGroups && name.indexOf(".") !== -1) {
    splitName = name.split(".");
    params.group = splitName[0];
    ungroupedName = splitName[1];
  } else {
    ungroupedName = name;
  }
  if (ungroupedName in state.designSet.property) {
    propertyDetails = state.designSet.property[ungroupedName];
    if ("multiValue" in propertyDetails) {
      multiValue = propertyDetails.multiValue;
    }
    if ("structuredValue" in propertyDetails) {
      structuredValue = propertyDetails.structuredValue;
    }
    if (value && "detectType" in propertyDetails) {
      valueType = propertyDetails.detectType(value);
    }
  }
  if (!valueType) {
    if (!("value" in params)) {
      if (propertyDetails) {
        valueType = propertyDetails.defaultType;
      } else {
        valueType = DEFAULT_VALUE_TYPE$1;
      }
    } else {
      valueType = params.value.toLowerCase();
    }
  }
  delete params.value;
  let result;
  if (multiValue && structuredValue) {
    value = parse._parseMultiValue(value, structuredValue, valueType, [], multiValue, state.designSet, structuredValue);
    result = [ungroupedName, params, valueType, value];
  } else if (multiValue) {
    result = [ungroupedName, params, valueType];
    parse._parseMultiValue(value, multiValue, valueType, result, null, state.designSet, false);
  } else if (structuredValue) {
    value = parse._parseMultiValue(value, structuredValue, valueType, [], null, state.designSet, structuredValue);
    result = [ungroupedName, params, valueType, value];
  } else {
    value = parse._parseValue(value, valueType, state.designSet, false);
    result = [ungroupedName, params, valueType, value];
  }
  if (state.component[0] === "vcard" && state.component[1].length === 0 && !(name === "version" && value === "4.0")) {
    state.designSet = design.getDesignSet("vcard3");
  }
  state.component[1].push(result);
};
parse._parseValue = function(value, type, designSet, structuredValue) {
  if (type in designSet.value && "fromICAL" in designSet.value[type]) {
    return designSet.value[type].fromICAL(value, structuredValue);
  }
  return value;
};
parse._parseParameters = function(line, start, designSet) {
  let lastParam = start;
  let pos = 0;
  let delim = PARAM_NAME_DELIMITER;
  let result = {};
  let name, lcname;
  let value, valuePos = -1;
  let type, multiValue, mvdelim;
  while (pos !== false && (pos = line.indexOf(delim, pos + 1)) !== -1) {
    name = line.slice(lastParam + 1, pos);
    if (name.length == 0) {
      throw new ParserError("Empty parameter name in '" + line + "'");
    }
    lcname = name.toLowerCase();
    mvdelim = false;
    multiValue = false;
    if (lcname in designSet.param && designSet.param[lcname].valueType) {
      type = designSet.param[lcname].valueType;
    } else {
      type = DEFAULT_PARAM_TYPE;
    }
    if (lcname in designSet.param) {
      multiValue = designSet.param[lcname].multiValue;
      if (designSet.param[lcname].multiValueSeparateDQuote) {
        mvdelim = parse._rfc6868Escape('"' + multiValue + '"');
      }
    }
    let nextChar = line[pos + 1];
    if (nextChar === '"') {
      valuePos = pos + 2;
      pos = line.indexOf('"', valuePos);
      if (multiValue && pos != -1) {
        let extendedValue = true;
        while (extendedValue) {
          if (line[pos + 1] == multiValue && line[pos + 2] == '"') {
            pos = line.indexOf('"', pos + 3);
          } else {
            extendedValue = false;
          }
        }
      }
      if (pos === -1) {
        throw new ParserError(
          'invalid line (no matching double quote) "' + line + '"'
        );
      }
      value = line.slice(valuePos, pos);
      lastParam = line.indexOf(PARAM_DELIMITER, pos);
      let propValuePos = line.indexOf(VALUE_DELIMITER, pos);
      if (lastParam === -1 || propValuePos !== -1 && lastParam > propValuePos) {
        pos = false;
      }
    } else {
      valuePos = pos + 1;
      let nextPos = line.indexOf(PARAM_DELIMITER, valuePos);
      let propValuePos = line.indexOf(VALUE_DELIMITER, valuePos);
      if (propValuePos !== -1 && nextPos > propValuePos) {
        nextPos = propValuePos;
        pos = false;
      } else if (nextPos === -1) {
        if (propValuePos === -1) {
          nextPos = line.length;
        } else {
          nextPos = propValuePos;
        }
        pos = false;
      } else {
        lastParam = nextPos;
        pos = nextPos;
      }
      value = line.slice(valuePos, nextPos);
    }
    const length_before = value.length;
    value = parse._rfc6868Escape(value);
    valuePos += length_before - value.length;
    if (multiValue) {
      let delimiter = mvdelim || multiValue;
      value = parse._parseMultiValue(value, delimiter, type, [], null, designSet);
    } else {
      value = parse._parseValue(value, type, designSet);
    }
    if (multiValue && lcname in result) {
      if (Array.isArray(result[lcname])) {
        result[lcname].push(value);
      } else {
        result[lcname] = [
          result[lcname],
          value
        ];
      }
    } else {
      result[lcname] = value;
    }
  }
  return [result, value, valuePos];
};
parse._rfc6868Escape = function(val) {
  return val.replace(/\^['n^]/g, function(x) {
    return RFC6868_REPLACE_MAP$1[x];
  });
};
parse._parseMultiValue = function(buffer, delim, type, result, innerMulti, designSet, structuredValue) {
  let pos = 0;
  let lastPos = 0;
  let value;
  if (delim.length === 0) {
    return buffer;
  }
  while ((pos = unescapedIndexOf(buffer, delim, lastPos)) !== -1) {
    value = buffer.slice(lastPos, pos);
    if (innerMulti) {
      value = parse._parseMultiValue(value, innerMulti, type, [], null, designSet, structuredValue);
    } else {
      value = parse._parseValue(value, type, designSet, structuredValue);
    }
    result.push(value);
    lastPos = pos + delim.length;
  }
  value = buffer.slice(lastPos);
  if (innerMulti) {
    value = parse._parseMultiValue(value, innerMulti, type, [], null, designSet, structuredValue);
  } else {
    value = parse._parseValue(value, type, designSet, structuredValue);
  }
  result.push(value);
  return result.length == 1 ? result[0] : result;
};
parse._eachLine = function(buffer, callback) {
  let len = buffer.length;
  let lastPos = buffer.search(CHAR);
  let pos = lastPos;
  let line;
  let firstChar;
  let newlineOffset;
  do {
    pos = buffer.indexOf("\n", lastPos) + 1;
    if (pos > 1 && buffer[pos - 2] === "\r") {
      newlineOffset = 2;
    } else {
      newlineOffset = 1;
    }
    if (pos === 0) {
      pos = len;
      newlineOffset = 0;
    }
    firstChar = buffer[lastPos];
    if (firstChar === " " || firstChar === "	") {
      line += buffer.slice(lastPos + 1, pos - newlineOffset);
    } else {
      if (line)
        callback(null, line);
      line = buffer.slice(lastPos, pos - newlineOffset);
    }
    lastPos = pos;
  } while (pos !== len);
  line = line.trim();
  if (line.length)
    callback(null, line);
};
var OPTIONS = ["tzid", "location", "tznames", "latitude", "longitude"];
var Timezone = class _Timezone {
  static _compare_change_fn(a, b) {
    if (a.year < b.year) return -1;
    else if (a.year > b.year) return 1;
    if (a.month < b.month) return -1;
    else if (a.month > b.month) return 1;
    if (a.day < b.day) return -1;
    else if (a.day > b.day) return 1;
    if (a.hour < b.hour) return -1;
    else if (a.hour > b.hour) return 1;
    if (a.minute < b.minute) return -1;
    else if (a.minute > b.minute) return 1;
    if (a.second < b.second) return -1;
    else if (a.second > b.second) return 1;
    return 0;
  }
  /**
   * Convert the date/time from one zone to the next.
   *
   * @param {Time} tt                  The time to convert
   * @param {Timezone} from_zone       The source zone to convert from
   * @param {Timezone} to_zone         The target zone to convert to
   * @return {Time}                    The converted date/time object
   */
  static convert_time(tt, from_zone, to_zone) {
    if (tt.isDate || from_zone.tzid == to_zone.tzid || from_zone == _Timezone.localTimezone || to_zone == _Timezone.localTimezone) {
      tt.zone = to_zone;
      return tt;
    }
    let utcOffset = from_zone.utcOffset(tt);
    tt.adjust(0, 0, 0, -utcOffset);
    utcOffset = to_zone.utcOffset(tt);
    tt.adjust(0, 0, 0, utcOffset);
    return null;
  }
  /**
   * Creates a new ICAL.Timezone instance from the passed data object.
   *
   * @param {Component|Object} aData options for class
   * @param {String|Component} aData.component
   *        If aData is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} aData.tzid      The timezone identifier
   * @param {String} aData.location  The timezone locationw
   * @param {String} aData.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} aData.latitude  The latitude of the timezone
   * @param {Number} aData.longitude The longitude of the timezone
   */
  static fromData(aData) {
    let tt = new _Timezone();
    return tt.fromData(aData);
  }
  /**
   * The instance describing the UTC timezone
   * @type {Timezone}
   * @constant
   * @instance
   */
  static #utcTimezone = null;
  static get utcTimezone() {
    if (!this.#utcTimezone) {
      this.#utcTimezone = _Timezone.fromData({
        tzid: "UTC"
      });
    }
    return this.#utcTimezone;
  }
  /**
   * The instance describing the local timezone
   * @type {Timezone}
   * @constant
   * @instance
   */
  static #localTimezone = null;
  static get localTimezone() {
    if (!this.#localTimezone) {
      this.#localTimezone = _Timezone.fromData({
        tzid: "floating"
      });
    }
    return this.#localTimezone;
  }
  /**
   * Adjust a timezone change object.
   * @private
   * @param {Object} change     The timezone change object
   * @param {Number} days       The extra amount of days
   * @param {Number} hours      The extra amount of hours
   * @param {Number} minutes    The extra amount of minutes
   * @param {Number} seconds    The extra amount of seconds
   */
  static adjust_change(change, days, hours, minutes, seconds) {
    return Time.prototype.adjust.call(
      change,
      days,
      hours,
      minutes,
      seconds,
      change
    );
  }
  static _minimumExpansionYear = -1;
  static EXTRA_COVERAGE = 5;
  /**
   * Creates a new ICAL.Timezone instance, by passing in a tzid and component.
   *
   * @param {Component|Object} data options for class
   * @param {String|Component} data.component
   *        If data is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} data.tzid      The timezone identifier
   * @param {String} data.location  The timezone locationw
   * @param {String} data.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} data.latitude  The latitude of the timezone
   * @param {Number} data.longitude The longitude of the timezone
   */
  constructor(data) {
    this.wrappedJSObject = this;
    this.fromData(data);
  }
  /**
   * Timezone identifier
   * @type {String}
   */
  tzid = "";
  /**
   * Timezone location
   * @type {String}
   */
  location = "";
  /**
   * Alternative timezone name, for the string representation
   * @type {String}
   */
  tznames = "";
  /**
   * The primary latitude for the timezone.
   * @type {Number}
   */
  latitude = 0;
  /**
   * The primary longitude for the timezone.
   * @type {Number}
   */
  longitude = 0;
  /**
   * The vtimezone component for this timezone.
   * @type {Component}
   */
  component = null;
  /**
   * The year this timezone has been expanded to. All timezone transition
   * dates until this year are known and can be used for calculation
   *
   * @private
   * @type {Number}
   */
  expandedUntilYear = 0;
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icaltimezone"
   */
  icalclass = "icaltimezone";
  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Component|Object} aData options for class
   * @param {String|Component} aData.component
   *        If aData is a simple object, then this member can be set to either a
   *        string containing the component data, or an already parsed
   *        ICAL.Component
   * @param {String} aData.tzid      The timezone identifier
   * @param {String} aData.location  The timezone locationw
   * @param {String} aData.tznames   An alternative string representation of the
   *                                  timezone
   * @param {Number} aData.latitude  The latitude of the timezone
   * @param {Number} aData.longitude The longitude of the timezone
   */
  fromData(aData) {
    this.expandedUntilYear = 0;
    this.changes = [];
    if (aData instanceof Component) {
      this.component = aData;
    } else {
      if (aData && "component" in aData) {
        if (typeof aData.component == "string") {
          let jCal = parse(aData.component);
          this.component = new Component(jCal);
        } else if (aData.component instanceof Component) {
          this.component = aData.component;
        } else {
          this.component = null;
        }
      }
      for (let prop of OPTIONS) {
        if (aData && prop in aData) {
          this[prop] = aData[prop];
        }
      }
    }
    if (this.component instanceof Component && !this.tzid) {
      this.tzid = this.component.getFirstPropertyValue("tzid");
    }
    return this;
  }
  /**
   * Finds the utcOffset the given time would occur in this timezone.
   *
   * @param {Time} tt         The time to check for
   * @return {Number}         utc offset in seconds
   */
  utcOffset(tt) {
    if (this == _Timezone.utcTimezone || this == _Timezone.localTimezone) {
      return 0;
    }
    this._ensureCoverage(tt.year);
    if (!this.changes.length) {
      return 0;
    }
    let tt_change = {
      year: tt.year,
      month: tt.month,
      day: tt.day,
      hour: tt.hour,
      minute: tt.minute,
      second: tt.second
    };
    let change_num = this._findNearbyChange(tt_change);
    let change_num_to_use = -1;
    let step = 1;
    for (; ; ) {
      let change = clone(this.changes[change_num], true);
      if (change.utcOffset < change.prevUtcOffset) {
        _Timezone.adjust_change(change, 0, 0, 0, change.utcOffset);
      } else {
        _Timezone.adjust_change(
          change,
          0,
          0,
          0,
          change.prevUtcOffset
        );
      }
      let cmp = _Timezone._compare_change_fn(tt_change, change);
      if (cmp >= 0) {
        change_num_to_use = change_num;
      } else {
        step = -1;
      }
      if (step == -1 && change_num_to_use != -1) {
        break;
      }
      change_num += step;
      if (change_num < 0) {
        return 0;
      }
      if (change_num >= this.changes.length) {
        break;
      }
    }
    let zone_change = this.changes[change_num_to_use];
    let utcOffset_change = zone_change.utcOffset - zone_change.prevUtcOffset;
    if (utcOffset_change < 0 && change_num_to_use > 0) {
      let tmp_change = clone(zone_change, true);
      _Timezone.adjust_change(tmp_change, 0, 0, 0, tmp_change.prevUtcOffset);
      if (_Timezone._compare_change_fn(tt_change, tmp_change) < 0) {
        let prev_zone_change = this.changes[change_num_to_use - 1];
        let want_daylight = false;
        if (zone_change.is_daylight != want_daylight && prev_zone_change.is_daylight == want_daylight) {
          zone_change = prev_zone_change;
        }
      }
    }
    return zone_change.utcOffset;
  }
  _findNearbyChange(change) {
    let idx = binsearchInsert(
      this.changes,
      change,
      _Timezone._compare_change_fn
    );
    if (idx >= this.changes.length) {
      return this.changes.length - 1;
    }
    return idx;
  }
  _ensureCoverage(aYear) {
    if (_Timezone._minimumExpansionYear == -1) {
      let today = Time.now();
      _Timezone._minimumExpansionYear = today.year;
    }
    let changesEndYear = aYear;
    if (changesEndYear < _Timezone._minimumExpansionYear) {
      changesEndYear = _Timezone._minimumExpansionYear;
    }
    changesEndYear += _Timezone.EXTRA_COVERAGE;
    if (!this.changes.length || this.expandedUntilYear < aYear) {
      let subcomps = this.component.getAllSubcomponents();
      let compLen = subcomps.length;
      let compIdx = 0;
      for (; compIdx < compLen; compIdx++) {
        this._expandComponent(
          subcomps[compIdx],
          changesEndYear,
          this.changes
        );
      }
      this.changes.sort(_Timezone._compare_change_fn);
      this.expandedUntilYear = changesEndYear;
    }
  }
  _expandComponent(aComponent, aYear, changes) {
    if (!aComponent.hasProperty("dtstart") || !aComponent.hasProperty("tzoffsetto") || !aComponent.hasProperty("tzoffsetfrom")) {
      return null;
    }
    let dtstart = aComponent.getFirstProperty("dtstart").getFirstValue();
    let change;
    function convert_tzoffset(offset) {
      return offset.factor * (offset.hours * 3600 + offset.minutes * 60);
    }
    function init_changes() {
      let changebase = {};
      changebase.is_daylight = aComponent.name == "daylight";
      changebase.utcOffset = convert_tzoffset(
        aComponent.getFirstProperty("tzoffsetto").getFirstValue()
      );
      changebase.prevUtcOffset = convert_tzoffset(
        aComponent.getFirstProperty("tzoffsetfrom").getFirstValue()
      );
      return changebase;
    }
    if (!aComponent.hasProperty("rrule") && !aComponent.hasProperty("rdate")) {
      change = init_changes();
      change.year = dtstart.year;
      change.month = dtstart.month;
      change.day = dtstart.day;
      change.hour = dtstart.hour;
      change.minute = dtstart.minute;
      change.second = dtstart.second;
      _Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
      changes.push(change);
    } else {
      let props = aComponent.getAllProperties("rdate");
      for (let rdate of props) {
        let time = rdate.getFirstValue();
        change = init_changes();
        change.year = time.year;
        change.month = time.month;
        change.day = time.day;
        if (time.isDate) {
          change.hour = dtstart.hour;
          change.minute = dtstart.minute;
          change.second = dtstart.second;
          if (dtstart.zone != _Timezone.utcTimezone) {
            _Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          }
        } else {
          change.hour = time.hour;
          change.minute = time.minute;
          change.second = time.second;
          if (time.zone != _Timezone.utcTimezone) {
            _Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          }
        }
        changes.push(change);
      }
      let rrule = aComponent.getFirstProperty("rrule");
      if (rrule) {
        rrule = rrule.getFirstValue();
        change = init_changes();
        if (rrule.until && rrule.until.zone == _Timezone.utcTimezone) {
          rrule.until.adjust(0, 0, 0, change.prevUtcOffset);
          rrule.until.zone = _Timezone.localTimezone;
        }
        let iterator = rrule.iterator(dtstart);
        let occ;
        while (occ = iterator.next()) {
          change = init_changes();
          if (occ.year > aYear || !occ) {
            break;
          }
          change.year = occ.year;
          change.month = occ.month;
          change.day = occ.day;
          change.hour = occ.hour;
          change.minute = occ.minute;
          change.second = occ.second;
          change.isDate = occ.isDate;
          _Timezone.adjust_change(change, 0, 0, 0, -change.prevUtcOffset);
          changes.push(change);
        }
      }
    }
    return changes;
  }
  /**
   * The string representation of this timezone.
   * @return {String}
   */
  toString() {
    return this.tznames ? this.tznames : this.tzid;
  }
};
var zones = null;
var TimezoneService = {
  get count() {
    if (zones === null) {
      return 0;
    }
    return Object.keys(zones).length;
  },
  reset: function() {
    zones = /* @__PURE__ */ Object.create(null);
    let utc = Timezone.utcTimezone;
    zones.Z = utc;
    zones.UTC = utc;
    zones.GMT = utc;
  },
  _hard_reset: function() {
    zones = null;
  },
  /**
   * Checks if timezone id has been registered.
   *
   * @param {String} tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return {Boolean}        False, when not present
   */
  has: function(tzid) {
    if (zones === null) {
      return false;
    }
    return !!zones[tzid];
  },
  /**
   * Returns a timezone by its tzid if present.
   *
   * @param {String} tzid               Timezone identifier (e.g. America/Los_Angeles)
   * @return {Timezone | undefined}     The timezone, or undefined if not found
   */
  get: function(tzid) {
    if (zones === null) {
      this.reset();
    }
    return zones[tzid];
  },
  /**
   * Registers a timezone object or component.
   *
   * @param {Component|Timezone} timezone
   *        The initialized zone or vtimezone.
   *
   * @param {String=} name
   *        The name of the timezone. Defaults to the component's TZID if not
   *        passed.
   */
  register: function(timezone, name) {
    if (zones === null) {
      this.reset();
    }
    if (typeof timezone === "string" && name instanceof Timezone) {
      [timezone, name] = [name, timezone];
    }
    if (!name) {
      if (timezone instanceof Timezone) {
        name = timezone.tzid;
      } else {
        if (timezone.name === "vtimezone") {
          timezone = new Timezone(timezone);
          name = timezone.tzid;
        }
      }
    }
    if (!name) {
      throw new TypeError("Neither a timezone nor a name was passed");
    }
    if (timezone instanceof Timezone) {
      zones[name] = timezone;
    } else {
      throw new TypeError("timezone must be ICAL.Timezone or ICAL.Component");
    }
  },
  /**
   * Removes a timezone by its tzid from the list.
   *
   * @param {String} tzid     Timezone identifier (e.g. America/Los_Angeles)
   * @return {?Timezone}      The removed timezone, or null if not registered
   */
  remove: function(tzid) {
    if (zones === null) {
      return null;
    }
    return delete zones[tzid];
  }
};
function updateTimezones(vcal) {
  let allsubs, properties, vtimezones, reqTzid, i;
  if (!vcal || vcal.name !== "vcalendar") {
    return vcal;
  }
  allsubs = vcal.getAllSubcomponents();
  properties = [];
  vtimezones = {};
  for (i = 0; i < allsubs.length; i++) {
    if (allsubs[i].name === "vtimezone") {
      let tzid = allsubs[i].getFirstProperty("tzid").getFirstValue();
      vtimezones[tzid] = allsubs[i];
    } else {
      properties = properties.concat(allsubs[i].getAllProperties());
    }
  }
  reqTzid = {};
  for (i = 0; i < properties.length; i++) {
    let tzid = properties[i].getParameter("tzid");
    if (tzid) {
      reqTzid[tzid] = true;
    }
  }
  for (let [tzid, comp] of Object.entries(vtimezones)) {
    if (!reqTzid[tzid]) {
      vcal.removeSubcomponent(comp);
    }
  }
  for (let tzid of Object.keys(reqTzid)) {
    if (!vtimezones[tzid] && TimezoneService.has(tzid)) {
      vcal.addSubcomponent(TimezoneService.get(tzid).component);
    }
  }
  return vcal;
}
function isStrictlyNaN(number) {
  return typeof number === "number" && isNaN(number);
}
function strictParseInt(string) {
  let result = parseInt(string, 10);
  if (isStrictlyNaN(result)) {
    throw new Error(
      'Could not extract integer from "' + string + '"'
    );
  }
  return result;
}
function formatClassType(data, type) {
  if (typeof data === "undefined") {
    return void 0;
  }
  if (data instanceof type) {
    return data;
  }
  return new type(data);
}
function unescapedIndexOf(buffer, search, pos) {
  while ((pos = buffer.indexOf(search, pos)) !== -1) {
    if (pos > 0 && buffer[pos - 1] === "\\") {
      pos += 1;
    } else {
      return pos;
    }
  }
  return -1;
}
function binsearchInsert(list, seekVal, cmpfunc) {
  if (!list.length)
    return 0;
  let low = 0, high = list.length - 1, mid, cmpval;
  while (low <= high) {
    mid = low + Math.floor((high - low) / 2);
    cmpval = cmpfunc(seekVal, list[mid]);
    if (cmpval < 0)
      high = mid - 1;
    else if (cmpval > 0)
      low = mid + 1;
    else
      break;
  }
  if (cmpval < 0)
    return mid;
  else if (cmpval > 0)
    return mid + 1;
  else
    return mid;
}
function clone(aSrc, aDeep) {
  if (!aSrc || typeof aSrc != "object") {
    return aSrc;
  } else if (aSrc instanceof Date) {
    return new Date(aSrc.getTime());
  } else if ("clone" in aSrc) {
    return aSrc.clone();
  } else if (Array.isArray(aSrc)) {
    let arr = [];
    for (let i = 0; i < aSrc.length; i++) {
      arr.push(aDeep ? clone(aSrc[i], true) : aSrc[i]);
    }
    return arr;
  } else {
    let obj = {};
    for (let [name, value] of Object.entries(aSrc)) {
      if (aDeep) {
        obj[name] = clone(value, true);
      } else {
        obj[name] = value;
      }
    }
    return obj;
  }
}
function foldline(aLine) {
  let result = "";
  let line = aLine || "", pos = 0, line_length = 0;
  while (line.length) {
    let cp = line.codePointAt(pos);
    if (cp < 128) ++line_length;
    else if (cp < 2048) line_length += 2;
    else if (cp < 65536) line_length += 3;
    else line_length += 4;
    if (line_length < ICALmodule.foldLength + 1)
      pos += cp > 65535 ? 2 : 1;
    else {
      result += ICALmodule.newLineChar + " " + line.slice(0, Math.max(0, pos));
      line = line.slice(Math.max(0, pos));
      pos = line_length = 0;
    }
  }
  return result.slice(ICALmodule.newLineChar.length + 1);
}
function pad2(data) {
  if (typeof data !== "string") {
    if (typeof data === "number") {
      data = parseInt(data);
    }
    data = String(data);
  }
  let len = data.length;
  switch (len) {
    case 0:
      return "00";
    case 1:
      return "0" + data;
    default:
      return data;
  }
}
function trunc(number) {
  return number < 0 ? Math.ceil(number) : Math.floor(number);
}
function extend(source, target) {
  for (let key in source) {
    let descr = Object.getOwnPropertyDescriptor(source, key);
    if (descr && !Object.getOwnPropertyDescriptor(target, key)) {
      Object.defineProperty(target, key, descr);
    }
  }
  return target;
}
var helpers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  binsearchInsert,
  clone,
  extend,
  foldline,
  formatClassType,
  isStrictlyNaN,
  pad2,
  strictParseInt,
  trunc,
  unescapedIndexOf,
  updateTimezones
});
var UtcOffset = class _UtcOffset {
  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed string.
   *
   * @param {String} aString    The string to parse
   * @return {Duration}         The created utc-offset instance
   */
  static fromString(aString) {
    let options = {};
    options.factor = aString[0] === "+" ? 1 : -1;
    options.hours = strictParseInt(aString.slice(1, 3));
    options.minutes = strictParseInt(aString.slice(4, 6));
    return new _UtcOffset(options);
  }
  /**
   * Creates a new {@link ICAL.UtcOffset} instance from the passed seconds
   * value.
   *
   * @param {Number} aSeconds       The number of seconds to convert
   */
  static fromSeconds(aSeconds) {
    let instance = new _UtcOffset();
    instance.fromSeconds(aSeconds);
    return instance;
  }
  /**
   * Creates a new ICAL.UtcOffset instance.
   *
   * @param {Object} aData          An object with members of the utc offset
   * @param {Number=} aData.hours   The hours for the utc offset
   * @param {Number=} aData.minutes The minutes in the utc offset
   * @param {Number=} aData.factor  The factor for the utc-offset, either -1 or 1
   */
  constructor(aData) {
    this.fromData(aData);
  }
  /**
   * The hours in the utc-offset
   * @type {Number}
   */
  hours = 0;
  /**
   * The minutes in the utc-offset
   * @type {Number}
   */
  minutes = 0;
  /**
   * The sign of the utc offset, 1 for positive offset, -1 for negative
   * offsets.
   * @type {Number}
   */
  factor = 1;
  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "utc-offset"
   */
  icaltype = "utc-offset";
  /**
   * Returns a clone of the utc offset object.
   *
   * @return {UtcOffset}     The cloned object
   */
  clone() {
    return _UtcOffset.fromSeconds(this.toSeconds());
  }
  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Object} aData          An object with members of the utc offset
   * @param {Number=} aData.hours   The hours for the utc offset
   * @param {Number=} aData.minutes The minutes in the utc offset
   * @param {Number=} aData.factor  The factor for the utc-offset, either -1 or 1
   */
  fromData(aData) {
    if (aData) {
      for (let [key, value] of Object.entries(aData)) {
        this[key] = value;
      }
    }
    this._normalize();
  }
  /**
   * Sets up the current instance from the given seconds value. The seconds
   * value is truncated to the minute. Offsets are wrapped when the world
   * ends, the hour after UTC+14:00 is UTC-12:00.
   *
   * @param {Number} aSeconds         The seconds to convert into an offset
   */
  fromSeconds(aSeconds) {
    let secs = Math.abs(aSeconds);
    this.factor = aSeconds < 0 ? -1 : 1;
    this.hours = trunc(secs / 3600);
    secs -= this.hours * 3600;
    this.minutes = trunc(secs / 60);
    return this;
  }
  /**
   * Convert the current offset to a value in seconds
   *
   * @return {Number}                 The offset in seconds
   */
  toSeconds() {
    return this.factor * (60 * this.minutes + 3600 * this.hours);
  }
  /**
   * Compare this utc offset with another one.
   *
   * @param {UtcOffset} other             The other offset to compare with
   * @return {Number}                     -1, 0 or 1 for less/equal/greater
   */
  compare(other) {
    let a = this.toSeconds();
    let b = other.toSeconds();
    return (a > b) - (b > a);
  }
  _normalize() {
    let secs = this.toSeconds();
    let factor = this.factor;
    while (secs < -43200) {
      secs += 97200;
    }
    while (secs > 50400) {
      secs -= 97200;
    }
    this.fromSeconds(secs);
    if (secs == 0) {
      this.factor = factor;
    }
  }
  /**
   * The iCalendar string representation of this utc-offset.
   * @return {String}
   */
  toICALString() {
    return design.icalendar.value["utc-offset"].toICAL(this.toString());
  }
  /**
   * The string representation of this utc-offset.
   * @return {String}
   */
  toString() {
    return (this.factor == 1 ? "+" : "-") + pad2(this.hours) + ":" + pad2(this.minutes);
  }
};
var VCardTime = class _VCardTime extends Time {
  /**
   * Returns a new ICAL.VCardTime instance from a date and/or time string.
   *
   * @param {String} aValue     The string to create from
   * @param {String} aIcalType  The type for this instance, e.g. date-and-or-time
   * @return {VCardTime}        The date/time instance
   */
  static fromDateAndOrTimeString(aValue, aIcalType) {
    function part(v, s, e) {
      return v ? strictParseInt(v.slice(s, s + e)) : null;
    }
    let parts = aValue.split("T");
    let dt = parts[0], tmz = parts[1];
    let splitzone = tmz ? design.vcard.value.time._splitZone(tmz) : [];
    let zone = splitzone[0], tm = splitzone[1];
    let dtlen = dt ? dt.length : 0;
    let tmlen = tm ? tm.length : 0;
    let hasDashDate = dt && dt[0] == "-" && dt[1] == "-";
    let hasDashTime = tm && tm[0] == "-";
    let o = {
      year: hasDashDate ? null : part(dt, 0, 4),
      month: hasDashDate && (dtlen == 4 || dtlen == 7) ? part(dt, 2, 2) : dtlen == 7 ? part(dt, 5, 2) : dtlen == 10 ? part(dt, 5, 2) : null,
      day: dtlen == 5 ? part(dt, 3, 2) : dtlen == 7 && hasDashDate ? part(dt, 5, 2) : dtlen == 10 ? part(dt, 8, 2) : null,
      hour: hasDashTime ? null : part(tm, 0, 2),
      minute: hasDashTime && tmlen == 3 ? part(tm, 1, 2) : tmlen > 4 ? hasDashTime ? part(tm, 1, 2) : part(tm, 3, 2) : null,
      second: tmlen == 4 ? part(tm, 2, 2) : tmlen == 6 ? part(tm, 4, 2) : tmlen == 8 ? part(tm, 6, 2) : null
    };
    if (zone == "Z") {
      zone = Timezone.utcTimezone;
    } else if (zone && zone[3] == ":") {
      zone = UtcOffset.fromString(zone);
    } else {
      zone = null;
    }
    return new _VCardTime(o, zone, aIcalType);
  }
  /**
   * Creates a new ICAL.VCardTime instance.
   *
   * @param {Object} data                           The data for the time instance
   * @param {Number=} data.year                     The year for this date
   * @param {Number=} data.month                    The month for this date
   * @param {Number=} data.day                      The day for this date
   * @param {Number=} data.hour                     The hour for this date
   * @param {Number=} data.minute                   The minute for this date
   * @param {Number=} data.second                   The second for this date
   * @param {Timezone|UtcOffset} zone               The timezone to use
   * @param {String} icaltype                       The type for this date/time object
   */
  constructor(data, zone, icaltype) {
    super(data, zone);
    this.icaltype = icaltype || "date-and-or-time";
  }
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "vcardtime"
   */
  icalclass = "vcardtime";
  /**
   * The type name, to be used in the jCal object.
   * @type {String}
   * @default "date-and-or-time"
   */
  icaltype = "date-and-or-time";
  /**
   * Returns a clone of the vcard date/time object.
   *
   * @return {VCardTime}     The cloned object
   */
  clone() {
    return new _VCardTime(this._time, this.zone, this.icaltype);
  }
  _normalize() {
    return this;
  }
  /**
   * @inheritdoc
   */
  utcOffset() {
    if (this.zone instanceof UtcOffset) {
      return this.zone.toSeconds();
    } else {
      return Time.prototype.utcOffset.apply(this, arguments);
    }
  }
  /**
   * Returns an RFC 6350 compliant representation of this object.
   *
   * @return {String}         vcard date/time string
   */
  toICALString() {
    return design.vcard.value[this.icaltype].toICAL(this.toString());
  }
  /**
   * The string representation of this date/time, in jCard form
   * (including : and - separators).
   * @return {String}
   */
  toString() {
    let y = this.year, m = this.month, d = this.day;
    let h = this.hour, mm = this.minute, s = this.second;
    let hasYear = y !== null, hasMonth = m !== null, hasDay = d !== null;
    let hasHour = h !== null, hasMinute = mm !== null, hasSecond = s !== null;
    let datepart = (hasYear ? pad2(y) + (hasMonth || hasDay ? "-" : "") : hasMonth || hasDay ? "--" : "") + (hasMonth ? pad2(m) : "") + (hasDay ? "-" + pad2(d) : "");
    let timepart = (hasHour ? pad2(h) : "-") + (hasHour && hasMinute ? ":" : "") + (hasMinute ? pad2(mm) : "") + (!hasHour && !hasMinute ? "-" : "") + (hasMinute && hasSecond ? ":" : "") + (hasSecond ? pad2(s) : "");
    let zone;
    if (this.zone === Timezone.utcTimezone) {
      zone = "Z";
    } else if (this.zone instanceof UtcOffset) {
      zone = this.zone.toString();
    } else if (this.zone === Timezone.localTimezone) {
      zone = "";
    } else if (this.zone instanceof Timezone) {
      let offset = UtcOffset.fromSeconds(this.zone.utcOffset(this));
      zone = offset.toString();
    } else {
      zone = "";
    }
    switch (this.icaltype) {
      case "time":
        return timepart + zone;
      case "date-and-or-time":
      case "date-time":
        return datepart + (timepart == "--" ? "" : "T" + timepart + zone);
      case "date":
        return datepart;
    }
    return null;
  }
};
var RecurIterator = class _RecurIterator {
  static _indexMap = {
    "BYSECOND": 0,
    "BYMINUTE": 1,
    "BYHOUR": 2,
    "BYDAY": 3,
    "BYMONTHDAY": 4,
    "BYYEARDAY": 5,
    "BYWEEKNO": 6,
    "BYMONTH": 7,
    "BYSETPOS": 8
  };
  static _expandMap = {
    "SECONDLY": [1, 1, 1, 1, 1, 1, 1, 1],
    "MINUTELY": [2, 1, 1, 1, 1, 1, 1, 1],
    "HOURLY": [2, 2, 1, 1, 1, 1, 1, 1],
    "DAILY": [2, 2, 2, 1, 1, 1, 1, 1],
    "WEEKLY": [2, 2, 2, 2, 3, 3, 1, 1],
    "MONTHLY": [2, 2, 2, 2, 2, 3, 3, 1],
    "YEARLY": [2, 2, 2, 2, 2, 2, 2, 2]
  };
  static UNKNOWN = 0;
  static CONTRACT = 1;
  static EXPAND = 2;
  static ILLEGAL = 3;
  /**
   * Creates a new ICAL.RecurIterator instance. The options object may contain additional members
   * when resuming iteration from a previous run.
   *
   * @param {Object} options                The iterator options
   * @param {Recur} options.rule            The rule to iterate.
   * @param {Time} options.dtstart          The start date of the event.
   * @param {Boolean=} options.initialized  When true, assume that options are
   *        from a previously constructed iterator. Initialization will not be
   *        repeated.
   */
  constructor(options) {
    this.fromData(options);
  }
  /**
   * True when iteration is finished.
   * @type {Boolean}
   */
  completed = false;
  /**
   * The rule that is being iterated
   * @type {Recur}
   */
  rule = null;
  /**
   * The start date of the event being iterated.
   * @type {Time}
   */
  dtstart = null;
  /**
   * The last occurrence that was returned from the
   * {@link RecurIterator#next} method.
   * @type {Time}
   */
  last = null;
  /**
   * The sequence number from the occurrence
   * @type {Number}
   */
  occurrence_number = 0;
  /**
   * The indices used for the {@link ICAL.RecurIterator#by_data} object.
   * @type {Object}
   * @private
   */
  by_indices = null;
  /**
   * If true, the iterator has already been initialized
   * @type {Boolean}
   * @private
   */
  initialized = false;
  /**
   * The initializd by-data.
   * @type {Object}
   * @private
   */
  by_data = null;
  /**
   * The expanded yeardays
   * @type {Array}
   * @private
   */
  days = null;
  /**
   * The index in the {@link ICAL.RecurIterator#days} array.
   * @type {Number}
   * @private
   */
  days_index = 0;
  /**
   * Initialize the recurrence iterator from the passed data object. This
   * method is usually not called directly, you can initialize the iterator
   * through the constructor.
   *
   * @param {Object} options                The iterator options
   * @param {Recur} options.rule            The rule to iterate.
   * @param {Time} options.dtstart          The start date of the event.
   * @param {Boolean=} options.initialized  When true, assume that options are
   *        from a previously constructed iterator. Initialization will not be
   *        repeated.
   */
  fromData(options) {
    this.rule = formatClassType(options.rule, Recur);
    if (!this.rule) {
      throw new Error("iterator requires a (ICAL.Recur) rule");
    }
    this.dtstart = formatClassType(options.dtstart, Time);
    if (!this.dtstart) {
      throw new Error("iterator requires a (ICAL.Time) dtstart");
    }
    if (options.by_data) {
      this.by_data = options.by_data;
    } else {
      this.by_data = clone(this.rule.parts, true);
    }
    if (options.occurrence_number)
      this.occurrence_number = options.occurrence_number;
    this.days = options.days || [];
    if (options.last) {
      this.last = formatClassType(options.last, Time);
    }
    this.by_indices = options.by_indices;
    if (!this.by_indices) {
      this.by_indices = {
        "BYSECOND": 0,
        "BYMINUTE": 0,
        "BYHOUR": 0,
        "BYDAY": 0,
        "BYMONTH": 0,
        "BYWEEKNO": 0,
        "BYMONTHDAY": 0
      };
    }
    this.initialized = options.initialized || false;
    if (!this.initialized) {
      try {
        this.init();
      } catch (e) {
        if (e instanceof InvalidRecurrenceRuleError) {
          this.completed = true;
        } else {
          throw e;
        }
      }
    }
  }
  /**
   * Initialize the iterator
   * @private
   */
  init() {
    this.initialized = true;
    this.last = this.dtstart.clone();
    let parts = this.by_data;
    if ("BYDAY" in parts) {
      this.sort_byday_rules(parts.BYDAY);
    }
    if ("BYYEARDAY" in parts) {
      if ("BYMONTH" in parts || "BYWEEKNO" in parts || "BYMONTHDAY" in parts) {
        throw new Error("Invalid BYYEARDAY rule");
      }
    }
    if ("BYWEEKNO" in parts && "BYMONTHDAY" in parts) {
      throw new Error("BYWEEKNO does not fit to BYMONTHDAY");
    }
    if (this.rule.freq == "MONTHLY" && ("BYYEARDAY" in parts || "BYWEEKNO" in parts)) {
      throw new Error("For MONTHLY recurrences neither BYYEARDAY nor BYWEEKNO may appear");
    }
    if (this.rule.freq == "WEEKLY" && ("BYYEARDAY" in parts || "BYMONTHDAY" in parts)) {
      throw new Error("For WEEKLY recurrences neither BYMONTHDAY nor BYYEARDAY may appear");
    }
    if (this.rule.freq != "YEARLY" && "BYYEARDAY" in parts) {
      throw new Error("BYYEARDAY may only appear in YEARLY rules");
    }
    this.last.second = this.setup_defaults("BYSECOND", "SECONDLY", this.dtstart.second);
    this.last.minute = this.setup_defaults("BYMINUTE", "MINUTELY", this.dtstart.minute);
    this.last.hour = this.setup_defaults("BYHOUR", "HOURLY", this.dtstart.hour);
    this.last.day = this.setup_defaults("BYMONTHDAY", "DAILY", this.dtstart.day);
    this.last.month = this.setup_defaults("BYMONTH", "MONTHLY", this.dtstart.month);
    if (this.rule.freq == "WEEKLY") {
      if ("BYDAY" in parts) {
        let [, dow] = this.ruleDayOfWeek(parts.BYDAY[0], this.rule.wkst);
        let wkdy = dow - this.last.dayOfWeek(this.rule.wkst);
        if (this.last.dayOfWeek(this.rule.wkst) < dow && wkdy >= 0 || wkdy < 0) {
          this.last.day += wkdy;
        }
      } else {
        let dayName = Recur.numericDayToIcalDay(this.dtstart.dayOfWeek());
        parts.BYDAY = [dayName];
      }
    }
    if (this.rule.freq == "YEARLY") {
      const untilYear = this.rule.until ? this.rule.until.year : 2e4;
      while (this.last.year <= untilYear) {
        this.expand_year_days(this.last.year);
        if (this.days.length > 0) {
          break;
        }
        this.increment_year(this.rule.interval);
      }
      if (this.days.length == 0) {
        throw new InvalidRecurrenceRuleError();
      }
      if (!this._nextByYearDay() && !this.next_year() && !this.next_year() && !this.next_year()) {
        throw new InvalidRecurrenceRuleError();
      }
    }
    if (this.rule.freq == "MONTHLY") {
      if (this.has_by_data("BYDAY")) {
        let tempLast = null;
        let initLast = this.last.clone();
        let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
        for (let bydow of this.by_data.BYDAY) {
          this.last = initLast.clone();
          let [pos, dow] = this.ruleDayOfWeek(bydow);
          let dayOfMonth = this.last.nthWeekDay(dow, pos);
          if (pos >= 6 || pos <= -6) {
            throw new Error("Malformed values in BYDAY part");
          }
          if (dayOfMonth > daysInMonth || dayOfMonth <= 0) {
            if (tempLast && tempLast.month == initLast.month) {
              continue;
            }
            while (dayOfMonth > daysInMonth || dayOfMonth <= 0) {
              this.increment_month();
              daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
              dayOfMonth = this.last.nthWeekDay(dow, pos);
            }
          }
          this.last.day = dayOfMonth;
          if (!tempLast || this.last.compare(tempLast) < 0) {
            tempLast = this.last.clone();
          }
        }
        this.last = tempLast.clone();
        if (this.has_by_data("BYMONTHDAY")) {
          this._byDayAndMonthDay(true);
        }
        if (this.last.day > daysInMonth || this.last.day == 0) {
          throw new Error("Malformed values in BYDAY part");
        }
      } else if (this.has_by_data("BYMONTHDAY")) {
        this.last.day = 1;
        let normalized = this.normalizeByMonthDayRules(
          this.last.year,
          this.last.month,
          this.rule.parts.BYMONTHDAY
        ).filter((d) => d >= this.last.day);
        if (normalized.length) {
          this.last.day = normalized[0];
          this.by_data.BYMONTHDAY = normalized;
        } else {
          if (!this.next_month() && !this.next_month() && !this.next_month()) {
            throw new InvalidRecurrenceRuleError();
          }
        }
      }
    }
  }
  /**
   * Retrieve the next occurrence from the iterator.
   * @return {Time}
   */
  next(again = false) {
    let before = this.last ? this.last.clone() : null;
    if (this.rule.count && this.occurrence_number >= this.rule.count || this.rule.until && this.last.compare(this.rule.until) > 0) {
      this.completed = true;
    }
    if (this.completed) {
      return null;
    }
    if (this.occurrence_number == 0 && this.last.compare(this.dtstart) >= 0) {
      this.occurrence_number++;
      return this.last;
    }
    let valid;
    let invalid_count = 0;
    do {
      valid = 1;
      switch (this.rule.freq) {
        case "SECONDLY":
          this.next_second();
          break;
        case "MINUTELY":
          this.next_minute();
          break;
        case "HOURLY":
          this.next_hour();
          break;
        case "DAILY":
          this.next_day();
          break;
        case "WEEKLY":
          this.next_week();
          break;
        case "MONTHLY":
          valid = this.next_month();
          if (valid) {
            invalid_count = 0;
          } else if (++invalid_count == 336) {
            this.completed = true;
            return null;
          }
          break;
        case "YEARLY":
          valid = this.next_year();
          if (valid) {
            invalid_count = 0;
          } else if (++invalid_count == 28) {
            this.completed = true;
            return null;
          }
          break;
        default:
          return null;
      }
    } while (!this.check_contracting_rules() || this.last.compare(this.dtstart) < 0 || !valid);
    if (this.last.compare(before) == 0) {
      if (again) {
        throw new Error("Same occurrence found twice, protecting you from death by recursion");
      }
      this.next(true);
    }
    if (this.rule.until && this.last.compare(this.rule.until) > 0) {
      this.completed = true;
      return null;
    } else {
      this.occurrence_number++;
      return this.last;
    }
  }
  next_second() {
    return this.next_generic("BYSECOND", "SECONDLY", "second", "minute");
  }
  increment_second(inc) {
    return this.increment_generic(inc, "second", 60, "minute");
  }
  next_minute() {
    return this.next_generic(
      "BYMINUTE",
      "MINUTELY",
      "minute",
      "hour",
      "next_second"
    );
  }
  increment_minute(inc) {
    return this.increment_generic(inc, "minute", 60, "hour");
  }
  next_hour() {
    return this.next_generic(
      "BYHOUR",
      "HOURLY",
      "hour",
      "monthday",
      "next_minute"
    );
  }
  increment_hour(inc) {
    this.increment_generic(inc, "hour", 24, "monthday");
  }
  next_day() {
    let this_freq = this.rule.freq == "DAILY";
    if (this.next_hour() == 0) {
      return 0;
    }
    if (this_freq) {
      this.increment_monthday(this.rule.interval);
    } else {
      this.increment_monthday(1);
    }
    return 0;
  }
  next_week() {
    let end_of_data = 0;
    if (this.next_weekday_by_week() == 0) {
      return end_of_data;
    }
    if (this.has_by_data("BYWEEKNO")) {
      this.by_indices.BYWEEKNO++;
      if (this.by_indices.BYWEEKNO == this.by_data.BYWEEKNO.length) {
        this.by_indices.BYWEEKNO = 0;
        end_of_data = 1;
      }
      this.last.month = 1;
      this.last.day = 1;
      let week_no = this.by_data.BYWEEKNO[this.by_indices.BYWEEKNO];
      this.last.day += 7 * week_no;
      if (end_of_data) {
        this.increment_year(1);
      }
    } else {
      this.increment_monthday(7 * this.rule.interval);
    }
    return end_of_data;
  }
  /**
   * Normalize each by day rule for a given year/month.
   * Takes into account ordering and negative rules
   *
   * @private
   * @param {Number} year         Current year.
   * @param {Number} month        Current month.
   * @param {Array}  rules        Array of rules.
   *
   * @return {Array} sorted and normalized rules.
   *                 Negative rules will be expanded to their
   *                 correct positive values for easier processing.
   */
  normalizeByMonthDayRules(year, month, rules) {
    let daysInMonth = Time.daysInMonth(month, year);
    let newRules = [];
    let ruleIdx = 0;
    let len = rules.length;
    let rule;
    for (; ruleIdx < len; ruleIdx++) {
      rule = parseInt(rules[ruleIdx], 10);
      if (isNaN(rule)) {
        throw new Error("Invalid BYMONTHDAY value");
      }
      if (Math.abs(rule) > daysInMonth) {
        continue;
      }
      if (rule < 0) {
        rule = daysInMonth + (rule + 1);
      } else if (rule === 0) {
        continue;
      }
      if (newRules.indexOf(rule) === -1) {
        newRules.push(rule);
      }
    }
    return newRules.sort(function(a, b) {
      return a - b;
    });
  }
  /**
   * NOTES:
   * We are given a list of dates in the month (BYMONTHDAY) (23, etc..)
   * Also we are given a list of days (BYDAY) (MO, 2SU, etc..) when
   * both conditions match a given date (this.last.day) iteration stops.
   *
   * @private
   * @param {Boolean=} isInit     When given true will not increment the
   *                                current day (this.last).
   */
  _byDayAndMonthDay(isInit) {
    let byMonthDay;
    let byDay = this.by_data.BYDAY;
    let date;
    let dateIdx = 0;
    let dateLen;
    let dayLen = byDay.length;
    let dataIsValid = 0;
    let daysInMonth;
    let self = this;
    let lastDay = this.last.day;
    function initMonth() {
      daysInMonth = Time.daysInMonth(
        self.last.month,
        self.last.year
      );
      byMonthDay = self.normalizeByMonthDayRules(
        self.last.year,
        self.last.month,
        self.by_data.BYMONTHDAY
      );
      dateLen = byMonthDay.length;
      while (byMonthDay[dateIdx] <= lastDay && !(isInit && byMonthDay[dateIdx] == lastDay) && dateIdx < dateLen - 1) {
        dateIdx++;
      }
    }
    function nextMonth() {
      lastDay = 0;
      self.increment_month();
      dateIdx = 0;
      initMonth();
    }
    initMonth();
    if (isInit) {
      lastDay -= 1;
    }
    let monthsCounter = 48;
    while (!dataIsValid && monthsCounter) {
      monthsCounter--;
      date = lastDay + 1;
      if (date > daysInMonth) {
        nextMonth();
        continue;
      }
      let next = byMonthDay[dateIdx++];
      if (next >= date) {
        lastDay = next;
      } else {
        nextMonth();
        continue;
      }
      for (let dayIdx = 0; dayIdx < dayLen; dayIdx++) {
        let parts = this.ruleDayOfWeek(byDay[dayIdx]);
        let pos = parts[0];
        let dow = parts[1];
        this.last.day = lastDay;
        if (this.last.isNthWeekDay(dow, pos)) {
          dataIsValid = 1;
          break;
        }
      }
      if (!dataIsValid && dateIdx === dateLen) {
        nextMonth();
        continue;
      }
    }
    if (monthsCounter <= 0) {
      throw new Error("Malformed values in BYDAY combined with BYMONTHDAY parts");
    }
    return dataIsValid;
  }
  next_month() {
    let data_valid = 1;
    if (this.next_hour() == 0) {
      return data_valid;
    }
    if (this.has_by_data("BYDAY") && this.has_by_data("BYMONTHDAY")) {
      data_valid = this._byDayAndMonthDay();
    } else if (this.has_by_data("BYDAY")) {
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      let setpos = 0;
      let setpos_total = 0;
      if (this.has_by_data("BYSETPOS")) {
        let last_day = this.last.day;
        for (let day2 = 1; day2 <= daysInMonth; day2++) {
          this.last.day = day2;
          if (this.is_day_in_byday(this.last)) {
            setpos_total++;
            if (day2 <= last_day) {
              setpos++;
            }
          }
        }
        this.last.day = last_day;
      }
      data_valid = 0;
      let day;
      for (day = this.last.day + 1; day <= daysInMonth; day++) {
        this.last.day = day;
        if (this.is_day_in_byday(this.last)) {
          if (!this.has_by_data("BYSETPOS") || this.check_set_position(++setpos) || this.check_set_position(setpos - setpos_total - 1)) {
            data_valid = 1;
            break;
          }
        }
      }
      if (day > daysInMonth) {
        this.last.day = 1;
        this.increment_month();
        if (this.is_day_in_byday(this.last)) {
          if (!this.has_by_data("BYSETPOS") || this.check_set_position(1)) {
            data_valid = 1;
          }
        } else {
          data_valid = 0;
        }
      }
    } else if (this.has_by_data("BYMONTHDAY")) {
      this.by_indices.BYMONTHDAY++;
      if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
        this.by_indices.BYMONTHDAY = 0;
        this.increment_month();
        if (this.by_indices.BYMONTHDAY >= this.by_data.BYMONTHDAY.length) {
          return 0;
        }
      }
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      let day = this.by_data.BYMONTHDAY[this.by_indices.BYMONTHDAY];
      if (day < 0) {
        day = daysInMonth + day + 1;
      }
      if (day > daysInMonth) {
        this.last.day = 1;
        data_valid = this.is_day_in_byday(this.last);
      } else {
        this.last.day = day;
      }
    } else {
      this.increment_month();
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      if (this.by_data.BYMONTHDAY[0] > daysInMonth) {
        data_valid = 0;
      } else {
        this.last.day = this.by_data.BYMONTHDAY[0];
      }
    }
    return data_valid;
  }
  next_weekday_by_week() {
    let end_of_data = 0;
    if (this.next_hour() == 0) {
      return end_of_data;
    }
    if (!this.has_by_data("BYDAY")) {
      return 1;
    }
    for (; ; ) {
      let tt = new Time();
      this.by_indices.BYDAY++;
      if (this.by_indices.BYDAY == Object.keys(this.by_data.BYDAY).length) {
        this.by_indices.BYDAY = 0;
        end_of_data = 1;
      }
      let coded_day = this.by_data.BYDAY[this.by_indices.BYDAY];
      let parts = this.ruleDayOfWeek(coded_day);
      let dow = parts[1];
      dow -= this.rule.wkst;
      if (dow < 0) {
        dow += 7;
      }
      tt.year = this.last.year;
      tt.month = this.last.month;
      tt.day = this.last.day;
      let startOfWeek = tt.startDoyWeek(this.rule.wkst);
      if (dow + startOfWeek < 1) {
        if (!end_of_data) {
          continue;
        }
      }
      let next = Time.fromDayOfYear(startOfWeek + dow, this.last.year);
      this.last.year = next.year;
      this.last.month = next.month;
      this.last.day = next.day;
      return end_of_data;
    }
  }
  next_year() {
    if (this.next_hour() == 0) {
      return 0;
    }
    if (this.days.length == 0 || ++this.days_index == this.days.length) {
      this.days_index = 0;
      this.increment_year(this.rule.interval);
      if (this.has_by_data("BYMONTHDAY")) {
        this.by_data.BYMONTHDAY = this.normalizeByMonthDayRules(
          this.last.year,
          this.last.month,
          this.rule.parts.BYMONTHDAY
        );
      }
      this.expand_year_days(this.last.year);
      if (this.days.length == 0) {
        return 0;
      }
    }
    return this._nextByYearDay();
  }
  _nextByYearDay() {
    let doy = this.days[this.days_index];
    let year = this.last.year;
    if (Math.abs(doy) == 366 && !Time.isLeapYear(this.last.year)) {
      return 0;
    }
    if (doy < 1) {
      doy += 1;
      year += 1;
    }
    let next = Time.fromDayOfYear(doy, year);
    this.last.day = next.day;
    this.last.month = next.month;
    return 1;
  }
  /**
   * @param dow (eg: '1TU', '-1MO')
   * @param {weekDay=} aWeekStart The week start weekday
   * @return [pos, numericDow] (eg: [1, 3]) numericDow is relative to aWeekStart
   */
  ruleDayOfWeek(dow, aWeekStart) {
    let matches = dow.match(/([+-]?[0-9])?(MO|TU|WE|TH|FR|SA|SU)/);
    if (matches) {
      let pos = parseInt(matches[1] || 0, 10);
      dow = Recur.icalDayToNumericDay(matches[2], aWeekStart);
      return [pos, dow];
    } else {
      return [0, 0];
    }
  }
  next_generic(aRuleType, aInterval, aDateAttr, aFollowingAttr, aPreviousIncr) {
    let has_by_rule = aRuleType in this.by_data;
    let this_freq = this.rule.freq == aInterval;
    let end_of_data = 0;
    if (aPreviousIncr && this[aPreviousIncr]() == 0) {
      return end_of_data;
    }
    if (has_by_rule) {
      this.by_indices[aRuleType]++;
      let dta = this.by_data[aRuleType];
      if (this.by_indices[aRuleType] == dta.length) {
        this.by_indices[aRuleType] = 0;
        end_of_data = 1;
      }
      this.last[aDateAttr] = dta[this.by_indices[aRuleType]];
    } else if (this_freq) {
      this["increment_" + aDateAttr](this.rule.interval);
    }
    if (has_by_rule && end_of_data && this_freq) {
      this["increment_" + aFollowingAttr](1);
    }
    return end_of_data;
  }
  increment_monthday(inc) {
    for (let i = 0; i < inc; i++) {
      let daysInMonth = Time.daysInMonth(this.last.month, this.last.year);
      this.last.day++;
      if (this.last.day > daysInMonth) {
        this.last.day -= daysInMonth;
        this.increment_month();
      }
    }
  }
  increment_month() {
    this.last.day = 1;
    if (this.has_by_data("BYMONTH")) {
      this.by_indices.BYMONTH++;
      if (this.by_indices.BYMONTH == this.by_data.BYMONTH.length) {
        this.by_indices.BYMONTH = 0;
        this.increment_year(1);
      }
      this.last.month = this.by_data.BYMONTH[this.by_indices.BYMONTH];
    } else {
      if (this.rule.freq == "MONTHLY") {
        this.last.month += this.rule.interval;
      } else {
        this.last.month++;
      }
      this.last.month--;
      let years = trunc(this.last.month / 12);
      this.last.month %= 12;
      this.last.month++;
      if (years != 0) {
        this.increment_year(years);
      }
    }
    if (this.has_by_data("BYMONTHDAY")) {
      this.by_data.BYMONTHDAY = this.normalizeByMonthDayRules(
        this.last.year,
        this.last.month,
        this.rule.parts.BYMONTHDAY
      );
    }
  }
  increment_year(inc) {
    this.last.day = 1;
    this.last.year += inc;
  }
  increment_generic(inc, aDateAttr, aFactor, aNextIncrement) {
    this.last[aDateAttr] += inc;
    let nextunit = trunc(this.last[aDateAttr] / aFactor);
    this.last[aDateAttr] %= aFactor;
    if (nextunit != 0) {
      this["increment_" + aNextIncrement](nextunit);
    }
  }
  has_by_data(aRuleType) {
    return aRuleType in this.rule.parts;
  }
  expand_year_days(aYear) {
    let t = new Time();
    this.days = [];
    let parts = {};
    let rules = ["BYDAY", "BYWEEKNO", "BYMONTHDAY", "BYMONTH", "BYYEARDAY"];
    for (let part of rules) {
      if (part in this.rule.parts) {
        parts[part] = this.rule.parts[part];
      }
    }
    if ("BYMONTH" in parts && "BYWEEKNO" in parts) {
      let valid = 1;
      let validWeeks = {};
      t.year = aYear;
      t.isDate = true;
      for (let monthIdx = 0; monthIdx < this.by_data.BYMONTH.length; monthIdx++) {
        let month = this.by_data.BYMONTH[monthIdx];
        t.month = month;
        t.day = 1;
        let first_week = t.weekNumber(this.rule.wkst);
        t.day = Time.daysInMonth(month, aYear);
        let last_week = t.weekNumber(this.rule.wkst);
        for (monthIdx = first_week; monthIdx < last_week; monthIdx++) {
          validWeeks[monthIdx] = 1;
        }
      }
      for (let weekIdx = 0; weekIdx < this.by_data.BYWEEKNO.length && valid; weekIdx++) {
        let weekno = this.by_data.BYWEEKNO[weekIdx];
        if (weekno < 52) {
          valid &= validWeeks[weekIdx];
        } else {
          valid = 0;
        }
      }
      if (valid) {
        delete parts.BYMONTH;
      } else {
        delete parts.BYWEEKNO;
      }
    }
    let partCount = Object.keys(parts).length;
    if (partCount == 0) {
      let t1 = this.dtstart.clone();
      t1.year = this.last.year;
      this.days.push(t1.dayOfYear());
    } else if (partCount == 1 && "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let t2 = this.dtstart.clone();
        t2.year = aYear;
        t2.month = month;
        t2.isDate = true;
        this.days.push(t2.dayOfYear());
      }
    } else if (partCount == 1 && "BYMONTHDAY" in parts) {
      for (let monthday of this.by_data.BYMONTHDAY) {
        let t3 = this.dtstart.clone();
        if (monthday < 0) {
          let daysInMonth = Time.daysInMonth(t3.month, aYear);
          monthday = monthday + daysInMonth + 1;
        }
        t3.day = monthday;
        t3.year = aYear;
        t3.isDate = true;
        this.days.push(t3.dayOfYear());
      }
    } else if (partCount == 2 && "BYMONTHDAY" in parts && "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let daysInMonth = Time.daysInMonth(month, aYear);
        for (let monthday of this.by_data.BYMONTHDAY) {
          if (monthday < 0) {
            monthday = monthday + daysInMonth + 1;
          }
          t.day = monthday;
          t.month = month;
          t.year = aYear;
          t.isDate = true;
          this.days.push(t.dayOfYear());
        }
      }
    } else if (partCount == 1 && "BYWEEKNO" in parts) ;
    else if (partCount == 2 && "BYWEEKNO" in parts && "BYMONTHDAY" in parts) ;
    else if (partCount == 1 && "BYDAY" in parts) {
      this.days = this.days.concat(this.expand_by_day(aYear));
    } else if (partCount == 2 && "BYDAY" in parts && "BYMONTH" in parts) {
      for (let month of this.by_data.BYMONTH) {
        let daysInMonth = Time.daysInMonth(month, aYear);
        t.year = aYear;
        t.month = month;
        t.day = 1;
        t.isDate = true;
        let first_dow = t.dayOfWeek();
        let doy_offset = t.dayOfYear() - 1;
        t.day = daysInMonth;
        let last_dow = t.dayOfWeek();
        if (this.has_by_data("BYSETPOS")) {
          let by_month_day = [];
          for (let day = 1; day <= daysInMonth; day++) {
            t.day = day;
            if (this.is_day_in_byday(t)) {
              by_month_day.push(day);
            }
          }
          for (let spIndex = 0; spIndex < by_month_day.length; spIndex++) {
            if (this.check_set_position(spIndex + 1) || this.check_set_position(spIndex - by_month_day.length)) {
              this.days.push(doy_offset + by_month_day[spIndex]);
            }
          }
        } else {
          for (let coded_day of this.by_data.BYDAY) {
            let bydayParts = this.ruleDayOfWeek(coded_day);
            let pos = bydayParts[0];
            let dow = bydayParts[1];
            let month_day;
            let first_matching_day = (dow + 7 - first_dow) % 7 + 1;
            let last_matching_day = daysInMonth - (last_dow + 7 - dow) % 7;
            if (pos == 0) {
              for (let day = first_matching_day; day <= daysInMonth; day += 7) {
                this.days.push(doy_offset + day);
              }
            } else if (pos > 0) {
              month_day = first_matching_day + (pos - 1) * 7;
              if (month_day <= daysInMonth) {
                this.days.push(doy_offset + month_day);
              }
            } else {
              month_day = last_matching_day + (pos + 1) * 7;
              if (month_day > 0) {
                this.days.push(doy_offset + month_day);
              }
            }
          }
        }
      }
      this.days.sort(function(a, b) {
        return a - b;
      });
    } else if (partCount == 2 && "BYDAY" in parts && "BYMONTHDAY" in parts) {
      let expandedDays = this.expand_by_day(aYear);
      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);
        if (this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
          this.days.push(day);
        }
      }
    } else if (partCount == 3 && "BYDAY" in parts && "BYMONTHDAY" in parts && "BYMONTH" in parts) {
      let expandedDays = this.expand_by_day(aYear);
      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);
        if (this.by_data.BYMONTH.indexOf(tt.month) >= 0 && this.by_data.BYMONTHDAY.indexOf(tt.day) >= 0) {
          this.days.push(day);
        }
      }
    } else if (partCount == 2 && "BYDAY" in parts && "BYWEEKNO" in parts) {
      let expandedDays = this.expand_by_day(aYear);
      for (let day of expandedDays) {
        let tt = Time.fromDayOfYear(day, aYear);
        let weekno = tt.weekNumber(this.rule.wkst);
        if (this.by_data.BYWEEKNO.indexOf(weekno)) {
          this.days.push(day);
        }
      }
    } else if (partCount == 3 && "BYDAY" in parts && "BYWEEKNO" in parts && "BYMONTHDAY" in parts) ;
    else if (partCount == 1 && "BYYEARDAY" in parts) {
      this.days = this.days.concat(this.by_data.BYYEARDAY);
    } else if (partCount == 2 && "BYYEARDAY" in parts && "BYDAY" in parts) {
      let daysInYear2 = Time.isLeapYear(aYear) ? 366 : 365;
      let expandedDays = new Set(this.expand_by_day(aYear));
      for (let doy of this.by_data.BYYEARDAY) {
        if (doy < 0) {
          doy += daysInYear2 + 1;
        }
        if (expandedDays.has(doy)) {
          this.days.push(doy);
        }
      }
    } else {
      this.days = [];
    }
    let daysInYear = Time.isLeapYear(aYear) ? 366 : 365;
    this.days.sort((a, b) => {
      if (a < 0) a += daysInYear + 1;
      if (b < 0) b += daysInYear + 1;
      return a - b;
    });
    return 0;
  }
  expand_by_day(aYear) {
    let days_list = [];
    let tmp = this.last.clone();
    tmp.year = aYear;
    tmp.month = 1;
    tmp.day = 1;
    tmp.isDate = true;
    let start_dow = tmp.dayOfWeek();
    tmp.month = 12;
    tmp.day = 31;
    tmp.isDate = true;
    let end_dow = tmp.dayOfWeek();
    let end_year_day = tmp.dayOfYear();
    for (let day of this.by_data.BYDAY) {
      let parts = this.ruleDayOfWeek(day);
      let pos = parts[0];
      let dow = parts[1];
      if (pos == 0) {
        let tmp_start_doy = (dow + 7 - start_dow) % 7 + 1;
        for (let doy = tmp_start_doy; doy <= end_year_day; doy += 7) {
          days_list.push(doy);
        }
      } else if (pos > 0) {
        let first;
        if (dow >= start_dow) {
          first = dow - start_dow + 1;
        } else {
          first = dow - start_dow + 8;
        }
        days_list.push(first + (pos - 1) * 7);
      } else {
        let last;
        pos = -pos;
        if (dow <= end_dow) {
          last = end_year_day - end_dow + dow;
        } else {
          last = end_year_day - end_dow + dow - 7;
        }
        days_list.push(last - (pos - 1) * 7);
      }
    }
    return days_list;
  }
  is_day_in_byday(tt) {
    if (this.by_data.BYDAY) {
      for (let day of this.by_data.BYDAY) {
        let parts = this.ruleDayOfWeek(day);
        let pos = parts[0];
        let dow = parts[1];
        let this_dow = tt.dayOfWeek();
        if (pos == 0 && dow == this_dow || tt.nthWeekDay(dow, pos) == tt.day) {
          return 1;
        }
      }
    }
    return 0;
  }
  /**
   * Checks if given value is in BYSETPOS.
   *
   * @private
   * @param {Numeric} aPos position to check for.
   * @return {Boolean} false unless BYSETPOS rules exist
   *                   and the given value is present in rules.
   */
  check_set_position(aPos) {
    if (this.has_by_data("BYSETPOS")) {
      let idx = this.by_data.BYSETPOS.indexOf(aPos);
      return idx !== -1;
    }
    return false;
  }
  sort_byday_rules(aRules) {
    for (let i = 0; i < aRules.length; i++) {
      for (let j = 0; j < i; j++) {
        let one = this.ruleDayOfWeek(aRules[j], this.rule.wkst)[1];
        let two = this.ruleDayOfWeek(aRules[i], this.rule.wkst)[1];
        if (one > two) {
          let tmp = aRules[i];
          aRules[i] = aRules[j];
          aRules[j] = tmp;
        }
      }
    }
  }
  check_contract_restriction(aRuleType, v) {
    let indexMapValue = _RecurIterator._indexMap[aRuleType];
    let ruleMapValue = _RecurIterator._expandMap[this.rule.freq][indexMapValue];
    let pass = false;
    if (aRuleType in this.by_data && ruleMapValue == _RecurIterator.CONTRACT) {
      let ruleType = this.by_data[aRuleType];
      for (let bydata of ruleType) {
        if (bydata == v) {
          pass = true;
          break;
        }
      }
    } else {
      pass = true;
    }
    return pass;
  }
  check_contracting_rules() {
    let dow = this.last.dayOfWeek();
    let weekNo = this.last.weekNumber(this.rule.wkst);
    let doy = this.last.dayOfYear();
    return this.check_contract_restriction("BYSECOND", this.last.second) && this.check_contract_restriction("BYMINUTE", this.last.minute) && this.check_contract_restriction("BYHOUR", this.last.hour) && this.check_contract_restriction("BYDAY", Recur.numericDayToIcalDay(dow)) && this.check_contract_restriction("BYWEEKNO", weekNo) && this.check_contract_restriction("BYMONTHDAY", this.last.day) && this.check_contract_restriction("BYMONTH", this.last.month) && this.check_contract_restriction("BYYEARDAY", doy);
  }
  setup_defaults(aRuleType, req, deftime) {
    let indexMapValue = _RecurIterator._indexMap[aRuleType];
    let ruleMapValue = _RecurIterator._expandMap[this.rule.freq][indexMapValue];
    if (ruleMapValue != _RecurIterator.CONTRACT) {
      if (!(aRuleType in this.by_data)) {
        this.by_data[aRuleType] = [deftime];
      }
      if (this.rule.freq != req) {
        return this.by_data[aRuleType][0];
      }
    }
    return deftime;
  }
  /**
   * Convert iterator into a serialize-able object.  Will preserve current
   * iteration sequence to ensure the seamless continuation of the recurrence
   * rule.
   * @return {Object}
   */
  toJSON() {
    let result = /* @__PURE__ */ Object.create(null);
    result.initialized = this.initialized;
    result.rule = this.rule.toJSON();
    result.dtstart = this.dtstart.toJSON();
    result.by_data = this.by_data;
    result.days = this.days;
    result.last = this.last.toJSON();
    result.by_indices = this.by_indices;
    result.occurrence_number = this.occurrence_number;
    return result;
  }
};
var InvalidRecurrenceRuleError = class extends Error {
  constructor() {
    super("Recurrence rule has no valid occurrences");
  }
};
var VALID_DAY_NAMES = /^(SU|MO|TU|WE|TH|FR|SA)$/;
var VALID_BYDAY_PART = /^([+-])?(5[0-3]|[1-4][0-9]|[1-9])?(SU|MO|TU|WE|TH|FR|SA)$/;
var DOW_MAP = {
  SU: Time.SUNDAY,
  MO: Time.MONDAY,
  TU: Time.TUESDAY,
  WE: Time.WEDNESDAY,
  TH: Time.THURSDAY,
  FR: Time.FRIDAY,
  SA: Time.SATURDAY
};
var REVERSE_DOW_MAP = Object.fromEntries(Object.entries(DOW_MAP).map((entry) => entry.reverse()));
var ALLOWED_FREQ = [
  "SECONDLY",
  "MINUTELY",
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY"
];
var Recur = class _Recur {
  /**
   * Creates a new {@link ICAL.Recur} instance from the passed string.
   *
   * @param {String} string         The string to parse
   * @return {Recur}                The created recurrence instance
   */
  static fromString(string) {
    let data = this._stringToData(string, false);
    return new _Recur(data);
  }
  /**
   * Creates a new {@link ICAL.Recur} instance using members from the passed
   * data object.
   *
   * @param {Object} aData                              An object with members of the recurrence
   * @param {frequencyValues=} aData.freq               The frequency value
   * @param {Number=} aData.interval                    The INTERVAL value
   * @param {weekDay=} aData.wkst                       The week start value
   * @param {Time=} aData.until                         The end of the recurrence set
   * @param {Number=} aData.count                       The number of occurrences
   * @param {Array.<Number>=} aData.bysecond            The seconds for the BYSECOND part
   * @param {Array.<Number>=} aData.byminute            The minutes for the BYMINUTE part
   * @param {Array.<Number>=} aData.byhour              The hours for the BYHOUR part
   * @param {Array.<String>=} aData.byday               The BYDAY values
   * @param {Array.<Number>=} aData.bymonthday          The days for the BYMONTHDAY part
   * @param {Array.<Number>=} aData.byyearday           The days for the BYYEARDAY part
   * @param {Array.<Number>=} aData.byweekno            The weeks for the BYWEEKNO part
   * @param {Array.<Number>=} aData.bymonth             The month for the BYMONTH part
   * @param {Array.<Number>=} aData.bysetpos            The positionals for the BYSETPOS part
   */
  static fromData(aData) {
    return new _Recur(aData);
  }
  /**
   * Converts a recurrence string to a data object, suitable for the fromData
   * method.
   *
   * @private
   * @param {String} string     The string to parse
   * @param {Boolean} fmtIcal   If true, the string is considered to be an
   *                              iCalendar string
   * @return {Recur}            The recurrence instance
   */
  static _stringToData(string, fmtIcal) {
    let dict = /* @__PURE__ */ Object.create(null);
    let values = string.split(";");
    let len = values.length;
    for (let i = 0; i < len; i++) {
      let parts = values[i].split("=");
      let ucname = parts[0].toUpperCase();
      let lcname = parts[0].toLowerCase();
      let name = fmtIcal ? lcname : ucname;
      let value = parts[1];
      if (ucname in partDesign) {
        let partArr = value.split(",");
        let partSet = /* @__PURE__ */ new Set();
        for (let part of partArr) {
          partSet.add(partDesign[ucname](part));
        }
        partArr = [...partSet];
        dict[name] = partArr.length == 1 ? partArr[0] : partArr;
      } else if (ucname in optionDesign) {
        optionDesign[ucname](value, dict, fmtIcal);
      } else {
        dict[lcname] = value;
      }
    }
    return dict;
  }
  /**
   * Convert an ical representation of a day (SU, MO, etc..)
   * into a numeric value of that day.
   *
   * @param {String} string     The iCalendar day name
   * @param {weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {Number}           Numeric value of given day
   */
  static icalDayToNumericDay(string, aWeekStart) {
    let firstDow = aWeekStart || Time.SUNDAY;
    return (DOW_MAP[string] - firstDow + 7) % 7 + 1;
  }
  /**
   * Convert a numeric day value into its ical representation (SU, MO, etc..)
   *
   * @param {Number} num        Numeric value of given day
   * @param {weekDay=} aWeekStart
   *        The week start weekday, defaults to SUNDAY
   * @return {String}           The ICAL day value, e.g SU,MO,...
   */
  static numericDayToIcalDay(num, aWeekStart) {
    let firstDow = aWeekStart || Time.SUNDAY;
    let dow = num + firstDow - Time.SUNDAY;
    if (dow > 7) {
      dow -= 7;
    }
    return REVERSE_DOW_MAP[dow];
  }
  /**
   * Create a new instance of the Recur class.
   *
   * @param {Object} data                               An object with members of the recurrence
   * @param {frequencyValues=} data.freq                The frequency value
   * @param {Number=} data.interval                     The INTERVAL value
   * @param {weekDay=} data.wkst                        The week start value
   * @param {Time=} data.until                          The end of the recurrence set
   * @param {Number=} data.count                        The number of occurrences
   * @param {Array.<Number>=} data.bysecond             The seconds for the BYSECOND part
   * @param {Array.<Number>=} data.byminute             The minutes for the BYMINUTE part
   * @param {Array.<Number>=} data.byhour               The hours for the BYHOUR part
   * @param {Array.<String>=} data.byday                The BYDAY values
   * @param {Array.<Number>=} data.bymonthday           The days for the BYMONTHDAY part
   * @param {Array.<Number>=} data.byyearday            The days for the BYYEARDAY part
   * @param {Array.<Number>=} data.byweekno             The weeks for the BYWEEKNO part
   * @param {Array.<Number>=} data.bymonth              The month for the BYMONTH part
   * @param {Array.<Number>=} data.bysetpos             The positionals for the BYSETPOS part
   */
  constructor(data) {
    this.wrappedJSObject = this;
    this.parts = {};
    if (data && typeof data === "object") {
      this.fromData(data);
    }
  }
  /**
   * An object holding the BY-parts of the recurrence rule
   * @memberof ICAL.Recur
   * @typedef {Object} byParts
   * @property {Array.<Number>=} BYSECOND            The seconds for the BYSECOND part
   * @property {Array.<Number>=} BYMINUTE            The minutes for the BYMINUTE part
   * @property {Array.<Number>=} BYHOUR              The hours for the BYHOUR part
   * @property {Array.<String>=} BYDAY               The BYDAY values
   * @property {Array.<Number>=} BYMONTHDAY          The days for the BYMONTHDAY part
   * @property {Array.<Number>=} BYYEARDAY           The days for the BYYEARDAY part
   * @property {Array.<Number>=} BYWEEKNO            The weeks for the BYWEEKNO part
   * @property {Array.<Number>=} BYMONTH             The month for the BYMONTH part
   * @property {Array.<Number>=} BYSETPOS            The positionals for the BYSETPOS part
   */
  /**
   * An object holding the BY-parts of the recurrence rule
   * @type {byParts}
   */
  parts = null;
  /**
   * The interval value for the recurrence rule.
   * @type {Number}
   */
  interval = 1;
  /**
   * The week start day
   *
   * @type {weekDay}
   * @default ICAL.Time.MONDAY
   */
  wkst = Time.MONDAY;
  /**
   * The end of the recurrence
   * @type {?Time}
   */
  until = null;
  /**
   * The maximum number of occurrences
   * @type {?Number}
   */
  count = null;
  /**
   * The frequency value.
   * @type {frequencyValues}
   */
  freq = null;
  /**
   * The class identifier.
   * @constant
   * @type {String}
   * @default "icalrecur"
   */
  icalclass = "icalrecur";
  /**
   * The type name, to be used in the jCal object.
   * @constant
   * @type {String}
   * @default "recur"
   */
  icaltype = "recur";
  /**
   * Create a new iterator for this recurrence rule. The passed start date
   * must be the start date of the event, not the start of the range to
   * search in.
   *
   * @example
   * let recur = comp.getFirstPropertyValue('rrule');
   * let dtstart = comp.getFirstPropertyValue('dtstart');
   * let iter = recur.iterator(dtstart);
   * for (let next = iter.next(); next; next = iter.next()) {
   *   if (next.compare(rangeStart) < 0) {
   *     continue;
   *   }
   *   console.log(next.toString());
   * }
   *
   * @param {Time} aStart        The item's start date
   * @return {RecurIterator}     The recurrence iterator
   */
  iterator(aStart) {
    return new RecurIterator({
      rule: this,
      dtstart: aStart
    });
  }
  /**
   * Returns a clone of the recurrence object.
   *
   * @return {Recur}      The cloned object
   */
  clone() {
    return new _Recur(this.toJSON());
  }
  /**
   * Checks if the current rule is finite, i.e. has a count or until part.
   *
   * @return {Boolean}        True, if the rule is finite
   */
  isFinite() {
    return !!(this.count || this.until);
  }
  /**
   * Checks if the current rule has a count part, and not limited by an until
   * part.
   *
   * @return {Boolean}        True, if the rule is by count
   */
  isByCount() {
    return !!(this.count && !this.until);
  }
  /**
   * Adds a component (part) to the recurrence rule. This is not a component
   * in the sense of {@link ICAL.Component}, but a part of the recurrence
   * rule, i.e. BYMONTH.
   *
   * @param {String} aType            The name of the component part
   * @param {Array|String} aValue     The component value
   */
  addComponent(aType, aValue) {
    let ucname = aType.toUpperCase();
    if (ucname in this.parts) {
      this.parts[ucname].push(aValue);
    } else {
      this.parts[ucname] = [aValue];
    }
  }
  /**
   * Sets the component value for the given by-part.
   *
   * @param {String} aType        The component part name
   * @param {Array} aValues       The component values
   */
  setComponent(aType, aValues) {
    this.parts[aType.toUpperCase()] = aValues.slice();
  }
  /**
   * Gets (a copy) of the requested component value.
   *
   * @param {String} aType        The component part name
   * @return {Array}              The component part value
   */
  getComponent(aType) {
    let ucname = aType.toUpperCase();
    return ucname in this.parts ? this.parts[ucname].slice() : [];
  }
  /**
   * Retrieves the next occurrence after the given recurrence id. See the
   * guide on {@tutorial terminology} for more details.
   *
   * NOTE: Currently, this method iterates all occurrences from the start
   * date. It should not be called in a loop for performance reasons. If you
   * would like to get more than one occurrence, you can iterate the
   * occurrences manually, see the example on the
   * {@link ICAL.Recur#iterator iterator} method.
   *
   * @param {Time} aStartTime        The start of the event series
   * @param {Time} aRecurrenceId     The date of the last occurrence
   * @return {Time}                  The next occurrence after
   */
  getNextOccurrence(aStartTime, aRecurrenceId) {
    let iter = this.iterator(aStartTime);
    let next;
    do {
      next = iter.next();
    } while (next && next.compare(aRecurrenceId) <= 0);
    if (next && aRecurrenceId.zone) {
      next.zone = aRecurrenceId.zone;
    }
    return next;
  }
  /**
   * Sets up the current instance using members from the passed data object.
   *
   * @param {Object} data                               An object with members of the recurrence
   * @param {frequencyValues=} data.freq                The frequency value
   * @param {Number=} data.interval                     The INTERVAL value
   * @param {weekDay=} data.wkst                        The week start value
   * @param {Time=} data.until                          The end of the recurrence set
   * @param {Number=} data.count                        The number of occurrences
   * @param {Array.<Number>=} data.bysecond             The seconds for the BYSECOND part
   * @param {Array.<Number>=} data.byminute             The minutes for the BYMINUTE part
   * @param {Array.<Number>=} data.byhour               The hours for the BYHOUR part
   * @param {Array.<String>=} data.byday                The BYDAY values
   * @param {Array.<Number>=} data.bymonthday           The days for the BYMONTHDAY part
   * @param {Array.<Number>=} data.byyearday            The days for the BYYEARDAY part
   * @param {Array.<Number>=} data.byweekno             The weeks for the BYWEEKNO part
   * @param {Array.<Number>=} data.bymonth              The month for the BYMONTH part
   * @param {Array.<Number>=} data.bysetpos             The positionals for the BYSETPOS part
   */
  fromData(data) {
    for (let key in data) {
      let uckey = key.toUpperCase();
      if (uckey in partDesign) {
        if (Array.isArray(data[key])) {
          this.parts[uckey] = data[key];
        } else {
          this.parts[uckey] = [data[key]];
        }
      } else {
        this[key] = data[key];
      }
    }
    if (this.interval && typeof this.interval != "number") {
      optionDesign.INTERVAL(this.interval, this);
    }
    if (this.wkst && typeof this.wkst != "number") {
      this.wkst = _Recur.icalDayToNumericDay(this.wkst);
    }
    if (this.until && !(this.until instanceof Time)) {
      this.until = Time.fromString(this.until);
    }
  }
  /**
   * The jCal representation of this recurrence type.
   * @return {Object}
   */
  toJSON() {
    let res = /* @__PURE__ */ Object.create(null);
    res.freq = this.freq;
    if (this.count) {
      res.count = this.count;
    }
    if (this.interval > 1) {
      res.interval = this.interval;
    }
    for (let [k, kparts] of Object.entries(this.parts)) {
      if (Array.isArray(kparts) && kparts.length == 1) {
        res[k.toLowerCase()] = kparts[0];
      } else {
        res[k.toLowerCase()] = clone(kparts);
      }
    }
    if (this.until) {
      res.until = this.until.toString();
    }
    if ("wkst" in this && this.wkst !== Time.DEFAULT_WEEK_START) {
      res.wkst = _Recur.numericDayToIcalDay(this.wkst);
    }
    return res;
  }
  /**
   * The string representation of this recurrence rule.
   * @return {String}
   */
  toString() {
    let str = "FREQ=" + this.freq;
    if (this.count) {
      str += ";COUNT=" + this.count;
    }
    if (this.interval > 1) {
      str += ";INTERVAL=" + this.interval;
    }
    for (let [k, v] of Object.entries(this.parts)) {
      str += ";" + k + "=" + v;
    }
    if (this.until) {
      str += ";UNTIL=" + this.until.toICALString();
    }
    if ("wkst" in this && this.wkst !== Time.DEFAULT_WEEK_START) {
      str += ";WKST=" + _Recur.numericDayToIcalDay(this.wkst);
    }
    return str;
  }
};
function parseNumericValue(type, min, max, value) {
  let result = value;
  if (value[0] === "+") {
    result = value.slice(1);
  }
  result = strictParseInt(result);
  if (min !== void 0 && value < min) {
    throw new Error(
      type + ': invalid value "' + value + '" must be > ' + min
    );
  }
  if (max !== void 0 && value > max) {
    throw new Error(
      type + ': invalid value "' + value + '" must be < ' + min
    );
  }
  return result;
}
var optionDesign = {
  FREQ: function(value, dict, fmtIcal) {
    if (ALLOWED_FREQ.indexOf(value) !== -1) {
      dict.freq = value;
    } else {
      throw new Error(
        'invalid frequency "' + value + '" expected: "' + ALLOWED_FREQ.join(", ") + '"'
      );
    }
  },
  COUNT: function(value, dict, fmtIcal) {
    dict.count = strictParseInt(value);
  },
  INTERVAL: function(value, dict, fmtIcal) {
    dict.interval = strictParseInt(value);
    if (dict.interval < 1) {
      dict.interval = 1;
    }
  },
  UNTIL: function(value, dict, fmtIcal) {
    if (value.length > 10) {
      dict.until = design.icalendar.value["date-time"].fromICAL(value);
    } else {
      dict.until = design.icalendar.value.date.fromICAL(value);
    }
    if (!fmtIcal) {
      dict.until = Time.fromString(dict.until);
    }
  },
  WKST: function(value, dict, fmtIcal) {
    if (VALID_DAY_NAMES.test(value)) {
      dict.wkst = Recur.icalDayToNumericDay(value);
    } else {
      throw new Error('invalid WKST value "' + value + '"');
    }
  }
};
var partDesign = {
  BYSECOND: parseNumericValue.bind(void 0, "BYSECOND", 0, 60),
  BYMINUTE: parseNumericValue.bind(void 0, "BYMINUTE", 0, 59),
  BYHOUR: parseNumericValue.bind(void 0, "BYHOUR", 0, 23),
  BYDAY: function(value) {
    if (VALID_BYDAY_PART.test(value)) {
      return value;
    } else {
      throw new Error('invalid BYDAY value "' + value + '"');
    }
  },
  BYMONTHDAY: parseNumericValue.bind(void 0, "BYMONTHDAY", -31, 31),
  BYYEARDAY: parseNumericValue.bind(void 0, "BYYEARDAY", -366, 366),
  BYWEEKNO: parseNumericValue.bind(void 0, "BYWEEKNO", -53, 53),
  BYMONTH: parseNumericValue.bind(void 0, "BYMONTH", 1, 12),
  BYSETPOS: parseNumericValue.bind(void 0, "BYSETPOS", -366, 366)
};
var FROM_ICAL_NEWLINE = /\\\\|\\;|\\,|\\[Nn]/g;
var TO_ICAL_NEWLINE = /\\|;|,|\n/g;
var FROM_VCARD_NEWLINE = /\\\\|\\,|\\[Nn]/g;
var TO_VCARD_NEWLINE = /\\|,|\n/g;
function createTextType(fromNewline, toNewline) {
  let result = {
    matches: /.*/,
    fromICAL: function(aValue, structuredEscape) {
      return replaceNewline(aValue, fromNewline, structuredEscape);
    },
    toICAL: function(aValue, structuredEscape) {
      let regEx = toNewline;
      if (structuredEscape)
        regEx = new RegExp(regEx.source + "|" + structuredEscape, regEx.flags);
      return aValue.replace(regEx, function(str) {
        switch (str) {
          case "\\":
            return "\\\\";
          case ";":
            return "\\;";
          case ",":
            return "\\,";
          case "\n":
            return "\\n";
          /* c8 ignore next 2 */
          default:
            return str;
        }
      });
    }
  };
  return result;
}
var DEFAULT_TYPE_TEXT = { defaultType: "text" };
var DEFAULT_TYPE_TEXT_MULTI = { defaultType: "text", multiValue: "," };
var DEFAULT_TYPE_TEXT_STRUCTURED = { defaultType: "text", structuredValue: ";" };
var DEFAULT_TYPE_INTEGER = { defaultType: "integer" };
var DEFAULT_TYPE_DATETIME_DATE = { defaultType: "date-time", allowedTypes: ["date-time", "date"] };
var DEFAULT_TYPE_DATETIME = { defaultType: "date-time" };
var DEFAULT_TYPE_URI = { defaultType: "uri" };
var DEFAULT_TYPE_UTCOFFSET = { defaultType: "utc-offset" };
var DEFAULT_TYPE_RECUR = { defaultType: "recur" };
var DEFAULT_TYPE_DATE_ANDOR_TIME = { defaultType: "date-and-or-time", allowedTypes: ["date-time", "date", "text"] };
function replaceNewlineReplace(string) {
  switch (string) {
    case "\\\\":
      return "\\";
    case "\\;":
      return ";";
    case "\\,":
      return ",";
    case "\\n":
    case "\\N":
      return "\n";
    /* c8 ignore next 2 */
    default:
      return string;
  }
}
function replaceNewline(value, newline, structuredEscape) {
  if (value.indexOf("\\") === -1) {
    return value;
  }
  if (structuredEscape)
    newline = new RegExp(newline.source + "|\\\\" + structuredEscape, newline.flags);
  return value.replace(newline, replaceNewlineReplace);
}
var commonProperties = {
  "categories": DEFAULT_TYPE_TEXT_MULTI,
  "url": DEFAULT_TYPE_URI,
  "version": DEFAULT_TYPE_TEXT,
  "uid": DEFAULT_TYPE_TEXT
};
var commonValues = {
  "boolean": {
    values: ["TRUE", "FALSE"],
    fromICAL: function(aValue) {
      switch (aValue) {
        case "TRUE":
          return true;
        case "FALSE":
          return false;
        default:
          return false;
      }
    },
    toICAL: function(aValue) {
      if (aValue) {
        return "TRUE";
      }
      return "FALSE";
    }
  },
  float: {
    matches: /^[+-]?\d+\.\d+$/,
    fromICAL: function(aValue) {
      let parsed = parseFloat(aValue);
      if (isStrictlyNaN(parsed)) {
        return 0;
      }
      return parsed;
    },
    toICAL: function(aValue) {
      return String(aValue);
    }
  },
  integer: {
    fromICAL: function(aValue) {
      let parsed = parseInt(aValue);
      if (isStrictlyNaN(parsed)) {
        return 0;
      }
      return parsed;
    },
    toICAL: function(aValue) {
      return String(aValue);
    }
  },
  "utc-offset": {
    toICAL: function(aValue) {
      if (aValue.length < 7) {
        return aValue.slice(0, 3) + aValue.slice(4, 6);
      } else {
        return aValue.slice(0, 3) + aValue.slice(4, 6) + aValue.slice(7, 9);
      }
    },
    fromICAL: function(aValue) {
      if (aValue.length < 6) {
        return aValue.slice(0, 3) + ":" + aValue.slice(3, 5);
      } else {
        return aValue.slice(0, 3) + ":" + aValue.slice(3, 5) + ":" + aValue.slice(5, 7);
      }
    },
    decorate: function(aValue) {
      return UtcOffset.fromString(aValue);
    },
    undecorate: function(aValue) {
      return aValue.toString();
    }
  }
};
var icalParams = {
  // Although the syntax is DQUOTE uri DQUOTE, I don't think we should
  // enforce anything aside from it being a valid content line.
  //
  // At least some params require - if multi values are used - DQUOTEs
  // for each of its values - e.g. delegated-from="uri1","uri2"
  // To indicate this, I introduced the new k/v pair
  // multiValueSeparateDQuote: true
  //
  // "ALTREP": { ... },
  // CN just wants a param-value
  // "CN": { ... }
  "cutype": {
    values: ["INDIVIDUAL", "GROUP", "RESOURCE", "ROOM", "UNKNOWN"],
    allowXName: true,
    allowIanaToken: true
  },
  "delegated-from": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  "delegated-to": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  // "DIR": { ... }, // See ALTREP
  "encoding": {
    values: ["8BIT", "BASE64"]
  },
  // "FMTTYPE": { ... }, // See ALTREP
  "fbtype": {
    values: ["FREE", "BUSY", "BUSY-UNAVAILABLE", "BUSY-TENTATIVE"],
    allowXName: true,
    allowIanaToken: true
  },
  // "LANGUAGE": { ... }, // See ALTREP
  "member": {
    valueType: "cal-address",
    multiValue: ",",
    multiValueSeparateDQuote: true
  },
  "partstat": {
    // TODO These values are actually different per-component
    values: [
      "NEEDS-ACTION",
      "ACCEPTED",
      "DECLINED",
      "TENTATIVE",
      "DELEGATED",
      "COMPLETED",
      "IN-PROCESS"
    ],
    allowXName: true,
    allowIanaToken: true
  },
  "range": {
    values: ["THISANDFUTURE"]
  },
  "related": {
    values: ["START", "END"]
  },
  "reltype": {
    values: ["PARENT", "CHILD", "SIBLING"],
    allowXName: true,
    allowIanaToken: true
  },
  "role": {
    values: [
      "REQ-PARTICIPANT",
      "CHAIR",
      "OPT-PARTICIPANT",
      "NON-PARTICIPANT"
    ],
    allowXName: true,
    allowIanaToken: true
  },
  "rsvp": {
    values: ["TRUE", "FALSE"]
  },
  "sent-by": {
    valueType: "cal-address"
  },
  "tzid": {
    matches: /^\//
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: [
      "binary",
      "boolean",
      "cal-address",
      "date",
      "date-time",
      "duration",
      "float",
      "integer",
      "period",
      "recur",
      "text",
      "time",
      "uri",
      "utc-offset"
    ],
    allowXName: true,
    allowIanaToken: true
  }
};
var icalValues = extend(commonValues, {
  text: createTextType(FROM_ICAL_NEWLINE, TO_ICAL_NEWLINE),
  uri: {
    // TODO
    /* ... */
  },
  "binary": {
    decorate: function(aString) {
      return Binary.fromString(aString);
    },
    undecorate: function(aBinary) {
      return aBinary.toString();
    }
  },
  "cal-address": {
    // needs to be an uri
  },
  "date": {
    decorate: function(aValue, aProp) {
      if (design.strict) {
        return Time.fromDateString(aValue, aProp);
      } else {
        return Time.fromString(aValue, aProp);
      }
    },
    /**
     * undecorates a time object.
     */
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      if (!design.strict && aValue.length >= 15) {
        return icalValues["date-time"].fromICAL(aValue);
      } else {
        return aValue.slice(0, 4) + "-" + aValue.slice(4, 6) + "-" + aValue.slice(6, 8);
      }
    },
    toICAL: function(aValue) {
      let len = aValue.length;
      if (len == 10) {
        return aValue.slice(0, 4) + aValue.slice(5, 7) + aValue.slice(8, 10);
      } else if (len >= 19) {
        return icalValues["date-time"].toICAL(aValue);
      } else {
        return aValue;
      }
    }
  },
  "date-time": {
    fromICAL: function(aValue) {
      if (!design.strict && aValue.length == 8) {
        return icalValues.date.fromICAL(aValue);
      } else {
        let result = aValue.slice(0, 4) + "-" + aValue.slice(4, 6) + "-" + aValue.slice(6, 8) + "T" + aValue.slice(9, 11) + ":" + aValue.slice(11, 13) + ":" + aValue.slice(13, 15);
        if (aValue[15] && aValue[15] === "Z") {
          result += "Z";
        }
        return result;
      }
    },
    toICAL: function(aValue) {
      let len = aValue.length;
      if (len == 10 && !design.strict) {
        return icalValues.date.toICAL(aValue);
      } else if (len >= 19) {
        let result = aValue.slice(0, 4) + aValue.slice(5, 7) + // grab the (DDTHH) segment
        aValue.slice(8, 13) + // MM
        aValue.slice(14, 16) + // SS
        aValue.slice(17, 19);
        if (aValue[19] && aValue[19] === "Z") {
          result += "Z";
        }
        return result;
      } else {
        return aValue;
      }
    },
    decorate: function(aValue, aProp) {
      if (design.strict) {
        return Time.fromDateTimeString(aValue, aProp);
      } else {
        return Time.fromString(aValue, aProp);
      }
    },
    undecorate: function(aValue) {
      return aValue.toString();
    }
  },
  duration: {
    decorate: function(aValue) {
      return Duration.fromString(aValue);
    },
    undecorate: function(aValue) {
      return aValue.toString();
    }
  },
  period: {
    fromICAL: function(string) {
      let parts = string.split("/");
      parts[0] = icalValues["date-time"].fromICAL(parts[0]);
      if (!Duration.isValueString(parts[1])) {
        parts[1] = icalValues["date-time"].fromICAL(parts[1]);
      }
      return parts;
    },
    toICAL: function(parts) {
      parts = parts.slice();
      if (!design.strict && parts[0].length == 10) {
        parts[0] = icalValues.date.toICAL(parts[0]);
      } else {
        parts[0] = icalValues["date-time"].toICAL(parts[0]);
      }
      if (!Duration.isValueString(parts[1])) {
        if (!design.strict && parts[1].length == 10) {
          parts[1] = icalValues.date.toICAL(parts[1]);
        } else {
          parts[1] = icalValues["date-time"].toICAL(parts[1]);
        }
      }
      return parts.join("/");
    },
    decorate: function(aValue, aProp) {
      return Period.fromJSON(aValue, aProp, !design.strict);
    },
    undecorate: function(aValue) {
      return aValue.toJSON();
    }
  },
  recur: {
    fromICAL: function(string) {
      return Recur._stringToData(string, true);
    },
    toICAL: function(data) {
      let str = "";
      for (let [k, val] of Object.entries(data)) {
        if (k == "until") {
          if (val.length > 10) {
            val = icalValues["date-time"].toICAL(val);
          } else {
            val = icalValues.date.toICAL(val);
          }
        } else if (k == "wkst") {
          if (typeof val === "number") {
            val = Recur.numericDayToIcalDay(val);
          }
        } else if (Array.isArray(val)) {
          val = val.join(",");
        }
        str += k.toUpperCase() + "=" + val + ";";
      }
      return str.slice(0, Math.max(0, str.length - 1));
    },
    decorate: function decorate(aValue) {
      return Recur.fromData(aValue);
    },
    undecorate: function(aRecur) {
      return aRecur.toJSON();
    }
  },
  time: {
    fromICAL: function(aValue) {
      if (aValue.length < 6) {
        return aValue;
      }
      let result = aValue.slice(0, 2) + ":" + aValue.slice(2, 4) + ":" + aValue.slice(4, 6);
      if (aValue[6] === "Z") {
        result += "Z";
      }
      return result;
    },
    toICAL: function(aValue) {
      if (aValue.length < 8) {
        return aValue;
      }
      let result = aValue.slice(0, 2) + aValue.slice(3, 5) + aValue.slice(6, 8);
      if (aValue[8] === "Z") {
        result += "Z";
      }
      return result;
    }
  }
});
var icalProperties = extend(commonProperties, {
  "action": DEFAULT_TYPE_TEXT,
  "attach": { defaultType: "uri" },
  "attendee": { defaultType: "cal-address" },
  "calscale": DEFAULT_TYPE_TEXT,
  "class": DEFAULT_TYPE_TEXT,
  "comment": DEFAULT_TYPE_TEXT,
  "completed": DEFAULT_TYPE_DATETIME,
  "contact": DEFAULT_TYPE_TEXT,
  "created": DEFAULT_TYPE_DATETIME,
  "description": DEFAULT_TYPE_TEXT,
  "dtend": DEFAULT_TYPE_DATETIME_DATE,
  "dtstamp": DEFAULT_TYPE_DATETIME,
  "dtstart": DEFAULT_TYPE_DATETIME_DATE,
  "due": DEFAULT_TYPE_DATETIME_DATE,
  "duration": { defaultType: "duration" },
  "exdate": {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    multiValue: ","
  },
  "exrule": DEFAULT_TYPE_RECUR,
  "freebusy": { defaultType: "period", multiValue: "," },
  "geo": { defaultType: "float", structuredValue: ";" },
  "last-modified": DEFAULT_TYPE_DATETIME,
  "location": DEFAULT_TYPE_TEXT,
  "method": DEFAULT_TYPE_TEXT,
  "organizer": { defaultType: "cal-address" },
  "percent-complete": DEFAULT_TYPE_INTEGER,
  "priority": DEFAULT_TYPE_INTEGER,
  "prodid": DEFAULT_TYPE_TEXT,
  "related-to": DEFAULT_TYPE_TEXT,
  "repeat": DEFAULT_TYPE_INTEGER,
  "rdate": {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date", "period"],
    multiValue: ",",
    detectType: function(string) {
      if (string.indexOf("/") !== -1) {
        return "period";
      }
      return string.indexOf("T") === -1 ? "date" : "date-time";
    }
  },
  "recurrence-id": DEFAULT_TYPE_DATETIME_DATE,
  "resources": DEFAULT_TYPE_TEXT_MULTI,
  "request-status": DEFAULT_TYPE_TEXT_STRUCTURED,
  "rrule": DEFAULT_TYPE_RECUR,
  "sequence": DEFAULT_TYPE_INTEGER,
  "status": DEFAULT_TYPE_TEXT,
  "summary": DEFAULT_TYPE_TEXT,
  "transp": DEFAULT_TYPE_TEXT,
  "trigger": { defaultType: "duration", allowedTypes: ["duration", "date-time"] },
  "tzoffsetfrom": DEFAULT_TYPE_UTCOFFSET,
  "tzoffsetto": DEFAULT_TYPE_UTCOFFSET,
  "tzurl": DEFAULT_TYPE_URI,
  "tzid": DEFAULT_TYPE_TEXT,
  "tzname": DEFAULT_TYPE_TEXT
});
var vcardValues = extend(commonValues, {
  text: createTextType(FROM_VCARD_NEWLINE, TO_VCARD_NEWLINE),
  uri: createTextType(FROM_VCARD_NEWLINE, TO_VCARD_NEWLINE),
  date: {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      if (aValue.length == 8) {
        return icalValues.date.fromICAL(aValue);
      } else if (aValue[0] == "-" && aValue.length == 6) {
        return aValue.slice(0, 4) + "-" + aValue.slice(4);
      } else {
        return aValue;
      }
    },
    toICAL: function(aValue) {
      if (aValue.length == 10) {
        return icalValues.date.toICAL(aValue);
      } else if (aValue[0] == "-" && aValue.length == 7) {
        return aValue.slice(0, 4) + aValue.slice(5);
      } else {
        return aValue;
      }
    }
  },
  time: {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString("T" + aValue, "time");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      let splitzone = vcardValues.time._splitZone(aValue, true);
      let zone = splitzone[0], value = splitzone[1];
      if (value.length == 6) {
        value = value.slice(0, 2) + ":" + value.slice(2, 4) + ":" + value.slice(4, 6);
      } else if (value.length == 4 && value[0] != "-") {
        value = value.slice(0, 2) + ":" + value.slice(2, 4);
      } else if (value.length == 5) {
        value = value.slice(0, 3) + ":" + value.slice(3, 5);
      }
      if (zone.length == 5 && (zone[0] == "-" || zone[0] == "+")) {
        zone = zone.slice(0, 3) + ":" + zone.slice(3);
      }
      return value + zone;
    },
    toICAL: function(aValue) {
      let splitzone = vcardValues.time._splitZone(aValue);
      let zone = splitzone[0], value = splitzone[1];
      if (value.length == 8) {
        value = value.slice(0, 2) + value.slice(3, 5) + value.slice(6, 8);
      } else if (value.length == 5 && value[0] != "-") {
        value = value.slice(0, 2) + value.slice(3, 5);
      } else if (value.length == 6) {
        value = value.slice(0, 3) + value.slice(4, 6);
      }
      if (zone.length == 6 && (zone[0] == "-" || zone[0] == "+")) {
        zone = zone.slice(0, 3) + zone.slice(4);
      }
      return value + zone;
    },
    _splitZone: function(aValue, isFromIcal) {
      let lastChar = aValue.length - 1;
      let signChar = aValue.length - (isFromIcal ? 5 : 6);
      let sign = aValue[signChar];
      let zone, value;
      if (aValue[lastChar] == "Z") {
        zone = aValue[lastChar];
        value = aValue.slice(0, Math.max(0, lastChar));
      } else if (aValue.length > 6 && (sign == "-" || sign == "+")) {
        zone = aValue.slice(signChar);
        value = aValue.slice(0, Math.max(0, signChar));
      } else {
        zone = "";
        value = aValue;
      }
      return [zone, value];
    }
  },
  "date-time": {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date-time");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      return vcardValues["date-and-or-time"].fromICAL(aValue);
    },
    toICAL: function(aValue) {
      return vcardValues["date-and-or-time"].toICAL(aValue);
    }
  },
  "date-and-or-time": {
    decorate: function(aValue) {
      return VCardTime.fromDateAndOrTimeString(aValue, "date-and-or-time");
    },
    undecorate: function(aValue) {
      return aValue.toString();
    },
    fromICAL: function(aValue) {
      let parts = aValue.split("T");
      return (parts[0] ? vcardValues.date.fromICAL(parts[0]) : "") + (parts[1] ? "T" + vcardValues.time.fromICAL(parts[1]) : "");
    },
    toICAL: function(aValue) {
      let parts = aValue.split("T");
      return vcardValues.date.toICAL(parts[0]) + (parts[1] ? "T" + vcardValues.time.toICAL(parts[1]) : "");
    }
  },
  timestamp: icalValues["date-time"],
  "language-tag": {
    matches: /^[a-zA-Z0-9-]+$/
    // Could go with a more strict regex here
  },
  "phone-number": {
    fromICAL: function(aValue) {
      return Array.from(aValue).filter(function(c) {
        return c === "\\" ? void 0 : c;
      }).join("");
    },
    toICAL: function(aValue) {
      return Array.from(aValue).map(function(c) {
        return c === "," || c === ";" ? "\\" + c : c;
      }).join("");
    }
  }
});
var vcardParams = {
  "type": {
    valueType: "text",
    multiValue: ","
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: [
      "text",
      "uri",
      "date",
      "time",
      "date-time",
      "date-and-or-time",
      "timestamp",
      "boolean",
      "integer",
      "float",
      "utc-offset",
      "language-tag"
    ],
    allowXName: true,
    allowIanaToken: true
  }
};
var vcardProperties = extend(commonProperties, {
  "adr": { defaultType: "text", structuredValue: ";", multiValue: "," },
  "anniversary": DEFAULT_TYPE_DATE_ANDOR_TIME,
  "bday": DEFAULT_TYPE_DATE_ANDOR_TIME,
  "caladruri": DEFAULT_TYPE_URI,
  "caluri": DEFAULT_TYPE_URI,
  "clientpidmap": DEFAULT_TYPE_TEXT_STRUCTURED,
  "email": DEFAULT_TYPE_TEXT,
  "fburl": DEFAULT_TYPE_URI,
  "fn": DEFAULT_TYPE_TEXT,
  "gender": DEFAULT_TYPE_TEXT_STRUCTURED,
  "geo": DEFAULT_TYPE_URI,
  "impp": DEFAULT_TYPE_URI,
  "key": DEFAULT_TYPE_URI,
  "kind": DEFAULT_TYPE_TEXT,
  "lang": { defaultType: "language-tag" },
  "logo": DEFAULT_TYPE_URI,
  "member": DEFAULT_TYPE_URI,
  "n": { defaultType: "text", structuredValue: ";", multiValue: "," },
  "nickname": DEFAULT_TYPE_TEXT_MULTI,
  "note": DEFAULT_TYPE_TEXT,
  "org": { defaultType: "text", structuredValue: ";" },
  "photo": DEFAULT_TYPE_URI,
  "related": DEFAULT_TYPE_URI,
  "rev": { defaultType: "timestamp" },
  "role": DEFAULT_TYPE_TEXT,
  "sound": DEFAULT_TYPE_URI,
  "source": DEFAULT_TYPE_URI,
  "tel": { defaultType: "uri", allowedTypes: ["uri", "text"] },
  "title": DEFAULT_TYPE_TEXT,
  "tz": { defaultType: "text", allowedTypes: ["text", "utc-offset", "uri"] },
  "xml": DEFAULT_TYPE_TEXT
});
var vcard3Values = extend(commonValues, {
  binary: icalValues.binary,
  date: vcardValues.date,
  "date-time": vcardValues["date-time"],
  "phone-number": vcardValues["phone-number"],
  uri: icalValues.uri,
  text: vcardValues.text,
  time: icalValues.time,
  vcard: icalValues.text,
  "utc-offset": {
    toICAL: function(aValue) {
      return aValue.slice(0, 7);
    },
    fromICAL: function(aValue) {
      return aValue.slice(0, 7);
    },
    decorate: function(aValue) {
      return UtcOffset.fromString(aValue);
    },
    undecorate: function(aValue) {
      return aValue.toString();
    }
  }
});
var vcard3Params = {
  "type": {
    valueType: "text",
    multiValue: ","
  },
  "value": {
    // since the value here is a 'type' lowercase is used.
    values: [
      "text",
      "uri",
      "date",
      "date-time",
      "phone-number",
      "time",
      "boolean",
      "integer",
      "float",
      "utc-offset",
      "vcard",
      "binary"
    ],
    allowXName: true,
    allowIanaToken: true
  }
};
var vcard3Properties = extend(commonProperties, {
  fn: DEFAULT_TYPE_TEXT,
  n: { defaultType: "text", structuredValue: ";", multiValue: "," },
  nickname: DEFAULT_TYPE_TEXT_MULTI,
  photo: { defaultType: "binary", allowedTypes: ["binary", "uri"] },
  bday: {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    detectType: function(string) {
      return string.indexOf("T") === -1 ? "date" : "date-time";
    }
  },
  adr: { defaultType: "text", structuredValue: ";", multiValue: "," },
  label: DEFAULT_TYPE_TEXT,
  tel: { defaultType: "phone-number" },
  email: DEFAULT_TYPE_TEXT,
  mailer: DEFAULT_TYPE_TEXT,
  tz: { defaultType: "utc-offset", allowedTypes: ["utc-offset", "text"] },
  geo: { defaultType: "float", structuredValue: ";" },
  title: DEFAULT_TYPE_TEXT,
  role: DEFAULT_TYPE_TEXT,
  logo: { defaultType: "binary", allowedTypes: ["binary", "uri"] },
  agent: { defaultType: "vcard", allowedTypes: ["vcard", "text", "uri"] },
  org: DEFAULT_TYPE_TEXT_STRUCTURED,
  note: DEFAULT_TYPE_TEXT_MULTI,
  prodid: DEFAULT_TYPE_TEXT,
  rev: {
    defaultType: "date-time",
    allowedTypes: ["date-time", "date"],
    detectType: function(string) {
      return string.indexOf("T") === -1 ? "date" : "date-time";
    }
  },
  "sort-string": DEFAULT_TYPE_TEXT,
  sound: { defaultType: "binary", allowedTypes: ["binary", "uri"] },
  class: DEFAULT_TYPE_TEXT,
  key: { defaultType: "binary", allowedTypes: ["binary", "text"] }
});
var icalSet = {
  name: "ical",
  value: icalValues,
  param: icalParams,
  property: icalProperties,
  propertyGroups: false
};
var vcardSet = {
  name: "vcard4",
  value: vcardValues,
  param: vcardParams,
  property: vcardProperties,
  propertyGroups: true
};
var vcard3Set = {
  name: "vcard3",
  value: vcard3Values,
  param: vcard3Params,
  property: vcard3Properties,
  propertyGroups: true
};
var design = {
  /**
   * Can be set to false to make the parser more lenient.
   */
  strict: true,
  /**
   * The default set for new properties and components if none is specified.
   * @type {designSet}
   */
  defaultSet: icalSet,
  /**
   * The default type for unknown properties
   * @type {String}
   */
  defaultType: "unknown",
  /**
   * Holds the design set for known top-level components
   *
   * @type {Object}
   * @property {designSet} vcard       vCard VCARD
   * @property {designSet} vevent      iCalendar VEVENT
   * @property {designSet} vtodo       iCalendar VTODO
   * @property {designSet} vjournal    iCalendar VJOURNAL
   * @property {designSet} valarm      iCalendar VALARM
   * @property {designSet} vtimezone   iCalendar VTIMEZONE
   * @property {designSet} daylight    iCalendar DAYLIGHT
   * @property {designSet} standard    iCalendar STANDARD
   *
   * @example
   * let propertyName = 'fn';
   * let componentDesign = ICAL.design.components.vcard;
   * let propertyDetails = componentDesign.property[propertyName];
   * if (propertyDetails.defaultType == 'text') {
   *   // Yep, sure is...
   * }
   */
  components: {
    vcard: vcardSet,
    vcard3: vcard3Set,
    vevent: icalSet,
    vtodo: icalSet,
    vjournal: icalSet,
    valarm: icalSet,
    vtimezone: icalSet,
    daylight: icalSet,
    standard: icalSet
  },
  /**
   * The design set for iCalendar (rfc5545/rfc7265) components.
   * @type {designSet}
   */
  icalendar: icalSet,
  /**
   * The design set for vCard (rfc6350/rfc7095) components.
   * @type {designSet}
   */
  vcard: vcardSet,
  /**
   * The design set for vCard (rfc2425/rfc2426/rfc7095) components.
   * @type {designSet}
   */
  vcard3: vcard3Set,
  /**
   * Gets the design set for the given component name.
   *
   * @param {String} componentName        The name of the component
   * @return {designSet}      The design set for the component
   */
  getDesignSet: function(componentName) {
    let isInDesign = componentName && componentName in design.components;
    return isInDesign ? design.components[componentName] : design.defaultSet;
  }
};
var LINE_ENDING = "\r\n";
var DEFAULT_VALUE_TYPE = "unknown";
var RFC6868_REPLACE_MAP = { '"': "^'", "\n": "^n", "^": "^^" };
function stringify(jCal) {
  if (typeof jCal[0] == "string") {
    jCal = [jCal];
  }
  let i = 0;
  let len = jCal.length;
  let result = "";
  for (; i < len; i++) {
    result += stringify.component(jCal[i]) + LINE_ENDING;
  }
  return result;
}
stringify.component = function(component, designSet) {
  let name = component[0].toUpperCase();
  let result = "BEGIN:" + name + LINE_ENDING;
  let props = component[1];
  let propIdx = 0;
  let propLen = props.length;
  let designSetName = component[0];
  if (designSetName === "vcard" && component[1].length > 0 && !(component[1][0][0] === "version" && component[1][0][3] === "4.0")) {
    designSetName = "vcard3";
  }
  designSet = designSet || design.getDesignSet(designSetName);
  for (; propIdx < propLen; propIdx++) {
    result += stringify.property(props[propIdx], designSet) + LINE_ENDING;
  }
  let comps = component[2] || [];
  let compIdx = 0;
  let compLen = comps.length;
  for (; compIdx < compLen; compIdx++) {
    result += stringify.component(comps[compIdx], designSet) + LINE_ENDING;
  }
  result += "END:" + name;
  return result;
};
stringify.property = function(property, designSet, noFold) {
  let name = property[0].toUpperCase();
  let jsName = property[0];
  let params = property[1];
  if (!designSet) {
    designSet = design.defaultSet;
  }
  let groupName = params.group;
  let line;
  if (designSet.propertyGroups && groupName) {
    line = groupName.toUpperCase() + "." + name;
  } else {
    line = name;
  }
  for (let [paramName, value] of Object.entries(params)) {
    if (designSet.propertyGroups && paramName == "group") {
      continue;
    }
    let paramDesign = designSet.param[paramName];
    let multiValue2 = paramDesign && paramDesign.multiValue;
    if (multiValue2 && Array.isArray(value)) {
      value = value.map(function(val) {
        val = stringify._rfc6868Unescape(val);
        val = stringify.paramPropertyValue(val, paramDesign.multiValueSeparateDQuote);
        return val;
      });
      value = stringify.multiValue(value, multiValue2, "unknown", null, designSet);
    } else {
      value = stringify._rfc6868Unescape(value);
      value = stringify.paramPropertyValue(value);
    }
    line += ";" + paramName.toUpperCase() + "=" + value;
  }
  if (property.length === 3) {
    return line + ":";
  }
  let valueType = property[2];
  let propDetails;
  let multiValue = false;
  let structuredValue = false;
  let isDefault = false;
  if (jsName in designSet.property) {
    propDetails = designSet.property[jsName];
    if ("multiValue" in propDetails) {
      multiValue = propDetails.multiValue;
    }
    if ("structuredValue" in propDetails && Array.isArray(property[3])) {
      structuredValue = propDetails.structuredValue;
    }
    if ("defaultType" in propDetails) {
      if (valueType === propDetails.defaultType) {
        isDefault = true;
      }
    } else {
      if (valueType === DEFAULT_VALUE_TYPE) {
        isDefault = true;
      }
    }
  } else {
    if (valueType === DEFAULT_VALUE_TYPE) {
      isDefault = true;
    }
  }
  if (!isDefault) {
    line += ";VALUE=" + valueType.toUpperCase();
  }
  line += ":";
  if (multiValue && structuredValue) {
    line += stringify.multiValue(
      property[3],
      structuredValue,
      valueType,
      multiValue,
      designSet,
      structuredValue
    );
  } else if (multiValue) {
    line += stringify.multiValue(
      property.slice(3),
      multiValue,
      valueType,
      null,
      designSet,
      false
    );
  } else if (structuredValue) {
    line += stringify.multiValue(
      property[3],
      structuredValue,
      valueType,
      null,
      designSet,
      structuredValue
    );
  } else {
    line += stringify.value(property[3], valueType, designSet, false);
  }
  return noFold ? line : foldline(line);
};
stringify.paramPropertyValue = function(value, force) {
  if (!force && value.indexOf(",") === -1 && value.indexOf(":") === -1 && value.indexOf(";") === -1) {
    return value;
  }
  return '"' + value + '"';
};
stringify.multiValue = function(values, delim, type, innerMulti, designSet, structuredValue) {
  let result = "";
  let len = values.length;
  let i = 0;
  for (; i < len; i++) {
    if (innerMulti && Array.isArray(values[i])) {
      result += stringify.multiValue(values[i], innerMulti, type, null, designSet, structuredValue);
    } else {
      result += stringify.value(values[i], type, designSet, structuredValue);
    }
    if (i !== len - 1) {
      result += delim;
    }
  }
  return result;
};
stringify.value = function(value, type, designSet, structuredValue) {
  if (type in designSet.value && "toICAL" in designSet.value[type]) {
    return designSet.value[type].toICAL(value, structuredValue);
  }
  return value;
};
stringify._rfc6868Unescape = function(val) {
  return val.replace(/[\n^"]/g, function(x) {
    return RFC6868_REPLACE_MAP[x];
  });
};
var NAME_INDEX$1 = 0;
var PROP_INDEX = 1;
var TYPE_INDEX = 2;
var VALUE_INDEX = 3;
var Property = class _Property {
  /**
   * Create an {@link ICAL.Property} by parsing the passed iCalendar string.
   *
   * @param {String} str            The iCalendar string to parse
   * @param {designSet=} designSet  The design data to use for this property
   * @return {Property}             The created iCalendar property
   */
  static fromString(str, designSet) {
    return new _Property(parse.property(str, designSet));
  }
  /**
   * Creates a new ICAL.Property instance.
   *
   * It is important to note that mutations done in the wrapper directly mutate the jCal object used
   * to initialize.
   *
   * Can also be used to create new properties by passing the name of the property (as a String).
   *
   * @param {Array|String} jCal         Raw jCal representation OR the new name of the property
   * @param {Component=} parent         Parent component
   */
  constructor(jCal, parent) {
    this._parent = parent || null;
    if (typeof jCal === "string") {
      this.jCal = [jCal, {}, design.defaultType];
      this.jCal[TYPE_INDEX] = this.getDefaultType();
    } else {
      this.jCal = jCal;
    }
    this._updateType();
  }
  /**
   * The value type for this property
   * @type {String}
   */
  get type() {
    return this.jCal[TYPE_INDEX];
  }
  /**
   * The name of this property, in lowercase.
   * @type {String}
   */
  get name() {
    return this.jCal[NAME_INDEX$1];
  }
  /**
   * The parent component for this property.
   * @type {Component}
   */
  get parent() {
    return this._parent;
  }
  set parent(p) {
    let designSetChanged = !this._parent || p && p._designSet != this._parent._designSet;
    this._parent = p;
    if (this.type == design.defaultType && designSetChanged) {
      this.jCal[TYPE_INDEX] = this.getDefaultType();
      this._updateType();
    }
  }
  /**
   * The design set for this property, e.g. icalendar vs vcard
   *
   * @type {designSet}
   * @private
   */
  get _designSet() {
    return this.parent ? this.parent._designSet : design.defaultSet;
  }
  /**
   * Updates the type metadata from the current jCal type and design set.
   *
   * @private
   */
  _updateType() {
    let designSet = this._designSet;
    if (this.type in designSet.value) {
      if ("decorate" in designSet.value[this.type]) {
        this.isDecorated = true;
      } else {
        this.isDecorated = false;
      }
      if (this.name in designSet.property) {
        this.isMultiValue = "multiValue" in designSet.property[this.name];
        this.isStructuredValue = "structuredValue" in designSet.property[this.name];
      }
    }
  }
  /**
   * Hydrate a single value. The act of hydrating means turning the raw jCal
   * value into a potentially wrapped object, for example {@link ICAL.Time}.
   *
   * @private
   * @param {Number} index        The index of the value to hydrate
   * @return {?Object}             The decorated value.
   */
  _hydrateValue(index2) {
    if (this._values && this._values[index2]) {
      return this._values[index2];
    }
    if (this.jCal.length <= VALUE_INDEX + index2) {
      return null;
    }
    if (this.isDecorated) {
      if (!this._values) {
        this._values = [];
      }
      return this._values[index2] = this._decorate(
        this.jCal[VALUE_INDEX + index2]
      );
    } else {
      return this.jCal[VALUE_INDEX + index2];
    }
  }
  /**
   * Decorate a single value, returning its wrapped object. This is used by
   * the hydrate function to actually wrap the value.
   *
   * @private
   * @param {?} value         The value to decorate
   * @return {Object}         The decorated value
   */
  _decorate(value) {
    return this._designSet.value[this.type].decorate(value, this);
  }
  /**
   * Undecorate a single value, returning its raw jCal data.
   *
   * @private
   * @param {Object} value         The value to undecorate
   * @return {?}                   The undecorated value
   */
  _undecorate(value) {
    return this._designSet.value[this.type].undecorate(value, this);
  }
  /**
   * Sets the value at the given index while also hydrating it. The passed
   * value can either be a decorated or undecorated value.
   *
   * @private
   * @param {?} value             The value to set
   * @param {Number} index        The index to set it at
   */
  _setDecoratedValue(value, index2) {
    if (!this._values) {
      this._values = [];
    }
    if (typeof value === "object" && "icaltype" in value) {
      this.jCal[VALUE_INDEX + index2] = this._undecorate(value);
      this._values[index2] = value;
    } else {
      this.jCal[VALUE_INDEX + index2] = value;
      this._values[index2] = this._decorate(value);
    }
  }
  /**
   * Gets a parameter on the property.
   *
   * @param {String}        name   Parameter name (lowercase)
   * @return {Array|String}        Parameter value
   */
  getParameter(name) {
    if (name in this.jCal[PROP_INDEX]) {
      return this.jCal[PROP_INDEX][name];
    } else {
      return void 0;
    }
  }
  /**
   * Gets first parameter on the property.
   *
   * @param {String}        name   Parameter name (lowercase)
   * @return {String}        Parameter value
   */
  getFirstParameter(name) {
    let parameters = this.getParameter(name);
    if (Array.isArray(parameters)) {
      return parameters[0];
    }
    return parameters;
  }
  /**
   * Sets a parameter on the property.
   *
   * @param {String}       name     The parameter name
   * @param {Array|String} value    The parameter value
   */
  setParameter(name, value) {
    let lcname = name.toLowerCase();
    if (typeof value === "string" && lcname in this._designSet.param && "multiValue" in this._designSet.param[lcname]) {
      value = [value];
    }
    this.jCal[PROP_INDEX][name] = value;
  }
  /**
   * Removes a parameter
   *
   * @param {String} name     The parameter name
   */
  removeParameter(name) {
    delete this.jCal[PROP_INDEX][name];
  }
  /**
   * Get the default type based on this property's name.
   *
   * @return {String}     The default type for this property
   */
  getDefaultType() {
    let name = this.jCal[NAME_INDEX$1];
    let designSet = this._designSet;
    if (name in designSet.property) {
      let details = designSet.property[name];
      if ("defaultType" in details) {
        return details.defaultType;
      }
    }
    return design.defaultType;
  }
  /**
   * Sets type of property and clears out any existing values of the current
   * type.
   *
   * @param {String} type     New iCAL type (see design.*.values)
   */
  resetType(type) {
    this.removeAllValues();
    this.jCal[TYPE_INDEX] = type;
    this._updateType();
  }
  /**
   * Finds the first property value.
   *
   * @return {Binary | Duration | Period |
   * Recur | Time | UtcOffset | Geo | string | null}         First property value
   */
  getFirstValue() {
    return this._hydrateValue(0);
  }
  /**
   * Gets all values on the property.
   *
   * NOTE: this creates an array during each call.
   *
   * @return {Array}          List of values
   */
  getValues() {
    let len = this.jCal.length - VALUE_INDEX;
    if (len < 1) {
      return [];
    }
    let i = 0;
    let result = [];
    for (; i < len; i++) {
      result[i] = this._hydrateValue(i);
    }
    return result;
  }
  /**
   * Removes all values from this property
   */
  removeAllValues() {
    if (this._values) {
      this._values.length = 0;
    }
    this.jCal.length = 3;
  }
  /**
   * Sets the values of the property.  Will overwrite the existing values.
   * This can only be used for multi-value properties.
   *
   * @param {Array} values    An array of values
   */
  setValues(values) {
    if (!this.isMultiValue) {
      throw new Error(
        this.name + ": does not not support mulitValue.\noverride isMultiValue"
      );
    }
    let len = values.length;
    let i = 0;
    this.removeAllValues();
    if (len > 0 && typeof values[0] === "object" && "icaltype" in values[0]) {
      this.resetType(values[0].icaltype);
    }
    if (this.isDecorated) {
      for (; i < len; i++) {
        this._setDecoratedValue(values[i], i);
      }
    } else {
      for (; i < len; i++) {
        this.jCal[VALUE_INDEX + i] = values[i];
      }
    }
  }
  /**
   * Sets the current value of the property. If this is a multi-value
   * property, all other values will be removed.
   *
   * @param {String|Object} value     New property value.
   */
  setValue(value) {
    this.removeAllValues();
    if (typeof value === "object" && "icaltype" in value) {
      this.resetType(value.icaltype);
    }
    if (this.isDecorated) {
      this._setDecoratedValue(value, 0);
    } else {
      this.jCal[VALUE_INDEX] = value;
    }
  }
  /**
   * Returns the Object representation of this component. The returned object
   * is a live jCal object and should be cloned if modified.
   * @return {Object}
   */
  toJSON() {
    return this.jCal;
  }
  /**
   * The string representation of this component.
   * @return {String}
   */
  toICALString() {
    return stringify.property(
      this.jCal,
      this._designSet,
      true
    );
  }
};
var NAME_INDEX = 0;
var PROPERTY_INDEX = 1;
var COMPONENT_INDEX = 2;
var PROPERTY_NAME_INDEX = 0;
var PROPERTY_VALUE_INDEX = 3;
var Component = class _Component {
  /**
   * Create an {@link ICAL.Component} by parsing the passed iCalendar string.
   *
   * @param {String} str        The iCalendar string to parse
   */
  static fromString(str) {
    return new _Component(parse.component(str));
  }
  /**
   * Creates a new Component instance.
   *
   * @param {Array|String} jCal         Raw jCal component data OR name of new
   *                                      component
   * @param {Component=} parent     Parent component to associate
   */
  constructor(jCal, parent) {
    if (typeof jCal === "string") {
      jCal = [jCal, [], []];
    }
    this.jCal = jCal;
    this.parent = parent || null;
    if (!this.parent && this.name === "vcalendar") {
      this._timezoneCache = /* @__PURE__ */ new Map();
    }
  }
  /**
   * Hydrated properties are inserted into the _properties array at the same
   * position as in the jCal array, so it is possible that the array contains
   * undefined values for unhydrdated properties. To avoid iterating the
   * array when checking if all properties have been hydrated, we save the
   * count here.
   *
   * @type {Number}
   * @private
   */
  _hydratedPropertyCount = 0;
  /**
   * The same count as for _hydratedPropertyCount, but for subcomponents
   *
   * @type {Number}
   * @private
   */
  _hydratedComponentCount = 0;
  /**
   * A cache of hydrated time zone objects which may be used by consumers, keyed
   * by time zone ID.
   *
   * @type {Map}
   * @private
   */
  _timezoneCache = null;
  /**
   * @private
   */
  _components = null;
  /**
   * @private
   */
  _properties = null;
  /**
   * The name of this component
   *
   * @type {String}
   */
  get name() {
    return this.jCal[NAME_INDEX];
  }
  /**
   * The design set for this component, e.g. icalendar vs vcard
   *
   * @type {designSet}
   * @private
   */
  get _designSet() {
    let parentDesign = this.parent && this.parent._designSet;
    if (!parentDesign && this.name == "vcard") {
      let versionProp = this.jCal[PROPERTY_INDEX]?.[0];
      if (versionProp && versionProp[PROPERTY_NAME_INDEX] == "version" && versionProp[PROPERTY_VALUE_INDEX] == "3.0") {
        return design.getDesignSet("vcard3");
      }
    }
    return parentDesign || design.getDesignSet(this.name);
  }
  /**
   * @private
   */
  _hydrateComponent(index2) {
    if (!this._components) {
      this._components = [];
      this._hydratedComponentCount = 0;
    }
    if (this._components[index2]) {
      return this._components[index2];
    }
    let comp = new _Component(
      this.jCal[COMPONENT_INDEX][index2],
      this
    );
    this._hydratedComponentCount++;
    return this._components[index2] = comp;
  }
  /**
   * @private
   */
  _hydrateProperty(index2) {
    if (!this._properties) {
      this._properties = [];
      this._hydratedPropertyCount = 0;
    }
    if (this._properties[index2]) {
      return this._properties[index2];
    }
    let prop = new Property(
      this.jCal[PROPERTY_INDEX][index2],
      this
    );
    this._hydratedPropertyCount++;
    return this._properties[index2] = prop;
  }
  /**
   * Finds first sub component, optionally filtered by name.
   *
   * @param {String=} name        Optional name to filter by
   * @return {?Component}     The found subcomponent
   */
  getFirstSubcomponent(name) {
    if (name) {
      let i = 0;
      let comps = this.jCal[COMPONENT_INDEX];
      let len = comps.length;
      for (; i < len; i++) {
        if (comps[i][NAME_INDEX] === name) {
          let result = this._hydrateComponent(i);
          return result;
        }
      }
    } else {
      if (this.jCal[COMPONENT_INDEX].length) {
        return this._hydrateComponent(0);
      }
    }
    return null;
  }
  /**
   * Finds all sub components, optionally filtering by name.
   *
   * @param {String=} name            Optional name to filter by
   * @return {Component[]}       The found sub components
   */
  getAllSubcomponents(name) {
    let jCalLen = this.jCal[COMPONENT_INDEX].length;
    let i = 0;
    if (name) {
      let comps = this.jCal[COMPONENT_INDEX];
      let result = [];
      for (; i < jCalLen; i++) {
        if (name === comps[i][NAME_INDEX]) {
          result.push(
            this._hydrateComponent(i)
          );
        }
      }
      return result;
    } else {
      if (!this._components || this._hydratedComponentCount !== jCalLen) {
        for (; i < jCalLen; i++) {
          this._hydrateComponent(i);
        }
      }
      return this._components || [];
    }
  }
  /**
   * Returns true when a named property exists.
   *
   * @param {String} name     The property name
   * @return {Boolean}        True, when property is found
   */
  hasProperty(name) {
    let props = this.jCal[PROPERTY_INDEX];
    let len = props.length;
    let i = 0;
    for (; i < len; i++) {
      if (props[i][NAME_INDEX] === name) {
        return true;
      }
    }
    return false;
  }
  /**
   * Finds the first property, optionally with the given name.
   *
   * @param {String=} name        Lowercase property name
   * @return {?Property}     The found property
   */
  getFirstProperty(name) {
    if (name) {
      let i = 0;
      let props = this.jCal[PROPERTY_INDEX];
      let len = props.length;
      for (; i < len; i++) {
        if (props[i][NAME_INDEX] === name) {
          let result = this._hydrateProperty(i);
          return result;
        }
      }
    } else {
      if (this.jCal[PROPERTY_INDEX].length) {
        return this._hydrateProperty(0);
      }
    }
    return null;
  }
  /**
   * Returns first property's value, if available.
   *
   * @param {String=} name                    Lowercase property name
   * @return {Binary | Duration | Period |
   * Recur | Time | UtcOffset | Geo | string | null}         The found property value.
   */
  getFirstPropertyValue(name) {
    let prop = this.getFirstProperty(name);
    if (prop) {
      return prop.getFirstValue();
    }
    return null;
  }
  /**
   * Get all properties in the component, optionally filtered by name.
   *
   * @param {String=} name        Lowercase property name
   * @return {Property[]}    List of properties
   */
  getAllProperties(name) {
    let jCalLen = this.jCal[PROPERTY_INDEX].length;
    let i = 0;
    if (name) {
      let props = this.jCal[PROPERTY_INDEX];
      let result = [];
      for (; i < jCalLen; i++) {
        if (name === props[i][NAME_INDEX]) {
          result.push(
            this._hydrateProperty(i)
          );
        }
      }
      return result;
    } else {
      if (!this._properties || this._hydratedPropertyCount !== jCalLen) {
        for (; i < jCalLen; i++) {
          this._hydrateProperty(i);
        }
      }
      return this._properties || [];
    }
  }
  /**
   * @private
   */
  _removeObjectByIndex(jCalIndex, cache, index2) {
    cache = cache || [];
    if (cache[index2]) {
      let obj = cache[index2];
      if ("parent" in obj) {
        obj.parent = null;
      }
    }
    cache.splice(index2, 1);
    this.jCal[jCalIndex].splice(index2, 1);
  }
  /**
   * @private
   */
  _removeObject(jCalIndex, cache, nameOrObject) {
    let i = 0;
    let objects = this.jCal[jCalIndex];
    let len = objects.length;
    let cached = this[cache];
    if (typeof nameOrObject === "string") {
      for (; i < len; i++) {
        if (objects[i][NAME_INDEX] === nameOrObject) {
          this._removeObjectByIndex(jCalIndex, cached, i);
          return true;
        }
      }
    } else if (cached) {
      for (; i < len; i++) {
        if (cached[i] && cached[i] === nameOrObject) {
          this._removeObjectByIndex(jCalIndex, cached, i);
          return true;
        }
      }
    }
    return false;
  }
  /**
   * @private
   */
  _removeAllObjects(jCalIndex, cache, name) {
    let cached = this[cache];
    let objects = this.jCal[jCalIndex];
    let i = objects.length - 1;
    for (; i >= 0; i--) {
      if (!name || objects[i][NAME_INDEX] === name) {
        this._removeObjectByIndex(jCalIndex, cached, i);
      }
    }
  }
  /**
   * Adds a single sub component.
   *
   * @param {Component} component        The component to add
   * @return {Component}                 The passed in component
   */
  addSubcomponent(component) {
    if (!this._components) {
      this._components = [];
      this._hydratedComponentCount = 0;
    }
    if (component.parent) {
      component.parent.removeSubcomponent(component);
    }
    let idx = this.jCal[COMPONENT_INDEX].push(component.jCal);
    this._components[idx - 1] = component;
    this._hydratedComponentCount++;
    component.parent = this;
    return component;
  }
  /**
   * Removes a single component by name or the instance of a specific
   * component.
   *
   * @param {Component|String} nameOrComp    Name of component, or component
   * @return {Boolean}                            True when comp is removed
   */
  removeSubcomponent(nameOrComp) {
    let removed = this._removeObject(COMPONENT_INDEX, "_components", nameOrComp);
    if (removed) {
      this._hydratedComponentCount--;
    }
    return removed;
  }
  /**
   * Removes all components or (if given) all components by a particular
   * name.
   *
   * @param {String=} name            Lowercase component name
   */
  removeAllSubcomponents(name) {
    let removed = this._removeAllObjects(COMPONENT_INDEX, "_components", name);
    this._hydratedComponentCount = 0;
    return removed;
  }
  /**
   * Adds an {@link ICAL.Property} to the component.
   *
   * @param {Property} property      The property to add
   * @return {Property}              The passed in property
   */
  addProperty(property) {
    if (!(property instanceof Property)) {
      throw new TypeError("must be instance of ICAL.Property");
    }
    if (!this._properties) {
      this._properties = [];
      this._hydratedPropertyCount = 0;
    }
    if (property.parent) {
      property.parent.removeProperty(property);
    }
    let idx = this.jCal[PROPERTY_INDEX].push(property.jCal);
    this._properties[idx - 1] = property;
    this._hydratedPropertyCount++;
    property.parent = this;
    return property;
  }
  /**
   * Helper method to add a property with a value to the component.
   *
   * @param {String}               name         Property name to add
   * @param {String|Number|Object} value        Property value
   * @return {Property}                    The created property
   */
  addPropertyWithValue(name, value) {
    let prop = new Property(name);
    prop.setValue(value);
    this.addProperty(prop);
    return prop;
  }
  /**
   * Helper method that will update or create a property of the given name
   * and sets its value. If multiple properties with the given name exist,
   * only the first is updated.
   *
   * @param {String}               name         Property name to update
   * @param {String|Number|Object} value        Property value
   * @return {Property}                    The created property
   */
  updatePropertyWithValue(name, value) {
    let prop = this.getFirstProperty(name);
    if (prop) {
      prop.setValue(value);
    } else {
      prop = this.addPropertyWithValue(name, value);
    }
    return prop;
  }
  /**
   * Removes a single property by name or the instance of the specific
   * property.
   *
   * @param {String|Property} nameOrProp     Property name or instance to remove
   * @return {Boolean}                            True, when deleted
   */
  removeProperty(nameOrProp) {
    let removed = this._removeObject(PROPERTY_INDEX, "_properties", nameOrProp);
    if (removed) {
      this._hydratedPropertyCount--;
    }
    return removed;
  }
  /**
   * Removes all properties associated with this component, optionally
   * filtered by name.
   *
   * @param {String=} name        Lowercase property name
   * @return {Boolean}            True, when deleted
   */
  removeAllProperties(name) {
    let removed = this._removeAllObjects(PROPERTY_INDEX, "_properties", name);
    this._hydratedPropertyCount = 0;
    return removed;
  }
  /**
   * Returns the Object representation of this component. The returned object
   * is a live jCal object and should be cloned if modified.
   * @return {Object}
   */
  toJSON() {
    return this.jCal;
  }
  /**
   * The string representation of this component.
   * @return {String}
   */
  toString() {
    return stringify.component(
      this.jCal,
      this._designSet
    );
  }
  /**
   * Retrieve a time zone definition from the component tree, if any is present.
   * If the tree contains no time zone definitions or the TZID cannot be
   * matched, returns null.
   *
   * @param {String} tzid     The ID of the time zone to retrieve
   * @return {Timezone}  The time zone corresponding to the ID, or null
   */
  getTimeZoneByID(tzid) {
    if (this.parent) {
      return this.parent.getTimeZoneByID(tzid);
    }
    if (!this._timezoneCache) {
      return null;
    }
    if (this._timezoneCache.has(tzid)) {
      return this._timezoneCache.get(tzid);
    }
    const zones2 = this.getAllSubcomponents("vtimezone");
    for (const zone of zones2) {
      if (zone.getFirstProperty("tzid").getFirstValue() === tzid) {
        const hydratedZone = new Timezone({
          component: zone,
          tzid
        });
        this._timezoneCache.set(tzid, hydratedZone);
        return hydratedZone;
      }
    }
    return null;
  }
};
var RecurExpansion = class {
  /**
   * Creates a new ICAL.RecurExpansion instance.
   *
   * The options object can be filled with the specified initial values. It can also contain
   * additional members, as a result of serializing a previous expansion state, as shown in the
   * example.
   *
   * @param {Object} options
   *        Recurrence expansion options
   * @param {Time} options.dtstart
   *        Start time of the event
   * @param {Component=} options.component
   *        Component for expansion, required if not resuming.
   */
  constructor(options) {
    this.ruleDates = [];
    this.exDates = [];
    this.fromData(options);
  }
  /**
   * True when iteration is fully completed.
   * @type {Boolean}
   */
  complete = false;
  /**
   * Array of rrule iterators.
   *
   * @type {RecurIterator[]}
   * @private
   */
  ruleIterators = null;
  /**
   * Array of rdate instances.
   *
   * @type {Time[]}
   * @private
   */
  ruleDates = null;
  /**
   * Array of exdate instances.
   *
   * @type {Time[]}
   * @private
   */
  exDates = null;
  /**
   * Current position in ruleDates array.
   * @type {Number}
   * @private
   */
  ruleDateInc = 0;
  /**
   * Current position in exDates array
   * @type {Number}
   * @private
   */
  exDateInc = 0;
  /**
   * Current negative date.
   *
   * @type {Time}
   * @private
   */
  exDate = null;
  /**
   * Current additional date.
   *
   * @type {Time}
   * @private
   */
  ruleDate = null;
  /**
   * Start date of recurring rules.
   *
   * @type {Time}
   */
  dtstart = null;
  /**
   * Last expanded time
   *
   * @type {Time}
   */
  last = null;
  /**
   * Initialize the recurrence expansion from the data object. The options
   * object may also contain additional members, see the
   * {@link ICAL.RecurExpansion constructor} for more details.
   *
   * @param {Object} options
   *        Recurrence expansion options
   * @param {Time} options.dtstart
   *        Start time of the event
   * @param {Component=} options.component
   *        Component for expansion, required if not resuming.
   */
  fromData(options) {
    let start = formatClassType(options.dtstart, Time);
    if (!start) {
      throw new Error(".dtstart (ICAL.Time) must be given");
    } else {
      this.dtstart = start;
    }
    if (options.component) {
      this._init(options.component);
    } else {
      this.last = formatClassType(options.last, Time) || start.clone();
      if (!options.ruleIterators) {
        throw new Error(".ruleIterators or .component must be given");
      }
      this.ruleIterators = options.ruleIterators.map(function(item) {
        return formatClassType(item, RecurIterator);
      });
      this.ruleDateInc = options.ruleDateInc;
      this.exDateInc = options.exDateInc;
      if (options.ruleDates) {
        this.ruleDates = options.ruleDates.map((item) => formatClassType(item, Time));
        this.ruleDate = this.ruleDates[this.ruleDateInc];
      }
      if (options.exDates) {
        this.exDates = options.exDates.map((item) => formatClassType(item, Time));
        this.exDate = this.exDates[this.exDateInc];
      }
      if (typeof options.complete !== "undefined") {
        this.complete = options.complete;
      }
    }
  }
  /**
   * Compare two ICAL.Time objects.  When the second parameter is a DATE and the first parameter is
   * DATE-TIME, strip the time and compare only the days.
   *
   * @private
   * @param {Time} a   The one object to compare
   * @param {Time} b   The other object to compare
   */
  _compare_special(a, b) {
    if (!a.isDate && b.isDate)
      return new Time({ year: a.year, month: a.month, day: a.day }).compare(b);
    return a.compare(b);
  }
  /**
   * Retrieve the next occurrence in the series.
   * @return {Time}
   */
  next() {
    let iter;
    let next;
    let compare;
    let maxTries = 500;
    let currentTry = 0;
    while (true) {
      if (currentTry++ > maxTries) {
        throw new Error(
          "max tries have occurred, rule may be impossible to fulfill."
        );
      }
      next = this.ruleDate;
      iter = this._nextRecurrenceIter(this.last);
      if (!next && !iter) {
        this.complete = true;
        break;
      }
      if (!next || iter && next.compare(iter.last) > 0) {
        next = iter.last.clone();
        iter.next();
      }
      if (this.ruleDate === next) {
        this._nextRuleDay();
      }
      this.last = next;
      if (this.exDate) {
        compare = this._compare_special(this.last, this.exDate);
        if (compare > 0) {
          this._nextExDay();
        }
        if (compare === 0) {
          this._nextExDay();
          continue;
        }
      }
      return this.last;
    }
  }
  /**
   * Converts object into a serialize-able format. This format can be passed
   * back into the expansion to resume iteration.
   * @return {Object}
   */
  toJSON() {
    function toJSON(item) {
      return item.toJSON();
    }
    let result = /* @__PURE__ */ Object.create(null);
    result.ruleIterators = this.ruleIterators.map(toJSON);
    if (this.ruleDates) {
      result.ruleDates = this.ruleDates.map(toJSON);
    }
    if (this.exDates) {
      result.exDates = this.exDates.map(toJSON);
    }
    result.ruleDateInc = this.ruleDateInc;
    result.exDateInc = this.exDateInc;
    result.last = this.last.toJSON();
    result.dtstart = this.dtstart.toJSON();
    result.complete = this.complete;
    return result;
  }
  /**
   * Extract all dates from the properties in the given component. The
   * properties will be filtered by the property name.
   *
   * @private
   * @param {Component} component             The component to search in
   * @param {String} propertyName             The property name to search for
   * @return {Time[]}                         The extracted dates.
   */
  _extractDates(component, propertyName) {
    let result = [];
    let props = component.getAllProperties(propertyName);
    for (let i = 0, len = props.length; i < len; i++) {
      for (let prop of props[i].getValues()) {
        let idx = binsearchInsert(
          result,
          prop,
          (a, b) => a.compare(b)
        );
        result.splice(idx, 0, prop);
      }
    }
    return result;
  }
  /**
   * Initialize the recurrence expansion.
   *
   * @private
   * @param {Component} component    The component to initialize from.
   */
  _init(component) {
    this.ruleIterators = [];
    this.last = this.dtstart.clone();
    if (!component.hasProperty("rdate") && !component.hasProperty("rrule") && !component.hasProperty("recurrence-id")) {
      this.ruleDate = this.last.clone();
      this.complete = true;
      return;
    }
    if (component.hasProperty("rdate")) {
      this.ruleDates = this._extractDates(component, "rdate");
      if (this.ruleDates[0] && this.ruleDates[0].compare(this.dtstart) < 0) {
        this.ruleDateInc = 0;
        this.last = this.ruleDates[0].clone();
      } else {
        this.ruleDateInc = binsearchInsert(
          this.ruleDates,
          this.last,
          (a, b) => a.compare(b)
        );
      }
      this.ruleDate = this.ruleDates[this.ruleDateInc];
    }
    if (component.hasProperty("rrule")) {
      let rules = component.getAllProperties("rrule");
      let i = 0;
      let len = rules.length;
      let rule;
      let iter;
      for (; i < len; i++) {
        rule = rules[i].getFirstValue();
        iter = rule.iterator(this.dtstart);
        this.ruleIterators.push(iter);
        iter.next();
      }
    }
    if (component.hasProperty("exdate")) {
      this.exDates = this._extractDates(component, "exdate");
      this.exDateInc = binsearchInsert(
        this.exDates,
        this.last,
        this._compare_special
      );
      this.exDate = this.exDates[this.exDateInc];
    }
  }
  /**
   * Advance to the next exdate
   * @private
   */
  _nextExDay() {
    this.exDate = this.exDates[++this.exDateInc];
  }
  /**
   * Advance to the next rule date
   * @private
   */
  _nextRuleDay() {
    this.ruleDate = this.ruleDates[++this.ruleDateInc];
  }
  /**
   * Find and return the recurrence rule with the most recent event and
   * return it.
   *
   * @private
   * @return {?RecurIterator}    Found iterator.
   */
  _nextRecurrenceIter() {
    let iters = this.ruleIterators;
    if (iters.length === 0) {
      return null;
    }
    let len = iters.length;
    let iter;
    let iterTime;
    let iterIdx = 0;
    let chosenIter;
    for (; iterIdx < len; iterIdx++) {
      iter = iters[iterIdx];
      iterTime = iter.last;
      if (iter.completed) {
        len--;
        if (iterIdx !== 0) {
          iterIdx--;
        }
        iters.splice(iterIdx, 1);
        continue;
      }
      if (!chosenIter || chosenIter.last.compare(iterTime) > 0) {
        chosenIter = iter;
      }
    }
    return chosenIter;
  }
};
var Event = class _Event {
  /**
   * Creates a new ICAL.Event instance.
   *
   * @param {Component=} component              The ICAL.Component to base this event on
   * @param {Object} [options]                  Options for this event
   * @param {Boolean=} options.strictExceptions  When true, will verify exceptions are related by
   *                                              their UUID
   * @param {Array<Component|Event>=} options.exceptions
   *          Exceptions to this event, either as components or events. If not
   *            specified exceptions will automatically be set in relation of
   *            component's parent
   */
  constructor(component, options) {
    if (!(component instanceof Component)) {
      options = component;
      component = null;
    }
    if (component) {
      this.component = component;
    } else {
      this.component = new Component("vevent");
    }
    this._rangeExceptionCache = /* @__PURE__ */ Object.create(null);
    this.exceptions = /* @__PURE__ */ Object.create(null);
    this.rangeExceptions = [];
    if (options && options.strictExceptions) {
      this.strictExceptions = options.strictExceptions;
    }
    if (options && options.exceptions) {
      options.exceptions.forEach(this.relateException, this);
    } else if (this.component.parent && !this.isRecurrenceException()) {
      this.component.parent.getAllSubcomponents("vevent").forEach(function(event) {
        if (event.hasProperty("recurrence-id")) {
          this.relateException(event);
        }
      }, this);
    }
  }
  static THISANDFUTURE = "THISANDFUTURE";
  /**
   * List of related event exceptions.
   *
   * @type {Event[]}
   */
  exceptions = null;
  /**
   * When true, will verify exceptions are related by their UUID.
   *
   * @type {Boolean}
   */
  strictExceptions = false;
  /**
   * Relates a given event exception to this object.  If the given component
   * does not share the UID of this event it cannot be related and will throw
   * an exception.
   *
   * If this component is an exception it cannot have other exceptions
   * related to it.
   *
   * @param {Component|Event} obj       Component or event
   */
  relateException(obj) {
    if (this.isRecurrenceException()) {
      throw new Error("cannot relate exception to exceptions");
    }
    if (obj instanceof Component) {
      obj = new _Event(obj);
    }
    if (this.strictExceptions && obj.uid !== this.uid) {
      throw new Error("attempted to relate unrelated exception");
    }
    let id = obj.recurrenceId.toString();
    this.exceptions[id] = obj;
    if (obj.modifiesFuture()) {
      let item = [
        obj.recurrenceId.toUnixTime(),
        id
      ];
      let idx = binsearchInsert(
        this.rangeExceptions,
        item,
        compareRangeException
      );
      this.rangeExceptions.splice(idx, 0, item);
    }
  }
  /**
   * Checks if this record is an exception and has the RANGE=THISANDFUTURE
   * value.
   *
   * @return {Boolean}        True, when exception is within range
   */
  modifiesFuture() {
    if (!this.component.hasProperty("recurrence-id")) {
      return false;
    }
    let range = this.component.getFirstProperty("recurrence-id").getParameter("range");
    return range === _Event.THISANDFUTURE;
  }
  /**
   * Finds the range exception nearest to the given date.
   *
   * @param {Time} time   usually an occurrence time of an event
   * @return {?Event}     the related event/exception or null
   */
  findRangeException(time) {
    if (!this.rangeExceptions.length) {
      return null;
    }
    let utc = time.toUnixTime();
    let idx = binsearchInsert(
      this.rangeExceptions,
      [utc],
      compareRangeException
    );
    idx -= 1;
    if (idx < 0) {
      return null;
    }
    let rangeItem = this.rangeExceptions[idx];
    if (utc < rangeItem[0]) {
      return null;
    }
    return rangeItem[1];
  }
  /**
   * Returns the occurrence details based on its start time.  If the
   * occurrence has an exception will return the details for that exception.
   *
   * NOTE: this method is intend to be used in conjunction
   *       with the {@link ICAL.Event#iterator iterator} method.
   *
   * @param {Time} occurrence               time occurrence
   * @return {occurrenceDetails}            Information about the occurrence
   */
  getOccurrenceDetails(occurrence) {
    let id = occurrence.toString();
    let utcId = occurrence.convertToZone(Timezone.utcTimezone).toString();
    let item;
    let result = {
      //XXX: Clone?
      recurrenceId: occurrence
    };
    if (id in this.exceptions) {
      item = result.item = this.exceptions[id];
      result.startDate = item.startDate;
      result.endDate = item.endDate;
      result.item = item;
    } else if (utcId in this.exceptions) {
      item = this.exceptions[utcId];
      result.startDate = item.startDate;
      result.endDate = item.endDate;
      result.item = item;
    } else {
      let rangeExceptionId = this.findRangeException(
        occurrence
      );
      let end;
      if (rangeExceptionId) {
        let exception = this.exceptions[rangeExceptionId];
        result.item = exception;
        let startDiff = this._rangeExceptionCache[rangeExceptionId];
        if (!startDiff) {
          let original = exception.recurrenceId.clone();
          let newStart = exception.startDate.clone();
          original.zone = newStart.zone;
          startDiff = newStart.subtractDate(original);
          this._rangeExceptionCache[rangeExceptionId] = startDiff;
        }
        let start = occurrence.clone();
        start.zone = exception.startDate.zone;
        start.addDuration(startDiff);
        end = start.clone();
        end.addDuration(exception.duration);
        result.startDate = start;
        result.endDate = end;
      } else {
        end = occurrence.clone();
        end.addDuration(this.duration);
        result.endDate = end;
        result.startDate = occurrence;
        result.item = this;
      }
    }
    return result;
  }
  /**
   * Builds a recur expansion instance for a specific point in time (defaults
   * to startDate).
   *
   * @param {Time=} startTime     Starting point for expansion
   * @return {RecurExpansion}    Expansion object
   */
  iterator(startTime) {
    return new RecurExpansion({
      component: this.component,
      dtstart: startTime || this.startDate
    });
  }
  /**
   * Checks if the event is recurring
   *
   * @return {Boolean}        True, if event is recurring
   */
  isRecurring() {
    let comp = this.component;
    return comp.hasProperty("rrule") || comp.hasProperty("rdate");
  }
  /**
   * Checks if the event describes a recurrence exception. See
   * {@tutorial terminology} for details.
   *
   * @return {Boolean}    True, if the event describes a recurrence exception
   */
  isRecurrenceException() {
    return this.component.hasProperty("recurrence-id");
  }
  /**
   * Returns the types of recurrences this event may have.
   *
   * Returned as an object with the following possible keys:
   *
   *    - YEARLY
   *    - MONTHLY
   *    - WEEKLY
   *    - DAILY
   *    - MINUTELY
   *    - SECONDLY
   *
   * @return {Object.<frequencyValues, Boolean>}
   *          Object of recurrence flags
   */
  getRecurrenceTypes() {
    let rules = this.component.getAllProperties("rrule");
    let i = 0;
    let len = rules.length;
    let result = /* @__PURE__ */ Object.create(null);
    for (; i < len; i++) {
      let value = rules[i].getFirstValue();
      result[value.freq] = true;
    }
    return result;
  }
  /**
   * The uid of this event
   * @type {String}
   */
  get uid() {
    return this._firstProp("uid");
  }
  set uid(value) {
    this._setProp("uid", value);
  }
  /**
   * The start date
   * @type {Time}
   */
  get startDate() {
    return this._firstProp("dtstart");
  }
  set startDate(value) {
    this._setTime("dtstart", value);
  }
  /**
   * The end date. This can be the result directly from the property, or the
   * end date calculated from start date and duration. Setting the property
   * will remove any duration properties.
   * @type {Time}
   */
  get endDate() {
    let endDate = this._firstProp("dtend");
    if (!endDate) {
      let duration = this._firstProp("duration");
      endDate = this.startDate.clone();
      if (duration) {
        endDate.addDuration(duration);
      } else if (endDate.isDate) {
        endDate.day += 1;
      }
    }
    return endDate;
  }
  set endDate(value) {
    if (this.component.hasProperty("duration")) {
      this.component.removeProperty("duration");
    }
    this._setTime("dtend", value);
  }
  /**
   * The duration. This can be the result directly from the property, or the
   * duration calculated from start date and end date. Setting the property
   * will remove any `dtend` properties.
   * @type {Duration}
   */
  get duration() {
    let duration = this._firstProp("duration");
    if (!duration) {
      return this.endDate.subtractDateTz(this.startDate);
    }
    return duration;
  }
  set duration(value) {
    if (this.component.hasProperty("dtend")) {
      this.component.removeProperty("dtend");
    }
    this._setProp("duration", value);
  }
  /**
   * The location of the event.
   * @type {String}
   */
  get location() {
    return this._firstProp("location");
  }
  set location(value) {
    this._setProp("location", value);
  }
  /**
   * The attendees in the event
   * @type {Property[]}
   */
  get attendees() {
    return this.component.getAllProperties("attendee");
  }
  /**
   * The event summary
   * @type {String}
   */
  get summary() {
    return this._firstProp("summary");
  }
  set summary(value) {
    this._setProp("summary", value);
  }
  /**
   * The event description.
   * @type {String}
   */
  get description() {
    return this._firstProp("description");
  }
  set description(value) {
    this._setProp("description", value);
  }
  /**
   * The event color from [rfc7986](https://datatracker.ietf.org/doc/html/rfc7986)
   * @type {String}
   */
  get color() {
    return this._firstProp("color");
  }
  set color(value) {
    this._setProp("color", value);
  }
  /**
   * The organizer value as an uri. In most cases this is a mailto: uri, but
   * it can also be something else, like urn:uuid:...
   * @type {String}
   */
  get organizer() {
    return this._firstProp("organizer");
  }
  set organizer(value) {
    this._setProp("organizer", value);
  }
  /**
   * The sequence value for this event. Used for scheduling
   * see {@tutorial terminology}.
   * @type {Number}
   */
  get sequence() {
    return this._firstProp("sequence");
  }
  set sequence(value) {
    this._setProp("sequence", value);
  }
  /**
   * The recurrence id for this event. See {@tutorial terminology} for details.
   * @type {Time}
   */
  get recurrenceId() {
    return this._firstProp("recurrence-id");
  }
  set recurrenceId(value) {
    this._setTime("recurrence-id", value);
  }
  /**
   * Set/update a time property's value.
   * This will also update the TZID of the property.
   *
   * TODO: this method handles the case where we are switching
   * from a known timezone to an implied timezone (one without TZID).
   * This does _not_ handle the case of moving between a known
   *  (by TimezoneService) timezone to an unknown timezone...
   *
   * We will not add/remove/update the VTIMEZONE subcomponents
   *  leading to invalid ICAL data...
   * @private
   * @param {String} propName     The property name
   * @param {Time} time           The time to set
   */
  _setTime(propName, time) {
    let prop = this.component.getFirstProperty(propName);
    if (!prop) {
      prop = new Property(propName);
      this.component.addProperty(prop);
    }
    if (time.zone === Timezone.localTimezone || time.zone === Timezone.utcTimezone) {
      prop.removeParameter("tzid");
    } else {
      prop.setParameter("tzid", time.zone.tzid);
    }
    prop.setValue(time);
  }
  _setProp(name, value) {
    this.component.updatePropertyWithValue(name, value);
  }
  _firstProp(name) {
    return this.component.getFirstPropertyValue(name);
  }
  /**
   * The string representation of this event.
   * @return {String}
   */
  toString() {
    return this.component.toString();
  }
};
function compareRangeException(a, b) {
  if (a[0] > b[0]) return 1;
  if (b[0] > a[0]) return -1;
  return 0;
}
var ComponentParser = class {
  /**
   * Creates a new ICAL.ComponentParser instance.
   *
   * @param {Object=} options                   Component parser options
   * @param {Boolean} options.parseEvent        Whether events should be parsed
   * @param {Boolean} options.parseTimezeone    Whether timezones should be parsed
   */
  constructor(options) {
    if (typeof options === "undefined") {
      options = {};
    }
    for (let [key, value] of Object.entries(options)) {
      this[key] = value;
    }
  }
  /**
   * When true, parse events
   *
   * @type {Boolean}
   */
  parseEvent = true;
  /**
   * When true, parse timezones
   *
   * @type {Boolean}
   */
  parseTimezone = true;
  /* SAX like events here for reference */
  /**
   * Fired when parsing is complete
   * @callback
   */
  oncomplete = (
    /* c8 ignore next */
    function() {
    }
  );
  /**
   * Fired if an error occurs during parsing.
   *
   * @callback
   * @param {Error} err details of error
   */
  onerror = (
    /* c8 ignore next */
    function(err) {
    }
  );
  /**
   * Fired when a top level component (VTIMEZONE) is found
   *
   * @callback
   * @param {Timezone} component     Timezone object
   */
  ontimezone = (
    /* c8 ignore next */
    function(component) {
    }
  );
  /**
   * Fired when a top level component (VEVENT) is found.
   *
   * @callback
   * @param {Event} component    Top level component
   */
  onevent = (
    /* c8 ignore next */
    function(component) {
    }
  );
  /**
   * Process a string or parse ical object.  This function itself will return
   * nothing but will start the parsing process.
   *
   * Events must be registered prior to calling this method.
   *
   * @param {Component|String|Object} ical      The component to process,
   *        either in its final form, as a jCal Object, or string representation
   */
  process(ical) {
    if (typeof ical === "string") {
      ical = parse(ical);
    }
    if (!(ical instanceof Component)) {
      ical = new Component(ical);
    }
    let components = ical.getAllSubcomponents();
    let i = 0;
    let len = components.length;
    let component;
    for (; i < len; i++) {
      component = components[i];
      switch (component.name) {
        case "vtimezone":
          if (this.parseTimezone) {
            let tzid = component.getFirstPropertyValue("tzid");
            if (tzid) {
              this.ontimezone(new Timezone({
                tzid,
                component
              }));
            }
          }
          break;
        case "vevent":
          if (this.parseEvent) {
            this.onevent(new Event(component));
          }
          break;
        default:
          continue;
      }
    }
    this.oncomplete();
  }
};
var ICALmodule = {
  /**
   * The number of characters before iCalendar line folding should occur
   * @type {Number}
   * @default 75
   */
  foldLength: 75,
  debug: false,
  /**
   * The character(s) to be used for a newline. The default value is provided by
   * rfc5545.
   * @type {String}
   * @default "\r\n"
   */
  newLineChar: "\r\n",
  Binary,
  Component,
  ComponentParser,
  Duration,
  Event,
  Period,
  Property,
  Recur,
  RecurExpansion,
  RecurIterator,
  Time,
  Timezone,
  TimezoneService,
  UtcOffset,
  VCardTime,
  parse,
  stringify,
  design,
  helpers
};

// plugins-pack/tasks/lib/vtodo.ts
import { randomUUID } from "node:crypto";
function newUid() {
  return `${randomUUID()}@selfdashboard`;
}
function parseStatus(comp) {
  const status = comp.getFirstPropertyValue("status");
  if (typeof status === "string" && status.toUpperCase() === "COMPLETED") return true;
  const completed = comp.getFirstPropertyValue("completed");
  return Boolean(completed);
}
function parseDue(comp) {
  const due = comp.getFirstPropertyValue("due");
  if (!due) return void 0;
  if (due instanceof ICALmodule.Time) {
    if (due.isDate) return due.toString().slice(0, 10);
    return due.toJSDate().toISOString();
  }
  return String(due);
}
function parseLastModified(comp) {
  const lm = comp.getFirstPropertyValue("last-modified");
  if (lm instanceof ICALmodule.Time) return lm.toJSDate().toISOString();
  return void 0;
}
function parseVcalendarTodos(data) {
  if (!data?.trim()) return [];
  try {
    const jcal = ICALmodule.parse(data);
    const comp = new ICALmodule.Component(jcal);
    const out = [];
    for (const sub of comp.getAllSubcomponents("vtodo")) {
      const uidProp = sub.getFirstPropertyValue("uid");
      const uid = typeof uidProp === "string" ? uidProp : "";
      if (!uid) continue;
      const summaryProp = sub.getFirstPropertyValue("summary");
      out.push({
        uid,
        summary: typeof summaryProp === "string" ? summaryProp.trim() : "",
        completed: parseStatus(sub),
        due: parseDue(sub),
        remoteModifiedIso: parseLastModified(sub)
      });
    }
    return out;
  } catch {
    return [];
  }
}
function buildVtodo(input) {
  const cal = new ICALmodule.Component(["vcalendar", [], []]);
  cal.updatePropertyWithValue("prodid", "-//SelfDashboard//Tasks Plugin//EN");
  cal.updatePropertyWithValue("version", "2.0");
  const todo = new ICALmodule.Component("vtodo");
  todo.updatePropertyWithValue("uid", input.uid);
  todo.updatePropertyWithValue("dtstamp", ICALmodule.Time.now());
  todo.updatePropertyWithValue("summary", input.summary || "\u2014");
  todo.updatePropertyWithValue("status", input.completed ? "COMPLETED" : "NEEDS-ACTION");
  if (input.completed) {
    todo.updatePropertyWithValue("completed", ICALmodule.Time.now());
  }
  if (input.due) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.due)) {
      const t = ICALmodule.Time.fromDateString(input.due);
      t.isDate = true;
      todo.updatePropertyWithValue("due", t);
    } else {
      todo.updatePropertyWithValue("due", ICALmodule.Time.fromJSDate(new Date(input.due), true));
    }
  }
  if (input.lastModifiedIso) {
    todo.updatePropertyWithValue("last-modified", ICALmodule.Time.fromJSDate(new Date(input.lastModifiedIso), true));
  }
  cal.addSubcomponent(todo);
  return cal.toString();
}

// plugins-pack/tasks/lib/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// node_modules/tsdav/dist/tsdav.esm.js
var import_debug = __toESM(require_src());
var import_xml_js = __toESM(require_lib());
var import_base_64 = __toESM(require_base64());
var DAVNamespace;
(function(DAVNamespace2) {
  DAVNamespace2["CALENDAR_SERVER"] = "http://calendarserver.org/ns/";
  DAVNamespace2["CALDAV_APPLE"] = "http://apple.com/ns/ical/";
  DAVNamespace2["CALDAV"] = "urn:ietf:params:xml:ns:caldav";
  DAVNamespace2["CARDDAV"] = "urn:ietf:params:xml:ns:carddav";
  DAVNamespace2["DAV"] = "DAV:";
})(DAVNamespace || (DAVNamespace = {}));
var DAVAttributeMap = {
  [DAVNamespace.CALDAV]: "xmlns:c",
  [DAVNamespace.CARDDAV]: "xmlns:card",
  [DAVNamespace.CALENDAR_SERVER]: "xmlns:cs",
  [DAVNamespace.CALDAV_APPLE]: "xmlns:ca",
  [DAVNamespace.DAV]: "xmlns:d"
};
var DAVNamespaceShort;
(function(DAVNamespaceShort2) {
  DAVNamespaceShort2["CALDAV"] = "c";
  DAVNamespaceShort2["CARDDAV"] = "card";
  DAVNamespaceShort2["CALENDAR_SERVER"] = "cs";
  DAVNamespaceShort2["CALDAV_APPLE"] = "ca";
  DAVNamespaceShort2["DAV"] = "d";
})(DAVNamespaceShort || (DAVNamespaceShort = {}));
var ICALObjects;
(function(ICALObjects2) {
  ICALObjects2["VEVENT"] = "VEVENT";
  ICALObjects2["VTODO"] = "VTODO";
  ICALObjects2["VJOURNAL"] = "VJOURNAL";
  ICALObjects2["VFREEBUSY"] = "VFREEBUSY";
  ICALObjects2["VTIMEZONE"] = "VTIMEZONE";
  ICALObjects2["VALARM"] = "VALARM";
})(ICALObjects || (ICALObjects = {}));
var camelCase = (str) => str.replace(/[-_]+(\w?)/g, (_m, c) => c ? c.toUpperCase() : "");
var resolveFetch = () => {
  if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }
  return (() => {
    throw new Error("tsdav: global fetch is not available in this runtime. Upgrade to Node.js >= 18, run under a browser/Bun/Deno, or install a fetch polyfill on globalThis before importing tsdav. You can also pass a custom `fetch` implementation to `createDAVClient`, `DAVClient`, or individual request helpers.");
  });
};
var fetch2 = resolveFetch();
var NUMERIC_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
var nativeType = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  if (NUMERIC_RE.test(value)) {
    const nValue = Number(value);
    if (!Number.isNaN(nValue) && Number.isFinite(nValue)) {
      return nValue;
    }
  }
  const bValue = value.toLowerCase();
  if (bValue === "true") {
    return true;
  }
  if (bValue === "false") {
    return false;
  }
  return value;
};
var normalizeUrl = (url) => {
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};
var urlEquals = (urlA, urlB) => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }
  return normalizeUrl(urlA) === normalizeUrl(urlB);
};
var urlContains = (urlA, urlB) => {
  if (!urlA && !urlB) {
    return true;
  }
  if (!urlA || !urlB) {
    return false;
  }
  const strippedUrlA = normalizeUrl(urlA);
  const strippedUrlB = normalizeUrl(urlB);
  return strippedUrlA.includes(strippedUrlB) || strippedUrlB.includes(strippedUrlA);
};
var getDAVAttribute = (nsArr) => nsArr.reduce((prev, curr) => ({ ...prev, [DAVAttributeMap[curr]]: curr }), {});
var cleanupFalsy = (obj) => Object.entries(obj).reduce((prev, [key, value]) => {
  if (value)
    return { ...prev, [key]: value };
  return prev;
}, {});
var conditionalParam = (key, param) => {
  if (param) {
    return {
      [key]: param
    };
  }
  return {};
};
var excludeHeaders = (headers, headersToExclude) => {
  if (!headers) {
    return {};
  }
  if (!headersToExclude || headersToExclude.length === 0) {
    return headers;
  }
  const excludeSet = new Set(headersToExclude.map((h) => h.toLowerCase()));
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !excludeSet.has(key.toLowerCase())));
};
var requestHelpers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  cleanupFalsy,
  conditionalParam,
  excludeHeaders,
  getDAVAttribute,
  urlContains,
  urlEquals
});
var debug$5 = (0, import_debug.default)("tsdav:request");
var davRequest = async (params) => {
  var _a;
  const { url, init, convertIncoming = true, parseOutgoing = true, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  const { headers = {}, body, namespace, method, attributes } = init;
  const xmlBody = convertIncoming ? import_xml_js.default.js2xml({
    _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
    // body is spread AFTER _attributes so a body-level `_attributes`
    // set by the caller wins over the implicit `attributes` param.
    _attributes: attributes,
    ...body
  }, {
    compact: true,
    spaces: 2,
    elementNameFn: (name) => {
      if (namespace && !/^.+:.+/.test(name)) {
        return `${namespace}:${name}`;
      }
      return name;
    }
  }) : body;
  const fetchOptionsWithoutHeaders = {
    ...fetchOptions
  };
  delete fetchOptionsWithoutHeaders.headers;
  const mergedHeaders = {};
  const setHeader = (key, value) => {
    if (value == null)
      return;
    const lower = key.toLowerCase();
    Object.keys(mergedHeaders).forEach((existing) => {
      if (existing.toLowerCase() === lower) {
        delete mergedHeaders[existing];
      }
    });
    mergedHeaders[key] = value;
  };
  setHeader("Content-Type", "text/xml;charset=UTF-8");
  Object.entries(cleanupFalsy(headers)).forEach(([k, v]) => setHeader(k, v));
  Object.entries(fetchOptions.headers || {}).forEach(([k, v]) => setHeader(k, v));
  const davResponse = await requestFetch(url, {
    ...fetchOptionsWithoutHeaders,
    headers: mergedHeaders,
    body: xmlBody,
    method
  });
  const resText = await davResponse.text();
  if (!davResponse.ok || !((_a = davResponse.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.includes("xml")) || !parseOutgoing || !resText) {
    const MAX_RAW = 4096;
    const raw = resText.length > MAX_RAW ? `${resText.slice(0, MAX_RAW)}\u2026` : resText;
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw
      }
    ];
  }
  let result;
  try {
    result = import_xml_js.default.xml2js(resText, {
      compact: true,
      trim: true,
      textFn: (value, parentElement) => {
        try {
          const parentOfParent = parentElement._parent;
          const pOpKeys = Object.keys(parentOfParent);
          const keyNo = pOpKeys.length;
          const keyName = pOpKeys[keyNo - 1];
          const arrOfKey = parentOfParent[keyName];
          const arrOfKeyLen = arrOfKey.length;
          if (arrOfKeyLen > 0) {
            const arr = arrOfKey;
            const arrIndex = arrOfKey.length - 1;
            arr[arrIndex] = nativeType(value);
          } else {
            parentOfParent[keyName] = nativeType(value);
          }
        } catch (e) {
          debug$5(e.stack);
        }
      },
      // remove namespace & camelCase
      elementNameFn: (attributeName) => camelCase(attributeName.replace(/^.+:/, "")),
      attributesFn: (value) => {
        const newVal = { ...value };
        delete newVal.xmlns;
        return newVal;
      },
      ignoreDeclaration: true
    });
  } catch (e) {
    debug$5(`Failed to parse DAV response XML: ${e.message}`);
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw: resText
      }
    ];
  }
  if (!(result === null || result === void 0 ? void 0 : result.multistatus)) {
    return [
      {
        href: davResponse.url,
        ok: davResponse.ok,
        status: davResponse.status,
        statusText: davResponse.statusText,
        raw: result
      }
    ];
  }
  const responseBodies = Array.isArray(result.multistatus.response) ? result.multistatus.response : [result.multistatus.response];
  return responseBodies.map((responseBody) => {
    var _a2, _b;
    const statusRegex = /^\S+\s(?<status>\d+)\s(?<statusText>.+)$/;
    if (!responseBody) {
      return {
        status: davResponse.status,
        statusText: davResponse.statusText,
        ok: davResponse.ok
      };
    }
    const matchArr = statusRegex.exec(responseBody.status);
    const status = (matchArr === null || matchArr === void 0 ? void 0 : matchArr.groups) ? Number.parseInt(matchArr.groups.status, 10) : davResponse.status;
    return {
      raw: result,
      href: responseBody.href,
      status,
      statusText: (_b = (_a2 = matchArr === null || matchArr === void 0 ? void 0 : matchArr.groups) === null || _a2 === void 0 ? void 0 : _a2.statusText) !== null && _b !== void 0 ? _b : davResponse.statusText,
      // Derive `ok` from the parsed status (per RFC 4918, a 2xx propstat
      // means success). The previous implementation read `!responseBody.error`
      // which flagged empty `<error/>` elements as failures and ignored
      // real non-2xx statuses inside 207 multistatus payloads.
      ok: status >= 200 && status < 300,
      error: responseBody.error,
      responsedescription: responseBody.responsedescription,
      props: (Array.isArray(responseBody.propstat) ? responseBody.propstat : [responseBody.propstat]).reduce((prev, curr) => {
        return {
          ...prev,
          ...curr === null || curr === void 0 ? void 0 : curr.prop
        };
      }, {})
    };
  });
};
var propfind = async (params) => {
  const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return davRequest({
    url,
    init: {
      method: "PROPFIND",
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: DAVNamespaceShort.DAV,
      body: {
        propfind: {
          _attributes: getDAVAttribute([
            DAVNamespace.CALDAV,
            DAVNamespace.CALDAV_APPLE,
            DAVNamespace.CALENDAR_SERVER,
            DAVNamespace.CARDDAV,
            DAVNamespace.DAV
          ]),
          prop: props
        }
      }
    },
    fetchOptions,
    fetch: fetchOverride
  });
};
var createObject = async (params) => {
  const { url, data, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  return requestFetch(url, {
    method: "PUT",
    body: data,
    headers: excludeHeaders(headers, headersToExclude),
    ...fetchOptions
  });
};
var updateObject = async (params) => {
  const { url, data, etag, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  return requestFetch(url, {
    method: "PUT",
    body: data,
    headers: excludeHeaders(cleanupFalsy({ "If-Match": etag, ...headers }), headersToExclude),
    ...fetchOptions
  });
};
var deleteObject = async (params) => {
  const { url, headers, etag, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  return requestFetch(url, {
    method: "DELETE",
    headers: excludeHeaders(cleanupFalsy({ "If-Match": etag, ...headers }), headersToExclude),
    ...fetchOptions
  });
};
var request = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createObject,
  davRequest,
  deleteObject,
  propfind,
  updateObject
});
function hasFields(obj, fields) {
  const inObj = (object) => fields.every((f) => object[f]);
  if (Array.isArray(obj)) {
    return obj.every((o) => inObj(o));
  }
  return inObj(obj);
}
var findMissingFieldNames = (obj, fields) => fields.reduce((prev, curr) => obj[curr] ? prev : `${prev.length ? `${prev},` : ""}${curr.toString()}`, "");
var debug$4 = (0, import_debug.default)("tsdav:collection");
var collectionQuery = async (params) => {
  const { url, body, depth, defaultNamespace = DAVNamespaceShort.DAV, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const queryResults = await davRequest({
    url,
    init: {
      method: "REPORT",
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: defaultNamespace,
      body
    },
    fetchOptions,
    fetch: fetchOverride
  });
  const errorResponse = queryResults.find((res) => !res.ok || res.status && res.status >= 400);
  if (errorResponse) {
    throw new Error(`Collection query failed: ${errorResponse.status} ${errorResponse.statusText}. ${errorResponse.raw ? `Raw response: ${errorResponse.raw}` : ""}`);
  }
  if (queryResults.length === 1 && !queryResults[0].raw && queryResults[0].status && queryResults[0].status < 300) {
    return [];
  }
  return queryResults;
};
var makeCollection = async (params) => {
  const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return davRequest({
    url,
    init: {
      method: "MKCOL",
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: DAVNamespaceShort.DAV,
      body: props ? {
        mkcol: {
          set: {
            prop: props
          }
        }
      } : void 0
    },
    fetchOptions,
    fetch: fetchOverride
  });
};
var supportedReportSet = async (params) => {
  var _a, _b, _c;
  const { collection: collection2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const res = await propfind({
    url: collection2.url,
    props: {
      [`${DAVNamespaceShort.DAV}:supported-report-set`]: {}
    },
    depth: "0",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  const supportedReport = (_c = (_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.supportedReportSet) === null || _c === void 0 ? void 0 : _c.supportedReport;
  if (!supportedReport) {
    return [];
  }
  const reports = Array.isArray(supportedReport) ? supportedReport : [supportedReport];
  return reports.map((sr) => (sr === null || sr === void 0 ? void 0 : sr.report) ? Object.keys(sr.report)[0] : void 0).filter((name) => typeof name === "string" && name.length > 0);
};
var isCollectionDirty = async (params) => {
  var _a, _b, _c;
  const { collection: collection2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const responses = await propfind({
    url: collection2.url,
    props: {
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {}
    },
    depth: "0",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  const res = responses.filter((r) => urlContains(collection2.url, r.href))[0];
  if (!res) {
    throw new Error("Collection does not exist on server");
  }
  return {
    isDirty: `${collection2.ctag}` !== `${(_a = res.props) === null || _a === void 0 ? void 0 : _a.getctag}`,
    newCtag: (_c = (_b = res.props) === null || _b === void 0 ? void 0 : _b.getctag) === null || _c === void 0 ? void 0 : _c.toString()
  };
};
var syncCollection = (params) => {
  const { url, props, headers, syncLevel, syncToken, headersToExclude, fetchOptions, fetch: fetchOverride } = params;
  return davRequest({
    url,
    init: {
      method: "REPORT",
      namespace: DAVNamespaceShort.DAV,
      headers: excludeHeaders({ ...headers }, headersToExclude),
      body: {
        "sync-collection": {
          _attributes: getDAVAttribute([
            DAVNamespace.CALDAV,
            DAVNamespace.CARDDAV,
            DAVNamespace.DAV
          ]),
          "sync-level": syncLevel,
          "sync-token": syncToken,
          [`${DAVNamespaceShort.DAV}:prop`]: props
        }
      }
    },
    fetchOptions,
    fetch: fetchOverride
  });
};
var smartCollectionSync = async (params) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
  const { collection: collection2, method, headers, headersToExclude, account: account2, detailedResult, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields = ["accountType", "homeUrl"];
  if (!account2 || !hasFields(account2, requiredFields)) {
    if (!account2) {
      throw new Error("no account for smartCollectionSync");
    }
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before smartCollectionSync`);
  }
  const syncMethod = method !== null && method !== void 0 ? method : ((_a = collection2.reports) === null || _a === void 0 ? void 0 : _a.includes("syncCollection")) ? "webdav" : "basic";
  debug$4(`smart collection sync with type ${account2.accountType} and method ${syncMethod}`);
  if (syncMethod === "webdav") {
    const result = await syncCollection({
      url: collection2.url,
      props: {
        [`${DAVNamespaceShort.DAV}:getetag`]: {},
        [`${account2.accountType === "caldav" ? DAVNamespaceShort.CALDAV : DAVNamespaceShort.CARDDAV}:${account2.accountType === "caldav" ? "calendar-data" : "address-data"}`]: {},
        [`${DAVNamespaceShort.DAV}:displayname`]: {}
      },
      syncLevel: 1,
      syncToken: collection2.syncToken,
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    });
    const objectResponses = result.filter((r) => {
      var _a2;
      const extName = account2.accountType === "caldav" ? ".ics" : ".vcf";
      return ((_a2 = r.href) === null || _a2 === void 0 ? void 0 : _a2.slice(-4)) === extName;
    });
    const changedObjectUrls = objectResponses.filter((o) => o.status !== 404).map((r) => r.href);
    const deletedObjectUrls = objectResponses.filter((o) => o.status === 404).map((r) => r.href);
    const multiGetObjectResponse = changedObjectUrls.length ? (_c = await ((_b = collection2.objectMultiGet) === null || _b === void 0 ? void 0 : _b.call(collection2, {
      url: collection2.url,
      props: {
        [`${DAVNamespaceShort.DAV}:getetag`]: {},
        [`${account2.accountType === "caldav" ? DAVNamespaceShort.CALDAV : DAVNamespaceShort.CARDDAV}:${account2.accountType === "caldav" ? "calendar-data" : "address-data"}`]: {}
      },
      objectUrls: changedObjectUrls,
      depth: "1",
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    }))) !== null && _c !== void 0 ? _c : [] : [];
    const remoteObjects = multiGetObjectResponse.map((res) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _j2, _k2;
      return {
        url: (_a2 = res.href) !== null && _a2 !== void 0 ? _a2 : "",
        etag: (_b2 = res.props) === null || _b2 === void 0 ? void 0 : _b2.getetag,
        data: (account2 === null || account2 === void 0 ? void 0 : account2.accountType) === "caldav" ? (_e2 = (_d2 = (_c2 = res.props) === null || _c2 === void 0 ? void 0 : _c2.calendarData) === null || _d2 === void 0 ? void 0 : _d2._cdata) !== null && _e2 !== void 0 ? _e2 : (_f2 = res.props) === null || _f2 === void 0 ? void 0 : _f2.calendarData : (_j2 = (_h2 = (_g2 = res.props) === null || _g2 === void 0 ? void 0 : _g2.addressData) === null || _h2 === void 0 ? void 0 : _h2._cdata) !== null && _j2 !== void 0 ? _j2 : (_k2 = res.props) === null || _k2 === void 0 ? void 0 : _k2.addressData
      };
    });
    const localObjects = (_d = collection2.objects) !== null && _d !== void 0 ? _d : [];
    const created = remoteObjects.filter((o) => localObjects.every((lo) => !urlContains(lo.url, o.url)));
    const updated = localObjects.reduce((prev, curr) => {
      const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    const deleted = deletedObjectUrls.map((o) => ({
      url: o,
      etag: ""
    }));
    const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
    return {
      ...collection2,
      objects: detailedResult ? { created, updated, deleted } : [...unchanged, ...created, ...updated],
      // all syncToken in the results are the same so we use the first one here
      syncToken: (_h = (_g = (_f = (_e = result[0]) === null || _e === void 0 ? void 0 : _e.raw) === null || _f === void 0 ? void 0 : _f.multistatus) === null || _g === void 0 ? void 0 : _g.syncToken) !== null && _h !== void 0 ? _h : collection2.syncToken
    };
  }
  if (syncMethod === "basic") {
    const { isDirty, newCtag } = await isCollectionDirty({
      collection: collection2,
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    });
    if (!isDirty) {
      return detailedResult ? {
        ...collection2,
        objects: {
          created: [],
          updated: [],
          deleted: []
        }
      } : collection2;
    }
    const localObjects = (_j = collection2.objects) !== null && _j !== void 0 ? _j : [];
    const remoteObjects = (_l = await ((_k = collection2.fetchObjects) === null || _k === void 0 ? void 0 : _k.call(collection2, {
      collection: collection2,
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    }))) !== null && _l !== void 0 ? _l : [];
    const created = remoteObjects.filter((ro) => localObjects.every((lo) => !urlContains(lo.url, ro.url)));
    const updated = localObjects.reduce((prev, curr) => {
      const found = remoteObjects.find((ro) => urlContains(ro.url, curr.url));
      if (found && found.etag && found.etag !== curr.etag) {
        return [...prev, found];
      }
      return prev;
    }, []);
    const deleted = localObjects.filter((cal) => remoteObjects.every((ro) => !urlContains(ro.url, cal.url)));
    const unchanged = localObjects.filter((lo) => remoteObjects.some((ro) => urlContains(lo.url, ro.url) && ro.etag === lo.etag));
    return {
      ...collection2,
      objects: detailedResult ? { created, updated, deleted } : [...unchanged, ...created, ...updated],
      ctag: newCtag
    };
  }
  return detailedResult ? {
    ...collection2,
    objects: {
      created: [],
      updated: [],
      deleted: []
    }
  } : collection2;
};
var smartCollectionSyncDetailed = async (params) => smartCollectionSync({ ...params, detailedResult: true });
var collection = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  collectionQuery,
  isCollectionDirty,
  makeCollection,
  smartCollectionSync,
  smartCollectionSyncDetailed,
  supportedReportSet,
  syncCollection
});
var debug$3 = (0, import_debug.default)("tsdav:addressBook");
var addressBookQuery = async (params) => {
  const { url, props, filters, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return collectionQuery({
    url,
    body: {
      "addressbook-query": cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        filter: filters !== null && filters !== void 0 ? filters : {
          "prop-filter": {
            _attributes: {
              name: "FN"
            }
          }
        }
      })
    },
    defaultNamespace: DAVNamespaceShort.CARDDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var addressBookMultiGet = async (params) => {
  const { url, props, objectUrls, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return collectionQuery({
    url,
    body: {
      "addressbook-multiget": cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CARDDAV]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        [`${DAVNamespaceShort.DAV}:href`]: objectUrls
      })
    },
    defaultNamespace: DAVNamespaceShort.CARDDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var fetchAddressBooks = async (params) => {
  const { account: account2, headers, props: customProps, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params !== null && params !== void 0 ? params : {};
  const requiredFields = ["homeUrl", "rootUrl"];
  if (!account2 || !hasFields(account2, requiredFields)) {
    if (!account2) {
      throw new Error("no account for fetchAddressBooks");
    }
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before fetchAddressBooks`);
  }
  const res = await propfind({
    url: account2.homeUrl,
    props: customProps !== null && customProps !== void 0 ? customProps : {
      [`${DAVNamespaceShort.DAV}:displayname`]: {},
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
      [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
      [`${DAVNamespaceShort.DAV}:sync-token`]: {}
    },
    depth: "1",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  return Promise.all(res.filter((r) => {
    var _a, _b;
    return Object.keys((_b = (_a = r.props) === null || _a === void 0 ? void 0 : _a.resourcetype) !== null && _b !== void 0 ? _b : {}).includes("addressbook");
  }).map((rs) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const displayName = (_c = (_b = (_a = rs.props) === null || _a === void 0 ? void 0 : _a.displayname) === null || _b === void 0 ? void 0 : _b._cdata) !== null && _c !== void 0 ? _c : (_d = rs.props) === null || _d === void 0 ? void 0 : _d.displayname;
    debug$3(`Found address book named ${typeof displayName === "string" ? displayName : ""},
             props: ${JSON.stringify(rs.props)}`);
    return {
      url: new URL((_e = rs.href) !== null && _e !== void 0 ? _e : "", (_f = account2.rootUrl) !== null && _f !== void 0 ? _f : "").href,
      ctag: (_g = rs.props) === null || _g === void 0 ? void 0 : _g.getctag,
      displayName: typeof displayName === "string" ? displayName : "",
      resourcetype: Object.keys((_j = (_h = rs.props) === null || _h === void 0 ? void 0 : _h.resourcetype) !== null && _j !== void 0 ? _j : {}),
      syncToken: (_k = rs.props) === null || _k === void 0 ? void 0 : _k.syncToken
    };
  }).map(async (addr) => ({
    ...addr,
    reports: await supportedReportSet({
      collection: addr,
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    })
  })));
};
var fetchVCards = async (params) => {
  const { addressBook: addressBook2, headers, objectUrls, headersToExclude, urlFilter = (url) => Boolean(url), useMultiGet = true, fetchOptions = {}, fetch: fetchOverride } = params;
  debug$3(`Fetching vcards from ${addressBook2 === null || addressBook2 === void 0 ? void 0 : addressBook2.url}`);
  const requiredFields = ["url"];
  if (!addressBook2 || !hasFields(addressBook2, requiredFields)) {
    if (!addressBook2) {
      throw new Error("cannot fetchVCards for undefined addressBook");
    }
    throw new Error(`addressBook must have ${findMissingFieldNames(addressBook2, requiredFields)} before fetchVCards`);
  }
  const vcardUrls = (objectUrls !== null && objectUrls !== void 0 ? objectUrls : (
    // fetch all objects of the calendar
    (await addressBookQuery({
      url: addressBook2.url,
      props: { [`${DAVNamespaceShort.DAV}:getetag`]: {} },
      depth: "1",
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    })).map((res) => {
      var _a;
      return (_a = res.href) !== null && _a !== void 0 ? _a : "";
    })
  )).map((url) => url.startsWith("http") || !url ? url : new URL(url, addressBook2.url).href).filter((url) => url && !urlEquals(url, addressBook2.url)).filter(urlFilter).map((url) => new URL(url).pathname);
  let vCardResults = [];
  if (vcardUrls.length > 0) {
    if (useMultiGet) {
      vCardResults = await addressBookMultiGet({
        url: addressBook2.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CARDDAV}:address-data`]: {}
        },
        objectUrls: vcardUrls,
        depth: "1",
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride
      });
    } else {
      vCardResults = await addressBookQuery({
        url: addressBook2.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CARDDAV}:address-data`]: {}
        },
        depth: "1",
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride
      });
    }
  }
  return vCardResults.map((res) => {
    var _a, _b, _c, _d, _e, _f;
    return {
      url: new URL((_a = res.href) !== null && _a !== void 0 ? _a : "", addressBook2.url).href,
      etag: (_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag,
      data: (_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.addressData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.addressData
    };
  });
};
var createVCard = async (params) => {
  const { addressBook: addressBook2, vCardString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return createObject({
    url: new URL(filename, addressBook2.url).href,
    data: vCardString,
    headers: excludeHeaders({
      "content-type": "text/vcard; charset=utf-8",
      "If-None-Match": "*",
      ...headers
    }, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var updateVCard = async (params) => {
  const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return updateObject({
    url: vCard.url,
    data: vCard.data,
    etag: vCard.etag,
    headers: excludeHeaders({
      "content-type": "text/vcard; charset=utf-8",
      ...headers
    }, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var deleteVCard = async (params) => {
  const { vCard, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return deleteObject({
    url: vCard.url,
    etag: vCard.etag,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var addressBook = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  addressBookMultiGet,
  addressBookQuery,
  createVCard,
  deleteVCard,
  fetchAddressBooks,
  fetchVCards,
  updateVCard
});
var debug$2 = (0, import_debug.default)("tsdav:calendar");
var ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;
var ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
var validateTimeRange = (timeRange) => {
  const { start, end } = timeRange;
  const formatValid = ISO_8601.test(start) && ISO_8601.test(end) || ISO_8601_FULL.test(start) && ISO_8601_FULL.test(end);
  if (!formatValid) {
    throw new Error("invalid timeRange format, not in ISO8601");
  }
  if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime())) {
    throw new Error("invalid timeRange: start or end is not a valid date");
  }
};
var extractComponentNames = (compSet) => {
  var _a;
  let names = [];
  if (Array.isArray(compSet)) {
    names = compSet.map((sc) => {
      var _a2;
      return (_a2 = sc === null || sc === void 0 ? void 0 : sc._attributes) === null || _a2 === void 0 ? void 0 : _a2.name;
    });
  } else if (compSet && typeof compSet === "object") {
    names = [(_a = compSet._attributes) === null || _a === void 0 ? void 0 : _a.name];
  }
  return names.filter((n) => typeof n === "string" && n.length > 0);
};
var fetchCalendarUserAddresses = async (params) => {
  var _a, _b;
  const { account: account2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields = ["principalUrl", "rootUrl"];
  if (!hasFields(account2, requiredFields)) {
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before fetchUserAddresses`);
  }
  debug$2(`Fetch user addresses from ${account2.principalUrl}`);
  const responses = await propfind({
    url: account2.principalUrl,
    props: { [`${DAVNamespaceShort.CALDAV}:calendar-user-address-set`]: {} },
    depth: "0",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  const matched = responses.find((r) => urlContains(account2.principalUrl, r.href));
  if (!matched || !matched.ok) {
    throw new Error("cannot find calendarUserAddresses");
  }
  const rawHrefs = (_b = (_a = matched === null || matched === void 0 ? void 0 : matched.props) === null || _a === void 0 ? void 0 : _a.calendarUserAddressSet) === null || _b === void 0 ? void 0 : _b.href;
  let hrefArray = [];
  if (Array.isArray(rawHrefs)) {
    hrefArray = rawHrefs;
  } else if (rawHrefs) {
    hrefArray = [rawHrefs];
  }
  const addresses = hrefArray.filter((h) => typeof h === "string" && h.length > 0);
  debug$2(`Fetched calendar user addresses ${addresses}`);
  return addresses;
};
var calendarQuery = async (params) => {
  const { url, props, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return collectionQuery({
    url,
    body: {
      "calendar-query": cleanupFalsy({
        _attributes: getDAVAttribute([
          DAVNamespace.CALDAV,
          DAVNamespace.CALENDAR_SERVER,
          DAVNamespace.CALDAV_APPLE,
          DAVNamespace.DAV
        ]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        filter: filters,
        timezone
      })
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var calendarMultiGet = async (params) => {
  const { url, props, objectUrls, filters, timezone, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return collectionQuery({
    url,
    body: {
      "calendar-multiget": cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
        [`${DAVNamespaceShort.DAV}:prop`]: props,
        [`${DAVNamespaceShort.DAV}:href`]: objectUrls,
        filter: filters,
        timezone
      })
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var makeCalendar = async (params) => {
  const { url, props, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return davRequest({
    url,
    init: {
      method: "MKCALENDAR",
      headers: excludeHeaders(cleanupFalsy({ depth, ...headers }), headersToExclude),
      namespace: DAVNamespaceShort.DAV,
      body: {
        [`${DAVNamespaceShort.CALDAV}:mkcalendar`]: {
          _attributes: getDAVAttribute([
            DAVNamespace.DAV,
            DAVNamespace.CALDAV,
            DAVNamespace.CALDAV_APPLE
          ]),
          set: {
            prop: props
          }
        }
      }
    },
    fetchOptions,
    fetch: fetchOverride
  });
};
var fetchCalendars = async (params) => {
  const { headers, account: account2, props: customProps, projectedProps, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params !== null && params !== void 0 ? params : {};
  const requiredFields = ["homeUrl", "rootUrl"];
  if (!account2 || !hasFields(account2, requiredFields)) {
    if (!account2) {
      throw new Error("no account for fetchCalendars");
    }
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before fetchCalendars`);
  }
  const res = await propfind({
    url: account2.homeUrl,
    props: customProps !== null && customProps !== void 0 ? customProps : {
      [`${DAVNamespaceShort.CALDAV}:calendar-description`]: {},
      [`${DAVNamespaceShort.CALDAV}:calendar-timezone`]: {},
      [`${DAVNamespaceShort.DAV}:displayname`]: {},
      [`${DAVNamespaceShort.CALDAV_APPLE}:calendar-color`]: {},
      [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
      [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
      [`${DAVNamespaceShort.CALDAV}:supported-calendar-component-set`]: {},
      [`${DAVNamespaceShort.DAV}:sync-token`]: {}
    },
    depth: "1",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  return Promise.all(res.filter((r) => {
    var _a, _b;
    return Object.keys((_b = (_a = r.props) === null || _a === void 0 ? void 0 : _a.resourcetype) !== null && _b !== void 0 ? _b : {}).includes("calendar");
  }).filter((rc) => {
    var _a, _b;
    const components = extractComponentNames((_b = (_a = rc.props) === null || _a === void 0 ? void 0 : _a.supportedCalendarComponentSet) === null || _b === void 0 ? void 0 : _b.comp);
    return components.length === 0 || components.some((c) => Object.values(ICALObjects).includes(c));
  }).map((rs) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const description = (_a = rs.props) === null || _a === void 0 ? void 0 : _a.calendarDescription;
    const timezone = (_b = rs.props) === null || _b === void 0 ? void 0 : _b.calendarTimezone;
    const compSet = (_d = (_c = rs.props) === null || _c === void 0 ? void 0 : _c.supportedCalendarComponentSet) === null || _d === void 0 ? void 0 : _d.comp;
    const projectedEntries = Object.entries((_e = rs.props) !== null && _e !== void 0 ? _e : {}).filter(([key]) => projectedProps === null || projectedProps === void 0 ? void 0 : projectedProps[key]);
    return {
      description: typeof description === "string" ? description : "",
      timezone: typeof timezone === "string" ? timezone : "",
      url: new URL((_f = rs.href) !== null && _f !== void 0 ? _f : "", (_g = account2.rootUrl) !== null && _g !== void 0 ? _g : "").href,
      ctag: (_h = rs.props) === null || _h === void 0 ? void 0 : _h.getctag,
      calendarColor: (_j = rs.props) === null || _j === void 0 ? void 0 : _j.calendarColor,
      displayName: (_m = (_l = (_k = rs.props) === null || _k === void 0 ? void 0 : _k.displayname) === null || _l === void 0 ? void 0 : _l._cdata) !== null && _m !== void 0 ? _m : (_o = rs.props) === null || _o === void 0 ? void 0 : _o.displayname,
      components: extractComponentNames(compSet),
      resourcetype: Object.keys((_q = (_p = rs.props) === null || _p === void 0 ? void 0 : _p.resourcetype) !== null && _q !== void 0 ? _q : {}),
      syncToken: (_r = rs.props) === null || _r === void 0 ? void 0 : _r.syncToken,
      ...projectedProps && projectedEntries.length > 0 ? { projectedProps: Object.fromEntries(projectedEntries) } : {}
    };
  }).map(async (cal) => ({
    ...cal,
    reports: await supportedReportSet({
      collection: cal,
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    })
  })));
};
var fetchCalendarObjects = async (params) => {
  const { calendar: calendar2, objectUrls, filters: customFilters, timeRange, headers, expand, urlFilter = (url) => Boolean(url === null || url === void 0 ? void 0 : url.includes(".ics")), useMultiGet = true, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  if (timeRange) {
    validateTimeRange(timeRange);
  }
  debug$2(`Fetching calendar objects from ${calendar2 === null || calendar2 === void 0 ? void 0 : calendar2.url}`);
  const requiredFields = ["url"];
  if (!calendar2 || !hasFields(calendar2, requiredFields)) {
    if (!calendar2) {
      throw new Error("cannot fetchCalendarObjects for undefined calendar");
    }
    throw new Error(`calendar must have ${findMissingFieldNames(calendar2, requiredFields)} before fetchCalendarObjects`);
  }
  const filters = customFilters !== null && customFilters !== void 0 ? customFilters : [
    {
      "comp-filter": {
        _attributes: {
          name: "VCALENDAR"
        },
        "comp-filter": {
          _attributes: {
            name: "VEVENT"
          },
          ...timeRange ? {
            "time-range": {
              _attributes: {
                start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
                end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
              }
            }
          } : {}
        }
      }
    }
  ];
  let initialResponses = [];
  const calendarObjectUrls = (objectUrls !== null && objectUrls !== void 0 ? objectUrls : (
    // fetch all objects of the calendar
    (initialResponses = await calendarQuery({
      url: calendar2.url,
      props: {
        [`${DAVNamespaceShort.DAV}:getetag`]: {},
        ...expand && timeRange ? {
          [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {
            [`${DAVNamespaceShort.CALDAV}:expand`]: {
              _attributes: {
                start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
                end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
              }
            }
          }
        } : {}
      },
      filters,
      depth: "1",
      headers: excludeHeaders(headers, headersToExclude),
      fetchOptions,
      fetch: fetchOverride
    })).map((res) => {
      var _a;
      return (_a = res.href) !== null && _a !== void 0 ? _a : "";
    })
  )).map((url) => url.startsWith("http") || !url ? url : new URL(url, calendar2.url).href).filter(urlFilter).map((url) => new URL(url).pathname);
  let calendarObjectResults = [];
  if (calendarObjectUrls.length > 0) {
    if (expand && !objectUrls) {
      calendarObjectResults = initialResponses.filter((res) => {
        var _a, _b;
        const fullUrl = ((_a = res.href) !== null && _a !== void 0 ? _a : "").startsWith("http") ? res.href : new URL((_b = res.href) !== null && _b !== void 0 ? _b : "", calendar2.url).href;
        return urlFilter(fullUrl !== null && fullUrl !== void 0 ? fullUrl : "");
      });
    } else if (!useMultiGet) {
      calendarObjectResults = await calendarQuery({
        url: calendar2.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {
            ...expand && timeRange ? {
              [`${DAVNamespaceShort.CALDAV}:expand`]: {
                _attributes: {
                  start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
                  end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
                }
              }
            } : {}
          }
        },
        filters,
        depth: "1",
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride
      });
    } else {
      calendarObjectResults = await calendarMultiGet({
        url: calendar2.url,
        props: {
          [`${DAVNamespaceShort.DAV}:getetag`]: {},
          [`${DAVNamespaceShort.CALDAV}:calendar-data`]: {
            ...expand && timeRange ? {
              [`${DAVNamespaceShort.CALDAV}:expand`]: {
                _attributes: {
                  start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
                  end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
                }
              }
            } : {}
          }
        },
        objectUrls: calendarObjectUrls,
        depth: "1",
        headers: excludeHeaders(headers, headersToExclude),
        fetchOptions,
        fetch: fetchOverride
      });
    }
  }
  return calendarObjectResults.map((res) => {
    var _a, _b, _c, _d, _e, _f;
    return {
      url: new URL((_a = res.href) !== null && _a !== void 0 ? _a : "", calendar2.url).href,
      etag: `${(_b = res.props) === null || _b === void 0 ? void 0 : _b.getetag}`,
      data: (_e = (_d = (_c = res.props) === null || _c === void 0 ? void 0 : _c.calendarData) === null || _d === void 0 ? void 0 : _d._cdata) !== null && _e !== void 0 ? _e : (_f = res.props) === null || _f === void 0 ? void 0 : _f.calendarData
    };
  });
};
var createCalendarObject = async (params) => {
  const { calendar: calendar2, iCalString, filename, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return createObject({
    url: new URL(filename, calendar2.url).href,
    data: iCalString,
    headers: excludeHeaders({
      "content-type": "text/calendar; charset=utf-8",
      "If-None-Match": "*",
      ...headers
    }, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var updateCalendarObject = async (params) => {
  const { calendarObject, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return updateObject({
    url: calendarObject.url,
    data: calendarObject.data,
    etag: calendarObject.etag,
    headers: excludeHeaders({
      "content-type": "text/calendar; charset=utf-8",
      ...headers
    }, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var deleteCalendarObject = async (params) => {
  const { calendarObject, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  return deleteObject({
    url: calendarObject.url,
    etag: calendarObject.etag,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
};
var syncCalendars = async (params) => {
  var _a;
  const { oldCalendars, account: account2, detailedResult, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  if (!account2) {
    throw new Error("Must have account before syncCalendars");
  }
  const localCalendars = (_a = oldCalendars !== null && oldCalendars !== void 0 ? oldCalendars : account2.calendars) !== null && _a !== void 0 ? _a : [];
  const remoteCalendars = await fetchCalendars({
    account: account2,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  const created = remoteCalendars.filter((rc) => localCalendars.every((lc) => !urlContains(lc.url, rc.url)));
  debug$2(`new calendars: ${created.map((cc) => cc.displayName)}`);
  const updated = localCalendars.reduce((prev, curr) => {
    const found = remoteCalendars.find((rc) => urlContains(rc.url, curr.url));
    if (found && (found.syncToken && `${found.syncToken}` !== `${curr.syncToken}` || found.ctag && `${found.ctag}` !== `${curr.ctag}`)) {
      return [...prev, found];
    }
    return prev;
  }, []);
  debug$2(`updated calendars: ${updated.map((cc) => cc.displayName)}`);
  const updatedWithObjects = await Promise.all(updated.map(async (u) => {
    const result = await smartCollectionSync({
      collection: { ...u, objectMultiGet: calendarMultiGet },
      method: "webdav",
      headers: excludeHeaders(headers, headersToExclude),
      account: account2,
      fetchOptions,
      fetch: fetchOverride
    });
    return result;
  }));
  const deleted = localCalendars.filter((cal) => remoteCalendars.every((rc) => !urlContains(rc.url, cal.url)));
  debug$2(`deleted calendars: ${deleted.map((cc) => cc.displayName)}`);
  const unchanged = localCalendars.filter((cal) => remoteCalendars.some((rc) => {
    if (!urlContains(rc.url, cal.url))
      return false;
    const syncTokenMatches = !rc.syncToken || `${rc.syncToken}` === `${cal.syncToken}`;
    const ctagMatches = !rc.ctag || `${rc.ctag}` === `${cal.ctag}`;
    return syncTokenMatches && ctagMatches;
  }));
  debug$2(`unchanged calendars: ${unchanged.map((cc) => cc.displayName)}`);
  return detailedResult ? {
    created,
    updated: updatedWithObjects,
    deleted
  } : [...unchanged, ...created, ...updatedWithObjects];
};
var syncCalendarsDetailed = async (params) => syncCalendars({ ...params, detailedResult: true });
var freeBusyQuery = async (params) => {
  const { url, timeRange, depth, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  if (!timeRange) {
    throw new Error("timeRange is required");
  }
  validateTimeRange(timeRange);
  const result = await collectionQuery({
    url,
    body: {
      "free-busy-query": cleanupFalsy({
        _attributes: getDAVAttribute([DAVNamespace.CALDAV]),
        [`${DAVNamespaceShort.CALDAV}:time-range`]: {
          _attributes: {
            start: `${new Date(timeRange.start).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`,
            end: `${new Date(timeRange.end).toISOString().slice(0, 19).replace(/[-:.]/g, "")}Z`
          }
        }
      })
    },
    defaultNamespace: DAVNamespaceShort.CALDAV,
    depth,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  return result[0];
};
var calendar = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  calendarMultiGet,
  calendarQuery,
  createCalendarObject,
  deleteCalendarObject,
  fetchCalendarObjects,
  fetchCalendarUserAddresses,
  fetchCalendars,
  freeBusyQuery,
  makeCalendar,
  syncCalendars,
  syncCalendarsDetailed,
  updateCalendarObject
});
var debug$1 = (0, import_debug.default)("tsdav:account");
var getCandidateRootUrls = (serverUrl, discoveredRootUrl) => {
  const candidates = [discoveredRootUrl, serverUrl, new URL("/", serverUrl).href];
  return candidates.filter((url, index2) => candidates.indexOf(url) === index2);
};
var serviceDiscovery = async (params) => {
  var _a;
  debug$1("Service discovery...");
  const { account: account2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  const endpoint = new URL(account2.serverUrl);
  const uri = new URL(`/.well-known/${account2.accountType}`, endpoint);
  uri.protocol = (_a = endpoint.protocol) !== null && _a !== void 0 ? _a : "http";
  const extractRedirect = (response) => {
    var _a2;
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (typeof location === "string" && location.length) {
        debug$1(`Service discovery redirected to ${location}`);
        const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(location);
        const serviceURL = new URL(location, endpoint);
        if (serviceURL.hostname === uri.hostname && uri.port && !serviceURL.port) {
          serviceURL.port = uri.port;
        }
        if (!hasExplicitScheme) {
          serviceURL.protocol = (_a2 = endpoint.protocol) !== null && _a2 !== void 0 ? _a2 : "http";
        }
        return serviceURL.href;
      }
    }
    return void 0;
  };
  try {
    const response = await requestFetch(uri.href, {
      ...fetchOptions,
      // the following fields are essential to discovery; do not allow
      // fetchOptions to override them.
      method: "PROPFIND",
      headers: {
        ...excludeHeaders(headers, headersToExclude),
        "Content-Type": "text/xml;charset=UTF-8"
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
  </d:prop>
</d:propfind>`,
      redirect: "manual"
    });
    const redirectUrl = extractRedirect(response);
    if (redirectUrl) {
      return redirectUrl;
    }
  } catch (err) {
    debug$1(`Service discovery PROPFIND failed: ${err.stack}`);
  }
  try {
    const response = await requestFetch(uri.href, {
      ...fetchOptions,
      method: "GET",
      headers: excludeHeaders(headers, headersToExclude),
      redirect: "manual"
    });
    const redirectUrl = extractRedirect(response);
    if (redirectUrl) {
      return redirectUrl;
    }
  } catch (err) {
    debug$1(`Service discovery GET failed: ${err.stack}`);
  }
  return endpoint.href;
};
var fetchPrincipalUrl = async (params) => {
  var _a, _b;
  const { account: account2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields = ["rootUrl"];
  if (!hasFields(account2, requiredFields)) {
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before fetchPrincipalUrl`);
  }
  debug$1(`Fetching principal url from path ${account2.rootUrl}`);
  const [response] = await propfind({
    url: account2.rootUrl,
    props: {
      [`${DAVNamespaceShort.DAV}:current-user-principal`]: {}
    },
    depth: "0",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  if (!response.ok) {
    debug$1(`Fetch principal url failed: ${response.statusText}`);
    if (response.status === 401) {
      throw new Error(`Invalid credentials: PROPFIND ${account2.rootUrl} returned 401 Unauthorized`);
    }
    throw new Error("cannot find principalUrl");
  }
  const principalHref = (_b = (_a = response.props) === null || _a === void 0 ? void 0 : _a.currentUserPrincipal) === null || _b === void 0 ? void 0 : _b.href;
  if (typeof principalHref !== "string" || !principalHref.length) {
    debug$1("Fetch principal url failed: missing current-user-principal href");
    throw new Error("cannot find principalUrl");
  }
  debug$1(`Fetched principal url ${principalHref}`);
  return new URL(principalHref, account2.rootUrl).href;
};
var fetchHomeUrl = async (params) => {
  var _a, _b, _c, _d;
  const { account: account2, headers, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const requiredFields = ["principalUrl", "rootUrl"];
  if (!hasFields(account2, requiredFields)) {
    throw new Error(`account must have ${findMissingFieldNames(account2, requiredFields)} before fetchHomeUrl`);
  }
  debug$1(`Fetch home url from ${account2.principalUrl}`);
  const responses = await propfind({
    url: account2.principalUrl,
    props: account2.accountType === "caldav" ? { [`${DAVNamespaceShort.CALDAV}:calendar-home-set`]: {} } : { [`${DAVNamespaceShort.CARDDAV}:addressbook-home-set`]: {} },
    depth: "0",
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  const matched = responses.find((r) => urlContains(account2.principalUrl, r.href));
  if (!matched || !matched.ok) {
    debug$1(`Fetch home url failed with status ${matched === null || matched === void 0 ? void 0 : matched.statusText} and error ${JSON.stringify(responses.map((r) => r.error))}`);
    throw new Error("cannot find homeUrl");
  }
  const homeHref = account2.accountType === "caldav" ? (_b = (_a = matched.props) === null || _a === void 0 ? void 0 : _a.calendarHomeSet) === null || _b === void 0 ? void 0 : _b.href : (_d = (_c = matched.props) === null || _c === void 0 ? void 0 : _c.addressbookHomeSet) === null || _d === void 0 ? void 0 : _d.href;
  if (typeof homeHref !== "string" || homeHref.length === 0) {
    debug$1(`Fetch home url failed: server did not return a ${account2.accountType === "caldav" ? "calendar-home-set" : "addressbook-home-set"} href`);
    throw new Error("cannot find homeUrl");
  }
  const result = new URL(homeHref, account2.rootUrl).href;
  debug$1(`Fetched home url ${result}`);
  return result;
};
var createAccount = async (params) => {
  var _a, _b, _c, _d;
  const { account: account2, headers, loadCollections = false, loadObjects = false, headersToExclude, fetchOptions = {}, fetch: fetchOverride } = params;
  const newAccount = { ...account2 };
  const discoveredRootUrl = (_a = account2.rootUrl) !== null && _a !== void 0 ? _a : await serviceDiscovery({
    account: account2,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  if (account2.rootUrl) {
    newAccount.rootUrl = account2.rootUrl;
  } else if (account2.principalUrl) {
    newAccount.rootUrl = discoveredRootUrl;
  } else {
    let lastPrincipalError;
    for (const rootUrl of getCandidateRootUrls(account2.serverUrl, discoveredRootUrl)) {
      try {
        const principalUrl = await fetchPrincipalUrl({
          account: {
            ...newAccount,
            rootUrl
          },
          headers: excludeHeaders(headers, headersToExclude),
          fetchOptions,
          fetch: fetchOverride
        });
        newAccount.rootUrl = rootUrl;
        newAccount.principalUrl = principalUrl;
        break;
      } catch (err) {
        lastPrincipalError = err;
      }
    }
    if (!newAccount.rootUrl || !newAccount.principalUrl) {
      throw lastPrincipalError !== null && lastPrincipalError !== void 0 ? lastPrincipalError : new Error("cannot find principalUrl");
    }
  }
  newAccount.principalUrl = (_c = (_b = account2.principalUrl) !== null && _b !== void 0 ? _b : newAccount.principalUrl) !== null && _c !== void 0 ? _c : await fetchPrincipalUrl({
    account: newAccount,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  newAccount.homeUrl = (_d = account2.homeUrl) !== null && _d !== void 0 ? _d : await fetchHomeUrl({
    account: newAccount,
    headers: excludeHeaders(headers, headersToExclude),
    fetchOptions,
    fetch: fetchOverride
  });
  if (loadCollections || loadObjects) {
    if (account2.accountType === "caldav") {
      newAccount.calendars = await fetchCalendars({
        headers: excludeHeaders(headers, headersToExclude),
        account: newAccount,
        fetchOptions,
        fetch: fetchOverride
      });
    } else if (account2.accountType === "carddav") {
      newAccount.addressBooks = await fetchAddressBooks({
        headers: excludeHeaders(headers, headersToExclude),
        account: newAccount,
        fetchOptions,
        fetch: fetchOverride
      });
    }
  }
  if (loadObjects) {
    if (account2.accountType === "caldav" && newAccount.calendars) {
      newAccount.calendars = await Promise.all(newAccount.calendars.map(async (cal) => ({
        ...cal,
        objects: await fetchCalendarObjects({
          calendar: cal,
          headers: excludeHeaders(headers, headersToExclude),
          fetchOptions,
          fetch: fetchOverride
        })
      })));
    } else if (account2.accountType === "carddav" && newAccount.addressBooks) {
      newAccount.addressBooks = await Promise.all(newAccount.addressBooks.map(async (addr) => ({
        ...addr,
        objects: await fetchVCards({
          addressBook: addr,
          headers: excludeHeaders(headers, headersToExclude),
          fetchOptions,
          fetch: fetchOverride
        })
      })));
    }
  }
  return newAccount;
};
var account = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  createAccount,
  fetchHomeUrl,
  fetchPrincipalUrl,
  serviceDiscovery
});
var { encode } = import_base_64.default;
var debug = (0, import_debug.default)("tsdav:authHelper");
var defaultParam = (fn, params) => (...args) => {
  return fn({ ...params, ...args[0] });
};
var getBasicAuthHeaders = (credentials) => {
  var _a;
  debug(`Basic auth token generated for user "${(_a = credentials.username) !== null && _a !== void 0 ? _a : ""}"`);
  return {
    authorization: `Basic ${encode(`${credentials.username}:${credentials.password}`)}`
  };
};
var getBearerAuthHeaders = (credentials) => {
  return {
    authorization: `Bearer ${credentials.accessToken}`
  };
};
var fetchOauthTokens = async (credentials, fetchOptions, fetchOverride) => {
  const requireFields = [
    "authorizationCode",
    "redirectUrl",
    "clientId",
    "clientSecret",
    "tokenUrl"
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
  }
  const param = new URLSearchParams({
    grant_type: "authorization_code",
    code: credentials.authorizationCode,
    redirect_uri: credentials.redirectUrl,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret
  });
  debug(`Fetching oauth tokens from ${credentials.tokenUrl}`);
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  const response = await requestFetch(credentials.tokenUrl, {
    method: "POST",
    body: param.toString(),
    headers: {
      "content-length": `${param.toString().length}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    ...fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : {}
  });
  if (response.ok) {
    const tokens = await response.json();
    return tokens;
  }
  debug(`Fetch Oauth tokens failed with status ${response.status}`);
  return {};
};
var refreshAccessToken = async (credentials, fetchOptions, fetchOverride) => {
  const requireFields = [
    "refreshToken",
    "clientId",
    "clientSecret",
    "tokenUrl"
  ];
  if (!hasFields(credentials, requireFields)) {
    throw new Error(`Oauth credentials missing: ${findMissingFieldNames(credentials, requireFields)}`);
  }
  const param = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token"
  });
  const requestFetch = fetchOverride !== null && fetchOverride !== void 0 ? fetchOverride : fetch2;
  const response = await requestFetch(credentials.tokenUrl, {
    method: "POST",
    body: param.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    ...fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : {}
  });
  if (response.ok) {
    const tokens = await response.json();
    return tokens;
  }
  debug(`Refresh access token failed with status ${response.status}`);
  return {};
};
var getOauthHeaders = async (credentials, fetchOptions, fetchOverride) => {
  var _a;
  debug("Fetching oauth headers");
  let tokens = {};
  let didRefresh = false;
  if (!credentials.refreshToken) {
    tokens = await fetchOauthTokens(credentials, fetchOptions, fetchOverride);
    didRefresh = true;
  } else if (credentials.refreshToken && !credentials.accessToken || Date.now() > ((_a = credentials.expiration) !== null && _a !== void 0 ? _a : 0)) {
    tokens = await refreshAccessToken(credentials, fetchOptions, fetchOverride);
    didRefresh = true;
  } else {
    tokens = {
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    };
  }
  if (didRefresh) {
    if (tokens.access_token) {
      credentials.accessToken = tokens.access_token;
    }
    if (tokens.refresh_token) {
      credentials.refreshToken = tokens.refresh_token;
    }
    if (typeof tokens.expires_in === "number") {
      credentials.expiration = Date.now() + tokens.expires_in * 1e3;
    }
  }
  debug("Oauth tokens obtained");
  return {
    tokens,
    headers: tokens.access_token ? { authorization: `Bearer ${tokens.access_token}` } : {}
  };
};
var authHelpers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultParam,
  fetchOauthTokens,
  getBasicAuthHeaders,
  getBearerAuthHeaders,
  getOauthHeaders,
  refreshAccessToken
});
var createDAVClient = async (params) => {
  var _a;
  const {
    serverUrl,
    credentials,
    // Match the class-based DAVClient default so the two entrypoints behave
    // the same when `authMethod` is omitted (`authMethod?` on the type must
    // not throw 'Invalid auth method' at runtime).
    authMethod = "Basic",
    defaultAccountType,
    authFunction,
    fetchOptions: defaultFetchOptions,
    fetch: fetchOverride
  } = params;
  let authHeaders = {};
  switch (authMethod) {
    case "Basic":
      authHeaders = getBasicAuthHeaders(credentials);
      break;
    case "Bearer":
      authHeaders = getBearerAuthHeaders(credentials);
      break;
    case "Oauth":
      authHeaders = (await getOauthHeaders(credentials, void 0, fetchOverride)).headers;
      break;
    case "Digest":
      authHeaders = {
        Authorization: `Digest ${credentials.digestString}`
      };
      break;
    case "Custom":
      if (!authFunction) {
        throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
      }
      authHeaders = (_a = await authFunction(credentials)) !== null && _a !== void 0 ? _a : {};
      break;
    default:
      throw new Error("Invalid auth method");
  }
  const defaultAccount = defaultAccountType ? await createAccount({
    account: { serverUrl, credentials, accountType: defaultAccountType },
    headers: authHeaders,
    fetchOptions: defaultFetchOptions,
    fetch: fetchOverride
  }) : void 0;
  const davRequest$1 = async (params0) => {
    const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
    const { headers, ...restInit } = init;
    return davRequest({
      ...rest,
      init: {
        ...restInit,
        headers: {
          ...authHeaders,
          ...headers
        }
      },
      fetchOptions: fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : defaultFetchOptions,
      fetch: fetchOverride2 !== null && fetchOverride2 !== void 0 ? fetchOverride2 : fetchOverride
    });
  };
  const commonDefaults = {
    headers: authHeaders,
    fetchOptions: defaultFetchOptions,
    fetch: fetchOverride
  };
  const commonDefaultsWithUrl = { url: serverUrl, ...commonDefaults };
  const commonDefaultsWithAccount = { account: defaultAccount, ...commonDefaults };
  const createObject$1 = defaultParam(createObject, commonDefaultsWithUrl);
  const updateObject$1 = defaultParam(updateObject, commonDefaultsWithUrl);
  const deleteObject$1 = defaultParam(deleteObject, commonDefaultsWithUrl);
  const propfind$1 = defaultParam(propfind, commonDefaults);
  const createAccount$1 = async (params0) => {
    const { account: account2, headers, loadCollections, loadObjects, fetchOptions, fetch: fetchOverride2 } = params0;
    const merged = { serverUrl, credentials, ...account2 };
    if (!merged.accountType) {
      throw new Error("createAccount requires an accountType; pass one via `account.accountType` or set `defaultAccountType` on the client.");
    }
    return createAccount({
      account: merged,
      headers: { ...authHeaders, ...headers },
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : defaultFetchOptions,
      fetch: fetchOverride2 !== null && fetchOverride2 !== void 0 ? fetchOverride2 : fetchOverride
    });
  };
  const collectionQuery$1 = defaultParam(collectionQuery, commonDefaults);
  const makeCollection$1 = defaultParam(makeCollection, commonDefaults);
  const syncCollection$1 = defaultParam(syncCollection, commonDefaults);
  const supportedReportSet$1 = defaultParam(supportedReportSet, commonDefaults);
  const isCollectionDirty$1 = defaultParam(isCollectionDirty, commonDefaults);
  const smartCollectionSync$1 = defaultParam(smartCollectionSync, commonDefaultsWithAccount);
  const smartCollectionSyncDetailed$1 = defaultParam(smartCollectionSyncDetailed, commonDefaultsWithAccount);
  const calendarQuery$1 = defaultParam(calendarQuery, commonDefaults);
  const calendarMultiGet$1 = defaultParam(calendarMultiGet, commonDefaults);
  const makeCalendar$1 = defaultParam(makeCalendar, commonDefaults);
  const fetchCalendars$1 = defaultParam(fetchCalendars, commonDefaultsWithAccount);
  const fetchCalendarUserAddresses$1 = defaultParam(fetchCalendarUserAddresses, commonDefaultsWithAccount);
  const fetchCalendarObjects$1 = defaultParam(fetchCalendarObjects, commonDefaults);
  const createCalendarObject$1 = defaultParam(createCalendarObject, commonDefaults);
  const updateCalendarObject$1 = defaultParam(updateCalendarObject, commonDefaults);
  const deleteCalendarObject$1 = defaultParam(deleteCalendarObject, commonDefaults);
  const syncCalendars$1 = defaultParam(syncCalendars, commonDefaultsWithAccount);
  const syncCalendarsDetailed$1 = defaultParam(syncCalendarsDetailed, commonDefaultsWithAccount);
  const addressBookQuery$1 = defaultParam(addressBookQuery, commonDefaults);
  const addressBookMultiGet$1 = defaultParam(addressBookMultiGet, commonDefaults);
  const fetchAddressBooks$1 = defaultParam(fetchAddressBooks, commonDefaultsWithAccount);
  const fetchVCards$1 = defaultParam(fetchVCards, commonDefaults);
  const createVCard$1 = defaultParam(createVCard, commonDefaults);
  const updateVCard$1 = defaultParam(updateVCard, commonDefaults);
  const deleteVCard$1 = defaultParam(deleteVCard, commonDefaults);
  return {
    davRequest: davRequest$1,
    propfind: propfind$1,
    createAccount: createAccount$1,
    createObject: createObject$1,
    updateObject: updateObject$1,
    deleteObject: deleteObject$1,
    calendarQuery: calendarQuery$1,
    addressBookQuery: addressBookQuery$1,
    collectionQuery: collectionQuery$1,
    makeCollection: makeCollection$1,
    calendarMultiGet: calendarMultiGet$1,
    makeCalendar: makeCalendar$1,
    syncCollection: syncCollection$1,
    supportedReportSet: supportedReportSet$1,
    isCollectionDirty: isCollectionDirty$1,
    smartCollectionSync: smartCollectionSync$1,
    smartCollectionSyncDetailed: smartCollectionSyncDetailed$1,
    fetchCalendars: fetchCalendars$1,
    fetchCalendarUserAddresses: fetchCalendarUserAddresses$1,
    fetchCalendarObjects: fetchCalendarObjects$1,
    createCalendarObject: createCalendarObject$1,
    updateCalendarObject: updateCalendarObject$1,
    deleteCalendarObject: deleteCalendarObject$1,
    syncCalendars: syncCalendars$1,
    syncCalendarsDetailed: syncCalendarsDetailed$1,
    fetchAddressBooks: fetchAddressBooks$1,
    addressBookMultiGet: addressBookMultiGet$1,
    fetchVCards: fetchVCards$1,
    createVCard: createVCard$1,
    updateVCard: updateVCard$1,
    deleteVCard: deleteVCard$1
  };
};
var DAVClient = class {
  constructor(params) {
    var _a, _b, _c;
    this.serverUrl = params.serverUrl;
    this.credentials = params.credentials;
    this.authMethod = (_a = params.authMethod) !== null && _a !== void 0 ? _a : "Basic";
    this.accountType = (_b = params.defaultAccountType) !== null && _b !== void 0 ? _b : "caldav";
    this.authFunction = params.authFunction;
    this.fetchOptions = (_c = params.fetchOptions) !== null && _c !== void 0 ? _c : {};
    this.fetchOverride = params.fetch;
  }
  async login(options) {
    switch (this.authMethod) {
      case "Basic":
        this.authHeaders = getBasicAuthHeaders(this.credentials);
        break;
      case "Bearer":
        this.authHeaders = getBearerAuthHeaders(this.credentials);
        break;
      case "Oauth":
        this.authHeaders = (await getOauthHeaders(this.credentials, this.fetchOptions, this.fetchOverride)).headers;
        break;
      case "Digest":
        this.authHeaders = {
          Authorization: `Digest ${this.credentials.digestString}`
        };
        break;
      case "Custom":
        if (!this.authFunction) {
          throw new Error("authMethod 'Custom' requires an authFunction to produce request headers");
        }
        this.authHeaders = await this.authFunction(this.credentials);
        break;
      default:
        throw new Error("Invalid auth method");
    }
    this.account = this.accountType ? await createAccount({
      account: {
        serverUrl: this.serverUrl,
        credentials: this.credentials,
        accountType: this.accountType
      },
      headers: this.authHeaders,
      loadCollections: options === null || options === void 0 ? void 0 : options.loadCollections,
      loadObjects: options === null || options === void 0 ? void 0 : options.loadObjects,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    }) : void 0;
  }
  async davRequest(params0) {
    const { init, fetchOptions, fetch: fetchOverride2, ...rest } = params0;
    const { headers, ...restInit } = init;
    return davRequest({
      ...rest,
      init: {
        ...restInit,
        headers: {
          ...this.authHeaders,
          ...headers
        }
      },
      fetchOptions: fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : this.fetchOptions,
      fetch: fetchOverride2 !== null && fetchOverride2 !== void 0 ? fetchOverride2 : this.fetchOverride
    });
  }
  async createObject(...params) {
    return defaultParam(createObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async updateObject(...params) {
    return defaultParam(updateObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async deleteObject(...params) {
    return defaultParam(deleteObject, {
      url: this.serverUrl,
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async propfind(...params) {
    return defaultParam(propfind, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async createAccount(params0) {
    var _a;
    const { account: account2, headers, loadCollections, loadObjects, fetchOptions, fetch: fetch3 } = params0;
    const accountType = (_a = account2.accountType) !== null && _a !== void 0 ? _a : this.accountType;
    if (!accountType) {
      throw new Error("createAccount requires an accountType; pass one via `account.accountType` or configure `defaultAccountType` on the DAVClient.");
    }
    return createAccount({
      account: {
        serverUrl: this.serverUrl,
        credentials: this.credentials,
        ...account2,
        accountType
      },
      headers: { ...this.authHeaders, ...headers },
      loadCollections,
      loadObjects,
      fetchOptions: fetchOptions !== null && fetchOptions !== void 0 ? fetchOptions : this.fetchOptions,
      fetch: fetch3 !== null && fetch3 !== void 0 ? fetch3 : this.fetchOverride
    });
  }
  async collectionQuery(...params) {
    return defaultParam(collectionQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async makeCollection(...params) {
    return defaultParam(makeCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async syncCollection(...params) {
    return defaultParam(syncCollection, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async supportedReportSet(...params) {
    return defaultParam(supportedReportSet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async isCollectionDirty(...params) {
    return defaultParam(isCollectionDirty, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async smartCollectionSync(...params) {
    return defaultParam(smartCollectionSync, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
      account: this.account
    })(params[0]);
  }
  async smartCollectionSyncDetailed(param) {
    return defaultParam(smartCollectionSyncDetailed, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride,
      account: this.account
    })(param);
  }
  async calendarQuery(...params) {
    return defaultParam(calendarQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async makeCalendar(...params) {
    return defaultParam(makeCalendar, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async calendarMultiGet(...params) {
    return defaultParam(calendarMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async fetchCalendars(...params) {
    return defaultParam(fetchCalendars, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params === null || params === void 0 ? void 0 : params[0]);
  }
  async fetchCalendarUserAddresses(...params) {
    return defaultParam(fetchCalendarUserAddresses, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params === null || params === void 0 ? void 0 : params[0]);
  }
  async fetchCalendarObjects(...params) {
    return defaultParam(fetchCalendarObjects, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async createCalendarObject(...params) {
    return defaultParam(createCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async updateCalendarObject(...params) {
    return defaultParam(updateCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async deleteCalendarObject(...params) {
    return defaultParam(deleteCalendarObject, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async syncCalendars(...params) {
    return defaultParam(syncCalendars, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async syncCalendarsDetailed(...params) {
    return defaultParam(syncCalendarsDetailed, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async addressBookQuery(...params) {
    return defaultParam(addressBookQuery, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async addressBookMultiGet(...params) {
    return defaultParam(addressBookMultiGet, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async fetchAddressBooks(...params) {
    return defaultParam(fetchAddressBooks, {
      headers: this.authHeaders,
      account: this.account,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params === null || params === void 0 ? void 0 : params[0]);
  }
  async fetchVCards(...params) {
    return defaultParam(fetchVCards, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async createVCard(...params) {
    return defaultParam(createVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async updateVCard(...params) {
    return defaultParam(updateVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
  async deleteVCard(...params) {
    return defaultParam(deleteVCard, {
      headers: this.authHeaders,
      fetchOptions: this.fetchOptions,
      fetch: this.fetchOverride
    })(params[0]);
  }
};
var client = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  DAVClient,
  createDAVClient
});
var index = {
  DAVNamespace,
  DAVNamespaceShort,
  DAVAttributeMap,
  ...client,
  ...request,
  ...collection,
  ...account,
  ...addressBook,
  ...calendar,
  ...authHelpers,
  ...requestHelpers
};

// plugins-pack/_shared/ssrf-lite.ts
import net from "net";
var BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "instance-data"
]);
function isAlwaysBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:")) return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  }
  return false;
}
function isPrivateLanIp(ip) {
  if (!net.isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}
function blockPrivateLanUrls() {
  const v = process.env.SELFDASHBOARD_BLOCK_PRIVATE_CALENDAR_URLS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
var UnsafeOutboundUrlError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsafeOutboundUrlError";
  }
};
function assertSafeOutboundUrl(urlStr) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new UnsafeOutboundUrlError("invalid_url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new UnsafeOutboundUrlError("unsupported_protocol");
  }
  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host) throw new UnsafeOutboundUrlError("missing_host");
  if (BLOCKED_HOSTNAMES.has(host)) throw new UnsafeOutboundUrlError("blocked_host");
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeOutboundUrlError("blocked_host");
  }
  const ipVersion = net.isIP(host);
  if (ipVersion) {
    if (isAlwaysBlockedIp(host)) throw new UnsafeOutboundUrlError("blocked_ip");
    if (blockPrivateLanUrls() && isPrivateLanIp(host)) {
      throw new UnsafeOutboundUrlError("private_ip_blocked");
    }
    return;
  }
  if (host.endsWith(".localhost")) throw new UnsafeOutboundUrlError("blocked_host");
}

// plugins-pack/tasks/lib/caldav-privileges.ts
function heuristicCalendarReadOnly(name, url) {
  const n = name.toLowerCase().trim();
  const u = url.toLowerCase();
  const blob = `${n} ${u}`;
  if (/feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) return true;
  return false;
}
async function caldavHasWritePrivilege(client2, calendarUrl) {
  try {
    const responses = await client2.propfind({
      url: calendarUrl,
      props: { "current-user-privilege-set": { privilege: {} } },
      depth: "0"
    });
    const match = responses.find((r) => r.href && (r.href === calendarUrl || calendarUrl.startsWith(r.href))) ?? responses[0];
    const props = match?.props;
    if (!props) return true;
    const blob = JSON.stringify(props).toLowerCase();
    if (/write-content|write-properties|write|\bbind\b/.test(blob)) return true;
    if (/\bread\b/.test(blob) && !/write/.test(blob)) return false;
    return true;
  } catch {
    return true;
  }
}
async function resolveCalendarReadOnly(client2, name, url) {
  if (heuristicCalendarReadOnly(name, url)) return true;
  return !await caldavHasWritePrivilege(client2, url);
}
function formatCalDavPushError(listName, uid, msg) {
  if (msg.includes("403")) {
    return `Liste \u201E${listName}\u201C: kein Schreibzugriff (HTTP 403).`;
  }
  return `${listName}: ${msg}`;
}

// plugins-pack/tasks/lib/caldav-url.ts
function caldavObjectFilename(uid) {
  const stem = uid.includes("@") ? uid.split("@")[0] : uid;
  return `${stem.replace(/[^a-zA-Z0-9-]/g, "_")}.ics`;
}
function joinCollectionUrl(collectionUrl, filename) {
  const base = collectionUrl.endsWith("/") ? collectionUrl : `${collectionUrl}/`;
  return new URL(filename, base).href;
}
function normalizeCaldavServerUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (parts.length && /^calendars?$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    u.pathname = `${parts.length ? `/${parts.join("/")}` : ""}/`;
    assertSafeOutboundUrl(u.href);
    return u.href;
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}

// plugins-pack/tasks/lib/caldav.ts
var emptyResult3 = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function mergeResult(a, b) {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    deleted: a.deleted + b.deleted,
    conflicts: a.conflicts + b.conflicts,
    errors: [...a.errors, ...b.errors]
  };
}
function decryptPassword(encrypted) {
  try {
    return decrypt(encrypted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Passwort kann nicht entschl\xFCsselt werden \u2014 Konto bearbeiten und Passwort erneut speichern. (${msg})`
    );
  }
}
async function buildClient(account2) {
  if (!isCalDavConfig(account2.config)) throw new Error("not a caldav account");
  const cfg3 = account2.config;
  const password = decryptPassword(cfg3.passwordEncrypted);
  const serverUrl = normalizeCaldavServerUrl(cfg3.url);
  try {
    assertSafeOutboundUrl(serverUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`CalDAV URL blocked: ${msg}`);
  }
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg3.username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav"
  });
}
function caldavDisplayName(cal) {
  const dn = cal.displayName;
  if (typeof dn === "string" && dn.trim()) return dn.trim();
  if (dn && typeof dn === "object" && "value" in dn && typeof dn.value === "string") {
    return String(dn.value).trim();
  }
  try {
    const seg = new URL(cal.url).pathname.split("/").filter(Boolean).pop();
    if (seg) return seg;
  } catch {
  }
  return cal.url;
}
function looksLikeTaskList(cal, name) {
  const blob = JSON.stringify(cal).toUpperCase();
  if (blob.includes("VTODO") && !blob.includes("VEVENT")) return true;
  const n = name.toLowerCase();
  if (/task|aufgabe|todo|inbox|erledigt|completed|liste/.test(n)) return true;
  return false;
}
async function discoverCaldavTaskLists(account2) {
  const client2 = await buildClient(account2);
  const calendars = await client2.fetchCalendars();
  const out = [];
  for (const c of calendars) {
    const name = caldavDisplayName(c);
    if (!looksLikeTaskList(c, name)) continue;
    const readOnly = await resolveCalendarReadOnly(client2, name, c.url);
    out.push({ remoteId: c.url, name, readOnly });
  }
  return out;
}
async function getCaldavClientCache(account2) {
  const client2 = await buildClient(account2);
  const davCalendars = await client2.fetchCalendars();
  return { client: client2, davCalendars };
}
async function testCaldav(account2) {
  try {
    const lists = await discoverTaskLists(account2);
    return { ok: true, listCount: lists.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
async function syncTaskList(account2, list, store, cache, pushOnly = false) {
  const client2 = cache?.client ?? await buildClient(account2);
  const davCalendars = cache?.davCalendars ?? await client2.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === list.remoteId);
  if (!davCal) {
    return { ...emptyResult3(), errors: [`remote list not found: ${list.remoteId}`] };
  }
  const pull = pushOnly ? emptyResult3() : await pullList(client2, davCal, list, store);
  if (list.readOnly) return pull;
  const push = await pushList(client2, davCal, list, store);
  return mergeResult(pull, push);
}
async function pullList(client2, davCal, list, store) {
  const result = emptyResult3();
  let objects;
  try {
    const fetched = await client2.fetchCalendarObjects({ calendar: davCal });
    objects = fetched.map((o) => ({ url: o.url, etag: o.etag ?? "", data: o.data ?? "" }));
  } catch (e) {
    result.errors.push(`fetch: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }
  for (const obj of objects) {
    const parsed = parseVcalendarTodos(obj.data);
    if (!parsed.length) continue;
    const remote = parsed[0];
    const localIdx = store.tasks.findIndex((t) => t.listId === list.id && t.uid === remote.uid);
    if (localIdx === -1) {
      store.tasks.push({
        id: `tsk_${remote.uid}`,
        listId: list.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary || "\u2014",
        completed: remote.completed,
        due: remote.due,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.tasks[localIdx];
    if (local.syncState === "local_modified" || local.syncState === "local_deleted") {
      if (local.remoteEtag !== obj.etag) {
        local.syncState = "conflict";
        local.conflictRemoteIcal = obj.data;
        local.remoteHref = obj.url;
        local.remoteEtag = obj.etag;
        local.remoteModifiedAt = remote.remoteModifiedIso;
        result.conflicts++;
      }
      continue;
    }
    if (local.remoteEtag !== obj.etag) {
      Object.assign(local, {
        icalData: obj.data,
        summary: remote.summary || local.summary,
        completed: remote.completed,
        due: remote.due,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.updated++;
    }
  }
  return result;
}
async function pushList(client2, davCal, list, store) {
  const result = emptyResult3();
  const pending2 = store.tasks.filter(
    (t) => t.listId === list.id && (t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted")
  );
  for (const task of pending2) {
    try {
      if (task.syncState === "local_deleted") {
        if (task.remoteHref) {
          await client2.deleteCalendarObject({
            calendarObject: { url: task.remoteHref, etag: task.remoteEtag ?? "", data: "" }
          });
        }
        const idx = store.tasks.findIndex((t) => t.id === task.id);
        if (idx >= 0) store.tasks.splice(idx, 1);
        result.deleted++;
        continue;
      }
      const ical = buildVtodo({
        uid: task.uid,
        summary: task.summary,
        completed: task.completed,
        due: task.due,
        lastModifiedIso: task.localModifiedAt
      });
      if (task.syncState === "local_new") {
        const filename = caldavObjectFilename(task.uid);
        const res = await client2.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename
        });
        task.icalData = ical;
        task.remoteHref = res?.url ?? joinCollectionUrl(davCal.url, filename);
        task.remoteEtag = res?.etag ?? "";
        task.syncState = "synced";
        result.added++;
      } else if (task.syncState === "local_modified") {
        await client2.updateCalendarObject({
          calendarObject: {
            url: task.remoteHref,
            etag: task.remoteEtag ?? "",
            data: ical
          }
        });
        task.icalData = ical;
        task.syncState = "synced";
        result.updated++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("412")) {
        task.syncState = "conflict";
        result.conflicts++;
      } else {
        result.errors.push(formatCalDavPushError(list.name, task.uid, msg));
      }
    }
  }
  return result;
}

// plugins-pack/tasks/lib/sync.ts
var DEFAULT_INTERVAL_MS = parseInt(process.env.TASKS_SYNC_INTERVAL_SECONDS ?? process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? "300", 10) * 1e3;
var schedulerStarted = false;
var schedulerTimer = null;
async function discoverAccountLists(account2) {
  if (account2.provider === "google") return discoverGoogleTaskLists(account2);
  if (account2.provider === "microsoft") return discoverMicrosoftTaskLists(account2);
  return discoverCaldavTaskLists(account2);
}
async function testAccount(account2) {
  if (account2.provider === "google") return testGoogleAccount(account2);
  if (account2.provider === "microsoft") return testMicrosoftAccount(account2);
  return testCaldav(account2);
}
async function syncAfterMutation(accountId, opts) {
  const log = await runSync(accountId, { listIds: opts?.listIds, skipDiscover: true, pushOnly: true });
  return log.error ?? void 0;
}
async function listEnabledAccounts() {
  const out = [];
  for (const ownerUserId of listTasksOwnerUserIds()) {
    const store = await readUserStore(ownerUserId);
    for (const account2 of store.accounts) {
      if (account2.enabled) out.push({ ownerUserId, account: account2 });
    }
  }
  return out;
}
async function runSync(accountId, opts) {
  const ownerUserId = await findAccountOwnerUserId(accountId);
  if (!ownerUserId) {
    return makeLogEntry(accountId, "not found", { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  const store = await readUserStore(ownerUserId);
  const account2 = store.accounts.find((a) => a.id === accountId);
  if (!account2 || !account2.enabled) {
    return makeLogEntry(accountId, "disabled or not found", { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  if (isOAuthProvider(account2.provider) && !("refreshTokenEncrypted" in account2.config && account2.config.refreshTokenEncrypted)) {
    const label = account2.provider === "microsoft" ? "Microsoft" : "Google";
    return makeLogEntry(accountId, `${label} nicht verbunden`, { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalConflicts = 0;
  const errors = [];
  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountLists(account2);
      const discoveredIds = new Set(discovered.map((d) => d.remoteId));
      await mutateUserStore(ownerUserId, (s) => {
        for (const d of discovered) {
          let list = s.lists.find((l) => l.accountId === account2.id && l.remoteId === d.remoteId);
          if (!list) {
            list = {
              id: newId("lst"),
              accountId: account2.id,
              remoteId: d.remoteId,
              name: d.name,
              readOnly: d.readOnly,
              visible: true
            };
            s.lists.push(list);
          } else {
            list.name = d.name;
            list.readOnly = d.readOnly;
          }
        }
        const staleIds = new Set(
          s.lists.filter((l) => l.accountId === account2.id && !discoveredIds.has(l.remoteId)).map((l) => l.id)
        );
        if (staleIds.size) {
          s.lists = s.lists.filter((l) => !staleIds.has(l.id));
          s.tasks = s.tasks.filter((t) => !staleIds.has(t.listId));
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`discover: ${msg}`);
      void logPluginApiFailure("tasks", "discover", msg, { accountId });
      const log2 = makeLogEntry(accountId, msg, { added: 0, updated: 0, deleted: 0, conflicts: 0 });
      await mutateUserStore(ownerUserId, (s) => {
        s.syncLog.unshift(log2);
        s.syncLog = s.syncLog.slice(0, 50);
        const acc = s.accounts.find((a) => a.id === accountId);
        if (acc) {
          acc.lastSyncAt = nowIso();
          acc.lastSyncStatus = "error";
          acc.lastSyncError = msg;
        }
      });
      return log2;
    }
  }
  let lists = (await readUserStore(ownerUserId)).lists.filter((l) => l.accountId === account2.id);
  if (opts?.listIds?.length) {
    const want = new Set(opts.listIds);
    lists = lists.filter((l) => want.has(l.id));
  }
  let caldavCache;
  if (account2.provider === "caldav" && lists.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account2);
    } catch (e) {
      errors.push(`client: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const list of lists) {
    try {
      await mutateUserStore(ownerUserId, async (s) => {
        const live = s.lists.find((l) => l.id === list.id);
        const r = account2.provider === "google" ? await syncGoogleTaskList(account2, live, s, opts?.pushOnly) : account2.provider === "microsoft" ? await syncMicrosoftTaskList(account2, live, s, opts?.pushOnly) : await syncTaskList(account2, live, s, caldavCache, opts?.pushOnly);
        totalAdded += r.added;
        totalUpdated += r.updated;
        totalDeleted += r.deleted;
        totalConflicts += r.conflicts;
        errors.push(...r.errors);
      });
    } catch (e) {
      errors.push(`${list.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const status = errors.length ? "error" : totalConflicts ? "conflict" : "ok";
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join("; ") : void 0,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts }
  );
  await mutateUserStore(ownerUserId, (s) => {
    s.syncLog.unshift(log);
    s.syncLog = s.syncLog.slice(0, 50);
    const acc = s.accounts.find((a) => a.id === accountId);
    if (acc) {
      acc.lastSyncAt = nowIso();
      acc.lastSyncStatus = status;
      acc.lastSyncError = errors.length ? errors.join("; ") : void 0;
    }
  });
  if (errors.length) {
    void logPluginApiFailure("tasks", "sync", errors.join("; "), { accountId });
  }
  return log;
}
function makeLogEntry(accountId, error, counts) {
  return {
    id: newId("log"),
    accountId,
    startedAt: nowIso(),
    finishedAt: nowIso(),
    ...counts,
    error
  };
}
function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const tick = async () => {
    try {
      for (const { account: account2 } of await listEnabledAccounts()) {
        if (account2.lastSyncAt && Date.now() - new Date(account2.lastSyncAt).getTime() < DEFAULT_INTERVAL_MS / 2) {
          continue;
        }
        try {
          await runSync(account2.id);
        } catch {
        }
      }
    } catch {
    }
    schedulerTimer = setTimeout(tick, DEFAULT_INTERVAL_MS);
  };
  schedulerTimer = setTimeout(tick, 8e3);
}
function stopScheduler() {
  if (schedulerTimer) clearTimeout(schedulerTimer);
  schedulerStarted = false;
  schedulerTimer = null;
}

// plugins-pack/_shared/auth-lite.ts
import { mkdirSync as mkdirSync2 } from "fs";
import { join as join4 } from "path";
import Database from "better-sqlite3";

// plugins-pack/_shared/data-dir.ts
import { join as join3 } from "path";
function dataDir() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join3(process.cwd(), "data");
}

// plugins-pack/_shared/auth-lite.ts
var db = null;
function authDbPath() {
  return join4(dataDir(), "auth", "auth.db");
}
function getAuthDb() {
  if (db) return db;
  const dir = join4(dataDir(), "auth");
  mkdirSync2(dir, { recursive: true });
  db = new Database(authDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
function countUsers() {
  const row = getAuthDb().prepare("SELECT COUNT(*) AS c FROM users").get();
  return row.c;
}
function needsSetup() {
  return countUsers() === 0;
}
function getUserById(id) {
  const row = getAuthDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? rowToUser(row) : null;
}
function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at
  };
}
function isAuthDisabled() {
  if (process.env.NODE_ENV === "production") return false;
  const v = process.env.SELFDASHBOARD_AUTH_DISABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

// plugins-pack/_shared/auth-guard-lite.ts
var AUTH_COOKIE = "sd_session";
function readSessionIdFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey?.trim() === AUTH_COOKIE) {
      const val = rest.join("=").trim();
      if (/^[a-f0-9]{64}$/.test(val)) return val;
      return null;
    }
  }
  return null;
}
function purgeExpiredSessions() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  getAuthDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}
function getSession(sessionId) {
  purgeExpiredSessions();
  const row = getAuthDb().prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId);
  if (!row) return null;
  if (row.expires_at <= (/* @__PURE__ */ new Date()).toISOString()) {
    getAuthDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  const user = getUserById(row.user_id);
  if (!user) {
    getAuthDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return {
    id: row.id,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: row.expires_at,
    mfaVerified: row.mfa_verified !== 0
  };
}
function getSessionFromRequest(req) {
  if (isAuthDisabled()) {
    return {
      id: "dev",
      userId: "dev",
      username: "dev",
      role: "admin",
      expiresAt: new Date(Date.now() + 864e5).toISOString(),
      mfaVerified: true
    };
  }
  if (needsSetup()) return null;
  const sessionId = readSessionIdFromCookieHeader(req.headers.get("cookie"));
  if (!sessionId) return null;
  return getSession(sessionId);
}

// plugins-pack/tasks/lib/viewer.ts
function resolveTasksViewer(req) {
  const session = getSessionFromRequest(req);
  if (session) {
    return { userId: session.userId, role: session.role };
  }
  const hdr = req.headers.get("x-sd-user-id")?.trim();
  if (hdr) {
    const role = req.headers.get("x-sd-role")?.trim() ?? "user";
    return { userId: hdr, role: role === "admin" ? "admin" : "user" };
  }
  return null;
}

// plugins-pack/tasks/server.ts
async function loadStore(viewer) {
  return readUserStore(viewer.userId);
}
async function handleSummaryGet(viewer) {
  const store = await loadStore(viewer);
  return ok(buildSummary(store));
}
async function handleStatusGet(viewer) {
  const store = await loadStore(viewer);
  const pending2 = store.tasks.filter(
    (t) => t.syncState === "local_new" || t.syncState === "local_modified" || t.syncState === "local_deleted"
  ).length;
  return ok({
    accounts: store.accounts.map((a) => toAccountView(a, store.lists)),
    lists: store.lists.map((l) => ({
      id: l.id,
      accountId: l.accountId,
      name: l.name,
      visible: l.visible,
      readOnly: l.readOnly
    })),
    pendingChanges: pending2,
    recentRuns: store.syncLog.slice(0, 10)
  });
}
async function handleAccountsGet(viewer) {
  const store = await loadStore(viewer);
  return ok(store.accounts.map((a) => toAccountView(a, store.lists)));
}
async function handleAccountsPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.name) return badRequest("name required");
  let accountId = "";
  try {
    const account2 = buildAccount(body, viewer.userId);
    accountId = account2.id;
    await mutateUserStore(viewer.userId, (s) => {
      s.accounts.push(account2);
    });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "invalid body");
  }
  const createdAccount = (await readUserStore(viewer.userId)).accounts.find((a) => a.id === accountId);
  if (createdAccount && !isOAuthProvider(createdAccount.provider)) {
    runSync(accountId).catch(() => void 0);
  }
  const store = await readUserStore(viewer.userId);
  const created = store.accounts.find((a) => a.id === accountId);
  return ok(toAccountView(created, store.lists));
}
async function handleAccountPut(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateUserStore(viewer.userId, (s) => {
    const a = s.accounts.find((x) => x.id === id);
    if (!a) return;
    found = true;
    applyAccountUpdate(a, body);
  });
  if (!found) return notFound("account not found");
  runSync(id).catch(() => void 0);
  const store = await readUserStore(viewer.userId);
  const acc = store.accounts.find((a) => a.id === id);
  return ok(toAccountView(acc, store.lists));
}
async function handleAccountDelete(id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  await mutateUserStore(viewer.userId, (s) => {
    s.accounts = s.accounts.filter((a) => a.id !== id);
    const listIds = new Set(s.lists.filter((l) => l.accountId === id).map((l) => l.id));
    s.lists = s.lists.filter((l) => l.accountId !== id);
    s.tasks = s.tasks.filter((t) => !listIds.has(t.listId));
  });
  return ok({ ok: true });
}
async function handleAccountSyncPost(id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const log = await runSync(id);
  return ok(log);
}
async function handleAccountTestPost(id, viewer) {
  const store = await loadStore(viewer);
  const account2 = store.accounts.find((a) => a.id === id);
  if (!account2) return notFound("account not found");
  const result = await testAccount(account2);
  return ok(result);
}
async function handleListsGet(viewer) {
  const store = await loadStore(viewer);
  return ok(store.lists);
}
async function handleListPut(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateUserStore(viewer.userId, (s) => {
    const l = s.lists.find((x) => x.id === id);
    if (!l) return;
    found = true;
    if (typeof body.visible === "boolean") l.visible = body.visible;
  });
  if (!found) return notFound("list not found");
  const store = await loadStore(viewer);
  return ok(store.lists.find((l) => l.id === id));
}
async function handleTasksGet(req, viewer) {
  const store = await loadStore(viewer);
  const url = new URL(req.url);
  const listId = url.searchParams.get("listId")?.trim();
  const showCompleted = url.searchParams.get("showCompleted") === "1";
  let tasks = store.tasks.filter((t) => t.syncState !== "local_deleted");
  if (listId) tasks = tasks.filter((t) => t.listId === listId);
  else {
    const visible = new Set(store.lists.filter((l) => l.visible).map((l) => l.id));
    tasks = tasks.filter((t) => visible.has(t.listId));
  }
  if (!showCompleted) tasks = tasks.filter((t) => !t.completed);
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.summary.localeCompare(b.summary, void 0, { sensitivity: "base" });
  });
  return ok(
    tasks.map((t) => taskToView(t, store.lists.find((l) => l.id === t.listId)))
  );
}
async function handleTasksPost(req, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body.listId || !body.summary?.trim()) return badRequest("listId and summary required");
  const store = await loadStore(viewer);
  const list = store.lists.find((l) => l.id === body.listId);
  if (!list) return notFound("list not found");
  if (list.readOnly) return forbidden("list is read-only");
  const account2 = store.accounts.find((a) => a.id === list.accountId);
  const useCalDav = account2?.provider === "caldav";
  const uid = newUid();
  const now = nowIso();
  const ical = useCalDav ? buildVtodo({ uid, summary: body.summary.trim(), completed: false, due: body.due, lastModifiedIso: now }) : "";
  let createdId = "";
  await mutateUserStore(viewer.userId, (s) => {
    const liveList = s.lists.find((l) => l.id === body.listId);
    if (!liveList || liveList.readOnly) return;
    createdId = newId("tsk");
    s.tasks.push({
      id: createdId,
      listId: body.listId,
      uid,
      icalData: ical,
      summary: body.summary.trim(),
      completed: false,
      due: body.due,
      localModifiedAt: now,
      syncState: "local_new"
    });
  });
  if (!createdId) return forbidden("cannot create task");
  if (account2) {
    const syncError = await syncAfterMutation(account2.id, { listIds: [list.id] });
    const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId);
    return ok({ ...taskToView(updated, list), syncError });
  }
  const task = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === createdId);
  return ok(taskToView(task, list));
}
async function handleTaskPut(req, id, viewer) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  const store = await loadStore(viewer);
  const existing = store.tasks.find((t) => t.id === id);
  if (!existing) return notFound("task not found");
  const list = store.lists.find((l) => l.id === existing.listId);
  if (!list || list.readOnly) return forbidden("list is read-only");
  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    if (body.summary !== void 0) t.summary = body.summary.trim() || t.summary;
    if (typeof body.completed === "boolean") t.completed = body.completed;
    if (body.due === null) t.due = void 0;
    else if (body.due !== void 0) t.due = body.due;
    t.localModifiedAt = nowIso();
    if (t.syncState === "synced") t.syncState = "local_modified";
  });
  const account2 = store.accounts.find((a) => a.id === list.accountId);
  if (account2) {
    const syncError = await syncAfterMutation(account2.id, { listIds: [list.id] });
    const updated2 = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id);
    return ok({ ...taskToView(updated2, list), syncError });
  }
  const updated = (await readUserStore(viewer.userId)).tasks.find((t) => t.id === id);
  return ok(taskToView(updated, list));
}
async function handleTaskDelete(id, viewer) {
  const store = await loadStore(viewer);
  const existing = store.tasks.find((t) => t.id === id);
  if (!existing) return notFound("task not found");
  const list = store.lists.find((l) => l.id === existing.listId);
  if (!list || list.readOnly) return forbidden("list is read-only");
  await mutateUserStore(viewer.userId, (s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    if (t.syncState === "local_new") {
      s.tasks = s.tasks.filter((x) => x.id !== id);
    } else {
      t.syncState = "local_deleted";
      t.localModifiedAt = nowIso();
    }
  });
  const account2 = store.accounts.find((a) => a.id === list.accountId);
  if (account2) await syncAfterMutation(account2.id, { listIds: [list.id] });
  return ok({ ok: true });
}
async function handleGoogleAuthUrlPost(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const store = await loadStore(viewer);
  const account2 = store.accounts.find((a) => a.id === id);
  if (!account2 || account2.provider !== "google") return badRequest("not a google account");
  const state = createOAuthState(viewer.userId, id);
  const url = buildGoogleAuthUrl(req, account2, state);
  return ok({ url });
}
async function handleGoogleCallbackGet(req) {
  const viewer = resolveTasksViewer(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const err = url.searchParams.get("error")?.trim();
  const failHtml = (msg) => html(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`
  );
  if (err) return failHtml(`Google: ${err}`);
  if (!code || !state) return failHtml("OAuth fehlgeschlagen \u2014 code/state fehlt");
  if (!viewer) return failHtml("Nicht angemeldet \u2014 zuerst im Dashboard einloggen");
  const pending2 = consumeOAuthState(state);
  if (!pending2 || pending2.userId !== viewer.userId) return failHtml("OAuth-State ung\xFCltig oder abgelaufen");
  const store = await readUserStore(viewer.userId);
  const account2 = store.accounts.find((a) => a.id === pending2.accountId);
  if (!account2 || account2.provider !== "google") return failHtml("Konto nicht gefunden");
  try {
    const redirectUri = googleRedirectUri(req);
    const tokens = await exchangeGoogleCode(account2, code, redirectUri);
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending2.accountId);
      if (!acc || acc.provider !== "google") return;
      applyGoogleTokens(acc, tokens);
    });
    runSync(pending2.accountId).catch(() => void 0);
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Google Tasks verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-google-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return failHtml(msg);
  }
}
async function handleMicrosoftAuthUrlPost(req, id, viewer) {
  const owner = await findAccountOwnerUserId(id);
  if (!owner || owner !== viewer.userId) return forbidden("not allowed");
  const store = await loadStore(viewer);
  const account2 = store.accounts.find((a) => a.id === id);
  if (!account2 || account2.provider !== "microsoft") return badRequest("not a microsoft account");
  const state = createOAuthState(viewer.userId, id);
  const url = buildMicrosoftAuthUrl(req, account2, state);
  return ok({ url });
}
async function handleMicrosoftCallbackGet(req) {
  const viewer = resolveTasksViewer(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const err = url.searchParams.get("error")?.trim();
  const errDesc = url.searchParams.get("error_description")?.trim();
  const failHtml = (msg) => html(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>${msg}</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:false,error:${JSON.stringify(msg)}},'*')}catch(e){};setTimeout(()=>window.close(),3000);</script></body></html>`
  );
  if (err) return failHtml(`Microsoft: ${errDesc || err}`);
  if (!code || !state) return failHtml("OAuth fehlgeschlagen \u2014 code/state fehlt");
  if (!viewer) return failHtml("Nicht angemeldet \u2014 zuerst im Dashboard einloggen");
  const pending2 = consumeOAuthState(state);
  if (!pending2 || pending2.userId !== viewer.userId) return failHtml("OAuth-State ung\xFCltig oder abgelaufen");
  const store = await readUserStore(viewer.userId);
  const account2 = store.accounts.find((a) => a.id === pending2.accountId);
  if (!account2 || account2.provider !== "microsoft") return failHtml("Konto nicht gefunden");
  try {
    const redirectUri = microsoftRedirectUri(req);
    const tokens = await exchangeMicrosoftCode(account2, code, redirectUri);
    await mutateUserStore(viewer.userId, (s) => {
      const acc = s.accounts.find((a) => a.id === pending2.accountId);
      if (!acc || acc.provider !== "microsoft") return;
      applyMicrosoftTokens(acc, tokens);
    });
    runSync(pending2.accountId).catch(() => void 0);
    return html(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px"><p>Microsoft To Do verbunden.</p><script>try{window.opener?.postMessage({type:'tasks-microsoft-oauth',ok:true},'*')}catch(e){};window.close();</script></body></html>`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return failHtml(msg);
  }
}
async function tasksServerHandler(ctx) {
  const method = ctx.request.method.toUpperCase();
  const path = ctx.path;
  const [a, b, c] = path;
  if (a === "google" && b === "callback" && path.length === 2 && method === "GET") {
    return handleGoogleCallbackGet(ctx.request);
  }
  if (a === "microsoft" && b === "callback" && path.length === 2 && method === "GET") {
    return handleMicrosoftCallbackGet(ctx.request);
  }
  const viewer = resolveTasksViewer(ctx.request);
  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (a === "summary" && method === "GET" && path.length === 1) return handleSummaryGet(viewer);
  if (a === "status" && method === "GET" && path.length === 1) return handleStatusGet(viewer);
  if (a === "accounts" && path.length === 1) {
    if (method === "GET") return handleAccountsGet(viewer);
    if (method === "POST") return handleAccountsPost(ctx.request, viewer);
  }
  if (a === "accounts" && b && path.length === 2) {
    if (method === "PUT") return handleAccountPut(ctx.request, b, viewer);
    if (method === "DELETE") return handleAccountDelete(b, viewer);
  }
  if (a === "accounts" && b && c === "sync" && path.length === 3 && method === "POST") {
    return handleAccountSyncPost(b, viewer);
  }
  if (a === "accounts" && b && c === "test" && path.length === 3 && method === "POST") {
    return handleAccountTestPost(b, viewer);
  }
  if (a === "accounts" && b && c === "google" && path[3] === "auth-url" && path.length === 4 && method === "POST") {
    return handleGoogleAuthUrlPost(ctx.request, b, viewer);
  }
  if (a === "accounts" && b && c === "microsoft" && path[3] === "auth-url" && path.length === 4 && method === "POST") {
    return handleMicrosoftAuthUrlPost(ctx.request, b, viewer);
  }
  if (a === "lists" && path.length === 1 && method === "GET") return handleListsGet(viewer);
  if (a === "lists" && b && path.length === 2 && method === "PUT") return handleListPut(ctx.request, b, viewer);
  if (a === "tasks" && path.length === 1) {
    if (method === "GET") return handleTasksGet(ctx.request, viewer);
    if (method === "POST") return handleTasksPost(ctx.request, viewer);
  }
  if (a === "tasks" && b && path.length === 2) {
    if (method === "PUT") return handleTaskPut(ctx.request, b, viewer);
    if (method === "DELETE") return handleTaskDelete(b, viewer);
  }
  return Response.json({ error: "not_found", pluginId: ctx.pluginId, path: path.join("/") }, { status: 404 });
}
var server_default = tasksServerHandler;
export {
  server_default as default,
  startScheduler,
  stopScheduler,
  tasksServerHandler
};
/*! Bundled license information:

sax/lib/sax.js:
  (*! http://mths.be/fromcodepoint v0.1.0 by @mathias *)

base-64/base64.js:
  (*! https://mths.be/base64 v1.0.0 by @mathias | MIT license *)
*/
