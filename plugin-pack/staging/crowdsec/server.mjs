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

// node_modules/better-sqlite3/lib/util.js
var require_util = __commonJS({
  "node_modules/better-sqlite3/lib/util.js"(exports) {
    "use strict";
    exports.getBooleanOption = (options, key) => {
      let value = false;
      if (key in options && typeof (value = options[key]) !== "boolean") {
        throw new TypeError(`Expected the "${key}" option to be a boolean`);
      }
      return value;
    };
    exports.cppdb = Symbol();
    exports.inspect = Symbol.for("nodejs.util.inspect.custom");
  }
});

// node_modules/better-sqlite3/lib/sqlite-error.js
var require_sqlite_error = __commonJS({
  "node_modules/better-sqlite3/lib/sqlite-error.js"(exports, module) {
    "use strict";
    var descriptor = { value: "SqliteError", writable: true, enumerable: false, configurable: true };
    function SqliteError(message, code) {
      if (new.target !== SqliteError) {
        return new SqliteError(message, code);
      }
      if (typeof code !== "string") {
        throw new TypeError("Expected second argument to be a string");
      }
      Error.call(this, message);
      descriptor.value = "" + message;
      Object.defineProperty(this, "message", descriptor);
      Error.captureStackTrace(this, SqliteError);
      this.code = code;
    }
    Object.setPrototypeOf(SqliteError, Error);
    Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
    Object.defineProperty(SqliteError.prototype, "name", descriptor);
    module.exports = SqliteError;
  }
});

// node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS({
  "node_modules/file-uri-to-path/index.js"(exports, module) {
    var sep = __require("path").sep || "/";
    module.exports = fileUriToPath;
    function fileUriToPath(uri) {
      if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
        throw new TypeError("must pass in a file:// URI to convert to a file path");
      }
      var rest = decodeURI(uri.substring(7));
      var firstSlash = rest.indexOf("/");
      var host = rest.substring(0, firstSlash);
      var path3 = rest.substring(firstSlash + 1);
      if ("localhost" == host) host = "";
      if (host) {
        host = sep + sep + host;
      }
      path3 = path3.replace(/^(.+)\|/, "$1:");
      if (sep == "\\") {
        path3 = path3.replace(/\//g, "\\");
      }
      if (/^.+\:/.test(path3)) {
      } else {
        path3 = sep + path3;
      }
      return host + path3;
    }
  }
});

// node_modules/bindings/bindings.js
var require_bindings = __commonJS({
  "node_modules/bindings/bindings.js"(exports, module) {
    var fs3 = __require("fs");
    var path3 = __require("path");
    var fileURLToPath = require_file_uri_to_path();
    var join = path3.join;
    var dirname = path3.dirname;
    var exists = fs3.accessSync && function(path4) {
      try {
        fs3.accessSync(path4);
      } catch (e) {
        return false;
      }
      return true;
    } || fs3.existsSync || path3.existsSync;
    var defaults = {
      arrow: process.env.NODE_BINDINGS_ARROW || " \u2192 ",
      compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
      platform: process.platform,
      arch: process.arch,
      nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
      version: process.versions.node,
      bindings: "bindings.node",
      try: [
        // node-gyp's linked version in the "build" dir
        ["module_root", "build", "bindings"],
        // node-waf and gyp_addon (a.k.a node-gyp)
        ["module_root", "build", "Debug", "bindings"],
        ["module_root", "build", "Release", "bindings"],
        // Debug files, for development (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Debug", "bindings"],
        ["module_root", "Debug", "bindings"],
        // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Release", "bindings"],
        ["module_root", "Release", "bindings"],
        // Legacy from node-waf, node <= 0.4.x
        ["module_root", "build", "default", "bindings"],
        // Production "Release" buildtype binary (meh...)
        ["module_root", "compiled", "version", "platform", "arch", "bindings"],
        // node-qbs builds
        ["module_root", "addon-build", "release", "install-root", "bindings"],
        ["module_root", "addon-build", "debug", "install-root", "bindings"],
        ["module_root", "addon-build", "default", "install-root", "bindings"],
        // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
        ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
      ]
    };
    function bindings(opts) {
      if (typeof opts == "string") {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }
      Object.keys(defaults).map(function(i2) {
        if (!(i2 in opts)) opts[i2] = defaults[i2];
      });
      if (!opts.module_root) {
        opts.module_root = exports.getRoot(exports.getFileName());
      }
      if (path3.extname(opts.bindings) != ".node") {
        opts.bindings += ".node";
      }
      var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
      var tries = [], i = 0, l = opts.try.length, n, b, err;
      for (; i < l; i++) {
        n = join.apply(
          null,
          opts.try[i].map(function(p) {
            return opts[p] || p;
          })
        );
        tries.push(n);
        try {
          b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
          if (!opts.path) {
            b.path = n;
          }
          return b;
        } catch (e) {
          if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
            throw e;
          }
        }
      }
      err = new Error(
        "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
          return opts.arrow + a;
        }).join("\n")
      );
      err.tries = tries;
      throw err;
    }
    module.exports = exports = bindings;
    exports.getFileName = function getFileName(calling_file) {
      var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(e, st) {
        for (var i = 0, l = st.length; i < l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
              if (fileName !== calling_file) {
                return;
              }
            } else {
              return;
            }
          }
        }
      };
      Error.captureStackTrace(dummy);
      dummy.stack;
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;
      var fileSchema = "file://";
      if (fileName.indexOf(fileSchema) === 0) {
        fileName = fileURLToPath(fileName);
      }
      return fileName;
    };
    exports.getRoot = function getRoot(file) {
      var dir = dirname(file), prev;
      while (true) {
        if (dir === ".") {
          dir = process.cwd();
        }
        if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
          return dir;
        }
        if (prev === dir) {
          throw new Error(
            'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
          );
        }
        prev = dir;
        dir = join(dir, "..");
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/wrappers.js
var require_wrappers = __commonJS({
  "node_modules/better-sqlite3/lib/methods/wrappers.js"(exports) {
    "use strict";
    var { cppdb } = require_util();
    exports.prepare = function prepare(sql) {
      return this[cppdb].prepare(sql, this, false);
    };
    exports.exec = function exec(sql) {
      this[cppdb].exec(sql);
      return this;
    };
    exports.close = function close() {
      this[cppdb].close();
      return this;
    };
    exports.loadExtension = function loadExtension(...args) {
      this[cppdb].loadExtension(...args);
      return this;
    };
    exports.defaultSafeIntegers = function defaultSafeIntegers(...args) {
      this[cppdb].defaultSafeIntegers(...args);
      return this;
    };
    exports.unsafeMode = function unsafeMode(...args) {
      this[cppdb].unsafeMode(...args);
      return this;
    };
    exports.getters = {
      name: {
        get: function name() {
          return this[cppdb].name;
        },
        enumerable: true
      },
      open: {
        get: function open() {
          return this[cppdb].open;
        },
        enumerable: true
      },
      inTransaction: {
        get: function inTransaction() {
          return this[cppdb].inTransaction;
        },
        enumerable: true
      },
      readonly: {
        get: function readonly() {
          return this[cppdb].readonly;
        },
        enumerable: true
      },
      memory: {
        get: function memory() {
          return this[cppdb].memory;
        },
        enumerable: true
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/transaction.js
var require_transaction = __commonJS({
  "node_modules/better-sqlite3/lib/methods/transaction.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    var controllers = /* @__PURE__ */ new WeakMap();
    module.exports = function transaction(fn) {
      if (typeof fn !== "function") throw new TypeError("Expected first argument to be a function");
      const db = this[cppdb];
      const controller = getController(db, this);
      const { apply } = Function.prototype;
      const properties = {
        default: { value: wrapTransaction(apply, fn, db, controller.default) },
        deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
        immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
        exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
        database: { value: this, enumerable: true }
      };
      Object.defineProperties(properties.default.value, properties);
      Object.defineProperties(properties.deferred.value, properties);
      Object.defineProperties(properties.immediate.value, properties);
      Object.defineProperties(properties.exclusive.value, properties);
      return properties.default.value;
    };
    var getController = (db, self) => {
      let controller = controllers.get(db);
      if (!controller) {
        const shared = {
          commit: db.prepare("COMMIT", self, false),
          rollback: db.prepare("ROLLBACK", self, false),
          savepoint: db.prepare("SAVEPOINT `	_bs3.	`", self, false),
          release: db.prepare("RELEASE `	_bs3.	`", self, false),
          rollbackTo: db.prepare("ROLLBACK TO `	_bs3.	`", self, false)
        };
        controllers.set(db, controller = {
          default: Object.assign({ begin: db.prepare("BEGIN", self, false) }, shared),
          deferred: Object.assign({ begin: db.prepare("BEGIN DEFERRED", self, false) }, shared),
          immediate: Object.assign({ begin: db.prepare("BEGIN IMMEDIATE", self, false) }, shared),
          exclusive: Object.assign({ begin: db.prepare("BEGIN EXCLUSIVE", self, false) }, shared)
        });
      }
      return controller;
    };
    var wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
      let before, after, undo;
      if (db.inTransaction) {
        before = savepoint;
        after = release;
        undo = rollbackTo;
      } else {
        before = begin;
        after = commit;
        undo = rollback;
      }
      before.run();
      try {
        const result = apply.call(fn, this, arguments);
        if (result && typeof result.then === "function") {
          throw new TypeError("Transaction function cannot return a promise");
        }
        after.run();
        return result;
      } catch (ex) {
        if (db.inTransaction) {
          undo.run();
          if (undo !== rollback) after.run();
        }
        throw ex;
      }
    };
  }
});

// node_modules/better-sqlite3/lib/methods/pragma.js
var require_pragma = __commonJS({
  "node_modules/better-sqlite3/lib/methods/pragma.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function pragma(source, options) {
      if (options == null) options = {};
      if (typeof source !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      const simple = getBooleanOption(options, "simple");
      const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
      return simple ? stmt.pluck().get() : stmt.all();
    };
  }
});

// node_modules/better-sqlite3/lib/methods/backup.js
var require_backup = __commonJS({
  "node_modules/better-sqlite3/lib/methods/backup.js"(exports, module) {
    "use strict";
    var fs3 = __require("fs");
    var path3 = __require("path");
    var { promisify } = __require("util");
    var { cppdb } = require_util();
    var fsAccess = promisify(fs3.access);
    module.exports = async function backup(filename, options) {
      if (options == null) options = {};
      if (typeof filename !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      filename = filename.trim();
      const attachedName = "attached" in options ? options.attached : "main";
      const handler = "progress" in options ? options.progress : null;
      if (!filename) throw new TypeError("Backup filename cannot be an empty string");
      if (filename === ":memory:") throw new TypeError('Invalid backup filename ":memory:"');
      if (typeof attachedName !== "string") throw new TypeError('Expected the "attached" option to be a string');
      if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
      if (handler != null && typeof handler !== "function") throw new TypeError('Expected the "progress" option to be a function');
      await fsAccess(path3.dirname(filename)).catch(() => {
        throw new TypeError("Cannot save backup because the directory does not exist");
      });
      const isNewFile = await fsAccess(filename).then(() => false, () => true);
      return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
    };
    var runBackup = (backup, handler) => {
      let rate = 0;
      let useDefault = true;
      return new Promise((resolve, reject) => {
        setImmediate(function step() {
          try {
            const progress = backup.transfer(rate);
            if (!progress.remainingPages) {
              backup.close();
              resolve(progress);
              return;
            }
            if (useDefault) {
              useDefault = false;
              rate = 100;
            }
            if (handler) {
              const ret = handler(progress);
              if (ret !== void 0) {
                if (typeof ret === "number" && ret === ret) rate = Math.max(0, Math.min(2147483647, Math.round(ret)));
                else throw new TypeError("Expected progress callback to return a number or undefined");
              }
            }
            setImmediate(step);
          } catch (err) {
            backup.close();
            reject(err);
          }
        });
      });
    };
  }
});

// node_modules/better-sqlite3/lib/methods/serialize.js
var require_serialize = __commonJS({
  "node_modules/better-sqlite3/lib/methods/serialize.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    module.exports = function serialize(options) {
      if (options == null) options = {};
      if (typeof options !== "object") throw new TypeError("Expected first argument to be an options object");
      const attachedName = "attached" in options ? options.attached : "main";
      if (typeof attachedName !== "string") throw new TypeError('Expected the "attached" option to be a string');
      if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
      return this[cppdb].serialize(attachedName);
    };
  }
});

// node_modules/better-sqlite3/lib/methods/function.js
var require_function = __commonJS({
  "node_modules/better-sqlite3/lib/methods/function.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function defineFunction(name, options, fn) {
      if (options == null) options = {};
      if (typeof options === "function") {
        fn = options;
        options = {};
      }
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof fn !== "function") throw new TypeError("Expected last argument to be a function");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      if (!name) throw new TypeError("User-defined function name cannot be an empty string");
      const safeIntegers = "safeIntegers" in options ? +getBooleanOption(options, "safeIntegers") : 2;
      const deterministic = getBooleanOption(options, "deterministic");
      const directOnly = getBooleanOption(options, "directOnly");
      const varargs = getBooleanOption(options, "varargs");
      let argCount = -1;
      if (!varargs) {
        argCount = fn.length;
        if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError("Expected function.length to be a positive integer");
        if (argCount > 100) throw new RangeError("User-defined functions cannot have more than 100 arguments");
      }
      this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
      return this;
    };
  }
});

// node_modules/better-sqlite3/lib/methods/aggregate.js
var require_aggregate = __commonJS({
  "node_modules/better-sqlite3/lib/methods/aggregate.js"(exports, module) {
    "use strict";
    var { getBooleanOption, cppdb } = require_util();
    module.exports = function defineAggregate(name, options) {
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object" || options === null) throw new TypeError("Expected second argument to be an options object");
      if (!name) throw new TypeError("User-defined function name cannot be an empty string");
      const start = "start" in options ? options.start : null;
      const step = getFunctionOption(options, "step", true);
      const inverse = getFunctionOption(options, "inverse", false);
      const result = getFunctionOption(options, "result", false);
      const safeIntegers = "safeIntegers" in options ? +getBooleanOption(options, "safeIntegers") : 2;
      const deterministic = getBooleanOption(options, "deterministic");
      const directOnly = getBooleanOption(options, "directOnly");
      const varargs = getBooleanOption(options, "varargs");
      let argCount = -1;
      if (!varargs) {
        argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
        if (argCount > 0) argCount -= 1;
        if (argCount > 100) throw new RangeError("User-defined functions cannot have more than 100 arguments");
      }
      this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
      return this;
    };
    var getFunctionOption = (options, key, required) => {
      const value = key in options ? options[key] : null;
      if (typeof value === "function") return value;
      if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
      if (required) throw new TypeError(`Missing required option "${key}"`);
      return null;
    };
    var getLength = ({ length }) => {
      if (Number.isInteger(length) && length >= 0) return length;
      throw new TypeError("Expected function.length to be a positive integer");
    };
  }
});

// node_modules/better-sqlite3/lib/methods/table.js
var require_table = __commonJS({
  "node_modules/better-sqlite3/lib/methods/table.js"(exports, module) {
    "use strict";
    var { cppdb } = require_util();
    module.exports = function defineTable(name, factory) {
      if (typeof name !== "string") throw new TypeError("Expected first argument to be a string");
      if (!name) throw new TypeError("Virtual table module name cannot be an empty string");
      let eponymous = false;
      if (typeof factory === "object" && factory !== null) {
        eponymous = true;
        factory = defer(parseTableDefinition(factory, "used", name));
      } else {
        if (typeof factory !== "function") throw new TypeError("Expected second argument to be a function or a table definition object");
        factory = wrapFactory(factory);
      }
      this[cppdb].table(factory, name, eponymous);
      return this;
    };
    function wrapFactory(factory) {
      return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
        const thisObject = {
          module: moduleName,
          database: databaseName,
          table: tableName
        };
        const def = apply.call(factory, thisObject, args);
        if (typeof def !== "object" || def === null) {
          throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
        }
        return parseTableDefinition(def, "returned", moduleName);
      };
    }
    function parseTableDefinition(def, verb, moduleName) {
      if (!hasOwnProperty.call(def, "rows")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
      }
      if (!hasOwnProperty.call(def, "columns")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
      }
      const rows = def.rows;
      if (typeof rows !== "function" || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
      }
      let columns = def.columns;
      if (!Array.isArray(columns) || !(columns = [...columns]).every((x) => typeof x === "string")) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
      }
      if (columns.length !== new Set(columns).size) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
      }
      if (!columns.length) {
        throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
      }
      let parameters;
      if (hasOwnProperty.call(def, "parameters")) {
        parameters = def.parameters;
        if (!Array.isArray(parameters) || !(parameters = [...parameters]).every((x) => typeof x === "string")) {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
        }
      } else {
        parameters = inferParameters(rows);
      }
      if (parameters.length !== new Set(parameters).size) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
      }
      if (parameters.length > 32) {
        throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
      }
      for (const parameter of parameters) {
        if (columns.includes(parameter)) {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
        }
      }
      let safeIntegers = 2;
      if (hasOwnProperty.call(def, "safeIntegers")) {
        const bool = def.safeIntegers;
        if (typeof bool !== "boolean") {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
        }
        safeIntegers = +bool;
      }
      let directOnly = false;
      if (hasOwnProperty.call(def, "directOnly")) {
        directOnly = def.directOnly;
        if (typeof directOnly !== "boolean") {
          throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
        }
      }
      const columnDefinitions = [
        ...parameters.map(identifier).map((str) => `${str} HIDDEN`),
        ...columns.map(identifier)
      ];
      return [
        `CREATE TABLE x(${columnDefinitions.join(", ")});`,
        wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
        parameters,
        safeIntegers,
        directOnly
      ];
    }
    function wrapGenerator(generator, columnMap, moduleName) {
      return function* virtualTable(...args) {
        const output = args.map((x) => Buffer.isBuffer(x) ? Buffer.from(x) : x);
        for (let i = 0; i < columnMap.size; ++i) {
          output.push(null);
        }
        for (const row of generator(...args)) {
          if (Array.isArray(row)) {
            extractRowArray(row, output, columnMap.size, moduleName);
            yield output;
          } else if (typeof row === "object" && row !== null) {
            extractRowObject(row, output, columnMap, moduleName);
            yield output;
          } else {
            throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
          }
        }
      };
    }
    function extractRowArray(row, output, columnCount, moduleName) {
      if (row.length !== columnCount) {
        throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
      }
      const offset = output.length - columnCount;
      for (let i = 0; i < columnCount; ++i) {
        output[i + offset] = row[i];
      }
    }
    function extractRowObject(row, output, columnMap, moduleName) {
      let count = 0;
      for (const key of Object.keys(row)) {
        const index = columnMap.get(key);
        if (index === void 0) {
          throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
        }
        output[index] = row[key];
        count += 1;
      }
      if (count !== columnMap.size) {
        throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
      }
    }
    function inferParameters({ length }) {
      if (!Number.isInteger(length) || length < 0) {
        throw new TypeError("Expected function.length to be a positive integer");
      }
      const params = [];
      for (let i = 0; i < length; ++i) {
        params.push(`$${i + 1}`);
      }
      return params;
    }
    var { hasOwnProperty } = Object.prototype;
    var { apply } = Function.prototype;
    var GeneratorFunctionPrototype = Object.getPrototypeOf(function* () {
    });
    var identifier = (str) => `"${str.replace(/"/g, '""')}"`;
    var defer = (x) => () => x;
  }
});

// node_modules/better-sqlite3/lib/methods/inspect.js
var require_inspect = __commonJS({
  "node_modules/better-sqlite3/lib/methods/inspect.js"(exports, module) {
    "use strict";
    var DatabaseInspection = function Database2() {
    };
    module.exports = function inspect(depth, opts) {
      return Object.assign(new DatabaseInspection(), this);
    };
  }
});

// node_modules/better-sqlite3/lib/database.js
var require_database = __commonJS({
  "node_modules/better-sqlite3/lib/database.js"(exports, module) {
    "use strict";
    var fs3 = __require("fs");
    var path3 = __require("path");
    var util = require_util();
    var SqliteError = require_sqlite_error();
    var DEFAULT_ADDON;
    function Database2(filenameGiven, options) {
      if (new.target == null) {
        return new Database2(filenameGiven, options);
      }
      let buffer;
      if (Buffer.isBuffer(filenameGiven)) {
        buffer = filenameGiven;
        filenameGiven = ":memory:";
      }
      if (filenameGiven == null) filenameGiven = "";
      if (options == null) options = {};
      if (typeof filenameGiven !== "string") throw new TypeError("Expected first argument to be a string");
      if (typeof options !== "object") throw new TypeError("Expected second argument to be an options object");
      if ("readOnly" in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
      if ("memory" in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');
      const filename = filenameGiven.trim();
      const anonymous = filename === "" || filename === ":memory:";
      const readonly = util.getBooleanOption(options, "readonly");
      const fileMustExist = util.getBooleanOption(options, "fileMustExist");
      const timeout = "timeout" in options ? options.timeout : 5e3;
      const verbose = "verbose" in options ? options.verbose : null;
      const nativeBinding = "nativeBinding" in options ? options.nativeBinding : null;
      if (readonly && anonymous && !buffer) throw new TypeError("In-memory/temporary databases cannot be readonly");
      if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
      if (timeout > 2147483647) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
      if (verbose != null && typeof verbose !== "function") throw new TypeError('Expected the "verbose" option to be a function');
      if (nativeBinding != null && typeof nativeBinding !== "string" && typeof nativeBinding !== "object") throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');
      let addon;
      if (nativeBinding == null) {
        addon = DEFAULT_ADDON || (DEFAULT_ADDON = require_bindings()("better_sqlite3.node"));
      } else if (typeof nativeBinding === "string") {
        const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : __require;
        addon = requireFunc(path3.resolve(nativeBinding).replace(/(\.node)?$/, ".node"));
      } else {
        addon = nativeBinding;
      }
      if (!addon.isInitialized) {
        addon.setErrorConstructor(SqliteError);
        addon.isInitialized = true;
      }
      if (!anonymous && !fs3.existsSync(path3.dirname(filename))) {
        throw new TypeError("Cannot open database because the directory does not exist");
      }
      Object.defineProperties(this, {
        [util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
        ...wrappers.getters
      });
    }
    var wrappers = require_wrappers();
    Database2.prototype.prepare = wrappers.prepare;
    Database2.prototype.transaction = require_transaction();
    Database2.prototype.pragma = require_pragma();
    Database2.prototype.backup = require_backup();
    Database2.prototype.serialize = require_serialize();
    Database2.prototype.function = require_function();
    Database2.prototype.aggregate = require_aggregate();
    Database2.prototype.table = require_table();
    Database2.prototype.loadExtension = wrappers.loadExtension;
    Database2.prototype.exec = wrappers.exec;
    Database2.prototype.close = wrappers.close;
    Database2.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
    Database2.prototype.unsafeMode = wrappers.unsafeMode;
    Database2.prototype[util.inspect] = require_inspect();
    module.exports = Database2;
  }
});

// node_modules/better-sqlite3/lib/index.js
var require_lib = __commonJS({
  "node_modules/better-sqlite3/lib/index.js"(exports, module) {
    "use strict";
    module.exports = require_database();
    module.exports.SqliteError = require_sqlite_error();
  }
});

// node_modules/mmdb-lib/lib/utils.js
var require_utils = __commonJS({
  "node_modules/mmdb-lib/lib/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var legacyErrorMessage = `Maxmind v2 module has changed API.
Upgrade instructions can be found here: https://github.com/runk/node-maxmind/wiki/Migration-guide
If you want to use legacy library then explicitly install maxmind@1`;
    var assert = (condition, message) => {
      if (!condition) {
        throw new Error(message);
      }
    };
    exports.default = {
      assert,
      legacyErrorMessage
    };
  }
});

// node_modules/mmdb-lib/lib/decoder.js
var require_decoder = __commonJS({
  "node_modules/mmdb-lib/lib/decoder.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils_1 = __importDefault(require_utils());
    utils_1.default.assert(typeof BigInt !== "undefined", "Apparently you are using old version of node. Please upgrade to node 10.4.x or above.");
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Extended"] = 0] = "Extended";
      DataType2[DataType2["Pointer"] = 1] = "Pointer";
      DataType2[DataType2["Utf8String"] = 2] = "Utf8String";
      DataType2[DataType2["Double"] = 3] = "Double";
      DataType2[DataType2["Bytes"] = 4] = "Bytes";
      DataType2[DataType2["Uint16"] = 5] = "Uint16";
      DataType2[DataType2["Uint32"] = 6] = "Uint32";
      DataType2[DataType2["Map"] = 7] = "Map";
      DataType2[DataType2["Int32"] = 8] = "Int32";
      DataType2[DataType2["Uint64"] = 9] = "Uint64";
      DataType2[DataType2["Uint128"] = 10] = "Uint128";
      DataType2[DataType2["Array"] = 11] = "Array";
      DataType2[DataType2["Container"] = 12] = "Container";
      DataType2[DataType2["EndMarker"] = 13] = "EndMarker";
      DataType2[DataType2["Boolean"] = 14] = "Boolean";
      DataType2[DataType2["Float"] = 15] = "Float";
    })(DataType || (DataType = {}));
    var pointerValueOffset = [0, 2048, 526336, 0];
    var noCache = {
      get: () => void 0,
      set: () => void 0
    };
    var cursor = (value, offset) => ({ value, offset });
    var Decoder = class {
      constructor(db, baseOffset = 0, cache = noCache) {
        this.telemetry = {};
        utils_1.default.assert(Boolean(db), "Database buffer is required");
        this.db = db;
        this.baseOffset = baseOffset;
        this.cache = cache;
      }
      decode(offset) {
        let tmp;
        const ctrlByte = this.db[offset++];
        let type = ctrlByte >> 5;
        if (type === DataType.Pointer) {
          tmp = this.decodePointer(ctrlByte, offset);
          return cursor(this.decodeFast(tmp.value).value, tmp.offset);
        }
        if (type === DataType.Extended) {
          tmp = this.db[offset] + 7;
          if (tmp < 8) {
            throw new Error("Invalid Extended Type at offset " + offset + " val " + tmp);
          }
          type = tmp;
          offset++;
        }
        const size = this.sizeFromCtrlByte(ctrlByte, offset);
        return this.decodeByType(type, size.offset, size.value);
      }
      decodeFast(offset) {
        const cached = this.cache.get(offset);
        if (cached) {
          return cached;
        }
        const result = this.decode(offset);
        this.cache.set(offset, result);
        return result;
      }
      decodeByType(type, offset, size) {
        const newOffset = offset + size;
        switch (type) {
          case DataType.Utf8String:
            return cursor(this.decodeString(offset, size), newOffset);
          case DataType.Map:
            return this.decodeMap(size, offset);
          case DataType.Uint32:
            return cursor(this.decodeUint(offset, size), newOffset);
          case DataType.Double:
            return cursor(this.decodeDouble(offset), newOffset);
          case DataType.Array:
            return this.decodeArray(size, offset);
          case DataType.Boolean:
            return cursor(this.decodeBoolean(size), offset);
          case DataType.Float:
            return cursor(this.decodeFloat(offset), newOffset);
          case DataType.Bytes:
            return cursor(this.decodeBytes(offset, size), newOffset);
          case DataType.Uint16:
            return cursor(this.decodeUint(offset, size), newOffset);
          case DataType.Int32:
            return cursor(this.decodeInt32(offset, size), newOffset);
          case DataType.Uint64:
            return cursor(this.decodeUint(offset, size), newOffset);
          case DataType.Uint128:
            return cursor(this.decodeUint(offset, size), newOffset);
        }
        throw new Error("Unknown type " + type + " at offset " + offset);
      }
      sizeFromCtrlByte(ctrlByte, offset) {
        const size = ctrlByte & 31;
        if (size < 29) {
          return cursor(size, offset);
        }
        if (size === 29) {
          return cursor(29 + this.db[offset], offset + 1);
        }
        if (size === 30) {
          return cursor(285 + this.db.readUInt16BE(offset), offset + 2);
        }
        return cursor(65821 + this.db.readUIntBE(offset, 3), offset + 3);
      }
      decodeBytes(offset, size) {
        return this.db.subarray(offset, offset + size);
      }
      decodePointer(ctrlByte, offset) {
        const pointerSize = ctrlByte >> 3 & 3;
        const pointer = this.baseOffset + pointerValueOffset[pointerSize];
        let packed = 0;
        if (pointerSize === 0) {
          packed = (ctrlByte & 7) << 8 | this.db[offset];
        } else if (pointerSize === 1) {
          packed = (ctrlByte & 7) << 16 | this.db.readUInt16BE(offset);
        } else if (pointerSize === 2) {
          packed = (ctrlByte & 7) << 24 | this.db.readUIntBE(offset, 3);
        } else {
          packed = this.db.readUInt32BE(offset);
        }
        offset += pointerSize + 1;
        return cursor(pointer + packed, offset);
      }
      decodeArray(size, offset) {
        let tmp;
        const array = new Array(size);
        for (let i = 0; i < size; i++) {
          tmp = this.decode(offset);
          offset = tmp.offset;
          array[i] = tmp.value;
        }
        return cursor(array, offset);
      }
      decodeBoolean(size) {
        return size !== 0;
      }
      decodeDouble(offset) {
        return this.db.readDoubleBE(offset);
      }
      decodeFloat(offset) {
        return this.db.readFloatBE(offset);
      }
      decodeMap(size, offset) {
        let tmp;
        let key;
        const map = {};
        for (let i = 0; i < size; i++) {
          tmp = this.decode(offset);
          key = tmp.value;
          tmp = this.decode(tmp.offset);
          offset = tmp.offset;
          map[key] = tmp.value;
        }
        return cursor(map, offset);
      }
      decodeInt32(offset, size) {
        if (size === 0) {
          return 0;
        }
        if (size < 4) {
          return this.db.readUIntBE(offset, size);
        }
        return this.db.readInt32BE(offset);
      }
      decodeUint(offset, size) {
        if (size === 0) {
          return 0;
        }
        if (size <= 6) {
          return this.db.readUIntBE(offset, size);
        }
        if (size == 8) {
          return this.db.readBigUInt64BE(offset).toString();
        }
        if (size > 16) {
          return 0;
        }
        return this.decodeBigUint(offset, size);
      }
      decodeString(offset, size) {
        return this.db.toString("utf8", offset, offset + size);
      }
      decodeBigUint(offset, size) {
        let integer = 0n;
        for (let i = 0; i < size; i++) {
          integer <<= 8n;
          integer |= BigInt(this.db.readUInt8(offset + i));
        }
        return integer.toString();
      }
    };
    exports.default = Decoder;
  }
});

// node_modules/mmdb-lib/lib/ip.js
var require_ip = __commonJS({
  "node_modules/mmdb-lib/lib/ip.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var net_1 = __importDefault(__require("net"));
    var parseIPv4 = (input) => {
      const ip = input.split(".", 4);
      const o0 = parseInt(ip[0]);
      const o1 = parseInt(ip[1]);
      const o2 = parseInt(ip[2]);
      const o3 = parseInt(ip[3]);
      return [o0, o1, o2, o3];
    };
    var hex = (v) => {
      const h = parseInt(v, 10).toString(16);
      return h.length === 2 ? h : "0" + h;
    };
    var parseIPv6 = (input) => {
      const addr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      let i;
      let parsed;
      let chunk;
      const ip = input.indexOf(".") > -1 ? input.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, (match, a, b, c, d) => {
        return hex(a) + hex(b) + ":" + hex(c) + hex(d);
      }) : input;
      const [left, right] = ip.split("::", 2);
      if (left) {
        parsed = left.split(":");
        for (i = 0; i < parsed.length; i++) {
          chunk = parseInt(parsed[i], 16);
          addr[i * 2] = chunk >> 8;
          addr[i * 2 + 1] = chunk & 255;
        }
      }
      if (right) {
        parsed = right.split(":");
        const offset = 16 - parsed.length * 2;
        for (i = 0; i < parsed.length; i++) {
          chunk = parseInt(parsed[i], 16);
          addr[offset + i * 2] = chunk >> 8;
          addr[offset + (i * 2 + 1)] = chunk & 255;
        }
      }
      return addr;
    };
    var parse = (ip) => {
      return ip.indexOf(":") === -1 ? parseIPv4(ip) : parseIPv6(ip);
    };
    var bitAt = (rawAddress, idx) => {
      const bufIdx = idx >> 3;
      const bitIdx = 7 ^ idx & 7;
      return rawAddress[bufIdx] >>> bitIdx & 1;
    };
    var validate = (ip) => {
      const version = net_1.default.isIP(ip);
      return version === 4 || version === 6;
    };
    exports.default = {
      bitAt,
      parse,
      validate
    };
  }
});

// node_modules/mmdb-lib/lib/metadata.js
var require_metadata = __commonJS({
  "node_modules/mmdb-lib/lib/metadata.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isLegacyFormat = exports.parseMetadata = void 0;
    var decoder_1 = __importDefault(require_decoder());
    var utils_1 = __importDefault(require_utils());
    var METADATA_START_MARKER = Buffer.from("ABCDEF4D61784D696E642E636F6D", "hex");
    var parseMetadata = (db) => {
      const offset = findStart(db);
      const decoder = new decoder_1.default(db, offset);
      const metadata = decoder.decode(offset).value;
      if (!metadata) {
        throw new Error((0, exports.isLegacyFormat)(db) ? utils_1.default.legacyErrorMessage : "Cannot parse binary database");
      }
      utils_1.default.assert([24, 28, 32].indexOf(metadata.record_size) > -1, "Unsupported record size");
      return {
        binaryFormatMajorVersion: metadata.binary_format_major_version,
        binaryFormatMinorVersion: metadata.binary_format_minor_version,
        buildEpoch: new Date(metadata.build_epoch * 1e3),
        databaseType: metadata.database_type,
        description: metadata.description,
        ipVersion: metadata.ip_version,
        languages: metadata.languages,
        nodeByteSize: metadata.record_size / 4,
        nodeCount: metadata.node_count,
        recordSize: metadata.record_size,
        searchTreeSize: metadata.node_count * metadata.record_size / 4,
        // Depth depends on the IP version, it's 32 for IPv4 and 128 for IPv6.
        treeDepth: Math.pow(2, metadata.ip_version + 1)
      };
    };
    exports.parseMetadata = parseMetadata;
    var findStart = (db) => {
      let found = 0;
      let fsize = db.length - 1;
      const mlen = METADATA_START_MARKER.length - 1;
      while (found <= mlen && fsize-- > 0) {
        found += db[fsize] === METADATA_START_MARKER[mlen - found] ? 1 : -found;
      }
      return fsize + found;
    };
    var isLegacyFormat = (db) => {
      const structureInfoMaxSize = 20;
      for (let i = 0; i < structureInfoMaxSize; i++) {
        const delim = db.slice(db.length - 3 - i, db.length - i);
        if (delim[0] === 255 && delim[1] === 255 && delim[2] === 255) {
          return true;
        }
      }
      return false;
    };
    exports.isLegacyFormat = isLegacyFormat;
  }
});

// node_modules/mmdb-lib/lib/reader/walker.js
var require_walker = __commonJS({
  "node_modules/mmdb-lib/lib/reader/walker.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var readNodeRight24 = (db) => (offset) => db.readUIntBE(offset + 3, 3);
    var readNodeLeft24 = (db) => (offset) => db.readUIntBE(offset, 3);
    var readNodeLeft28 = (db) => (offset) => (db[offset + 3] & 240) << 20 | db.readUIntBE(offset, 3);
    var readNodeRight28 = (db) => (offset) => (db[offset + 3] & 15) << 24 | db.readUIntBE(offset + 4, 3);
    var readNodeLeft32 = (db) => (offset) => db.readUInt32BE(offset);
    var readNodeRight32 = (db) => (offset) => db.readUInt32BE(offset + 4);
    exports.default = (db, recordSize) => {
      switch (recordSize) {
        case 24:
          return { left: readNodeLeft24(db), right: readNodeRight24(db) };
        case 28:
          return { left: readNodeLeft28(db), right: readNodeRight28(db) };
        case 32:
          return { left: readNodeLeft32(db), right: readNodeRight32(db) };
      }
      throw new Error("Unsupported record size");
    };
  }
});

// node_modules/mmdb-lib/lib/reader/response.js
var require_response = __commonJS({
  "node_modules/mmdb-lib/lib/reader/response.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/mmdb-lib/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/mmdb-lib/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Reader = void 0;
    var decoder_1 = __importDefault(require_decoder());
    var ip_1 = __importDefault(require_ip());
    var metadata_1 = require_metadata();
    var walker_1 = __importDefault(require_walker());
    var DATA_SECTION_SEPARATOR_SIZE = 16;
    var Reader = class {
      constructor(db, opts = {}) {
        this.opts = opts;
        this.load(db);
      }
      load(db) {
        if (!Buffer.isBuffer(db)) {
          throw new Error(`mmdb-lib expects an instance of Buffer, got: ${typeof db}`);
        }
        this.db = db;
        this.metadata = (0, metadata_1.parseMetadata)(this.db);
        this.decoder = new decoder_1.default(this.db, this.metadata.searchTreeSize + DATA_SECTION_SEPARATOR_SIZE, this.opts.cache);
        this.walker = (0, walker_1.default)(this.db, this.metadata.recordSize);
        this.ipv4StartNodeNumber = this.ipv4Start();
      }
      get(ipAddress) {
        const [data] = this.getWithPrefixLength(ipAddress);
        return data;
      }
      getWithPrefixLength(ipAddress) {
        const [pointer, prefixLength] = this.findAddressInTree(ipAddress);
        const data = pointer ? this.resolveDataPointer(pointer) : null;
        return [data, prefixLength];
      }
      findAddressInTree(ipAddress) {
        const rawAddress = ip_1.default.parse(ipAddress);
        const nodeCount = this.metadata.nodeCount;
        const bitLength = rawAddress.length * 8;
        let bit;
        let nodeNumber = 0;
        let offset;
        let depth = 0;
        if (rawAddress.length === 4) {
          nodeNumber = this.ipv4StartNodeNumber;
        }
        for (; depth < bitLength && nodeNumber < nodeCount; depth++) {
          bit = ip_1.default.bitAt(rawAddress, depth);
          offset = nodeNumber * this.metadata.nodeByteSize;
          nodeNumber = bit ? this.walker.right(offset) : this.walker.left(offset);
        }
        if (nodeNumber > nodeCount) {
          return [nodeNumber, depth];
        }
        return [null, depth];
      }
      resolveDataPointer(pointer) {
        const resolved = pointer - this.metadata.nodeCount + this.metadata.searchTreeSize;
        return this.decoder.decodeFast(resolved).value;
      }
      ipv4Start() {
        if (this.metadata.ipVersion === 4) {
          return 0;
        }
        const nodeCount = this.metadata.nodeCount;
        let pointer = 0;
        let i = 0;
        for (; i < 96 && pointer < nodeCount; i++) {
          const offset = pointer * this.metadata.nodeByteSize;
          pointer = this.walker.left(offset);
        }
        return pointer;
      }
    };
    exports.Reader = Reader;
    __exportStar(require_response(), exports);
  }
});

// node_modules/tiny-lru/dist/tiny-lru.cjs
var require_tiny_lru = __commonJS({
  "node_modules/tiny-lru/dist/tiny-lru.cjs"(exports) {
    "use strict";
    var LRU = class {
      /**
       * Creates a new LRU cache instance.
       *
       * @constructor
       * @param {number} [max=0] - Maximum number of items to store. 0 means unlimited.
       * @param {number} [ttl=0] - Time to live in milliseconds. 0 means no expiration.
       * @param {boolean} [resetTtl=false] - Whether to reset TTL when accessing existing items.
       * @throws {TypeError} When parameters are of invalid type.
       * @example
       * const cache = new LRU(1000, 60000, true); // 1000 items, 1 minute TTL, reset on access
       * @since 1.0.0
       */
      constructor(max = 0, ttl = 0, resetTtl = false) {
        this.first = null;
        this.items = /* @__PURE__ */ Object.create(null);
        this.last = null;
        this.max = max;
        this.resetTtl = resetTtl;
        this.size = 0;
        this.ttl = ttl;
      }
      /**
       * Removes all items from the cache.
       *
       * @method clear
       * @memberof LRU
       * @returns {LRU} The LRU instance for method chaining.
       * @example
       * cache.clear();
       * console.log(cache.size); // 0
       * @since 1.0.0
       */
      clear() {
        this.first = null;
        this.items = /* @__PURE__ */ Object.create(null);
        this.last = null;
        this.size = 0;
        return this;
      }
      /**
       * Removes an item from the cache by key.
       *
       * @method delete
       * @memberof LRU
       * @param {string} key - The key of the item to delete.
       * @returns {LRU} The LRU instance for method chaining.
       * @example
       * cache.set('key1', 'value1');
       * cache.delete('key1');
       * console.log(cache.has('key1')); // false
       * @see {@link LRU#has}
       * @see {@link LRU#clear}
       * @since 1.0.0
       */
      delete(key) {
        if (this.has(key)) {
          const item = this.items[key];
          delete this.items[key];
          this.size--;
          if (item.prev !== null) {
            item.prev.next = item.next;
          }
          if (item.next !== null) {
            item.next.prev = item.prev;
          }
          if (this.first === item) {
            this.first = item.next;
          }
          if (this.last === item) {
            this.last = item.prev;
          }
        }
        return this;
      }
      /**
       * Returns an array of [key, value] pairs for the specified keys.
       *
       * @method entries
       * @memberof LRU
       * @param {string[]} [keys=this.keys()] - Array of keys to get entries for. Defaults to all keys.
       * @returns {Array<Array<*>>} Array of [key, value] pairs.
       * @example
       * cache.set('a', 1).set('b', 2);
       * console.log(cache.entries()); // [['a', 1], ['b', 2]]
       * console.log(cache.entries(['a'])); // [['a', 1]]
       * @see {@link LRU#keys}
       * @see {@link LRU#values}
       * @since 11.1.0
       */
      entries(keys = this.keys()) {
        return keys.map((key) => [key, this.get(key)]);
      }
      /**
       * Removes the least recently used item from the cache.
       *
       * @method evict
       * @memberof LRU
       * @param {boolean} [bypass=false] - Whether to bypass the size check and force eviction.
       * @returns {LRU} The LRU instance for method chaining.
       * @example
       * cache.set('old', 'value').set('new', 'value');
       * cache.evict(); // Removes 'old' item
       * @see {@link LRU#setWithEvicted}
       * @since 1.0.0
       */
      evict(bypass = false) {
        if (bypass || this.size > 0) {
          const item = this.first;
          delete this.items[item.key];
          if (--this.size === 0) {
            this.first = null;
            this.last = null;
          } else {
            this.first = item.next;
            this.first.prev = null;
          }
        }
        return this;
      }
      /**
       * Returns the expiration timestamp for a given key.
       *
       * @method expiresAt
       * @memberof LRU
       * @param {string} key - The key to check expiration for.
       * @returns {number|undefined} The expiration timestamp in milliseconds, or undefined if key doesn't exist.
       * @example
       * const cache = new LRU(100, 5000); // 5 second TTL
       * cache.set('key1', 'value1');
       * console.log(cache.expiresAt('key1')); // timestamp 5 seconds from now
       * @see {@link LRU#get}
       * @see {@link LRU#has}
       * @since 1.0.0
       */
      expiresAt(key) {
        let result;
        if (this.has(key)) {
          result = this.items[key].expiry;
        }
        return result;
      }
      /**
       * Retrieves a value from the cache by key. Updates the item's position to most recently used.
       *
       * @method get
       * @memberof LRU
       * @param {string} key - The key to retrieve.
       * @returns {*} The value associated with the key, or undefined if not found or expired.
       * @example
       * cache.set('key1', 'value1');
       * console.log(cache.get('key1')); // 'value1'
       * console.log(cache.get('nonexistent')); // undefined
       * @see {@link LRU#set}
       * @see {@link LRU#has}
       * @since 1.0.0
       */
      get(key) {
        let result;
        if (this.has(key)) {
          const item = this.items[key];
          if (this.ttl > 0 && item.expiry <= Date.now()) {
            this.delete(key);
          } else {
            result = item.value;
            this.set(key, result, true);
          }
        }
        return result;
      }
      /**
       * Checks if a key exists in the cache.
       *
       * @method has
       * @memberof LRU
       * @param {string} key - The key to check for.
       * @returns {boolean} True if the key exists, false otherwise.
       * @example
       * cache.set('key1', 'value1');
       * console.log(cache.has('key1')); // true
       * console.log(cache.has('nonexistent')); // false
       * @see {@link LRU#get}
       * @see {@link LRU#delete}
       * @since 9.0.0
       */
      has(key) {
        return key in this.items;
      }
      /**
       * Returns an array of all keys in the cache, ordered from least to most recently used.
       *
       * @method keys
       * @memberof LRU
       * @returns {string[]} Array of keys in LRU order.
       * @example
       * cache.set('a', 1).set('b', 2);
       * cache.get('a'); // Move 'a' to most recent
       * console.log(cache.keys()); // ['b', 'a']
       * @see {@link LRU#values}
       * @see {@link LRU#entries}
       * @since 9.0.0
       */
      keys() {
        const result = [];
        let x = this.first;
        while (x !== null) {
          result.push(x.key);
          x = x.next;
        }
        return result;
      }
      /**
       * Sets a value in the cache and returns any evicted item.
       *
       * @method setWithEvicted
       * @memberof LRU
       * @param {string} key - The key to set.
       * @param {*} value - The value to store.
       * @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
       * @returns {Object|null} The evicted item (if any) with shape {key, value, expiry, prev, next}, or null.
       * @example
       * const cache = new LRU(2);
       * cache.set('a', 1).set('b', 2);
       * const evicted = cache.setWithEvicted('c', 3); // evicted = {key: 'a', value: 1, ...}
       * @see {@link LRU#set}
       * @see {@link LRU#evict}
       * @since 11.3.0
       */
      setWithEvicted(key, value, resetTtl = this.resetTtl) {
        let evicted = null;
        if (this.has(key)) {
          this.set(key, value, true, resetTtl);
        } else {
          if (this.max > 0 && this.size === this.max) {
            evicted = { ...this.first };
            this.evict(true);
          }
          let item = this.items[key] = {
            expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
            key,
            prev: this.last,
            next: null,
            value
          };
          if (++this.size === 1) {
            this.first = item;
          } else {
            this.last.next = item;
          }
          this.last = item;
        }
        return evicted;
      }
      /**
       * Sets a value in the cache. Updates the item's position to most recently used.
       *
       * @method set
       * @memberof LRU
       * @param {string} key - The key to set.
       * @param {*} value - The value to store.
       * @param {boolean} [bypass=false] - Whether to bypass normal LRU positioning (internal use).
       * @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
       * @returns {LRU} The LRU instance for method chaining.
       * @example
       * cache.set('key1', 'value1')
       *      .set('key2', 'value2')
       *      .set('key3', 'value3');
       * @see {@link LRU#get}
       * @see {@link LRU#setWithEvicted}
       * @since 1.0.0
       */
      set(key, value, bypass = false, resetTtl = this.resetTtl) {
        let item;
        if (bypass || this.has(key)) {
          item = this.items[key];
          item.value = value;
          if (bypass === false && resetTtl) {
            item.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
          }
          if (this.last !== item) {
            const last = this.last, next = item.next, prev = item.prev;
            if (this.first === item) {
              this.first = item.next;
            }
            item.next = null;
            item.prev = this.last;
            last.next = item;
            if (prev !== null) {
              prev.next = next;
            }
            if (next !== null) {
              next.prev = prev;
            }
          }
        } else {
          if (this.max > 0 && this.size === this.max) {
            this.evict(true);
          }
          item = this.items[key] = {
            expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
            key,
            prev: this.last,
            next: null,
            value
          };
          if (++this.size === 1) {
            this.first = item;
          } else {
            this.last.next = item;
          }
        }
        this.last = item;
        return this;
      }
      /**
       * Returns an array of all values in the cache for the specified keys.
       *
       * @method values
       * @memberof LRU
       * @param {string[]} [keys=this.keys()] - Array of keys to get values for. Defaults to all keys.
       * @returns {Array<*>} Array of values corresponding to the keys.
       * @example
       * cache.set('a', 1).set('b', 2);
       * console.log(cache.values()); // [1, 2]
       * console.log(cache.values(['a'])); // [1]
       * @see {@link LRU#keys}
       * @see {@link LRU#entries}
       * @since 11.1.0
       */
      values(keys = this.keys()) {
        return keys.map((key) => this.get(key));
      }
    };
    function lru(max = 1e3, ttl = 0, resetTtl = false) {
      if (isNaN(max) || max < 0) {
        throw new TypeError("Invalid max value");
      }
      if (isNaN(ttl) || ttl < 0) {
        throw new TypeError("Invalid ttl value");
      }
      if (typeof resetTtl !== "boolean") {
        throw new TypeError("Invalid resetTtl value");
      }
      return new LRU(max, ttl, resetTtl);
    }
    exports.LRU = LRU;
    exports.lru = lru;
  }
});

// node_modules/maxmind/lib/fs.js
var require_fs = __commonJS({
  "node_modules/maxmind/lib/fs.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs_1 = __importDefault(__require("fs"));
    var util_1 = __importDefault(__require("util"));
    exports.default = {
      existsSync: fs_1.default.existsSync,
      readFile: util_1.default.promisify(fs_1.default.readFile),
      watchFile: fs_1.default.watchFile,
      createReadStream: fs_1.default.createReadStream,
      stat: util_1.default.promisify(fs_1.default.stat)
    };
  }
});

// node_modules/maxmind/lib/ip.js
var require_ip2 = __commonJS({
  "node_modules/maxmind/lib/ip.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var net_1 = __importDefault(__require("net"));
    var parseIPv4 = (input) => {
      const ip = input.split(".", 4);
      const o0 = parseInt(ip[0]);
      const o1 = parseInt(ip[1]);
      const o2 = parseInt(ip[2]);
      const o3 = parseInt(ip[3]);
      return [o0, o1, o2, o3];
    };
    var hex = (v) => {
      v = parseInt(v, 10).toString(16);
      return v.length === 2 ? v : "0" + v;
    };
    var parseIPv6 = (ip) => {
      const addr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      let i;
      let parsed;
      let chunk;
      if (ip.indexOf(".") > -1) {
        ip = ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, (match, a, b, c, d) => {
          return hex(a) + hex(b) + ":" + hex(c) + hex(d);
        });
      }
      const [left, right] = ip.split("::", 2);
      if (left) {
        parsed = left.split(":");
        for (i = 0; i < parsed.length; i++) {
          chunk = parseInt(parsed[i], 16);
          addr[i * 2] = chunk >> 8;
          addr[i * 2 + 1] = chunk & 255;
        }
      }
      if (right) {
        parsed = right.split(":");
        const offset = 16 - parsed.length * 2;
        for (i = 0; i < parsed.length; i++) {
          chunk = parseInt(parsed[i], 16);
          addr[offset + i * 2] = chunk >> 8;
          addr[offset + (i * 2 + 1)] = chunk & 255;
        }
      }
      return addr;
    };
    var parse = (ip) => {
      return ip.indexOf(":") === -1 ? parseIPv4(ip) : parseIPv6(ip);
    };
    var bitAt = (rawAddress, idx) => {
      const bufIdx = idx >> 3;
      const bitIdx = 7 ^ idx & 7;
      return rawAddress[bufIdx] >>> bitIdx & 1;
    };
    var validate = (ip) => {
      const version = net_1.default.isIP(ip);
      return version === 4 || version === 6;
    };
    exports.default = {
      bitAt,
      parse,
      validate
    };
  }
});

// node_modules/maxmind/lib/is-gzip.js
var require_is_gzip = __commonJS({
  "node_modules/maxmind/lib/is-gzip.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (buf) => {
      if (!buf || buf.length < 3) {
        return false;
      }
      return buf[0] === 31 && buf[1] === 139 && buf[2] === 8;
    };
  }
});

// node_modules/maxmind/lib/utils.js
var require_utils2 = __commonJS({
  "node_modules/maxmind/lib/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var concat2 = (a, b) => {
      return a << 8 | b;
    };
    var concat3 = (a, b, c) => {
      return a << 16 | b << 8 | c;
    };
    var concat4 = (a, b, c, d) => {
      return a << 24 | b << 16 | c << 8 | d;
    };
    var legacyErrorMessage = `Maxmind v2 module has changed API.
Upgrade instructions can be found here: https://github.com/runk/node-maxmind/wiki/Migration-guide
If you want to use legacy libary then explicitly install maxmind@1`;
    exports.default = {
      concat2,
      concat3,
      concat4,
      legacyErrorMessage
    };
  }
});

// node_modules/maxmind/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/maxmind/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Reader = exports.validate = exports.init = exports.openSync = exports.open = void 0;
    var assert_1 = __importDefault(__require("assert"));
    var mmdb_lib_1 = require_lib2();
    Object.defineProperty(exports, "Reader", { enumerable: true, get: function() {
      return mmdb_lib_1.Reader;
    } });
    var tiny_lru_1 = require_tiny_lru();
    var fs_1 = __importDefault(require_fs());
    var ip_1 = __importDefault(require_ip2());
    var is_gzip_1 = __importDefault(require_is_gzip());
    var utils_1 = __importDefault(require_utils2());
    var LARGE_FILE_THRESHOLD = 512 * 1024 * 1024;
    var STREAM_WATERMARK = 8 * 1024 * 1024;
    var readLargeFile = async (filepath, size) => new Promise((resolve, reject) => {
      let buffer = Buffer.allocUnsafe(size);
      let offset = 0;
      const stream = fs_1.default.createReadStream(filepath, {
        highWaterMark: STREAM_WATERMARK
      });
      stream.on("data", (chunk) => {
        if (Buffer.isBuffer(chunk)) {
          chunk.copy(buffer, offset);
          offset += chunk.length;
        } else {
          const bufferChunk = Buffer.from(chunk);
          bufferChunk.copy(buffer, offset);
          offset += bufferChunk.length;
        }
      });
      stream.on("end", () => {
        stream.close();
        resolve(buffer);
      });
      stream.on("error", (err) => {
        reject(err);
      });
    });
    var readFile = async (filepath) => {
      const fstat = await fs_1.default.stat(filepath);
      return fstat.size < LARGE_FILE_THRESHOLD ? fs_1.default.readFile(filepath) : readLargeFile(filepath, fstat.size);
    };
    var open = async (filepath, opts, cb) => {
      var _a;
      (0, assert_1.default)(!cb, utils_1.default.legacyErrorMessage);
      const database = await readFile(filepath);
      if ((0, is_gzip_1.default)(database)) {
        throw new Error("Looks like you are passing in a file in gzip format, please use mmdb database instead.");
      }
      const cache = (0, tiny_lru_1.lru)(((_a = opts === null || opts === void 0 ? void 0 : opts.cache) === null || _a === void 0 ? void 0 : _a.max) || 1e4);
      const reader = new mmdb_lib_1.Reader(database, { cache });
      if (opts && !!opts.watchForUpdates) {
        if (opts.watchForUpdatesHook && typeof opts.watchForUpdatesHook !== "function") {
          throw new Error("opts.watchForUpdatesHook should be a function");
        }
        const watcherOptions = {
          persistent: opts.watchForUpdatesNonPersistent !== true
        };
        fs_1.default.watchFile(filepath, watcherOptions, async () => {
          const waitExists = async () => {
            for (let i = 0; i < 3; i++) {
              if (fs_1.default.existsSync(filepath)) {
                return true;
              }
              await new Promise((a) => setTimeout(a, 500));
            }
            return false;
          };
          if (!await waitExists()) {
            return;
          }
          const updatedDatabase = await readFile(filepath);
          cache.clear();
          reader.load(updatedDatabase);
          if (opts.watchForUpdatesHook) {
            opts.watchForUpdatesHook();
          }
        });
      }
      return reader;
    };
    exports.open = open;
    var openSync = () => {
      throw new Error(utils_1.default.legacyErrorMessage);
    };
    exports.openSync = openSync;
    var init = () => {
      throw new Error(utils_1.default.legacyErrorMessage);
    };
    exports.init = init;
    exports.validate = ip_1.default.validate;
    __exportStar(require_lib2(), exports);
    exports.default = {
      init: exports.init,
      open: exports.open,
      openSync: exports.openSync,
      validate: ip_1.default.validate
    };
  }
});

// sd-server-shim:plugin-log-stub
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? " " + JSON.stringify(detail).slice(0, 500) : "";
  console.error("[SelfDashboard][" + pluginId + "] " + operation + ": " + message + extra);
}

// plugins/docker/lib/dockerEngine.ts
import * as http from "node:http";
function socketPath() {
  return process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock";
}
function dockerRequest(method, pathAndQuery, body, timeoutMs = 12e3) {
  return new Promise((resolve, reject) => {
    const payload = body ?? "";
    const headers = {
      Host: "localhost",
      Accept: "application/json"
    };
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload, "utf8");
    }
    const req = http.request(
      {
        socketPath: socketPath(),
        path: pathAndQuery,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
        });
        res.on("end", () => {
          const resBody = Buffer.concat(chunks).toString("utf8");
          const code = res.statusCode ?? 500;
          resolve({ ok: code >= 200 && code < 300, status: code, body: resBody });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Timeout beim Docker-Socket"));
    });
    if (payload) req.write(payload, "utf8");
    req.end();
  });
}
function dockerGet(pathAndQuery) {
  return dockerRequest("GET", pathAndQuery, void 0, 12e3);
}
var MIN_SYSTEM_CPU_DELTA_NS = BigInt(1e7);

// plugins/crowdsec/lib/crowdsecDocker.ts
function findContainerId(containerName) {
  return dockerGet("/containers/json?all=1").then((r) => {
    if (!r.ok) throw new Error("docker_unavailable");
    const list = JSON.parse(r.body);
    const needle = containerName.replace(/^\//, "");
    const hit = list.find(
      (c) => (c.Names ?? []).some((n) => {
        const base = n.replace(/^\//, "");
        return base === needle || base.endsWith(`/${needle}`);
      })
    );
    if (!hit?.Id) throw new Error("crowdsec_container_not_found");
    return hit.Id;
  });
}
async function dockerExec(containerName, cmd, timeoutMs = 3e4) {
  const id = await findContainerId(containerName);
  const create = await dockerRequest(
    "POST",
    `/containers/${id}/exec`,
    JSON.stringify({ AttachStdout: true, AttachStderr: true, Cmd: cmd })
  );
  if (!create.ok) throw new Error(`docker_exec_create_${create.status}`);
  const execId = JSON.parse(create.body).Id;
  if (!execId) throw new Error("docker_exec_no_id");
  const start = await dockerRequest(
    "POST",
    `/exec/${execId}/start`,
    JSON.stringify({ Detach: false, Tty: false }),
    timeoutMs
  );
  if (!start.ok) throw new Error(`docker_exec_start_${start.status}`);
  const inspect = await dockerGet(`/exec/${execId}/json`);
  if (inspect.ok) {
    try {
      const code = Number(JSON.parse(inspect.body).ExitCode ?? 1);
      if (code !== 0) throw new Error(`cscli_exit_${code}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("cscli_exit_")) throw e;
    }
  }
}
async function crowdsecUnbanIp(containerName, ip) {
  const trimmed = ip.trim();
  if (!trimmed || !/^[\d.a-fA-F:]+$/.test(trimmed)) throw new Error("invalid_ip");
  try {
    await dockerExec(containerName, ["cscli", "decisions", "delete", "--ip", trimmed]);
  } catch {
  }
  try {
    await dockerExec(containerName, ["cscli", "alerts", "delete", "--ip", trimmed]);
  } catch {
  }
}

// plugins/crowdsec/lib/crowdsecDb.ts
var import_better_sqlite3 = __toESM(require_lib());
import fs2 from "fs";
import path2 from "path";

// plugins/crowdsec/lib/crowdsecGeoip.ts
var import_maxmind = __toESM(require_lib3());
import fs from "fs";
import path from "path";
var readerCache = null;
function isPublicIp(ip) {
  if (!ip || !/^[\d.a-fA-F:]+$/.test(ip)) return false;
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return false;
    if (lower.startsWith("fe80")) return false;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
    return true;
  }
  const p = ip.split(".").map((x) => Number(x));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  if (p[0] === 10 || p[0] === 127) return false;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false;
  if (p[0] === 192 && p[1] === 168) return false;
  if (p[0] === 169 && p[1] === 254) return false;
  return true;
}
function geoipCandidatePaths() {
  const roots = /* @__PURE__ */ new Set();
  if (process.env.CROWDSEC_GEOIP_PATH?.trim()) {
    roots.add(path.resolve(process.env.CROWDSEC_GEOIP_PATH.trim()));
  }
  const dataDir = process.env.CROWDSEC_DATA_DIR || "/crowdsec-data";
  roots.add(path.resolve(dataDir));
  roots.add(path.resolve("/crowdsec-data"));
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.add(path.resolve(process.env.SELFDASHBOARD_DATA_DIR));
  }
  roots.add("/usr/share/GeoIP");
  roots.add("/usr/local/share/GeoIP");
  roots.add("/var/lib/crowdsec/geoip");
  const fileNames = [
    "GeoLite2-City.mmdb",
    "GeoLite2-Country.mmdb",
    "geoip/GeoLite2-City.mmdb",
    "geoip/GeoLite2-Country.mmdb",
    "GeoIP/GeoLite2-City.mmdb",
    "GeoIP/GeoLite2-Country.mmdb"
  ];
  const candidates = [];
  for (const root of roots) {
    if (root.toLowerCase().endsWith(".mmdb")) {
      candidates.push(root);
      continue;
    }
    for (const name of fileNames) {
      candidates.push(path.join(root, name));
    }
  }
  return [...new Set(candidates)];
}
function findGeoipDatabase() {
  for (const p of geoipCandidatePaths()) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
    }
  }
  return null;
}
async function createGeoipLookup() {
  const dbPath = findGeoipDatabase();
  if (!dbPath) return null;
  try {
    if (!readerCache || readerCache.path !== dbPath) {
      const reader2 = await import_maxmind.default.open(dbPath);
      readerCache = { path: dbPath, reader: reader2 };
    }
    const reader = readerCache.reader;
    return {
      dbPath,
      lookup(ip) {
        if (!isPublicIp(ip)) return { country: "", city: "" };
        try {
          const hit = reader.get(ip);
          if (!hit) return { country: "", city: "" };
          const country = hit.country?.iso_code?.trim().toUpperCase() || "";
          const city = hit.city?.names?.en || hit.city?.names?.de || (hit.city?.names ? Object.values(hit.city.names)[0] : "") || "";
          return { country, city: typeof city === "string" ? city : "" };
        } catch {
          return { country: "", city: "" };
        }
      }
    };
  } catch {
    readerCache = null;
    return null;
  }
}
function normalizeCountryCode(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s || s === "??" || s === "XX" || s === "UNKNOWN") return "";
  if (/^[A-Z]{2}$/.test(s)) return s;
  return "";
}
function applyGeoipToCountry(ip, country, city, geoip) {
  let cc = normalizeCountryCode(country);
  let c = city?.trim() || "";
  if (cc) return { country: cc, city: c };
  if (!geoip) return { country: "??", city: c };
  const g = geoip.lookup(ip);
  if (g.country) return { country: g.country, city: g.city || c };
  return { country: "??", city: c };
}

// plugins/crowdsec/lib/crowdsecDb.ts
function isUsableIp(ip) {
  if (!ip) return false;
  if (ip === "0.0.0.0" || ip === "::") return false;
  return /^[\d.a-fA-F:]+$/.test(ip);
}
function extractIpFromSerialized(raw) {
  if (!raw) return "";
  const m = raw.match(/"source_ip"\s*:\s*"([^"]+)"/) || raw.match(/"ip"\s*:\s*"([^"]+)"/);
  return m?.[1]?.trim() ?? "";
}
function extractMetaFromSerialized(raw) {
  if (!raw) return { country: "", city: "" };
  const tryParse = () => {
    const t = raw.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) return null;
    try {
      const walk = (v) => {
        if (!v || typeof v !== "object") return null;
        if (Array.isArray(v)) {
          for (const x of v) {
            const hit = walk(x);
            if (hit?.country) return hit;
          }
          return null;
        }
        const o = v;
        const city2 = typeof o.City === "string" ? o.City : typeof o.city === "string" ? o.city : "";
        for (const key of ["IsoCode", "iso_code", "country_code", "CountryCode", "GeoIsoCode", "country"]) {
          const val = o[key];
          if (typeof val === "string" && /^[A-Za-z]{2}$/.test(val.trim())) {
            return { country: val.trim().toUpperCase(), city: city2 };
          }
        }
        for (const val of Object.values(o)) {
          const hit = walk(val);
          if (hit?.country) return hit;
        }
        return city2 ? { country: "", city: city2 } : null;
      };
      return walk(JSON.parse(t));
    } catch {
      return null;
    }
  };
  const parsed = tryParse();
  if (parsed?.country) return parsed;
  const countryPatterns = [
    /"IsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"iso_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"country_code"\s*:\s*"([A-Za-z]{2})"/i,
    /"CountryCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"GeoIsoCode"\s*:\s*"([A-Za-z]{2})"/i,
    /"country"\s*:\s*"([A-Za-z]{2})"/i
  ];
  let country = "";
  for (const re of countryPatterns) {
    const m = raw.match(re);
    if (m?.[1]) {
      country = m[1].toUpperCase();
      break;
    }
  }
  const city = raw.match(/"City"\s*:\s*"([^"]+)"/i)?.[1] ?? raw.match(/"city"\s*:\s*"([^"]+)"/)?.[1] ?? "";
  return { country, city };
}
function parseTimestampValue(v) {
  if (v === null || v === void 0 || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1e3 : v;
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  const s = String(v).trim();
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    const ms = n < 1e12 ? n * 1e3 : n;
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  const d = new Date(s.replace(" ", "T"));
  if (!Number.isNaN(d.getTime())) return d;
  return null;
}
function parseCreatedAt(row) {
  for (const v of [row.created_at, row.started_at, row.stopped_at]) {
    const d = parseTimestampValue(v);
    if (d) return d;
  }
  return null;
}
function pickCol(names, candidates, fallback = "''") {
  for (const c of candidates) {
    if (names.has(c)) return `a.${c}`;
  }
  return fallback;
}
function decisionUntilUnixSecExpr(alias = "d") {
  const col = `${alias}.until`;
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`;
}
function decisionUntilClause(alias = "d") {
  const untilSec = decisionUntilUnixSecExpr(alias);
  return `(${untilSec} IS NOT NULL AND ${untilSec} > CAST(strftime('%s', 'now') AS INTEGER))`;
}
function decisionSchemaMeta(db) {
  const decisionTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='decisions'").all();
  if (decisionTables.length === 0) {
    return {
      hasTable: false,
      linkCol: null,
      hasUntil: false,
      hasValue: false,
      hasScope: false,
      hasSimulated: false
    };
  }
  const dCols = db.prepare("PRAGMA table_info(decisions)").all();
  const dNames = new Set(dCols.map((c) => c.name));
  const linkCol = dNames.has("alert_decisions") ? "alert_decisions" : dNames.has("alert_id") ? "alert_id" : null;
  return {
    hasTable: true,
    linkCol,
    hasUntil: dNames.has("until"),
    hasValue: dNames.has("value"),
    hasScope: dNames.has("scope"),
    hasSimulated: dNames.has("simulated")
  };
}
function activeDecisionWhere(meta) {
  const parts = [];
  if (!meta.hasUntil) return "WHERE 1=0";
  parts.push(decisionUntilClause("d"));
  if (meta.hasSimulated) {
    parts.push(`(d.simulated IS NULL OR d.simulated = 0)`);
  }
  if (meta.hasScope) {
    parts.push(
      `(d.scope IS NULL OR TRIM(CAST(d.scope AS TEXT)) = '' OR LOWER(TRIM(CAST(d.scope AS TEXT))) IN ('ip', 'range'))`
    );
  }
  return `WHERE ${parts.join(" AND ")}`;
}
function loadActiveBannedIpSet(db) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable || !meta.hasValue) return /* @__PURE__ */ new Set();
  const rows = db.prepare(
    `SELECT DISTINCT TRIM(CAST(d.value AS TEXT)) AS ip FROM decisions d ${activeDecisionWhere(meta)}`
  ).all();
  const out = /* @__PURE__ */ new Set();
  for (const r of rows) {
    const ip = r.ip?.trim() ?? "";
    if (isUsableIp(ip)) out.add(ip);
  }
  return out;
}
function loadAlertIdsWithActiveBan(db) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable || !meta.linkCol) return /* @__PURE__ */ new Set();
  const rows = db.prepare(
    `SELECT DISTINCT d.${meta.linkCol} AS alert_id FROM decisions d ${activeDecisionWhere(meta)}`
  ).all();
  const out = /* @__PURE__ */ new Set();
  for (const r of rows) {
    const id = Number(r.alert_id);
    if (Number.isFinite(id) && id > 0) out.add(id);
  }
  return out;
}
function countActiveDecisions(db) {
  const meta = decisionSchemaMeta(db);
  if (!meta.hasTable) return 0;
  const where = meta.hasUntil ? activeDecisionWhere(meta) : "WHERE 1=0";
  const row = db.prepare(`SELECT COUNT(*) AS c FROM decisions d ${where}`).get();
  return Number(row?.c ?? 0);
}
function createdAtUnixSecExpr(alias = "a") {
  const col = `${alias}.created_at`;
  return `CAST(
    CASE
      WHEN ${col} IS NULL OR TRIM(CAST(${col} AS TEXT)) = '' THEN NULL
      WHEN CAST(${col} AS INTEGER) > 10000000000000 THEN CAST(${col} AS INTEGER) / 1000000
      WHEN CAST(${col} AS INTEGER) > 1000000000000 THEN CAST(${col} AS INTEGER) / 1000
      WHEN CAST(${col} AS INTEGER) > 1000000000 THEN CAST(${col} AS INTEGER)
      ELSE strftime('%s', REPLACE(SUBSTR(REPLACE(REPLACE(CAST(${col} AS TEXT), 'T', ' '), 'Z', ''), 1, 19), ' ', 'T'))
    END AS INTEGER
  )`;
}
function countAlertsSince(db, cutoffUnix) {
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("created_at")) return 0;
  const base = "a.scenario IS NOT NULL AND TRIM(a.scenario) != '' AND TRIM(a.scenario) != 'unknown'";
  const ts = createdAtUnixSecExpr("a");
  const row = cutoffUnix > 0 ? db.prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${ts} >= ? AND ${base}`).get(cutoffUnix) : db.prepare(`SELECT COUNT(*) AS c FROM alerts a WHERE ${base}`).get();
  return Number(row?.c ?? 0);
}
function formatAsNumber(v) {
  const s = v.trim();
  if (!s) return "";
  return s.toUpperCase().startsWith("AS") ? s.toUpperCase() : `AS${s}`;
}
function formatIpRange(ip, range) {
  const r = range?.trim();
  if (r && r.includes("/")) return r;
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  return "";
}
function cleanScenario(s) {
  return s.replace(/^crowdsecurity\//i, "").trim() || "unknown";
}
function resolveCountryFromRow(row, geoip) {
  const scenario = row.scenario ? String(row.scenario).trim() : "";
  if (!scenario || scenario === "unknown") return null;
  let ip = row.ip ? String(row.ip).trim() : "";
  if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized);
  if (!isUsableIp(ip)) return null;
  const meta = extractMetaFromSerialized(row.event_serialized);
  let country = row.country ? String(row.country).trim().toUpperCase() : "";
  if (!country || country === "??") country = meta.country || "";
  const geo = applyGeoipToCountry(ip, country, meta.city, geoip);
  country = geo.country;
  if (!country || country === "??") return null;
  return country;
}
function countriesFromRows(rows, geoip) {
  const countryMap = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const country = resolveCountryFromRow(row, geoip);
    if (!country) continue;
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }
  return [...countryMap.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count);
}
function loadCountriesFromDatabase(db, geoip) {
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  const countryCol = names.has("source_country") ? "a.source_country" : names.has("country") ? "a.country" : null;
  if (countryCol) {
    const rows2 = db.prepare(
      `SELECT UPPER(TRIM(CAST(${countryCol} AS TEXT))) AS country, COUNT(*) AS count
         FROM alerts a
         WHERE TRIM(COALESCE(a.scenario, '')) != '' AND TRIM(a.scenario) != 'unknown'
           AND TRIM(COALESCE(${countryCol}, '')) != ''
           AND UPPER(TRIM(CAST(${countryCol} AS TEXT))) != '??'
         GROUP BY country
         HAVING country != ''
         ORDER BY count DESC`
    ).all();
    return rows2.map((r) => ({ country: r.country, count: Number(r.count) }));
  }
  const cutoff90 = Math.floor((Date.now() - 90 * 864e5) / 1e3);
  const { sql, params } = buildAlertsSql(db, cutoff90, { includeEvents: false });
  const rows = db.prepare(`${sql}
LIMIT 15000`).all(...params);
  return countriesFromRows(rows, geoip);
}
function buildAlertsSql(db, cutoffUnix, opts = {}) {
  const includeEvents = opts.includeEvents !== false;
  const cols = db.prepare("PRAGMA table_info(alerts)").all();
  const names = new Set(cols.map((c) => c.name));
  const ipParts = [];
  if (names.has("source_ip")) ipParts.push("a.source_ip");
  if (names.has("source_value")) ipParts.push("a.source_value");
  const ipExpr = ipParts.length ? `COALESCE(${ipParts.join(", ")})` : "''";
  const countryCol = pickCol(names, ["source_country", "country"]);
  const asNameCol = pickCol(names, ["source_as_name", "as_name"]);
  const asNumCol = pickCol(names, ["source_as_number", "as_number"]);
  const rangeCol = pickCol(names, ["source_range", "ip_range"]);
  const latCol = pickCol(names, ["source_latitude", "latitude"], "0");
  const lonCol = pickCol(names, ["source_longitude", "longitude"], "0");
  const startedCol = names.has("started_at") ? "a.started_at" : "NULL";
  const stoppedCol = names.has("stopped_at") ? "a.stopped_at" : "NULL";
  const eventTables = includeEvents ? db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").all() : [];
  const eventSerializedExpr = eventTables.length > 0 ? `(SELECT e.serialized FROM events e WHERE e.alert_events = a.id ORDER BY e.id DESC LIMIT 1)` : "NULL";
  const whereParts = ["TRIM(COALESCE(a.scenario, '')) != ''", "TRIM(a.scenario) != 'unknown'"];
  const params = [];
  if (cutoffUnix > 0) {
    whereParts.unshift(`${createdAtUnixSecExpr("a")} >= ?`);
    params.push(cutoffUnix);
  }
  const sql = `
SELECT
  a.id,
  a.scenario,
  ${ipExpr} AS ip,
  ${countryCol} AS country,
  ${asNameCol} AS as_name,
  ${asNumCol} AS as_number,
  ${rangeCol} AS ip_range,
  ${latCol} AS latitude,
  ${lonCol} AS longitude,
  a.created_at,
  ${startedCol} AS started_at,
  ${stoppedCol} AS stopped_at,
  ${eventSerializedExpr} AS event_serialized
FROM alerts a
WHERE ${whereParts.join(" AND ")}
ORDER BY a.created_at DESC
`;
  return { sql, params };
}
var ALLOWED_DB_ROOTS = () => {
  const roots = [
    path2.resolve(process.env.CROWDSEC_DATA_DIR || "/crowdsec-data"),
    path2.resolve("/crowdsec-data")
  ];
  if (process.env.SELFDASHBOARD_DATA_DIR) {
    roots.push(path2.resolve(process.env.SELFDASHBOARD_DATA_DIR));
  }
  return [...new Set(roots)];
};
function resolveCrowdsecDbPath(userPath) {
  const trimmed = userPath.trim() || "/crowdsec-data/crowdsec.db";
  const resolved = path2.resolve(trimmed);
  const allowed = ALLOWED_DB_ROOTS().some(
    (root) => resolved === root || resolved.startsWith(`${root}${path2.sep}`)
  );
  if (!allowed) throw new Error("db_path_not_allowed");
  if (!fs2.existsSync(resolved)) throw new Error("db_not_found");
  if (!fs2.statSync(resolved).isFile()) throw new Error("db_not_a_file");
  return resolved;
}
var dashboardInflight = null;
var dashboardInflightKey = "";
async function loadCrowdsecDashboard(dbPath, opts = {}) {
  const key = `${dbPath}|${opts.daysBack ?? 30}|${opts.maxAlerts ?? 2e3}`;
  if (dashboardInflight && dashboardInflightKey === key) return dashboardInflight;
  dashboardInflightKey = key;
  dashboardInflight = loadCrowdsecDashboardInner(dbPath, opts).finally(() => {
    dashboardInflight = null;
    dashboardInflightKey = "";
  });
  return dashboardInflight;
}
async function loadCrowdsecDashboardInner(dbPath, opts = {}) {
  const daysBackRaw = opts.daysBack ?? 30;
  const daysBack = daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, daysBackRaw));
  const maxAlertsRaw = opts.maxAlerts ?? 2e3;
  const maxAlerts = maxAlertsRaw === 0 ? 0 : Math.min(5e4, Math.max(50, maxAlertsRaw));
  const cutoffUnix = daysBack === 0 ? 0 : Math.floor((Date.now() - daysBack * 864e5) / 1e3);
  const geoip = await createGeoipLookup();
  const db = new import_better_sqlite3.default(dbPath, { readonly: true, fileMustExist: true });
  try {
    const alertsInRange = countAlertsSince(db, cutoffUnix);
    const alertsLast24h = alertsInRange;
    const activeBans = countActiveDecisions(db);
    const bannedIps = loadActiveBannedIpSet(db);
    const bannedAlertIds = loadAlertIdsWithActiveBan(db);
    const { sql, params } = buildAlertsSql(db, cutoffUnix);
    const rows = maxAlerts > 0 ? db.prepare(`${sql}
LIMIT ?`).all(...params, maxAlerts) : db.prepare(sql).all(...params);
    const feed = [];
    const feedSeen = /* @__PURE__ */ new Set();
    const scenarios = /* @__PURE__ */ new Set();
    for (const row of rows) {
      const scenario = row.scenario ? String(row.scenario).trim() : "";
      if (!scenario || scenario === "unknown") continue;
      let ip = row.ip ? String(row.ip).trim() : "";
      if (!isUsableIp(ip)) ip = extractIpFromSerialized(row.event_serialized);
      if (!isUsableIp(ip)) continue;
      const dt = parseCreatedAt(row);
      if (!dt) continue;
      const meta = extractMetaFromSerialized(row.event_serialized);
      let country = row.country ? String(row.country).trim().toUpperCase() : "";
      if (!country || country === "??") country = meta.country || "";
      let city = meta.city;
      const geo = applyGeoipToCountry(ip, country, city, geoip);
      country = geo.country;
      city = geo.city;
      const isBan = bannedAlertIds.has(row.id) || bannedIps.has(ip);
      scenarios.add(cleanScenario(scenario));
      const feedKey = `${row.id}|${ip}`;
      if (!feedSeen.has(feedKey)) {
        feedSeen.add(feedKey);
        feed.push({
          alertId: row.id,
          ip,
          country,
          city,
          scenario: cleanScenario(scenario),
          time_iso: dt.toISOString(),
          asname: row.as_name ? String(row.as_name) : "",
          asnumber: formatAsNumber(row.as_number != null ? String(row.as_number) : ""),
          iprange: formatIpRange(ip, row.ip_range),
          active_ban: isBan
        });
      }
    }
    const countries = loadCountriesFromDatabase(db, geoip);
    return {
      feed,
      alertsInRange,
      alertsLast24h,
      activeBans,
      countryCount: countries.length,
      scenarioCount: scenarios.size,
      countries,
      geoip: {
        enabled: Boolean(geoip),
        path: geoip?.dbPath ?? null
      }
    };
  } finally {
    db.close();
  }
}

// plugins/crowdsec/server.ts
async function handleDashboardGet(req) {
  const sp = new URL(req.url).searchParams;
  const dbPath = sp.get("dbPath")?.trim() || process.env.CROWDSEC_DB_PATH || "/crowdsec-data/crowdsec.db";
  const daysBackRaw = Number(sp.get("daysBack") ?? 30);
  const daysBack = daysBackRaw === 0 ? 0 : Math.min(3650, Math.max(1, Number.isFinite(daysBackRaw) ? daysBackRaw : 30));
  const maxAlertsRaw = Number(sp.get("maxAlerts") ?? 500);
  const maxAlerts = maxAlertsRaw === 0 ? 0 : Math.min(2e3, Math.max(50, Number.isFinite(maxAlertsRaw) ? maxAlertsRaw : 500));
  const timeoutMs = Math.min(12e4, Math.max(15e3, Number(process.env.CROWDSEC_QUERY_TIMEOUT_MS) || 45e3));
  try {
    const resolved = resolveCrowdsecDbPath(dbPath);
    const data = await Promise.race([
      loadCrowdsecDashboard(resolved, { daysBack, maxAlerts }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("crowdsec_timeout")), timeoutMs);
      })
    ]);
    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "crowdsec_error";
    const status = msg === "crowdsec_timeout" ? 504 : msg === "missing_db_path" || msg === "db_not_found" || msg === "db_not_a_file" ? 404 : msg === "db_path_not_allowed" ? 403 : msg === "db_schema_unsupported" ? 422 : 502;
    void logPluginApiFailure("crowdsec", "dashboard", msg, { dbPath, status });
    return Response.json({ error: msg }, { status });
  }
}
async function handleDecisionPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? body : {};
  const ip = typeof o.ip === "string" ? o.ip.trim() : "";
  const container = typeof o.container === "string" && o.container.trim() ? o.container.trim() : process.env.CROWDSEC_CONTAINER || "crowdsec";
  if (!ip) return Response.json({ error: "missing_ip" }, { status: 400 });
  try {
    await crowdsecUnbanIp(container, ip);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "delete_failed";
    const status = msg === "docker_unavailable" || msg === "crowdsec_container_not_found" ? 503 : msg === "invalid_ip" ? 400 : 502;
    return Response.json({ error: msg }, { status });
  }
}
async function crowdsecServerHandler(ctx) {
  const [seg] = ctx.path;
  const method = ctx.request.method.toUpperCase();
  if ((seg === "decision" || seg === "decisions") && method === "POST") {
    return handleDecisionPost(ctx.request);
  }
  if (method === "GET" && (!seg || seg === "dashboard")) {
    return handleDashboardGet(ctx.request);
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: ctx.path.join("/") },
    { status: 404 }
  );
}
var server_default = crowdsecServerHandler;
export {
  crowdsecServerHandler,
  server_default as default
};
/*! Bundled license information:

tiny-lru/dist/tiny-lru.cjs:
  (**
   * tiny-lru
   *
   * @copyright 2025 Jason Mulligan <jason.mulligan@avoidwork.com>
   * @license BSD-3-Clause
   * @version 11.3.4
   *)
*/
