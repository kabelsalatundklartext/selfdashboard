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

// node_modules/rrule/dist/es5/rrule.js
var require_rrule = __commonJS({
  "node_modules/rrule/dist/es5/rrule.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory();
      else if (typeof define === "function" && define.amd)
        define([], factory);
      else if (typeof exports === "object")
        exports["rrule"] = factory();
      else
        root["rrule"] = factory();
    })(typeof self !== "undefined" ? self : exports, () => {
      return (
        /******/
        (() => {
          "use strict";
          var __webpack_require__ = {};
          (() => {
            __webpack_require__.d = (exports2, definition) => {
              for (var key in definition) {
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports2, key)) {
                  Object.defineProperty(exports2, key, { enumerable: true, get: definition[key] });
                }
              }
            };
          })();
          (() => {
            __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
          })();
          (() => {
            __webpack_require__.r = (exports2) => {
              if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
              }
              Object.defineProperty(exports2, "__esModule", { value: true });
            };
          })();
          var __webpack_exports__ = {};
          __webpack_require__.r(__webpack_exports__);
          __webpack_require__.d(__webpack_exports__, {
            "ALL_WEEKDAYS": () => (
              /* reexport */
              ALL_WEEKDAYS
            ),
            "Frequency": () => (
              /* reexport */
              Frequency
            ),
            "RRule": () => (
              /* reexport */
              RRule2
            ),
            "RRuleSet": () => (
              /* reexport */
              RRuleSet
            ),
            "Weekday": () => (
              /* reexport */
              Weekday
            ),
            "datetime": () => (
              /* reexport */
              datetime
            ),
            "rrulestr": () => (
              /* reexport */
              rrulestr2
            )
          });
          ;
          var ALL_WEEKDAYS = [
            "MO",
            "TU",
            "WE",
            "TH",
            "FR",
            "SA",
            "SU"
          ];
          var Weekday = (
            /** @class */
            (function() {
              function Weekday2(weekday, n) {
                if (n === 0)
                  throw new Error("Can't create weekday with n == 0");
                this.weekday = weekday;
                this.n = n;
              }
              Weekday2.fromStr = function(str) {
                return new Weekday2(ALL_WEEKDAYS.indexOf(str));
              };
              Weekday2.prototype.nth = function(n) {
                return this.n === n ? this : new Weekday2(this.weekday, n);
              };
              Weekday2.prototype.equals = function(other) {
                return this.weekday === other.weekday && this.n === other.n;
              };
              Weekday2.prototype.toString = function() {
                var s = ALL_WEEKDAYS[this.weekday];
                if (this.n)
                  s = (this.n > 0 ? "+" : "") + String(this.n) + s;
                return s;
              };
              Weekday2.prototype.getJsWeekday = function() {
                return this.weekday === 6 ? 0 : this.weekday + 1;
              };
              return Weekday2;
            })()
          );
          ;
          var isPresent = function(value) {
            return value !== null && value !== void 0;
          };
          var isNumber = function(value) {
            return typeof value === "number";
          };
          var isWeekdayStr = function(value) {
            return typeof value === "string" && ALL_WEEKDAYS.includes(value);
          };
          var isArray = Array.isArray;
          var range = function(start, end) {
            if (end === void 0) {
              end = start;
            }
            if (arguments.length === 1) {
              end = start;
              start = 0;
            }
            var rang = [];
            for (var i = start; i < end; i++)
              rang.push(i);
            return rang;
          };
          var clone2 = function(array) {
            return [].concat(array);
          };
          var repeat = function(value, times) {
            var i = 0;
            var array = [];
            if (isArray(value)) {
              for (; i < times; i++)
                array[i] = [].concat(value);
            } else {
              for (; i < times; i++)
                array[i] = value;
            }
            return array;
          };
          var toArray = function(item) {
            if (isArray(item)) {
              return item;
            }
            return [item];
          };
          function padStart(item, targetLength, padString) {
            if (padString === void 0) {
              padString = " ";
            }
            var str = String(item);
            targetLength = targetLength >> 0;
            if (str.length > targetLength) {
              return String(str);
            }
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
              padString += repeat(padString, targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(str);
          }
          var split = function(str, sep, num) {
            var splits = str.split(sep);
            return num ? splits.slice(0, num).concat([splits.slice(num).join(sep)]) : splits;
          };
          var pymod = function(a, b) {
            var r = a % b;
            return r * b < 0 ? r + b : r;
          };
          var divmod = function(a, b) {
            return { div: Math.floor(a / b), mod: pymod(a, b) };
          };
          var empty = function(obj) {
            return !isPresent(obj) || obj.length === 0;
          };
          var notEmpty = function(obj) {
            return !empty(obj);
          };
          var includes = function(arr, val) {
            return notEmpty(arr) && arr.indexOf(val) !== -1;
          };
          ;
          var datetime = function(y, m, d, h, i, s) {
            if (h === void 0) {
              h = 0;
            }
            if (i === void 0) {
              i = 0;
            }
            if (s === void 0) {
              s = 0;
            }
            return new Date(Date.UTC(y, m - 1, d, h, i, s));
          };
          var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          var ONE_DAY = 1e3 * 60 * 60 * 24;
          var MAXYEAR = 9999;
          var ORDINAL_BASE = datetime(1970, 1, 1);
          var PY_WEEKDAYS = [6, 0, 1, 2, 3, 4, 5];
          var getYearDay = function(date) {
            var dateNoTime = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return Math.ceil((dateNoTime.valueOf() - new Date(date.getUTCFullYear(), 0, 1).valueOf()) / ONE_DAY) + 1;
          };
          var isLeapYear = function(year) {
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
          };
          var isDate = function(value) {
            return value instanceof Date;
          };
          var isValidDate = function(value) {
            return isDate(value) && !isNaN(value.getTime());
          };
          var tzOffset = function(date) {
            return date.getTimezoneOffset() * 60 * 1e3;
          };
          var daysBetween = function(date1, date2) {
            var date1ms = date1.getTime();
            var date2ms = date2.getTime();
            var differencems = date1ms - date2ms;
            return Math.round(differencems / ONE_DAY);
          };
          var toOrdinal = function(date) {
            return daysBetween(date, ORDINAL_BASE);
          };
          var fromOrdinal = function(ordinal) {
            return new Date(ORDINAL_BASE.getTime() + ordinal * ONE_DAY);
          };
          var getMonthDays = function(date) {
            var month = date.getUTCMonth();
            return month === 1 && isLeapYear(date.getUTCFullYear()) ? 29 : MONTH_DAYS[month];
          };
          var getWeekday = function(date) {
            return PY_WEEKDAYS[date.getUTCDay()];
          };
          var monthRange = function(year, month) {
            var date = datetime(year, month + 1, 1);
            return [getWeekday(date), getMonthDays(date)];
          };
          var combine = function(date, time) {
            time = time || date;
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()));
          };
          var dateutil_clone = function(date) {
            var dolly = new Date(date.getTime());
            return dolly;
          };
          var cloneDates = function(dates) {
            var clones = [];
            for (var i = 0; i < dates.length; i++) {
              clones.push(dateutil_clone(dates[i]));
            }
            return clones;
          };
          var sort = function(dates) {
            dates.sort(function(a, b) {
              return a.getTime() - b.getTime();
            });
          };
          var timeToUntilString = function(time, utc) {
            if (utc === void 0) {
              utc = true;
            }
            var date = new Date(time);
            return [
              padStart(date.getUTCFullYear().toString(), 4, "0"),
              padStart(date.getUTCMonth() + 1, 2, "0"),
              padStart(date.getUTCDate(), 2, "0"),
              "T",
              padStart(date.getUTCHours(), 2, "0"),
              padStart(date.getUTCMinutes(), 2, "0"),
              padStart(date.getUTCSeconds(), 2, "0"),
              utc ? "Z" : ""
            ].join("");
          };
          var untilStringToDate = function(until) {
            var re = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/;
            var bits = re.exec(until);
            if (!bits)
              throw new Error("Invalid UNTIL value: ".concat(until));
            return new Date(Date.UTC(parseInt(bits[1], 10), parseInt(bits[2], 10) - 1, parseInt(bits[3], 10), parseInt(bits[5], 10) || 0, parseInt(bits[6], 10) || 0, parseInt(bits[7], 10) || 0));
          };
          var dateTZtoISO8601 = function(date, timeZone) {
            var dateStr = date.toLocaleString("sv-SE", { timeZone });
            return dateStr.replace(" ", "T") + "Z";
          };
          var dateInTimeZone = function(date, timeZone) {
            var localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            var dateInLocalTZ = new Date(dateTZtoISO8601(date, localTimeZone));
            var dateInTargetTZ = new Date(dateTZtoISO8601(date, timeZone !== null && timeZone !== void 0 ? timeZone : "UTC"));
            var tzOffset2 = dateInTargetTZ.getTime() - dateInLocalTZ.getTime();
            return new Date(date.getTime() - tzOffset2);
          };
          ;
          var IterResult = (
            /** @class */
            (function() {
              function IterResult2(method, args) {
                this.minDate = null;
                this.maxDate = null;
                this._result = [];
                this.total = 0;
                this.method = method;
                this.args = args;
                if (method === "between") {
                  this.maxDate = args.inc ? args.before : new Date(args.before.getTime() - 1);
                  this.minDate = args.inc ? args.after : new Date(args.after.getTime() + 1);
                } else if (method === "before") {
                  this.maxDate = args.inc ? args.dt : new Date(args.dt.getTime() - 1);
                } else if (method === "after") {
                  this.minDate = args.inc ? args.dt : new Date(args.dt.getTime() + 1);
                }
              }
              IterResult2.prototype.accept = function(date) {
                ++this.total;
                var tooEarly = this.minDate && date < this.minDate;
                var tooLate = this.maxDate && date > this.maxDate;
                if (this.method === "between") {
                  if (tooEarly)
                    return true;
                  if (tooLate)
                    return false;
                } else if (this.method === "before") {
                  if (tooLate)
                    return false;
                } else if (this.method === "after") {
                  if (tooEarly)
                    return true;
                  this.add(date);
                  return false;
                }
                return this.add(date);
              };
              IterResult2.prototype.add = function(date) {
                this._result.push(date);
                return true;
              };
              IterResult2.prototype.getValue = function() {
                var res = this._result;
                switch (this.method) {
                  case "all":
                  case "between":
                    return res;
                  case "before":
                  case "after":
                  default:
                    return res.length ? res[res.length - 1] : null;
                }
              };
              IterResult2.prototype.clone = function() {
                return new IterResult2(this.method, this.args);
              };
              return IterResult2;
            })()
          );
          const iterresult = IterResult;
          ;
          var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
              d2.__proto__ = b2;
            } || function(d2, b2) {
              for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
            };
            return extendStatics(d, b);
          };
          function __extends(d, b) {
            if (typeof b !== "function" && b !== null)
              throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() {
              this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
          }
          var __assign = function() {
            __assign = Object.assign || function __assign2(t) {
              for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
              }
              return t;
            };
            return __assign.apply(this, arguments);
          };
          function __rest(s, e) {
            var t = {};
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
              t[p] = s[p];
            if (s != null && typeof Object.getOwnPropertySymbols === "function")
              for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
              }
            return t;
          }
          function __decorate(decorators, target, key, desc) {
            var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
            if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
            else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            return c > 3 && r && Object.defineProperty(target, key, r), r;
          }
          function __param(paramIndex, decorator) {
            return function(target, key) {
              decorator(target, key, paramIndex);
            };
          }
          function __metadata(metadataKey, metadataValue) {
            if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
          }
          function __awaiter(thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P ? value : new P(function(resolve) {
                resolve(value);
              });
            }
            return new (P || (P = Promise))(function(resolve, reject) {
              function fulfilled(value) {
                try {
                  step(generator.next(value));
                } catch (e) {
                  reject(e);
                }
              }
              function rejected(value) {
                try {
                  step(generator["throw"](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
              }
              step((generator = generator.apply(thisArg, _arguments || [])).next());
            });
          }
          function __generator(thisArg, body) {
            var _ = { label: 0, sent: function() {
              if (t[0] & 1) throw t[1];
              return t[1];
            }, trys: [], ops: [] }, f, y, t, g;
            return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
              return this;
            }), g;
            function verb(n) {
              return function(v) {
                return step([n, v]);
              };
            }
            function step(op) {
              if (f) throw new TypeError("Generator is already executing.");
              while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                  case 0:
                  case 1:
                    t = op;
                    break;
                  case 4:
                    _.label++;
                    return { value: op[1], done: false };
                  case 5:
                    _.label++;
                    y = op[1];
                    op = [0];
                    continue;
                  case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                  default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                      _ = 0;
                      continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                      _.label = op[1];
                      break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                      _.label = t[1];
                      t = op;
                      break;
                    }
                    if (t && _.label < t[2]) {
                      _.label = t[2];
                      _.ops.push(op);
                      break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
                }
                op = body.call(thisArg, _);
              } catch (e) {
                op = [6, e];
                y = 0;
              } finally {
                f = t = 0;
              }
              if (op[0] & 5) throw op[1];
              return { value: op[0] ? op[1] : void 0, done: true };
            }
          }
          var __createBinding = Object.create ? (function(o, m, k, k2) {
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
          });
          function __exportStar(m, o) {
            for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
          }
          function __values(o) {
            var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
            if (m) return m.call(o);
            if (o && typeof o.length === "number") return {
              next: function() {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
              }
            };
            throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
          }
          function __read(o, n) {
            var m = typeof Symbol === "function" && o[Symbol.iterator];
            if (!m) return o;
            var i = m.call(o), r, ar = [], e;
            try {
              while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
            } catch (error) {
              e = { error };
            } finally {
              try {
                if (r && !r.done && (m = i["return"])) m.call(i);
              } finally {
                if (e) throw e.error;
              }
            }
            return ar;
          }
          function __spread() {
            for (var ar = [], i = 0; i < arguments.length; i++)
              ar = ar.concat(__read(arguments[i]));
            return ar;
          }
          function __spreadArrays() {
            for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
            for (var r = Array(s), k = 0, i = 0; i < il; i++)
              for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
            return r;
          }
          function __spreadArray(to, from, pack) {
            if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
              if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
              }
            }
            return to.concat(ar || Array.prototype.slice.call(from));
          }
          function __await(v) {
            return this instanceof __await ? (this.v = v, this) : new __await(v);
          }
          function __asyncGenerator(thisArg, _arguments, generator) {
            if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
            var g = generator.apply(thisArg, _arguments || []), i, q = [];
            return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
              return this;
            }, i;
            function verb(n) {
              if (g[n]) i[n] = function(v) {
                return new Promise(function(a, b) {
                  q.push([n, v, a, b]) > 1 || resume(n, v);
                });
              };
            }
            function resume(n, v) {
              try {
                step(g[n](v));
              } catch (e) {
                settle(q[0][3], e);
              }
            }
            function step(r) {
              r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
            }
            function fulfill(value) {
              resume("next", value);
            }
            function reject(value) {
              resume("throw", value);
            }
            function settle(f, v) {
              if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
            }
          }
          function __asyncDelegator(o) {
            var i, p;
            return i = {}, verb("next"), verb("throw", function(e) {
              throw e;
            }), verb("return"), i[Symbol.iterator] = function() {
              return this;
            }, i;
            function verb(n, f) {
              i[n] = o[n] ? function(v) {
                return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v;
              } : f;
            }
          }
          function __asyncValues(o) {
            if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
            var m = o[Symbol.asyncIterator], i;
            return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
              return this;
            }, i);
            function verb(n) {
              i[n] = o[n] && function(v) {
                return new Promise(function(resolve, reject) {
                  v = o[n](v), settle(resolve, reject, v.done, v.value);
                });
              };
            }
            function settle(resolve, reject, d, v) {
              Promise.resolve(v).then(function(v2) {
                resolve({ value: v2, done: d });
              }, reject);
            }
          }
          function __makeTemplateObject(cooked, raw) {
            if (Object.defineProperty) {
              Object.defineProperty(cooked, "raw", { value: raw });
            } else {
              cooked.raw = raw;
            }
            return cooked;
          }
          ;
          var __setModuleDefault = Object.create ? (function(o, v) {
            Object.defineProperty(o, "default", { enumerable: true, value: v });
          }) : function(o, v) {
            o["default"] = v;
          };
          function __importStar(mod) {
            if (mod && mod.__esModule) return mod;
            var result = {};
            if (mod != null) {
              for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
            }
            __setModuleDefault(result, mod);
            return result;
          }
          function __importDefault(mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          }
          function __classPrivateFieldGet(receiver, state, kind, f) {
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
            return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
          }
          function __classPrivateFieldSet(receiver, state, value, kind, f) {
            if (kind === "m") throw new TypeError("Private method is not writable");
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
            return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
          }
          function __classPrivateFieldIn(state, receiver) {
            if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
            return typeof state === "function" ? receiver === state : state.has(receiver);
          }
          ;
          var CallbackIterResult = (
            /** @class */
            (function(_super) {
              __extends(CallbackIterResult2, _super);
              function CallbackIterResult2(method, args, iterator) {
                var _this = _super.call(this, method, args) || this;
                _this.iterator = iterator;
                return _this;
              }
              CallbackIterResult2.prototype.add = function(date) {
                if (this.iterator(date, this._result.length)) {
                  this._result.push(date);
                  return true;
                }
                return false;
              };
              return CallbackIterResult2;
            })(iterresult)
          );
          const callbackiterresult = CallbackIterResult;
          ;
          var ENGLISH = {
            dayNames: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            monthNames: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December"
            ],
            tokens: {
              SKIP: /^[ \r\n\t]+|^\.$/,
              number: /^[1-9][0-9]*/,
              numberAsText: /^(one|two|three)/i,
              every: /^every/i,
              "day(s)": /^days?/i,
              "weekday(s)": /^weekdays?/i,
              "week(s)": /^weeks?/i,
              "hour(s)": /^hours?/i,
              "minute(s)": /^minutes?/i,
              "month(s)": /^months?/i,
              "year(s)": /^years?/i,
              on: /^(on|in)/i,
              at: /^(at)/i,
              the: /^the/i,
              first: /^first/i,
              second: /^second/i,
              third: /^third/i,
              nth: /^([1-9][0-9]*)(\.|th|nd|rd|st)/i,
              last: /^last/i,
              for: /^for/i,
              "time(s)": /^times?/i,
              until: /^(un)?til/i,
              monday: /^mo(n(day)?)?/i,
              tuesday: /^tu(e(s(day)?)?)?/i,
              wednesday: /^we(d(n(esday)?)?)?/i,
              thursday: /^th(u(r(sday)?)?)?/i,
              friday: /^fr(i(day)?)?/i,
              saturday: /^sa(t(urday)?)?/i,
              sunday: /^su(n(day)?)?/i,
              january: /^jan(uary)?/i,
              february: /^feb(ruary)?/i,
              march: /^mar(ch)?/i,
              april: /^apr(il)?/i,
              may: /^may/i,
              june: /^june?/i,
              july: /^july?/i,
              august: /^aug(ust)?/i,
              september: /^sep(t(ember)?)?/i,
              october: /^oct(ober)?/i,
              november: /^nov(ember)?/i,
              december: /^dec(ember)?/i,
              comma: /^(,\s*|(and|or)\s*)+/i
            }
          };
          const i18n = ENGLISH;
          ;
          var contains = function(arr, val) {
            return arr.indexOf(val) !== -1;
          };
          var defaultGetText = function(id) {
            return id.toString();
          };
          var defaultDateFormatter = function(year, month, day) {
            return "".concat(month, " ").concat(day, ", ").concat(year);
          };
          var ToText = (
            /** @class */
            (function() {
              function ToText2(rrule, gettext, language, dateFormatter) {
                if (gettext === void 0) {
                  gettext = defaultGetText;
                }
                if (language === void 0) {
                  language = i18n;
                }
                if (dateFormatter === void 0) {
                  dateFormatter = defaultDateFormatter;
                }
                this.text = [];
                this.language = language || i18n;
                this.gettext = gettext;
                this.dateFormatter = dateFormatter;
                this.rrule = rrule;
                this.options = rrule.options;
                this.origOptions = rrule.origOptions;
                if (this.origOptions.bymonthday) {
                  var bymonthday = [].concat(this.options.bymonthday);
                  var bynmonthday = [].concat(this.options.bynmonthday);
                  bymonthday.sort(function(a, b) {
                    return a - b;
                  });
                  bynmonthday.sort(function(a, b) {
                    return b - a;
                  });
                  this.bymonthday = bymonthday.concat(bynmonthday);
                  if (!this.bymonthday.length)
                    this.bymonthday = null;
                }
                if (isPresent(this.origOptions.byweekday)) {
                  var byweekday = !isArray(this.origOptions.byweekday) ? [this.origOptions.byweekday] : this.origOptions.byweekday;
                  var days = String(byweekday);
                  this.byweekday = {
                    allWeeks: byweekday.filter(function(weekday) {
                      return !weekday.n;
                    }),
                    someWeeks: byweekday.filter(function(weekday) {
                      return Boolean(weekday.n);
                    }),
                    isWeekdays: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") === -1 && days.indexOf("SU") === -1,
                    isEveryDay: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") !== -1 && days.indexOf("SU") !== -1
                  };
                  var sortWeekDays = function(a, b) {
                    return a.weekday - b.weekday;
                  };
                  this.byweekday.allWeeks.sort(sortWeekDays);
                  this.byweekday.someWeeks.sort(sortWeekDays);
                  if (!this.byweekday.allWeeks.length)
                    this.byweekday.allWeeks = null;
                  if (!this.byweekday.someWeeks.length)
                    this.byweekday.someWeeks = null;
                } else {
                  this.byweekday = null;
                }
              }
              ToText2.isFullyConvertible = function(rrule) {
                var canConvert = true;
                if (!(rrule.options.freq in ToText2.IMPLEMENTED))
                  return false;
                if (rrule.origOptions.until && rrule.origOptions.count)
                  return false;
                for (var key in rrule.origOptions) {
                  if (contains(["dtstart", "tzid", "wkst", "freq"], key))
                    return true;
                  if (!contains(ToText2.IMPLEMENTED[rrule.options.freq], key))
                    return false;
                }
                return canConvert;
              };
              ToText2.prototype.isFullyConvertible = function() {
                return ToText2.isFullyConvertible(this.rrule);
              };
              ToText2.prototype.toString = function() {
                var gettext = this.gettext;
                if (!(this.options.freq in ToText2.IMPLEMENTED)) {
                  return gettext("RRule error: Unable to fully convert this rrule to text");
                }
                this.text = [gettext("every")];
                this[RRule2.FREQUENCIES[this.options.freq]]();
                if (this.options.until) {
                  this.add(gettext("until"));
                  var until = this.options.until;
                  this.add(this.dateFormatter(until.getUTCFullYear(), this.language.monthNames[until.getUTCMonth()], until.getUTCDate()));
                } else if (this.options.count) {
                  this.add(gettext("for")).add(this.options.count.toString()).add(this.plural(this.options.count) ? gettext("times") : gettext("time"));
                }
                if (!this.isFullyConvertible())
                  this.add(gettext("(~ approximate)"));
                return this.text.join("");
              };
              ToText2.prototype.HOURLY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                this.add(this.plural(this.options.interval) ? gettext("hours") : gettext("hour"));
              };
              ToText2.prototype.MINUTELY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                this.add(this.plural(this.options.interval) ? gettext("minutes") : gettext("minute"));
              };
              ToText2.prototype.DAILY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                if (this.byweekday && this.byweekday.isWeekdays) {
                  this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
                } else {
                  this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
                }
                if (this.origOptions.bymonth) {
                  this.add(gettext("in"));
                  this._bymonth();
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday) {
                  this._byweekday();
                } else if (this.origOptions.byhour) {
                  this._byhour();
                }
              };
              ToText2.prototype.WEEKLY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1) {
                  this.add(this.options.interval.toString()).add(this.plural(this.options.interval) ? gettext("weeks") : gettext("week"));
                }
                if (this.byweekday && this.byweekday.isWeekdays) {
                  if (this.options.interval === 1) {
                    this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
                  } else {
                    this.add(gettext("on")).add(gettext("weekdays"));
                  }
                } else if (this.byweekday && this.byweekday.isEveryDay) {
                  this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
                } else {
                  if (this.options.interval === 1)
                    this.add(gettext("week"));
                  if (this.origOptions.bymonth) {
                    this.add(gettext("in"));
                    this._bymonth();
                  }
                  if (this.bymonthday) {
                    this._bymonthday();
                  } else if (this.byweekday) {
                    this._byweekday();
                  }
                  if (this.origOptions.byhour) {
                    this._byhour();
                  }
                }
              };
              ToText2.prototype.MONTHLY = function() {
                var gettext = this.gettext;
                if (this.origOptions.bymonth) {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString()).add(gettext("months"));
                    if (this.plural(this.options.interval))
                      this.add(gettext("in"));
                  } else {
                  }
                  this._bymonth();
                } else {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                  }
                  this.add(this.plural(this.options.interval) ? gettext("months") : gettext("month"));
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday && this.byweekday.isWeekdays) {
                  this.add(gettext("on")).add(gettext("weekdays"));
                } else if (this.byweekday) {
                  this._byweekday();
                }
              };
              ToText2.prototype.YEARLY = function() {
                var gettext = this.gettext;
                if (this.origOptions.bymonth) {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                    this.add(gettext("years"));
                  } else {
                  }
                  this._bymonth();
                } else {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                  }
                  this.add(this.plural(this.options.interval) ? gettext("years") : gettext("year"));
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday) {
                  this._byweekday();
                }
                if (this.options.byyearday) {
                  this.add(gettext("on the")).add(this.list(this.options.byyearday, this.nth, gettext("and"))).add(gettext("day"));
                }
                if (this.options.byweekno) {
                  this.add(gettext("in")).add(this.plural(this.options.byweekno.length) ? gettext("weeks") : gettext("week")).add(this.list(this.options.byweekno, void 0, gettext("and")));
                }
              };
              ToText2.prototype._bymonthday = function() {
                var gettext = this.gettext;
                if (this.byweekday && this.byweekday.allWeeks) {
                  this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext, gettext("or"))).add(gettext("the")).add(this.list(this.bymonthday, this.nth, gettext("or")));
                } else {
                  this.add(gettext("on the")).add(this.list(this.bymonthday, this.nth, gettext("and")));
                }
              };
              ToText2.prototype._byweekday = function() {
                var gettext = this.gettext;
                if (this.byweekday.allWeeks && !this.byweekday.isWeekdays) {
                  this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext));
                }
                if (this.byweekday.someWeeks) {
                  if (this.byweekday.allWeeks)
                    this.add(gettext("and"));
                  this.add(gettext("on the")).add(this.list(this.byweekday.someWeeks, this.weekdaytext, gettext("and")));
                }
              };
              ToText2.prototype._byhour = function() {
                var gettext = this.gettext;
                this.add(gettext("at")).add(this.list(this.origOptions.byhour, void 0, gettext("and")));
              };
              ToText2.prototype._bymonth = function() {
                this.add(this.list(this.options.bymonth, this.monthtext, this.gettext("and")));
              };
              ToText2.prototype.nth = function(n) {
                n = parseInt(n.toString(), 10);
                var nth;
                var gettext = this.gettext;
                if (n === -1)
                  return gettext("last");
                var npos = Math.abs(n);
                switch (npos) {
                  case 1:
                  case 21:
                  case 31:
                    nth = npos + gettext("st");
                    break;
                  case 2:
                  case 22:
                    nth = npos + gettext("nd");
                    break;
                  case 3:
                  case 23:
                    nth = npos + gettext("rd");
                    break;
                  default:
                    nth = npos + gettext("th");
                }
                return n < 0 ? nth + " " + gettext("last") : nth;
              };
              ToText2.prototype.monthtext = function(m) {
                return this.language.monthNames[m - 1];
              };
              ToText2.prototype.weekdaytext = function(wday) {
                var weekday = isNumber(wday) ? (wday + 1) % 7 : wday.getJsWeekday();
                return (wday.n ? this.nth(wday.n) + " " : "") + this.language.dayNames[weekday];
              };
              ToText2.prototype.plural = function(n) {
                return n % 100 !== 1;
              };
              ToText2.prototype.add = function(s) {
                this.text.push(" ");
                this.text.push(s);
                return this;
              };
              ToText2.prototype.list = function(arr, callback, finalDelim, delim) {
                var _this = this;
                if (delim === void 0) {
                  delim = ",";
                }
                if (!isArray(arr)) {
                  arr = [arr];
                }
                var delimJoin = function(array, delimiter, finalDelimiter) {
                  var list = "";
                  for (var i = 0; i < array.length; i++) {
                    if (i !== 0) {
                      if (i === array.length - 1) {
                        list += " " + finalDelimiter + " ";
                      } else {
                        list += delimiter + " ";
                      }
                    }
                    list += array[i];
                  }
                  return list;
                };
                callback = callback || function(o) {
                  return o.toString();
                };
                var realCallback = function(arg) {
                  return callback && callback.call(_this, arg);
                };
                if (finalDelim) {
                  return delimJoin(arr.map(realCallback), delim, finalDelim);
                } else {
                  return arr.map(realCallback).join(delim + " ");
                }
              };
              return ToText2;
            })()
          );
          const totext = ToText;
          ;
          var Parser = (
            /** @class */
            (function() {
              function Parser2(rules) {
                this.done = true;
                this.rules = rules;
              }
              Parser2.prototype.start = function(text) {
                this.text = text;
                this.done = false;
                return this.nextSymbol();
              };
              Parser2.prototype.isDone = function() {
                return this.done && this.symbol === null;
              };
              Parser2.prototype.nextSymbol = function() {
                var best;
                var bestSymbol;
                this.symbol = null;
                this.value = null;
                do {
                  if (this.done)
                    return false;
                  var rule = void 0;
                  best = null;
                  for (var name_1 in this.rules) {
                    rule = this.rules[name_1];
                    var match = rule.exec(this.text);
                    if (match) {
                      if (best === null || match[0].length > best[0].length) {
                        best = match;
                        bestSymbol = name_1;
                      }
                    }
                  }
                  if (best != null) {
                    this.text = this.text.substr(best[0].length);
                    if (this.text === "")
                      this.done = true;
                  }
                  if (best == null) {
                    this.done = true;
                    this.symbol = null;
                    this.value = null;
                    return;
                  }
                } while (bestSymbol === "SKIP");
                this.symbol = bestSymbol;
                this.value = best;
                return true;
              };
              Parser2.prototype.accept = function(name) {
                if (this.symbol === name) {
                  if (this.value) {
                    var v = this.value;
                    this.nextSymbol();
                    return v;
                  }
                  this.nextSymbol();
                  return true;
                }
                return false;
              };
              Parser2.prototype.acceptNumber = function() {
                return this.accept("number");
              };
              Parser2.prototype.expect = function(name) {
                if (this.accept(name))
                  return true;
                throw new Error("expected " + name + " but found " + this.symbol);
              };
              return Parser2;
            })()
          );
          function parseText(text, language) {
            if (language === void 0) {
              language = i18n;
            }
            var options = {};
            var ttr = new Parser(language.tokens);
            if (!ttr.start(text))
              return null;
            S();
            return options;
            function S() {
              ttr.expect("every");
              var n = ttr.acceptNumber();
              if (n)
                options.interval = parseInt(n[0], 10);
              if (ttr.isDone())
                throw new Error("Unexpected end");
              switch (ttr.symbol) {
                case "day(s)":
                  options.freq = RRule2.DAILY;
                  if (ttr.nextSymbol()) {
                    AT();
                    F();
                  }
                  break;
                // FIXME Note: every 2 weekdays != every two weeks on weekdays.
                // DAILY on weekdays is not a valid rule
                case "weekday(s)":
                  options.freq = RRule2.WEEKLY;
                  options.byweekday = [RRule2.MO, RRule2.TU, RRule2.WE, RRule2.TH, RRule2.FR];
                  ttr.nextSymbol();
                  AT();
                  F();
                  break;
                case "week(s)":
                  options.freq = RRule2.WEEKLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    AT();
                    F();
                  }
                  break;
                case "hour(s)":
                  options.freq = RRule2.HOURLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "minute(s)":
                  options.freq = RRule2.MINUTELY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "month(s)":
                  options.freq = RRule2.MONTHLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "year(s)":
                  options.freq = RRule2.YEARLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "monday":
                case "tuesday":
                case "wednesday":
                case "thursday":
                case "friday":
                case "saturday":
                case "sunday":
                  options.freq = RRule2.WEEKLY;
                  var key = ttr.symbol.substr(0, 2).toUpperCase();
                  options.byweekday = [RRule2[key]];
                  if (!ttr.nextSymbol())
                    return;
                  while (ttr.accept("comma")) {
                    if (ttr.isDone())
                      throw new Error("Unexpected end");
                    var wkd = decodeWKD();
                    if (!wkd) {
                      throw new Error("Unexpected symbol " + ttr.symbol + ", expected weekday");
                    }
                    options.byweekday.push(RRule2[wkd]);
                    ttr.nextSymbol();
                  }
                  AT();
                  MDAYs();
                  F();
                  break;
                case "january":
                case "february":
                case "march":
                case "april":
                case "may":
                case "june":
                case "july":
                case "august":
                case "september":
                case "october":
                case "november":
                case "december":
                  options.freq = RRule2.YEARLY;
                  options.bymonth = [decodeM()];
                  if (!ttr.nextSymbol())
                    return;
                  while (ttr.accept("comma")) {
                    if (ttr.isDone())
                      throw new Error("Unexpected end");
                    var m = decodeM();
                    if (!m) {
                      throw new Error("Unexpected symbol " + ttr.symbol + ", expected month");
                    }
                    options.bymonth.push(m);
                    ttr.nextSymbol();
                  }
                  ON();
                  F();
                  break;
                default:
                  throw new Error("Unknown symbol");
              }
            }
            function ON() {
              var on = ttr.accept("on");
              var the = ttr.accept("the");
              if (!(on || the))
                return;
              do {
                var nth = decodeNTH();
                var wkd = decodeWKD();
                var m = decodeM();
                if (nth) {
                  if (wkd) {
                    ttr.nextSymbol();
                    if (!options.byweekday)
                      options.byweekday = [];
                    options.byweekday.push(RRule2[wkd].nth(nth));
                  } else {
                    if (!options.bymonthday)
                      options.bymonthday = [];
                    options.bymonthday.push(nth);
                    ttr.accept("day(s)");
                  }
                } else if (wkd) {
                  ttr.nextSymbol();
                  if (!options.byweekday)
                    options.byweekday = [];
                  options.byweekday.push(RRule2[wkd]);
                } else if (ttr.symbol === "weekday(s)") {
                  ttr.nextSymbol();
                  if (!options.byweekday) {
                    options.byweekday = [RRule2.MO, RRule2.TU, RRule2.WE, RRule2.TH, RRule2.FR];
                  }
                } else if (ttr.symbol === "week(s)") {
                  ttr.nextSymbol();
                  var n = ttr.acceptNumber();
                  if (!n) {
                    throw new Error("Unexpected symbol " + ttr.symbol + ", expected week number");
                  }
                  options.byweekno = [parseInt(n[0], 10)];
                  while (ttr.accept("comma")) {
                    n = ttr.acceptNumber();
                    if (!n) {
                      throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
                    }
                    options.byweekno.push(parseInt(n[0], 10));
                  }
                } else if (m) {
                  ttr.nextSymbol();
                  if (!options.bymonth)
                    options.bymonth = [];
                  options.bymonth.push(m);
                } else {
                  return;
                }
              } while (ttr.accept("comma") || ttr.accept("the") || ttr.accept("on"));
            }
            function AT() {
              var at = ttr.accept("at");
              if (!at)
                return;
              do {
                var n = ttr.acceptNumber();
                if (!n) {
                  throw new Error("Unexpected symbol " + ttr.symbol + ", expected hour");
                }
                options.byhour = [parseInt(n[0], 10)];
                while (ttr.accept("comma")) {
                  n = ttr.acceptNumber();
                  if (!n) {
                    throw new Error("Unexpected symbol " + ttr.symbol + "; expected hour");
                  }
                  options.byhour.push(parseInt(n[0], 10));
                }
              } while (ttr.accept("comma") || ttr.accept("at"));
            }
            function decodeM() {
              switch (ttr.symbol) {
                case "january":
                  return 1;
                case "february":
                  return 2;
                case "march":
                  return 3;
                case "april":
                  return 4;
                case "may":
                  return 5;
                case "june":
                  return 6;
                case "july":
                  return 7;
                case "august":
                  return 8;
                case "september":
                  return 9;
                case "october":
                  return 10;
                case "november":
                  return 11;
                case "december":
                  return 12;
                default:
                  return false;
              }
            }
            function decodeWKD() {
              switch (ttr.symbol) {
                case "monday":
                case "tuesday":
                case "wednesday":
                case "thursday":
                case "friday":
                case "saturday":
                case "sunday":
                  return ttr.symbol.substr(0, 2).toUpperCase();
                default:
                  return false;
              }
            }
            function decodeNTH() {
              switch (ttr.symbol) {
                case "last":
                  ttr.nextSymbol();
                  return -1;
                case "first":
                  ttr.nextSymbol();
                  return 1;
                case "second":
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -2 : 2;
                case "third":
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -3 : 3;
                case "nth":
                  var v = parseInt(ttr.value[1], 10);
                  if (v < -366 || v > 366)
                    throw new Error("Nth out of range: " + v);
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -v : v;
                default:
                  return false;
              }
            }
            function MDAYs() {
              ttr.accept("on");
              ttr.accept("the");
              var nth = decodeNTH();
              if (!nth)
                return;
              options.bymonthday = [nth];
              ttr.nextSymbol();
              while (ttr.accept("comma")) {
                nth = decodeNTH();
                if (!nth) {
                  throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
                }
                options.bymonthday.push(nth);
                ttr.nextSymbol();
              }
            }
            function F() {
              if (ttr.symbol === "until") {
                var date = Date.parse(ttr.text);
                if (!date)
                  throw new Error("Cannot parse until date:" + ttr.text);
                options.until = new Date(date);
              } else if (ttr.accept("for")) {
                options.count = parseInt(ttr.value[0], 10);
                ttr.expect("number");
              }
            }
          }
          ;
          var Frequency;
          (function(Frequency2) {
            Frequency2[Frequency2["YEARLY"] = 0] = "YEARLY";
            Frequency2[Frequency2["MONTHLY"] = 1] = "MONTHLY";
            Frequency2[Frequency2["WEEKLY"] = 2] = "WEEKLY";
            Frequency2[Frequency2["DAILY"] = 3] = "DAILY";
            Frequency2[Frequency2["HOURLY"] = 4] = "HOURLY";
            Frequency2[Frequency2["MINUTELY"] = 5] = "MINUTELY";
            Frequency2[Frequency2["SECONDLY"] = 6] = "SECONDLY";
          })(Frequency || (Frequency = {}));
          function freqIsDailyOrGreater(freq) {
            return freq < Frequency.HOURLY;
          }
          ;
          var fromText = function(text, language) {
            if (language === void 0) {
              language = i18n;
            }
            return new RRule2(parseText(text, language) || void 0);
          };
          var common = [
            "count",
            "until",
            "interval",
            "byweekday",
            "bymonthday",
            "bymonth"
          ];
          totext.IMPLEMENTED = [];
          totext.IMPLEMENTED[Frequency.HOURLY] = common;
          totext.IMPLEMENTED[Frequency.MINUTELY] = common;
          totext.IMPLEMENTED[Frequency.DAILY] = ["byhour"].concat(common);
          totext.IMPLEMENTED[Frequency.WEEKLY] = common;
          totext.IMPLEMENTED[Frequency.MONTHLY] = common;
          totext.IMPLEMENTED[Frequency.YEARLY] = ["byweekno", "byyearday"].concat(common);
          var toText = function(rrule, gettext, language, dateFormatter) {
            return new totext(rrule, gettext, language, dateFormatter).toString();
          };
          var isFullyConvertible = totext.isFullyConvertible;
          ;
          var Time2 = (
            /** @class */
            (function() {
              function Time3(hour, minute, second, millisecond) {
                this.hour = hour;
                this.minute = minute;
                this.second = second;
                this.millisecond = millisecond || 0;
              }
              Time3.prototype.getHours = function() {
                return this.hour;
              };
              Time3.prototype.getMinutes = function() {
                return this.minute;
              };
              Time3.prototype.getSeconds = function() {
                return this.second;
              };
              Time3.prototype.getMilliseconds = function() {
                return this.millisecond;
              };
              Time3.prototype.getTime = function() {
                return (this.hour * 60 * 60 + this.minute * 60 + this.second) * 1e3 + this.millisecond;
              };
              return Time3;
            })()
          );
          var DateTime = (
            /** @class */
            (function(_super) {
              __extends(DateTime2, _super);
              function DateTime2(year, month, day, hour, minute, second, millisecond) {
                var _this = _super.call(this, hour, minute, second, millisecond) || this;
                _this.year = year;
                _this.month = month;
                _this.day = day;
                return _this;
              }
              DateTime2.fromDate = function(date) {
                return new this(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.valueOf() % 1e3);
              };
              DateTime2.prototype.getWeekday = function() {
                return getWeekday(new Date(this.getTime()));
              };
              DateTime2.prototype.getTime = function() {
                return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond)).getTime();
              };
              DateTime2.prototype.getDay = function() {
                return this.day;
              };
              DateTime2.prototype.getMonth = function() {
                return this.month;
              };
              DateTime2.prototype.getYear = function() {
                return this.year;
              };
              DateTime2.prototype.addYears = function(years) {
                this.year += years;
              };
              DateTime2.prototype.addMonths = function(months) {
                this.month += months;
                if (this.month > 12) {
                  var yearDiv = Math.floor(this.month / 12);
                  var monthMod = pymod(this.month, 12);
                  this.month = monthMod;
                  this.year += yearDiv;
                  if (this.month === 0) {
                    this.month = 12;
                    --this.year;
                  }
                }
              };
              DateTime2.prototype.addWeekly = function(days, wkst) {
                if (wkst > this.getWeekday()) {
                  this.day += -(this.getWeekday() + 1 + (6 - wkst)) + days * 7;
                } else {
                  this.day += -(this.getWeekday() - wkst) + days * 7;
                }
                this.fixDay();
              };
              DateTime2.prototype.addDaily = function(days) {
                this.day += days;
                this.fixDay();
              };
              DateTime2.prototype.addHours = function(hours, filtered, byhour) {
                if (filtered) {
                  this.hour += Math.floor((23 - this.hour) / hours) * hours;
                }
                for (; ; ) {
                  this.hour += hours;
                  var _a = divmod(this.hour, 24), dayDiv = _a.div, hourMod = _a.mod;
                  if (dayDiv) {
                    this.hour = hourMod;
                    this.addDaily(dayDiv);
                  }
                  if (empty(byhour) || includes(byhour, this.hour))
                    break;
                }
              };
              DateTime2.prototype.addMinutes = function(minutes, filtered, byhour, byminute) {
                if (filtered) {
                  this.minute += Math.floor((1439 - (this.hour * 60 + this.minute)) / minutes) * minutes;
                }
                for (; ; ) {
                  this.minute += minutes;
                  var _a = divmod(this.minute, 60), hourDiv = _a.div, minuteMod = _a.mod;
                  if (hourDiv) {
                    this.minute = minuteMod;
                    this.addHours(hourDiv, false, byhour);
                  }
                  if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute))) {
                    break;
                  }
                }
              };
              DateTime2.prototype.addSeconds = function(seconds, filtered, byhour, byminute, bysecond) {
                if (filtered) {
                  this.second += Math.floor((86399 - (this.hour * 3600 + this.minute * 60 + this.second)) / seconds) * seconds;
                }
                for (; ; ) {
                  this.second += seconds;
                  var _a = divmod(this.second, 60), minuteDiv = _a.div, secondMod = _a.mod;
                  if (minuteDiv) {
                    this.second = secondMod;
                    this.addMinutes(minuteDiv, false, byhour, byminute);
                  }
                  if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute)) && (empty(bysecond) || includes(bysecond, this.second))) {
                    break;
                  }
                }
              };
              DateTime2.prototype.fixDay = function() {
                if (this.day <= 28) {
                  return;
                }
                var daysinmonth = monthRange(this.year, this.month - 1)[1];
                if (this.day <= daysinmonth) {
                  return;
                }
                while (this.day > daysinmonth) {
                  this.day -= daysinmonth;
                  ++this.month;
                  if (this.month === 13) {
                    this.month = 1;
                    ++this.year;
                    if (this.year > MAXYEAR) {
                      return;
                    }
                  }
                  daysinmonth = monthRange(this.year, this.month - 1)[1];
                }
              };
              DateTime2.prototype.add = function(options, filtered) {
                var freq = options.freq, interval = options.interval, wkst = options.wkst, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
                switch (freq) {
                  case Frequency.YEARLY:
                    return this.addYears(interval);
                  case Frequency.MONTHLY:
                    return this.addMonths(interval);
                  case Frequency.WEEKLY:
                    return this.addWeekly(interval, wkst);
                  case Frequency.DAILY:
                    return this.addDaily(interval);
                  case Frequency.HOURLY:
                    return this.addHours(interval, filtered, byhour);
                  case Frequency.MINUTELY:
                    return this.addMinutes(interval, filtered, byhour, byminute);
                  case Frequency.SECONDLY:
                    return this.addSeconds(interval, filtered, byhour, byminute, bysecond);
                }
              };
              return DateTime2;
            })(Time2)
          );
          ;
          function initializeOptions(options) {
            var invalid = [];
            var keys = Object.keys(options);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
              var key = keys_1[_i];
              if (!includes(defaultKeys, key))
                invalid.push(key);
              if (isDate(options[key]) && !isValidDate(options[key])) {
                invalid.push(key);
              }
            }
            if (invalid.length) {
              throw new Error("Invalid options: " + invalid.join(", "));
            }
            return __assign({}, options);
          }
          function parseOptions(options) {
            var opts = __assign(__assign({}, DEFAULT_OPTIONS), initializeOptions(options));
            if (isPresent(opts.byeaster))
              opts.freq = RRule2.YEARLY;
            if (!(isPresent(opts.freq) && RRule2.FREQUENCIES[opts.freq])) {
              throw new Error("Invalid frequency: ".concat(opts.freq, " ").concat(options.freq));
            }
            if (!opts.dtstart)
              opts.dtstart = new Date((/* @__PURE__ */ new Date()).setMilliseconds(0));
            if (!isPresent(opts.wkst)) {
              opts.wkst = RRule2.MO.weekday;
            } else if (isNumber(opts.wkst)) {
            } else {
              opts.wkst = opts.wkst.weekday;
            }
            if (isPresent(opts.bysetpos)) {
              if (isNumber(opts.bysetpos))
                opts.bysetpos = [opts.bysetpos];
              for (var i = 0; i < opts.bysetpos.length; i++) {
                var v = opts.bysetpos[i];
                if (v === 0 || !(v >= -366 && v <= 366)) {
                  throw new Error("bysetpos must be between 1 and 366, or between -366 and -1");
                }
              }
            }
            if (!(Boolean(opts.byweekno) || notEmpty(opts.byweekno) || notEmpty(opts.byyearday) || Boolean(opts.bymonthday) || notEmpty(opts.bymonthday) || isPresent(opts.byweekday) || isPresent(opts.byeaster))) {
              switch (opts.freq) {
                case RRule2.YEARLY:
                  if (!opts.bymonth)
                    opts.bymonth = opts.dtstart.getUTCMonth() + 1;
                  opts.bymonthday = opts.dtstart.getUTCDate();
                  break;
                case RRule2.MONTHLY:
                  opts.bymonthday = opts.dtstart.getUTCDate();
                  break;
                case RRule2.WEEKLY:
                  opts.byweekday = [getWeekday(opts.dtstart)];
                  break;
              }
            }
            if (isPresent(opts.bymonth) && !isArray(opts.bymonth)) {
              opts.bymonth = [opts.bymonth];
            }
            if (isPresent(opts.byyearday) && !isArray(opts.byyearday) && isNumber(opts.byyearday)) {
              opts.byyearday = [opts.byyearday];
            }
            if (!isPresent(opts.bymonthday)) {
              opts.bymonthday = [];
              opts.bynmonthday = [];
            } else if (isArray(opts.bymonthday)) {
              var bymonthday = [];
              var bynmonthday = [];
              for (var i = 0; i < opts.bymonthday.length; i++) {
                var v = opts.bymonthday[i];
                if (v > 0) {
                  bymonthday.push(v);
                } else if (v < 0) {
                  bynmonthday.push(v);
                }
              }
              opts.bymonthday = bymonthday;
              opts.bynmonthday = bynmonthday;
            } else if (opts.bymonthday < 0) {
              opts.bynmonthday = [opts.bymonthday];
              opts.bymonthday = [];
            } else {
              opts.bynmonthday = [];
              opts.bymonthday = [opts.bymonthday];
            }
            if (isPresent(opts.byweekno) && !isArray(opts.byweekno)) {
              opts.byweekno = [opts.byweekno];
            }
            if (!isPresent(opts.byweekday)) {
              opts.bynweekday = null;
            } else if (isNumber(opts.byweekday)) {
              opts.byweekday = [opts.byweekday];
              opts.bynweekday = null;
            } else if (isWeekdayStr(opts.byweekday)) {
              opts.byweekday = [Weekday.fromStr(opts.byweekday).weekday];
              opts.bynweekday = null;
            } else if (opts.byweekday instanceof Weekday) {
              if (!opts.byweekday.n || opts.freq > RRule2.MONTHLY) {
                opts.byweekday = [opts.byweekday.weekday];
                opts.bynweekday = null;
              } else {
                opts.bynweekday = [[opts.byweekday.weekday, opts.byweekday.n]];
                opts.byweekday = null;
              }
            } else {
              var byweekday = [];
              var bynweekday = [];
              for (var i = 0; i < opts.byweekday.length; i++) {
                var wday = opts.byweekday[i];
                if (isNumber(wday)) {
                  byweekday.push(wday);
                  continue;
                } else if (isWeekdayStr(wday)) {
                  byweekday.push(Weekday.fromStr(wday).weekday);
                  continue;
                }
                if (!wday.n || opts.freq > RRule2.MONTHLY) {
                  byweekday.push(wday.weekday);
                } else {
                  bynweekday.push([wday.weekday, wday.n]);
                }
              }
              opts.byweekday = notEmpty(byweekday) ? byweekday : null;
              opts.bynweekday = notEmpty(bynweekday) ? bynweekday : null;
            }
            if (!isPresent(opts.byhour)) {
              opts.byhour = opts.freq < RRule2.HOURLY ? [opts.dtstart.getUTCHours()] : null;
            } else if (isNumber(opts.byhour)) {
              opts.byhour = [opts.byhour];
            }
            if (!isPresent(opts.byminute)) {
              opts.byminute = opts.freq < RRule2.MINUTELY ? [opts.dtstart.getUTCMinutes()] : null;
            } else if (isNumber(opts.byminute)) {
              opts.byminute = [opts.byminute];
            }
            if (!isPresent(opts.bysecond)) {
              opts.bysecond = opts.freq < RRule2.SECONDLY ? [opts.dtstart.getUTCSeconds()] : null;
            } else if (isNumber(opts.bysecond)) {
              opts.bysecond = [opts.bysecond];
            }
            return { parsedOptions: opts };
          }
          function buildTimeset(opts) {
            var millisecondModulo = opts.dtstart.getTime() % 1e3;
            if (!freqIsDailyOrGreater(opts.freq)) {
              return [];
            }
            var timeset = [];
            opts.byhour.forEach(function(hour) {
              opts.byminute.forEach(function(minute) {
                opts.bysecond.forEach(function(second) {
                  timeset.push(new Time2(hour, minute, second, millisecondModulo));
                });
              });
            });
            return timeset;
          }
          ;
          function parseString(rfcString) {
            var options = rfcString.split("\n").map(parseLine).filter(function(x) {
              return x !== null;
            });
            return __assign(__assign({}, options[0]), options[1]);
          }
          function parseDtstart(line) {
            var options = {};
            var dtstartWithZone = /DTSTART(?:;TZID=([^:=]+?))?(?::|=)([^;\s]+)/i.exec(line);
            if (!dtstartWithZone) {
              return options;
            }
            var tzid = dtstartWithZone[1], dtstart = dtstartWithZone[2];
            if (tzid) {
              options.tzid = tzid;
            }
            options.dtstart = untilStringToDate(dtstart);
            return options;
          }
          function parseLine(rfcString) {
            rfcString = rfcString.replace(/^\s+|\s+$/, "");
            if (!rfcString.length)
              return null;
            var header = /^([A-Z]+?)[:;]/.exec(rfcString.toUpperCase());
            if (!header) {
              return parseRrule(rfcString);
            }
            var key = header[1];
            switch (key.toUpperCase()) {
              case "RRULE":
              case "EXRULE":
                return parseRrule(rfcString);
              case "DTSTART":
                return parseDtstart(rfcString);
              default:
                throw new Error("Unsupported RFC prop ".concat(key, " in ").concat(rfcString));
            }
          }
          function parseRrule(line) {
            var strippedLine = line.replace(/^RRULE:/i, "");
            var options = parseDtstart(strippedLine);
            var attrs = line.replace(/^(?:RRULE|EXRULE):/i, "").split(";");
            attrs.forEach(function(attr) {
              var _a = attr.split("="), key = _a[0], value = _a[1];
              switch (key.toUpperCase()) {
                case "FREQ":
                  options.freq = Frequency[value.toUpperCase()];
                  break;
                case "WKST":
                  options.wkst = Days[value.toUpperCase()];
                  break;
                case "COUNT":
                case "INTERVAL":
                case "BYSETPOS":
                case "BYMONTH":
                case "BYMONTHDAY":
                case "BYYEARDAY":
                case "BYWEEKNO":
                case "BYHOUR":
                case "BYMINUTE":
                case "BYSECOND":
                  var num = parseNumber(value);
                  var optionKey = key.toLowerCase();
                  options[optionKey] = num;
                  break;
                case "BYWEEKDAY":
                case "BYDAY":
                  options.byweekday = parseWeekday(value);
                  break;
                case "DTSTART":
                case "TZID":
                  var dtstart = parseDtstart(line);
                  options.tzid = dtstart.tzid;
                  options.dtstart = dtstart.dtstart;
                  break;
                case "UNTIL":
                  options.until = untilStringToDate(value);
                  break;
                case "BYEASTER":
                  options.byeaster = Number(value);
                  break;
                default:
                  throw new Error("Unknown RRULE property '" + key + "'");
              }
            });
            return options;
          }
          function parseNumber(value) {
            if (value.indexOf(",") !== -1) {
              var values = value.split(",");
              return values.map(parseIndividualNumber);
            }
            return parseIndividualNumber(value);
          }
          function parseIndividualNumber(value) {
            if (/^[+-]?\d+$/.test(value)) {
              return Number(value);
            }
            return value;
          }
          function parseWeekday(value) {
            var days = value.split(",");
            return days.map(function(day) {
              if (day.length === 2) {
                return Days[day];
              }
              var parts = day.match(/^([+-]?\d{1,2})([A-Z]{2})$/);
              if (!parts || parts.length < 3) {
                throw new SyntaxError("Invalid weekday string: ".concat(day));
              }
              var n = Number(parts[1]);
              var wdaypart = parts[2];
              var wday = Days[wdaypart].weekday;
              return new Weekday(wday, n);
            });
          }
          ;
          var DateWithZone = (
            /** @class */
            (function() {
              function DateWithZone2(date, tzid) {
                if (isNaN(date.getTime())) {
                  throw new RangeError("Invalid date passed to DateWithZone");
                }
                this.date = date;
                this.tzid = tzid;
              }
              Object.defineProperty(DateWithZone2.prototype, "isUTC", {
                get: function() {
                  return !this.tzid || this.tzid.toUpperCase() === "UTC";
                },
                enumerable: false,
                configurable: true
              });
              DateWithZone2.prototype.toString = function() {
                var datestr = timeToUntilString(this.date.getTime(), this.isUTC);
                if (!this.isUTC) {
                  return ";TZID=".concat(this.tzid, ":").concat(datestr);
                }
                return ":".concat(datestr);
              };
              DateWithZone2.prototype.getTime = function() {
                return this.date.getTime();
              };
              DateWithZone2.prototype.rezonedDate = function() {
                if (this.isUTC) {
                  return this.date;
                }
                return dateInTimeZone(this.date, this.tzid);
              };
              return DateWithZone2;
            })()
          );
          ;
          function optionsToString(options) {
            var rrule = [];
            var dtstart = "";
            var keys = Object.keys(options);
            var defaultKeys2 = Object.keys(DEFAULT_OPTIONS);
            for (var i = 0; i < keys.length; i++) {
              if (keys[i] === "tzid")
                continue;
              if (!includes(defaultKeys2, keys[i]))
                continue;
              var key = keys[i].toUpperCase();
              var value = options[keys[i]];
              var outValue = "";
              if (!isPresent(value) || isArray(value) && !value.length)
                continue;
              switch (key) {
                case "FREQ":
                  outValue = RRule2.FREQUENCIES[options.freq];
                  break;
                case "WKST":
                  if (isNumber(value)) {
                    outValue = new Weekday(value).toString();
                  } else {
                    outValue = value.toString();
                  }
                  break;
                case "BYWEEKDAY":
                  key = "BYDAY";
                  outValue = toArray(value).map(function(wday) {
                    if (wday instanceof Weekday) {
                      return wday;
                    }
                    if (isArray(wday)) {
                      return new Weekday(wday[0], wday[1]);
                    }
                    return new Weekday(wday);
                  }).toString();
                  break;
                case "DTSTART":
                  dtstart = buildDtstart(value, options.tzid);
                  break;
                case "UNTIL":
                  outValue = timeToUntilString(value, !options.tzid);
                  break;
                default:
                  if (isArray(value)) {
                    var strValues = [];
                    for (var j = 0; j < value.length; j++) {
                      strValues[j] = String(value[j]);
                    }
                    outValue = strValues.toString();
                  } else {
                    outValue = String(value);
                  }
              }
              if (outValue) {
                rrule.push([key, outValue]);
              }
            }
            var rules = rrule.map(function(_a) {
              var key2 = _a[0], value2 = _a[1];
              return "".concat(key2, "=").concat(value2.toString());
            }).join(";");
            var ruleString = "";
            if (rules !== "") {
              ruleString = "RRULE:".concat(rules);
            }
            return [dtstart, ruleString].filter(function(x) {
              return !!x;
            }).join("\n");
          }
          function buildDtstart(dtstart, tzid) {
            if (!dtstart) {
              return "";
            }
            return "DTSTART" + new DateWithZone(new Date(dtstart), tzid).toString();
          }
          ;
          function argsMatch(left, right) {
            if (Array.isArray(left)) {
              if (!Array.isArray(right))
                return false;
              if (left.length !== right.length)
                return false;
              return left.every(function(date, i) {
                return date.getTime() === right[i].getTime();
              });
            }
            if (left instanceof Date) {
              return right instanceof Date && left.getTime() === right.getTime();
            }
            return left === right;
          }
          var Cache = (
            /** @class */
            (function() {
              function Cache2() {
                this.all = false;
                this.before = [];
                this.after = [];
                this.between = [];
              }
              Cache2.prototype._cacheAdd = function(what, value, args) {
                if (value) {
                  value = value instanceof Date ? dateutil_clone(value) : cloneDates(value);
                }
                if (what === "all") {
                  this.all = value;
                } else {
                  args._value = value;
                  this[what].push(args);
                }
              };
              Cache2.prototype._cacheGet = function(what, args) {
                var cached = false;
                var argsKeys = args ? Object.keys(args) : [];
                var findCacheDiff = function(item2) {
                  for (var i2 = 0; i2 < argsKeys.length; i2++) {
                    var key = argsKeys[i2];
                    if (!argsMatch(args[key], item2[key])) {
                      return true;
                    }
                  }
                  return false;
                };
                var cachedObject = this[what];
                if (what === "all") {
                  cached = this.all;
                } else if (isArray(cachedObject)) {
                  for (var i = 0; i < cachedObject.length; i++) {
                    var item = cachedObject[i];
                    if (argsKeys.length && findCacheDiff(item))
                      continue;
                    cached = item._value;
                    break;
                  }
                }
                if (!cached && this.all) {
                  var iterResult = new iterresult(what, args);
                  for (var i = 0; i < this.all.length; i++) {
                    if (!iterResult.accept(this.all[i]))
                      break;
                  }
                  cached = iterResult.getValue();
                  this._cacheAdd(what, cached, args);
                }
                return isArray(cached) ? cloneDates(cached) : cached instanceof Date ? dateutil_clone(cached) : cached;
              };
              return Cache2;
            })()
          );
          ;
          var M365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 28), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
          var M366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 29), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
          var M28 = range(1, 29);
          var M29 = range(1, 30);
          var M30 = range(1, 31);
          var M31 = range(1, 32);
          var MDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M29, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
          var MDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M28, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
          var NM28 = range(-28, 0);
          var NM29 = range(-29, 0);
          var NM30 = range(-30, 0);
          var NM31 = range(-31, 0);
          var NMDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM29, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
          var NMDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM28, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
          var M366RANGE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
          var M365RANGE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
          var WDAYMASK = (function() {
            var wdaymask = [];
            for (var i = 0; i < 55; i++)
              wdaymask = wdaymask.concat(range(7));
            return wdaymask;
          })();
          ;
          function rebuildYear(year, options) {
            var firstyday = datetime(year, 1, 1);
            var yearlen = isLeapYear(year) ? 366 : 365;
            var nextyearlen = isLeapYear(year + 1) ? 366 : 365;
            var yearordinal = toOrdinal(firstyday);
            var yearweekday = getWeekday(firstyday);
            var result = __assign(__assign({ yearlen, nextyearlen, yearordinal, yearweekday }, baseYearMasks(year)), { wnomask: null });
            if (empty(options.byweekno)) {
              return result;
            }
            result.wnomask = repeat(0, yearlen + 7);
            var firstwkst;
            var wyearlen;
            var no1wkst = firstwkst = pymod(7 - yearweekday + options.wkst, 7);
            if (no1wkst >= 4) {
              no1wkst = 0;
              wyearlen = result.yearlen + pymod(yearweekday - options.wkst, 7);
            } else {
              wyearlen = yearlen - no1wkst;
            }
            var div = Math.floor(wyearlen / 7);
            var mod = pymod(wyearlen, 7);
            var numweeks = Math.floor(div + mod / 4);
            for (var j = 0; j < options.byweekno.length; j++) {
              var n = options.byweekno[j];
              if (n < 0) {
                n += numweeks + 1;
              }
              if (!(n > 0 && n <= numweeks)) {
                continue;
              }
              var i = void 0;
              if (n > 1) {
                i = no1wkst + (n - 1) * 7;
                if (no1wkst !== firstwkst) {
                  i -= 7 - firstwkst;
                }
              } else {
                i = no1wkst;
              }
              for (var k = 0; k < 7; k++) {
                result.wnomask[i] = 1;
                i++;
                if (result.wdaymask[i] === options.wkst)
                  break;
              }
            }
            if (includes(options.byweekno, 1)) {
              var i = no1wkst + numweeks * 7;
              if (no1wkst !== firstwkst)
                i -= 7 - firstwkst;
              if (i < yearlen) {
                for (var j = 0; j < 7; j++) {
                  result.wnomask[i] = 1;
                  i += 1;
                  if (result.wdaymask[i] === options.wkst)
                    break;
                }
              }
            }
            if (no1wkst) {
              var lnumweeks = void 0;
              if (!includes(options.byweekno, -1)) {
                var lyearweekday = getWeekday(datetime(year - 1, 1, 1));
                var lno1wkst = pymod(7 - lyearweekday.valueOf() + options.wkst, 7);
                var lyearlen = isLeapYear(year - 1) ? 366 : 365;
                var weekst = void 0;
                if (lno1wkst >= 4) {
                  lno1wkst = 0;
                  weekst = lyearlen + pymod(lyearweekday - options.wkst, 7);
                } else {
                  weekst = yearlen - no1wkst;
                }
                lnumweeks = Math.floor(52 + pymod(weekst, 7) / 4);
              } else {
                lnumweeks = -1;
              }
              if (includes(options.byweekno, lnumweeks)) {
                for (var i = 0; i < no1wkst; i++)
                  result.wnomask[i] = 1;
              }
            }
            return result;
          }
          function baseYearMasks(year) {
            var yearlen = isLeapYear(year) ? 366 : 365;
            var firstyday = datetime(year, 1, 1);
            var wday = getWeekday(firstyday);
            if (yearlen === 365) {
              return {
                mmask: M365MASK,
                mdaymask: MDAY365MASK,
                nmdaymask: NMDAY365MASK,
                wdaymask: WDAYMASK.slice(wday),
                mrange: M365RANGE
              };
            }
            return {
              mmask: M366MASK,
              mdaymask: MDAY366MASK,
              nmdaymask: NMDAY366MASK,
              wdaymask: WDAYMASK.slice(wday),
              mrange: M366RANGE
            };
          }
          ;
          function rebuildMonth(year, month, yearlen, mrange, wdaymask, options) {
            var result = {
              lastyear: year,
              lastmonth: month,
              nwdaymask: []
            };
            var ranges = [];
            if (options.freq === RRule2.YEARLY) {
              if (empty(options.bymonth)) {
                ranges = [[0, yearlen]];
              } else {
                for (var j = 0; j < options.bymonth.length; j++) {
                  month = options.bymonth[j];
                  ranges.push(mrange.slice(month - 1, month + 1));
                }
              }
            } else if (options.freq === RRule2.MONTHLY) {
              ranges = [mrange.slice(month - 1, month + 1)];
            }
            if (empty(ranges)) {
              return result;
            }
            result.nwdaymask = repeat(0, yearlen);
            for (var j = 0; j < ranges.length; j++) {
              var rang = ranges[j];
              var first = rang[0];
              var last = rang[1] - 1;
              for (var k = 0; k < options.bynweekday.length; k++) {
                var i = void 0;
                var _a = options.bynweekday[k], wday = _a[0], n = _a[1];
                if (n < 0) {
                  i = last + (n + 1) * 7;
                  i -= pymod(wdaymask[i] - wday, 7);
                } else {
                  i = first + (n - 1) * 7;
                  i += pymod(7 - wdaymask[i] + wday, 7);
                }
                if (first <= i && i <= last)
                  result.nwdaymask[i] = 1;
              }
            }
            return result;
          }
          ;
          function easter(y, offset) {
            if (offset === void 0) {
              offset = 0;
            }
            var a = y % 19;
            var b = Math.floor(y / 100);
            var c = y % 100;
            var d = Math.floor(b / 4);
            var e = b % 4;
            var f = Math.floor((b + 8) / 25);
            var g = Math.floor((b - f + 1) / 3);
            var h = Math.floor(19 * a + b - d - g + 15) % 30;
            var i = Math.floor(c / 4);
            var k = c % 4;
            var l = Math.floor(32 + 2 * e + 2 * i - h - k) % 7;
            var m = Math.floor((a + 11 * h + 22 * l) / 451);
            var month = Math.floor((h + l - 7 * m + 114) / 31);
            var day = (h + l - 7 * m + 114) % 31 + 1;
            var date = Date.UTC(y, month - 1, day + offset);
            var yearStart = Date.UTC(y, 0, 1);
            return [Math.ceil((date - yearStart) / (1e3 * 60 * 60 * 24))];
          }
          ;
          var Iterinfo = (
            /** @class */
            (function() {
              function Iterinfo2(options) {
                this.options = options;
              }
              Iterinfo2.prototype.rebuild = function(year, month) {
                var options = this.options;
                if (year !== this.lastyear) {
                  this.yearinfo = rebuildYear(year, options);
                }
                if (notEmpty(options.bynweekday) && (month !== this.lastmonth || year !== this.lastyear)) {
                  var _a = this.yearinfo, yearlen = _a.yearlen, mrange = _a.mrange, wdaymask = _a.wdaymask;
                  this.monthinfo = rebuildMonth(year, month, yearlen, mrange, wdaymask, options);
                }
                if (isPresent(options.byeaster)) {
                  this.eastermask = easter(year, options.byeaster);
                }
              };
              Object.defineProperty(Iterinfo2.prototype, "lastyear", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.lastyear : null;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "lastmonth", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.lastmonth : null;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "yearlen", {
                get: function() {
                  return this.yearinfo.yearlen;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "yearordinal", {
                get: function() {
                  return this.yearinfo.yearordinal;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mrange", {
                get: function() {
                  return this.yearinfo.mrange;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "wdaymask", {
                get: function() {
                  return this.yearinfo.wdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mmask", {
                get: function() {
                  return this.yearinfo.mmask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "wnomask", {
                get: function() {
                  return this.yearinfo.wnomask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nwdaymask", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.nwdaymask : [];
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nextyearlen", {
                get: function() {
                  return this.yearinfo.nextyearlen;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mdaymask", {
                get: function() {
                  return this.yearinfo.mdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nmdaymask", {
                get: function() {
                  return this.yearinfo.nmdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Iterinfo2.prototype.ydayset = function() {
                return [range(this.yearlen), 0, this.yearlen];
              };
              Iterinfo2.prototype.mdayset = function(_, month) {
                var start = this.mrange[month - 1];
                var end = this.mrange[month];
                var set = repeat(null, this.yearlen);
                for (var i = start; i < end; i++)
                  set[i] = i;
                return [set, start, end];
              };
              Iterinfo2.prototype.wdayset = function(year, month, day) {
                var set = repeat(null, this.yearlen + 7);
                var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
                var start = i;
                for (var j = 0; j < 7; j++) {
                  set[i] = i;
                  ++i;
                  if (this.wdaymask[i] === this.options.wkst)
                    break;
                }
                return [set, start, i];
              };
              Iterinfo2.prototype.ddayset = function(year, month, day) {
                var set = repeat(null, this.yearlen);
                var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
                set[i] = i;
                return [set, i, i + 1];
              };
              Iterinfo2.prototype.htimeset = function(hour, _, second, millisecond) {
                var _this = this;
                var set = [];
                this.options.byminute.forEach(function(minute) {
                  set = set.concat(_this.mtimeset(hour, minute, second, millisecond));
                });
                sort(set);
                return set;
              };
              Iterinfo2.prototype.mtimeset = function(hour, minute, _, millisecond) {
                var set = this.options.bysecond.map(function(second) {
                  return new Time2(hour, minute, second, millisecond);
                });
                sort(set);
                return set;
              };
              Iterinfo2.prototype.stimeset = function(hour, minute, second, millisecond) {
                return [new Time2(hour, minute, second, millisecond)];
              };
              Iterinfo2.prototype.getdayset = function(freq) {
                switch (freq) {
                  case Frequency.YEARLY:
                    return this.ydayset.bind(this);
                  case Frequency.MONTHLY:
                    return this.mdayset.bind(this);
                  case Frequency.WEEKLY:
                    return this.wdayset.bind(this);
                  case Frequency.DAILY:
                    return this.ddayset.bind(this);
                  default:
                    return this.ddayset.bind(this);
                }
              };
              Iterinfo2.prototype.gettimeset = function(freq) {
                switch (freq) {
                  case Frequency.HOURLY:
                    return this.htimeset.bind(this);
                  case Frequency.MINUTELY:
                    return this.mtimeset.bind(this);
                  case Frequency.SECONDLY:
                    return this.stimeset.bind(this);
                }
              };
              return Iterinfo2;
            })()
          );
          const iterinfo = Iterinfo;
          ;
          function buildPoslist(bysetpos, timeset, start, end, ii, dayset) {
            var poslist = [];
            for (var j = 0; j < bysetpos.length; j++) {
              var daypos = void 0;
              var timepos = void 0;
              var pos = bysetpos[j];
              if (pos < 0) {
                daypos = Math.floor(pos / timeset.length);
                timepos = pymod(pos, timeset.length);
              } else {
                daypos = Math.floor((pos - 1) / timeset.length);
                timepos = pymod(pos - 1, timeset.length);
              }
              var tmp = [];
              for (var k = start; k < end; k++) {
                var val = dayset[k];
                if (!isPresent(val))
                  continue;
                tmp.push(val);
              }
              var i = void 0;
              if (daypos < 0) {
                i = tmp.slice(daypos)[0];
              } else {
                i = tmp[daypos];
              }
              var time = timeset[timepos];
              var date = fromOrdinal(ii.yearordinal + i);
              var res = combine(date, time);
              if (!includes(poslist, res))
                poslist.push(res);
            }
            sort(poslist);
            return poslist;
          }
          ;
          function iter(iterResult, options) {
            var dtstart = options.dtstart, freq = options.freq, interval = options.interval, until = options.until, bysetpos = options.bysetpos;
            var count = options.count;
            if (count === 0 || interval === 0) {
              return emitResult(iterResult);
            }
            var counterDate = DateTime.fromDate(dtstart);
            var ii = new iterinfo(options);
            ii.rebuild(counterDate.year, counterDate.month);
            var timeset = makeTimeset(ii, counterDate, options);
            for (; ; ) {
              var _a = ii.getdayset(freq)(counterDate.year, counterDate.month, counterDate.day), dayset = _a[0], start = _a[1], end = _a[2];
              var filtered = removeFilteredDays(dayset, start, end, ii, options);
              if (notEmpty(bysetpos)) {
                var poslist = buildPoslist(bysetpos, timeset, start, end, ii, dayset);
                for (var j = 0; j < poslist.length; j++) {
                  var res = poslist[j];
                  if (until && res > until) {
                    return emitResult(iterResult);
                  }
                  if (res >= dtstart) {
                    var rezonedDate = rezoneIfNeeded(res, options);
                    if (!iterResult.accept(rezonedDate)) {
                      return emitResult(iterResult);
                    }
                    if (count) {
                      --count;
                      if (!count) {
                        return emitResult(iterResult);
                      }
                    }
                  }
                }
              } else {
                for (var j = start; j < end; j++) {
                  var currentDay = dayset[j];
                  if (!isPresent(currentDay)) {
                    continue;
                  }
                  var date = fromOrdinal(ii.yearordinal + currentDay);
                  for (var k = 0; k < timeset.length; k++) {
                    var time = timeset[k];
                    var res = combine(date, time);
                    if (until && res > until) {
                      return emitResult(iterResult);
                    }
                    if (res >= dtstart) {
                      var rezonedDate = rezoneIfNeeded(res, options);
                      if (!iterResult.accept(rezonedDate)) {
                        return emitResult(iterResult);
                      }
                      if (count) {
                        --count;
                        if (!count) {
                          return emitResult(iterResult);
                        }
                      }
                    }
                  }
                }
              }
              if (options.interval === 0) {
                return emitResult(iterResult);
              }
              counterDate.add(options, filtered);
              if (counterDate.year > MAXYEAR) {
                return emitResult(iterResult);
              }
              if (!freqIsDailyOrGreater(freq)) {
                timeset = ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, 0);
              }
              ii.rebuild(counterDate.year, counterDate.month);
            }
          }
          function isFiltered(ii, currentDay, options) {
            var bymonth = options.bymonth, byweekno = options.byweekno, byweekday = options.byweekday, byeaster = options.byeaster, bymonthday = options.bymonthday, bynmonthday = options.bynmonthday, byyearday = options.byyearday;
            return notEmpty(bymonth) && !includes(bymonth, ii.mmask[currentDay]) || notEmpty(byweekno) && !ii.wnomask[currentDay] || notEmpty(byweekday) && !includes(byweekday, ii.wdaymask[currentDay]) || notEmpty(ii.nwdaymask) && !ii.nwdaymask[currentDay] || byeaster !== null && !includes(ii.eastermask, currentDay) || (notEmpty(bymonthday) || notEmpty(bynmonthday)) && !includes(bymonthday, ii.mdaymask[currentDay]) && !includes(bynmonthday, ii.nmdaymask[currentDay]) || notEmpty(byyearday) && (currentDay < ii.yearlen && !includes(byyearday, currentDay + 1) && !includes(byyearday, -ii.yearlen + currentDay) || currentDay >= ii.yearlen && !includes(byyearday, currentDay + 1 - ii.yearlen) && !includes(byyearday, -ii.nextyearlen + currentDay - ii.yearlen));
          }
          function rezoneIfNeeded(date, options) {
            return new DateWithZone(date, options.tzid).rezonedDate();
          }
          function emitResult(iterResult) {
            return iterResult.getValue();
          }
          function removeFilteredDays(dayset, start, end, ii, options) {
            var filtered = false;
            for (var dayCounter = start; dayCounter < end; dayCounter++) {
              var currentDay = dayset[dayCounter];
              filtered = isFiltered(ii, currentDay, options);
              if (filtered)
                dayset[currentDay] = null;
            }
            return filtered;
          }
          function makeTimeset(ii, counterDate, options) {
            var freq = options.freq, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
            if (freqIsDailyOrGreater(freq)) {
              return buildTimeset(options);
            }
            if (freq >= RRule2.HOURLY && notEmpty(byhour) && !includes(byhour, counterDate.hour) || freq >= RRule2.MINUTELY && notEmpty(byminute) && !includes(byminute, counterDate.minute) || freq >= RRule2.SECONDLY && notEmpty(bysecond) && !includes(bysecond, counterDate.second)) {
              return [];
            }
            return ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, counterDate.millisecond);
          }
          ;
          var Days = {
            MO: new Weekday(0),
            TU: new Weekday(1),
            WE: new Weekday(2),
            TH: new Weekday(3),
            FR: new Weekday(4),
            SA: new Weekday(5),
            SU: new Weekday(6)
          };
          var DEFAULT_OPTIONS = {
            freq: Frequency.YEARLY,
            dtstart: null,
            interval: 1,
            wkst: Days.MO,
            count: null,
            until: null,
            tzid: null,
            bysetpos: null,
            bymonth: null,
            bymonthday: null,
            bynmonthday: null,
            byyearday: null,
            byweekno: null,
            byweekday: null,
            bynweekday: null,
            byhour: null,
            byminute: null,
            bysecond: null,
            byeaster: null
          };
          var defaultKeys = Object.keys(DEFAULT_OPTIONS);
          var RRule2 = (
            /** @class */
            (function() {
              function RRule3(options, noCache) {
                if (options === void 0) {
                  options = {};
                }
                if (noCache === void 0) {
                  noCache = false;
                }
                this._cache = noCache ? null : new Cache();
                this.origOptions = initializeOptions(options);
                var parsedOptions = parseOptions(options).parsedOptions;
                this.options = parsedOptions;
              }
              RRule3.parseText = function(text, language) {
                return parseText(text, language);
              };
              RRule3.fromText = function(text, language) {
                return fromText(text, language);
              };
              RRule3.fromString = function(str) {
                return new RRule3(RRule3.parseString(str) || void 0);
              };
              RRule3.prototype._iter = function(iterResult) {
                return iter(iterResult, this.options);
              };
              RRule3.prototype._cacheGet = function(what, args) {
                if (!this._cache)
                  return false;
                return this._cache._cacheGet(what, args);
              };
              RRule3.prototype._cacheAdd = function(what, value, args) {
                if (!this._cache)
                  return;
                return this._cache._cacheAdd(what, value, args);
              };
              RRule3.prototype.all = function(iterator) {
                if (iterator) {
                  return this._iter(new callbackiterresult("all", {}, iterator));
                }
                var result = this._cacheGet("all");
                if (result === false) {
                  result = this._iter(new iterresult("all", {}));
                  this._cacheAdd("all", result);
                }
                return result;
              };
              RRule3.prototype.between = function(after, before, inc, iterator) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(after) || !isValidDate(before)) {
                  throw new Error("Invalid date passed in to RRule.between");
                }
                var args = {
                  before,
                  after,
                  inc
                };
                if (iterator) {
                  return this._iter(new callbackiterresult("between", args, iterator));
                }
                var result = this._cacheGet("between", args);
                if (result === false) {
                  result = this._iter(new iterresult("between", args));
                  this._cacheAdd("between", result, args);
                }
                return result;
              };
              RRule3.prototype.before = function(dt, inc) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(dt)) {
                  throw new Error("Invalid date passed in to RRule.before");
                }
                var args = { dt, inc };
                var result = this._cacheGet("before", args);
                if (result === false) {
                  result = this._iter(new iterresult("before", args));
                  this._cacheAdd("before", result, args);
                }
                return result;
              };
              RRule3.prototype.after = function(dt, inc) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(dt)) {
                  throw new Error("Invalid date passed in to RRule.after");
                }
                var args = { dt, inc };
                var result = this._cacheGet("after", args);
                if (result === false) {
                  result = this._iter(new iterresult("after", args));
                  this._cacheAdd("after", result, args);
                }
                return result;
              };
              RRule3.prototype.count = function() {
                return this.all().length;
              };
              RRule3.prototype.toString = function() {
                return optionsToString(this.origOptions);
              };
              RRule3.prototype.toText = function(gettext, language, dateFormatter) {
                return toText(this, gettext, language, dateFormatter);
              };
              RRule3.prototype.isFullyConvertibleToText = function() {
                return isFullyConvertible(this);
              };
              RRule3.prototype.clone = function() {
                return new RRule3(this.origOptions);
              };
              RRule3.FREQUENCIES = [
                "YEARLY",
                "MONTHLY",
                "WEEKLY",
                "DAILY",
                "HOURLY",
                "MINUTELY",
                "SECONDLY"
              ];
              RRule3.YEARLY = Frequency.YEARLY;
              RRule3.MONTHLY = Frequency.MONTHLY;
              RRule3.WEEKLY = Frequency.WEEKLY;
              RRule3.DAILY = Frequency.DAILY;
              RRule3.HOURLY = Frequency.HOURLY;
              RRule3.MINUTELY = Frequency.MINUTELY;
              RRule3.SECONDLY = Frequency.SECONDLY;
              RRule3.MO = Days.MO;
              RRule3.TU = Days.TU;
              RRule3.WE = Days.WE;
              RRule3.TH = Days.TH;
              RRule3.FR = Days.FR;
              RRule3.SA = Days.SA;
              RRule3.SU = Days.SU;
              RRule3.parseString = parseString;
              RRule3.optionsToString = optionsToString;
              return RRule3;
            })()
          );
          ;
          function iterSet(iterResult, _rrule, _exrule, _rdate, _exdate, tzid) {
            var _exdateHash = {};
            var _accept = iterResult.accept;
            function evalExdate(after, before) {
              _exrule.forEach(function(rrule) {
                rrule.between(after, before, true).forEach(function(date) {
                  _exdateHash[Number(date)] = true;
                });
              });
            }
            _exdate.forEach(function(date) {
              var zonedDate2 = new DateWithZone(date, tzid).rezonedDate();
              _exdateHash[Number(zonedDate2)] = true;
            });
            iterResult.accept = function(date) {
              var dt = Number(date);
              if (isNaN(dt))
                return _accept.call(this, date);
              if (!_exdateHash[dt]) {
                evalExdate(new Date(dt - 1), new Date(dt + 1));
                if (!_exdateHash[dt]) {
                  _exdateHash[dt] = true;
                  return _accept.call(this, date);
                }
              }
              return true;
            };
            if (iterResult.method === "between") {
              evalExdate(iterResult.args.after, iterResult.args.before);
              iterResult.accept = function(date) {
                var dt = Number(date);
                if (!_exdateHash[dt]) {
                  _exdateHash[dt] = true;
                  return _accept.call(this, date);
                }
                return true;
              };
            }
            for (var i = 0; i < _rdate.length; i++) {
              var zonedDate = new DateWithZone(_rdate[i], tzid).rezonedDate();
              if (!iterResult.accept(new Date(zonedDate.getTime())))
                break;
            }
            _rrule.forEach(function(rrule) {
              iter(iterResult, rrule.options);
            });
            var res = iterResult._result;
            sort(res);
            switch (iterResult.method) {
              case "all":
              case "between":
                return res;
              case "before":
                return res.length && res[res.length - 1] || null;
              case "after":
              default:
                return res.length && res[0] || null;
            }
          }
          ;
          var rrulestr_DEFAULT_OPTIONS = {
            dtstart: null,
            cache: false,
            unfold: false,
            forceset: false,
            compatible: false,
            tzid: null
          };
          function parseInput(s, options) {
            var rrulevals = [];
            var rdatevals = [];
            var exrulevals = [];
            var exdatevals = [];
            var parsedDtstart = parseDtstart(s);
            var dtstart = parsedDtstart.dtstart;
            var tzid = parsedDtstart.tzid;
            var lines = splitIntoLines(s, options.unfold);
            lines.forEach(function(line) {
              var _a;
              if (!line)
                return;
              var _b = breakDownLine(line), name = _b.name, parms = _b.parms, value = _b.value;
              switch (name.toUpperCase()) {
                case "RRULE":
                  if (parms.length) {
                    throw new Error("unsupported RRULE parm: ".concat(parms.join(",")));
                  }
                  rrulevals.push(parseString(line));
                  break;
                case "RDATE":
                  var _c = (_a = /RDATE(?:;TZID=([^:=]+))?/i.exec(line)) !== null && _a !== void 0 ? _a : [], rdateTzid = _c[1];
                  if (rdateTzid && !tzid) {
                    tzid = rdateTzid;
                  }
                  rdatevals = rdatevals.concat(parseRDate(value, parms));
                  break;
                case "EXRULE":
                  if (parms.length) {
                    throw new Error("unsupported EXRULE parm: ".concat(parms.join(",")));
                  }
                  exrulevals.push(parseString(value));
                  break;
                case "EXDATE":
                  exdatevals = exdatevals.concat(parseRDate(value, parms));
                  break;
                case "DTSTART":
                  break;
                default:
                  throw new Error("unsupported property: " + name);
              }
            });
            return {
              dtstart,
              tzid,
              rrulevals,
              rdatevals,
              exrulevals,
              exdatevals
            };
          }
          function buildRule(s, options) {
            var _a = parseInput(s, options), rrulevals = _a.rrulevals, rdatevals = _a.rdatevals, exrulevals = _a.exrulevals, exdatevals = _a.exdatevals, dtstart = _a.dtstart, tzid = _a.tzid;
            var noCache = options.cache === false;
            if (options.compatible) {
              options.forceset = true;
              options.unfold = true;
            }
            if (options.forceset || rrulevals.length > 1 || rdatevals.length || exrulevals.length || exdatevals.length) {
              var rset_1 = new RRuleSet(noCache);
              rset_1.dtstart(dtstart);
              rset_1.tzid(tzid || void 0);
              rrulevals.forEach(function(val2) {
                rset_1.rrule(new RRule2(groomRruleOptions(val2, dtstart, tzid), noCache));
              });
              rdatevals.forEach(function(date) {
                rset_1.rdate(date);
              });
              exrulevals.forEach(function(val2) {
                rset_1.exrule(new RRule2(groomRruleOptions(val2, dtstart, tzid), noCache));
              });
              exdatevals.forEach(function(date) {
                rset_1.exdate(date);
              });
              if (options.compatible && options.dtstart)
                rset_1.rdate(dtstart);
              return rset_1;
            }
            var val = rrulevals[0] || {};
            return new RRule2(groomRruleOptions(val, val.dtstart || options.dtstart || dtstart, val.tzid || options.tzid || tzid), noCache);
          }
          function rrulestr2(s, options) {
            if (options === void 0) {
              options = {};
            }
            return buildRule(s, rrulestr_initializeOptions(options));
          }
          function groomRruleOptions(val, dtstart, tzid) {
            return __assign(__assign({}, val), { dtstart, tzid });
          }
          function rrulestr_initializeOptions(options) {
            var invalid = [];
            var keys = Object.keys(options);
            var defaultKeys2 = Object.keys(rrulestr_DEFAULT_OPTIONS);
            keys.forEach(function(key) {
              if (!includes(defaultKeys2, key))
                invalid.push(key);
            });
            if (invalid.length) {
              throw new Error("Invalid options: " + invalid.join(", "));
            }
            return __assign(__assign({}, rrulestr_DEFAULT_OPTIONS), options);
          }
          function extractName(line) {
            if (line.indexOf(":") === -1) {
              return {
                name: "RRULE",
                value: line
              };
            }
            var _a = split(line, ":", 1), name = _a[0], value = _a[1];
            return {
              name,
              value
            };
          }
          function breakDownLine(line) {
            var _a = extractName(line), name = _a.name, value = _a.value;
            var parms = name.split(";");
            if (!parms)
              throw new Error("empty property name");
            return {
              name: parms[0].toUpperCase(),
              parms: parms.slice(1),
              value
            };
          }
          function splitIntoLines(s, unfold) {
            if (unfold === void 0) {
              unfold = false;
            }
            s = s && s.trim();
            if (!s)
              throw new Error("Invalid empty string");
            if (!unfold) {
              return s.split(/\s/);
            }
            var lines = s.split("\n");
            var i = 0;
            while (i < lines.length) {
              var line = lines[i] = lines[i].replace(/\s+$/g, "");
              if (!line) {
                lines.splice(i, 1);
              } else if (i > 0 && line[0] === " ") {
                lines[i - 1] += line.slice(1);
                lines.splice(i, 1);
              } else {
                i += 1;
              }
            }
            return lines;
          }
          function validateDateParm(parms) {
            parms.forEach(function(parm) {
              if (!/(VALUE=DATE(-TIME)?)|(TZID=)/.test(parm)) {
                throw new Error("unsupported RDATE/EXDATE parm: " + parm);
              }
            });
          }
          function parseRDate(rdateval, parms) {
            validateDateParm(parms);
            return rdateval.split(",").map(function(datestr) {
              return untilStringToDate(datestr);
            });
          }
          ;
          function createGetterSetter(fieldName) {
            var _this = this;
            return function(field) {
              if (field !== void 0) {
                _this["_".concat(fieldName)] = field;
              }
              if (_this["_".concat(fieldName)] !== void 0) {
                return _this["_".concat(fieldName)];
              }
              for (var i = 0; i < _this._rrule.length; i++) {
                var field_1 = _this._rrule[i].origOptions[fieldName];
                if (field_1) {
                  return field_1;
                }
              }
            };
          }
          var RRuleSet = (
            /** @class */
            (function(_super) {
              __extends(RRuleSet2, _super);
              function RRuleSet2(noCache) {
                if (noCache === void 0) {
                  noCache = false;
                }
                var _this = _super.call(this, {}, noCache) || this;
                _this.dtstart = createGetterSetter.apply(_this, ["dtstart"]);
                _this.tzid = createGetterSetter.apply(_this, ["tzid"]);
                _this._rrule = [];
                _this._rdate = [];
                _this._exrule = [];
                _this._exdate = [];
                return _this;
              }
              RRuleSet2.prototype._iter = function(iterResult) {
                return iterSet(iterResult, this._rrule, this._exrule, this._rdate, this._exdate, this.tzid());
              };
              RRuleSet2.prototype.rrule = function(rrule) {
                _addRule(rrule, this._rrule);
              };
              RRuleSet2.prototype.exrule = function(rrule) {
                _addRule(rrule, this._exrule);
              };
              RRuleSet2.prototype.rdate = function(date) {
                _addDate(date, this._rdate);
              };
              RRuleSet2.prototype.exdate = function(date) {
                _addDate(date, this._exdate);
              };
              RRuleSet2.prototype.rrules = function() {
                return this._rrule.map(function(e) {
                  return rrulestr2(e.toString());
                });
              };
              RRuleSet2.prototype.exrules = function() {
                return this._exrule.map(function(e) {
                  return rrulestr2(e.toString());
                });
              };
              RRuleSet2.prototype.rdates = function() {
                return this._rdate.map(function(e) {
                  return new Date(e.getTime());
                });
              };
              RRuleSet2.prototype.exdates = function() {
                return this._exdate.map(function(e) {
                  return new Date(e.getTime());
                });
              };
              RRuleSet2.prototype.valueOf = function() {
                var result = [];
                if (!this._rrule.length && this._dtstart) {
                  result = result.concat(optionsToString({ dtstart: this._dtstart }));
                }
                this._rrule.forEach(function(rrule) {
                  result = result.concat(rrule.toString().split("\n"));
                });
                this._exrule.forEach(function(exrule) {
                  result = result.concat(exrule.toString().split("\n").map(function(line) {
                    return line.replace(/^RRULE:/, "EXRULE:");
                  }).filter(function(line) {
                    return !/^DTSTART/.test(line);
                  }));
                });
                if (this._rdate.length) {
                  result.push(rdatesToString("RDATE", this._rdate, this.tzid()));
                }
                if (this._exdate.length) {
                  result.push(rdatesToString("EXDATE", this._exdate, this.tzid()));
                }
                return result;
              };
              RRuleSet2.prototype.toString = function() {
                return this.valueOf().join("\n");
              };
              RRuleSet2.prototype.clone = function() {
                var rrs = new RRuleSet2(!!this._cache);
                this._rrule.forEach(function(rule) {
                  return rrs.rrule(rule.clone());
                });
                this._exrule.forEach(function(rule) {
                  return rrs.exrule(rule.clone());
                });
                this._rdate.forEach(function(date) {
                  return rrs.rdate(new Date(date.getTime()));
                });
                this._exdate.forEach(function(date) {
                  return rrs.exdate(new Date(date.getTime()));
                });
                return rrs;
              };
              return RRuleSet2;
            })(RRule2)
          );
          function _addRule(rrule, collection2) {
            if (!(rrule instanceof RRule2)) {
              throw new TypeError(String(rrule) + " is not RRule instance");
            }
            if (!includes(collection2.map(String), String(rrule))) {
              collection2.push(rrule);
            }
          }
          function _addDate(date, collection2) {
            if (!(date instanceof Date)) {
              throw new TypeError(String(date) + " is not Date instance");
            }
            if (!includes(collection2.map(Number), Number(date))) {
              collection2.push(date);
              sort(collection2);
            }
          }
          function rdatesToString(param, rdates, tzid) {
            var isUTC = !tzid || tzid.toUpperCase() === "UTC";
            var header = isUTC ? "".concat(param, ":") : "".concat(param, ";TZID=").concat(tzid, ":");
            var dateString = rdates.map(function(rdate) {
              return timeToUntilString(rdate.valueOf(), isUTC);
            }).join(",");
            return "".concat(header).concat(dateString);
          }
          ;
          return __webpack_exports__;
        })()
      );
    });
  }
});

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
          const self2 = debug2;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
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
              match = formatter.call(self2, val);
              args.splice(index2, 1);
              index2--;
            }
            return match;
          });
          createDebug.formatArgs.call(self2, args);
          const logFn = self2.log || createDebug.log;
          logFn.apply(self2, args);
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

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports, module) {
    "use strict";
    module.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports, module) {
    "use strict";
    var os = __require("os");
    var tty = __require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
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
      const supportsColor = require_supports_color();
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
        parser.encoding = null;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
        parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512;
        parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4;
        parser.entityCount = parser.entityDepth = 0;
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
      function determineBufferEncoding(data, isEnd) {
        if (data.length >= 2) {
          if (data[0] === 255 && data[1] === 254) {
            return "utf-16le";
          }
          if (data[0] === 254 && data[1] === 255) {
            return "utf-16be";
          }
        }
        if (data.length >= 3 && data[0] === 239 && data[1] === 187 && data[2] === 191) {
          return "utf8";
        }
        if (data.length >= 4) {
          if (data[0] === 60 && data[1] === 0 && data[2] === 63 && data[3] === 0) {
            return "utf-16le";
          }
          if (data[0] === 0 && data[1] === 60 && data[2] === 0 && data[3] === 63) {
            return "utf-16be";
          }
          return "utf8";
        }
        return isEnd ? "utf8" : null;
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
        this._decoderBuffer = null;
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
      SAXStream.prototype._decodeBuffer = function(data, isEnd) {
        if (this._decoderBuffer) {
          data = Buffer.concat([this._decoderBuffer, data]);
          this._decoderBuffer = null;
        }
        if (!this._decoder) {
          var encoding = determineBufferEncoding(data, isEnd);
          if (!encoding) {
            this._decoderBuffer = data;
            return "";
          }
          this._parser.encoding = encoding;
          this._decoder = new TextDecoder(encoding);
        }
        return this._decoder.decode(data, { stream: !isEnd });
      };
      SAXStream.prototype.write = function(data) {
        if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
          data = this._decodeBuffer(data, false);
        } else if (this._decoderBuffer) {
          var remaining = this._decodeBuffer(Buffer.alloc(0), true);
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
        }
        this._parser.write(data.toString());
        this.emit("data", data);
        return true;
      };
      SAXStream.prototype.end = function(chunk) {
        if (chunk && chunk.length) {
          this.write(chunk);
        }
        if (this._decoderBuffer) {
          var finalChunk = this._decodeBuffer(Buffer.alloc(0), true);
          if (finalChunk) {
            this._parser.write(finalChunk);
            this.emit("data", finalChunk);
          }
        } else if (this._decoder) {
          var remaining = this._decoder.decode();
          if (remaining) {
            this._parser.write(remaining);
            this.emit("data", remaining);
          }
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
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      };
      sax.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
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
      function getDeclaredEncoding(body) {
        var match = body && body.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
        return match ? match[2] : null;
      }
      function normalizeEncodingName(encoding) {
        if (!encoding) {
          return null;
        }
        return encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
      }
      function encodingsMatch(detectedEncoding, declaredEncoding) {
        const detected = normalizeEncodingName(detectedEncoding);
        const declared = normalizeEncodingName(declaredEncoding);
        if (!detected || !declared) {
          return true;
        }
        if (declared === "utf16") {
          return detected === "utf16le" || detected === "utf16be";
        }
        return detected === declared;
      }
      function validateXmlDeclarationEncoding(parser, data) {
        if (!parser.strict || !parser.encoding || !data || data.name !== "xml") {
          return;
        }
        var declaredEncoding = getDeclaredEncoding(data.body);
        if (declaredEncoding && !encodingsMatch(parser.encoding, declaredEncoding)) {
          strictFail(
            parser,
            "XML declaration encoding " + declaredEncoding + " does not match detected stream encoding " + parser.encoding.toUpperCase()
          );
        }
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
        if (parser.sawRoot && !parser.closedRoot)
          strictFail(parser, "Unclosed root tag");
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
            strictFail(
              parser,
              "Unbound namespace prefix: " + JSON.stringify(parser.tagName)
            );
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
              strictFail(
                parser,
                "Unbound namespace prefix: " + JSON.stringify(prefix)
              );
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
        if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111) {
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
              var starti = i - 1;
              while (c && c !== "]") {
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
              parser.cdata += chunk.substring(starti, i - 1);
              if (c === "]") {
                parser.state = S.CDATA_ENDING;
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
                const procInstEndData = {
                  name: parser.procInstName,
                  body: parser.procInstBody
                };
                validateXmlDeclarationEncoding(parser, procInstEndData);
                emitNode(parser, "onprocessinginstruction", procInstEndData);
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
                strictFail(
                  parser,
                  "Forward-slash in opening tag not followed by >"
                );
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
                parser.script += "</" + parser.tagName + c;
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
                  if ((parser.entityCount += 1) > parser.opt.maxEntityCount) {
                    error(
                      parser,
                      "Parsed entity count exceeds max entity count"
                    );
                  }
                  if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) {
                    error(
                      parser,
                      "Parsed entity depth exceeds max entity depth"
                    );
                  }
                  parser.entity = "";
                  parser.state = returnState;
                  parser.write(parsedEntity);
                  parser.entityDepth -= 1;
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
        ;
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

// node_modules/tsdav/node_modules/base-64/base64.js
var require_base64 = __commonJS({
  "node_modules/tsdav/node_modules/base-64/base64.js"(exports, module) {
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

// plugins/calendar/lib/crypto.ts
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

// plugins/calendar/lib/store.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, renameSync, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join2 } from "node:path";

// plugins/calendar/lib/types.ts
var STORE_VERSION = 1;
var EMPTY_STORE = {
  version: STORE_VERSION,
  accounts: [],
  calendars: [],
  events: [],
  syncLog: []
};

// plugins/calendar/lib/store.ts
function resolveAppDataDir2() {
  const raw = process.env.SELFDASHBOARD_DATA_DIR?.trim();
  if (raw) return raw;
  return join2(process.cwd(), "data");
}
var DEFAULT_ROOT = process.env.CALENDAR_DATA_DIR || join2(resolveAppDataDir2(), "calendar");
var dataDirCache = null;
function ensureDataDir() {
  if (!existsSync2(DEFAULT_ROOT)) mkdirSync(DEFAULT_ROOT, { recursive: true });
  dataDirCache = DEFAULT_ROOT;
}
var storePath = () => join2(DEFAULT_ROOT, "store.json");
var chain = Promise.resolve();
function withLock(fn) {
  const next = chain.then(fn);
  chain = next.catch(() => void 0);
  return next;
}
function readSyncOrEmpty() {
  const path = storePath();
  if (!existsSync2(path)) return structuredClone(EMPTY_STORE);
  try {
    const raw = readFileSync2(path, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version ?? STORE_VERSION,
      accounts: parsed.accounts ?? [],
      calendars: parsed.calendars ?? [],
      events: parsed.events ?? [],
      syncLog: parsed.syncLog ?? []
    };
  } catch (e) {
    try {
      renameSync(path, path + ".corrupt-" + Date.now());
    } catch {
    }
    return structuredClone(EMPTY_STORE);
  }
}
function writeSync(store) {
  ensureDataDir();
  const path = storePath();
  const tmp = path + ".tmp";
  writeFileSync2(tmp, JSON.stringify(store, null, 2), "utf8");
  renameSync(tmp, path);
}
function readStore() {
  return withLock(() => {
    return structuredClone(readSyncOrEmpty());
  });
}
function mutateStore(fn) {
  return withLock(async () => {
    const store = readSyncOrEmpty();
    const result = await fn(store);
    writeSync(store);
    return result;
  });
}
function newId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rand}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}

// plugins/calendar/lib/api-helpers.ts
function toAccountView(a, calendars) {
  const cfg = a.config;
  let endpoint = "";
  try {
    endpoint = new URL(cfg.url).host;
  } catch {
    endpoint = cfg.url;
  }
  return {
    id: a.id,
    name: a.name,
    provider: a.provider,
    enabled: a.enabled,
    createdAt: a.createdAt,
    lastSyncAt: a.lastSyncAt,
    lastSyncStatus: a.lastSyncStatus,
    lastSyncError: a.lastSyncError,
    calendarCount: calendars.filter((c) => c.accountId === a.id).length,
    endpoint,
    url: cfg.url,
    username: cfg.username
  };
}
function buildAccount(body) {
  if (body.provider === "caldav") {
    if (!body.caldav) throw new Error("caldav config required");
    return {
      id: newId("acc"),
      name: body.name,
      provider: "caldav",
      enabled: true,
      createdAt: nowIso(),
      config: {
        url: body.caldav.url,
        username: body.caldav.username,
        passwordEncrypted: encrypt(body.caldav.password),
        verifySsl: body.caldav.verifySsl
      }
    };
  }
  if (body.provider === "ics") {
    if (!body.ics) throw new Error("ics config required");
    return {
      id: newId("acc"),
      name: body.name,
      provider: "ics",
      enabled: true,
      createdAt: nowIso(),
      config: {
        url: body.ics.url,
        username: body.ics.username,
        passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : ""
      }
    };
  }
  throw new Error(`unknown provider: ${body.provider}`);
}
function applyAccountUpdate(a, body) {
  if (body.name !== void 0) a.name = body.name;
  if (body.enabled !== void 0) a.enabled = body.enabled;
  if (a.provider === "caldav" && body.caldav) {
    const cfg = a.config;
    a.config = {
      url: body.caldav.url ?? cfg.url,
      username: body.caldav.username ?? cfg.username,
      passwordEncrypted: body.caldav.password ? encrypt(body.caldav.password) : cfg.passwordEncrypted,
      verifySsl: body.caldav.verifySsl ?? cfg.verifySsl
    };
  }
  if (a.provider === "ics" && body.ics) {
    const cfg = a.config;
    a.config = {
      url: body.ics.url ?? cfg.url,
      username: body.ics.username ?? cfg.username,
      passwordEncrypted: body.ics.password ? encrypt(body.ics.password) : cfg.passwordEncrypted ?? ""
    };
  }
}
function eventEndMs(e) {
  if (e.dtend) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtend)) return (/* @__PURE__ */ new Date(e.dtend + "T23:59:59")).getTime();
    return new Date(e.dtend).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(e.dtstart)) return (/* @__PURE__ */ new Date(e.dtstart + "T23:59:59")).getTime();
  return new Date(e.dtstart).getTime();
}
function localDateKey(iso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? /* @__PURE__ */ new Date(iso + "T12:00:00") : new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function syncPriority(e) {
  if (e.syncState === "local_new" || e.syncState === "local_modified") return 0;
  if (e.syncState === "conflict") return 1;
  return 2;
}
function buildSummary(expanded, pending, conflicts) {
  const now = /* @__PURE__ */ new Date();
  const nowMs = now.getTime();
  const todayKey = localDateKey(now.toISOString());
  const stillRelevant = expanded.filter((e) => eventEndMs(e) >= nowMs);
  const sorted = [...stillRelevant].sort((a, b) => {
    const pd = syncPriority(a) - syncPriority(b);
    if (pd !== 0) return pd;
    return a.dtstart.localeCompare(b.dtstart);
  });
  const seenMasters = /* @__PURE__ */ new Set();
  const upcomingDeduped = [];
  for (const e of sorted) {
    if (seenMasters.has(e.id)) continue;
    seenMasters.add(e.id);
    upcomingDeduped.push(e);
    if (upcomingDeduped.length >= 20) break;
  }
  const todayIds = /* @__PURE__ */ new Set();
  for (const e of expanded) {
    if (localDateKey(e.dtstart) === todayKey) todayIds.add(e.id);
  }
  return {
    now: now.toISOString(),
    todayCount: todayIds.size,
    upcoming: upcomingDeduped.slice(0, 15).map((e) => ({
      id: e.id,
      calendarId: e.calendarId,
      summary: e.summary || "(ohne Titel)",
      dtstart: e.dtstart,
      dtend: e.dtend,
      allDay: e.allDay,
      syncState: e.syncState,
      calendarColor: e.calendarColor,
      calendarName: e.calendarName,
      location: e.location,
      description: e.description,
      instanceStart: e.isRecurrenceInstance ? e.dtstart : void 0
    })),
    pendingChanges: pending,
    conflicts
  };
}
function notFound(message = "not found") {
  return Response.json({ error: message }, { status: 404 });
}
function badRequest(message) {
  return Response.json({ error: message }, { status: 400 });
}
function ok(data) {
  return Response.json(data);
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
    let self2 = this;
    let lastDay = this.last.day;
    function initMonth() {
      daysInMonth = Time.daysInMonth(
        self2.last.month,
        self2.last.year
      );
      byMonthDay = self2.normalizeByMonthDayRules(
        self2.last.year,
        self2.last.month,
        self2.by_data.BYMONTHDAY
      );
      dateLen = byMonthDay.length;
      while (byMonthDay[dateIdx] <= lastDay && !(isInit && byMonthDay[dateIdx] == lastDay) && dateIdx < dateLen - 1) {
        dateIdx++;
      }
    }
    function nextMonth() {
      lastDay = 0;
      self2.increment_month();
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

// plugins/calendar/lib/ical.ts
var import_rrule = __toESM(require_rrule());
import { randomUUID } from "node:crypto";
function newUid() {
  return `${randomUUID()}@selfdashboard`;
}
function normalizeEventTimes(body) {
  if (!body.allDay) return { dtstart: body.dtstart, dtend: body.dtend };
  const day = (s) => s.length >= 10 ? s.slice(0, 10) : s;
  return {
    dtstart: day(body.dtstart),
    dtend: body.dtend ? day(body.dtend) : void 0
  };
}
function isAllDayString(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function asDate(s) {
  if (isAllDayString(s)) return /* @__PURE__ */ new Date(s + "T00:00:00Z");
  return new Date(s);
}
function buildVcalendar(input) {
  const cal = new ICALmodule.Component(["vcalendar", [], []]);
  cal.updatePropertyWithValue("prodid", "-//SelfDashboard//Calendar Plugin//EN");
  cal.updatePropertyWithValue("version", "2.0");
  cal.updatePropertyWithValue("calscale", "GREGORIAN");
  const ev = new ICALmodule.Component("vevent");
  ev.updatePropertyWithValue("uid", input.uid);
  ev.updatePropertyWithValue("dtstamp", ICALmodule.Time.now());
  if (input.summary) ev.updatePropertyWithValue("summary", input.summary);
  if (input.description) ev.updatePropertyWithValue("description", input.description);
  if (input.location) ev.updatePropertyWithValue("location", input.location);
  if (input.allDay) {
    const d = asDate(input.dtstart);
    const startTime = ICALmodule.Time.fromDateString(d.toISOString().slice(0, 10));
    startTime.isDate = true;
    ev.updatePropertyWithValue("dtstart", startTime);
    const endStr = input.dtend ? asDate(input.dtend).toISOString().slice(0, 10) : new Date(d.getTime() + 864e5).toISOString().slice(0, 10);
    const endTime = ICALmodule.Time.fromDateString(endStr);
    endTime.isDate = true;
    ev.updatePropertyWithValue("dtend", endTime);
  } else {
    const startTime = ICALmodule.Time.fromJSDate(asDate(input.dtstart), true);
    ev.updatePropertyWithValue("dtstart", startTime);
    if (input.dtend) {
      const endTime = ICALmodule.Time.fromJSDate(asDate(input.dtend), true);
      ev.updatePropertyWithValue("dtend", endTime);
    }
  }
  if (input.rrule) {
    const recur = ICALmodule.Recur.fromString(input.rrule);
    ev.updatePropertyWithValue("rrule", recur);
  }
  if (input.lastModifiedIso) {
    ev.updatePropertyWithValue("last-modified", ICALmodule.Time.fromJSDate(new Date(input.lastModifiedIso), true));
  }
  cal.addSubcomponent(ev);
  return cal.toString();
}
function parseVcalendar(blob) {
  const out = [];
  let jcal;
  try {
    jcal = ICALmodule.parse(blob);
  } catch {
    return out;
  }
  const comp = new ICALmodule.Component(jcal);
  const events = comp.getAllSubcomponents("vevent");
  for (const ev of events) {
    if (ev.getFirstPropertyValue("recurrence-id")) continue;
    const dtstart = ev.getFirstProperty("dtstart");
    if (!dtstart) continue;
    const dtstartVal = dtstart.getFirstValue();
    const dtend = ev.getFirstProperty("dtend");
    const dtendVal = dtend?.getFirstValue();
    const allDay = dtstartVal.isDate;
    const rrule = ev.getFirstProperty("rrule");
    let rruleStr;
    if (rrule) {
      const v = rrule.getFirstValue();
      rruleStr = typeof v === "string" ? v : v.toString();
    }
    const lastMod = ev.getFirstPropertyValue("last-modified") ?? ev.getFirstPropertyValue("dtstamp");
    out.push({
      uid: String(ev.getFirstPropertyValue("uid") ?? newUid()),
      summary: ev.getFirstPropertyValue("summary")?.toString() ?? void 0,
      description: ev.getFirstPropertyValue("description")?.toString() ?? void 0,
      location: ev.getFirstPropertyValue("location")?.toString() ?? void 0,
      dtstart: allDay ? dtstartVal.toString().slice(0, 10) : dtstartVal.toJSDate().toISOString(),
      dtend: dtendVal ? allDay ? dtendVal.toString().slice(0, 10) : dtendVal.toJSDate().toISOString() : void 0,
      allDay,
      rrule: rruleStr,
      remoteModifiedIso: lastMod ? lastMod.toJSDate().toISOString() : void 0
    });
  }
  return out;
}
function expandRecurrences(events, rangeStart, rangeEnd, calendarLookup) {
  const out = [];
  for (const ev of events) {
    const meta = calendarLookup(ev.calendarId);
    const base = {
      ...ev,
      calendarName: meta.name,
      calendarColor: meta.color,
      isRecurrenceInstance: false
    };
    if (!ev.rrule) {
      const start = asDate(ev.dtstart);
      if (start >= rangeStart && start < rangeEnd) out.push(base);
      continue;
    }
    try {
      const dtstart = asDate(ev.dtstart);
      const rule = (0, import_rrule.rrulestr)(`DTSTART:${dtstart.toISOString().replace(/[-:]|\.\d{3}/g, "")}
RRULE:${ev.rrule}`);
      const instances = rule.between(rangeStart, rangeEnd, true);
      let durationMs = 0;
      if (ev.dtend) durationMs = asDate(ev.dtend).getTime() - dtstart.getTime();
      for (const inst of instances) {
        const instEnd = durationMs > 0 ? new Date(inst.getTime() + durationMs) : void 0;
        out.push({
          ...base,
          dtstart: ev.allDay ? inst.toISOString().slice(0, 10) : inst.toISOString(),
          dtend: instEnd ? ev.allDay ? instEnd.toISOString().slice(0, 10) : instEnd.toISOString() : void 0,
          isRecurrenceInstance: true,
          recurrenceId: inst.toISOString()
        });
      }
    } catch {
      const start = asDate(ev.dtstart);
      if (start >= rangeStart && start < rangeEnd) out.push(base);
    }
  }
  return out;
}

// plugins/calendar/lib/log.ts
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

// plugins/calendar/lib/caldav-privileges.ts
function heuristicCalendarReadOnly(name, url) {
  const n = name.toLowerCase().trim();
  const u = url.toLowerCase();
  const blob = `${n} ${u}`;
  if (/geburt|birth|feiertag|holiday|kontakt|contact|abonnement|subscription/.test(blob)) {
    return true;
  }
  if ((u.includes("web.de") || u.includes("begenda")) && (n === "web" || n === "web.de")) {
    return true;
  }
  return false;
}
async function caldavHasWritePrivilege(client2, calendarUrl) {
  try {
    const responses = await client2.propfind({
      url: calendarUrl,
      props: {
        "current-user-privilege-set": {
          privilege: {}
        }
      },
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
function formatCalDavPushError(calendarName, uid, msg) {
  if (msg.includes("403")) {
    return `Kalender \u201E${calendarName}\u201C: kein Schreibzugriff (HTTP 403). Bei WEB.DE \u201EMein Kalender\u201C w\xE4hlen, nicht \u201Eweb\u201C oder \u201EGeburtstage\u201C.`;
  }
  return `${calendarName}: ${msg}`;
}

// plugins/calendar/lib/caldav-url.ts
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
    return u.href;
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}

// plugins/calendar/lib/caldav.ts
var emptyResult = () => ({ added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] });
function mergeResult(a, b) {
  return {
    added: a.added + b.added,
    updated: a.updated + b.updated,
    deleted: a.deleted + b.deleted,
    conflicts: a.conflicts + b.conflicts,
    errors: [...a.errors, ...b.errors]
  };
}
function decryptAccountPassword(encrypted) {
  try {
    return decrypt(encrypted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unable to authenticate|unsupported state/i.test(msg)) {
      throw new Error(
        "Gespeichertes Passwort kann nicht entschl\xFCsselt werden \u2014 Konto bearbeiten und Passwort erneut speichern (nach Container-Neuaufbau oder ge\xE4ndertem SELFDASHBOARD_CALENDAR_KEY / fehlendem Volume f\xFCr /app/data)."
      );
    }
    throw e;
  }
}
async function buildClient(account2) {
  const cfg = account2.config;
  const password = decryptAccountPassword(cfg.passwordEncrypted);
  const serverUrl = normalizeCaldavServerUrl(cfg.url);
  return createDAVClient({
    serverUrl,
    credentials: { username: cfg.username, password },
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
async function discoverCaldavCalendars(account2) {
  const client2 = await buildClient(account2);
  const calendars = await client2.fetchCalendars();
  const out = [];
  for (const c of calendars) {
    const name = caldavDisplayName(c);
    const readOnly = await resolveCalendarReadOnly(client2, name, c.url);
    out.push({
      remoteId: c.url,
      name,
      color: c.calendarColor ?? void 0,
      readOnly
    });
  }
  return out;
}
async function getCaldavClientCache(account2) {
  const client2 = await buildClient(account2);
  const davCalendars = await client2.fetchCalendars();
  return { client: client2, davCalendars };
}
async function syncCaldavCalendar(account2, calendar2, store, cache) {
  const client2 = cache?.client ?? await buildClient(account2);
  const davCalendars = cache?.davCalendars ?? await client2.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === calendar2.remoteId);
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar2.remoteId}`] };
  }
  const pull = await pullCaldav(client2, davCal, calendar2, store);
  if (calendar2.readOnly) return pull;
  const pendingDeletes = await pushPendingRemoteDeletes(client2, calendar2, store);
  const push = await pushCaldav(client2, davCal, calendar2, store);
  return mergeResult(mergeResult(pull, pendingDeletes), push);
}
async function syncCaldavCalendarPushOnly(account2, calendar2, store, cache) {
  if (calendar2.readOnly) return emptyResult();
  const client2 = cache?.client ?? await buildClient(account2);
  const davCalendars = cache?.davCalendars ?? await client2.fetchCalendars();
  const davCal = davCalendars.find((c) => c.url === calendar2.remoteId);
  if (!davCal) {
    return { ...emptyResult(), errors: [`remote calendar not found: ${calendar2.remoteId}`] };
  }
  const pendingDeletes = await pushPendingRemoteDeletes(client2, calendar2, store);
  const push = await pushCaldav(client2, davCal, calendar2, store);
  return mergeResult(pendingDeletes, push);
}
async function pullCaldav(client2, davCal, calendar2, store) {
  const result = emptyResult();
  let objects;
  try {
    const fetched = await client2.fetchCalendarObjects({ calendar: davCal });
    objects = fetched.map((o) => ({ url: o.url, etag: o.etag ?? "", data: o.data ?? "" }));
  } catch (e) {
    result.errors.push(`fetch objects: ${e?.message ?? e}`);
    return result;
  }
  const seenUids = /* @__PURE__ */ new Set();
  for (const obj of objects) {
    const parsed = parseVcalendar(obj.data);
    if (!parsed.length) continue;
    const remote = parsed[0];
    seenUids.add(remote.uid);
    const localIdx = store.events.findIndex(
      (e) => e.calendarId === calendar2.id && e.uid === remote.uid
    );
    if (localIdx === -1) {
      store.events.push({
        id: `evt_${remote.uid}`,
        calendarId: calendar2.id,
        uid: remote.uid,
        remoteHref: obj.url,
        remoteEtag: obj.etag,
        icalData: obj.data,
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
        localModifiedAt: nowIso(),
        remoteModifiedAt: remote.remoteModifiedIso,
        syncState: "synced"
      });
      result.added++;
      continue;
    }
    const local = store.events[localIdx];
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
        summary: remote.summary,
        description: remote.description,
        location: remote.location,
        dtstart: remote.dtstart,
        dtend: remote.dtend,
        allDay: remote.allDay,
        rrule: remote.rrule,
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
async function pushPendingRemoteDeletes(client2, calendar2, store) {
  const result = emptyResult();
  for (const ev of store.events) {
    const pd = ev.pendingRemoteDelete;
    if (!pd || pd.calendarId !== calendar2.id) continue;
    try {
      await client2.deleteCalendarObject({
        calendarObject: { url: pd.remoteHref, etag: pd.remoteEtag, data: "" }
      });
      delete ev.pendingRemoteDelete;
      result.deleted++;
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes("404")) {
        delete ev.pendingRemoteDelete;
        result.deleted++;
      } else {
        result.errors.push(formatCalDavPushError(calendar2.name, ev.uid, `move delete: ${msg}`));
      }
    }
  }
  return result;
}
async function pushCaldav(client2, davCal, calendar2, store) {
  const result = emptyResult();
  const pending = store.events.filter(
    (e) => e.calendarId === calendar2.id && (e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted")
  );
  for (const ev of pending) {
    try {
      if (ev.syncState === "local_new") {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt
        });
        const filename = caldavObjectFilename(ev.uid);
        const objectUrl = joinCollectionUrl(davCal.url, filename);
        const res = await client2.createCalendarObject({
          calendar: davCal,
          iCalString: ical,
          filename
        });
        const httpRes = res;
        if (httpRes && typeof httpRes.ok === "boolean" && !httpRes.ok) {
          const body = await httpRes.text().catch(() => "");
          throw new Error(`HTTP ${httpRes.status} ${httpRes.statusText}${body ? `: ${body.slice(0, 120)}` : ""}`);
        }
        const loc = httpRes?.headers?.get?.("location");
        ev.icalData = ical;
        ev.remoteHref = loc ? new URL(loc, davCal.url).href : objectUrl;
        ev.remoteEtag = httpRes?.headers?.get?.("etag")?.replace(/^"|"$/g, "") ?? "";
        ev.syncState = "synced";
        result.added++;
      } else if (ev.syncState === "local_modified") {
        const ical = buildVcalendar({
          uid: ev.uid,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          dtstart: ev.dtstart,
          dtend: ev.dtend,
          allDay: ev.allDay,
          rrule: ev.rrule,
          lastModifiedIso: ev.localModifiedAt
        });
        const res = await client2.updateCalendarObject({
          calendarObject: { url: ev.remoteHref, etag: ev.remoteEtag, data: ical }
        });
        ev.icalData = ical;
        ev.remoteEtag = res.etag ?? ev.remoteEtag;
        ev.syncState = "synced";
        result.updated++;
      } else if (ev.syncState === "local_deleted") {
        if (!ev.remoteHref) {
          store.events.splice(store.events.indexOf(ev), 1);
          result.deleted++;
          continue;
        }
        try {
          await client2.deleteCalendarObject({
            calendarObject: { url: ev.remoteHref, etag: ev.remoteEtag, data: "" }
          });
        } catch (e) {
          if (!String(e?.message ?? "").includes("404")) throw e;
        }
        store.events.splice(store.events.indexOf(ev), 1);
        result.deleted++;
      }
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes("412") || msg.includes("Precondition")) {
        ev.syncState = "conflict";
        result.conflicts++;
      } else {
        if (msg.includes("403")) {
          const calRow = store.calendars.find((c) => c.id === calendar2.id);
          if (calRow) calRow.readOnly = true;
        }
        result.errors.push(formatCalDavPushError(calendar2.name, ev.uid, msg));
      }
    }
  }
  return result;
}
async function testCaldav(account2) {
  try {
    const cals = await discoverCaldavCalendars(account2);
    return { ok: true, calendars: cals };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// plugins/calendar/lib/ics.ts
function normaliseUrl(url) {
  if (url.startsWith("webcal://")) return "https://" + url.slice("webcal://".length);
  if (url.startsWith("webcals://")) return "https://" + url.slice("webcals://".length);
  return url;
}
async function discoverIcsCalendars(account2) {
  const cfg = account2.config;
  const url = normaliseUrl(cfg.url);
  return [{
    remoteId: url,
    name: account2.name,
    readOnly: true
  }];
}
async function syncIcsCalendar(account2, calendar2, store) {
  const cfg = account2.config;
  const url = normaliseUrl(cfg.url);
  const headers = { "User-Agent": "SelfDashboard-Calendar/1.0" };
  if (calendar2.etagGlobal) headers["If-None-Match"] = calendar2.etagGlobal;
  if (cfg.username && cfg.passwordEncrypted) {
    const pw = decrypt(cfg.passwordEncrypted);
    headers["Authorization"] = "Basic " + Buffer.from(`${cfg.username}:${pw}`).toString("base64");
  }
  let resp;
  try {
    resp = await fetch(url, { headers, redirect: "follow" });
  } catch (e) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`fetch: ${e?.message ?? e}`] };
  }
  if (resp.status === 304) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] };
  }
  if (!resp.ok) {
    return { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [`HTTP ${resp.status}`] };
  }
  const body = await resp.text();
  const parsed = parseVcalendar(body);
  const existingByUid = new Map(
    store.events.filter((e) => e.calendarId === calendar2.id).map((e) => [e.uid, e])
  );
  let added = 0;
  let updated = 0;
  const seenUids = /* @__PURE__ */ new Set();
  for (const pe of parsed) {
    seenUids.add(pe.uid);
    const sliced = buildSingleVeventBlob(body, pe.uid);
    const existing = existingByUid.get(pe.uid);
    if (!existing) {
      store.events.push({
        id: `evt_${pe.uid}`,
        calendarId: calendar2.id,
        uid: pe.uid,
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: "synced"
      });
      added++;
    } else if (existing.icalData !== sliced) {
      Object.assign(existing, {
        icalData: sliced,
        summary: pe.summary,
        description: pe.description,
        location: pe.location,
        dtstart: pe.dtstart,
        dtend: pe.dtend,
        allDay: pe.allDay,
        rrule: pe.rrule,
        localModifiedAt: nowIso(),
        syncState: "synced"
      });
      updated++;
    }
  }
  let deleted = 0;
  for (let i = store.events.length - 1; i >= 0; i--) {
    const e = store.events[i];
    if (e.calendarId !== calendar2.id) continue;
    if (!seenUids.has(e.uid)) {
      store.events.splice(i, 1);
      deleted++;
    }
  }
  const newEtag = resp.headers.get("etag") ?? resp.headers.get("ETag");
  if (newEtag) calendar2.etagGlobal = newEtag;
  return { added, updated, deleted, conflicts: 0, errors: [] };
}
function buildSingleVeventBlob(feed, uid) {
  const lines = feed.split(/\r?\n/);
  const result = [];
  let inEvent = false;
  let buf = [];
  let matched = false;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      buf = [line];
      matched = false;
      continue;
    }
    if (inEvent) {
      buf.push(line);
      if (/^UID:/i.test(line) && line.slice(4).trim() === uid) matched = true;
      if (line === "END:VEVENT") {
        if (matched) result.push(buf.join("\r\n"));
        inEvent = false;
        buf = [];
      }
    }
  }
  return [
    "BEGIN:VCALENDAR",
    "PRODID:-//SelfDashboard//ICS Slice//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    ...result,
    "END:VCALENDAR"
  ].join("\r\n");
}
async function testIcs(account2) {
  try {
    const cfg = account2.config;
    const url = normaliseUrl(cfg.url);
    const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!resp.ok && resp.status !== 405) {
      const get = await fetch(url, { redirect: "follow" });
      if (!get.ok) return { ok: false, error: `HTTP ${get.status}` };
    }
    return { ok: true, calendars: await discoverIcsCalendars(account2) };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

// plugins/calendar/lib/sync.ts
var DEFAULT_INTERVAL_MS = parseInt(
  process.env.CALENDAR_SYNC_INTERVAL_SECONDS ?? "300",
  10
) * 1e3;
async function discoverAccountCalendars(account2) {
  if (account2.provider === "caldav") return discoverCaldavCalendars(account2);
  if (account2.provider === "ics") return discoverIcsCalendars(account2);
  throw new Error(`unknown provider: ${account2.provider}`);
}
async function testAccount(account2) {
  if (account2.provider === "caldav") return testCaldav(account2);
  if (account2.provider === "ics") return testIcs(account2);
  return { ok: false, error: `unknown provider: ${account2.provider}` };
}
async function syncAfterMutation(accountId, opts) {
  const log = await runSync(accountId, {
    calendarIds: opts?.calendarIds,
    skipDiscover: true,
    pushOnly: true
  });
  return log.error ?? void 0;
}
async function runSync(accountId, opts) {
  const store = await readStore();
  const account2 = store.accounts.find((a) => a.id === accountId);
  if (!account2 || !account2.enabled) {
    return makeLogEntry(accountId, "disabled or not found", { added: 0, updated: 0, deleted: 0, conflicts: 0 });
  }
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;
  let totalConflicts = 0;
  const errors = [];
  if (!opts?.skipDiscover) {
    try {
      const discovered = await discoverAccountCalendars(account2);
      const discoveredIds = new Set(discovered.map((d) => d.remoteId));
      await mutateStore((s) => {
        for (const d of discovered) {
          let cal = s.calendars.find((c) => c.accountId === account2.id && c.remoteId === d.remoteId);
          if (!cal) {
            cal = {
              id: newId("cal"),
              accountId: account2.id,
              remoteId: d.remoteId,
              name: d.name,
              color: d.color ?? randomColor(d.name),
              readOnly: d.readOnly,
              visible: true
            };
            s.calendars.push(cal);
          } else {
            cal.name = d.name;
            cal.readOnly = d.readOnly;
            if (d.color) cal.color = d.color;
          }
        }
        const stale = s.calendars.filter((c) => c.accountId === account2.id && !discoveredIds.has(c.remoteId));
        if (stale.length) {
          const staleIds = new Set(stale.map((c) => c.id));
          s.calendars = s.calendars.filter((c) => !staleIds.has(c.id));
          s.events = s.events.filter((e) => !staleIds.has(e.calendarId));
        }
      });
    } catch (e) {
      errors.push(`discover: ${e?.message ?? e}`);
      const errText = errors.join("; ");
      void logPluginApiFailure("calendar", "discover", errText, { accountId, provider: account2.provider });
      const log2 = makeLogEntry(accountId, errText, { added: 0, updated: 0, deleted: 0, conflicts: 0 });
      await mutateStore((s) => {
        s.syncLog.unshift(log2);
        s.syncLog = s.syncLog.slice(0, 50);
        const acc = s.accounts.find((a) => a.id === accountId);
        if (acc) {
          acc.lastSyncAt = nowIso();
          acc.lastSyncStatus = "error";
          acc.lastSyncError = errors.join("; ");
        }
      });
      return log2;
    }
  }
  let calendars = (await readStore()).calendars.filter((c) => c.accountId === account2.id);
  if (opts?.calendarIds?.length) {
    const want = new Set(opts.calendarIds);
    calendars = calendars.filter((c) => want.has(c.id));
  }
  let caldavCache;
  if (account2.provider === "caldav" && calendars.length > 0) {
    try {
      caldavCache = await getCaldavClientCache(account2);
    } catch (e) {
      errors.push(`caldav client: ${e?.message ?? e}`);
    }
  }
  for (const calendar2 of calendars) {
    try {
      await mutateStore(async (s) => {
        const live = s.calendars.find((c) => c.id === calendar2.id);
        const acc = s.accounts.find((a) => a.id === accountId);
        const r = account2.provider === "caldav" ? opts?.pushOnly ? await syncCaldavCalendarPushOnly(acc, live, s, caldavCache) : await syncCaldavCalendar(acc, live, s, caldavCache) : opts?.pushOnly ? { added: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] } : await syncIcsCalendar(acc, live, s);
        totalAdded += r.added;
        totalUpdated += r.updated;
        totalDeleted += r.deleted;
        totalConflicts += r.conflicts;
        errors.push(...r.errors);
      });
    } catch (e) {
      errors.push(`cal ${calendar2.name}: ${e?.message ?? e}`);
    }
  }
  const status = errors.length ? "error" : totalConflicts ? "conflict" : "ok";
  const log = makeLogEntry(
    accountId,
    errors.length ? errors.join("; ") : void 0,
    { added: totalAdded, updated: totalUpdated, deleted: totalDeleted, conflicts: totalConflicts }
  );
  await mutateStore((s) => {
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
    void logPluginApiFailure("calendar", "sync", errors.join("; "), {
      accountId,
      provider: account2.provider,
      added: totalAdded,
      updated: totalUpdated
    });
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
function randomColor(seed) {
  let h = 0;
  for (const ch of seed) h = h * 31 + ch.charCodeAt(0) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

// plugins/calendar/server.ts
async function handleSummaryGet() {
  const store = await readStore();
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now.getTime() + 7 * 864e5);
  const visibleCalendarIds = new Set(store.calendars.filter((c) => c.visible).map((c) => c.id));
  const calendarLookup = (id) => {
    const c = store.calendars.find((x) => x.id === id);
    return { name: c?.name, color: c?.color };
  };
  const candidates = store.events.filter(
    (e) => visibleCalendarIds.has(e.calendarId) && e.syncState !== "local_deleted"
  );
  const expanded = expandRecurrences(candidates, now, end, calendarLookup);
  const pending = store.events.filter(
    (e) => e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted"
  ).length;
  const conflicts = store.events.filter((e) => e.syncState === "conflict").length;
  return ok(buildSummary(expanded, pending, conflicts));
}
async function handleStatusGet() {
  const store = await readStore();
  const pending = store.events.filter(
    (e) => e.syncState === "local_new" || e.syncState === "local_modified" || e.syncState === "local_deleted"
  ).length;
  const conflicts = store.events.filter((e) => e.syncState === "conflict").length;
  return ok({
    accounts: store.accounts.map((a) => toAccountView(a, store.calendars)),
    recentRuns: store.syncLog.slice(0, 20),
    pendingChanges: pending,
    conflicts
  });
}
async function handleAccountsGet() {
  const store = await readStore();
  return ok(store.accounts.map((a) => toAccountView(a, store.calendars)));
}
async function handleAccountsPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.name || !body?.provider) return badRequest("name and provider required");
  let newIdVal;
  try {
    const account2 = buildAccount(body);
    newIdVal = account2.id;
    await mutateStore((s) => {
      s.accounts.push(account2);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return badRequest(msg);
  }
  runSync(newIdVal).catch(() => void 0);
  const store = await readStore();
  const created = store.accounts.find((a) => a.id === newIdVal);
  return ok(toAccountView(created, store.calendars));
}
async function handleAccountPut(req, id) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let found = false;
  await mutateStore((s) => {
    const a = s.accounts.find((x) => x.id === id);
    if (!a) return;
    found = true;
    applyAccountUpdate(a, body);
  });
  if (!found) return notFound("account not found");
  const store = await readStore();
  const updated = store.accounts.find((a) => a.id === id);
  return ok(toAccountView(updated, store.calendars));
}
async function handleAccountDelete(id) {
  let found = false;
  await mutateStore((s) => {
    const idx = s.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return;
    found = true;
    s.accounts.splice(idx, 1);
    const calIds = new Set(s.calendars.filter((c) => c.accountId === id).map((c) => c.id));
    s.calendars = s.calendars.filter((c) => !calIds.has(c.id));
    s.events = s.events.filter((e) => !calIds.has(e.calendarId));
  });
  if (!found) return notFound("account not found");
  return ok({ ok: true });
}
async function handleAccountSyncPost(id) {
  const store = await readStore();
  const account2 = store.accounts.find((a) => a.id === id);
  if (!account2) return notFound("account not found");
  if (!account2.enabled) return badRequest("account is disabled");
  const log = await runSync(id);
  return ok(log);
}
async function handleAccountTestPost(id) {
  const store = await readStore();
  const account2 = store.accounts.find((a) => a.id === id);
  if (!account2) return notFound("account not found");
  const result = await testAccount(account2);
  return ok(result);
}
async function handleCalendarsGet() {
  const store = await readStore();
  return ok(store.calendars);
}
async function handleCalendarPut(req, id) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let updated = null;
  await mutateStore((s) => {
    const c = s.calendars.find((x) => x.id === id);
    if (!c) return;
    if (body.color !== void 0) c.color = body.color;
    if (body.visible !== void 0) c.visible = body.visible;
    if (body.name !== void 0) c.name = body.name;
    updated = c;
  });
  if (!updated) return notFound("calendar not found");
  return ok(updated);
}
async function handleEventsGet(req) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const calendarId = url.searchParams.get("calendarId") ?? void 0;
  if (!start || !end) return badRequest("start and end query params required");
  let startDate;
  let endDate;
  try {
    startDate = new Date(start);
    endDate = new Date(end);
    if (isNaN(+startDate) || isNaN(+endDate)) throw new Error("bad date");
  } catch {
    return badRequest("start and end must be valid ISO datetimes");
  }
  const store = await readStore();
  const visibleCalendarIds = new Set(
    store.calendars.filter((c) => c.visible && (!calendarId || c.id === calendarId)).map((c) => c.id)
  );
  const calendarLookup = (calId) => {
    const c = store.calendars.find((x) => x.id === calId);
    return { name: c?.name, color: c?.color };
  };
  const candidates = store.events.filter(
    (e) => visibleCalendarIds.has(e.calendarId) && e.syncState !== "local_deleted"
  );
  const expanded = expandRecurrences(candidates, startDate, endDate, calendarLookup);
  return ok(expanded);
}
async function handleEventsPost(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (!body?.calendarId || !body?.dtstart) return badRequest("calendarId and dtstart required");
  const store = await readStore();
  const cal = store.calendars.find((c) => c.id === body.calendarId);
  if (!cal) return badRequest("calendar not found");
  if (cal.readOnly) return badRequest("calendar is read-only");
  const times = normalizeEventTimes({
    dtstart: body.dtstart,
    dtend: body.dtend,
    allDay: body.allDay
  });
  const uid = newUid();
  const evId = newId("evt");
  const ical = buildVcalendar({
    uid,
    summary: body.summary ?? "",
    description: body.description,
    location: body.location,
    dtstart: times.dtstart,
    dtend: times.dtend,
    allDay: body.allDay ?? false,
    rrule: body.rrule,
    lastModifiedIso: nowIso()
  });
  await mutateStore((s) => {
    s.events.push({
      id: evId,
      calendarId: body.calendarId,
      uid,
      icalData: ical,
      summary: body.summary ?? "",
      description: body.description ?? "",
      location: body.location ?? "",
      dtstart: times.dtstart,
      dtend: times.dtend,
      allDay: body.allDay ?? false,
      rrule: body.rrule,
      localModifiedAt: nowIso(),
      syncState: "local_new"
    });
  });
  const syncError = await syncAfterMutation(cal.accountId, { calendarIds: [body.calendarId] });
  const after = await readStore();
  const ev = after.events.find((e) => e.id === evId);
  if (!ev) return badRequest("event not created");
  const payload = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== "synced" && !syncError
  };
  return ok(payload);
}
async function handleEventPut(req, id) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  let calendarAccountId = null;
  let calendarIdsToSync = [];
  let failReason = null;
  await mutateStore((s) => {
    const ev2 = s.events.find((e) => e.id === id);
    if (!ev2) {
      failReason = "not_found";
      return;
    }
    const cal = s.calendars.find((c) => c.id === ev2.calendarId);
    if (!cal || cal.readOnly) {
      failReason = "read_only";
      return;
    }
    calendarAccountId = cal.accountId;
    const oldCalendarId = ev2.calendarId;
    if (body.calendarId !== void 0 && body.calendarId !== ev2.calendarId) {
      const newCal = s.calendars.find((c) => c.id === body.calendarId);
      if (!newCal) {
        failReason = "bad_calendar";
        return;
      }
      if (newCal.readOnly) {
        failReason = "bad_calendar";
        return;
      }
      if (ev2.remoteHref && ev2.syncState !== "local_new") {
        ev2.pendingRemoteDelete = {
          calendarId: oldCalendarId,
          remoteHref: ev2.remoteHref,
          remoteEtag: ev2.remoteEtag ?? ""
        };
      }
      ev2.calendarId = body.calendarId;
      ev2.remoteHref = void 0;
      ev2.remoteEtag = void 0;
      ev2.syncState = "local_new";
      calendarIdsToSync = [oldCalendarId, body.calendarId];
    } else {
      calendarIdsToSync = [ev2.calendarId];
    }
    if (body.summary !== void 0) ev2.summary = body.summary;
    if (body.description !== void 0) ev2.description = body.description;
    if (body.location !== void 0) ev2.location = body.location;
    const times = normalizeEventTimes({
      dtstart: body.dtstart ?? ev2.dtstart,
      dtend: body.dtend ?? ev2.dtend,
      allDay: body.allDay ?? ev2.allDay
    });
    if (body.dtstart !== void 0) ev2.dtstart = times.dtstart;
    if (body.dtend !== void 0) ev2.dtend = times.dtend;
    if (body.allDay !== void 0) ev2.allDay = body.allDay;
    if (body.rrule !== void 0) ev2.rrule = body.rrule;
    ev2.localModifiedAt = nowIso();
    ev2.icalData = buildVcalendar({
      uid: ev2.uid,
      summary: ev2.summary,
      description: ev2.description,
      location: ev2.location,
      dtstart: ev2.dtstart,
      dtend: ev2.dtend,
      allDay: ev2.allDay,
      rrule: ev2.rrule,
      lastModifiedIso: ev2.localModifiedAt
    });
    if (ev2.syncState === "synced") ev2.syncState = "local_modified";
  });
  if (failReason === "not_found") return notFound("event not found");
  if (failReason === "read_only") return notFound("event not found or its calendar is read-only");
  if (failReason === "bad_calendar") return badRequest("target calendar not found or read-only");
  const syncError = calendarAccountId ? await syncAfterMutation(calendarAccountId, { calendarIds: calendarIdsToSync }) : void 0;
  const after = await readStore();
  const ev = after.events.find((e) => e.id === id);
  if (!ev) return notFound("event not found");
  const payload = {
    ...ev,
    syncError,
    syncPending: ev.syncState !== "synced" && !syncError
  };
  return ok(payload);
}
async function handleEventDelete(id) {
  let triggerAccountId = null;
  let calendarIdToSync = null;
  let found = false;
  await mutateStore((s) => {
    const idx = s.events.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const ev = s.events[idx];
    const cal = s.calendars.find((c) => c.id === ev.calendarId);
    if (!cal || cal.readOnly) return;
    found = true;
    triggerAccountId = cal.accountId;
    calendarIdToSync = ev.calendarId;
    if (ev.syncState === "local_new") {
      s.events.splice(idx, 1);
    } else {
      ev.syncState = "local_deleted";
      ev.localModifiedAt = nowIso();
    }
  });
  if (!found) return notFound("event not found or its calendar is read-only");
  const syncError = triggerAccountId ? await syncAfterMutation(triggerAccountId, {
    calendarIds: calendarIdToSync ? [calendarIdToSync] : void 0
  }) : void 0;
  return ok({ ok: true, syncError });
}
async function handleConflictsGet() {
  const store = await readStore();
  const conflicts = store.events.filter((e) => e.syncState === "conflict").map((e) => {
    const cal = store.calendars.find((c) => c.id === e.calendarId);
    return { ...e, calendarName: cal?.name, calendarColor: cal?.color };
  });
  return ok(conflicts);
}
async function handleConflictResolvePost(req, id) {
  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON");
  }
  if (body.side !== "local" && body.side !== "remote") return badRequest("side must be 'local' or 'remote'");
  let found = false;
  let triggerAccountId = null;
  let resolution = null;
  await mutateStore((s) => {
    const idx = s.events.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const ev = s.events[idx];
    if (ev.syncState !== "conflict") return;
    found = true;
    const cal = s.calendars.find((c) => c.id === ev.calendarId);
    triggerAccountId = cal?.accountId ?? null;
    if (body.side === "remote") {
      if (!ev.conflictRemoteIcal) {
        s.events.splice(idx, 1);
        resolution = "deleted_locally";
        return;
      }
      const parsed = parseVcalendar(ev.conflictRemoteIcal)[0];
      if (!parsed) return;
      Object.assign(ev, {
        icalData: ev.conflictRemoteIcal,
        summary: parsed.summary,
        description: parsed.description,
        location: parsed.location,
        dtstart: parsed.dtstart,
        dtend: parsed.dtend,
        allDay: parsed.allDay,
        rrule: parsed.rrule,
        syncState: "synced",
        conflictRemoteIcal: void 0,
        localModifiedAt: nowIso()
      });
      resolution = "remote_kept";
    } else {
      ev.syncState = "local_modified";
      ev.conflictRemoteIcal = void 0;
      ev.localModifiedAt = nowIso();
      resolution = "local_will_overwrite";
    }
  });
  if (!found) return notFound("no conflict on this event");
  if (resolution === "local_will_overwrite" && triggerAccountId) {
    runSync(triggerAccountId).catch(() => void 0);
  }
  return ok({ ok: true, resolution });
}
async function calendarServerHandler(ctx) {
  const method = ctx.request.method.toUpperCase();
  const path = ctx.path;
  const [a, b, c] = path;
  if (a === "summary" && method === "GET" && path.length === 1) return handleSummaryGet();
  if (a === "status" && method === "GET" && path.length === 1) return handleStatusGet();
  if (a === "accounts" && path.length === 1) {
    if (method === "GET") return handleAccountsGet();
    if (method === "POST") return handleAccountsPost(ctx.request);
  }
  if (a === "accounts" && b && path.length === 2) {
    if (method === "PUT") return handleAccountPut(ctx.request, b);
    if (method === "DELETE") return handleAccountDelete(b);
  }
  if (a === "accounts" && b && c === "sync" && path.length === 3 && method === "POST") {
    return handleAccountSyncPost(b);
  }
  if (a === "accounts" && b && c === "test" && path.length === 3 && method === "POST") {
    return handleAccountTestPost(b);
  }
  if (a === "calendars" && path.length === 1 && method === "GET") return handleCalendarsGet();
  if (a === "calendars" && b && path.length === 2 && method === "PUT") return handleCalendarPut(ctx.request, b);
  if (a === "events" && path.length === 1) {
    if (method === "GET") return handleEventsGet(ctx.request);
    if (method === "POST") return handleEventsPost(ctx.request);
  }
  if (a === "events" && b && path.length === 2) {
    if (method === "PUT") return handleEventPut(ctx.request, b);
    if (method === "DELETE") return handleEventDelete(b);
  }
  if (a === "conflicts" && path.length === 1 && method === "GET") return handleConflictsGet();
  if (a === "conflicts" && b && path.length === 2 && method === "POST") {
    return handleConflictResolvePost(ctx.request, b);
  }
  return Response.json(
    { error: "not_found", pluginId: ctx.pluginId, path: path.join("/") },
    { status: 404 }
  );
}
var server_default = calendarServerHandler;
export {
  calendarServerHandler,
  server_default as default
};
/*! Bundled license information:

sax/lib/sax.js:
  (*! http://mths.be/fromcodepoint v0.1.0 by @mathias *)

base-64/base64.js:
  (*! https://mths.be/base64 v1.0.0 by @mathias | MIT license *)
*/
