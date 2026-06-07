// plugins-pack/_shared/log.ts
async function logPluginApiFailure(pluginId, operation, message, detail) {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 500)}` : "";
  console.error(`[SelfDashboard][${pluginId}] ${operation}: ${message}${extra}`);
}

// plugins-pack/weather/server.ts
var GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
var FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
var AIR_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";
var FETCH_TIMEOUT_MS = 12e3;
var FETCH_RETRIES = 1;
var RESOLVE_BUDGET_MS = 28e3;
var CACHE_TTL_MS = 8 * 60 * 1e3;
var CACHE_MAX = 64;
var cache = /* @__PURE__ */ new Map();
function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expires) {
    cache.delete(key);
    return null;
  }
  return e.data;
}
function cacheSet(key, data) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}
async function fetchOpenMeteo(url) {
  let lastErr;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { cache: "no-store", signal: ac.signal });
      if (res.ok || res.status < 500 || attempt === FETCH_RETRIES) return res;
      lastErr = new Error(`open_meteo_http_${res.status}`);
    } catch (e) {
      lastErr = e;
      if (attempt === FETCH_RETRIES) throw e;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("open_meteo_fetch_failed");
}
async function openMeteoGeocode(params) {
  const cc = params.countryCode?.trim().toUpperCase() ?? "";
  const cacheKey = `geo:${params.name.trim().toLowerCase()}:${cc}:${params.language}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const q = new URLSearchParams({
    name: params.name.trim(),
    count: "8",
    language: params.language,
    format: "json"
  });
  if (cc.length === 2) q.set("countryCode", cc);
  const res = await fetchOpenMeteo(`${GEOCODE_BASE}?${q}`);
  if (!res.ok) throw new Error(`geocode_http_${res.status}`);
  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}
async function openMeteoForecast(params) {
  const cacheKey = `fc:${params.latitude.toFixed(4)}:${params.longitude.toFixed(4)}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}:${params.includeAir ? 1 : 0}:hc3`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const q = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    timezone: "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index"
  });
  if (params.includeHourly) q.set("hourly", "temperature_2m,weather_code,is_day,precipitation_probability,precipitation");
  if (params.includeHourly || params.includeDaily) {
    q.set(
      "daily",
      params.includeDaily ? "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max" : "sunrise,sunset"
    );
  }
  const days = params.includeDaily ? 8 : params.includeHourly ? 2 : 1;
  q.set("forecast_days", String(days));
  const data = await (async () => {
    if (params.includeAir) {
      const aq = new URLSearchParams({
        latitude: String(params.latitude),
        longitude: String(params.longitude),
        current: "european_aqi,pm2_5",
        timezone: "auto"
      });
      const [fRes, aRes] = await Promise.all([
        fetchOpenMeteo(`${FORECAST_BASE}?${q}`),
        fetchOpenMeteo(`${AIR_BASE}?${aq}`).catch(() => null)
      ]);
      if (!fRes.ok) throw new Error(`forecast_http_${fRes.status}`);
      const d = await fRes.json();
      if (aRes && aRes.ok) {
        try {
          const aj = await aRes.json();
          if (aj && aj.current) d.air_quality = aj.current;
        } catch {
        }
      }
      return d;
    }
    const res = await fetchOpenMeteo(`${FORECAST_BASE}?${q}`);
    if (!res.ok) throw new Error(`forecast_http_${res.status}`);
    return res.json();
  })();
  cacheSet(cacheKey, data);
  return data;
}
function resolveBudgetAbort() {
  const ac = new AbortController();
  setTimeout(() => ac.abort(), RESOLVE_BUDGET_MS);
  return ac.signal;
}
async function openMeteoResolve(params) {
  const cc = params.countryCode?.trim().toUpperCase() ?? "";
  const cacheKey = `resolve:${params.name.trim().toLowerCase()}:${cc}:${params.language}:${params.includeHourly ? 1 : 0}:${params.includeDaily ? 1 : 0}:${params.includeAir ? 1 : 0}`;
  const cached = cacheGet(cacheKey);
  if (cached?.place && cached.forecast) return cached;
  const budget = resolveBudgetAbort();
  const work = (async () => {
    const geo = await openMeteoGeocode({
      name: params.name,
      countryCode: params.countryCode,
      language: params.language
    });
    const place = geo.results?.[0];
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      throw new Error("geocode_empty");
    }
    const forecast = await openMeteoForecast({
      latitude: place.latitude,
      longitude: place.longitude,
      includeHourly: params.includeHourly,
      includeDaily: params.includeDaily,
      includeAir: params.includeAir
    });
    return { place, forecast };
  })();
  try {
    const raced = typeof AbortSignal !== "undefined" && "any" in AbortSignal ? await Promise.race([
      work,
      new Promise((_, reject) => {
        budget.addEventListener(
          "abort",
          () => reject(Object.assign(new Error("resolve_budget"), { name: "AbortError" })),
          { once: true }
        );
      })
    ]) : await work;
    cacheSet(cacheKey, raced);
    return raced;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw Object.assign(new Error("timeout"), { name: "AbortError" });
    }
    throw e;
  }
}
function readIncludeFlags(sp) {
  const includeHourly = sp.get("includeHourly") === "1" || sp.get("includeHourly") === "true" || sp.has("hourly");
  const dailyParam = sp.get("daily");
  const includeDaily = sp.get("includeDaily") === "1" || sp.get("includeDaily") === "true" || dailyParam === "1" || dailyParam === "true" || sp.has("forecast_days") || Boolean(dailyParam?.includes("weather_code"));
  const includeAir = sp.get("includeAir") === "1" || sp.get("includeAir") === "true";
  return { includeHourly, includeDaily, includeAir };
}
function resolveAction(req, path) {
  const segment = path[0]?.trim();
  if (segment === "geocode" || segment === "forecast" || segment === "resolve") return segment;
  const url = new URL(req.url);
  const legacy = url.searchParams.get("action")?.trim();
  if (legacy === "geocode" || legacy === "forecast" || legacy === "resolve") return legacy;
  return "";
}
async function handleWeatherPluginRequest(req, path) {
  if (req.method !== "GET") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }
  const action = resolveAction(req, path);
  const sp = new URL(req.url).searchParams;
  try {
    if (action === "geocode") {
      const name = sp.get("name")?.trim();
      if (!name) return Response.json({ error: "missing_name" }, { status: 400 });
      const language = sp.get("language")?.trim() || "de";
      const countryCode = sp.get("countryCode")?.trim() || void 0;
      const data = await openMeteoGeocode({ name, countryCode, language });
      return Response.json(data);
    }
    if (action === "forecast") {
      const lat = Number(sp.get("latitude"));
      const lon = Number(sp.get("longitude"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return Response.json({ error: "invalid_coordinates" }, { status: 400 });
      }
      const { includeHourly, includeDaily, includeAir } = readIncludeFlags(sp);
      const data = await openMeteoForecast({ latitude: lat, longitude: lon, includeHourly, includeDaily, includeAir });
      return Response.json(data);
    }
    if (action === "resolve") {
      const name = sp.get("name")?.trim();
      if (!name) return Response.json({ error: "missing_name" }, { status: 400 });
      const language = sp.get("language")?.trim() || "de";
      const countryCode = sp.get("countryCode")?.trim() || void 0;
      const { includeHourly, includeDaily, includeAir } = readIncludeFlags(sp);
      const data = await openMeteoResolve({ name, countryCode, language, includeHourly, includeDaily, includeAir });
      return Response.json(data);
    }
    return Response.json({ error: "invalid_action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "open_meteo_error";
    const isAbort = e instanceof Error && e.name === "AbortError";
    void logPluginApiFailure("weather", action || "weather", isAbort ? "timeout" : msg);
    return Response.json(
      {
        error: isAbort ? "timeout" : msg,
        hint: "Server must reach geocoding-api.open-meteo.com and api.open-meteo.com (HTTPS outbound)."
      },
      { status: 502 }
    );
  }
}
function weatherServerHandler(ctx) {
  return handleWeatherPluginRequest(ctx.request, ctx.path);
}
var server_default = weatherServerHandler;
export {
  server_default as default,
  handleWeatherPluginRequest,
  weatherServerHandler
};
